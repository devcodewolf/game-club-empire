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
import {
  MIN_DETAIL,
  OUTLINE,
  OUTLINE_DETAIL,
  OUTLINE_WALL,
  SHADOW_ALPHA,
  SHADOW_OFFSET,
} from '../style'

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
  // Cisterna arriba con pulsador y taza ovalada delante con su asiento
  box(g, w / 2 - 15, 5, 30, 13, C.porcelain, 4)
  g.circle(w / 2, 11, 3)
    .fill(C.metal)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.ellipse(w / 2, h / 2 + 8, 15, 19)
    .fill(C.porcelain)
    .stroke({ color: O, width: OUTLINE })
  g.ellipse(w / 2, h / 2 + 9, 11, 14)
    .fill(shade(C.porcelain, -0.1))
    .stroke({ color: shade(C.porcelain, -0.35), width: OUTLINE_DETAIL })
  g.ellipse(w / 2, h / 2 + 10, 7, 9).fill(C.water)
}

const sink: ObjectPainter = (g, w, h) => {
  // Encimera, pila con desagüe, grifo con dos mandos y espejo en la pared
  box(g, 4, 6, w - 8, h * 0.56, C.porcelain, 5)
  g.ellipse(w / 2, 8 + h * 0.3, 16, 10)
    .fill(shade(palette.waterShine, 0.35))
    .stroke({ color: shade(C.porcelain, -0.35), width: OUTLINE_DETAIL })
  g.circle(w / 2, 8 + h * 0.32, 2).fill(C.metalDark)
  g.rect(w / 2 - 2, 6, 4, 11)
    .fill(C.metal)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.circle(w / 2 - 8, 10, 2.5)
    .fill(palette.water)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.circle(w / 2 + 8, 10, 2.5)
    .fill(palette.warmLight)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.rect(w / 2 - 16, 1, 32, 4)
    .fill(C.glass)
    .stroke({ color: O, width: OUTLINE_DETAIL })
}

const tacticsBoard: ObjectPainter = (g, w, h, _rnd, _tier, club = DEFAULT_CLUB_COLORS) => {
  // Patas, pizarra blanca con marco metálico y bandeja de rotuladores
  for (const x of [12, w - 16]) g.rect(x, h / 2 + 8, 4, 14).fill(C.metalDark)
  box(g, 4, h / 2 - 19, w - 8, 30, palette.chalk, 2)
  g.rect(4, h / 2 - 19, w - 8, 30).stroke({ color: C.metal, width: 3 })
  g.rect(w / 2 - 14, h / 2 + 11, 28, 4).fill(C.metalDark)
  g.rect(w / 2 - 10, h / 2 + 11, 8, 3).fill(club.primary)
  // Jugada: rivales (círculos), los nuestros (cruces del club) y una flecha
  const y = h / 2 - 4
  line(g, w / 2, h / 2 - 16, w / 2, h / 2 + 8, shade(palette.chalk, -0.15), OUTLINE_DETAIL)
  for (const x of [20, 46, 72])
    g.circle(x, y - 5, 3.5).stroke({ color: palette.slate, width: OUTLINE })
  for (const x of [32, 58, 88]) {
    line(g, x - 3.5, y + 1, x + 3.5, y + 8, club.primary, 2)
    line(g, x + 3.5, y + 1, x - 3.5, y + 8, club.primary, 2)
  }
  g.moveTo(32, y + 4)
    .quadraticCurveTo(60, y - 12, 96, y - 8)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.poly([96, y - 8, 90, y - 11, 91, y - 5]).fill(O)
}

// ── Oficina, recepción y almacén ─────────────────────────────────

/** Monitor visto desde arriba: carcasa oscura con la pantalla mirando al frente. */
const SCREEN = { case: shade(palette.slate, -0.35), glass: palette.waterEdge } as const

const officeDesk: ObjectPainter = (g, w, h, rnd) => {
  // Tablero de madera clara (contrasta con suelos de madera) y canto frontal en sombra
  const top = shade(palette.wood, 0.3)
  box(g, 3, 5, w - 6, h - 10, top, 3)
  grain(g, 5, 9, w - 10, h - 22, top, rnd)
  g.rect(4, h - 12, w - 8, 6).fill(shade(top, -0.3))
  // Monitor al fondo, teclado delante
  box(g, w / 2 - 20, 9, 40, 10, SCREEN.case, 2)
  g.rect(w / 2 - 17, 15, 34, 3).fill(SCREEN.glass)
  box(g, w / 2 - 15, 24, 30, 9, shade(palette.chalk, -0.08), 2)
  for (let r = 0; r < 2; r++)
    line(g, w / 2 - 12, 27 + r * 3, w / 2 + 12, 27 + r * 3, palette.stone, OUTLINE_DETAIL)
  // Pila de papeles a la izquierda y taza a la derecha
  g.rect(10, 10, 20, 24).fill(C.paper).stroke({ color: O, width: OUTLINE_DETAIL })
  g.rect(13, 13, 20, 24).fill(shade(C.paper, -0.05)).stroke({ color: O, width: OUTLINE_DETAIL })
  for (let i = 0; i < 4; i++) line(g, 16, 19 + i * 4, 29, 19 + i * 4, palette.stone, OUTLINE_DETAIL)
  g.circle(w - 18, 22, 6)
    .fill(palette.chalk)
    .stroke({ color: O, width: OUTLINE })
  g.circle(w - 18, 22, 3.5).fill(palette.mudDeep)
  g.rect(w - 12, 20, 4, 4)
    .fill(palette.chalk)
    .stroke({ color: O, width: OUTLINE_DETAIL })
}

const officeChair: ObjectPainter = (g, w, h) => {
  const seat = palette.slate
  const cx = w / 2
  const cy = h / 2
  // Base de estrella con ruedas (asoma bajo el asiento)
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2
    const x = cx + Math.cos(a) * 19
    const y = cy + Math.sin(a) * 19
    line(g, cx, cy, x, y, SCREEN.case, 3)
    g.circle(x, y, 2.5).fill(SCREEN.case).stroke({ color: O, width: OUTLINE_DETAIL })
  }
  // Brazos, asiento con costura y respaldo (el respaldo mira al frente = abajo)
  box(g, cx - 18, cy - 9, 6, 20, shade(seat, -0.25), 2)
  box(g, cx + 12, cy - 9, 6, 20, shade(seat, -0.25), 2)
  box(g, cx - 13, cy - 13, 26, 24, seat, 7)
  line(g, cx - 8, cy - 1, cx + 8, cy - 1, shade(seat, -0.3), OUTLINE_DETAIL)
  box(g, cx - 16, cy + 9, 32, 10, shade(seat, -0.12), 4)
}

const filingCabinet: ObjectPainter = (g, w, h) => {
  const body = palette.stone
  // Tapa, frente en sombra y tres cajones con etiqueta y tirador
  box(g, 7, 5, w - 14, h - 10, body, 2)
  g.rect(8, h - 11, w - 16, 5).fill(shade(body, -0.3))
  const drawer = (h - 18) / 3
  for (let i = 0; i < 3; i++) {
    const y = 8 + drawer * i
    if (i > 0) line(g, 9, y, w - 9, y, shade(body, -0.4), OUTLINE)
    g.rect(w / 2 - 9, y + 3, 7, 5)
      .fill(palette.chalk)
      .stroke({ color: O, width: OUTLINE_DETAIL })
    g.rect(w / 2 + 1, y + 4, 9, 3).fill(shade(body, -0.55))
  }
}

const receptionDesk: ObjectPainter = (g, w, h, rnd) => {
  // Trasera de madera con veta y encimera clara hacia el público (abajo)
  box(g, 3, 5, w - 6, h - 10, C.wood, 4)
  grain(g, 5, 8, w - 10, h - 32, C.wood, rnd)
  box(g, 3, h - 22, w - 6, 15, shade(palette.chalk, -0.08), 3)
  // Monitor, papeles y timbre
  box(g, w * 0.28, 10, 34, 10, SCREEN.case, 2)
  g.rect(w * 0.28 + 3, 16, 28, 3).fill(SCREEN.glass)
  g.rect(w * 0.6, 9, 22, 17)
    .fill(C.paper)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  for (let i = 0; i < 3; i++)
    line(g, w * 0.6 + 4, 14 + i * 4, w * 0.6 + 18, 14 + i * 4, palette.stone, OUTLINE_DETAIL)
  g.circle(w - 24, h - 14, 6)
    .fill(palette.warmLight)
    .stroke({ color: O, width: OUTLINE })
  g.circle(w - 24, h - 14, 2).fill(O)
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

/** Hoja en punta desde (cx, cy) hacia el ángulo `a`. */
function leaf(
  g: Graphics,
  cx: number,
  cy: number,
  a: number,
  len: number,
  wide: number,
  color: number,
): void {
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const mx = cx + cos * len * 0.55
  const my = cy + sin * len * 0.55
  g.poly([
    cx,
    cy,
    mx - sin * wide,
    my + cos * wide,
    cx + cos * len,
    cy + sin * len,
    mx + sin * wide,
    my - cos * wide,
  ])
    .fill(color)
    .stroke({ color: palette.treeOutline, width: OUTLINE_DETAIL })
}

/** Maceta de barro cocido. */
const POT = 0xb5643c

const plant: ObjectPainter = (g, w, h, rnd) => {
  const cx = w / 2
  const cy = h / 2
  // Maceta con borde y tierra; las hojas la desbordan
  g.circle(cx, cy, 13).fill(POT).stroke({ color: O, width: OUTLINE })
  g.circle(cx, cy, 10).fill(shade(POT, -0.25))
  g.circle(cx, cy, 8).fill(palette.mudDeep)
  const leaves = 9
  for (let i = 0; i < leaves; i++) {
    const a = (i / leaves) * Math.PI * 2 + rnd.range(-0.2, 0.2)
    leaf(g, cx, cy, a, rnd.range(19, 24), 5, i % 2 ? palette.tree : palette.treeLight)
  }
  for (let i = 0; i < 4; i++) leaf(g, cx, cy, (i / 4) * Math.PI * 2 + 0.6, 12, 4, palette.treeLight)
}

const waterCooler: ObjectPainter = (g, w, h) => {
  // Cuerpo, bandeja delantera con dos grifos (frío y caliente) y garrafa encima
  box(g, 10, 7, w - 20, h - 14, C.porcelain, 4)
  g.rect(w / 2 - 12, h - 15, 24, 6)
    .fill(shade(C.porcelain, -0.25))
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.circle(w / 2 - 6, h - 12, 2.5)
    .fill(palette.water)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.circle(w / 2 + 6, h - 12, 2.5)
    .fill(palette.warmLight)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  const by = h / 2 - 4
  g.circle(w / 2, by, 15)
    .fill(C.water)
    .stroke({ color: O, width: OUTLINE })
  g.circle(w / 2, by, 11).fill(shade(C.water, 0.12))
  // Brillo en media luna (moveTo: que el arco no arrastre una línea desde el último punto)
  g.moveTo(w / 2 + Math.cos(Math.PI * 1.05) * 12, by + Math.sin(Math.PI * 1.05) * 12)
    .arc(w / 2, by, 12, Math.PI * 1.05, Math.PI * 1.55)
    .stroke({ color: C.glass, width: 3 })
  g.circle(w / 2, by, 5)
    .fill(palette.waterEdge)
    .stroke({ color: O, width: OUTLINE_DETAIL })
}

// ── Campo, exterior y gradas ─────────────────────────────────────

const dugout: ObjectPainter = (g, w, h, _rnd, _tier, club = DEFAULT_CLUB_COLORS) => {
  // Pared del fondo, asientos del club con respaldo y cubierta de metacrilato
  g.rect(4, 4, w - 8, 10)
    .fill(palette.stoneDark)
    .stroke({ color: O, width: OUTLINE })
  const seats = Math.floor((w - 16) / 22)
  for (let i = 0; i < seats; i++) {
    box(g, 10 + i * 22, 17, 18, 19, club.primary, 4)
    g.rect(12 + i * 22, 18, 14, 4).fill(shade(club.primary, -0.3))
  }
  g.roundRect(2, 2, w - 4, h * 0.72, 8)
    .fill({ color: C.glass, alpha: 0.35 })
    .stroke({ color: C.metalDark, width: 2 })
  for (const x of [4, w - 8]) g.rect(x, 2, 4, h * 0.72).fill(C.metalDark)
}

const trainingGoal: ObjectPainter = (g, w, h) => {
  // Red detrás (arriba) y palos con larguero delante (abajo)
  g.rect(6, 6, w - 12, h - 18).fill({ color: palette.chalk, alpha: 0.25 })
  for (let x = 10; x < w - 6; x += 7) line(g, x, 6, x, h - 12, palette.chalk, OUTLINE_DETAIL)
  for (let y = 10; y < h - 12; y += 7) line(g, 6, y, w - 6, y, palette.chalk, OUTLINE_DETAIL)
  g.rect(6, 6, w - 12, h - 18).stroke({ color: C.metal, width: OUTLINE })
  g.rect(4, h - 14, w - 8, 6)
    .fill(palette.chalk)
    .stroke({ color: O, width: OUTLINE })
  for (const x of [4, w - 10])
    g.rect(x, h - 16, 6, 10)
      .fill(palette.chalk)
      .stroke({ color: O, width: OUTLINE })
}

const cornerFlag: ObjectPainter = (g, w, h, _rnd, _tier, club = DEFAULT_CLUB_COLORS) => {
  // Banderín amarillo con el pico del club, y el poste en su base
  const x = w / 2 - 4
  const y = h / 2 + 4
  g.poly([x, y, x + 22, y - 10, x, y - 20])
    .fill(palette.warmLight)
    .stroke({ color: O, width: OUTLINE })
  g.poly([x, y, x + 11, y - 5, x, y - 10]).fill(club.primary)
  g.circle(x, y, 4).fill(palette.chalk).stroke({ color: O, width: OUTLINE })
}

/** Copas del roble: (dx, dy, radio relativo) respecto al centro, en unidades de `size`. */
const TREE_CROWNS: readonly (readonly [number, number, number])[] = [
  [0, 0, 1],
  [-0.62, -0.3, 0.7],
  [0.58, -0.4, 0.72],
  [0.42, 0.55, 0.74],
  [-0.5, 0.5, 0.7],
  [0.05, -0.68, 0.66],
  [0.78, 0.12, 0.6],
]

/**
 * Roble frondoso centrado en (cx, cy): siete copas superpuestas con contorno
 * solo exterior, un tono interior más oscuro y luces arriba a la izquierda (de
 * donde viene la luz). Lo comparten el objeto `tree` y el decorado de la
 * entrada. Con `shadow`, pinta antes la sombra de las copas (el decorado no
 * pasa por el marcador, que es quien la pone a los objetos).
 */
export function paintTree(
  g: Graphics,
  cx: number,
  cy: number,
  size: number,
  rnd: Random,
  shadow = false,
): void {
  const crowns = TREE_CROWNS.map(([dx, dy, k]): [number, number, number] => [
    cx + dx * size,
    cy + dy * size,
    k * size * rnd.range(0.9, 1.1),
  ])
  if (shadow)
    for (const [x, y, r] of crowns)
      g.circle(x + SHADOW_OFFSET, y + SHADOW_OFFSET, r + 2).fill({ color: O, alpha: SHADOW_ALPHA })
  for (const [x, y, r] of crowns) g.circle(x, y, r + 2).fill(palette.treeOutline)
  for (const [x, y, r] of crowns) g.circle(x, y, r).fill(palette.tree)
  for (const [x, y, r] of crowns)
    g.circle(x + r * 0.22, y + r * 0.22, r * 0.62).fill(shade(palette.tree, -0.1))
  for (const [x, y, r] of crowns.slice(0, 4))
    g.ellipse(x - r * 0.32, y - r * 0.36, r * 0.46, r * 0.3).fill(palette.treeLight)
}

const tree: ObjectPainter = (g, w, h, rnd) => {
  paintTree(g, w / 2, h / 2, Math.min(w, h) * rnd.range(0.38, 0.42), rnd)
}

/**
 * Farola centrada en (cx, cy): charco de luz cálida de radio `glow`, base,
 * poste y luminaria. La comparten el objeto `streetLamp` y la entrada.
 */
export function paintStreetLamp(
  g: Graphics,
  cx: number,
  cy: number,
  glow: number,
  shadow = false,
): void {
  g.circle(cx, cy, glow).fill({ color: palette.warmLight, alpha: 0.12 })
  if (shadow)
    g.circle(cx + SHADOW_OFFSET, cy + SHADOW_OFFSET, 9).fill({ color: O, alpha: SHADOW_ALPHA })
  g.circle(cx, cy + 4, 9)
    .fill(palette.stoneDark)
    .stroke({ color: O, width: OUTLINE })
  box(g, cx - 7, cy - 18, 14, 16, palette.stone, 4)
  g.circle(cx, cy - 10, 4).fill(palette.warmLight)
}

const streetLamp: ObjectPainter = (g, w, h) => {
  paintStreetLamp(g, w / 2, h / 2, w * 0.8)
}

const bin: ObjectPainter = (g, w, h) => {
  // Papelera verde oscuro con bolsa dentro y tapa abatible arriba
  const body = shade(palette.treeLight, -0.15)
  g.circle(w / 2, h / 2 + 2, 15)
    .fill(body)
    .stroke({ color: O, width: OUTLINE })
  g.circle(w / 2, h / 2 + 2, 11).fill(shade(body, -0.4))
  g.circle(w / 2, h / 2 + 2, 8).fill(palette.slate)
  g.circle(w / 2 - 3, h / 2 - 1, 3).fill(palette.chalk)
  g.rect(w / 2 - 7, h / 2 - 17, 14, 5)
    .fill(shade(body, 0.2))
    .stroke({ color: O, width: OUTLINE_DETAIL })
}

const parkBench: ObjectPainter = (g, w, h, rnd) => {
  // Patas de hierro, respaldo (arriba, más oscuro) y tablas del asiento con veta
  for (const x of [10, w - 16])
    g.rect(x, h / 2 - 16, 6, 32)
      .fill(SCREEN.case)
      .stroke({ color: O, width: OUTLINE_DETAIL })
  for (let i = 0; i < 3; i++) {
    const y = h / 2 - 15 + i * 10
    const color = i === 0 ? shade(C.wood, -0.15) : C.wood
    box(g, 4, y, w - 8, 8, color, 2)
    line(
      g,
      8 + rnd.range(0, 20),
      y + 4,
      w / 2 + rnd.range(-10, 10),
      y + 4,
      shade(color, -0.2),
      OUTLINE_DETAIL,
    )
  }
}

const fountain: ObjectPainter = (g, w, h) => {
  // Pila de piedra con borde, agua con ondas y surtidor en el centro
  g.circle(w / 2, h / 2, 23)
    .fill(palette.stone)
    .stroke({ color: O, width: OUTLINE })
  g.circle(w / 2, h / 2, 21).stroke({ color: shade(palette.stone, 0.2), width: 2 })
  g.circle(w / 2, h / 2, 17)
    .fill(C.water)
    .stroke({ color: palette.waterEdge, width: OUTLINE_DETAIL })
  g.circle(w / 2, h / 2, 11).stroke({ color: C.glass, width: OUTLINE_DETAIL })
  g.circle(w / 2 - 6, h / 2 - 6, 4).fill(C.glass)
  g.circle(w / 2, h / 2, 5)
    .fill(palette.stoneDark)
    .stroke({ color: O, width: OUTLINE })
  g.circle(w / 2, h / 2, 2).fill(palette.chalk)
}

// ── Salud, gimnasio y cafetería ──────────────────────────────────

const physioTable: ObjectPainter = (g, w, h) => {
  // Patas, colchoneta con almohada, toalla y agujero facial
  for (const x of [10, w - 16]) g.rect(x, 6, 6, h - 12).fill(C.metalDark)
  box(g, 4, 9, w - 8, h - 18, C.teal, 6)
  box(g, 9, 13, 28, h - 26, shade(C.teal, 0.2), 6)
  g.ellipse(22, h / 2, 6, 5).fill(shade(C.teal, -0.35))
  box(g, w - 42, 13, 24, h - 26, palette.chalk, 3)
  line(g, w - 38, h / 2, w - 22, h / 2, shade(palette.chalk, -0.2), OUTLINE_DETAIL)
}

const weightsBench: ObjectPainter = (g, w, h) => {
  // Soportes, banco acolchado y barra con discos
  for (const x of [w * 0.28, w * 0.72])
    g.rect(x - 3, h * 0.2, 6, 18)
      .fill(C.metalDark)
      .stroke({ color: O, width: OUTLINE_DETAIL })
  box(g, w / 2 - 13, h * 0.3, 26, h * 0.62, SCREEN.case, 6)
  line(g, w / 2 - 6, h * 0.45, w / 2 + 6, h * 0.45, palette.slate, OUTLINE_DETAIL)
  g.rect(6, h * 0.24, w - 12, 5)
    .fill(C.metal)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  for (const x of [6, w - 20]) {
    g.roundRect(x, h * 0.24 - 13, 14, 31, 3)
      .fill(SCREEN.case)
      .stroke({ color: O, width: OUTLINE_DETAIL })
    g.rect(x + 4, h * 0.24 - 10, 6, 25).fill(palette.slate)
  }
}

const exerciseBike: ObjectPainter = (g, w, h, _rnd, _tier, club = DEFAULT_CLUB_COLORS) => {
  // Bastidor, volante (arriba), manillar, carcasa del club y sillín (abajo)
  g.roundRect(w / 2 - 6, 8, 12, h - 16, 4)
    .fill(C.metalDark)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.ellipse(w / 2, 22, 9, 17)
    .fill(SCREEN.case)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.ellipse(w / 2, 22, 4, 10).fill(palette.slate)
  g.rect(w / 2 - 18, 40, 36, 5)
    .fill(C.metal)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  box(g, w / 2 - 11, h / 2 - 5, 22, 16, club.primary, 3)
  g.roundRect(w / 2 - 10, h - 40, 20, 24, 6)
    .fill(SCREEN.case)
    .stroke({ color: O, width: OUTLINE_DETAIL })
}

const barCounter: ObjectPainter = (g, w, h, rnd) => {
  // Barra con veta, encimera hacia los clientes (abajo) y botellas detrás
  box(g, 2, 5, w - 4, h - 14, C.wood, 4)
  grain(g, 4, 22, w - 8, h - 46, C.wood, rnd)
  box(g, 2, h - 24, w - 4, 15, shade(C.woodLight, 0.05), 3)
  const bottles = [palette.tree, palette.mudDeep, palette.warmLight, palette.waterEdge]
  for (let x = 12; x < w - 10; x += 14)
    g.circle(x, 15, 4.5)
      .fill(bottles[((x / 14) % bottles.length) | 0] ?? palette.tree)
      .stroke({ color: O, width: OUTLINE_DETAIL })
  // Grifo de cerveza y vasos
  g.rect(w / 2 - 3, h - 31, 6, 11)
    .fill(C.metal)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  for (const x of [w * 0.25, w * 0.7])
    g.circle(x, h - 16, 4.5)
      .fill(C.glass)
      .stroke({ color: O, width: OUTLINE_DETAIL })
}

const vendingMachine: ObjectPainter = (g, w, h, _rnd, _tier, club = DEFAULT_CLUB_COLORS) => {
  // Carcasa del club, rótulo arriba y escaparate (frente) con productos
  box(g, 6, 5, w - 12, h - 10, club.primary, 3)
  g.rect(10, 10, w - 20, 8).fill(shade(club.primary, 0.25))
  g.rect(10, h - 27, w - 20, 17)
    .fill(C.glass)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  const items = [palette.warmLight, palette.waterEdge, palette.tree, palette.chalk]
  for (let i = 0; i < 6; i++)
    g.rect(13 + i * 6.5, h - 24, 4.5, 11).fill(items[i % items.length] ?? palette.chalk)
  g.rect(w - 14, 22, 4, 8).fill(O)
}

const cafeTable: ObjectPainter = (g, w, h, rnd, _tier, club = DEFAULT_CLUB_COLORS) => {
  // Cuatro sillas del club alrededor de una mesa redonda con veta y una taza
  for (const [x, y] of [
    [w / 2, 10],
    [w / 2, h - 10],
    [10, h / 2],
    [w - 10, h / 2],
  ] as const) {
    g.roundRect(x - 10, y - 10, 20, 20, 5)
      .fill(club.primary)
      .stroke({ color: O, width: OUTLINE })
    g.roundRect(x - 6, y - 6, 12, 12, 3).fill(shade(club.primary, 0.15))
  }
  const r = Math.min(w, h) * 0.32
  g.circle(w / 2, h / 2, r)
    .fill(C.woodLight)
    .stroke({ color: O, width: OUTLINE })
  for (let i = 0; i < 3; i++)
    g.circle(w / 2, h / 2, r * (0.3 + 0.2 * i + rnd.range(-0.03, 0.03))).stroke({
      color: shade(C.woodLight, -0.15),
      width: OUTLINE_DETAIL,
    })
  g.circle(w / 2 + 7, h / 2 - 5, 5)
    .fill(palette.chalk)
    .stroke({ color: O, width: OUTLINE_DETAIL })
  g.circle(w / 2 + 7, h / 2 - 5, 3).fill(palette.mudDeep)
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
