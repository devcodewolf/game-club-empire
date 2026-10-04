/**
 * Texturas de muro generadas por código: la CARA (el material que se ve en el
 * lateral: hiladas de ladrillo, bloques de hormigón, piedras…) y el REMATE
 * (la parte de arriba del muro, clara, con algo de grano).
 *
 * Igual que los suelos: 128×128 px, sin costuras, en espacio global.
 */
import { FillPattern, Matrix, type Graphics, type Renderer, type Texture } from 'pixi.js'
import type { WallCatalog, WallDef, WallId, WallPattern } from '@/sim/map/structureTypes'
import { shade } from '../core/color'
import type { Random } from '../core/random'
import { bakePattern, drawRowPieces, PATTERN, speckles } from '../core/textureKit'

export interface WallTextures {
  /** Cara frontal (abajo): hiladas horizontales. */
  face(wall: WallId): FillPattern | undefined
  /** Caras laterales: la misma textura girada 90° (hiladas verticales). */
  side(wall: WallId): FillPattern | undefined
  cap(wall: WallId): FillPattern | undefined
  destroy(): void
}

type FacePainter = (g: Graphics, def: WallDef, rnd: Random) => void

export function createWallTextures(renderer: Renderer, walls: WallCatalog): WallTextures {
  const faces = new Map<WallId, FillPattern>()
  const sides = new Map<WallId, FillPattern>()
  const caps = new Map<WallId, FillPattern>()
  const textures: Texture[] = []

  for (const def of Object.values(walls)) {
    const face = bakePattern(renderer, `${def.id}:face`, (g, rnd) =>
      FACES[def.pattern](g, def, rnd),
    )
    const cap = bakePattern(renderer, `${def.id}:cap`, (g, rnd) => paintCap(g, def, rnd))
    faces.set(def.id, face.pattern)
    // Mismo dibujo girado: Pixi usa pattern.transform como matriz de la textura.
    const side = new FillPattern({
      texture: face.texture,
      repetition: 'repeat',
      textureSpace: 'global',
    })
    side.setTransform(new Matrix().rotate(Math.PI / 2))
    sides.set(def.id, side)
    caps.set(def.id, cap.pattern)
    textures.push(face.texture, cap.texture)
  }

  return {
    face: (wall) => faces.get(wall),
    side: (wall) => sides.get(wall),
    cap: (wall) => caps.get(wall),
    destroy() {
      for (const texture of textures) texture.destroy(true)
    },
  }
}

/** Remate: color plano con grano fino y alguna mancha suave. */
function paintCap(g: Graphics, def: WallDef, rnd: Random): void {
  g.rect(0, 0, PATTERN, PATTERN).fill(def.capColor)
  speckles(g, rnd, 70, [shade(def.capColor, -0.06), shade(def.capColor, 0.05)], [0.5, 1.2])
}

const FACES: Record<WallPattern, FacePainter> = {
  /** Ladrillo: hiladas de 8 px, ladrillos de ~16 px a matajunta, mortero claro. */
  brick(g, def, rnd) {
    const mortar = shade(def.capColor, -0.12)
    const rowHeight = 8
    g.rect(0, 0, PATTERN, PATTERN).fill(mortar)
    for (let row = 0; row < PATTERN / rowHeight; row++) {
      drawRowPieces(rnd, row * rowHeight, rowHeight, [14, 18], (x, y, w, h, piece) => {
        const tone = shade(def.faceColor, piece.range(-0.12, 0.1))
        g.rect(x + 1, y + 1, w - 2, h - 2).fill(tone)
        g.rect(x + 1, y + 1, w - 2, 1.2).fill(shade(tone, 0.18))
      })
    }
  },

  /** Hormigón: bloques grandes con junta fina y motas. */
  concrete(g, def, rnd) {
    const seam = shade(def.faceColor, -0.3)
    const rowHeight = 16
    g.rect(0, 0, PATTERN, PATTERN).fill(seam)
    for (let row = 0; row < PATTERN / rowHeight; row++) {
      drawRowPieces(rnd, row * rowHeight, rowHeight, [30, 34], (x, y, w, h, piece) => {
        g.rect(x + 1, y + 1, w - 2, h - 2).fill(shade(def.faceColor, piece.range(-0.05, 0.05)))
      })
    }
    speckles(g, rnd, 120, [shade(def.faceColor, -0.15), shade(def.faceColor, 0.12)], [0.4, 0.9])
  },

  /** Piedra: hiladas irregulares de piedras de distinto largo y tono. */
  stone(g, def, rnd) {
    const mortar = shade(def.faceColor, -0.35)
    const rowHeight = 11
    g.rect(0, 0, PATTERN, PATTERN).fill(mortar)
    for (let y = 0; y < PATTERN; y += rowHeight) {
      const height = Math.min(rowHeight, PATTERN - y)
      drawRowPieces(rnd, y, height, [10, 22], (x, py, w, h, piece) => {
        const tone = shade(def.faceColor, piece.range(-0.15, 0.15))
        g.roundRect(x + 1, py + 1, w - 2, h - 2, 3).fill(tone)
        g.roundRect(x + 2, py + 2, w * 0.5, 2, 1).fill(shade(tone, 0.2))
      })
    }
  },

  /** Enlucido: liso con grano fino y alguna mancha de humedad. */
  plaster(g, def, rnd) {
    g.rect(0, 0, PATTERN, PATTERN).fill(def.faceColor)
    speckles(g, rnd, 160, [shade(def.faceColor, -0.06), shade(def.faceColor, 0.04)], [0.4, 1])
    speckles(g, rnd, 6, [shade(def.faceColor, -0.05)], [5, 10])
  },

  /** Valla y seto se dibujan con formas propias; la textura es solo de respaldo. */
  fence(g, def) {
    g.rect(0, 0, PATTERN, PATTERN).fill(def.faceColor)
  },
  hedge(g, def, rnd) {
    g.rect(0, 0, PATTERN, PATTERN).fill(def.faceColor)
    speckles(g, rnd, 90, [shade(def.capColor, 0.1), shade(def.capColor, -0.1)], [2, 5])
  },
}
