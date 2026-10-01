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
  rectFromCorners,
  rotateSize,
  type GridSize,
  type Rotation,
  type TileCoord,
} from '@/sim/geometry'
import { buildingAt, type MapState } from '@/sim/map'
import type { Tool } from './tool'

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
    case 'demolish': {
      const building = buildingAt(state, cursor)
      return building ? { type: 'demolishBuilding', buildingId: building.id } : null
    }
    case 'paintFloor':
      // Un clic sin arrastrar pinta una sola casilla.
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
  if (tool.kind !== 'paintFloor') return null

  const rect = clipRectToGrid(rectFromCorners(from, to), state.size)
  return rect ? { type: 'paintFloor', rect, floor: tool.floor } : null
}
