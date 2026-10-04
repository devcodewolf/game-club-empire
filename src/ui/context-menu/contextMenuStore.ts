/** Menú contextual abierto (clic derecho sobre un objeto): para qué objeto y dónde. */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BuildingId } from '@/sim/buildings/buildings'

export interface ContextMenuState {
  readonly buildingId: BuildingId
  /** Posición del clic en la ventana (px CSS). */
  readonly x: number
  readonly y: number
}

export const useContextMenuStore = defineStore('contextMenu', () => {
  const menu = ref<ContextMenuState | null>(null)

  function open(buildingId: BuildingId, x: number, y: number): void {
    menu.value = { buildingId, x, y }
  }

  function close(): void {
    menu.value = null
  }

  return { menu, open, close }
})
