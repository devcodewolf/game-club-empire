/**
 * Comandos del jugador: la ÚNICA vía para modificar el estado del mapa.
 *
 * Cada comando es un dato (unión discriminada por `type`). `executeCommand`
 * valida primero y solo modifica el estado si todo es correcto, de modo que un
 * comando inválido nunca deja el estado a medias. El resultado incluye un
 * evento que el render puede usar para animar (construir, demoler, etc.).
 */
import {
  maxTier,
  type BuildingId,
  type BuildingTypeId,
  type PitchRole,
  type PlacedBuilding,
} from './buildings'
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
import {
  applyDesignateRoom,
  applyRemoveRoom,
  removeEmptyRooms,
  validateDesignateRoom,
  validateRemoveRoom,
  type RoomError,
} from './rooms'
import type { RoomId, RoomTypeId } from './roomTypes'
import {
  applyDemolishArea,
  applyDemolishAt,
  demolishTargetAt,
  validateDemolishArea,
} from './demolish'
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
  /** Subir un objeto al siguiente nivel, en el sitio. */
  | { readonly type: 'upgradeBuilding'; readonly buildingId: BuildingId }
  /** Cambiar el uso de un campo (principal, filial, entrenamiento). */
  | { readonly type: 'setPitchRole'; readonly buildingId: BuildingId; readonly role: PitchRole }
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
  | { readonly type: 'designateRoom'; readonly tile: TileCoord; readonly roomType: RoomTypeId }
  | { readonly type: 'removeRoom'; readonly tile: TileCoord }
  /** Demoler lo que esté encima en una casilla (objeto → puerta → muro → suelo). */
  | { readonly type: 'demolishAt'; readonly tile: TileCoord }
  /** Arrasar una zona entera. */
  | { readonly type: 'demolishArea'; readonly rect: TileRect }

// ── Resultados ───────────────────────────────────────────────────

export type GameEvent =
  | { readonly type: 'buildingPlaced'; readonly building: PlacedBuilding }
  | {
      readonly type: 'buildingUpgraded'
      /** El objeto ya con su nivel nuevo. */
      readonly building: PlacedBuilding
      readonly fromTier: number
    }
  | {
      readonly type: 'pitchRoleChanged'
      readonly buildingId: BuildingId
      readonly role: PitchRole
      /** Campo que dejó de ser el principal al elegir otro, si lo había. */
      readonly demotedId?: BuildingId
    }
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
  | { readonly type: 'roomDesignated'; readonly roomId: RoomId; readonly roomType: RoomTypeId }
  | { readonly type: 'roomRemoved'; readonly roomId: RoomId }
  | {
      /** Se arrasó una zona (o el suelo de una casilla): todo lo de dentro cambió. */
      readonly type: 'areaDemolished'
      readonly rect: TileRect
      readonly buildings: readonly PlacedBuilding[]
    }

export type CommandError =
  | PlacementError
  | FloorPaintError
  | StructureError
  | RoomError
  | 'buildingNotFound'
  | 'notUpgradable'
  | 'maxTier'
  | 'notAPitch'
  | 'sameRole'
  | 'nothingToDemolish'

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
    case 'upgradeBuilding':
      return upgradeBuilding(state, command.buildingId, content)
    case 'setPitchRole':
      return setPitchRole(state, command, content)
    case 'demolishBuilding':
      return demolishBuilding(state, command.buildingId, content)
    case 'paintFloor':
      return paintFloor(state, command, content)
    case 'buildWalls':
      return runStructure(validateWalls(state, content, command.rect, command.wall), () => {
        applyWalls(state, command.rect, command.wall)
        cleanRooms(state)
        return { type: 'structuresChanged', rect: command.rect, cause: 'walls' }
      })
    case 'buildFoundation': {
      const { rect, wall, floor } = command
      return runStructure(validateFoundation(state, content, rect, wall, floor), () => {
        applyFoundation(state, rect, wall, floor)
        cleanRooms(state)
        return { type: 'structuresChanged', rect, cause: 'foundation' }
      })
    }
    case 'placeDoor':
      return runStructure(validateDoor(state, content, command.tile, command.door), () => {
        applyDoor(state, command.tile, command.door)
        cleanRooms(state)
        return {
          type: 'structuresChanged',
          rect: { ...command.tile, width: 1, height: 1 },
          cause: 'door',
        }
      })
    case 'designateRoom': {
      const check = validateDesignateRoom(state, content, command.tile, command.roomType)
      if (!check.ok) return check
      const roomId = applyDesignateRoom(state, command.tile, command.roomType)
      return { ok: true, event: { type: 'roomDesignated', roomId, roomType: command.roomType } }
    }
    case 'removeRoom': {
      const check = validateRemoveRoom(state, command.tile)
      if (!check.ok) return check
      return {
        ok: true,
        event: { type: 'roomRemoved', roomId: applyRemoveRoom(state, command.tile) },
      }
    }
    case 'demolishAt':
      return demolishAt(state, command.tile, content)
    case 'demolishArea': {
      const check = validateDemolishArea(state, command.rect)
      if (!check.ok) return check
      applyDemolishArea(state, content, command.rect, check.buildings)
      return {
        ok: true,
        event: { type: 'areaDemolished', rect: command.rect, buildings: check.buildings },
      }
    }
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

function demolishAt(state: MapState, tile: TileCoord, content: SimContent): CommandResult {
  const target = demolishTargetAt(state, tile)
  if (!target) return { ok: false, reason: 'nothingToDemolish' }

  applyDemolishAt(state, content, tile, target)
  const rect = { ...tile, width: 1, height: 1 }
  switch (target.kind) {
    case 'building':
      return { ok: true, event: { type: 'buildingDemolished', building: target.building } }
    case 'door':
    case 'wall':
      return { ok: true, event: { type: 'structuresChanged', rect, cause: 'demolish' } }
    case 'floor':
      return { ok: true, event: { type: 'areaDemolished', rect, buildings: [] } }
  }
}

/** Tras cambiar estructuras: las salas sin casillas dejan de existir. */
function cleanRooms(state: MapState): void {
  removeEmptyRooms(state)
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
    tier: 0,
    ...(content.buildings[buildingType]?.pitch ? { role: defaultPitchRole(state, content) } : {}),
  }
  state.nextBuildingId += 1
  state.buildings[building.id] = building
  for (const tile of tilesInRect(check.rect)) {
    state.occupancy[tileIndex(state, tile)] = building.id
  }

  return { ok: true, event: { type: 'buildingPlaced', building } }
}

/**
 * Sube un objeto al siguiente nivel. El coste se cobrará en la Fase 2 y el
 * bloqueo por división se comprobará aquí cuando la simulación la conozca
 * (Fase 3); de momento lo filtra la interfaz.
 */
function upgradeBuilding(
  state: MapState,
  buildingId: BuildingId,
  content: SimContent,
): CommandResult {
  const building = state.buildings[buildingId]
  const def = building && content.buildings[building.type]
  if (!building || !def) return { ok: false, reason: 'buildingNotFound' }
  if (!def.tiers || def.tiers.length < 2) return { ok: false, reason: 'notUpgradable' }
  if (building.tier >= maxTier(def)) return { ok: false, reason: 'maxTier' }

  const upgraded: PlacedBuilding = { ...building, tier: building.tier + 1 }
  state.buildings[buildingId] = upgraded
  return {
    ok: true,
    event: { type: 'buildingUpgraded', building: upgraded, fromTier: building.tier },
  }
}

/** Campos ya colocados. */
function pitchesIn(state: MapState, content: SimContent): PlacedBuilding[] {
  return Object.values(state.buildings).filter((b) => content.buildings[b.type]?.pitch)
}

/** El primer campo es el principal; los siguientes, de entrenamiento. */
function defaultPitchRole(state: MapState, content: SimContent): PitchRole {
  return pitchesIn(state, content).some((b) => b.role === 'main') ? 'training' : 'main'
}

/** Cambia el uso de un campo. Solo hay un principal: el anterior pasa a entrenamiento. */
function setPitchRole(
  state: MapState,
  { buildingId, role }: Extract<Command, { type: 'setPitchRole' }>,
  content: SimContent,
): CommandResult {
  const building = state.buildings[buildingId]
  const def = building && content.buildings[building.type]
  if (!building || !def) return { ok: false, reason: 'buildingNotFound' }
  if (!def.pitch) return { ok: false, reason: 'notAPitch' }
  if (building.role === role) return { ok: false, reason: 'sameRole' }

  let demotedId: BuildingId | undefined
  if (role === 'main') {
    const previous = pitchesIn(state, content).find((b) => b.role === 'main')
    if (previous) {
      state.buildings[previous.id] = { ...previous, role: 'training' }
      demotedId = previous.id
    }
  }
  state.buildings[buildingId] = { ...building, role }
  return {
    ok: true,
    event: { type: 'pitchRoleChanged', buildingId, role, ...(demotedId ? { demotedId } : {}) },
  }
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
