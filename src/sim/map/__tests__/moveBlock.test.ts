/** Tests de mover un bloque: transformTile, blockTarget, planBlockMove, applyBlockMove y el comando. */
import { describe, expect, it } from 'vitest'
import { executeCommand, type Command } from '../../commands'
import type { PlacedBuilding, StandSlot } from '../../buildings/buildings'
import { placementRect, standDepth, standPlacement } from '../../buildings/stands'
import { tilesInRect, type Rotation, type TileCoord, type TileRect } from '../../geometry'
import { NO_ROOM } from '../../rooms/roomTypes'
import { evaluateRoom } from '../../rooms/rooms'
import { createTestMap, TEST_CONTENT } from '../../__tests__/fixtures'
import { DEFAULT_FLOOR } from '../floors'
import { buildingFootprint, EMPTY_TILE, tileIndex, type MapState } from '../map'
import { applyBlockMove, blockTarget, planBlockMove, transformTile } from '../moveBlock'
import { doorAxis } from '../structures'
import { NO_DOOR, NO_WALL } from '../structureTypes'

const run = (state: MapState, command: Command) => executeCommand(state, command, TEST_CONTENT)

function ok(state: MapState, command: Command): void {
  expect(run(state, command).ok).toBe(true)
}

const moveCmd = (rect: TileRect, to: TileCoord, rotation: Rotation = 0): Command => ({
  type: 'moveBlock',
  rect,
  to,
  rotation,
})

function place(state: MapState, buildingType: string, origin: TileCoord, rotation: Rotation = 0) {
  const result = run(state, { type: 'placeBuilding', buildingType, origin, rotation })
  if (!result.ok || result.event.type !== 'buildingPlaced') throw new Error('no se colocó')
  return result.event.building
}

function placeStand(state: MapState, slot: StandSlot, type = 'stand'): PlacedBuilding {
  const result = run(state, { type: 'placeStand', buildingType: type, pitchId: 1, slot })
  if (!result.ok || result.event.type !== 'buildingPlaced') throw new Error('no se colocó la grada')
  return result.event.building
}

/** Vestuario 6×5 en (2,2): muros, puerta en (4,2), sala 'kit' con un 'small' y un 'tiered' girado. */
const LOCKER_RECT: TileRect = { x: 2, y: 2, width: 6, height: 5 }
function lockerRoom() {
  const state = createTestMap()
  ok(state, { type: 'buildFoundation', rect: LOCKER_RECT, wall: 'brick', floor: 'dirt' })
  ok(state, { type: 'placeDoor', tile: { x: 4, y: 2 }, door: 'door' })
  const small = place(state, 'small', { x: 3, y: 3 })
  const tiered = place(state, 'tiered', { x: 6, y: 5 }, 1)
  ok(state, { type: 'upgradeBuilding', buildingId: tiered.id })
  const designated = run(state, { type: 'designateRoom', tile: { x: 3, y: 3 }, roomType: 'kit' })
  if (!designated.ok || designated.event.type !== 'roomDesignated') throw new Error('sin sala')
  return { state, small, tiered, roomId: designated.event.roomId }
}

/** Lee todas las capas de una casilla. */
function layers(state: MapState, tile: TileCoord) {
  const i = tileIndex(state, tile)
  return {
    floor: state.floors[i],
    wall: state.walls[i],
    door: state.doors[i],
    indoor: state.indoor[i],
    room: state.roomOf[i],
  }
}

const countTiles = (state: MapState, id: number) => state.occupancy.filter((v) => v === id).length

/** Compara que cada casilla del bloque original (clon `before`) esté en su destino. */
function expectBlockMoved(
  before: MapState,
  after: MapState,
  rect: TileRect,
  to: TileCoord,
  rotation: Rotation,
): void {
  const destinations = new Set<string>()
  for (const tile of tilesInRect(rect)) {
    const dest = transformTile(rect, to, rotation, tile)
    destinations.add(`${dest.x},${dest.y}`)
    expect(layers(after, dest)).toEqual(layers(before, tile))
  }
  // Lo que queda del origen fuera del destino está limpio
  const inTarget = (t: TileCoord) => destinations.has(`${t.x},${t.y}`)
  for (const tile of tilesInRect(rect)) {
    if (inTarget(tile)) continue
    expect(layers(after, tile)).toEqual({
      floor: DEFAULT_FLOOR,
      wall: NO_WALL,
      door: NO_DOOR,
      indoor: false,
      room: NO_ROOM,
    })
    expect(after.occupancy[tileIndex(after, tile)]).toBe(EMPTY_TILE)
  }
}

describe('transformTile y blockTarget', () => {
  const rect: TileRect = { x: 2, y: 3, width: 3, height: 2 }
  const to = { x: 10, y: 10 }
  const corners = [
    { x: 2, y: 3 }, // arriba izquierda
    { x: 4, y: 3 }, // arriba derecha
    { x: 2, y: 4 }, // abajo izquierda
    { x: 4, y: 4 }, // abajo derecha
  ]

  it('sin giro: solo se traslada y el tamaño no cambia', () => {
    expect(corners.map((c) => transformTile(rect, to, 0, c))).toEqual([
      { x: 10, y: 10 },
      { x: 12, y: 10 },
      { x: 10, y: 11 },
      { x: 12, y: 11 },
    ])
    expect(blockTarget(rect, to, 0)).toEqual({ x: 10, y: 10, width: 3, height: 2 })
  })

  it('giro 1 (90° horario): arriba izquierda pasa a arriba derecha', () => {
    expect(corners.map((c) => transformTile(rect, to, 1, c))).toEqual([
      { x: 11, y: 10 },
      { x: 11, y: 12 },
      { x: 10, y: 10 },
      { x: 10, y: 12 },
    ])
    expect(blockTarget(rect, to, 1)).toEqual({ x: 10, y: 10, width: 2, height: 3 })
  })

  it('giro 2 (180°): esquinas opuestas', () => {
    expect(corners.map((c) => transformTile(rect, to, 2, c))).toEqual([
      { x: 12, y: 11 },
      { x: 10, y: 11 },
      { x: 12, y: 10 },
      { x: 10, y: 10 },
    ])
    expect(blockTarget(rect, to, 2)).toEqual({ x: 10, y: 10, width: 3, height: 2 })
  })

  it('giro 3 (270° horario): arriba izquierda pasa a abajo izquierda', () => {
    expect(corners.map((c) => transformTile(rect, to, 3, c))).toEqual([
      { x: 10, y: 12 },
      { x: 10, y: 10 },
      { x: 11, y: 12 },
      { x: 11, y: 10 },
    ])
    expect(blockTarget(rect, to, 3)).toEqual({ x: 10, y: 10, width: 2, height: 3 })
  })

  it.each<Rotation>([0, 1, 2, 3])(
    'giro %i: es una biyección sobre el rectángulo de destino',
    (r) => {
      const target = blockTarget(rect, to, r)
      const seen = new Set<string>()
      for (const tile of tilesInRect(rect)) {
        const d = transformTile(rect, to, r, tile)
        expect(d.x).toBeGreaterThanOrEqual(target.x)
        expect(d.y).toBeGreaterThanOrEqual(target.y)
        expect(d.x).toBeLessThan(target.x + target.width)
        expect(d.y).toBeLessThan(target.y + target.height)
        seen.add(`${d.x},${d.y}`)
      }
      expect(seen.size).toBe(6)
    },
  )
})

describe('mover un vestuario completo', () => {
  it('a un sitio libre sin girar: todo viaja y el origen queda limpio', () => {
    const { state, small, tiered, roomId } = lockerRoom()
    const before = structuredClone(state)
    const to = { x: 10, y: 8 }

    const result = run(state, moveCmd(LOCKER_RECT, to))
    expect(result.ok).toBe(true)

    expectBlockMoved(before, state, LOCKER_RECT, to, 0)
    // Muros, suelo, puerta e interior en el destino
    expect(layers(state, { x: 10, y: 8 }).wall).not.toBe(NO_WALL)
    expect(layers(state, { x: 12, y: 8 }).door).not.toBe(NO_DOOR)
    expect(layers(state, { x: 11, y: 9 })).toMatchObject({ floor: 'dirt', indoor: true })
    // Origen limpio (todo el rectángulo cae fuera del destino)
    expect(layers(state, { x: 2, y: 2 }).wall).toBe(NO_WALL)
    expect(layers(state, { x: 4, y: 2 }).door).toBe(NO_DOOR)
    expect(layers(state, { x: 3, y: 3 })).toMatchObject({
      floor: DEFAULT_FLOOR,
      indoor: false,
      room: NO_ROOM,
    })
    // Sala: mismo id y tipo, y sigue cumpliendo
    expect(layers(state, { x: 11, y: 9 }).room).toBe(roomId)
    expect(state.rooms[roomId]?.type).toBe('kit')
    expect(evaluateRoom(state, TEST_CONTENT, roomId)).toMatchObject({ ok: true, missing: [] })
    // Objetos: mismo id, nivel y giro
    expect(state.buildings[small.id]).toEqual({ ...small, origin: { x: 11, y: 9 } })
    expect(state.buildings[tiered.id]).toMatchObject({
      id: tiered.id,
      tier: 1,
      rotation: 1,
      origin: { x: 14, y: 11 },
    })
    expect(countTiles(state, small.id)).toBe(1)
    expect(countTiles(state, tiered.id)).toBe(1)
    expect(state.occupancy[tileIndex(state, { x: 3, y: 3 })]).toBe(EMPTY_TILE)
    expect(state.occupancy[tileIndex(state, { x: 6, y: 5 })]).toBe(EMPTY_TILE)
    expect(state.occupancy[tileIndex(state, { x: 11, y: 9 })]).toBe(small.id)
  })

  it('girado 90°: muros, suelo, puerta y objetos girados', () => {
    const { state, small, tiered, roomId } = lockerRoom()
    const before = structuredClone(state)
    const to = { x: 10, y: 4 }
    expect(doorAxis(state, { x: 4, y: 2 })).toBe('vertical')

    const result = run(state, moveCmd(LOCKER_RECT, to, 1))
    expect(result.ok).toBe(true)

    expectBlockMoved(before, state, LOCKER_RECT, to, 1)
    // Rectángulo de destino 5×6
    const target = blockTarget(LOCKER_RECT, to, 1)
    expect(target).toEqual({ x: 10, y: 4, width: 5, height: 6 })
    // La puerta del muro norte pasa al muro este y sigue en un muro recto
    const door = transformTile(LOCKER_RECT, to, 1, { x: 4, y: 2 })
    expect(door).toEqual({ x: 14, y: 6 })
    expect(layers(state, door).door).not.toBe(NO_DOOR)
    expect(doorAxis(state, door)).toBe('horizontal')
    // Esquinas del perímetro con muro
    for (const c of [
      { x: 10, y: 4 },
      { x: 14, y: 4 },
      { x: 10, y: 9 },
      { x: 14, y: 9 },
    ]) {
      expect(layers(state, c).wall).not.toBe(NO_WALL)
    }
    // Objetos: giro + 1 y casilla transformada
    expect(state.buildings[small.id]?.rotation).toBe(1)
    expect(state.buildings[small.id]?.origin).toEqual(
      transformTile(LOCKER_RECT, to, 1, { x: 3, y: 3 }),
    )
    expect(state.buildings[tiered.id]?.rotation).toBe(2)
    expect(state.buildings[tiered.id]?.tier).toBe(1)
    expect(state.buildings[tiered.id]?.origin).toEqual(
      transformTile(LOCKER_RECT, to, 1, { x: 6, y: 5 }),
    )
    expect(evaluateRoom(state, TEST_CONTENT, roomId)).toMatchObject({ ok: true, missing: [] })
  })

  it('solapando parcialmente su propia posición (2 casillas a la derecha)', () => {
    const { state, small, tiered, roomId } = lockerRoom()
    const before = structuredClone(state)
    const to = { x: 4, y: 2 }

    const result = run(state, moveCmd(LOCKER_RECT, to))
    expect(result.ok).toBe(true)

    expectBlockMoved(before, state, LOCKER_RECT, to, 0)
    // Columnas libres que deja atrás: x=2..3 limpias
    expect(layers(state, { x: 2, y: 4 }).wall).toBe(NO_WALL)
    expect(layers(state, { x: 3, y: 4 }).indoor).toBe(false)
    // Los muros nuevos están donde deben
    expect(layers(state, { x: 4, y: 4 }).wall).not.toBe(NO_WALL)
    expect(layers(state, { x: 9, y: 4 }).wall).not.toBe(NO_WALL)
    expect(layers(state, { x: 6, y: 2 }).door).not.toBe(NO_DOOR)
    expect(state.buildings[small.id]?.origin).toEqual({ x: 5, y: 3 })
    expect(state.buildings[tiered.id]?.origin).toEqual({ x: 8, y: 5 })
    expect(countTiles(state, small.id)).toBe(1)
    expect(countTiles(state, tiered.id)).toBe(1)
    expect(state.occupancy[tileIndex(state, { x: 3, y: 3 })]).toBe(EMPTY_TILE)
    expect(evaluateRoom(state, TEST_CONTENT, roomId)).toMatchObject({ ok: true, missing: [] })
  })

  it('la hierba sin pintar del rectángulo no pisa el suelo del destino', () => {
    const state = createTestMap()
    ok(state, {
      type: 'buildFoundation',
      rect: { x: 2, y: 2, width: 3, height: 3 },
      wall: 'brick',
      floor: 'dirt',
    })
    // Rectángulo de 5×3: las columnas x=5..6 son hierba sin nada
    const rect = { x: 2, y: 2, width: 5, height: 3 }
    // Camino de piedra donde caería la hierba (x=5..6 → 15..16)
    ok(state, { type: 'paintFloor', rect: { x: 15, y: 2, width: 2, height: 3 }, floor: 'stone' })

    ok(state, moveCmd(rect, { x: 10, y: 2 }))

    expect(layers(state, { x: 15, y: 3 }).floor).toBe('stone')
    expect(layers(state, { x: 16, y: 4 }).floor).toBe('stone')
    expect(layers(state, { x: 10, y: 2 })).toMatchObject({ floor: 'dirt' })
    expect(layers(state, { x: 10, y: 2 }).wall).not.toBe(NO_WALL)
  })
})

describe('moveBlock: errores (el estado no cambia)', () => {
  function fails(state: MapState, command: Command, reason: string): void {
    const antes = structuredClone(state)
    expect(run(state, command)).toEqual({ ok: false, reason })
    expect(state).toEqual(antes)
  }

  it("rectángulo sin nada: 'nothingToMove'", () => {
    const state = createTestMap()
    fails(state, moveCmd({ x: 10, y: 10, width: 3, height: 3 }, { x: 5, y: 5 }), 'nothingToMove')
  })

  it("solo casillas reservadas: 'nothingToMove'", () => {
    const state = createTestMap()
    fails(state, moveCmd({ x: 18, y: 0, width: 2, height: 3 }, { x: 5, y: 5 }), 'nothingToMove')
  })

  it("rectángulo fuera del mapa: 'outOfBounds'", () => {
    const { state } = lockerRoom()
    fails(state, moveCmd({ x: 16, y: 2, width: 6, height: 5 }, { x: 5, y: 5 }), 'outOfBounds')
  })

  it("mismo sitio y giro: 'samePlace'", () => {
    const { state } = lockerRoom()
    fails(state, moveCmd(LOCKER_RECT, { x: 2, y: 2 }, 0), 'samePlace')
  })

  it('mismo sitio con otro giro sí se puede', () => {
    const { state } = lockerRoom()
    // 6×5 girado 90° en (2,2) → 5×6 (x 2..6, y 2..7): cabe y solapa
    ok(state, moveCmd(LOCKER_RECT, { x: 2, y: 2 }, 1))
  })

  it("rectángulo que corta un objeto a medias: 'cutsObject' con conflicts", () => {
    const state = createTestMap()
    place(state, 'wide', { x: 2, y: 2 }) // 3×2 en x 2..4, y 2..3
    const rect = { x: 2, y: 2, width: 2, height: 2 }

    const check = planBlockMove(state, TEST_CONTENT, rect, { x: 10, y: 10 }, 0)
    expect(check.ok).toBe(false)
    if (check.ok) return
    expect(check.reason).toBe('cutsObject')
    expect(check.conflicts).toEqual([
      { x: 4, y: 2 },
      { x: 4, y: 3 },
    ])
    fails(state, moveCmd(rect, { x: 10, y: 10 }), 'cutsObject')
  })

  it("rectángulo que corta una sala: 'cutsRoom' con conflicts", () => {
    const { state, roomId } = lockerRoom()
    // Filas y=2..4: deja fuera la fila interior y=5 de la sala; los objetos (y=3, y=5)...
    // el 'tiered' (6,5) queda fuera del rectángulo, así que solo corta la sala
    const rect = { x: 2, y: 2, width: 6, height: 3 }
    const check = planBlockMove(state, TEST_CONTENT, rect, { x: 10, y: 10 }, 0)
    expect(check.ok).toBe(false)
    if (check.ok) return
    expect(check.reason).toBe('cutsRoom')
    expect(check.conflicts?.length).toBeGreaterThan(0)
    for (const tile of check.conflicts ?? []) {
      expect(state.roomOf[tileIndex(state, tile)]).toBe(roomId)
      expect(tile.y).toBe(5)
    }
    fails(state, moveCmd(rect, { x: 10, y: 10 }), 'cutsRoom')
  })

  it("destino con un objeto de otro: 'blocked' con conflicts", () => {
    const { state } = lockerRoom()
    place(state, 'small', { x: 12, y: 10 })
    const check = planBlockMove(state, TEST_CONTENT, LOCKER_RECT, { x: 10, y: 8 }, 0)
    expect(check.ok).toBe(false)
    if (check.ok) return
    expect(check.reason).toBe('blocked')
    expect(check.conflicts).toContainEqual({ x: 12, y: 10 })
    fails(state, moveCmd(LOCKER_RECT, { x: 10, y: 8 }), 'blocked')
  })

  it("destino con un muro de otro: 'blocked'", () => {
    const { state } = lockerRoom()
    ok(state, {
      type: 'buildFoundation',
      rect: { x: 12, y: 12, width: 3, height: 3 },
      wall: 'brick',
      floor: 'dirt',
    })
    const check = planBlockMove(state, TEST_CONTENT, LOCKER_RECT, { x: 10, y: 8 }, 0)
    expect(check.ok).toBe(false)
    if (check.ok) return
    expect(check.reason).toBe('blocked')
    expect(check.conflicts?.length).toBeGreaterThan(0)
    fails(state, moveCmd(LOCKER_RECT, { x: 10, y: 8 }), 'blocked')
  })

  it("destino fuera del mapa: 'outOfBounds'", () => {
    const { state } = lockerRoom()
    fails(state, moveCmd(LOCKER_RECT, { x: -1, y: 2 }), 'outOfBounds')
    fails(state, moveCmd(LOCKER_RECT, { x: 2, y: 17 }), 'outOfBounds')
  })

  it("destino sobre casilla reservada: 'reserved'", () => {
    const { state } = lockerRoom()
    // x 13..18: la última columna cae en la carretera reservada
    const check = planBlockMove(state, TEST_CONTENT, LOCKER_RECT, { x: 13, y: 2 }, 0)
    expect(check.ok).toBe(false)
    if (check.ok) return
    expect(check.reason).toBe('reserved')
    expect(check.conflicts?.every((t) => t.x === 18)).toBe(true)
    fails(state, moveCmd(LOCKER_RECT, { x: 13, y: 2 }), 'reserved')
  })

  it('planBlockMove no modifica el estado ni siquiera cuando todo es válido', () => {
    const { state } = lockerRoom()
    const antes = structuredClone(state)
    const check = planBlockMove(state, TEST_CONTENT, LOCKER_RECT, { x: 10, y: 8 }, 0)
    expect(check.ok).toBe(true)
    expect(state).toEqual(antes)
  })

  it('applyBlockMove aplica un plan válido', () => {
    const { state, small } = lockerRoom()
    const check = planBlockMove(state, TEST_CONTENT, LOCKER_RECT, { x: 10, y: 8 }, 0)
    if (!check.ok) throw new Error('plan inválido')
    applyBlockMove(state, TEST_CONTENT, check)
    expect(state.buildings[small.id]?.origin).toEqual({ x: 11, y: 9 })
  })
})

describe('moveBlock: campo con gradas', () => {
  /** Campo 4×3 en (5,5) con norte, sur, este, oeste y córner NE (x 4..9, y 4..8). */
  function pitchWithStands() {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 }) // id 1
    for (const slot of ['north', 'south', 'east', 'west'] as const) placeStand(state, slot)
    placeStand(state, 'northEast', 'standCorner')
    return state
  }
  const FULL_RECT: TileRect = { x: 4, y: 4, width: 6, height: 5 }

  /** Cada grada está donde diría `standPlacement` respecto al campo actual. */
  function expectStandsGlued(state: MapState, expectedSlots: StandSlot[]): void {
    const pitch = state.buildings[1]
    if (!pitch) throw new Error('sin campo')
    const pitchRect = buildingFootprint(pitch, TEST_CONTENT.buildings['field']!)
    const stands = Object.values(state.buildings).filter((b) => b.attach)
    expect(stands.map((s) => s.attach?.slot).sort()).toEqual([...expectedSlots].sort())
    for (const stand of stands) {
      const def = TEST_CONTENT.buildings[stand.type]!
      const placement = standPlacement(pitchRect, stand.attach!.slot, standDepth(def, stand.tier)!)
      expect(placement).not.toBeNull()
      expect({ origin: stand.origin, rotation: stand.rotation, size: stand.size }).toEqual(
        placement,
      )
      expect(buildingFootprint(stand, def)).toEqual(placementRect(placement!))
      expect(countTiles(state, stand.id)).toBe(
        placementRect(placement!).width * placementRect(placement!).height,
      )
    }
  }

  it('rectángulo que cubre campo y gradas: todo se mueve, pegado al campo', () => {
    const state = pitchWithStands()
    const ids = Object.keys(state.buildings).map(Number)

    const result = run(state, moveCmd(FULL_RECT, { x: 4, y: 10 }))
    expect(result.ok).toBe(true)

    expect(Object.keys(state.buildings).map(Number)).toEqual(ids)
    expect(state.buildings[1]?.origin).toEqual({ x: 5, y: 11 })
    expectStandsGlued(state, ['north', 'south', 'east', 'west', 'northEast'])
    // Origen libre
    for (const tile of tilesInRect(FULL_RECT)) {
      expect(state.occupancy[tileIndex(state, tile)]).toBe(EMPTY_TILE)
    }
  })

  it('girando 90° con dos lados y un córner: huecos girados y gradas pegadas', () => {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 })
    const north = placeStand(state, 'north')
    const east = placeStand(state, 'east')
    const corner = placeStand(state, 'northEast', 'standCorner')
    // Cubre norte (y=4), campo (x 5..8, y 5..7), este (x=9) y el córner (9,4)
    const rect = { x: 5, y: 4, width: 5, height: 4 }

    const result = run(state, moveCmd(rect, { x: 10, y: 2 }, 1))
    expect(result.ok).toBe(true)

    expect(state.buildings[1]?.rotation).toBe(1)
    expect(state.buildings[north.id]?.attach?.slot).toBe('east')
    expect(state.buildings[east.id]?.attach?.slot).toBe('south')
    expect(state.buildings[corner.id]?.attach?.slot).toBe('southEast')
    expectStandsGlued(state, ['east', 'south', 'southEast'])
  })

  it('girando 180° con los cuatro lados y el córner', () => {
    const state = pitchWithStands()
    ok(state, moveCmd(FULL_RECT, { x: 10, y: 10 }, 2))
    expectStandsGlued(state, ['south', 'north', 'west', 'east', 'southWest'])
  })

  it("si el rectángulo deja una grada fuera: 'cutsObject'", () => {
    const state = pitchWithStands()
    // Sin la columna x=4: deja fuera la grada oeste
    const rect = { x: 5, y: 4, width: 5, height: 5 }
    const check = planBlockMove(state, TEST_CONTENT, rect, { x: 5, y: 10 }, 0)
    expect(check.ok).toBe(false)
    if (check.ok) return
    expect(check.reason).toBe('cutsObject')
    expect(check.conflicts).toContainEqual({ x: 4, y: 5 })
    const antes = structuredClone(state)
    expect(run(state, moveCmd(rect, { x: 5, y: 10 }))).toEqual({ ok: false, reason: 'cutsObject' })
    expect(state).toEqual(antes)
  })

  it("solo el campo, sin sus gradas: 'cutsObject'", () => {
    const state = pitchWithStands()
    const antes = structuredClone(state)
    const rect = { x: 5, y: 5, width: 4, height: 3 }
    expect(run(state, moveCmd(rect, { x: 5, y: 12 }))).toEqual({ ok: false, reason: 'cutsObject' })
    expect(state).toEqual(antes)
  })
})

describe('moveBlock: evento blockMoved', () => {
  it('trae from, to girado y todos los objetos movidos', () => {
    const { state, small, tiered } = lockerRoom()
    const to = { x: 10, y: 4 }

    const result = run(state, moveCmd(LOCKER_RECT, to, 1))

    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'blockMoved') throw new Error('evento incorrecto')
    expect(result.event.from).toEqual(LOCKER_RECT)
    expect(result.event.to).toEqual({ x: 10, y: 4, width: 5, height: 6 })
    expect(result.event.moves.map((m) => m.from.id).sort()).toEqual([small.id, tiered.id].sort())
    for (const move of result.event.moves) {
      expect(move.to).toEqual(state.buildings[move.from.id])
      expect(move.from.rotation).not.toBe(move.to.rotation)
    }
  })

  it.each<Rotation>([0, 2])('to es el rectángulo de destino también con giro %i', (rotation) => {
    const { state } = lockerRoom()
    const result = run(state, moveCmd(LOCKER_RECT, { x: 10, y: 8 }, rotation))
    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'blockMoved') throw new Error('evento incorrecto')
    expect(result.event.to).toEqual({ x: 10, y: 8, width: 6, height: 5 })
  })

  it('con un campo y sus gradas, moves incluye las seis piezas', () => {
    const state = createTestMap()
    place(state, 'field', { x: 5, y: 5 })
    for (const slot of ['north', 'south', 'east', 'west'] as const) placeStand(state, slot)
    placeStand(state, 'northEast', 'standCorner')

    const result = run(state, moveCmd({ x: 4, y: 4, width: 6, height: 5 }, { x: 4, y: 10 }))

    expect(result.ok).toBe(true)
    if (!result.ok || result.event.type !== 'blockMoved') throw new Error('evento incorrecto')
    expect(result.event.moves).toHaveLength(6)
  })
})
