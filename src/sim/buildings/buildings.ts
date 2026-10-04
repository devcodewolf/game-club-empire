/**
 * Contrato de los edificios para la simulación.
 *
 * La simulación define QUÉ necesita saber de un edificio; los datos concretos
 * viven en `src/content/buildings.ts`. La simulación recibe el catálogo como
 * parámetro en lugar de importarlo, así los tests usan edificios de prueba.
 */
import type { FloorId } from '../map/floors'
import type { GridSize, Rotation, TileCoord } from '../geometry'

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
  readonly pitch?: {
    readonly format: 7 | 11
    /** Superficie por nivel (índice = tier): tierra → césped artificial → natural → híbrido. */
    readonly surfaces: readonly FloorId[]
  }
  /**
   * Si es una grada modular: se pega a un lado de un campo y crece hacia
   * fuera. Índice = tier. Su tamaño real lo da el campo (largo) y el nivel (fondo).
   */
  readonly stand?: {
    /** Fondo en casillas por nivel. */
    readonly depths: readonly number[]
    /** Espectadores por casilla de largo, por nivel. */
    readonly capacityPerTile: readonly number[]
    /** Córner: va en una esquina del campo, con las filas en arco. */
    readonly corner?: boolean
  }
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

/** Uso de un campo de fútbol. Solo puede haber un campo principal. */
export type PitchRole = 'main' | 'reserve' | 'training'

/** Superficie de un campo en su nivel actual. */
export function pitchSurface(def: BuildingDef, tier: number): FloorId | undefined {
  const surfaces = def.pitch?.surfaces
  return surfaces?.[Math.min(tier, surfaces.length - 1)]
}

/** Hueco de un campo donde va una grada: lados y esquinas. */
export type StandSlot =
  'north' | 'south' | 'east' | 'west' | 'northEast' | 'northWest' | 'southEast' | 'southWest'

/** Edificio colocado en el mapa. */
export interface PlacedBuilding {
  readonly id: BuildingId
  readonly type: BuildingTypeId
  readonly origin: TileCoord
  readonly rotation: Rotation
  /** Nivel actual (índice en `tiers`; 0 = nivel 1). */
  readonly tier: number
  /** Solo campos: para qué se usa. */
  readonly role?: PitchRole
  /** Solo gradas: campo y hueco al que está pegada. */
  readonly attach?: { readonly pitchId: BuildingId; readonly slot: StandSlot }
  /**
   * Tamaño sin girar cuando no es el del catálogo (gradas: largo del lado del
   * campo × fondo del nivel). Usar siempre `placedSize()`.
   */
  readonly size?: GridSize
}

/** Tamaño sin girar de un objeto colocado (el suyo propio o el del catálogo). */
export function placedSize(building: PlacedBuilding, def: BuildingDef): GridSize {
  return building.size ?? def.size
}
