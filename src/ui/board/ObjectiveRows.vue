<script setup lang="ts">
/**
 * Lista de objetivos. Con `checks`, cada uno lleva casilla y se tacha al
 * cumplirse (con una animación del tachado al tacharse en directo). Con
 * `todo` (el tablón), un cuadradito pequeño en lugar de la casilla y
 * renglones de 20 px, alineados con los de la hoja.
 */
import { ref, watch } from 'vue'
import type { ObjectiveRow } from './useGrantsBoard'

const props = defineProps<{
  rows: readonly ObjectiveRow[]
  checks?: boolean
  compact?: boolean
  todo?: boolean
}>()

// Objetivos tachados hace un momento: reciben la animación
const fresh = ref(new Set<string>())
const seen = new Map<string, boolean>()
watch(
  () => props.rows,
  (rows) => {
    for (const row of rows) {
      if (seen.get(row.key) === false && row.done) {
        fresh.value = new Set(fresh.value).add(row.key)
        const key = row.key
        setTimeout(() => {
          const next = new Set(fresh.value)
          next.delete(key)
          fresh.value = next
        }, 1600)
      }
      seen.set(row.key, row.done)
    }
  },
  { immediate: true },
)
</script>

<template>
  <ul class="flex flex-col" :class="todo ? '' : 'gap-0.5'">
    <li
      v-for="row in rows"
      :key="row.key"
      class="flex items-baseline gap-1.5"
      :class="[
        todo
          ? 'text-[15px] leading-5'
          : compact
            ? 'text-[15px] leading-4'
            : 'text-[17px] leading-5',
        { 'motion-safe:animate-[board-glow_1.4s_ease-out]': fresh.has(row.key) },
      ]"
    >
      <span
        v-if="todo"
        aria-hidden="true"
        class="size-[5px] shrink-0 -translate-y-0.5 bg-ink"
        :class="row.done ? 'opacity-40' : ''"
      />
      <span v-else-if="checks" aria-hidden="true" class="w-4 shrink-0 text-center">{{
        row.done ? '☑' : '☐'
      }}</span>
      <span v-else aria-hidden="true" class="w-3 shrink-0 text-center">•</span>
      <span
        class="font-hand"
        :class="[
          row.done ? 'text-ink/60 line-through' : '',
          fresh.has(row.key) ? 'motion-safe:animate-[board-strike_0.5s_ease-out]' : '',
        ]"
        >{{ compact ? row.short : row.text }}</span
      >
      <span
        v-if="(checks || todo) && row.progress"
        class="ml-auto shrink-0 pl-1 font-data text-[11px] font-bold whitespace-nowrap tabular-nums"
        >{{ row.progress }}</span
      >
    </li>
  </ul>
</template>

<style>
@keyframes board-strike {
  from {
    background: linear-gradient(var(--color-ink), var(--color-ink)) no-repeat 0 55% / 0% 2px;
  }
  to {
    background: linear-gradient(var(--color-ink), var(--color-ink)) no-repeat 0 55% / 100% 2px;
  }
}
@keyframes board-glow {
  0% {
    background-color: rgb(255 240 150 / 0.9);
  }
  100% {
    background-color: transparent;
  }
}
</style>
