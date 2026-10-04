/**
 * Demolición unificada (como el bulldozer de Prison Architect):
 *  - en una casilla: quita lo que esté "encima", con prioridad
 *    objeto → puerta → muro → suelo (el suelo vuelve a hierba);
 *  - en una zona: lo arrasa todo (objetos que la toquen, muros, puertas,
 *    suelos, zona interior y salas). Las casillas reservadas no se tocan.
 */
import type { PlacedBuilding } from '../buildings/buildings'
import type { SimContent } from '../content'
import { DEFAULT_FLOOR } from './floors'
import {
  isInsideGrid,
  isRectInsideGrid,
  tilesInRect,
  type TileCoord,
  type TileRect,
} from '../geometry'
import { buildingAt, buildingFootprint, EMPTY_TILE, tileIndex, type MapState } from './map'
import { removeEmptyRooms } from '../rooms/rooms'
import { NO_ROOM } from '../rooms/roomTypes'
import { NO_DOOR, NO_WALL } from './structureTypes'

/** Qué se quitaría con un clic de demoler en una casilla. */
export type DemolishTarget =
  | { readonly kind: 'building'; readonly building: PlacedBuilding }
  | { readonly kind: 'door' }
  | { readonly kind: 'wall' }
  | { readonly kind: 'floor' }

/** Lo que hay "encima" en una casilla, o null si no hay nada que demoler. */
export function demolishTargetAt(state: MapState, tile: TileCoord): DemolishTarget | null {
  if (!isInsideGrid(tile, state.size)) return null
  const index = tileIndex(state, tile)
  if (state.reserved[index]) return null

  const building = buildingAt(state, tile)
  if (building) return { kind: 'building', building }
  if (state.doors[index] !== NO_DOOR) return { kind: 'door' }
  if (state.walls[index] !== NO_WALL) return { kind: 'wall' }
  if (state.floors[index] !== DEFAULT_FLOOR) return { kind: 'floor' }
  return null
}

/** Gradas pegadas a un objeto (solo los campos tienen). */
export function attachedTo(state: MapState, building: PlacedBuilding): PlacedBuilding[] {
  return Object.values(state.buildings).filter((b) => b.attach?.pitchId === building.id)
}

/**
 * Quita un objeto (sin validar): libera sus casillas y lo borra. Si es un
 * campo, sus gradas caen con él. Devuelve esas gradas arrastradas.
 */
export function removeBuilding(
  state: MapState,
  content: SimContent,
  building: PlacedBuilding,
): PlacedBuilding[] {
  if (!state.buildings[building.id]) return []
  const def = content.buildings[building.type]
  if (def) {
    for (const tile of tilesInRect(buildingFootprint(building, def))) {
      if (!isInsideGrid(tile, state.size)) continue
      const index = tileIndex(state, tile)
      if (state.occupancy[index] === building.id) state.occupancy[index] = EMPTY_TILE
    }
  }
  delete state.buildings[building.id]

  const attached = attachedTo(state, building)
  for (const stand of attached) removeBuilding(state, content, stand)
  return attached
}

/** Vuelve una casilla a terreno: sin muro, sin puerta, hierba, exterior y sin sala. */
function clearTile(state: MapState, index: number): void {
  state.walls[index] = NO_WALL
  state.doors[index] = NO_DOOR
  state.floors[index] = DEFAULT_FLOOR
  state.indoor[index] = false
  state.roomOf[index] = NO_ROOM
}

/** Aplica la demolición de una casilla según su objetivo (ya calculado). */
export function applyDemolishAt(
  state: MapState,
  content: SimContent,
  tile: TileCoord,
  target: DemolishTarget,
): PlacedBuilding[] {
  const index = tileIndex(state, tile)
  switch (target.kind) {
    case 'building':
      return removeBuilding(state, content, target.building)
    case 'door':
      state.doors[index] = NO_DOOR
      return []
    case 'wall':
      state.walls[index] = NO_WALL
      return []
    case 'floor':
      // Quitar el suelo de una casilla interior la saca del edificio y de su sala.
      clearTile(state, index)
      removeEmptyRooms(state)
      return []
  }
}

export type DemolishAreaCheck =
  | { readonly ok: true; readonly buildings: readonly PlacedBuilding[] }
  | { readonly ok: false; readonly reason: 'outOfBounds' | 'nothingToDemolish' }

/** Comprueba una demolición de zona y devuelve los objetos que caerían. */
export function validateDemolishArea(state: MapState, rect: TileRect): DemolishAreaCheck {
  if (!isInsideGrid(rect, state.size) || !isRectInsideGrid(rect, state.size)) {
    return { ok: false, reason: 'outOfBounds' }
  }

  const buildings = new Map<number, PlacedBuilding>()
  let somethingElse = false
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    if (state.reserved[index]) continue
    const building = buildingAt(state, tile)
    if (building) {
      buildings.set(building.id, building)
      for (const stand of attachedTo(state, building)) buildings.set(stand.id, stand)
    }
    const dirty =
      state.walls[index] !== NO_WALL ||
      state.doors[index] !== NO_DOOR ||
      state.floors[index] !== DEFAULT_FLOOR ||
      state.indoor[index] ||
      state.roomOf[index] !== NO_ROOM
    if (dirty) somethingElse = true
  }

  if (buildings.size === 0 && !somethingElse) return { ok: false, reason: 'nothingToDemolish' }
  return { ok: true, buildings: [...buildings.values()] }
}

/** Arrasa la zona (ya validada): objetos que la tocan y todo lo construido en ella. */
export function applyDemolishArea(
  state: MapState,
  content: SimContent,
  rect: TileRect,
  buildings: readonly PlacedBuilding[],
): void {
  for (const building of buildings) removeBuilding(state, content, building)
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    if (!state.reserved[index]) clearTile(state, index)
  }
  removeEmptyRooms(state)
}
