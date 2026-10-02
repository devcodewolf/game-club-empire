<script setup lang="ts">
/** Panel desplegable de una categoría: cabecera, pestañas, rejilla y ayuda. */
import { computed, ref } from 'vue'
import type { MenuCategory } from '@/content/buildMenu'
import MenuItemButton from '@/ui/build-menu/MenuItemButton.vue'
import { BLUEPRINT_WIDTH } from '@/ui/components/blueprint'

/** 5 columnas + 4 huecos de 4 px + padding de 24 px + borde de 4 px. */
const PANEL_WIDTH = BLUEPRINT_WIDTH * 5 + 4 * 4 + 24 + 4

const props = defineProps<{ category: MenuCategory; tabIndex: number }>()
const emit = defineEmits<{ close: []; selectTab: [index: number] }>()

/** Referencias a las lengüetas para mover el foco con las flechas. */
const tabButtons = ref<HTMLButtonElement[]>([])

/** Flechas arriba/abajo: selecciona la pestaña contigua (circular) y le da el foco. */
function onTabKeydown(event: KeyboardEvent): void {
  const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
  if (step === 0) return
  event.preventDefault()
  const total = props.category.tabs.length
  const next = (props.tabIndex + step + total) % total
  emit('selectTab', next)
  tabButtons.value[next]?.focus()
}

const tab = computed(() => props.category.tabs[props.tabIndex] ?? props.category.tabs[0])

/**
 * Colores pastel de las lengüetas (como las de los informes de Prison
 * Architect): cada pestaña tiene el suyo, por posición.
 */
const TAB_COLORS = [
  '#b9b4e6',
  '#f2b38a',
  '#9fdcae',
  '#f2dc8a',
  '#9ccbe8',
  '#f0a8b8',
  '#c6dc8f',
] as const

function tabColor(index: number): string {
  return TAB_COLORS[index % TAB_COLORS.length] ?? TAB_COLORS[0]
}
</script>

<template>
  <div class="flex max-w-full items-stretch">
    <section
      :style="{ width: `${PANEL_WIDTH}px` }"
      class="flex max-h-[70vh] max-w-full flex-col rounded-md border-2 border-[#1f2124] bg-[rgba(40,42,46,0.92)] text-white shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
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

    <!-- Lengüetas verticales pegadas al borde derecho; solo si hay más de una -->
    <div
      v-if="category.tabs.length > 1"
      class="-ml-0.5 flex flex-col gap-0.5 py-2"
      role="tablist"
      aria-orientation="vertical"
      :aria-label="`Pestañas de ${category.label}`"
    >
      <button
        v-for="(t, index) in category.tabs"
        :key="t.label"
        :ref="
          (el) => {
            if (el) tabButtons[index] = el as HTMLButtonElement
          }
        "
        type="button"
        role="tab"
        class="tab shrink-0 cursor-pointer py-3 font-hand text-[15px] leading-none text-ink motion-safe:transition-[padding,filter] focus-visible:outline-2 focus-visible:outline-white"
        :class="index === tabIndex ? 'tab--active pr-3 pl-1.5' : 'pr-1.5 pl-1'"
        :style="{ backgroundColor: tabColor(index) }"
        :aria-selected="index === tabIndex"
        :tabindex="index === tabIndex ? 0 : -1"
        @click="$emit('selectTab', index)"
        @keydown="onTabKeydown"
      >
        <!-- Texto vertical en un span: en Chrome un botón con writing-mode vertical calcula mal su alto en flex -->
        <span class="block rotate-180 whitespace-nowrap [writing-mode:vertical-rl]">{{
          t.label
        }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Lengüeta con el extremo en bisel (como las carpetas de Prison Architect) */
.tab {
  clip-path: polygon(
    0 0,
    calc(100% - 5px) 0,
    100% 6px,
    100% calc(100% - 6px),
    calc(100% - 5px) 100%,
    0 100%
  );
  filter: brightness(0.8) saturate(0.75);
  box-shadow: inset 2px 0 0 rgb(0 0 0 / 0.25);
}
.tab:hover {
  filter: brightness(0.95);
}
.tab--active {
  filter: none;
  box-shadow: none;
}

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
