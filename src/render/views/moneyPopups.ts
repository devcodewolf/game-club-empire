/**
 * Textos flotantes de dinero ("+120 €", "−80 €") sobre la zona que generó cada
 * movimiento. Si llega otro para la misma zona mientras el texto sigue visible,
 * se suma al mismo y se reinicia la animación (no se apilan). Tamaño constante
 * en pantalla: se escala con 1/zoom. Solo lee eventos de la simulación.
 */
import { gsap } from 'gsap'
import { Container, Text } from 'pixi.js'
import type { Game } from '@/sim/game'
import type { TileRect } from '@/sim/geometry'
import { TILE_SIZE } from '../core/grid'
import { palette } from '../palette'
import { prefersReducedMotion } from './effects'

export interface MoneyPopups {
  setZoom(scale: number): void
  destroy(): void
}

interface Popup {
  readonly text: Text
  amount: number
  tween: gsap.core.Timeline | null
}

const DURATION = 1.2
/** Subida en px de PANTALLA. */
const RISE_PX = 28

export function formatMoney(amount: number): string {
  const body = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(Math.abs(amount))
  return `${amount < 0 ? '−' : '+'}${body} €`
}

export function createMoneyPopups(layer: Container, game: Game): MoneyPopups {
  const popups = new Map<string, Popup>()
  let zoom = 1

  const place = (text: Text, baseX: number, baseY: number): void => {
    text.scale.set(1 / zoom)
    text.position.set(baseX, baseY)
  }

  const show = (key: string, rect: TileRect, amount: number): void => {
    let popup = popups.get(key)
    if (!popup) {
      const text = new Text({
        text: '',
        style: {
          fontSize: 18,
          fill: palette.chalk,
          stroke: { color: palette.outline, width: 5 },
          fontFamily: 'Trebuchet MS, sans-serif',
          fontWeight: 'bold',
        },
        resolution: 2,
      })
      text.anchor.set(0.5, 1)
      layer.addChild(text)
      popup = { text, amount: 0, tween: null }
      popups.set(key, popup)
    }
    popup.amount += amount
    popup.tween?.kill()
    const { text } = popup
    text.text = formatMoney(popup.amount)
    text.style.fill = popup.amount < 0 ? palette.previewInvalid : palette.previewValid
    const x = (rect.x + rect.width / 2) * TILE_SIZE
    const y = rect.y * TILE_SIZE
    place(text, x, y)
    text.alpha = 1
    const current = popup
    const done = (): void => {
      popups.delete(key)
      text.destroy()
    }
    if (prefersReducedMotion()) {
      text.alpha = 0
      current.tween = gsap
        .timeline({ onComplete: done })
        .fromTo(text, { alpha: 0 }, { alpha: 1, duration: 0.15 })
        .to(text, { alpha: 0, duration: 0.5, delay: 0.6 })
      return
    }
    current.tween = gsap
      .timeline({ onComplete: done })
      .to(text.position, { y: y - RISE_PX / zoom, duration: DURATION, ease: 'power1.out' }, 0)
      .to(text, { alpha: 0, duration: DURATION * 0.4, ease: 'power1.in' }, DURATION * 0.6)
  }

  const unsubscribe = game.subscribe((event) => {
    if (event.type !== 'transaction') return
    const { rect, amount } = event.entry
    if (!rect || amount === 0) return
    show(`${rect.x},${rect.y},${rect.width},${rect.height}`, rect, amount)
  })

  return {
    setZoom(scale) {
      zoom = scale
      for (const { text } of popups.values()) text.scale.set(1 / zoom)
    },
    destroy() {
      unsubscribe()
      for (const popup of popups.values()) {
        popup.tween?.kill()
        popup.text.destroy()
      }
      popups.clear()
    },
  }
}
