<script setup lang="ts">
/**
 * Ficha del objeto seleccionado: su nivel actual, la calidad que aporta y,
 * si tiene siguiente nivel, qué cuesta y un botón para mejorarlo.
 * Mismo estilo que la ficha de sala (hoja de libreta).
 */
import { computed, watch } from 'vue'
import { maxTier, tierQuality, type PitchRole, type StandSlot } from '@/sim/buildings/buildings'
import { lowestNeighbour, pitchCapacity, standCapacity, validateStandUpgrade } from '@/sim/buildings/stands'
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

/** Nombre en español de cada lado, para los avisos de córner. */
const SIDE_NAMES: Partial<Record<StandSlot, string>> = {
  north: 'norte',
  south: 'sur',
  east: 'este',
  west: 'oeste',
}

/** Motivo por el que no se puede ampliar una grada (franja nueva ocupada o fuera del terreno). */
function standUpgradeBlock(tier: number): string | null {
  const b = building.value
  if (!b) return null
  const check = validateStandUpgrade(game.state, game.content, b, tier)
  if (check.ok) return null
  if (check.reason === 'occupied' || check.reason === 'wall') {
    return 'Hay algo construido detrás de la grada'
  }
  if (check.reason === 'outOfBounds' || check.reason === 'reserved') {
    return 'La grada no cabe: llega al borde del terreno'
  }
  if (check.reason === 'needsNeighbours') return 'Le falta una grada vecina'
  if (check.reason === 'cornerAboveNeighbours' && b.attach) {
    const lowest = lowestNeighbour(game.state, b.attach.pitchId, b.attach.slot)
    const name = lowest && SIDE_NAMES[lowest]
    return name ? `Mejora antes la grada ${name}` : null
  }
  return null
}

/** Aforo de un campo: la suma de sus gradas (solo campos). */
const pitchSeats = computed(() => {
  const b = building.value
  if (!b || !def.value?.pitch) return undefined
  return pitchCapacity(game.state, game.content, b.id).toLocaleString('es-ES')
})

/** Aforo actual y del siguiente nivel, solo para gradas. */
const standInfo = computed(() => {
  const b = building.value
  const d = def.value
  if (!b || !d?.stand) return undefined
  const next = b.tier + 1
  const fmt = (n: number) => n.toLocaleString('es-ES')
  return {
    capacity: fmt(standCapacity(d, b)),
    nextCapacity:
      d.stand.capacityPerTile[next] === undefined
        ? null
        : fmt(standCapacity(d, { ...b, tier: next })),
  }
})

/** Datos derivados del nivel actual y del siguiente. */
const info = computed(() => {
  const b = building.value
  const d = def.value
  if (!b || !d) return undefined
  const total = maxTier(d) + 1
  const hasTiers = (d.tiers?.length ?? 0) > 1
  const next = hasTiers ? d.tiers?.[b.tier + 1] : undefined
  const divisionLock = next ? progression.lockReason(next.requires) : null
  // Las gradas además necesitan sitio detrás para crecer.
  const lockReason = divisionLock ?? (next && d.stand ? standUpgradeBlock(b.tier + 1) : null)
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
      lockReason,
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

/** Usos posibles de un campo, en el orden en que se muestran. */
const PITCH_ROLES: readonly { readonly id: PitchRole; readonly label: string }[] = [
  { id: 'main', label: 'Principal' },
  { id: 'reserve', label: 'Filial' },
  { id: 'training', label: 'Entrenamiento' },
]

/** Uso actual del campo seleccionado (`undefined` si no es un campo). */
const currentRole = computed(() =>
  def.value?.pitch ? (building.value?.role ?? 'training') : undefined,
)

/** Cambia el uso del campo; si ya es el actual no hace nada. */
function setRole(role: PitchRole): void {
  const id = selection.selectedBuildingId
  if (id === null || role === currentRole.value) return
  game.dispatch({ type: 'setPitchRole', buildingId: id, role })
}

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
      <p v-if="standInfo" class="font-hand text-[18px] leading-6 text-ink-blue">
        Aforo: {{ standInfo.capacity }} espectadores
      </p>

      <p v-if="pitchSeats" class="font-hand text-[18px] leading-6 text-ink-blue">
        Aforo: {{ pitchSeats }} espectadores
      </p>

      <section v-if="currentRole" class="mt-2">
        <p
          id="pitch-role-label"
          class="font-hand text-[20px] leading-6 underline underline-offset-2"
        >
          Uso del campo:
        </p>
        <div role="radiogroup" aria-labelledby="pitch-role-label" class="mt-1 flex gap-1">
          <button
            v-for="option in PITCH_ROLES"
            :key="option.id"
            type="button"
            role="radio"
            :aria-checked="currentRole === option.id"
            class="flex-1 cursor-pointer border-2 border-ink px-1 py-0.5 font-hand text-[16px] leading-5 focus-visible:outline-2 focus-visible:outline-ink"
            :class="
              currentRole === option.id
                ? 'bg-amber-300 font-bold shadow-[2px_2px_0_rgba(0,0,0,0.35)]'
                : 'bg-transparent hover:bg-black/10'
            "
            @click="setRole(option.id)"
          >
            {{ option.label }}
          </button>
        </div>
        <p class="mt-1 font-hand text-[15px] leading-5 text-ink-blue">
          Solo puede haber un campo principal.
        </p>
      </section>

      <section v-if="info.next" class="mt-2">
        <p class="font-hand text-[20px] leading-6 underline underline-offset-2">Siguiente nivel:</p>
        <p class="font-hand text-[18px] leading-6 text-ink-blue">{{ info.next.name }}</p>
        <p class="font-hand text-[18px] leading-6 text-ink-blue">Coste: {{ info.next.cost }} €</p>
        <p class="font-hand text-[18px] leading-6 text-ink-blue">
          Calidad: {{ info.next.quality }}
        </p>
        <p v-if="standInfo?.nextCapacity" class="font-hand text-[18px] leading-6 text-ink-blue">
          Aforo: {{ standInfo.nextCapacity }} espectadores
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
