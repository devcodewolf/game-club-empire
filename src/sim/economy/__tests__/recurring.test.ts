/** Tests de los ingresos y gastos regulares: subvención, mantenimiento, cuotas, bar y alquiler. */
import { describe, expect, it } from 'vitest'
import type { Command, GameEvent } from '../../commands'
import type { SimContent } from '../../content'
import type { BuildingCatalog } from '../../buildings/buildings'
import { createGame, type Game, type GameOptions } from '../../game'
import type { TileRect } from '../../geometry'
import type { MapState } from '../../map/map'
import { evaluateRoom } from '../../rooms/rooms'
import { MINUTES_PER_DAY, fromDate } from '../../time/calendar'
import type { TimeContent } from '../../time/clock'
import type { EconomyContent, LedgerConcept } from '../ledger'
import {
  ECONOMY_EVENT,
  applyEconomyEvent,
  buildingMaintenance,
  pitchRentalPerDay,
  roomMaintenance,
  startupAid,
  weekNumber,
  weeklyMaintenance,
  weeklyReport,
} from '../recurring'
import {
  TEST_CATALOG,
  TEST_CONTENT,
  TEST_ECONOMY,
  TEST_MAP_CONFIG,
  TEST_TIME,
} from '../../__tests__/fixtures'

const WEEK = 7 * MINUTES_PER_DAY
const HOUR = 60

/** Catálogo de prueba más un objeto caro (500 €) y un campo de 11 con dos superficies. */
const CATALOG: BuildingCatalog = {
  ...TEST_CATALOG,
  costly: {
    id: 'costly',
    name: 'Caro',
    size: { width: 1, height: 1 },
    cost: 500,
    markerColor: 0xff00ff,
    icon: 'X',
  },
  field11: {
    id: 'field11',
    name: 'Campo 11',
    size: { width: 5, height: 4 },
    cost: 80,
    markerColor: 0x00aa00,
    icon: 'E',
    pitch: { format: 11, surfaces: ['dirt', 'grass'] },
    tiers: [
      { name: 'Tierra', cost: 80, quality: 1 },
      { name: 'Césped', cost: 160, quality: 2 },
    ],
  },
}

/** Tarifas con cifras redondas para poder calcular a mano. */
const ECONOMY: EconomyContent = {
  ...TEST_ECONOMY,
  bar: { roomType: 'kit', perDay: 30 },
  rental: {
    perDay: { 7: 30, 11: 50 },
    surfaceMultiplier: { dirt: 1, grass: 1.5, stone: 2 },
  },
  maintenance: {
    objectRate: 0.02,
    standRate: 0.01,
    interiorPerTile: 0.2,
    turfPerTile: { dirt: 0.5, grass: 1, stone: 2 },
  },
}

/** Calendario completo como el del juego (cuentas, cuotas, alquiler y bar). */
const TIME: TimeContent = {
  ...TEST_TIME,
  events: [
    { id: 'weeklyAccounts', rule: { every: 'week', weekday: 0, hour: 8 }, stops: true },
    { id: 'monthlyFees', rule: { every: 'month', day: 1, hour: 8 } },
    { id: 'rentalDaily', rule: { every: 'day', hour: 21 } },
    { id: 'barDaily', rule: { every: 'day', hour: 22 } },
  ],
}

const CONTENT: SimContent = { ...TEST_CONTENT, buildings: CATALOG, time: TIME, economy: ECONOMY }

const START_TIME = fromDate(TIME.start) // lunes 23 de agosto, 09:00
const MONEY = 100_000

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
const upgrade = (buildingId: number): Command => ({ type: 'upgradeBuilding', buildingId })
const foundation = (area: TileRect): Command => ({
  type: 'buildFoundation',
  rect: area,
  wall: 'brick',
  floor: 'dirt',
})
const door = (x: number, y: number): Command => ({
  type: 'placeDoor',
  tile: { x, y },
  door: 'door',
})
const designate = (x: number, y: number): Command => ({
  type: 'designateRoom',
  tile: { x, y },
  roomType: 'kit',
})

function newGame(scenario: readonly Command[] = [], options: GameOptions = {}): Game {
  return createGame(TEST_MAP_CONFIG, CONTENT, { money: MONEY, scenario, ...options })
}

function ok(game: Game, command: Command) {
  const result = game.dispatch(command)
  if (!result.ok) throw new Error(`falló ${command.type}: ${result.reason}`)
  return result
}

/** El estado como mutable, para fijar el reloj o los socios en una prueba. */
const mutable = (game: Game): MapState => game.state as MapState

/** Fija el reloj y aplica un evento económico directamente. */
function fire(game: Game, time: number, id: string) {
  mutable(game).clock.time = time
  return applyEconomyEvent(mutable(game), CONTENT, id)
}

const sumOf = (game: Game, concept: LedgerConcept) =>
  game.state.ledger.filter((e) => e.concept === concept).reduce((sum, e) => sum + e.amount, 0)

const countOf = (game: Game, concept: LedgerConcept) =>
  game.state.ledger.filter((e) => e.concept === concept).length

const ledgerBalance = (game: Game, money = MONEY) =>
  money + game.state.ledger.reduce((sum, e) => sum + e.amount, 0)

function collect(game: Game): GameEvent[] {
  const events: GameEvent[] = []
  game.subscribe((e) => events.push(e))
  return events
}

/** Instante del lunes de cuentas (08:00) de la semana `week`. */
const mondayOfWeek = (week: number) => START_TIME - HOUR + week * WEEK

/** Cimientos 10×8 con una sala de bar (kit) designada y, si se pide, su objeto exigido. */
const barScenario = (complete: boolean): Command[] => [
  foundation(rect(0, 0, 10, 8)),
  door(4, 0),
  ...(complete ? [place('small', 3, 3)] : []),
  designate(3, 3),
]

describe('semana y ayuda de arranque', () => {
  it('weekNumber da 1 en el primer lunes de cuentas y sube cada semana', () => {
    const game = newGame()
    mutable(game).clock.time = fromDate({ year: 1, month: 8, day: 30, hour: 8 })
    expect(weekNumber(game.state, CONTENT)).toBe(1)
    mutable(game).clock.time += WEEK
    expect(weekNumber(game.state, CONTENT)).toBe(2)
    mutable(game).clock.time = mondayOfWeek(9)
    expect(weekNumber(game.state, CONTENT)).toBe(9)
  })

  it('startupAid por tramos: 1-4 → 1000, 5-8 → 500, 9 → 0', () => {
    for (const week of [1, 2, 3, 4]) expect(startupAid(CONTENT, week)).toBe(1000)
    for (const week of [5, 6, 7, 8]) expect(startupAid(CONTENT, week)).toBe(500)
    expect(startupAid(CONTENT, 9)).toBe(0)
    expect(startupAid(CONTENT, 100)).toBe(0)
  })

  it.each([
    [1, 500 + 1000],
    [4, 500 + 1000],
    [5, 500 + 500],
    [8, 500 + 500],
    [9, 500],
    [20, 500],
  ])('lunes de la semana %i: subvención de %i €', (week, expected) => {
    const game = newGame()
    const outcome = fire(game, mondayOfWeek(week), ECONOMY_EVENT.weeklyAccounts)
    expect(weekNumber(game.state, CONTENT)).toBe(week)
    expect(outcome.entries).toHaveLength(1)
    expect(outcome.entries[0]).toMatchObject({ concept: 'subsidy', amount: expected })
    expect(game.state.money).toBe(MONEY + expected)
  })
})

describe('mantenimiento semanal', () => {
  it('objetos: 2 % de su valor con mejoras', () => {
    // 500 → 10 €; 'tiered' mejorado dos veces: 10 + 30 + 80 = 120 → 2,4 €
    const game = newGame([place('costly', 0, 0), place('tiered', 5, 5), upgrade(2), upgrade(2)])
    const m = weeklyMaintenance(game.state, CONTENT)
    expect(m.objects).toBeCloseTo(12.4)
    expect(m.interiors).toBe(0)
    expect(m.turf).toBe(0)
    expect(m.stands).toBe(0)
    const def = CATALOG['costly']!
    expect(buildingMaintenance(CONTENT, def, game.state.buildings[1]!)).toBeCloseTo(10)
  })

  it('gradas: 1 % de su coste acumulado, aparte de los objetos', () => {
    const game = newGame([
      place('field', 5, 6),
      { type: 'placeStand', buildingType: 'stand', pitchId: 1, slot: 'north' },
      upgrade(2), // 100 + 200 = 300
    ])
    const m = weeklyMaintenance(game.state, CONTENT)
    expect(m.stands).toBeCloseTo(3)
    expect(m.objects).toBe(0)
    expect(buildingMaintenance(CONTENT, CATALOG['stand']!, game.state.buildings[2]!)).toBeCloseTo(3)
  })

  it('césped: casillas del campo × tarifa de su superficie', () => {
    const game = newGame([place('field', 5, 6)]) // 4×3 = 12 casillas, tierra
    expect(weeklyMaintenance(game.state, CONTENT).turf).toBeCloseTo(12 * 0.5)
    ok(game, upgrade(1)) // césped
    expect(weeklyMaintenance(game.state, CONTENT).turf).toBeCloseTo(12 * 1)
    ok(game, upgrade(1)) // piedra
    expect(weeklyMaintenance(game.state, CONTENT).turf).toBeCloseTo(12 * 2)
    // El campo no paga además como objeto
    expect(weeklyMaintenance(game.state, CONTENT).objects).toBe(0)
  })

  it('césped: dos campos de distinto tamaño suman', () => {
    const game = newGame([place('field', 5, 6), place('field11', 10, 10)])
    // 12 × 0,5 + 20 × 0,5
    expect(weeklyMaintenance(game.state, CONTENT).turf).toBeCloseTo(16)
  })

  it('interiores: casillas indoor × 0,2', () => {
    const game = newGame([foundation(rect(0, 0, 10, 8))])
    const indoor = game.state.indoor.filter(Boolean).length
    expect(indoor).toBe(8 * 6)
    expect(weeklyMaintenance(game.state, CONTENT).interiors).toBeCloseTo(indoor * 0.2)
  })

  it('el lunes se anotan solo los conceptos que no son 0', () => {
    const game = newGame([place('field', 5, 6)])
    const outcome = fire(game, mondayOfWeek(9), ECONOMY_EVENT.weeklyAccounts)
    expect(outcome.entries.map((e) => e.concept)).toEqual(['subsidy', 'maintenanceTurf'])
    expect(outcome.entries[1]!.amount).toBe(-6)
  })

  it('el lunes anota los cuatro conceptos con su importe redondeado', () => {
    const game = newGame([
      foundation(rect(0, 0, 10, 8)), // 48 casillas interiores → 9,6 → 10
      place('costly', 12, 0), // 10
      place('field', 5, 10),
      { type: 'placeStand', buildingType: 'stand', pitchId: 2, slot: 'north' },
      upgrade(3), // grada 300 → 3
    ])
    const outcome = fire(game, mondayOfWeek(9), ECONOMY_EVENT.weeklyAccounts)
    const byConcept = Object.fromEntries(outcome.entries.map((e) => [e.concept, e.amount]))
    expect(byConcept).toEqual({
      subsidy: 500,
      maintenanceObjects: -10,
      maintenanceInteriors: -10,
      maintenanceTurf: -6,
      maintenanceStands: -3,
    })
    expect(game.state.money).toBe(MONEY + 500 - 10 - 10 - 6 - 3)
  })

  it('roomMaintenance: casillas de la sala + objetos dentro', () => {
    const game = newGame(barScenario(true))
    const roomId = Number(Object.keys(game.state.rooms)[0])
    const tiles = evaluateRoom(game.state, CONTENT, roomId)!.tiles.length
    // El objeto 'small' (10 €) está dentro: 0,2 €
    expect(roomMaintenance(game.state, CONTENT, roomId)).toBeCloseTo(tiles * 0.2 + 0.2)
  })

  it('roomMaintenance de una sala inexistente es 0', () => {
    const game = newGame()
    expect(roomMaintenance(game.state, CONTENT, 99)).toBe(0)
  })
})

describe('cuotas de socios', () => {
  const SEP1 = fromDate({ year: 1, month: 9, day: 1, hour: 8 })

  it('el día 1 a las 08:00 cobra socios × cuota de la división', () => {
    const game = newGame()
    const outcome = fire(game, SEP1, 'monthlyFees')
    expect(outcome.entries).toEqual([{ at: SEP1, concept: 'memberFees', amount: 900 }])
    expect(game.state.money).toBe(MONEY + 60 * 15)
  })

  it('usa los socios actuales del club', () => {
    const game = newGame()
    mutable(game).club.members = 100
    fire(game, SEP1, 'monthlyFees')
    expect(sumOf(game, 'memberFees')).toBe(1500)
  })

  it('sin socios no anota nada', () => {
    const game = newGame()
    mutable(game).club.members = 0
    const outcome = fire(game, START_TIME, 'monthlyFees')
    expect(outcome.entries).toHaveLength(0)
  })

  it('en la partida se cobra el 1 de septiembre a las 08:00 y no antes', () => {
    const game = newGame()
    const events = collect(game)
    const toSep1 = SEP1 - START_TIME
    game.advance(toSep1 - 1)
    expect(countOf(game, 'memberFees')).toBe(0)
    game.advance(1)
    expect(countOf(game, 'memberFees')).toBe(1)
    // El lunes 30 los socios ya se han acercado a su parte de la afición (60 → 62)
    expect(game.state.club.members).toBe(62)
    expect(game.state.ledger.find((e) => e.concept === 'memberFees')).toMatchObject({
      at: SEP1,
      amount: 62 * 15,
    })
    const tx = events.filter((e) => e.type === 'transaction' && e.entry.concept === 'memberFees')
    expect(tx).toHaveLength(1)
  })
})

describe('bar', () => {
  const NIGHT = START_TIME + 13 * HOUR // 22:00

  it('una sala de bar completa da 30 € con su rect', () => {
    const game = newGame(barScenario(true))
    const roomId = Number(Object.keys(game.state.rooms)[0])
    const status = evaluateRoom(game.state, CONTENT, roomId)!
    expect(status.ok).toBe(true)
    const outcome = fire(game, NIGHT, 'barDaily')
    expect(outcome.entries).toHaveLength(1)
    expect(outcome.entries[0]).toMatchObject({ concept: 'bar', amount: 30, rect: status.bounds })
  })

  it('una sala de bar incompleta no da nada', () => {
    const game = newGame(barScenario(false))
    const roomId = Number(Object.keys(game.state.rooms)[0])
    expect(evaluateRoom(game.state, CONTENT, roomId)!.ok).toBe(false)
    expect(fire(game, NIGHT, 'barDaily').entries).toHaveLength(0)
    expect(game.state.money).toBe(MONEY)
  })

  it('sin sala de bar no da nada', () => {
    const game = newGame([place('small', 3, 3)])
    expect(fire(game, NIGHT, 'barDaily').entries).toHaveLength(0)
  })

  it('una sala de otro tipo no cuenta como bar', () => {
    const game = newGame(barScenario(true))
    const other: SimContent = {
      ...CONTENT,
      economy: { ...ECONOMY, bar: { roomType: 'depot', perDay: 30 } },
    }
    mutable(game).clock.time = NIGHT
    expect(applyEconomyEvent(mutable(game), other, 'barDaily').entries).toHaveLength(0)
  })

  it('con dos barras completas solo se cobra una caja', () => {
    const game = newGame([
      ...barScenario(true),
      foundation(rect(12, 0, 5, 5)),
      door(14, 0),
      place('small', 13, 1),
      designate(13, 1),
    ])
    expect(Object.keys(game.state.rooms)).toHaveLength(2)
    expect(fire(game, NIGHT, 'barDaily').entries).toHaveLength(1)
  })

  it('el bar se cobra cada noche, también el domingo', () => {
    const game = newGame(barScenario(true))
    game.advance(7 * MINUTES_PER_DAY)
    expect(countOf(game, 'bar')).toBe(7)
    expect(sumOf(game, 'bar')).toBe(210)
  })
})

describe('alquiler de campos', () => {
  const TUESDAY_21 = START_TIME + MINUTES_PER_DAY + 12 * HOUR
  const SUNDAY_21 = START_TIME + 6 * MINUTES_PER_DAY + 12 * HOUR

  it('pitchRentalPerDay: formato y multiplicador de superficie', () => {
    const game = newGame([place('field', 5, 6), place('field11', 10, 10)])
    const field = game.state.buildings[1]!
    const field11 = game.state.buildings[2]!
    expect(pitchRentalPerDay(CONTENT, CATALOG['field']!, field)).toBe(30)
    expect(pitchRentalPerDay(CONTENT, CATALOG['field11']!, field11)).toBe(50)
    ok(game, upgrade(1)) // césped ×1,5
    expect(pitchRentalPerDay(CONTENT, CATALOG['field']!, game.state.buildings[1]!)).toBe(45)
    ok(game, upgrade(1)) // piedra ×2
    expect(pitchRentalPerDay(CONTENT, CATALOG['field']!, game.state.buildings[1]!)).toBe(60)
    ok(game, upgrade(2))
    expect(pitchRentalPerDay(CONTENT, CATALOG['field11']!, game.state.buildings[2]!)).toBe(75)
  })

  it('pitchRentalPerDay de algo que no es un campo es 0', () => {
    const game = newGame([place('small', 1, 1)])
    expect(pitchRentalPerDay(CONTENT, CATALOG['small']!, game.state.buildings[1]!)).toBe(0)
  })

  it('un campo sin alquilar no da nada', () => {
    const game = newGame([place('field', 5, 6)])
    expect(fire(game, TUESDAY_21, 'rentalDaily').entries).toHaveLength(0)
  })

  it('solo se alquilan los campos con rental, con su rect', () => {
    const game = newGame([place('field', 5, 6), place('field11', 10, 10)])
    ok(game, { type: 'setPitchRental', buildingId: 2, rental: true })
    const outcome = fire(game, TUESDAY_21, 'rentalDaily')
    expect(outcome.entries).toEqual([
      { at: TUESDAY_21, concept: 'pitchRental', amount: 50, rect: rect(10, 10, 5, 4) },
    ])
    ok(game, { type: 'setPitchRental', buildingId: 1, rental: true })
    ok(game, upgrade(1)) // césped: 45
    const second = fire(game, TUESDAY_21 + MINUTES_PER_DAY, 'rentalDaily')
    expect(second.entries.map((e) => e.amount)).toEqual([45, 50])
  })

  it('nunca en domingo', () => {
    const game = newGame([place('field', 5, 6)])
    ok(game, { type: 'setPitchRental', buildingId: 1, rental: true })
    expect(fire(game, SUNDAY_21, 'rentalDaily').entries).toHaveLength(0)
    expect(fire(game, SUNDAY_21 - MINUTES_PER_DAY, 'rentalDaily').entries).toHaveLength(1)
    expect(fire(game, SUNDAY_21 + MINUTES_PER_DAY, 'rentalDaily').entries).toHaveLength(1)
  })

  it('setPitchRental: activa, emite el evento y no cobra nada', () => {
    const game = newGame([place('field', 5, 6)])
    const events = collect(game)
    const result = game.dispatch({ type: 'setPitchRental', buildingId: 1, rental: true })
    expect(result).toEqual({
      ok: true,
      event: { type: 'pitchRentalChanged', buildingId: 1, rental: true },
    })
    expect(game.state.buildings[1]!.rental).toBe(true)
    expect(game.state.money).toBe(MONEY)
    expect(events.some((e) => e.type === 'transaction')).toBe(false)
    ok(game, { type: 'setPitchRental', buildingId: 1, rental: false })
    expect(game.state.buildings[1]!.rental).toBe(false)
  })

  it('setPitchRental con el mismo valor falla', () => {
    const game = newGame([place('field', 5, 6)])
    // Por defecto no se alquila
    expect(game.dispatch({ type: 'setPitchRental', buildingId: 1, rental: false }).ok).toBe(false)
    ok(game, { type: 'setPitchRental', buildingId: 1, rental: true })
    expect(game.dispatch({ type: 'setPitchRental', buildingId: 1, rental: true }).ok).toBe(false)
  })

  it('setPitchRental sobre algo que no es un campo → notAPitch', () => {
    const game = newGame([place('small', 1, 1)])
    expect(game.dispatch({ type: 'setPitchRental', buildingId: 1, rental: true })).toEqual({
      ok: false,
      reason: 'notAPitch',
    })
  })

  it('setPitchRental sobre un edificio inexistente falla', () => {
    const game = newGame()
    expect(game.dispatch({ type: 'setPitchRental', buildingId: 9, rental: true }).ok).toBe(false)
  })

  it('en la partida: 6 días de alquiler en una semana (sin el domingo)', () => {
    const game = newGame([place('field', 5, 6)])
    ok(game, { type: 'setPitchRental', buildingId: 1, rental: true })
    game.advance(7 * MINUTES_PER_DAY)
    expect(countOf(game, 'pitchRental')).toBe(6)
    expect(sumOf(game, 'pitchRental')).toBe(180)
  })
})

describe('eventos sin efecto', () => {
  it('un id desconocido no anota nada', () => {
    const game = newGame()
    const outcome = fire(game, START_TIME, 'noExiste')
    expect(outcome.entries).toHaveLength(0)
    expect(outcome.report).toBeUndefined()
  })

  it('solo el lunes de cuentas trae informe', () => {
    const game = newGame()
    expect(fire(game, START_TIME, 'monthlyFees').report).toBeUndefined()
    expect(fire(game, START_TIME, 'barDaily').report).toBeUndefined()
    expect(fire(game, START_TIME, 'rentalDaily').report).toBeUndefined()
    expect(fire(game, mondayOfWeek(1), 'weeklyAccounts').report).toBeDefined()
  })
})

describe('semana completa', () => {
  /** Escenario: sala de bar completa, objeto caro, campo con grada mejorada. */
  const scenario: Command[] = [
    foundation(rect(0, 0, 10, 8)), // 48 casillas interiores
    door(4, 0),
    place('small', 3, 3), // id 1, dentro de la sala
    designate(3, 3),
    place('costly', 12, 0), // id 2
    place('field', 5, 10), // id 3, 4×3
    { type: 'placeStand', buildingType: 'stand', pitchId: 3, slot: 'north' }, // id 4
    upgrade(4), // coste acumulado 300
  ]

  function weekGame() {
    const game = newGame(scenario)
    ok(game, { type: 'setPitchRental', buildingId: 3, rental: true })
    const events = collect(game)
    return { game, events }
  }

  it('el saldo cuadra con el inicial más las entradas', () => {
    const { game } = weekGame()
    game.advance(7 * MINUTES_PER_DAY)
    expect(game.state.ledger.length).toBeGreaterThan(0)
    expect(game.state.money).toBe(ledgerBalance(game))
  })

  it('cada concepto coincide con las fórmulas a mano', () => {
    const { game } = weekGame()
    game.advance(7 * MINUTES_PER_DAY)
    // Subvención base 500 + ayuda de la semana 1 (1000)
    expect(sumOf(game, 'subsidy')).toBe(500 + 1000)
    // Objetos: small 10 × 2 % + costly 500 × 2 % = 10,2 → 10
    expect(sumOf(game, 'maintenanceObjects')).toBe(-10)
    // Interiores: 48 × 0,2 = 9,6 → 10
    expect(sumOf(game, 'maintenanceInteriors')).toBe(-10)
    // Césped: 12 × 0,5
    expect(sumOf(game, 'maintenanceTurf')).toBe(-6)
    // Grada: 300 × 1 %
    expect(sumOf(game, 'maintenanceStands')).toBe(-3)
    // Alquiler: 6 días (sin domingo) × 30
    expect(countOf(game, 'pitchRental')).toBe(6)
    expect(sumOf(game, 'pitchRental')).toBe(180)
    // Bar: 7 noches × 30
    expect(countOf(game, 'bar')).toBe(7)
    expect(sumOf(game, 'bar')).toBe(210)
    // Sin cuotas (el día 1 aún no ha llegado) ni más conceptos
    expect(countOf(game, 'memberFees')).toBe(0)
    expect(game.state.ledger).toHaveLength(1 + 4 + 6 + 7)
    expect(game.state.money).toBe(MONEY + 1500 + 180 + 210 - 10 - 10 - 6 - 3)
  })

  it('cada entrada se emite como transaction y el lunes llega el weeklyReport', () => {
    const { game, events } = weekGame()
    game.advance(7 * MINUTES_PER_DAY)
    const transactions = events.flatMap((e) => (e.type === 'transaction' ? [e.entry] : []))
    expect(transactions).toEqual(game.state.ledger)

    const reports = events.flatMap((e) => (e.type === 'weeklyReport' ? [e.report] : []))
    expect(reports).toHaveLength(1)
    const monday = fromDate({ year: 1, month: 8, day: 30, hour: 8 })
    expect(reports[0]).toEqual({
      from: monday - WEEK,
      to: monday,
      income: 1500 + 180 + 210,
      expenses: 10 + 10 + 6 + 3,
      net: 1890 - 29,
    })
    // Coherente con lo que dice el libro
    expect(reports[0]).toEqual(weeklyReport(game.state, monday - WEEK, monday))
    expect(reports[0]!.net).toBe(reports[0]!.income - reports[0]!.expenses)
  })

  it('el weeklyReport se emite después de las entradas del lunes', () => {
    const { game, events } = weekGame()
    game.advance(7 * MINUTES_PER_DAY)
    const reportAt = events.findIndex((e) => e.type === 'weeklyReport')
    const lastEntry = events.findIndex(
      (e) => e.type === 'transaction' && e.entry.concept === 'maintenanceStands',
    )
    expect(lastEntry).toBeGreaterThan(-1)
    expect(reportAt).toBeGreaterThan(lastEntry)
  })

  it('weeklyReport solo cuenta (from, to]', () => {
    const { game } = weekGame()
    game.advance(7 * MINUTES_PER_DAY)
    const first = game.state.ledger[0]!
    // El límite inferior está excluido y el superior incluido
    expect(weeklyReport(game.state, first.at, first.at).net).toBe(0)
    expect(weeklyReport(game.state, first.at - 1, first.at).net).toBe(
      game.state.ledger.filter((e) => e.at === first.at).reduce((s, e) => s + e.amount, 0),
    )
  })
})

describe('determinismo', () => {
  function run(chunk: number) {
    const game = newGame([
      foundation(rect(0, 0, 10, 8)),
      door(4, 0),
      place('small', 3, 3),
      designate(3, 3),
      place('costly', 12, 0),
      place('field', 5, 10),
    ])
    ok(game, { type: 'setPitchRental', buildingId: 3, rental: true })
    const total = 14 * MINUTES_PER_DAY
    for (let done = 0; done < total; done += chunk) game.advance(Math.min(chunk, total - done))
    return game
  }

  it('14 días de golpe o hora a hora dan el mismo saldo y libro', () => {
    const whole = run(14 * MINUTES_PER_DAY)
    const hourly = run(HOUR)
    expect(hourly.state.clock.time).toBe(whole.state.clock.time)
    expect(hourly.state.money).toBe(whole.state.money)
    expect(hourly.state.ledger).toEqual(whole.state.ledger)
    expect(whole.state.ledger.length).toBeGreaterThan(20)
    expect(whole.state.money).toBe(ledgerBalance(whole))
  })

  it('incluye las cuotas del 1 de septiembre y la subvención de dos lunes', () => {
    const game = run(14 * MINUTES_PER_DAY)
    expect(countOf(game, 'memberFees')).toBe(1)
    expect(countOf(game, 'subsidy')).toBe(2)
  })

  it('el mismo avance en trozos irregulares también coincide', () => {
    const whole = run(14 * MINUTES_PER_DAY)
    const odd = run(7 * 61 + 3)
    expect(odd.state.ledger).toEqual(whole.state.ledger)
    expect(odd.state.money).toBe(whole.state.money)
  })
})
