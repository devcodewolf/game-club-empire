/**
 * Datos del tiempo de juego (Fase 2, ver docs/prompts/FASE2-ESPECIFICACION.md §3).
 *
 * `realMinutesPerDay` es la única fuente del ritmo: a ×1 un día dura 12 min
 * reales (2 ticks por segundo); el resto se deriva.
 */
import type { TimeContent } from '@/sim/time/clock'

export const TIME: TimeContent = {
  realMinutesPerDay: 12,
  speeds: [1, 3, 5, 10],
  // Lunes 23 de agosto del año 1, 09:00
  start: { year: 1, month: 8, day: 23, hour: 9 },
  rainChance: 0.35,
  events: [
    // Lunes de cuentas: los cargos semanales se agrupan aquí (Bloque C)
    { id: 'weeklyAccounts', rule: { every: 'week', weekday: 0, hour: 8 }, stops: true },
  ],
}
