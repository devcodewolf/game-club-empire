<script setup lang="ts">
/**
 * Marcador del partido en juego (arriba a la izquierda), como el de un campo
 * de pueblo: tablero de madera pintado de verde, nombres rotulados a mano y
 * los goles en placas blancas colgadas de un clavo, que giran al cambiar.
 * Va contando el resultado minuto a minuto con los goles que la simulación
 * decidió al empezar, y celebra cada gol con una tira de papel.
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
  if (clock.phase === 'break') return 'Descanso'
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
      class="pointer-events-auto relative w-[340px]"
      role="status"
      :aria-label="`En juego: ${board.left.name} ${board.left.goals}, ${board.right.name} ${board.right.goals}, ${minuteText}`"
    >
      <div class="scoreboard rounded-md px-3 pt-1.5 pb-2 text-white">
        <!-- Cabecera rotulada: en juego y el minuto en su placa -->
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1.5 font-hand text-[15px] leading-5 tracking-wide">
            <span class="live-dot h-2 w-2 rounded-full bg-[#ff5a4a]" aria-hidden="true" />
            En juego
          </span>
          <span
            class="minute rounded-sm px-1.5 font-data text-[13px] leading-5 font-bold text-ink tabular-nums"
            >{{ minuteText }}</span
          >
        </div>

        <!-- Nombres pintados y placas de los goles -->
        <div class="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div class="min-w-0 text-right">
            <p class="truncate font-hand text-[17px] leading-5" :title="board.left.name">
              {{ board.left.name }}
            </p>
            <p class="font-data text-[9px] tracking-[0.2em] text-white/55">LOCAL</p>
          </div>
          <div class="flex items-start gap-1.5">
            <span v-for="side in SIDES" :key="side" class="card-slot relative">
              <span
                class="nail absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                aria-hidden="true"
              />
              <Transition
                mode="out-in"
                enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
                enter-from-class="motion-safe:[transform:rotateX(90deg)]"
                leave-active-class="motion-safe:transition motion-safe:duration-150 motion-safe:ease-in"
                leave-to-class="motion-safe:[transform:rotateX(-90deg)]"
              >
                <span
                  :key="board[side].goals"
                  class="card flex h-10 w-8 items-center justify-center rounded-[3px] font-data text-[26px] font-bold text-ink tabular-nums"
                  >{{ board[side].goals }}</span
                >
              </Transition>
            </span>
          </div>
          <div class="min-w-0">
            <p class="truncate font-hand text-[17px] leading-5" :title="board.right.name">
              {{ board.right.name }}
            </p>
            <p class="font-data text-[9px] tracking-[0.2em] text-white/55">VISITANTE</p>
          </div>
        </div>
      </div>

      <!-- ¡GOL!: tira de papel pegada a la derecha del marcador, sobre el mapa -->
      <Transition
        enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
        enter-from-class="motion-safe:-translate-x-2 opacity-0"
        leave-active-class="motion-safe:transition motion-safe:duration-300"
        leave-to-class="opacity-0"
      >
        <p
          v-if="goal"
          class="goal absolute top-1/2 left-full z-10 ml-3 px-4 py-0.5 font-hand text-[20px] leading-6 whitespace-nowrap shadow-[2px_2px_0_rgb(0_0_0/0.3)]"
          :class="goal === 'ours' ? 'bg-[#f7e27d] text-ink' : 'bg-paper text-red-800'"
        >
          {{ goal === 'ours' ? `¡GOL de ${CLUB_NAME}!` : `Gol de ${store.current?.opponent}` }}
        </p>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts">
/** Lados del marcador, de izquierda (local) a derecha (visitante). */
const SIDES = ['left', 'right'] as const
</script>

<style scoped>
/* Tablero: madera pintada de verde con vetas, marco de madera y sombra plana */
.scoreboard {
  background:
    repeating-linear-gradient(0deg, rgb(0 0 0 / 0.07) 0 1px, transparent 1px 13px),
    linear-gradient(#2f5a3b, #264b31);
  border: 4px solid #8a5a2b;
  box-shadow:
    0 0 0 2px #4a2d12,
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    3px 4px 0 rgb(0 0 0 / 0.4);
  text-shadow: 1px 1px 0 rgb(0 0 0 / 0.35);
}

/* Placa del minuto: chapa crema */
.minute {
  background: #f1ead7;
  box-shadow:
    0 0 0 1px #2e2a26,
    1px 1px 0 rgb(0 0 0 / 0.35);
  text-shadow: none;
}

/* Placas de los goles: cartón blanco con una raya en medio (giran al cambiar) */
.card-slot {
  perspective: 300px;
}
.card {
  background: linear-gradient(#ffffff 0 49%, #e2dccc 49% 51%, #f6f3ea 51%);
  box-shadow:
    0 0 0 1.5px #2e2a26,
    2px 2px 0 rgb(0 0 0 / 0.35);
  text-shadow: none;
}
.nail {
  z-index: 1;
  background: radial-gradient(circle at 35% 35%, #d9d4c7, #6d6659);
  box-shadow: 0 0 0 1px #2e2a26;
}

/* La tira del gol, algo torcida, como pegada con prisa */
.goal {
  transform: translateY(-50%) rotate(-3deg);
}

@media (prefers-reduced-motion: no-preference) {
  .live-dot {
    animation: live 1.2s ease-in-out infinite;
  }
  .goal {
    animation: goal-wiggle 0.45s ease-in-out 3;
  }
}
@keyframes live {
  50% {
    opacity: 0.25;
  }
}
@keyframes goal-wiggle {
  50% {
    transform: translateY(-50%) rotate(1deg) scale(1.08);
  }
}
</style>
