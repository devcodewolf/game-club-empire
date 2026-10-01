/**
 * Recursos de dibujo compartidos por las vistas: texturas de suelo e iconos.
 * Se crean una vez al montar el renderer. En la Fase 1C se añadirán aquí los
 * atlas de sprites.
 */
import type { Renderer } from 'pixi.js'
import type { SimContent } from '@/sim/content'
import { createFloorTextures, type FloorTextures } from './floorTextures'
import { loadIconTextures, type IconTextures } from './iconTextures'
import { createWallTextures, type WallTextures } from './wallTextures'

export interface RenderAssets {
  readonly floors: FloorTextures
  readonly icons: IconTextures
  readonly walls: WallTextures
  destroy(): void
}

export async function createRenderAssets(
  renderer: Renderer,
  content: SimContent,
): Promise<RenderAssets> {
  const floorTextures = createFloorTextures(renderer, content.floors)
  const wallTextures = createWallTextures(renderer, content.walls)
  const icons = await loadIconTextures()

  return {
    floors: floorTextures,
    icons,
    walls: wallTextures,
    destroy() {
      floorTextures.destroy()
      wallTextures.destroy()
    },
  }
}
