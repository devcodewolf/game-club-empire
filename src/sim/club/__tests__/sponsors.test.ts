/** Tests de los patrocinios locales: ofertas, aceptar, cumplir, vencer y cancelar. */
import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../../commands'
import type { SimContent } from '../../content'
import { createGame, type Game } from '../../game'
import type { MapState } from '../../map/map'
import { TEST_CONTENT, TEST_MAP_CONFIG, TEST_SPONSORS } from '../../__tests__/fixtures'
import { makeOffer, weeklySponsors } from '../sponsors'

const DAY = 24 * 60
const WEEK = 7 * DAY

function newGame(content: SimContent = TEST_CONTENT, seed = 1): Game {
  return createGame(TEST_MAP_CONFIG, content, { money: 10_000, seed })
}

const mutable = (game: Game): MapState => game.state as MapState

function collect(game: Game): GameEvent[] {
  const events: GameEvent[] = []
  game.subscribe((event) => events.push(event))
  return events
}

/** Acepta la oferta de una plantilla (falla el test si no está). */
function acceptTemplate(game: Game, template: string) {
  const offer = game.state.club.sponsors.offers.find((o) => o.template === template)
  if (!offer) throw new Error(`no hay oferta de ${template}`)
  const result = game.dispatch({ type: 'acceptSponsor', offerId: offer.id })
  if (!result.ok) throw new Error(result.reason)
  return offer
}

describe('ofertas', () => {
  it('al empezar hay dos ofertas de negocios distintos, sin la plantilla de otra división', () => {
    const { offers } = newGame().state.club.sponsors
    expect(offers).toHaveLength(2)
    expect(new Set(offers.map((o) => o.business)).size).toBe(2)
    expect(offers.map((o) => o.template).sort()).toEqual(['gardener', 'members'])
  })

  it('el dinero sale de la dificultad y los objetivos relativos se fijan al ofrecerse', () => {
    const game = newGame()
    const members = game.state.club.sponsors.offers.find((o) => o.template === 'members')!
    expect(members).toMatchObject({ advance: 500, bonus: 1500, weeks: 3 })
    // 60 socios al empezar + 10
    expect(members.objectives).toEqual([{ kind: 'members', min: 70 }])
    const gardener = game.state.club.sponsors.offers.find((o) => o.template === 'gardener')!
    expect(gardener).toMatchObject({ advance: 1000, bonus: 2500 })
  })

  it('no se ofrece lo que ya está cumplido', () => {
    const game = newGame()
    mutable(game).club.sponsors.offers.length = 0
    game.dispatch({ type: 'hireStaff', role: 'gardener' })
    const offer = makeOffer(mutable(game), game.content)
    expect(offer?.template).toBe('members')
  })

  it('las ofertas caducan y cada dos lunes llega una nueva si hay hueco', () => {
    const game = newGame()
    const sponsors = mutable(game).club.sponsors
    // Cuatro semanas después caducan las dos
    mutable(game).clock.time += 4 * WEEK
    weeklySponsors(mutable(game), game.content)
    expect(sponsors.offers.length).toBeLessThanOrEqual(1)
  })
})

describe('tratos', () => {
  it('aceptar cobra el adelanto y pasa la oferta a en marcha con su plazo', () => {
    const game = newGame()
    const offer = acceptTemplate(game, 'gardener')
    expect(game.state.money).toBe(11_000)
    expect(game.state.ledger.at(-1)).toMatchObject({ concept: 'sponsors', amount: 1000 })
    const active = game.state.club.sponsors.active[0]!
    expect(active).toMatchObject({ id: offer.id, deadline: game.state.clock.time + 4 * WEEK })
    expect(game.state.club.sponsors.offers.some((o) => o.id === offer.id)).toBe(false)
  })

  it('cumplir antes del plazo cobra el bonus y da +2 de fama', () => {
    const game = newGame()
    const events = collect(game)
    acceptTemplate(game, 'gardener')
    const fame = game.state.club.fame
    game.dispatch({ type: 'hireStaff', role: 'gardener' })
    expect(events.some((e) => e.type === 'sponsorCompleted')).toBe(true)
    expect(game.state.club.sponsors.active).toEqual([])
    expect(game.state.ledger.some((e) => e.concept === 'sponsors' && e.amount === 2500)).toBe(true)
    expect(game.state.club.fame).toBe(fame + 2)
    expect(game.state.club.sponsors.history.at(-1)).toMatchObject({ outcome: 'completed' })
  })

  it('si vence el plazo sin cumplir, −2 de fama y no se devuelve nada', () => {
    const game = newGame()
    const events = collect(game)
    acceptTemplate(game, 'members')
    mutable(game).club.fame = 10
    const money = game.state.money
    game.advance(3 * WEEK + DAY)
    expect(events.some((e) => e.type === 'sponsorFailed')).toBe(true)
    expect(game.state.club.sponsors.history.find((h) => h.outcome === 'failed')).toBeDefined()
    expect(game.state.club.fame).toBeLessThan(10)
    expect(game.state.ledger.some((e) => e.concept === 'sponsors' && e.amount < 0)).toBe(false)
    expect(game.state.money).toBeGreaterThan(money - 1)
  })

  it('cancelar devuelve el adelanto más un 10 % y no se puede deshacer', () => {
    const game = newGame()
    const offer = acceptTemplate(game, 'gardener')
    expect(game.dispatch({ type: 'cancelSponsor', sponsorId: offer.id }).ok).toBe(true)
    expect(game.state.money).toBe(11_000 - 1100)
    expect(game.canUndo()).toBe(false)
    expect(game.state.club.sponsors.history.at(-1)).toMatchObject({ outcome: 'cancelled' })
    expect(game.dispatch({ type: 'cancelSponsor', sponsorId: offer.id })).toEqual({
      ok: false,
      reason: 'sponsorNotActive',
    })
  })

  it('no se aceptan más de los permitidos ni ofertas que no existen', () => {
    const tight: SimContent = { ...TEST_CONTENT, sponsors: { ...TEST_SPONSORS, maxActive: 1 } }
    const game = newGame(tight)
    acceptTemplate(game, 'gardener')
    const other = game.state.club.sponsors.offers[0]!
    expect(game.dispatch({ type: 'acceptSponsor', offerId: other.id })).toEqual({
      ok: false,
      reason: 'tooManySponsors',
    })
    expect(game.dispatch({ type: 'acceptSponsor', offerId: 'nope' })).toEqual({
      ok: false,
      reason: 'unknownOffer',
    })
  })
})
