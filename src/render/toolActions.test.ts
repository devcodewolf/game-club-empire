import { describe, expect, it } from 'vitest'
import { executeCommand } from '@/sim/commands'
import { buildingAt, type MapState } from '@/sim/map'
import type { Rotation, TileCoord } from '@/sim/geometry'
import { createTestMap, TEST_CATALOG } from '@/sim/test-fixtures'
import type { Tool } from './tool'
import { commandForTool, placementOrigin } from './toolActions'

const build = (buildingType: string, rotation: Rotation = 0): Tool => ({
  kind: 'build',
  buildingType,
  rotation,
})

const commandFor = (tool: Tool, cursor: TileCoord, state: MapState = createTestMap()) =>
  commandForTool(tool, cursor, state, TEST_CATALOG)

describe('placementOrigin', () => {
  it('con tamaño impar (3×3) centra exacto el edificio bajo el cursor', () => {
    expect(placementOrigin({ x: 5, y: 5 }, { width: 3, height: 3 }, 0)).toEqual({ x: 4, y: 4 })
  })

  it('con tamaño par (4×2) el cursor cae a la derecha y abajo del centro', () => {
    // Huella x: 3..6, y: 4..5. El cursor (5, 5) queda en la mitad derecha e inferior.
    expect(placementOrigin({ x: 5, y: 5 }, { width: 4, height: 2 }, 0)).toEqual({ x: 3, y: 4 })
  })

  it('con rotación 1 usa el tamaño girado', () => {
    // 4×2 girado es 2×4.
    expect(placementOrigin({ x: 5, y: 5 }, { width: 4, height: 2 }, 1)).toEqual({ x: 4, y: 3 })
  })
})

describe('commandForTool', () => {
  it('la herramienta none no propone ningún comando', () => {
    expect(commandFor({ kind: 'none' }, { x: 2, y: 2 })).toBeNull()
  })

  describe('build', () => {
    it('propone placeBuilding con el origen centrado y la rotación de la herramienta', () => {
      const cursor = { x: 5, y: 5 }
      const rotation: Rotation = 1

      expect(commandFor(build('wide', rotation), cursor)).toEqual({
        type: 'placeBuilding',
        buildingType: 'wide',
        origin: placementOrigin(cursor, TEST_CATALOG.wide!.size, rotation),
        rotation,
      })
    })

    it('con un tipo de edificio desconocido devuelve null', () => {
      expect(commandFor(build('inexistente'), { x: 5, y: 5 })).toBeNull()
    })

    it.each<{ type: string; rotation: Rotation; cursor: TileCoord }>([
      { type: 'small', rotation: 0, cursor: { x: 4, y: 4 } },
      { type: 'wide', rotation: 0, cursor: { x: 4, y: 4 } },
      { type: 'wide', rotation: 1, cursor: { x: 4, y: 4 } },
      { type: 'wide', rotation: 2, cursor: { x: 6, y: 3 } },
      { type: 'wide', rotation: 3, cursor: { x: 3, y: 6 } },
      { type: 'big', rotation: 0, cursor: { x: 5, y: 5 } },
      { type: 'big', rotation: 1, cursor: { x: 7, y: 3 } },
      { type: 'big', rotation: 2, cursor: { x: 3, y: 7 } },
    ])(
      'el comando de $type con rotación $rotation deja el cursor dentro de la huella',
      ({ type, rotation, cursor }) => {
        const state = createTestMap()
        const command = commandFor(build(type, rotation), cursor, state)
        expect(command).not.toBeNull()

        const result = executeCommand(state, command!, TEST_CATALOG)

        expect(result.ok).toBe(true)
        expect(buildingAt(state, cursor)).toBeDefined()
      },
    )
  })

  describe('demolish', () => {
    const demolish: Tool = { kind: 'demolish' }

    it('sobre un edificio colocado propone demolishBuilding con su id', () => {
      const state = createTestMap()
      executeCommand(
        state,
        { type: 'placeBuilding', buildingType: 'small', origin: { x: 2, y: 2 }, rotation: 0 },
        TEST_CATALOG,
      )

      expect(commandFor(demolish, { x: 2, y: 2 }, state)).toEqual({
        type: 'demolishBuilding',
        buildingId: 1,
      })
    })

    it('sobre una casilla vacía devuelve null', () => {
      expect(commandFor(demolish, { x: 2, y: 2 })).toBeNull()
    })

    it('sobre cualquier casilla de la huella devuelve el mismo id', () => {
      const state = createTestMap()
      executeCommand(
        state,
        { type: 'placeBuilding', buildingType: 'wide', origin: { x: 2, y: 2 }, rotation: 0 },
        TEST_CATALOG,
      )

      // wide 3×2 en (2,2): x 2..4, y 2..3
      for (const cursor of [
        { x: 2, y: 2 },
        { x: 4, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
      ]) {
        expect(commandFor(demolish, cursor, state)).toEqual({
          type: 'demolishBuilding',
          buildingId: 1,
        })
      }
    })
  })

  describe('buyParcel', () => {
    it('propone buyParcel con la parcela de la casilla', () => {
      expect(commandFor({ kind: 'buyParcel' }, { x: 12, y: 3 })).toEqual({
        type: 'buyParcel',
        parcel: { x: 2, y: 0 },
      })
    })
  })
})
