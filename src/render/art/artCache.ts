/**
 * Caché del arte de los objetos: cada dibujo se pinta una sola vez por clave
 * (objeto, nivel, tamaño) y todas sus copias lo comparten.
 *
 * - **Dibujo:** un `GraphicsContext` compartido. Cada copia es un `Graphics`
 *   que reutiliza su geometría, así que sigue siendo vectorial (nítido a
 *   cualquier zoom y en pantallas de alta densidad) sin repintar ni
 *   recalcular triángulos. No se hornea a textura: las gradas miden hasta
 *   56×14 casillas y ocuparían decenas de MB.
 * - **Silueta:** el dibujo horneado una vez en una textura blanca con su
 *   forma exacta, para la sombra proyectada (un Sprite teñido con el
 *   contorno y la opacidad de sombra). Al ser una sola textura, las piezas
 *   que se solapan dentro del dibujo no oscurecen más la sombra.
 *
 * Los contextos compartidos no se destruyen con el marcador
 * (`destroy({ children: true })` no toca contextos ajenos); se liberan aquí.
 */
import {
  ColorMatrixFilter,
  Graphics,
  GraphicsContext,
  Rectangle,
  type ColorMatrix,
  type Renderer,
  type Texture,
} from 'pixi.js'

/** Resolución de las siluetas: nítidas aunque se acerque el zoom. */
const SILHOUETTE_RESOLUTION = 2

/** Margen alrededor de la huella: los contornos sobresalen un poco del borde. */
const SILHOUETTE_PAD = 4

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

/**
 * Pinta sobre `g`. Puede devolver `false` si no hay nada que dibujar (p. ej.
 * una grada sin visera en su nivel).
 */
export type ArtPaint = (g: Graphics) => boolean | void

export interface ArtCache {
  /**
   * Dibujo compartido de `key`, pintado con `paint` la primera vez. Devuelve
   * `null` si `paint` devolvió `false`. Si los colores del club llegan a
   * cambiar el dibujo, deben ir en la clave.
   */
  context(key: string, paint: ArtPaint): GraphicsContext | null
  /**
   * Silueta del dibujo de `key` en una huella de w×h px, centrada: la textura
   * mide (w + 2·margen)×(h + 2·margen) y su centro es el de la huella.
   */
  silhouette(key: string, w: number, h: number, paint: ArtPaint): Texture | null
  destroy(): void
}

export function createArtCache(renderer: Renderer): ArtCache {
  const contexts = new Map<string, GraphicsContext | null>()
  const silhouettes = new Map<string, Texture | null>()
  // Se crea con la primera silueta (compila un shader).
  let filter: ColorMatrixFilter | null = null

  const context = (key: string, paint: ArtPaint): GraphicsContext | null => {
    if (contexts.has(key)) return contexts.get(key) ?? null
    let ctx: GraphicsContext | null = new GraphicsContext()
    // Graphics sobre un contexto ajeno: al destruirlo no se lleva el contexto.
    const g = new Graphics(ctx)
    if (paint(g) === false) {
      ctx.destroy()
      ctx = null
    }
    g.destroy()
    contexts.set(key, ctx)
    return ctx
  }

  return {
    context,
    silhouette(key, w, h, paint) {
      if (silhouettes.has(key)) return silhouettes.get(key) ?? null
      const ctx = context(key, paint)
      let texture: Texture | null = null
      if (ctx) {
        if (!filter) {
          filter = new ColorMatrixFilter()
          filter.matrix = WHITE_SILHOUETTE
        }
        const g = new Graphics({ context: ctx, filters: [filter] })
        texture = renderer.generateTexture({
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
      }
      silhouettes.set(key, texture)
      return texture
    },
    destroy() {
      for (const texture of silhouettes.values()) texture?.destroy(true)
      for (const ctx of contexts.values()) ctx?.destroy()
      silhouettes.clear()
      contexts.clear()
      filter?.destroy()
      filter = null
    },
  }
}
