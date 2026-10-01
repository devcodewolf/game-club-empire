/**
 * Traduce "herramienta + casilla bajo el cursor" en el comando a proponer.
 *
 * Funciones puras (sin Pixi): la vista previa y el clic usan exactamente el
 * mismo cálculo, así lo que ves es lo que se construye.
 */
import type { BuildingCatalog } from '@/sim/buildings'
import type { Command } from '@/sim/commands'
import { rotateSize, type GridSize, type Rotation, type TileCoord } from '@/sim/geometry'
import { buildingAt, parcelOfTile, type MapState } from '@/sim/map'
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
  catalog: BuildingCatalog,
): Command | null {
  switch (tool.kind) {
    case 'none':
      return null
    case 'build': {
      const def = catalog[tool.buildingType]
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
    case 'buyParcel':
      return { type: 'buyParcel', parcel: parcelOfTile(state, cursor) }
  }
}
