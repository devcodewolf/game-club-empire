/** Tests de las salas: relleno, designación, evaluación y comandos. */
import { describe, expect, it } from 'vitest'
import { executeCommand, type Command } from '../../commands'
import type { TileCoord, TileRect } from '../../geometry'
import {
  roomAt,
  applyDesignateRoom,
  evaluateRoom,
  regionFrom,
  validateDesignateRoom,
} from '../rooms'
import { tileIndex, type MapState } from '../../map/map'
import { createTestMap, TEST_CONTENT } from '../../__tests__/fixtures'

const run = (state: MapState, command: Command) => executeCommand(state, command, TEST_CONTENT)

/** Ejecuta un comando que debe salir bien. */
function ok(state: MapState, command: Command): void {
  expect(run(state, command).ok).toBe(true)
}

/** Cimientos de ladrillo con suelo de tierra. */
function foundation(state: MapState, rect: TileRect): void {
  ok(state, { type: 'buildFoundation', rect, wall: 'brick', floor: 'dirt' })
}

function door(state: MapState, tile: TileCoord): void {
  ok(state, { type: 'placeDoor', tile, door: 'door' })
}

function place(state: MapState, buildingType: string, origin: TileCoord, rotation = 0): void {
  ok(state, { type: 'placeBuilding', buildingType, origin, rotation: rotation as 0 | 1 | 2 | 3 })
}

/** Edificio de 6×5 (interior 4×3, casillas x 3..6, y 3..5) con puerta arriba en (4, 2). */
function house(withDoor = true): MapState {
  const state = createTestMap()
  foundation(state, { x: 2, y: 2, width: 6, height: 5 })
  if (withDoor) door(state, { x: 4, y: 2 })
  return state
}

const INSIDE: TileCoord = { x: 3, y: 3 }

function designate(state: MapState, roomType: string, tile: TileCoord = INSIDE): number {
  const result = run(state, { type: 'designateRoom', tile, roomType })
  expect(result.ok).toBe(true)
  if (!result.ok || result.event.type !== 'roomDesignated') throw new Error('sin sala')
  return result.event.roomId
}

describe('regionFrom', () => {
  it('devuelve las 12 casillas interiores de unos cimientos de 6×5', () => {
    const region = regionFrom(house(), INSIDE)

    expect(region.tiles).toHaveLength(12)
    expect(region.enclosed).toBe(true)
    expect(region.hasDoor).toBe(true)
    expect(region.bounds).toEqual({ x: 3, y: 3, width: 4, height: 3 })
  })

  it('hasDoor es false si no hay puerta', () => {
    const region = regionFrom(house(false), INSIDE)

    expect(region.enclosed).toBe(true)
    expect(region.hasDoor).toBe(false)
  })

  it('si se demuele un muro del perímetro, deja de estar cerrada', () => {
    const state = house()
    ok(state, { type: 'demolishStructures', rect: { x: 2, y: 4, width: 1, height: 1 } })

    expect(regionFrom(state, INSIDE).enclosed).toBe(false)
  })
})

describe('validateDesignateRoom', () => {
  const state = house()
  const check = (tile: TileCoord, roomType = 'kit') =>
    validateDesignateRoom(state, TEST_CONTENT, tile, roomType)

  it('unknownRoom con un tipo de sala inexistente', () => {
    expect(check(INSIDE, 'inexistente')).toEqual({ ok: false, reason: 'unknownRoom' })
  })

  it('outOfBounds fuera del mapa', () => {
    expect(check({ x: -1, y: 0 })).toEqual({ ok: false, reason: 'outOfBounds' })
  })

  it('wall sobre un muro', () => {
    expect(check({ x: 2, y: 2 })).toEqual({ ok: false, reason: 'wall' })
  })

  it('notIndoor en la hierba', () => {
    expect(check({ x: 12, y: 12 })).toEqual({ ok: false, reason: 'notIndoor' })
  })

  it('alreadyDesignated si la casilla ya tiene ese tipo de sala', () => {
    designate(state, 'kit')
    expect(check(INSIDE)).toEqual({ ok: false, reason: 'alreadyDesignated' })
    expect(check(INSIDE, 'depot')).toEqual({ ok: true })
  })
})

describe('applyDesignateRoom', () => {
  it('todas las casillas interiores quedan con el id y se crea la sala', () => {
    const state = house()
    const id = designate(state, 'kit')

    expect(state.rooms[id]).toEqual({ id, type: 'kit' })
    for (const tile of regionFrom(state, INSIDE).tiles) {
      expect(state.roomOf[tileIndex(state, tile)]).toBe(id)
    }
    expect(roomAt(state, INSIDE)).toBe(id)
    expect(roomAt(state, { x: 2, y: 2 })).toBe(0)
  })

  it('designar otro tipo en la misma sala la sustituye y la anterior desaparece', () => {
    const state = house()
    const first = designate(state, 'kit')
    const second = designate(state, 'depot')

    expect(second).not.toBe(first)
    expect(state.rooms[first]).toBeUndefined()
    expect(Object.keys(state.rooms)).toHaveLength(1)
    expect(state.rooms[second]?.type).toBe('depot')
    expect(roomAt(state, INSIDE)).toBe(second)
  })

  it('dos edificios separados dan dos salas distintas', () => {
    const state = house()
    foundation(state, { x: 10, y: 2, width: 5, height: 5 })
    const a = designate(state, 'kit')
    const b = designate(state, 'kit', { x: 11, y: 3 })

    expect(a).not.toBe(b)
    expect(Object.keys(state.rooms)).toHaveLength(2)
    expect(roomAt(state, INSIDE)).toBe(a)
    expect(roomAt(state, { x: 11, y: 3 })).toBe(b)
  })

  it('los ids no se reutilizan', () => {
    const state = house()
    const first = designate(state, 'kit')
    ok(state, { type: 'removeRoom', tile: INSIDE })
    const second = applyDesignateRoom(state, INSIDE, 'kit')

    expect(second).toBeGreaterThan(first)
  })
})

describe('removeRoom', () => {
  it('limpia las casillas y borra la sala', () => {
    const state = house()
    const id = designate(state, 'kit')
    ok(state, { type: 'removeRoom', tile: { x: 5, y: 4 } })

    expect(state.rooms[id]).toBeUndefined()
    expect(roomAt(state, INSIDE)).toBe(0)
    expect(state.roomOf.every((value) => value === 0)).toBe(true)
  })

  it('noRoom fuera de las salas', () => {
    expect(run(house(), { type: 'removeRoom', tile: INSIDE })).toEqual({
      ok: false,
      reason: 'noRoom',
    })
  })

  it('outOfBounds fuera del mapa', () => {
    expect(run(house(), { type: 'removeRoom', tile: { x: 50, y: 50 } })).toEqual({
      ok: false,
      reason: 'outOfBounds',
    })
  })
})

describe('muros dentro de una sala', () => {
  it('sacan esas casillas de la sala', () => {
    const state = house()
    const id = designate(state, 'kit')
    ok(state, { type: 'buildWalls', rect: { x: 5, y: 3, width: 1, height: 3 }, wall: 'brick' })

    expect(roomAt(state, { x: 5, y: 4 })).toBe(0)
    expect(roomAt(state, INSIDE)).toBe(id)
    expect(evaluateRoom(state, TEST_CONTENT, id)?.tiles).toHaveLength(9)
  })

  it('si la sala se queda sin casillas, desaparece', () => {
    const state = createTestMap()
    foundation(state, { x: 2, y: 2, width: 3, height: 3 })
    const id = designate(state, 'kit', { x: 3, y: 3 })
    expect(state.rooms[id]).toBeDefined()

    ok(state, { type: 'buildWalls', rect: { x: 3, y: 3, width: 1, height: 1 }, wall: 'brick' })

    expect(state.rooms[id]).toBeUndefined()
  })
})

describe('evaluateRoom', () => {
  const evaluate = (state: MapState, id: number) => {
    const status = evaluateRoom(state, TEST_CONTENT, id)
    if (!status) throw new Error('sala sin evaluar')
    return status
  }

  it('con todo cumplido, ok es true', () => {
    const state = house()
    place(state, 'small', INSIDE)
    const status = evaluate(state, designate(state, 'kit'))

    expect(status).toMatchObject({
      ok: true,
      enclosed: true,
      hasDoor: true,
      tooSmall: false,
      missing: [],
    })
    expect(status.tiles).toHaveLength(12)
    expect(status.objects).toEqual({ small: 1 })
  })

  it('quality suma la calidad según el nivel de cada objeto y cambia al mejorar', () => {
    const state = house()
    place(state, 'small', INSIDE)
    place(state, 'tiered', { x: 4, y: 3 })
    place(state, 'tiered', { x: 5, y: 3 })
    const id = designate(state, 'kit')

    // small (sin niveles) = 1; tiered nivel 1 = 1 cada uno
    expect(evaluate(state, id).quality).toBe(3)

    ok(state, { type: 'upgradeBuilding', buildingId: 2 })
    expect(evaluate(state, id).quality).toBe(4)

    ok(state, { type: 'upgradeBuilding', buildingId: 2 })
    ok(state, { type: 'upgradeBuilding', buildingId: 3 })
    expect(evaluate(state, id).quality).toBe(1 + 4 + 2)
  })

  it('sin puerta, hasDoor es false y ok es false', () => {
    const state = house(false)
    place(state, 'small', INSIDE)
    const status = evaluate(state, designate(state, 'kit'))

    expect(status.hasDoor).toBe(false)
    expect(status.ok).toBe(false)
  })

  it('un objeto que falta aparece en missing con need y have', () => {
    const state = house()
    const status = evaluate(state, designate(state, 'depot'))

    expect(status.missing).toEqual([{ object: 'wide', need: 1, have: 0 }])
    expect(status.ok).toBe(false)
  })

  it('tooSmall cuando el espacio no llega', () => {
    const state = createTestMap()
    foundation(state, { x: 2, y: 2, width: 4, height: 4 }) // interior 2×2
    door(state, { x: 3, y: 2 })
    const status = evaluate(state, designate(state, 'depot', { x: 3, y: 3 }))

    expect(status.tooSmall).toBe(true)
    expect(status.ok).toBe(false)
  })

  it('el tamaño mínimo también vale girado: 3×2 cumple un minSize de 2×3', () => {
    const state = createTestMap()
    foundation(state, { x: 2, y: 2, width: 5, height: 4 }) // interior 3×2
    door(state, { x: 4, y: 2 })
    place(state, 'wide', { x: 3, y: 3 })
    const status = evaluate(state, designate(state, 'depot', { x: 3, y: 3 }))

    expect(status.bounds).toMatchObject({ width: 3, height: 2 })
    expect(status.tooSmall).toBe(false)
    expect(status.ok).toBe(true)
  })

  it('la capacidad depende de los objetos de la sala', () => {
    const state = house()
    place(state, 'small', { x: 3, y: 3 })
    place(state, 'small', { x: 4, y: 3 })
    place(state, 'small', { x: 5, y: 3 })
    const id = designate(state, 'kit')

    expect(evaluate(state, id).capacity).toBe(3)

    // Una sala sin capacidad definida da 0
    const other = house()
    expect(evaluate(other, designate(other, 'depot')).capacity).toBe(0)
  })

  it('un objeto que pisa solo una casilla de la sala cuenta', () => {
    const state = house()
    // Se abre el muro derecho (7, 4..5) para que un objeto 3×2 asome fuera.
    ok(state, { type: 'demolishStructures', rect: { x: 7, y: 4, width: 1, height: 2 } })
    place(state, 'wide', { x: 6, y: 4 })
    const status = evaluate(state, designate(state, 'depot'))

    expect(status.objects).toEqual({ wide: 1 })
    expect(status.missing).toEqual([])
  })

  it('una sala inexistente no se evalúa', () => {
    expect(evaluateRoom(house(), TEST_CONTENT, 99)).toBeUndefined()
  })
})

describe('comandos de sala', () => {
  it('designateRoom emite roomDesignated', () => {
    const result = run(house(), { type: 'designateRoom', tile: INSIDE, roomType: 'kit' })

    expect(result).toEqual({
      ok: true,
      event: { type: 'roomDesignated', roomId: 1, roomType: 'kit' },
    })
  })

  it('removeRoom emite roomRemoved', () => {
    const state = house()
    const roomId = designate(state, 'kit')

    expect(run(state, { type: 'removeRoom', tile: INSIDE })).toEqual({
      ok: true,
      event: { type: 'roomRemoved', roomId },
    })
  })

  it.each<[string, Command]>([
    ['tipo desconocido', { type: 'designateRoom', tile: INSIDE, roomType: 'nada' }],
    ['fuera del mapa', { type: 'designateRoom', tile: { x: -1, y: 5 }, roomType: 'kit' }],
    ['sobre un muro', { type: 'designateRoom', tile: { x: 2, y: 2 }, roomType: 'kit' }],
    ['en la hierba', { type: 'designateRoom', tile: { x: 12, y: 12 }, roomType: 'kit' }],
    ['ya designada', { type: 'designateRoom', tile: INSIDE, roomType: 'kit' }],
    ['quitar sin sala', { type: 'removeRoom', tile: { x: 12, y: 12 } }],
  ])('un comando inválido (%s) deja el estado idéntico', (_nombre, command) => {
    const state = house()
    designate(state, 'kit')
    const before = structuredClone(state)

    expect(run(state, command).ok).toBe(false)
    expect(state).toEqual(before)
  })
})
