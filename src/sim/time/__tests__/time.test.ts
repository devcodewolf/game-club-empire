import { describe, expect, it } from 'vitest'
import { TEST_CONTENT, TEST_MAP_CONFIG, TEST_TIME } from '../../__tests__/fixtures'
import { createGame } from '../../game'
import type { GameEvent } from '../../commands'
import { fromDate, MINUTES_PER_DAY, toDate } from '../calendar'
import { advanceClock, ticksPerSecond, type ClockHolder } from '../clock'
import { chance, randomFloat, randomInt, seedRng } from '../rng'
import { nextDue, nextOccurrence } from '../schedule'

const START = fromDate({ year: 1, month: 8, day: 23, hour: 9 })

describe('calendario', () => {
  it('el 23 de agosto del año 1 es lunes', () => {
    expect(toDate(START)).toEqual({ year: 1, month: 8, day: 23, hour: 9, minute: 0, weekday: 0 })
  })

  it('fecha → instante → fecha es la identidad', () => {
    for (const date of [
      { year: 1, month: 1, day: 1, hour: 0, minute: 0 },
      { year: 1, month: 2, day: 28, hour: 23, minute: 59 },
      { year: 3, month: 12, day: 31, hour: 12, minute: 30 },
    ]) {
      expect(toDate(fromDate(date))).toMatchObject(date)
    }
  })

  it('cambia de mes y de año sin años bisiestos', () => {
    expect(toDate(fromDate({ year: 1, month: 2, day: 28 }) + MINUTES_PER_DAY)).toMatchObject({
      month: 3,
      day: 1,
    })
    expect(toDate(fromDate({ year: 1, month: 12, day: 31 }) + MINUTES_PER_DAY)).toMatchObject({
      year: 2,
      month: 1,
      day: 1,
    })
  })

  it('los días de la semana siguen en orden (el domingo 29 de agosto es el día 6)', () => {
    expect(toDate(fromDate({ year: 1, month: 8, day: 29 })).weekday).toBe(6)
    expect(toDate(fromDate({ year: 1, month: 8, day: 30 })).weekday).toBe(0)
  })
})

describe('planificador', () => {
  it('cada hora, en su minuto y siempre después del instante dado', () => {
    expect(nextOccurrence({ every: 'hour', minute: 30 }, START)).toBe(START + 30)
    expect(nextOccurrence({ every: 'hour', minute: 0 }, START)).toBe(START + 60)
  })

  it('cada día, hoy si aún no ha pasado o mañana', () => {
    expect(nextOccurrence({ every: 'day', hour: 21 }, START)).toBe(START + 12 * 60)
    expect(nextOccurrence({ every: 'day', hour: 8 }, START)).toBe(START + 23 * 60)
  })

  it('cada semana: del lunes 09:00 al lunes siguiente 08:00; el domingo 17:00 de esa semana', () => {
    expect(nextOccurrence({ every: 'week', weekday: 0, hour: 8 }, START)).toBe(
      fromDate({ year: 1, month: 8, day: 30, hour: 8 }),
    )
    expect(nextOccurrence({ every: 'week', weekday: 6, hour: 17 }, START)).toBe(
      fromDate({ year: 1, month: 8, day: 29, hour: 17 }),
    )
  })

  it('cada mes y cada año, también al cruzar de año', () => {
    expect(nextOccurrence({ every: 'month', day: 1, hour: 8 }, START)).toBe(
      fromDate({ year: 1, month: 9, day: 1, hour: 8 }),
    )
    const lateDecember = fromDate({ year: 1, month: 12, day: 23 })
    expect(nextOccurrence({ every: 'year', month: 12, day: 22, hour: 12 }, lateDecember)).toBe(
      fromDate({ year: 2, month: 12, day: 22, hour: 12 }),
    )
    expect(nextOccurrence({ every: 'month', day: 1, hour: 8 }, lateDecember)).toBe(
      fromDate({ year: 2, month: 1, day: 1, hour: 8 }),
    )
  })

  it('una sola vez: después ya no vuelve', () => {
    expect(nextOccurrence({ every: 'once', at: START + 5 }, START)).toBe(START + 5)
    expect(nextOccurrence({ every: 'once', at: START + 5 }, START + 5)).toBe(Infinity)
  })

  it('nextDue devuelve el más próximo y agrupa los que coinciden', () => {
    const due = nextDue(
      [
        { id: 'a', rule: { every: 'day', hour: 21 } },
        { id: 'b', rule: { every: 'hour', minute: 0 } },
        { id: 'c', rule: { every: 'day', hour: 10 } },
      ],
      START,
    )
    expect(due.at).toBe(START + 60)
    expect(due.events.map((e) => e.id)).toEqual(['b', 'c'])
  })
})

describe('PRNG', () => {
  it('la misma semilla da la misma secuencia y se puede continuar', () => {
    const a = { rng: seedRng(42) }
    const b = { rng: seedRng(42) }
    const first = [randomFloat(a), randomFloat(a), randomFloat(a)]
    expect([randomFloat(b), randomFloat(b), randomFloat(b)]).toEqual(first)
    const copy = { rng: a.rng }
    expect(randomFloat(copy)).toBe(randomFloat(a))
  })

  it('randomInt queda en su rango y chance respeta la probabilidad aproximada', () => {
    const holder = { rng: seedRng(7) }
    let hits = 0
    for (let i = 0; i < 2000; i++) {
      const n = randomInt(holder, -10, 10)
      expect(n).toBeGreaterThanOrEqual(-10)
      expect(n).toBeLessThanOrEqual(10)
      if (chance(holder, 0.35)) hits++
    }
    expect(hits / 2000).toBeGreaterThan(0.3)
    expect(hits / 2000).toBeLessThan(0.4)
  })
})

describe('reloj', () => {
  const holder = (seed = 1): ClockHolder => ({
    clock: { time: START, weather: 'dry' },
    rng: seedRng(seed),
  })

  it('ritmo: a ×1 son 2 ticks por segundo (un día en 12 min) y a ×10, 20', () => {
    expect(ticksPerSecond(TEST_TIME, 1)).toBe(2)
    expect(ticksPerSecond(TEST_TIME, 10)).toBe(20)
    expect(MINUTES_PER_DAY / ticksPerSecond(TEST_TIME, 1)).toBe(12 * 60)
  })

  it('avanza los minutos pedidos y tira el clima cada medianoche', () => {
    const state = holder()
    const result = advanceClock(state, TEST_TIME, 2 * MINUTES_PER_DAY)
    expect(result.advanced).toBe(2 * MINUTES_PER_DAY)
    expect(state.clock.time).toBe(START + 2 * MINUTES_PER_DAY)
    expect(result.occurrences.filter((o) => o.kind === 'weather')).toHaveLength(2)
  })

  it('"próximo evento": se detiene justo en el lunes de cuentas', () => {
    const state = holder()
    const result = advanceClock(state, TEST_TIME, 30 * MINUTES_PER_DAY, { stopOnEvent: true })
    expect(result.stoppedBy).toBe('weeklyAccounts')
    expect(toDate(state.clock.time)).toMatchObject({
      month: 8,
      day: 30,
      hour: 8,
      minute: 0,
      weekday: 0,
    })
  })

  it('sin stopOnEvent, el evento se registra pero no detiene', () => {
    const state = holder()
    const result = advanceClock(state, TEST_TIME, 8 * MINUTES_PER_DAY)
    expect(result.stoppedBy).toBeNull()
    expect(result.occurrences.some((o) => o.kind === 'event' && o.id === 'weeklyAccounts')).toBe(
      true,
    )
  })

  it('avanzar de golpe o a trozos da el mismo resultado (determinista)', () => {
    const whole = holder(9)
    const pieces = holder(9)
    advanceClock(whole, TEST_TIME, 10 * MINUTES_PER_DAY)
    for (let i = 0; i < 10 * 24; i++) advanceClock(pieces, TEST_TIME, 60)
    expect(pieces).toEqual(whole)
  })
})

describe('partida con reloj', () => {
  it('empieza el lunes 23 de agosto a las 09:00 y avisa de los eventos al avanzar', () => {
    const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT, { seed: 3 })
    expect(toDate(game.state.clock.time)).toMatchObject({ year: 1, month: 8, day: 23, hour: 9 })
    const events: GameEvent[] = []
    game.subscribe((event) => events.push(event))
    const result = game.advance(7 * MINUTES_PER_DAY, { stopOnEvent: true })
    expect(result.stoppedBy).toBe('weeklyAccounts')
    expect(events.filter((e) => e.type === 'weatherChanged')).toHaveLength(7)
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'timeEvent', id: 'weeklyAccounts', stops: true }),
    )
    // El lunes de cuentas cierra la semana con su resumen
    expect(events.at(-1)).toMatchObject({ type: 'weeklyReport' })
  })

  it('la misma semilla da el mismo clima', () => {
    const weathers = (seed: number): string[] => {
      const game = createGame(TEST_MAP_CONFIG, TEST_CONTENT, { seed })
      const list: string[] = []
      game.subscribe((e) => {
        if (e.type === 'weatherChanged') list.push(e.weather)
      })
      game.advance(20 * MINUTES_PER_DAY)
      return list
    }
    expect(weathers(11)).toEqual(weathers(11))
  })
})
