import { describe, expect, it } from 'vitest'
import {
  clipRectToGrid,
  footprint,
  isInsideGrid,
  isRectInsideGrid,
  lineFromCorners,
  nextRotation,
  perimeterTiles,
  rectFromCorners,
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

describe('rectFromCorners', () => {
  const a: TileCoord = { x: 3, y: 4 }

  it.each<[string, TileCoord]>([
    ['abajo a la derecha', { x: 6, y: 7 }],
    ['abajo a la izquierda', { x: 0, y: 7 }],
    ['arriba a la derecha', { x: 6, y: 1 }],
    ['arriba a la izquierda', { x: 0, y: 1 }],
  ])('arrastrando hacia %s abarca ambas esquinas', (_nombre, b) => {
    const rect = rectFromCorners(a, b)

    expect(rect.x).toBe(Math.min(a.x, b.x))
    expect(rect.y).toBe(Math.min(a.y, b.y))
    expect(rect.width).toBe(Math.abs(a.x - b.x) + 1)
    expect(rect.height).toBe(Math.abs(a.y - b.y) + 1)
  })

  it('da el mismo rectángulo con las esquinas intercambiadas', () => {
    const b: TileCoord = { x: 8, y: 2 }
    expect(rectFromCorners(a, b)).toEqual(rectFromCorners(b, a))
  })

  it('valores concretos: de (3,4) a (6,7) es x3 y4 4×4', () => {
    expect(rectFromCorners(a, { x: 6, y: 7 })).toEqual({ x: 3, y: 4, width: 4, height: 4 })
  })

  it('con la misma casilla da un rectángulo 1×1', () => {
    expect(rectFromCorners(a, a)).toEqual({ x: 3, y: 4, width: 1, height: 1 })
  })
})

describe('clipRectToGrid', () => {
  const grid: GridSize = { width: 20, height: 10 }

  it('devuelve el mismo rectángulo si ya está dentro', () => {
    const rect: TileRect = { x: 2, y: 3, width: 4, height: 5 }
    expect(clipRectToGrid(rect, grid)).toEqual(rect)
  })

  it('no recorta un rectángulo que es el mapa entero', () => {
    const rect: TileRect = { x: 0, y: 0, width: 20, height: 10 }
    expect(clipRectToGrid(rect, grid)).toEqual(rect)
  })

  it.each<[string, TileRect, TileRect]>([
    ['izquierda', { x: -3, y: 2, width: 5, height: 2 }, { x: 0, y: 2, width: 2, height: 2 }],
    ['arriba', { x: 2, y: -2, width: 3, height: 4 }, { x: 2, y: 0, width: 3, height: 2 }],
    ['derecha', { x: 18, y: 2, width: 5, height: 2 }, { x: 18, y: 2, width: 2, height: 2 }],
    ['abajo', { x: 2, y: 8, width: 3, height: 5 }, { x: 2, y: 8, width: 3, height: 2 }],
    [
      'todos los lados',
      { x: -5, y: -5, width: 40, height: 40 },
      { x: 0, y: 0, width: 20, height: 10 },
    ],
  ])('recorta lo que sobresale por %s', (_nombre, rect, esperado) => {
    expect(clipRectToGrid(rect, grid)).toEqual(esperado)
  })

  it.each<[string, TileRect]>([
    ['a la izquierda', { x: -5, y: 0, width: 5, height: 3 }],
    ['encima', { x: 0, y: -4, width: 3, height: 4 }],
    ['a la derecha', { x: 20, y: 0, width: 3, height: 3 }],
    ['debajo', { x: 0, y: 10, width: 3, height: 3 }],
    ['lejos en diagonal', { x: 50, y: 50, width: 2, height: 2 }],
  ])('devuelve null si está completamente fuera %s', (_nombre, rect) => {
    expect(clipRectToGrid(rect, grid)).toBeNull()
  })
})

describe('lineFromCorners', () => {
  it.each<[string, TileCoord, TileCoord, TileRect]>([
    ['hacia la derecha', { x: 3, y: 4 }, { x: 7, y: 5 }, { x: 3, y: 4, width: 5, height: 1 }],
    ['hacia la izquierda', { x: 7, y: 4 }, { x: 3, y: 5 }, { x: 3, y: 4, width: 5, height: 1 }],
    ['hacia abajo', { x: 3, y: 4 }, { x: 4, y: 9 }, { x: 3, y: 4, width: 1, height: 6 }],
    ['hacia arriba', { x: 3, y: 9 }, { x: 4, y: 4 }, { x: 3, y: 4, width: 1, height: 6 }],
  ])('arrastrando %s da una línea que empieza en la fila o columna de a', (_n, a, b, esperado) => {
    expect(lineFromCorners(a, b)).toEqual(esperado)
  })

  it('con |dx| = |dy| prefiere la horizontal', () => {
    expect(lineFromCorners({ x: 2, y: 2 }, { x: 5, y: 5 })).toEqual({
      x: 2,
      y: 2,
      width: 4,
      height: 1,
    })
  })

  it('con la misma casilla da una línea de 1×1', () => {
    expect(lineFromCorners({ x: 2, y: 2 }, { x: 2, y: 2 })).toEqual({
      x: 2,
      y: 2,
      width: 1,
      height: 1,
    })
  })
})

describe('perimeterTiles', () => {
  it.each<[number, number]>([
    [3, 3],
    [5, 4],
    [2, 6],
    [10, 7],
  ])('un rectángulo %i×%i tiene 2w + 2h − 4 casillas sin duplicados', (width, height) => {
    const tiles = [...perimeterTiles({ x: 1, y: 2, width, height })]
    expect(tiles).toHaveLength(2 * width + 2 * height - 4)
    expect(new Set(tiles.map((t) => `${t.x},${t.y}`)).size).toBe(tiles.length)
  })

  it('un rectángulo 1×1 da una única casilla', () => {
    expect([...perimeterTiles({ x: 4, y: 4, width: 1, height: 1 })]).toEqual([{ x: 4, y: 4 }])
  })

  it('no incluye casillas del interior', () => {
    const tiles = [...perimeterTiles({ x: 0, y: 0, width: 4, height: 4 })]
    expect(tiles).not.toContainEqual({ x: 1, y: 1 })
    expect(tiles).not.toContainEqual({ x: 2, y: 2 })
  })
})
