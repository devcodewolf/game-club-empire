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
import {
  applyDemolishStructures,
  applyDoor,
  applyFoundation,
  applyWalls,
  validateDemolishStructures,
  validateDoor,
  validateFoundation,
  validateWalls,
  type StructureCheck,
  type StructureError,
} from './structures'
import type { DoorId, WallId } from './structureTypes'
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
  | { readonly type: 'buildWalls'; readonly rect: TileRect; readonly wall: WallId }
  | {
      readonly type: 'buildFoundation'
      readonly rect: TileRect
      readonly wall: WallId
      readonly floor: FloorId
    }
  | { readonly type: 'placeDoor'; readonly tile: TileCoord; readonly door: DoorId }
  | { readonly type: 'demolishStructures'; readonly rect: TileRect }

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
  | {
      /** Cambiaron muros, puertas o zonas interiores dentro de este rectángulo. */
      readonly type: 'structuresChanged'
      readonly rect: TileRect
      readonly cause: 'walls' | 'foundation' | 'door' | 'demolish'
    }

export type CommandError = PlacementError | FloorPaintError | StructureError | 'buildingNotFound'

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
    case 'buildWalls':
      return runStructure(validateWalls(state, content, command.rect, command.wall), () => {
        applyWalls(state, command.rect, command.wall)
        return { type: 'structuresChanged', rect: command.rect, cause: 'walls' }
      })
    case 'buildFoundation': {
      const { rect, wall, floor } = command
      return runStructure(validateFoundation(state, content, rect, wall, floor), () => {
        applyFoundation(state, rect, wall, floor)
        return { type: 'structuresChanged', rect, cause: 'foundation' }
      })
    }
    case 'placeDoor':
      return runStructure(validateDoor(state, content, command.tile, command.door), () => {
        applyDoor(state, command.tile, command.door)
        return {
          type: 'structuresChanged',
          rect: { ...command.tile, width: 1, height: 1 },
          cause: 'door',
        }
      })
    case 'demolishStructures':
      return runStructure(validateDemolishStructures(state, command.rect), () => {
        applyDemolishStructures(state, command.rect)
        return { type: 'structuresChanged', rect: command.rect, cause: 'demolish' }
      })
  }
}

/** Patrón común: si la validación pasa, aplica el cambio y devuelve su evento. */
function runStructure(check: StructureCheck, apply: () => GameEvent): CommandResult {
  if (!check.ok) return { ok: false, reason: check.reason }
  return { ok: true, event: apply() }
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
