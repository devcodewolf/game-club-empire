<script setup lang="ts">
/**
 * Lista de comprobación de una sala, escrita "a mano" en la libreta: una
 * casilla ☐ por requisito, marcada con ✓ verde o ✗ roja. Cada línea ocupa un
 * renglón (24 px).
 */
export interface ChecklistEntry {
  readonly key: string
  readonly label: string
  readonly done: boolean
}

defineProps<{ entries: readonly ChecklistEntry[] }>()
</script>

<template>
  <ul class="font-hand text-[17px] leading-6">
    <li v-for="entry in entries" :key="entry.key" class="flex items-center gap-2">
      <span
        class="relative inline-block size-4 shrink-0 border-[1.5px] border-ink bg-white/40"
        role="img"
        :aria-label="entry.done ? 'Cumplido' : 'Pendiente'"
      >
        <span
          aria-hidden="true"
          class="absolute -top-2 left-0.5 text-[20px] leading-none font-bold"
          :class="entry.done ? 'text-green-700' : 'text-red-700'"
        >
          {{ entry.done ? '✓' : '✗' }}
        </span>
      </span>
      <span>{{ entry.label }}</span>
    </li>
  </ul>
</template>
