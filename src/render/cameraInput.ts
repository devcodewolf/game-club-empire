/**
 * Conecta ratón y trackpad con la cámara:
 *  - arrastrar: mover el mapa
 *  - rueda: zoom hacia el cursor
 *
 * Se usan eventos DOM sobre el canvas (no eventos de Pixi) porque la cámara es
 * una entrada global, no pertenece a ningún objeto del mapa.
 * Nota: en la Fase 1 el botón izquierdo quedará reservado para construir.
 */
import { wheelToZoomFactor } from './camera'
import type { CameraController } from './cameraController'

/** Engancha los eventos y devuelve la función que los desengancha. */
export function bindCameraInput(canvas: HTMLCanvasElement, camera: CameraController): () => void {
  let dragPointerId: number | null = null
  let last = { x: 0, y: 0 }

  const onPointerDown = (event: PointerEvent): void => {
    if (dragPointerId !== null) return

    dragPointerId = event.pointerId
    last = { x: event.clientX, y: event.clientY }
    canvas.setPointerCapture(event.pointerId)
    canvas.style.cursor = 'grabbing'
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== dragPointerId) return

    camera.pan(event.clientX - last.x, event.clientY - last.y)
    last = { x: event.clientX, y: event.clientY }
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== dragPointerId) return

    dragPointerId = null
    canvas.releasePointerCapture(event.pointerId)
    canvas.style.cursor = 'grab'
  }

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault() // evita que la página haga scroll o zoom
    const rect = canvas.getBoundingClientRect()
    const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    camera.zoomAt(cursor, wheelToZoomFactor(event.deltaY))
  }

  const onContextMenu = (event: MouseEvent): void => event.preventDefault()

  canvas.style.cursor = 'grab'
  canvas.style.touchAction = 'none' // el navegador no debe interpretar gestos táctiles
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('contextmenu', onContextMenu)

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('contextmenu', onContextMenu)
  }
}
