/**
 * Catálogo de suelos construibles.
 *
 * Añadir un suelo = añadir una entrada en `FLOORS` (y, si se puede pintar,
 * incluirlo en `FLOOR_MENU`).
 *
 * - Los colores son provisionales hasta las texturas de la Fase 1C.
 * - Los costes se cobran a partir de la Fase 2.
 */
import type { FloorDef } from '@/sim/floors'
import type { DivisionId } from './progression'

/**
 * Función identidad que solo sirve para tipar: obliga a que la clave de cada
 * entrada coincida con su `id` (si no, falla el typecheck) y conserva los
 * tipos literales para que `FloorTypeId` sea una unión exacta.
 */
function defineFloors<
  const T extends {
    [K in keyof T]: FloorDef & { readonly id: K; readonly requires?: DivisionId }
  },
>(catalog: T): T {
  return catalog
}

export const FLOORS = defineFloors({
  grass: { id: 'grass', name: 'Hierba', costPerTile: 0, color: 0x5f8f3e, pattern: 'grass' },
  dirt: { id: 'dirt', name: 'Tierra', costPerTile: 2, color: 0x7a5a3a, pattern: 'dirt' },
  gravel: { id: 'gravel', name: 'Grava', costPerTile: 4, color: 0x9b9385, pattern: 'gravel' },
  stoneSlab: {
    id: 'stoneSlab',
    name: 'Losa de piedra',
    costPerTile: 8,
    color: 0x8f9496,
    pattern: 'slabs',
  },
  concrete: {
    id: 'concrete',
    name: 'Hormigón',
    costPerTile: 6,
    color: 0xa8aaa5,
    pattern: 'concrete',
  },
  wood: { id: 'wood', name: 'Madera', costPerTile: 10, color: 0x8a5f3c, pattern: 'planks' },
  whiteTile: {
    id: 'whiteTile',
    name: 'Baldosa blanca',
    costPerTile: 12,
    color: 0xdfe3dc,
    pattern: 'tiles',
  },
  // Superficies de campo: se eligen al construir el campo, no se pintan (no están en FLOOR_MENU).
  artificialTurf: {
    id: 'artificialTurf',
    name: 'Césped artificial',
    costPerTile: 20,
    color: 0x4f9a4a,
    pattern: 'turf',
    requires: 'regional',
  },
  naturalGrass: {
    id: 'naturalGrass',
    name: 'Césped natural',
    costPerTile: 30,
    color: 0x5a9a3a,
    pattern: 'lawn',
    requires: 'autonomica',
  },
  hybridGrass: {
    id: 'hybridGrass',
    name: 'Césped híbrido',
    costPerTile: 60,
    color: 0x64a844,
    pattern: 'lawn',
    requires: 'nacionalA',
  },
  /** Solo existe en la carretera: no se puede pintar. */
  asphalt: { id: 'asphalt', name: 'Asfalto', costPerTile: 0, color: 0x3e4347, pattern: 'asphalt' },
})

export type FloorTypeId = keyof typeof FLOORS

/** Orden de los suelos en el menú de pintado (sin asfalto). */
export const FLOOR_MENU: readonly FloorTypeId[] = [
  'grass',
  'dirt',
  'gravel',
  'stoneSlab',
  'concrete',
  'wood',
  'whiteTile',
]

/** Suelo del catálogo con la división ya concretada. */
export type CatalogFloor = FloorDef & { readonly requires?: DivisionId }

/** Acceso tipado a un suelo del catálogo. */
export function getFloor(id: FloorTypeId): CatalogFloor {
  return FLOORS[id]
}
