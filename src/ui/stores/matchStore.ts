/**
 * Partido para la UI: el que se está jugando (de `matchStarted` a
 * `matchPlayed`) y el último resultado pendiente de enseñar. Escucha la
 * partida una sola vez (`listen`, llamado desde App.vue).
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Game } from '@/sim/game'
import type { MatchResult } from '@/sim/club/match'

export const useMatchStore = defineStore('match', () => {
  /** Partido en juego (`null` fuera de los domingos de partido). */
  const current = ref<MatchResult | null>(null)
  /** Resultado recién terminado que aún no se ha enseñado. */
  const pendingResult = ref<MatchResult | null>(null)

  /** Se suscribe a la partida; devuelve la función para darse de baja. */
  function listen(game: Game): () => void {
    return game.subscribe((event) => {
      if (event.type === 'matchStarted') {
        current.value = event.match
      } else if (event.type === 'matchPlayed') {
        current.value = null
        pendingResult.value = event.match
      }
    })
  }

  /** El jugador ya vio el resultado. */
  function dismiss(): void {
    pendingResult.value = null
  }

  return { current, pendingResult, listen, dismiss }
})
