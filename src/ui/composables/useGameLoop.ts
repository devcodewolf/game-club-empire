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

export function useGameLoop(game: Game): void {
  const store = useTimeStore()
  const accumulator: TickAccumulator = { carry: 0 }
  const fastest = Math.max(...game.content.time.speeds)
  let frame = 0
  let last = 0

  const step = (now: number): void => {
    const frameMs = last === 0 ? 0 : now - last
    last = now
    if (store.paused) {
      accumulator.carry = 0
    } else {
      const speed = store.fastForward ? fastest : store.speed
      const ticks = ticksForFrame(accumulator, frameMs, ticksPerSecond(game.content.time, speed))
      if (ticks > 0) {
        const result = game.advance(ticks, { stopOnEvent: store.fastForward })
        if (store.fastForward && result.stoppedBy !== null) store.stopAtEvent()
      }
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
