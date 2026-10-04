/**
 * Zonas de ampliación futura del mapa (arriba, izquierda y abajo), en casillas.
 * Quedan FUERA del mapa. Funciones puras: las usa el dibujo y el clic.
 */
import { EXPANSION_SIDES, ROAD, type ExpansionSide } from '@/content/map'
import type { GridSize, TileCoord, TileRect } from '@/sim/geometry'

/** Profundidad de la franja de ampliación, en casillas. */
export const EXPANSION_DEPTH = 20

/** Distancia del candado al borde del mapa, en casillas (visible sin alejar mucho). */
export const PADLOCK_DISTANCE = 6

export function expansionZone(side: ExpansionSide, grid: GridSize): TileRect {
  // Arriba y abajo llegan hasta la acera: la carretera no se amplía.
  const usableWidth = ROAD.x - ROAD.sidewalk
  switch (side) {
    case 'top':
      return { x: 0, y: -EXPANSION_DEPTH, width: usableWidth, height: EXPANSION_DEPTH }
    case 'bottom':
      return { x: 0, y: grid.height, width: usableWidth, height: EXPANSION_DEPTH }
    case 'left':
      return { x: -EXPANSION_DEPTH, y: 0, width: EXPANSION_DEPTH, height: grid.height }
  }
}

/** Casilla (fuera del mapa) donde va el candado de cada lado. */
export function padlockTile(side: ExpansionSide, grid: GridSize): TileCoord {
  const zone = expansionZone(side, grid)
  switch (side) {
    case 'top':
      return { x: Math.floor(zone.x + zone.width / 2), y: -PADLOCK_DISTANCE }
    case 'bottom':
      return { x: Math.floor(zone.x + zone.width / 2), y: grid.height + PADLOCK_DISTANCE - 1 }
    case 'left':
      return { x: -PADLOCK_DISTANCE, y: Math.floor(zone.y + zone.height / 2) }
  }
}

/** Lado de ampliación que contiene una casilla, o null. */
export function expansionAt(tile: TileCoord, grid: GridSize): ExpansionSide | null {
  for (const side of EXPANSION_SIDES) {
    const z = expansionZone(side, grid)
    if (tile.x >= z.x && tile.x < z.x + z.width && tile.y >= z.y && tile.y < z.y + z.height)
      return side
  }
  return null
}
