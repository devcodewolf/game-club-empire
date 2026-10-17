/**
 * Pone en marcha el bucle de juego mientras el componente esté montado: cada
 * fotograma avanza la simulación los ticks que tocan según la velocidad y
 * copia el instante y el clima al store del tiempo para el HUD.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import type { Game } from '@/sim/game'
import { ticksPerSecond } from '@/sim/time/clock'
import { useTimeStore } from '@/ui/stores/timeStore'
import { ticksForFrame, type TickAccumulator } from '@/ui/time/gameLoop'
import { MINUTES_PER_DAY } from '@/sim/time/calendar'

/** Lo más lejos que salta "próximo evento" si no encuentra ninguno destacado antes. */
const MAX_JUMP_MINUTES = 60 * MINUTES_PER_DAY

export function useGameLoop(game: Game): void {
  const store = useTimeStore()
  const accumulator: TickAccumulator = { carry: 0 }
  let frame = 0
  let last = 0

  const step = (now: number): void => {
    const frameMs = last === 0 ? 0 : now - last
    last = now
    if (store.jumpRequested) {
      // "Próximo evento": la simulación salta de evento en evento, así que es instantáneo;
      // lo de por medio (clima de cada día, ingresos diarios…) ocurre igualmente.
      game.advance(MAX_JUMP_MINUTES, { stopOnEvent: true })
      accumulator.carry = 0
      store.stopAtEvent()
    } else if (store.paused) {
      accumulator.carry = 0
    } else {
      const ticks = ticksForFrame(
        accumulator,
        frameMs,
        ticksPerSecond(game.content.time, store.speed),
      )
      if (ticks > 0) game.advance(ticks)
    }
    store.sync(game.state.clock.time, game.state.clock.weather)
    frame = requestAnimationFrame(step)
  }

  onMounted(() => {
    store.sync(game.state.clock.time, game.state.clock.weather)
    frame = requestAnimationFrame(step)
  })
  onBeforeUnmount(() => cancelAnimationFrame(frame))
}
