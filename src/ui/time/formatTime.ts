/** Textos de fecha y hora para la interfaz ("Dom 5 sep · 17:00 · Año 1"). */
import { toDate } from '@/sim/time/calendar'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const
const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

const pad = (n: number): string => String(n).padStart(2, '0')

/** "Dom 5 sep" */
export function formatDay(time: number): string {
  const d = toDate(time)
  return `${WEEKDAYS[d.weekday]} ${d.day} ${MONTHS[d.month - 1]}`
}

/** "17:00" */
export function formatHour(time: number): string {
  const d = toDate(time)
  return `${pad(d.hour)}:${pad(d.minute)}`
}

/** "Año 1" */
export function formatYear(time: number): string {
  return `Año ${toDate(time).year}`
}

/** "Dom 5 sep · 17:00 · Año 1" */
export function formatClock(time: number): string {
  return `${formatDay(time)} · ${formatHour(time)} · ${formatYear(time)}`
}
