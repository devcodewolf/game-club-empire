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

/** Dinero de `?infinite` (para probar sin preocuparse del saldo). */
const TEST_MONEY = 1_000_000

/**
 * Dinero inicial de pruebas desde la URL, o undefined para el normal:
 * `?infinite` da 1.000.000 € y `?money=50000` la cifra que se pida.
 * Se combina con `?dev` (`?dev&infinite`).
 */
export function detectTestMoney(): number | undefined {
  if (typeof window === 'undefined') return undefined
  const params = new URLSearchParams(window.location.search)
  const custom = Number(params.get('money'))
  if (params.has('money') && Number.isFinite(custom) && custom > 0) return custom
  return params.has('infinite') ? TEST_MONEY : undefined
}

/**
 * Semilla de una partida nueva: al azar (cada partida es distinta) salvo que
 * la URL pida una con `?seed=N`, para repetir una partida en las pruebas.
 * La simulación es determinista a partir de ella.
 */
export function chooseSeed(): number {
  const fromUrl =
    typeof window === 'undefined'
      ? NaN
      : Number(new URLSearchParams(window.location.search).get('seed'))
  if (Number.isInteger(fromUrl) && fromUrl > 0) return fromUrl
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1
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
