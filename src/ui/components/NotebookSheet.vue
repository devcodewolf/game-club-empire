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

/*
 * Margen rojo vertical, como en una libreta escolar. Va como capa del fondo
 * (no como ::before) para que siga entero cuando la hoja hace scroll.
 */
.notebook--margin {
  background-image:
    linear-gradient(var(--color-paper-margin), var(--color-paper-margin)),
    repeating-linear-gradient(
      to bottom,
      transparent 0 23px,
      color-mix(in srgb, var(--color-paper-line) 70%, transparent) 23px 24px
    );
  background-size:
    1.5px 100%,
    auto;
  background-position:
    26px 0,
    0 8px;
  background-repeat: repeat-y, repeat;
}
</style>
