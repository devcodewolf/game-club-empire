/**
 * Dibujo de la entrada de la ciudad deportiva a partir de `ENTRANCE_PROPS`.
 *
 * Cada `kind` tiene su función de dibujo, siguiendo la guía de estilo:
 * contorno oscuro, sombra plana abajo a la derecha y segundos tonos (sin
 * degradados). Es decorado fijo: se dibuja una vez y no cambia.
 */
import { Container, Graphics, Text } from 'pixi.js'
import type { EntranceProp } from '@/content/entrance'
import type { TileCoord, TileRect } from '@/sim/geometry'
import { shade } from './color'
import { TILE_SIZE } from './grid'
import { palette } from './palette'
import { createRandom, type Random } from './random'

const T = TILE_SIZE
const SHADOW = 4
const OUTLINE = 1.5

/** Colores propios del decorado, derivados de la paleta. */
const COLORS = {
  shadow: palette.outline,
  booth: shade(palette.chalk, -0.06),
  roof: palette.stone,
  glass: palette.water,
  barrierRed: 0xb5523b,
  line: palette.chalk,
  yellowLine: palette.warmLight,
  metal: palette.stoneDark,
  carColors: [0x8c2f39, 0x3f6fa8, palette.chalk, 0x3e4347, palette.warmLight, 0x557f37],
} as const

export function drawEntrance(
  layer: Container,
  props: readonly EntranceProp[],
  mapHeight: number,
): void {
  const root = new Container({ label: 'entrance' })
  const g = new Graphics()
  const labels: Text[] = []
  const rnd = createRandom(1987)
  root.addChild(g)

  // Primero lo plano (marcas en el suelo), luego lo que tiene volumen, al final los rótulos.
  const order: EntranceProp['kind'][] = [
    'laneMarkings',
    'parkingBays',
    'loadingBays',
    'planter',
    'warehouse',
    'booth',
    'barrier',
    'fence',
    'lamp',
    'tree',
    'label',
  ]
  for (const kind of order) {
    for (const prop of props) {
      if (prop.kind !== kind) continue
      drawProp(g, prop, rnd, mapHeight, labels)
    }
  }

  root.addChild(...labels)
  layer.addChild(root)
}

function drawProp(
  g: Graphics,
  prop: EntranceProp,
  rnd: Random,
  mapHeight: number,
  labels: Text[],
): void {
  switch (prop.kind) {
    case 'fence':
      return drawFence(g, prop.x, prop.gap, mapHeight)
    case 'booth':
      return drawBooth(g, prop.rect, prop.facing, labels)
    case 'barrier':
      return drawBarrier(g, prop.x, prop.pivotY, prop.length, prop.direction)
    case 'tree':
      return drawTree(g, prop.tile, rnd)
    case 'lamp':
      return drawLamp(g, prop.tile)
    case 'planter':
      return drawPlanter(g, prop.rect, rnd)
    case 'parkingBays':
      return drawParkingBays(g, prop.rect, prop.stallWidth, prop.openSide, rnd)
    case 'loadingBays':
      return drawLoadingBays(g, prop.rect, prop.count)
    case 'warehouse':
      return drawWarehouse(g, prop.rect, prop.docks)
    case 'laneMarkings':
      return drawLaneMarkings(g, prop.rect, prop.stopLineX)
    case 'label':
      labels.push(createLabel(prop.text, prop.tile))
      return
  }
}

// ── Valla y control de acceso ────────────────────────────────────

/**
 * Valla metálica a lo largo de la columna, con puerta (hueco) en el acceso:
 * dos raíles, postes cada casilla y aspas que sugieren la malla.
 */
function drawFence(
  g: Graphics,
  x: number,
  gap: { y: number; height: number },
  mapHeight: number,
): void {
  const cx = x * T + T / 2
  const left = cx - 6
  const right = cx + 6
  const segments: Array<[number, number]> = [
    [0, gap.y * T],
    [(gap.y + gap.height) * T, mapHeight * T],
  ]
  for (const [y1, y2] of segments) {
    // Sombra de toda la valla
    g.rect(left + SHADOW, y1 + SHADOW, right - left, y2 - y1).fill({
      color: COLORS.shadow,
      alpha: 0.25,
    })
    // Malla: aspas entre los raíles
    for (let y = y1; y < y2; y += 16) {
      g.moveTo(left, y).lineTo(right, y + 16)
      g.moveTo(right, y).lineTo(left, y + 16)
    }
    g.stroke({ color: palette.stone, width: 1.5 })
    // Raíles
    g.moveTo(left, y1).lineTo(left, y2).moveTo(right, y1).lineTo(right, y2)
    g.stroke({ color: COLORS.metal, width: 3 })
    // Postes cada casilla
    for (let y = y1 + T / 2; y < y2; y += T) {
      g.rect(cx - 8, y - 8, 16, 16)
        .fill(palette.stone)
        .stroke({ color: palette.outline, width: OUTLINE })
      g.rect(cx - 4, y - 4, 8, 8).fill(palette.stoneDark)
    }
  }
  // Pilares de la puerta
  for (const y of [gap.y * T, (gap.y + gap.height) * T]) {
    g.rect(cx - 14 + SHADOW, y - 14 + SHADOW, 28, 28).fill({ color: COLORS.shadow, alpha: 0.35 })
    g.rect(cx - 14, y - 14, 28, 28)
      .fill(palette.stoneDark)
      .stroke({ color: palette.outline, width: OUTLINE })
    g.rect(cx - 9, y - 9, 18, 18).fill(palette.stone)
    g.circle(cx, y, 4).fill(palette.warmLight)
  }
}

/**
 * Garita de seguridad: tejado de pizarra con peto blanco, ventanas en tres
 * lados (la principal hacia el carril), puerta hacia la valla, baliza ámbar,
 * aire acondicionado y rótulo "SEGURIDAD".
 */
function drawBooth(g: Graphics, rect: TileRect, facing: 'north' | 'south', labels: Text[]): void {
  const x = rect.x * T
  const y = rect.y * T
  const w = rect.width * T
  const h = rect.height * T
  const parapet = 7

  g.rect(x + SHADOW * 2, y + SHADOW * 2, w, h).fill({ color: COLORS.shadow, alpha: 0.4 })
  // Peto (borde blanco del tejado) y cubierta de pizarra
  g.rect(x, y, w, h).fill(palette.chalk).stroke({ color: palette.outline, width: OUTLINE })
  g.rect(x + parapet, y + parapet, w - parapet * 2, h - parapet * 2).fill(palette.slate)
  for (let ry = y + parapet + 10; ry < y + h - parapet; ry += 10) {
    g.moveTo(x + parapet, ry)
      .lineTo(x + w - parapet, ry)
      .stroke({ color: palette.slateRows, width: 1.5 })
  }
  g.rect(x + parapet, y + parapet, w - parapet * 2, h - parapet * 2).stroke({
    color: palette.outline,
    width: 1,
  })

  // Ventanas: corrida hacia el carril y una en cada lateral
  const glassY = facing === 'south' ? y + h - 4 : y - 2
  g.rect(x + 12, glassY, w - 24, 6)
    .fill(COLORS.glass)
    .stroke({ color: palette.outline, width: 1 })
  for (const gx of [x - 2, x + w - 4]) {
    g.rect(gx, y + h * 0.25, 6, h * 0.5)
      .fill(COLORS.glass)
      .stroke({ color: palette.outline, width: 1 })
  }
  // Puerta (lado de la valla)
  g.rect(x + w - 30, facing === 'south' ? y - 4 : y + h - 2, 22, 6)
    .fill(palette.wood)
    .stroke({ color: palette.outline, width: 1 })

  // Aire acondicionado y baliza ámbar
  g.rect(x + 16, y + 16, 30, 22)
    .fill(palette.stone)
    .stroke({ color: palette.outline, width: 1 })
  g.circle(x + 31, y + 27, 7)
    .fill(palette.stoneDark)
    .stroke({ color: palette.outline, width: 1 })
  g.circle(x + w - 22, y + 22, 9).fill({ color: palette.warmLight, alpha: 0.35 })
  g.circle(x + w - 22, y + 22, 5)
    .fill(palette.warmLight)
    .stroke({ color: palette.outline, width: 1 })

  labels.push(
    createLabel(
      'SEGURIDAD',
      { x: rect.x + rect.width / 2 - 0.5, y: rect.y + rect.height / 2 - 0.25 },
      20,
    ),
  )
}

/** Barrera: caja del motor junto a la garita y brazo a franjas rojas y blancas. */
function drawBarrier(
  g: Graphics,
  x: number,
  pivotY: number,
  length: number,
  direction: 1 | -1,
): void {
  const cx = x * T + T / 2
  const py = pivotY * T + direction * 10
  const armLength = length * T - 18
  const top = direction === 1 ? py : py - armLength

  // Brazo con franjas
  g.rect(cx - 5 + SHADOW, top + SHADOW, 10, armLength).fill({ color: COLORS.shadow, alpha: 0.3 })
  for (let s = 0; s < armLength; s += 24) {
    const segment = Math.min(24, armLength - s)
    const sy = direction === 1 ? py + s : py - s - segment
    g.rect(cx - 5, sy, 10, segment).fill((s / 24) % 2 === 0 ? COLORS.barrierRed : palette.chalk)
  }
  g.rect(cx - 5, top, 10, armLength).stroke({ color: palette.outline, width: 1 })
  // Caja del motor
  g.rect(cx - 12 + SHADOW, py - 12 * direction - 12 + SHADOW, 24, 24).fill({
    color: COLORS.shadow,
    alpha: 0.35,
  })
  g.rect(cx - 12, py - 12 * direction - 12, 24, 24)
    .fill(palette.warmLight)
    .stroke({ color: palette.outline, width: OUTLINE })
  g.circle(cx, py - 12 * direction, 5).fill(palette.outline)
}

/** Marcas viales del acceso: línea central discontinua y línea de detención. */
function drawLaneMarkings(g: Graphics, rect: TileRect, stopLineX: number): void {
  const midY = (rect.y + rect.height / 2) * T
  for (let x = rect.x * T + T; x < (rect.x + rect.width - 4) * T; x += T * 2) {
    g.moveTo(x, midY).lineTo(x + T, midY)
  }
  g.stroke({ color: COLORS.line, width: 5, alpha: 0.85 })
  g.moveTo(stopLineX * T, rect.y * T + 8)
    .lineTo(stopLineX * T, (rect.y + rect.height) * T - 8)
    .stroke({ color: COLORS.line, width: 9, alpha: 0.9 })
}

// ── Aparcamiento y recepción de mercancías ───────────────────────

/** Plazas pintadas; algunas con coches aparcados. */
function drawParkingBays(
  g: Graphics,
  rect: TileRect,
  stallWidth: number,
  openSide: 'north' | 'south',
  rnd: Random,
): void {
  const x0 = rect.x * T
  const y0 = rect.y * T
  const h = rect.height * T
  const backY = openSide === 'south' ? y0 : y0 + h

  for (let s = 0; s <= rect.width; s += stallWidth) {
    g.moveTo(x0 + s * T, y0 + 6).lineTo(x0 + s * T, y0 + h - 6)
  }
  g.moveTo(x0, backY).lineTo(x0 + rect.width * T, backY)
  g.stroke({ color: COLORS.line, width: 5, alpha: 0.85 })

  // Coches en algunas plazas (siempre los mismos: generador con semilla)
  for (let s = 0; s + stallWidth <= rect.width; s += stallWidth) {
    if (rnd.next() < 0.45) continue
    const carW = stallWidth * T - 40
    const carH = h - 70
    const cx = x0 + s * T + 20
    const cy = openSide === 'south' ? y0 + 22 : y0 + 48
    drawCar(g, cx, cy, carW, carH, rnd.pick(COLORS.carColors))
  }
}

/** Coche visto desde arriba: carrocería, techo y lunas. */
function drawCar(g: Graphics, x: number, y: number, w: number, h: number, color: number): void {
  g.roundRect(x + SHADOW, y + SHADOW, w, h, 18).fill({ color: COLORS.shadow, alpha: 0.35 })
  g.roundRect(x, y, w, h, 18).fill(color).stroke({ color: palette.outline, width: OUTLINE })
  g.roundRect(x + 10, y + h * 0.3, w - 20, h * 0.4, 10).fill(shade(color, -0.15))
  g.roundRect(x + 12, y + h * 0.18, w - 24, h * 0.12, 6).fill(COLORS.glass)
  g.roundRect(x + 12, y + h * 0.72, w - 24, h * 0.1, 6).fill(shade(COLORS.glass, -0.15))
}

/** Muelles de carga: separadores amarillos, topes y un camión en el primero. */
function drawLoadingBays(g: Graphics, rect: TileRect, count: number): void {
  const x0 = rect.x * T
  const y0 = rect.y * T
  const w = rect.width * T
  const h = rect.height * T
  const bay = w / count

  for (let i = 0; i <= count; i++) g.moveTo(x0 + i * bay, y0).lineTo(x0 + i * bay, y0 + h)
  g.stroke({ color: COLORS.yellowLine, width: 7 })
  // Zona de no aparcar (rayado) delante de los muelles
  for (let x = x0; x < x0 + w; x += 28) g.moveTo(x, y0).lineTo(x + 20, y0 - 20)
  g.stroke({ color: COLORS.yellowLine, width: 4, alpha: 0.7 })

  // Camión en el primer muelle, marcha atrás hacia la nave
  const truckX = x0 + 26
  const truckW = bay - 52
  drawTruck(g, truckX, y0 - T * 2.5, truckW, h + T * 2.4)
}

function drawTruck(g: Graphics, x: number, y: number, w: number, h: number): void {
  const cab = h * 0.22
  g.rect(x + SHADOW * 2, y + SHADOW * 2, w, h).fill({ color: COLORS.shadow, alpha: 0.35 })
  // Cabina (arriba) y caja (abajo, hacia el muelle)
  g.roundRect(x + 6, y, w - 12, cab, 10)
    .fill(palette.chalk)
    .stroke({ color: palette.outline, width: OUTLINE })
  g.rect(x + 14, y + 8, w - 28, cab * 0.3).fill(COLORS.glass)
  g.rect(x, y + cab + 4, w, h - cab - 4)
    .fill(palette.stone)
    .stroke({ color: palette.outline, width: OUTLINE })
  for (let ry = y + cab + 20; ry < y + h - 10; ry += 22) {
    g.moveTo(x + 6, ry)
      .lineTo(x + w - 6, ry)
      .stroke({ color: shade(palette.stone, -0.15), width: 2 })
  }
}

/** Nave de recepción: cubierta de chapa a dos aguas y puertas de muelle. */
function drawWarehouse(g: Graphics, rect: TileRect, docks: number): void {
  const x = rect.x * T
  const y = rect.y * T
  const w = rect.width * T
  const h = rect.height * T
  const roof = palette.slate

  g.rect(x + SHADOW * 2, y + SHADOW * 2, w, h).fill({ color: COLORS.shadow, alpha: 0.35 })
  g.rect(x, y, w, h).fill(roof).stroke({ color: palette.outline, width: OUTLINE })
  // Chapa ondulada: líneas perpendiculares a la cumbrera
  for (let cx = x + 10; cx < x + w; cx += 12) {
    g.moveTo(cx, y + 2)
      .lineTo(cx, y + h - 2)
      .stroke({ color: palette.slateRows, width: 2 })
  }
  // Cumbrera
  g.rect(x, y + h / 2 - 6, w, 12)
    .fill(palette.stoneDark)
    .stroke({ color: palette.outline, width: 1 })
  // Claraboyas
  for (let i = 0; i < 4; i++) {
    g.rect(x + w * (0.15 + i * 0.2), y + h * 0.18, 40, 26)
      .fill(COLORS.glass)
      .stroke({ color: palette.outline, width: 1 })
  }
  // Puertas de muelle en la fachada que da al patio (arriba)
  const bay = w / docks
  for (let i = 0; i < docks; i++) {
    const dx = x + i * bay + bay * 0.2
    const dw = bay * 0.6
    g.rect(dx, y - 8, dw, 12)
      .fill(palette.stone)
      .stroke({ color: palette.outline, width: 1 })
    for (let s = dx + 6; s < dx + dw; s += 8) g.moveTo(s, y - 8).lineTo(s, y + 4)
    g.stroke({ color: palette.stoneDark, width: 1 })
    // Topes de goma
    g.rect(dx - 8, y - 12, 8, 10).fill(palette.outline)
    g.rect(dx + dw, y - 12, 8, 10).fill(palette.outline)
  }
}

// ── Vegetación y mobiliario ──────────────────────────────────────

/**
 * Roble frondoso que llena sus 2×2 casillas: siete copas superpuestas con
 * contorno solo exterior, un tono interior más oscuro y luces arriba a la
 * izquierda (de donde viene la luz).
 */
function drawTree(g: Graphics, tile: TileCoord, rnd: Random): void {
  const cx = (tile.x + 1) * T
  const cy = (tile.y + 1) * T
  const size = T * rnd.range(0.8, 0.9)
  const offsets: Array<[number, number, number]> = [
    [0, 0, 1],
    [-0.62, -0.3, 0.7],
    [0.58, -0.4, 0.72],
    [0.42, 0.55, 0.74],
    [-0.5, 0.5, 0.7],
    [0.05, -0.68, 0.66],
    [0.78, 0.12, 0.6],
  ]
  const crowns = offsets.map(([dx, dy, k]): [number, number, number] => [
    cx + dx * size,
    cy + dy * size,
    k * size * rnd.range(0.9, 1.1),
  ])

  for (const [x, y, r] of crowns)
    g.circle(x + SHADOW * 3, y + SHADOW * 3, r).fill({ color: palette.grassShadow })
  for (const [x, y, r] of crowns) g.circle(x, y, r + 2).fill(palette.treeOutline)
  for (const [x, y, r] of crowns) g.circle(x, y, r).fill(palette.tree)
  // Volumen: sombra interior abajo a la derecha y luces arriba a la izquierda
  for (const [x, y, r] of crowns)
    g.circle(x + r * 0.22, y + r * 0.22, r * 0.62).fill(shade(palette.tree, -0.1))
  for (const [x, y, r] of crowns.slice(0, 4)) {
    g.ellipse(x - r * 0.32, y - r * 0.36, r * 0.46, r * 0.3).fill(palette.treeLight)
  }
}

/** Farola: charco de luz cálida, poste y luminaria. */
function drawLamp(g: Graphics, tile: TileCoord): void {
  const cx = tile.x * T + T / 2
  const cy = tile.y * T + T / 2
  g.circle(cx, cy, T * 1.1).fill({ color: palette.warmLight, alpha: 0.12 })
  g.circle(cx + 3, cy + 3, 9).fill({ color: COLORS.shadow, alpha: 0.35 })
  g.circle(cx, cy, 9).fill(palette.stoneDark).stroke({ color: palette.outline, width: 1 })
  g.roundRect(cx - 7, cy - 22, 14, 16, 4)
    .fill(palette.stone)
    .stroke({ color: palette.outline, width: 1 })
  g.circle(cx, cy - 14, 4).fill(palette.warmLight)
}

/** Jardinera: caja de madera con tierra y flores. */
function drawPlanter(g: Graphics, rect: TileRect, rnd: Random): void {
  const x = rect.x * T + 6
  const y = rect.y * T + 10
  const w = rect.width * T - 12
  const h = rect.height * T - 20
  g.rect(x + SHADOW, y + SHADOW, w, h).fill({ color: COLORS.shadow, alpha: 0.35 })
  g.rect(x, y, w, h).fill(palette.wood).stroke({ color: palette.outline, width: OUTLINE })
  g.rect(x + 5, y + 5, w - 10, h - 10).fill(palette.mudDeep)
  const flowers = [palette.warmLight, palette.chalk, 0xd9706a, palette.waterShine]
  for (let i = 0; i < 14; i++) {
    const fx = x + rnd.range(9, w - 9)
    const fy = y + rnd.range(9, h - 9)
    g.circle(fx, fy, 5).fill(palette.treeLight)
    g.circle(fx, fy, 2.5).fill(rnd.pick(flowers))
  }
}

/** Rótulo pintado en el suelo / sobre el tejado. */
function createLabel(text: string, tile: TileCoord, fontSize = 34): Text {
  const label = new Text({
    text,
    style: {
      fontSize,
      fill: palette.chalk,
      stroke: { color: palette.outline, width: 6 },
      fontFamily: 'Trebuchet MS, sans-serif',
      fontWeight: 'bold',
    },
    resolution: 2,
  })
  label.anchor.set(0.5)
  label.position.set(tile.x * T + T / 2, tile.y * T + T / 2)
  label.alpha = 0.9
  return label
}
