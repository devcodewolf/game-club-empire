/**
 * Grada modular vista desde arriba (docs/DISENO-ESTADIO-Y-NIVELES.md).
 *
 * Contrato de pintor: sin girar, el FRENTE (el campo) abajo. `w` es el largo
 * del lado del campo y `h` el fondo del nivel, así que la misma función sirve
 * para laterales y fondos de cualquier campo. Las filas van paralelas al
 * frente; los pasillos de escalera cortan las filas cada ~8 casillas.
 *
 * Niveles 1-3: talud, bancos y asientos. Niveles 4-6: anillos escalonados
 * separados por pasillos con vomitorios (y palcos en la gran tribuna), con la
 * altura fingida por tono, la cara del desnivel y una sombra más larga.
 */
import type { Graphics } from 'pixi.js'
import { DEFAULT_CLUB_COLORS, type ClubColors } from './clubColors'
import { shade } from './color'
import { TILE_SIZE } from './grid'
import type { ObjectPainter } from './objectArt'
import { palette } from './palette'
import type { Random } from './random'
import { MIN_DETAIL, OUTLINE, OUTLINE_DETAIL, SHADOW_OFFSET } from './style'

const O = palette.outline

/** Materiales de la grada, todos derivados de la paleta. */
export const S = {
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
export const AISLE_W = 28
/** Fondo de una fila de bancos o asientos, en px (2 filas por casilla). */
export const ROW_H = TILE_SIZE / 2

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
export const BACK = 14
export const FRONT = 12

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
export const SEAT_W = 20
export const SEAT_GAP = 5

function drawSeats(g: Graphics, w: number, h: number, rnd: Random, club: ClubColors): void {
  const { rows, aisles } = drawTerraces(g, w, h, rnd)
  drawSeatRows(g, w, rows, aisles, club)
  drawBackWall(g, w)
  g.rect(0, 0, w, h).stroke({ color: O, width: OUTLINE })
}

/**
 * Asientos individuales con el color del club; respaldo (arriba) más oscuro.
 * Se acumulan todos los rectángulos de un color y se rellenan de una vez.
 */
function drawSeatRows(
  g: Graphics,
  w: number,
  rows: readonly number[],
  aisles: readonly number[],
  club: ClubColors,
): void {
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
}

/** Muro trasero de hormigón con barandilla metálica. */
function drawBackWall(g: Graphics, w: number): void {
  g.rect(0, 0, w, BACK).fill(S.concreteStep).stroke({ color: O, width: OUTLINE_DETAIL })
  g.rect(0, 5, w, 3).fill(shade(palette.stone, 0.3))
  for (let x = 16; x < w; x += TILE_SIZE) g.rect(x - 2, 3, 4, 7).fill(shade(S.concreteStep, -0.3))
}

// ── Niveles 4-6 · anillos escalonados ────────────────────────────

/**
 * Reparto del fondo en anillos, de delante (campo) hacia atrás, en casillas.
 * El último anillo se queda con lo que sobra. Entre anillo y anillo hay un
 * pasillo de acceso ('concourse') o una fila de palcos ('boxes').
 */
const RING_LAYOUT: Readonly<Record<number, readonly ('ring' | 'concourse' | 'boxes')[]>> = {
  3: ['ring'],
  4: ['ring', 'concourse', 'ring'],
  5: ['ring', 'concourse', 'ring', 'boxes', 'ring'],
}
/** Fondo de cada anillo salvo el último, y de pasillos y palcos, en px. */
const RING_DEPTH = TILE_SIZE * 4
const CONCOURSE_DEPTH = TILE_SIZE
const BOXES_DEPTH = TILE_SIZE
/** Cara vertical del frente de un anillo alto: lo que "levanta" el anillo. */
export const RISER = 12
/** Cuánto más claro es cada anillo que el de delante (está más alto). */
export const RING_LIFT = 0.12

/**
 * Un anillo de asientos entre y0 (atrás) e y1 (delante). Los anillos altos
 * llevan delante un antepecho blanco y la cara vertical del desnivel.
 */
function drawRing(
  g: Graphics,
  w: number,
  y0: number,
  y1: number,
  level: number,
  rnd: Random,
  club: ClubColors,
): void {
  const front = level === 0 ? FRONT : RISER + 6
  const base = shade(S.concrete, RING_LIFT * level)
  g.rect(0, y0, w, y1 - y0).fill(base)
  const rows: number[] = []
  for (let y = y0; y + ROW_H <= y1 - front + 1; y += ROW_H) rows.push(y)
  rows.forEach((y, i) => {
    g.rect(0, y, w, ROW_H).fill(shade(base, 0.06 - (0.1 * i) / Math.max(1, rows.length)))
    g.rect(0, y + ROW_H - 4, w, 4).fill(shade(S.concreteStep, 0.05 + RING_LIFT * level))
  })
  for (let i = 0; i < w / 120; i++) {
    g.ellipse(rnd.range(0, w), rnd.range(y0, y1 - front), rnd.range(8, 22), rnd.range(3, 6))
  }
  g.fill({ color: S.concreteStep, alpha: 0.15 })
  const aisles = aisleCenters(w)
  for (const cx of aisles) drawAisle(g, cx, y0, y1 - front, ROW_H, shade(base, 0.1))
  drawSeatRows(g, w, rows, aisles, club)

  if (level === 0) {
    // Murete blanco junto al campo
    g.rect(0, y1 - FRONT, w, FRONT)
      .fill(S.barrier)
      .stroke({ color: O, width: OUTLINE_DETAIL })
    g.rect(0, y1 - FRONT, w, 3).fill(shade(S.barrier, -0.12))
    return
  }
  // Antepecho blanco y, debajo, la cara del desnivel en sombra
  g.rect(0, y1 - front, w, 6)
    .fill(S.barrier)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.rect(0, y1 - RISER, w, RISER).fill(shade(S.concreteStep, -0.25))
}

/** Pasillo de acceso entre anillos con las bocas (vomitorios) que suben al de atrás. */
function drawConcourse(g: Graphics, w: number, y0: number, y1: number, level: number): void {
  g.rect(0, y0, w, y1 - y0).fill(shade(S.concreteStep, 0.12 + RING_LIFT * level))
  const aisles = aisleCenters(w)
  // Una boca en el centro de cada tramo entre pasillos
  const bounds = [0, ...aisles, w]
  const centers = bounds.slice(1).map((x, i) => ((bounds[i] ?? 0) + x) / 2)
  for (const cx of centers) {
    g.rect(cx - 26, y0, 52, (y1 - y0) * 0.6)
      .fill(shade(S.concreteStep, -0.15))
      .stroke({ color: O, width: OUTLINE_DETAIL })
    g.rect(cx - 18, y0, 36, (y1 - y0) * 0.6 - 6).fill(O)
  }
}

/** Fila de palcos acristalados con luz cálida dentro (solo la gran tribuna). */
function drawBoxes(g: Graphics, w: number, y0: number, y1: number): void {
  g.rect(0, y0, w, y1 - y0).fill(S.concreteStep)
  const boxW = TILE_SIZE * 2
  for (let x = 6; x + boxW - 6 <= w; x += boxW) {
    g.rect(x, y0 + 6, boxW - 10, y1 - y0 - 18)
      .fill(shade(palette.waterShine, -0.1))
      .stroke({ color: O, width: OUTLINE_DETAIL })
    g.rect(x + 6, y0 + 10, boxW - 22, 10).fill({ color: palette.warmLight, alpha: 0.7 })
  }
  // Cristalera frontal: un brillo continuo a lo largo de la fila
  g.rect(0, y1 - 12, w, 4).fill(shade(palette.waterShine, 0.25))
}

/** Banda de una grada de estadio, medida como distancia al campo (px). */
export interface RingBand {
  readonly kind: 'ring' | 'concourse' | 'boxes'
  /** Distancia al campo del borde delantero y del trasero. */
  readonly from: number
  readonly to: number
  /** Anillo (0 = el más bajo) al que pertenece o que precede. */
  readonly level: number
}

/**
 * Bandas de delante (campo) hacia atrás para un nivel y un fondo dados. Lados
 * y córners usan este mismo reparto, así filas y pasillos empalman.
 */
export function ringBands(tier: number, depth: number): RingBand[] {
  const layout = RING_LAYOUT[tier] ?? ['ring']
  const bands: RingBand[] = []
  let from = 0
  let level = 0
  layout.forEach((kind, i) => {
    const last = i === layout.length - 1
    const size = last
      ? depth - BACK - from
      : kind === 'ring'
        ? RING_DEPTH
        : kind === 'boxes'
          ? BOXES_DEPTH
          : CONCOURSE_DEPTH
    bands.push({ kind, from, to: from + size, level })
    if (kind === 'ring') level += 1
    from += size
  })
  return bands
}

/** Gradas de estadio: anillos de delante hacia atrás con su separador. */
function drawRings(
  g: Graphics,
  w: number,
  h: number,
  tier: number,
  rnd: Random,
  club: ClubColors,
): void {
  for (const band of ringBands(tier, h)) {
    const y0 = h - band.to
    const y1 = h - band.from
    if (band.kind === 'ring') drawRing(g, w, y0, y1, band.level, rnd, club)
    else if (band.kind === 'boxes') drawBoxes(g, w, y0, y1)
    else drawConcourse(g, w, y0, y1, band.level)
  }
  drawBackWall(g, w)
  g.rect(0, 0, w, h).stroke({ color: O, width: OUTLINE })
}

/** Fondo de la visera por nivel, en casillas (los niveles bajos no tienen). */
export const ROOF_TILES: Readonly<Record<number, number>> = { 3: 1, 4: 1.25, 5: 1.5 }

/**
 * Visera: una cubierta estrecha sobre las últimas filas. Va en su propio
 * Graphics para poder desvanecerla al pasar el ratón (como los techos).
 * Devuelve false si el nivel no tiene visera.
 */
export function paintStandRoof(
  g: Graphics,
  w: number,
  tier: number,
  club: ClubColors = DEFAULT_CLUB_COLORS,
): boolean {
  const tiles = ROOF_TILES[tier]
  if (!tiles) return false
  const depth = tiles * TILE_SIZE
  g.rect(0, 0, w, depth).fill(palette.slate).stroke({ color: O, width: OUTLINE })
  for (let x = 12; x < w; x += 24) g.rect(x - 1, 2, 2, depth - 10).fill(palette.slateRows)
  // Canto delantero con una franja del club y las cerchas que la sujetan
  g.rect(0, depth - 8, w, 8)
    .fill(palette.stoneDark)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.rect(0, depth - 8, w, 3).fill(club.primary)
  for (let x = TILE_SIZE * 2; x < w - TILE_SIZE; x += TILE_SIZE * 4) {
    g.rect(x - 3, 0, 6, depth - 8).fill(shade(palette.slate, -0.25))
  }
  return true
}

/**
 * Desplazamiento de la sombra proyectada por nivel, en px: cuanto más alta la
 * grada, más larga la sombra. Es lo que da sensación de altura vista desde arriba.
 */
const STAND_SHADOW = [SHADOW_OFFSET, SHADOW_OFFSET + 2, SHADOW_OFFSET + 4, 16, 28, 44] as const

export function standShadowOffset(tier: number): number {
  return STAND_SHADOW[Math.min(tier, STAND_SHADOW.length - 1)] ?? SHADOW_OFFSET
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
      return drawRings(g, w, h, tier, rnd, club)
  }
}
