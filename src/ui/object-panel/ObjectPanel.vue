<script setup lang="ts">
/**
 * Ficha del objeto seleccionado: su nivel actual, la calidad que aporta y,
 * si tiene siguiente nivel, qué cuesta y un botón para mejorarlo.
 * Mismo estilo que la ficha de sala (hoja de libreta).
 */
import { formatNumber } from '@/render/core/formatNumber'
import { computed, watch } from 'vue'
import { maxTier, tierQuality, type PitchRole } from '@/sim/buildings/buildings'
import { buildingMaintenance, pitchRentalPerDay } from '@/sim/economy/recurring'
import { pitchMaxCondition } from '@/sim/economy/staff'
import {
  buildingRepairCost,
  pitchCondition,
  pitchRepairCost,
  pitchResting,
} from '@/sim/economy/upkeep'
import { pitchCapacity, standCapacity } from '@/sim/buildings/stands'
import AppIcon from '@/ui/components/AppIcon.vue'
import NotebookSheet from '@/ui/components/NotebookSheet.vue'
import { findBuilding } from '@/ui/composables/contentLookup'
import { formatEuros } from '@/ui/composables/formatMoney'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import { upgradeLock } from '@/ui/composables/upgradeLock'
import { useNoticeStore } from '@/ui/stores/noticeStore'
import { formatDay } from '@/ui/time/formatTime'
import { useProgressionStore } from '@/ui/stores/progressionStore'
import { useSelectionStore } from '@/ui/stores/selectionStore'

const game = useGame()
const version = useGameVersion()
const selection = useSelectionStore()
const progression = useProgressionStore()
const notices = useNoticeStore()

/** Objeto seleccionado; se recalcula cuando cambia la simulación. */
const building = computed(() => {
  void version.value
  const id = selection.selectedBuildingId
  if (id === null) return undefined
  return game.state.buildings[id]
})

const def = computed(() => (building.value ? findBuilding(building.value.type) : undefined))

/** Aforo de un campo: la suma de sus gradas (solo campos). */
const pitchSeats = computed(() => {
  const b = building.value
  if (!b || !def.value?.pitch) return undefined
  return formatNumber(pitchCapacity(game.state, game.content, b.id))
})

/** Aforo actual y del siguiente nivel, solo para gradas. */
const standInfo = computed(() => {
  const b = building.value
  const d = def.value
  if (!b || !d?.stand) return undefined
  const next = b.tier + 1
  const fmt = formatNumber
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
  // División y, en las gradas, sitio detrás para crecer (igual que el menú contextual)
  const { next, reason: lockReason } = upgradeLock(game, b, d, progression.lockReason)
  return {
    title: d.tiers?.[b.tier]?.name ?? d.name,
    hasTiers,
    level: b.tier + 1,
    total,
    quality: tierQuality(d, b.tier),
    next: next && {
      name: next.name,
      cost: formatNumber(next.cost),
      quality: next.quality,
      lockReason,
    },
  }
})

/** Mantenimiento semanal del objeto (césped en los campos). */
const maintenance = computed(() => {
  const b = building.value
  const d = def.value
  if (!b || !d) return undefined
  return buildingMaintenance(game.content, d, b)
})

/** Alquiler del campo: activado y lo que daría por día. */
const rental = computed(() => {
  const b = building.value
  const d = def.value
  if (!b || !d?.pitch) return undefined
  return { on: Boolean(b.rental), perDay: pitchRentalPerDay(game.content, d, b) }
})

/** Estado del césped de un campo: valor, máximo, color y descanso tras reparar. */
const pitchState = computed(() => {
  const b = building.value
  const d = def.value
  if (!b || !d?.pitch) return undefined
  const value = Math.round(pitchCondition(game.content, d, b))
  const max = pitchMaxCondition(game.content, d, b.tier)
  const resting = pitchResting(game.state, b)
  return {
    value,
    max,
    color: value >= 70 ? 'bg-green-600' : value >= 40 ? 'bg-amber-500' : 'bg-red-600',
    repairCost: pitchRepairCost(game.content, d, b),
    resting,
    restUntil: formatDay(b.restUntil ?? 0),
  }
})

/** Avería del objeto (los campos y gradas no se averían). */
const breakdown = computed(() => {
  const b = building.value
  const d = def.value
  if (!b?.broken || !d) return undefined
  return { cost: buildingRepairCost(game.content, d, b) }
})

/** Lanza una reparación de pago; sin fondos avisa. */
function repair(type: 'repairPitch' | 'repairBuilding'): void {
  const id = selection.selectedBuildingId
  if (id === null) return
  const result = game.dispatch({ type, buildingId: id })
  if (!result.ok && result.reason === 'notEnoughMoney')
    notices.show('💸', 'No hay dinero suficiente para esta reparación.')
}

function toggleRental(): void {
  const id = selection.selectedBuildingId
  if (id === null || !rental.value) return
  game.dispatch({ type: 'setPitchRental', buildingId: id, rental: !rental.value.on })
}

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
      <p v-if="maintenance !== undefined" class="font-hand text-[18px] leading-6 text-ink-blue">
        {{ rental ? 'Césped' : 'Mantenimiento' }}: {{ formatEuros(maintenance) }}/semana
      </p>
      <p v-if="standInfo" class="font-hand text-[18px] leading-6 text-ink-blue">
        Aforo: {{ standInfo.capacity }} espectadores
      </p>

      <p v-if="pitchSeats" class="font-hand text-[18px] leading-6 text-ink-blue">
        Aforo: {{ pitchSeats }} espectadores
      </p>

      <section v-if="pitchState" class="mt-2" aria-label="Estado del césped">
        <p class="font-hand text-[18px] leading-6 text-ink-blue">
          Estado:
          <span class="font-data text-sm font-bold tabular-nums"
            >{{ pitchState.value }} / {{ pitchState.max }}</span
          >
        </p>
        <div
          class="relative h-3.5 border-2 border-ink bg-black/10"
          role="progressbar"
          aria-label="Estado del césped"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="pitchState.value"
        >
          <div
            class="h-full motion-safe:transition-[width] motion-safe:duration-300"
            :class="pitchState.color"
            :style="{ width: `${pitchState.value}%` }"
          />
          <!-- Marca del máximo de su superficie -->
          <div
            class="absolute -top-1 -bottom-1 w-0.5 bg-ink"
            :style="{ left: `${pitchState.max}%` }"
            aria-hidden="true"
          />
        </div>
        <p class="font-hand text-[15px] leading-5 text-ink-blue">
          Baja con la lluvia, los partidos y los alquileres; el jardinero lo recupera cada noche.
        </p>
        <p v-if="pitchState.resting" class="font-hand text-[16px] leading-5 text-amber-700">
          Descansando: sin alquilar hasta el {{ pitchState.restUntil }}
        </p>
        <button
          type="button"
          class="mt-2 w-full cursor-pointer border-2 border-[#2b6328] bg-[#3f8f3a] px-2 py-1 font-hand text-[17px] text-white shadow-[3px_3px_0_rgba(0,0,0,0.35)] hover:bg-[#4aa044] focus-visible:outline-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#3f8f3a]"
          :disabled="pitchState.resting"
          @click="repair('repairPitch')"
        >
          Reparar el césped ({{ formatEuros(pitchState.repairCost) }})
        </button>
      </section>

      <section v-if="breakdown" class="mt-2" aria-label="Avería">
        <p class="flex items-center gap-1 font-hand text-[18px] leading-6 text-red-700">
          <AppIcon name="tool" :size="18" />
          Averiado: no cuenta para su sala
        </p>
        <button
          type="button"
          class="mt-1 w-full cursor-pointer border-2 border-[#7c241d] bg-[#b0372d] px-2 py-1 font-hand text-[17px] text-white shadow-[3px_3px_0_rgba(0,0,0,0.35)] hover:bg-[#c2433a] focus-visible:outline-2 focus-visible:outline-ink"
          @click="repair('repairBuilding')"
        >
          Reparar ({{ formatEuros(breakdown.cost) }})
        </button>
      </section>

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

      <section v-if="rental" class="mt-2">
        <button
          type="button"
          role="switch"
          :aria-checked="rental.on"
          class="flex w-full cursor-pointer items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-ink"
          @click="toggleRental"
        >
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center border-2 border-ink font-hand text-[16px] leading-none"
            :class="rental.on ? 'bg-amber-300' : 'bg-transparent'"
            aria-hidden="true"
            >{{ rental.on ? '✓' : '' }}</span
          >
          <span class="font-hand text-[18px] leading-6">Alquilar a equipos del pueblo</span>
        </button>
        <p class="font-hand text-[15px] leading-5 text-ink-blue">
          +{{ formatEuros(rental.perDay) }}/día, salvo domingos
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
