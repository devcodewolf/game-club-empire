/**
 * Calendario del juego. El tiempo es un único número: minutos de juego desde
 * el 1 de enero del año 1 a las 00:00. Todo lo demás (fecha, hora, día de la
 * semana) se deriva de él.
 *
 * Calendario ficticio sin años bisiestos (365 días): más simple y suficiente.
 * El 23 de agosto del año 1, día de inicio de la partida, es lunes.
 */

export const MINUTES_PER_HOUR = 60
export const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR
export const DAYS_PER_WEEK = 7

/** Días de cada mes (enero = índice 0). */
export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const
const DAYS_PER_YEAR = 365

/** Día de la semana: 0 = lunes … 6 = domingo. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Desfase para que el 23 de agosto del año 1 (día 234 desde el 1 de enero) sea lunes. */
const WEEKDAY_OFFSET = 234 % DAYS_PER_WEEK

export interface GameDate {
  readonly year: number
  /** 1-12 */
  readonly month: number
  /** 1-31 */
  readonly day: number
  readonly hour: number
  readonly minute: number
  readonly weekday: Weekday
}

/** Fecha y hora de un instante (minutos desde el 1 de enero del año 1). */
export function toDate(time: number): GameDate {
  const dayIndex = Math.floor(time / MINUTES_PER_DAY)
  const minuteOfDay = time - dayIndex * MINUTES_PER_DAY
  const year = Math.floor(dayIndex / DAYS_PER_YEAR) + 1
  let dayOfYear = dayIndex - (year - 1) * DAYS_PER_YEAR
  let month = 0
  while (dayOfYear >= (MONTH_DAYS[month] ?? 31)) {
    dayOfYear -= MONTH_DAYS[month] ?? 31
    month++
  }
  return {
    year,
    month: month + 1,
    day: dayOfYear + 1,
    hour: Math.floor(minuteOfDay / MINUTES_PER_HOUR),
    minute: minuteOfDay % MINUTES_PER_HOUR,
    weekday: weekdayOfDay(dayIndex),
  }
}

/** Instante de una fecha y hora. */
export function fromDate(date: {
  readonly year: number
  readonly month: number
  readonly day: number
  readonly hour?: number
  readonly minute?: number
}): number {
  let days = (date.year - 1) * DAYS_PER_YEAR
  for (let m = 0; m < date.month - 1; m++) days += MONTH_DAYS[m] ?? 31
  days += date.day - 1
  return days * MINUTES_PER_DAY + (date.hour ?? 0) * MINUTES_PER_HOUR + (date.minute ?? 0)
}

/** Día de la semana de un día (contado desde el 1 de enero del año 1). */
export function weekdayOfDay(dayIndex: number): Weekday {
  return ((((dayIndex - WEEKDAY_OFFSET) % DAYS_PER_WEEK) + DAYS_PER_WEEK) %
    DAYS_PER_WEEK) as Weekday
}

/** Número de día (desde el 1 de enero del año 1) de un instante. */
export function dayIndexOf(time: number): number {
  return Math.floor(time / MINUTES_PER_DAY)
}
