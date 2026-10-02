<script setup lang="ts">
/**
 * Ficha del objeto seleccionado: su nivel actual, la calidad que aporta y,
 * si tiene siguiente nivel, qué cuesta y un botón para mejorarlo.
 * Mismo estilo que la ficha de sala (hoja de libreta).
 */
import { computed, watch } from 'vue'
import { maxTier, tierQuality } from '@/sim/buildings'
import AppIcon from '@/ui/components/AppIcon.vue'
import NotebookSheet from '@/ui/components/NotebookSheet.vue'
import { findBuilding } from '@/ui/composables/contentLookup'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import { useProgressionStore } from '@/ui/stores/progressionStore'
import { useSelectionStore } from '@/ui/stores/selectionStore'

const game = useGame()
const version = useGameVersion()
const selection = useSelectionStore()
const progression = useProgressionStore()

/** Objeto seleccionado; se recalcula cuando cambia la simulación. */
const building = computed(() => {
  void version.value
  const id = selection.selectedBuildingId
  if (id === null) return undefined
  return game.state.buildings[id]
})

const def = computed(() => (building.value ? findBuilding(building.value.type) : undefined))

/** Datos derivados del nivel actual y del siguiente. */
const info = computed(() => {
  const b = building.value
  const d = def.value
  if (!b || !d) return undefined
  const total = maxTier(d) + 1
  const hasTiers = (d.tiers?.length ?? 0) > 1
  const next = hasTiers ? d.tiers?.[b.tier + 1] : undefined
  return {
    title: d.tiers?.[b.tier]?.name ?? d.name,
    hasTiers,
    level: b.tier + 1,
    total,
    quality: tierQuality(d, b.tier),
    next: next && {
      name: next.name,
      cost: next.cost.toLocaleString('es-ES'),
      quality: next.quality,
      lockReason: progression.lockReason(next.requires),
    },
  }
})

/** Estrellitas: ★ llenas hasta el nivel actual, ☆ vacías hasta el máximo. */
const stars = computed(() => {
  const i = info.value
  return i ? '★'.repeat(i.level) + '☆'.repeat(i.total - i.level) : ''
})

// Si el objeto desaparece (demolido), se limpia la selección y la ficha se cierra.
watch(
  () => selection.selectedBuildingId !== null && building.value === undefined,
  (vanished) => {
    if (vanished) selection.clear()
  },
)

function upgrade(): void {
  const id = selection.selectedBuildingId
  if (id === null || info.value?.next?.lockReason) return
  game.dispatch({ type: 'upgradeBuilding', buildingId: id })
}
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
    enter-from-class="motion-safe:translate-x-4 motion-safe:opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-150 motion-safe:ease-in"
    leave-to-class="motion-safe:translate-x-4 motion-safe:opacity-0"
  >
    <NotebookSheet
      v-if="building && def && info"
      role="dialog"
      :aria-label="`Objeto: ${info.title}`"
      class="w-76 pt-2 pr-3 pb-4 pl-10"
    >
      <header class="flex items-start gap-2">
        <h2
          class="flex-1 font-hand text-[30px] leading-[48px] underline decoration-2 underline-offset-4"
        >
          {{ info.title }}
        </h2>
        <AppIcon :name="def.icon" :size="22" class="mt-3 text-ink-blue" />
        <button
          type="button"
          class="mt-2 cursor-pointer rounded px-1.5 py-0.5 font-bold hover:bg-black/10 focus-visible:outline-2"
          aria-label="Cerrar ficha de objeto"
          @click="selection.clear()"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <template v-if="info.hasTiers">
        <p class="font-hand text-[18px] leading-6 text-ink-blue">
          Nivel {{ info.level }} de {{ info.total }}
          <span
            class="ml-1 text-amber-600"
            :aria-label="`${info.level} de ${info.total} estrellas`"
          >
            {{ stars }}
          </span>
        </p>
      </template>
      <p class="font-hand text-[18px] leading-6 text-ink-blue">Calidad: {{ info.quality }}</p>

      <section v-if="info.next" class="mt-2">
        <p class="font-hand text-[20px] leading-6 underline underline-offset-2">Siguiente nivel:</p>
        <p class="font-hand text-[18px] leading-6 text-ink-blue">{{ info.next.name }}</p>
        <p class="font-hand text-[18px] leading-6 text-ink-blue">Coste: {{ info.next.cost }} €</p>
        <p class="font-hand text-[18px] leading-6 text-ink-blue">
          Calidad: {{ info.next.quality }}
        </p>

        <button
          type="button"
          class="mt-3 w-full cursor-pointer border-2 border-[#3b2d6b] bg-[#5a4a9a] px-2 py-1 font-hand text-[17px] text-white shadow-[3px_3px_0_rgba(0,0,0,0.35)] hover:bg-[#6b5ab0] focus-visible:outline-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#5a4a9a]"
          :disabled="info.next.lockReason !== null"
          @click="upgrade"
        >
          Mejorar a {{ info.next.name }}
        </button>
        <p v-if="info.next.lockReason" class="mt-1 font-hand text-[16px] leading-5 text-red-700">
          {{ info.next.lockReason }}
        </p>
      </section>

      <p v-else-if="info.hasTiers" class="mt-3 font-hand text-[20px] leading-6 text-green-700">
        Nivel máximo ★
      </p>
      <p v-else class="mt-3 font-hand text-[18px] leading-6 text-ink-blue">
        Este objeto no tiene mejoras
      </p>
    </NotebookSheet>
  </Transition>
</template>
