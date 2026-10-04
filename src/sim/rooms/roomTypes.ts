/**
 * Contrato de las salas para la simulación. Los tipos concretos (vestuario,
 * oficina…) viven en `src/content/rooms.ts`.
 */
import type { BuildingTypeId } from '../buildings/buildings'
import type { GridSize } from '../geometry'

export type RoomTypeId = string
export type RoomId = number

/** Valor de `roomOf` para una casilla que no pertenece a ninguna sala. */
export const NO_ROOM: RoomId = 0

/** "Hacen falta al menos `min` objetos de este tipo dentro de la sala". */
export interface RoomRequirement {
  readonly object: BuildingTypeId
  readonly min: number
}

export interface RoomDef {
  readonly id: RoomTypeId
  readonly name: string
  /** Nombre del icono (lo concreta `content/`). */
  readonly icon: string
  /** Color de la zona al planificar y del rótulo (0xRRGGBB). */
  readonly color: number
  /** Tamaño mínimo del espacio útil (sin muros), en casillas. */
  readonly minSize: GridSize
  readonly requirements: readonly RoomRequirement[]
  /** Capacidad = número de objetos `object` × `per` (p. ej. 1 jugador por taquilla). */
  readonly capacity?: {
    readonly object: BuildingTypeId
    readonly per: number
    readonly unit: string
  }
  readonly requires?: string
}

export type RoomCatalog = Readonly<Record<RoomTypeId, RoomDef>>

/** Sala designada en el mapa. Sus casillas están en `MapState.roomOf`. */
export interface Room {
  readonly id: RoomId
  readonly type: RoomTypeId
}
