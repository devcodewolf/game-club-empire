<script setup lang="ts">
/**
 * Marcador del partido en juego (arriba a la izquierda), como el de un campo
 * de pueblo: caja oscura con los nombres en placas, cifras de luz ámbar y el
 * minuto en rojo. Va contando el resultado minuto a minuto con los goles que
 * la simulación decidió al empezar, y celebra cada gol con un "¡GOL!".
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { matchClock, scoreAt } from '@/sim/club/match'
import { useMatchStore } from '@/ui/stores/matchStore'
import { useTimeStore } from '@/ui/stores/timeStore'

/** Nuestro club, de momento sin nombre propio (como en la pizarra del resultado). */
const CLUB_NAME = 'Tu club'
/** Lo que dura el aviso de gol, en ms reales. */
const GOAL_FLASH_MS = 2600

const store = useMatchStore()
const time = useTimeStore()

const board = computed(() => {
  const match = store.current
  if (!match) return null
  const clock = matchClock(match, time.time)
  const { ours, theirs } = scoreAt(match, clock.minute)
  const us = { name: CLUB_NAME, goals: ours }
  const them = { name: match.opponent, goals: theirs }
  return {
    clock,
    left: match.home ? us : them,
    right: match.home ? them : us,
    total: ours + theirs,
    ours,
  }
})

const minuteText = computed(() => {
  const clock = board.value?.clock
  if (!clock) return ''
  if (clock.phase === 'break') return 'DESC.'
  return clock.phase === 'added' ? "90+'" : `${clock.minute}'`
})

/** Aviso de gol: de quién fue, durante unos segundos. */
const goal = ref<'ours' | 'theirs' | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => [board.value?.total ?? 0, board.value?.ours ?? 0] as const,
  ([total, ours], [prevTotal, prevOurs]) => {
    if (!board.value || total <= prevTotal) return
    goal.value = ours > prevOurs ? 'ours' : 'theirs'
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => (goal.value = null), GOAL_FLASH_MS)
  },
)
watch(
  () => store.current,
  (current) => {
    if (!current) goal.value = null
  },
)
onBeforeUnmount(() => clearTimeout(flashTimer))
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-300 motion-safe:ease-out"
    enter-from-class="motion-safe:-translate-y-3 opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-in"
    leave-to-class="motion-safe:-translate-y-3 opacity-0"
  >
    <div
      v-if="board"
      class="scoreboard pointer-events-auto w-[340px] rounded-md border-2 border-ink p-1.5 text-white shadow-[3px_3px_0_rgb(0_0_0/0.4)]"
      role="status"
      :aria-label="`En juego: ${board.left.name} ${board.left.goals}, ${board.right.name} ${board.right.goals}, minuto ${minuteText}`"
    >
      <!-- Cabecera: en directo y minuto -->
      <div class="flex items-center justify-between px-1 pb-1">
        <span class="flex items-center gap-1.5 font-data text-[10px] font-bold tracking-[0.18em]">
          <span class="live-dot h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          EN JUEGO
        </span>
        <span class="led led--red font-data text-sm font-bold tabular-nums">{{ minuteText }}</span>
      </div>

      <!-- Placas con los nombres y el marcador -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <span class="plate truncate text-right" :title="board.left.name">{{
          board.left.name
        }}</span>
        <span class="digits flex items-center gap-1 rounded-sm px-1.5 font-data tabular-nums">
          <span class="led led--amber w-5 text-center text-2xl leading-8 font-bold">{{
            board.left.goals
          }}</span>
          <span class="text-lg text-white/40">-</span>
          <span class="led led--amber w-5 text-center text-2xl leading-8 font-bold">{{
            board.right.goals
          }}</span>
        </span>
        <span class="plate truncate" :title="board.right.name">{{ board.right.name }}</span>
      </div>

      <!-- ¡GOL! -->
      <Transition
        enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
        enter-from-class="motion-safe:scale-75 opacity-0"
        leave-active-class="motion-safe:transition motion-safe:duration-300"
        leave-to-class="opacity-0"
      >
        <p
          v-if="goal"
          class="goal mt-1.5 rounded-sm py-0.5 text-center font-hand text-[20px] leading-6"
          :class="goal === 'ours' ? 'bg-green-700' : 'bg-red-800'"
        >
          {{ goal === 'ours' ? `¡GOL de ${CLUB_NAME}!` : `Gol de ${store.current?.opponent}` }}
        </p>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* Caja del marcador: chapa oscura con un ribete más claro arriba */
.scoreboard {
  background: linear-gradient(#2b3138, #1d2126);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    3px 3px 0 rgb(0 0 0 / 0.4);
}

/* Placa con el nombre del equipo, como letras blancas sobre chapa */
.plate {
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 2px;
  background: #3a424b;
  padding: 2px 6px;
  font-family: var(--font-data);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* Ventana negra de las cifras */
.digits {
  background: #0d0f12;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
}

/* Cifras de luz, con un leve resplandor */
.led--amber {
  color: #ffc14d;
  text-shadow: 0 0 6px rgb(255 170 40 / 0.65);
}
.led--red {
  color: #ff6b5b;
  text-shadow: 0 0 5px rgb(255 80 60 / 0.6);
}

@media (prefers-reduced-motion: no-preference) {
  .live-dot {
    animation: live 1.2s ease-in-out infinite;
  }
  .goal {
    animation: goal-pulse 0.5s ease-in-out 3;
  }
}
@keyframes live {
  50% {
    opacity: 0.25;
  }
}
@keyframes goal-pulse {
  50% {
    transform: scale(1.06);
  }
}
</style>
