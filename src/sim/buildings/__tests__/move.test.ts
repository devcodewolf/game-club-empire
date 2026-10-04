/** Tests de mover objetos, campos y gradas: planMove, applyMove, rotateSlot y el comando. */
import { describe, expect, it } from 'vitest'
import { executeCommand, type Command } from '../../commands'
import type { PlacedBuilding, StandSlot } from '../buildings'
import type { Rotation, TileCoord } from '../../geometry'
import { buildingAt, EMPTY_TILE, type MapState } from '../../map/map'
import { evaluateRoom } from '../../rooms/rooms'
import { applyMove, planMove, rotateSlot, type Move } from '../move'
import { createTestMap, TEST_CONTENT } from '../../__tests__/fixtures'

const run = (state: MapState, command: Command) => executeCommand(state, command, TEST_CONTENT)

function ok(state: MapState, command: Command): void {
  expect(run(state, command).ok).toBe(true)
}

const placeCmd = (buildingType: string, origin: TileCoord, rotation: Rotation = 0): Command => ({
  type: 'placeBuilding',
  buildingType,
  origin,
  rotation,
})
const moveCmd = (buildingId: number, origin: TileCoord, rotation: Rotation = 0): Command => ({
  type: 'moveBuilding',
  buildingId,
  origin,
  rotation,
})
const standCmd = (buildingType: string, pitchId: number, slot: StandSlot): Command => ({
  type: 'placeStand',
  buildingType,
  pitchId,
  slot,
})
const upgradeCmd = (buildingId: number): Command => ({ type: 'upgradeBuilding', buildingId })

/** Coloca un objeto y devuelve el edificio colocado. */
function place(
  state: MapState,
  buildingType: string,
  origin: TileCoord,
  rotation: Rotation = 0,
): PlacedBuilding {
  const result = run(state, placeCmd(buildingType, origin, rotation))
  if (!result.ok || result.event.type !== 'buildingPlaced') throw new Error('no se colocó')
  return result.event.building
}

function placeStand(
  state: MapState,
  slot: StandSlot,
  type = 'stand',
  pitchId = 1,
): PlacedBuilding {
  const result = run(state, standCmd(type, pitchId, slot))
  if (!result.ok || result.event.type !== 'buildingPlaced') throw new Error('no se colocó la grada')
  return result.event.building
}

/** Lo que `moveBuilding` devuelve al salir bien. */
function moved(state: MapState, command: Command): readonly Move[] {
  const result = run(state, command)
  if (!result.ok || result.event.type !== 'buildingMoved') throw new Error('no se movió')
  return result.event.moves
}

const standOf = (state: MapState, slot: StandSlot): PlacedBuilding => {
  const found = Object.values(state.buildings).find((b) => b.attach?.slot === slot)
  if (!found) throw new Error(`falta la grada ${slot}`)
  return found
}

const countTiles = (state: MapState, id: number) => state.occupancy.filter((v) => v === id).length

describe('moveBuilding: objeto suelto', () => {
  it('a un sitio libre: cambia origen y giro, conserva id, nivel y tipo', () => {
    const state = createTestMap()
    const obj = place(state, 'tiered', { x: 2, y: 2 })
    ok(state, upgradeCmd(obj.id))

    const moves = moved(state, moveCmd(obj.id, { x: 8, y: 9 }, 2))

    expect(moves).toHaveLength(1)
    expect(moves[0]?.from.origin).toEqual({ x: 2, y: 2 })
    expect(moves[0]?.to.origin).toEqual({ x: 8, y: 9 })
    const after = state.buildings[obj.id]
    expect(after?.origin).toEqual({ x: 8, y: 9 })
    expect(after?.rotation).toBe(2)
    expect(after?.id).toBe(obj.id)
    expect(after?.type).toBe('tiered')
    expect(after?.tier).toBe(1)
    expect(moves[0]?.to).toEqual(after)
    // Ocupación vieja libre, nueva a su nombre.
    expect(buildingAt(state, { x: 2, y: 2 })).toBeUndefined()
    expect(buildingAt(state, { x: 8, y: 9 })?.id).toBe(obj.id)
    expect(countTiles(state, obj.id)).toBe(1)
  })

  it('el evento es buildingMoved con un único move', () => {
    const state = createTestMap()
    const obj = place(state, 'small', { x: 2, y: 2 })
    const result = run(state, moveCmd(obj.id, { x: 3, y: 3 }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.type).toBe('buildingMoved')
    if (result.event.type !== 'buildingMoved') return
    expect(result.event.moves).toHaveLength(1)
    expect(result.event.moves[0]?.from.id).toBe(obj.id)
  })

  it('una casilla solapando su propia huella está permitido', () => {
    const state = createTestMap()
    const wide = place(state, 'wide', { x: 2, y: 2 }) // 3×2

    moved(state, moveCmd(wide.id, { x: 3, y: 2 }))

    expect(state.buildings[wide.id]?.origin).toEqual({ x: 3, y: 2 })
    expect(buildingAt(state, { x: 2, y: 2 })).toBeUndefined()
    expect(buildingAt(state, { x: 3, y: 2 })?.id).toBe(wide.id)
    expect(buildingAt(state, { x: 5, y: 3 })?.id).toBe(wide.id)
    expect(countTiles(state, wide.id)).toBe(6)
  })
})

describe('moveBuilding: errores', () => {
  /** Mapa con un 'wide' (id 1) en (2,2), un 'small' en (6,2) y una caseta con muros en 10..12. */
  function scene() {
    const state = createTestMap()
    const wide = place(state, 'wide', { x: 2, y: 2 })
    place(state, 'small', { x: 6, y: 2 })
    ok(state, {
      type: 'buildFoundation',
      rect: { x: 10, y: 10, width: 3, height: 3 },
      wall: 'brick',
      floor: 'dirt',
    })
    return { state, wide }
  }

  it.each<[string, TileCoord, string]>([
    ['ocupado por otro objeto', { x: 5, y: 2 }, 'occupied'],
    ['fuera del mapa (negativo)', { x: -1, y: 0 }, 'outOfBounds'],
    ['fuera del mapa (por la derecha)', { x: 19, y: 5 }, 'outOfBounds'],
    ['sobre un muro', { x: 10, y: 10 }, 'wall'],
    ['casilla reservada', { x: 16, y: 5 }, 'reserved'],
  ])('%s: error y estado intacto', (_nombre, origin, reason) => {
    const { state, wide } = scene()
    const antes = structuredClone(state)
    const buildingsAntes = structuredClone(state.buildings)
    const occupancyAntes = Array.from(state.occupancy)

    expect(run(state, moveCmd(wide.id, origin))).toEqual({ ok: false, reason })

    expect(state.buildings).toEqual(buildingsAntes)
    expect(Array.from(state.occupancy)).toEqual(occupancyAntes)
    expect(state).toEqual(antes)
  })

  it("mismo sitio y giro: 'samePlace'", () => {
    const { state, wide } = scene()
    expect(run(state, moveCmd(wide.id, { x: 2, y: 2 }, 0))).toEqual({
      ok: false,
      reason: 'samePlace',
    })
  })

  it('mismo sitio pero otro giro no es samePlace', () => {
    const { state, wide } = scene()
    expect(run(state, moveCmd(wide.id, { x: 2, y: 2 }, 1)).ok).toBe(true)
  })

  it("id inexistente: 'buildingNotFound'", () => {
    const { state } = scene()
    expect(run(state, moveCmd(99, { x: 5, y: 5 }))).toEqual({
      ok: false,
      reason: 'buildingNotFound',
    })
  })

  it("mover una grada directamente: 'attachedToPitch'", () => {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 })
    const stand = placeStand(state, 'north')
    const antes = structuredClone(state)

    expect(run(state, moveCmd(stand.id, { x: 10, y: 10 }))).toEqual({
      ok: false,
      reason: 'attachedToPitch',
    })
    expect(state).toEqual(antes)
  })

  it('planMove no modifica el estado ni siquiera cuando todo es válido', () => {
    const { state, wide } = scene()
    const antes = structuredClone(state)

    const check = planMove(state, TEST_CONTENT, wide.id, { x: 8, y: 8 }, 0)

    expect(check.ok).toBe(true)
    expect(state).toEqual(antes)
  })

  it('applyMove aplica un plan válido', () => {
    const { state, wide } = scene()
    const check = planMove(state, TEST_CONTENT, wide.id, { x: 8, y: 8 }, 0)
    if (!check.ok) throw new Error('plan inválido')

    applyMove(state, TEST_CONTENT, check.moves)

    expect(state.buildings[wide.id]?.origin).toEqual({ x: 8, y: 8 })
    expect(buildingAt(state, { x: 2, y: 2 })).toBeUndefined()
  })
})

describe('moveBuilding: campo con gradas', () => {
  /** Campo 4×3 en (5,5) con cuatro lados, el córner NE y todo lo del lado norte/este/NE a nivel 1. */
  function pitchWithStands() {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 }) // id 1
    for (const slot of ['north', 'south', 'east', 'west'] as const) placeStand(state, slot)
    placeStand(state, 'northEast', 'standCorner')
    ok(state, upgradeCmd(standOf(state, 'north').id))
    ok(state, upgradeCmd(standOf(state, 'east').id))
    ok(state, upgradeCmd(standOf(state, 'northEast').id))
    return state
  }

  it('se llevan todas las gradas, con su nivel, pegadas al campo nuevo', () => {
    const state = pitchWithStands()
    ok(state, { type: 'setPitchRole', buildingId: 1, role: 'training' })
    const before = new Map(Object.values(state.buildings).map((b) => [b.id, structuredClone(b)]))
    expect(Object.keys(state.buildings)).toHaveLength(6)

    const moves = moved(state, moveCmd(1, { x: 5, y: 10 }))

    // La primera pieza es el campo; detrás, las 5 gradas.
    expect(moves).toHaveLength(6)
    expect(moves[0]?.from.id).toBe(1)
    expect(Object.keys(state.buildings)).toHaveLength(6)
    for (const [id, old] of before) {
      const now = state.buildings[id]
      expect(now?.type).toBe(old.type)
      expect(now?.tier).toBe(old.tier)
      expect(now?.attach).toEqual(old.attach)
      expect(now?.origin).toEqual({ x: old.origin.x, y: old.origin.y + 5 })
      expect(now?.rotation).toBe(old.rotation)
      expect(now?.size).toEqual(old.size)
    }
    expect(standOf(state, 'north').tier).toBe(1)
    expect(standOf(state, 'northEast').tier).toBe(1)
    expect(standOf(state, 'south').tier).toBe(0)
    // Uso del campo conservado.
    expect(state.buildings[1]?.role).toBe('training')
  })

  it('las huellas viejas quedan libres y las nuevas a nombre de cada pieza', () => {
    const state = pitchWithStands()
    const ids = Object.keys(state.buildings).map(Number)
    const oldPitchTile = { x: 5, y: 5 }
    const oldNorthTile = { x: 5, y: 4 }
    // Una casilla de la grada norte (nivel 1: filas y=3..4) y del campo, antes de mover.
    expect(buildingAt(state, oldNorthTile)?.id).toBe(standOf(state, 'north').id)

    moved(state, moveCmd(1, { x: 5, y: 10 }))

    // y=5..7 del campo viejo y la grada norte vieja (y=3..4) quedan libres...
    expect(buildingAt(state, oldPitchTile)).toBeUndefined()
    expect(buildingAt(state, oldNorthTile)).toBeUndefined()
    expect(buildingAt(state, { x: 5, y: 3 })).toBeUndefined()
    expect(state.occupancy[3 * 20 + 5]).toBe(EMPTY_TILE)
    // ...y las nuevas son del campo y de la grada norte.
    expect(buildingAt(state, { x: 5, y: 10 })?.id).toBe(1)
    expect(buildingAt(state, { x: 5, y: 9 })?.id).toBe(standOf(state, 'north').id)
    // Ni se pierden ni se duplican casillas.
    expect(countTiles(state, 1)).toBe(12)
    for (const id of ids) {
      const b = state.buildings[id]
      expect(countTiles(state, id)).toBe((b?.size?.width ?? 4) * (b?.size?.height ?? 3))
    }
  })

  it('girar el campo 90° gira los huecos y recalcula el tamaño de cada grada', () => {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 })
    placeStand(state, 'north') // 4×1
    placeStand(state, 'east') // 3×1

    moved(state, moveCmd(1, { x: 10, y: 10 }, 1))

    // Campo girado: 3 de ancho × 4 de alto en (10,10).
    const north = standOf(state, 'east') // la norte pasa a ser la este
    expect(north.attach).toEqual({ pitchId: 1, slot: 'east' })
    expect(north.origin).toEqual({ x: 13, y: 10 })
    expect(north.rotation).toBe(1)
    expect(north.size).toEqual({ width: 4, height: 1 })

    const south = standOf(state, 'south') // la este pasa a ser la sur
    expect(south.attach).toEqual({ pitchId: 1, slot: 'south' })
    expect(south.origin).toEqual({ x: 10, y: 14 })
    expect(south.rotation).toBe(2)
    expect(south.size).toEqual({ width: 3, height: 1 })

    expect(Object.values(state.buildings).some((b) => b.attach?.slot === 'north')).toBe(false)
    expect(countTiles(state, north.id)).toBe(4)
    expect(countTiles(state, south.id)).toBe(3)
  })

  it('girar 180° pasa norte a sur y un córner NE a SW', () => {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 })
    placeStand(state, 'north')
    placeStand(state, 'east')
    placeStand(state, 'northEast', 'standCorner')

    moved(state, moveCmd(1, { x: 10, y: 10 }, 2))

    expect(standOf(state, 'south').size).toEqual({ width: 4, height: 1 })
    expect(standOf(state, 'west').size).toEqual({ width: 3, height: 1 })
    expect(standOf(state, 'southWest').type).toBe('standCorner')
    expect(Object.values(state.buildings).filter((b) => b.attach).map((b) => b.attach?.slot).sort())
      .toEqual(['south', 'southWest', 'west'])
  })

  it('si una grada no cabe en el destino, no se mueve nada', () => {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 })
    placeStand(state, 'north')
    placeStand(state, 'east')
    // Estorbo justo donde caería la grada norte nueva (y=9, campo nuevo en (5,10)).
    place(state, 'small', { x: 6, y: 9 })
    const antes = structuredClone(state)

    expect(run(state, moveCmd(1, { x: 5, y: 10 }))).toEqual({ ok: false, reason: 'occupied' })

    expect(state).toEqual(antes)
    expect(state.buildings[1]?.origin).toEqual({ x: 5, y: 5 })
  })

  it('si la grada se sale del mapa, no se mueve nada', () => {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 })
    placeStand(state, 'north')
    const antes = structuredClone(state)

    // Campo en la fila 0: la grada norte caería en y=-1.
    expect(run(state, moveCmd(1, { x: 5, y: 0 }))).toEqual({ ok: false, reason: 'outOfBounds' })
    expect(state).toEqual(antes)
  })
})

describe('moveBuilding: objetos que requieren una sala', () => {
  it('sacar el objeto de la sala hace que vuelva a faltar', () => {
    const state = createTestMap()
    // Edificio de 6×5 (interior 4×3 en x 3..6, y 3..5) con puerta en (4,2).
    ok(state, {
      type: 'buildFoundation',
      rect: { x: 2, y: 2, width: 6, height: 5 },
      wall: 'brick',
      floor: 'dirt',
    })
    ok(state, { type: 'placeDoor', tile: { x: 4, y: 2 }, door: 'door' })
    const obj = place(state, 'small', { x: 3, y: 3 })
    const designated = run(state, {
      type: 'designateRoom',
      tile: { x: 3, y: 3 },
      roomType: 'kit',
    })
    if (!designated.ok || designated.event.type !== 'roomDesignated') throw new Error('sin sala')
    const roomId = designated.event.roomId

    expect(evaluateRoom(state, TEST_CONTENT, roomId)).toMatchObject({ ok: true, missing: [] })

    ok(state, moveCmd(obj.id, { x: 12, y: 12 }))

    const status = evaluateRoom(state, TEST_CONTENT, roomId)
    expect(status?.ok).toBe(false)
    expect(status?.missing).toEqual([{ object: 'small', need: 1, have: 0 }])

    // Y al volver dentro, la sala se cumple otra vez.
    ok(state, moveCmd(obj.id, { x: 4, y: 4 }))
    expect(evaluateRoom(state, TEST_CONTENT, roomId)).toMatchObject({ ok: true, missing: [] })
  })
})

describe('rotateSlot', () => {
  it.each<[StandSlot, number, StandSlot]>([
    ['north', 0, 'north'],
    ['north', 1, 'east'],
    ['east', 1, 'south'],
    ['south', 1, 'west'],
    ['west', 1, 'north'],
    ['north', 2, 'south'],
    ['west', 3, 'south'],
    ['north', 4, 'north'],
    ['northEast', 1, 'southEast'],
    ['southEast', 1, 'southWest'],
    ['southWest', 1, 'northWest'],
    ['northWest', 1, 'northEast'],
    ['northEast', 2, 'southWest'],
  ])('%s con %i giros → %s', (slot, turns, expected) => {
    expect(rotateSlot(slot, turns)).toBe(expected)
  })

  it.each<[StandSlot, number, StandSlot]>([
    ['north', -1, 'west'],
    ['north', -3, 'east'],
    ['east', -1, 'north'],
    ['south', -2, 'north'],
    ['northEast', -1, 'northWest'],
    ['southWest', -3, 'northWest'],
    ['northWest', -3, 'northEast'],
  ])('giros negativos: %s con %i giros → %s', (slot, turns, expected) => {
    expect(rotateSlot(slot, turns)).toBe(expected)
  })

  it('un lado nunca se convierte en esquina ni al revés', () => {
    for (let turns = -4; turns <= 4; turns++) {
      expect(['north', 'east', 'south', 'west']).toContain(rotateSlot('north', turns))
      expect(['northEast', 'southEast', 'southWest', 'northWest']).toContain(
        rotateSlot('northEast', turns),
      )
    }
  })
})
