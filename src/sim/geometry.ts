/**
 * Tipos geométricos de la simulación.
 *
 * La simulación solo piensa en casillas (coordenadas enteras). No sabe nada
 * de píxeles, cámara ni pantalla: eso es responsabilidad de `src/render/`.
 */

/** Posición de una casilla en el mapa (enteros, origen arriba a la izquierda). */
export interface TileCoord {
  readonly x: number
  readonly y: number
}

/** Dimensiones del mapa medidas en casillas. */
export interface GridSize {
  readonly width: number
  readonly height: number
}

/** Indica si una casilla cae dentro de los límites del mapa. */
export function isInsideGrid(tile: TileCoord, grid: GridSize): boolean {
  return tile.x >= 0 && tile.y >= 0 && tile.x < grid.width && tile.y < grid.height
}
