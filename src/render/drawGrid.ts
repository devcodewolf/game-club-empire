/**
 * Dibujo estático del suelo y la rejilla.
 */
import { Container, Graphics, TilingSprite, type Renderer } from 'pixi.js'
import type { GridSize } from '@/sim/geometry'
import { gridWorldSize, TILE_SIZE } from './grid'
import { palette } from './palette'

/**
 * Suelo en ajedrezado de dos tonos de hierba.
 *
 * En vez de dibujar una forma por casilla (10.000 en un mapa de 100×100), se
 * genera una textura de 2×2 casillas y se repite con un TilingSprite: un único
 * quad para la GPU, sea cual sea el tamaño del mapa.
 */
export function drawGround(layer: Container, grid: GridSize, renderer: Renderer): void {
  const pattern = new Graphics()
    .rect(0, 0, TILE_SIZE * 2, TILE_SIZE * 2)
    .fill(palette.grassDark)
    .rect(0, 0, TILE_SIZE, TILE_SIZE)
    .rect(TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE)
    .fill(palette.grassLight)

  const texture = renderer.generateTexture(pattern)
  pattern.destroy()

  const { width, height } = gridWorldSize(grid)
  layer.addChild(new TilingSprite({ texture, width, height }))
}

/** Líneas de la rejilla más un borde exterior marcado. */
export function drawGridLines(layer: Container, grid: GridSize): void {
  const { width, height } = gridWorldSize(grid)
  const lines = new Graphics()

  for (let x = 0; x <= grid.width; x++) {
    lines.moveTo(x * TILE_SIZE, 0).lineTo(x * TILE_SIZE, height)
  }
  for (let y = 0; y <= grid.height; y++) {
    lines.moveTo(0, y * TILE_SIZE).lineTo(width, y * TILE_SIZE)
  }
  // pixelLine: siempre 1 px de pantalla, sea cual sea el zoom (evita líneas borrosas)
  lines.stroke({ color: palette.gridLine, alpha: 0.35, pixelLine: true })

  lines.rect(0, 0, width, height).stroke({ color: palette.outline, width: 2 })

  layer.addChild(lines)
}
