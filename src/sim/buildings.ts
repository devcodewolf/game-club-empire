/**
 * Contrato de los edificios para la simulación.
 *
 * La simulación define QUÉ necesita saber de un edificio; los datos concretos
 * viven en `src/content/buildings.ts`. La simulación recibe el catálogo como
 * parámetro en lugar de importarlo, así los tests usan edificios de prueba.
 */
import type { GridSize, Rotation, TileCoord } from './geometry'

/** Identificador de tipo de edificio (p. ej. 'office'). */
export type BuildingTypeId = string

/** Identificador de una instancia colocada en el mapa (empieza en 1; 0 = vacío). */
export type BuildingId = number

export interface BuildingDef {
  readonly id: BuildingTypeId
  readonly name: string
  /** Tamaño sin girar, en casillas. */
  readonly size: GridSize
  /** Coste de construcción (se cobrará a partir de la Fase 2). */
  readonly cost: number
  /** Color del marcador provisional mientras no hay sprites (0xRRGGBB). */
  readonly markerColor: number
  /** Emoji o glifo corto para el marcador provisional. */
  readonly icon: string
}

export type BuildingCatalog = Readonly<Record<BuildingTypeId, BuildingDef>>

/** Edificio colocado en el mapa. */
export interface PlacedBuilding {
  readonly id: BuildingId
  readonly type: BuildingTypeId
  readonly origin: TileCoord
  readonly rotation: Rotation
}
