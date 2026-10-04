/**
 * Dibujo de los objetos al estilo Prison Architect, vistos desde arriba.
 *
 * Cada pintor dibuja en coordenadas LOCALES del objeto SIN GIRAR: (0,0) es la
 * esquina superior izquierda, (w,h) el tamaño en px del objeto sin girar y el
 * FRENTE mira hacia abajo (como la flecha de orientación). El marcador gira
 * el conjunto; la sombra la pone el marcador aparte para que caiga siempre
 * abajo a la derecha.
 *
 * Reglas de la guía: contorno oscuro, colores planos con segundo y tercer
 * tono y 2-3 detalles característicos por objeto.
 */
import type { Graphics } from 'pixi.js'
import { shade } from '../core/color'
import { palette } from '../palette'
import { DEFAULT_CLUB_COLORS, type ClubColors } from '../core/clubColors'
import type { Random } from '../core/random'
import { standPainter } from './standArt'
import { standCornerPainter } from './standCornerArt'
import { MIN_DETAIL, OUTLINE, OUTLINE_DETAIL, OUTLINE_WALL } from '../style'

/**
 * Pintor de un objeto. `tier` es el nivel (0 = nivel 1) para los objetos
 * mejorables; `club`, los colores del club para lo que se tiñe.
 */
export type ObjectPainter = (
  g: Graphics,
  w: number,
  h: number,
  rnd: Random,
  tier?: number,
  club?: ClubColors,
) => void

const O = palette.outline
const LINE = 1.5

/** Caja con contorno y un brillo fino en el borde superior. */
function box(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  radius = 3,
): void {
  g.roundRect(x, y, w, h, radius).fill(color).stroke({ color: O, width: LINE })
  g.roundRect(x + 2, y + 1.5, w - 4, Math.min(3, h / 4), 1).fill(shade(color, 0.22))
}

/** Línea interior fina (juntas, cajones, tablas). */
function line(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: number,
  width = 1,
): void {
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color, width })
}

// ── Colores propios de objetos (derivados de la paleta o del club) ──
const C = {
  metal: 0x8a96a3,
  metalDark: 0x5d6872,
  porcelain: 0xf2f2ee,
  wood: palette.wood,
  woodLight: shade(palette.wood, 0.25),
  clubRed: 0x8c2f39,
  clubBlue: 0x3f6fa8,
  teal: 0x5aa39a,
  paper: palette.chalk,
  glass: palette.waterShine,
  water: palette.water,
  cardboard: 0xb98a55,
  orange: 0xe08a3c,
} as const

// ── Vestuario ────────────────────────────────────────────────────
//
// Taquilla, banco y ducha tienen 3 niveles (skill pixi-artist): misma huella,
// y cada nivel se distingue a ×0,5 por material, color y silueta.

/** Materiales del vestuario, todos derivados de la paleta. */
const M = {
  steel: palette.stone,
  steelDark: palette.stoneDark,
  woodLight: shade(palette.wood, 0.32),
  wood: palette.wood,
  woodDark: shade(palette.wood, -0.38),
  /** Azulejo blanco (ducha sencilla) y azul (ducha con mampara). */
  tileWhite: shade(palette.chalk, -0.06),
  tile: shade(palette.waterShine, 0.1),
  stone: palette.stone,
  brass: palette.warmLight,
  towel: palette.chalk,
} as const

/** Vetas de madera: líneas finas paralelas, sembradas para que no se repitan. */
function grain(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  rnd: Random,
  vertical = false,
): void {
  const count = Math.max(2, Math.round((vertical ? w : h) / 7))
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5 + rnd.range(-0.2, 0.2)) / count
    if (vertical)
      line(
        g,
        x + w * t,
        y + 2,
        x + w * t + rnd.range(-1, 1),
        y + h - 2,
        shade(color, -0.16),
        OUTLINE_DETAIL,
      )
    else
      line(
        g,
        x + 2,
        y + h * t,
        x + w - 2,
        y + h * t + rnd.range(-1, 1),
        shade(color, -0.16),
        OUTLINE_DETAIL,
      )
  }
}

/**
 * Taquilla 1×1, vista desde arriba con la puerta (frente) abajo.
 *  1 · metal gris: rejilla de 3 ranuras y candado
 *  2 · madera clara con vetas y una toalla blanca colgando del frente
 *  3 · madera oscura, franja del club, tirador dorado y luz cálida
 */
const locker: ObjectPainter = (g, w, h, rnd, tier = 0, club = DEFAULT_CLUB_COLORS) => {
  const x = 9
  const y = 6
  const bw = w - 18
  const bh = h - 14
  const material = tier === 0 ? M.steel : tier === 1 ? M.woodLight : M.woodDark
  const front = y + bh * 0.62

  box(g, x, y, bw, bh, material)
  // Techo (arriba) y puerta (abajo, en sombra)
  g.rect(x + 1.5, front, bw - 3, y + bh - front - 1.5).fill(shade(material, -0.14))
  line(g, x + 1.5, front, x + bw - 1.5, front, shade(material, -0.35), OUTLINE_DETAIL)

  if (tier === 0) {
    // Rejilla de ventilación en el techo y candado en la puerta
    for (let i = 0; i < 3; i++)
      g.rect(x + 7, y + 6 + i * 6, bw - 14, MIN_DETAIL + 0.5).fill(M.steelDark)
    g.rect(x + bw - 11, front + 4, 6, 6)
      .fill(M.brass)
      .stroke({ color: O, width: OUTLINE_DETAIL })
    return
  }

  if (tier === 1) {
    grain(g, x + 1.5, y + 1.5, bw - 3, front - y - 2, material, rnd, true)
    // Toalla colgando del frente: rompe la silueta hacia abajo
    g.roundRect(x + 6, front + 2, 16, bh - (front - y) + 6, 2)
      .fill(M.towel)
      .stroke({ color: O, width: OUTLINE_DETAIL })
    line(g, x + 6, y + bh + 4, x + 22, y + bh + 4, shade(M.towel, -0.22), MIN_DETAIL)
    g.circle(x + bw - 8, front + 8, 2.5).fill(M.steelDark)
    return
  }

  // Lujo: franja del club, tirador dorado y luz cálida en el techo
  grain(g, x + 1.5, y + 1.5, bw - 3, front - y - 2, material, rnd, true)
  g.rect(x + bw / 2 - 4, y + 1.5, 8, bh - 3).fill(club.primary)
  g.rect(x + bw / 2 - 4, y + 1.5, 1.5, bh - 3).fill(shade(club.primary, 0.3))
  g.circle(x + bw / 2, y + 8, 6).fill({ color: M.brass, alpha: 0.35 })
  g.circle(x + bw / 2, y + 8, 3).fill(M.brass)
  g.roundRect(x + bw - 13, front + 5, 8, 4, 2)
    .fill(M.brass)
    .stroke({ color: O, width: OUTLINE_DETAIL })
}

/**
 * Banco de vestuario 3×1; la pared (respaldo) queda arriba, el frente abajo.
 *  1 · tablón sobre dos patas metálicas
 *  2 · con respaldo, perchas y una camiseta colgada
 *  3 · cojín corrido del color del club con capitoné y marco de madera oscura
 */
const changingBench: ObjectPainter = (g, w, h, rnd, tier = 0, club = DEFAULT_CLUB_COLORS) => {
  const seatY = h / 2 - 8
  const seatH = 24

  if (tier === 0) {
    for (const x of [14, w - 22])
      g.rect(x, seatY - 3, 8, seatH + 6)
        .fill(M.steelDark)
        .stroke({ color: O, width: OUTLINE_DETAIL })
    box(g, 6, seatY, w - 12, seatH, M.woodLight, 3)
    line(g, 9, seatY + seatH / 2, w - 9, seatY + seatH / 2, shade(M.woodLight, -0.28), MIN_DETAIL)
    grain(g, 6, seatY, w - 12, seatH, M.woodLight, rnd)
    return
  }

  if (tier === 1) {
    // Respaldo contra la pared con perchas
    box(g, 6, 4, w - 12, 10, M.wood, 2)
    for (const x of [w * 0.2, w * 0.5, w * 0.8]) g.circle(x, 9, 2.5).fill(M.steelDark)
    box(g, 6, seatY, w - 12, seatH, M.woodLight, 3)
    line(g, 9, seatY + seatH / 2, w - 9, seatY + seatH / 2, shade(M.woodLight, -0.28), MIN_DETAIL)
    grain(g, 6, seatY, w - 12, seatH, M.woodLight, rnd)
    // Camiseta colgada de la percha del medio, del color del club
    const sx = w * 0.5
    g.poly([
      sx - 14,
      10,
      sx + 14,
      10,
      sx + 18,
      18,
      sx + 11,
      21,
      sx + 11,
      34,
      sx - 11,
      34,
      sx - 11,
      21,
      sx - 18,
      18,
    ])
      .fill(club.primary)
      .stroke({ color: O, width: OUTLINE_DETAIL })
    g.rect(sx - 4, 10, 8, MIN_DETAIL + 1).fill(club.secondary)
    return
  }

  // Lujo: marco de madera oscura, cojín del club con capitoné y respaldo acolchado
  box(g, 4, 3, w - 8, h - 8, M.woodDark, 4)
  box(g, 9, 7, w - 18, 12, shade(club.primary, -0.12), 4)
  box(g, 9, seatY + 1, w - 18, seatH - 2, club.primary, 6)
  for (let i = 0; i < 6; i++) {
    const bx = 22 + (i * (w - 44)) / 5
    g.circle(bx, seatY + seatH / 2, 2.5).fill(shade(club.primary, -0.35))
    g.circle(bx, 13, 2).fill(shade(club.primary, -0.4))
  }
  g.roundRect(14, seatY + 3, w - 28, 3, 1.5).fill(shade(club.primary, 0.22))
}

/**
 * Ducha 1×1; la pared con la alcachofa queda arriba.
 *  1 · plato de azulejo con desagüe y alcachofa redonda
 *  2 · lo mismo con mampara de cristal en dos lados (silueta en L)
 *  3 · ducha de lluvia: suelo de piedra, alcachofa cuadrada grande y banco de teca
 */
const shower: ObjectPainter = (g, w, h, rnd, tier = 0) => {
  // El color del plato distingue el nivel a ×0,5: blanco → azul → piedra
  const floor = tier === 2 ? M.stone : tier === 1 ? M.tile : M.tileWhite
  box(g, 4, 4, w - 8, h - 8, floor, 3)

  if (tier === 2) {
    // Losas de piedra irregulares
    for (const [x, y, sw, sh] of [
      [6, 6, 26, 22],
      [33, 6, 25, 15],
      [33, 22, 25, 21],
      [6, 29, 26, 29],
      [33, 44, 25, 14],
    ] as const) {
      g.rect(x, y, sw, sh)
        .fill(shade(M.stone, rnd.range(-0.08, 0.08)))
        .stroke({ color: shade(M.stone, -0.3), width: OUTLINE_DETAIL })
    }
  } else {
    for (let i = 1; i < 4; i++) {
      line(
        g,
        4 + ((w - 8) * i) / 4,
        6,
        4 + ((w - 8) * i) / 4,
        h - 6,
        shade(floor, -0.14),
        OUTLINE_DETAIL,
      )
      line(
        g,
        6,
        4 + ((h - 8) * i) / 4,
        w - 6,
        4 + ((h - 8) * i) / 4,
        shade(floor, -0.14),
        OUTLINE_DETAIL,
      )
    }
  }
  // Charco y desagüe
  g.ellipse(w / 2 + 3, h / 2 + 6, 15, 10).fill({ color: palette.water, alpha: 0.4 })
  g.circle(w / 2, h - 15, 4)
    .fill(M.steelDark)
    .stroke({ color: O, width: OUTLINE_DETAIL })

  if (tier === 2) {
    // Alcachofa de lluvia cuadrada y banco de teca a la izquierda
    g.rect(w / 2 - 2, 0, 4, 10).fill(M.steelDark)
    g.roundRect(w / 2 - 11, 10, 22, 22, 3)
      .fill(M.steelDark)
      .stroke({ color: O, width: OUTLINE })
    g.roundRect(w / 2 - 8, 13, 16, 16, 2).fill(shade(M.steelDark, 0.25))
    box(g, 7, h - 24, 18, 16, M.woodLight, 2)
    line(g, 7, h - 16, 25, h - 16, shade(M.woodLight, -0.3), OUTLINE_DETAIL)
    return
  }

  // Alcachofa redonda
  g.rect(w / 2 - 2, 0, 4, 11)
    .fill(M.steel)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.circle(w / 2, 16, 8)
    .fill(M.steel)
    .stroke({ color: O, width: OUTLINE })
  g.circle(w / 2, 16, 4).fill(shade(M.steel, -0.25))

  if (tier === 1) {
    // Mampara de cristal en L (lado derecho y frente): perfil metálico OSCURO para
    // que contraste con el azulejo claro, postes en las esquinas y reflejos.
    const pane = 8
    const glass = { color: palette.water, alpha: 0.55 }
    g.rect(w - 4 - pane, 4, pane, h - 8)
      .fill(glass)
      .stroke({ color: M.steelDark, width: OUTLINE_WALL })
    g.rect(4, h - 4 - pane, w - 8 - pane, pane)
      .fill(glass)
      .stroke({ color: M.steelDark, width: OUTLINE_WALL })
    for (const [px, py] of [
      [w - 4 - pane, 4],
      [w - 4 - pane, h - 4 - pane],
      [4, h - 4 - pane],
    ] as const) {
      g.rect(px, py, pane, pane).fill(M.steelDark)
    }
    // Reflejos diagonales sobre el cristal
    for (const t of [0.3, 0.6]) {
      line(g, w - 4 - pane + 1, h * t, w - 5, h * t - 5, palette.chalk, MIN_DETAIL)
      line(g, w * t, h - 5, w * t + 5, h - 4 - pane + 1, palette.chalk, MIN_DETAIL)
    }
  }
}

const toilet: ObjectPainter = (g, w, h) => {
  // Cisterna arriba y taza ovalada delante
  box(g, w / 2 - 16, 6, 32, 14, C.porcelain, 4)
  g.circle(w / 2, 13, 2.5).fill(C.metal)
  g.ellipse(w / 2, h / 2 + 8, 14, 18)
    .fill(C.porcelain)
    .stroke({ color: O, width: LINE })
  g.ellipse(w / 2, h / 2 + 9, 9, 12)
    .fill(0xd8e4ea)
    .stroke({ color: shade(C.porcelain, -0.25), width: 1 })
  g.ellipse(w / 2, h / 2 + 11, 5, 7).fill({ color: C.water, alpha: 0.7 })
}

const sink: ObjectPainter = (g, w, h) => {
  box(g, 6, 8, w - 12, h * 0.5, C.porcelain, 5)
  g.ellipse(w / 2, 8 + h * 0.27, 15, 9)
    .fill(0xd8e4ea)
    .stroke({ color: shade(C.porcelain, -0.3), width: 1 })
  g.circle(w / 2, 8 + h * 0.29, 2).fill(C.metalDark)
  // Grifo
  g.rect(w / 2 - 2, 6, 4, 9)
    .fill(C.metal)
    .stroke({ color: O, width: 0.8 })
  // Espejo en la pared de arriba
  g.rect(w / 2 - 14, 1, 28, 4)
    .fill(C.glass)
    .stroke({ color: O, width: 0.8 })
}

const tacticsBoard: ObjectPainter = (g, w, h) => {
  // Patas
  for (const x of [14, w - 18]) g.rect(x, h / 2 + 6, 4, 14).fill(C.metalDark)
  box(g, 6, h / 2 - 16, w - 12, 26, palette.chalk, 2)
  g.rect(6, h / 2 - 16, w - 12, 26).stroke({ color: C.metal, width: 3 })
  // Jugada dibujada: círculos, cruces y flechas
  const y = h / 2 - 3
  for (const x of [22, 46, 70]) g.circle(x, y - 4, 3).stroke({ color: C.clubBlue, width: 1.5 })
  for (const x of [34, 58, 86]) {
    line(g, x - 3, y + 2, x + 3, y + 8, C.clubRed, 1.5)
    line(g, x + 3, y + 2, x - 3, y + 8, C.clubRed, 1.5)
  }
  g.moveTo(22, y)
    .quadraticCurveTo(50, y - 10, 98, y - 6)
    .stroke({ color: O, width: 1 })
}

// ── Oficina, recepción y almacén ─────────────────────────────────

const officeDesk: ObjectPainter = (g, w, h) => {
  box(g, 4, 8, w - 8, h - 16, C.wood, 3)
  g.rect(6, h - 14, w - 12, 4).fill(shade(C.wood, -0.2))
  // Monitor, teclado, papeles y taza
  box(g, w / 2 - 14, 12, 28, 8, 0x2f3540, 1)
  g.rect(w / 2 - 12, 13.5, 24, 5).fill(0x5a7a96)
  box(g, w / 2 - 12, 24, 24, 7, 0xd9d9d4, 1)
  g.rect(12, 14, 18, 22).fill(C.paper).stroke({ color: O, width: 0.8 })
  g.rect(16, 18, 18, 22).fill(shade(C.paper, -0.05)).stroke({ color: O, width: 0.8 })
  for (let i = 0; i < 4; i++) line(g, 19, 23 + i * 4, 30, 23 + i * 4, shade(C.paper, -0.35))
  g.circle(w - 20, 22, 5)
    .fill(palette.chalk)
    .stroke({ color: O, width: 1 })
  g.circle(w - 20, 22, 3).fill(0x6a4428)
}

const officeChair: ObjectPainter = (g, w, h) => {
  const seat = 0x3e4a5a
  // Brazos, asiento y respaldo (el respaldo mira al frente = abajo)
  g.rect(w / 2 - 17, h / 2 - 8, 5, 20)
    .fill(shade(seat, -0.2))
    .stroke({ color: O, width: 1 })
  g.rect(w / 2 + 12, h / 2 - 8, 5, 20)
    .fill(shade(seat, -0.2))
    .stroke({ color: O, width: 1 })
  box(g, w / 2 - 12, h / 2 - 12, 24, 22, seat, 7)
  box(g, w / 2 - 14, h / 2 + 10, 28, 9, shade(seat, -0.1), 4)
}

const filingCabinet: ObjectPainter = (g, w, h) => {
  const body = 0x8f979c
  box(g, 10, 6, w - 20, h - 12, body)
  for (let i = 1; i < 3; i++)
    line(g, 12, 6 + ((h - 12) * i) / 3, w - 12, 6 + ((h - 12) * i) / 3, shade(body, -0.35), 1.5)
  for (let i = 0; i < 3; i++)
    g.rect(w / 2 - 6, 10 + ((h - 12) * i) / 3 + 4, 12, 3).fill(shade(body, -0.45))
}

const receptionDesk: ObjectPainter = (g, w, h) => {
  // Mostrador: trasera de madera y encimera clara hacia el público (abajo)
  box(g, 4, 6, w - 8, h - 12, C.wood, 4)
  box(g, 4, h - 22, w - 8, 14, shade(palette.chalk, -0.08), 3)
  box(g, w * 0.3, 12, 26, 10, 0x2f3540, 1)
  g.rect(w * 0.3 + 2, 13.5, 22, 7).fill(0x5a7a96)
  g.rect(w * 0.62, 12, 22, 16)
    .fill(C.paper)
    .stroke({ color: O, width: 0.8 })
  // Timbre
  g.circle(w - 24, h - 15, 5)
    .fill(palette.warmLight)
    .stroke({ color: O, width: 1 })
  g.circle(w - 24, h - 15, 1.5).fill(O)
}

const storageShelf: ObjectPainter = (g, w, h, rnd) => {
  box(g, 4, 8, w - 8, h - 16, C.metal, 2)
  line(g, w / 2, 9, w / 2, h - 9, C.metalDark, 2)
  // Material: cajas, balones y conos
  const items = ['box', 'ball', 'cone', 'ball', 'box', 'cone'] as const
  for (let i = 0; i < 4; i++) {
    const x = 12 + i * ((w - 24) / 4)
    const kind = rnd.pick(items)
    if (kind === 'box') box(g, x, 14, 22, 20, C.cardboard, 1)
    if (kind === 'ball') {
      g.circle(x + 11, 24, 9)
        .fill(palette.chalk)
        .stroke({ color: O, width: 1 })
      g.poly([x + 11, 20, x + 14, 23, x + 13, 27, x + 9, 27, x + 8, 23]).fill(O)
    }
    if (kind === 'cone') {
      g.poly([x + 11, 14, x + 20, 34, x + 2, 34])
        .fill(C.orange)
        .stroke({ color: O, width: 1 })
      line(g, x + 6, 27, x + 16, 27, palette.chalk, 2)
    }
  }
}

const plant: ObjectPainter = (g, w, h) => {
  const cx = w / 2
  const cy = h / 2
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    g.ellipse(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, 9, 5)
      .fill(i % 2 ? palette.tree : palette.treeLight)
      .stroke({ color: palette.treeOutline, width: 1 })
  }
  g.circle(cx, cy, 10).fill(0xb5643c).stroke({ color: O, width: LINE })
  g.circle(cx, cy, 7).fill(palette.mudDeep)
  g.circle(cx - 2, cy - 2, 4).fill(palette.treeLight)
}

const waterCooler: ObjectPainter = (g, w, h) => {
  box(g, 12, 10, w - 24, h - 20, C.porcelain, 4)
  g.circle(w / 2, h / 2 - 2, 13)
    .fill({ color: C.water, alpha: 0.85 })
    .stroke({ color: O, width: LINE })
  g.circle(w / 2 - 4, h / 2 - 6, 4).fill(C.glass)
  g.rect(w / 2 - 5, h - 18, 10, 5)
    .fill(C.clubBlue)
    .stroke({ color: O, width: 0.8 })
}

// ── Campo, exterior y gradas ─────────────────────────────────────

const dugout: ObjectPainter = (g, w, h) => {
  // Pared del fondo, asientos y cubierta de metacrilato
  g.rect(4, 4, w - 8, 10)
    .fill(palette.stoneDark)
    .stroke({ color: O, width: LINE })
  const seats = Math.floor((w - 16) / 22)
  for (let i = 0; i < seats; i++) box(g, 10 + i * 22, 18, 18, 18, C.clubBlue, 4)
  g.roundRect(2, 2, w - 4, h * 0.72, 8)
    .fill({ color: C.glass, alpha: 0.35 })
    .stroke({ color: C.metalDark, width: 2 })
  for (const x of [4, w - 8]) g.rect(x, 2, 4, h * 0.72).fill(C.metalDark)
}

const trainingGoal: ObjectPainter = (g, w, h) => {
  // Red detrás (arriba) y palos con larguero delante (abajo)
  g.rect(6, 6, w - 12, h - 18).fill({ color: palette.chalk, alpha: 0.25 })
  for (let x = 10; x < w - 6; x += 7) line(g, x, 6, x, h - 12, palette.chalk, 0.8)
  for (let y = 10; y < h - 12; y += 7) line(g, 6, y, w - 6, y, palette.chalk, 0.8)
  g.rect(6, 6, w - 12, h - 18).stroke({ color: C.metal, width: 1.5 })
  g.rect(4, h - 14, w - 8, 6)
    .fill(palette.chalk)
    .stroke({ color: O, width: 1.2 })
  for (const x of [4, w - 10])
    g.rect(x, h - 16, 6, 10)
      .fill(palette.chalk)
      .stroke({ color: O, width: 1 })
}

const cornerFlag: ObjectPainter = (g, w, h) => {
  g.poly([w / 2, h / 2, w / 2 + 18, h / 2 - 8, w / 2, h / 2 - 16])
    .fill(palette.warmLight)
    .stroke({ color: O, width: 1 })
  g.poly([w / 2, h / 2, w / 2 + 9, h / 2 - 4, w / 2, h / 2 - 8]).fill(C.clubRed)
  g.circle(w / 2, h / 2, 3.5)
    .fill(palette.chalk)
    .stroke({ color: O, width: 1 })
}

const tree: ObjectPainter = (g, w, h, rnd) => {
  const cx = w / 2
  const cy = h / 2
  const size = Math.min(w, h) * 0.36
  const crowns = [
    [0, 0, 1],
    [-0.6, -0.3, 0.7],
    [0.55, -0.38, 0.72],
    [0.4, 0.52, 0.74],
    [-0.48, 0.48, 0.7],
    [0.05, -0.66, 0.64],
  ].map(([dx = 0, dy = 0, k = 1]): [number, number, number] => [
    cx + dx * size,
    cy + dy * size,
    k * size * rnd.range(0.9, 1.1),
  ])
  for (const [x, y, r] of crowns) g.circle(x, y, r + 2).fill(palette.treeOutline)
  for (const [x, y, r] of crowns) g.circle(x, y, r).fill(palette.tree)
  for (const [x, y, r] of crowns)
    g.circle(x + r * 0.2, y + r * 0.2, r * 0.6).fill(shade(palette.tree, -0.1))
  for (const [x, y, r] of crowns.slice(0, 4))
    g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.45, r * 0.3).fill(palette.treeLight)
}

const streetLamp: ObjectPainter = (g, w, h) => {
  g.circle(w / 2, h / 2, w * 0.75).fill({ color: palette.warmLight, alpha: 0.1 })
  g.circle(w / 2, h / 2 + 4, 8)
    .fill(palette.stoneDark)
    .stroke({ color: O, width: 1 })
  box(g, w / 2 - 7, h / 2 - 16, 14, 16, palette.stone, 4)
  g.circle(w / 2, h / 2 - 8, 4).fill(palette.warmLight)
}

const bin: ObjectPainter = (g, w, h) => {
  g.circle(w / 2, h / 2, 14)
    .fill(0x557f37)
    .stroke({ color: O, width: LINE })
  g.circle(w / 2, h / 2, 10).fill(shade(0x557f37, -0.3))
  g.circle(w / 2 - 3, h / 2 - 3, 4).fill(palette.chalk)
  g.rect(w / 2 - 6, h / 2 - 16, 12, 4)
    .fill(shade(0x557f37, 0.2))
    .stroke({ color: O, width: 0.8 })
}

const parkBench: ObjectPainter = (g, w, h) => {
  for (const x of [10, w - 16]) g.rect(x, h / 2 - 15, 6, 30).fill(palette.outline)
  for (let i = 0; i < 3; i++)
    box(g, 6, h / 2 - 14 + i * 10, w - 12, 8, i === 0 ? shade(C.wood, -0.1) : C.wood, 2)
}

const fountain: ObjectPainter = (g, w, h) => {
  g.circle(w / 2, h / 2, 22)
    .fill(palette.stone)
    .stroke({ color: O, width: LINE })
  g.circle(w / 2, h / 2, 16).fill(C.water)
  g.circle(w / 2 - 5, h / 2 - 5, 5).fill(C.glass)
  g.circle(w / 2, h / 2, 5)
    .fill(palette.stoneDark)
    .stroke({ color: O, width: 1 })
}

// ── Salud, gimnasio y cafetería ──────────────────────────────────

const physioTable: ObjectPainter = (g, w, h) => {
  for (const x of [10, w - 16]) g.rect(x, 8, 6, h - 16).fill(C.metalDark)
  box(g, 6, 10, w - 12, h - 20, C.teal, 6)
  box(g, 10, 14, 26, h - 28, shade(C.teal, 0.2), 6)
  // Toalla y agujero facial
  box(g, w - 40, 14, 22, h - 28, palette.chalk, 3)
  g.ellipse(22, h / 2, 5, 4).fill(shade(C.teal, -0.3))
}

const weightsBench: ObjectPainter = (g, w, h) => {
  // Soportes, banco y barra con discos
  for (const x of [w * 0.28, w * 0.72])
    g.rect(x - 3, h * 0.2, 6, 18)
      .fill(C.metalDark)
      .stroke({ color: O, width: 1 })
  box(g, w / 2 - 12, h * 0.3, 24, h * 0.6, 0x2f3540, 6)
  g.rect(8, h * 0.24, w - 16, 5)
    .fill(C.metal)
    .stroke({ color: O, width: 1 })
  for (const x of [8, w - 20]) {
    g.roundRect(x, h * 0.24 - 12, 12, 29, 3)
      .fill(0x2f3540)
      .stroke({ color: O, width: 1 })
    g.rect(x + 3, h * 0.24 - 9, 6, 23).fill(0x4a5260)
  }
}

const exerciseBike: ObjectPainter = (g, w, h) => {
  g.roundRect(w / 2 - 6, 8, 12, h - 16, 4)
    .fill(C.metalDark)
    .stroke({ color: O, width: 1 })
  // Rueda delantera (arriba), manillar, sillín (abajo)
  g.ellipse(w / 2, 22, 8, 16)
    .fill(0x2f3540)
    .stroke({ color: O, width: 1 })
  g.rect(w / 2 - 16, 40, 32, 5)
    .fill(C.metal)
    .stroke({ color: O, width: 1 })
  g.roundRect(w / 2 - 9, h - 40, 18, 22, 6)
    .fill(0x2f3540)
    .stroke({ color: O, width: 1 })
  box(g, w / 2 - 10, h / 2 - 4, 20, 14, C.clubRed, 3)
}

const barCounter: ObjectPainter = (g, w, h) => {
  // Barra con encimera hacia los clientes (abajo) y botellas detrás
  box(g, 2, 6, w - 4, h - 16, C.wood, 4)
  box(g, 2, h - 24, w - 4, 14, shade(C.woodLight, 0.05), 3)
  const bottles = [0x3f6630, 0x8c2f39, palette.warmLight, 0x3f6fa8]
  for (let x = 12; x < w - 10; x += 14)
    g.circle(x, 16, 4)
      .fill(bottles[((x / 14) % bottles.length) | 0] ?? 0x3f6630)
      .stroke({ color: O, width: 0.8 })
  // Grifo de cerveza y vasos
  g.rect(w / 2 - 3, h - 30, 6, 10)
    .fill(C.metal)
    .stroke({ color: O, width: 0.8 })
  for (const x of [w * 0.25, w * 0.7])
    g.circle(x, h - 17, 4)
      .fill(C.glass)
      .stroke({ color: O, width: 0.8 })
}

const vendingMachine: ObjectPainter = (g, w, h) => {
  box(g, 8, 6, w - 16, h - 12, C.clubRed, 3)
  // Escaparate (frente) con filas de productos
  g.rect(12, h - 26, w - 24, 16)
    .fill(C.glass)
    .stroke({ color: O, width: 1 })
  const items = [palette.warmLight, 0x3f6fa8, 0x3f6630, palette.chalk]
  for (let i = 0; i < 5; i++)
    g.rect(15 + i * 7, h - 23, 5, 10).fill(items[i % items.length] ?? palette.chalk)
  g.rect(12, 12, w - 24, 8).fill(shade(C.clubRed, 0.2))
}

const cafeTable: ObjectPainter = (g, w, h) => {
  const chair = 0x3f6fa8
  for (const [x, y] of [
    [w / 2, 10],
    [w / 2, h - 10],
    [10, h / 2],
    [w - 10, h / 2],
  ] as const) {
    g.roundRect(x - 9, y - 9, 18, 18, 5)
      .fill(chair)
      .stroke({ color: O, width: 1 })
  }
  g.circle(w / 2, h / 2, Math.min(w, h) * 0.3)
    .fill(C.woodLight)
    .stroke({ color: O, width: LINE })
  g.circle(w / 2, h / 2, Math.min(w, h) * 0.2).stroke({
    color: shade(C.woodLight, -0.15),
    width: 1,
  })
  g.circle(w / 2 + 6, h / 2 - 4, 4)
    .fill(palette.chalk)
    .stroke({ color: O, width: 0.8 })
}

/** Pintores por id de objeto. Los que no estén aquí usan el marcador genérico. */
export const OBJECT_ART: Readonly<Record<string, ObjectPainter>> = {
  locker,
  changingBench,
  shower,
  toilet,
  sink,
  tacticsBoard,
  officeDesk,
  officeChair,
  filingCabinet,
  receptionDesk,
  storageShelf,
  plant,
  waterCooler,
  dugout,
  trainingGoal,
  cornerFlag,
  tree,
  streetLamp,
  bin,
  parkBench,
  fountain,
  physioTable,
  weightsBench,
  exerciseBike,
  barCounter,
  vendingMachine,
  cafeTable,
  stand: standPainter,
  standCorner: standCornerPainter,
}
