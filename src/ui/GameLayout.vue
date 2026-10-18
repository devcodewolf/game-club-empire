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
    class="pointer-events-none absolute inset-0 grid grid-cols-[auto_1fr_auto] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-3"
  >
    <!--
      Altura fija (la del reloj): lo que crezca o aparezca arriba (avisos, el
      marcador, el tablón…) flota por encima sin empujar las fichas laterales.
    -->
    <header class="col-span-3 flex h-[72px] items-start gap-3 *:pointer-events-auto">
      <slot name="top" />
    </header>
    <aside
      class="side-slot flex min-h-0 flex-col gap-3 overflow-x-clip overflow-y-visible pr-1 pb-1 *:pointer-events-auto"
    >
      <slot name="left" />
    </aside>
    <div />
    <aside
      class="side-slot flex min-h-0 flex-col gap-3 overflow-x-clip overflow-y-visible pr-1 pb-1 *:pointer-events-auto"
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
 * scroll: las fichas largas hacen scroll dentro de su hoja (la fila del centro
 * es `minmax(0, 1fr)`, así nunca empuja la barra de abajo fuera de la pantalla).
 * A diferencia de "hidden", "clip" no fuerza scroll en el otro eje.
 * El padding deja sitio a la sombra plana de los paneles.
 */
.side-slot {
  scrollbar-width: none;
}
.side-slot::-webkit-scrollbar {
  display: none;
}
</style>
