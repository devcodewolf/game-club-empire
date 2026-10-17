/**
 * Planificador: cuándo toca cada evento del calendario.
 *
 * Una regla describe una repetición (cada hora, cada día, cada semana, cada
 * mes, una fecha al año o un instante concreto). `nextOccurrence` da el
 * primer instante ESTRICTAMENTE posterior a uno dado, sin recorrer minuto a
 * minuto: la simulación puede saltar directamente al siguiente evento.
 */
import {
  DAYS_PER_WEEK,
  dayIndexOf,
  fromDate,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  toDate,
  weekdayOfDay,
  type Weekday,
} from './calendar'

export type ScheduleRule =
  | { readonly every: 'hour'; readonly minute: number }
  | { readonly every: 'day'; readonly hour: number; readonly minute?: number }
  | {
      readonly every: 'week'
      readonly weekday: Weekday
      readonly hour: number
      readonly minute?: number
    }
  | {
      readonly every: 'month'
      readonly day: number
      readonly hour: number
      readonly minute?: number
    }
  /** Una fecha cada año (p. ej. el 22 de diciembre). */
  | {
      readonly every: 'year'
      readonly month: number
      readonly day: number
      readonly hour: number
      readonly minute?: number
    }
  /** Una sola vez, en un instante concreto. */
  | { readonly every: 'once'; readonly at: number }

/** Evento del calendario definido como dato. */
export interface ScheduledEventDef {
  readonly id: string
  readonly rule: ScheduleRule
  /** ¿Detiene el "próximo evento"? (partido, lunes de cuentas, avisos…) */
  readonly stops?: boolean
}

/** Primer instante posterior a `after` en que se cumple la regla (o Infinity si ya no habrá más). */
export function nextOccurrence(rule: ScheduleRule, after: number): number {
  switch (rule.every) {
    case 'hour': {
      const hourStart = Math.floor(after / MINUTES_PER_HOUR) * MINUTES_PER_HOUR
      const candidate = hourStart + rule.minute
      return candidate > after ? candidate : candidate + MINUTES_PER_HOUR
    }
    case 'day': {
      const offset = rule.hour * MINUTES_PER_HOUR + (rule.minute ?? 0)
      const candidate = dayIndexOf(after) * MINUTES_PER_DAY + offset
      return candidate > after ? candidate : candidate + MINUTES_PER_DAY
    }
    case 'week': {
      const offset = rule.hour * MINUTES_PER_HOUR + (rule.minute ?? 0)
      const today = dayIndexOf(after)
      const daysAhead = (rule.weekday - weekdayOfDay(today) + DAYS_PER_WEEK) % DAYS_PER_WEEK
      const candidate = (today + daysAhead) * MINUTES_PER_DAY + offset
      return candidate > after ? candidate : candidate + DAYS_PER_WEEK * MINUTES_PER_DAY
    }
    case 'month': {
      const { year, month } = toDate(after)
      for (let i = 0; i < 13; i++) {
        const m = ((month - 1 + i) % 12) + 1
        const y = year + Math.floor((month - 1 + i) / 12)
        const candidate = fromDate({
          year: y,
          month: m,
          day: rule.day,
          hour: rule.hour,
          minute: rule.minute,
        })
        if (candidate > after) return candidate
      }
      return Infinity
    }
    case 'year': {
      const { year } = toDate(after)
      for (const y of [year, year + 1]) {
        const candidate = fromDate({
          year: y,
          month: rule.month,
          day: rule.day,
          hour: rule.hour,
          minute: rule.minute,
        })
        if (candidate > after) return candidate
      }
      return Infinity
    }
    case 'once':
      return rule.at > after ? rule.at : Infinity
  }
}

/**
 * Siguiente momento en que toca algún evento, y cuáles tocan entonces (en el
 * orden de la lista). Sin eventos pendientes, `at` es Infinity.
 */
export function nextDue(
  events: readonly ScheduledEventDef[],
  after: number,
): { readonly at: number; readonly events: readonly ScheduledEventDef[] } {
  let at = Infinity
  let due: ScheduledEventDef[] = []
  for (const event of events) {
    const when = nextOccurrence(event.rule, after)
    if (when < at) {
      at = when
      due = [event]
    } else if (when === at && when !== Infinity) {
      due.push(event)
    }
  }
  return { at, events: due }
}
