/**
 * Generador pseudoaleatorio determinista (mulberry32) para el arte procedural:
 * la misma semilla produce siempre el mismo dibujo, así las texturas no
 * cambian entre recargas. No usar para la simulación (tendrá su propio RNG).
 */
export interface Random {
  /** Número en [0, 1). */
  next(): number
  /** Número en [min, max). */
  range(min: number, max: number): number
  /** Entero en [min, max]. */
  int(min: number, max: number): number
  /** Elemento al azar de una lista no vacía. */
  pick<T>(items: readonly T[]): T
}

export function createRandom(seed: number): Random {
  let state = seed | 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const range = (min: number, max: number): number => min + next() * (max - min)
  const int = (min: number, max: number): number => Math.floor(range(min, max + 1))

  return {
    next,
    range,
    int,
    pick: <T>(items: readonly T[]): T => items[int(0, items.length - 1)] as T,
  }
}

/** Semilla estable a partir de un texto (p. ej. el id de un suelo). */
export function seedFromText(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return hash >>> 0
}
