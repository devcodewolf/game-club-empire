/**
 * Texturas de suelo generadas por código, al estilo de Prison Architect:
 * colores planos con segundo y tercer tono, juntas, tablas desalineadas,
 * piedras sueltas… (ver `docs/GUIA-ESTILO.md`).
 *
 * Cada textura cubre PATTERN×PATTERN px (2×2 casillas), así casillas vecinas
 * no son idénticas. Todo lo que toca un borde se dibuja también en el borde
 * opuesto para que al repetirse no se vean costuras. Se usan con FillPattern
 * en espacio global, de modo que el dibujo queda alineado con la rejilla.
 */
import type { FillPattern, Graphics, Renderer, Texture } from 'pixi.js'
import type { FloorCatalog, FloorId, FloorPattern } from '@/sim/map/floors'
import { shade } from '../core/color'
import { TILE_SIZE } from '../core/grid'
import type { Random } from '../core/random'
import { bakePattern, drawRowPieces, PATTERN, speckles, wrapped } from '../core/textureKit'

type Painter = (g: Graphics, base: number, rnd: Random) => void

export interface FloorTextures {
  /** Patrón listo para `fill()` con la textura del suelo, o undefined si no existe. */
  pattern(floor: FloorId): FillPattern | undefined
  texture(floor: FloorId): Texture | undefined
  destroy(): void
}

export function createFloorTextures(renderer: Renderer, floors: FloorCatalog): FloorTextures {
  const textures = new Map<FloorId, Texture>()
  const patterns = new Map<FloorId, FillPattern>()

  for (const def of Object.values(floors)) {
    const baked = bakePattern(renderer, def.id, (g, rnd) =>
      PAINTERS[def.pattern](g, def.color, rnd),
    )
    textures.set(def.id, baked.texture)
    patterns.set(def.id, baked.pattern)
  }

  return {
    pattern: (floor) => patterns.get(floor),
    texture: (floor) => textures.get(floor),
    destroy() {
      for (const texture of textures.values()) texture.destroy(true)
    },
  }
}

// ── Patrones ─────────────────────────────────────────────────────

const PAINTERS: Record<FloorPattern, Painter> = {
  /** Hierba: base con manchas suaves y briznas cortas en dos tonos. */
  grass(g, base, rnd) {
    g.rect(0, 0, PATTERN, PATTERN).fill(base)
    for (let i = 0; i < 14; i++) {
      const rx = rnd.range(6, 16)
      const ry = rnd.range(4, 10)
      wrapped(rnd.range(0, PATTERN), rnd.range(0, PATTERN), rx, (x, y) =>
        g.ellipse(x, y, rx, ry).fill(shade(base, rnd.pick([-0.05, 0.04]))),
      )
    }
    for (let i = 0; i < 170; i++) {
      const length = rnd.range(2.5, 5)
      const lean = rnd.range(-1.5, 1.5)
      const color = shade(base, rnd.pick([-0.22, -0.14, 0.12]))
      wrapped(rnd.range(0, PATTERN), rnd.range(0, PATTERN), 6, (x, y) =>
        g
          .moveTo(x, y)
          .lineTo(x + lean, y - length)
          .stroke({ color, width: 1.2, cap: 'round' }),
      )
    }
  },

  /** Tierra: manchas más oscuras, piedrecitas claras y algún hoyo oscuro. */
  dirt(g, base, rnd) {
    g.rect(0, 0, PATTERN, PATTERN).fill(base)
    for (let i = 0; i < 26; i++) {
      const rx = rnd.range(4, 12)
      const ry = rx * rnd.range(0.5, 0.9)
      wrapped(rnd.range(0, PATTERN), rnd.range(0, PATTERN), rx, (x, y) =>
        g.ellipse(x, y, rx, ry).fill(shade(base, rnd.pick([-0.1, -0.06, 0.05]))),
      )
    }
    speckles(g, rnd, 45, [shade(base, 0.22), shade(base, 0.12)], [0.8, 2])
    speckles(g, rnd, 25, [shade(base, -0.3)], [0.6, 1.3])
  },

  /** Grava: cientos de piedrecitas redondeadas en tres tonos sobre fondo oscuro. */
  gravel(g, base, rnd) {
    g.rect(0, 0, PATTERN, PATTERN).fill(shade(base, -0.25))
    const tones = [base, shade(base, 0.14), shade(base, -0.08), shade(base, 0.25)]
    for (let i = 0; i < 520; i++) {
      const rx = rnd.range(1.8, 3.6)
      const ry = rx * rnd.range(0.6, 1)
      const color = rnd.pick(tones)
      wrapped(rnd.range(0, PATTERN), rnd.range(0, PATTERN), rx, (x, y) =>
        g.ellipse(x, y, rx, ry).fill(color),
      )
    }
  },

  /** Losa de piedra: filas de losas de distinto largo, desalineadas, con junta. */
  slabs(g, base, rnd) {
    const grout = shade(base, -0.35)
    const rowHeight = TILE_SIZE / 2
    g.rect(0, 0, PATTERN, PATTERN).fill(grout)
    for (let row = 0; row < PATTERN / rowHeight; row++) {
      drawRowPieces(rnd, row * rowHeight, rowHeight, [24, 48], (x, y, w, h, piece) => {
        g.rect(x + 1, y + 1, w - 2, h - 2).fill(shade(base, piece.range(-0.08, 0.08)))
        // Desgaste: alguna mota y una esquina más clara
        g.rect(x + 2, y + 2, Math.min(6, w - 4), 2).fill(shade(base, 0.16))
      })
    }
    speckles(g, rnd, 30, [shade(base, -0.18)], [0.5, 1.1])
  },

  /** Hormigón: una placa por casilla con junta, tono propio y motas finas. */
  concrete(g, base, rnd) {
    const seam = shade(base, -0.22)
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        g.rect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE).fill(
          shade(base, rnd.range(-0.04, 0.04)),
        )
        g.rect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, 1.5).fill(seam)
        g.rect(tx * TILE_SIZE, ty * TILE_SIZE, 1.5, TILE_SIZE).fill(seam)
      }
    }
    speckles(g, rnd, 90, [shade(base, -0.12), shade(base, 0.1)], [0.4, 0.9])
    // Alguna grieta fina
    for (let i = 0; i < 2; i++) {
      let x = rnd.range(8, PATTERN - 8)
      let y = rnd.range(8, PATTERN - 8)
      g.moveTo(x, y)
      for (let s = 0; s < 4; s++) {
        x += rnd.range(-5, 5)
        y += rnd.range(2, 6)
        g.lineTo(x, y)
      }
      g.stroke({ color: shade(base, -0.2), width: 0.8 })
    }
  },

  /** Madera: tablas horizontales de largo variable, desalineadas, con vetas. */
  planks(g, base, rnd) {
    const rowHeight = TILE_SIZE / 4
    const joint = shade(base, -0.4)
    g.rect(0, 0, PATTERN, PATTERN).fill(joint)
    for (let row = 0; row < PATTERN / rowHeight; row++) {
      drawRowPieces(rnd, row * rowHeight, rowHeight, [40, 88], (x, y, w, h, piece) => {
        const tone = shade(base, piece.range(-0.1, 0.08))
        g.rect(x + 0.75, y + 0.75, w - 1.5, h - 1.5).fill(tone)
        // Vetas
        for (let v = 0; v < 2; v++) {
          const vy = y + piece.range(4, h - 4)
          g.moveTo(x + 3, vy)
            .lineTo(x + w * piece.range(0.3, 0.9), vy + piece.range(-1, 1))
            .stroke({ color: shade(tone, -0.12), width: 0.8 })
        }
        // Clavos en los extremos
        g.circle(x + 3, y + h / 2, 0.9).fill(joint)
      })
    }
  },

  /** Baldosa blanca: piezas de 16 px con junta gris y leve variación. */
  tiles(g, base, rnd) {
    const size = TILE_SIZE / 4
    g.rect(0, 0, PATTERN, PATTERN).fill(shade(base, -0.2))
    for (let y = 0; y < PATTERN; y += size) {
      for (let x = 0; x < PATTERN; x += size) {
        g.rect(x + 1, y + 1, size - 2, size - 2).fill(shade(base, rnd.range(-0.03, 0.02)))
        g.rect(x + 2, y + 2, size - 6, 1.5).fill(shade(base, 0.25))
      }
    }
  },

  /** Césped artificial: franjas anchas de dos tonos y grano fino de fibras. */
  turf(g, base, rnd) {
    drawMowingStripes(g, base, 0.05)
    speckles(g, rnd, 420, [shade(base, 0.1), shade(base, -0.1)], [0.35, 0.7])
  },

  /** Césped natural: franjas de corte (cortacésped) y briznas cortas. */
  lawn(g, base, rnd) {
    drawMowingStripes(g, base, 0.07)
    for (let i = 0; i < 220; i++) {
      const length = rnd.range(1.5, 3.5)
      const color = shade(base, rnd.pick([-0.16, -0.08, 0.1]))
      wrapped(rnd.range(0, PATTERN), rnd.range(0, PATTERN), 4, (x, y) =>
        g
          .moveTo(x, y)
          .lineTo(x + rnd.range(-1, 1), y - length)
          .stroke({ color, width: 1, cap: 'round' }),
      )
    }
  },

  /** Asfalto: oscuro con grano claro y oscuro. */
  asphalt(g, base, rnd) {
    g.rect(0, 0, PATTERN, PATTERN).fill(base)
    speckles(g, rnd, 260, [shade(base, 0.12), shade(base, -0.12), shade(base, 0.2)], [0.4, 0.9])
  },
}

/**
 * Franjas de corte: dos bandas por casilla (32 px), alternando un tono algo
 * más claro y otro algo más oscuro que la base.
 */
function drawMowingStripes(g: Graphics, base: number, contrast: number): void {
  const band = TILE_SIZE / 2
  for (let x = 0; x < PATTERN; x += band) {
    const light = (x / band) % 2 === 0
    g.rect(x, 0, band, PATTERN).fill(shade(base, light ? contrast : -contrast))
  }
}
