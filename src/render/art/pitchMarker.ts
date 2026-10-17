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
  benches = false,
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

/**
 * Zonas de banquillos (local y visitante): dos rectángulos de cal discontinua
 * en el margen, fuera de la banda de abajo (o de la derecha si el campo está
 * en vertical), a los lados de la línea de medio campo. Con `benches`, un
 * banco de madera con respaldo en cada una, mirando al campo.
 */
function drawBenchZones(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean,
  benches: boolean,
): void {
  const L = horizontal ? w : h
  const W = horizontal ? h : w
  const margin = MARGIN_TILES * TILE_SIZE
  const zoneLength = Math.min(L * BENCH_ZONE.length, BENCH_ZONE.maxLength)
  const gap = L * BENCH_ZONE.gap
  // Fondo de la zona: casi todo el margen, separada de la banda y del borde
  const near = W + margin * 0.18
  const depth = margin * 0.62
  /** Rectángulo (a lo largo, a lo ancho) → x, y, ancho, alto en el marcador. */
  const box = (along: number, across: number, length: number, breadth: number) =>
    horizontal
      ? { rx: x + along, ry: y + across, rw: length, rh: breadth }
      : { rx: x + across, ry: y + along, rw: breadth, rh: length }

  for (const start of [L / 2 - gap / 2 - zoneLength, L / 2 + gap / 2]) {
    const { rx, ry, rw, rh } = box(start, near, zoneLength, depth)
    dashedLine(g, rx, ry, rx + rw, ry)
    dashedLine(g, rx + rw, ry, rx + rw, ry + rh)
    dashedLine(g, rx + rw, ry + rh, rx, ry + rh)
    dashedLine(g, rx, ry + rh, rx, ry)
    g.stroke({ color: palette.chalk, width: LINE * 0.6, alpha: 0.7 })
    if (benches)
      drawBench(
        g,
        box(start + zoneLength * 0.1, near + depth * 0.18, zoneLength * 0.8, depth * 0.62),
        horizontal,
      )
  }
}

/** Banco de madera visto desde arriba: asiento de tablones y respaldo por fuera. */
function drawBench(
  g: Graphics,
  { rx, ry, rw, rh }: { rx: number; ry: number; rw: number; rh: number },
  horizontal: boolean,
): void {
  const wood = palette.wood
  g.rect(rx + SHADOW_OFFSET, ry + SHADOW_OFFSET, rw, rh).fill({
    color: palette.outline,
    alpha: SHADOW_ALPHA,
  })
  g.rect(rx, ry, rw, rh).fill(shade(wood, 0.4)).stroke({ color: palette.outline, width: OUTLINE })
  // Juntas de los tablones a lo largo del banco
  const planks = 3
  for (let i = 1; i < planks; i++) {
    if (horizontal) g.moveTo(rx, ry + (rh * i) / planks).lineTo(rx + rw, ry + (rh * i) / planks)
    else g.moveTo(rx + (rw * i) / planks, ry).lineTo(rx + (rw * i) / planks, ry + rh)
  }
  g.stroke({ color: shade(wood, -0.1), width: OUTLINE_DETAIL })
  // Respaldo: listón oscuro en el lado de fuera (lejos del campo)
  const back = Math.max(6, (horizontal ? rh : rw) * 0.28)
  if (horizontal) g.rect(rx, ry + rh - back, rw, back)
  else g.rect(rx + rw - back, ry, back, rh)
  g.fill(shade(wood, -0.25)).stroke({ color: palette.outline, width: OUTLINE })
}
