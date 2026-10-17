<script setup lang="ts">
/**
 * Apartado de un informe: franja de color claro con rayas de tinta arriba y
 * abajo, el nombre a la izquierda y una cifra a la derecha. El color sale de
 * `--tab-color`, que pone la carpeta según la pestaña.
 */
defineProps<{ title: string; count?: number | string }>()
</script>

<template>
  <section class="mt-3 first:mt-1">
    <h3
      class="flex items-baseline justify-between border-y-2 border-ink px-3 font-hand text-[23px] leading-8"
      style="background-color: color-mix(in srgb, var(--tab-color) 40%, white)"
    >
      <span>{{ title }}</span>
      <span v-if="count !== undefined" class="tabular-nums">{{ count }}</span>
    </h3>
    <div class="px-1 pt-1.5">
      <slot />
    </div>
  </section>
</template>
