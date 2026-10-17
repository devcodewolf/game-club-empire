<script setup lang="ts">
/**
 * Fila de fichas sueltas arriba en el centro (como las casillas de Prison
 * Architect): cada dato en su propia ficha pequeña de papel. De momento, el
 * clima y la fecha; en los Bloques B y E se añaden dinero, socios, afición y fama.
 */
import { computed } from 'vue'
import AppIcon from '@/ui/components/AppIcon.vue'
import { useTimeStore } from '@/ui/stores/timeStore'
import { formatDay, formatYear } from '@/ui/time/formatTime'

const time = useTimeStore()
const raining = computed(() => time.weather === 'rain')
const weatherLabel = computed(() => (raining.value ? 'Lluvia' : 'Despejado'))

/** Estilo común de cada ficha. */
const chip =
  'pointer-events-auto flex h-7 items-center gap-1.5 rounded-sm border-2 border-ink bg-paper px-2 text-ink shadow-[2px_2px_0_rgb(0_0_0/0.35)]'
</script>

<template>
  <div class="flex items-start gap-2" role="group" aria-label="Datos del club">
    <div
      :class="chip"
      :title="`${weatherLabel} · ${formatDay(time.time)}, ${formatYear(time.time)}`"
    >
      <span
        role="img"
        :aria-label="weatherLabel"
        :class="raining ? 'text-ink-blue' : 'text-amber-600'"
      >
        <AppIcon :name="raining ? 'cloud-rain' : 'sun'" :size="16" :stroke="2.25" />
      </span>
      <span class="font-data text-xs font-bold tabular-nums">{{ formatYear(time.time) }}</span>
    </div>
  </div>
</template>
