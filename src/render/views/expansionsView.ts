/**
 * Dibujo de las zonas de ampliación bloqueadas: franja discontinua fuera del
 * mapa y un candado con rótulo. De momento solo comunican "esto llegará".
 *
 * La franja está en coordenadas de mundo (es una zona real); el candado se
 * dibuja en px de PANTALLA y se escala con 1/zoom para que se lea igual de
 * cerca que de lejos.
 */
import { Container, Graphics, Text } from 'pixi.js'
import { EXPANSION_SIDES } from '@/content/map'
import type { GridSize } from '@/sim/geometry'
import { expansionZone, padlockTile } from './expansions'
import { tileCenterToWorld, TILE_SIZE } from '../core/grid'
import { palette } from '../palette'

/** Medidas del candado en px de pantalla. */
const BADGE_RADIUS = 20
const BADGE_SHADOW = 3
/** Trazo discontinuo de la franja, en px de mundo. */
const DASH = 24

export interface ExpansionsView {
  setZoom(scale: number): void
}

export function createExpansionsView(layer: Container, grid: GridSize): ExpansionsView {
  const root = new Container({ label: 'expansions' })
  const badges: Container[] = []

  for (const side of EXPANSION_SIDES) {
    const zone = expansionZone(side, grid)
    const x = zone.x * TILE_SIZE
    const y = zone.y * TILE_SIZE
    const w = zone.width * TILE_SIZE
    const h = zone.height * TILE_SIZE

    const band = new Graphics().rect(x, y, w, h).fill({ color: palette.lockedVeil, alpha: 0.25 })
    dashedRect(band, x, y, w, h)
    root.addChild(band)

    const badge = createPadlockBadge()
    const center = tileCenterToWorld(padlockTile(side, grid))
    badge.position.set(center.x, center.y)
    root.addChild(badge)
    badges.push(badge)
  }

  layer.addChild(root)

  return {
    setZoom(scale) {
      for (const badge of badges) badge.scale.set(1 / scale)
    },
  }
}

/** Candado con rótulo, centrado en (0,0) y medido en px de pantalla. */
function createPadlockBadge(): Container {
  const badge = new Container({ label: 'padlock' })

  badge.addChild(
    new Graphics()
      .circle(BADGE_SHADOW, BADGE_SHADOW, BADGE_RADIUS)
      .fill({ color: palette.outline, alpha: 0.5 })
      .circle(0, 0, BADGE_RADIUS)
      .fill(palette.slate)
      .stroke({ color: palette.chalk, width: 2 }),
  )

  const icon = new Text({ text: '🔒', style: { fontSize: 20 }, resolution: 2 })
  icon.anchor.set(0.5)
  badge.addChild(icon)

  const label = new Text({
    text: 'Ampliación',
    style: {
      fontSize: 12,
      fill: palette.chalk,
      stroke: { color: palette.outline, width: 3 },
      fontFamily: 'Trebuchet MS, sans-serif',
      fontWeight: 'bold',
    },
    resolution: 2,
  })
  label.anchor.set(0.5, 0)
  label.position.set(0, BADGE_RADIUS + 4)
  badge.addChild(label)

  return badge
}

/** Contorno discontinuo de un rectángulo (Pixi no trae trazo discontinuo). */
function dashedRect(g: Graphics, x: number, y: number, w: number, h: number): void {
  const edges: Array<[number, number, number, number]> = [
    [x, y, x + w, y],
    [x + w, y, x + w, y + h],
    [x + w, y + h, x, y + h],
    [x, y + h, x, y],
  ]
  for (const [x1, y1, x2, y2] of edges) {
    const length = Math.hypot(x2 - x1, y2 - y1)
    for (let d = 0; d < length; d += DASH * 2) {
      const t1 = d / length
      const t2 = Math.min((d + DASH) / length, 1)
      g.moveTo(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1).lineTo(
        x1 + (x2 - x1) * t2,
        y1 + (y2 - y1) * t2,
      )
    }
  }
  g.stroke({ color: palette.chalk, width: 4, alpha: 0.5 })
}
