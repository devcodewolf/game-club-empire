/**
 * Ingresos y gastos regulares (Fase 2, Bloque C; docs/prompts/FASE2-ESPECIFICACION.md §4.3-4.4).
 *
 * Cada evento del calendario con efecto económico tiene aquí su manejador:
 *  - `weeklyAccounts` (lunes 08:00): subvención municipal + ayuda de arranque
 *    y mantenimiento semanal (objetos, interiores, césped y gradas).
 *  - `monthlyFees` (día 1, 08:00): cuotas de socios.
 *  - `barDaily` (22:00): caja del bar si hay una sala de bar completa.
 *  - `rentalDaily` (21:00): alquiler de los campos que lo tengan activado
 *    (nunca en domingo, día de partido).
 *
 * Las cifras son datos de `content.economy`. Cada movimiento se anota en el
 * libro de cuentas (con la zona del mapa si la tiene, para el texto flotante).
 */
import { pitchSurface, type BuildingDef, type PlacedBuilding } from '../buildings/buildings'
import type { SimContent } from '../content'
import { tilesInRect, type TileRect } from '../geometry'
import { buildingFootprint, type MapState } from '../map/map'
import { evaluateRoom } from '../rooms/rooms'
import { fromDate, MINUTES_PER_DAY, toDate } from '../time/calendar'
import { record, type LedgerEntry } from './ledger'
import { buildingValue } from './pricing'
import { weeklyWages } from './staff'
import { nightlyPitchCare, pitchResting, rollBreakdowns, wearFromRental } from './upkeep'

/** Ids de los eventos del calendario que mueven dinero (los programa `content.time.events`). */
export const ECONOMY_EVENT = {
  weeklyAccounts: 'weeklyAccounts',
  monthlyFees: 'monthlyFees',
  barDaily: 'barDaily',
  rentalDaily: 'rentalDaily',
  pitchNightly: 'pitchNightly',
} as const

/** Resumen de la semana que se cierra en el lunes de cuentas. */
export interface WeeklyReport {
  /** Desde (excluido) y hasta (incluido), en minutos de juego. */
  readonly from: number
  readonly to: number
  readonly income: number
  /** En positivo. */
  readonly expenses: number
  readonly net: number
}

export interface EconomyOutcome {
  readonly entries: readonly LedgerEntry[]
  /** Solo en el lunes de cuentas. */
  readonly report?: WeeklyReport
  /** Objetos que se averiaron (lunes). */
  readonly broken?: readonly PlacedBuilding[]
  /** ¿Cambió el estado de algún campo? */
  readonly pitchesChanged?: boolean
}

const WEEK = 7 * MINUTES_PER_DAY

/** Precios de la división del club (o los de la primera si no está en la tabla). */
export function divisionPrices(state: MapState, content: SimContent) {
  const table = content.economy.divisions
  return (
    table[state.club.division] ?? Object.values(table)[0] ?? { entry: 0, memberFee: 0, subsidy: 0 }
  )
}

/** Semana de juego actual: la 1 es la del primer lunes de cuentas. */
export function weekNumber(state: MapState, content: SimContent): number {
  return Math.floor((state.clock.time - fromDate(content.time.start)) / WEEK) + 1
}

/** Ayuda de arranque del ayuntamiento para la semana `week` (0 si ya no toca). */
export function startupAid(content: SimContent, week: number): number {
  return (
    content.economy.startupAid.find((aid) => week >= aid.fromWeek && week <= aid.toWeek)?.amount ??
    0
  )
}

const isPitchOrStand = (def: BuildingDef): boolean => Boolean(def.pitch || def.stand)

/** Mantenimiento semanal desglosado. */
export interface Maintenance {
  readonly objects: number
  readonly interiors: number
  readonly turf: number
  readonly stands: number
}

/** Mantenimiento de un objeto colocado por semana (objetos y gradas; los campos pagan por césped). */
export function buildingMaintenance(
  content: SimContent,
  def: BuildingDef,
  building: PlacedBuilding,
): number {
  const rates = content.economy.maintenance
  if (def.pitch) return pitchTurfMaintenance(content, def, building)
  return buildingValue(def, building) * (def.stand ? rates.standRate : rates.objectRate)
}

/** Césped de un campo por semana: casillas del campo × tarifa de su superficie. */
function pitchTurfMaintenance(
  content: SimContent,
  def: BuildingDef,
  building: PlacedBuilding,
): number {
  const surface = pitchSurface(def, building.tier)
  const perTile = surface ? (content.economy.maintenance.turfPerTile[surface] ?? 0) : 0
  const rect = buildingFootprint(building, def)
  return rect.width * rect.height * perTile
}

/** Mantenimiento semanal del club, desglosado. */
export function weeklyMaintenance(state: MapState, content: SimContent): Maintenance {
  let objects = 0
  let turf = 0
  let stands = 0
  for (const building of Object.values(state.buildings)) {
    const def = content.buildings[building.type]
    if (!def) continue
    const cost = buildingMaintenance(content, def, building)
    if (def.pitch) turf += cost
    else if (def.stand) stands += cost
    else objects += cost
  }
  let indoorTiles = 0
  for (const indoor of state.indoor) if (indoor) indoorTiles++
  return {
    objects,
    interiors: indoorTiles * content.economy.maintenance.interiorPerTile,
    turf,
    stands,
  }
}

/** Mantenimiento semanal de una sala: sus objetos y sus casillas interiores. */
export function roomMaintenance(state: MapState, content: SimContent, roomId: number): number {
  const status = evaluateRoom(state, content, roomId)
  if (!status) return 0
  let total = status.tiles.length * content.economy.maintenance.interiorPerTile
  const inside = new Set(status.tiles.map((t) => `${t.x},${t.y}`))
  for (const building of Object.values(state.buildings)) {
    const def = content.buildings[building.type]
    if (!def || isPitchOrStand(def)) continue
    const touches = [...tilesInRect(buildingFootprint(building, def))].some((t) =>
      inside.has(`${t.x},${t.y}`),
    )
    if (touches) total += buildingMaintenance(content, def, building)
  }
  return total
}

/** Zona de la primera sala de bar completa (da la caja diaria y la del partido), o null. */
export function completeBar(state: MapState, content: SimContent): TileRect | null {
  for (const key of Object.keys(state.rooms)) {
    const room = state.rooms[Number(key)]
    if (room?.type !== content.economy.bar.roomType) continue
    const status = evaluateRoom(state, content, Number(key))
    if (status?.ok) return status.bounds
  }
  return null
}

/** Alquiler diario de un campo según formato y superficie. */
export function pitchRentalPerDay(
  content: SimContent,
  def: BuildingDef,
  building: PlacedBuilding,
): number {
  if (!def.pitch) return 0
  const rental = content.economy.rental
  const base = rental.perDay[def.pitch.format] ?? 0
  const surface = pitchSurface(def, building.tier)
  return base * (surface ? (rental.surfaceMultiplier[surface] ?? 1) : 1)
}

/** Aplica el efecto económico de un evento del calendario. Eventos sin efecto: nada. */
export function applyEconomyEvent(
  state: MapState,
  content: SimContent,
  id: string,
): EconomyOutcome {
  const entries: LedgerEntry[] = []
  const add = (entry: LedgerEntry | null): void => {
    if (entry) entries.push(entry)
  }

  switch (id) {
    case ECONOMY_EVENT.weeklyAccounts: {
      const prices = divisionPrices(state, content)
      add(
        record(state, 'subsidy', prices.subsidy + startupAid(content, weekNumber(state, content))),
      )
      const m = weeklyMaintenance(state, content)
      add(record(state, 'maintenanceObjects', -m.objects))
      add(record(state, 'maintenanceInteriors', -m.interiors))
      add(record(state, 'maintenanceTurf', -m.turf))
      add(record(state, 'maintenanceStands', -m.stands))
      add(record(state, 'wages', -weeklyWages(state, content)))
      const broken = rollBreakdowns(state, content)
      return {
        entries,
        report: weeklyReport(state, state.clock.time - WEEK, state.clock.time),
        ...(broken.length ? { broken } : {}),
      }
    }
    case ECONOMY_EVENT.monthlyFees: {
      const prices = divisionPrices(state, content)
      add(record(state, 'memberFees', state.club.members * prices.memberFee))
      return { entries }
    }
    case ECONOMY_EVENT.barDaily: {
      const bar = completeBar(state, content)
      if (bar) add(record(state, 'bar', content.economy.bar.perDay, bar))
      return { entries }
    }
    case ECONOMY_EVENT.rentalDaily: {
      // Nunca en domingo: es día de partido
      if (toDate(state.clock.time).weekday === 6) return { entries }
      let pitchesChanged = false
      for (const building of Object.values(state.buildings)) {
        const def = content.buildings[building.type]
        // Recién reparado, el campo descansa: ni se alquila ni se desgasta
        if (!def?.pitch || !building.rental || pitchResting(state, building)) continue
        add(
          record(
            state,
            'pitchRental',
            pitchRentalPerDay(content, def, building),
            buildingFootprint(building, def),
          ),
        )
        wearFromRental(state, content, building)
        pitchesChanged = true
      }
      return { entries, pitchesChanged }
    }
    case ECONOMY_EVENT.pitchNightly: {
      return { entries, pitchesChanged: nightlyPitchCare(state, content) }
    }
    default:
      return { entries }
  }
}

/** Ingresos, gastos y neto de las entradas del libro en (from, to]. */
export function weeklyReport(state: MapState, from: number, to: number): WeeklyReport {
  let income = 0
  let expenses = 0
  for (const entry of state.ledger) {
    if (entry.at <= from || entry.at > to) continue
    if (entry.amount > 0) income += entry.amount
    else expenses -= entry.amount
  }
  return { from, to, income, expenses, net: income - expenses }
}
