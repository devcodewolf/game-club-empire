/**
 * Grada modular vista desde arriba (docs/DISENO-ESTADIO-Y-NIVELES.md).
 *
 * Contrato de pintor: sin girar, el FRENTE (el campo) abajo. `w` es el largo
 * del lado del campo y `h` el fondo del nivel, así que la misma función sirve
 * para laterales y fondos de cualquier campo. Las filas van paralelas al
 * frente; los pasillos de escalera cortan las filas cada ~8 casillas.
 *
 * Entrega a: niveles 1-3 (talud, bancos, asientos). Los niveles 4-6 usan de
 * momento un dibujo provisional con cubierta, que se rehace en la entrega b.
 */
import type { Graphics } from 'pixi.js'
import { DEFAULT_CLUB_COLORS, type ClubColors } from './clubColors'
import { shade } from './color'
import { TILE_SIZE } from './grid'
import type { ObjectPainter } from './objectArt'
import { palette } from './palette'
import type { Random } from './random'
import { MIN_DETAIL, OUTLINE, OUTLINE_DETAIL } from './style'

const O = palette.outline

/** Materiales de la grada, todos derivados de la paleta. */
const S = {
  grassTop: shade(palette.grassVariation, 0.12),
  grassLow: palette.grassShadow,
  earth: palette.mud,
  earthDeep: palette.mudDeep,
  concrete: shade(palette.stone, 0.08),
  concreteStep: palette.stoneDark,
  plank: shade(palette.wood, 0.14),
  plankGrain: shade(palette.wood, -0.12),
  fence: palette.wood,
  barrier: palette.chalk,
} as const

/** Separación aproximada entre pasillos de escalera, en px. */
const AISLE_EVERY = TILE_SIZE * 8
/** Ancho de un pasillo de escalera, en px. */
const AISLE_W = 28
/** Fondo de una fila de bancos o asientos, en px (2 filas por casilla). */
const ROW_H = TILE_SIZE / 2

/** Centros de los pasillos: repartidos a partes iguales, nunca en los extremos. */
function aisleCenters(w: number): number[] {
  const segments = Math.max(2, Math.round(w / AISLE_EVERY))
  return Array.from({ length: segments - 1 }, (_, i) => ((i + 1) * w) / segments)
}

/** ¿Cae la franja [x, x+width] sobre algún pasillo? */
function onAisle(x: number, width: number, aisles: readonly number[]): boolean {
  return aisles.some((c) => x + width > c - AISLE_W / 2 - 2 && x < c + AISLE_W / 2 + 2)
}

/** Escalones de un pasillo: peldaños claros con su sombra, uno por fila. */
function drawAisle(
  g: Graphics,
  cx: number,
  y0: number,
  y1: number,
  step: number,
  color: number,
): void {
  const x = cx - AISLE_W / 2
  g.rect(x, y0, AISLE_W, y1 - y0).fill(color)
  for (let y = y0 + step; y < y1; y += step) g.rect(x, y - 3, AISLE_W, 3).fill(shade(color, -0.22))
  g.rect(x, y0, AISLE_W, y1 - y0).stroke({ color: O, width: OUTLINE_DETAIL, alpha: 0.6 })
}

// ── Nivel 1 · Talud ──────────────────────────────────────────────

/** Ladera de hierba con terrazas de tierra pisada y una cuerda delante. */
function drawEarthBank(g: Graphics, w: number, h: number, rnd: Random): void {
  // Ladera: más clara arriba (lo alto) y más oscura junto al campo.
  const bands = 4
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const color = shade(S.grassTop, -0.3 * t)
    g.rect(0, (h * i) / bands, w, h / bands + 1).fill(color)
  }
  // Terrazas de tierra pisada, con el borde irregular
  const terraces = 3
  for (let r = 0; r < terraces; r++) {
    const y = 12 + (r * (h - 28)) / terraces
    const th = 15
    g.moveTo(0, y)
    for (let x = 0; x <= w; x += 24) g.lineTo(x, y + rnd.range(-1.5, 1.5))
    for (let x = w; x >= 0; x -= 24) g.lineTo(x, y + th + rnd.range(-1.5, 1.5))
    g.closePath().fill(S.earth)
    g.rect(0, y + th - 3, w, 3).fill(S.earthDeep)
  }
  // Matas de hierba sueltas
  for (let i = 0; i < w / 40; i++) {
    const x = rnd.range(4, w - 4)
    const y = rnd.range(4, h - 18)
    g.circle(x, y, rnd.range(MIN_DETAIL, 3.5)).fill(shade(S.grassLow, rnd.range(-0.05, 0.1)))
  }
  // Senderos de bajada: tierra con peldaños de tronco
  for (const cx of aisleCenters(w)) {
    g.rect(cx - AISLE_W / 2 + 4, 0, AISLE_W - 8, h - 10).fill(S.earth)
    for (let y = 16; y < h - 12; y += 22)
      g.rect(cx - AISLE_W / 2 + 4, y, AISLE_W - 8, 4).fill(S.fence)
  }
  // Barandilla: postes blancos y cuerda, pegada al pasillo del campo
  const ry = h - 8
  g.moveTo(0, ry)
    .lineTo(w, ry)
    .stroke({ color: shade(S.barrier, -0.25), width: 2 })
  for (let x = 12; x < w; x += TILE_SIZE) {
    g.rect(x - 3, ry - 3, 6, 6)
      .fill(S.barrier)
      .stroke({ color: O, width: OUTLINE_DETAIL })
  }
  // Coronación de tierra (lo más alto del talud) y contorno
  g.rect(0, 0, w, 5).fill(S.earthDeep)
  g.rect(0, 0, w, h).stroke({ color: O, width: OUTLINE })
}

// ── Base común de las gradas de obra (niveles 2 y 3) ─────────────

/** Margen trasero (valla o muro) y delantero (murete), en px. */
const BACK = 14
const FRONT = 12

/**
 * Escalones de hormigón: una franja por fila con su sombra al pie, el murete
 * blanco delante y los pasillos. Devuelve las filas (y de cada una) y pasillos.
 */
function drawTerraces(
  g: Graphics,
  w: number,
  h: number,
  rnd: Random,
): { rows: number[]; aisles: number[] } {
  g.rect(0, 0, w, h).fill(S.concrete)
  const rows: number[] = []
  for (let y = BACK; y + ROW_H <= h - FRONT + 1; y += ROW_H) rows.push(y)
  // Cada fila es un escalón: más claro arriba (más alto), sombra al pie.
  rows.forEach((y, i) => {
    g.rect(0, y, w, ROW_H).fill(shade(S.concrete, 0.06 - (0.1 * i) / Math.max(1, rows.length)))
    g.rect(0, y + ROW_H - 4, w, 4).fill(shade(S.concreteStep, 0.05))
  })
  // Manchas de humedad: el hormigón tiene la misma riqueza que los suelos
  for (let i = 0; i < w / 90; i++) {
    g.ellipse(rnd.range(0, w), rnd.range(BACK, h - FRONT), rnd.range(8, 22), rnd.range(3, 6))
  }
  g.fill({ color: S.concreteStep, alpha: 0.18 })
  const aisles = aisleCenters(w)
  for (const cx of aisles) drawAisle(g, cx, BACK, h - FRONT, ROW_H, shade(S.concrete, 0.1))
  // Murete delantero blanco con su remate
  g.rect(0, h - FRONT, w, FRONT)
    .fill(S.barrier)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.rect(0, h - FRONT, w, 3).fill(shade(S.barrier, -0.12))
  return { rows, aisles }
}

// ── Nivel 2 · Bancos de madera ───────────────────────────────────

function drawBenches(g: Graphics, w: number, h: number, rnd: Random): void {
  const { rows, aisles } = drawTerraces(g, w, h, rnd)
  // Bancos: un tablón largo por fila entre pasillo y pasillo, con veta.
  const edges = [0, ...aisles.flatMap((c) => [c - AISLE_W / 2 - 4, c + AISLE_W / 2 + 4]), w]
  for (const y of rows) {
    for (let i = 0; i < edges.length; i += 2) {
      const x0 = (edges[i] ?? 0) + 6
      const x1 = (edges[i + 1] ?? w) - 6
      const by = y + 7
      const bh = ROW_H - 16
      g.rect(x0, by, x1 - x0, bh)
        .fill(S.plank)
        .stroke({ color: O, width: OUTLINE_DETAIL })
      g.rect(x0, by + bh - 2, x1 - x0, 2).fill(shade(S.plank, -0.2))
      // Veta y juntas entre tablones
      for (let x = x0 + rnd.range(20, 60); x < x1 - 10; x += rnd.range(50, 110)) {
        g.moveTo(x, by + 3)
          .lineTo(x + rnd.range(18, 40), by + 3)
          .stroke({ color: S.plankGrain, width: OUTLINE_DETAIL })
      }
      for (let x = x0 + TILE_SIZE * 2; x < x1 - 8; x += TILE_SIZE * 2) {
        g.rect(x, by, MIN_DETAIL, bh).fill(shade(S.plank, -0.3))
      }
    }
  }
  // Valla trasera de madera: listón con postes
  g.rect(0, 0, w, BACK).fill(shade(S.fence, -0.15))
  g.rect(0, 3, w, 6).fill(S.fence).stroke({ color: O, width: OUTLINE_DETAIL })
  for (let x = 16; x < w; x += TILE_SIZE) g.rect(x - 4, 1, 8, 10).fill(shade(S.fence, -0.3))
  g.rect(0, 0, w, h).stroke({ color: O, width: OUTLINE })
}

// ── Nivel 3 · Asientos ───────────────────────────────────────────

/** Ancho de un asiento y hueco entre asientos, en px. */
const SEAT_W = 20
const SEAT_GAP = 5

function drawSeats(g: Graphics, w: number, h: number, rnd: Random, club: ClubColors): void {
  const { rows, aisles } = drawTerraces(g, w, h, rnd)
  // Asientos individuales con el color del club; respaldo (arriba) más oscuro.
  // Se acumulan todos los rectángulos de un color y se rellenan de una vez.
  const seat = club.primary
  const back = shade(club.primary, -0.3)
  for (const y of rows) {
    for (let x = 8; x + SEAT_W <= w - 8; x += SEAT_W + SEAT_GAP) {
      if (onAisle(x, SEAT_W, aisles)) continue
      g.roundRect(x, y + 6, SEAT_W, ROW_H - 14, 3)
    }
  }
  g.fill(seat).stroke({ color: O, width: OUTLINE_DETAIL })
  for (const y of rows) {
    for (let x = 8; x + SEAT_W <= w - 8; x += SEAT_W + SEAT_GAP) {
      if (onAisle(x, SEAT_W, aisles)) continue
      g.rect(x + 1, y + 6, SEAT_W - 2, 4)
    }
  }
  g.fill(back)
  // Muro trasero de hormigón con barandilla metálica
  g.rect(0, 0, w, BACK).fill(S.concreteStep).stroke({ color: O, width: OUTLINE_DETAIL })
  g.rect(0, 5, w, 3).fill(shade(palette.stone, 0.3))
  for (let x = 16; x < w; x += TILE_SIZE) g.rect(x - 2, 3, 4, 7).fill(shade(S.concreteStep, -0.3))
  g.rect(0, 0, w, h).stroke({ color: O, width: OUTLINE })
}

// ── Niveles 4-6 · provisional (se rehace en la entrega b) ────────

function drawCoveredPlaceholder(
  g: Graphics,
  w: number,
  h: number,
  rnd: Random,
  tier: number,
  club: ClubColors,
): void {
  drawSeats(g, w, h, rnd, club)
  const roof = h * ([0.5, 0.62, 0.8][tier - 3] ?? 0.5)
  g.rect(0, 0, w, roof).fill(palette.slate).stroke({ color: O, width: OUTLINE })
  for (let x = 12; x < w; x += 24) g.rect(x - 1, 2, 2, roof - 4).fill(palette.slateRows)
  g.rect(0, roof - 6, w, 6).fill(palette.stoneDark)
}

/** Pintor de la grada: elige el dibujo según el nivel. */
export const standPainter: ObjectPainter = (g, w, h, rnd, tier = 0, club = DEFAULT_CLUB_COLORS) => {
  switch (tier) {
    case 0:
      return drawEarthBank(g, w, h, rnd)
    case 1:
      return drawBenches(g, w, h, rnd)
    case 2:
      return drawSeats(g, w, h, rnd, club)
    default:
      return drawCoveredPlaceholder(g, w, h, rnd, tier, club)
  }
}
