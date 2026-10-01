/**
 * Catálogo de muros construibles.
 *
 * Añadir un muro = añadir una entrada en `WALLS`. Los colores son
 * provisionales hasta el arte de la Fase 1C.
 */
import type { WallDef } from '@/sim/structureTypes'
import type { DivisionId } from './progression'

/** Identidad que obliga a que la clave coincida con el `id` y conserva los literales. */
function defineWalls<
  const T extends {
    [K in keyof T]: WallDef & { readonly id: K; readonly requires?: DivisionId }
  },
>(catalog: T): T {
  return catalog
}

export const WALLS = defineWalls({
  brick: {
    id: 'brick',
    name: 'Ladrillo',
    costPerTile: 15,
    pattern: 'brick',
    capColor: 0xe6dccb,
    faceColor: 0xb5643c,
    structural: true,
  },
  concrete: {
    id: 'concrete',
    name: 'Hormigón',
    costPerTile: 12,
    pattern: 'concrete',
    capColor: 0xc9cbc6,
    faceColor: 0x8f9496,
    structural: true,
  },
  plaster: {
    id: 'plaster',
    name: 'Enlucido blanco',
    costPerTile: 18,
    pattern: 'plaster',
    capColor: 0xf1efe8,
    faceColor: 0xd8d4c8,
    structural: true,
  },
  stone: {
    id: 'stone',
    name: 'Piedra',
    costPerTile: 25,
    pattern: 'stone',
    capColor: 0xb9b4a8,
    faceColor: 0x8a8378,
    structural: true,
    requires: 'regional',
  },
  fence: {
    id: 'fence',
    name: 'Valla metálica',
    costPerTile: 4,
    pattern: 'fence',
    capColor: 0x6d7275,
    faceColor: 0x8f9496,
    structural: false,
  },
  hedge: {
    id: 'hedge',
    name: 'Seto',
    costPerTile: 3,
    pattern: 'hedge',
    capColor: 0x3f6630,
    faceColor: 0x2f5124,
    structural: false,
  },
})

export type WallTypeId = keyof typeof WALLS

/** Muro del catálogo con la división ya concretada. */
export type CatalogWall = WallDef & { readonly requires?: DivisionId }

/** Acceso tipado a un muro del catálogo. */
export function getWall(id: WallTypeId): CatalogWall {
  return WALLS[id]
}
