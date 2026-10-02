/**
 * Traduce "herramienta + casillas bajo el cursor" en el comando a proponer.
 *
 * Funciones puras (sin Pixi): la vista previa, el clic y el arrastre usan
 * exactamente el mismo cálculo, así lo que ves es lo que se construye.
 */
import type { Command } from '@/sim/commands'
import type { SimContent } from '@/sim/content'
import {
  clipRectToGrid,
  lineFromCorners,
  rectFromCorners,
  rotateSize,
  type GridSize,
  type Rotation,
  type TileCoord,
} from '@/sim/geometry'
import type { MapState } from '@/sim/map'
import { standTargetAt } from '@/sim/stands'
import { dragShape, type Tool } from './tool'

/**
 * Origen del edificio para que quede centrado bajo el cursor. En tamaños
 * pares el cursor cae en la casilla de abajo a la derecha del centro.
 */
export function placementOrigin(cursor: TileCoord, size: GridSize, rotation: Rotation): TileCoord {
  const rotated = rotateSize(size, rotation)
  return {
    x: cursor.x - Math.floor(rotated.width / 2),
    y: cursor.y - Math.floor(rotated.height / 2),
  }
}

/** Comando que propondría un clic con la herramienta en esa casilla, o null si no aplica. */
export function commandForTool(
  tool: Tool,
  cursor: TileCoord,
  state: MapState,
  content: SimContent,
): Command | null {
  switch (tool.kind) {
    case 'none':
      return null
    case 'build': {
      const def = content.buildings[tool.buildingType]
      if (!def) return null
      const origin = placementOrigin(cursor, def.size, tool.rotation)
      return {
        type: 'placeBuilding',
        buildingType: tool.buildingType,
        origin,
        rotation: tool.rotation,
      }
    }
    case 'stand': {
      const def = content.buildings[tool.buildingType]
      const depths = def?.stand?.depths ?? []
      const maxDepth = depths[depths.length - 1] ?? 0
      const target = standTargetAt(state, content, cursor, maxDepth, def?.stand?.corner)
      return target && { type: 'placeStand', buildingType: tool.buildingType, ...target }
    }
    case 'demolish':
      return { type: 'demolishAt', tile: cursor }
    case 'door':
      return { type: 'placeDoor', tile: cursor, door: tool.door }
    case 'room':
      return { type: 'designateRoom', tile: cursor, roomType: tool.roomType }
    case 'removeRoom':
      return { type: 'removeRoom', tile: cursor }
    case 'paintFloor':
    case 'wall':
    case 'foundation':
    case 'demolishStructures':
      // Un clic sin arrastrar equivale a un arrastre de una sola casilla.
      return commandForDrag(tool, cursor, cursor, state)
  }
}

/**
 * Comando que propondría un arrastre de `from` a `to`, o null si la
 * herramienta no se arrastra o el rectángulo queda fuera del mapa. El
 * rectángulo se recorta al mapa: arrastrar más allá del borde es cómodo.
 */
export function commandForDrag(
  tool: Tool,
  from: TileCoord,
  to: TileCoord,
  state: MapState,
): Command | null {
  const shape = dragShape(tool)
  if (!shape) return null

  const raw = shape === 'line' ? lineFromCorners(from, to) : rectFromCorners(from, to)
  const rect = clipRectToGrid(raw, state.size)
  if (!rect) return null

  switch (tool.kind) {
    case 'paintFloor':
      return { type: 'paintFloor', rect, floor: tool.floor }
    case 'wall':
      return { type: 'buildWalls', rect, wall: tool.wall }
    case 'foundation':
      return { type: 'buildFoundation', rect, wall: tool.wall, floor: tool.floor }
    case 'demolishStructures':
      return { type: 'demolishStructures', rect }
    case 'demolish':
      // Un clic (zona de 1×1) quita solo lo de encima; un arrastre arrasa la zona.
      return rect.width * rect.height === 1
        ? { type: 'demolishAt', tile: { x: rect.x, y: rect.y } }
        : { type: 'demolishArea', rect }
    default:
      return null
  }
}
