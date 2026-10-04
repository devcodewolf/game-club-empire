/**
 * Recursos de dibujo compartidos por las vistas: texturas de suelo y muro,
 * iconos y caché del arte de los objetos (dibujos compartidos y siluetas). Se crean una vez al montar el renderer.
 */
import type { Renderer } from 'pixi.js'
import type { SimContent } from '@/sim/content'
import { createFloorTextures, type FloorTextures } from '../art/floorTextures'
import { loadIconTextures, type IconTextures } from '../art/iconTextures'
import { createArtCache, type ArtCache } from '../art/artCache'
import { createWallTextures, type WallTextures } from '../art/wallTextures'

export interface RenderAssets {
  readonly floors: FloorTextures
  readonly icons: IconTextures
  readonly walls: WallTextures
  readonly art: ArtCache
  destroy(): void
}

export async function createRenderAssets(
  renderer: Renderer,
  content: SimContent,
): Promise<RenderAssets> {
  const floorTextures = createFloorTextures(renderer, content.floors)
  const wallTextures = createWallTextures(renderer, content.walls)
  const icons = await loadIconTextures()
  const art = createArtCache(renderer)

  return {
    floors: floorTextures,
    icons,
    walls: wallTextures,
    art,
    destroy() {
      floorTextures.destroy()
      wallTextures.destroy()
      art.destroy()
    },
  }
}
