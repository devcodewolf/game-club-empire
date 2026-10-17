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
  /** Se suscribe a los eventos; devuelve la función para darse de baja. */
  subscribe(listener: GameListener): () => void
}

export interface GameOptions {
  /** Semilla del PRNG de la partida (misma semilla = misma partida). */
  readonly seed?: number
}

export function createGame(
  config: MapConfig,
  content: SimContent,
  { seed = 1 }: GameOptions = {},
): Game {
  const state = createMapState(config)
  state.rng = seedRng(seed)
  state.clock.time = fromDate(content.time.start)
  rollWeather(state, content.time)
  const listeners = new Set<GameListener>()
  const emit = (event: GameEvent): void => {
    for (const listener of listeners) listener(event)
  }

  return {
    state,
    content,
    dispatch(command) {
      const result = executeCommand(state, command, content)
      if (!result.ok) return result

      emit(result.event)
      return result
    },
    advance(minutes, options) {
      const result = advanceClock(state, content.time, minutes, options)
      for (const occurrence of result.occurrences) {
        if (occurrence.kind === 'weather') {
          emit({ type: 'weatherChanged', weather: occurrence.weather, at: occurrence.at })
        } else {
          emit({ type: 'timeEvent', id: occurrence.id, at: occurrence.at, stops: occurrence.stops })
        }
      }
      return result
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
