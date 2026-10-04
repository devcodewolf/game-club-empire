/**
 * Salas: designación por relleno (flood fill) y evaluación de requisitos.
 *
 * Como en Prison Architect: eliges un tipo de sala y haces clic dentro de un
 * edificio; la sala ocupa todo el espacio interior conectado, delimitado por
 * muros y puertas. Una sala "funciona" si está cerrada, tiene puerta, cumple
 * el tamaño mínimo y tiene los objetos requeridos.
 */
import { tierQuality, type BuildingTypeId } from '../buildings/buildings'
import type { SimContent } from '../content'
import { isInsideGrid, type TileCoord, type TileRect } from '../geometry'
import { buildingFootprint, tileIndex, type MapState } from '../map/map'
import { NO_ROOM, type RoomId, type RoomTypeId } from './roomTypes'
import { isEnclosure } from '../map/structures'
import { NO_DOOR } from '../map/structureTypes'

const NEIGHBOURS: readonly TileCoord[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

/** Espacio interior conectado a partir de una casilla. */
export interface Region {
  readonly tiles: readonly TileCoord[]
  /** ¿Está cerrado por muros y puertas? (false si se "escapa" al exterior). */
  readonly enclosed: boolean
  /** ¿Tiene alguna puerta en su borde? */
  readonly hasDoor: boolean
  readonly bounds: TileRect
}

/**
 * Relleno desde `start` por casillas interiores que no son muro ni puerta.
 * Si toca una casilla exterior (sin muro), el espacio no está cerrado.
 */
export function regionFrom(state: MapState, start: TileCoord): Region {
  const { width, height } = state.size
  const seen = new Set<number>()
  const tiles: TileCoord[] = []
  let enclosed = true
  let hasDoor = false
  let minX = start.x
  let minY = start.y
  let maxX = start.x
  let maxY = start.y

  const stack: TileCoord[] = [start]
  seen.add(tileIndex(state, start))

  while (stack.length > 0) {
    const tile = stack.pop()
    if (!tile) break
    tiles.push(tile)
    minX = Math.min(minX, tile.x)
    minY = Math.min(minY, tile.y)
    maxX = Math.max(maxX, tile.x)
    maxY = Math.max(maxY, tile.y)

    for (const d of NEIGHBOURS) {
      const next = { x: tile.x + d.x, y: tile.y + d.y }
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) {
        enclosed = false
        continue
      }
      const index = tileIndex(state, next)
      if (state.doors[index] !== NO_DOOR) hasDoor = true
      if (isEnclosure(state, next)) continue
      if (!state.indoor[index]) {
        enclosed = false
        continue
      }
      if (seen.has(index)) continue
      seen.add(index)
      stack.push(next)
    }
  }

  return {
    tiles,
    enclosed,
    hasDoor,
    bounds: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
  }
}

// ── Designar y quitar ────────────────────────────────────────────

export type RoomError =
  'unknownRoom' | 'outOfBounds' | 'notIndoor' | 'wall' | 'alreadyDesignated' | 'noRoom'

export type RoomCheck = { readonly ok: true } | { readonly ok: false; readonly reason: RoomError }

export function validateDesignateRoom(
  state: MapState,
  content: SimContent,
  tile: TileCoord,
  roomType: RoomTypeId,
): RoomCheck {
  if (!content.rooms[roomType]) return { ok: false, reason: 'unknownRoom' }
  if (!isInsideGrid(tile, state.size)) return { ok: false, reason: 'outOfBounds' }
  if (isEnclosure(state, tile)) return { ok: false, reason: 'wall' }
  if (!state.indoor[tileIndex(state, tile)]) return { ok: false, reason: 'notIndoor' }

  const current = state.roomOf[tileIndex(state, tile)]
  const currentType = current ? state.rooms[current]?.type : undefined
  if (currentType === roomType) return { ok: false, reason: 'alreadyDesignated' }
  return { ok: true }
}

/**
 * Convierte en sala todo el espacio interior conectado a `tile` (ya
 * validado). Las salas anteriores que pierdan todas sus casillas desaparecen.
 * Devuelve el id de la sala nueva.
 */
export function applyDesignateRoom(state: MapState, tile: TileCoord, roomType: RoomTypeId): RoomId {
  const id = state.nextRoomId
  state.nextRoomId += 1
  state.rooms[id] = { id, type: roomType }

  for (const t of regionFrom(state, tile).tiles) state.roomOf[tileIndex(state, t)] = id
  removeEmptyRooms(state)
  return id
}

export function validateRemoveRoom(state: MapState, tile: TileCoord): RoomCheck {
  if (!isInsideGrid(tile, state.size)) return { ok: false, reason: 'outOfBounds' }
  return roomAt(state, tile) === NO_ROOM ? { ok: false, reason: 'noRoom' } : { ok: true }
}

/** Quita la designación de la sala que contiene `tile` (ya validado). */
export function applyRemoveRoom(state: MapState, tile: TileCoord): RoomId {
  const id = roomAt(state, tile)
  for (let i = 0; i < state.roomOf.length; i++) {
    if (state.roomOf[i] === id) state.roomOf[i] = NO_ROOM
  }
  delete state.rooms[id]
  return id
}

/** Borra del registro las salas que ya no tienen ninguna casilla. */
export function removeEmptyRooms(state: MapState): void {
  const used = new Set(state.roomOf)
  for (const key of Object.keys(state.rooms)) {
    const id = Number(key)
    if (!used.has(id)) delete state.rooms[id]
  }
}

export function roomAt(state: MapState, tile: TileCoord): RoomId {
  if (!isInsideGrid(tile, state.size)) return NO_ROOM
  return state.roomOf[tileIndex(state, tile)] ?? NO_ROOM
}

// ── Evaluación ───────────────────────────────────────────────────

export interface MissingObject {
  readonly object: BuildingTypeId
  readonly need: number
  readonly have: number
}

export interface RoomStatus {
  readonly id: RoomId
  readonly type: RoomTypeId
  readonly tiles: readonly TileCoord[]
  readonly bounds: TileRect
  readonly enclosed: boolean
  readonly hasDoor: boolean
  readonly tooSmall: boolean
  readonly missing: readonly MissingObject[]
  /** Objetos de cada tipo que hay dentro de la sala. */
  readonly objects: Readonly<Record<BuildingTypeId, number>>
  readonly capacity: number
  /** Suma de la calidad de los objetos de la sala según su nivel. */
  readonly quality: number
  /** ¿Cumple todos los requisitos? */
  readonly ok: boolean
}

/** Estado de una sala: qué tiene, qué le falta y para cuántos da. */
export function evaluateRoom(
  state: MapState,
  content: SimContent,
  id: RoomId,
): RoomStatus | undefined {
  const room = state.rooms[id]
  const def = room && content.rooms[room.type]
  if (!room || !def) return undefined

  const tiles: TileCoord[] = []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const { width } = state.size
  for (let i = 0; i < state.roomOf.length; i++) {
    if (state.roomOf[i] !== id) continue
    const tile = { x: i % width, y: Math.floor(i / width) }
    tiles.push(tile)
    minX = Math.min(minX, tile.x)
    minY = Math.min(minY, tile.y)
    maxX = Math.max(maxX, tile.x)
    maxY = Math.max(maxY, tile.y)
  }
  const bounds = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  const region = tiles[0] ? regionFrom(state, tiles[0]) : undefined

  // Objetos cuya huella cae (aunque sea en parte) dentro de la sala
  const objects: Record<BuildingTypeId, number> = {}
  let quality = 0
  for (const building of Object.values(state.buildings)) {
    const bdef = content.buildings[building.type]
    if (!bdef) continue
    const rect = buildingFootprint(building, bdef)
    let inside = false
    for (let y = rect.y; y < rect.y + rect.height && !inside; y++) {
      for (let x = rect.x; x < rect.x + rect.width && !inside; x++) {
        if (state.roomOf[tileIndex(state, { x, y })] === id) inside = true
      }
    }
    if (!inside) continue
    objects[building.type] = (objects[building.type] ?? 0) + 1
    quality += tierQuality(bdef, building.tier)
  }

  const missing = def.requirements
    .map((req) => ({ object: req.object, need: req.min, have: objects[req.object] ?? 0 }))
    .filter((m) => m.have < m.need)

  const fits = (a: number, b: number): boolean => a >= def.minSize.width && b >= def.minSize.height
  const tooSmall = !fits(bounds.width, bounds.height) && !fits(bounds.height, bounds.width)
  const enclosed = region?.enclosed ?? false
  const hasDoor = region?.hasDoor ?? false
  const capacity = def.capacity ? (objects[def.capacity.object] ?? 0) * def.capacity.per : 0

  return {
    id,
    type: room.type,
    tiles,
    bounds,
    enclosed,
    hasDoor,
    tooSmall,
    missing,
    objects,
    capacity,
    quality,
    ok: enclosed && hasDoor && !tooSmall && missing.length === 0,
  }
}
