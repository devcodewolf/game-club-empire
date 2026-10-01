/**
 * Monta la aplicación Pixi dentro de un elemento HTML y dibuja la partida.
 *
 * Solo renderiza y traduce gestos en comandos PROPUESTOS (`onCommand`): quien
 * lo monta decide despacharlos. Nunca modifica el estado de la simulación.
 */
import { Application } from 'pixi.js'
import type { Command } from '@/sim/commands'
import type { Game } from '@/sim/game'
import { createBuildingsView } from './buildingsView'
import { gridLineAlpha } from './camera'
import { createCameraController } from './cameraController'
import { drawGridLines, drawGround } from './drawGrid'
import { applyView, createWorldLayers } from './layers'
import { bindMapInput } from './mapInput'
import { palette } from './palette'
import { createParcelsView } from './parcelsView'
import { NO_TOOL, type Tool } from './tool'
import { commandForTool } from './toolActions'
import { createToolPreview } from './toolPreview'

export interface GameRendererOptions {
  /** Comando propuesto por un clic con la herramienta activa. */
  readonly onCommand: (command: Command) => void
  /** Clic derecho sin arrastrar: el jugador quiere soltar la herramienta. */
  readonly onCancel: () => void
}

export interface GameRenderer {
  setTool(tool: Tool): void
  destroy(): void
}

export async function createGameRenderer(
  host: HTMLElement,
  game: Game,
  { onCommand, onCancel }: GameRendererOptions,
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
  drawGround(layers.ground, grid, app.renderer)
  drawGridLines(layers.grid, grid)

  const parcels = createParcelsView(layers.parcels, game)
  const buildings = createBuildingsView(layers.buildings, game)
  const preview = createToolPreview(layers.overlay, game)
  let tool: Tool = NO_TOOL

  // La cámara decide qué parte del mapa se ve; aquí solo se aplica su vista.
  const camera = createCameraController({
    grid,
    screen: { width: app.screen.width, height: app.screen.height },
    onChange: (view) => {
      applyView(world, view)
      layers.grid.alpha = gridLineAlpha(view.scale)
    },
  })

  const unbindInput = bindMapInput(app.canvas, camera, {
    hasTool: () => tool.kind !== 'none',
    onHover: (tile) => preview.setHover(tile),
    onPrimaryClick: (tile) => {
      const command = commandForTool(tool, tile, game.state, game.catalog)
      if (command) onCommand(command)
    },
    onCancel,
  })

  const onResize = (): void => {
    camera.resize({ width: app.screen.width, height: app.screen.height })
  }
  app.renderer.on('resize', onResize)

  return {
    setTool(next) {
      tool = next
      preview.setTool(next)
      parcels.setBuyMode(next.kind === 'buyParcel')
    },
    destroy(): void {
      unbindInput()
      app.renderer.off('resize', onResize)
      preview.destroy()
      buildings.destroy()
      parcels.destroy()
      // releaseGlobalResources: vacía cachés globales de Pixi para que recrear
      // la app (p. ej. recarga en caliente de Vite) no deje texturas obsoletas.
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true, texture: true, textureSource: true },
      )
    },
  }
}
