/** Tests de la demolición unificada: objetivo por casilla, zona y comandos. */
import { describe, expect, it } from 'vitest'
import { executeCommand, type Command } from '../../commands'
import {
  applyDemolishArea,
  applyDemolishAt,
  demolishTargetAt,
  validateDemolishArea,
} from '../demolish'
import type { TileCoord, TileRect } from '../../geometry'
import { buildingAt, tileIndex, type MapState } from '../map'
import { createTestMap, TEST_CONTENT } from '../../__tests__/fixtures'

const run = (state: MapState, command: Command) => executeCommand(state, command, TEST_CONTENT)

/** Ejecuta un comando que debe salir bien. */
function ok(state: MapState, command: Command): void {
  expect(run(state, command).ok).toBe(true)
}

function place(state: MapState, buildingType: string, origin: TileCoord): void {
  ok(state, { type: 'placeBuilding', buildingType, origin, rotation: 0 })
}

/** Cimientos de 6×5 (interior x 3..6, y 3..5) con puerta arriba en (4, 2). */
function house(): MapState {
  const state = createTestMap()
  ok(state, {
    type: 'buildFoundation',
    rect: { x: 2, y: 2, width: 6, height: 5 },
    wall: 'brick',
    floor: 'dirt',
  })
  ok(state, { type: 'placeDoor', tile: { x: 4, y: 2 }, door: 'door' })
  return state
}

function designate(state: MapState, roomType: string, tile: TileCoord): number {
  const result = run(state, { type: 'designateRoom', tile, roomType })
  if (!result.ok || result.event.type !== 'roomDesignated') throw new Error('sin sala')
  return result.event.roomId
}

const at = (state: MapState, tile: TileCoord) => tileIndex(state, tile)

describe('demolishTargetAt', () => {
  it('un objeto tiene prioridad sobre puerta, muro y suelo', () => {
    const state = house()
    place(state, 'small', { x: 3, y: 3 }) // sobre suelo
    const i = at(state, { x: 3, y: 3 })
    state.walls[i] = 'brick'
    state.doors[i] = 'door'

    expect(demolishTargetAt(state, { x: 3, y: 3 })?.kind).toBe('building')
  })

  it('una puerta tiene prioridad sobre muro y suelo', () => {
    const state = house()
    const i = at(state, { x: 4, y: 2 })
    expect(state.floors[i]).toBe('dirt')
    state.walls[i] = 'brick'

    expect(demolishTargetAt(state, { x: 4, y: 2 })).toEqual({ kind: 'door' })
  })

  it('un muro tiene prioridad sobre el suelo', () => {
    const state = house()
    const i = at(state, { x: 2, y: 2 })
    expect(state.floors[i]).toBe('dirt')

    expect(demolishTargetAt(state, { x: 2, y: 2 })).toEqual({ kind: 'wall' })
  })

  it('un suelo que no es hierba es objetivo', () => {
    const state = house()

    expect(demolishTargetAt(state, { x: 4, y: 4 })).toEqual({ kind: 'floor' })
  })

  it('devuelve el edificio colocado', () => {
    const state = createTestMap()
    place(state, 'wide', { x: 2, y: 2 })

    expect(demolishTargetAt(state, { x: 4, y: 3 })).toEqual({
      kind: 'building',
      building: buildingAt(state, { x: 2, y: 2 }),
    })
  })

  it('es null en hierba vacía', () => {
    expect(demolishTargetAt(createTestMap(), { x: 5, y: 5 })).toBeNull()
  })

  it('es null en una casilla reservada', () => {
    const state = createTestMap()
    expect(state.floors[at(state, { x: 18, y: 5 })]).toBe('stone')

    expect(demolishTargetAt(state, { x: 18, y: 5 })).toBeNull()
  })

  it('es null fuera del mapa', () => {
    const state = createTestMap()

    expect(demolishTargetAt(state, { x: -1, y: 0 })).toBeNull()
    expect(demolishTargetAt(state, { x: 20, y: 0 })).toBeNull()
    expect(demolishTargetAt(state, { x: 0, y: 50 })).toBeNull()
  })
})

describe('applyDemolishAt', () => {
  const apply = (state: MapState, tile: TileCoord) => {
    const target = demolishTargetAt(state, tile)
    if (!target) throw new Error('sin objetivo')
    applyDemolishAt(state, TEST_CONTENT, tile, target)
  }

  it('quitar un objeto libera toda su huella, también desde una casilla que no es el origen', () => {
    const state = createTestMap()
    place(state, 'big', { x: 2, y: 2 })

    apply(state, { x: 4, y: 5 })

    for (let y = 2; y < 6; y++) {
      for (let x = 2; x < 6; x++) {
        expect(buildingAt(state, { x, y })).toBeUndefined()
      }
    }
    expect(Object.keys(state.buildings)).toHaveLength(0)
    expect(state.occupancy.every((value) => value === 0)).toBe(true)
  })

  it('quitar una puerta deja el hueco sin muro', () => {
    const state = house()

    apply(state, { x: 4, y: 2 })

    const i = at(state, { x: 4, y: 2 })
    expect(state.doors[i]).toBe('')
    expect(state.walls[i]).toBe('')
  })

  it('quitar un muro lo elimina y conserva el suelo', () => {
    const state = house()

    apply(state, { x: 2, y: 4 })

    const i = at(state, { x: 2, y: 4 })
    expect(state.walls[i]).toBe('')
    expect(state.floors[i]).toBe('dirt')
  })

  it('quitar un suelo interior lo vuelve hierba, exterior y fuera de su sala', () => {
    const state = house()
    const id = designate(state, 'kit', { x: 3, y: 3 })
    const tile = { x: 5, y: 4 }

    apply(state, tile)

    const i = at(state, tile)
    expect(state.floors[i]).toBe('grass')
    expect(state.indoor[i]).toBe(false)
    expect(state.roomOf[i]).toBe(0)
    expect(state.roomOf[at(state, { x: 3, y: 3 })]).toBe(id)
    expect(state.rooms[id]).toBeDefined()
  })

  it('si la sala se queda sin casillas, desaparece', () => {
    const state = createTestMap()
    ok(state, {
      type: 'buildFoundation',
      rect: { x: 2, y: 2, width: 3, height: 3 },
      wall: 'brick',
      floor: 'dirt',
    })
    const id = designate(state, 'kit', { x: 3, y: 3 })
    expect(state.rooms[id]).toBeDefined()

    apply(state, { x: 3, y: 3 })

    expect(state.rooms[id]).toBeUndefined()
  })
})

describe('validateDemolishArea', () => {
  it('outOfBounds si el rect sale del mapa', () => {
    const state = createTestMap()

    expect(validateDemolishArea(state, { x: 18, y: 18, width: 5, height: 5 })).toEqual({
      ok: false,
      reason: 'outOfBounds',
    })
    expect(validateDemolishArea(state, { x: -1, y: 0, width: 2, height: 2 })).toEqual({
      ok: false,
      reason: 'outOfBounds',
    })
  })

  it('nothingToDemolish en hierba vacía', () => {
    expect(validateDemolishArea(createTestMap(), { x: 4, y: 4, width: 5, height: 5 })).toEqual({
      ok: false,
      reason: 'nothingToDemolish',
    })
  })

  it('nothingToDemolish si solo hay casillas reservadas', () => {
    expect(validateDemolishArea(createTestMap(), { x: 18, y: 2, width: 2, height: 4 })).toEqual({
      ok: false,
      reason: 'nothingToDemolish',
    })
  })

  it('devuelve los objetos que tocan la zona aunque sobresalgan, sin duplicados', () => {
    const state = createTestMap()
    place(state, 'wide', { x: 2, y: 2 }) // x 2..4, y 2..3
    place(state, 'big', { x: 8, y: 8 }) // x 8..11, y 8..11
    place(state, 'small', { x: 14, y: 14 }) // fuera de la zona

    const check = validateDemolishArea(state, { x: 4, y: 3, width: 6, height: 6 })

    expect(check.ok).toBe(true)
    if (!check.ok) return
    expect(check.buildings.map((b) => b.type).sort()).toEqual(['big', 'wide'])
  })
})

describe('applyDemolishArea', () => {
  const demolishArea = (state: MapState, rect: TileRect): void => {
    const check = validateDemolishArea(state, rect)
    if (!check.ok) throw new Error(check.reason)
    applyDemolishArea(state, TEST_CONTENT, rect, check.buildings)
  }

  it('quita enteros los objetos que sobresalen de la zona', () => {
    const state = createTestMap()
    place(state, 'big', { x: 2, y: 2 }) // x 2..5, y 2..5

    demolishArea(state, { x: 4, y: 4, width: 3, height: 3 })

    expect(Object.keys(state.buildings)).toHaveLength(0)
    expect(buildingAt(state, { x: 2, y: 2 })).toBeUndefined()
    expect(state.occupancy.every((value) => value === 0)).toBe(true)
  })

  it('deja la zona limpia: sin muros, puertas, suelos, interior ni salas', () => {
    const state = house()
    place(state, 'small', { x: 3, y: 3 })
    designate(state, 'kit', { x: 4, y: 4 })
    const rect = { x: 1, y: 1, width: 8, height: 7 }

    demolishArea(state, rect)

    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        const i = at(state, { x, y })
        expect(state.walls[i]).toBe('')
        expect(state.doors[i]).toBe('')
        expect(state.floors[i]).toBe('grass')
        expect(state.indoor[i]).toBe(false)
        expect(state.roomOf[i]).toBe(0)
      }
    }
    expect(Object.keys(state.rooms)).toHaveLength(0)
  })

  it('no cambia las casillas reservadas (columnas 18 y 19)', () => {
    const state = createTestMap()
    ok(state, { type: 'paintFloor', rect: { x: 15, y: 2, width: 3, height: 3 }, floor: 'dirt' })
    const before = structuredClone(state)

    demolishArea(state, { x: 15, y: 0, width: 5, height: 6 })

    for (let y = 0; y < 6; y++) {
      for (const x of [18, 19]) {
        const i = at(state, { x, y })
        expect(state.floors[i]).toBe(before.floors[i])
        expect(state.reserved[i]).toBe(true)
        expect(state.walls[i]).toBe(before.walls[i])
        expect(state.occupancy[i]).toBe(before.occupancy[i])
      }
    }
    expect(state.floors[at(state, { x: 16, y: 3 })]).toBe('grass')
  })

  it('no cambia nada fuera del rect', () => {
    const state = house()
    place(state, 'small', { x: 3, y: 3 })
    place(state, 'wide', { x: 12, y: 12 })
    designate(state, 'kit', { x: 4, y: 4 })
    const before = structuredClone(state)
    const rect = { x: 2, y: 2, width: 6, height: 5 }

    demolishArea(state, rect)

    const inside = (x: number, y: number) =>
      x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height
    for (let y = 0; y < state.size.height; y++) {
      for (let x = 0; x < state.size.width; x++) {
        if (inside(x, y)) continue
        const i = at(state, { x, y })
        expect(state.floors[i]).toBe(before.floors[i])
        expect(state.walls[i]).toBe(before.walls[i])
        expect(state.doors[i]).toBe(before.doors[i])
        expect(state.indoor[i]).toBe(before.indoor[i])
        expect(state.roomOf[i]).toBe(before.roomOf[i])
        expect(state.occupancy[i]).toBe(before.occupancy[i])
      }
    }
    expect(buildingAt(state, { x: 12, y: 12 })).toBeDefined()
    expect(buildingAt(state, { x: 3, y: 3 })).toBeUndefined()
  })
})

describe('comandos de demolición', () => {
  it('demolishAt sobre un objeto emite buildingDemolished', () => {
    const state = createTestMap()
    place(state, 'wide', { x: 2, y: 2 })
    const building = buildingAt(state, { x: 2, y: 2 })

    expect(run(state, { type: 'demolishAt', tile: { x: 3, y: 3 } })).toEqual({
      ok: true,
      event: { type: 'buildingDemolished', building },
    })
  })

  it('demolishAt sobre una puerta o un muro emite structuresChanged con cause demolish', () => {
    const state = house()

    for (const tile of [
      { x: 4, y: 2 },
      { x: 2, y: 4 },
    ]) {
      expect(run(state, { type: 'demolishAt', tile })).toEqual({
        ok: true,
        event: {
          type: 'structuresChanged',
          rect: { ...tile, width: 1, height: 1 },
          cause: 'demolish',
        },
      })
    }
  })

  it('demolishAt sobre un suelo emite areaDemolished de 1×1 sin edificios', () => {
    const state = house()

    expect(run(state, { type: 'demolishAt', tile: { x: 5, y: 4 } })).toEqual({
      ok: true,
      event: {
        type: 'areaDemolished',
        rect: { x: 5, y: 4, width: 1, height: 1 },
        buildings: [],
      },
    })
  })

  it('demolishArea emite areaDemolished con los edificios retirados', () => {
    const state = createTestMap()
    place(state, 'small', { x: 3, y: 3 })
    const building = buildingAt(state, { x: 3, y: 3 })
    const rect = { x: 2, y: 2, width: 3, height: 3 }

    expect(run(state, { type: 'demolishArea', rect })).toEqual({
      ok: true,
      event: { type: 'areaDemolished', rect, buildings: [building] },
    })
    expect(buildingAt(state, { x: 3, y: 3 })).toBeUndefined()
  })

  it.each<[string, Command, string]>([
    ['demolishAt en hierba', { type: 'demolishAt', tile: { x: 10, y: 10 } }, 'nothingToDemolish'],
    ['demolishAt reservada', { type: 'demolishAt', tile: { x: 18, y: 3 } }, 'nothingToDemolish'],
    ['demolishAt fuera', { type: 'demolishAt', tile: { x: -3, y: 3 } }, 'nothingToDemolish'],
    [
      'demolishArea vacía',
      { type: 'demolishArea', rect: { x: 10, y: 10, width: 3, height: 3 } },
      'nothingToDemolish',
    ],
    [
      'demolishArea fuera del mapa',
      { type: 'demolishArea', rect: { x: 18, y: 18, width: 4, height: 4 } },
      'outOfBounds',
    ],
  ])(
    'un comando inválido (%s) devuelve el error y deja el estado idéntico',
    (_n, command, reason) => {
      const state = house()
      place(state, 'small', { x: 3, y: 3 })
      designate(state, 'kit', { x: 4, y: 4 })
      const before = structuredClone(state)

      expect(run(state, command)).toEqual({ ok: false, reason })
      expect(state).toEqual(before)
    },
  )
})

describe('integración: arrasar una zona construida', () => {
  it('deja el mapa como al principio en esa zona y sin salas', () => {
    const state = createTestMap()
    const initial = structuredClone(state)
    ok(state, {
      type: 'buildFoundation',
      rect: { x: 2, y: 2, width: 6, height: 5 },
      wall: 'brick',
      floor: 'dirt',
    })
    ok(state, { type: 'placeDoor', tile: { x: 4, y: 2 }, door: 'door' })
    place(state, 'small', { x: 3, y: 3 })
    place(state, 'wide', { x: 4, y: 4 })
    designate(state, 'kit', { x: 3, y: 4 })
    expect(Object.keys(state.rooms)).toHaveLength(1)

    const result = run(state, { type: 'demolishArea', rect: { x: 2, y: 2, width: 6, height: 5 } })

    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'areaDemolished') throw new Error('evento inesperado')
    expect(result.event.buildings).toHaveLength(2)
    expect(state.floors).toEqual(initial.floors)
    expect(state.walls).toEqual(initial.walls)
    expect(state.doors).toEqual(initial.doors)
    expect(state.indoor).toEqual(initial.indoor)
    expect(state.roomOf).toEqual(initial.roomOf)
    expect(state.occupancy).toEqual(initial.occupancy)
    expect(state.buildings).toEqual({})
    expect(state.rooms).toEqual({})
  })
})
