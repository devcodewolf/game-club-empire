/**
 * Estado de los campos y averías de los objetos (Fase 2, Bloque D;
 * docs/prompts/FASE2-ESPECIFICACION.md §4.5).
 *
 *  - Estado del campo (0-100): cada noche se recupera según la cobertura de
 *    jardinería (hasta el máximo de su superficie) y baja con la lluvia; los
 *    días de alquiler lo desgastan (lo aplica el alquiler) y, en el Bloque E,
 *    los partidos. Repararlo (de pago) lo deja al máximo y unos días sin alquilar.
 *  - Averías: cada lunes, cada objeto puede romperse con una probabilidad que
 *    baja con la cobertura de mantenimiento. Roto no cuenta para su sala
 *    hasta que se paga la reparación.
 */
import { pitchSurface, type BuildingDef, type PlacedBuilding } from '../buildings/buildings'
import type { SimContent } from '../content'
import { buildingFootprint, type MapState } from '../map/map'
import { MINUTES_PER_DAY } from '../time/calendar'
import { chance } from '../time/rng'
import { buildingValue } from './pricing'
import { pitchMaxCondition, staffCoverage } from './staff'

/** Estado actual de un campo (los antiguos sin dato, al máximo de su superficie). */
export function pitchCondition(
  content: SimContent,
  def: BuildingDef,
  building: PlacedBuilding,
): number {
  return building.condition ?? pitchMaxCondition(content, def, building.tier)
}

const clamp = (value: number, max: number): number => Math.max(0, Math.min(max, value))

/** Cambia el estado de un campo (limitado a 0..máximo de su superficie). */
function setCondition(
  state: MapState,
  content: SimContent,
  building: PlacedBuilding,
  value: number,
): void {
  const def = content.buildings[building.type]
  if (!def?.pitch) return
  const current = state.buildings[building.id]
  if (!current) return
  state.buildings[building.id] = {
    ...current,
    condition: clamp(value, pitchMaxCondition(content, def, current.tier)),
  }
}

/** Desgaste de un día de alquiler (lo aplica el alquiler diario). */
export function wearFromRental(
  state: MapState,
  content: SimContent,
  building: PlacedBuilding,
): void {
  const def = content.buildings[building.type]
  const surface = def && pitchSurface(def, building.tier)
  if (!def || !surface) return
  const damage = content.economy.pitch.rentalDamage[surface] ?? 0
  setCondition(state, content, building, pitchCondition(content, def, building) - damage)
}

/** Fin del día: la lluvia desgasta y el jardinero recupera. Devuelve si cambió algún campo. */
export function nightlyPitchCare(state: MapState, content: SimContent): boolean {
  const rules = content.economy.pitch
  const gardening = staffCoverage(state, content, 'gardener').coverage
  const raining = state.clock.weather === 'rain'
  let changed = false
  for (const building of Object.values(state.buildings)) {
    const def = content.buildings[building.type]
    const surface = def && pitchSurface(def, building.tier)
    if (!def?.pitch || !surface) continue
    const before = pitchCondition(content, def, building)
    const rain = raining ? (rules.rainDamage[surface] ?? 0) : 0
    setCondition(state, content, building, before - rain + rules.dailyRecovery * gardening)
    if (state.buildings[building.id]?.condition !== before) changed = true
  }
  return changed
}

/** Coste de reparar el césped de un campo: casillas × tarifa de su superficie. */
export function pitchRepairCost(
  content: SimContent,
  def: BuildingDef,
  building: PlacedBuilding,
): number {
  const surface = pitchSurface(def, building.tier)
  const perTile = surface ? (content.economy.pitch.repairPerTile[surface] ?? 0) : 0
  const rect = buildingFootprint(building, def)
  return rect.width * rect.height * perTile
}

/** ¿Está el campo descansando tras una reparación (no se alquila)? */
export function pitchResting(state: MapState, building: PlacedBuilding): boolean {
  return (building.restUntil ?? 0) > state.clock.time
}

/** Repara el césped (ya validado y cobrado): estado al máximo y unos días de descanso. */
export function applyPitchRepair(
  state: MapState,
  content: SimContent,
  building: PlacedBuilding,
): PlacedBuilding {
  const def = content.buildings[building.type]
  if (!def?.pitch) return building
  const repaired: PlacedBuilding = {
    ...building,
    condition: pitchMaxCondition(content, def, building.tier),
    restUntil: state.clock.time + content.economy.pitch.repairRestDays * MINUTES_PER_DAY,
  }
  state.buildings[building.id] = repaired
  return repaired
}

/** Estado de un campo recién mejorado de superficie: el máximo de la nueva. */
export function pitchMaxConditionAfterUpgrade(
  content: SimContent,
  def: BuildingDef,
  tier: number,
): number {
  return pitchMaxCondition(content, def, tier)
}

/** Coste de reparar un objeto averiado. */
export function buildingRepairCost(
  content: SimContent,
  def: BuildingDef,
  building: PlacedBuilding,
): number {
  return buildingValue(def, building) * content.economy.breakdown.repairRate
}

/** Lunes: tira las averías de los objetos. Devuelve los que se rompen. */
export function rollBreakdowns(state: MapState, content: SimContent): PlacedBuilding[] {
  const maintenance = staffCoverage(state, content, 'maintenance').coverage
  const p = content.economy.breakdown.weeklyChance * (1 - maintenance)
  const broken: PlacedBuilding[] = []
  if (p <= 0) return broken
  // Orden estable por id: la misma semilla rompe siempre los mismos objetos
  const ids = Object.keys(state.buildings)
    .map(Number)
    .sort((a, b) => a - b)
  for (const id of ids) {
    const building = state.buildings[id]
    const def = building && content.buildings[building.type]
    if (!building || !def || def.pitch || def.stand || building.broken) continue
    if (!chance(state, p)) continue
    const updated = { ...building, broken: true }
    state.buildings[id] = updated
    broken.push(updated)
  }
  return broken
}
