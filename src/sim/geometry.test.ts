import { describe, expect, it } from 'vitest'
import {
  footprint,
  isInsideGrid,
  isRectInsideGrid,
  nextRotation,
  rotateSize,
  tilesInRect,
  type GridSize,
  type Rotation,
  type TileCoord,
  type TileRect,
} from './geometry'

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
    ['x con decimales', { x: 0.5, y: 0 }],
    ['y no numérica (NaN)', { x: 0, y: Number.NaN }],
  ])('rechaza %s', (_nombre, tile) => {
    expect(isInsideGrid(tile, grid)).toBe(false)
  })
})

describe('isRectInsideGrid', () => {
  const grid: GridSize = { width: 20, height: 10 }

  it.each<[string, TileRect]>([
    ['rectángulo en (0,0)', { x: 0, y: 0, width: 3, height: 2 }],
    ['pegado al borde derecho e inferior', { x: 17, y: 8, width: 3, height: 2 }],
    ['el mapa entero', { x: 0, y: 0, width: 20, height: 10 }],
  ])('acepta %s', (_nombre, rect) => {
    expect(isRectInsideGrid(rect, grid)).toBe(true)
  })

  it.each<[string, TileRect]>([
    ['x negativa', { x: -1, y: 0, width: 3, height: 2 }],
    ['y negativa', { x: 0, y: -1, width: 3, height: 2 }],
    ['sobresale una casilla por la derecha', { x: 18, y: 0, width: 3, height: 2 }],
    ['sobresale una casilla por abajo', { x: 0, y: 9, width: 3, height: 2 }],
    ['más grande que el mapa', { x: 0, y: 0, width: 21, height: 10 }],
  ])('rechaza %s', (_nombre, rect) => {
    expect(isRectInsideGrid(rect, grid)).toBe(false)
  })
})

describe('rotateSize', () => {
  const size: GridSize = { width: 3, height: 2 }

  it.each<Rotation>([0, 2])('conserva el tamaño con giro %i', (rotation) => {
    expect(rotateSize(size, rotation)).toEqual({ width: 3, height: 2 })
  })

  it.each<Rotation>([1, 3])('intercambia ancho y alto con giro %i', (rotation) => {
    expect(rotateSize(size, rotation)).toEqual({ width: 2, height: 3 })
  })
})

describe('nextRotation', () => {
  it.each<[Rotation, Rotation]>([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ])('tras %i viene %i', (actual, siguiente) => {
    expect(nextRotation(actual)).toBe(siguiente)
  })

  it('cuatro giros devuelven al punto de partida', () => {
    let rotation: Rotation = 0
    for (let i = 0; i < 4; i++) rotation = nextRotation(rotation)
    expect(rotation).toBe(0)
  })
})

describe('footprint', () => {
  const origin: TileCoord = { x: 4, y: 7 }
  const size: GridSize = { width: 3, height: 2 }

  it('sin girar usa el tamaño original', () => {
    expect(footprint(origin, size, 0)).toEqual({ x: 4, y: 7, width: 3, height: 2 })
  })

  it('con giro de 90° intercambia ancho y alto y conserva el origen', () => {
    expect(footprint(origin, size, 1)).toEqual({ x: 4, y: 7, width: 2, height: 3 })
  })

  it('con giro de 180° conserva el tamaño', () => {
    expect(footprint(origin, size, 2)).toEqual({ x: 4, y: 7, width: 3, height: 2 })
  })

  it('con giro de 270° intercambia ancho y alto', () => {
    expect(footprint(origin, size, 3)).toEqual({ x: 4, y: 7, width: 2, height: 3 })
  })
})

describe('tilesInRect', () => {
  it('devuelve ancho × alto casillas', () => {
    expect([...tilesInRect({ x: 2, y: 3, width: 4, height: 3 })]).toHaveLength(12)
  })

  it('recorre fila a fila, de izquierda a derecha', () => {
    expect([...tilesInRect({ x: 1, y: 2, width: 2, height: 2 })]).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
    ])
  })

  it('un rectángulo de ancho 0 no devuelve casillas', () => {
    expect([...tilesInRect({ x: 0, y: 0, width: 0, height: 5 })]).toEqual([])
  })

  it('un rectángulo de alto 0 no devuelve casillas', () => {
    expect([...tilesInRect({ x: 0, y: 0, width: 5, height: 0 })]).toEqual([])
  })
})
