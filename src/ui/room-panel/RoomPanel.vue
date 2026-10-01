<script setup lang="ts">
/**
 * Ficha de la sala seleccionada, estilo "carpeta del míster": muestra si está
 * operativa, qué le falta y permite quitar su designación.
 */
import { computed, watch } from 'vue'
import { evaluateRoom } from '@/sim/rooms'
import AppIcon from '@/ui/components/AppIcon.vue'
import { buildingName, findRoom } from '@/ui/composables/contentLookup'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import { useSelectionStore } from '@/ui/stores/selectionStore'
import RoomChecklist, { type ChecklistEntry } from '@/ui/room-panel/RoomChecklist.vue'

const game = useGame()
const version = useGameVersion()
const selection = useSelectionStore()

/** Estado de la sala; se recalcula cuando cambia la simulación. */
const status = computed(() => {
  void version.value
  const id = selection.selectedRoomId
  if (id === null) return undefined
  return evaluateRoom(game.state, game.content, id)
})

const def = computed(() => (status.value ? findRoom(status.value.type) : undefined))

const entries = computed<ChecklistEntry[]>(() => {
  const s = status.value
  const d = def.value
  if (!s || !d) return []
  const requirements = d.requirements.map((req) => ({
    key: req.object,
    label: `${buildingName(req.object)}: ${s.objects[req.object] ?? 0}/${req.min}`,
    done: (s.objects[req.object] ?? 0) >= req.min,
  }))
  return [
    { key: 'enclosed', label: 'Cerrada por muros', done: s.enclosed },
    { key: 'door', label: 'Tiene puerta', done: s.hasDoor },
    {
      key: 'size',
      label: `Tamaño mínimo ${d.minSize.width}×${d.minSize.height} (actual ${s.bounds.width}×${s.bounds.height})`,
      done: !s.tooSmall,
    },
    ...requirements,
  ]
})

const capacityText = computed(() => {
  const s = status.value
  const unit = def.value?.capacity?.unit
  if (!s || !unit) return null
  return `Capacidad: ${s.capacity} ${unit}`
})

// Si la sala deja de existir, se limpia la selección y el panel se cierra.
const exists = computed(() => status.value !== undefined)
watch(
  () => selection.selectedRoomId !== null && !exists.value,
  (vanished) => {
    if (vanished) selection.clear()
  },
)

function removeRoom(): void {
  const tile = status.value?.tiles[0]
  if (!tile) return
  game.dispatch({ type: 'removeRoom', tile })
  selection.clear()
}
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
    enter-from-class="motion-safe:translate-x-4 motion-safe:opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-150 motion-safe:ease-in"
    leave-to-class="motion-safe:translate-x-4 motion-safe:opacity-0"
  >
    <section
      v-if="exists && status && def"
      role="dialog"
      :aria-label="`Sala: ${def.name}`"
      class="flex w-70 flex-col gap-3 border-2 border-[#2e2a26] bg-[#f2e6c9] p-3 text-[#2e2a26] shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
    >
      <header class="flex items-center gap-2">
        <AppIcon :name="def.icon" :size="22" />
        <h2 class="flex-1 text-base font-bold">{{ def.name }}</h2>
        <button
          type="button"
          class="cursor-pointer rounded p-1 hover:bg-black/10 focus-visible:outline-2"
          aria-label="Cerrar ficha de sala"
          @click="selection.clear()"
        >
          <span aria-hidden="true" class="block px-1 leading-none font-bold">✕</span>
        </button>
      </header>

      <span
        class="w-fit rounded border-2 px-2 py-0.5 text-xs font-bold text-white"
        :class="status.ok ? 'border-green-900 bg-green-700' : 'border-red-900 bg-red-700'"
      >
        {{ status.ok ? 'Operativa' : 'Incompleta' }}
      </span>

      <RoomChecklist :entries="entries" />

      <p v-if="capacityText" class="text-sm font-bold">{{ capacityText }}</p>

      <button
        type="button"
        class="w-fit cursor-pointer rounded border-2 border-red-900 bg-red-700 px-2 py-1 text-xs font-bold text-white hover:bg-red-600 focus-visible:outline-2"
        @click="removeRoom"
      >
        Quitar sala
      </button>
    </section>
  </Transition>
</template>
