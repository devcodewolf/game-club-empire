/**
 * Comandos del jugador: la ÚNICA vía para modificar el estado del mapa.
 *
 * Cada comando es un dato (unión discriminada por `type`). `executeCommand`
 * valida primero y solo modifica el estado si todo es correcto, de modo que un
 * comando inválido nunca deja el estado a medias. El resultado incluye un
 * evento que el render puede usar para animar (construir, demoler, etc.).
 */
import type { BuildingCatalog, BuildingId, BuildingTypeId, PlacedBuilding } from './buildings'
import { isInsideGrid, tilesInRect, type Rotation, type TileCoord } from './geometry'
import {
  buildingFootprint,
  EMPTY_TILE,
  isParcelOwned,
  parcelGridSize,
  tileIndex,
  validatePlacement,
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
  | { readonly type: 'buyParcel'; readonly parcel: TileCoord }

// ── Resultados ───────────────────────────────────────────────────

export type GameEvent =
  | { readonly type: 'buildingPlaced'; readonly building: PlacedBuilding }
  | { readonly type: 'buildingDemolished'; readonly building: PlacedBuilding }
  | { readonly type: 'parcelBought'; readonly parcel: TileCoord }

export type ParcelError = 'outOfBounds' | 'alreadyOwned' | 'notAdjacent'
export type CommandError = PlacementError | ParcelError | 'buildingNotFound'

export type CommandResult =
  | { readonly ok: true; readonly event: GameEvent }
  | { readonly ok: false; readonly reason: CommandError }

// ── Ejecución ────────────────────────────────────────────────────

export function executeCommand(
  state: MapState,
  command: Command,
  catalog: BuildingCatalog,
): CommandResult {
  switch (command.type) {
    case 'placeBuilding':
      return placeBuilding(state, command, catalog)
    case 'demolishBuilding':
      return demolishBuilding(state, command.buildingId, catalog)
    case 'buyParcel':
      return buyParcel(state, command.parcel)
  }
}

function placeBuilding(
  state: MapState,
  { buildingType, origin, rotation }: Extract<Command, { type: 'placeBuilding' }>,
  catalog: BuildingCatalog,
): CommandResult {
  const check = validatePlacement(state, catalog, buildingType, origin, rotation)
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
  catalog: BuildingCatalog,
): CommandResult {
  const building = state.buildings[buildingId]
  const def = building && catalog[building.type]
  if (!building || !def) return { ok: false, reason: 'buildingNotFound' }

  for (const tile of tilesInRect(buildingFootprint(building, def))) {
    state.occupancy[tileIndex(state, tile)] = EMPTY_TILE
  }
  delete state.buildings[buildingId]

  return { ok: true, event: { type: 'buildingDemolished', building } }
}

function buyParcel(state: MapState, parcel: TileCoord): CommandResult {
  const check = canBuyParcel(state, parcel)
  if (!check.ok) return check

  const grid = parcelGridSize(state)
  state.ownedParcels[parcel.y * grid.width + parcel.x] = true

  return { ok: true, event: { type: 'parcelBought', parcel } }
}

// ── Validación de compra de parcelas ─────────────────────────────

const NEIGHBOURS: readonly TileCoord[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

/**
 * Una parcela se puede comprar si está en el mapa, no es tuya y toca por un
 * lado (no en diagonal) con otra que sí lo es: el club crece de forma contigua.
 */
export function canBuyParcel(
  state: MapState,
  parcel: TileCoord,
): { readonly ok: true } | { readonly ok: false; readonly reason: ParcelError } {
  if (!isInsideGrid(parcel, parcelGridSize(state))) return { ok: false, reason: 'outOfBounds' }
  if (isParcelOwned(state, parcel)) return { ok: false, reason: 'alreadyOwned' }

  const touchesOwned = NEIGHBOURS.some((d) =>
    isParcelOwned(state, { x: parcel.x + d.x, y: parcel.y + d.y }),
  )
  if (!touchesOwned) return { ok: false, reason: 'notAdjacent' }

  return { ok: true }
}
