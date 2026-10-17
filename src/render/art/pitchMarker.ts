/**
 * Dibujo de un terreno de juego: superficie, líneas de cal, porterías y las
 * dos zonas de banquillos junto a la banda (con sus banquillos si los tiene).
 *
 * Las medidas se calculan en PROPORCIÓN al terreno (reglamento de fútbol 11:
 * 105×68 m), así sirven igual para fútbol 11 y fútbol 7 y para cualquier giro.
 * El origen (0,0) es la esquina superior izquierda de la huella con margen.
 */
import { Container, Graphics, Text, type FillInput } from 'pixi.js'
import type { BuildingDef, PitchRole } from '@/sim/buildings/buildings'
import { rotateSize, type Rotation } from '@/sim/geometry'
import { TILE_SIZE } from '../core/grid'
import { palette } from '../palette'
import { shade } from '../core/color'
import { OUTLINE, OUTLINE_DETAIL, SHADOW_ALPHA } from '../style'
import { DEFAULT_CLUB_COLORS, type ClubColors } from '../core/clubColors'

/** Margen entre el borde de la huella y las líneas de banda, en casillas. */
const MARGIN_TILES = 2
const LINE = 5
const SHADOW_OFFSET = 4

/** Proporciones del reglamento respecto al largo (L) y al ancho (W) del terreno. */
const RATIO = {
  penaltyDepth: 16.5 / 105,
  penaltyWidth: 40.3 / 68,
  goalAreaDepth: 5.5 / 105,
  goalAreaWidth: 18.3 / 68,
  penaltySpot: 11 / 105,
  circleRadius: 9.15 / 105,
  goalWidth: 7.32 / 68,
  goalDepth: 2 / 105,
} as const

export function createPitchMarker(
  def: BuildingDef,
  rotation: Rotation,
  surface: FillInput,
  role?: PitchRole,
  benches?: number,
): Container {
  const tiles = rotateSize(def.size, rotation)
  const width = tiles.width * TILE_SIZE
  const height = tiles.height * TILE_SIZE
  const margin = MARGIN_TILES * TILE_SIZE

  const g = new Graphics()
    // Sombra plana y superficie
    .rect(SHADOW_OFFSET, SHADOW_OFFSET, width, height)
    .fill({ color: palette.grassShadow })
    .rect(0, 0, width, height)
    .fill(surface)
    .stroke({ width: 1.5, color: palette.outline, alignment: 1 })

  // El largo del terreno va siempre en el eje más largo de la huella.
  const horizontal = width >= height
  drawMarkings(g, margin, margin, width - margin * 2, height - margin * 2, horizontal)
  drawBenchZones(g, margin, margin, width - margin * 2, height - margin * 2, horizontal, benches)

  const marker = new Container({ label: `building:${def.id}` })
  marker.addChild(g)
  if (role) marker.addChild(createRoleLabel(role, width, margin))
  return marker
}

const ROLE_LABEL: Record<PitchRole, string> = {
  main: 'CAMPO PRINCIPAL',
  reserve: 'FILIAL',
  training: 'ENTRENAMIENTO',
}

/**
 * Uso del campo pintado en el margen superior, como un rótulo de cal sobre el
 * césped (el principal, algo más marcado).
 */
function createRoleLabel(role: PitchRole, width: number, margin: number): Text {
  const label = new Text({
    text: ROLE_LABEL[role],
    style: {
      fontSize: 44,
      fill: palette.chalk,
      fontFamily: 'Trebuchet MS, sans-serif',
      fontWeight: 'bold',
      letterSpacing: 6,
    },
    resolution: 2,
  })
  label.anchor.set(0.5)
  label.position.set(width / 2, margin / 2)
  label.alpha = role === 'main' ? 0.85 : 0.6
  return label
}

/**
 * Líneas de un terreno de (x, y, w, h). Si `horizontal`, las porterías están
 * a izquierda y derecha; si no, arriba y abajo. Para no duplicar la lógica,
 * se trabaja en un sistema "largo × ancho" y se convierte a x/y al dibujar.
 */
function drawMarkings(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean,
): void {
  const L = horizontal ? w : h
  const W = horizontal ? h : w
  /** Punto (a lo largo, a lo ancho) → (x, y) en el marcador. */
  const at = (along: number, across: number): [number, number] =>
    horizontal ? [x + along, y + across] : [x + across, y + along]
  /** Rectángulo en coordenadas largo/ancho. */
  const rect = (along: number, across: number, length: number, breadth: number): void => {
    const [rx, ry] = at(along, across)
    if (horizontal) g.rect(rx, ry, length, breadth)
    else g.rect(rx, ry, breadth, length)
  }

  // Banda, línea de medio campo y círculo central
  rect(0, 0, L, W)
  g.moveTo(...at(L / 2, 0)).lineTo(...at(L / 2, W))
  g.circle(...at(L / 2, W / 2), L * RATIO.circleRadius)

  for (const end of [0, 1] as const) {
    /** Distancia desde la línea de gol de este lado hacia el centro. */
    const from = (d: number): number => (end === 0 ? d : L - d)
    const depth = (d: number): number => (end === 0 ? 0 : -d)

    const pw = W * RATIO.penaltyWidth
    const pd = L * RATIO.penaltyDepth
    rect(from(0) + depth(pd), (W - pw) / 2, pd, pw)

    const gw = W * RATIO.goalAreaWidth
    const gd = L * RATIO.goalAreaDepth
    rect(from(0) + depth(gd), (W - gw) / 2, gd, gw)

    // Semicírculo del área: arco centrado en el punto de penalti, fuera del área
    const spot = at(from(L * RATIO.penaltySpot), W / 2)
    const r = L * RATIO.circleRadius
    const inside = Math.acos(Math.min(1, (pd - L * RATIO.penaltySpot) / r))
    const facing = horizontal ? (end === 0 ? 0 : Math.PI) : end === 0 ? Math.PI / 2 : -Math.PI / 2
    g.moveTo(spot[0] + Math.cos(facing - inside) * r, spot[1] + Math.sin(facing - inside) * r)
    g.arc(spot[0], spot[1], r, facing - inside, facing + inside)
  }
  g.stroke({ color: palette.chalk, width: LINE, alpha: 0.95 })

  // Puntos de penalti y centro
  for (const along of [L * RATIO.penaltySpot, L / 2, L - L * RATIO.penaltySpot]) {
    g.circle(...at(along, W / 2), LINE * 0.9).fill(palette.chalk)
  }

  // Porterías: red detrás de la línea de gol y palos
  const gw = W * RATIO.goalWidth
  const gdp = Math.max(L * RATIO.goalDepth, TILE_SIZE * 0.6)
  for (const end of [0, 1] as const) {
    const along = end === 0 ? -gdp : L
    rect(along, (W - gw) / 2, gdp, gw)
    g.fill({ color: palette.chalk, alpha: 0.35 }).stroke({ color: palette.stone, width: 2 })
    const lineAlong = end === 0 ? 0 : L
    g.moveTo(...at(lineAlong, (W - gw) / 2))
      .lineTo(...at(lineAlong, (W + gw) / 2))
      .stroke({ color: palette.outline, width: LINE + 3 })
    g.moveTo(...at(lineAlong, (W - gw) / 2))
      .lineTo(...at(lineAlong, (W + gw) / 2))
      .stroke({ color: palette.chalk, width: LINE })
  }
}

/** Largo de cada zona de banquillo respecto al largo del terreno, y su hueco en el centro. */
const BENCH_ZONE = { length: 0.13, gap: 0.05, maxLength: TILE_SIZE * 7 } as const
const DASH = 14

/** Línea discontinua de cal entre dos puntos. */
function dashedLine(g: Graphics, x1: number, y1: number, x2: number, y2: number): void {
  const length = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.max(1, Math.floor(length / (DASH * 2)))
  for (let i = 0; i < steps; i++) {
    const a = (i * 2 * DASH) / length
    const b = Math.min(1, ((i * 2 + 1) * DASH) / length)
    g.moveTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a).lineTo(x1 + (x2 - x1) * b, y1 + (y2 - y1) * b)
  }
}

/** Rectángulo en coordenadas del marcador. */
interface Box {
  readonly rx: number
  readonly ry: number
  readonly rw: number
  readonly rh: number
}

/**
 * Zonas de banquillos (local y visitante): dos rectángulos de cal discontinua
 * en el margen, fuera de la banda de abajo (o de la derecha si el campo está
 * en vertical), a los lados de la línea de medio campo. Con `benches` (nivel),
 * un banquillo en cada una, mirando al campo.
 */
function drawBenchZones(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean,
  benches: number | undefined,
): void {
  const L = horizontal ? w : h
  const W = horizontal ? h : w
  const margin = MARGIN_TILES * TILE_SIZE
  const zoneLength = Math.min(L * BENCH_ZONE.length, BENCH_ZONE.maxLength)
  const gap = L * BENCH_ZONE.gap
  // Fondo de la zona: casi todo el margen, separada de la banda y del borde
  const near = W + margin * 0.18
  const depth = margin * 0.62

  for (const start of [L / 2 - gap / 2 - zoneLength, L / 2 + gap / 2]) {
    /**
     * Rectángulo dentro de esta zona, en fracciones de su largo (a lo largo de
     * la banda) y de su fondo (0 junto al campo, 1 lejos) → marcador.
     */
    const zone = (a0: number, a1: number, c0: number, c1: number): Box => {
      const along = start + zoneLength * a0
      const across = near + depth * c0
      const length = zoneLength * (a1 - a0)
      const breadth = depth * (c1 - c0)
      return horizontal
        ? { rx: x + along, ry: y + across, rw: length, rh: breadth }
        : { rx: x + across, ry: y + along, rw: breadth, rh: length }
    }
    const { rx, ry, rw, rh } = zone(0, 1, 0, 1)
    dashedLine(g, rx, ry, rx + rw, ry)
    dashedLine(g, rx + rw, ry, rx + rw, ry + rh)
    dashedLine(g, rx + rw, ry + rh, rx, ry + rh)
    dashedLine(g, rx, ry + rh, rx, ry)
    g.stroke({ color: palette.chalk, width: LINE * 0.6, alpha: 0.7 })
    if (benches !== undefined) drawBench(g, zone, horizontal, benches, DEFAULT_CLUB_COLORS)
  }
}

/** Sombra plana de un rectángulo. */
function shadowBox(g: Graphics, { rx, ry, rw, rh }: Box): void {
  g.rect(rx + SHADOW_OFFSET, ry + SHADOW_OFFSET, rw, rh).fill({
    color: palette.outline,
    alpha: SHADOW_ALPHA,
  })
}

/** Líneas paralelas a lo ancho (perpendiculares a la banda) cada `step` px dentro de `box`. */
function crossLines(g: Graphics, { rx, ry, rw, rh }: Box, horizontal: boolean, step: number): void {
  const length = horizontal ? rw : rh
  for (let d = step; d < length - 1; d += step) {
    if (horizontal) g.moveTo(rx + d, ry).lineTo(rx + d, ry + rh)
    else g.moveTo(rx, ry + d).lineTo(rx + rw, ry + d)
  }
}

/** Asientos individuales en fila a lo largo de `box`, con el color del club. */
function seatRow(g: Graphics, box: Box, horizontal: boolean, colors: ClubColors): void {
  const length = horizontal ? box.rw : box.rh
  const breadth = horizontal ? box.rh : box.rw
  const count = Math.max(3, Math.floor(length / (breadth * 1.15)))
  const size = length / count
  for (let i = 0; i < count; i++) {
    const inset = size * 0.12
    const seat = horizontal
      ? { x: box.rx + i * size + inset, y: box.ry, w: size - inset * 2, h: breadth }
      : { x: box.rx, y: box.ry + i * size + inset, w: breadth, h: size - inset * 2 }
    g.roundRect(seat.x, seat.y, seat.w, seat.h, 3)
      .fill(colors.primary)
      .stroke({ color: palette.outline, width: OUTLINE_DETAIL })
    // Respaldo en el lado de fuera, con el color secundario
    const back = (horizontal ? seat.h : seat.w) * 0.3
    if (horizontal) g.rect(seat.x, seat.y + seat.h - back, seat.w, back)
    else g.rect(seat.x + seat.w - back, seat.y, back, seat.h)
    g.fill(shade(colors.primary, -0.3))
  }
}

/**
 * Banquillo visto desde arriba, por nivel:
 *  0. Banco de madera: tablones y respaldo por fuera.
 *  1. Techo de chapa: el banco con un tejadillo ondulado que cubre la parte de atrás.
 *  2. Cubierto con asientos: asientos del color del club bajo una marquesina transparente.
 *  3. De estadio: dos filas de asientos acolchados, marquesina de cristal y calefactores.
 */
function drawBench(
  g: Graphics,
  zone: (a0: number, a1: number, c0: number, c1: number) => Box,
  horizontal: boolean,
  tier: number,
  colors: ClubColors,
): void {
  const wood = palette.wood
  if (tier <= 1) {
    const seat = zone(0.1, 0.9, 0.18, 0.8)
    shadowBox(g, seat)
    g.rect(seat.rx, seat.ry, seat.rw, seat.rh)
      .fill(shade(wood, 0.4))
      .stroke({ color: palette.outline, width: OUTLINE })
    // Juntas de los tablones a lo largo del banco
    for (const c of [0.39, 0.59]) {
      const line = zone(0.1, 0.9, c, c)
      g.moveTo(line.rx, line.ry).lineTo(line.rx + line.rw, line.ry + line.rh)
    }
    g.stroke({ color: shade(wood, -0.1), width: OUTLINE_DETAIL })
    // Respaldo: listón oscuro en el lado de fuera (lejos del campo)
    const back = zone(0.1, 0.9, 0.63, 0.8)
    g.rect(back.rx, back.ry, back.rw, back.rh)
      .fill(shade(wood, -0.25))
      .stroke({ color: palette.outline, width: OUTLINE })
    if (tier === 0) return
    // Tejadillo de chapa ondulada sobre la parte de atrás, con su sombra
    const roof = zone(0.04, 0.96, 0.42, 0.98)
    shadowBox(g, roof)
    g.rect(roof.rx, roof.ry, roof.rw, roof.rh)
      .fill(palette.stone)
      .stroke({ color: palette.outline, width: OUTLINE })
    crossLines(g, roof, horizontal, 10)
    g.stroke({ color: palette.stoneDark, width: OUTLINE_DETAIL })
    return
  }

  // Niveles 2 y 3: estructura, asientos del club y marquesina
  const frame = zone(0.04, 0.96, 0.1, 0.96)
  shadowBox(g, frame)
  g.rect(frame.rx, frame.ry, frame.rw, frame.rh)
    .fill(shade(palette.stone, 0.25))
    .stroke({ color: palette.outline, width: OUTLINE })
  if (tier === 2) {
    seatRow(g, zone(0.08, 0.92, 0.36, 0.78), horizontal, colors)
  } else {
    seatRow(g, zone(0.08, 0.92, 0.22, 0.52), horizontal, colors)
    seatRow(g, zone(0.08, 0.92, 0.56, 0.86), horizontal, colors)
    // Calefactores: puntos de luz cálida en la parte de atrás
    for (const a of [0.2, 0.5, 0.8]) {
      const heater = zone(a - 0.02, a + 0.02, 0.88, 0.94)
      g.circle(heater.rx + heater.rw / 2, heater.ry + heater.rh / 2, 3).fill(palette.warmLight)
    }
  }
  // Marquesina transparente con reflejos
  const canopy = zone(0.04, 0.96, 0.1, 0.96)
  g.rect(canopy.rx, canopy.ry, canopy.rw, canopy.rh).fill({
    color: palette.waterShine,
    alpha: tier === 3 ? 0.35 : 0.25,
  })
  for (const a of [0.15, 0.55]) {
    const shine = zone(a, a + 0.12, 0.18, 0.3)
    g.rect(shine.rx, shine.ry, shine.rw, shine.rh).fill({ color: palette.chalk, alpha: 0.35 })
  }
  // Perfil de atrás de la marquesina
  const rail = zone(0.04, 0.96, 0.9, 0.96)
  g.rect(rail.rx, rail.ry, rail.rw, rail.rh)
    .fill(palette.stoneDark)
    .stroke({ color: palette.outline, width: OUTLINE_DETAIL })
}
