/**
 * Subvenciones del ayuntamiento con objetivos, como las de Prison Architect
 * (Fase 2, Bloque F; idea de Raul en docs/IDEAS.md).
 *
 * Una lista fija y encadenada (cumplir una abre otras). Se aceptan hasta un
 * máximo a la vez: al aceptar se cobra un adelanto y, al cumplir todos los
 * objetivos, el resto y algo de fama. Cancelar devuelve el adelanto con un
 * recargo. Sirven de tutorial encubierto: dicen qué construir.
 */
import type { SimContent } from '../content'
import type { MapState } from '../map/map'
import { record, type LedgerEntry } from '../economy/ledger'
import { addFame } from './fans'
import {
  allDone,
  checkObjectives,
  startProgress,
  type Objective,
  type ObjectivesProgress,
} from './objectives'

export interface GrantDef {
  readonly id: string
  readonly name: string
  /** Quién la da (el ayuntamiento; más adelante, la federación). */
  readonly from: string
  /** Una frase de quien la ofrece. */
  readonly pitch: string
  /** Se cobra al aceptar. */
  readonly advance: number
  /** Se cobra al cumplir todos los objetivos. */
  readonly bonus: number
  /** Fama al cumplirla. */
  readonly fame: number
  readonly objectives: readonly Objective[]
  /** Subvenciones que hay que haber cumplido antes. */
  readonly requires?: readonly string[]
  /** No se ofrece en la lista (p. ej. el rescate de la quiebra, Bloque G). */
  readonly hidden?: boolean
}

export interface GrantsContent {
  /** Activas a la vez. */
  readonly maxActive: number
  /** Al cancelar se devuelve el adelanto × esto. */
  readonly cancelRate: number
  readonly list: readonly GrantDef[]
}

/** Subvención aceptada y su seguimiento. */
export interface ActiveGrant extends ObjectivesProgress {
  readonly id: string
}

export interface GrantsState {
  readonly active: ActiveGrant[]
  /** Ids de las cumplidas, en orden. */
  readonly completed: string[]
}

export type GrantError = 'unknownGrant' | 'grantNotAvailable' | 'tooManyGrants' | 'grantNotActive'

/** Definición de una subvención por id. */
export function grantDef(content: SimContent, id: string): GrantDef | undefined {
  return content.grants.list.find((grant) => grant.id === id)
}

/** Subvenciones que se pueden aceptar ahora (requisitos cumplidos, ni activas ni cumplidas). */
export function availableGrants(state: MapState, content: SimContent): GrantDef[] {
  const { active, completed } = state.club.grants
  return content.grants.list.filter(
    (grant) =>
      !grant.hidden &&
      !completed.includes(grant.id) &&
      !active.some((a) => a.id === grant.id) &&
      (grant.requires ?? []).every((id) => completed.includes(id)),
  )
}

/** ¿Se puede aceptar? */
export function validateAcceptGrant(
  state: MapState,
  content: SimContent,
  id: string,
): GrantError | null {
  if (!grantDef(content, id)) return 'unknownGrant'
  if (!availableGrants(state, content).some((grant) => grant.id === id)) return 'grantNotAvailable'
  if (state.club.grants.active.length >= content.grants.maxActive) return 'tooManyGrants'
  return null
}

/** Acepta (ya validada; el adelanto lo cobra la partida con el precio del comando). */
export function applyAcceptGrant(state: MapState, content: SimContent, id: string): ActiveGrant {
  const def = grantDef(content, id)
  const active: ActiveGrant = { id, ...startProgress(def?.objectives ?? [], state.clock.time) }
  state.club.grants.active.push(active)
  return active
}

/** Cancela una activa (la devolución la cobra la partida con el precio del comando). */
export function applyCancelGrant(state: MapState, id: string): boolean {
  const list = state.club.grants.active
  const index = list.findIndex((grant) => grant.id === id)
  if (index < 0) return false
  list.splice(index, 1)
  return true
}

export interface GrantsUpdate {
  /** Subvenciones cumplidas ahora. */
  readonly completed: readonly GrantDef[]
  /** Cobros del bonus. */
  readonly entries: readonly LedgerEntry[]
  /** ¿Se tachó algún objetivo (o se cumplió alguna)? */
  readonly changed: boolean
}

/**
 * Comprueba los objetivos de las subvenciones activas: tacha los cumplidos y,
 * si una los tiene todos, cobra el bonus, suma la fama y la da por cumplida.
 */
export function updateGrants(state: MapState, content: SimContent): GrantsUpdate {
  const grants = state.club.grants
  const completed: GrantDef[] = []
  const entries: LedgerEntry[] = []
  let changed = false
  for (let i = grants.active.length - 1; i >= 0; i--) {
    const active = grants.active[i]
    const def = active && grantDef(content, active.id)
    if (!active || !def) continue
    const next = checkObjectives(state, content, def.objectives, active)
    if (next === active) continue
    changed = true
    if (!allDone(next)) {
      grants.active[i] = { ...next, id: active.id }
      continue
    }
    grants.active.splice(i, 1)
    grants.completed.push(def.id)
    completed.push(def)
    const entry = record(state, 'grants', def.bonus)
    if (entry) entries.push(entry)
    addFame(state, def.fame)
  }
  return { completed, entries, changed }
}
