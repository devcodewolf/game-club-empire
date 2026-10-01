<script setup lang="ts">
/**
 * Barra de construcción: un botón por edificio del menú, girar y demoler,
 * y una segunda fila con los suelos pintables. Solo lee y modifica el store de herramienta.
 */
import { BUILDINGS, BUILD_MENU } from '@/content/buildings'
import { FLOORS, FLOOR_MENU } from '@/content/floors'
import BlueprintButton from '@/ui/components/BlueprintButton.vue'
import FloorSwatch from '@/ui/components/FloorSwatch.vue'
import { useToolStore } from '@/ui/stores/toolStore'

const toolStore = useToolStore()
</script>

<template>
  <section
    class="flex flex-col items-center gap-2 rounded-lg border-2 border-[#2e2a26] bg-[#3b2a1f] p-3 shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
    aria-label="Barra de construcción"
  >
    <div class="flex items-start gap-2">
      <BlueprintButton
        v-for="id in BUILD_MENU"
        :key="id"
        category="build"
        :label="BUILDINGS[id].name"
        :icon="BUILDINGS[id].icon"
        :hint="`${BUILDINGS[id].name} · ${BUILDINGS[id].size.width}×${BUILDINGS[id].size.height} casillas`"
        :active="toolStore.activeBuilding === id"
        @select="toolStore.selectBuilding(id)"
      />

      <div
        class="mx-1 h-14 w-0.5 self-start bg-[#2e2a26]"
        role="separator"
        aria-orientation="vertical"
      />

      <BlueprintButton
        category="land"
        :label="`Girar · ${toolStore.rotation * 90}°`"
        icon="↻"
        hint="Girar 90° (tecla R)"
        @select="toolStore.rotate()"
      />
      <BlueprintButton
        category="danger"
        label="Demoler"
        icon="🔨"
        hint="Demoler edificio"
        :active="toolStore.tool.kind === 'demolish'"
        @select="toolStore.selectDemolish()"
      />
    </div>

    <div class="flex items-start gap-2">
      <span class="self-center pr-1 text-[10px] font-bold tracking-wider text-[#d9c9a8] uppercase">
        Suelos
      </span>
      <FloorSwatch
        v-for="id in FLOOR_MENU"
        :key="id"
        :name="FLOORS[id].name"
        :color="FLOORS[id].color"
        :active="toolStore.activeFloor === id"
        @select="toolStore.selectFloor(id)"
      />
    </div>

    <p class="text-[11px] text-[#d9c9a8]">
      <kbd class="kbd">Clic</kbd>: usar · <kbd class="kbd">Arrastrar</kbd>: pintar suelo ·
      <kbd class="kbd">R</kbd>: girar · <kbd class="kbd">Esc</kbd> /
      <kbd class="kbd">clic derecho</kbd>: soltar · <kbd class="kbd">Botón derecho</kbd>: mover
    </p>
  </section>
</template>

<style scoped>
.kbd {
  border: 1px solid #2e2a26;
  border-radius: 4px;
  background: #f2e6c9;
  color: #2e2a26;
  padding: 0 4px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  box-shadow: 0 1px 0 #2e2a26;
}
</style>
