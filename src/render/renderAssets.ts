/**
 * Recursos de dibujo compartidos por las vistas: texturas de suelo y muro,
 * iconos y siluetas de sombra. Se crean una vez al montar el renderer.
 */
import type { Renderer } from 'pixi.js'
import type { SimContent } from '@/sim/content'
import { createFloorTextures, type FloorTextures } from './floorTextures'
import { loadIconTextures, type IconTextures } from './iconTextures'
import { createSilhouetteCache, type SilhouetteCache } from './silhouettes'
import { createWallTextures, type WallTextures } from './wallTextures'

export interface RenderAssets {
  readonly floors: FloorTextures
  readonly icons: IconTextures
  readonly walls: WallTextures
  readonly silhouettes: SilhouetteCache
  destroy(): void
}

export async function createRenderAssets(
  renderer: Renderer,
  content: SimContent,
): Promise<RenderAssets> {
  const floorTextures = createFloorTextures(renderer, content.floors)
  const wallTextures = createWallTextures(renderer, content.walls)
  const icons = await loadIconTextures()
  const silhouettes = createSilhouetteCache(renderer)

  return {
    floors: floorTextures,
    icons,
    walls: wallTextures,
    silhouettes,
    destroy() {
      floorTextures.destroy()
      wallTextures.destroy()
      silhouettes.destroy()
    },
  }
}
