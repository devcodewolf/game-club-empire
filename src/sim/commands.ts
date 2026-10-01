/**
 * Comandos del jugador: la ÚNICA vía para modificar el estado del mapa.
 *
 * Cada comando es un dato (unión discriminada por `type`). `executeCommand`
 * valida primero y solo modifica el estado si todo es correcto, de modo que un
 * comando inválido nunca deja el estado a medias. El resultado incluye un
 * evento que el render puede usar para animar (construir, demoler, etc.).
 */
import type { BuildingId, BuildingTypeId, PlacedBuilding } from './buildings'
import type { SimContent } from './content'
import type { FloorId } from './floors'
import { tilesInRect, type Rotation, type TileCoord, type TileRect } from './geometry'
import {
  buildingFootprint,
  EMPTY_TILE,
  tileIndex,
  validateFloorPaint,
  validatePlacement,
  type FloorPaintError,
  type MapState,
  type PlacementError,
} from './map'

// ── Comandos ─────────────────────────────────────────────────────

export type Command =
  | {
      readonly type: 'placeBuilding'
      readonly buildingType: BuildingTypeId
      readonly origin: TileCoord
      readonly rotation: Rotation
    }
  | { readonly type: 'demolishBuilding'; readonly buildingId: BuildingId }
  | { readonly type: 'paintFloor'; readonly rect: TileRect; readonly floor: FloorId }

// ── Resultados ───────────────────────────────────────────────────

export type GameEvent =
  | { readonly type: 'buildingPlaced'; readonly building: PlacedBuilding }
  | { readonly type: 'buildingDemolished'; readonly building: PlacedBuilding }
  | {
      readonly type: 'floorPainted'
      readonly rect: TileRect
      readonly floor: FloorId
      /** Casillas que cambiaron de verdad (las que ya tenían ese suelo no cuentan). */
      readonly changed: number
    }

export type CommandError = PlacementError | FloorPaintError | 'buildingNotFound'

export type CommandResult =
  | { readonly ok: true; readonly event: GameEvent }
  | { readonly ok: false; readonly reason: CommandError }

// ── Ejecución ────────────────────────────────────────────────────

export function executeCommand(
  state: MapState,
  command: Command,
  content: SimContent,
): CommandResult {
  switch (command.type) {
    case 'placeBuilding':
      return placeBuilding(state, command, content)
    case 'demolishBuilding':
      return demolishBuilding(state, command.buildingId, content)
    case 'paintFloor':
      return paintFloor(state, command, content)
  }
}

function placeBuilding(
  state: MapState,
  { buildingType, origin, rotation }: Extract<Command, { type: 'placeBuilding' }>,
  content: SimContent,
): CommandResult {
  const check = validatePlacement(state, content.buildings, buildingType, origin, rotation)
  if (!check.ok) return { ok: false, reason: check.reason }

  const building: PlacedBuilding = {
    id: state.nextBuildingId,
    type: buildingType,
    origin,
    rotation,
  }
  state.nextBuildingId += 1
  state.buildings[building.id] = building
  for (const tile of tilesInRect(check.rect)) {
    state.occupancy[tileIndex(state, tile)] = building.id
  }

  return { ok: true, event: { type: 'buildingPlaced', building } }
}

function demolishBuilding(
  state: MapState,
  buildingId: BuildingId,
  content: SimContent,
): CommandResult {
  const building = state.buildings[buildingId]
  const def = building && content.buildings[building.type]
  if (!building || !def) return { ok: false, reason: 'buildingNotFound' }

  for (const tile of tilesInRect(buildingFootprint(building, def))) {
    state.occupancy[tileIndex(state, tile)] = EMPTY_TILE
  }
  delete state.buildings[buildingId]

  return { ok: true, event: { type: 'buildingDemolished', building } }
}

function paintFloor(
  state: MapState,
  { rect, floor }: Extract<Command, { type: 'paintFloor' }>,
  content: SimContent,
): CommandResult {
  const check = validateFloorPaint(state, content.floors, rect, floor)
  if (!check.ok) return { ok: false, reason: check.reason }

  for (const tile of tilesInRect(rect)) {
    state.floors[tileIndex(state, tile)] = floor
  }

  return { ok: true, event: { type: 'floorPainted', rect, floor, changed: check.changed } }
}
