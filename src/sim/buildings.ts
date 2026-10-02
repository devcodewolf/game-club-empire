/**
 * Contrato de los edificios para la simulación.
 *
 * La simulación define QUÉ necesita saber de un edificio; los datos concretos
 * viven en `src/content/buildings.ts`. La simulación recibe el catálogo como
 * parámetro en lugar de importarlo, así los tests usan edificios de prueba.
 */
import type { FloorId } from './floors'
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
  /**
   * Si es un terreno de juego: formato y suelo. Tiene medidas reglamentarias,
   * por eso es de tamaño fijo y no se arrastra. El render dibuja sus líneas.
   */
  readonly pitch?: { readonly format: 7 | 11; readonly surface: FloorId }
  /** Sin orientación (árbol, farola…): no se dibuja la flecha de frente. */
  readonly symmetric?: boolean
  /** Aforo, para gradas (espectadores). */
  readonly capacity?: number
  /**
   * División a partir de la cual se puede construir (id de división). Sin él,
   * está disponible desde el principio. De momento solo lo usa el menú.
   */
  readonly requires?: string
  /**
   * Niveles de mejora (taquilla metálica → de madera → de lujo). El primero es
   * el nivel con el que se construye. Misma huella en todos: se mejora en el
   * sitio. Sin `tiers`, el objeto no se puede mejorar.
   */
  readonly tiers?: readonly TierDef[]
}

/** Un nivel de un objeto mejorable. */
export interface TierDef {
  readonly name: string
  /** Coste de mejorar HASTA este nivel (el del primero es el coste de construir). */
  readonly cost: number
  /** Calidad que aporta a su sala (la usarán las necesidades de los jugadores). */
  readonly quality: number
  /** División a partir de la cual se puede alcanzar este nivel (id de división). */
  readonly requires?: string
}

/** Nivel máximo (índice) de un objeto; 0 si no tiene niveles. */
export function maxTier(def: BuildingDef): number {
  return Math.max(0, (def.tiers?.length ?? 1) - 1)
}

/** Calidad que aporta un objeto en su nivel actual (1 si no tiene niveles). */
export function tierQuality(def: BuildingDef, tier: number): number {
  return def.tiers?.[tier]?.quality ?? 1
}

export type BuildingCatalog = Readonly<Record<BuildingTypeId, BuildingDef>>

/** Edificio colocado en el mapa. */
export interface PlacedBuilding {
  readonly id: BuildingId
  readonly type: BuildingTypeId
  readonly origin: TileCoord
  readonly rotation: Rotation
  /** Nivel actual (índice en `tiers`; 0 = nivel 1). */
  readonly tier: number
}
