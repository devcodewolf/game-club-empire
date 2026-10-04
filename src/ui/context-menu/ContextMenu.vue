<script setup lang="ts">
/**
 * Menú contextual de un objeto (clic derecho sin herramienta): una tarjeta de
 * libreta junto al cursor con las acciones de `BUILDING_ACTIONS`.
 *
 * Se cierra al elegir una acción, con Escape (atajos), al pulsar fuera, con la
 * rueda, al cambiar el tamaño de la ventana o si el objeto desaparece.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PlacedBuilding } from '@/sim/buildings/buildings'
import AppIcon from '@/ui/components/AppIcon.vue'
import NotebookSheet from '@/ui/components/NotebookSheet.vue'
import { findBuilding } from '@/ui/composables/contentLookup'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import { useProgressionStore } from '@/ui/stores/progressionStore'
import { useSelectionStore } from '@/ui/stores/selectionStore'
import { useToolStore } from '@/ui/stores/toolStore'
import { BUILDING_ACTIONS, type ActionContext } from './buildingActions'
import { useContextMenuStore } from './contextMenuStore'

const game = useGame()
const version = useGameVersion()
const store = useContextMenuStore()
const tools = useToolStore()
const selection = useSelectionStore()
const progression = useProgressionStore()
const sheet = ref<HTMLElement | null>(null)

/** Separación entre el cursor y la tarjeta, y margen con el borde de la ventana (px). */
const OFFSET = 8
const EDGE = 12

const building = computed(() => {
  void version.value
  const id = store.menu?.buildingId
  return id === undefined ? undefined : game.state.buildings[id]
})

const ctx = computed<ActionContext | undefined>(() => {
  const b = building.value
  const def = b && findBuilding(b.type)
  if (!b || !def) return undefined
  return {
    game,
    building: b,
    def,
    lockReason: progression.lockReason,
    startMove: (target: PlacedBuilding) => {
      tools.selectMove()
      tools.pickUp(target.id, target.rotation, true)
    },
    showSheet: (target: PlacedBuilding) => selection.selectBuilding(target.id),
  }
})

const title = computed(() => {
  const c = ctx.value
  return c ? (c.def.tiers?.[c.building.tier]?.name ?? c.def.name) : ''
})

const actions = computed(() => {
  const c = ctx.value
  if (!c) return []
  return BUILDING_ACTIONS.filter((action) => action.available?.(c) ?? true).map((action) => ({
    id: action.id,
    label: action.label(c),
    icon: action.icon,
    danger: action.danger ?? false,
    lock: action.lockReason?.(c) ?? null,
    run: () => action.run(c),
  }))
})

/** Posición: junto al cursor, sin salirse de la ventana. */
const position = ref({ left: 0, top: 0 })
function place(): void {
  const menu = store.menu
  const el = sheet.value
  if (!menu) return
  const width = el?.offsetWidth ?? 0
  const height = el?.offsetHeight ?? 0
  position.value = {
    left: Math.max(EDGE, Math.min(menu.x + OFFSET, window.innerWidth - width - EDGE)),
    top: Math.max(EDGE, Math.min(menu.y + OFFSET, window.innerHeight - height - EDGE)),
  }
}
// Se coloca después de pintarse, cuando ya se conoce su tamaño
watch(() => store.menu, place, { flush: 'post' })

// Si el objeto desaparece (demolido), el menú se cierra
watch(
  () => store.menu !== null && building.value === undefined,
  (vanished) => {
    if (vanished) store.close()
  },
)

function choose(action: { lock: string | null; run: () => void }): void {
  if (action.lock) return
  store.close()
  action.run()
}

/** Pulsar fuera de la tarjeta (en el mapa o en otro panel) la cierra. */
function onPointerDown(event: PointerEvent): void {
  if (!store.menu) return
  if (sheet.value && event.target instanceof Node && sheet.value.contains(event.target)) return
  store.close()
}
const close = (): void => store.close()

onMounted(() => {
  window.addEventListener('pointerdown', onPointerDown, true)
  window.addEventListener('wheel', close, { passive: true })
  window.addEventListener('resize', close)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onPointerDown, true)
  window.removeEventListener('wheel', close)
  window.removeEventListener('resize', close)
})
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-150 motion-safe:ease-out"
    enter-from-class="motion-safe:scale-95 motion-safe:opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-100 motion-safe:ease-in"
    leave-to-class="motion-safe:opacity-0"
  >
    <div
      v-if="store.menu && ctx"
      ref="sheet"
      class="fixed z-50 origin-top-left"
      :style="{ left: `${position.left}px`, top: `${position.top}px` }"
      role="menu"
      :aria-label="`Acciones: ${title}`"
      @contextmenu.prevent
    >
      <NotebookSheet class="min-w-52 pt-2 pr-2 pb-2 pl-9">
        <p class="font-hand text-[19px] leading-6 font-bold">{{ title }}</p>
        <ul class="mt-1 flex flex-col">
          <li v-for="action in actions" :key="action.id">
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-2 rounded-sm px-1 text-left font-hand text-[18px] leading-6 focus-visible:outline-2 focus-visible:outline-ink-blue"
              :class="
                action.lock
                  ? 'cursor-not-allowed opacity-45'
                  : action.danger
                    ? 'cursor-pointer text-paper-margin hover:bg-paper-margin/10'
                    : 'cursor-pointer hover:bg-ink-blue/10'
              "
              :aria-disabled="action.lock !== null"
              :title="action.lock ?? undefined"
              @click="choose(action)"
            >
              <AppIcon :name="action.icon" :size="18" />
              <span>{{ action.label }}</span>
            </button>
            <p v-if="action.lock" class="pl-7 text-xs leading-4 opacity-70">{{ action.lock }}</p>
          </li>
        </ul>
      </NotebookSheet>
    </div>
  </Transition>
</template>
