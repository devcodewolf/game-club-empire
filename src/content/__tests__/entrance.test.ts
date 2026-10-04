import { describe, expect, it } from 'vitest'
import { isInsideGrid, tilesInRect, type TileCoord } from '@/sim/geometry'
import { createMapState, isTileReserved } from '@/sim/map/map'
import { ACCESS, ENTRANCE_PROPS, FENCE_X } from '../entrance'
import { MAP_CONFIG, MAP_SIZE, ROAD } from '../map'

/** Casillas que ocupa un elemento de la entrada (los árboles pueden ir a media casilla). */
function propTiles(prop: (typeof ENTRANCE_PROPS)[number]): TileCoord[] {
  switch (prop.kind) {
    case 'tree': {
      const origin = { x: Math.floor(prop.tile.x), y: Math.floor(prop.tile.y) }
      return [...tilesInRect({ ...origin, width: 2, height: 2 })]
    }
    case 'lamp':
      return [prop.tile]
    case 'label':
    case 'fence':
    case 'barrier':
      return []
    default:
      return [...tilesInRect(prop.rect)]
  }
}

describe('entrada de la ciudad deportiva', () => {
  const state = createMapState(MAP_CONFIG)

  it('todos los elementos quedan dentro del mapa y en casillas reservadas', () => {
    for (const prop of ENTRANCE_PROPS) {
      for (const tile of propTiles(prop)) {
        expect(isInsideGrid(tile, MAP_SIZE), `${prop.kind} fuera del mapa`).toBe(true)
        expect(isTileReserved(state, tile), `${prop.kind} en casilla no reservada`).toBe(true)
      }
    }
  })

  it('el acceso llega hasta la carretera y cruza la valla', () => {
    expect(ACCESS.x + ACCESS.width).toBe(ROAD.x)
    expect(ACCESS.x).toBeLessThan(FENCE_X)
  })

  it('la puerta de la valla coincide con el acceso', () => {
    const fence = ENTRANCE_PROPS.find((p) => p.kind === 'fence')
    expect(fence?.kind === 'fence' && fence.gap).toEqual({ y: ACCESS.y, height: ACCESS.height })
  })

  it('el terreno sigue siendo construible a la izquierda de la entrada', () => {
    expect(isTileReserved(state, { x: 100, y: 80 })).toBe(false)
    expect(isTileReserved(state, { x: ACCESS.x - 1, y: ACCESS.y })).toBe(false)
  })
})
