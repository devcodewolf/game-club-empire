import { describe, expect, it, vi } from 'vitest'
import type { Command } from './commands'
import { createGame } from './game'
import { TEST_CONTENT, TEST_MAP_CONFIG } from './test-fixtures'

const validCommand: Command = {
  type: 'placeBuilding',
  buildingType: 'small',
  origin: { x: 1, y: 1 },
  rotation: 0,
}

/** Casilla en la carretera reservada: siempre inválido. */
const invalidCommand: Command = {
  type: 'placeBuilding',
  buildingType: 'small',
  origin: { x: 18, y: 15 },
  rotation: 0,
}

describe('createGame · dispatch', () => {
  it('un comando válido devuelve ok y avisa al suscriptor con el evento correcto', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)
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
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)
    const listener = vi.fn()
    game.subscribe(listener)

    const result = game.dispatch(invalidCommand)

    expect(result).toEqual({ ok: false, reason: 'reserved' })
    expect(listener).not.toHaveBeenCalled()
  })

  it('varios suscriptores reciben el mismo evento', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)
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
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)
    const listener = vi.fn()
    const unsubscribe = game.subscribe(listener)

    unsubscribe()
    game.dispatch(validCommand)

    expect(listener).not.toHaveBeenCalled()
  })

  it('darse de baja no afecta a los demás suscriptores', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)
    const baja = vi.fn()
    const activo = vi.fn()
    game.subscribe(baja)()
    game.subscribe(activo)

    game.dispatch(validCommand)

    expect(baja).not.toHaveBeenCalled()
    expect(activo).toHaveBeenCalledTimes(1)
  })

  it('state refleja los cambios tras el dispatch', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)
    expect(Object.keys(game.state.buildings)).toHaveLength(0)

    game.dispatch(validCommand)

    expect(game.state.buildings[1]).toEqual({
      id: 1,
      type: 'small',
      origin: { x: 1, y: 1 },
      rotation: 0,
    })
  })

  it('expone el contenido recibido', () => {
    expect(createGame(TEST_MAP_CONFIG, TEST_CONTENT).content).toBe(TEST_CONTENT)
  })
})

describe('createGame · paintFloor', () => {
  const paintCommand: Command = {
    type: 'paintFloor',
    rect: { x: 1, y: 1, width: 2, height: 3 },
    floor: 'dirt',
  }

  it('avisa a los suscriptores con el evento floorPainted', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)
    const listener = vi.fn()
    game.subscribe(listener)

    const result = game.dispatch(paintCommand)

    expect(result.ok).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({
      type: 'floorPainted',
      rect: { x: 1, y: 1, width: 2, height: 3 },
      floor: 'dirt',
      changed: 6,
    })
  })

  it('refleja el suelo nuevo en state', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)

    game.dispatch(paintCommand)

    expect(game.state.floors[1 * 20 + 1]).toBe('dirt')
    expect(game.state.floors[0]).toBe('grass')
  })

  it('pintar sobre la carretera falla sin avisar a nadie', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT)
    const listener = vi.fn()
    game.subscribe(listener)

    const result = game.dispatch({ ...paintCommand, rect: { x: 18, y: 0, width: 1, height: 1 } })

    expect(result).toEqual({ ok: false, reason: 'reserved' })
    expect(listener).not.toHaveBeenCalled()
  })
})
