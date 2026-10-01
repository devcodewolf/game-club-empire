import { describe, expect, it } from 'vitest'
import { isInsideGrid, type GridSize, type TileCoord } from './geometry'

describe('isInsideGrid', () => {
  const grid: GridSize = { width: 30, height: 20 }

  it.each<[string, TileCoord]>([
    ['esquina superior izquierda (0,0)', { x: 0, y: 0 }],
    ['esquina inferior derecha (w-1,h-1)', { x: grid.width - 1, y: grid.height - 1 }],
    ['casilla interior', { x: 10, y: 5 }],
  ])('acepta %s', (_nombre, tile) => {
    expect(isInsideGrid(tile, grid)).toBe(true)
  })

  it.each<[string, TileCoord]>([
    ['x = -1', { x: -1, y: 0 }],
    ['x = width', { x: grid.width, y: 0 }],
    ['y = -1', { x: 0, y: -1 }],
    ['y = height', { x: 0, y: grid.height }],
    ['ambos ejes fuera', { x: -1, y: grid.height }],
  ])('rechaza %s', (_nombre, tile) => {
    expect(isInsideGrid(tile, grid)).toBe(false)
  })
})
