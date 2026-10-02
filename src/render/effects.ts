/**
 * Efectos de obra con GSAP: andamio, aparición con rebote, polvo y derribo.
 * "Nada aparece de golpe" (CLAUDE.md): construir = andamio → objeto que
 * rebota + nube de polvo; demoler = polvo y desvanecido.
 *
 * Con `prefers-reduced-motion` no hay animación: se muestra el resultado final.
 * Cada efecto limpia sus propios objetos de Pixi al terminar.
 */
import { gsap } from 'gsap'
import { Container, Graphics } from 'pixi.js'
import { shade } from './color'
import { palette } from './palette'

/** Rectángulo en px de mundo. */
export interface PxRect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

const DUST = 0xd8cdb8

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Nube de polvo: bolitas que salen del contorno del rectángulo, crecen y se desvanecen. */
export function dustPuff(layer: Container, rect: PxRect, amount = 1): void {
  if (prefersReducedMotion()) return

  const perimeter = 2 * (rect.w + rect.h)
  const count = Math.round(Math.min(40, Math.max(8, perimeter / 40)) * amount)
  for (let i = 0; i < count; i++) {
    // Punto al azar sobre el contorno y dirección hacia fuera
    let d = Math.random() * perimeter
    let x: number
    let y: number
    let nx = 0
    let ny = 0
    if (d < rect.w) [x, y, ny] = [rect.x + d, rect.y, -1]
    else if ((d -= rect.w) < rect.h) [x, y, nx] = [rect.x + rect.w, rect.y + d, 1]
    else if ((d -= rect.h) < rect.w) [x, y, ny] = [rect.x + rect.w - d, rect.y + rect.h, 1]
    else [x, y, nx] = [rect.x, rect.y + rect.h - (d - rect.w), -1]

    const radius = 6 + Math.random() * 8
    const puff = new Graphics()
      .circle(0, 0, radius)
      .fill({ color: DUST, alpha: 0.85 })
      .circle(-radius * 0.3, -radius * 0.3, radius * 0.45)
      .fill({ color: shade(DUST, 0.15), alpha: 0.9 })
    puff.position.set(x, y)
    puff.scale.set(0.4)
    layer.addChild(puff)

    const spread = 18 + Math.random() * 26
    gsap
      .timeline({ onComplete: () => puff.destroy() })
      .to(puff, {
        x: x + nx * spread + (Math.random() - 0.5) * 14,
        y: y + ny * spread + (Math.random() - 0.5) * 14 - 6,
        duration: 0.7 + Math.random() * 0.3,
        ease: 'power2.out',
      })
      .to(puff.scale, { x: 1.4, y: 1.4, duration: 0.8, ease: 'power1.out' }, 0)
      .to(puff, { alpha: 0, duration: 0.5, ease: 'power1.in' }, 0.35)
  }
}

/** Andamio sobre la huella: postes, travesaños en diagonal y lona translúcida. */
function createScaffold(rect: PxRect): Graphics {
  const g = new Graphics()
  const pole = palette.wood
  const step = 32
  g.rect(rect.x, rect.y, rect.w, rect.h).fill({ color: palette.chalk, alpha: 0.18 })
  for (let x = rect.x; x <= rect.x + rect.w + 0.5; x += step) {
    g.moveTo(x, rect.y).lineTo(x, rect.y + rect.h)
  }
  for (let y = rect.y; y <= rect.y + rect.h + 0.5; y += step) {
    g.moveTo(rect.x, y).lineTo(rect.x + rect.w, y)
  }
  g.stroke({ color: pole, width: 3 })
  // Riostras en diagonal por cada módulo
  for (let x = rect.x; x < rect.x + rect.w - 1; x += step) {
    for (let y = rect.y; y < rect.y + rect.h - 1; y += step) {
      g.moveTo(x, y).lineTo(
        Math.min(x + step, rect.x + rect.w),
        Math.min(y + step, rect.y + rect.h),
      )
    }
  }
  g.stroke({ color: shade(pole, -0.2), width: 1.5 })
  g.rect(rect.x, rect.y, rect.w, rect.h).stroke({ color: palette.outline, width: 2 })
  return g
}

/**
 * Animación de construcción de un marcador ya colocado en su sitio:
 * andamio unos instantes → el objeto aparece con rebote → polvo.
 * El marcador debe tener el pivote en su centro (escala desde el centro).
 */
export function playBuild(marker: Container, rect: PxRect, effects: Container): void {
  if (prefersReducedMotion()) return

  const scaffold = createScaffold(rect)
  effects.addChild(scaffold)
  marker.alpha = 0
  marker.scale.set(0.82)

  gsap
    .timeline({ onComplete: () => scaffold.destroy() })
    .from(scaffold, { alpha: 0, duration: 0.15 })
    .to(scaffold, { alpha: 0, duration: 0.2 }, 0.45)
    .to(marker, { alpha: 1, duration: 0.15 }, 0.45)
    .to(marker.scale, { x: 1, y: 1, duration: 0.45, ease: 'back.out(3)' }, 0.45)
    .call(() => dustPuff(effects, rect, 0.8), [], 0.5)
}

/** Derribo: polvo, el marcador se hunde un poco y se desvanece; luego se destruye. */
export function playDemolish(
  marker: Container,
  rect: PxRect,
  effects: Container,
  onDone: () => void,
): void {
  if (prefersReducedMotion()) return onDone()

  dustPuff(effects, rect, 1)
  gsap
    .timeline({ onComplete: onDone })
    .to(marker.scale, { x: 0.9, y: 0.9, duration: 0.35, ease: 'power2.in' }, 0)
    .to(marker, { alpha: 0, duration: 0.35, ease: 'power1.in' }, 0)
}

/** Detiene las animaciones en curso de un marcador (antes de destruirlo). */
export function stopEffects(marker: Container): void {
  gsap.killTweensOf(marker)
  gsap.killTweensOf(marker.scale)
}
