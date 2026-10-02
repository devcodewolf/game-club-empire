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
    <aside
      class="side-slot flex flex-col gap-3 overflow-x-clip overflow-y-visible pr-1 pb-1 *:pointer-events-auto"
    >
      <slot name="left" />
    </aside>
    <div />
    <aside
      class="side-slot flex flex-col gap-3 overflow-x-clip overflow-y-visible pr-1 pb-1 *:pointer-events-auto"
    >
      <slot name="right" />
    </aside>
    <footer class="col-span-3 flex items-end justify-start gap-3 *:pointer-events-auto">
      <slot name="bottom" />
    </footer>
  </div>
</template>

<style scoped>
/*
 * Los paneles laterales entran deslizándose: durante la animación sobresalen
 * del hueco. Se recorta solo en horizontal (overflow-x-clip); en vertical el
 * panel crece con su contenido (overflow-y-visible): las fichas nunca hacen
 * scroll. A diferencia de "hidden", "clip" no fuerza scroll en el otro eje.
 * El padding deja sitio a la sombra plana de los paneles.
 */
.side-slot {
  scrollbar-width: none;
}
.side-slot::-webkit-scrollbar {
  display: none;
}
</style>
