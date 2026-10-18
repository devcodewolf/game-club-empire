/**
 * Objetivos de subvenciones y patrocinios (Fase 2, Bloque F), como datos.
 *
 * Cada objetivo dice qué medir (salas completas, socios, aforo, victorias…)
 * y cuánto hace falta. Se comprueban tras cada obra y cada suceso del reloj;
 * una vez cumplido, queda cumplido (se tacha en el tablón, como en Prison
 * Architect). Los que piden mantener algo un tiempo (el estado del campo
 * durante N días) cuentan desde que se alcanzó y se reinician si se pierde.
 * Los que cuentan partidos solo miran los jugados desde que se aceptó.
 *
 * El texto de cada objetivo lo compone la interfaz a partir de estos datos.
 */
import type { SimContent } from '../content'
import type { MapState } from '../map/map'
import { evaluateRoom } from '../rooms/rooms'
import type { RoomTypeId } from '../rooms/roomTypes'
import { MINUTES_PER_DAY } from '../time/calendar'
import { pitchCapacity } from '../buildings/stands'
import type { StaffRole } from '../economy/staff'
import { pitchCondition } from '../economy/upkeep'
import { mainPitch } from './match'
import { clubChangingRooms } from './changingRooms'

export type Objective =
  /** Salas completas de un tipo (por defecto, una). */
  | { readonly kind: 'room'; readonly roomType: RoomTypeId; readonly count?: number }
  /** Personas contratadas en un puesto. */
  | { readonly kind: 'staff'; readonly role: StaffRole; readonly min: number }
  | { readonly kind: 'members'; readonly min: number }
  | { readonly kind: 'fans'; readonly min: number }
  | { readonly kind: 'fame'; readonly min: number }
  /** Aforo del campo principal (de pie + gradas). */
  | { readonly kind: 'capacity'; readonly min: number }
  /** Estado del campo principal ≥ `min` durante `days` días seguidos. */
  | { readonly kind: 'pitchCondition'; readonly min: number; readonly days: number }
  /** Victorias desde que se aceptó. */
  | { readonly kind: 'wins'; readonly count: number }
  /** Partidos en casa sin gente fuera desde que se aceptó. */
  | { readonly kind: 'fullHouse'; readonly count: number }
  /** Alumnos en la escuela de fútbol. */
  | { readonly kind: 'students'; readonly min: number }
  /** Banquillos del campo principal de este nivel (índice) o más. */
  | { readonly kind: 'benches'; readonly tier: number }
  /** Calidad (0-10) del vestuario local. */
  | { readonly kind: 'changingRoomQuality'; readonly min: number }

/** Seguimiento de los objetivos de un contrato (subvención o patrocinio). */
export interface ObjectivesProgress {
  /** Cuándo se aceptó (los partidos se cuentan desde aquí). */
  readonly acceptedAt: number
  /** ¿Cumplido? (uno por objetivo; una vez cumplido, se queda). */
  readonly done: boolean[]
  /** Objetivos que piden mantener algo: desde cuándo se mantiene (o null). */
  readonly since: (number | null)[]
}

/** Avance de un objetivo: cuánto hay y cuánto hace falta. */
export interface ObjectiveStatus {
  readonly current: number
  readonly target: number
}

/** Seguimiento vacío para unos objetivos recién aceptados. */
export function startProgress(objectives: readonly Objective[], now: number): ObjectivesProgress {
  return {
    acceptedAt: now,
    done: objectives.map(() => false),
    since: objectives.map(() => null),
  }
}

/** Salas completas de un tipo. */
function completeRooms(state: MapState, content: SimContent, type: RoomTypeId): number {
  let count = 0
  for (const room of Object.values(state.rooms)) {
    if (room.type === type && evaluateRoom(state, content, room.id)?.ok) count++
  }
  return count
}

/** Aforo del campo principal: gente de pie junto a la valla más sus gradas. */
export function stadiumCapacity(state: MapState, content: SimContent): number {
  const main = mainPitch(state, content)
  return content.match.attendance.standing + (main ? pitchCapacity(state, content, main.id) : 0)
}

/** Estado del campo principal (0 si no hay). */
function mainPitchCondition(state: MapState, content: SimContent): number {
  const main = mainPitch(state, content)
  const def = main && content.buildings[main.type]
  return main && def ? pitchCondition(content, def, main) : 0
}

/** Cómo va un objetivo ahora mismo. */
export function objectiveStatus(
  state: MapState,
  content: SimContent,
  objective: Objective,
  progress: ObjectivesProgress,
  index: number,
): ObjectiveStatus {
  const club = state.club
  const matchesSince = () => club.matches.filter((m) => m.at >= progress.acceptedAt)
  switch (objective.kind) {
    case 'room':
      return {
        current: completeRooms(state, content, objective.roomType),
        target: objective.count ?? 1,
      }
    case 'staff':
      return { current: club.staff[objective.role] ?? 0, target: objective.min }
    case 'members':
      return { current: club.members, target: objective.min }
    case 'fans':
      return { current: club.fans, target: objective.min }
    case 'fame':
      return { current: club.fame, target: objective.min }
    case 'capacity':
      return { current: stadiumCapacity(state, content), target: objective.min }
    case 'pitchCondition': {
      const since = progress.since[index] ?? null
      const days = since === null ? 0 : Math.floor((state.clock.time - since) / MINUTES_PER_DAY)
      return { current: days, target: objective.days }
    }
    case 'wins':
      return {
        current: matchesSince().filter((m) => m.outcome === 'win').length,
        target: objective.count,
      }
    case 'fullHouse':
      return {
        current: matchesSince().filter((m) => m.attendance && m.attendance.leftOut === 0).length,
        target: objective.count,
      }
    case 'students':
      return { current: club.students, target: objective.min }
    case 'benches': {
      const main = mainPitch(state, content)
      const tier = main?.benches
      return { current: tier === undefined ? 0 : tier + 1, target: objective.tier + 1 }
    }
    case 'changingRoomQuality':
      return { current: clubChangingRooms(state, content).home.quality, target: objective.min }
  }
}

/**
 * Comprueba los objetivos de un contrato y tacha los que se cumplan. Devuelve
 * el seguimiento nuevo (o el mismo si nada cambió) para guardarlo.
 */
export function checkObjectives(
  state: MapState,
  content: SimContent,
  objectives: readonly Objective[],
  progress: ObjectivesProgress,
): ObjectivesProgress {
  let changed = false
  const done = [...progress.done]
  const since = [...progress.since]
  objectives.forEach((objective, i) => {
    if (done[i]) return
    if (objective.kind === 'pitchCondition') {
      const holding = mainPitchCondition(state, content) >= objective.min
      const from = holding ? (since[i] ?? state.clock.time) : null
      if (from !== since[i]) {
        since[i] = from
        changed = true
      }
    }
    const status = objectiveStatus(state, content, objective, { ...progress, since }, i)
    if (status.current >= status.target) {
      done[i] = true
      changed = true
    }
  })
  return changed ? { ...progress, done, since } : progress
}

/** ¿Están cumplidos todos? */
export function allDone(progress: ObjectivesProgress): boolean {
  return progress.done.every(Boolean)
}
