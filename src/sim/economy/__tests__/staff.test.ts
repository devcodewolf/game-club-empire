/** Tests del personal, el estado de los campos y las averías de los objetos (Fase 2, Bloque D). */
import { describe, expect, it } from 'vitest'
import type { Command, GameEvent } from '../../commands'
import type { SimContent } from '../../content'
import type { BuildingCatalog } from '../../buildings/buildings'
import { pitchCapacity } from '../../buildings/stands'
import { createGame, type Game, type GameOptions } from '../../game'
import type { TileRect } from '../../geometry'
import type { MapState } from '../../map/map'
import { evaluateRoom } from '../../rooms/rooms'
import { MINUTES_PER_DAY, fromDate } from '../../time/calendar'
import type { TimeContent } from '../../time/clock'
import type { EconomyContent, LedgerConcept } from '../ledger'
import { ECONOMY_EVENT, applyEconomyEvent } from '../recurring'
import { STAFF_ROLES, pitchMaxCondition, staffCoverage, staffWorkload, weeklyWages } from '../staff'
import {
  buildingRepairCost,
  nightlyPitchCare,
  pitchCondition,
  pitchRepairCost,
  pitchResting,
  rollBreakdowns,
  wearFromRental,
} from '../upkeep'
import {
  TEST_CATALOG,
  TEST_CONTENT,
  TEST_ECONOMY,
  TEST_MAP_CONFIG,
  TEST_TIME,
} from '../../__tests__/fixtures'

const HOUR = 60
const DAY = MINUTES_PER_DAY

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
}

/** Capacidades pequeñas para que la cobertura quede por debajo de 1 con pocas personas. */
const ECONOMY: EconomyContent = {
  ...TEST_ECONOMY,
  bar: { roomType: 'kit', perDay: 30 },
  staff: {
    gardener: { name: 'Jardinero', wage: 250, covers: { pitchTiles: 6 } },
    cleaner: { name: 'Limpieza', wage: 200, covers: { indoorTiles: 24, seats: 10 } },
    maintenance: { name: 'Mantenimiento', wage: 300, covers: { objectsValue: 100 } },
    monitor: { name: 'Monitor', wage: 150, covers: { students: 15 } },
  },
  pitch: {
    ...TEST_ECONOMY.pitch,
    maxCondition: { dirt: 60, grass: 90 },
    rainDamage: { dirt: 2, grass: 3 },
    rentalDamage: { dirt: 1, grass: 2 },
    repairPerTile: { dirt: 0.5, grass: 1 },
  },
}

/** Calendario con cuentas, alquiler y cuidado nocturno; sin lluvia (para cifras exactas). */
const TIME: TimeContent = {
  ...TEST_TIME,
  rainChance: 0,
  events: [
    { id: 'weeklyAccounts', rule: { every: 'week', weekday: 0, hour: 8 }, stops: true },
    { id: 'rentalDaily', rule: { every: 'day', hour: 21 } },
    { id: 'pitchNightly', rule: { every: 'day', hour: 23 } },
  ],
}

const CONTENT: SimContent = { ...TEST_CONTENT, buildings: CATALOG, time: TIME, economy: ECONOMY }
const START = fromDate(TIME.start) // lunes 23 de agosto, 09:00
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
const hire = (role: 'gardener' | 'cleaner' | 'maintenance' | 'monitor', n = 1): Command[] =>
  Array.from({ length: n }, () => ({ type: 'hireStaff', role }))
const rentOn = (buildingId: number): Command => ({
  type: 'setPitchRental',
  buildingId,
  rental: true,
})

function newGame(scenario: readonly Command[] = [], options: GameOptions = {}): Game {
  return createGame(TEST_MAP_CONFIG, CONTENT, { money: MONEY, scenario, ...options })
}

function ok(game: Game, command: Command) {
  const result = game.dispatch(command)
  if (!result.ok) throw new Error(`falló ${command.type}: ${result.reason}`)
  return result
}

const mutable = (game: Game): MapState => game.state as MapState

function collect(game: Game): GameEvent[] {
  const events: GameEvent[] = []
  game.subscribe((e) => events.push(e))
  return events
}

const sumOf = (game: Game, concept: LedgerConcept) =>
  game.state.ledger.filter((e) => e.concept === concept).reduce((sum, e) => sum + e.amount, 0)
const countOf = (game: Game, concept: LedgerConcept) =>
  game.state.ledger.filter((e) => e.concept === concept).length

/** Fija el reloj y aplica un evento económico directamente. */
function fire(game: Game, time: number, id: string) {
  mutable(game).clock.time = time
  return applyEconomyEvent(mutable(game), CONTENT, id)
}

/** Pone el estado de un campo directamente. */
function setCondition(game: Game, id: number, condition: number): void {
  const state = mutable(game)
  state.buildings[id] = { ...state.buildings[id]!, condition }
}

const FIELD_DEF = CATALOG['field']!
const condition = (game: Game, id = 1) =>
  pitchCondition(CONTENT, FIELD_DEF, game.state.buildings[id]!)

const TUESDAY_21 = START + DAY + 12 * HOUR

describe('cobertura del personal', () => {
  it('sin necesidad la cobertura es 1, aunque no haya nadie', () => {
    const game = newGame()
    for (const role of STAFF_ROLES) {
      expect(staffCoverage(game.state, CONTENT, role)).toEqual({ hired: 0, needed: 0, coverage: 1 })
    }
  })

  it('jardinería: jardineros / (casillas de campo / capacidad)', () => {
    const game = newGame([place('field', 5, 6)]) // 12 casillas, 6 por persona → 2
    expect(staffWorkload(game.state, CONTENT).pitchTiles).toBe(12)
    expect(staffCoverage(game.state, CONTENT, 'gardener')).toEqual({
      hired: 0,
      needed: 2,
      coverage: 0,
    })
    ok(game, { type: 'hireStaff', role: 'gardener' })
    expect(staffCoverage(game.state, CONTENT, 'gardener').coverage).toBe(0.5)
    ok(game, { type: 'hireStaff', role: 'gardener' })
    expect(staffCoverage(game.state, CONTENT, 'gardener').coverage).toBe(1)
  })

  it('nunca pasa de 1 aunque sobre personal', () => {
    const game = newGame([place('field', 5, 6), ...hire('gardener', 5)])
    expect(staffCoverage(game.state, CONTENT, 'gardener')).toEqual({
      hired: 5,
      needed: 2,
      coverage: 1,
    })
  })

  it('la cobertura de dos campos suma sus casillas', () => {
    const game = newGame([place('field', 5, 6), place('field', 10, 10), ...hire('gardener', 2)])
    expect(staffWorkload(game.state, CONTENT).pitchTiles).toBe(24)
    expect(staffCoverage(game.state, CONTENT, 'gardener').coverage).toBe(0.5)
  })

  it('limpieza: suma casillas interiores y asientos', () => {
    const game = newGame([
      { type: 'buildFoundation', rect: rect(0, 0, 10, 8), wall: 'brick', floor: 'dirt' },
      place('field', 5, 12),
      { type: 'placeStand', buildingType: 'stand', pitchId: 1, slot: 'north' },
    ])
    const seats = pitchCapacity(game.state, CONTENT, 1)
    expect(seats).toBeGreaterThan(0)
    const load = staffWorkload(game.state, CONTENT)
    expect(load.indoorTiles).toBe(48)
    expect(load.seats).toBe(seats)
    const needed = 48 / 24 + seats / 10
    const cover = staffCoverage(game.state, CONTENT, 'cleaner')
    expect(cover.needed).toBeCloseTo(needed)
    expect(cover.coverage).toBe(0)
    ok(game, { type: 'hireStaff', role: 'cleaner' })
    expect(staffCoverage(game.state, CONTENT, 'cleaner').coverage).toBeCloseTo(
      Math.min(1, 1 / needed),
    )
  })

  it('mantenimiento: sobre el valor de los objetos, sin campos ni gradas', () => {
    const game = newGame([
      place('costly', 0, 0), // 500
      place('small', 2, 0), // 10
      place('tiered', 4, 0), // 10
      { type: 'upgradeBuilding', buildingId: 3 }, // +30 → 40
      place('field', 5, 6),
      { type: 'placeStand', buildingType: 'stand', pitchId: 4, slot: 'north' },
    ])
    expect(staffWorkload(game.state, CONTENT).objectsValue).toBe(500 + 10 + 40)
    const cover = staffCoverage(game.state, CONTENT, 'maintenance')
    expect(cover.needed).toBeCloseTo(5.5)
    ok(game, { type: 'hireStaff', role: 'maintenance' })
    expect(staffCoverage(game.state, CONTENT, 'maintenance').coverage).toBeCloseTo(1 / 5.5)
  })

  it('hireStaff y fireStaff suben y bajan; despedir sin nadie falla', () => {
    const game = newGame()
    const events = collect(game)
    expect(game.dispatch({ type: 'fireStaff', role: 'monitor' })).toEqual({
      ok: false,
      reason: 'noStaffToFire',
    })
    expect(game.dispatch({ type: 'hireStaff', role: 'monitor' })).toEqual({
      ok: true,
      event: { type: 'staffChanged', role: 'monitor', count: 1 },
    })
    ok(game, { type: 'hireStaff', role: 'monitor' })
    expect(game.state.club.staff.monitor).toBe(2)
    expect(game.dispatch({ type: 'fireStaff', role: 'monitor' })).toEqual({
      ok: true,
      event: { type: 'staffChanged', role: 'monitor', count: 1 },
    })
    ok(game, { type: 'fireStaff', role: 'monitor' })
    expect(game.state.club.staff.monitor).toBe(0)
    expect(game.dispatch({ type: 'fireStaff', role: 'monitor' }).ok).toBe(false)
    expect(events.filter((e) => e.type === 'staffChanged')).toHaveLength(4)
    // Contratar no cuesta nada en el momento (los sueldos van los lunes)
    expect(game.state.money).toBe(MONEY)
    expect(game.state.ledger).toHaveLength(0)
  })

  it('weeklyWages: Σ personas × sueldo', () => {
    const game = newGame([...hire('gardener', 2), ...hire('cleaner'), ...hire('maintenance', 3)])
    expect(weeklyWages(game.state, CONTENT)).toBe(2 * 250 + 200 + 3 * 300)
    ok(game, { type: 'hireStaff', role: 'monitor' })
    expect(weeklyWages(game.state, CONTENT)).toBe(2 * 250 + 200 + 3 * 300 + 150)
  })

  it('el lunes se anota el concepto wages con el total negativo', () => {
    const game = newGame([...hire('gardener', 2), ...hire('monitor')])
    const monday = START + 7 * DAY - HOUR
    const outcome = fire(game, monday, ECONOMY_EVENT.weeklyAccounts)
    const wages = outcome.entries.filter((e) => e.concept === 'wages')
    expect(wages).toEqual([{ at: monday, concept: 'wages', amount: -650 }])
  })

  it('sin plantilla el lunes no anota sueldos', () => {
    const game = newGame()
    const outcome = fire(game, START + 7 * DAY - HOUR, ECONOMY_EVENT.weeklyAccounts)
    expect(outcome.entries.some((e) => e.concept === 'wages')).toBe(false)
  })
})

describe('estado del campo', () => {
  it('un campo nuevo empieza en startCondition', () => {
    const game = newGame([place('field', 5, 6)])
    expect(game.state.buildings[1]!.condition).toBe(50)
    ok(game, place('field', 10, 10))
    expect(game.state.buildings[2]!.condition).toBe(50)
    // Los objetos no tienen estado de campo
    ok(game, place('small', 1, 1))
    expect(game.state.buildings[3]!.condition).toBeUndefined()
  })

  it('el máximo depende de la superficie y mejorarla deja el campo al máximo', () => {
    const game = newGame([place('field', 5, 6)])
    const building = () => game.state.buildings[1]!
    expect(pitchMaxCondition(CONTENT, FIELD_DEF, 0)).toBe(60)
    expect(pitchMaxCondition(CONTENT, FIELD_DEF, 1)).toBe(90)
    // Sin dato para la superficie (piedra), 100
    expect(pitchMaxCondition(CONTENT, FIELD_DEF, 2)).toBe(100)
    ok(game, { type: 'upgradeBuilding', buildingId: 1 })
    expect(building().condition).toBe(90)
    // Un campo viejo sin dato se considera al máximo
    mutable(game).buildings[1] = { ...building(), condition: undefined }
    expect(pitchCondition(CONTENT, FIELD_DEF, building())).toBe(90)
  })

  it('cada noche recupera dailyRecovery × cobertura sin pasar del máximo', () => {
    const game = newGame([place('field', 5, 6), ...hire('gardener', 2)])
    expect(nightlyPitchCare(mutable(game), CONTENT)).toBe(true)
    expect(condition(game)).toBe(54)
    nightlyPitchCare(mutable(game), CONTENT)
    expect(condition(game)).toBe(58)
    nightlyPitchCare(mutable(game), CONTENT)
    expect(condition(game)).toBe(60) // tope de la tierra
    // Ya al máximo: nada cambia
    expect(nightlyPitchCare(mutable(game), CONTENT)).toBe(false)
    expect(condition(game)).toBe(60)
  })

  it('con cobertura parcial recupera proporcionalmente', () => {
    const game = newGame([place('field', 5, 6), ...hire('gardener')]) // cobertura 0,5
    nightlyPitchCare(mutable(game), CONTENT)
    expect(condition(game)).toBe(52)
  })

  it('con lluvia resta el desgaste de lluvia y suma la recuperación', () => {
    const game = newGame([place('field', 5, 6), ...hire('gardener', 2)])
    mutable(game).clock.weather = 'rain'
    nightlyPitchCare(mutable(game), CONTENT)
    expect(condition(game)).toBe(50 - 2 + 4)
  })

  it('sin jardinero no se recupera, y con lluvia baja', () => {
    const game = newGame([place('field', 5, 6)])
    expect(nightlyPitchCare(mutable(game), CONTENT)).toBe(false)
    expect(condition(game)).toBe(50)
    mutable(game).clock.weather = 'rain'
    expect(nightlyPitchCare(mutable(game), CONTENT)).toBe(true)
    expect(condition(game)).toBe(48)
  })

  it('nunca baja de 0', () => {
    const game = newGame([place('field', 5, 6)])
    setCondition(game, 1, 1)
    mutable(game).clock.weather = 'rain'
    nightlyPitchCare(mutable(game), CONTENT)
    expect(condition(game)).toBe(0)
    nightlyPitchCare(mutable(game), CONTENT)
    expect(condition(game)).toBe(0)
    wearFromRental(mutable(game), CONTENT, game.state.buildings[1]!)
    expect(condition(game)).toBe(0)
  })

  it('un día de alquiler resta el desgaste de alquiler y cobra', () => {
    const game = newGame([place('field', 5, 6), rentOn(1)])
    const outcome = fire(game, TUESDAY_21, ECONOMY_EVENT.rentalDaily)
    expect(outcome.entries).toHaveLength(1)
    expect(outcome.entries[0]).toMatchObject({ concept: 'pitchRental', amount: 30 })
    expect(outcome.pitchesChanged).toBe(true)
    expect(condition(game)).toBe(49)
  })

  it('un campo sin alquilar no se desgasta', () => {
    const game = newGame([place('field', 5, 6)])
    const outcome = fire(game, TUESDAY_21, ECONOMY_EVENT.rentalDaily)
    expect(outcome.pitchesChanged).toBe(false)
    expect(condition(game)).toBe(50)
  })

  it('pitchNightly en el calendario hace el cuidado nocturno', () => {
    const game = newGame([place('field', 5, 6), ...hire('gardener', 2)])
    const outcome = fire(game, START + 14 * HOUR, ECONOMY_EVENT.pitchNightly)
    expect(outcome.entries).toHaveLength(0)
    expect(outcome.pitchesChanged).toBe(true)
    expect(condition(game)).toBe(54)
  })
})

describe('reparar el césped', () => {
  it('cuesta casillas × tarifa de su superficie y se anota como repairs', () => {
    const game = newGame([place('field', 5, 6)])
    setCondition(game, 1, 10)
    expect(pitchRepairCost(CONTENT, FIELD_DEF, game.state.buildings[1]!)).toBe(6) // 12 × 0,5
    const events = collect(game)
    ok(game, { type: 'repairPitch', buildingId: 1 })
    expect(game.state.money).toBe(MONEY - 6)
    expect(game.state.ledger).toEqual([
      { at: START, concept: 'repairs', amount: -6, rect: rect(5, 6, 4, 3) },
    ])
    expect(events.some((e) => e.type === 'pitchesChanged')).toBe(true)
  })

  it('con césped la tarifa es la de su superficie', () => {
    const game = newGame([place('field', 5, 6), { type: 'upgradeBuilding', buildingId: 1 }])
    expect(pitchRepairCost(CONTENT, FIELD_DEF, game.state.buildings[1]!)).toBe(12)
  })

  it('deja el estado al máximo y el campo en descanso repairRestDays días', () => {
    const game = newGame([place('field', 5, 6)])
    setCondition(game, 1, 10)
    ok(game, { type: 'repairPitch', buildingId: 1 })
    const building = game.state.buildings[1]!
    expect(building.condition).toBe(60)
    expect(building.restUntil).toBe(START + 3 * DAY)
    expect(pitchResting(game.state, building)).toBe(true)
    mutable(game).clock.time = START + 3 * DAY
    expect(pitchResting(game.state, building)).toBe(false)
  })

  it('en descanso el alquiler no cobra ni desgasta; al acabar vuelve a alquilarse', () => {
    const game = newGame([place('field', 5, 6), rentOn(1)])
    setCondition(game, 1, 10)
    ok(game, { type: 'repairPitch', buildingId: 1 })
    // Lunes 21:00, martes 21:00 y miércoles 21:00 descansa; el jueves 21:00 ya no
    game.advance(3 * DAY)
    expect(countOf(game, 'pitchRental')).toBe(0)
    expect(condition(game)).toBe(60)
    game.advance(DAY)
    expect(countOf(game, 'pitchRental')).toBe(1)
    expect(sumOf(game, 'pitchRental')).toBe(30)
    expect(condition(game)).toBe(59)
  })

  it('sin fondos → notEnoughMoney y nada cambia', () => {
    const game = newGame([place('field', 5, 6)], { money: 5 })
    setCondition(game, 1, 10)
    const before = game.state.buildings[1]!
    expect(game.dispatch({ type: 'repairPitch', buildingId: 1 })).toEqual({
      ok: false,
      reason: 'notEnoughMoney',
    })
    expect(game.state.buildings[1]).toBe(before)
    expect(game.state.money).toBe(5)
    expect(game.state.ledger).toHaveLength(0)
  })

  it('repararlo con dinero justo sí funciona', () => {
    const game = newGame([place('field', 5, 6)], { money: 6 })
    ok(game, { type: 'repairPitch', buildingId: 1 })
    expect(game.state.money).toBe(0)
  })

  it('algo que no es un campo → notAPitch; inexistente → buildingNotFound', () => {
    const game = newGame([place('small', 1, 1)])
    expect(game.dispatch({ type: 'repairPitch', buildingId: 1 })).toEqual({
      ok: false,
      reason: 'notAPitch',
    })
    expect(game.dispatch({ type: 'repairPitch', buildingId: 9 })).toEqual({
      ok: false,
      reason: 'buildingNotFound',
    })
  })
})

describe('averías', () => {
  /** Rejilla de 18×20 = 360 objetos pequeños (10 € cada uno). */
  const manyObjects = (): Command[] => {
    const commands: Command[] = []
    for (let x = 0; x < 18; x++) for (let y = 0; y < 20; y++) commands.push(place('small', x, y))
    return commands
  }

  const brokenIds = (game: Game) =>
    Object.values(game.state.buildings)
      .filter((b) => b.broken)
      .map((b) => b.id)

  it('con cobertura de mantenimiento 1 nunca se rompe nada', () => {
    const game = newGame([...manyObjects(), ...hire('maintenance', 40)])
    expect(staffCoverage(game.state, CONTENT, 'maintenance').coverage).toBe(1)
    for (let week = 0; week < 10; week++) expect(rollBreakdowns(mutable(game), CONTENT)).toEqual([])
    expect(brokenIds(game)).toEqual([])
  })

  it('sin objetos no hay nada que romper', () => {
    const game = newGame([place('field', 5, 6)])
    expect(rollBreakdowns(mutable(game), CONTENT)).toEqual([])
  })

  it('sin mantenimiento se rompe aproximadamente un 5 % por semana', () => {
    const game = newGame(manyObjects())
    let total = 0
    for (let week = 0; week < 4; week++) {
      const before = brokenIds(game).length
      const broken = rollBreakdowns(mutable(game), CONTENT)
      total += broken.length
      expect(brokenIds(game).length).toBe(before + broken.length)
      expect(broken.every((b) => b.broken)).toBe(true)
    }
    // Esperado: 360 × (1 − 0,95⁴) ≈ 67
    expect(total).toBeGreaterThan(40)
    expect(total).toBeLessThan(95)
    expect(brokenIds(game)).toHaveLength(total)
  })

  it('con la misma semilla se rompen exactamente los mismos objetos', () => {
    const run = (seed: number) => {
      const game = newGame(manyObjects(), { seed })
      for (let week = 0; week < 3; week++) rollBreakdowns(mutable(game), CONTENT)
      return brokenIds(game)
    }
    expect(run(7)).toEqual(run(7))
    expect(run(7).length).toBeGreaterThan(0)
    expect(run(7)).not.toEqual(run(8))
  })

  it('un objeto roto no vuelve a romperse (no sale otra vez en la lista)', () => {
    const game = newGame(manyObjects())
    const first = rollBreakdowns(mutable(game), CONTENT).map((b) => b.id)
    for (let week = 0; week < 5; week++) {
      const again = rollBreakdowns(mutable(game), CONTENT).map((b) => b.id)
      for (const id of again) expect(first).not.toContain(id)
      first.push(...again)
    }
    expect(new Set(first).size).toBe(first.length)
  })

  it('los campos y las gradas nunca se rompen', () => {
    const game = newGame([
      place('field', 5, 6),
      { type: 'placeStand', buildingType: 'stand', pitchId: 1, slot: 'north' },
      place('field', 10, 12),
      place('small', 0, 0),
    ])
    const state = mutable(game)
    // Fuerza la probabilidad máxima: ningún objeto se libra salvo campos y gradas
    const content: SimContent = {
      ...CONTENT,
      economy: { ...ECONOMY, breakdown: { weeklyChance: 1, repairRate: 0.25 } },
    }
    const broken = rollBreakdowns(state, content)
    expect(broken.map((b) => b.type)).toEqual(['small'])
    for (const id of [1, 2, 3]) expect(game.state.buildings[id]!.broken).toBeFalsy()
  })

  it('un objeto roto no cuenta en su sala: deja de estar completa, y broken lo cuenta', () => {
    const game = newGame([
      { type: 'buildFoundation', rect: rect(0, 0, 10, 8), wall: 'brick', floor: 'dirt' },
      { type: 'placeDoor', tile: { x: 4, y: 0 }, door: 'door' },
      place('small', 3, 3),
      { type: 'designateRoom', tile: { x: 3, y: 3 }, roomType: 'kit' },
    ])
    const roomId = Number(Object.keys(game.state.rooms)[0])
    const before = evaluateRoom(game.state, CONTENT, roomId)!
    expect(before.ok).toBe(true)
    expect(before.broken).toBe(0)
    expect(before.quality).toBeGreaterThan(0)

    const state = mutable(game)
    state.buildings[1] = { ...state.buildings[1]!, broken: true }
    const broken = evaluateRoom(game.state, CONTENT, roomId)!
    expect(broken.ok).toBe(false)
    expect(broken.broken).toBe(1)
    expect(broken.quality).toBe(0)
    expect(broken.objects['small'] ?? 0).toBe(0)
    expect(broken.missing.length).toBeGreaterThan(0)

    // Repararlo: cuesta el 25 % de su valor (2,5 € → se anota redondeado a 2)
    expect(buildingRepairCost(CONTENT, CATALOG['small']!, state.buildings[1]!)).toBe(2.5)
    const events = collect(game)
    ok(game, { type: 'repairBuilding', buildingId: 1 })
    expect(game.state.buildings[1]!.broken).toBe(false)
    expect(sumOf(game, 'repairs')).toBe(-2)
    expect(countOf(game, 'repairs')).toBe(1)
    expect(events.some((e) => e.type === 'buildingRepaired')).toBe(true)
    const fixed = evaluateRoom(game.state, CONTENT, roomId)!
    expect(fixed.ok).toBe(true)
    expect(fixed.broken).toBe(0)
    expect(fixed.quality).toBe(before.quality)
  })

  it('repairBuilding cuesta el 25 % del valor con mejoras y lo anota como repairs', () => {
    const game = newGame([place('costly', 0, 0), place('tiered', 3, 0)])
    const state = mutable(game)
    state.buildings[1] = { ...state.buildings[1]!, broken: true }
    expect(buildingRepairCost(CONTENT, CATALOG['costly']!, state.buildings[1]!)).toBe(125)
    ok(game, { type: 'repairBuilding', buildingId: 1 })
    expect(game.state.money).toBe(MONEY - 125)
    expect(game.state.ledger[0]).toMatchObject({ concept: 'repairs', amount: -125 })
    // Mejorado dos veces: 10 + 30 + 80 = 120 → 30
    ok(game, { type: 'upgradeBuilding', buildingId: 2 })
    ok(game, { type: 'upgradeBuilding', buildingId: 2 })
    state.buildings[2] = { ...state.buildings[2]!, broken: true }
    expect(buildingRepairCost(CONTENT, CATALOG['tiered']!, state.buildings[2]!)).toBe(30)
  })

  it('reparar algo no roto → notBroken; inexistente → buildingNotFound; sin fondos → notEnoughMoney', () => {
    const game = newGame([place('costly', 0, 0)], { money: 100 })
    expect(game.dispatch({ type: 'repairBuilding', buildingId: 1 })).toEqual({
      ok: false,
      reason: 'notBroken',
    })
    expect(game.dispatch({ type: 'repairBuilding', buildingId: 9 })).toEqual({
      ok: false,
      reason: 'buildingNotFound',
    })
    const state = mutable(game)
    state.buildings[1] = { ...state.buildings[1]!, broken: true }
    expect(game.dispatch({ type: 'repairBuilding', buildingId: 1 })).toEqual({
      ok: false,
      reason: 'notEnoughMoney',
    })
    expect(game.state.buildings[1]!.broken).toBe(true)
    expect(game.state.money).toBe(100)
  })

  it('el lunes de cuentas tira las averías y devuelve los rotos', () => {
    const game = newGame(manyObjects())
    const monday = START + 7 * DAY - HOUR
    const outcome = fire(game, monday, ECONOMY_EVENT.weeklyAccounts)
    expect(outcome.broken?.length).toBeGreaterThan(0)
    expect(outcome.broken!.map((b) => b.id)).toEqual(brokenIds(game))
  })
})

describe('partida completa de dos semanas', () => {
  const scenario: Command[] = [
    place('field', 5, 10), // id 1, 12 casillas
    rentOn(1),
    place('costly', 12, 0), // id 2
    ...hire('gardener', 2), // cobertura 1
    ...hire('monitor'),
    ...hire('cleaner'),
  ]

  it('sueldos, alquiler y estado del campo cuadran con las fórmulas', () => {
    const game = newGame(scenario)
    const events = collect(game)
    // Primer día: alquiler 21:00 (49) y cuidado 23:00 (+4 → 53)
    game.advance(15 * HOUR)
    expect(condition(game)).toBe(53)
    game.advance(14 * DAY - 15 * HOUR)

    // Dos lunes de cuentas (días 7 y 14, 08:00): 2×250 + 150 + 200 = 850 cada uno
    expect(countOf(game, 'wages')).toBe(2)
    expect(sumOf(game, 'wages')).toBe(-2 * 850)
    // Alquiler: 14 días menos 2 domingos, sin días de descanso
    expect(countOf(game, 'pitchRental')).toBe(12)
    expect(sumOf(game, 'pitchRental')).toBe(12 * 30)
    // El césped se recupera cada noche y acaba al tope de la tierra
    expect(condition(game)).toBe(60)
    // Sin reparaciones
    expect(countOf(game, 'repairs')).toBe(0)

    // Libro y saldo coherentes
    expect(game.state.money).toBe(
      MONEY + game.state.ledger.reduce((sum, entry) => sum + entry.amount, 0),
    )
    expect(events.filter((e) => e.type === 'pitchesChanged').length).toBeGreaterThan(0)
  })

  it('con mantenimiento suficiente el lunes no emite buildingsBroken', () => {
    const game = newGame([...scenario, ...hire('maintenance', 10)])
    const events = collect(game)
    game.advance(14 * DAY)
    expect(events.some((e) => e.type === 'buildingsBroken')).toBe(false)
    expect(game.state.buildings[2]!.broken).toBeFalsy()
  })

  it('sin mantenimiento y con muchos objetos, buildingsBroken se emite el lunes con los rotos', () => {
    const objects: Command[] = []
    for (let x = 0; x < 18; x++) for (let y = 0; y < 10; y++) objects.push(place('small', x, y))
    const game = newGame(objects)
    const events = collect(game)
    game.advance(7 * DAY - 2 * HOUR) // aún antes del lunes 08:00
    expect(events.some((e) => e.type === 'buildingsBroken')).toBe(false)
    game.advance(2 * HOUR)
    const broken = events.flatMap((e) => (e.type === 'buildingsBroken' ? [e.buildings] : []))
    expect(broken).toHaveLength(1)
    expect(broken[0]!.length).toBeGreaterThan(0)
    const ids = Object.values(game.state.buildings)
      .filter((b) => b.broken)
      .map((b) => b.id)
    expect(broken[0]!.map((b) => b.id)).toEqual(ids)
  })

  it('pitchesChanged se emite con el cuidado nocturno y no sin campos', () => {
    const withField = newGame([place('field', 5, 6), ...hire('gardener', 2)])
    const events = collect(withField)
    withField.advance(13 * HOUR) // hasta las 22:00
    expect(events.some((e) => e.type === 'pitchesChanged')).toBe(false)
    withField.advance(HOUR) // 23:00
    expect(events.some((e) => e.type === 'pitchesChanged')).toBe(true)

    const empty = newGame()
    const emptyEvents = collect(empty)
    empty.advance(2 * DAY)
    expect(emptyEvents.some((e) => e.type === 'pitchesChanged')).toBe(false)
  })

  it('la misma semilla da el mismo libro y los mismos objetos rotos', () => {
    const run = () => {
      const objects: Command[] = []
      for (let x = 0; x < 18; x++) for (let y = 0; y < 5; y++) objects.push(place('small', x, y))
      const game = newGame([...scenario, ...objects], { seed: 42 })
      game.advance(14 * DAY)
      return game
    }
    const a = run()
    const b = run()
    expect(b.state.ledger).toEqual(a.state.ledger)
    expect(b.state.buildings).toEqual(a.state.buildings)
  })
})
