/** Selección del jugador en el mapa (por ahora, una sala). */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RoomId } from '@/sim/roomTypes'

export const useSelectionStore = defineStore('selection', () => {
  const selectedRoomId = ref<RoomId | null>(null)

  function select(id: RoomId): void {
    selectedRoomId.value = id
  }

  function clear(): void {
    selectedRoomId.value = null
  }

  return { selectedRoomId, select, clear }
})
