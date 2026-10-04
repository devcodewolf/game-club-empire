/**
 * Sistema de capas del mapa.
 *
 * Todo lo que pertenece al mundo cuelga de `world`, el único contenedor al que
 * se aplica la cámara (posición + escala). Dentro, cada capa es un Container
 * y su orden en `LAYER_ORDER` decide qué se dibuja encima: se pinta de la
 * primera (abajo) a la última (arriba).
 */
import { Container } from 'pixi.js'
import type { ViewTransform } from './grid'

export const LAYER_ORDER = [
  'ground', // fondo de hierba
  'floors', // suelos pintados (por trozos) y asfalto
  'road', // marcas viales y tramos de carretera fuera del mapa
  'grid', // líneas de la rejilla
  'scenery', // decorado fijo del mundo: entrada, valla, árboles
  'roomLabels', // nombre de cada sala pintado en el suelo y sus avisos
  'structures', // muros, puertas y sus sombras
  'outside', // zonas de ampliación bloqueadas (fuera del mapa)
  'buildings', // edificios y sus sombras
  'people', // figuritas
  'effects', // polvo, textos flotantes, partículas
  'overlay', // vista previa de construcción y selección
] as const

export type LayerName = (typeof LAYER_ORDER)[number]

export interface WorldLayers {
  /** Raíz del mundo: aquí se aplica la cámara. */
  readonly world: Container
  readonly layers: Readonly<Record<LayerName, Container>>
}

export function createWorldLayers(): WorldLayers {
  const world = new Container({ label: 'world' })

  const layers = Object.fromEntries(
    LAYER_ORDER.map((name) => [name, world.addChild(new Container({ label: name }))]),
  ) as Record<LayerName, Container>

  return { world, layers }
}

/** Aplica la transformación de cámara al contenedor del mundo. */
export function applyView(world: Container, view: ViewTransform): void {
  world.position.set(view.x, view.y)
  world.scale.set(view.scale)
}
