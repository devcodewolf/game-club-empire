/**
 * Vallas publicitarias (Fase 2, Bloque F; docs/prompts/FASE2-ESPECIFICACION.md §4.3).
 *
 * Las vallas son un dato del campo, como los banquillos: se compran desde su
 * ficha y se colocan solas en el pasillo de alrededor (el dibujo decide dónde),
 * así se mueven con él y no chocan con las gradas. Cada lunes:
 *  - cada valla con anunciante paga `incomeBase × (1 + fama / incomeFameDivisor)`;
 *  - los anuncios que terminan dejan la valla libre;
 *  - cada valla libre consigue anunciante con probabilidad
 *    `chanceBase + fama × chancePerFame`, por unas semanas al azar.
 * Los anunciantes son los negocios inventados del pueblo (los de los patrocinios).
 */
import type { BuildingDef, PlacedBuilding } from '../buildings/buildings'
import type { SimContent } from '../content'
import { buildingFootprint, type MapState } from '../map/map'
import { record, type LedgerEntry } from '../economy/ledger'
import { MINUTES_PER_DAY } from '../time/calendar'
import { chance, randomInt } from '../time/rng'

const WEEK = 7 * MINUTES_PER_DAY

export interface BillboardsContent {
  /** Precio de cada valla. */
  readonly cost: number
  /**
   * Vallas que caben según el formato del campo (7 u 11) y su nivel (índice):
   * cada mejora del campo abre más hueco, hasta rodearlo entero en el último.
   */
  readonly maxPerPitch: Readonly<Record<number, readonly number[]>>
  readonly chanceBase: number
  readonly chancePerFame: number
  /** Semanas que se queda un anunciante: mínimo y máximo. */
  readonly weeks: readonly [number, number]
  readonly incomeBase: number
  readonly incomeFameDivisor: number
}

/** Una valla del campo: su anunciante (id de negocio) y hasta cuándo, o libre. */
export interface Billboard {
  readonly advertiser: string | null
  /** Fin del anuncio (minutos de juego); 0 si está libre. */
  readonly until: number
}

/** Vallas que caben en un campo de este nivel (el último valor sirve para niveles mayores). */
export function maxBillboards(content: SimContent, def: BuildingDef, tier: number): number {
  const byTier = def.pitch ? content.billboards.maxPerPitch[def.pitch.format] : undefined
  if (!byTier?.length) return 0
  return byTier[Math.min(tier, byTier.length - 1)] ?? 0
}

/** Ingreso semanal de una valla con anunciante según la fama del club. */
export function billboardIncome(content: SimContent, fame: number): number {
  const rules = content.billboards
  return Math.round(rules.incomeBase * (1 + fame / rules.incomeFameDivisor))
}

/** Probabilidad de que una valla libre consiga anunciante un lunes. */
export function billboardChance(content: SimContent, fame: number): number {
  const rules = content.billboards
  return Math.min(1, rules.chanceBase + fame * rules.chancePerFame)
}

/** Vallas con anunciante en todo el club. */
export function occupiedBillboards(state: MapState): number {
  let count = 0
  for (const building of Object.values(state.buildings)) {
    for (const board of building.billboards ?? []) if (board.advertiser) count++
  }
  return count
}

export type BillboardError = 'notAPitch' | 'noBillboardRoom'

/** ¿Se puede poner otra valla en este campo? */
export function validateBuildBillboard(
  content: SimContent,
  def: BuildingDef | undefined,
  building: PlacedBuilding | undefined,
): BillboardError | null {
  if (!def?.pitch || !building) return 'notAPitch'
  if ((building.billboards?.length ?? 0) >= maxBillboards(content, def, building.tier))
    return 'noBillboardRoom'
  return null
}

/** Pone una valla libre más (ya validada y cobrada). */
export function applyBuildBillboard(state: MapState, building: PlacedBuilding): PlacedBuilding {
  const next: PlacedBuilding = {
    ...building,
    billboards: [...(building.billboards ?? []), { advertiser: null, until: 0 }],
  }
  state.buildings[building.id] = next
  return next
}

export interface BillboardsUpdate {
  readonly entries: readonly LedgerEntry[]
  /** Campos cuyas vallas cambiaron de anunciante (para redibujarlas). */
  readonly changed: readonly PlacedBuilding[]
}

/** Lunes: cobra las vallas con anuncio, libera las que terminan y busca anunciantes. */
export function weeklyBillboards(state: MapState, content: SimContent): BillboardsUpdate {
  const rules = content.billboards
  const businesses = content.sponsors.businesses
  const entries: LedgerEntry[] = []
  const changed: PlacedBuilding[] = []
  const now = state.clock.time
  const income = billboardIncome(content, state.club.fame)
  const p = billboardChance(content, state.club.fame)
  // Orden estable por id: la misma semilla da los mismos anunciantes
  const ids = Object.keys(state.buildings)
    .map(Number)
    .sort((a, b) => a - b)
  for (const id of ids) {
    const building = state.buildings[id]
    const def = building && content.buildings[building.type]
    const boards = building?.billboards
    if (!building || !def?.pitch || !boards?.length) continue

    const occupied = boards.filter((b) => b.advertiser).length
    if (occupied > 0) {
      const entry = record(state, 'billboards', occupied * income, buildingFootprint(building, def))
      if (entry) entries.push(entry)
    }
    let dirty = false
    const next = boards.map((board): Billboard => {
      if (board.advertiser && board.until > now) return board
      if (board.advertiser) dirty = true
      if (businesses.length === 0 || !chance(state, p)) return { advertiser: null, until: 0 }
      dirty = true
      const business = businesses[randomInt(state, 0, businesses.length - 1)]!
      const weeks = randomInt(state, rules.weeks[0], rules.weeks[1])
      return { advertiser: business.id, until: now + weeks * WEEK }
    })
    if (dirty) {
      const updated: PlacedBuilding = { ...building, billboards: next }
      state.buildings[id] = updated
      changed.push(updated)
    }
  }
  return { entries, changed }
}
