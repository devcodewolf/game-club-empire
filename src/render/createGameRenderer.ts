/**
 * Monta la aplicación Pixi dentro de un elemento HTML y dibuja el mapa.
 * Solo renderiza: no contiene lógica de simulación.
 */
import { Application } from 'pixi.js'
import type { GridSize } from '@/sim/geometry'
import { gridLineAlpha } from './camera'
import { createCameraController } from './cameraController'
import { bindCameraInput } from './cameraInput'
import { drawGridLines, drawGround } from './drawGrid'
import { applyView, createWorldLayers } from './layers'
import { palette } from './palette'

export interface GameRenderer {
  destroy(): void
}

export async function createGameRenderer(host: HTMLElement, grid: GridSize): Promise<GameRenderer> {
  const app = new Application()
  await app.init({
    resizeTo: host,
    background: palette.background,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio,
  })
  host.appendChild(app.canvas)

  const { world, layers } = createWorldLayers()
  app.stage.addChild(world)
  drawGround(layers.ground, grid, app.renderer)
  drawGridLines(layers.grid, grid)

  // La cámara decide qué parte del mapa se ve; aquí solo se aplica su vista.
  const camera = createCameraController({
    grid,
    screen: { width: app.screen.width, height: app.screen.height },
    onChange: (view) => {
      applyView(world, view)
      layers.grid.alpha = gridLineAlpha(view.scale)
    },
  })
  const unbindInput = bindCameraInput(app.canvas, camera)

  const onResize = (): void => {
    camera.resize({ width: app.screen.width, height: app.screen.height })
  }
  app.renderer.on('resize', onResize)

  return {
    destroy(): void {
      unbindInput()
      app.renderer.off('resize', onResize)
      // releaseGlobalResources: vacía cachés globales de Pixi para que recrear
      // la app (p. ej. recarga en caliente de Vite) no deje texturas obsoletas.
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true, texture: true, textureSource: true },
      )
    },
  }
}
