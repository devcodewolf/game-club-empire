/**
 * Partido semanal (Fase 2, Bloque E; docs/prompts/FASE2-ESPECIFICACION.md §4.6).
 *
 * Cada domingo de la temporada a las 17:00 empieza un partido, alternando
 * casa y fuera, contra un rival inventado. Al empezar se cobra la taquilla, el
 * bar y el aparcamiento (en casa) o se paga el desplazamiento (fuera), y se
 * decide el resultado con el PRNG de la partida:
 *
 *  - Fuerza del club = base + instalaciones (máx. 30) y, en casa, + estado del
 *    campo / 10 + factor campo + banquillos.
 *  - Instalaciones = calidad del vestuario local × 1,5 + superficie del campo
 *    principal + gimnasio y fisio completos.
 *  - Goles: una Poisson por equipo con λ = 1,3 × (fuerza / fuerza rival)^1,5.
 *
 * A las 19:00 termina: se aplican la fama, la afición y la satisfacción, y el
 * partido pasa al historial (la interfaz enseña entonces el resultado).
 */
import { pitchSurface, type BuildingTypeId, type PlacedBuilding } from '../buildings/buildings'
import { pitchCapacity, standsOf } from '../buildings/stands'
import type { SimContent } from '../content'
import type { TileRect } from '../geometry'
import { buildingFootprint, type MapState } from '../map/map'
import { evaluateRoom } from '../rooms/rooms'
import type { RoomTypeId } from '../rooms/roomTypes'
import { fromDate, toDate } from '../time/calendar'
import { randomFloat, randomInt } from '../time/rng'
import { record, type LedgerEntry } from '../economy/ledger'
import { completeBar, divisionPrices } from '../economy/recurring'
import { staffCoverage } from '../economy/staff'
import { pitchCondition } from '../economy/upkeep'
import { clubChangingRooms } from './changingRooms'
import { addFame, fansAfterMatch, matchSatisfaction, type Outcome } from './fans'

/** Datos del partido, la fama y la afición (ver `src/content/match.ts`). */
export interface MatchContent {
  /** Primer domingo de partido de la temporada del año de inicio. */
  readonly firstMatch: { readonly month: number; readonly day: number }
  /** Meses sin partidos (verano). */
  readonly offSeasonMonths: readonly number[]
  /** Rivales inventados. */
  readonly rivals: readonly string[]
  readonly changingRoom: {
    /** Tipo de sala que hace de vestuario. */
    readonly roomType: RoomTypeId
    /** Objeto que hace de vestuario precario (la caseta vieja). */
    readonly shed: BuildingTypeId
    /** Calidad 0-10 = calidad media de los objetos × esta escala. */
    readonly qualityScale: number
  }
  readonly strength: {
    readonly base: number
    /** Factor campo. */
    readonly home: number
    /** En casa: estado del campo / este divisor. */
    readonly pitchDivisor: number
    readonly facilitiesMax: number
    /** Calidad del vestuario local × este factor. */
    readonly changingRoomFactor: number
    /** Por superficie del campo principal. */
    readonly surface: Readonly<Record<string, number>>
    /** Por tipo de sala completa (gimnasio, fisio). */
    readonly rooms: Readonly<Record<RoomTypeId, number>>
    readonly rival: { readonly base: number; readonly spread: number }
  }
  readonly goals: { readonly base: number; readonly exponent: number; readonly max: number }
  readonly attendance: {
    /** Parte de los socios que va al campo. */
    readonly memberShare: number
    /** Parte del resto de la afición que iría con satisfacción 100. */
    readonly publicShare: number
    /** Multiplicador del público si llueve. */
    readonly rainFactor: number
    /** Gente de pie junto a la valla (aforo sin gradas). */
    readonly standing: number
  }
  readonly matchday: {
    readonly barPerSpectator: number
    readonly parking: {
      readonly spaces: number
      readonly fee: number
      /** Espectadores por coche. */
      readonly perCar: number
      readonly rect: TileRect
    }
    /** Furgoneta alquilada para jugar fuera. */
    readonly travelCost: number
    /** Jugar en casa sin vestuario visitante. */
    readonly noVisitorRoom: { readonly fine: number; readonly fame: number }
  }
  readonly fame: {
    readonly start: number
    readonly result: Readonly<Record<Outcome, number>>
    readonly firstRoom: number
    /** Lo que baja cada lunes si está por encima de la base de la división. */
    readonly drift: number
    readonly divisionBase: Readonly<Record<string, number>>
  }
  readonly fans: {
    readonly start: number
    /** Cambio por resultado, en tanto por uno. */
    readonly result: Readonly<Record<Outcome, number>>
    readonly ceilingBase: number
    readonly ceilingPerFame: number
    readonly satisfactionPivot: number
    readonly satisfactionDivisor: number
  }
  readonly satisfaction: {
    readonly start: number
    readonly base: number
    readonly cleaning: number
    readonly bar: number
    readonly parking: number
    readonly coveredStand: number
    /** Nivel de grada (índice) a partir del cual está cubierta. */
    readonly coveredStandTier: number
    readonly crowdOut: number
    readonly rainUncovered: number
    readonly goodVisitorQuality: number
    readonly goodVisitorRoom: number
  }
  readonly members: { readonly targetShare: number; readonly rate: number }
  /** Banquillos de madera junto al campo principal. */
  readonly benches: { readonly cost: number; readonly strength: number }
}

/** De dónde sale la fuerza del club en un partido. */
export interface StrengthBreakdown {
  readonly base: number
  readonly changingRoom: number
  readonly surface: number
  readonly rooms: number
  /** Suma de las tres anteriores, limitada al máximo. */
  readonly facilities: number
  /** Solo en casa. */
  readonly pitch: number
  readonly home: number
  readonly benches: number
  readonly total: number
}

export interface Attendance {
  readonly members: number
  readonly public: number
  /** Los que entraron (limitado por el aforo). */
  readonly total: number
  readonly capacity: number
  /** Los que se quedaron fuera por falta de sitio. */
  readonly leftOut: number
}

/** Dinero del día de partido, por concepto (en positivo los ingresos). */
export interface MatchMoney {
  readonly tickets: number
  readonly bar: number
  readonly parking: number
  readonly travel: number
  readonly fine: number
}

export interface MatchResult {
  /** Jornada (1, 2, 3…). */
  readonly number: number
  /** Inicio del partido (minutos de juego). */
  readonly at: number
  readonly home: boolean
  readonly opponent: string
  readonly goalsFor: number
  readonly goalsAgainst: number
  readonly outcome: Outcome
  readonly strength: StrengthBreakdown
  readonly rivalStrength: number
  readonly attendance: Attendance | null
  readonly money: MatchMoney
  /** Satisfacción de la afición (solo en casa). */
  readonly satisfaction: number | null
  readonly raining: boolean
  readonly noVisitorRoom: boolean
  readonly fameChange: number
  readonly fansChange: number
}

/** Campo principal del club (o null si no hay). */
export function mainPitch(state: MapState, content: SimContent): PlacedBuilding | null {
  for (const building of Object.values(state.buildings)) {
    if (building.role === 'main' && content.buildings[building.type]?.pitch) return building
  }
  return null
}

/** ¿Hay partido este domingo? (temporada empezada y fuera del verano) */
export function isMatchDay(state: MapState, content: SimContent): boolean {
  const date = toDate(state.clock.time)
  if (date.weekday !== 6) return false
  if (content.match.offSeasonMonths.includes(date.month)) return false
  const first = fromDate({ year: content.time.start.year, ...content.match.firstMatch, hour: 0 })
  return state.clock.time >= first
}

/** ¿Hay alguna sala completa de este tipo? */
function hasCompleteRoom(state: MapState, content: SimContent, type: RoomTypeId): boolean {
  return Object.values(state.rooms).some(
    (room) => room.type === type && evaluateRoom(state, content, room.id)?.ok,
  )
}

/** Fuerza del club para un partido en casa o fuera. */
export function teamStrength(
  state: MapState,
  content: SimContent,
  home: boolean,
): StrengthBreakdown {
  const rules = content.match.strength
  const main = mainPitch(state, content)
  const mainDef = main && content.buildings[main.type]
  const surfaceId = main && mainDef ? pitchSurface(mainDef, main.tier) : undefined

  const changingRoom = clubChangingRooms(state, content).home.quality * rules.changingRoomFactor
  const surface = surfaceId ? (rules.surface[surfaceId] ?? 0) : 0
  let rooms = 0
  for (const [type, bonus] of Object.entries(rules.rooms)) {
    if (hasCompleteRoom(state, content, type)) rooms += bonus
  }
  const facilities = Math.min(rules.facilitiesMax, changingRoom + surface + rooms)
  const atHome = home && main !== null && mainDef !== undefined && mainDef !== null
  const pitch = atHome ? pitchCondition(content, mainDef, main) / rules.pitchDivisor : 0
  const benches = atHome && main.benches ? content.match.benches.strength : 0
  const homeBonus = atHome ? rules.home : 0
  const total = rules.base + facilities + pitch + homeBonus + benches
  return {
    base: rules.base,
    changingRoom,
    surface,
    rooms,
    facilities,
    pitch,
    home: homeBonus,
    benches,
    total: Math.round(total * 10) / 10,
  }
}

/** Goles esperados de un equipo frente a otro. */
export function expectedGoals(content: SimContent, own: number, rival: number): number {
  const { base, exponent } = content.match.goals
  return base * Math.pow(own / rival, exponent)
}

/** Muestra de una Poisson de media λ con el PRNG de la partida (Knuth), con tope. */
export function samplePoisson(state: MapState, lambda: number, max: number): number {
  const limit = Math.exp(-lambda)
  let k = 0
  let p = randomFloat(state)
  while (p > limit && k < max) {
    k++
    p *= randomFloat(state)
  }
  return k
}

/** Rival de la jornada: uno de la lista, sin repetir el de la anterior. */
function pickRival(state: MapState, content: SimContent): string {
  const rivals = content.match.rivals
  if (rivals.length === 0) return ''
  let index = randomInt(state, 0, rivals.length - 1)
  const last = state.club.matches.at(-1)?.opponent
  if (rivals[index] === last && rivals.length > 1) index = (index + 1) % rivals.length
  return rivals[index] ?? ''
}

/** Público de un partido en casa. */
export function homeAttendance(state: MapState, content: SimContent): Attendance {
  const rules = content.match.attendance
  const club = state.club
  const main = mainPitch(state, content)
  const capacity = rules.standing + (main ? pitchCapacity(state, content, main.id) : 0)
  const rain = state.clock.weather === 'rain' ? rules.rainFactor : 1
  const members = Math.round(club.members * rules.memberShare)
  const audience = Math.round(
    Math.max(0, club.fans - club.members) * rules.publicShare * (club.satisfaction / 100) * rain,
  )
  const total = Math.min(capacity, members + audience)
  return {
    members,
    public: audience,
    total,
    capacity,
    leftOut: members + audience - total,
  }
}

/** ¿Tiene el campo principal alguna grada cubierta? */
function hasCoveredStand(state: MapState, content: SimContent, pitch: PlacedBuilding): boolean {
  const tier = content.match.satisfaction.coveredStandTier
  return standsOf(state, pitch.id).some((stand) => stand.tier >= tier)
}

export interface KickoffOutcome {
  readonly match: MatchResult
  readonly entries: readonly LedgerEntry[]
  /** ¿Cambió el estado del campo (desgaste del partido)? */
  readonly pitchesChanged: boolean
}

/**
 * Domingo 17:00: empieza el partido de la jornada (si toca). Cobra y paga lo
 * del día, desgasta el campo y decide el resultado; la fama y la afición se
 * aplican al terminar (`finishMatch`).
 */
export function startMatch(state: MapState, content: SimContent): KickoffOutcome | null {
  if (!isMatchDay(state, content) || state.club.currentMatch) return null
  const rules = content.match
  const number = state.club.matches.length + 1
  const main = mainPitch(state, content)
  const mainDef = main && content.buildings[main.type]
  // Sin campo principal, el partido "en casa" se juega fuera
  const home = number % 2 === 1 && main !== null && Boolean(mainDef)
  const opponent = pickRival(state, content)
  const rivalStrength =
    rules.strength.rival.base +
    randomInt(state, -rules.strength.rival.spread, rules.strength.rival.spread)
  const strength = teamStrength(state, content, home)
  const goalsFor = samplePoisson(
    state,
    expectedGoals(content, strength.total, rivalStrength),
    rules.goals.max,
  )
  const goalsAgainst = samplePoisson(
    state,
    expectedGoals(content, rivalStrength, strength.total),
    rules.goals.max,
  )
  const outcome: Outcome =
    goalsFor > goalsAgainst ? 'win' : goalsFor < goalsAgainst ? 'loss' : 'draw'
  const raining = state.clock.weather === 'rain'

  const entries: LedgerEntry[] = []
  const add = (entry: LedgerEntry | null): void => {
    if (entry) entries.push(entry)
  }
  let attendance: Attendance | null = null
  let satisfaction: number | null = null
  let noVisitorRoom = false
  let pitchesChanged = false
  const money = { tickets: 0, bar: 0, parking: 0, travel: 0, fine: 0 }
  let fameChange = rules.fame.result[outcome]

  if (home && main && mainDef) {
    const pitchRect = buildingFootprint(main, mainDef)
    attendance = homeAttendance(state, content)
    money.tickets =
      Math.max(0, attendance.total - attendance.members) * divisionPrices(state, content).entry
    add(record(state, 'tickets', money.tickets, pitchRect))
    const bar = completeBar(state, content)
    if (bar) {
      money.bar = attendance.total * rules.matchday.barPerSpectator
      add(record(state, 'bar', money.bar, bar))
    }
    const parking = rules.matchday.parking
    money.parking =
      Math.min(parking.spaces, Math.ceil(attendance.total / parking.perCar)) * parking.fee
    add(record(state, 'parking', money.parking, parking.rect))

    const away = clubChangingRooms(state, content).away
    if (away.kind === 'none') {
      noVisitorRoom = true
      money.fine = rules.matchday.noVisitorRoom.fine
      add(record(state, 'fines', -money.fine))
      fameChange += rules.matchday.noVisitorRoom.fame
    }
    satisfaction = matchSatisfaction(content, {
      cleaning: staffCoverage(state, content, 'cleaner').coverage,
      bar: bar !== null,
      parking: parking.spaces > 0,
      coveredStand: hasCoveredStand(state, content, main),
      crowdOut: attendance.leftOut > 0,
      raining,
      visitorQuality: away.quality,
    })
    // El partido desgasta el césped
    const before = pitchCondition(content, mainDef, main)
    state.buildings[main.id] = {
      ...main,
      condition: Math.max(0, before - content.economy.pitch.matchDamage),
    }
    pitchesChanged = true
  } else {
    money.travel = rules.matchday.travelCost
    add(record(state, 'travel', -money.travel))
  }

  const fansAfter = fansAfterMatch(content, state.club.fans, state.club.fame, outcome, satisfaction)
  const match: MatchResult = {
    number,
    at: state.clock.time,
    home,
    opponent,
    goalsFor,
    goalsAgainst,
    outcome,
    strength,
    rivalStrength,
    attendance,
    money,
    satisfaction,
    raining,
    noVisitorRoom,
    fameChange: Math.round(fameChange * 10) / 10,
    fansChange: fansAfter - state.club.fans,
  }
  state.club.currentMatch = match
  return { match, entries, pitchesChanged }
}

/** Domingo 19:00: termina el partido en juego. Aplica fama, afición y satisfacción. */
export function finishMatch(state: MapState): MatchResult | null {
  const match = state.club.currentMatch
  if (!match) return null
  const club = state.club
  addFame(state, match.fameChange)
  club.fans = Math.max(0, club.fans + match.fansChange)
  if (match.satisfaction !== null) club.satisfaction = match.satisfaction
  club.matches.push(match)
  club.currentMatch = null
  return match
}
