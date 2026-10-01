/**
 * Acceso a la partida desde cualquier componente sin pasarla por props.
 * `App.vue` la provee una vez; el resto la inyecta con `useGame()`.
 */
import { inject, provide, type InjectionKey } from 'vue'
import type { Game } from '@/sim/game'

const GAME_KEY: InjectionKey<Game> = Symbol('game')

/** Hace accesible la partida a todos los descendientes. */
export function provideGame(game: Game): void {
  provide(GAME_KEY, game)
}

/** Devuelve la partida provista; falla si nadie la ha provisto. */
export function useGame(): Game {
  const game = inject(GAME_KEY)
  if (!game) throw new Error('useGame: falta provideGame() en un componente ancestro')
  return game
}
