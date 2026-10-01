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
import { createMapState, type MapConfig, type MapState } from './map'

export type GameListener = (event: GameEvent) => void

export interface Game {
  /** Estado de solo lectura para quien no sea la simulación. */
  readonly state: Readonly<MapState>
  readonly content: SimContent
  dispatch(command: Command): CommandResult
  /** Se suscribe a los eventos; devuelve la función para darse de baja. */
  subscribe(listener: GameListener): () => void
}

export function createGame(config: MapConfig, content: SimContent): Game {
  const state = createMapState(config)
  const listeners = new Set<GameListener>()

  return {
    state,
    content,
    dispatch(command) {
      const result = executeCommand(state, command, content)
      if (!result.ok) return result

      for (const listener of listeners) listener(result.event)
      return result
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
