/**
 * Vista de edificios: mantiene un marcador por edificio colocado.
 *
 * Al crearse dibuja lo que ya hay en el estado (p. ej. al cargar partida) y
 * después se actualiza con los eventos de la partida. Solo lee el estado.
 */
import type { Container } from 'pixi.js'
import type { BuildingId, PlacedBuilding } from '@/sim/buildings'
import type { Game } from '@/sim/game'
import { createBuildingMarker, destroyBuildingMarker } from './buildingMarker'
import { tileToWorld } from './grid'
import type { RenderAssets } from './renderAssets'

export interface BuildingsView {
  destroy(): void
}

export function createBuildingsView(
  layer: Container,
  game: Game,
  assets: RenderAssets,
): BuildingsView {
  const markers = new Map<BuildingId, Container>()

  const add = (building: PlacedBuilding): void => {
    const def = game.content.buildings[building.type]
    if (!def) return

    const marker = createBuildingMarker(def, building.rotation, assets)
    const position = tileToWorld(building.origin)
    marker.position.set(position.x, position.y)
    layer.addChild(marker)
    markers.set(building.id, marker)
  }

  const remove = (buildingId: BuildingId): void => {
    const marker = markers.get(buildingId)
    if (!marker) return

    destroyBuildingMarker(marker)
    markers.delete(buildingId)
  }

  Object.values(game.state.buildings).forEach(add)

  const unsubscribe = game.subscribe((event) => {
    if (event.type === 'buildingPlaced') add(event.building)
    if (event.type === 'buildingDemolished') remove(event.building.id)
  })

  return {
    destroy() {
      unsubscribe()
      for (const id of [...markers.keys()]) remove(id)
    },
  }
}
