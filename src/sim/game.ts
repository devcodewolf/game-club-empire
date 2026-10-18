/**
 * Partida: une el estado, el contenido y los suscriptores.
 *
 * `dispatch` es la única puerta de entrada de los comandos del jugador. Si el
 * comando tiene éxito, avisa a los suscriptores con el evento resultante para
 * que el render y la UI reaccionen (crear un marcador, animar, sonar…) sin
 * tener que comparar el estado entero cada frame.
 */
import { executeCommand, type Command, type CommandResult, type GameEvent } from './commands'
import type { SimContent } from './content'
import { createMapState, type MapConfig, type MapState } from './map/map'
import { fromDate } from './time/calendar'
import { advanceClock, rollWeather, type AdvanceResult, type ClockOccurrence } from './time/clock'
import { seedRng } from './time/rng'
import { commandPrice } from './economy/pricing'
import { applyEconomyEvent } from './economy/recurring'
import { record, type LedgerConcept } from './economy/ledger'
import { updateGrants } from './club/grants'
import { fillOffers, updateSponsors, weeklySponsors } from './club/sponsors'
import { weeklyBillboards } from './club/billboards'
import { captureMap, diffMap, restoreMap, type MapSnapshot } from './map/snapshot'
import { announceMatch, finishMatch, startMatch } from './club/match'
import { awardFirstRooms, weeklyClubUpdate } from './club/fans'

export type GameListener = (event: GameEvent) => void

/** Solo las obras se pueden deshacer; reparaciones, subvenciones… son gastos, no obras. */
const UNDOABLE: ReadonlySet<LedgerConcept> = new Set(['construction', 'upgrade', 'move'])

/** Ids de los eventos del calendario del partido (los programa `content.time.events`). */
export const MATCH_EVENT = {
  preview: 'matchPreview',
  kickoff: 'matchKickoff',
  final: 'matchFinal',
} as const

export interface Game {
  /** Estado de solo lectura para quien no sea la simulación. */
  readonly state: Readonly<MapState>
  readonly content: SimContent
  dispatch(command: Command): CommandResult
  /**
   * Avanza el tiempo `minutes` minutos de juego (1 tick = 1 minuto). Con
   * `stopOnEvent`, se detiene tras el primer evento que detenga el "próximo
   * evento". Avisa a los suscriptores de lo que ocurra por el camino.
   */
  advance(minutes: number, options?: { readonly stopOnEvent?: boolean }): AdvanceResult
  /** ¿Se puede deshacer la última obra? (no ha habido otra obra después) */
  canUndo(): boolean
  /** Se suscribe a los eventos; devuelve la función para darse de baja. */
  subscribe(listener: GameListener): () => void
}

export interface GameOptions {
  /** Semilla del PRNG de la partida (misma semilla = misma partida). */
  readonly seed?: number
  /** Dinero inicial (por defecto, el de `content.economy`). La galería usa uno enorme. */
  readonly money?: number
  /** Comandos que preparan el inicio (campo, caseta…). Se aplican gratis antes de empezar. */
  readonly scenario?: readonly Command[]
}

/** Obra que se puede deshacer: cómo estaba el mapa antes y lo que se pagó. */
interface UndoSlot {
  readonly snapshot: MapSnapshot
  readonly cost: number
  /** Número de obras hechas cuando se guardó: solo se deshace si no ha habido otra después. */
  readonly revision: number
}

export function createGame(
  config: MapConfig,
  content: SimContent,
  { seed = 1, money, scenario = [] }: GameOptions = {},
): Game {
  const state = createMapState(config)
  state.rng = seedRng(seed)
  state.clock.time = fromDate(content.time.start)
  state.money = money ?? content.economy.startMoney
  state.club.division = content.economy.start.division
  state.club.members = content.economy.start.members
  state.club.fame = content.match.fame.start
  state.club.fans = content.match.fans.start
  state.club.satisfaction = content.match.satisfaction.start
  rollWeather(state, content.time)
  // El escenario de inicio se aplica gratis y sin avisar a nadie (aún no hay suscriptores)
  for (const command of scenario) executeCommand(state, command, content)
  // Lo que ya venga completo en el escenario no cuenta como estreno de sala (ni da fama)
  awardFirstRooms(state, content)
  state.club.fame = content.match.fame.start
  // "Dos patrocinios ofrecidos" en el tablón desde el primer minuto
  fillOffers(state, content)

  const listeners = new Set<GameListener>()
  const emit = (event: GameEvent): void => {
    for (const listener of listeners) listener(event)
  }
  /** Comprueba los objetivos de subvenciones y patrocinios y avisa de lo que cambie. */
  const checkContracts = (): void => {
    const grants = updateGrants(state, content)
    if (grants.changed) {
      for (const entry of grants.entries) emit({ type: 'transaction', entry })
      for (const grant of grants.completed) emit({ type: 'grantCompleted', grantId: grant.id })
      if (grants.completed.length) emit({ type: 'clubChanged' })
      emit({ type: 'grantsProgress' })
    }
    const sponsors = updateSponsors(state, content)
    if (sponsors.changed) {
      for (const entry of sponsors.entries) emit({ type: 'transaction', entry })
      for (const sponsor of sponsors.completed) emit({ type: 'sponsorCompleted', sponsor })
      for (const sponsor of sponsors.failed) emit({ type: 'sponsorFailed', sponsor })
      if (sponsors.completed.length || sponsors.failed.length) emit({ type: 'clubChanged' })
      emit({ type: 'sponsorsProgress' })
    }
  }

  /**
   * Efecto de cada suceso del reloj en su instante: el clima, el partido y los
   * cobros y pagos del calendario. Devuelve false si el evento no tuvo efecto
   * (un domingo sin partido), para que no detenga el "próximo evento".
   */
  const handleOccurrence = (occurrence: ClockOccurrence): boolean => {
    if (occurrence.kind === 'weather') {
      emit({ type: 'weatherChanged', weather: occurrence.weather, at: occurrence.at })
      return true
    }
    if (occurrence.id === MATCH_EVENT.preview) {
      const preview = announceMatch(state, content)
      if (!preview) return false
      emit({
        type: 'timeEvent',
        id: occurrence.id,
        at: occurrence.at,
        stops: occurrence.stops,
      })
      emit({ type: 'matchAnnounced', preview })
      return true
    }
    if (occurrence.id === MATCH_EVENT.kickoff) {
      const kickoff = startMatch(state, content)
      if (!kickoff) return false
      emit({
        type: 'timeEvent',
        id: occurrence.id,
        at: occurrence.at,
        stops: occurrence.stops,
      })
      for (const entry of kickoff.entries) emit({ type: 'transaction', entry })
      if (kickoff.pitchesChanged) emit({ type: 'pitchesChanged' })
      emit({ type: 'matchStarted', match: kickoff.match })
      return true
    }
    if (occurrence.id === MATCH_EVENT.final) {
      const match = finishMatch(state)
      if (!match) return false
      emit({
        type: 'timeEvent',
        id: occurrence.id,
        at: occurrence.at,
        stops: occurrence.stops,
      })
      emit({ type: 'matchPlayed', match })
      emit({ type: 'clubChanged' })
      return true
    }
    emit({ type: 'timeEvent', id: occurrence.id, at: occurrence.at, stops: occurrence.stops })
    const outcome = applyEconomyEvent(state, content, occurrence.id)
    for (const entry of outcome.entries) emit({ type: 'transaction', entry })
    if (outcome.broken) emit({ type: 'buildingsBroken', buildings: outcome.broken })
    if (outcome.pitchesChanged) emit({ type: 'pitchesChanged' })
    if (outcome.report) {
      if (weeklyClubUpdate(state, content)) emit({ type: 'clubChanged' })
      if (weeklySponsors(state, content)) emit({ type: 'sponsorsProgress' })
      const boards = weeklyBillboards(state, content)
      for (const entry of boards.entries) emit({ type: 'transaction', entry })
      if (boards.changed.length) emit({ type: 'billboardsChanged', buildings: boards.changed })
      emit({ type: 'weeklyReport', report: outcome.report })
    }
    return true
  }
  /** Obras con éxito hechas hasta ahora (para saber si la última se puede deshacer). */
  let revision = 0
  let undoSlot: UndoSlot | null = null

  const undo = (): CommandResult => {
    if (!undoSlot || undoSlot.revision !== revision) return { ok: false, reason: 'nothingToUndo' }
    const { snapshot, cost } = undoSlot
    undoSlot = null
    const diff = diffMap(state, snapshot)
    restoreMap(state, snapshot)
    revision++
    const event: GameEvent = { type: 'restored', ...diff }
    emit(event)
    const entry = record(state, 'undo', cost, diff.rect ?? undefined)
    if (entry) emit({ type: 'transaction', entry })
    return { ok: true, event }
  }

  return {
    state,
    content,
    dispatch(command) {
      if (command.type === 'undo') return undo()
      const price = commandPrice(state, content, command)
      if (price.cost > 0 && price.cost > state.money) return { ok: false, reason: 'notEnoughMoney' }
      // Solo las obras que cuestan algo (construir, mejorar, mover) se pueden deshacer;
      // las reparaciones no: son un gasto, no una obra que se pueda retirar
      const undoable = price.cost > 0 && UNDOABLE.has(price.concept)
      const snapshot = undoable ? captureMap(state) : null

      const result = executeCommand(state, command, content)
      if (!result.ok) return result
      revision++
      undoSlot = snapshot ? { snapshot, cost: price.cost, revision } : null

      emit(result.event)
      const firstRooms = awardFirstRooms(state, content)
      if (firstRooms.length) {
        emit({ type: 'firstRooms', roomTypes: firstRooms })
        emit({ type: 'clubChanged' })
      }
      for (const [amount, concept] of [
        [-price.cost, price.concept],
        [price.refund, price.refundConcept ?? 'demolish'],
      ] as const) {
        const entry = record(state, concept, amount, price.rect)
        if (entry) emit({ type: 'transaction', entry })
      }
      checkContracts()
      return result
    },
    advance(minutes, options) {
      return advanceClock(state, content.time, minutes, {
        ...options,
        // Cada suceso tiene efecto en su instante; después se miran los objetivos de las subvenciones
        onOccurrence(occurrence) {
          const happened = handleOccurrence(occurrence)
          if (happened !== false) checkContracts()
          return happened
        },
      })
    },
    canUndo() {
      return undoSlot !== null && undoSlot.revision === revision
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
