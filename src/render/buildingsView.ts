/**
 * Vista de edificios: mantiene un marcador por edificio colocado.
 *
 * Al crearse dibuja lo que ya hay en el estado (p. ej. al cargar partida, sin
 * animación) y después se actualiza con los eventos de la partida: lo nuevo
 * aparece con andamio y rebote, lo demolido se va con polvo. Solo lee el estado.
 */
import type { Container } from 'pixi.js'
import { placedSize, type BuildingId, type PlacedBuilding } from '@/sim/buildings'
import type { Game } from '@/sim/game'
import { rotateSize } from '@/sim/geometry'
import { createBuildingMarker, destroyBuildingMarker } from './buildingMarker'
import { playBuild, playDemolish, playUpgrade, stopEffects, type PxRect } from './effects'
import { TILE_SIZE, tileToWorld } from './grid'
import type { RenderAssets } from './renderAssets'

export interface BuildingsView {
  destroy(): void
}

export function createBuildingsView(
  layer: Container,
  effects: Container,
  game: Game,
  assets: RenderAssets,
): BuildingsView {
  const markers = new Map<BuildingId, { marker: Container; rect: PxRect }>()

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
    markers.set(building.id, { marker, rect })
    if (animate === 'upgrade') playUpgrade(marker, rect, effects)
    else if (animate) playBuild(marker, rect, effects)
  }

  const remove = (buildingId: BuildingId, animate: boolean): void => {
    const entry = markers.get(buildingId)
    if (!entry) return
    markers.delete(buildingId)

    const finish = (): void => {
      stopEffects(entry.marker)
      destroyBuildingMarker(entry.marker)
    }
    stopEffects(entry.marker)
    if (animate) playDemolish(entry.marker, entry.rect, effects, finish)
    else finish()
  }

  for (const building of Object.values(game.state.buildings)) add(building, false)

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
    if (event.type === 'buildingDemolished') {
      remove(event.building.id, true)
      // Las gradas caen con su campo
      for (const stand of event.attached ?? []) remove(stand.id, true)
    }
    if (event.type === 'areaDemolished')
      for (const building of event.buildings) remove(building.id, true)
  })

  return {
    destroy() {
      unsubscribe()
      for (const id of [...markers.keys()]) remove(id, false)
    },
  }
}
