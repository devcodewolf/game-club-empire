import { describe, expect, it } from 'vitest'
import { executeCommand } from './commands'
import type { Rotation, TileCoord, TileRect } from './geometry'
import {
  createMapState,
  EMPTY_TILE,
  floorAt,
  isTileReserved,
  tileIndex,
  validateFloorPaint,
  validatePlacement,
  type MapState,
  type PlacementError,
} from './map'
import { createTestMap, TEST_CATALOG, TEST_CONTENT, TEST_FLOORS } from './test-fixtures'

/** Coloca un edificio por comando y falla el test si no se pudo. */
function place(state: MapState, buildingType: string, origin: TileCoord, rotation: Rotation = 0) {
  const result = executeCommand(
    state,
    { type: 'placeBuilding', buildingType, origin, rotation },
    TEST_CONTENT,
  )
  expect(result.ok).toBe(true)
}

describe('createMapState', () => {
  const state = createTestMap()

  it('crea los arrays con el tamaño correcto', () => {
    expect(state.occupancy).toHaveLength(20 * 20)
    expect(state.floors).toHaveLength(20 * 20)
    expect(state.reserved).toHaveLength(20 * 20)
  })

  it('empieza con todo libre, sin edificios y con nextBuildingId = 1', () => {
    expect(state.occupancy.every((id) => id === EMPTY_TILE)).toBe(true)
    expect(state.buildings).toEqual({})
    expect(state.nextBuildingId).toBe(1)
  })

  it('aplica la feature: suelo de piedra y reservado en las columnas 18..19', () => {
    for (let y = 0; y < 20; y++) {
      for (const x of [18, 19]) {
        const index = tileIndex(state, { x, y })
        expect(state.floors[index]).toBe('stone')
        expect(state.reserved[index]).toBe(true)
      }
    }
  })

  it('deja hierba y sin reservar en el resto de casillas', () => {
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 18; x++) {
        const index = tileIndex(state, { x, y })
        expect(state.floors[index]).toBe('grass')
        expect(state.reserved[index]).toBe(false)
      }
    }
  })

  it('sin features todo el mapa es hierba libre', () => {
    const vacio = createMapState({ size: { width: 4, height: 3 }, features: [] })
    expect(vacio.floors.every((f) => f === 'grass')).toBe(true)
    expect(vacio.reserved.every((r) => !r)).toBe(true)
  })

  it('una feature no reservada solo cambia el suelo', () => {
    const mapa = createMapState({
      size: { width: 6, height: 6 },
      features: [{ rect: { x: 1, y: 1, width: 2, height: 2 }, floor: 'dirt', reserved: false }],
    })
    expect(floorAt(mapa, { x: 1, y: 1 })).toBe('dirt')
    expect(isTileReserved(mapa, { x: 1, y: 1 })).toBe(false)
    expect(floorAt(mapa, { x: 3, y: 3 })).toBe('grass')
  })

  it('las features se aplican en orden: la última gana', () => {
    const mapa = createMapState({
      size: { width: 6, height: 6 },
      features: [
        { rect: { x: 0, y: 0, width: 3, height: 3 }, floor: 'dirt', reserved: true },
        { rect: { x: 2, y: 2, width: 2, height: 2 }, floor: 'stone', reserved: false },
      ],
    })
    expect(floorAt(mapa, { x: 2, y: 2 })).toBe('stone')
    expect(isTileReserved(mapa, { x: 2, y: 2 })).toBe(false)
    expect(floorAt(mapa, { x: 0, y: 0 })).toBe('dirt')
    expect(isTileReserved(mapa, { x: 0, y: 0 })).toBe(true)
  })

  it('ignora las casillas de una feature que sobresale del mapa', () => {
    const mapa = createMapState({
      size: { width: 4, height: 4 },
      features: [{ rect: { x: 3, y: 3, width: 5, height: 5 }, floor: 'stone', reserved: true }],
    })
    expect(mapa.floors).toHaveLength(16)
    expect(floorAt(mapa, { x: 3, y: 3 })).toBe('stone')
    expect(mapa.reserved.filter(Boolean)).toHaveLength(1)
  })
})

describe('floorAt', () => {
  const state = createTestMap()

  it.each<[string, TileCoord, string]>([
    ['hierba en (0,0)', { x: 0, y: 0 }, 'grass'],
    ['hierba en la última columna libre', { x: 17, y: 10 }, 'grass'],
    ['piedra en la carretera', { x: 18, y: 0 }, 'stone'],
    ['piedra en la esquina inferior derecha', { x: 19, y: 19 }, 'stone'],
  ])('devuelve %s', (_nombre, tile, esperado) => {
    expect(floorAt(state, tile)).toBe(esperado)
  })

  it.each<[string, TileCoord]>([
    ['x = ancho', { x: 20, y: 0 }],
    ['y = alto', { x: 0, y: 20 }],
    ['x negativa', { x: -1, y: 0 }],
    ['y negativa', { x: 0, y: -1 }],
    ['coordenadas con decimales', { x: 0.5, y: 0 }],
  ])('devuelve undefined fuera del mapa (%s)', (_nombre, tile) => {
    expect(floorAt(state, tile)).toBeUndefined()
  })
})

describe('isTileReserved', () => {
  const state = createTestMap()

  it.each<[string, TileCoord, boolean]>([
    ['última casilla libre (17,5)', { x: 17, y: 5 }, false],
    ['primera casilla reservada (18,5)', { x: 18, y: 5 }, true],
    ['última casilla reservada (19,19)', { x: 19, y: 19 }, true],
    ['esquina (0,0)', { x: 0, y: 0 }, false],
    ['fuera del mapa por la derecha', { x: 20, y: 0 }, false],
    ['fuera del mapa con coordenada negativa', { x: -1, y: -1 }, false],
  ])('%s', (_nombre, tile, esperado) => {
    expect(isTileReserved(state, tile)).toBe(esperado)
  })
})

describe('validatePlacement', () => {
  it('rechaza un origen con decimales como outOfBounds sin tocar el estado', () => {
    const state = createTestMap()
    const before = structuredClone(state)
    const check = validatePlacement(state, TEST_CATALOG, 'small', { x: 1.5, y: 2 }, 0)

    expect(!check.ok && check.reason).toBe('outOfBounds')
    expect(state).toEqual(before)
  })

  it('acepta un edificio en zona libre y devuelve su huella', () => {
    const check = validatePlacement(createTestMap(), TEST_CATALOG, 'wide', { x: 2, y: 3 }, 0)
    expect(check).toEqual({ ok: true, rect: { x: 2, y: 3, width: 3, height: 2 } })
  })

  it('acepta un edificio que llega justo al límite de la zona libre', () => {
    expect(validatePlacement(createTestMap(), TEST_CATALOG, 'big', { x: 14, y: 14 }, 0).ok).toBe(
      true,
    )
  })

  it('rechaza un tipo de edificio desconocido', () => {
    const check = validatePlacement(createTestMap(), TEST_CATALOG, 'noExiste', { x: 0, y: 0 }, 0)
    expect(check).toEqual({ ok: false, reason: 'unknownBuilding' })
  })

  it.each<[string, string, TileCoord]>([
    ['sobresale por la derecha', 'big', { x: 17, y: 0 }],
    ['sobresale por abajo', 'big', { x: 0, y: 17 }],
    ['origen fuera por la derecha', 'small', { x: 20, y: 0 }],
    ['origen fuera por abajo', 'small', { x: 0, y: 20 }],
    ['origen con x negativa', 'small', { x: -1, y: 0 }],
    ['origen con y negativa', 'small', { x: 0, y: -1 }],
    ['sobresale por la izquierda', 'wide', { x: -2, y: 0 }],
  ])('devuelve outOfBounds si %s', (_nombre, tipo, origin) => {
    const check = validatePlacement(createTestMap(), TEST_CATALOG, tipo, origin, 0)
    expect(check.ok).toBe(false)
    expect(!check.ok && check.reason).toBe('outOfBounds')
  })

  it.each<[string, string, TileCoord]>([
    ['el edificio pisa la carretera (columna 18)', 'big', { x: 15, y: 0 }],
    ['solo una casilla del edificio toca la columna 18', 'wide', { x: 16, y: 5 }],
    ['una casilla 1×1 en la primera columna reservada', 'small', { x: 18, y: 0 }],
    ['una casilla 1×1 en la última casilla reservada', 'small', { x: 19, y: 19 }],
  ])('devuelve reserved si %s', (_nombre, tipo, origin) => {
    const check = validatePlacement(createTestMap(), TEST_CATALOG, tipo, origin, 0)
    expect(check.ok).toBe(false)
    expect(!check.ok && check.reason).toBe('reserved')
  })

  describe('con un edificio ya colocado', () => {
    // `wide` en (2,2) ocupa x 2..4, y 2..3.
    const state = createTestMap()
    place(state, 'wide', { x: 2, y: 2 })

    it.each<[string, string, TileCoord]>([
      ['solape de una sola casilla (esquina inferior derecha)', 'big', { x: 4, y: 3 }],
      ['solape de una sola casilla con un 1×1', 'small', { x: 3, y: 2 }],
      ['solape total', 'wide', { x: 2, y: 2 }],
      ['solape parcial por la izquierda', 'wide', { x: 0, y: 2 }],
    ])('devuelve occupied con %s', (_nombre, tipo, origin) => {
      const check = validatePlacement(state, TEST_CATALOG, tipo, origin, 0)
      expect(check.ok).toBe(false)
      expect(!check.ok && check.reason).toBe('occupied')
    })

    it.each<[string, string, TileCoord]>([
      ['a la derecha', 'small', { x: 5, y: 2 }],
      ['a la izquierda', 'small', { x: 1, y: 2 }],
      ['debajo', 'wide', { x: 2, y: 4 }],
      ['encima', 'wide', { x: 2, y: 0 }],
    ])('acepta un edificio pegado %s sin solaparse', (_nombre, tipo, origin) => {
      expect(validatePlacement(state, TEST_CATALOG, tipo, origin, 0).ok).toBe(true)
    })
  })

  describe('rotación', () => {
    it.each<[string, TileCoord, Rotation, boolean]>([
      ['sin girar pisa la carretera', { x: 16, y: 0 }, 0, false],
      ['girado cabe en el mismo sitio', { x: 16, y: 0 }, 1, true],
      ['girado 270° también cabe', { x: 16, y: 0 }, 3, true],
      ['sin girar cabe en horizontal', { x: 0, y: 18 }, 0, true],
      ['girado sobresale por abajo', { x: 0, y: 18 }, 1, false],
      ['girado 180° cabe como sin girar', { x: 0, y: 18 }, 2, true],
    ])('wide 3×2: %s', (_nombre, origin, rotation, cabe) => {
      const check = validatePlacement(createTestMap(), TEST_CATALOG, 'wide', origin, rotation)
      expect(check.ok).toBe(cabe)
    })

    it('el motivo del rechazo sin girar es reserved', () => {
      const check = validatePlacement(createTestMap(), TEST_CATALOG, 'wide', { x: 16, y: 0 }, 0)
      const motivo: PlacementError | undefined = check.ok ? undefined : check.reason
      expect(motivo).toBe('reserved')
    })

    it('la huella devuelta refleja el giro', () => {
      const check = validatePlacement(createTestMap(), TEST_CATALOG, 'wide', { x: 16, y: 0 }, 1)
      expect(check).toEqual({ ok: true, rect: { x: 16, y: 0, width: 2, height: 3 } })
    })
  })

  it('no modifica el estado, ni en éxito ni en error', () => {
    const state = createTestMap()
    place(state, 'small', { x: 0, y: 0 })
    const antes = structuredClone(state)

    validatePlacement(state, TEST_CATALOG, 'wide', { x: 3, y: 3 }, 0)
    validatePlacement(state, TEST_CATALOG, 'small', { x: 0, y: 0 }, 0)
    validatePlacement(state, TEST_CATALOG, 'big', { x: 18, y: 18 }, 0)
    validatePlacement(state, TEST_CATALOG, 'big', { x: 16, y: 16 }, 0)
    validatePlacement(state, TEST_CATALOG, 'noExiste', { x: 0, y: 0 }, 0)

    expect(state).toEqual(antes)
  })
})

describe('validateFloorPaint', () => {
  const check = (state: MapState, rect: TileRect, floor: string) =>
    validateFloorPaint(state, TEST_FLOORS, rect, floor)

  it('acepta pintar en zona libre y cuenta todas las casillas cambiadas', () => {
    expect(check(createTestMap(), { x: 2, y: 3, width: 4, height: 2 }, 'dirt')).toEqual({
      ok: true,
      changed: 8,
    })
  })

  it('acepta pintar justo hasta el borde de la zona libre (columna 17)', () => {
    expect(check(createTestMap(), { x: 16, y: 0, width: 2, height: 1 }, 'dirt')).toEqual({
      ok: true,
      changed: 2,
    })
  })

  it('changed solo cuenta las casillas que tenían otro suelo', () => {
    const state = createTestMap()
    // Dejamos 2 de las 6 casillas del rectángulo ya con tierra.
    state.floors[tileIndex(state, { x: 1, y: 1 })] = 'dirt'
    state.floors[tileIndex(state, { x: 2, y: 1 })] = 'dirt'

    expect(check(state, { x: 1, y: 1, width: 3, height: 2 }, 'dirt')).toEqual({
      ok: true,
      changed: 4,
    })
  })

  it('devuelve unknownFloor para un suelo que no está en el catálogo', () => {
    expect(check(createTestMap(), { x: 0, y: 0, width: 1, height: 1 }, 'lava')).toEqual({
      ok: false,
      reason: 'unknownFloor',
    })
  })

  it.each<[string, TileRect]>([
    ['sobresale por la izquierda', { x: -1, y: 0, width: 2, height: 2 }],
    ['sobresale por arriba', { x: 0, y: -1, width: 2, height: 2 }],
    ['sobresale por abajo', { x: 0, y: 19, width: 2, height: 2 }],
    ['sobresale por la derecha', { x: 19, y: 0, width: 2, height: 2 }],
    ['está completamente fuera', { x: 30, y: 30, width: 2, height: 2 }],
    ['tiene el origen con decimales', { x: 0.5, y: 0, width: 2, height: 2 }],
  ])('devuelve outOfBounds si el rectángulo %s', (_nombre, rect) => {
    expect(check(createTestMap(), rect, 'dirt')).toEqual({ ok: false, reason: 'outOfBounds' })
  })

  it('devuelve reserved si el rectángulo cae entero en la carretera', () => {
    expect(check(createTestMap(), { x: 18, y: 4, width: 2, height: 2 }, 'dirt')).toEqual({
      ok: false,
      reason: 'reserved',
    })
  })

  it('devuelve reserved aunque solo una casilla del rectángulo esté reservada', () => {
    // 3×3 en x 16..18: solo la columna 18 es reservada.
    expect(check(createTestMap(), { x: 16, y: 5, width: 3, height: 3 }, 'dirt')).toEqual({
      ok: false,
      reason: 'reserved',
    })
  })

  it('devuelve nothingToPaint si todo el rectángulo ya tiene ese suelo', () => {
    // El mapa es hierba por defecto.
    expect(check(createTestMap(), { x: 0, y: 0, width: 5, height: 5 }, 'grass')).toEqual({
      ok: false,
      reason: 'nothingToPaint',
    })
  })

  it('no modifica el estado, ni en éxito ni en error', () => {
    const state = createTestMap()
    place(state, 'small', { x: 0, y: 0 })
    const antes = structuredClone(state)

    check(state, { x: 2, y: 2, width: 3, height: 3 }, 'dirt')
    check(state, { x: 16, y: 0, width: 3, height: 1 }, 'dirt')
    check(state, { x: 19, y: 19, width: 3, height: 3 }, 'dirt')
    check(state, { x: 0, y: 0, width: 2, height: 2 }, 'grass')
    check(state, { x: 0, y: 0, width: 2, height: 2 }, 'lava')

    expect(state).toEqual(antes)
  })
})
