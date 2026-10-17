/**
 * Datos de la economía (Fase 2, ver docs/prompts/FASE2-ESPECIFICACION.md §4).
 * Euros sin decimales. Los costes de construcción están en cada catálogo
 * (suelos, muros, puertas, objetos); aquí van el arranque y las reglas comunes.
 */
import type { EconomyContent } from '@/sim/economy/ledger'

export const ECONOMY: EconomyContent = {
  startMoney: 12_000,
  // Demoler: se recupera la mitad de los objetos y una cuarta parte de lo demás
  refund: { objects: 0.5, structures: 0.25 },
  // Mover un campo con su estadio o un bloque cuesta el 10 % de su valor (un objeto, gratis)
  moveRate: 0.1,
}
