/**
 * Vista de edificios: mantiene un marcador por edificio colocado.
 *
 * Al crearse dibuja lo que ya hay en el estado (p. ej. al cargar partida, sin
 * animación) y después se actualiza con los eventos de la partida: lo nuevo
 * aparece con andamio y rebote, lo demolido se va con polvo. Solo lee el estado.
 */
import { RenderLayer, type Container } from 'pixi.js'
import { placedSize, type BuildingId, type PlacedBuilding } from '@/sim/buildings/buildings'
import type { Game } from '@/sim/game'
import { rotateSize } from '@/sim/geometry'
import { gsap } from 'gsap'
import { buildingAt } from '@/sim/map/map'
import { standsOf } from '@/sim/buildings/stands'
import type { TileCoord } from '@/sim/geometry'
import {
  createBuildingMarker,
  destroyBuildingMarker,
  SHADOW_LABEL,
  STAND_ROOF_LABEL,
} from '../art/buildingMarker'
import {
  playBuild,
  playDemolish,
  playUpgrade,
  prefersReducedMotion,
  stopEffects,
  type PxRect,
} from './effects'
import { TILE_SIZE, tileToWorld } from '../core/grid'
import type { RenderAssets } from '../core/renderAssets'

export interface BuildingsView {
  /** Casilla bajo el ratón: desvanece la visera de la grada que haya ahí. */
  setHover(tile: TileCoord | null): void
  /** Objeto o campo que se lleva con Mover: se atenúa en su sitio (con sus gradas). */
  setCarrying(buildingId: BuildingId | null): void
  destroy(): void
}

/** Opacidad de la visera con el ratón encima: se ve el graderío de debajo. */
const ROOF_FADED_ALPHA = 0.15
/** Duración del fundido de la visera, en segundos. */
const ROOF_FADE_TIME = 0.25
/** Opacidad del original mientras se lleva con Mover. */
const CARRIED_ALPHA = 0.35

export function createBuildingsView(
  layer: Container,
  effects: Container,
  game: Game,
  assets: RenderAssets,
): BuildingsView {
  const markers = new Map<BuildingId, { marker: Container; rect: PxRect }>()
  // Capa de sombras bajo todos los objetos: cada sombra sigue a su objeto
  // (posición y animaciones) pero se dibuja antes que cualquier objeto, así
  // la sombra de una grada nunca oscurece la grada o el córner de al lado.
  const shadows = new RenderLayer()
  layer.addChildAt(shadows, 0)

  const add = (building: PlacedBuilding, animate: boolean | 'upgrade'): void => {
    const def = game.content.buildings[building.type]
    if (!def) return

    const size = placedSize(building, def)
    const marker = createBuildingMarker(def, building.rotation, assets, {
      tier: building.tier,
      role: building.role,
      size,
    })
    const origin = tileToWorld(building.origin)
    const rotated = rotateSize(size, building.rotation)
    const rect = {
      x: origin.x,
      y: origin.y,
      w: rotated.width * TILE_SIZE,
      h: rotated.height * TILE_SIZE,
    }
    // Pivote en el centro: las animaciones de escala salen desde el centro del objeto.
    marker.pivot.set(rect.w / 2, rect.h / 2)
    marker.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2)
    layer.addChild(marker)
    const shadow = marker.getChildByLabel(SHADOW_LABEL)
    if (shadow) shadows.attach(shadow)
    markers.set(building.id, { marker, rect })
    if (animate === 'upgrade') playUpgrade(marker, rect, effects)
    else if (animate) playBuild(marker, rect, effects)
  }

  /** Visera desvanecida ahora mismo (la de la grada bajo el ratón). */
  let fadedId: BuildingId | null = null

  const remove = (buildingId: BuildingId, animate: boolean): void => {
    const entry = markers.get(buildingId)
    if (!entry) return
    markers.delete(buildingId)
    // Su visera no debe seguir animándose ni contar como desvanecida
    const roof = entry.marker.getChildByLabel(STAND_ROOF_LABEL)
    if (roof) gsap.killTweensOf(roof)
    if (buildingId === fadedId) fadedId = null

    const finish = (): void => {
      stopEffects(entry.marker)
      const shadow = entry.marker.getChildByLabel(SHADOW_LABEL)
      if (shadow) shadows.detach(shadow)
      destroyBuildingMarker(entry.marker)
    }
    stopEffects(entry.marker)
    if (animate) playDemolish(entry.marker, entry.rect, effects, finish)
    else finish()
  }

  for (const building of Object.values(game.state.buildings)) add(building, false)

  const fadeRoof = (buildingId: BuildingId | null, alpha: number): void => {
    const roof =
      buildingId === null ? null : markers.get(buildingId)?.marker.getChildByLabel(STAND_ROOF_LABEL)
    if (!roof) return
    gsap.killTweensOf(roof)
    if (prefersReducedMotion()) roof.alpha = alpha
    else gsap.to(roof, { alpha, duration: ROOF_FADE_TIME, ease: 'power1.out' })
  }

  const setHover = (tile: TileCoord | null): void => {
    const hovered = tile ? (buildingAt(game.state, tile)?.id ?? null) : null
    if (hovered === fadedId) return
    fadeRoof(fadedId, 1)
    fadeRoof(hovered, ROOF_FADED_ALPHA)
    fadedId = hovered
  }

  const unsubscribe = game.subscribe((event) => {
    if (event.type === 'buildingPlaced') add(event.building, true)
    if (event.type === 'pitchRoleChanged') {
      // Cambia el rótulo de uso: se redibujan el campo y, si lo hay, el que dejó de ser principal
      for (const id of [event.buildingId, event.demotedId]) {
        const building = id === undefined ? undefined : game.state.buildings[id]
        if (!building) continue
        remove(building.id, false)
        add(building, false)
      }
    }
    if (event.type === 'buildingUpgraded') {
      // Mejora en el sitio: se cambia el dibujo por el del nivel nuevo, con un rebote
      remove(event.building.id, false)
      add(event.building, 'upgrade')
    }
    if (event.type === 'buildingMoved') {
      // Se quita de su sitio y aparece en el nuevo con un rebote
      for (const { from } of event.moves) remove(from.id, false)
      for (const { to } of event.moves) add(to, 'upgrade')
      carried = []
    }
    if (event.type === 'buildingDemolished') {
      remove(event.building.id, true)
      // Las gradas caen con su campo
      for (const stand of event.attached ?? []) remove(stand.id, true)
    }
    if (event.type === 'areaDemolished')
      for (const building of event.buildings) remove(building.id, true)
  })

  /** Ids atenuados ahora mismo (lo que se lleva y sus gradas). */
  let carried: BuildingId[] = []
  const setCarrying = (buildingId: BuildingId | null): void => {
    for (const id of carried) {
      const marker = markers.get(id)?.marker
      if (marker) marker.alpha = 1
    }
    carried =
      buildingId === null ? [] : [buildingId, ...standsOf(game.state, buildingId).map((s) => s.id)]
    for (const id of carried) {
      const marker = markers.get(id)?.marker
      if (marker) marker.alpha = CARRIED_ALPHA
    }
  }

  return {
    setHover,
    setCarrying,
    destroy() {
      unsubscribe()
      for (const id of [...markers.keys()]) remove(id, false)
      shadows.destroy()
    },
  }
}
