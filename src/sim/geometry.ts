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

/** Dimensiones medidas en casillas (del mapa o de un edificio). */
export interface GridSize {
  readonly width: number
  readonly height: number
}

/** Rectángulo de casillas: esquina superior izquierda + tamaño. */
export interface TileRect extends TileCoord, GridSize {}

/** Giro en cuartos de vuelta (sentido horario): 0 = 0°, 1 = 90°, 2 = 180°, 3 = 270°. */
export type Rotation = 0 | 1 | 2 | 3

/**
 * Indica si una casilla es válida y cae dentro de los límites del mapa.
 * Exige coordenadas enteras: un dato corrupto (p. ej. de una partida guardada)
 * con decimales indexaría posiciones inexistentes de los arrays del estado.
 */
export function isInsideGrid(tile: TileCoord, grid: GridSize): boolean {
  if (!Number.isInteger(tile.x) || !Number.isInteger(tile.y)) return false
  return tile.x >= 0 && tile.y >= 0 && tile.x < grid.width && tile.y < grid.height
}

/** Indica si un rectángulo cabe entero dentro del mapa. */
export function isRectInsideGrid(rect: TileRect, grid: GridSize): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= grid.width &&
    rect.y + rect.height <= grid.height
  )
}

/** Tamaño tras girar: a 90° y 270° se intercambian ancho y alto. */
export function rotateSize(size: GridSize, rotation: Rotation): GridSize {
  return rotation % 2 === 0 ? size : { width: size.height, height: size.width }
}

/** Siguiente giro de 90° en sentido horario. */
export function nextRotation(rotation: Rotation): Rotation {
  return ((rotation + 1) % 4) as Rotation
}

/** Huella de un objeto de tamaño `size` colocado en `origin` con un giro dado. */
export function footprint(origin: TileCoord, size: GridSize, rotation: Rotation): TileRect {
  return { x: origin.x, y: origin.y, ...rotateSize(size, rotation) }
}

/** Recorre todas las casillas de un rectángulo, fila a fila. */
export function* tilesInRect(rect: TileRect): Generator<TileCoord> {
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      yield { x, y }
    }
  }
}

/**
 * Rectángulo que abarcan dos casillas cualesquiera (p. ej. inicio y fin de un
 * arrastre), sin importar en qué dirección se arrastró. Ambas quedan dentro.
 */
export function rectFromCorners(a: TileCoord, b: TileCoord): TileRect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, width: Math.abs(a.x - b.x) + 1, height: Math.abs(a.y - b.y) + 1 }
}

/** Recorta un rectángulo a los límites del mapa; null si queda fuera del todo. */
export function clipRectToGrid(rect: TileRect, grid: GridSize): TileRect | null {
  const x = Math.max(rect.x, 0)
  const y = Math.max(rect.y, 0)
  const right = Math.min(rect.x + rect.width, grid.width)
  const bottom = Math.min(rect.y + rect.height, grid.height)
  if (right <= x || bottom <= y) return null
  return { x, y, width: right - x, height: bottom - y }
}
