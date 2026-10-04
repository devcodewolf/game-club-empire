/**
 * Estado de la cámara: guarda la vista actual, aplica los límites tras cada
 * cambio y avisa con `onChange` para que el render la aplique.
 */
import type { GridSize } from '@/sim/geometry'
import {
  centerOn,
  clampView,
  DEFAULT_CAMERA_LIMITS,
  panBy,
  zoomAt,
  type CameraLimits,
} from './camera'
import { gridWorldSize, screenToWorld, type Point, type Size, type ViewTransform } from '../core/grid'

export interface CameraController {
  readonly view: ViewTransform
  pan(dx: number, dy: number): void
  zoomAt(screenPoint: Point, factor: number): void
  /** Ajusta la cámara a un nuevo tamaño de pantalla conservando el punto central. */
  resize(screen: Size): void
}

export interface CameraControllerOptions {
  readonly grid: GridSize
  readonly screen: Size
  readonly onChange: (view: ViewTransform) => void
  readonly limits?: CameraLimits
  /** Escala inicial; por defecto 1 (casillas a 64 px reales). */
  readonly initialScale?: number
  /** Punto de mundo que se ve en el centro al empezar; por defecto, el centro del mapa. */
  readonly initialFocus?: Point
}

export function createCameraController({
  grid,
  screen: initialScreen,
  onChange,
  limits = DEFAULT_CAMERA_LIMITS,
  initialScale = 1,
  initialFocus,
}: CameraControllerOptions): CameraController {
  let screen = initialScreen
  const world = gridWorldSize(grid)
  const focus = initialFocus ?? { x: world.width / 2, y: world.height / 2 }
  let view = centerOn(focus, initialScale, screen)

  const commit = (next: ViewTransform): void => {
    view = clampView(next, grid, screen, limits)
    onChange(view)
  }

  commit(view)

  return {
    get view() {
      return view
    },
    pan(dx, dy) {
      commit(panBy(view, dx, dy))
    },
    zoomAt(screenPoint, factor) {
      commit(zoomAt(view, screenPoint, factor, limits))
    },
    resize(nextScreen) {
      const center = screenToWorld({ x: screen.width / 2, y: screen.height / 2 }, view)
      screen = nextScreen
      commit(centerOn(center, view.scale, screen))
    },
  }
}
