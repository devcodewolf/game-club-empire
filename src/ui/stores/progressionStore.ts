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

/** Modo desarrollo: la URL lleva `?dev` (o `&dev`) y todo queda desbloqueado. */
function detectDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('dev')
}

export const useProgressionStore = defineStore('progression', () => {
  const division = ref<DivisionId>(STARTING_DIVISION)

  const devMode = detectDevMode()

  /** Sin requisito (o con uno desconocido) se considera desbloqueado. En modo desarrollo, siempre. */
  function isUnlocked(requires?: string): boolean {
    if (devMode) return true
    if (!requires || !isDivisionId(requires)) return true
    return isDivisionReached(requires, division.value)
  }

  /** Motivo del bloqueo para tooltips, o null si está disponible. */
  function lockReason(requires?: string): string | null {
    if (devMode || isUnlocked(requires) || !requires || !isDivisionId(requires)) return null
    return `Se desbloquea en ${divisionName(requires)}`
  }

  return { division, devMode, isUnlocked, lockReason }
})
