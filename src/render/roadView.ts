/**
 * Carretera general del borde derecho: marcas viales y prolongación fuera del
 * mapa (por arriba y por abajo) para dar la sensación de un mundo que sigue.
 *
 * El asfalto dentro del mapa ya lo pinta la vista de suelos (son casillas
 * reservadas); aquí solo se añaden las marcas y los tramos exteriores.
 */
import { Graphics, type Container, type FillInput } from 'pixi.js'
import { ENTRANCE, ROAD } from '@/content/map'
import type { GridSize } from '@/sim/geometry'
import { TILE_SIZE } from './grid'
import { palette } from './palette'

/** Cuánto se prolonga la carretera fuera del mapa, en casillas. */
const OUTSIDE = 40
const DASH = 2
const GAP = 2
const LINE_WIDTH = 6
const CURB_WIDTH = 5

export function drawRoad(
  layer: Container,
  grid: GridSize,
  asphalt: FillInput,
  sidewalk: FillInput,
): void {
  const g = new Graphics({ label: 'road' })
  const top = -OUTSIDE * TILE_SIZE
  const bottom = (grid.height + OUTSIDE) * TILE_SIZE
  const sidewalkLeft = (ROAD.x - ROAD.sidewalk) * TILE_SIZE
  const asphaltLeft = ROAD.x * TILE_SIZE
  const asphaltRight = (ROAD.x + ROAD.width) * TILE_SIZE
  const sidewalkRight = asphaltRight + ROAD.sidewalk * TILE_SIZE

  // Tramos exteriores (fuera del mapa): acera + asfalto + acera
  for (const [y, height] of [
    [top, OUTSIDE * TILE_SIZE],
    [grid.height * TILE_SIZE, OUTSIDE * TILE_SIZE],
  ] as const) {
    g.rect(sidewalkLeft, y, sidewalkRight - sidewalkLeft, height).fill(sidewalk)
    g.rect(asphaltLeft, y, asphaltRight - asphaltLeft, height).fill(asphalt)
  }

  // Bordillos a lo largo de toda la carretera, interrumpidos en el acceso
  const entranceTop = ENTRANCE.y * TILE_SIZE
  const entranceBottom = (ENTRANCE.y + ENTRANCE.height) * TILE_SIZE
  g.moveTo(asphaltLeft, top).lineTo(asphaltLeft, entranceTop)
  g.moveTo(asphaltLeft, entranceBottom).lineTo(asphaltLeft, bottom)
  g.moveTo(asphaltRight, top).lineTo(asphaltRight, bottom)
  g.stroke({ color: palette.stoneDark, width: CURB_WIDTH })

  // Línea central discontinua
  const centerX = (ROAD.x + ROAD.width / 2) * TILE_SIZE
  for (let y = top; y < bottom; y += (DASH + GAP) * TILE_SIZE) {
    g.moveTo(centerX, y).lineTo(centerX, y + DASH * TILE_SIZE)
  }
  g.stroke({ color: palette.chalk, width: LINE_WIDTH, alpha: 0.9 })

  layer.addChild(g)
}
