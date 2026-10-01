/**
 * Monta la aplicación Pixi dentro de un elemento HTML y dibuja la partida.
 *
 * Solo renderiza y traduce gestos en comandos PROPUESTOS (`onCommand`): quien
 * lo monta decide despacharlos. Nunca modifica el estado de la simulación.
 */
import { Application, CullerPlugin, extensions } from 'pixi.js'
import { ENTRANCE_PROPS } from '@/content/entrance'
import { ENTRANCE, ROAD, type ExpansionSide } from '@/content/map'
import type { Command } from '@/sim/commands'
import type { Game } from '@/sim/game'
import type { TileCoord } from '@/sim/geometry'
import { createBuildingsView } from './buildingsView'
import { gridLineAlpha } from './camera'
import { createCameraController } from './cameraController'
import { drawGridLines, drawGround } from './drawGrid'
import { expansionAt } from './expansions'
import { createExpansionsView } from './expansionsView'
import { drawEntrance } from './entranceView'
import { createFloorsView } from './floorsView'
import { createWallsView } from './wallsView'
import { createRoomsView } from './roomsView'
import { applyView, createWorldLayers } from './layers'
import { bindMapInput } from './mapInput'
import { palette } from './palette'
import { drawRoad } from './roadView'
import { isDragTool, NO_TOOL, type Tool } from './tool'
import { commandForDrag, commandForTool } from './toolActions'
import { createToolPreview } from './toolPreview'
import { createRenderAssets } from './renderAssets'
import { TILE_SIZE } from './grid'

// Culling: no dibujar lo que queda fuera de pantalla (los trozos de suelo lo usan).
// Debe registrarse antes de crear la aplicación.
extensions.add(CullerPlugin)

/**
 * Zoom inicial ×0,5 (32 px por casilla): en 1920×1080 se ven ~60×34 casillas,
 * como el zoom por defecto de Prison Architect. Más lejos los objetos son
 * ilegibles; la vista de conjunto sigue a mano alejando con la rueda.
 */
const INITIAL_SCALE = 0.5

/** Al empezar, la cámara mira a la entrada (borde derecho), donde está la carretera. */
const INITIAL_FOCUS = {
  x: (ROAD.x - 24) * TILE_SIZE,
  y: (ENTRANCE.y + ENTRANCE.height / 2) * TILE_SIZE,
}

export interface GameRendererOptions {
  /** Comando propuesto por un clic o un arrastre con la herramienta activa. */
  readonly onCommand: (command: Command) => void
  /** Clic derecho sin arrastrar: el jugador quiere soltar la herramienta. */
  readonly onCancel: () => void
  /** Clic sobre una zona de ampliación bloqueada. */
  readonly onExpansionClick: (side: ExpansionSide) => void
  /** Clic sin herramienta: el jugador quiere inspeccionar lo que hay en la casilla. */
  readonly onInspect: (tile: TileCoord) => void
}

export interface GameRenderer {
  setTool(tool: Tool): void
  destroy(): void
}

export async function createGameRenderer(
  host: HTMLElement,
  game: Game,
  { onCommand, onCancel, onExpansionClick, onInspect }: GameRendererOptions,
): Promise<GameRenderer> {
  const app = new Application()
  await app.init({
    resizeTo: host,
    background: palette.background,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio,
  })
  host.appendChild(app.canvas)

  const grid = game.state.size
  const { world, layers } = createWorldLayers()
  app.stage.addChild(world)
  const assets = await createRenderAssets(app.renderer, game.content)
  const floorTextures = assets.floors
  // Solo en desarrollo: la extensión PixiJS DevTools busca la app en esta global.
  if (import.meta.env.DEV) Object.assign(globalThis, { __PIXI_APP__: app })
  const grassTexture = floorTextures.texture('grass')
  if (grassTexture) drawGround(layers.ground, grid, grassTexture)
  const floors = createFloorsView(layers.floors, game, floorTextures)
  drawRoad(
    layers.road,
    grid,
    floorTextures.pattern('asphalt') ?? palette.outline,
    floorTextures.pattern('concrete') ?? palette.stone,
  )
  drawGridLines(layers.grid, grid)
  drawEntrance(layers.scenery, ENTRANCE_PROPS, grid.height)
  const expansions = createExpansionsView(layers.outside, grid)
  const rooms = createRoomsView(layers.roomLabels, game)
  const walls = createWallsView(layers.structures, game, assets.walls)
  const buildings = createBuildingsView(layers.buildings, game, assets)
  const preview = createToolPreview(layers.overlay, game, assets)

  let tool: Tool = NO_TOOL
  /** Casilla donde empezó el arrastre en curso (null si no se arrastra o se canceló). */
  let dragStart: TileCoord | null = null

  const setDragStart = (tile: TileCoord | null): void => {
    dragStart = tile
    preview.setDragStart(tile)
  }

  // La cámara decide qué parte del mapa se ve; aquí solo se aplica su vista.
  const camera = createCameraController({
    grid,
    screen: { width: app.screen.width, height: app.screen.height },
    initialScale: INITIAL_SCALE,
    initialFocus: INITIAL_FOCUS,
    onChange: (view) => {
      applyView(world, view)
      layers.grid.alpha = gridLineAlpha(view.scale)
      // Elementos de interfaz con tamaño constante en pantalla
      preview.setZoom(view.scale)
      expansions.setZoom(view.scale)
    },
  })

  const unbindInput = bindMapInput(app.canvas, camera, {
    hasTool: () => tool.kind !== 'none',
    isDragTool: () => isDragTool(tool),
    onHover: (tile) => preview.setHover(tile),
    onPrimaryClick: (tile) => {
      const side = expansionAt(tile, grid)
      if (side) return onExpansionClick(side)

      if (tool.kind === 'none') return onInspect(tile)
      const command = commandForTool(tool, tile, game.state, game.content)
      if (command) onCommand(command)
    },
    onDragStart: (tile) => {
      const side = expansionAt(tile, grid)
      if (side) return onExpansionClick(side)
      setDragStart(tile)
    },
    onDragMove: (tile) => preview.setHover(tile),
    onDragEnd: (tile) => {
      if (!dragStart) return
      const command = commandForDrag(tool, dragStart, tile, game.state)
      setDragStart(null)
      if (command) onCommand(command)
    },
    onCancel: () => {
      // Primero se cancela el arrastre en curso; si no lo hay, se suelta la herramienta.
      if (dragStart) return setDragStart(null)
      onCancel()
    },
  })

  const onResize = (): void => {
    camera.resize({ width: app.screen.width, height: app.screen.height })
  }
  app.renderer.on('resize', onResize)

  return {
    setTool(next) {
      tool = next
      dragStart = null
      preview.setTool(next)
    },
    destroy(): void {
      unbindInput()
      app.renderer.off('resize', onResize)
      preview.destroy()
      buildings.destroy()
      floors.destroy()
      walls.destroy()
      rooms.destroy()
      assets.destroy()
      // releaseGlobalResources: vacía cachés globales de Pixi para que recrear
      // la app (p. ej. recarga en caliente de Vite) no deje texturas obsoletas.
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true, texture: true, textureSource: true },
      )
    },
  }
}
