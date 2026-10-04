<script setup lang="ts">
/**
 * Ficha de la sala seleccionada, estilo "carpeta del míster": muestra si está
 * operativa, qué le falta y permite quitar su designación.
 */
import { computed, watch } from 'vue'
import { evaluateRoom } from '@/sim/rooms/rooms'
import AppIcon from '@/ui/components/AppIcon.vue'
import NotebookSheet from '@/ui/components/NotebookSheet.vue'
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

const qualityText = computed(() => (status.value ? `Calidad: ${status.value.quality}` : null))

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
    <NotebookSheet
      v-if="exists && status && def"
      role="dialog"
      :aria-label="`Sala: ${def.name}`"
      class="w-76 pt-2 pr-3 pb-4 pl-10"
    >
      <!-- Título manuscrito subrayado, como las notas de Prison Architect -->
      <header class="flex items-start gap-2">
        <h2
          class="flex-1 font-hand text-[30px] leading-[48px] underline decoration-2 underline-offset-4"
        >
          {{ def.name }}
        </h2>
        <AppIcon :name="def.icon" :size="22" class="mt-3 text-ink-blue" />
        <button
          type="button"
          class="mt-2 cursor-pointer rounded px-1.5 py-0.5 font-bold hover:bg-black/10 focus-visible:outline-2"
          aria-label="Cerrar ficha de sala"
          @click="selection.clear()"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <!-- Sello de estado, ligeramente torcido -->
      <p
        class="my-1 w-fit -rotate-2 border-2 px-2 font-hand text-[18px] leading-[22px] tracking-wide uppercase"
        :class="status.ok ? 'border-green-700 text-green-700' : 'border-red-700 text-red-700'"
      >
        {{ status.ok ? 'Operativa' : 'Incompleta' }}
      </p>

      <RoomChecklist :entries="entries" />

      <p v-if="capacityText" class="font-hand text-[18px] leading-6 text-ink-blue">
        {{ capacityText }}
      </p>
      <p v-if="qualityText" class="font-hand text-[18px] leading-6 text-ink-blue">
        {{ qualityText }}
      </p>

      <button
        type="button"
        class="mt-3 w-full cursor-pointer border-2 border-[#3b2d6b] bg-[#5a4a9a] px-2 py-1 font-hand text-[17px] text-white shadow-[3px_3px_0_rgba(0,0,0,0.35)] hover:bg-[#6b5ab0] focus-visible:outline-2 focus-visible:outline-ink"
        @click="removeRoom"
      >
        Quitar sala
      </button>
    </NotebookSheet>
  </Transition>
</template>
