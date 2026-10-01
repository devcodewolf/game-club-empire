/**
 * Vista de suelos, dibujada por trozos (chunks) de CHUNK×CHUNK casillas.
 *
 * Por qué trozos: el mapa tiene decenas de miles de casillas. Un único
 * Graphics con todas sería lento de construir y habría que rehacerlo entero
 * cada vez que se pinta un suelo. Con trozos:
 *  - solo se dibuja lo que no es hierba (la hierba ya es el fondo);
 *  - al pintar se redibujan solo los trozos tocados;
 *  - los trozos fuera de pantalla no se dibujan (culling con `cullArea`).
 * Además, las casillas iguales seguidas en una fila se unen en un solo
 * rectángulo, así un suelo grande cuesta pocas formas.
 */
import { Container, Graphics, Rectangle } from 'pixi.js'
import { DEFAULT_FLOOR } from '@/sim/floors'
import type { Game } from '@/sim/game'
import type { TileRect } from '@/sim/geometry'
import type { FloorTextures } from './floorTextures'
import { TILE_SIZE } from './grid'

/** Lado de un trozo en casillas. */
const CHUNK = 16

export interface FloorsView {
  destroy(): void
}

export function createFloorsView(
  layer: Container,
  game: Game,
  textures: FloorTextures,
): FloorsView {
  const { size } = game.state
  const columns = Math.ceil(size.width / CHUNK)
  const rows = Math.ceil(size.height / CHUNK)
  const chunks: Graphics[] = []

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const chunk = new Graphics({ label: `floors:${column},${row}` })
      chunk.cullable = true
      chunk.cullArea = new Rectangle(
        column * CHUNK * TILE_SIZE,
        row * CHUNK * TILE_SIZE,
        CHUNK * TILE_SIZE,
        CHUNK * TILE_SIZE,
      )
      layer.addChild(chunk)
      chunks.push(chunk)
      drawChunk(chunk, game, textures, column, row)
    }
  }

  /** Redibuja solo los trozos que toca un rectángulo de casillas. */
  const redrawRect = (rect: TileRect): void => {
    const firstColumn = Math.floor(rect.x / CHUNK)
    const lastColumn = Math.floor((rect.x + rect.width - 1) / CHUNK)
    const firstRow = Math.floor(rect.y / CHUNK)
    const lastRow = Math.floor((rect.y + rect.height - 1) / CHUNK)

    for (let row = firstRow; row <= lastRow; row++) {
      for (let column = firstColumn; column <= lastColumn; column++) {
        const chunk = chunks[row * columns + column]
        if (chunk) drawChunk(chunk, game, textures, column, row)
      }
    }
  }

  const unsubscribe = game.subscribe((event) => {
    // Pintar suelo y construir cimientos (ponen suelo interior) cambian suelos.
    if (event.type === 'floorPainted') redrawRect(event.rect)
    if (event.type === 'structuresChanged' && event.cause === 'foundation') redrawRect(event.rect)
  })

  return {
    destroy() {
      unsubscribe()
      for (const chunk of chunks) chunk.destroy()
    },
  }
}

function drawChunk(
  chunk: Graphics,
  game: Game,
  textures: FloorTextures,
  column: number,
  row: number,
): void {
  const { state, content } = game
  chunk.clear()

  const startX = column * CHUNK
  const startY = row * CHUNK
  const endX = Math.min(startX + CHUNK, state.size.width)
  const endY = Math.min(startY + CHUNK, state.size.height)

  for (let y = startY; y < endY; y++) {
    let x = startX
    while (x < endX) {
      const floor = state.floors[y * state.size.width + x] ?? DEFAULT_FLOOR
      // Avanza mientras la casilla siguiente tenga el mismo suelo (tramo).
      let runEnd = x + 1
      while (runEnd < endX && state.floors[y * state.size.width + runEnd] === floor) runEnd++

      if (floor !== DEFAULT_FLOOR) {
        // Patrón en espacio global: el dibujo queda alineado con la rejilla.
        const fill = textures.pattern(floor) ?? content.floors[floor]?.color
        if (fill !== undefined) {
          chunk.rect(x * TILE_SIZE, y * TILE_SIZE, (runEnd - x) * TILE_SIZE, TILE_SIZE).fill(fill)
        }
      }
      x = runEnd
    }
  }
}
