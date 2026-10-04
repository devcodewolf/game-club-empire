/**
 * Herramienta activa del jugador: qué hace el botón izquierdo sobre el mapa.
 *
 * Es un dato plano. La UI la guarda en Pinia y se la pasa al renderer con
 * `setTool`; el render la usa para la vista previa y para proponer comandos.
 */
import type { BuildingTypeId } from '@/sim/buildings/buildings'
import type { FloorId } from '@/sim/map/floors'
import type { Rotation } from '@/sim/geometry'
import type { RoomTypeId } from '@/sim/rooms/roomTypes'
import type { DoorId, WallId } from '@/sim/map/structureTypes'

export type Tool =
  | { readonly kind: 'none' }
  | { readonly kind: 'build'; readonly buildingType: BuildingTypeId; readonly rotation: Rotation }
  /** Grada: se pega al lado del campo bajo el cursor; no se gira. */
  | { readonly kind: 'stand'; readonly buildingType: BuildingTypeId }
  | { readonly kind: 'demolish' }
  | { readonly kind: 'paintFloor'; readonly floor: FloorId }
  | { readonly kind: 'foundation'; readonly wall: WallId; readonly floor: FloorId }
  | { readonly kind: 'wall'; readonly wall: WallId }
  | { readonly kind: 'door'; readonly door: DoorId }
  | { readonly kind: 'demolishStructures' }
  | { readonly kind: 'room'; readonly roomType: RoomTypeId }
  | { readonly kind: 'removeRoom' }

export const NO_TOOL: Tool = { kind: 'none' }

/** Herramientas que se usan arrastrando (pulsar, arrastrar, soltar). */
export function isDragTool(tool: Tool): boolean {
  return dragShape(tool) !== null
}

/** Forma del arrastre: rectángulo (suelos, cimientos, demoler) o línea recta (muros). */
export function dragShape(tool: Tool): 'rect' | 'line' | null {
  switch (tool.kind) {
    case 'paintFloor':
    case 'foundation':
    case 'demolishStructures':
    case 'demolish':
      return 'rect'
    case 'wall':
      return 'line'
    default:
      return null
  }
}
