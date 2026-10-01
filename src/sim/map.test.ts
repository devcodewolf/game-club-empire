import { describe, expect, it } from 'vitest'
import { executeCommand } from './commands'
import type { Rotation, TileCoord } from './geometry'
import {
  createMapState,
  EMPTY_TILE,
  isParcelOwned,
  isTileOwned,
  parcelGridSize,
  parcelRect,
  validatePlacement,
  type MapState,
  type PlacementError,
} from './map'
import { createTestMap, TEST_CATALOG } from './test-fixtures'

/** Coloca un edificio por comando y falla el test si no se pudo. */
function place(state: MapState, buildingType: string, origin: TileCoord, rotation: Rotation = 0) {
  const result = executeCommand(
    state,
    { type: 'placeBuilding', buildingType, origin, rotation },
    TEST_CATALOG,
  )
  expect(result.ok).toBe(true)
}

describe('createMapState', () => {
  const state = createTestMap()

  it('crea los arrays con el tamaño correcto', () => {
    expect(state.occupancy).toHaveLength(20 * 20)
    expect(state.ownedParcels).toHaveLength(4 * 4)
  })

  it('marca como compradas solo las parcelas iniciales', () => {
    const owned = state.ownedParcels.flatMap((value, i) => (value ? [i] : []))
    // Parcelas (0,0), (1,0), (0,1) y (1,1) en una rejilla de 4 de ancho.
    expect(owned).toEqual([0, 1, 4, 5])
  })

  it('empieza con todo libre, sin edificios y con nextBuildingId = 1', () => {
    expect(state.occupancy.every((id) => id === EMPTY_TILE)).toBe(true)
    expect(state.buildings).toEqual({})
    expect(state.nextBuildingId).toBe(1)
  })
})

describe('parcelGridSize y parcelRect', () => {
  const state = createTestMap({ size: { width: 22, height: 13 } })

  it('redondea hacia arriba cuando el mapa no es múltiplo de la parcela', () => {
    expect(parcelGridSize(state)).toEqual({ width: 5, height: 3 })
  })

  it('parcelRect devuelve la parcela completa en el interior', () => {
    expect(parcelRect(state, { x: 1, y: 1 })).toEqual({ x: 5, y: 5, width: 5, height: 5 })
  })

  it('parcelRect recorta las parcelas del borde derecho e inferior', () => {
    expect(parcelRect(state, { x: 4, y: 0 })).toEqual({ x: 20, y: 0, width: 2, height: 5 })
    expect(parcelRect(state, { x: 0, y: 2 })).toEqual({ x: 0, y: 10, width: 5, height: 3 })
    expect(parcelRect(state, { x: 4, y: 2 })).toEqual({ x: 20, y: 10, width: 2, height: 3 })
  })
})

describe('isParcelOwned e isTileOwned', () => {
  const state = createTestMap()

  it.each<[string, TileCoord, boolean]>([
    ['parcela inicial (1,1)', { x: 1, y: 1 }, true],
    ['parcela no comprada (2,0)', { x: 2, y: 0 }, false],
    ['parcela fuera del mapa por la derecha', { x: 4, y: 0 }, false],
    ['parcela fuera del mapa por abajo', { x: 0, y: 4 }, false],
    ['parcela con coordenada negativa', { x: -1, y: 0 }, false],
  ])('isParcelOwned: %s', (_nombre, parcel, esperado) => {
    expect(isParcelOwned(state, parcel)).toBe(esperado)
  })

  it.each<[string, TileCoord, boolean]>([
    ['esquina (0,0)', { x: 0, y: 0 }, true],
    ['última casilla propia (9,9)', { x: 9, y: 9 }, true],
    ['primera casilla ajena en x (10,0)', { x: 10, y: 0 }, false],
    ['primera casilla ajena en y (0,10)', { x: 0, y: 10 }, false],
    ['casilla fuera del mapa', { x: 25, y: 0 }, false],
    ['casilla negativa', { x: -1, y: -1 }, false],
  ])('isTileOwned: %s', (_nombre, tile, esperado) => {
    expect(isTileOwned(state, tile)).toBe(esperado)
  })

  it('con un mapa sin parcelas iniciales nada es propio', () => {
    const vacio = createMapState({
      size: { width: 10, height: 10 },
      parcelSize: 5,
      initialParcels: [],
    })
    expect(isTileOwned(vacio, { x: 0, y: 0 })).toBe(false)
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

  it('acepta un edificio en zona propia y devuelve su huella', () => {
    const check = validatePlacement(createTestMap(), TEST_CATALOG, 'wide', { x: 2, y: 3 }, 0)
    expect(check).toEqual({ ok: true, rect: { x: 2, y: 3, width: 3, height: 2 } })
  })

  it('acepta un edificio que llega justo al límite de la zona propia', () => {
    expect(validatePlacement(createTestMap(), TEST_CATALOG, 'big', { x: 6, y: 6 }, 0).ok).toBe(true)
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
    ['sobresale una casilla por la derecha de la zona propia', 'big', { x: 7, y: 0 }],
    ['sobresale una casilla por abajo de la zona propia', 'big', { x: 0, y: 7 }],
    ['sobresale una casilla en la esquina', 'big', { x: 7, y: 7 }],
    ['está justo fuera de la zona propia', 'small', { x: 10, y: 0 }],
    ['está entera en una parcela ajena', 'small', { x: 12, y: 12 }],
  ])('devuelve parcelNotOwned si %s', (_nombre, tipo, origin) => {
    const check = validatePlacement(createTestMap(), TEST_CATALOG, tipo, origin, 0)
    expect(check.ok).toBe(false)
    expect(!check.ok && check.reason).toBe('parcelNotOwned')
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
      ['sin girar no cabe (sobresale en x)', { x: 8, y: 0 }, 0, false],
      ['girado cabe en el mismo sitio', { x: 8, y: 0 }, 1, true],
      ['girado 270° también cabe', { x: 8, y: 0 }, 3, true],
      ['sin girar cabe en horizontal', { x: 0, y: 8 }, 0, true],
      ['girado no cabe (sobresale en y)', { x: 0, y: 8 }, 1, false],
      ['girado 180° cabe como sin girar', { x: 0, y: 8 }, 2, true],
    ])('wide 3×2: %s', (_nombre, origin, rotation, cabe) => {
      const check = validatePlacement(createTestMap(), TEST_CATALOG, 'wide', origin, rotation)
      expect(check.ok).toBe(cabe)
    })

    it('el motivo del rechazo por giro es parcelNotOwned', () => {
      const check = validatePlacement(createTestMap(), TEST_CATALOG, 'wide', { x: 0, y: 8 }, 1)
      const motivo: PlacementError | undefined = check.ok ? undefined : check.reason
      expect(motivo).toBe('parcelNotOwned')
    })

    it('la huella devuelta refleja el giro', () => {
      const check = validatePlacement(createTestMap(), TEST_CATALOG, 'wide', { x: 8, y: 0 }, 1)
      expect(check).toEqual({ ok: true, rect: { x: 8, y: 0, width: 2, height: 3 } })
    })
  })

  it('no modifica el estado, ni en éxito ni en error', () => {
    const state = createTestMap()
    place(state, 'small', { x: 0, y: 0 })
    const antes = structuredClone(state)

    validatePlacement(state, TEST_CATALOG, 'wide', { x: 3, y: 3 }, 0)
    validatePlacement(state, TEST_CATALOG, 'small', { x: 0, y: 0 }, 0)
    validatePlacement(state, TEST_CATALOG, 'big', { x: 18, y: 18 }, 0)
    validatePlacement(state, TEST_CATALOG, 'big', { x: 8, y: 8 }, 0)
    validatePlacement(state, TEST_CATALOG, 'noExiste', { x: 0, y: 0 }, 0)

    expect(state).toEqual(antes)
  })
})
