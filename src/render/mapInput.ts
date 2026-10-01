/**
 * Entrada de ratón y trackpad sobre el mapa:
 *  - rueda: zoom hacia el cursor
 *  - arrastrar con botón derecho o central: mover la cámara
 *  - arrastrar con el izquierdo: mover la cámara solo si no hay herramienta
 *  - clic izquierdo: usar la herramienta en la casilla
 *  - clic derecho (sin arrastrar): soltar la herramienta
 *
 * Se usan eventos DOM sobre el canvas (no eventos de Pixi) porque es una
 * entrada global del mapa, no de un objeto concreto. Este módulo traduce
 * gestos a intenciones; no sabe qué hace cada herramienta.
 */
import type { TileCoord } from '@/sim/geometry'
import { wheelToZoomFactor } from './camera'
import type { CameraController } from './cameraController'
import { screenToTile, type Point } from './grid'

/** Distancia (px) que separa un clic de un arrastre. */
const CLICK_TOLERANCE = 5

const BUTTON_LEFT = 0
const BUTTON_RIGHT = 2

export interface MapInputHandlers {
  /** ¿Hay una herramienta activa? Si no, el botón izquierdo también arrastra. */
  readonly hasTool: () => boolean
  /** Casilla bajo el cursor, o null cuando sale del canvas. */
  readonly onHover: (tile: TileCoord | null) => void
  readonly onPrimaryClick: (tile: TileCoord) => void
  readonly onCancel: () => void
}

interface PointerGesture {
  readonly pointerId: number
  readonly button: number
  readonly start: Point
  last: Point
  dragging: boolean
}

/** Engancha los eventos y devuelve la función que los desengancha. */
export function bindMapInput(
  canvas: HTMLCanvasElement,
  camera: CameraController,
  handlers: MapInputHandlers,
): () => void {
  let gesture: PointerGesture | null = null

  const toScreen = (event: MouseEvent): Point => {
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }
  const canPan = (button: number): boolean => button !== BUTTON_LEFT || !handlers.hasTool()

  const onPointerDown = (event: PointerEvent): void => {
    if (gesture) return

    const point = toScreen(event)
    gesture = {
      pointerId: event.pointerId,
      button: event.button,
      start: point,
      last: point,
      dragging: false,
    }
    canvas.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent): void => {
    const point = toScreen(event)
    handlers.onHover(screenToTile(point, camera.view))

    if (!gesture || event.pointerId !== gesture.pointerId) return

    const moved = Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y)
    if (!gesture.dragging && moved > CLICK_TOLERANCE && canPan(gesture.button)) {
      gesture.dragging = true
      canvas.style.cursor = 'grabbing'
    }
    if (gesture.dragging) camera.pan(point.x - gesture.last.x, point.y - gesture.last.y)
    gesture.last = point
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (!gesture || event.pointerId !== gesture.pointerId) return

    const { button, dragging } = gesture
    gesture = null
    canvas.releasePointerCapture(event.pointerId)
    canvas.style.cursor = ''
    if (dragging) return

    if (button === BUTTON_LEFT) handlers.onPrimaryClick(screenToTile(toScreen(event), camera.view))
    if (button === BUTTON_RIGHT) handlers.onCancel()
  }

  const onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== gesture?.pointerId) return
    gesture = null
    canvas.style.cursor = ''
  }

  const onPointerLeave = (): void => {
    if (!gesture) handlers.onHover(null)
  }

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault() // evita que la página haga scroll o zoom
    camera.zoomAt(toScreen(event), wheelToZoomFactor(event.deltaY))
  }

  const onContextMenu = (event: MouseEvent): void => event.preventDefault()

  canvas.style.touchAction = 'none' // el navegador no debe interpretar gestos táctiles
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerCancel)
  canvas.addEventListener('pointerleave', onPointerLeave)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('contextmenu', onContextMenu)

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerCancel)
    canvas.removeEventListener('pointerleave', onPointerLeave)
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('contextmenu', onContextMenu)
  }
}
