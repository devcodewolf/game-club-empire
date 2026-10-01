/**
 * Divisiones de la liga, de la más baja a la más alta. Nombres ficticios.
 *
 * PROVISIONAL: la progresión completa (qué hace falta para ascender y qué
 * desbloquea cada ascenso) se diseña en la Fase 3 (`docs/PROGRESION.md`).
 * De momento solo sirve para marcar en el menú qué está bloqueado.
 */
export const DIVISIONS = [
  { id: 'comarcal', name: 'Liga Comarcal' },
  { id: 'regional', name: 'Regional' },
  { id: 'autonomica', name: 'Autonómica' },
  { id: 'nacionalB', name: 'Nacional B' },
  { id: 'nacionalA', name: 'Nacional A' },
  { id: 'elite', name: 'Liga Élite' },
] as const

export type DivisionId = (typeof DIVISIONS)[number]['id']

/** División en la que empieza el club. */
export const STARTING_DIVISION: DivisionId = 'comarcal'

/** Posición de una división (0 = la más baja). */
export function divisionRank(id: DivisionId): number {
  return DIVISIONS.findIndex((division) => division.id === id)
}

export function divisionName(id: DivisionId): string {
  return DIVISIONS.find((division) => division.id === id)?.name ?? id
}

/** ¿Está desbloqueado algo que pide `required` si el club está en `current`? */
export function isUnlocked(required: DivisionId | undefined, current: DivisionId): boolean {
  if (!required) return true
  return divisionRank(current) >= divisionRank(required)
}
