/**
 * Matemática de la cámara: funciones puras sobre `ViewTransform`.
 *
 * Recordatorio del modelo: `pantalla = mundo × scale + (x, y)`.
 * Nada de Pixi ni DOM aquí; la entrada de ratón vive en `mapInput.ts`.
 */
import type { GridSize } from '@/sim/geometry'
import { gridWorldSize, screenToWorld, type Point, type Size, type ViewTransform } from './grid'

export interface CameraLimits {
  readonly minScale: number
  readonly maxScale: number
  /**
   * Cuánto puede alejarse el borde del mapa del borde de la pantalla, en px de
   * pantalla. Deja sitio para que los paneles laterales no tapen el mapa.
   */
  readonly overscroll: number
}

export const DEFAULT_CAMERA_LIMITS: CameraLimits = {
  minScale: 0.07,
  maxScale: 2,
  overscroll: 320,
}

/** Sensibilidad de la rueda: proporcional al delta, válido para ratón y trackpad. */
const WHEEL_ZOOM_SENSITIVITY = 0.0015

/** Vista con escala `scale` que pone el punto de mundo `target` en el centro de la pantalla. */
export function centerOn(target: Point, scale: number, screen: Size): ViewTransform {
  return {
    x: screen.width / 2 - target.x * scale,
    y: screen.height / 2 - target.y * scale,
    scale,
  }
}

/** Desplaza la vista en píxeles de pantalla (lo que se ha movido el ratón). */
export function panBy(view: ViewTransform, dx: number, dy: number): ViewTransform {
  return { x: view.x + dx, y: view.y + dy, scale: view.scale }
}

/**
 * Multiplica el zoom por `factor` manteniendo fijo el punto del mundo que hay
 * bajo `screenPoint` (normalmente el cursor).
 */
export function zoomAt(
  view: ViewTransform,
  screenPoint: Point,
  factor: number,
  limits: CameraLimits = DEFAULT_CAMERA_LIMITS,
): ViewTransform {
  const scale = clamp(view.scale * factor, limits.minScale, limits.maxScale)
  if (scale === view.scale) return view

  const anchor = screenToWorld(screenPoint, view)
  return {
    x: screenPoint.x - anchor.x * scale,
    y: screenPoint.y - anchor.y * scale,
    scale,
  }
}

/**
 * Impide perder el mapa de vista. Por cada eje: si el mapa (más el margen) cabe
 * en pantalla, se centra; si no, se limita el desplazamiento al margen permitido.
 */
export function clampView(
  view: ViewTransform,
  grid: GridSize,
  screen: Size,
  limits: CameraLimits = DEFAULT_CAMERA_LIMITS,
): ViewTransform {
  const world = gridWorldSize(grid)
  return {
    x: clampAxis(view.x, world.width * view.scale, screen.width, limits.overscroll),
    y: clampAxis(view.y, world.height * view.scale, screen.height, limits.overscroll),
    scale: view.scale,
  }
}

/** Convierte el `deltaY` de un evento wheel en un factor de zoom (>1 acerca). */
export function wheelToZoomFactor(deltaY: number): number {
  return Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY)
}

/** Opacidad mínima de la rejilla: nunca desaparece, como en Prison Architect. */
export const GRID_MIN_ALPHA = 0.45

/**
 * Opacidad de la capa de rejilla según el zoom: al alejarse se atenúa (sin
 * llegar a desaparecer) para no convertir el mapa en ruido.
 * GRID_MIN_ALPHA a escala ≤ 0.1 y 1 a escala ≥ 0.5.
 */
export function gridLineAlpha(scale: number): number {
  const t = clamp((scale - 0.1) / 0.4, 0, 1)
  return GRID_MIN_ALPHA + (1 - GRID_MIN_ALPHA) * t
}

function clampAxis(
  offset: number,
  mapSize: number,
  screenSize: number,
  overscroll: number,
): number {
  if (mapSize + overscroll * 2 <= screenSize) return (screenSize - mapSize) / 2

  const min = screenSize - mapSize - overscroll
  const max = overscroll
  return clamp(offset, min, max)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
