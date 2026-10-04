/**
 * Galería de arte (solo desarrollo, skill pixi-artist).
 *
 *   /gallery.html               → todas las piezas a ×0,5 sobre césped
 *   /gallery.html?asset=<id>    → una pieza a ×0,5 y ×1, sobre varios suelos,
 *                                 en las 4 orientaciones, todos sus niveles y
 *                                 junto a sus vecinos habituales
 *
 * Usa exactamente el código de dibujo del juego (marcadores, texturas, vistas
 * de suelos/muros/salas), así lo que se ve aquí es lo que se verá en partida.
 */
import { Application, Container, Graphics, Text, type Ticker } from 'pixi.js'
import { BUILDINGS } from '@/content/buildings'
import { GAME_CONTENT } from '@/content/gameContent'
import { createBuildingMarker } from '@/render/art/buildingMarker'
import { createBuildingsView } from '@/render/views/buildingsView'
import { createFloorsView } from '@/render/views/floorsView'
import { TILE_SIZE } from '@/render/core/grid'
import { palette } from '@/render/palette'
import { createRenderAssets, type RenderAssets } from '@/render/core/renderAssets'
import { createRoomsView } from '@/render/views/roomsView'
import { createWallsView } from '@/render/views/wallsView'
import type { BuildingDef } from '@/sim/buildings/buildings'
import { createGame } from '@/sim/game'
import { rotateSize, type GridSize, type Rotation } from '@/sim/geometry'
import { GALLERY_SCENES, sceneFor, type GalleryScene } from './scenes'

const T = TILE_SIZE
const ROTATIONS: readonly Rotation[] = [0, 1, 2, 3]
const FLOORS_SHOWN = ['grass', 'wood', 'whiteTile', 'concrete'] as const
const SCALES = [0.5, 1] as const
const GAP = 24
const PAGE_WIDTH = 1400

/** Elemento ya colocado en la página (px de pantalla). */
interface Placed {
  readonly node: Container
  readonly height: number
}

async function main(): Promise<void> {
  const params = new URLSearchParams(location.search)
  const assetId = params.get('asset')
  renderNav(assetId)

  const app = new Application()
  await app.init({
    width: PAGE_WIDTH,
    height: 200,
    background: palette.background,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio,
  })
  document.getElementById('gallery')?.appendChild(app.canvas)
  const assets = await createRenderAssets(app.renderer, GAME_CONTENT)

  const def = assetId ? GAME_CONTENT.buildings[assetId] : undefined
  const tierIds = params.get('tiers')?.split(',').filter(Boolean)
  const scene = GALLERY_SCENES.find((item) => item.name === params.get('scene'))
  const buildStart = performance.now()
  const page = scene
    ? scenePage(scene, assets)
    : tierIds
      ? tiersPage(tierIds, assets)
      : def
        ? detailPage(def, assets)
        : overviewPage(assets)
  app.stage.addChild(page.node)
  // Las escenas grandes (estadio) pueden ser más anchas que la página: se ensancha.
  app.renderer.resize(
    Math.max(PAGE_WIDTH, Math.ceil(page.node.width + GAP)),
    Math.ceil(page.height + GAP),
  )
  if (scene?.name === 'rendimiento') await benchmark(app, page, performance.now() - buildStart)
  // Señal para las capturas automáticas: la galería ya está dibujada.
  document.body.dataset.ready = 'true'
}

// ── Páginas ──────────────────────────────────────────────────────

/** Una pieza: escalas × suelos × orientaciones, niveles y vecinos. */
function detailPage(def: BuildingDef, assets: RenderAssets): Placed {
  const page = new Container()
  let y = GAP
  y += addLabel(
    page,
    `${def.name}  ·  ${def.id}  ·  ${def.size.width}×${def.size.height} casillas`,
    GAP,
    y,
    22,
  )

  for (const scale of SCALES) {
    y += addLabel(page, `Zoom ×${scale}`, GAP, y + 8, 18) + 8
    const block = orientationGrid(def, scale, assets)
    block.node.position.set(GAP, y)
    page.addChild(block.node)
    y += block.height + GAP
  }

  const tiers = tiersRow(def, assets)
  y += addLabel(page, 'Niveles (×0,5)', GAP, y + 8, 18) + 8
  tiers.node.position.set(GAP, y)
  page.addChild(tiers.node)
  y += tiers.height + GAP

  const scene = sceneFor(def.id)
  if (scene) {
    for (const scale of SCALES) {
      y += addLabel(page, `Con sus vecinos: ${scene.name} (×${scale})`, GAP, y + 8, 18) + 8
      const view = sceneView(scene, scale, assets)
      view.node.position.set(GAP, y)
      page.addChild(view.node)
      y += view.height + GAP
    }
  }
  return { node: page, height: y }
}

/** `?scene=nombre`: solo una escena de vecinos a ×0,5 (p. ej. el estadio entero). */
function scenePage(scene: GalleryScene, assets: RenderAssets): Placed {
  const view = sceneView(scene, 0.5, assets)
  view.node.position.set(GAP, GAP)
  return { node: view.node, height: view.height + GAP }
}

/** `?tiers=a,b,c`: solo las filas de niveles de varias piezas, a ×0,5 y ×1. */
function tiersPage(ids: readonly string[], assets: RenderAssets): Placed {
  const page = new Container()
  let y = GAP
  for (const scale of SCALES) {
    y += addLabel(page, `Niveles a ×${scale}`, GAP, y, 22) + 10
    for (const id of ids) {
      const def = GAME_CONTENT.buildings[id]
      if (!def) continue
      addLabel(page, def.name, GAP, y + 10, 14)
      const row = tiersRow(def, assets, scale)
      row.node.position.set(GAP + 110, y)
      page.addChild(row.node)
      y += row.height + 14
    }
    y += GAP
  }
  return { node: page, height: y }
}

/**
 * Todas las piezas sobre césped, con su id debajo: primero las pequeñas
 * (objetos) y después las grandes (gradas y campos). Todas a ×0,5 salvo las
 * que no caben en la página, que se reducen y lo indican en el rótulo.
 */
function overviewPage(assets: RenderAssets): Placed {
  const page = new Container()
  const preferred = 0.5
  let x = GAP
  let y =
    GAP + addLabel(page, 'Todas las piezas (×0,5) · añade ?asset=<id> para ver una', GAP, GAP, 20)
  let rowHeight = 0

  const area = (def: BuildingDef): number => def.size.width * def.size.height
  const defs = (Object.values(BUILDINGS) as BuildingDef[]).slice().sort((p, q) => area(p) - area(q))

  for (const def of defs) {
    const fullWidth = (def.size.width + 2) * T
    const scale = Math.min(preferred, (PAGE_WIDTH - GAP * 2) / fullWidth)
    const cell = pieceCell(def, 0, 'grass', scale, assets)
    if (x + cell.width > PAGE_WIDTH - GAP && x > GAP) {
      x = GAP
      y += rowHeight + 28
      rowHeight = 0
    }
    cell.node.position.set(x, y)
    page.addChild(cell.node)
    const note = scale < preferred ? `  (reducido a ×${scale.toFixed(2)})` : ''
    addLabel(page, def.id + note, x, y + cell.height + 4, 11)
    x += cell.width + GAP
    rowHeight = Math.max(rowHeight, cell.height)
  }
  return { node: page, height: y + rowHeight + 28 }
}

// ── Bloques ──────────────────────────────────────────────────────

/** Filas = suelos, columnas = orientaciones. */
function orientationGrid(def: BuildingDef, scale: number, assets: RenderAssets): Placed {
  const block = new Container()
  const side = Math.max(def.size.width, def.size.height) + 2
  const cellPx = side * T * scale
  let y = 0
  for (const floor of FLOORS_SHOWN) {
    addLabel(block, floor, 0, y + cellPx / 2 - 8, 12)
    ROTATIONS.forEach((rotation, i) => {
      const cell = pieceCell(def, rotation, floor, scale, assets, side)
      cell.node.position.set(90 + i * (cellPx + 8), y)
      block.addChild(cell.node)
    })
    y += cellPx + 8
  }
  ROTATIONS.forEach((rotation, i) =>
    addLabel(block, `${rotation * 90}°`, 90 + i * (cellPx + 8), y, 11),
  )
  return { node: block, height: y + 16 }
}

/** Una fila con todos los niveles de la pieza (1 si aún no tiene niveles). */
function tiersRow(def: BuildingDef, assets: RenderAssets, scale = 0.5): Placed {
  const block = new Container()
  const tierCount = def.tiers?.length ?? 1
  const side = Math.max(def.size.width, def.size.height) + 2
  const cellPx = side * T * scale
  // Hueco suficiente para el rótulo "Nivel N · nombre"
  const step = Math.max(cellPx + 8, 190)
  for (let tier = 0; tier < tierCount; tier++) {
    const cell = pieceCell(def, 0, 'concrete', scale, assets, side, tier)
    cell.node.position.set(90 + tier * step, 0)
    block.addChild(cell.node)
    const name = def.tiers?.[tier]?.name ?? ''
    addLabel(
      block,
      `Nivel ${tier + 1}${name ? ` · ${name}` : ''}`,
      90 + tier * step,
      cellPx + 4,
      11,
    )
  }
  if (tierCount === 1)
    addLabel(block, '(sin niveles todavía)', 90 + cellPx + 16, cellPx / 2 - 8, 12)
  return { node: block, height: cellPx + 20 }
}

/**
 * Celda: un trozo de suelo (texturizado) con la pieza centrada encima.
 * `side` fija una celda cuadrada (en casillas) para que todas alineen.
 */
function pieceCell(
  def: BuildingDef,
  rotation: Rotation,
  floor: string,
  scale: number,
  assets: RenderAssets,
  side?: number,
  tier = 0,
): Placed & { readonly width: number } {
  const size = pieceSize(def, tier)
  const rotated = rotateSize(size, rotation)
  const cellW = (side ?? rotated.width + 2) * T
  const cellH = (side ?? rotated.height + 2) * T
  const cell = new Container()
  cell.scale.set(scale)

  const ground = new Graphics()
    .rect(0, 0, cellW, cellH)
    .fill(assets.floors.pattern(floor) ?? palette.grass)
  // Rejilla fina, como en el juego
  for (let x = T; x < cellW; x += T) ground.moveTo(x, 0).lineTo(x, cellH)
  for (let y = T; y < cellH; y += T) ground.moveTo(0, y).lineTo(cellW, y)
  ground.stroke({ color: palette.outline, alpha: 0.28, pixelLine: true })
  ground.rect(0, 0, cellW, cellH).stroke({ color: palette.outline, width: 2 })
  cell.addChild(ground)

  const marker = createBuildingMarker(def, rotation, assets, { tier, size })
  marker.position.set(
    Math.floor((cellW / T - rotated.width) / 2) * T,
    Math.floor((cellH / T - rotated.height) / 2) * T,
  )
  cell.addChild(marker)

  return { node: cell, width: cellW * scale, height: cellH * scale }
}

/** Tamaño de la pieza en un nivel: las gradas ganan fondo al subir de nivel. */
function pieceSize(def: BuildingDef, tier: number): GridSize {
  const depth = def.stand?.depths[tier]
  return depth === undefined ? def.size : { width: def.size.width, height: depth }
}

/** Escena de vecinos: una partida en miniatura dibujada con las vistas del juego. */
function sceneView(scene: GalleryScene, scale: number, assets: RenderAssets): Placed {
  const game = createGame({ size: scene.size, features: [] }, GAME_CONTENT)
  for (const command of scene.commands) {
    const result = game.dispatch(command)
    if (!result.ok) console.warn(`Galería: comando de escena rechazado (${result.reason})`, command)
  }

  const world = new Container()
  world.scale.set(scale)
  const grass = new Graphics()
    .rect(0, 0, scene.size.width * T, scene.size.height * T)
    .fill(assets.floors.pattern('grass') ?? palette.grass)
  const layer = (): Container => world.addChild(new Container())
  world.addChild(grass)
  const floors = layer()
  const labels = layer()
  const walls = layer()
  const buildings = layer()
  const effects = layer()
  createFloorsView(floors, game, assets.floors)
  createRoomsView(labels, game)
  createWallsView(walls, game, assets.walls)
  createBuildingsView(buildings, effects, game, assets)

  return { node: world, height: scene.size.height * T * scale }
}

/**
 * Mide la escena de rendimiento: tiempo de montaje y fps medios durante
 * 2 s. Lo escribe arriba de la escena y en la consola.
 */
async function benchmark(app: Application, page: Placed, buildMs: number): Promise<void> {
  const frames: number[] = []
  const tick = (ticker: Ticker): void => {
    frames.push(ticker.deltaMS)
  }
  app.ticker.add(tick)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  app.ticker.remove(tick)
  const avg = frames.slice(10).reduce((sum, ms) => sum + ms, 0) / Math.max(1, frames.length - 10)
  const text = `Montaje ${buildMs.toFixed(0)} ms · ${(1000 / avg).toFixed(0)} fps (${avg.toFixed(1)} ms/frame)`
  console.info(`Galería, rendimiento: ${text}`)
  addLabel(page.node, text, 0, -GAP + 4, 40)
}

// ── Utilidades ───────────────────────────────────────────────────

/** Rótulo de texto; devuelve su alto. */
function addLabel(parent: Container, text: string, x: number, y: number, size: number): number {
  const label = new Text({
    text,
    style: { fontSize: size, fill: palette.chalk, fontFamily: 'Trebuchet MS, sans-serif' },
    resolution: 2,
  })
  label.position.set(x, y)
  parent.addChild(label)
  return label.height
}

/** Índice HTML de piezas y escenas para saltar de una a otra. */
function renderNav(current: string | null): void {
  const nav = document.getElementById('nav')
  if (!nav) return
  const links = Object.keys(BUILDINGS).map((id) =>
    id === current ? `<b>${id}</b>` : `<a href="?asset=${id}">${id}</a>`,
  )
  const scenes = GALLERY_SCENES.map((s) => s.name).join(', ')
  nav.innerHTML = `<a href="/gallery.html">Todo</a> · ${links.join(' ')}<br><small>Escenas de vecinos: ${scenes}</small>`
}

void main()
