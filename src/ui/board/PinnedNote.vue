<script setup lang="ts">
/**
 * Nota clavada al corcho con una chincheta de color. Gira un poco (±2°,
 * siempre igual para el mismo id) y lleva sombra plana.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ id: string; color?: 'paper' | 'posit'; pin?: string }>(), {
  color: 'paper',
  pin: '#c0392b',
})

const angle = computed(() => {
  let hash = 0
  for (const char of props.id) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return ((hash % 5) - 2) * 0.9
})
</script>

<template>
  <div
    class="relative border-2 border-ink px-2 pt-3 pb-1.5 text-ink shadow-[3px_3px_0_rgb(0_0_0/0.35)]"
    :class="color === 'posit' ? 'bg-[#f7e27a]' : 'bg-paper'"
    :style="{ transform: `rotate(${angle}deg)` }"
  >
    <span
      aria-hidden="true"
      class="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full border border-black/50 shadow-[1px_2px_0_rgb(0_0_0/0.35)]"
      :style="{ background: `radial-gradient(circle at 35% 30%, #fff9 0 18%, ${pin} 45%)` }"
    />
    <slot />
  </div>
</template>
