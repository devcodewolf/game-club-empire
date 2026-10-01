/**
 * Recursos de dibujo compartidos por las vistas: texturas de suelo e iconos.
 * Se crean una vez al montar el renderer. En la Fase 1C se añadirán aquí los
 * atlas de sprites.
 */
import type { Renderer } from 'pixi.js'
import type { FloorCatalog } from '@/sim/floors'
import { createFloorTextures, type FloorTextures } from './floorTextures'
import { loadIconTextures, type IconTextures } from './iconTextures'

export interface RenderAssets {
  readonly floors: FloorTextures
  readonly icons: IconTextures
  destroy(): void
}

export async function createRenderAssets(
  renderer: Renderer,
  floors: FloorCatalog,
): Promise<RenderAssets> {
  const floorTextures = createFloorTextures(renderer, floors)
  const icons = await loadIconTextures()

  return {
    floors: floorTextures,
    icons,
    destroy() {
      floorTextures.destroy()
    },
  }
}
