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
import { advanceClock, rollWeather, type AdvanceResult } from './time/clock'
import { seedRng } from './time/rng'
import { commandPrice } from './economy/pricing'
import { applyEconomyEvent } from './economy/recurring'
import { record } from './economy/ledger'
import { captureMap, diffMap, restoreMap, type MapSnapshot } from './map/snapshot'

export type GameListener = (event: GameEvent) => void

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
  rollWeather(state, content.time)
  // El escenario de inicio se aplica gratis y sin avisar a nadie (aún no hay suscriptores)
  for (const command of scenario) executeCommand(state, command, content)

  const listeners = new Set<GameListener>()
  const emit = (event: GameEvent): void => {
    for (const listener of listeners) listener(event)
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
      const undoable = price.cost > 0 && price.concept !== 'repairs'
      const snapshot = undoable ? captureMap(state) : null

      const result = executeCommand(state, command, content)
      if (!result.ok) return result
      revision++
      undoSlot = snapshot ? { snapshot, cost: price.cost, revision } : null

      emit(result.event)
      for (const [amount, concept] of [
        [-price.cost, price.concept],
        [price.refund, 'demolish'],
      ] as const) {
        const entry = record(state, concept, amount, price.rect)
        if (entry) emit({ type: 'transaction', entry })
      }
      return result
    },
    advance(minutes, options) {
      return advanceClock(state, content.time, minutes, {
        ...options,
        // Cada suceso tiene efecto en su instante: el clima, y los cobros y pagos del calendario
        onOccurrence(occurrence) {
          if (occurrence.kind === 'weather') {
            emit({ type: 'weatherChanged', weather: occurrence.weather, at: occurrence.at })
            return
          }
          emit({ type: 'timeEvent', id: occurrence.id, at: occurrence.at, stops: occurrence.stops })
          const outcome = applyEconomyEvent(state, content, occurrence.id)
          for (const entry of outcome.entries) emit({ type: 'transaction', entry })
          if (outcome.broken) emit({ type: 'buildingsBroken', buildings: outcome.broken })
          if (outcome.pitchesChanged) emit({ type: 'pitchesChanged' })
          if (outcome.report) emit({ type: 'weeklyReport', report: outcome.report })
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
