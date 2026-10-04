/**
 * Siluetas de los objetos para su sombra proyectada.
 *
 * Cada pintor se hornea una vez por (objeto, nivel) en una textura blanca con
 * la forma exacta del dibujo; la sombra es un Sprite de esa textura teñido con
 * el contorno y con la opacidad de sombra. Al ser una sola textura, las piezas
 * que se solapan dentro del dibujo no oscurecen más la sombra.
 */
import {
  ColorMatrixFilter,
  Graphics,
  Rectangle,
  type ColorMatrix,
  type Renderer,
  type Texture,
} from 'pixi.js'

/** Resolución de las siluetas: nítidas aunque se acerque el zoom. */
const SILHOUETTE_RESOLUTION = 2

/** Margen alrededor de la huella: los contornos sobresalen un poco del borde. */
export const SILHOUETTE_PAD = 4

/**
 * Pasa cualquier color a blanco. El alfa se recorta (1,5·a − 0,5): lo casi
 * transparente (halos de luz, brillos) no proyecta sombra y lo sólido sí.
 */
// prettier-ignore
const WHITE_SILHOUETTE: ColorMatrix = [
  0, 0, 0, 0, 1,
  0, 0, 0, 0, 1,
  0, 0, 0, 0, 1,
  0, 0, 0, 1.5, -0.5,
]

export interface SilhouetteCache {
  /**
   * Silueta del dibujo de `paint` en una huella de w×h px, cacheada por `key`.
   * La textura mide (w + 2·SILHOUETTE_PAD)×(h + 2·SILHOUETTE_PAD).
   */
  get(key: string, w: number, h: number, paint: (g: Graphics) => void): Texture
  destroy(): void
}

export function createSilhouetteCache(renderer: Renderer): SilhouetteCache {
  const textures = new Map<string, Texture>()
  const filter = new ColorMatrixFilter()
  filter.matrix = WHITE_SILHOUETTE

  return {
    get(key, w, h, paint) {
      const cached = textures.get(key)
      if (cached) return cached

      const g = new Graphics()
      paint(g)
      g.filters = [filter]
      const texture = renderer.generateTexture({
        target: g,
        frame: new Rectangle(
          -SILHOUETTE_PAD,
          -SILHOUETTE_PAD,
          w + SILHOUETTE_PAD * 2,
          h + SILHOUETTE_PAD * 2,
        ),
        resolution: SILHOUETTE_RESOLUTION,
        antialias: true,
      })
      g.filters = []
      g.destroy()
      textures.set(key, texture)
      return texture
    },
    destroy() {
      for (const texture of textures.values()) texture.destroy(true)
      textures.clear()
      filter.destroy()
    },
  }
}
