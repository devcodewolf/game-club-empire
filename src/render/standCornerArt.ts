/**
 * Córner de estadio visto desde arriba: cierra la esquina entre dos gradas.
 *
 * Contrato de pintor: sin girar, el VÉRTICE del campo está abajo a la
 * izquierda del cuadrado (0, h), como en el córner noreste: la grada norte
 * queda a la izquierda y la este debajo. Las filas son cuartos de arco
 * centrados en ese vértice, a la misma distancia del campo que las filas de
 * las gradas de los lados (mismas constantes y `ringBands`), así empalman.
 * La punta exterior del cuadrado queda vacía: de ahí el redondeado.
 */
import type { Graphics } from 'pixi.js'
import { DEFAULT_CLUB_COLORS, type ClubColors } from './clubColors'
import { shade } from './color'
import { TILE_SIZE } from './grid'
import type { ObjectPainter } from './objectArt'
import { palette } from './palette'
import type { Random } from './random'
import {
  AISLE_W,
  BACK,
  FRONT,
  RING_LIFT,
  RISER,
  ROOF_TILES,
  ROW_H,
  S,
  SEAT_GAP,
  SEAT_W,
  ringBands,
} from './standArt'
import { MIN_DETAIL, OUTLINE, OUTLINE_DETAIL } from './style'

const O = palette.outline
/** Ángulos del cuarto de arco: de "hacia arriba" (grada norte) a "hacia la derecha" (este). */
const A0 = -Math.PI / 2
const A1 = 0

/** Pintor con el vértice del campo ya fijado: dibuja sectores de corona. */
interface Arcs {
  /** Sector de corona entre radios r0..r1 y ángulos a0..a1 (subtrayecto, sin rellenar). */
  sector(r0: number, r1: number, a0?: number, a1?: number): Graphics
}

function arcsAt(g: Graphics, cx: number, cy: number): Arcs {
  return {
    sector(r0, r1, a0 = A0, a1 = A1) {
      g.moveTo(cx + r1 * Math.cos(a0), cy + r1 * Math.sin(a0))
      g.arc(cx, cy, r1, a0, a1)
      if (r0 <= 0) g.lineTo(cx, cy)
      else {
        g.lineTo(cx + r0 * Math.cos(a1), cy + r0 * Math.sin(a1))
        g.arc(cx, cy, r0, a1, a0, true)
      }
      return g.closePath()
    },
  }
}

/** Ángulos de los pasillos radiales: uno en córners pequeños, dos en los grandes. */
function aisleAngles(radius: number): number[] {
  const count = radius > TILE_SIZE * 8 ? 2 : 1
  return Array.from({ length: count }, (_, i) => A0 + ((i + 1) * (A1 - A0)) / (count + 1))
}

/** Semiancho angular de un pasillo a un radio dado. */
const aisleHalf = (r: number): number => (AISLE_W / 2 + 2) / Math.max(r, 1)

/** ¿Cae el ángulo `a` (con semiancho `half`) sobre algún pasillo a radio r? */
function onAisle(a: number, half: number, r: number, aisles: readonly number[]): boolean {
  return aisles.some((c) => Math.abs(a - c) < half + aisleHalf(r))
}

/** Pasillo radial: franja clara con un peldaño por fila. */
function drawRadialAisle(arcs: Arcs, angle: number, r0: number, r1: number, color: number): void {
  for (let r = r0; r < r1; r += ROW_H) {
    const top = Math.min(r + ROW_H, r1)
    const half = aisleHalf(r + ROW_H / 2)
    arcs.sector(r, top, angle - half, angle + half).fill(color)
    arcs.sector(top - 3, top, angle - half, angle + half).fill(shade(color, -0.22))
  }
}

/** Asientos del club sobre los arcos de las filas, respetando los pasillos. */
function drawArcSeats(
  g: Graphics,
  arcs: Arcs,
  rows: readonly number[],
  aisles: readonly number[],
  club: ClubColors,
): void {
  for (const r of rows) {
    const mid = r + ROW_H / 2
    const span = SEAT_W / mid
    const step = (SEAT_W + SEAT_GAP) / mid
    for (let a = A0 + step / 2; a + span < A1; a += step) {
      if (onAisle(a + span / 2, span / 2, mid, aisles)) continue
      arcs.sector(r + 6, r + ROW_H - 8, a, a + span)
    }
  }
  g.fill(club.primary).stroke({ color: O, width: OUTLINE_DETAIL })
}

/** Filas de hormigón de una banda (distancias r0..r1), con su sombra al pie. */
function concreteRows(arcs: Arcs, r0: number, r1: number, base: number): number[] {
  const rows: number[] = []
  for (let r = r0; r + ROW_H <= r1 + 1; r += ROW_H) rows.push(r)
  rows.forEach((r, i) => {
    // Al revés que en los lados: aquí la fila más lejana (r mayor) es la más alta.
    arcs.sector(r, r + ROW_H).fill(shade(base, -0.04 + (0.1 * i) / Math.max(1, rows.length)))
    arcs.sector(r, r + 4).fill(shade(S.concreteStep, 0.05))
  })
  return rows
}

// ── Nivel 1 · Talud ──────────────────────────────────────────────

function drawEarthBankCorner(g: Graphics, arcs: Arcs, d: number, rnd: Random): void {
  const bands = 4
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    arcs.sector((d * i) / bands, (d * (i + 1)) / bands).fill(shade(S.grassTop, -0.3 * (1 - t)))
  }
  // Terrazas a las mismas distancias que en el talud de los lados
  for (let i = 0; i < 3; i++) {
    const y = 12 + (i * (d - 28)) / 3
    const r1 = d - y
    arcs.sector(r1 - 15, r1).fill(S.earth)
    arcs.sector(r1 - 15, r1 - 12).fill(S.earthDeep)
  }
  for (let i = 0; i < d / 40; i++) {
    const r = rnd.range(18, d - 6)
    const a = rnd.range(A0, A1)
    g.circle(r * Math.cos(a), d + r * Math.sin(a), rnd.range(MIN_DETAIL, 3.5)).fill(S.grassLow)
  }
  // Cuerda y postes pegados al campo, y coronación de tierra
  g.arc(0, d, 8, A0, A1).stroke({ color: shade(S.barrier, -0.25), width: 2 })
  arcs.sector(d - 5, d).fill(S.earthDeep)
}

// ── Niveles 2-3 · bancos y asientos ──────────────────────────────

function drawTerraceCorner(
  g: Graphics,
  arcs: Arcs,
  d: number,
  club: ClubColors,
  benches: boolean,
): void {
  arcs.sector(0, d).fill(S.concrete)
  const rows = concreteRows(arcs, FRONT, d - BACK, S.concrete)
  const aisles = aisleAngles(d)
  for (const a of aisles) drawRadialAisle(arcs, a, FRONT, d - BACK, shade(S.concrete, 0.1))
  if (benches) {
    // Tablones en arco entre pasillo y pasillo
    const limits = [A0, ...aisles, A1]
    for (const r of rows) {
      for (let i = 0; i + 1 < limits.length; i++) {
        const gap = aisleHalf(r + ROW_H / 2)
        const from = (limits[i] ?? A0) + (i === 0 ? 0.01 : gap)
        const to = (limits[i + 1] ?? A1) - (i + 1 === limits.length - 1 ? 0.01 : gap)
        if (to > from) arcs.sector(r + 9, r + ROW_H - 7, from, to)
      }
    }
    g.fill(S.plank).stroke({ color: O, width: OUTLINE_DETAIL })
  } else {
    drawArcSeats(g, arcs, rows, aisles, club)
  }
  // Murete blanco junto al campo
  arcs.sector(0, FRONT).fill(S.barrier).stroke({ color: O, width: OUTLINE_DETAIL })
  // Valla de madera (bancos) o muro con barandilla (asientos) detrás
  arcs.sector(d - BACK, d).fill(benches ? shade(S.fence, -0.15) : S.concreteStep)
  g.arc(0, d, d - 7, A0, A1).stroke({
    color: benches ? S.fence : shade(palette.stone, 0.3),
    width: benches ? 6 : 3,
  })
}

// ── Niveles 4-6 · anillos ────────────────────────────────────────

function drawRingsCorner(g: Graphics, arcs: Arcs, d: number, tier: number, club: ClubColors): void {
  for (const band of ringBands(tier, d)) {
    if (band.kind === 'ring') {
      const front = band.level === 0 ? FRONT : RISER + 6
      const base = shade(S.concrete, RING_LIFT * band.level)
      // Fondo de toda la banda: la última fila no siempre llega justo al final
      arcs.sector(band.from, band.to).fill(base)
      const rows = concreteRows(arcs, band.from + front, band.to, base)
      const aisles = aisleAngles(band.to)
      for (const a of aisles) drawRadialAisle(arcs, a, band.from + front, band.to, shade(base, 0.1))
      drawArcSeats(g, arcs, rows, aisles, club)
      if (band.level === 0) {
        arcs
          .sector(band.from, band.from + FRONT)
          .fill(S.barrier)
          .stroke({ color: O, width: OUTLINE_DETAIL })
      } else {
        arcs.sector(band.from, band.from + RISER).fill(shade(S.concreteStep, -0.25))
        arcs.sector(band.from + RISER, band.from + RISER + 6).fill(S.barrier)
      }
      continue
    }
    if (band.kind === 'boxes') {
      arcs.sector(band.from, band.to).fill(S.concreteStep)
      arcs.sector(band.from + 12, band.to - 6).fill(shade(palette.waterShine, -0.1))
      arcs.sector(band.to - 20, band.to - 10).fill({ color: palette.warmLight, alpha: 0.7 })
      continue
    }
    // Pasillo con una boca (vomitorio) en el centro del arco
    arcs.sector(band.from, band.to).fill(shade(S.concreteStep, 0.12 + RING_LIFT * band.level))
    const mid = (A0 + A1) / 2
    const half = 26 / ((band.from + band.to) / 2)
    arcs.sector(band.to - (band.to - band.from) * 0.6, band.to, mid - half, mid + half).fill(O)
  }
  arcs.sector(d - BACK, d).fill(S.concreteStep)
  g.arc(0, d, d - 7, A0, A1).stroke({ color: shade(palette.stone, 0.3), width: 3 })
}

/** Pintor del córner: elige el dibujo según el nivel. */
export const standCornerPainter: ObjectPainter = (
  g,
  w,
  _h,
  rnd,
  tier = 0,
  club = DEFAULT_CLUB_COLORS,
) => {
  const arcs = arcsAt(g, 0, w)
  if (tier === 0) drawEarthBankCorner(g, arcs, w, rnd)
  else if (tier <= 2) drawTerraceCorner(g, arcs, w, club, tier === 1)
  else drawRingsCorner(g, arcs, w, tier, club)
  // Contorno del cuarto de círculo
  arcs.sector(0, w).stroke({ color: O, width: OUTLINE })
}

/** Visera del córner: corona estrecha en la parte de atrás, como en los lados. */
export function paintCornerRoof(
  g: Graphics,
  w: number,
  tier: number,
  club: ClubColors = DEFAULT_CLUB_COLORS,
): boolean {
  const tiles = ROOF_TILES[tier]
  if (!tiles) return false
  const arcs = arcsAt(g, 0, w)
  const depth = tiles * TILE_SIZE
  arcs
    .sector(w - depth, w)
    .fill(palette.slate)
    .stroke({ color: O, width: OUTLINE })
  arcs.sector(w - depth, w - depth + 8).fill(palette.stoneDark)
  arcs.sector(w - depth + 5, w - depth + 8).fill(club.primary)
  // Nervios radiales
  for (let a = A0 + 0.08; a < A1; a += 24 / w) {
    g.moveTo((w - depth + 10) * Math.cos(a), w + (w - depth + 10) * Math.sin(a)).lineTo(
      (w - 2) * Math.cos(a),
      w + (w - 2) * Math.sin(a),
    )
  }
  g.stroke({ color: palette.slateRows, width: 2 })
  return true
}

/** Silueta del córner (cuarto de círculo) para su sombra proyectada. */
export function paintCornerSilhouette(g: Graphics, w: number, color: number, alpha: number): void {
  arcsAt(g, 0, w).sector(0, w).fill({ color, alpha })
}
