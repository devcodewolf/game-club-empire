import { describe, expect, it } from 'vitest'
import { MAP_SIZE, ROAD } from '@/content/map'
import type { TileCoord } from '@/sim/geometry'
import { expansionAt, expansionZone, padlockTile } from './expansions'

describe('zonas de ampliación', () => {
  it('quedan fuera del mapa y no alcanzan la carretera', () => {
    const top = expansionZone('top', MAP_SIZE)
    const bottom = expansionZone('bottom', MAP_SIZE)
    const left = expansionZone('left', MAP_SIZE)

    expect(top.y + top.height).toBe(0)
    expect(bottom.y).toBe(MAP_SIZE.height)
    expect(left.x + left.width).toBe(0)
    expect(top.x + top.width).toBeLessThanOrEqual(ROAD.x - ROAD.sidewalk)
  })

  it('cada candado está dentro de su zona', () => {
    for (const side of ['top', 'left', 'bottom'] as const) {
      expect(expansionAt(padlockTile(side, MAP_SIZE), MAP_SIZE)).toBe(side)
    }
  })

  it.each<[string, TileCoord, ReturnType<typeof expansionAt>]>([
    ['casilla dentro del mapa', { x: 10, y: 10 }, null],
    ['justo encima del mapa', { x: 10, y: -1 }, 'top'],
    ['justo debajo del mapa', { x: 10, y: MAP_SIZE.height }, 'bottom'],
    ['justo a la izquierda', { x: -1, y: 10 }, 'left'],
    ['encima de la carretera (no ampliable)', { x: ROAD.x + 1, y: -1 }, null],
    ['a la derecha del mapa (no ampliable)', { x: MAP_SIZE.width, y: 10 }, null],
    ['esquina diagonal fuera', { x: -1, y: -1 }, null],
  ])('%s', (_nombre, tile, esperado) => {
    expect(expansionAt(tile, MAP_SIZE)).toBe(esperado)
  })
})
