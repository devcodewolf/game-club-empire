/**
 * Patrocinios locales (Fase 2, Bloque F; docs/prompts/FASE2-ESPECIFICACION.md §4.7).
 *
 * Los negocios inventados del pueblo ofrecen tratos con objetivos y plazo:
 *  - Hay como mucho `maxOffers` ofertas a la vista y `maxActive` en marcha.
 *    Al empezar la partida hay ofertas; luego, cada `offerEveryWeeks` lunes
 *    aparece una nueva si hay hueco. Una oferta sin aceptar caduca.
 *  - Al aceptar se cobra el adelanto; al cumplir antes del plazo, el bonus y
 *    fama. Si vence el plazo sin cumplir, no hay que devolver nada, pero se
 *    pierde fama. Cancelar devuelve el adelanto con un recargo.
 *
 * Cada oferta sale de una plantilla de objetivos (como datos), con el dinero
 * según su dificultad y un poco de azar del PRNG de la partida. Los objetivos
 * "relativos" se fijan al ofrecerse (p. ej. 15 socios más de los que hay).
 */
import type { SimContent } from '../content'
import type { MapState } from '../map/map'
import { record, type LedgerEntry } from '../economy/ledger'
import { weekNumber } from '../economy/recurring'
import { MINUTES_PER_DAY } from '../time/calendar'
import { randomInt } from '../time/rng'
import { addFame } from './fans'
import {
  allDone,
  checkObjectives,
  objectiveStatus,
  startProgress,
  type Objective,
  type ObjectivesProgress,
} from './objectives'

const WEEK = 7 * MINUTES_PER_DAY

/** Logotipo dibujado de un negocio (lo pinta la interfaz). */
export interface BusinessLogo {
  readonly shape: 'bread' | 'wrench' | 'bottle' | 'hammer' | 'apple' | 'cup' | 'fish' | 'scissors'
  /** Colores del logotipo (0xRRGGBB). */
  readonly color: number
  readonly accent: number
}

/** Negocio inventado del pueblo. */
export interface Business {
  readonly id: string
  readonly name: string
  readonly logo: BusinessLogo
}

/** Objetivo de una plantilla: con `relative`, el mínimo se suma a lo que haya al ofrecerse. */
export interface SponsorObjectiveTemplate {
  readonly objective: Objective
  readonly relative?: boolean
}

/** Plantilla de trato. */
export interface SponsorTemplate {
  readonly id: string
  /** 1 fácil, 2 normal, 3 difícil: decide el dinero. */
  readonly difficulty: 1 | 2 | 3
  /** Plazo en semanas: mínimo y máximo. */
  readonly weeks: readonly [number, number]
  readonly objectives: readonly SponsorObjectiveTemplate[]
  /** Divisiones en las que puede salir (sin dato, en todas). */
  readonly divisions?: readonly string[]
}

export interface SponsorsContent {
  readonly maxActive: number
  readonly maxOffers: number
  /** Cada cuántos lunes aparece una oferta nueva (si hay hueco). */
  readonly offerEveryWeeks: number
  /** Semanas que dura una oferta sin aceptar. */
  readonly offerLifetimeWeeks: number
  /** Al cancelar se devuelve el adelanto × esto. */
  readonly cancelRate: number
  /** Adelanto y bonus por dificultad (índice = dificultad − 1). */
  readonly advance: readonly number[]
  readonly bonus: readonly number[]
  /** Variación al azar del dinero (0,1 = ±10 %), redondeado a 50 €. */
  readonly moneySpread: number
  readonly fame: { readonly completed: number; readonly failed: number }
  readonly businesses: readonly Business[]
  readonly templates: readonly SponsorTemplate[]
}

/** Trato ofrecido por un negocio. */
export interface SponsorOffer {
  readonly id: string
  readonly business: string
  readonly template: string
  readonly objectives: readonly Objective[]
  readonly advance: number
  readonly bonus: number
  readonly weeks: number
  readonly expiresAt: number
}

/** Trato aceptado y su seguimiento. */
export interface ActiveSponsor extends ObjectivesProgress {
  readonly id: string
  readonly business: string
  readonly template: string
  readonly objectives: readonly Objective[]
  readonly advance: number
  readonly bonus: number
  /** Hasta cuándo hay para cumplirlo. */
  readonly deadline: number
}

export type SponsorOutcome = 'completed' | 'failed' | 'cancelled'

export interface SponsorsState {
  readonly offers: SponsorOffer[]
  readonly active: ActiveSponsor[]
  /** Tratos terminados, del más antiguo al más reciente. */
  readonly history: { id: string; business: string; outcome: SponsorOutcome; at: number }[]
  /** Siguiente número de trato (ids deterministas). */
  nextId: number
}

export type SponsorError = 'unknownOffer' | 'tooManySponsors' | 'sponsorNotActive'

/** Negocio por id. */
export function businessOf(content: SimContent, id: string): Business | undefined {
  return content.sponsors.businesses.find((business) => business.id === id)
}

/** Dinero con un poco de azar, redondeado a 50 €. */
function vary(state: MapState, content: SimContent, base: number): number {
  const spread = Math.round(base * content.sponsors.moneySpread)
  return Math.round((base + randomInt(state, -spread, spread)) / 50) * 50
}

/** Fija los objetivos relativos de una plantilla con lo que hay ahora. */
function resolveObjectives(state: MapState, content: SimContent, template: SponsorTemplate) {
  const blank = startProgress([], state.clock.time)
  return template.objectives.map(({ objective, relative }) => {
    if (!relative || !('min' in objective)) return objective
    const now = objectiveStatus(state, content, objective, blank, 0).current
    return { ...objective, min: Math.round(now + objective.min) }
  })
}

/** ¿Ya se cumplen todos ahora mismo? (no tiene gracia ofrecer algo hecho) */
function alreadyMet(state: MapState, content: SimContent, objectives: readonly Objective[]) {
  const progress = checkObjectives(state, content, objectives, startProgress(objectives, 0))
  return objectives.length > 0 && allDone(progress)
}

/**
 * Crea una oferta nueva al azar entre las plantillas posibles (de la división,
 * no repetidas en ofertas ni tratos en marcha, ni ya cumplidas) y un negocio
 * que no tenga ya otra oferta o trato. Devuelve null si no hay ninguna.
 */
export function makeOffer(state: MapState, content: SimContent): SponsorOffer | null {
  const rules = content.sponsors
  const sponsors = state.club.sponsors
  const busyTemplates = new Set([
    ...sponsors.offers.map((o) => o.template),
    ...sponsors.active.map((a) => a.template),
  ])
  const busyBusinesses = new Set([
    ...sponsors.offers.map((o) => o.business),
    ...sponsors.active.map((a) => a.business),
  ])
  const candidates = rules.templates
    .filter((t) => !busyTemplates.has(t.id))
    .filter((t) => !t.divisions || t.divisions.includes(state.club.division))
    .map((t) => ({ template: t, objectives: resolveObjectives(state, content, t) }))
    .filter((c) => !alreadyMet(state, content, c.objectives))
  const businesses = rules.businesses.filter((b) => !busyBusinesses.has(b.id))
  if (candidates.length === 0 || businesses.length === 0) return null

  const pick = candidates[randomInt(state, 0, candidates.length - 1)]!
  const business = businesses[randomInt(state, 0, businesses.length - 1)]!
  const level = pick.template.difficulty - 1
  const offer: SponsorOffer = {
    id: `s${sponsors.nextId}`,
    business: business.id,
    template: pick.template.id,
    objectives: pick.objectives,
    advance: vary(state, content, rules.advance[level] ?? 0),
    bonus: vary(state, content, rules.bonus[level] ?? 0),
    weeks: randomInt(state, pick.template.weeks[0], pick.template.weeks[1]),
    expiresAt: state.clock.time + rules.offerLifetimeWeeks * WEEK,
  }
  sponsors.nextId++
  sponsors.offers.push(offer)
  return offer
}

/** Rellena las ofertas hasta el máximo (al empezar la partida). */
export function fillOffers(state: MapState, content: SimContent): SponsorOffer[] {
  const made: SponsorOffer[] = []
  while (state.club.sponsors.offers.length < content.sponsors.maxOffers) {
    const offer = makeOffer(state, content)
    if (!offer) break
    made.push(offer)
  }
  return made
}

/**
 * Lunes: caducan las ofertas viejas y, cada `offerEveryWeeks` semanas, llega
 * una nueva si hay hueco. Devuelve si cambió la lista.
 */
export function weeklySponsors(state: MapState, content: SimContent): boolean {
  const sponsors = state.club.sponsors
  const before = sponsors.offers.length
  const now = state.clock.time
  for (let i = sponsors.offers.length - 1; i >= 0; i--) {
    if ((sponsors.offers[i]?.expiresAt ?? Infinity) <= now) sponsors.offers.splice(i, 1)
  }
  let changed = sponsors.offers.length !== before
  const week = weekNumber(state, content)
  const due = week % content.sponsors.offerEveryWeeks === 0
  if (due && sponsors.offers.length < content.sponsors.maxOffers && makeOffer(state, content)) {
    changed = true
  }
  return changed
}

/** ¿Se puede aceptar esta oferta? */
export function validateAcceptSponsor(
  state: MapState,
  content: SimContent,
  offerId: string,
): SponsorError | null {
  const sponsors = state.club.sponsors
  if (!sponsors.offers.some((offer) => offer.id === offerId)) return 'unknownOffer'
  if (sponsors.active.length >= content.sponsors.maxActive) return 'tooManySponsors'
  return null
}

/** Acepta una oferta (ya validada; el adelanto lo cobra la partida con el precio del comando). */
export function applyAcceptSponsor(state: MapState, offerId: string): ActiveSponsor | null {
  const sponsors = state.club.sponsors
  const index = sponsors.offers.findIndex((offer) => offer.id === offerId)
  const offer = sponsors.offers[index]
  if (!offer) return null
  sponsors.offers.splice(index, 1)
  const active: ActiveSponsor = {
    id: offer.id,
    business: offer.business,
    template: offer.template,
    objectives: offer.objectives,
    advance: offer.advance,
    bonus: offer.bonus,
    deadline: state.clock.time + offer.weeks * WEEK,
    ...startProgress(offer.objectives, state.clock.time),
  }
  sponsors.active.push(active)
  return active
}

/** Cancela un trato en marcha (la devolución la cobra la partida con el precio del comando). */
export function applyCancelSponsor(state: MapState, sponsorId: string): boolean {
  const sponsors = state.club.sponsors
  const index = sponsors.active.findIndex((sponsor) => sponsor.id === sponsorId)
  const sponsor = sponsors.active[index]
  if (!sponsor) return false
  sponsors.active.splice(index, 1)
  sponsors.history.push({
    id: sponsor.id,
    business: sponsor.business,
    outcome: 'cancelled',
    at: state.clock.time,
  })
  return true
}

export interface SponsorsUpdate {
  readonly completed: readonly ActiveSponsor[]
  readonly failed: readonly ActiveSponsor[]
  readonly entries: readonly LedgerEntry[]
  /** ¿Se tachó algún objetivo, se cumplió o venció algún trato? */
  readonly changed: boolean
}

/**
 * Comprueba los tratos en marcha: tacha los objetivos cumplidos; si están
 * todos, cobra el bonus y suma fama; si vence el plazo sin cumplir, resta fama.
 */
export function updateSponsors(state: MapState, content: SimContent): SponsorsUpdate {
  const sponsors = state.club.sponsors
  const rules = content.sponsors
  const completed: ActiveSponsor[] = []
  const failed: ActiveSponsor[] = []
  const entries: LedgerEntry[] = []
  let changed = false
  for (let i = sponsors.active.length - 1; i >= 0; i--) {
    const sponsor = sponsors.active[i]
    if (!sponsor) continue
    const next = { ...sponsor, ...checkObjectives(state, content, sponsor.objectives, sponsor) }
    const progressed = next.done.some((done, j) => done !== sponsor.done[j])
    const sinceMoved = next.since.some((since, j) => since !== sponsor.since[j])
    if (allDone(next)) {
      sponsors.active.splice(i, 1)
      sponsors.history.push({
        id: sponsor.id,
        business: sponsor.business,
        outcome: 'completed',
        at: state.clock.time,
      })
      completed.push(next)
      const entry = record(state, 'sponsors', sponsor.bonus)
      if (entry) entries.push(entry)
      addFame(state, rules.fame.completed)
      changed = true
    } else if (state.clock.time >= sponsor.deadline) {
      sponsors.active.splice(i, 1)
      sponsors.history.push({
        id: sponsor.id,
        business: sponsor.business,
        outcome: 'failed',
        at: state.clock.time,
      })
      failed.push(next)
      addFame(state, rules.fame.failed)
      changed = true
    } else if (progressed || sinceMoved) {
      sponsors.active[i] = next
      changed = true
    }
  }
  return { completed, failed, entries, changed }
}
