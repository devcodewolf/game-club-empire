import { describe, expect, it } from 'vitest'
import { executeCommand } from '@/sim/commands'
import { buildingAt, type MapState } from '@/sim/map'
import type { Rotation, TileCoord } from '@/sim/geometry'
import { createTestMap, TEST_CATALOG, TEST_CONTENT } from '@/sim/test-fixtures'
import { dragShape, isDragTool, type Tool } from './tool'
import { commandForDrag, commandForTool, placementOrigin } from './toolActions'

const build = (buildingType: string, rotation: Rotation = 0): Tool => ({
  kind: 'build',
  buildingType,
  rotation,
})

const commandFor = (tool: Tool, cursor: TileCoord, state: MapState = createTestMap()) =>
  commandForTool(tool, cursor, state, TEST_CONTENT)

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

        const result = executeCommand(state, command!, TEST_CONTENT)

        expect(result.ok).toBe(true)
        expect(buildingAt(state, cursor)).toBeDefined()
      },
    )
  })

  describe('demolish', () => {
    const demolish: Tool = { kind: 'demolish' }

    it('un clic propone demolishAt con la casilla del cursor', () => {
      expect(commandFor(demolish, { x: 2, y: 2 })).toEqual({
        type: 'demolishAt',
        tile: { x: 2, y: 2 },
      })
    })

    it('un clic en una casilla vacía también propone demolishAt (valida la simulación)', () => {
      const state = createTestMap()
      const command = commandFor(demolish, { x: 9, y: 9 }, state)

      expect(command).toEqual({ type: 'demolishAt', tile: { x: 9, y: 9 } })
      expect(executeCommand(state, command!, TEST_CONTENT)).toEqual({
        ok: false,
        reason: 'nothingToDemolish',
      })
    })

    it('un clic sobre un edificio propone demolishAt y la simulación lo quita', () => {
      const state = createTestMap()
      executeCommand(
        state,
        { type: 'placeBuilding', buildingType: 'wide', origin: { x: 2, y: 2 }, rotation: 0 },
        TEST_CONTENT,
      )

      const command = commandFor(demolish, { x: 4, y: 3 }, state)

      expect(command).toEqual({ type: 'demolishAt', tile: { x: 4, y: 3 } })
      expect(executeCommand(state, command!, TEST_CONTENT).ok).toBe(true)
      expect(buildingAt(state, { x: 2, y: 2 })).toBeUndefined()
    })
  })

  describe('paintFloor', () => {
    const paint: Tool = { kind: 'paintFloor', floor: 'dirt' }

    it('un clic propone pintar un rectángulo 1×1 en la casilla del cursor', () => {
      expect(commandFor(paint, { x: 7, y: 4 })).toEqual({
        type: 'paintFloor',
        rect: { x: 7, y: 4, width: 1, height: 1 },
        floor: 'dirt',
      })
    })

    it('un clic fuera del mapa devuelve null', () => {
      expect(commandFor(paint, { x: 25, y: 4 })).toBeNull()
    })
  })
})

describe('commandForTool: estructuras', () => {
  it('door: un clic propone placeDoor en la casilla del cursor', () => {
    expect(commandFor({ kind: 'door', door: 'door' }, { x: 5, y: 6 })).toEqual({
      type: 'placeDoor',
      tile: { x: 5, y: 6 },
      door: 'door',
    })
  })

  it('wall: un clic propone buildWalls de una casilla', () => {
    expect(commandFor({ kind: 'wall', wall: 'brick' }, { x: 5, y: 6 })).toEqual({
      type: 'buildWalls',
      rect: { x: 5, y: 6, width: 1, height: 1 },
      wall: 'brick',
    })
  })

  it('foundation: un clic propone buildFoundation de una casilla', () => {
    expect(
      commandFor({ kind: 'foundation', wall: 'brick', floor: 'dirt' }, { x: 5, y: 6 }),
    ).toEqual({
      type: 'buildFoundation',
      rect: { x: 5, y: 6, width: 1, height: 1 },
      wall: 'brick',
      floor: 'dirt',
    })
  })

  it('room: un clic propone designateRoom en la casilla del cursor', () => {
    expect(commandFor({ kind: 'room', roomType: 'kit' }, { x: 5, y: 6 })).toEqual({
      type: 'designateRoom',
      tile: { x: 5, y: 6 },
      roomType: 'kit',
    })
  })

  it('removeRoom: un clic propone removeRoom en la casilla del cursor', () => {
    expect(commandFor({ kind: 'removeRoom' }, { x: 5, y: 6 })).toEqual({
      type: 'removeRoom',
      tile: { x: 5, y: 6 },
    })
  })

  it('demolishStructures: un clic propone demoler una casilla', () => {
    expect(commandFor({ kind: 'demolishStructures' }, { x: 5, y: 6 })).toEqual({
      type: 'demolishStructures',
      rect: { x: 5, y: 6, width: 1, height: 1 },
    })
  })
})

describe('commandForDrag: estructuras', () => {
  const state = createTestMap()
  const wall: Tool = { kind: 'wall', wall: 'brick' }
  const foundation: Tool = { kind: 'foundation', wall: 'brick', floor: 'dirt' }
  const demolishStructures: Tool = { kind: 'demolishStructures' }

  it('wall: arrastre mayormente horizontal da una línea horizontal desde la fila de inicio', () => {
    expect(commandForDrag(wall, { x: 3, y: 4 }, { x: 7, y: 5 }, state)).toEqual({
      type: 'buildWalls',
      rect: { x: 3, y: 4, width: 5, height: 1 },
      wall: 'brick',
    })
  })

  it('wall: arrastre mayormente vertical da una línea vertical desde la columna de inicio', () => {
    expect(commandForDrag(wall, { x: 3, y: 9 }, { x: 4, y: 4 }, state)).toEqual({
      type: 'buildWalls',
      rect: { x: 3, y: 4, width: 1, height: 6 },
      wall: 'brick',
    })
  })

  it('wall: la línea se recorta al mapa', () => {
    expect(commandForDrag(wall, { x: 17, y: 2 }, { x: 30, y: 2 }, state)).toEqual({
      type: 'buildWalls',
      rect: { x: 17, y: 2, width: 3, height: 1 },
      wall: 'brick',
    })
  })

  it('wall: una línea completamente fuera del mapa da null', () => {
    expect(commandForDrag(wall, { x: 25, y: 2 }, { x: 30, y: 2 }, state)).toBeNull()
  })

  it('foundation: el arrastre da un rectángulo en cualquier dirección', () => {
    const esperado = {
      type: 'buildFoundation',
      rect: { x: 3, y: 4, width: 5, height: 4 },
      wall: 'brick',
      floor: 'dirt',
    }
    expect(commandForDrag(foundation, { x: 3, y: 4 }, { x: 7, y: 7 }, state)).toEqual(esperado)
    expect(commandForDrag(foundation, { x: 7, y: 7 }, { x: 3, y: 4 }, state)).toEqual(esperado)
  })

  it('demolishStructures: el arrastre da un rectángulo', () => {
    expect(commandForDrag(demolishStructures, { x: 6, y: 7 }, { x: 3, y: 4 }, state)).toEqual({
      type: 'demolishStructures',
      rect: { x: 3, y: 4, width: 4, height: 4 },
    })
  })

  it('door no es herramienta de arrastre: devuelve null', () => {
    expect(
      commandForDrag({ kind: 'door', door: 'door' }, { x: 1, y: 1 }, { x: 4, y: 4 }, state),
    ).toBeNull()
  })

  it('los comandos de estructuras propuestos se pueden ejecutar', () => {
    const live = createTestMap()
    const comandos = [
      commandForDrag(foundation, { x: 2, y: 2 }, { x: 6, y: 6 }, live),
      commandForTool({ kind: 'door', door: 'door' }, { x: 4, y: 2 }, live, TEST_CONTENT),
      commandForDrag(demolishStructures, { x: 2, y: 2 }, { x: 6, y: 6 }, live),
    ]
    for (const comando of comandos) {
      expect(comando).not.toBeNull()
      expect(executeCommand(live, comando!, TEST_CONTENT).ok).toBe(true)
    }
  })
})

describe('commandForDrag: demolish', () => {
  const state = createTestMap()
  const demolish: Tool = { kind: 'demolish' }

  it('un arrastre de 1×1 propone demolishAt', () => {
    expect(commandForDrag(demolish, { x: 4, y: 5 }, { x: 4, y: 5 }, state)).toEqual({
      type: 'demolishAt',
      tile: { x: 4, y: 5 },
    })
  })

  it('un arrastre mayor propone demolishArea con el rect normalizado', () => {
    const esperado = { type: 'demolishArea', rect: { x: 3, y: 4, width: 4, height: 4 } }
    expect(commandForDrag(demolish, { x: 3, y: 4 }, { x: 6, y: 7 }, state)).toEqual(esperado)
    expect(commandForDrag(demolish, { x: 6, y: 7 }, { x: 3, y: 4 }, state)).toEqual(esperado)
  })

  it('un arrastre mayor se recorta al mapa', () => {
    expect(commandForDrag(demolish, { x: 17, y: 18 }, { x: 30, y: 40 }, state)).toEqual({
      type: 'demolishArea',
      rect: { x: 17, y: 18, width: 3, height: 2 },
    })
  })

  it('un arrastre completamente fuera del mapa da null', () => {
    expect(commandForDrag(demolish, { x: 25, y: 2 }, { x: 30, y: 6 }, state)).toBeNull()
  })
})

describe('dragShape', () => {
  it.each<[string, Tool, 'rect' | 'line' | null]>([
    ['paintFloor', { kind: 'paintFloor', floor: 'dirt' }, 'rect'],
    ['foundation', { kind: 'foundation', wall: 'brick', floor: 'dirt' }, 'rect'],
    ['demolishStructures', { kind: 'demolishStructures' }, 'rect'],
    ['wall', { kind: 'wall', wall: 'brick' }, 'line'],
    ['door', { kind: 'door', door: 'door' }, null],
    ['none', { kind: 'none' }, null],
    ['build', { kind: 'build', buildingType: 'small', rotation: 0 }, null],
    ['demolish', { kind: 'demolish' }, 'rect'],
  ])('%s', (_nombre, tool, esperada) => {
    expect(dragShape(tool)).toBe(esperada)
  })
})

describe('commandForDrag', () => {
  const paint: Tool = { kind: 'paintFloor', floor: 'stone' }
  const state = createTestMap()
  const drag = (from: TileCoord, to: TileCoord, tool: Tool = paint) =>
    commandForDrag(tool, from, to, state)

  it.each<[string, TileCoord, TileCoord]>([
    ['abajo a la derecha', { x: 3, y: 4 }, { x: 6, y: 7 }],
    ['abajo a la izquierda', { x: 6, y: 4 }, { x: 3, y: 7 }],
    ['arriba a la derecha', { x: 3, y: 7 }, { x: 6, y: 4 }],
    ['arriba a la izquierda', { x: 6, y: 7 }, { x: 3, y: 4 }],
  ])('arrastrando %s propone el mismo rectángulo 4×4', (_nombre, from, to) => {
    expect(drag(from, to)).toEqual({
      type: 'paintFloor',
      rect: { x: 3, y: 4, width: 4, height: 4 },
      floor: 'stone',
    })
  })

  it('arrastrar sobre la misma casilla da un rectángulo 1×1', () => {
    expect(drag({ x: 2, y: 2 }, { x: 2, y: 2 })).toEqual({
      type: 'paintFloor',
      rect: { x: 2, y: 2, width: 1, height: 1 },
      floor: 'stone',
    })
  })

  it('recorta al mapa cuando se arrastra fuera por la izquierda y arriba', () => {
    expect(drag({ x: 2, y: 3 }, { x: -4, y: -5 })).toEqual({
      type: 'paintFloor',
      rect: { x: 0, y: 0, width: 3, height: 4 },
      floor: 'stone',
    })
  })

  it('recorta al mapa cuando se arrastra fuera por la derecha y abajo', () => {
    expect(drag({ x: 17, y: 18 }, { x: 30, y: 40 })).toEqual({
      type: 'paintFloor',
      rect: { x: 17, y: 18, width: 3, height: 2 },
      floor: 'stone',
    })
  })

  it.each<[string, TileCoord, TileCoord]>([
    ['a la izquierda', { x: -5, y: 2 }, { x: -1, y: 6 }],
    ['encima', { x: 2, y: -6 }, { x: 5, y: -1 }],
    ['a la derecha', { x: 20, y: 2 }, { x: 25, y: 6 }],
    ['debajo', { x: 2, y: 20 }, { x: 5, y: 30 }],
  ])('devuelve null si el arrastre queda completamente fuera %s', (_nombre, from, to) => {
    expect(drag(from, to)).toBeNull()
  })

  it.each<[string, Tool]>([
    ['none', { kind: 'none' }],
    ['build', { kind: 'build', buildingType: 'small', rotation: 0 }],
  ])('devuelve null con la herramienta %s, que no es de arrastre', (_nombre, tool) => {
    expect(drag({ x: 1, y: 1 }, { x: 4, y: 4 }, tool)).toBeNull()
  })
})

describe('isDragTool', () => {
  it.each<[string, Tool, boolean]>([
    ['paintFloor', { kind: 'paintFloor', floor: 'dirt' }, true],
    ['none', { kind: 'none' }, false],
    ['build', { kind: 'build', buildingType: 'small', rotation: 0 }, false],
    ['demolish', { kind: 'demolish' }, true],
    ['foundation', { kind: 'foundation', wall: 'brick', floor: 'dirt' }, true],
    ['wall', { kind: 'wall', wall: 'brick' }, true],
    ['demolishStructures', { kind: 'demolishStructures' }, true],
    ['door', { kind: 'door', door: 'door' }, false],
  ])('%s', (_nombre, tool, esperado) => {
    expect(isDragTool(tool)).toBe(esperado)
  })
})
