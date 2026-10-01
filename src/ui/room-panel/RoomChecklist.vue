<script setup lang="ts">
/** Lista de comprobación de una sala: cada línea es un requisito cumplido o no. */
export interface ChecklistEntry {
  readonly key: string
  readonly label: string
  readonly done: boolean
}

defineProps<{ entries: readonly ChecklistEntry[] }>()
</script>

<template>
  <ul class="flex flex-col gap-1 text-sm">
    <li v-for="entry in entries" :key="entry.key" class="flex items-start gap-2">
      <span
        class="shrink-0"
        :class="entry.done ? 'text-green-700' : 'text-red-700'"
        :aria-label="entry.done ? 'Cumplido' : 'Pendiente'"
        role="img"
      >
        <span aria-hidden="true" class="font-bold">{{ entry.done ? '✓' : '✗' }}</span>
      </span>
      <span>{{ entry.label }}</span>
    </li>
  </ul>
</template>
