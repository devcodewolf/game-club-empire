/**
 * PRNG sembrado de la partida (mulberry32). Su estado es un entero de 32 bits
 * guardado en el estado de la partida, así que guardar y cargar continúa la
 * misma secuencia: la simulación es reproducible con la misma semilla.
 *
 * Toda aleatoriedad de la simulación pasa por aquí (nunca `Math.random()`).
 */

/** Lo que guarda el estado de su PRNG. */
export interface RngHolder {
  rng: number
}

/** Estado inicial a partir de una semilla cualquiera. */
export function seedRng(seed: number): number {
  return seed >>> 0 || 0x9e3779b9
}

/** Número en [0, 1) y avanza el estado. */
export function randomFloat(holder: RngHolder): number {
  holder.rng = (holder.rng + 0x6d2b79f5) >>> 0
  let t = holder.rng
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** ¿Ocurre algo con probabilidad `p`? */
export function chance(holder: RngHolder, p: number): boolean {
  return randomFloat(holder) < p
}

/** Entero en [min, max], ambos incluidos. */
export function randomInt(holder: RngHolder, min: number, max: number): number {
  return min + Math.floor(randomFloat(holder) * (max - min + 1))
}
