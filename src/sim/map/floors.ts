/**
 * Contrato de los tipos de suelo para la simulación.
 * Los datos concretos viven en `src/content/floors.ts`.
 */

/** Identificador de tipo de suelo (p. ej. 'gravel'). Se guarda como texto en la partida. */
export type FloorId = string

/** Suelo que tiene cada casilla al crear el mapa. */
export const DEFAULT_FLOOR: FloorId = 'grass'

/**
 * Dibujo del suelo (pista para el render; la simulación lo ignora). Cada
 * patrón se genera por código con tonos derivados de `color`.
 */
export type FloorPattern =
  | 'grass'
  | 'dirt'
  | 'gravel'
  | 'slabs'
  | 'concrete'
  | 'planks'
  | 'tiles'
  | 'asphalt'
  | 'turf'
  | 'lawn'

export interface FloorDef {
  readonly id: FloorId
  readonly name: string
  /** Coste por casilla (se cobrará a partir de la Fase 2). */
  readonly costPerTile: number
  /** Color base del suelo (0xRRGGBB); el patrón deriva de él sus otros tonos. */
  readonly color: number
  readonly pattern: FloorPattern
  /** División a partir de la cual se puede usar (id de división). */
  readonly requires?: string
}

export type FloorCatalog = Readonly<Record<FloorId, FloorDef>>
