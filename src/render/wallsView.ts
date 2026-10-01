/**
 * Vista de muros y puertas, dibujada por trozos (como los suelos).
 *
 * Cada casilla de muro mira a sus 4 vecinas (autotiling) y se dibuja
 * conectada a ellas: esquinas, uniones en T y cruces salen solos. Para dar
 * volumen sin perspectiva (estilo Prison Architect):
 *  - REMATE: la parte de arriba del muro, clara.
 *  - CARA: el material (ladrillo, bloque, piedra) en los lados expuestos;
 *    abajo se ve una franja ancha (la fachada "hacia la cámara") y a los
 *    lados un canto fino.
 *  - SOMBRA: plana, hacia abajo y a la derecha, sobre el suelo. Dentro de una
 *    sala crea la franja oscura junto a los muros.
 */
import { Container, Graphics, Rectangle } from 'pixi.js'
import type { Game } from '@/sim/game'
import type { TileCoord, TileRect } from '@/sim/geometry'
import { tileIndex } from '@/sim/map'
import { doorAxis, isEnclosure, isIndoor } from '@/sim/structures'
import { NO_DOOR, NO_WALL, type DoorDef, type WallDef } from '@/sim/structureTypes'
import { shade } from './color'
import { TILE_SIZE } from './grid'
import { palette } from './palette'
import type { WallTextures } from './wallTextures'

const T = TILE_SIZE
const CHUNK = 16
/** Alto de la fachada (cara de abajo) cuando no hay muro debajo. */
const FACE_DEPTH = 26
/** Cara lateral visible en el lado EXTERIOR de un muro vertical. */
const SIDE_FACE = 18
/** Canto en sombra en el lado INTERIOR de un muro vertical. */
const INNER_EDGE = 6
/** Grosor del contorno exterior (como el trazo negro de Prison Architect). */
const OUTLINE = 2.5
const SHADOW_LENGTH = 16
const SHADOW_OFFSET = 4
/** Sombra interior junto a las paredes: franjas escalonadas (px, opacidad). */
const INDOOR_SHADE: ReadonlyArray<readonly [number, number]> = [
  [10, 0.22],
  [10, 0.12],
  [12, 0.05],
]

/** Conexiones de una casilla con sus vecinas (muro o puerta) e interior a cada lado. */
interface Links {
  readonly n: boolean
  readonly e: boolean
  readonly s: boolean
  readonly w: boolean
  /** ¿La vecina de ese lado es zona interior (dentro de un edificio)? */
  readonly indoorN: boolean
  readonly indoorE: boolean
  readonly indoorS: boolean
  readonly indoorW: boolean
}

export interface WallsView {
  destroy(): void
}

export function createWallsView(layer: Container, game: Game, textures: WallTextures): WallsView {
  const { size } = game.state
  const columns = Math.ceil(size.width / CHUNK)
  const rows = Math.ceil(size.height / CHUNK)
  const chunks: Graphics[] = []

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const chunk = new Graphics({ label: `walls:${column},${row}` })
      chunk.cullable = true
      // El área incluye el margen de las sombras que salen del trozo.
      chunk.cullArea = new Rectangle(
        column * CHUNK * T,
        row * CHUNK * T,
        CHUNK * T + T,
        CHUNK * T + T,
      )
      layer.addChild(chunk)
      chunks.push(chunk)
      drawChunk(chunk, game, textures, column, row)
    }
  }

  /** Redibuja los trozos que toca el rectángulo y sus vecinas (el autotiling depende de ellas). */
  const redrawRect = (rect: TileRect): void => {
    const firstColumn = Math.max(0, Math.floor((rect.x - 1) / CHUNK))
    const lastColumn = Math.min(columns - 1, Math.floor((rect.x + rect.width) / CHUNK))
    const firstRow = Math.max(0, Math.floor((rect.y - 1) / CHUNK))
    const lastRow = Math.min(rows - 1, Math.floor((rect.y + rect.height) / CHUNK))

    for (let row = firstRow; row <= lastRow; row++) {
      for (let column = firstColumn; column <= lastColumn; column++) {
        const chunk = chunks[row * columns + column]
        if (chunk) drawChunk(chunk, game, textures, column, row)
      }
    }
  }

  const unsubscribe = game.subscribe((event) => {
    if (event.type === 'structuresChanged') redrawRect(event.rect)
  })

  return {
    destroy() {
      unsubscribe()
      for (const chunk of chunks) chunk.destroy()
    },
  }
}

function drawChunk(
  g: Graphics,
  game: Game,
  textures: WallTextures,
  column: number,
  row: number,
): void {
  const { state, content } = game
  g.clear()

  const tiles: TileCoord[] = []
  const startX = column * CHUNK
  const startY = row * CHUNK
  for (let y = startY; y < Math.min(startY + CHUNK, state.size.height); y++) {
    for (let x = startX; x < Math.min(startX + CHUNK, state.size.width); x++) {
      if (isEnclosure(state, { x, y })) tiles.push({ x, y })
    }
  }
  if (tiles.length === 0) return

  const linksOf = (tile: TileCoord): Links => {
    const north = { x: tile.x, y: tile.y - 1 }
    const east = { x: tile.x + 1, y: tile.y }
    const south = { x: tile.x, y: tile.y + 1 }
    const west = { x: tile.x - 1, y: tile.y }
    return {
      n: isEnclosure(state, north),
      e: isEnclosure(state, east),
      s: isEnclosure(state, south),
      w: isEnclosure(state, west),
      indoorN: isIndoor(state, north),
      indoorE: isIndoor(state, east),
      indoorS: isIndoor(state, south),
      indoorW: isIndoor(state, west),
    }
  }

  // 1) Sombras sobre el suelo (debajo de todos los muros del trozo)
  for (const tile of tiles) drawShadow(g, tile, linksOf(tile), wallDefAt(game, tile))

  // 2) Muros
  for (const tile of tiles) {
    const def = wallDefAt(game, tile)
    if (def) drawWall(g, tile, linksOf(tile), def, textures)
  }

  // 3) Puertas
  for (const tile of tiles) {
    const door = state.doors[tileIndex(state, tile)]
    const def = door && door !== NO_DOOR ? content.doors[door] : undefined
    if (def) drawDoor(g, tile, def, doorAxis(state, tile), jambWall(game, tile))
  }
}

function wallDefAt(game: Game, tile: TileCoord): WallDef | undefined {
  const wall = game.state.walls[tileIndex(game.state, tile)]
  return wall && wall !== NO_WALL ? game.content.walls[wall] : undefined
}

/** Muro de alguna vecina, para pintar las jambas de una puerta a juego. */
function jambWall(game: Game, tile: TileCoord): WallDef | undefined {
  const around = [
    { x: tile.x - 1, y: tile.y },
    { x: tile.x + 1, y: tile.y },
    { x: tile.x, y: tile.y - 1 },
    { x: tile.x, y: tile.y + 1 },
  ]
  for (const neighbour of around) {
    if (neighbour.x < 0 || neighbour.y < 0) continue
    const def = wallDefAt(game, neighbour)
    if (def) return def
  }
  return undefined
}

// ── Sombras ──────────────────────────────────────────────────────

/**
 * Sombras que proyecta un muro sobre las casillas vecinas:
 *  - hacia fuera (zona exterior): sombra plana abajo y a la derecha;
 *  - hacia dentro (zona interior): oscurecimiento escalonado junto a la pared
 *    por todos los lados (más fuerte bajo el muro de arriba), como el
 *    sombreado ambiental de las salas de Prison Architect.
 */
function drawShadow(g: Graphics, tile: TileCoord, links: Links, def: WallDef | undefined): void {
  const x = tile.x * T
  const y = tile.y * T
  const low = def?.pattern === 'fence' || def?.pattern === 'hedge'

  // Exterior
  const alpha = low ? 0.16 : 0.3
  const length = low ? 8 : SHADOW_LENGTH
  if (!links.s && !links.indoorS) {
    g.rect(x + SHADOW_OFFSET, y + T, T, length).fill({ color: palette.outline, alpha })
  }
  if (!links.e && !links.indoorE) {
    g.rect(x + T, y + SHADOW_OFFSET, length * 0.7, T).fill({
      color: palette.outline,
      alpha: alpha * 0.75,
    })
  }
  if (low) return

  // Interior: franjas escalonadas sobre la casilla vecina, empezando pegadas al muro
  const shadeSide = (side: 'n' | 'e' | 's' | 'w', strength: number): void => {
    let offset = 0
    for (const [size, opacity] of INDOOR_SHADE) {
      const fill = { color: palette.outline, alpha: opacity * strength }
      if (side === 's') g.rect(x, y + T + offset, T, size).fill(fill)
      if (side === 'n') g.rect(x, y - offset - size, T, size).fill(fill)
      if (side === 'e') g.rect(x + T + offset, y, size, T).fill(fill)
      if (side === 'w') g.rect(x - offset - size, y, size, T).fill(fill)
      offset += size
    }
  }
  if (!links.s && links.indoorS) shadeSide('s', 1)
  if (!links.e && links.indoorE) shadeSide('e', 0.8)
  if (!links.w && links.indoorW) shadeSide('w', 0.8)
  if (!links.n && links.indoorN) shadeSide('n', 0.5)
}

// ── Muros ────────────────────────────────────────────────────────

/**
 * Muro con volumen estilo Prison Architect. Por casilla:
 *  - remate (arriba, claro) más estrecho que la casilla;
 *  - fachada abajo (hiladas horizontales) si no hay muro debajo;
 *  - cara lateral (hiladas verticales) en el lado EXTERIOR de los muros
 *    verticales; por el lado interior, solo un filo oscuro;
 *  - las caras se unen en diagonal (inglete a 45°) en las esquinas;
 *  - contorno grueso por fuera.
 */
function drawWall(
  g: Graphics,
  tile: TileCoord,
  links: Links,
  def: WallDef,
  textures: WallTextures,
): void {
  if (def.pattern === 'fence') return drawFence(g, tile, links, def)
  if (def.pattern === 'hedge') return drawHedge(g, tile, links, def)

  const x = tile.x * T
  const y = tile.y * T

  // Anchura de cada cara según lo que haya al otro lado
  const top = links.n ? 0 : OUTLINE
  const faceS = links.s ? 0 : FACE_DEPTH
  const faceW = links.w ? 0 : links.indoorW ? INNER_EDGE : SIDE_FACE
  const faceE = links.e ? 0 : links.indoorE ? INNER_EDGE : SIDE_FACE

  const capL = x + faceW
  const capR = x + T - faceE
  const capT = y + top
  const capB = y + T - faceS

  const faceFill = textures.face(def.id) ?? def.faceColor
  const sideFill = textures.side(def.id) ?? def.faceColor
  const darkEdge = shade(def.faceColor, -0.45)

  // Caras laterales (trapecios: se cortan en diagonal con la fachada de abajo)
  if (faceW > 0) {
    const west = [x, y, capL, capT, capL, capB, x, y + T]
    g.poly(west).fill(sideFill)
    if (faceW === INNER_EDGE) {
      g.poly(west).fill({ color: palette.outline, alpha: 0.45 })
      g.rect(capL - 1.5, capT, 1.5, capB - capT).fill(darkEdge)
    } else {
      // La cara que mira a la izquierda recibe algo más de luz
      g.poly(west).fill({ color: palette.chalk, alpha: 0.06 })
    }
  }
  if (faceE > 0) {
    const east = [x + T, y, capR, capT, capR, capB, x + T, y + T]
    g.poly(east).fill(sideFill)
    g.poly(east).fill({ color: palette.outline, alpha: faceE === INNER_EDGE ? 0.45 : 0.12 })
  }
  // Fachada de abajo
  if (faceS > 0) {
    g.poly([x, y + T, capL, capB, capR, capB, x + T, y + T]).fill(faceFill)
    // Pie oscuro donde el muro toca el suelo
    g.rect(x, y + T - 3, T, 3).fill({ color: palette.outline, alpha: 0.35 })
  }

  // Remate
  g.rect(capL, capT, capR - capL, capB - capT).fill(textures.cap(def.id) ?? def.capColor)
  const capEdge = shade(def.capColor, -0.3)
  if (faceS > 0) g.rect(capL, capB - 1.5, capR - capL, 1.5).fill(capEdge)
  if (faceW > 0) g.rect(capL, capT, 1.5, capB - capT).fill(capEdge)
  if (faceE > 0) g.rect(capR - 1.5, capT, 1.5, capB - capT).fill(capEdge)
  if (!links.n) g.rect(capL, capT, capR - capL, 1.5).fill(shade(def.capColor, 0.3))

  // Contorno exterior grueso solo en los lados expuestos
  const outline = palette.outline
  if (!links.n) g.rect(x, y, T, OUTLINE).fill(outline)
  if (!links.s) g.rect(x, y + T - OUTLINE, T, OUTLINE).fill(outline)
  if (!links.w) g.rect(x, y, OUTLINE, T).fill(outline)
  if (!links.e) g.rect(x + T - OUTLINE, y, OUTLINE, T).fill(outline)
}

/**
 * Valla de malla metálica: paneles con malla romboidal entre dos raíles hacia
 * las vecinas conectadas, y un poste en cada casilla.
 */
function drawFence(g: Graphics, tile: TileCoord, links: Links, def: WallDef): void {
  const x = tile.x * T
  const y = tile.y * T
  const cx = x + T / 2
  const cy = y + T / 2
  const half = 12
  const mesh = shade(def.capColor, -0.15)
  const rail = def.faceColor
  const spacing = 8

  /**
   * Panel de `from` a `to` a lo largo del eje (horizontal o vertical), de
   * `half * 2` de alto y centrado en la casilla.
   */
  const panel = (from: number, to: number, horizontal: boolean): void => {
    const len = to - from
    if (len <= 0) return
    /** Punto (a lo largo, a lo ancho) → coordenadas reales. */
    const at = (along: number, across: number): [number, number] =>
      horizontal ? [from + along, cy + across] : [cx + across, from + along]
    const rect = (along: number, across: number, length: number, breadth: number): void => {
      const [rx, ry] = at(along, across)
      if (horizontal) g.rect(rx, ry, length, breadth)
      else g.rect(rx, ry, breadth, length)
    }

    // Sombra y fondo del panel (el fondo algo oscuro hace que la malla se lea)
    const [sx, sy] = at(3, -half + 5)
    if (horizontal) g.rect(sx, sy, len, half * 2).fill({ color: palette.outline, alpha: 0.12 })
    else g.rect(sx, sy, half * 2, len).fill({ color: palette.outline, alpha: 0.12 })
    rect(0, -half, len, half * 2)
    g.fill({ color: palette.outline, alpha: 0.14 })

    // Malla romboidal: diagonales cada `spacing` px, recortadas al tramo
    for (let d = -half * 2; d < len; d += spacing) {
      for (const dir of [1, -1] as const) {
        // Segmento de (d, -half) a (d + 2·half, +half), o su simétrico
        let a0 = dir === 1 ? d : d + half * 2
        let a1 = dir === 1 ? d + half * 2 : d
        let b0 = -half
        let b1 = half
        const clip = (value: number, lo: number, hi: number): number =>
          Math.min(hi, Math.max(lo, value))
        const slope = (b1 - b0) / (a1 - a0)
        const ca0 = clip(a0, 0, len)
        const ca1 = clip(a1, 0, len)
        if (ca0 === ca1) continue
        b0 = b0 + (ca0 - a0) * slope
        b1 = b1 + (ca1 - a1) * slope
        a0 = ca0
        a1 = ca1
        g.moveTo(...at(a0, b0)).lineTo(...at(a1, b1))
      }
    }
    g.stroke({ color: mesh, width: 1.3 })

    // Raíles arriba y abajo, con brillo en el de arriba
    rect(0, -half - 1.5, len, 3.5)
    g.fill(rail)
    rect(0, -half - 1.5, len, 1)
    g.fill(shade(rail, 0.3))
    rect(0, half - 2, len, 3.5)
    g.fill(rail)
  }

  // Tramos desde el poste hacia cada vecina conectada
  if (links.w) panel(x, cx, true)
  if (links.e) panel(cx, x + T, true)
  if (links.n) panel(y, cy, false)
  if (links.s) panel(cy, y + T, false)

  // Poste
  g.rect(cx - 5, cy - 5, 16, 16).fill({ color: palette.outline, alpha: 0.3 })
  g.rect(cx - 8, cy - 8, 16, 16)
    .fill(rail)
    .stroke({ color: palette.outline, width: 1.5 })
  g.rect(cx - 4, cy - 4, 8, 8).fill(shade(rail, 0.25))
}

/**
 * Seto: masa continua. Un núcleo redondeado en el centro y brazos rectos
 * hacia los setos vecinos (sin redondear por ahí), así no se ven cortes
 * entre casillas. Hojas en dos tonos, fijas por casilla.
 */
function drawHedge(g: Graphics, tile: TileCoord, links: Links, def: WallDef): void {
  const x = tile.x * T
  const y = tile.y * T
  const inset = 9
  const pieces: Array<[number, number, number, number, number]> = [
    [x + inset, y + inset, T - inset * 2, T - inset * 2, 12],
  ]
  if (links.n) pieces.push([x + inset, y, T - inset * 2, T / 2, 0])
  if (links.s) pieces.push([x + inset, y + T / 2, T - inset * 2, T / 2, 0])
  if (links.w) pieces.push([x, y + inset, T / 2, T - inset * 2, 0])
  if (links.e) pieces.push([x + T / 2, y + inset, T / 2, T - inset * 2, 0])

  // Contorno: cada pieza algo más grande; los rellenos de después tapan las juntas internas.
  for (const [px, py, pw, ph, r] of pieces) {
    const grow = (edge: boolean): number => (edge ? 0 : 1.5)
    const left = px === x && links.w ? 0 : 1.5
    const top = py === y && links.n ? 0 : 1.5
    g.roundRect(
      px - left,
      py - top,
      pw + left + grow(px + pw === x + T && links.e),
      ph + top + grow(py + ph === y + T && links.s),
      r + 1.5,
    ).fill(palette.treeOutline)
  }
  for (const [px, py, pw, ph, r] of pieces) g.roundRect(px, py, pw, ph, r).fill(def.capColor)

  const seed = (tile.x * 73856093) ^ (tile.y * 19349663)
  for (let i = 0; i < 8; i++) {
    const fx = x + 10 + (((seed >> (i * 3)) & 31) / 31) * (T - 20)
    const fy = y + 12 + (((seed >> (i * 2 + 5)) & 31) / 31) * (T - 24)
    g.circle(fx + 2, fy + 2, 5).fill(def.faceColor)
    g.circle(fx - 1, fy - 1, 3.5).fill(palette.treeLight)
  }
}

// ── Puertas ──────────────────────────────────────────────────────

/**
 * Puerta en el hueco del muro: jambas del color del muro a los extremos y la
 * hoja en el centro de la línea del muro, con detalles según el tipo.
 */
function drawDoor(
  g: Graphics,
  tile: TileCoord,
  def: DoorDef,
  axis: ReturnType<typeof doorAxis>,
  wall: WallDef | undefined,
): void {
  const x = tile.x * T
  const y = tile.y * T
  const across = axis !== 'horizontal' // la hoja va de izquierda a derecha
  const jamb = wall?.capColor ?? palette.stone
  const jambSize = 7
  const leafThickness = 12
  const outline = palette.outline

  // Umbral bajo la hoja
  if (across) g.rect(x, y + T / 2 - 9, T, 18).fill({ color: palette.outline, alpha: 0.18 })
  else g.rect(x + T / 2 - 9, y, 18, T).fill({ color: palette.outline, alpha: 0.18 })

  // Jambas
  if (across) {
    g.rect(x, y + T / 2 - 12, jambSize, 24)
      .fill(jamb)
      .stroke({ color: outline, width: 1 })
    g.rect(x + T - jambSize, y + T / 2 - 12, jambSize, 24)
      .fill(jamb)
      .stroke({ color: outline, width: 1 })
  } else {
    g.rect(x + T / 2 - 12, y, 24, jambSize)
      .fill(jamb)
      .stroke({ color: outline, width: 1 })
    g.rect(x + T / 2 - 12, y + T - jambSize, 24, jambSize)
      .fill(jamb)
      .stroke({ color: outline, width: 1 })
  }

  // Hoja
  const leaf = across
    ? { x: x + jambSize, y: y + T / 2 - leafThickness / 2, w: T - jambSize * 2, h: leafThickness }
    : { x: x + T / 2 - leafThickness / 2, y: y + jambSize, w: leafThickness, h: T - jambSize * 2 }

  g.rect(leaf.x + 3, leaf.y + 3, leaf.w, leaf.h).fill({ color: outline, alpha: 0.3 })
  g.rect(leaf.x, leaf.y, leaf.w, leaf.h).fill(def.color).stroke({ color: outline, width: 1.5 })

  switch (def.pattern) {
    case 'wood':
      // Vetas a lo largo de la hoja
      for (const t of [0.3, 0.65]) {
        if (across)
          g.rect(leaf.x + 3, leaf.y + leaf.h * t, leaf.w - 6, 1).fill(shade(def.color, -0.2))
        else g.rect(leaf.x + leaf.w * t, leaf.y + 3, 1, leaf.h - 6).fill(shade(def.color, -0.2))
      }
      break
    case 'metal':
      // Franja de chapa y placa de empuje
      if (across) g.rect(leaf.x + 4, leaf.y + 3, leaf.w - 8, 3).fill(shade(def.color, 0.2))
      else g.rect(leaf.x + 3, leaf.y + 4, 3, leaf.h - 8).fill(shade(def.color, 0.2))
      break
    case 'glass':
      // Cristal con marco y reflejo
      if (across) g.rect(leaf.x + 4, leaf.y + 3, leaf.w - 8, leaf.h - 6).fill(palette.waterShine)
      else g.rect(leaf.x + 3, leaf.y + 4, leaf.w - 6, leaf.h - 8).fill(palette.waterShine)
      break
    case 'gate':
      // Barrotes
      for (let i = 1; i < 6; i++) {
        if (across)
          g.rect(leaf.x + (leaf.w * i) / 6, leaf.y + 1, 1.5, leaf.h - 2).fill(
            shade(def.color, -0.3),
          )
        else
          g.rect(leaf.x + 1, leaf.y + (leaf.h * i) / 6, leaf.w - 2, 1.5).fill(
            shade(def.color, -0.3),
          )
      }
      break
  }

  // Tirador
  const handle = across
    ? [leaf.x + leaf.w - 10, leaf.y + leaf.h / 2]
    : [leaf.x + leaf.w / 2, leaf.y + leaf.h - 10]
  g.circle(handle[0] ?? 0, handle[1] ?? 0, 2.5)
    .fill(palette.warmLight)
    .stroke({ color: outline, width: 0.8 })
}
