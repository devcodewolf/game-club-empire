/**
 * Progresión del club para la UI: división actual y qué está desbloqueado.
 * PROVISIONAL hasta la Fase 3 (ver `src/content/progression.ts`).
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  DIVISIONS,
  STARTING_DIVISION,
  divisionName,
  isUnlocked as isDivisionReached,
  type DivisionId,
} from '@/content/progression'

/** Comprueba que un texto sea un id de división conocido. */
function isDivisionId(value: string): value is DivisionId {
  return DIVISIONS.some((division) => division.id === value)
}

export const useProgressionStore = defineStore('progression', () => {
  const division = ref<DivisionId>(STARTING_DIVISION)

  /** Sin requisito (o con uno desconocido) se considera desbloqueado. */
  function isUnlocked(requires?: string): boolean {
    if (!requires || !isDivisionId(requires)) return true
    return isDivisionReached(requires, division.value)
  }

  /** Motivo del bloqueo para tooltips, o null si está disponible. */
  function lockReason(requires?: string): string | null {
    if (isUnlocked(requires) || !requires || !isDivisionId(requires)) return null
    return `Se desbloquea en ${divisionName(requires)}`
  }

  return { division, isUnlocked, lockReason }
})
