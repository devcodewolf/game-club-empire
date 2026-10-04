/** Selección del jugador en el mapa: una sala o un objeto (solo una cosa a la vez). */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BuildingId } from '@/sim/buildings/buildings'
import type { RoomId } from '@/sim/rooms/roomTypes'

export type Selection = { kind: 'room'; id: RoomId } | { kind: 'building'; id: BuildingId }

export const useSelectionStore = defineStore('selection', () => {
  const selection = ref<Selection | null>(null)

  const selectedRoomId = computed<RoomId | null>(() =>
    selection.value?.kind === 'room' ? selection.value.id : null,
  )
  const selectedBuildingId = computed<BuildingId | null>(() =>
    selection.value?.kind === 'building' ? selection.value.id : null,
  )

  function selectRoom(id: RoomId): void {
    selection.value = { kind: 'room', id }
  }

  function selectBuilding(id: BuildingId): void {
    selection.value = { kind: 'building', id }
  }

  function clear(): void {
    selection.value = null
  }

  return { selection, selectedRoomId, selectedBuildingId, selectRoom, selectBuilding, clear }
})
