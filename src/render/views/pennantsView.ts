/**
 * Banderines con los colores del club colgados de las farolas de la entrada.
 * Crecen con la afición por tramos (`PENNANT_FANS`): primero en las farolas
 * más cercanas a la carretera y, en el último tramo, uno a cada lado de cada
 * farola. Se mecen con una oscilación suave (sin ella con reduced-motion).
 */
import { Container, Graphics } from 'pixi.js'
import gsap from 'gsap'
import type { Game } from '@/sim/game'
import type { TileCoord } from '@/sim/geometry'
import { DEFAULT_CLUB_COLORS, type ClubColors } from '../core/clubColors'
import { shade } from '../core/color'
import { TILE_SIZE } from '../core/grid'
import { palette } from '../palette'
import { OUTLINE, SHADOW_ALPHA, SHADOW_OFFSET } from '../style'

/** Tramo de afición alcanzado: 0 sin ninguno, hasta `thresholds.length`. */
export function pennantTier(fans: number, thresholds: readonly number[]): number {
  return thresholds.filter((min) => fans >= min).length
}

/**
 * Banderines por farola (0, 1 o 2), en el orden de `lamps` (las primeras, las
 * más cercanas a la carretera). Cada tramo hasta el penúltimo llena una parte
 * igual de las farolas con uno; el último pone el segundo en todas.
 */
export function pennantLayout(tier: number, tiers: number, lampCount: number): number[] {
  if (tier <= 0 || tiers <= 0) return new Array<number>(lampCount).fill(0)
  if (tier >= tiers) return new Array<number>(lampCount).fill(2)
  const lit = Math.round((lampCount * tier) / (tiers - 1))
  return Array.from({ length: lampCount }, (_, i) => (i < lit ? 1 : 0))
}

/** Banderín colgando a un lado del poste (side = 1 derecha, −1 izquierda). */
function paintPennant(g: Graphics, side: 1 | -1, colors: ClubColors): void {
  const w = 18
  const h = 34
  const x = side === 1 ? 0 : -w
  /** Silueta con la punta en cola de golondrina abajo. */
  const shape = (dx: number, dy: number): void => {
    g.poly([
      x + dx,
      dy,
      x + w + dx,
      dy,
      x + w + dx,
      h + dy,
      x + w / 2 + dx,
      h - 6 + dy,
      x + dx,
      h + dy,
    ])
  }
  shape(SHADOW_OFFSET, SHADOW_OFFSET)
  g.fill({ color: palette.outline, alpha: SHADOW_ALPHA })
  shape(0, 0)
  g.fill(colors.primary).stroke({ color: palette.outline, width: OUTLINE })
  // Franja central con el color secundario
  g.rect(x + w / 2 - 2.5, 1, 5, h - 10).fill(colors.secondary)
  // Brazo del que cuelga
  g.moveTo(0, 0)
    .lineTo(x + (side === 1 ? w : 0), 0)
    .stroke({ color: shade(palette.stoneDark, -0.2), width: 2.5 })
}

export interface PennantsView {
  destroy(): void
}

export function createPennantsView(
  layer: Container,
  game: Game,
  lamps: readonly TileCoord[],
  thresholds: readonly number[],
  colors: ClubColors = DEFAULT_CLUB_COLORS,
): PennantsView {
  const root = new Container({ label: 'pennants' })
  layer.addChild(root)
  // Las más cercanas a la carretera (más a la derecha) primero
  const ordered = [...lamps].sort((a, b) => b.x - a.x || a.y - b.y)
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  let flags: Container[] = []
  let tier = -1

  const draw = (): void => {
    const next = pennantTier(game.state.club.fans, thresholds)
    if (next === tier) return
    tier = next
    root.removeChildren().forEach((child) => child.destroy({ children: true }))
    flags = []
    const layout = pennantLayout(tier, thresholds.length, ordered.length)
    ordered.forEach((tile, i) => {
      const count = layout[i] ?? 0
      const sides: (1 | -1)[] = count === 2 ? [1, -1] : count === 1 ? [1] : []
      for (const side of sides) {
        const flag = new Container()
        const g = new Graphics()
        paintPennant(g, side, colors)
        flag.addChild(g)
        // Cuelga de lo alto de la farola (ver `paintStreetLamp`)
        flag.position.set(
          tile.x * TILE_SIZE + TILE_SIZE / 2 + side * 7,
          tile.y * TILE_SIZE + TILE_SIZE / 2 - 14,
        )
        root.addChild(flag)
        flags.push(flag)
      }
    })
  }

  // Vaivén suave: cada banderín con su desfase
  let time = 0
  const sway = (): void => {
    time += gsap.ticker.deltaRatio() / 60
    flags.forEach((flag, i) => {
      flag.skew.x = Math.sin(time * 1.6 + i * 1.3) * 0.12
      flag.scale.y = 1 - (Math.sin(time * 2.1 + i) + 1) * 0.03
    })
  }
  if (!reduced) gsap.ticker.add(sway)

  draw()
  const unsubscribe = game.subscribe((event) => {
    if (event.type === 'clubChanged') draw()
  })

  return {
    destroy() {
      unsubscribe()
      gsap.ticker.remove(sway)
      root.destroy({ children: true })
    },
  }
}
