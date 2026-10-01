<script setup lang="ts">
/** Panel desplegable de una categoría: cabecera, pestañas, rejilla y ayuda. */
import { computed } from 'vue'
import type { MenuCategory } from '@/content/buildMenu'
import MenuItemButton from '@/ui/build-menu/MenuItemButton.vue'
import { BLUEPRINT_WIDTH } from '@/ui/components/blueprint'

/** 5 columnas + 4 huecos de 4 px + padding de 24 px + borde de 4 px. */
const PANEL_WIDTH = BLUEPRINT_WIDTH * 5 + 4 * 4 + 24 + 4

const props = defineProps<{ category: MenuCategory; tabIndex: number }>()
defineEmits<{ close: []; selectTab: [index: number] }>()

const tab = computed(() => props.category.tabs[props.tabIndex] ?? props.category.tabs[0])
</script>

<template>
  <section
    :style="{ width: `${PANEL_WIDTH}px` }"
    class="flex max-h-[60vh] max-w-full flex-col rounded-md border-2 border-[#1f2124] bg-[rgba(40,42,46,0.92)] text-white shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
    :aria-label="category.label"
  >
    <header class="flex items-center justify-between px-3 pt-2">
      <h2 class="text-sm font-bold tracking-wide uppercase">{{ category.label }}</h2>
      <button
        type="button"
        class="cursor-pointer rounded px-1.5 text-lg leading-none text-[#c9ccd1] hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        aria-label="Cerrar menú"
        @click="$emit('close')"
      >
        ✕
      </button>
    </header>

    <div v-if="category.tabs.length > 1" class="flex flex-wrap gap-1 px-3 pt-2" role="tablist">
      <button
        v-for="(t, index) in category.tabs"
        :key="t.label"
        type="button"
        role="tab"
        class="cursor-pointer rounded-t px-3 py-1 text-xs font-bold"
        :class="index === tabIndex ? 'bg-[#c9ccd1] text-[#1f2124]' : 'bg-[#3a3d42] text-[#a8acb2]'"
        :aria-selected="index === tabIndex"
        @click="$emit('selectTab', index)"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div v-if="tab" class="grid grid-cols-5 gap-1">
        <MenuItemButton
          v-for="(item, index) in tab.items"
          :key="`${tab.label}-${index}`"
          :item="item"
          :color="category.color"
        />
      </div>
    </div>

    <footer class="border-t border-[#1f2124] px-3 py-1.5 text-[11px] text-[#c9ccd1]">
      <kbd class="kbd">R</kbd>: girar · <kbd class="kbd">Esc</kbd>: soltar ·
      <kbd class="kbd">Arrastrar</kbd>: pintar · <kbd class="kbd">Clic dcho.</kbd>: mover
    </footer>
  </section>
</template>

<style scoped>
.kbd {
  border: 1px solid #1f2124;
  border-radius: 3px;
  background: #c9ccd1;
  color: #1f2124;
  padding: 0 4px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
}
</style>
