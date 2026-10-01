import { describe, expect, it } from 'vitest'
import type { GridSize, TileCoord } from '@/sim/geometry'
import {
  fitGridToScreen,
  IDENTITY_VIEW,
  screenToTile,
  screenToWorld,
  tileCenterToWorld,
  tileToWorld,
  TILE_SIZE,
  worldToScreen,
  worldToTile,
  type Point,
  type ViewTransform,
} from './grid'

const VISTA_ESCALADA: ViewTransform = { x: 100, y: 50, scale: 0.5 }

describe('constantes', () => {
  it('TILE_SIZE vale 64', () => {
    expect(TILE_SIZE).toBe(64)
  })
})

describe('tileToWorld y tileCenterToWorld', () => {
  it.each<[TileCoord, Point]>([
    [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    [
      { x: 1, y: 2 },
      { x: 64, y: 128 },
    ],
    [
      { x: 10, y: 3 },
      { x: 640, y: 192 },
    ],
  ])('tileToWorld %o -> esquina %o', (tile, esperado) => {
    expect(tileToWorld(tile)).toEqual(esperado)
  })

  it.each<[TileCoord, Point]>([
    [
      { x: 0, y: 0 },
      { x: 32, y: 32 },
    ],
    [
      { x: 1, y: 2 },
      { x: 96, y: 160 },
    ],
    [
      { x: 10, y: 3 },
      { x: 672, y: 224 },
    ],
  ])('tileCenterToWorld %o -> centro %o', (tile, esperado) => {
    expect(tileCenterToWorld(tile)).toEqual(esperado)
  })
})

describe('worldToTile', () => {
  it.each<[string, Point, TileCoord]>([
    ['interior de la casilla 0', { x: 10, y: 20 }, { x: 0, y: 0 }],
    ['interior de la casilla (2,3)', { x: 150, y: 200 }, { x: 2, y: 3 }],
    ['borde exacto 64 -> casilla 1', { x: 64, y: 64 }, { x: 1, y: 1 }],
    ['63.99 -> casilla 0', { x: 63.99, y: 63.99 }, { x: 0, y: 0 }],
    ['negativo -1 -> casilla -1 (floor, no trunc)', { x: -1, y: -1 }, { x: -1, y: -1 }],
    ['-64 -> casilla -1', { x: -64, y: -64 }, { x: -1, y: -1 }],
    ['-65 -> casilla -2', { x: -65, y: -65 }, { x: -2, y: -2 }],
  ])('%s', (_nombre, punto, esperado) => {
    expect(worldToTile(punto)).toEqual(esperado)
  })
})

describe('ida y vuelta casilla <-> mundo', () => {
  it.each<TileCoord>([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 7, y: 13 },
    { x: 29, y: 29 },
    { x: -1, y: -3 },
  ])('worldToTile(tileCenterToWorld(%o)) devuelve la misma casilla', (tile) => {
    expect(worldToTile(tileCenterToWorld(tile))).toEqual(tile)
  })
})

describe('worldToScreen y screenToWorld', () => {
  const puntos: Point[] = [
    { x: 0, y: 0 },
    { x: 64, y: 128 },
    { x: -30.5, y: 999.25 },
  ]

  it('con IDENTITY_VIEW no cambia el punto', () => {
    const p = { x: 12, y: 34 }
    expect(worldToScreen(p, IDENTITY_VIEW)).toEqual(p)
    expect(screenToWorld(p, IDENTITY_VIEW)).toEqual(p)
  })

  it('con vista escalada aplica escala y desplazamiento', () => {
    expect(worldToScreen({ x: 64, y: 128 }, VISTA_ESCALADA)).toEqual({ x: 132, y: 114 })
    expect(screenToWorld({ x: 132, y: 114 }, VISTA_ESCALADA)).toEqual({ x: 64, y: 128 })
  })

  it.each([
    ['IDENTITY_VIEW', IDENTITY_VIEW],
    ['vista escalada', VISTA_ESCALADA],
  ])('ida y vuelta screenToWorld(worldToScreen(p)) ≈ p con %s', (_nombre, vista) => {
    for (const p of puntos) {
      const vuelta = screenToWorld(worldToScreen(p, vista), vista)
      expect(vuelta.x).toBeCloseTo(p.x, 6)
      expect(vuelta.y).toBeCloseTo(p.y, 6)
    }
  })
})

describe('screenToTile', () => {
  it('con vista escalada y desplazada devuelve la casilla esperada', () => {
    // Casilla (2,3) ocupa en pantalla x: 164..196, y: 146..178 (tamaño 32 px).
    expect(screenToTile({ x: 165, y: 147 }, VISTA_ESCALADA)).toEqual({ x: 2, y: 3 })
    expect(screenToTile({ x: 195, y: 177 }, VISTA_ESCALADA)).toEqual({ x: 2, y: 3 })
  })

  it('el borde exacto de la casilla pertenece a la siguiente', () => {
    expect(screenToTile({ x: 196, y: 178 }, VISTA_ESCALADA)).toEqual({ x: 3, y: 4 })
  })

  it('un píxel a la izquierda/arriba del origen del mapa da casilla negativa', () => {
    expect(screenToTile({ x: 99, y: 49 }, VISTA_ESCALADA)).toEqual({ x: -1, y: -1 })
  })
})

describe('fitGridToScreen', () => {
  const rejilla: GridSize = { width: 30, height: 30 } // 1920×1920 px de mundo

  it('pantalla grande: escala 1 por maxScale y mapa centrado', () => {
    const vista = fitGridToScreen(rejilla, { width: 4000, height: 4000 })
    expect(vista.scale).toBe(1)
    expect(vista.x).toBe((4000 - 1920) / 2)
    expect(vista.y).toBe((4000 - 1920) / 2)
  })

  it('pantalla pequeña: escala limitada por el alto con padding 24, centrado y dentro', () => {
    const pantalla = { width: 800, height: 600 }
    const vista = fitGridToScreen(rejilla, pantalla)
    const escalaEsperada = (600 - 48) / 1920

    expect(vista.scale).toBeCloseTo(escalaEsperada, 10)
    expect(vista.x).toBeCloseTo((800 - 1920 * escalaEsperada) / 2, 10)
    expect(vista.y).toBeCloseTo(24, 10)

    // El mapa entero queda dentro de la pantalla.
    expect(vista.x).toBeGreaterThanOrEqual(0)
    expect(vista.y).toBeGreaterThanOrEqual(0)
    expect(vista.x + 1920 * vista.scale).toBeLessThanOrEqual(pantalla.width)
    expect(vista.y + 1920 * vista.scale).toBeLessThanOrEqual(pantalla.height)
  })

  it.each([
    ['pantalla 0×0', { width: 0, height: 0 }],
    ['pantalla diminuta 10×10', { width: 10, height: 10 }],
  ])('%s no devuelve NaN ni Infinity', (_nombre, pantalla) => {
    const vista = fitGridToScreen(rejilla, pantalla)
    expect(Number.isFinite(vista.x)).toBe(true)
    expect(Number.isFinite(vista.y)).toBe(true)
    expect(Number.isFinite(vista.scale)).toBe(true)
    expect(vista.scale).toBeGreaterThan(0)
  })

  it('respeta maxScale y padding personalizados', () => {
    const pequena: GridSize = { width: 10, height: 10 } // 640×640 px
    const pantalla = { width: 1000, height: 1000 }

    // padding 100 -> disponible 800 -> 1.25; maxScale 2 no limita.
    const conPadding = fitGridToScreen(pequena, pantalla, { padding: 100, maxScale: 2 })
    expect(conPadding.scale).toBeCloseTo(1.25, 10)
    expect(conPadding.x).toBeCloseTo(100, 10)
    expect(conPadding.y).toBeCloseTo(100, 10)

    // maxScale 0.5 limita aunque quepa más grande.
    const limitada = fitGridToScreen(pequena, pantalla, { maxScale: 0.5 })
    expect(limitada.scale).toBe(0.5)
    expect(limitada.x).toBeCloseTo((1000 - 320) / 2, 10)
  })
})
