/**
 * Contrato de muros y puertas para la simulación. Los datos concretos viven
 * en `src/content/walls.ts` y `src/content/doors.ts`.
 */

export type WallId = string
export type DoorId = string

/** Valor de `walls` para una casilla sin muro. */
export const NO_WALL: WallId = ''
/** Valor de `doors` para una casilla sin puerta. */
export const NO_DOOR: DoorId = ''

/** Dibujo del muro (pista para el render; la simulación lo ignora). */
export type WallPattern = 'brick' | 'concrete' | 'stone' | 'plaster' | 'fence' | 'hedge'

export interface WallDef {
  readonly id: WallId
  readonly name: string
  readonly costPerTile: number
  readonly pattern: WallPattern
  /** Remate (cara superior) del muro. */
  readonly capColor: number
  /** Material visible en la cara del muro (ladrillo, bloque, piedra…). */
  readonly faceColor: number
  /** ¿Sirve para cerrar cimientos? Las vallas y setos no crean zonas interiores. */
  readonly structural: boolean
  readonly requires?: string
}

/** Dibujo de la puerta (pista para el render). */
export type DoorPattern = 'wood' | 'metal' | 'glass' | 'gate'

export interface DoorDef {
  readonly id: DoorId
  readonly name: string
  readonly cost: number
  readonly color: number
  readonly pattern: DoorPattern
  readonly requires?: string
}

export type WallCatalog = Readonly<Record<WallId, WallDef>>
export type DoorCatalog = Readonly<Record<DoorId, DoorDef>>
