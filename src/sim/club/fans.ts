/**
 * Fama, afición, satisfacción y socios (Fase 2, Bloque E;
 * docs/prompts/FASE2-ESPECIFICACION.md §5).
 *
 *  - Fama (0-100): reputación. Sube con victorias y con la primera sala
 *    completa de cada tipo; cada lunes deriva hacia la base de la división.
 *  - Afición (personas): la gente del pueblo que sigue al club. Crece con los
 *    resultados y con la satisfacción de los partidos en casa, hasta un techo
 *    que da la fama.
 *  - Satisfacción (0-100): cómo vuelve la gente del último partido en casa.
 *  - Socios: cada lunes se acercan a una parte de la afición.
 */
import type { SimContent } from '../content'
import type { MapState } from '../map/map'
import { evaluateRoom } from '../rooms/rooms'
import type { RoomTypeId } from '../rooms/roomTypes'

/** Resultado de un partido visto desde el club. */
export type Outcome = 'win' | 'draw' | 'loss'

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

/** Suma (o resta) fama, limitada a 0-100. Devuelve el cambio real. */
export function addFame(state: MapState, delta: number): number {
  const before = state.club.fame
  state.club.fame = clamp(Math.round((before + delta) * 10) / 10, 0, 100)
  return state.club.fame - before
}

/** Techo de afición según la fama: por encima, ya no crece. */
export function fansCeiling(content: SimContent, fame: number): number {
  const rules = content.match.fans
  return rules.ceilingBase + fame * rules.ceilingPerFame
}

/**
 * Afición tras un partido: el resultado la mueve un %, y en casa además la
 * satisfacción (por encima o por debajo del punto neutro). Los aumentos no
 * pasan del techo; las bajadas siempre se aplican.
 */
export function fansAfterMatch(
  content: SimContent,
  fans: number,
  fame: number,
  outcome: Outcome,
  satisfaction: number | null,
): number {
  const rules = content.match.fans
  let next = fans * (1 + rules.result[outcome])
  if (satisfaction !== null) {
    next *= 1 + (satisfaction - rules.satisfactionPivot) / rules.satisfactionDivisor
  }
  next = Math.round(next)
  if (next <= fans) return Math.max(0, next)
  return Math.max(fans, Math.min(next, fansCeiling(content, fame)))
}

/** Lo que entra en la satisfacción de un partido en casa. */
export interface SatisfactionInput {
  /** Cobertura de limpieza 0-1. */
  readonly cleaning: number
  readonly bar: boolean
  readonly parking: boolean
  readonly coveredStand: boolean
  /** ¿Se quedó gente fuera por falta de aforo? */
  readonly crowdOut: boolean
  readonly raining: boolean
  /** Calidad del vestuario visitante (0 si no hay). */
  readonly visitorQuality: number
}

/** Satisfacción de la afición en un partido en casa (0-100). */
export function matchSatisfaction(content: SimContent, input: SatisfactionInput): number {
  const s = content.match.satisfaction
  let value = s.base - s.cleaning * (1 - input.cleaning)
  if (input.bar) value += s.bar
  if (input.parking) value += s.parking
  if (input.coveredStand) value += s.coveredStand
  if (input.crowdOut) value -= s.crowdOut
  if (input.raining && !input.coveredStand) value -= s.rainUncovered
  if (input.visitorQuality >= s.goodVisitorQuality) value += s.goodVisitorRoom
  return clamp(Math.round(value), 0, 100)
}

/** Lunes: los socios se acercan a su parte de la afición y la fama deriva. Devuelve si cambió algo. */
export function weeklyClubUpdate(state: MapState, content: SimContent): boolean {
  const { members, fame } = content.match
  const club = state.club
  const before = { members: club.members, fame: club.fame }
  club.members = Math.max(
    0,
    club.members + Math.round((club.fans * members.targetShare - club.members) * members.rate),
  )
  const base = fame.divisionBase[club.division] ?? 0
  if (club.fame > base) club.fame = Math.max(base, Math.round((club.fame - fame.drift) * 10) / 10)
  return club.members !== before.members || club.fame !== before.fame
}

/**
 * Primera sala completa de cada tipo: +1 de fama (una vez por tipo). Se
 * llama tras cada obra. Devuelve los tipos que se estrenan.
 */
export function awardFirstRooms(state: MapState, content: SimContent): RoomTypeId[] {
  const done = new Set(state.club.roomsCompleted)
  const fresh: RoomTypeId[] = []
  for (const key of Object.keys(state.rooms)) {
    const room = state.rooms[Number(key)]
    if (!room || done.has(room.type)) continue
    if (!evaluateRoom(state, content, room.id)?.ok) continue
    done.add(room.type)
    fresh.push(room.type)
  }
  for (const type of fresh) {
    state.club.roomsCompleted.push(type)
    addFame(state, content.match.fame.firstRoom)
  }
  return fresh
}
