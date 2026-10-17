/** Tests del partido semanal, los vestuarios local y visitante, la fama y la afición. */
import { describe, expect, it } from 'vitest'
import type { Command, GameEvent } from '../../commands'
import type { SimContent } from '../../content'
import type { BuildingCatalog } from '../../buildings/buildings'
import { createGame, type Game } from '../../game'
import type { TileRect } from '../../geometry'
import type { MapState } from '../../map/map'
import { fromDate } from '../../time/calendar'
import type { TimeContent } from '../../time/clock'
import { TEST_CATALOG, TEST_CONTENT, TEST_MAP_CONFIG, TEST_TIME } from '../../__tests__/fixtures'
import { clubChangingRooms } from '../changingRooms'
import {
  addFame,
  awardFirstRooms,
  fansAfterMatch,
  fansCeiling,
  matchSatisfaction,
  weeklyClubUpdate,
} from '../fans'
import {
  expectedGoals,
  homeAttendance,
  isMatchDay,
  samplePoisson,
  teamStrength,
  type MatchResult,
} from '../match'

/** Catálogo de prueba con una caseta (vestuario precario de calidad 1/2). */
const CATALOG: BuildingCatalog = {
  ...TEST_CATALOG,
  shed: {
    id: 'shed',
    name: 'Caseta',
    size: { width: 2, height: 1 },
    cost: 60,
    markerColor: 0x8a6a48,
    icon: 'H',
    tiers: [
      { name: 'Caseta vieja', cost: 60, quality: 1 },
      { name: 'Caseta reformada', cost: 150, quality: 2 },
    ],
  },
}

/** Calendario con el lunes de cuentas y el partido del domingo (17:00-19:00). */
const TIME: TimeContent = {
  ...TEST_TIME,
  events: [
    ...TEST_TIME.events,
    { id: 'matchKickoff', rule: { every: 'week', weekday: 6, hour: 17 }, stops: true },
    { id: 'matchFinal', rule: { every: 'week', weekday: 6, hour: 19 }, stops: true },
  ],
}

const CONTENT: SimContent = { ...TEST_CONTENT, buildings: CATALOG, time: TIME }

const START = fromDate(TIME.start) // lunes 23 de agosto, 09:00
const FIRST_KICKOFF = fromDate({ year: 1, month: 9, day: 5, hour: 17 })
const HOUR = 60
const WEEK = 7 * 24 * HOUR

const rect = (x: number, y: number, width: number, height: number): TileRect => ({
  x,
  y,
  width,
  height,
})
const place = (type: string, x: number, y: number): Command => ({
  type: 'placeBuilding',
  buildingType: type,
  origin: { x, y },
  rotation: 0,
})

/** Sala 'kit' completa (cimientos, puerta, objeto y designación) con su esquina en (x, y). */
const kitRoom = (x: number, y: number, objects: readonly Command[] = []): Command[] => [
  { type: 'buildFoundation', rect: rect(x, y, 5, 4), wall: 'brick', floor: 'dirt' },
  { type: 'placeDoor', tile: { x: x + 2, y }, door: 'door' },
  place('small', x + 1, y + 1),
  ...objects,
  { type: 'designateRoom', tile: { x: x + 1, y: y + 1 }, roomType: 'kit' },
]

/** Campo principal de tierra (4×3) en (12, 14). */
const PITCH = place('field', 12, 14)

function newGame(scenario: readonly Command[] = [], seed = 1): Game {
  return createGame(TEST_MAP_CONFIG, CONTENT, { money: 100_000, scenario, seed })
}

const mutable = (game: Game): MapState => game.state as MapState

function collect(game: Game): GameEvent[] {
  const events: GameEvent[] = []
  game.subscribe((event) => events.push(event))
  return events
}

const played = (events: GameEvent[]): MatchResult[] =>
  events.flatMap((e) => (e.type === 'matchPlayed' ? [e.match] : []))

describe('vestuarios local y visitante', () => {
  it('sin vestuarios ni caseta, no hay ni local ni visitante', () => {
    const rooms = clubChangingRooms(newGame().state, CONTENT)
    expect(rooms.home.kind).toBe('none')
    expect(rooms.away.kind).toBe('none')
  })

  it('un vestuario completo hace de local con calidad media × 2,5', () => {
    const game = newGame(kitRoom(0, 0))
    const rooms = clubChangingRooms(game.state, CONTENT)
    expect(rooms.home).toMatchObject({ kind: 'room', quality: 2.5 })
    expect(rooms.away.kind).toBe('none')
  })

  it('con dos vestuarios sin uso elegido, el segundo mejor hace de visitante', () => {
    const game = newGame([...kitRoom(0, 0), ...kitRoom(6, 0)])
    const [first, second] = Object.keys(game.state.rooms).map(Number)
    const rooms = clubChangingRooms(game.state, CONTENT)
    expect(rooms.home).toMatchObject({ kind: 'room', roomId: first })
    expect(rooms.away).toMatchObject({ kind: 'room', roomId: second })
  })

  it('marcar el primero como visitante deja de local al otro', () => {
    const game = newGame([...kitRoom(0, 0), ...kitRoom(6, 0)])
    const [first, second] = Object.keys(game.state.rooms).map(Number)
    const result = game.dispatch({ type: 'setRoomUse', roomId: first!, use: 'away' })
    expect(result.ok).toBe(true)
    const rooms = clubChangingRooms(game.state, CONTENT)
    expect(rooms.home).toMatchObject({ roomId: second })
    expect(rooms.away).toMatchObject({ roomId: first })
  })

  it('la caseta cubre el hueco que falte: local sin vestuarios, visitante con uno', () => {
    const alone = newGame([place('shed', 14, 0)])
    expect(clubChangingRooms(alone.state, CONTENT).home).toMatchObject({ kind: 'shed', quality: 1 })

    const withRoom = newGame([...kitRoom(0, 0), place('shed', 14, 0)])
    const rooms = clubChangingRooms(withRoom.state, CONTENT)
    expect(rooms.home.kind).toBe('room')
    expect(rooms.away).toMatchObject({ kind: 'shed', quality: 1 })
  })

  it('setRoomUse rechaza salas que no son vestuario, salas que no existen y el mismo uso', () => {
    const game = newGame([
      { type: 'buildFoundation', rect: rect(0, 0, 5, 5), wall: 'brick', floor: 'dirt' },
      { type: 'placeDoor', tile: { x: 2, y: 0 }, door: 'door' },
      place('wide', 1, 1),
      { type: 'designateRoom', tile: { x: 1, y: 1 }, roomType: 'depot' },
      ...kitRoom(6, 0),
    ])
    const [depot, kit] = Object.keys(game.state.rooms).map(Number)
    expect(game.dispatch({ type: 'setRoomUse', roomId: depot!, use: 'away' })).toEqual({
      ok: false,
      reason: 'notAChangingRoom',
    })
    expect(game.dispatch({ type: 'setRoomUse', roomId: 999, use: 'away' })).toEqual({
      ok: false,
      reason: 'roomNotFound',
    })
    game.dispatch({ type: 'setRoomUse', roomId: kit!, use: 'home' })
    expect(game.dispatch({ type: 'setRoomUse', roomId: kit!, use: 'home' })).toEqual({
      ok: false,
      reason: 'sameRole',
    })
  })
})

describe('calendario de partidos', () => {
  it('el primer partido es el domingo 5 de septiembre; el 29 de agosto no hay', () => {
    const game = newGame()
    mutable(game).clock.time = fromDate({ year: 1, month: 8, day: 29, hour: 17 })
    expect(isMatchDay(game.state, CONTENT)).toBe(false)
    mutable(game).clock.time = FIRST_KICKOFF
    expect(isMatchDay(game.state, CONTENT)).toBe(true)
    // Un lunes no, y en verano tampoco
    mutable(game).clock.time = FIRST_KICKOFF + 24 * HOUR
    expect(isMatchDay(game.state, CONTENT)).toBe(false)
    mutable(game).clock.time = fromDate({ year: 2, month: 7, day: 4, hour: 17 })
    expect(isMatchDay(game.state, CONTENT)).toBe(false)
  })

  it('"próximo evento" para el lunes de cuentas y luego en el partido, no el domingo 29', () => {
    const game = newGame([PITCH])
    expect(game.advance(30 * 24 * HOUR, { stopOnEvent: true }).stoppedBy).toBe('weeklyAccounts')
    const second = game.advance(30 * 24 * HOUR, { stopOnEvent: true })
    expect(second.stoppedBy).toBe('matchKickoff')
    expect(game.state.clock.time).toBe(FIRST_KICKOFF)
    expect(game.advance(30 * 24 * HOUR, { stopOnEvent: true }).stoppedBy).toBe('matchFinal')
    expect(game.state.clock.time).toBe(FIRST_KICKOFF + 2 * HOUR)
  })
})

describe('fuerza y goles', () => {
  it('en casa: base 40 + vestuario 2,5 × 1,5 + estado 50/10 + factor campo 5', () => {
    const game = newGame([PITCH, ...kitRoom(0, 0)])
    const home = teamStrength(game.state, CONTENT, true)
    expect(home).toMatchObject({ base: 40, changingRoom: 3.75, surface: 0, pitch: 5, home: 5 })
    expect(home.total).toBe(53.8)
    const away = teamStrength(game.state, CONTENT, false)
    expect(away).toMatchObject({ pitch: 0, home: 0 })
    expect(away.total).toBe(43.8)
  })

  it('la superficie y las salas completas suman instalaciones (con tope)', () => {
    const game = newGame([PITCH, { type: 'upgradeBuilding', buildingId: 1 }])
    // Césped: +8 y estado al máximo de su superficie (sin dato: 100)
    expect(teamStrength(game.state, CONTENT, true)).toMatchObject({ surface: 8, pitch: 10 })
  })

  it('los banquillos dan +2 en casa y cuestan 300 €', () => {
    const game = newGame([PITCH])
    const before = game.state.money
    expect(game.dispatch({ type: 'buildBenches', buildingId: 1 }).ok).toBe(true)
    expect(game.state.money).toBe(before - 300)
    expect(teamStrength(game.state, CONTENT, true).benches).toBe(2)
    expect(teamStrength(game.state, CONTENT, false).benches).toBe(0)
    expect(game.dispatch({ type: 'buildBenches', buildingId: 1 })).toEqual({
      ok: false,
      reason: 'hasBenches',
    })
  })

  it('poner banquillos se puede deshacer con reembolso íntegro', () => {
    const game = newGame([PITCH])
    const before = game.state.money
    game.dispatch({ type: 'buildBenches', buildingId: 1 })
    expect(game.dispatch({ type: 'undo' }).ok).toBe(true)
    expect(game.state.money).toBe(before)
    expect(game.state.buildings[1]?.benches).toBeUndefined()
  })

  it('goles esperados: iguales con fuerzas iguales, más para el más fuerte', () => {
    expect(expectedGoals(CONTENT, 45, 45)).toBeCloseTo(1.3)
    expect(expectedGoals(CONTENT, 60, 45)).toBeGreaterThan(1.3)
    expect(expectedGoals(CONTENT, 30, 45)).toBeLessThan(1.3)
  })

  it('la Poisson sembrada tiene de media λ', () => {
    const game = newGame([], 7)
    let total = 0
    const n = 4000
    for (let i = 0; i < n; i++) total += samplePoisson(mutable(game), 1.6, 20)
    expect(total / n).toBeGreaterThan(1.5)
    expect(total / n).toBeLessThan(1.7)
  })
})

describe('público y satisfacción', () => {
  it('asistencia: 90 % de socios + mitad del resto × satisfacción, hasta el aforo', () => {
    const game = newGame([PITCH])
    mutable(game).clock.weather = 'dry'
    // Socios 60, afición 300, satisfacción 70: 54 socios + round(240 × 0,5 × 0,7) = 84
    expect(homeAttendance(game.state, CONTENT)).toEqual({
      members: 54,
      public: 84,
      total: 100,
      capacity: 100,
      leftOut: 38,
    })
    mutable(game).clock.weather = 'rain'
    expect(homeAttendance(game.state, CONTENT).public).toBe(71)
  })

  it('satisfacción: base, limpieza, bar, aparcamiento, gente fuera y lluvia', () => {
    const base = {
      cleaning: 1,
      bar: false,
      parking: false,
      coveredStand: false,
      crowdOut: false,
      raining: false,
      visitorQuality: 0,
    }
    expect(matchSatisfaction(CONTENT, base)).toBe(70)
    expect(matchSatisfaction(CONTENT, { ...base, cleaning: 0.5 })).toBe(55)
    expect(matchSatisfaction(CONTENT, { ...base, bar: true, parking: true })).toBe(85)
    expect(matchSatisfaction(CONTENT, { ...base, crowdOut: true, raining: true })).toBe(45)
    expect(matchSatisfaction(CONTENT, { ...base, raining: true, coveredStand: true })).toBe(80)
    expect(matchSatisfaction(CONTENT, { ...base, visitorQuality: 5 })).toBe(75)
  })
})

describe('partido en la partida', () => {
  it('el primero es en casa: cobra taquilla y aparcamiento al empezar y aplica fama y afición al terminar', () => {
    const game = newGame([PITCH, ...kitRoom(0, 0), ...kitRoom(6, 0)])
    const events = collect(game)
    game.advance(FIRST_KICKOFF - START)
    const started = events.find((e) => e.type === 'matchStarted')
    expect(started).toBeDefined()
    expect(game.state.club.currentMatch).not.toBeNull()
    const concepts = game.state.ledger.filter((e) => e.at === FIRST_KICKOFF).map((e) => e.concept)
    expect(concepts).toEqual(expect.arrayContaining(['tickets', 'parking']))
    expect(played(events)).toHaveLength(0)

    const fansBefore = game.state.club.fans
    const fameBefore = game.state.club.fame
    game.advance(2 * HOUR)
    const [match] = played(events)
    expect(match).toMatchObject({ number: 1, home: true, noVisitorRoom: false })
    expect(game.state.club.currentMatch).toBeNull()
    expect(game.state.club.matches).toHaveLength(1)
    expect(game.state.club.fans).toBe(fansBefore + match!.fansChange)
    expect(game.state.club.fame).toBeCloseTo(fameBefore + match!.fameChange)
    // El partido desgasta el césped
    expect(game.state.buildings[1]?.condition).toBeLessThan(50)
  })

  it('la taquilla cobra a los que no son socios: (100 − 54) × 5 € con tiempo seco', () => {
    const game = newGame([PITCH, ...kitRoom(0, 0), ...kitRoom(6, 0)])
    game.advance(FIRST_KICKOFF - START - 1)
    mutable(game).clock.weather = 'dry'
    mutable(game).club.members = 60
    game.advance(1)
    const match = game.state.club.currentMatch!
    expect(match.attendance?.total).toBe(100)
    expect(match.money.tickets).toBe((100 - match.attendance!.members) * 5)
    expect(match.money.parking).toBe(10 * 2)
  })

  it('sin vestuario visitante, multa de 200 € y −1 de fama', () => {
    const game = newGame([PITCH, ...kitRoom(0, 0)])
    game.advance(FIRST_KICKOFF - START)
    const match = game.state.club.currentMatch!
    expect(match.noVisitorRoom).toBe(true)
    expect(match.money.fine).toBe(200)
    expect(game.state.ledger.some((e) => e.concept === 'fines' && e.amount === -200)).toBe(true)
  })

  it('el segundo es fuera: paga la furgoneta y no hay taquilla', () => {
    const game = newGame([PITCH])
    const events = collect(game)
    game.advance(FIRST_KICKOFF - START + WEEK + 2 * HOUR)
    const matches = played(events)
    expect(matches.map((m) => m.home)).toEqual([true, false])
    expect(matches[1]?.money).toMatchObject({ travel: 100, tickets: 0 })
    expect(matches[1]?.attendance).toBeNull()
  })

  it('sin campo principal, el partido en casa se juega fuera', () => {
    const game = newGame()
    game.advance(FIRST_KICKOFF - START)
    expect(game.state.club.currentMatch?.home).toBe(false)
  })

  it('20 partidos con semilla fija: hay victorias y derrotas', () => {
    const game = newGame([PITCH, ...kitRoom(0, 0), ...kitRoom(6, 0)], 42)
    game.advance(FIRST_KICKOFF - START + 19 * WEEK + 2 * HOUR)
    const matches = game.state.club.matches
    expect(matches).toHaveLength(20)
    const count = (o: string) => matches.filter((m) => m.outcome === o).length
    expect(count('win')).toBeGreaterThan(2)
    expect(count('loss')).toBeGreaterThan(2)
    expect(count('win')).toBeLessThan(18)
    // Nunca el mismo rival dos jornadas seguidas
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i]?.opponent).not.toBe(matches[i - 1]?.opponent)
    }
  })

  it('misma semilla, mismos resultados', () => {
    const run = () => {
      const game = newGame([PITCH], 9)
      game.advance(FIRST_KICKOFF - START + 5 * WEEK + 2 * HOUR)
      return game.state.club.matches.map((m) => `${m.goalsFor}-${m.goalsAgainst}`)
    }
    expect(run()).toEqual(run())
  })
})

describe('fama, afición y socios', () => {
  it('la fama se limita a 0-100', () => {
    const game = newGame()
    expect(addFame(mutable(game), 200)).toBe(95)
    expect(game.state.club.fame).toBe(100)
    addFame(mutable(game), -500)
    expect(game.state.club.fame).toBe(0)
  })

  it('afición: el resultado mueve un % y la satisfacción en casa; el techo frena las subidas', () => {
    expect(fansAfterMatch(CONTENT, 300, 5, 'win', null)).toBe(309)
    expect(fansAfterMatch(CONTENT, 300, 5, 'loss', null)).toBe(297)
    // Satisfacción 80: × (1 + 20/2000)
    expect(fansAfterMatch(CONTENT, 1000, 50, 'draw', 80)).toBe(Math.round(1000 * 1.01 * 1.01))
    // Techo con fama 0: 1.000
    expect(fansCeiling(CONTENT, 0)).toBe(1000)
    expect(fansAfterMatch(CONTENT, 995, 0, 'win', null)).toBe(1000)
    expect(fansAfterMatch(CONTENT, 1200, 0, 'win', null)).toBe(1200)
    expect(fansAfterMatch(CONTENT, 1200, 0, 'loss', null)).toBe(1188)
  })

  it('cada lunes los socios se acercan al 25 % de la afición y la fama baja hacia la base', () => {
    const game = newGame()
    mutable(game).club.fame = 8
    expect(weeklyClubUpdate(mutable(game), CONTENT)).toBe(true)
    // (300 × 0,25 − 60) × 0,1 = 1,5 → +2
    expect(game.state.club.members).toBe(62)
    expect(game.state.club.fame).toBeCloseTo(7.8)
    mutable(game).club.fame = 5
    weeklyClubUpdate(mutable(game), CONTENT)
    expect(game.state.club.fame).toBe(5)
  })

  it('la primera sala completa de cada tipo da +1 de fama una sola vez', () => {
    const game = newGame()
    const events = collect(game)
    for (const command of kitRoom(0, 0)) game.dispatch(command)
    expect(game.state.club.fame).toBe(6)
    expect(events.some((e) => e.type === 'firstRooms')).toBe(true)
    for (const command of kitRoom(6, 0)) game.dispatch(command)
    expect(game.state.club.fame).toBe(6)
    expect(awardFirstRooms(mutable(game), CONTENT)).toEqual([])
  })

  it('las salas que trae el escenario de inicio no dan fama', () => {
    const game = newGame(kitRoom(0, 0))
    expect(game.state.club.fame).toBe(5)
    expect(game.state.club.roomsCompleted).toEqual(['kit'])
  })
})
