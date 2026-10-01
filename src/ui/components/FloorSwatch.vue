<script setup lang="ts">
/**
 * Botón pequeño para elegir un suelo: cuadrado de color con juntas sutiles
 * y el nombre debajo. Estilo "plano de obra" como BlueprintButton.
 */
import { computed } from 'vue'

const props = defineProps<{
  name: string
  /** Color del suelo como número 0xRRGGBB. */
  color: number
  active?: boolean
}>()

defineEmits<{ select: [] }>()

/** Convierte 0xRRGGBB a "#rrggbb" para usarlo en CSS. */
const cssColor = computed(() => `#${props.color.toString(16).padStart(6, '0')}`)
</script>

<template>
  <button
    type="button"
    class="swatch group flex w-[72px] cursor-pointer flex-col items-center gap-1 rounded-md bg-transparent p-0 text-white outline-none motion-safe:transition-transform motion-safe:duration-150"
    :class="active ? '-translate-y-0.5' : ''"
    :aria-pressed="active ? 'true' : 'false'"
    :title="name"
    @click="$emit('select')"
  >
    <span
      class="swatch__tile block h-8 w-8 rounded-sm border-2 border-[#2e2a26] motion-safe:transition-[filter,box-shadow] motion-safe:duration-150"
      :class="{ 'swatch__tile--active': active }"
      :style="{ backgroundColor: cssColor }"
      aria-hidden="true"
    />
    <span class="swatch__label w-full truncate text-center text-[10px] leading-tight font-bold">
      {{ name }}
    </span>
  </button>
</template>

<style scoped>
/* Juntas sutiles encima del color (líneas al 10 %). */
.swatch__tile {
  background-image:
    linear-gradient(rgb(0 0 0 / 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgb(0 0 0 / 0.1) 1px, transparent 1px);
  background-size: 8px 8px;
}

.swatch:hover .swatch__tile {
  filter: brightness(1.15);
}

.swatch:focus-visible .swatch__tile {
  box-shadow: 0 0 0 3px #fff;
}

/* Activo: anillo ámbar de 3 px. */
.swatch__tile--active,
.swatch:focus-visible .swatch__tile--active {
  box-shadow: 0 0 0 3px #f2c46b;
}

.swatch__label {
  color: #fff;
  text-shadow:
    -1px -1px 0 #1d1a17,
    1px -1px 0 #1d1a17,
    -1px 1px 0 #1d1a17,
    1px 1px 0 #1d1a17;
}
</style>
