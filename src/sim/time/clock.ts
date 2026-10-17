/**
 * Reloj de la partida: avanza el tiempo, dispara los eventos del calendario y
 * tira el clima de cada día.
 *
 * 1 tick = 1 minuto de juego. El avance no recorre minuto a minuto: salta
 * directamente al siguiente evento programado, así que avanzar mucho tiempo
 * (×10, "próximo evento") cuesta lo mismo que poco.
 *
 * Las cifras (minutos reales por día, velocidades, fecha de inicio, lluvia y
 * eventos) son datos de `src/content/time.ts`.
 */
import { MINUTES_PER_DAY } from './calendar'
import { chance, type RngHolder } from './rng'
import { nextDue, type ScheduledEventDef } from './schedule'

export type Weather = 'dry' | 'rain'

/** Datos del tiempo (ver `src/content/time.ts`). */
export interface TimeContent {
  /** Minutos reales que dura un día de juego a ×1. Única fuente del ritmo. */
  readonly realMinutesPerDay: number
  /** Multiplicadores de velocidad disponibles (sin contar la pausa). */
  readonly speeds: readonly number[]
  /** Fecha y hora de inicio de la partida. */
  readonly start: {
    readonly year: number
    readonly month: number
    readonly day: number
    readonly hour: number
  }
  /** Probabilidad de que un día llueva (se tira a medianoche). */
  readonly rainChance: number
  /** Eventos del calendario (lunes de cuentas, partido…). */
  readonly events: readonly ScheduledEventDef[]
}

export interface ClockState {
  /** Instante actual: minutos desde el 1 de enero del año 1. */
  time: number
  weather: Weather
}

/** Lo que el reloj necesita del estado de la partida. */
export interface ClockHolder extends RngHolder {
  readonly clock: ClockState
}

/** Evento interno del reloj: empieza un día nuevo (se tira el clima). */
const DAY_START: ScheduledEventDef = { id: 'dayStart', rule: { every: 'day', hour: 0 } }

/** Ticks de simulación por segundo real a una velocidad dada. */
export function ticksPerSecond(time: TimeContent, speed: number): number {
  return (speed * MINUTES_PER_DAY) / (time.realMinutesPerDay * 60)
}

/** Tira el clima del día. */
export function rollWeather(state: ClockHolder, time: TimeContent): Weather {
  state.clock.weather = chance(state, time.rainChance) ? 'rain' : 'dry'
  return state.clock.weather
}

/** Algo que pasó al avanzar el reloj. */
export type ClockOccurrence =
  | { readonly kind: 'event'; readonly id: string; readonly at: number; readonly stops: boolean }
  | { readonly kind: 'weather'; readonly weather: Weather; readonly at: number }

export interface AdvanceResult {
  /** Lo ocurrido, en orden. */
  readonly occurrences: readonly ClockOccurrence[]
  /** Minutos que avanzó de verdad (menos que los pedidos si se detuvo en un evento). */
  readonly advanced: number
  /** Evento que detuvo el avance (solo con `stopOnEvent`). */
  readonly stoppedBy: string | null
}

/**
 * Avanza el reloj hasta `minutes` minutos, disparando por orden los eventos
 * que toquen. Con `stopOnEvent`, se detiene justo después del primer evento
 * que detenga el "próximo evento".
 */
export function advanceClock(
  state: ClockHolder,
  time: TimeContent,
  minutes: number,
  {
    stopOnEvent = false,
    onOccurrence,
  }: {
    readonly stopOnEvent?: boolean
    /**
     * Se llama con cada suceso en su instante (con el reloj ya en esa hora),
     * para que sus efectos (cobros, clima…) ocurran en orden y con la hora justa.
     */
    readonly onOccurrence?: (occurrence: ClockOccurrence) => void
  } = {},
): AdvanceResult {
  const start = state.clock.time
  const end = start + Math.max(0, Math.floor(minutes))
  const schedule = [DAY_START, ...time.events]
  const occurrences: ClockOccurrence[] = []

  for (;;) {
    const due = nextDue(schedule, state.clock.time)
    if (due.at > end) break
    state.clock.time = due.at
    let stoppedBy: string | null = null
    for (const event of due.events) {
      if (event === DAY_START) {
        const occurrence: ClockOccurrence = {
          kind: 'weather',
          weather: rollWeather(state, time),
          at: due.at,
        }
        occurrences.push(occurrence)
        onOccurrence?.(occurrence)
        continue
      }
      const stops = event.stops === true
      const occurrence: ClockOccurrence = { kind: 'event', id: event.id, at: due.at, stops }
      occurrences.push(occurrence)
      onOccurrence?.(occurrence)
      if (stops && stoppedBy === null) stoppedBy = event.id
    }
    if (stopOnEvent && stoppedBy !== null) {
      return { occurrences, advanced: state.clock.time - start, stoppedBy }
    }
  }
  state.clock.time = end
  return { occurrences, advanced: end - start, stoppedBy: null }
}
