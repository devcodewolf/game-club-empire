<script setup lang="ts">
/**
 * Reloj de la esquina superior derecha (como el de Prison Architect): la hora
 * grande, el día debajo y una fila de botones de velocidad. Una ficha de papel
 * pequeña, sin barras que tapen el mapa. Solo lee el store del tiempo.
 */
import { computed } from 'vue'
import AppIcon from '@/ui/components/AppIcon.vue'
import { useGame } from '@/ui/composables/useGame'
import { useTimeStore } from '@/ui/stores/timeStore'
import { formatDay, formatHour } from '@/ui/time/formatTime'

const time = useTimeStore()
const speeds = useGame().content.time.speeds

const btn =
  'flex h-6 min-w-6 cursor-pointer items-center justify-center rounded-sm border border-ink px-1 font-data text-[11px] font-bold tabular-nums motion-safe:transition-colors motion-safe:duration-100'
const idle = 'bg-paper/70 text-ink hover:bg-paper'
const active = 'bg-ink text-paper'

const isSpeedActive = (s: number): boolean => !time.paused && time.speed === s
const keyOf = (index: number): number => index + 1
const pauseLabel = computed(() => (time.paused ? 'Reanudar (Espacio)' : 'Pausa (Espacio)'))
</script>

<template>
  <div
    class="pointer-events-auto flex flex-col items-stretch gap-1 rounded-sm border-2 border-ink bg-paper px-2 pt-0.5 pb-1.5 text-ink shadow-[3px_3px_0_rgb(0_0_0/0.35)]"
    role="region"
    aria-label="Reloj y control del tiempo"
  >
    <div class="flex items-baseline justify-between gap-2">
      <span class="font-data text-2xl leading-tight font-bold tabular-nums">
        {{ formatHour(time.time) }}
      </span>
      <span class="font-hand text-base leading-tight">{{ formatDay(time.time) }}</span>
    </div>
    <div class="flex gap-1">
      <button
        type="button"
        :class="[btn, time.paused ? active : idle]"
        :title="pauseLabel"
        :aria-label="time.paused ? 'Reanudar' : 'Pausa'"
        :aria-pressed="time.paused"
        @click="time.togglePause()"
      >
        <AppIcon name="player-pause" :size="13" :stroke="2.5" />
      </button>
      <button
        v-for="(s, i) in speeds"
        :key="s"
        type="button"
        :class="[btn, isSpeedActive(s) ? active : idle]"
        :title="`×${s} (${keyOf(i)})`"
        :aria-label="`Velocidad ×${s}`"
        :aria-pressed="isSpeedActive(s)"
        @click="time.setSpeed(s)"
      >
        ×{{ s }}
      </button>
      <button
        type="button"
        :class="[btn, idle]"
        title="Próximo evento: salta al siguiente partido o aviso y se detiene"
        aria-label="Próximo evento"
        @click="time.nextEvent()"
      >
        <AppIcon name="player-track-next" :size="13" :stroke="2.5" />
      </button>
    </div>
  </div>
</template>
