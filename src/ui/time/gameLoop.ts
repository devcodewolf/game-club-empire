/**
 * Bucle de juego: convierte el tiempo real en ticks de simulación según la
 * velocidad. La simulación no sabe nada del tiempo real; aquí solo se decide
 * CUÁNTOS minutos de juego avanzar en cada fotograma.
 */

/** Fotograma más largo que se tiene en cuenta (pestaña en segundo plano, pausas del navegador). */
export const MAX_FRAME_MS = 250

export interface TickAccumulator {
  /** Fracción de tick acumulada de fotogramas anteriores. */
  carry: number
}

/**
 * Ticks enteros que tocan en un fotograma de `frameMs` a `ticksPerSecond`.
 * Lo que sobra se guarda para el siguiente, así el ritmo medio es exacto.
 */
export function ticksForFrame(
  accumulator: TickAccumulator,
  frameMs: number,
  ticksPerSecond: number,
): number {
  const exact = accumulator.carry + (Math.min(frameMs, MAX_FRAME_MS) / 1000) * ticksPerSecond
  // Margen mínimo: 60 × (1/60 s × 2) suma 1,9999999 en coma flotante y se perdería un tick
  const ticks = Math.floor(exact + 1e-9)
  accumulator.carry = Math.max(0, exact - ticks)
  return ticks
}
