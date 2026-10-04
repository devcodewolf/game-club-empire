/**
 * Entrada de la ciudad deportiva, junto a la carretera (como en Prison
 * Architect): valla perimetral con puerta, control de acceso con garitas y
 * barrera, arbolado, aparcamiento de visitantes y recepción de mercancías.
 *
 * Todo es parte fija del mundo: sus casillas quedan reservadas. Son solo
 * datos (posiciones y tipo); el dibujo vive en `src/render/entranceView.ts`.
 * Coordenadas en casillas.
 */
import type { TileCoord, TileRect } from '@/sim/geometry'
import type { MapFeature } from '@/sim/map/map'

/** Columna de la valla perimetral (paralela a la carretera). */
export const FENCE_X = 222

/** Acceso: dos carriles de 4 casillas que entran desde la carretera. */
export const ACCESS: TileRect = { x: 180, y: 76, width: 46, height: 8 }

/** Elemento decorativo de la entrada; el render dibuja cada `kind`. */
export type EntranceProp =
  | {
      readonly kind: 'fence'
      readonly x: number
      readonly gap: { readonly y: number; readonly height: number }
    }
  | { readonly kind: 'booth'; readonly rect: TileRect; readonly facing: 'north' | 'south' }
  | {
      readonly kind: 'barrier'
      /** Columna de la barrera. */
      readonly x: number
      /** Casilla del pivote (junto a la garita) y largo del brazo hacia el centro. */
      readonly pivotY: number
      readonly length: number
      readonly direction: 1 | -1
    }
  | { readonly kind: 'tree'; readonly tile: TileCoord }
  | { readonly kind: 'lamp'; readonly tile: TileCoord }
  | { readonly kind: 'planter'; readonly rect: TileRect }
  | {
      readonly kind: 'parkingBays'
      readonly rect: TileRect
      readonly stallWidth: number
      readonly openSide: 'north' | 'south'
    }
  | { readonly kind: 'loadingBays'; readonly rect: TileRect; readonly count: number }
  | { readonly kind: 'warehouse'; readonly rect: TileRect; readonly docks: number }
  | { readonly kind: 'laneMarkings'; readonly rect: TileRect; readonly stopLineX: number }
  | { readonly kind: 'label'; readonly text: string; readonly tile: TileCoord }

const PARKING: TileRect = { x: 180, y: 62, width: 16, height: 14 }
const YARD: TileRect = { x: 180, y: 84, width: 16, height: 14 }
const WAREHOUSE: TileRect = { x: 180, y: 98, width: 16, height: 8 }
const VERGE_NORTH: TileRect = { x: 196, y: 70, width: 14, height: 6 }
const VERGE_SOUTH: TileRect = { x: 196, y: 84, width: 14, height: 6 }
const PLAZA_NORTH: TileRect = { x: 210, y: 72, width: 12, height: 4 }
const PLAZA_SOUTH: TileRect = { x: 210, y: 84, width: 12, height: 4 }

/** Suelos fijos de la entrada (todos reservados). Se aplican sobre la hierba. */
export const ENTRANCE_FEATURES: readonly MapFeature[] = [
  { rect: VERGE_NORTH, floor: 'grass', reserved: true },
  { rect: VERGE_SOUTH, floor: 'grass', reserved: true },
  { rect: PLAZA_NORTH, floor: 'stoneSlab', reserved: true },
  { rect: PLAZA_SOUTH, floor: 'stoneSlab', reserved: true },
  { rect: PARKING, floor: 'asphalt', reserved: true },
  { rect: YARD, floor: 'asphalt', reserved: true },
  { rect: WAREHOUSE, floor: 'concrete', reserved: true },
  // Valla y franja de hierba entre la valla y la acera
  { rect: { x: FENCE_X, y: 0, width: 2, height: 160 }, floor: 'grass', reserved: true },
  // El acceso va el último para que el asfalto cruce la valla por la puerta
  { rect: ACCESS, floor: 'asphalt', reserved: true },
]

const trees = (y: number): EntranceProp[] =>
  [196, 199.5, 203, 206.5].map((x) => ({ kind: 'tree', tile: { x, y } }))
const lamps = (y: number): EntranceProp[] =>
  [200, 205, 209].map((x) => ({ kind: 'lamp', tile: { x, y } }))

export const ENTRANCE_PROPS: readonly EntranceProp[] = [
  { kind: 'fence', x: FENCE_X, gap: { y: ACCESS.y, height: ACCESS.height } },
  { kind: 'laneMarkings', rect: ACCESS, stopLineX: 213 },

  // Control de acceso: garitas a ambos lados y un brazo de barrera por carril
  { kind: 'booth', rect: { x: 214, y: 72, width: 4, height: 3 }, facing: 'south' },
  { kind: 'booth', rect: { x: 214, y: 85, width: 4, height: 3 }, facing: 'north' },
  { kind: 'barrier', x: 212, pivotY: ACCESS.y, length: 4, direction: 1 },
  { kind: 'barrier', x: 212, pivotY: ACCESS.y + ACCESS.height, length: 4, direction: -1 },
  { kind: 'planter', rect: { x: 219, y: 73, width: 2, height: 1 } },
  { kind: 'planter', rect: { x: 219, y: 86, width: 2, height: 1 } },
  { kind: 'label', text: 'Control de acceso', tile: { x: 216, y: 70 } },

  // Arbolado y farolas a ambos lados del acceso
  ...trees(71),
  ...trees(86),
  ...lamps(74),
  ...lamps(84),

  // Aparcamiento de visitantes (se entra desde el acceso)
  {
    kind: 'parkingBays',
    rect: { x: 180, y: 62, width: 16, height: 5 },
    stallWidth: 3,
    openSide: 'south',
  },
  {
    kind: 'parkingBays',
    rect: { x: 180, y: 71, width: 16, height: 5 },
    stallWidth: 3,
    openSide: 'north',
  },
  { kind: 'label', text: 'Aparcamiento', tile: { x: 188, y: 68 } },

  // Recepción de mercancías: patio de carga con muelles y nave
  { kind: 'loadingBays', rect: { x: 181, y: 92, width: 14, height: 6 }, count: 3 },
  { kind: 'warehouse', rect: WAREHOUSE, docks: 3 },
  { kind: 'label', text: 'Recepción de mercancías', tile: { x: 188, y: 102 } },
]
