/**
 * Muros, cimientos y puertas: validaciones (puras) y mutaciones.
 *
 * Reglas, inspiradas en Prison Architect:
 *  - Un muro ocupa una casilla entera. No se construye sobre casillas
 *    reservadas, objetos ni puertas.
 *  - Cimientos: rectángulo de 3×3 o más. Levantan muros en el perímetro, ponen
 *    el suelo interior y marcan la zona como interior (con techo). Si se
 *    solapan con otros cimientos, los muros que quedan dentro se eliminan y
 *    los del borde se comparten: así se amplían edificios.
 *  - Puerta: va sobre un muro recto (muros a ambos lados en un mismo eje).
 */
import type { SimContent } from './content'
import type { FloorId } from './floors'
import {
  isInsideGrid,
  isRectInsideGrid,
  perimeterTiles,
  tilesInRect,
  type TileCoord,
  type TileRect,
} from './geometry'
import { EMPTY_TILE, tileIndex, type MapState } from './map'
import { NO_DOOR, NO_WALL, type DoorId, type WallId } from './structureTypes'

/** Tamaño mínimo de unos cimientos (incluidos los muros): deja al menos 1×1 dentro. */
export const MIN_FOUNDATION = 3

export type StructureError =
  | 'unknownWall'
  | 'unknownFloor'
  | 'unknownDoor'
  | 'outOfBounds'
  | 'reserved'
  | 'occupied'
  | 'tooSmall'
  | 'notStructural'
  | 'nothingToBuild'
  | 'notOnWall'
  | 'notStraightWall'
  | 'nothingToDemolish'

export type StructureCheck =
  { readonly ok: true } | { readonly ok: false; readonly reason: StructureError }

const OK: StructureCheck = { ok: true }
const fail = (reason: StructureError): StructureCheck => ({ ok: false, reason })

// ── Consultas ────────────────────────────────────────────────────

export function wallAt(state: MapState, tile: TileCoord): WallId {
  if (!isInsideGrid(tile, state.size)) return NO_WALL
  return state.walls[tileIndex(state, tile)] ?? NO_WALL
}

export function doorAt(state: MapState, tile: TileCoord): DoorId {
  if (!isInsideGrid(tile, state.size)) return NO_DOOR
  return state.doors[tileIndex(state, tile)] ?? NO_DOOR
}

/** ¿Hay muro o puerta? (las puertas forman parte del cerramiento). */
export function isEnclosure(state: MapState, tile: TileCoord): boolean {
  return wallAt(state, tile) !== NO_WALL || doorAt(state, tile) !== NO_DOOR
}

export function isIndoor(state: MapState, tile: TileCoord): boolean {
  if (!isInsideGrid(tile, state.size)) return false
  return state.indoor[tileIndex(state, tile)] === true
}

/** Comprobaciones comunes de un rectángulo de obra: dentro del mapa y sin reservados. */
function checkArea(state: MapState, rect: TileRect): StructureCheck {
  if (!isInsideGrid(rect, state.size) || !isRectInsideGrid(rect, state.size)) {
    return fail('outOfBounds')
  }
  for (const tile of tilesInRect(rect)) {
    if (state.reserved[tileIndex(state, tile)]) return fail('reserved')
  }
  return OK
}

// ── Muros sueltos ────────────────────────────────────────────────

export function validateWalls(
  state: MapState,
  content: SimContent,
  rect: TileRect,
  wall: WallId,
): StructureCheck {
  if (!content.walls[wall]) return fail('unknownWall')
  const area = checkArea(state, rect)
  if (!area.ok) return area

  let changes = 0
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    if (state.occupancy[index] !== EMPTY_TILE || state.doors[index] !== NO_DOOR) {
      return fail('occupied')
    }
    if (state.walls[index] !== wall) changes += 1
  }
  return changes > 0 ? OK : fail('nothingToBuild')
}

/** Levanta muros en el rectángulo (ya validado). */
export function applyWalls(state: MapState, rect: TileRect, wall: WallId): void {
  for (const tile of tilesInRect(rect)) state.walls[tileIndex(state, tile)] = wall
}

// ── Cimientos ────────────────────────────────────────────────────

export function validateFoundation(
  state: MapState,
  content: SimContent,
  rect: TileRect,
  wall: WallId,
  floor: FloorId,
): StructureCheck {
  const def = content.walls[wall]
  if (!def) return fail('unknownWall')
  if (!def.structural) return fail('notStructural')
  if (!content.floors[floor]) return fail('unknownFloor')
  if (rect.width < MIN_FOUNDATION || rect.height < MIN_FOUNDATION) return fail('tooSmall')

  const area = checkArea(state, rect)
  if (!area.ok) return area

  // Los muros del perímetro no pueden caer sobre objetos (los de dentro sí pueden quedarse).
  for (const tile of perimeterTiles(rect)) {
    if (state.occupancy[tileIndex(state, tile)] !== EMPTY_TILE) return fail('occupied')
  }
  return OK
}

/**
 * Construye unos cimientos (ya validados): muros en el perímetro (respetando
 * las puertas que ya hubiera), interior despejado de muros y puertas, suelo
 * nuevo y zona interior.
 */
export function applyFoundation(
  state: MapState,
  rect: TileRect,
  wall: WallId,
  floor: FloorId,
): void {
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    const onEdge =
      tile.x === rect.x ||
      tile.y === rect.y ||
      tile.x === rect.x + rect.width - 1 ||
      tile.y === rect.y + rect.height - 1

    state.floors[index] = floor
    if (onEdge) {
      if (state.doors[index] === NO_DOOR) state.walls[index] = wall
      continue
    }
    // Interior: se funden los muros y puertas que hubiera (ampliar un edificio)
    state.walls[index] = NO_WALL
    state.doors[index] = NO_DOOR
    state.indoor[index] = true
  }
}

// ── Puertas ──────────────────────────────────────────────────────

/** Eje del paso de una puerta: 'vertical' = se cruza de arriba abajo. */
export type DoorAxis = 'vertical' | 'horizontal'

/**
 * Eje por el que se cruza una puerta en esa casilla, o null si no está en un
 * muro recto. Muros a izquierda y derecha → se cruza en vertical.
 */
export function doorAxis(state: MapState, tile: TileCoord): DoorAxis | null {
  const wallLeft = isEnclosure(state, { x: tile.x - 1, y: tile.y })
  const wallRight = isEnclosure(state, { x: tile.x + 1, y: tile.y })
  const wallUp = isEnclosure(state, { x: tile.x, y: tile.y - 1 })
  const wallDown = isEnclosure(state, { x: tile.x, y: tile.y + 1 })

  if (wallLeft && wallRight && !wallUp && !wallDown) return 'vertical'
  if (wallUp && wallDown && !wallLeft && !wallRight) return 'horizontal'
  return null
}

export function validateDoor(
  state: MapState,
  content: SimContent,
  tile: TileCoord,
  door: DoorId,
): StructureCheck {
  if (!content.doors[door]) return fail('unknownDoor')
  if (!isInsideGrid(tile, state.size)) return fail('outOfBounds')
  if (state.reserved[tileIndex(state, tile)]) return fail('reserved')
  if (wallAt(state, tile) === NO_WALL) return fail('notOnWall')
  if (!doorAxis(state, tile)) return fail('notStraightWall')
  return OK
}

/** Abre el hueco en el muro y coloca la puerta (ya validada). */
export function applyDoor(state: MapState, tile: TileCoord, door: DoorId): void {
  const index = tileIndex(state, tile)
  state.walls[index] = NO_WALL
  state.doors[index] = door
}

// ── Demolición ───────────────────────────────────────────────────

export function validateDemolishStructures(state: MapState, rect: TileRect): StructureCheck {
  const area = checkArea(state, rect)
  if (!area.ok) return area

  for (const tile of tilesInRect(rect)) {
    if (isEnclosure(state, tile)) return OK
  }
  return fail('nothingToDemolish')
}

/** Quita muros y puertas del rectángulo. El suelo y la zona interior se mantienen. */
export function applyDemolishStructures(state: MapState, rect: TileRect): void {
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    state.walls[index] = NO_WALL
    state.doors[index] = NO_DOOR
  }
}
