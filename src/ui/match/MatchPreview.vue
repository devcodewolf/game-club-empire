<script setup lang="ts">
/**
 * Previa del partido: la pizarra de vestuario (`ChalkBoard`) que sale el
 * domingo a las 16:00 con el rival, las fuerzas, el público esperado y los
 * avisos útiles. Pausa el juego mientras está abierta. "¡A jugar!" avanza al
 * instante hasta el saque y reanuda; Escape o pulsar fuera la cierra y deja el
 * juego como estaba, sin avanzar (el partido se jugará igualmente a las 17:00).
 */
import { computed, watch } from 'vue'
import { formatNumber } from '@/render/core/formatNumber'
import { clubChangingRooms } from '@/sim/club/changingRooms'
import { homeAttendance, teamStrength } from '@/sim/club/match'
import { formatEuros } from '@/ui/composables/formatMoney'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import ChalkBoard from '@/ui/match/ChalkBoard.vue'
import { useMatchStore } from '@/ui/stores/matchStore'
import { useTimeStore } from '@/ui/stores/timeStore'
import { formatHour } from '@/ui/time/formatTime'

/** Nuestro club, de momento sin nombre propio. */
const CLUB_NAME = 'Tu club'
/** Diferencia de fuerza a partir de la cual hay favorito. */
const FAVOURITE_GAP = 5
/** Estado del campo por debajo del cual se avisa (la fuerza que suma, no el %). */
const BAD_PITCH = 4

const game = useGame()
const version = useGameVersion()
const store = useMatchStore()
const time = useTimeStore()

const preview = computed(() => store.pendingPreview)

/** Un decimal solo si lo tiene, con coma. */
function plain(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded.toFixed(1).replace('.', ',').replace(/,0$/, '').replace('-', '−')
}

const info = computed(() => {
  void version.value
  const p = preview.value
  if (!p) return undefined
  const { content, state } = game
  const ours = teamStrength(state, content, p.home)
  const gap = ours.total - p.rivalStrength
  const verdict =
    gap > FAVOURITE_GAP
      ? 'Somos favoritos.'
      : gap < -FAVOURITE_GAP
        ? 'El rival es favorito.'
        : 'Partido igualado.'
  const us = { name: CLUB_NAME, strength: ours.total }
  const them = { name: p.opponent, strength: p.rivalStrength }

  const warnings: string[] = []
  if (p.home) {
    if (clubChangingRooms(state, content).away.kind === 'none') {
      warnings.push(
        `Sin vestuario visitante: la federación multará con ${formatEuros(content.match.matchday.noVisitorRoom.fine)}.`,
      )
    }
    if (ours.pitch < BAD_PITCH) warnings.push('El campo está en mal estado y resta fuerza.')
  } else {
    warnings.push(`Furgoneta: ${formatEuros(content.match.matchday.travelCost)}.`)
  }

  return {
    sides: p.home ? { left: us, right: them } : { left: them, right: us },
    verdict,
    attendance: p.home ? homeAttendance(state, content) : null,
    raining: state.clock.weather === 'rain',
    warnings,
  }
})

/** Pausa el juego al abrirse (recordando si ya lo estaba) y lo restaura al cerrarse. */
let wasPaused = true
watch(preview, (now, before) => {
  if (now && !before) {
    wasPaused = time.paused
    time.paused = true
    time.jumpRequested = false
  } else if (!now && before) {
    time.paused = wasPaused
  }
})

/** Escape o pulsar fuera: se cierra y el juego queda como estaba. */
function close(): void {
  store.dismissPreview()
}

/** Avanza al instante hasta el saque y reanuda con la velocidad elegida. */
function play(): void {
  const p = preview.value
  if (!p) return
  wasPaused = false
  store.dismissPreview()
  const wait = p.kickoff - game.state.clock.time
  if (wait > 0) game.advance(wait)
}
</script>

<template>
  <ChalkBoard
    :open="preview !== null && info !== undefined"
    :label="`Previa de la jornada ${preview?.number ?? ''}`"
    @close="close"
    @confirm="play"
  >
    <template v-if="preview && info">
      <p class="text-center text-[18px] tracking-wide text-white/75 uppercase">
        Jornada {{ preview.number }} · {{ preview.home ? 'en casa' : 'fuera' }}
      </p>
      <p class="text-center text-[18px] text-white/75">
        Hoy a las {{ formatHour(preview.kickoff) }}
      </p>

      <div class="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <span class="text-[28px] leading-8">{{ info.sides.left.name }}</span>
        <span class="text-[22px] text-white/75">vs</span>
        <span class="text-[28px] leading-8">{{ info.sides.right.name }}</span>
      </div>
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center text-white/90">
        <span class="font-data text-[15px] font-bold tabular-nums"
          >Fuerza {{ plain(info.sides.left.strength) }}</span
        >
        <span aria-hidden="true" />
        <span class="font-data text-[15px] font-bold tabular-nums"
          >Fuerza {{ plain(info.sides.right.strength) }}</span
        >
      </div>
      <p class="mt-2 text-center text-[26px] leading-7 underline decoration-2 underline-offset-4">
        {{ info.verdict }}
      </p>

      <div class="chalk-rule my-3" aria-hidden="true" />

      <section v-if="info.attendance" aria-label="Público y tiempo">
        <p>
          Público esperado:
          <span class="font-data text-[15px] font-bold tabular-nums"
            >{{ formatNumber(info.attendance.total) }} /
            {{ formatNumber(info.attendance.capacity) }}</span
          >
        </p>
        <p v-if="info.attendance.leftOut > 0" class="text-amber-200">
          Se quedarán fuera {{ formatNumber(info.attendance.leftOut) }}
        </p>
        <p :class="info.raining ? 'text-amber-200' : 'text-white/90'">
          Tiempo: {{ info.raining ? 'lluvia, vendrá menos gente' : 'seco' }}
        </p>
      </section>

      <ul v-if="info.warnings.length" class="mt-2 space-y-0.5 text-amber-200" aria-label="Avisos">
        <li v-for="warning in info.warnings" :key="warning">· {{ warning }}</li>
      </ul>

      <button
        type="button"
        class="mx-auto mt-4 block cursor-pointer border-2 border-white/80 bg-white/10 px-8 py-1 text-[24px] leading-7 text-white shadow-[3px_3px_0_rgba(0,0,0,0.35)] hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        @click="play"
      >
        ¡A jugar!
      </button>
    </template>
  </ChalkBoard>
</template>
