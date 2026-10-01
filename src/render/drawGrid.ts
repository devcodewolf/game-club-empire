/**
 * Dibujo estático del suelo y la rejilla.
 */
import { Container, Graphics, TilingSprite, type Texture } from 'pixi.js'
import type { GridSize } from '@/sim/geometry'
import { gridWorldSize, TILE_SIZE } from './grid'
import { palette } from './palette'

/**
 * Fondo de hierba: la textura de hierba (2×2 casillas) repetida con un
 * TilingSprite, un único quad para la GPU sea cual sea el tamaño del mapa.
 */
export function drawGround(layer: Container, grid: GridSize, grassTexture: Texture): void {
  const { width, height } = gridWorldSize(grid)
  layer.addChild(new TilingSprite({ texture: grassTexture, width, height }))
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
  lines.stroke({ color: palette.outline, alpha: 0.28, pixelLine: true })

  lines.rect(0, 0, width, height).stroke({ color: palette.outline, width: 2 })

  layer.addChild(lines)
}
