/**
 * Vallas publicitarias alrededor de los campos (Fase 2, Bloque F; ver
 * docs/prompts/FASE2-ESPECIFICACION.md §4.3). Los anunciantes son los
 * negocios de los patrocinios. Las cifras se ajustan jugando.
 */
import type { BillboardsContent } from '@/sim/club/billboards'

export const BILLBOARDS: BillboardsContent = {
  cost: 150,
  // Por nivel del campo (tierra → artificial → natural → híbrido): cada mejora abre
  // más hueco y en el último nivel el campo queda rodeado (banda sin banquillos y fondos)
  maxPerPitch: { 7: [4, 8, 12, 18], 11: [8, 16, 24, 32] },
  // Con fama 5, un 32,5 % cada lunes; con fama 50, un 55 %
  chanceBase: 0.3,
  chancePerFame: 1 / 200,
  weeks: [4, 12],
  // 22 €/semana con fama 5; 40 € con fama 50
  incomeBase: 20,
  incomeFameDivisor: 50,
}
