import { describe, expect, it } from 'vitest'
import { executeCommand, type Command } from './commands'
import type { Rotation, TileCoord } from './geometry'
import { buildingAt, isParcelOwned, isTileOwned, type MapState } from './map'
import { createTestMap, TEST_CATALOG } from './test-fixtures'

// ── Atajos para construir comandos ───────────────────────────────

const placeCmd = (buildingType: string, origin: TileCoord, rotation: Rotation = 0): Command => ({
  type: 'placeBuilding',
  buildingType,
  origin,
  rotation,
})
const demolishCmd = (buildingId: number): Command => ({ type: 'demolishBuilding', buildingId })
const buyCmd = (parcel: TileCoord): Command => ({ type: 'buyParcel', parcel })

const run = (state: MapState, command: Command) => executeCommand(state, command, TEST_CATALOG)

/** Número de casillas ocupadas por un id de edificio. */
const countTiles = (state: MapState, id: number) => state.occupancy.filter((v) => v === id).length

describe('placeBuilding', () => {
  it('crea el edificio con id 1 y devuelve el evento buildingPlaced', () => {
    const state = createTestMap()
    const result = run(state, placeCmd('wide', { x: 2, y: 3 }, 1))

    const esperado = { id: 1, type: 'wide', origin: { x: 2, y: 3 }, rotation: 1 }
    expect(result).toEqual({ ok: true, event: { type: 'buildingPlaced', building: esperado } })
    expect(state.buildings[1]).toEqual(esperado)
    expect(state.nextBuildingId).toBe(2)
  })

  it('asigna ids consecutivos 1, 2, 3…', () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    run(state, placeCmd('small', { x: 1, y: 0 }))
    run(state, placeCmd('small', { x: 2, y: 0 }))

    expect(Object.keys(state.buildings)).toEqual(['1', '2', '3'])
  })

  it('no reutiliza ids tras demoler', () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    run(state, placeCmd('small', { x: 1, y: 0 }))
    run(state, demolishCmd(2))
    const result = run(state, placeCmd('small', { x: 1, y: 0 }))

    expect(result.ok && result.event.type === 'buildingPlaced' && result.event.building.id).toBe(3)
    expect(Object.keys(state.buildings)).toEqual(['1', '3'])
  })

  it.each<[string, string, Rotation, number]>([
    ['small', 'small', 0, 1],
    ['wide sin girar', 'wide', 0, 6],
    ['wide girado', 'wide', 1, 6],
    ['big', 'big', 0, 16],
  ])(
    'rellena occupancy en exactamente las casillas de la huella (%s)',
    (_nombre, tipo, rotation, casillas) => {
      const state = createTestMap()
      run(state, placeCmd(tipo, { x: 3, y: 3 }, rotation))

      expect(countTiles(state, 1)).toBe(casillas)
      expect(state.occupancy.filter((v) => v !== 0)).toHaveLength(casillas)
    },
  )

  it('ocupa las casillas correctas con un edificio girado', () => {
    const state = createTestMap()
    run(state, placeCmd('wide', { x: 3, y: 3 }, 1)) // huella 2×3: x 3..4, y 3..5

    expect(buildingAt(state, { x: 4, y: 5 })?.id).toBe(1)
    expect(buildingAt(state, { x: 5, y: 3 })).toBeUndefined()
    expect(buildingAt(state, { x: 3, y: 6 })).toBeUndefined()
  })

  it.each<[string, string, TileCoord, string]>([
    ['tipo desconocido', 'noExiste', { x: 0, y: 0 }, 'unknownBuilding'],
    ['fuera del mapa', 'small', { x: 20, y: 0 }, 'outOfBounds'],
    ['parcela no comprada', 'big', { x: 8, y: 8 }, 'parcelNotOwned'],
  ])('inválido (%s): devuelve el motivo y deja el estado idéntico', (_n, tipo, origin, motivo) => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    const antes = structuredClone(state)

    expect(run(state, placeCmd(tipo, origin))).toEqual({ ok: false, reason: motivo })
    expect(state).toEqual(antes)
  })

  it('inválido (solapa con otro): devuelve occupied y deja el estado idéntico', () => {
    const state = createTestMap()
    run(state, placeCmd('wide', { x: 2, y: 2 }))
    const antes = structuredClone(state)

    expect(run(state, placeCmd('big', { x: 4, y: 3 }))).toEqual({ ok: false, reason: 'occupied' })
    expect(state).toEqual(antes)
    expect(state.nextBuildingId).toBe(2)
  })
})

describe('demolishBuilding', () => {
  it('libera las casillas, borra el edificio y devuelve el evento', () => {
    const state = createTestMap()
    run(state, placeCmd('wide', { x: 2, y: 2 }))
    const colocado = state.buildings[1]

    const result = run(state, demolishCmd(1))

    expect(result).toEqual({ ok: true, event: { type: 'buildingDemolished', building: colocado } })
    expect(state.buildings[1]).toBeUndefined()
    expect(countTiles(state, 1)).toBe(0)
    expect(state.occupancy.every((v) => v === 0)).toBe(true)
  })

  it('solo libera las casillas del edificio demolido', () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    run(state, placeCmd('wide', { x: 1, y: 0 }))
    run(state, demolishCmd(2))

    expect(buildingAt(state, { x: 0, y: 0 })?.id).toBe(1)
    expect(countTiles(state, 2)).toBe(0)
  })

  it('con un id inexistente devuelve buildingNotFound sin cambios', () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    const antes = structuredClone(state)

    expect(run(state, demolishCmd(99))).toEqual({ ok: false, reason: 'buildingNotFound' })
    expect(state).toEqual(antes)
  })

  it('demoler dos veces el mismo edificio falla la segunda', () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    run(state, demolishCmd(1))

    expect(run(state, demolishCmd(1))).toEqual({ ok: false, reason: 'buildingNotFound' })
  })

  it('permite volver a construir en la zona liberada', () => {
    const state = createTestMap()
    run(state, placeCmd('big', { x: 2, y: 2 }))
    expect(run(state, placeCmd('small', { x: 3, y: 3 }))).toEqual({ ok: false, reason: 'occupied' })

    run(state, demolishCmd(1))
    const result = run(state, placeCmd('big', { x: 2, y: 2 }))

    expect(result.ok).toBe(true)
    expect(countTiles(state, 2)).toBe(16)
  })
})

describe('buyParcel', () => {
  it('rechaza una parcela con coordenadas no enteras', () => {
    const state = createTestMap()
    expect(run(state, buyCmd({ x: 2.5, y: 0 }))).toEqual({ ok: false, reason: 'outOfBounds' })
  })

  it('compra una parcela adyacente y devuelve el evento', () => {
    const state = createTestMap()
    const result = run(state, buyCmd({ x: 2, y: 0 }))

    expect(result).toEqual({ ok: true, event: { type: 'parcelBought', parcel: { x: 2, y: 0 } } })
    expect(isParcelOwned(state, { x: 2, y: 0 })).toBe(true)
    expect(isTileOwned(state, { x: 10, y: 0 })).toBe(true)
  })

  it.each<[string, TileCoord, string]>([
    ['ya comprada', { x: 1, y: 1 }, 'alreadyOwned'],
    ['solo en diagonal', { x: 2, y: 2 }, 'notAdjacent'],
    ['lejos de las propias', { x: 3, y: 3 }, 'notAdjacent'],
    ['fuera del mapa por la derecha', { x: 4, y: 0 }, 'outOfBounds'],
    ['fuera del mapa por abajo', { x: 0, y: 4 }, 'outOfBounds'],
    ['con coordenada negativa', { x: -1, y: 0 }, 'outOfBounds'],
  ])('rechaza una parcela %s con %s', (_nombre, parcel, motivo) => {
    const state = createTestMap()
    const antes = structuredClone(state)

    expect(run(state, buyCmd(parcel))).toEqual({ ok: false, reason: motivo })
    expect(state).toEqual(antes)
  })

  it('tras comprar se puede construir en la parcela nueva y en la siguiente adyacente', () => {
    const state = createTestMap()
    expect(run(state, placeCmd('big', { x: 10, y: 0 })).ok).toBe(false)

    expect(run(state, buyCmd({ x: 2, y: 0 })).ok).toBe(true)
    expect(run(state, placeCmd('big', { x: 10, y: 0 })).ok).toBe(true)

    // La parcela (3,0) solo es comprable ahora que (2,0) es nuestra.
    expect(run(state, placeCmd('small', { x: 15, y: 0 })).ok).toBe(false)
    expect(run(state, buyCmd({ x: 3, y: 0 })).ok).toBe(true)
    expect(run(state, placeCmd('big', { x: 15, y: 0 })).ok).toBe(true)
  })

  it('una parcela nueva hace comprable la diagonal anterior', () => {
    const state = createTestMap()
    expect(run(state, buyCmd({ x: 2, y: 2 }))).toEqual({ ok: false, reason: 'notAdjacent' })

    run(state, buyCmd({ x: 2, y: 1 }))
    expect(run(state, buyCmd({ x: 2, y: 2 })).ok).toBe(true)
  })
})

describe('determinismo', () => {
  const secuencia: Command[] = [
    placeCmd('wide', { x: 2, y: 2 }),
    placeCmd('big', { x: 6, y: 6 }),
    buyCmd({ x: 2, y: 0 }),
    placeCmd('big', { x: 10, y: 0 }),
    demolishCmd(1),
    placeCmd('small', { x: 2, y: 2 }, 3),
    buyCmd({ x: 3, y: 3 }), // inválido: no adyacente
    demolishCmd(42), // inválido: no existe
    placeCmd('wide', { x: 8, y: 0 }, 1),
  ]

  it('la misma secuencia sobre dos mapas nuevos produce estados iguales', () => {
    const a = createTestMap()
    const b = createTestMap()

    const resultadosA = secuencia.map((c) => run(a, c))
    const resultadosB = secuencia.map((c) => run(b, c))

    expect(resultadosA).toEqual(resultadosB)
    expect(a).toEqual(b)
  })
})
