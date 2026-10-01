/**
 * Entrada de ratón y trackpad sobre el mapa:
 *  - rueda: zoom hacia el cursor
 *  - arrastrar con botón derecho o central: mover la cámara
 *  - botón izquierdo sin herramienta: arrastrar mueve la cámara
 *  - botón izquierdo con herramienta de arrastre (suelos…): pulsar, arrastrar y soltar
 *  - botón izquierdo con otra herramienta: clic para usarla
 *  - clic derecho (sin arrastrar): soltar la herramienta o cancelar el arrastre
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
/** Bit del botón derecho en `PointerEvent.buttons` (distinto de `button`). */
const BUTTONS_RIGHT_MASK = 2

export interface MapInputHandlers {
  /** ¿Hay una herramienta activa? Si no, el botón izquierdo también mueve la cámara. */
  readonly hasTool: () => boolean
  /** ¿La herramienta activa se usa arrastrando un rectángulo? */
  readonly isDragTool: () => boolean
  /** Casilla bajo el cursor, o null cuando sale del canvas. */
  readonly onHover: (tile: TileCoord | null) => void
  readonly onPrimaryClick: (tile: TileCoord) => void
  readonly onDragStart: (tile: TileCoord) => void
  readonly onDragMove: (tile: TileCoord) => void
  readonly onDragEnd: (tile: TileCoord) => void
  /** Clic derecho sin arrastrar: soltar herramienta o cancelar el arrastre en curso. */
  readonly onCancel: () => void
}

/** Qué está haciendo el gesto en curso ('cancelled': ignorar hasta soltar). */
type GestureMode = 'pending' | 'pan' | 'paint' | 'cancelled'

interface PointerGesture {
  readonly pointerId: number
  readonly button: number
  readonly start: Point
  last: Point
  mode: GestureMode
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
  const toTile = (point: Point): TileCoord => screenToTile(point, camera.view)
  const canPan = (button: number): boolean => button !== BUTTON_LEFT || !handlers.hasTool()

  const endGesture = (event: PointerEvent): void => {
    gesture = null
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    canvas.style.cursor = ''
  }

  const onPointerDown = (event: PointerEvent): void => {
    // Clic derecho durante un arrastre de pintura: lo cancela.
    if (gesture?.mode === 'paint' && event.button === BUTTON_RIGHT) {
      gesture.mode = 'cancelled'
      handlers.onCancel()
      return
    }
    if (gesture) return

    const point = toScreen(event)
    const paints = event.button === BUTTON_LEFT && handlers.isDragTool()
    gesture = {
      pointerId: event.pointerId,
      button: event.button,
      start: point,
      last: point,
      mode: paints ? 'paint' : 'pending',
    }
    canvas.setPointerCapture(event.pointerId)
    if (paints) handlers.onDragStart(toTile(point))
  }

  const onPointerMove = (event: PointerEvent): void => {
    const point = toScreen(event)
    const tile = toTile(point)
    handlers.onHover(tile)

    if (!gesture || event.pointerId !== gesture.pointerId) return
    if (gesture.mode === 'cancelled') return

    if (gesture.mode === 'paint') {
      // Con el ratón, pulsar el botón derecho mientras se arrastra con el izquierdo
      // no genera un pointerdown nuevo: llega como pointermove con `buttons` cambiado.
      if (event.buttons & BUTTONS_RIGHT_MASK) {
        gesture.mode = 'cancelled'
        handlers.onCancel()
        return
      }
      handlers.onDragMove(tile)
      return
    }

    const moved = Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y)
    if (gesture.mode === 'pending' && moved > CLICK_TOLERANCE && canPan(gesture.button)) {
      gesture.mode = 'pan'
      canvas.style.cursor = 'grabbing'
    }
    if (gesture.mode === 'pan') camera.pan(point.x - gesture.last.x, point.y - gesture.last.y)
    gesture.last = point
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (!gesture || event.pointerId !== gesture.pointerId) return

    const { button, mode } = gesture
    const tile = toTile(toScreen(event))
    endGesture(event)

    if (mode === 'paint') return handlers.onDragEnd(tile)
    if (mode === 'pan' || mode === 'cancelled') return
    if (button === BUTTON_LEFT) handlers.onPrimaryClick(tile)
    if (button === BUTTON_RIGHT) handlers.onCancel()
  }

  const onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== gesture?.pointerId) return
    if (gesture.mode === 'paint') handlers.onCancel()
    endGesture(event)
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
