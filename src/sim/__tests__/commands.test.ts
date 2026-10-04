import { describe, expect, it } from 'vitest'
import { executeCommand, type Command } from '../commands'
import type { Rotation, TileCoord, TileRect } from '../geometry'
import { maxTier, pitchSurface, tierQuality, type PitchRole } from '../buildings/buildings'
import { buildingAt, floorAt, type MapState } from '../map/map'
import { createTestMap, TEST_CONTENT } from './fixtures'

// ── Atajos para construir comandos ───────────────────────────────

const paintCmd = (rect: TileRect, floor: string): Command => ({ type: 'paintFloor', rect, floor })
const placeCmd = (buildingType: string, origin: TileCoord, rotation: Rotation = 0): Command => ({
  type: 'placeBuilding',
  buildingType,
  origin,
  rotation,
})
const demolishCmd = (buildingId: number): Command => ({ type: 'demolishBuilding', buildingId })

const run = (state: MapState, command: Command) => executeCommand(state, command, TEST_CONTENT)

/** Número de casillas ocupadas por un id de edificio. */
const countTiles = (state: MapState, id: number) => state.occupancy.filter((v) => v === id).length

describe('placeBuilding', () => {
  it('crea el edificio con id 1 y devuelve el evento buildingPlaced', () => {
    const state = createTestMap()
    const result = run(state, placeCmd('wide', { x: 2, y: 3 }, 1))

    const esperado = { id: 1, type: 'wide', origin: { x: 2, y: 3 }, rotation: 1, tier: 0 }
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
    ['pisa la carretera reservada', 'big', { x: 15, y: 8 }, 'reserved'],
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

describe('determinismo', () => {
  const secuencia: Command[] = [
    placeCmd('wide', { x: 2, y: 2 }),
    placeCmd('big', { x: 6, y: 6 }),
    placeCmd('big', { x: 10, y: 0 }),
    paintCmd({ x: 0, y: 10, width: 4, height: 2 }, 'dirt'),
    paintCmd({ x: 17, y: 0, width: 2, height: 1 }, 'dirt'), // inválido: pisa la carretera
    demolishCmd(1),
    placeCmd('small', { x: 2, y: 2 }, 3),
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

describe('paintFloor', () => {
  it('cambia exactamente las casillas del rectángulo y ninguna más', () => {
    const state = createTestMap()
    const rect: TileRect = { x: 2, y: 3, width: 4, height: 2 }

    run(state, paintCmd(rect, 'dirt'))

    const pintadas = state.floors.flatMap((floor, i) => (floor === 'dirt' ? [i] : []))
    const esperadas = [3, 4].flatMap((y) => [2, 3, 4, 5].map((x) => y * 20 + x))
    expect(pintadas).toEqual(esperadas)
  })

  it('devuelve el evento floorPainted con el rect, el suelo y changed', () => {
    const state = createTestMap()
    const rect: TileRect = { x: 0, y: 0, width: 3, height: 3 }

    expect(run(state, paintCmd(rect, 'dirt'))).toEqual({
      ok: true,
      event: { type: 'floorPainted', rect, floor: 'dirt', changed: 9 },
    })
  })

  it('changed excluye las casillas que ya tenían ese suelo', () => {
    const state = createTestMap()
    run(state, paintCmd({ x: 0, y: 0, width: 2, height: 1 }, 'dirt'))

    const result = run(state, paintCmd({ x: 0, y: 0, width: 3, height: 1 }, 'dirt'))

    expect(result.ok && result.event.type === 'floorPainted' && result.event.changed).toBe(1)
  })

  it('pintar una sola casilla funciona', () => {
    const state = createTestMap()
    const result = run(state, paintCmd({ x: 5, y: 5, width: 1, height: 1 }, 'stone'))

    expect(result.ok).toBe(true)
    expect(floorAt(state, { x: 5, y: 5 })).toBe('stone')
    expect(floorAt(state, { x: 6, y: 5 })).toBe('grass')
  })

  it('se puede repintar un suelo ya pintado con otro distinto', () => {
    const state = createTestMap()
    const rect: TileRect = { x: 1, y: 1, width: 2, height: 2 }
    run(state, paintCmd(rect, 'dirt'))

    expect(run(state, paintCmd(rect, 'stone')).ok).toBe(true)
    expect(floorAt(state, { x: 2, y: 2 })).toBe('stone')
  })

  it('no toca edificios ni la numeración de ids', () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 1, y: 1 }))

    run(state, paintCmd({ x: 0, y: 0, width: 3, height: 3 }, 'dirt'))

    expect(buildingAt(state, { x: 1, y: 1 })?.id).toBe(1)
    expect(state.nextBuildingId).toBe(2)
  })

  it.each<[string, TileRect, string, string]>([
    ['suelo desconocido', { x: 0, y: 0, width: 2, height: 2 }, 'lava', 'unknownFloor'],
    ['fuera del mapa', { x: 19, y: 19, width: 2, height: 2 }, 'dirt', 'outOfBounds'],
    [
      'rectángulo con coordenada negativa',
      { x: -1, y: 0, width: 2, height: 2 },
      'dirt',
      'outOfBounds',
    ],
    ['toca una casilla reservada', { x: 17, y: 0, width: 2, height: 2 }, 'dirt', 'reserved'],
    ['todo en la carretera', { x: 18, y: 0, width: 2, height: 2 }, 'dirt', 'reserved'],
    ['ya tenía ese suelo', { x: 0, y: 0, width: 4, height: 4 }, 'grass', 'nothingToPaint'],
  ])('inválido (%s): devuelve el motivo y deja el estado idéntico', (_n, rect, floor, motivo) => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    run(state, paintCmd({ x: 10, y: 10, width: 2, height: 2 }, 'dirt'))
    const antes = structuredClone(state)

    expect(run(state, paintCmd(rect, floor))).toEqual({ ok: false, reason: motivo })
    expect(state).toEqual(antes)
  })

  it('se puede colocar un edificio sobre un suelo pintado', () => {
    const state = createTestMap()
    run(state, paintCmd({ x: 2, y: 2, width: 3, height: 2 }, 'dirt'))

    const result = run(state, placeCmd('wide', { x: 2, y: 2 }))

    expect(result.ok).toBe(true)
    expect(buildingAt(state, { x: 3, y: 3 })?.id).toBe(1)
    expect(floorAt(state, { x: 3, y: 3 })).toBe('dirt')
  })

  it('se puede pintar debajo de un edificio ya construido', () => {
    const state = createTestMap()
    run(state, placeCmd('wide', { x: 2, y: 2 }))

    expect(run(state, paintCmd({ x: 2, y: 2, width: 3, height: 2 }, 'dirt')).ok).toBe(true)
    expect(floorAt(state, { x: 2, y: 2 })).toBe('dirt')
    expect(buildingAt(state, { x: 2, y: 2 })?.id).toBe(1)
  })
})

describe('upgradeBuilding', () => {
  const upgradeCmd = (buildingId: number): Command => ({ type: 'upgradeBuilding', buildingId })

  it('sube el nivel de 0 a 1 y de 1 a 2', () => {
    const state = createTestMap()
    run(state, placeCmd('tiered', { x: 1, y: 1 }))
    expect(state.buildings[1]?.tier).toBe(0)

    expect(run(state, upgradeCmd(1)).ok).toBe(true)
    expect(state.buildings[1]?.tier).toBe(1)
    expect(run(state, upgradeCmd(1)).ok).toBe(true)
    expect(state.buildings[1]?.tier).toBe(2)
  })

  it("devuelve 'maxTier' en el último nivel", () => {
    const state = createTestMap()
    run(state, placeCmd('tiered', { x: 1, y: 1 }))
    run(state, upgradeCmd(1))
    run(state, upgradeCmd(1))

    expect(run(state, upgradeCmd(1))).toEqual({ ok: false, reason: 'maxTier' })
    expect(state.buildings[1]?.tier).toBe(2)
  })

  it("devuelve 'notUpgradable' si el objeto no tiene niveles", () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 1, y: 1 }))

    expect(run(state, upgradeCmd(1))).toEqual({ ok: false, reason: 'notUpgradable' })
  })

  it("devuelve 'buildingNotFound' si el id no existe", () => {
    const state = createTestMap()

    expect(run(state, upgradeCmd(42))).toEqual({ ok: false, reason: 'buildingNotFound' })
  })

  it('el evento lleva el edificio ya mejorado y el nivel anterior', () => {
    const state = createTestMap()
    run(state, placeCmd('tiered', { x: 1, y: 1 }))
    run(state, upgradeCmd(1))
    const result = run(state, upgradeCmd(1))

    expect(result).toEqual({
      ok: true,
      event: {
        type: 'buildingUpgraded',
        building: { id: 1, type: 'tiered', origin: { x: 1, y: 1 }, rotation: 0, tier: 2 },
        fromTier: 1,
      },
    })
  })

  it('si el comando es inválido, el estado queda idéntico', () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))
    run(state, placeCmd('tiered', { x: 1, y: 1 }))
    run(state, upgradeCmd(2))
    run(state, upgradeCmd(2))
    const antes = structuredClone(state)

    for (const id of [1, 2, 99]) expect(run(state, upgradeCmd(id)).ok).toBe(false)
    expect(state).toEqual(antes)
  })

  it('la huella y la ocupación no cambian al mejorar', () => {
    const state = createTestMap()
    run(state, placeCmd('tiered', { x: 1, y: 1 }))
    const ocupacion = [...state.occupancy]
    const origen = state.buildings[1]?.origin

    run(state, upgradeCmd(1))

    expect(state.occupancy).toEqual(ocupacion)
    expect(countTiles(state, 1)).toBe(1)
    expect(state.buildings[1]?.origin).toEqual(origen)
    expect(buildingAt(state, { x: 1, y: 1 })?.tier).toBe(1)
  })
})

describe('uso de los campos (role)', () => {
  const roleCmd = (buildingId: number, role: PitchRole): Command => ({
    type: 'setPitchRole',
    buildingId,
    role,
  })
  /** Dos campos 4×3 (ids 1 y 2) sin solaparse. */
  const twoFields = () => {
    const state = createTestMap()
    run(state, placeCmd('field', { x: 0, y: 0 }))
    run(state, placeCmd('field', { x: 5, y: 0 }))
    return state
  }

  it("el primer campo es 'main' y el segundo 'training'", () => {
    const state = twoFields()

    expect(state.buildings[1]?.role).toBe('main')
    expect(state.buildings[2]?.role).toBe('training')
  })

  it('un objeto que no es campo no tiene role', () => {
    const state = createTestMap()
    run(state, placeCmd('small', { x: 0, y: 0 }))

    expect(state.buildings[1]).not.toHaveProperty('role')
  })

  it("'reserve' cambia el uso del campo", () => {
    const state = twoFields()

    expect(run(state, roleCmd(2, 'reserve'))).toEqual({
      ok: true,
      event: { type: 'pitchRoleChanged', buildingId: 2, role: 'reserve' },
    })
    expect(state.buildings[2]?.role).toBe('reserve')
    expect(state.buildings[1]?.role).toBe('main')
  })

  it("'main' sobre otro campo degrada al principal anterior y lo indica en el evento", () => {
    const state = twoFields()

    expect(run(state, roleCmd(2, 'main'))).toEqual({
      ok: true,
      event: { type: 'pitchRoleChanged', buildingId: 2, role: 'main', demotedId: 1 },
    })
    expect(state.buildings[2]?.role).toBe('main')
    expect(state.buildings[1]?.role).toBe('training')
  })

  it.each<[string, number, PitchRole, string]>([
    ['no es un campo', 3, 'main', 'notAPitch'],
    ['mismo uso', 1, 'main', 'sameRole'],
    ['no existe', 99, 'main', 'buildingNotFound'],
  ])('inválido (%s): devuelve el motivo y deja el estado idéntico', (_n, id, role, motivo) => {
    const state = twoFields()
    run(state, placeCmd('small', { x: 10, y: 0 }))
    const antes = structuredClone(state)

    expect(run(state, roleCmd(id, role))).toEqual({ ok: false, reason: motivo })
    expect(state).toEqual(antes)
  })

  it("al demoler el principal, el siguiente campo colocado es 'main'", () => {
    const state = twoFields()
    run(state, demolishCmd(1))
    // El campo 2 sigue siendo 'training': no hay principal, así que el nuevo lo será.
    run(state, placeCmd('field', { x: 0, y: 5 }))

    expect(state.buildings[3]?.role).toBe('main')
    expect(state.buildings[2]?.role).toBe('training')
  })

  it('mejorar un campo conserva su role', () => {
    const state = twoFields()
    run(state, roleCmd(1, 'reserve'))
    run(state, { type: 'upgradeBuilding', buildingId: 1 })
    run(state, { type: 'upgradeBuilding', buildingId: 2 })

    expect(state.buildings[1]).toMatchObject({ tier: 1, role: 'reserve' })
    expect(state.buildings[2]).toMatchObject({ tier: 1, role: 'training' })
  })
})

describe('pitchSurface', () => {
  const field = TEST_CONTENT.buildings['field']

  it('devuelve la superficie de cada nivel y la última si el nivel se pasa', () => {
    expect(field && [0, 1, 2, 3, 9].map((t) => pitchSurface(field, t))).toEqual([
      'dirt',
      'grass',
      'stone',
      'stone',
      'stone',
    ])
  })

  it('devuelve undefined si el objeto no es un campo', () => {
    const small = TEST_CONTENT.buildings['small']
    expect(small && pitchSurface(small, 0)).toBeUndefined()
  })
})

describe('maxTier y tierQuality', () => {
  const tiered = TEST_CONTENT.buildings['tiered']
  const small = TEST_CONTENT.buildings['small']

  it('maxTier es el último índice, o 0 sin niveles', () => {
    expect(tiered && maxTier(tiered)).toBe(2)
    expect(small && maxTier(small)).toBe(0)
  })

  it('tierQuality devuelve la calidad del nivel, o 1 sin niveles', () => {
    expect(tiered && [0, 1, 2].map((t) => tierQuality(tiered, t))).toEqual([1, 2, 4])
    expect(small && tierQuality(small, 0)).toBe(1)
  })
})
