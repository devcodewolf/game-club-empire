/** Muros, cimientos, puertas y demolición de estructuras. */
import { describe, expect, it } from 'vitest'
import { executeCommand, type Command } from '../../commands'
import { perimeterTiles, tilesInRect, type TileCoord, type TileRect } from '../../geometry'
import { buildingAt, floorAt, validatePlacement, type MapState } from '../map'
import {
  applyDemolishStructures,
  applyDoor,
  applyFoundation,
  applyWalls,
  doorAt,
  doorAxis,
  isIndoor,
  validateDemolishStructures,
  validateDoor,
  validateFoundation,
  validateWalls,
  wallAt,
} from '../structures'
import { NO_DOOR, NO_WALL } from '../structureTypes'
import { createTestMap, TEST_CATALOG, TEST_CONTENT } from '../../__tests__/fixtures'

const rect = (x: number, y: number, width: number, height: number): TileRect => ({
  x,
  y,
  width,
  height,
})

/** Ejecuta un comando con el contenido de prueba. */
const run = (state: MapState, command: Command) => executeCommand(state, command, TEST_CONTENT)

/** Construye unos cimientos de ladrillo con suelo de tierra (salvo que se indique). */
const foundation = (state: MapState, area: TileRect, floor = 'dirt', wall = 'brick') =>
  run(state, { type: 'buildFoundation', rect: area, wall, floor })

const place = (state: MapState, buildingType: string, origin: TileCoord) =>
  run(state, { type: 'placeBuilding', buildingType, origin, rotation: 0 })

const key = (tile: TileCoord): string => `${tile.x},${tile.y}`

describe('validateWalls / applyWalls', () => {
  it('acepta un tramo libre y lo levanta', () => {
    const state = createTestMap()
    const area = rect(2, 3, 5, 1)

    expect(validateWalls(state, TEST_CONTENT, area, 'brick')).toEqual({ ok: true })
    applyWalls(state, area, 'brick')

    for (const tile of tilesInRect(area)) expect(wallAt(state, tile)).toBe('brick')
    expect(wallAt(state, { x: 7, y: 3 })).toBe(NO_WALL)
  })

  it('rechaza un muro desconocido', () => {
    expect(validateWalls(createTestMap(), TEST_CONTENT, rect(2, 2, 3, 1), 'oro')).toEqual({
      ok: false,
      reason: 'unknownWall',
    })
  })

  it('rechaza un rectángulo fuera del mapa', () => {
    const state = createTestMap()
    expect(validateWalls(state, TEST_CONTENT, rect(18, 0, 5, 1), 'brick')).toEqual({
      ok: false,
      reason: 'outOfBounds',
    })
    expect(validateWalls(state, TEST_CONTENT, rect(-1, 0, 3, 1), 'brick')).toEqual({
      ok: false,
      reason: 'outOfBounds',
    })
  })

  it('rechaza casillas reservadas (columna 18 del fixture)', () => {
    expect(validateWalls(createTestMap(), TEST_CONTENT, rect(16, 5, 3, 1), 'brick')).toEqual({
      ok: false,
      reason: 'reserved',
    })
  })

  it('rechaza casillas con un edificio', () => {
    const state = createTestMap()
    place(state, 'small', { x: 4, y: 3 })

    expect(validateWalls(state, TEST_CONTENT, rect(2, 3, 5, 1), 'brick')).toEqual({
      ok: false,
      reason: 'occupied',
    })
  })

  it('rechaza casillas con una puerta', () => {
    const state = createTestMap()
    applyWalls(state, rect(2, 3, 5, 1), 'brick')
    applyDoor(state, { x: 4, y: 3 }, 'door')

    expect(validateWalls(state, TEST_CONTENT, rect(2, 3, 5, 1), 'brick')).toEqual({
      ok: false,
      reason: 'occupied',
    })
  })

  it('rechaza repetir el mismo muro (nothingToBuild) pero permite cambiar de tipo', () => {
    const state = createTestMap()
    applyWalls(state, rect(2, 3, 5, 1), 'brick')

    expect(validateWalls(state, TEST_CONTENT, rect(2, 3, 5, 1), 'brick')).toEqual({
      ok: false,
      reason: 'nothingToBuild',
    })
    expect(validateWalls(state, TEST_CONTENT, rect(2, 3, 5, 1), 'fence')).toEqual({ ok: true })
  })
})

describe('cimientos', () => {
  const check = (area: TileRect, wall = 'brick', floor = 'dirt') =>
    validateFoundation(createTestMap(), TEST_CONTENT, area, wall, floor)

  it('rechaza unos cimientos demasiado pequeños (2×5)', () => {
    expect(check(rect(2, 2, 2, 5))).toEqual({ ok: false, reason: 'tooSmall' })
  })

  it('acepta el tamaño mínimo 3×3', () => {
    expect(check(rect(2, 2, 3, 3))).toEqual({ ok: true })
  })

  it('rechaza muros no estructurales', () => {
    expect(check(rect(2, 2, 5, 5), 'fence')).toEqual({ ok: false, reason: 'notStructural' })
  })

  it('rechaza muros y suelos desconocidos', () => {
    expect(check(rect(2, 2, 5, 5), 'oro')).toEqual({ ok: false, reason: 'unknownWall' })
    expect(check(rect(2, 2, 5, 5), 'brick', 'lava')).toEqual({ ok: false, reason: 'unknownFloor' })
  })

  it('rechaza zonas fuera del mapa o reservadas', () => {
    expect(check(rect(16, 2, 5, 5))).toEqual({ ok: false, reason: 'outOfBounds' })
    expect(check(rect(15, 2, 5, 5))).toEqual({ ok: false, reason: 'reserved' })
  })

  it('levanta los muros EXACTAMENTE en el perímetro', () => {
    const state = createTestMap()
    const area = rect(3, 4, 6, 5)
    expect(foundation(state, area).ok).toBe(true)

    const perimeter = new Set([...perimeterTiles(area)].map(key))
    for (const tile of tilesInRect(rect(0, 0, 18, 20))) {
      const hasWall = wallAt(state, tile) !== NO_WALL
      expect(hasWall, key(tile)).toBe(perimeter.has(key(tile)))
    }
  })

  it('pone el suelo pedido y la zona interior solo dentro', () => {
    const state = createTestMap()
    const area = rect(3, 4, 6, 5)
    foundation(state, area, 'stone')

    const perimeter = new Set([...perimeterTiles(area)].map(key))
    for (const tile of tilesInRect(area)) {
      expect(floorAt(state, tile), key(tile)).toBe('stone')
      expect(isIndoor(state, tile), key(tile)).toBe(!perimeter.has(key(tile)))
    }
    // Fuera de los cimientos no cambia nada
    expect(floorAt(state, { x: 2, y: 4 })).toBe('grass')
    expect(isIndoor(state, { x: 2, y: 4 })).toBe(false)
  })

  it('un objeto en el perímetro impide los cimientos', () => {
    const state = createTestMap()
    place(state, 'small', { x: 2, y: 2 })

    expect(foundation(state, rect(2, 2, 5, 5))).toEqual({ ok: false, reason: 'occupied' })
  })

  it('un objeto dentro no impide los cimientos y sigue ahí', () => {
    const state = createTestMap()
    place(state, 'small', { x: 4, y: 4 })

    expect(foundation(state, rect(2, 2, 5, 5)).ok).toBe(true)
    expect(buildingAt(state, { x: 4, y: 4 })?.type).toBe('small')
    expect(isIndoor(state, { x: 4, y: 4 })).toBe(true)
  })

  it('respeta las puertas que ya había en el perímetro', () => {
    const state = createTestMap()
    const area = rect(2, 2, 5, 5)
    foundation(state, area)
    const doorTile = { x: 4, y: 2 }
    expect(run(state, { type: 'placeDoor', tile: doorTile, door: 'door' }).ok).toBe(true)

    expect(foundation(state, area, 'stone').ok).toBe(true)

    expect(doorAt(state, doorTile)).toBe('door')
    expect(wallAt(state, doorTile)).toBe(NO_WALL)
  })

  it('applyFoundation por sí sola deja indoor solo el interior', () => {
    const state = createTestMap()
    applyFoundation(state, rect(2, 2, 3, 3), 'brick', 'dirt')
    expect(isIndoor(state, { x: 3, y: 3 })).toBe(true)
    expect(isIndoor(state, { x: 2, y: 2 })).toBe(false)
  })

  describe('fusión de cimientos solapados', () => {
    it('comparten el muro de la columna común y ambos interiores quedan indoor', () => {
      const state = createTestMap()
      expect(foundation(state, rect(0, 0, 5, 5)).ok).toBe(true)
      expect(foundation(state, rect(4, 0, 5, 5)).ok).toBe(true)

      // La columna 4 sigue siendo muro de arriba abajo, incluidos los bordes superior e inferior
      for (let y = 0; y < 5; y++) {
        expect(wallAt(state, { x: 4, y }), `y=${y}`).toBe('brick')
        expect(isIndoor(state, { x: 4, y }), `y=${y}`).toBe(false)
      }
      for (const area of [rect(1, 1, 3, 3), rect(5, 1, 3, 3)]) {
        for (const tile of tilesInRect(area)) {
          expect(isIndoor(state, tile), key(tile)).toBe(true)
          expect(wallAt(state, tile), key(tile)).toBe(NO_WALL)
        }
      }
    })

    it('elimina un muro antiguo que queda dentro de los nuevos cimientos', () => {
      const state = createTestMap()
      expect(foundation(state, rect(3, 3, 3, 3)).ok).toBe(true)
      expect(wallAt(state, { x: 3, y: 3 })).toBe('brick')

      expect(foundation(state, rect(1, 1, 7, 7)).ok).toBe(true)

      for (const tile of tilesInRect(rect(2, 2, 5, 5))) {
        expect(wallAt(state, tile), key(tile)).toBe(NO_WALL)
        expect(isIndoor(state, tile), key(tile)).toBe(true)
      }
    })

    it('elimina también una puerta antigua que queda dentro', () => {
      const state = createTestMap()
      foundation(state, rect(3, 3, 5, 5))
      run(state, { type: 'placeDoor', tile: { x: 5, y: 3 }, door: 'door' })

      expect(foundation(state, rect(1, 1, 9, 9)).ok).toBe(true)
      expect(doorAt(state, { x: 5, y: 3 })).toBe(NO_DOOR)
    })
  })
})

describe('doorAxis', () => {
  it('devuelve vertical con muros a izquierda y derecha', () => {
    const state = createTestMap()
    applyWalls(state, rect(3, 5, 3, 1), 'brick')
    expect(doorAxis(state, { x: 4, y: 5 })).toBe('vertical')
  })

  it('devuelve horizontal con muros arriba y abajo', () => {
    const state = createTestMap()
    applyWalls(state, rect(4, 4, 1, 3), 'brick')
    expect(doorAxis(state, { x: 4, y: 5 })).toBe('horizontal')
  })

  it('devuelve null en una esquina', () => {
    const state = createTestMap()
    applyWalls(state, rect(4, 5, 2, 1), 'brick')
    applyWalls(state, rect(4, 6, 1, 1), 'brick')
    expect(doorAxis(state, { x: 4, y: 5 })).toBeNull()
  })

  it('devuelve null en una T', () => {
    const state = createTestMap()
    applyWalls(state, rect(3, 5, 3, 1), 'brick')
    applyWalls(state, rect(4, 6, 1, 1), 'brick')
    expect(doorAxis(state, { x: 4, y: 5 })).toBeNull()
  })

  it('devuelve null en un muro aislado', () => {
    const state = createTestMap()
    applyWalls(state, rect(4, 5, 1, 1), 'brick')
    expect(doorAxis(state, { x: 4, y: 5 })).toBeNull()
  })

  it('cuenta las puertas vecinas como cerramiento', () => {
    const state = createTestMap()
    applyWalls(state, rect(3, 5, 3, 1), 'brick')
    applyDoor(state, { x: 3, y: 5 }, 'door')
    expect(doorAxis(state, { x: 4, y: 5 })).toBe('vertical')
  })
})

describe('puertas', () => {
  const stateWithWall = (): MapState => {
    const state = createTestMap()
    applyWalls(state, rect(3, 5, 5, 1), 'brick')
    return state
  }

  it('rechaza una puerta desconocida', () => {
    expect(validateDoor(stateWithWall(), TEST_CONTENT, { x: 5, y: 5 }, 'oro')).toEqual({
      ok: false,
      reason: 'unknownDoor',
    })
  })

  it('rechaza casillas fuera del mapa y reservadas', () => {
    const state = stateWithWall()
    expect(validateDoor(state, TEST_CONTENT, { x: 25, y: 5 }, 'door')).toEqual({
      ok: false,
      reason: 'outOfBounds',
    })
    expect(validateDoor(state, TEST_CONTENT, { x: 18, y: 5 }, 'door')).toEqual({
      ok: false,
      reason: 'reserved',
    })
  })

  it('rechaza una casilla sin muro (notOnWall)', () => {
    expect(validateDoor(stateWithWall(), TEST_CONTENT, { x: 5, y: 8 }, 'door')).toEqual({
      ok: false,
      reason: 'notOnWall',
    })
  })

  it('rechaza una esquina (notStraightWall)', () => {
    const state = stateWithWall()
    // Extremo del muro: solo tiene vecino a un lado
    expect(validateDoor(state, TEST_CONTENT, { x: 3, y: 5 }, 'door')).toEqual({
      ok: false,
      reason: 'notStraightWall',
    })
    // Esquina real
    applyWalls(state, rect(7, 6, 1, 2), 'brick')
    expect(validateDoor(state, TEST_CONTENT, { x: 7, y: 5 }, 'door')).toEqual({
      ok: false,
      reason: 'notStraightWall',
    })
  })

  it('acepta un muro recto', () => {
    expect(validateDoor(stateWithWall(), TEST_CONTENT, { x: 5, y: 5 }, 'door')).toEqual({
      ok: true,
    })
  })

  it('applyDoor quita el muro y pone la puerta', () => {
    const state = stateWithWall()
    applyDoor(state, { x: 5, y: 5 }, 'door')

    expect(wallAt(state, { x: 5, y: 5 })).toBe(NO_WALL)
    expect(doorAt(state, { x: 5, y: 5 })).toBe('door')
    expect(wallAt(state, { x: 4, y: 5 })).toBe('brick')
  })

  it('tras colocar la puerta ya no se puede construir un edificio ahí (wall)', () => {
    const state = stateWithWall()
    applyDoor(state, { x: 5, y: 5 }, 'door')

    expect(validatePlacement(state, TEST_CATALOG, 'small', { x: 5, y: 5 }, 0)).toMatchObject({
      ok: false,
      reason: 'wall',
    })
  })

  it('un edificio tampoco se puede colocar sobre un muro (wall)', () => {
    expect(
      validatePlacement(stateWithWall(), TEST_CATALOG, 'small', { x: 4, y: 5 }, 0),
    ).toMatchObject({ ok: false, reason: 'wall' })
  })
})

describe('demolición de estructuras', () => {
  it('quita muros y puertas pero mantiene suelo e indoor', () => {
    const state = createTestMap()
    const area = rect(2, 2, 5, 5)
    foundation(state, area, 'stone')
    run(state, { type: 'placeDoor', tile: { x: 4, y: 2 }, door: 'door' })

    applyDemolishStructures(state, area)

    for (const tile of tilesInRect(area)) {
      expect(wallAt(state, tile), key(tile)).toBe(NO_WALL)
      expect(doorAt(state, tile), key(tile)).toBe(NO_DOOR)
      expect(floorAt(state, tile), key(tile)).toBe('stone')
    }
    expect(isIndoor(state, { x: 4, y: 4 })).toBe(true)
  })

  it('solo afecta al rectángulo indicado', () => {
    const state = createTestMap()
    foundation(state, rect(2, 2, 5, 5))

    applyDemolishStructures(state, rect(2, 2, 5, 1))

    expect(wallAt(state, { x: 3, y: 2 })).toBe(NO_WALL)
    expect(wallAt(state, { x: 3, y: 6 })).toBe('brick')
  })

  it('rechaza una zona sin estructuras (nothingToDemolish)', () => {
    expect(validateDemolishStructures(createTestMap(), rect(2, 2, 4, 4))).toEqual({
      ok: false,
      reason: 'nothingToDemolish',
    })
  })

  it('una puerta suelta cuenta como algo que demoler', () => {
    const state = createTestMap()
    applyWalls(state, rect(3, 5, 3, 1), 'brick')
    applyDoor(state, { x: 4, y: 5 }, 'door')
    expect(validateDemolishStructures(state, rect(4, 5, 1, 1))).toEqual({ ok: true })
  })

  it('rechaza zonas fuera del mapa o reservadas', () => {
    const state = createTestMap()
    expect(validateDemolishStructures(state, rect(19, 0, 3, 1))).toEqual({
      ok: false,
      reason: 'outOfBounds',
    })
    expect(validateDemolishStructures(state, rect(17, 0, 2, 1))).toEqual({
      ok: false,
      reason: 'reserved',
    })
  })
})

describe('comandos de estructuras', () => {
  /** Ejecuta un comando inválido y comprueba el motivo y que el estado no cambió. */
  const expectRejected = (command: Command, reason: string, state = createTestMap()) => {
    const before = structuredClone(state)
    expect(run(state, command)).toEqual({ ok: false, reason })
    expect(state).toEqual(before)
  }

  it('buildWalls devuelve structuresChanged con causa walls', () => {
    const state = createTestMap()
    const area = rect(2, 2, 4, 1)

    expect(run(state, { type: 'buildWalls', rect: area, wall: 'brick' })).toEqual({
      ok: true,
      event: { type: 'structuresChanged', rect: area, cause: 'walls' },
    })
    expect(wallAt(state, { x: 2, y: 2 })).toBe('brick')
  })

  it('buildFoundation devuelve structuresChanged con causa foundation', () => {
    const state = createTestMap()
    const area = rect(2, 2, 5, 5)

    expect(foundation(state, area)).toEqual({
      ok: true,
      event: { type: 'structuresChanged', rect: area, cause: 'foundation' },
    })
  })

  it('placeDoor devuelve structuresChanged 1×1 con causa door', () => {
    const state = createTestMap()
    run(state, { type: 'buildWalls', rect: rect(2, 2, 5, 1), wall: 'brick' })

    expect(run(state, { type: 'placeDoor', tile: { x: 4, y: 2 }, door: 'door' })).toEqual({
      ok: true,
      event: { type: 'structuresChanged', rect: rect(4, 2, 1, 1), cause: 'door' },
    })
    expect(doorAt(state, { x: 4, y: 2 })).toBe('door')
  })

  it('demolishStructures devuelve structuresChanged con causa demolish', () => {
    const state = createTestMap()
    const area = rect(2, 2, 5, 5)
    foundation(state, area)

    expect(run(state, { type: 'demolishStructures', rect: area })).toEqual({
      ok: true,
      event: { type: 'structuresChanged', rect: area, cause: 'demolish' },
    })
    expect(wallAt(state, { x: 2, y: 2 })).toBe(NO_WALL)
  })

  it('un buildWalls inválido deja el estado idéntico', () => {
    expectRejected({ type: 'buildWalls', rect: rect(16, 5, 3, 1), wall: 'brick' }, 'reserved')
    expectRejected({ type: 'buildWalls', rect: rect(2, 2, 3, 1), wall: 'oro' }, 'unknownWall')
  })

  it('un buildFoundation inválido deja el estado idéntico', () => {
    expectRejected(
      { type: 'buildFoundation', rect: rect(2, 2, 2, 5), wall: 'brick', floor: 'dirt' },
      'tooSmall',
    )
    expectRejected(
      { type: 'buildFoundation', rect: rect(2, 2, 5, 5), wall: 'fence', floor: 'dirt' },
      'notStructural',
    )
  })

  it('un buildFoundation bloqueado por un objeto deja el estado idéntico', () => {
    const state = createTestMap()
    place(state, 'small', { x: 2, y: 2 })
    expectRejected(
      { type: 'buildFoundation', rect: rect(2, 2, 5, 5), wall: 'brick', floor: 'dirt' },
      'occupied',
      state,
    )
  })

  it('un placeDoor inválido deja el estado idéntico', () => {
    expectRejected({ type: 'placeDoor', tile: { x: 4, y: 4 }, door: 'door' }, 'notOnWall')
    expectRejected({ type: 'placeDoor', tile: { x: 4, y: 4 }, door: 'oro' }, 'unknownDoor')
  })

  it('un demolishStructures inválido deja el estado idéntico', () => {
    expectRejected({ type: 'demolishStructures', rect: rect(2, 2, 4, 4) }, 'nothingToDemolish')
  })
})
