<script setup lang="ts">
/**
 * Hoja de libreta (como las notas e informes de Prison Architect): papel
 * crema con renglones azules cada 24 px, margen rojo a la izquierda y una
 * sombra plana. El contenido se alinea a los renglones con `leading-6`.
 *
 * Reutilizable: ficha de sala, avisos y, más adelante, informes.
 */
withDefaults(defineProps<{ margin?: boolean }>(), { margin: true })
</script>

<template>
  <div
    class="notebook relative border-2 border-ink text-ink"
    :class="{ 'notebook--margin': margin }"
  >
    <slot />
  </div>
</template>

<style scoped>
.notebook {
  background-color: var(--color-paper);
  /* Renglones: una línea fina cada 24 px, empezando tras una cabecera de 8 px */
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0 23px,
    color-mix(in srgb, var(--color-paper-line) 70%, transparent) 23px 24px
  );
  background-position: 0 8px;
  box-shadow: 4px 4px 0 rgb(0 0 0 / 0.35);
}

/* Margen rojo vertical, como en una libreta escolar */
.notebook--margin::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 26px;
  width: 1.5px;
  background: var(--color-paper-margin);
  pointer-events: none;
}
</style>
