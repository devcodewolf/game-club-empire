/**
 * Personal abstracto (Fase 2, Bloque D; docs/prompts/FASE2-ESPECIFICACION.md §4.5).
 *
 * Se contrata y despide desde el panel de Personal; no aparece en el mapa
 * hasta la Fase 4. Cada puesto cubre una cantidad de trabajo por persona y
 * la cobertura es `min(1, capacidad / necesidad)`: con cobertura baja, el
 * campo deja de recuperarse (jardinería), baja la satisfacción de la afición
 * (limpieza) o hay averías (mantenimiento).
 */
import { pitchSurface, type BuildingDef } from '../buildings/buildings'
import { pitchCapacity } from '../buildings/stands'
import type { SimContent } from '../content'
import { buildingFootprint, type MapState } from '../map/map'
import { buildingValue } from './pricing'

export type StaffRole = 'gardener' | 'cleaner' | 'maintenance' | 'monitor'

export const STAFF_ROLES: readonly StaffRole[] = ['gardener', 'cleaner', 'maintenance', 'monitor']

/** Datos de un puesto (ver `content.economy.staff`). */
export interface StaffRoleDef {
  readonly name: string
  /** Sueldo semanal por persona. */
  readonly wage: number
  /**
   * Trabajo que cubre una persona, por unidad de necesidad. Limpieza cubre dos
   * cosas a la vez (casillas interiores y asientos): su necesidad es la suma
   * de las dos, cada una dividida por lo que cubre una persona.
   */
  readonly covers: Readonly<Record<string, number>>
}

export interface StaffCoverage {
  /** Personas contratadas. */
  readonly hired: number
  /** Personas que harían falta para cubrirlo todo (con decimales). */
  readonly needed: number
  /** 0-1. Sin necesidad, 1. */
  readonly coverage: number
}

const isPitchOrStand = (def: BuildingDef): boolean => Boolean(def.pitch || def.stand)

/** Cantidades de trabajo del club que cubre el personal. */
export function staffWorkload(state: MapState, content: SimContent): Record<string, number> {
  let pitchTiles = 0
  let objectsValue = 0
  let seats = 0
  for (const building of Object.values(state.buildings)) {
    const def = content.buildings[building.type]
    if (!def) continue
    if (def.pitch) {
      const rect = buildingFootprint(building, def)
      pitchTiles += rect.width * rect.height
      seats += pitchCapacity(state, content, building.id)
    } else if (!isPitchOrStand(def)) {
      objectsValue += buildingValue(def, building)
    }
  }
  let indoorTiles = 0
  for (const indoor of state.indoor) if (indoor) indoorTiles++
  return { pitchTiles, indoorTiles, seats, objectsValue, students: state.club.students }
}

/** Cobertura de un puesto. */
export function staffCoverage(
  state: MapState,
  content: SimContent,
  role: StaffRole,
): StaffCoverage {
  const def = content.economy.staff[role]
  const hired = state.club.staff[role] ?? 0
  const workload = staffWorkload(state, content)
  let needed = 0
  for (const [unit, perPerson] of Object.entries(def.covers)) {
    if (perPerson > 0) needed += (workload[unit] ?? 0) / perPerson
  }
  const coverage = needed <= 0 ? 1 : Math.min(1, hired / needed)
  return { hired, needed, coverage }
}

/** Sueldos semanales de toda la plantilla. */
export function weeklyWages(state: MapState, content: SimContent): number {
  let total = 0
  for (const role of STAFF_ROLES)
    total += (state.club.staff[role] ?? 0) * content.economy.staff[role].wage
  return total
}

/** Estado máximo de un campo según su superficie actual. */
export function pitchMaxCondition(content: SimContent, def: BuildingDef, tier: number): number {
  const surface = pitchSurface(def, tier)
  return surface ? (content.economy.pitch.maxCondition[surface] ?? 100) : 100
}
