/**
 * Catálogo de puertas construibles.
 *
 * Añadir una puerta = añadir una entrada en `DOORS`. Los colores son
 * provisionales hasta el arte de la Fase 1C.
 */
import type { DoorDef } from '@/sim/structureTypes'
import type { DivisionId } from './progression'

/** Identidad que obliga a que la clave coincida con el `id` y conserva los literales. */
function defineDoors<
  const T extends {
    [K in keyof T]: DoorDef & { readonly id: K; readonly requires?: DivisionId }
  },
>(catalog: T): T {
  return catalog
}

export const DOORS = defineDoors({
  woodDoor: {
    id: 'woodDoor',
    name: 'Puerta de madera',
    cost: 150,
    color: 0xc98b3c,
    pattern: 'wood',
  },
  staffDoor: {
    id: 'staffDoor',
    name: 'Puerta de personal',
    cost: 300,
    color: 0xd9a441,
    pattern: 'metal',
  },
  gate: { id: 'gate', name: 'Cancela', cost: 120, color: 0x6d7275, pattern: 'gate' },
  glassDoor: {
    id: 'glassDoor',
    name: 'Puerta de cristal',
    cost: 400,
    color: 0xa9c2cf,
    pattern: 'glass',
    requires: 'autonomica',
  },
})

export type DoorTypeId = keyof typeof DOORS

/** Puerta del catálogo con la división ya concretada. */
export type CatalogDoor = DoorDef & { readonly requires?: DivisionId }

/** Acceso tipado a una puerta del catálogo. */
export function getDoor(id: DoorTypeId): CatalogDoor {
  return DOORS[id]
}
