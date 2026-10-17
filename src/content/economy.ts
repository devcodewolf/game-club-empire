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
  start: { division: 'comarcal', members: 60 },
  // Por división: entrada, cuota mensual de socio y subvención base semanal (§4.2)
  divisions: {
    comarcal: { entry: 5, memberFee: 15, subsidy: 500 },
    regional: { entry: 7, memberFee: 20, subsidy: 400 },
    autonomica: { entry: 10, memberFee: 30, subsidy: 300 },
    nacionalB: { entry: 15, memberFee: 40, subsidy: 200 },
    nacionalA: { entry: 25, memberFee: 60, subsidy: 0 },
    elite: { entry: 45, memberFee: 90, subsidy: 0 },
  },
  // "El pueblo confía en vosotros": ayuda extra los dos primeros meses
  startupAid: [
    { fromWeek: 1, toWeek: 4, amount: 1000 },
    { fromWeek: 5, toWeek: 8, amount: 500 },
  ],
  bar: { roomType: 'cafe', perDay: 30 },
  rental: {
    perDay: { 7: 30, 11: 50 },
    surfaceMultiplier: { dirt: 1, artificialTurf: 3, naturalGrass: 2, hybridGrass: 2 },
  },
  maintenance: {
    objectRate: 0.02,
    standRate: 0.01,
    interiorPerTile: 0.2,
    turfPerTile: { dirt: 0.05, artificialTurf: 0.1, hybridGrass: 0.4, naturalGrass: 0.6 },
  },
}
