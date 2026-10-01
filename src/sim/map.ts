/**
 * Estado del mapa: parcelas compradas, edificios y ocupación de casillas.
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
  /** Lado de una parcela en casillas. */
  readonly parcelSize: number
  /** Una entrada por parcela (fila a fila): true = comprada. */
  readonly ownedParcels: boolean[]
  /**
   * Una entrada por casilla (fila a fila): id del edificio que la ocupa o
   * EMPTY_TILE. Es una caché derivada de `buildings` para consultas O(1).
   */
  readonly occupancy: BuildingId[]
  readonly buildings: Record<BuildingId, PlacedBuilding>
  /** Siguiente id a asignar: ids deterministas, nunca reutilizados. */
  nextBuildingId: BuildingId
}

export interface MapConfig {
  readonly size: GridSize
  readonly parcelSize: number
  /** Parcelas en propiedad al empezar, en coordenadas de parcela. */
  readonly initialParcels: readonly TileCoord[]
}

export function createMapState({ size, parcelSize, initialParcels }: MapConfig): MapState {
  const parcels = parcelGridSize({ size, parcelSize })
  const ownedParcels = new Array<boolean>(parcels.width * parcels.height).fill(false)
  for (const parcel of initialParcels) {
    ownedParcels[parcel.y * parcels.width + parcel.x] = true
  }

  return {
    size,
    parcelSize,
    ownedParcels,
    occupancy: new Array<BuildingId>(size.width * size.height).fill(EMPTY_TILE),
    buildings: {},
    nextBuildingId: 1,
  }
}

// ── Parcelas ──────────────────────────────────────────────────────

/** Cuántas parcelas hay en cada eje (la última puede quedar incompleta). */
export function parcelGridSize(state: Pick<MapState, 'size' | 'parcelSize'>): GridSize {
  return {
    width: Math.ceil(state.size.width / state.parcelSize),
    height: Math.ceil(state.size.height / state.parcelSize),
  }
}

/** Parcela que contiene una casilla. */
export function parcelOfTile(state: MapState, tile: TileCoord): TileCoord {
  return { x: Math.floor(tile.x / state.parcelSize), y: Math.floor(tile.y / state.parcelSize) }
}

/** Rectángulo de casillas que cubre una parcela (recortado al mapa). */
export function parcelRect(state: MapState, parcel: TileCoord): TileRect {
  const x = parcel.x * state.parcelSize
  const y = parcel.y * state.parcelSize
  return {
    x,
    y,
    width: Math.min(state.parcelSize, state.size.width - x),
    height: Math.min(state.parcelSize, state.size.height - y),
  }
}

export function isParcelOwned(state: MapState, parcel: TileCoord): boolean {
  const grid = parcelGridSize(state)
  if (!isInsideGrid(parcel, grid)) return false
  return state.ownedParcels[parcel.y * grid.width + parcel.x] === true
}

export function isTileOwned(state: MapState, tile: TileCoord): boolean {
  return isParcelOwned(state, parcelOfTile(state, tile))
}

// ── Casillas y edificios ─────────────────────────────────────────

export function tileIndex(state: MapState, tile: TileCoord): number {
  return tile.y * state.size.width + tile.x
}

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

export type PlacementError = 'unknownBuilding' | 'outOfBounds' | 'parcelNotOwned' | 'occupied'

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
    if (!isTileOwned(state, tile)) return { ok: false, reason: 'parcelNotOwned', rect }
    if (state.occupancy[tileIndex(state, tile)] !== EMPTY_TILE) {
      return { ok: false, reason: 'occupied', rect }
    }
  }

  return { ok: true, rect }
}
