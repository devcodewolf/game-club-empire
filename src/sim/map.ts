/**
 * Estado del mapa: suelos, casillas reservadas, edificios y ocupación.
 *
 * Es un objeto plano (arrays y records, sin clases, Map ni Set) para poder
 * guardarlo en IndexedDB tal cual y compararlo fácilmente en los tests.
 * Solo los comandos (`commands.ts`) lo modifican; aquí solo hay lecturas.
 */
import type {
  BuildingCatalog,
  BuildingDef,
  BuildingId,
  BuildingTypeId,
  PlacedBuilding,
} from './buildings'
import { DEFAULT_FLOOR, type FloorCatalog, type FloorId } from './floors'
import {
  footprint,
  isInsideGrid,
  isRectInsideGrid,
  tilesInRect,
  type GridSize,
  type Rotation,
  type TileCoord,
  type TileRect,
} from './geometry'

/** Valor de `occupancy` para una casilla libre. */
export const EMPTY_TILE = 0

export interface MapState {
  readonly size: GridSize
  /** Una entrada por casilla (fila a fila): tipo de suelo. */
  readonly floors: FloorId[]
  /**
   * Una entrada por casilla (fila a fila): true si forma parte de un elemento
   * fijo del mundo (carretera, acceso) que el jugador no puede modificar.
   */
  readonly reserved: boolean[]
  /**
   * Una entrada por casilla (fila a fila): id del edificio que la ocupa o
   * EMPTY_TILE. Es una caché derivada de `buildings` para consultas O(1).
   */
  readonly occupancy: BuildingId[]
  readonly buildings: Record<BuildingId, PlacedBuilding>
  /** Siguiente id a asignar: ids deterministas, nunca reutilizados. */
  nextBuildingId: BuildingId
}

/** Elemento fijo del mundo: una zona con un suelo dado, opcionalmente intocable. */
export interface MapFeature {
  readonly rect: TileRect
  readonly floor: FloorId
  readonly reserved: boolean
}

export interface MapConfig {
  readonly size: GridSize
  /** Elementos fijos (carretera, acceso…), aplicados en orden. */
  readonly features: readonly MapFeature[]
}

export function createMapState({ size, features }: MapConfig): MapState {
  const tileCount = size.width * size.height
  const state: MapState = {
    size,
    floors: new Array<FloorId>(tileCount).fill(DEFAULT_FLOOR),
    reserved: new Array<boolean>(tileCount).fill(false),
    occupancy: new Array<BuildingId>(tileCount).fill(EMPTY_TILE),
    buildings: {},
    nextBuildingId: 1,
  }

  for (const feature of features) {
    for (const tile of tilesInRect(feature.rect)) {
      if (!isInsideGrid(tile, size)) continue
      const index = tileIndex(state, tile)
      state.floors[index] = feature.floor
      state.reserved[index] = feature.reserved
    }
  }

  return state
}

// ── Casillas ─────────────────────────────────────────────────────

export function tileIndex(state: Pick<MapState, 'size'>, tile: TileCoord): number {
  return tile.y * state.size.width + tile.x
}

/** Suelo de una casilla, o undefined si está fuera del mapa. */
export function floorAt(state: MapState, tile: TileCoord): FloorId | undefined {
  if (!isInsideGrid(tile, state.size)) return undefined
  return state.floors[tileIndex(state, tile)]
}

export function isTileReserved(state: MapState, tile: TileCoord): boolean {
  if (!isInsideGrid(tile, state.size)) return false
  return state.reserved[tileIndex(state, tile)] === true
}

// ── Edificios ────────────────────────────────────────────────────

/** Edificio que ocupa una casilla, o undefined si está libre o fuera del mapa. */
export function buildingAt(state: MapState, tile: TileCoord): PlacedBuilding | undefined {
  if (!isInsideGrid(tile, state.size)) return undefined

  const id = state.occupancy[tileIndex(state, tile)]
  if (id === undefined || id === EMPTY_TILE) return undefined
  return state.buildings[id]
}

/** Huella en el mapa de un edificio colocado. */
export function buildingFootprint(building: PlacedBuilding, def: BuildingDef): TileRect {
  return footprint(building.origin, def.size, building.rotation)
}

// ── Validación de colocación ─────────────────────────────────────

export type PlacementError = 'unknownBuilding' | 'outOfBounds' | 'reserved' | 'occupied'

export type PlacementCheck =
  | { readonly ok: true; readonly rect: TileRect }
  | { readonly ok: false; readonly reason: PlacementError; readonly rect?: TileRect }

/**
 * Comprueba si se puede colocar un edificio, sin modificar nada.
 * La usan tanto el comando como la vista previa bajo el cursor.
 */
export function validatePlacement(
  state: MapState,
  catalog: BuildingCatalog,
  buildingType: BuildingTypeId,
  origin: TileCoord,
  rotation: Rotation,
): PlacementCheck {
  const def = catalog[buildingType]
  if (!def) return { ok: false, reason: 'unknownBuilding' }
  if (!isInsideGrid(origin, state.size)) return { ok: false, reason: 'outOfBounds' }

  const rect = footprint(origin, def.size, rotation)
  if (!isRectInsideGrid(rect, state.size)) return { ok: false, reason: 'outOfBounds', rect }

  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    if (state.reserved[index]) return { ok: false, reason: 'reserved', rect }
    if (state.occupancy[index] !== EMPTY_TILE) return { ok: false, reason: 'occupied', rect }
  }

  return { ok: true, rect }
}

// ── Validación de suelos ─────────────────────────────────────────

export type FloorPaintError = 'unknownFloor' | 'outOfBounds' | 'reserved' | 'nothingToPaint'

export type FloorPaintCheck =
  | { readonly ok: true; readonly changed: number }
  | { readonly ok: false; readonly reason: FloorPaintError }

/**
 * Comprueba si se puede pintar un suelo en un rectángulo. No se puede tocar
 * ninguna casilla reservada; pintar con el mismo suelo que ya hay no cuenta.
 */
export function validateFloorPaint(
  state: MapState,
  floors: FloorCatalog,
  rect: TileRect,
  floor: FloorId,
): FloorPaintCheck {
  if (!floors[floor]) return { ok: false, reason: 'unknownFloor' }
  if (!isInsideGrid(rect, state.size) || !isRectInsideGrid(rect, state.size)) {
    return { ok: false, reason: 'outOfBounds' }
  }

  let changed = 0
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    if (state.reserved[index]) return { ok: false, reason: 'reserved' }
    if (state.floors[index] !== floor) changed += 1
  }
  if (changed === 0) return { ok: false, reason: 'nothingToPaint' }

  return { ok: true, changed }
}
