/** Tests de las subvenciones con objetivos (adelanto, bonus, cadena, cancelar) y de los objetivos. */
import { describe, expect, it } from 'vitest'
import type { Command, GameEvent } from '../../commands'
import type { SimContent } from '../../content'
import { createGame, type Game } from '../../game'
import type { MapState } from '../../map/map'
import { TEST_CONTENT, TEST_GRANTS, TEST_MAP_CONFIG } from '../../__tests__/fixtures'
import { availableGrants } from '../grants'
import { checkObjectives, objectiveStatus, startProgress, stadiumCapacity } from '../objectives'

const DAY = 24 * 60

/** Sala 'kit' completa con su esquina en (x, y). */
const kitRoom = (x: number, y: number): Command[] => [
  { type: 'buildFoundation', rect: { x, y, width: 5, height: 4 }, wall: 'brick', floor: 'dirt' },
  { type: 'placeDoor', tile: { x: x + 2, y }, door: 'door' },
  { type: 'placeBuilding', buildingType: 'small', origin: { x: x + 1, y: y + 1 }, rotation: 0 },
  { type: 'designateRoom', tile: { x: x + 1, y: y + 1 }, roomType: 'kit' },
]

function newGame(content: SimContent = TEST_CONTENT, scenario: readonly Command[] = []): Game {
  return createGame(TEST_MAP_CONFIG, content, { money: 10_000, scenario })
}

const mutable = (game: Game): MapState => game.state as MapState

function collect(game: Game): GameEvent[] {
  const events: GameEvent[] = []
  game.subscribe((event) => events.push(event))
  return events
}

const ids = (game: Game) => availableGrants(mutable(game), game.content).map((g) => g.id)

describe('subvenciones', () => {
  it('al empezar se ofrecen las que no piden nada y no están ocultas', () => {
    expect(ids(newGame())).toEqual(['first', 'loose'])
  })

  it('aceptar cobra el adelanto y la quita de la lista', () => {
    const game = newGame()
    expect(game.dispatch({ type: 'acceptGrant', grantId: 'first' }).ok).toBe(true)
    expect(game.state.money).toBe(11_000)
    expect(game.state.ledger.at(-1)).toMatchObject({ concept: 'grants', amount: 1000 })
    expect(game.state.club.grants.active.map((g) => g.id)).toEqual(['first'])
    expect(ids(game)).toEqual(['loose'])
  })

  it('no se puede aceptar una no disponible, una desconocida ni más de las permitidas', () => {
    const game = newGame()
    expect(game.dispatch({ type: 'acceptGrant', grantId: 'second' })).toEqual({
      ok: false,
      reason: 'grantNotAvailable',
    })
    expect(game.dispatch({ type: 'acceptGrant', grantId: 'nope' })).toEqual({
      ok: false,
      reason: 'unknownGrant',
    })
    const tight: SimContent = { ...TEST_CONTENT, grants: { ...TEST_GRANTS, maxActive: 1 } }
    const limited = newGame(tight)
    limited.dispatch({ type: 'acceptGrant', grantId: 'first' })
    expect(limited.dispatch({ type: 'acceptGrant', grantId: 'loose' })).toEqual({
      ok: false,
      reason: 'tooManyGrants',
    })
  })

  it('cancelar devuelve el adelanto más un 10 % y no se puede deshacer', () => {
    const game = newGame()
    game.dispatch({ type: 'acceptGrant', grantId: 'first' })
    expect(game.dispatch({ type: 'cancelGrant', grantId: 'first' }).ok).toBe(true)
    expect(game.state.money).toBe(11_000 - 1100)
    expect(game.state.club.grants.active).toEqual([])
    expect(game.canUndo()).toBe(false)
    expect(game.dispatch({ type: 'cancelGrant', grantId: 'first' })).toEqual({
      ok: false,
      reason: 'grantNotActive',
    })
  })

  it('cumplir los objetivos cobra el bonus, suma fama y abre las siguientes', () => {
    const game = newGame()
    const events = collect(game)
    game.dispatch({ type: 'acceptGrant', grantId: 'first' })
    const fame = game.state.club.fame
    for (const command of kitRoom(0, 0)) game.dispatch(command)
    expect(events.some((e) => e.type === 'grantCompleted' && e.grantId === 'first')).toBe(true)
    expect(game.state.club.grants.completed).toEqual(['first'])
    expect(game.state.club.grants.active).toEqual([])
    expect(game.state.ledger.some((e) => e.concept === 'grants' && e.amount === 2000)).toBe(true)
    // +1 por la subvención y +1 por la primera sala completa
    expect(game.state.club.fame).toBe(fame + 2)
    expect(ids(game)).toEqual(['second', 'loose'])
  })

  it('los objetivos se comprueban también con el paso del tiempo (socios del lunes)', () => {
    const game = newGame()
    mutable(game).club.grants.completed.push('first')
    game.dispatch({ type: 'acceptGrant', grantId: 'second' })
    expect(game.state.club.grants.active).toHaveLength(1)
    // El lunes 30 los socios pasan de 60 a 62
    game.advance(7 * DAY)
    expect(game.state.club.grants.completed).toContain('second')
  })
})

describe('objetivos', () => {
  it('un objetivo cumplido queda tachado aunque luego se pierda', () => {
    const game = newGame()
    const objectives = [{ kind: 'staff', role: 'gardener', min: 1 } as const]
    game.dispatch({ type: 'hireStaff', role: 'gardener' })
    let progress = checkObjectives(
      mutable(game),
      game.content,
      objectives,
      startProgress(objectives, 0),
    )
    expect(progress.done).toEqual([true])
    game.dispatch({ type: 'fireStaff', role: 'gardener' })
    progress = checkObjectives(mutable(game), game.content, objectives, progress)
    expect(progress.done).toEqual([true])
  })

  it('mantener el estado del campo cuenta días seguidos desde que se alcanza', () => {
    const game = newGame(TEST_CONTENT, [
      { type: 'placeBuilding', buildingType: 'field', origin: { x: 10, y: 10 }, rotation: 0 },
    ])
    const objectives = [{ kind: 'pitchCondition', min: 40, days: 2 } as const]
    const start = startProgress(objectives, game.state.clock.time)
    let progress = checkObjectives(mutable(game), game.content, objectives, start)
    expect(progress.since[0]).toBe(game.state.clock.time)
    expect(progress.done).toEqual([false])
    game.advance(DAY)
    progress = checkObjectives(mutable(game), game.content, objectives, progress)
    expect(objectiveStatus(mutable(game), game.content, objectives[0]!, progress, 0)).toEqual({
      current: 1,
      target: 2,
    })
    game.advance(DAY)
    progress = checkObjectives(mutable(game), game.content, objectives, progress)
    expect(progress.done).toEqual([true])
  })

  it('si el estado baja del mínimo, la cuenta vuelve a empezar', () => {
    const game = newGame(TEST_CONTENT, [
      { type: 'placeBuilding', buildingType: 'field', origin: { x: 10, y: 10 }, rotation: 0 },
    ])
    const objectives = [{ kind: 'pitchCondition', min: 45, days: 5 } as const]
    let progress = checkObjectives(
      mutable(game),
      game.content,
      objectives,
      startProgress(objectives, game.state.clock.time),
    )
    expect(progress.since[0]).not.toBeNull()
    const pitch = Object.values(game.state.buildings)[0]!
    mutable(game).buildings[pitch.id] = { ...pitch, condition: 30 }
    progress = checkObjectives(mutable(game), game.content, objectives, progress)
    expect(progress.since[0]).toBeNull()
  })

  it('aforo: 100 de pie sin gradas', () => {
    const game = newGame(TEST_CONTENT, [
      { type: 'placeBuilding', buildingType: 'field', origin: { x: 10, y: 10 }, rotation: 0 },
    ])
    expect(stadiumCapacity(mutable(game), game.content)).toBe(100)
  })
})
