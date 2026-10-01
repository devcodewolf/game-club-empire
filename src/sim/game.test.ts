import { describe, expect, it, vi } from 'vitest'
import type { Command } from './commands'
import { createGame } from './game'
import type { MapConfig } from './map'
import { TEST_CATALOG } from './test-fixtures'

/** Misma configuración que `createTestMap`: 20×20, parcelas de 5, 2×2 iniciales. */
const TEST_CONFIG: MapConfig = {
  size: { width: 20, height: 20 },
  parcelSize: 5,
  initialParcels: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
}

const validCommand: Command = {
  type: 'placeBuilding',
  buildingType: 'small',
  origin: { x: 1, y: 1 },
  rotation: 0,
}

/** Casilla fuera de las parcelas propias: siempre inválido. */
const invalidCommand: Command = {
  type: 'placeBuilding',
  buildingType: 'small',
  origin: { x: 15, y: 15 },
  rotation: 0,
}

describe('createGame · dispatch', () => {
  it('un comando válido devuelve ok y avisa al suscriptor con el evento correcto', () => {
    const game = createGame(TEST_CONFIG, TEST_CATALOG)
    const listener = vi.fn()
    game.subscribe(listener)

    const result = game.dispatch(validCommand)

    expect(result.ok).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({
      type: 'buildingPlaced',
      building: { id: 1, type: 'small', origin: { x: 1, y: 1 }, rotation: 0 },
    })
  })

  it('un comando inválido devuelve el error y no avisa a los suscriptores', () => {
    const game = createGame(TEST_CONFIG, TEST_CATALOG)
    const listener = vi.fn()
    game.subscribe(listener)

    const result = game.dispatch(invalidCommand)

    expect(result).toEqual({ ok: false, reason: 'parcelNotOwned' })
    expect(listener).not.toHaveBeenCalled()
  })

  it('varios suscriptores reciben el mismo evento', () => {
    const game = createGame(TEST_CONFIG, TEST_CATALOG)
    const a = vi.fn()
    const b = vi.fn()
    game.subscribe(a)
    game.subscribe(b)

    game.dispatch(validCommand)

    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    expect(a.mock.calls[0]).toEqual(b.mock.calls[0])
  })

  it('la función de baja deja de avisar al suscriptor', () => {
    const game = createGame(TEST_CONFIG, TEST_CATALOG)
    const listener = vi.fn()
    const unsubscribe = game.subscribe(listener)

    unsubscribe()
    game.dispatch(validCommand)

    expect(listener).not.toHaveBeenCalled()
  })

  it('darse de baja no afecta a los demás suscriptores', () => {
    const game = createGame(TEST_CONFIG, TEST_CATALOG)
    const baja = vi.fn()
    const activo = vi.fn()
    game.subscribe(baja)()
    game.subscribe(activo)

    game.dispatch(validCommand)

    expect(baja).not.toHaveBeenCalled()
    expect(activo).toHaveBeenCalledTimes(1)
  })

  it('state refleja los cambios tras el dispatch', () => {
    const game = createGame(TEST_CONFIG, TEST_CATALOG)
    expect(Object.keys(game.state.buildings)).toHaveLength(0)

    game.dispatch(validCommand)

    expect(game.state.buildings[1]).toEqual({
      id: 1,
      type: 'small',
      origin: { x: 1, y: 1 },
      rotation: 0,
    })
  })

  it('expone el catálogo recibido', () => {
    expect(createGame(TEST_CONFIG, TEST_CATALOG).catalog).toBe(TEST_CATALOG)
  })
})
