/**
 * Búsquedas tolerantes en el catálogo para ids que llegan como `string`
 * desde la simulación (que no conoce los ids concretos del contenido).
 */
import { BUILDINGS, getBuilding, type StarterBuildingId } from '@/content/buildings'
import { ROOMS, getRoom, type CatalogRoom, type RoomTypeId } from '@/content/rooms'

function isBuildingId(id: string): id is StarterBuildingId {
  return Object.hasOwn(BUILDINGS, id)
}

function isRoomTypeId(id: string): id is RoomTypeId {
  return Object.hasOwn(ROOMS, id)
}

/** Nombre legible de un edificio; si no existe devuelve el propio id. */
export function buildingName(id: string): string {
  return isBuildingId(id) ? getBuilding(id).name : id
}

/** Definición de sala del catálogo, o undefined si el id es desconocido. */
export function findRoom(id: string): CatalogRoom | undefined {
  return isRoomTypeId(id) ? getRoom(id) : undefined
}
