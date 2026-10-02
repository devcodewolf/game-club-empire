/**
 * Movimiento suave de la cámara con GSAP, encima del CameraController:
 *  - inercia: al soltar un arrastre, la cámara sigue deslizándose y frena;
 *  - zoom suave: cada golpe de rueda cambia el zoom OBJETIVO y la cámara lo
 *    alcanza con una transición corta, sin perder el punto bajo el cursor;
 *  - teclado: WASD/flechas para desplazarse, Q/E para alejar/acercar
 *    (como Prison Architect).
 *
 * Con `prefers-reduced-motion` no hay inercia y el zoom es instantáneo.
 */
import { gsap } from 'gsap'
import type { CameraLimits } from './camera'
import { DEFAULT_CAMERA_LIMITS } from './camera'
import type { CameraController } from './cameraController'
import { prefersReducedMotion } from './effects'
import type { Point, Size } from './grid'

/** Velocidad de desplazamiento con teclado, en px de pantalla por segundo. */
const KEY_PAN_SPEED = 900
/** Factor de zoom por pulsación de Q/E. */
const KEY_ZOOM_STEP = 1.25
const INERTIA_DURATION = 0.7
const ZOOM_DURATION = 0.25

export interface CameraMotion {
  /** Lanza la inercia con la velocidad del arrastre (px de pantalla por segundo). */
  fling(vx: number, vy: number): void
  /** Para cualquier inercia en curso (p. ej. al empezar otro arrastre). */
  stop(): void
  /** Zoom suave hacia `factor` × el zoom objetivo actual, anclado en `point`. */
  zoomBy(point: Point, factor: number): void
  destroy(): void
}

export function createCameraMotion(
  camera: CameraController,
  screen: () => Size,
  limits: CameraLimits = DEFAULT_CAMERA_LIMITS,
): CameraMotion {
  let inertia: gsap.core.Tween | null = null
  let zoomTween: gsap.core.Tween | null = null
  let targetScale = camera.view.scale

  const stop = (): void => {
    inertia?.kill()
    inertia = null
  }

  const fling = (vx: number, vy: number): void => {
    stop()
    if (prefersReducedMotion() || Math.hypot(vx, vy) < 60) return

    // La velocidad decae hasta 0; en cada fotograma se desplaza v·dt.
    const velocity = { vx, vy }
    let last = performance.now()
    inertia = gsap.to(velocity, {
      vx: 0,
      vy: 0,
      duration: INERTIA_DURATION,
      ease: 'power2.out',
      onUpdate: () => {
        const now = performance.now()
        const dt = (now - last) / 1000
        last = now
        camera.pan(velocity.vx * dt, velocity.vy * dt)
      },
    })
  }

  const zoomBy = (point: Point, factor: number): void => {
    // El objetivo se acumula entre golpes de rueda seguidos
    const base = zoomTween?.isActive() ? targetScale : camera.view.scale
    targetScale = Math.min(limits.maxScale, Math.max(limits.minScale, base * factor))

    if (prefersReducedMotion()) {
      camera.zoomAt(point, targetScale / camera.view.scale)
      return
    }
    zoomTween?.kill()
    const proxy = { scale: camera.view.scale }
    zoomTween = gsap.to(proxy, {
      scale: targetScale,
      duration: ZOOM_DURATION,
      ease: 'power2.out',
      onUpdate: () => camera.zoomAt(point, proxy.scale / camera.view.scale),
    })
  }

  // ── Teclado ──
  const held = new Set<string>()
  const panKeys: Record<string, readonly [number, number]> = {
    w: [0, 1],
    arrowup: [0, 1],
    s: [0, -1],
    arrowdown: [0, -1],
    a: [1, 0],
    arrowleft: [1, 0],
    d: [-1, 0],
    arrowright: [-1, 0],
  }

  const isTyping = (target: EventTarget | null): boolean =>
    target instanceof HTMLElement &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable)

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return
    const key = event.key.toLowerCase()
    const center = { x: screen().width / 2, y: screen().height / 2 }
    if (key === 'q') return zoomBy(center, 1 / KEY_ZOOM_STEP)
    if (key === 'e') return zoomBy(center, KEY_ZOOM_STEP)
    if (panKeys[key]) {
      held.add(key)
      stop()
      event.preventDefault()
    }
  }
  const onKeyUp = (event: KeyboardEvent): void => {
    held.delete(event.key.toLowerCase())
  }
  const onBlur = (): void => held.clear()

  // Desplazamiento continuo mientras se mantienen las teclas
  const tick = (_time: number, deltaMs: number): void => {
    if (held.size === 0) return
    let dx = 0
    let dy = 0
    for (const key of held) {
      const dir = panKeys[key]
      if (dir) [dx, dy] = [dx + dir[0], dy + dir[1]]
    }
    const length = Math.hypot(dx, dy) || 1
    const step = (KEY_PAN_SPEED * deltaMs) / 1000
    camera.pan((dx / length) * step, (dy / length) * step)
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  gsap.ticker.add(tick)

  return {
    fling,
    stop,
    zoomBy,
    destroy() {
      stop()
      zoomTween?.kill()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      gsap.ticker.remove(tick)
    },
  }
}
