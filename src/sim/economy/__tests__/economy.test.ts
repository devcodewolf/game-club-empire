/** Tests de la economía: precios, libro de cuentas, bloqueo sin fondos, deshacer e inicio de partida. */
import { describe, expect, it } from 'vitest'
import type { Command, GameEvent } from '../../commands'
import { createGame, type Game, type GameOptions } from '../../game'
import type { TileCoord, TileRect } from '../../geometry'
import { DEFAULT_FLOOR } from '../../map/floors'
import { buildingValue, commandPrice } from '../pricing'
import { record, type LedgerHolder } from '../ledger'
import { TEST_CATALOG, TEST_CONTENT, TEST_ECONOMY, TEST_MAP_CONFIG } from '../../__tests__/fixtures'

const START = TEST_ECONOMY.startMoney

function newGame(options: GameOptions = {}): Game {
  return createGame(TEST_MAP_CONFIG, TEST_CONTENT, options)
}

/** Despacha un comando que debe salir bien. */
function ok(game: Game, command: Command) {
  const result = game.dispatch(command)
  if (!result.ok) throw new Error(`falló ${command.type}: ${result.reason}`)
  return result
}

const place = (type: string, origin: TileCoord): Command => ({
  type: 'placeBuilding',
  buildingType: type,
  origin,
  rotation: 0,
})
const upgrade = (buildingId: number): Command => ({ type: 'upgradeBuilding', buildingId })
const stand = (pitchId: number, slot: 'north' | 'south' | 'east' | 'west'): Command => ({
  type: 'placeStand',
  buildingType: 'stand',
  pitchId,
  slot,
})
const paint = (area: TileRect, floor: string): Command => ({
  type: 'paintFloor',
  rect: area,
  floor,
})
const walls = (area: TileRect, wall: string): Command => ({ type: 'buildWalls', rect: area, wall })
const foundation = (area: TileRect): Command => ({
  type: 'buildFoundation',
  rect: area,
  wall: 'brick',
  floor: 'dirt',
})
const rect = (x: number, y: number, width: number, height: number): TileRect => ({
  x,
  y,
  width,
  height,
})
const lastEntry = (game: Game) => game.state.ledger[game.state.ledger.length - 1]!

/** Dinero gastado hasta ahora (positivo = gasto neto). */
const spent = (game: Game, money = START) => money - game.state.money

/** Saldo inicial más la suma de las entradas del libro. */
const ledgerBalance = (game: Game, money = START) =>
  money + game.state.ledger.reduce((sum, e) => sum + e.amount, 0)

/** Copia de lo construido para comparar antes/después. */
function built(game: Game) {
  const s = game.state
  return structuredClone({
    floors: s.floors,
    walls: s.walls,
    doors: s.doors,
    indoor: s.indoor,
    roomOf: s.roomOf,
    occupancy: s.occupancy,
    rooms: s.rooms,
    buildings: s.buildings,
  })
}

function collect(game: Game): GameEvent[] {
  const events: GameEvent[] = []
  game.subscribe((e) => events.push(e))
  return events
}

describe('record', () => {
  const holder = (): LedgerHolder => ({ money: 100, ledger: [], clock: { time: 42 } })

  it('anota la entrada, redondea y actualiza el saldo', () => {
    const h = holder()
    const entry = record(h, 'construction', -12.5, rect(1, 1, 2, 2))
    expect(entry).toEqual({ at: 42, concept: 'construction', amount: -12, rect: rect(1, 1, 2, 2) })
    expect(h.money).toBe(88)
    expect(h.ledger).toHaveLength(1)
  })

  it('un importe 0 no anota nada', () => {
    const h = holder()
    expect(record(h, 'demolish', 0)).toBeNull()
    expect(record(h, 'demolish', 0.4)).toBeNull()
    expect(h.ledger).toHaveLength(0)
    expect(h.money).toBe(100)
  })
})

describe('buildingValue', () => {
  it('sin niveles, su coste', () => {
    const def = TEST_CATALOG['small']!
    const building = { id: 1, type: 'small', origin: { x: 0, y: 0 }, rotation: 0 as const, tier: 0 }
    expect(buildingValue(def, building)).toBe(10)
  })

  it('con niveles, la suma de todos los niveles alcanzados', () => {
    const def = TEST_CATALOG['tiered']!
    const at = (tier: number) =>
      buildingValue(def, { id: 1, type: 'tiered', origin: { x: 0, y: 0 }, rotation: 0, tier })
    expect(at(0)).toBe(10)
    expect(at(1)).toBe(40)
    expect(at(2)).toBe(120)
  })
})

describe('precios de obra', () => {
  it('colocar un objeto cobra su coste (nivel 1)', () => {
    const game = newGame()
    ok(game, place('wide', { x: 0, y: 0 }))
    expect(spent(game)).toBe(20)
    ok(game, place('tiered', { x: 5, y: 5 }))
    expect(spent(game)).toBe(30)
    ok(game, place('field', { x: 8, y: 8 }))
    expect(spent(game)).toBe(80)
  })

  it('pintar suelo cobra las casillas que cambian', () => {
    const game = newGame()
    ok(game, paint(rect(0, 0, 3, 2), 'dirt'))
    expect(spent(game)).toBe(6 * 2)
    // Repetir el mismo suelo no cuesta ni anota nada
    const entries = game.state.ledger.length
    expect(game.dispatch(paint(rect(0, 0, 3, 2), 'dirt'))).toEqual({
      ok: false,
      reason: 'nothingToPaint',
    })
    expect(spent(game)).toBe(12)
    expect(game.state.ledger).toHaveLength(entries)
    // Solo cambian las 3 casillas nuevas: las 6 anteriores ya eran tierra
    ok(game, paint(rect(0, 0, 3, 3), 'dirt'))
    expect(spent(game)).toBe(12 + 3 * 2)
    // Cambiar a piedra cobra la piedra de cada casilla
    ok(game, paint(rect(0, 0, 2, 1), 'stone'))
    expect(spent(game)).toBe(18 + 2 * 5)
  })

  it('las casillas reservadas no cuentan en el precio del suelo', () => {
    const game = newGame()
    // x=17 libre; x=18 y 19 son carretera reservada
    const price = commandPrice(game.state, TEST_CONTENT, paint(rect(17, 0, 3, 1), 'dirt'))
    expect(price.cost).toBe(2)
  })

  it('muros: por casilla que cambia', () => {
    const game = newGame()
    ok(game, walls(rect(0, 0, 4, 1), 'fence'))
    expect(spent(game)).toBe(16)
    // Dos casillas ya tenían valla: solo se cobran las 2 nuevas
    ok(game, walls(rect(2, 0, 4, 1), 'fence'))
    expect(spent(game)).toBe(16 + 2 * 4)
  })

  it('cimientos: suelo + muros del perímetro', () => {
    const game = newGame()
    // 6x5 = 30 casillas de suelo (2 €) y 18 de perímetro (15 €)
    ok(game, foundation(rect(2, 2, 6, 5)))
    expect(spent(game)).toBe(30 * 2 + 18 * 15)
  })

  it('cimientos sobre suelo y muros ya existentes: solo lo que cambia', () => {
    const game = newGame()
    ok(game, paint(rect(2, 2, 6, 5), 'dirt'))
    ok(game, walls(rect(2, 2, 6, 1), 'brick'))
    const before = spent(game)
    expect(before).toBe(30 * 2 + 6 * 15)
    ok(game, foundation(rect(2, 2, 6, 5)))
    // suelo ya tierra: 0; perímetro: 18 - 6 ya de ladrillo = 12 muros
    expect(spent(game) - before).toBe(12 * 15)
  })

  it('puerta: su coste', () => {
    const game = newGame()
    ok(game, foundation(rect(2, 2, 4, 4)))
    const before = spent(game)
    ok(game, { type: 'placeDoor', tile: { x: 3, y: 2 }, door: 'door' })
    expect(spent(game) - before).toBe(150)
  })

  it('mejorar cobra el coste del nivel siguiente', () => {
    const game = newGame()
    ok(game, place('tiered', { x: 1, y: 1 }))
    expect(spent(game)).toBe(10)
    ok(game, upgrade(1))
    expect(spent(game)).toBe(10 + 30)
    ok(game, upgrade(1))
    expect(spent(game)).toBe(10 + 30 + 80)
  })

  it('colocar una grada cobra su nivel 1', () => {
    const game = newGame()
    ok(game, place('field', { x: 5, y: 5 }))
    const before = spent(game)
    ok(game, stand(1, 'north'))
    expect(spent(game) - before).toBe(100)
  })

  it('un comando que falla no cobra nada', () => {
    const game = newGame()
    expect(game.dispatch(place('small', { x: 25, y: 25 })).ok).toBe(false)
    expect(game.state.money).toBe(START)
    expect(game.state.ledger).toHaveLength(0)
  })
})

describe('mover', () => {
  it('mover un objeto es gratis', () => {
    const game = newGame()
    ok(game, place('tiered', { x: 1, y: 1 }))
    ok(game, upgrade(1))
    const money = game.state.money
    const entries = game.state.ledger.length
    ok(game, { type: 'moveBuilding', buildingId: 1, origin: { x: 6, y: 6 }, rotation: 0 })
    expect(game.state.money).toBe(money)
    expect(game.state.ledger).toHaveLength(entries)
  })

  it('mover un campo cuesta el 10 % del campo y sus gradas (con mejoras)', () => {
    const game = newGame()
    ok(game, place('field', { x: 5, y: 5 }))
    ok(game, upgrade(1)) // campo nivel 2: 50 + 100
    ok(game, stand(1, 'north'))
    ok(game, upgrade(2)) // grada nivel 2: 100 + 200
    const money = game.state.money
    ok(game, { type: 'moveBuilding', buildingId: 1, origin: { x: 5, y: 12 }, rotation: 0 })
    // (150 + 300) * 0.1 = 45
    expect(money - game.state.money).toBe(45)
    expect(lastEntry(game)).toMatchObject({ concept: 'move', amount: -45 })
  })

  it('mover un bloque cuesta el 10 % de lo que lleva', () => {
    const game = newGame()
    const block = rect(2, 2, 4, 3)
    ok(game, paint(block, 'stone')) // 12 * 5 = 60
    ok(game, place('small', { x: 2, y: 2 })) // 10
    ok(game, place('tiered', { x: 3, y: 2 })) // 10
    ok(game, upgrade(2)) // +30 => 40
    ok(game, walls(rect(2, 4, 4, 1), 'fence')) // 4 * 4 = 16
    const money = game.state.money
    ok(game, { type: 'moveBlock', rect: block, to: { x: 2, y: 10 }, rotation: 0 })
    // (60 + 16 + 10 + 40) * 0.1 = 12,6 -> 13
    expect(money - game.state.money).toBe(13)
    expect(lastEntry(game).concept).toBe('move')
  })

  it('mover un bloque con puerta incluye el valor de la puerta', () => {
    const game = newGame()
    const block = rect(2, 2, 4, 4)
    ok(game, foundation(block))
    const noDoor = commandPrice(game.state, TEST_CONTENT, {
      type: 'moveBlock',
      rect: block,
      to: { x: 2, y: 10 },
      rotation: 0,
    })
    expect(noDoor.cost).toBeCloseTo((16 * 2 + 12 * 15) * 0.1)
    ok(game, { type: 'placeDoor', tile: { x: 3, y: 2 }, door: 'door' })
    const withDoor = commandPrice(game.state, TEST_CONTENT, {
      type: 'moveBlock',
      rect: block,
      to: { x: 2, y: 10 },
      rotation: 0,
    })
    expect(withDoor.concept).toBe('move')
    // La puerta sustituye al muro de su casilla: (150 - 15) * 0.1
    expect(withDoor.cost - noDoor.cost).toBeCloseTo(13.5)
  })
})

describe('demoler', () => {
  it('un objeto devuelve el 50 % de su valor con mejoras', () => {
    const game = newGame()
    ok(game, place('tiered', { x: 1, y: 1 }))
    ok(game, upgrade(1))
    ok(game, upgrade(1)) // valor 120
    const money = game.state.money
    ok(game, { type: 'demolishBuilding', buildingId: 1 })
    expect(game.state.money - money).toBe(60)
    expect(lastEntry(game)).toMatchObject({ concept: 'demolish', amount: 60 })
  })

  it('un objeto sin niveles devuelve la mitad de su coste (demolishAt)', () => {
    const game = newGame()
    ok(game, place('wide', { x: 1, y: 1 }))
    const money = game.state.money
    ok(game, { type: 'demolishAt', tile: { x: 1, y: 1 } })
    expect(game.state.money - money).toBe(10)
  })

  it('un campo devuelve el 25 % suyo y el 25 % de sus gradas', () => {
    const game = newGame()
    ok(game, place('field', { x: 5, y: 5 }))
    ok(game, stand(1, 'north'))
    ok(game, upgrade(2)) // grada: 100 + 200
    ok(game, upgrade(1)) // campo: 50 + 100
    const money = game.state.money
    ok(game, { type: 'demolishBuilding', buildingId: 1 })
    // (150 + 300) * 0.25 = 112,5 -> 113
    expect(game.state.money - money).toBe(113)
    expect(Object.keys(game.state.buildings)).toHaveLength(0)
  })

  it('un muro, una puerta y un suelo (demolishAt) devuelven el 25 %', () => {
    const game = newGame()
    ok(game, foundation(rect(2, 2, 4, 4)))
    ok(game, { type: 'placeDoor', tile: { x: 3, y: 2 }, door: 'door' })
    ok(game, paint(rect(10, 10, 1, 1), 'stone'))

    const refundOf = (tile: TileCoord) => {
      const before = game.state.money
      ok(game, { type: 'demolishAt', tile })
      return game.state.money - before
    }
    // Puerta: 150 * 0.25 = 37,5 -> 38
    expect(refundOf({ x: 3, y: 2 })).toBe(38)
    // Muro de ladrillo: 15 * 0.25 = 3,75 -> 4
    expect(refundOf({ x: 4, y: 2 })).toBe(4)
    // Suelo de piedra: 5 * 0.25 = 1,25 -> 1
    expect(refundOf({ x: 10, y: 10 })).toBe(1)
    expect(game.state.floors[10 * 20 + 10]).toBe(DEFAULT_FLOOR)
  })

  it('demolishArea suma objetos y casillas', () => {
    const game = newGame()
    const area = rect(0, 0, 4, 4)
    ok(game, paint(area, 'stone')) // 16 * 5 = 80
    ok(game, place('wide', { x: 0, y: 0 })) // 20
    ok(game, walls(rect(0, 3, 4, 1), 'brick')) // 4 * 15 = 60
    const money = game.state.money
    ok(game, { type: 'demolishArea', rect: area })
    // objetos: 20 * 0.5 = 10; casillas: (80 + 60) * 0.25 = 35
    expect(game.state.money - money).toBe(45)
    expect(lastEntry(game)).toMatchObject({ concept: 'demolish', rect: area })
  })

  it('demolishStructures solo devuelve muros y puertas', () => {
    const game = newGame()
    const area = rect(2, 2, 4, 4)
    ok(game, foundation(area))
    ok(game, place('small', { x: 4, y: 4 }))
    const money = game.state.money
    ok(game, { type: 'demolishStructures', rect: area })
    // 12 muros * 15 * 0.25 = 45 (sin suelo ni objeto)
    expect(game.state.money - money).toBe(45)
    expect(Object.keys(game.state.buildings)).toHaveLength(1)
    expect(game.state.floors[3 * 20 + 3]).toBe('dirt')
  })

  it('demolishStructures: exacto con muros sin puerta', () => {
    const game = newGame()
    ok(game, walls(rect(0, 0, 8, 1), 'brick'))
    const money = game.state.money
    ok(game, { type: 'demolishStructures', rect: rect(0, 0, 8, 1) })
    // 8 * 15 * 0.25 = 30
    expect(game.state.money - money).toBe(30)
  })
})

describe('libro de cuentas', () => {
  it('cada obra anota concepto, importe con signo, instante y rectángulo', () => {
    const game = newGame()
    ok(game, place('tiered', { x: 1, y: 1 }))
    game.advance(90)
    ok(game, upgrade(1))
    ok(game, place('field', { x: 8, y: 8 }))
    ok(game, { type: 'moveBuilding', buildingId: 2, origin: { x: 8, y: 12 }, rotation: 0 })
    ok(game, { type: 'demolishBuilding', buildingId: 1 })

    // Mover un campo sin gradas: (50 * 0.1) = 5
    const [construction, upgradeEntry, fieldEntry, moveEntry, demolishEntry] = game.state.ledger
    expect(game.state.ledger).toHaveLength(5)
    expect(construction).toMatchObject({
      concept: 'construction',
      amount: -10,
      rect: rect(1, 1, 1, 1),
    })
    expect(upgradeEntry).toMatchObject({ concept: 'upgrade', amount: -30, rect: rect(1, 1, 1, 1) })
    expect(upgradeEntry!.at - construction!.at).toBe(90)
    expect(fieldEntry).toMatchObject({
      concept: 'construction',
      amount: -50,
      rect: rect(8, 8, 4, 3),
    })
    expect(moveEntry).toMatchObject({ concept: 'move', amount: -5, rect: rect(8, 12, 4, 3) })
    // El objeto mejorado (valor 40) devuelve 20
    expect(demolishEntry).toMatchObject({ concept: 'demolish', amount: 20 })
    expect(demolishEntry!.at).toBe(game.state.clock.time)
  })

  it('el saldo cuadra con el dinero inicial más las entradas', () => {
    const game = newGame()
    ok(game, foundation(rect(2, 2, 6, 5)))
    ok(game, place('field', { x: 10, y: 10 }))
    ok(game, stand(1, 'north'))
    ok(game, paint(rect(0, 10, 3, 3), 'stone'))
    ok(game, { type: 'demolishArea', rect: rect(0, 10, 3, 3) })
    ok(game, { type: 'demolishBuilding', buildingId: 2 })
    expect(game.state.money).toBe(ledgerBalance(game))
    expect(game.state.ledger.length).toBeGreaterThan(4)
  })

  it('el saldo cuadra con un dinero inicial propio', () => {
    const game = newGame({ money: 500 })
    ok(game, place('wide', { x: 0, y: 0 }))
    ok(game, place('small', { x: 5, y: 5 }))
    expect(game.state.money).toBe(470)
    expect(game.state.money).toBe(ledgerBalance(game, 500))
  })

  it('los comandos gratis no anotan nada', () => {
    const game = newGame()
    ok(game, foundation(rect(2, 2, 4, 4)))
    ok(game, place('small', { x: 3, y: 3 }))
    const entries = game.state.ledger.length
    const money = game.state.money
    const events = collect(game)

    ok(game, { type: 'designateRoom', tile: { x: 3, y: 3 }, roomType: 'kit' })
    ok(game, { type: 'moveBuilding', buildingId: 1, origin: { x: 4, y: 4 }, rotation: 0 })
    ok(game, { type: 'removeRoom', tile: { x: 4, y: 4 } })

    expect(game.state.ledger).toHaveLength(entries)
    expect(game.state.money).toBe(money)
    expect(events.some((e) => e.type === 'transaction')).toBe(false)
  })

  it('se emite un transaction por cada entrada', () => {
    const game = newGame()
    const events = collect(game)
    ok(game, place('tiered', { x: 1, y: 1 }))
    ok(game, { type: 'demolishBuilding', buildingId: 1 })
    const entries = events.flatMap((e) => (e.type === 'transaction' ? [e.entry] : []))
    expect(entries).toEqual(game.state.ledger)
    expect(entries).toHaveLength(2)
  })
})

describe('sin fondos', () => {
  it('una obra más cara que el saldo se rechaza sin tocar nada', () => {
    const game = newGame({ money: 15 })
    ok(game, place('small', { x: 0, y: 0 })) // 10 -> quedan 5
    const events = collect(game)
    const before = structuredClone(game.state)

    const result = game.dispatch(place('wide', { x: 5, y: 5 })) // 20
    expect(result).toEqual({ ok: false, reason: 'notEnoughMoney' })
    expect(game.state).toEqual(before)
    expect(events).toHaveLength(0)
  })

  it('rechaza también suelos, muros, cimientos y campos', () => {
    const game = newGame({ money: 5 })
    const events = collect(game)
    const before = structuredClone(game.state)
    const commands: Command[] = [
      paint(rect(0, 0, 3, 3), 'dirt'), // 18
      walls(rect(0, 0, 3, 1), 'fence'), // 12
      foundation(rect(2, 2, 4, 4)),
      place('field', { x: 8, y: 8 }), // 50
    ]
    for (const command of commands) {
      expect(game.dispatch(command)).toEqual({ ok: false, reason: 'notEnoughMoney' })
    }
    expect(game.state).toEqual(before)
    expect(events).toHaveLength(0)
  })

  it('rechaza puertas y gradas sin fondos', () => {
    const game = newGame({ money: 60 })
    ok(game, place('field', { x: 8, y: 8 })) // 50 -> quedan 10
    const before = structuredClone(game.state)
    expect(game.dispatch(stand(1, 'north'))).toEqual({ ok: false, reason: 'notEnoughMoney' })
    expect(game.dispatch({ type: 'placeDoor', tile: { x: 0, y: 0 }, door: 'door' })).toEqual({
      ok: false,
      reason: 'notEnoughMoney',
    })
    expect(game.state).toEqual(before)
  })

  it('con saldo justo se puede pagar y queda a cero', () => {
    const game = newGame({ money: 10 })
    ok(game, place('small', { x: 0, y: 0 }))
    expect(game.state.money).toBe(0)
  })

  it('una mejora sin fondos se rechaza', () => {
    const game = newGame({ money: 20 })
    ok(game, place('tiered', { x: 0, y: 0 })) // 10 -> quedan 10; la mejora cuesta 30
    const before = structuredClone(game.state)
    expect(game.dispatch(upgrade(1))).toEqual({ ok: false, reason: 'notEnoughMoney' })
    expect(game.state).toEqual(before)
  })

  it('un comando inválido sin dinero no falla por dinero si no cuesta nada', () => {
    const game = newGame({ money: 0 })
    const result = game.dispatch({ type: 'demolishBuilding', buildingId: 99 })
    expect(result).toEqual({ ok: false, reason: 'buildingNotFound' })
  })

  it('demoler sin dinero sí se puede', () => {
    const game = newGame({ money: 10 })
    ok(game, place('small', { x: 0, y: 0 })) // saldo 0
    expect(game.state.money).toBe(0)
    ok(game, { type: 'demolishBuilding', buildingId: 1 })
    expect(game.state.money).toBe(5)
  })
})

describe('deshacer', () => {
  it('construir y deshacer devuelve saldo y mapa', () => {
    const game = newGame()
    const mapBefore = built(game)
    ok(game, foundation(rect(2, 2, 6, 5)))
    expect(game.state.money).toBeLessThan(START)
    expect(built(game)).not.toEqual(mapBefore)

    ok(game, { type: 'undo' })
    expect(game.state.money).toBe(START)
    expect(built(game)).toEqual(mapBefore)
  })

  it('deshacer un campo devuelve objetos, ocupación y siguiente id', () => {
    const game = newGame()
    ok(game, place('small', { x: 0, y: 0 }))
    const mapBefore = built(game)
    const moneyBefore = game.state.money
    const nextId = game.state.nextBuildingId
    ok(game, place('field', { x: 5, y: 5 }))
    ok(game, { type: 'undo' })
    expect(built(game)).toEqual(mapBefore)
    expect(game.state.money).toBe(moneyBefore)
    expect(game.state.nextBuildingId).toBe(nextId)
  })

  it('deshacer una mejora devuelve el nivel anterior', () => {
    const game = newGame()
    ok(game, place('tiered', { x: 1, y: 1 }))
    ok(game, upgrade(1))
    ok(game, { type: 'undo' })
    expect(game.state.buildings[1]!.tier).toBe(0)
    expect(game.state.money).toBe(START - 10)
  })

  it('con una sala designada antes de la obra, deshacer conserva las salas', () => {
    const game = newGame()
    ok(game, foundation(rect(2, 2, 4, 4)))
    ok(game, place('small', { x: 3, y: 3 }))
    ok(game, { type: 'designateRoom', tile: { x: 3, y: 3 }, roomType: 'kit' })
    const mapBefore = built(game)
    ok(game, paint(rect(10, 10, 2, 2), 'stone'))
    ok(game, { type: 'undo' })
    expect(built(game)).toEqual(mapBefore)
    expect(Object.keys(game.state.rooms)).toHaveLength(1)
  })

  it('emite restored y un transaction con concepto undo', () => {
    const game = newGame()
    ok(game, paint(rect(1, 1, 2, 2), 'dirt'))
    const events = collect(game)
    ok(game, { type: 'undo' })

    const restored = events.find((e) => e.type === 'restored')
    if (restored?.type !== 'restored') throw new Error('sin restored')
    expect(restored.rect).toEqual(rect(1, 1, 2, 2))
    const transaction = events.find((e) => e.type === 'transaction')
    if (transaction?.type !== 'transaction') throw new Error('sin transaction')
    expect(transaction.entry).toMatchObject({ concept: 'undo', amount: 8 })
    expect(lastEntry(game).concept).toBe('undo')
  })

  it('restored informa de los objetos que salen', () => {
    const game = newGame()
    ok(game, place('wide', { x: 2, y: 2 }))
    const events = collect(game)
    ok(game, { type: 'undo' })
    const restored = events.find((e) => e.type === 'restored')
    if (restored?.type !== 'restored') throw new Error('sin restored')
    expect(restored.removed).toHaveLength(1)
    expect(restored.removed[0]!.type).toBe('wide')
    expect(restored.added).toHaveLength(0)
  })

  it('el libro cuadra tras deshacer', () => {
    const game = newGame()
    ok(game, place('small', { x: 0, y: 0 }))
    ok(game, place('wide', { x: 5, y: 5 }))
    ok(game, { type: 'undo' })
    expect(game.state.money).toBe(START - 10)
    expect(game.state.money).toBe(ledgerBalance(game))
  })

  it('canUndo: true tras una obra de pago y false tras deshacer', () => {
    const game = newGame()
    expect(game.canUndo()).toBe(false)
    ok(game, place('small', { x: 0, y: 0 }))
    expect(game.canUndo()).toBe(true)
    ok(game, { type: 'undo' })
    expect(game.canUndo()).toBe(false)
  })

  it('solo se deshace la última obra', () => {
    const game = newGame()
    ok(game, place('small', { x: 0, y: 0 }))
    ok(game, place('small', { x: 3, y: 3 }))
    ok(game, { type: 'undo' })
    // La primera ya no se puede deshacer
    expect(game.canUndo()).toBe(false)
    expect(game.dispatch({ type: 'undo' })).toEqual({ ok: false, reason: 'nothingToUndo' })
    expect(Object.keys(game.state.buildings)).toHaveLength(1)
  })

  it('una obra gratis posterior impide deshacer', () => {
    const game = newGame()
    ok(game, foundation(rect(2, 2, 4, 4)))
    ok(game, place('small', { x: 3, y: 3 }))
    expect(game.canUndo()).toBe(true)
    ok(game, { type: 'designateRoom', tile: { x: 3, y: 3 }, roomType: 'kit' })
    expect(game.canUndo()).toBe(false)
    expect(game.dispatch({ type: 'undo' })).toEqual({ ok: false, reason: 'nothingToUndo' })
  })

  it('una obra gratis (mover un objeto) no se puede deshacer', () => {
    const game = newGame()
    ok(game, place('small', { x: 0, y: 0 }))
    ok(game, { type: 'moveBuilding', buildingId: 1, origin: { x: 4, y: 4 }, rotation: 0 })
    expect(game.canUndo()).toBe(false)
  })

  it('tras demoler no se puede deshacer', () => {
    const game = newGame()
    ok(game, place('small', { x: 0, y: 0 }))
    ok(game, { type: 'demolishBuilding', buildingId: 1 })
    expect(game.canUndo()).toBe(false)
    expect(game.dispatch({ type: 'undo' })).toEqual({ ok: false, reason: 'nothingToUndo' })
  })

  it('una obra rechazada por falta de fondos no cambia lo que se puede deshacer', () => {
    const game = newGame({ money: 15 })
    ok(game, place('small', { x: 0, y: 0 }))
    expect(game.dispatch(place('wide', { x: 5, y: 5 })).ok).toBe(false)
    expect(game.canUndo()).toBe(true)
  })

  it('un comando inválido tampoco impide deshacer', () => {
    const game = newGame()
    ok(game, place('small', { x: 0, y: 0 }))
    expect(game.dispatch(place('small', { x: 0, y: 0 })).ok).toBe(false)
    expect(game.canUndo()).toBe(true)
  })

  it('deshacer sin nada → nothingToUndo, sin tocar el estado ni emitir', () => {
    const game = newGame()
    const events = collect(game)
    const before = structuredClone(game.state)
    expect(game.dispatch({ type: 'undo' })).toEqual({ ok: false, reason: 'nothingToUndo' })
    expect(game.state).toEqual(before)
    expect(events).toHaveLength(0)
  })

  it('no se puede deshacer dos veces', () => {
    const game = newGame()
    ok(game, place('small', { x: 0, y: 0 }))
    ok(game, { type: 'undo' })
    expect(game.dispatch({ type: 'undo' })).toEqual({ ok: false, reason: 'nothingToUndo' })
  })

  it('que pase el tiempo entre la obra y el deshacer no lo impide', () => {
    const game = newGame()
    const mapBefore = built(game)
    ok(game, place('wide', { x: 2, y: 2 }))
    game.advance(300)
    expect(game.canUndo()).toBe(true)
    const time = game.state.clock.time
    ok(game, { type: 'undo' })
    expect(built(game)).toEqual(mapBefore)
    expect(game.state.money).toBe(START)
    // El tiempo no retrocede y el reembolso se anota en el instante actual
    expect(game.state.clock.time).toBe(time)
    expect(lastEntry(game).at).toBe(time)
  })
})

describe('inicio de partida', () => {
  it('sin money, el saldo inicial es el de la economía', () => {
    const game = newGame()
    expect(game.state.money).toBe(TEST_CONTENT.economy.startMoney)
    expect(game.state.ledger).toHaveLength(0)
  })

  it('con money, el saldo inicial es el indicado', () => {
    expect(newGame({ money: 1234 }).state.money).toBe(1234)
  })

  it('el escenario se aplica gratis', () => {
    const game = newGame({
      scenario: [
        place('field', { x: 5, y: 5 }),
        paint(rect(0, 0, 3, 3), 'stone'),
        foundation(rect(10, 2, 4, 4)),
      ],
    })
    expect(game.state.money).toBe(START)
    expect(game.state.ledger).toHaveLength(0)
    expect(Object.keys(game.state.buildings)).toHaveLength(1)
    expect(game.state.floors[0]).toBe('stone')
    expect(game.state.walls[2 * 20 + 10]).toBe('brick')
  })

  it('el escenario es gratis aunque el dinero inicial sea 0', () => {
    const game = newGame({ money: 0, scenario: [place('field', { x: 5, y: 5 })] })
    expect(game.state.money).toBe(0)
    expect(Object.keys(game.state.buildings)).toHaveLength(1)
  })

  it('no emite eventos a quien se suscriba después y no se puede deshacer', () => {
    const game = newGame({ scenario: [place('field', { x: 5, y: 5 })] })
    const events = collect(game)
    expect(events).toHaveLength(0)
    expect(game.canUndo()).toBe(false)
    expect(game.dispatch({ type: 'undo' })).toEqual({ ok: false, reason: 'nothingToUndo' })
  })

  it('las obras posteriores al escenario sí cobran', () => {
    const game = newGame({ scenario: [place('field', { x: 5, y: 5 })] })
    ok(game, place('small', { x: 0, y: 0 }))
    expect(game.state.money).toBe(START - 10)
    expect(game.state.ledger).toHaveLength(1)
  })
})
