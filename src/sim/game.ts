/**
 * Partida: une el estado, el catálogo y los suscriptores.
 *
 * `dispatch` es la única puerta de entrada de los comandos del jugador. Si el
 * comando tiene éxito, avisa a los suscriptores con el evento resultante para
 * que el render y la UI reaccionen (crear un marcador, animar, sonar…) sin
 * tener que comparar el estado entero cada frame.
 */
import type { BuildingCatalog } from './buildings'
import { executeCommand, type Command, type CommandResult, type GameEvent } from './commands'
import { createMapState, type MapConfig, type MapState } from './map'

export type GameListener = (event: GameEvent) => void

export interface Game {
  /** Estado de solo lectura para quien no sea la simulación. */
  readonly state: Readonly<MapState>
  readonly catalog: BuildingCatalog
  dispatch(command: Command): CommandResult
  /** Se suscribe a los eventos; devuelve la función para darse de baja. */
  subscribe(listener: GameListener): () => void
}

export function createGame(config: MapConfig, catalog: BuildingCatalog): Game {
  const state = createMapState(config)
  const listeners = new Set<GameListener>()

  return {
    state,
    catalog,
    dispatch(command) {
      const result = executeCommand(state, command, catalog)
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
