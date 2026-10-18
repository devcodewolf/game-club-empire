/** Tests de las vallas publicitarias: poner, cobrar cada lunes, anunciantes que llegan y se van. */
import { describe, expect, it } from 'vitest'
import type { Command } from '../../commands'
import { createGame, type Game } from '../../game'
import type { MapState } from '../../map/map'
import { TEST_CONTENT, TEST_MAP_CONFIG } from '../../__tests__/fixtures'
import {
  billboardChance,
  billboardIncome,
  occupiedBillboards,
  weeklyBillboards,
} from '../billboards'

const WEEK = 7 * 24 * 60
const PITCH: Command = {
  type: 'placeBuilding',
  buildingType: 'field',
  origin: { x: 10, y: 10 },
  rotation: 0,
}

function newGame(seed = 1): Game {
  return createGame(TEST_MAP_CONFIG, TEST_CONTENT, { money: 10_000, scenario: [PITCH], seed })
}

const mutable = (game: Game): MapState => game.state as MapState
const pitch = (game: Game) => game.state.buildings[1]!

describe('vallas publicitarias', () => {
  it('poner una valla cuesta 150 € y la deja libre; caben las del formato', () => {
    const game = newGame()
    expect(game.dispatch({ type: 'buildBillboard', buildingId: 1 }).ok).toBe(true)
    expect(game.state.money).toBe(10_000 - 150)
    expect(pitch(game).billboards).toEqual([{ advertiser: null, until: 0 }])
    game.dispatch({ type: 'buildBillboard', buildingId: 1 })
    game.dispatch({ type: 'buildBillboard', buildingId: 1 })
    expect(game.dispatch({ type: 'buildBillboard', buildingId: 1 })).toEqual({
      ok: false,
      reason: 'noBillboardRoom',
    })
  })

  it('mejorar el campo abre hueco para más vallas', () => {
    const game = newGame()
    for (let i = 0; i < 3; i++) game.dispatch({ type: 'buildBillboard', buildingId: 1 })
    game.dispatch({ type: 'upgradeBuilding', buildingId: 1 })
    expect(game.dispatch({ type: 'buildBillboard', buildingId: 1 }).ok).toBe(true)
    expect(game.dispatch({ type: 'buildBillboard', buildingId: 1 })).toEqual({
      ok: false,
      reason: 'noBillboardRoom',
    })
  })

  it('poner una valla se puede deshacer', () => {
    const game = newGame()
    game.dispatch({ type: 'buildBillboard', buildingId: 1 })
    expect(game.dispatch({ type: 'undo' }).ok).toBe(true)
    expect(pitch(game).billboards).toBeUndefined()
    expect(game.state.money).toBe(10_000)
  })

  it('solo en campos', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT, {
      money: 10_000,
      scenario: [
        { type: 'placeBuilding', buildingType: 'small', origin: { x: 2, y: 2 }, rotation: 0 },
      ],
    })
    expect(game.dispatch({ type: 'buildBillboard', buildingId: 1 })).toEqual({
      ok: false,
      reason: 'notAPitch',
    })
  })

  it('ingreso y probabilidad crecen con la fama', () => {
    expect(billboardIncome(TEST_CONTENT, 0)).toBe(20)
    expect(billboardIncome(TEST_CONTENT, 50)).toBe(40)
    expect(billboardChance(TEST_CONTENT, 0)).toBeCloseTo(0.3)
    expect(billboardChance(TEST_CONTENT, 100)).toBeCloseTo(0.8)
  })

  it('cada lunes las libres buscan anunciante y las ocupadas cobran', () => {
    const game = newGame(4)
    for (let i = 0; i < 3; i++) game.dispatch({ type: 'buildBillboard', buildingId: 1 })
    // Con fama 100, la probabilidad sube al 80 %: varios lunes seguidos acaban ocupándolas
    mutable(game).club.fame = 100
    for (let week = 0; week < 6 && occupiedBillboards(game.state) === 0; week++) {
      mutable(game).clock.time += WEEK
      weeklyBillboards(mutable(game), game.content)
    }
    expect(occupiedBillboards(game.state)).toBeGreaterThan(0)
    const board = pitch(game).billboards!.find((b) => b.advertiser)!
    expect(board.until).toBeGreaterThan(game.state.clock.time)
    const occupied = occupiedBillboards(game.state)
    mutable(game).clock.time += 1
    const update = weeklyBillboards(mutable(game), game.content)
    expect(update.entries[0]).toMatchObject({ concept: 'billboards', amount: occupied * 60 })
  })

  it('el anuncio termina en su fecha y la valla queda libre (o con otro anunciante)', () => {
    const game = newGame()
    game.dispatch({ type: 'buildBillboard', buildingId: 1 })
    const id = pitch(game).id
    mutable(game).buildings[id] = {
      ...pitch(game),
      billboards: [{ advertiser: 'bakery', until: game.state.clock.time + 10 }],
    }
    mutable(game).club.fame = 0
    mutable(game).clock.time += 20
    weeklyBillboards(mutable(game), game.content)
    const board = pitch(game).billboards![0]!
    expect(board.until === 0 || board.until > game.state.clock.time).toBe(true)
  })

  it('en la partida, el lunes de cuentas cobra las vallas', () => {
    const game = newGame()
    game.dispatch({ type: 'buildBillboard', buildingId: 1 })
    const id = pitch(game).id
    mutable(game).buildings[id] = {
      ...pitch(game),
      billboards: [{ advertiser: 'bakery', until: game.state.clock.time + 3 * WEEK }],
    }
    game.advance(WEEK)
    expect(game.state.ledger.some((e) => e.concept === 'billboards')).toBe(true)
  })
})
