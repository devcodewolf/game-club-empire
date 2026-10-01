<script setup lang="ts">
/**
 * Capa de interfaz que flota sobre el mapa, al estilo Prison Architect:
 * el canvas ocupa toda la pantalla y los paneles se colocan en cinco huecos
 * (arriba, izquierda, derecha, abajo y el centro libre).
 *
 * El contenedor ignora el ratón (`pointer-events-none`) para que arrastrar y
 * hacer zoom funcione en las zonas vacías; solo el contenido de cada hueco
 * recibe clics (`*:pointer-events-auto`).
 */
defineSlots<{
  top?: () => unknown
  left?: () => unknown
  right?: () => unknown
  bottom?: () => unknown
}>()
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0 grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] gap-3 p-3"
  >
    <header class="col-span-3 flex items-start gap-3 *:pointer-events-auto">
      <slot name="top" />
    </header>
    <aside class="flex flex-col gap-3 overflow-y-auto *:pointer-events-auto">
      <slot name="left" />
    </aside>
    <div />
    <aside class="flex flex-col gap-3 overflow-y-auto *:pointer-events-auto">
      <slot name="right" />
    </aside>
    <footer class="col-span-3 flex items-end justify-center gap-3 *:pointer-events-auto">
      <slot name="bottom" />
    </footer>
  </div>
</template>
