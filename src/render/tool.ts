/**
 * Herramienta activa del jugador: qué hace el clic izquierdo sobre el mapa.
 *
 * Es un dato plano. La UI la guarda en Pinia y se la pasa al renderer con
 * `setTool`; el render la usa para la vista previa y para proponer comandos.
 */
import type { BuildingTypeId } from '@/sim/buildings'
import type { Rotation } from '@/sim/geometry'

export type Tool =
  | { readonly kind: 'none' }
  | { readonly kind: 'build'; readonly buildingType: BuildingTypeId; readonly rotation: Rotation }
  | { readonly kind: 'demolish' }
  | { readonly kind: 'buyParcel' }

export const NO_TOOL: Tool = { kind: 'none' }
