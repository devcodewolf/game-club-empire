/** Tests de las gradas modulares: colocación, mejora, derribo y apuntado. */
import { describe, expect, it } from 'vitest'
import { executeCommand, type Command } from './commands'
import type { PlacedBuilding, StandSlot } from './buildings'
import type { Rotation, TileCoord } from './geometry'
import { buildingAt, type MapState } from './map'
import {
  CORNER_LENGTH_PER_DEPTH,
  lowestNeighbour,
  pitchCapacity,
  standCapacity,
  standTargetAt,
} from './stands'
import { createTestMap, TEST_CONTENT } from './test-fixtures'

const run = (state: MapState, command: Command) => executeCommand(state, command, TEST_CONTENT)

const placeCmd = (buildingType: string, origin: TileCoord): Command => ({
  type: 'placeBuilding',
  buildingType,
  origin,
  rotation: 0,
})
const standCmd = (pitchId: number, slot: StandSlot): Command => ({
  type: 'placeStand',
  buildingType: 'stand',
  pitchId,
  slot,
})
const upgradeCmd = (buildingId: number): Command => ({ type: 'upgradeBuilding', buildingId })

/** Campo de 4×3 en (5,5): ocupa x 5..8, y 5..7. Su id es 1. */
function mapWithPitch(): MapState {
  const state = createTestMap()
  run(state, placeCmd('field', { x: 5, y: 5 }))
  return state
}

/** Casillas ocupadas por un id. */
const countTiles = (state: MapState, id: number) => state.occupancy.filter((v) => v === id).length

/** Grada colocada con éxito (falla el test si no se pudo). */
function placeStand(state: MapState, slot: StandSlot): PlacedBuilding {
  const result = run(state, standCmd(1, slot))
  if (!result.ok || result.event.type !== 'buildingPlaced') throw new Error('no se colocó la grada')
  return result.event.building
}

describe('placeStand: colocación en los cuatro lados', () => {
  it.each<[StandSlot, TileCoord, Rotation, { width: number; height: number }]>([
    ['north', { x: 5, y: 4 }, 0, { width: 4, height: 1 }],
    ['south', { x: 5, y: 8 }, 2, { width: 4, height: 1 }],
    ['east', { x: 9, y: 5 }, 1, { width: 3, height: 1 }],
    ['west', { x: 4, y: 5 }, 3, { width: 3, height: 1 }],
  ])('%s: origen, giro y tamaño', (slot, origin, rotation, size) => {
    const state = mapWithPitch()
    const stand = placeStand(state, slot)

    expect(stand.origin).toEqual(origin)
    expect(stand.rotation).toBe(rotation)
    expect(stand.size).toEqual(size)
    expect(stand.tier).toBe(0)
    expect(stand.attach).toEqual({ pitchId: 1, slot })
    // Ocupa largo × fondo casillas y están a su nombre.
    expect(countTiles(state, stand.id)).toBe(size.width * size.height)
    expect(buildingAt(state, origin)?.id).toBe(stand.id)
  })
})

describe('placeStand: errores', () => {
  it("hueco ocupado: 'slotTaken'", () => {
    const state = mapWithPitch()
    placeStand(state, 'north')
    expect(run(state, standCmd(1, 'north'))).toEqual({ ok: false, reason: 'slotTaken' })
  })

  it("esquina: 'slotLocked'", () => {
    const state = mapWithPitch()
    expect(run(state, standCmd(1, 'northEast'))).toEqual({ ok: false, reason: 'slotLocked' })
  })

  it("campo inexistente: 'notAPitch'", () => {
    const state = mapWithPitch()
    expect(run(state, standCmd(99, 'north'))).toEqual({ ok: false, reason: 'notAPitch' })
  })

  it("objeto que no es un campo: 'notAPitch'", () => {
    const state = mapWithPitch()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    expect(run(state, standCmd(2, 'north'))).toEqual({ ok: false, reason: 'notAPitch' })
  })

  it("fuera del mapa: 'outOfBounds'", () => {
    const state = createTestMap()
    run(state, placeCmd('field', { x: 0, y: 0 }))
    expect(run(state, standCmd(1, 'north'))).toEqual({ ok: false, reason: 'outOfBounds' })
    expect(run(state, standCmd(1, 'west'))).toEqual({ ok: false, reason: 'outOfBounds' })
  })

  it("algo construido en la franja: 'occupied'", () => {
    const state = mapWithPitch()
    run(state, placeCmd('small', { x: 6, y: 4 }))
    expect(run(state, standCmd(1, 'north'))).toEqual({ ok: false, reason: 'occupied' })
    expect(Object.keys(state.buildings)).toHaveLength(2)
  })

  it("placeBuilding de una grada: 'needsPitch'", () => {
    const state = mapWithPitch()
    expect(run(state, placeCmd('stand', { x: 0, y: 0 }))).toEqual({
      ok: false,
      reason: 'needsPitch',
    })
  })
})

describe('upgradeBuilding de una grada', () => {
  it('crece hacia fuera manteniendo la fila pegada al campo', () => {
    const state = mapWithPitch()
    const stand = placeStand(state, 'north')
    expect(countTiles(state, stand.id)).toBe(4)

    expect(run(state, upgradeCmd(stand.id)).ok).toBe(true)

    const upgraded = state.buildings[stand.id]
    expect(upgraded?.tier).toBe(1)
    expect(upgraded?.origin).toEqual({ x: 5, y: 3 })
    expect(upgraded?.size).toEqual({ width: 4, height: 2 })
    // La fila pegada al campo (y=4) sigue siendo suya; se suma la nueva (y=3).
    expect(buildingAt(state, { x: 5, y: 4 })?.id).toBe(stand.id)
    expect(buildingAt(state, { x: 8, y: 3 })?.id).toBe(stand.id)
    expect(countTiles(state, stand.id)).toBe(8)
    // El campo no pierde casillas.
    expect(countTiles(state, 1)).toBe(12)
  })

  it('en el lado este crece hacia la derecha', () => {
    const state = mapWithPitch()
    const stand = placeStand(state, 'east')
    run(state, upgradeCmd(stand.id))

    const upgraded = state.buildings[stand.id]
    expect(upgraded?.origin).toEqual({ x: 9, y: 5 })
    expect(upgraded?.rotation).toBe(1)
    expect(countTiles(state, stand.id)).toBe(6)
    expect(buildingAt(state, { x: 10, y: 7 })?.id).toBe(stand.id)
  })

  it("bloqueada por un objeto detrás: 'occupied' y estado intacto", () => {
    const state = mapWithPitch()
    const stand = placeStand(state, 'north')
    run(state, placeCmd('small', { x: 6, y: 3 }))
    const antes = structuredClone(state)

    expect(run(state, upgradeCmd(stand.id))).toEqual({ ok: false, reason: 'occupied' })
    expect(state).toEqual(antes)
    expect(state.buildings[stand.id]?.tier).toBe(0)
  })
})

describe('derribar el campo arrastra sus gradas', () => {
  /** Campo con dos gradas. */
  function pitchWithStands() {
    const state = mapWithPitch()
    const north = placeStand(state, 'north')
    const east = placeStand(state, 'east')
    return { state, north, east }
  }

  it('demolishBuilding: elimina las gradas, libera casillas y lleva attached', () => {
    const { state, north, east } = pitchWithStands()
    const result = run(state, { type: 'demolishBuilding', buildingId: 1 })

    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'buildingDemolished') throw new Error('evento')
    expect(result.event.attached?.map((b) => b.id).sort()).toEqual([north.id, east.id].sort())
    expect(Object.keys(state.buildings)).toHaveLength(0)
    expect(countTiles(state, 1) + countTiles(state, north.id) + countTiles(state, east.id)).toBe(0)
  })

  it('demolishAt sobre el campo: igual', () => {
    const { state, north, east } = pitchWithStands()
    const result = run(state, { type: 'demolishAt', tile: { x: 6, y: 6 } })

    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'buildingDemolished') throw new Error('evento')
    expect(result.event.attached).toHaveLength(2)
    expect(Object.keys(state.buildings)).toHaveLength(0)
    expect(countTiles(state, 1) + countTiles(state, north.id) + countTiles(state, east.id)).toBe(0)
  })

  it('demolishArea que toca el campo: se llevan las gradas aunque queden fuera de la zona', () => {
    const { state, north, east } = pitchWithStands()
    const result = run(state, {
      type: 'demolishArea',
      rect: { x: 6, y: 6, width: 1, height: 1 },
    })

    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'areaDemolished') throw new Error('evento')
    expect(result.event.buildings.map((b) => b.id).sort()).toEqual([1, north.id, east.id].sort())
    expect(Object.keys(state.buildings)).toHaveLength(0)
    expect(countTiles(state, 1) + countTiles(state, north.id) + countTiles(state, east.id)).toBe(0)
  })

  it('derribar solo una grada no toca el campo ni las demás', () => {
    const { state, north, east } = pitchWithStands()
    const result = run(state, { type: 'demolishBuilding', buildingId: north.id })

    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'buildingDemolished') throw new Error('evento')
    expect(result.event.attached).toBeUndefined()
    expect(state.buildings[1]).toBeDefined()
    expect(state.buildings[east.id]).toBeDefined()
  })
})

describe('standTargetAt', () => {
  const maxDepth = 3
  const target = (state: MapState, x: number, y: number) =>
    standTargetAt(state, TEST_CONTENT, { x, y }, maxDepth)

  it('sobre el campo devuelve el lado más cercano', () => {
    const state = mapWithPitch()
    expect(target(state, 7, 5)).toEqual({ pitchId: 1, slot: 'north' })
    expect(target(state, 7, 7)).toEqual({ pitchId: 1, slot: 'south' })
    expect(target(state, 5, 6)).toEqual({ pitchId: 1, slot: 'west' })
    expect(target(state, 8, 6)).toEqual({ pitchId: 1, slot: 'east' })
  })

  it('en la franja exterior devuelve el hueco de ese lado', () => {
    const state = mapWithPitch()
    expect(target(state, 6, 3)).toEqual({ pitchId: 1, slot: 'north' })
    expect(target(state, 6, 9)).toEqual({ pitchId: 1, slot: 'south' })
    expect(target(state, 3, 6)).toEqual({ pitchId: 1, slot: 'west' })
    expect(target(state, 10, 6)).toEqual({ pitchId: 1, slot: 'east' })
  })

  it('en zona de esquina o lejos del campo devuelve null', () => {
    const state = mapWithPitch()
    expect(target(state, 4, 4)).toBeNull()
    expect(target(state, 9, 8)).toBeNull()
    expect(target(state, 15, 15)).toBeNull()
  })
})

describe('córners', () => {
  const cornerCmd = (pitchId: number, slot: StandSlot): Command => ({
    type: 'placeStand',
    buildingType: 'standCorner',
    pitchId,
    slot,
  })
  const SIDES: readonly StandSlot[] = ['north', 'south', 'east', 'west']

  /** Campo con sus cuatro gradas de lado (nivel 0). */
  function mapWithSides(): MapState {
    const state = mapWithPitch()
    for (const slot of SIDES) placeStand(state, slot)
    return state
  }

  /** Córner colocado con éxito (falla el test si no se pudo). */
  function placeCorner(state: MapState, slot: StandSlot): PlacedBuilding {
    const result = run(state, cornerCmd(1, slot))
    if (!result.ok || result.event.type !== 'buildingPlaced') throw new Error('no se colocó')
    return result.event.building
  }

  /** Mejora un objeto o falla el test. */
  function upgrade(state: MapState, id: number): void {
    expect(run(state, upgradeCmd(id)).ok).toBe(true)
  }

  const standOf = (state: MapState, slot: StandSlot): PlacedBuilding => {
    const found = Object.values(state.buildings).find((b) => b.attach?.slot === slot)
    if (!found) throw new Error(`falta la grada ${slot}`)
    return found
  }

  it.each<[StandSlot, TileCoord, Rotation]>([
    ['northEast', { x: 9, y: 4 }, 0],
    ['southEast', { x: 9, y: 8 }, 1],
    ['southWest', { x: 4, y: 8 }, 2],
    ['northWest', { x: 4, y: 4 }, 3],
  ])('%s: origen, giro y tamaño', (slot, origin, rotation) => {
    const state = mapWithSides()
    const corner = placeCorner(state, slot)

    expect(corner.origin).toEqual(origin)
    expect(corner.rotation).toBe(rotation)
    expect(corner.size).toEqual({ width: 1, height: 1 })
    expect(corner.tier).toBe(0)
    expect(corner.attach).toEqual({ pitchId: 1, slot })
    expect(countTiles(state, corner.id)).toBe(1)
    expect(buildingAt(state, origin)?.id).toBe(corner.id)
  })

  it("sin alguna de las dos vecinas: 'needsNeighbours'", () => {
    const state = mapWithPitch()
    expect(run(state, cornerCmd(1, 'northEast'))).toEqual({ ok: false, reason: 'needsNeighbours' })
    placeStand(state, 'north')
    expect(run(state, cornerCmd(1, 'northEast'))).toEqual({ ok: false, reason: 'needsNeighbours' })
    placeStand(state, 'east')
    expect(run(state, cornerCmd(1, 'northEast')).ok).toBe(true)
  })

  it("grada de lado en hueco de esquina y córner en hueco de lado: 'slotLocked'", () => {
    const state = mapWithSides()
    expect(run(state, standCmd(1, 'northEast'))).toEqual({ ok: false, reason: 'slotLocked' })
    expect(run(state, cornerCmd(1, 'north'))).toEqual({ ok: false, reason: 'slotLocked' })
  })

  it("hueco de esquina ocupado: 'slotTaken'", () => {
    const state = mapWithSides()
    placeCorner(state, 'northEast')
    expect(run(state, cornerCmd(1, 'northEast'))).toEqual({ ok: false, reason: 'slotTaken' })
  })

  it("mejorar por encima de la vecina más baja: 'cornerAboveNeighbours' y estado intacto", () => {
    const state = mapWithSides()
    const corner = placeCorner(state, 'northEast')
    const antes = structuredClone(state)

    expect(run(state, upgradeCmd(corner.id))).toEqual({
      ok: false,
      reason: 'cornerAboveNeighbours',
    })
    expect(state).toEqual(antes)

    // Con una sola vecina mejorada sigue sin poder subir.
    upgrade(state, standOf(state, 'north').id)
    expect(run(state, upgradeCmd(corner.id))).toEqual({
      ok: false,
      reason: 'cornerAboveNeighbours',
    })
  })

  it('al subir ambas vecinas, el córner puede subir y crece hacia fuera', () => {
    const state = mapWithSides()
    const corner = placeCorner(state, 'northEast')
    upgrade(state, standOf(state, 'north').id)
    upgrade(state, standOf(state, 'east').id)
    upgrade(state, corner.id)

    const upgraded = state.buildings[corner.id]
    expect(upgraded?.tier).toBe(1)
    // El vértice del campo (9,4) sigue siendo suyo y crece hacia arriba/derecha.
    expect(upgraded?.origin).toEqual({ x: 9, y: 3 })
    expect(upgraded?.size).toEqual({ width: 2, height: 2 })
    expect(countTiles(state, corner.id)).toBe(4)
    expect(buildingAt(state, { x: 9, y: 4 })?.id).toBe(corner.id)
    expect(buildingAt(state, { x: 10, y: 3 })?.id).toBe(corner.id)
  })

  it('lowestNeighbour devuelve la vecina de menor nivel', () => {
    const state = mapWithSides()
    upgrade(state, standOf(state, 'east').id)
    expect(lowestNeighbour(state, 1, 'northEast')).toBe('north')

    upgrade(state, standOf(state, 'north').id)
    upgrade(state, standOf(state, 'north').id)
    expect(lowestNeighbour(state, 1, 'northEast')).toBe('east')
    // Un hueco de lado no tiene vecinas.
    expect(lowestNeighbour(state, 1, 'north')).toBeUndefined()
  })

  it('standCapacity de un córner usa round(fondo × CORNER_LENGTH_PER_DEPTH) como largo', () => {
    const state = mapWithSides()
    const def = TEST_CONTENT.buildings['standCorner']
    if (!def) throw new Error('falta el córner de prueba')
    const corner = placeCorner(state, 'northEast')
    expect(standCapacity(def, corner)).toBe(10 * Math.round(1 * CORNER_LENGTH_PER_DEPTH))

    upgrade(state, standOf(state, 'north').id)
    upgrade(state, standOf(state, 'east').id)
    upgrade(state, corner.id)
    const upgraded = state.buildings[corner.id]
    if (!upgraded) throw new Error('córner desaparecido')
    expect(standCapacity(def, upgraded)).toBe(20 * Math.round(2 * CORNER_LENGTH_PER_DEPTH))
  })

  it('derribar el campo arrastra también los córners', () => {
    const state = mapWithSides()
    const corner = placeCorner(state, 'northEast')
    const result = run(state, { type: 'demolishBuilding', buildingId: 1 })

    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'buildingDemolished') throw new Error('evento')
    expect(result.event.attached?.map((b) => b.id)).toContain(corner.id)
    expect(result.event.attached).toHaveLength(5)
    expect(Object.keys(state.buildings)).toHaveLength(0)
    expect(countTiles(state, corner.id)).toBe(0)
  })

  describe('standTargetAt con corner = true', () => {
    const target = (state: MapState, x: number, y: number) =>
      standTargetAt(state, TEST_CONTENT, { x, y }, 3, true)

    it('sobre el campo devuelve la esquina del cuadrante', () => {
      const state = mapWithPitch()
      expect(target(state, 5, 5)).toEqual({ pitchId: 1, slot: 'northWest' })
      expect(target(state, 8, 5)).toEqual({ pitchId: 1, slot: 'northEast' })
      expect(target(state, 5, 7)).toEqual({ pitchId: 1, slot: 'southWest' })
      expect(target(state, 8, 7)).toEqual({ pitchId: 1, slot: 'southEast' })
    })

    it('fuera del campo devuelve la esquina de esa zona', () => {
      const state = mapWithPitch()
      expect(target(state, 9, 4)).toEqual({ pitchId: 1, slot: 'northEast' })
      expect(target(state, 11, 2)).toEqual({ pitchId: 1, slot: 'northEast' })
      expect(target(state, 9, 8)).toEqual({ pitchId: 1, slot: 'southEast' })
      expect(target(state, 4, 8)).toEqual({ pitchId: 1, slot: 'southWest' })
      expect(target(state, 4, 4)).toEqual({ pitchId: 1, slot: 'northWest' })
    })

    it('fuera de las zonas de esquina devuelve null', () => {
      const state = mapWithPitch()
      expect(target(state, 7, 3)).toBeNull() // franja de un lado, no de una esquina
      expect(target(state, 10, 6)).toBeNull()
      expect(target(state, 15, 15)).toBeNull()
      expect(target(state, 12, 4)).toBeNull() // más allá del fondo máximo
    })
  })
})

describe('standCapacity', () => {
  it('es el aforo por casilla del nivel × el largo del lado', () => {
    const state = mapWithPitch()
    const north = placeStand(state, 'north') // largo 4
    const east = placeStand(state, 'east') // largo 3
    const def = TEST_CONTENT.buildings['stand']
    if (!def) throw new Error('falta la grada de prueba')

    expect(standCapacity(def, north)).toBe(40)
    expect(standCapacity(def, east)).toBe(30)

    run(state, upgradeCmd(north.id))
    const upgraded = state.buildings[north.id]
    if (!upgraded) throw new Error('grada desaparecida')
    expect(standCapacity(def, upgraded)).toBe(80)
  })
})

describe('pitchCapacity', () => {
  it('suma el aforo de las gradas del campo (0 sin gradas)', () => {
    const state = mapWithPitch()
    const pitchId = Object.values(state.buildings)[0]?.id ?? 0
    expect(pitchCapacity(state, TEST_CONTENT, pitchId)).toBe(0)

    const north = placeStand(state, 'north') // 4 × 10
    placeStand(state, 'east') // 3 × 10
    expect(pitchCapacity(state, TEST_CONTENT, pitchId)).toBe(70)

    run(state, upgradeCmd(north.id)) // norte: 4 × 20
    expect(pitchCapacity(state, TEST_CONTENT, pitchId)).toBe(110)
  })
})
