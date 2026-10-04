/**
 * Catálogo de salas. Añadir una sala = añadir una entrada en `ROOMS`; sus
 * requisitos y capacidad deben apuntar a objetos de `BUILDINGS`.
 */
import type { RoomDef } from '@/sim/rooms/roomTypes'
import type { StarterBuildingId } from './buildings'
import type { IconName } from './icons'
import type { DivisionId } from './progression'

/** Identidad que valida la clave, el icono, la división y los objetos de la sala. */
function defineRooms<
  const T extends {
    [K in keyof T]: Omit<RoomDef, 'requirements' | 'capacity'> & {
      readonly id: K
      readonly icon: IconName
      readonly requires?: DivisionId
      readonly requirements: readonly {
        readonly object: StarterBuildingId
        readonly min: number
      }[]
      readonly capacity?: {
        readonly object: StarterBuildingId
        readonly per: number
        readonly unit: string
      }
    }
  },
>(catalog: T): T {
  return catalog
}

export const ROOMS = defineRooms({
  changingRoom: {
    id: 'changingRoom',
    name: 'Vestuario',
    icon: 'shirt-sport',
    color: 0x5b8fb9,
    minSize: { width: 4, height: 3 },
    requirements: [
      { object: 'locker', min: 4 },
      { object: 'changingBench', min: 1 },
      { object: 'shower', min: 2 },
    ],
    capacity: { object: 'locker', per: 1, unit: 'jugadores' },
  },
  office: {
    id: 'office',
    name: 'Oficina',
    icon: 'briefcase',
    color: 0xc9a227,
    minSize: { width: 3, height: 3 },
    requirements: [
      { object: 'officeDesk', min: 1 },
      { object: 'officeChair', min: 1 },
      { object: 'filingCabinet', min: 1 },
    ],
    capacity: { object: 'officeDesk', per: 1, unit: 'empleados' },
  },
  reception: {
    id: 'reception',
    name: 'Recepción',
    icon: 'ticket',
    color: 0xb5643c,
    minSize: { width: 3, height: 3 },
    requirements: [
      { object: 'receptionDesk', min: 1 },
      { object: 'officeChair', min: 1 },
    ],
  },
  storage: {
    id: 'storage',
    name: 'Almacén de material',
    icon: 'package',
    color: 0x9b9385,
    minSize: { width: 3, height: 3 },
    requirements: [{ object: 'storageShelf', min: 2 }],
    capacity: { object: 'storageShelf', per: 20, unit: 'unidades' },
  },
  physio: {
    id: 'physio',
    name: 'Fisioterapia',
    icon: 'first-aid-kit',
    color: 0x6fb3a0,
    minSize: { width: 3, height: 3 },
    requirements: [
      { object: 'physioTable', min: 1 },
      { object: 'sink', min: 1 },
    ],
    capacity: { object: 'physioTable', per: 1, unit: 'jugadores' },
    requires: 'regional',
  },
  cafe: {
    id: 'cafe',
    name: 'Cafetería',
    icon: 'coffee',
    color: 0xd9a441,
    minSize: { width: 4, height: 3 },
    requirements: [
      { object: 'barCounter', min: 1 },
      { object: 'cafeTable', min: 1 },
    ],
    capacity: { object: 'cafeTable', per: 4, unit: 'clientes' },
    requires: 'regional',
  },
  gym: {
    id: 'gym',
    name: 'Gimnasio',
    icon: 'barbell',
    color: 0x8c2f39,
    minSize: { width: 5, height: 4 },
    requirements: [
      { object: 'weightsBench', min: 1 },
      { object: 'exerciseBike', min: 1 },
    ],
    capacity: { object: 'weightsBench', per: 2, unit: 'jugadores' },
    requires: 'autonomica',
  },
})

export type RoomTypeId = keyof typeof ROOMS

/** Sala del catálogo con icono y división ya concretados. */
export type CatalogRoom = RoomDef & { readonly icon: IconName; readonly requires?: DivisionId }

/** Acceso tipado a una sala del catálogo. */
export function getRoom(id: RoomTypeId): CatalogRoom {
  return ROOMS[id]
}
