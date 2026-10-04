import { describe, expect, it } from 'vitest'
import type { GridSize } from '@/sim/geometry'
import {
  centerOn,
  clampView,
  DEFAULT_CAMERA_LIMITS,
  GRID_MIN_ALPHA,
  gridLineAlpha,
  panBy,
  wheelToZoomFactor,
  zoomAt,
  type CameraLimits,
} from '../camera'
import { screenToWorld, worldToScreen, type Point, type Size, type ViewTransform } from '../../core/grid'

const PANTALLA: Size = { width: 1280, height: 720 }
const REJILLA_GRANDE: GridSize = { width: 100, height: 100 }
const { overscroll } = DEFAULT_CAMERA_LIMITS
const MUNDO_GRANDE = 100 * 64

describe('centerOn', () => {
  it.each([0.25, 0.5, 1, 2])(
    'deja el objetivo en el centro de la pantalla a escala %f',
    (scale) => {
      const objetivo: Point = { x: 1234, y: 567 }
      const vista = centerOn(objetivo, scale, PANTALLA)

      const enPantalla = worldToScreen(objetivo, vista)
      expect(enPantalla.x).toBeCloseTo(PANTALLA.width / 2)
      expect(enPantalla.y).toBeCloseTo(PANTALLA.height / 2)
      expect(vista.scale).toBe(scale)
    },
  )
})

describe('panBy', () => {
  it('suma el desplazamiento y conserva la escala', () => {
    const vista: ViewTransform = { x: 10, y: -20, scale: 1.5 }
    expect(panBy(vista, 5, -7)).toEqual({ x: 15, y: -27, scale: 1.5 })
  })
})

describe('zoomAt', () => {
  const vista: ViewTransform = { x: -300, y: -150, scale: 1 }

  it.each<[Point, number]>([
    [{ x: 0, y: 0 }, 1.2],
    [{ x: 640, y: 360 }, 0.8],
    [{ x: 1000, y: 100 }, 1.5],
    [{ x: 123, y: 456 }, 0.6],
  ])('mantiene bajo el cursor %o el mismo punto de mundo (factor %f)', (cursor, factor) => {
    const antes = screenToWorld(cursor, vista)
    const nueva = zoomAt(vista, cursor, factor)

    const despues = screenToWorld(cursor, nueva)
    expect(despues.x).toBeCloseTo(antes.x)
    expect(despues.y).toBeCloseTo(antes.y)
    expect(nueva.scale).toBeCloseTo(vista.scale * factor)
  })

  it('respeta minScale y maxScale', () => {
    const limites: CameraLimits = { minScale: 0.5, maxScale: 1.5, overscroll: 0 }
    const cursor: Point = { x: 100, y: 100 }

    expect(zoomAt(vista, cursor, 100, limites).scale).toBe(1.5)
    expect(zoomAt(vista, cursor, 0.001, limites).scale).toBe(0.5)
  })

  it('devuelve la misma referencia si ya está en el límite', () => {
    const cursor: Point = { x: 100, y: 100 }
    const enMaximo: ViewTransform = { x: 0, y: 0, scale: DEFAULT_CAMERA_LIMITS.maxScale }
    const enMinimo: ViewTransform = { x: 0, y: 0, scale: DEFAULT_CAMERA_LIMITS.minScale }

    expect(zoomAt(enMaximo, cursor, 1.5)).toBe(enMaximo)
    expect(zoomAt(enMinimo, cursor, 0.5)).toBe(enMinimo)
  })
})

describe('clampView', () => {
  it('a escala 1 no pasa del overscroll por izquierda y arriba', () => {
    const vista = clampView({ x: 99999, y: 99999, scale: 1 }, REJILLA_GRANDE, PANTALLA)
    expect(vista.x).toBeLessThanOrEqual(overscroll)
    expect(vista.y).toBeLessThanOrEqual(overscroll)
    expect(vista.x).toBe(320)
    expect(vista.y).toBe(320)
  })

  it('a escala 1 no pasa del overscroll por derecha y abajo', () => {
    const vista = clampView({ x: -99999, y: -99999, scale: 1 }, REJILLA_GRANDE, PANTALLA)
    expect(vista.x).toBeGreaterThanOrEqual(PANTALLA.width - MUNDO_GRANDE - overscroll)
    expect(vista.y).toBeGreaterThanOrEqual(PANTALLA.height - MUNDO_GRANDE - overscroll)
    expect(vista.x).toBe(1280 - 6400 - 320)
    expect(vista.y).toBe(720 - 6400 - 320)
  })

  it('centra el mapa si cabe en pantalla por escala muy pequeña', () => {
    const escala = 0.01
    const vista = clampView({ x: 500, y: -500, scale: escala }, REJILLA_GRANDE, PANTALLA)
    expect(vista.x).toBeCloseTo((PANTALLA.width - MUNDO_GRANDE * escala) / 2)
    expect(vista.y).toBeCloseTo((PANTALLA.height - MUNDO_GRANDE * escala) / 2)
  })

  it('centra el mapa si la rejilla es pequeña', () => {
    const vista = clampView({ x: 900, y: -900, scale: 1 }, { width: 1, height: 1 }, PANTALLA)
    expect(vista.x).toBe((1280 - 64) / 2)
    expect(vista.y).toBe((720 - 64) / 2)
  })

  it('no cambia una vista ya válida', () => {
    const valida: ViewTransform = { x: -1000, y: -2000, scale: 1 }
    expect(clampView(valida, REJILLA_GRANDE, PANTALLA)).toEqual(valida)
  })
})

describe('wheelToZoomFactor', () => {
  it('deltaY negativo acerca, positivo aleja y cero no cambia', () => {
    expect(wheelToZoomFactor(-100)).toBeGreaterThan(1)
    expect(wheelToZoomFactor(100)).toBeLessThan(1)
    expect(wheelToZoomFactor(0)).toBe(1)
  })

  it.each([1, 53, 120, 400])('es simétrica: f(d) × f(-d) ≈ 1 con d = %f', (delta) => {
    expect(wheelToZoomFactor(delta) * wheelToZoomFactor(-delta)).toBeCloseTo(1)
  })
})

describe('gridLineAlpha', () => {
  it('nunca desaparece: GRID_MIN_ALPHA a escala ≤ 0.1 y 1 a escala ≥ 0.5', () => {
    expect(gridLineAlpha(0.05)).toBe(GRID_MIN_ALPHA)
    expect(gridLineAlpha(0.1)).toBe(GRID_MIN_ALPHA)
    expect(gridLineAlpha(0.5)).toBe(1)
    expect(gridLineAlpha(2)).toBe(1)
    expect(GRID_MIN_ALPHA).toBeGreaterThan(0)
  })

  it('es monótona y se mantiene en [0, 1]', () => {
    let anterior = -Infinity
    for (let escala = 0; escala <= 2.5; escala += 0.01) {
      const alpha = gridLineAlpha(escala)
      expect(alpha).toBeGreaterThanOrEqual(0)
      expect(alpha).toBeLessThanOrEqual(1)
      expect(alpha).toBeGreaterThanOrEqual(anterior)
      anterior = alpha
    }
  })
})
