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
    // Lunes de cuentas: subvención y cargos semanales (mantenimiento…)
    { id: 'weeklyAccounts', rule: { every: 'week', weekday: 0, hour: 8 }, stops: true },
    // Cuotas de socios, el día 1 de cada mes
    { id: 'monthlyFees', rule: { every: 'month', day: 1, hour: 8 } },
    // Alquiler de campos y caja del bar, cada noche
    { id: 'rentalDaily', rule: { every: 'day', hour: 21 } },
    { id: 'barDaily', rule: { every: 'day', hour: 22 } },
    // Cuidado de los campos al final del día (lluvia y jardinero)
    { id: 'pitchNightly', rule: { every: 'day', hour: 23 } },
    // Partido de la jornada: domingo de 17:00 a 19:00 (solo detiene si hay partido)
    { id: 'matchKickoff', rule: { every: 'week', weekday: 6, hour: 17 }, stops: true },
    { id: 'matchFinal', rule: { every: 'week', weekday: 6, hour: 19 }, stops: true },
  ],
}
