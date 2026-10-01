/**
 * Estado de UI de la herramienta activa (construir, demoler, comprar parcela).
 * Setup store de Pinia: estado con `ref`, acciones como funciones.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BuildingTypeId } from '@/sim/buildings'
import { nextRotation, type Rotation } from '@/sim/geometry'
import { NO_TOOL, type Tool } from '@/render/tool'

export const useToolStore = defineStore('tool', () => {
  const tool = ref<Tool>(NO_TOOL)
  /** Se recuerda el último giro para que no se pierda al cambiar de edificio. */
  const rotation = ref<Rotation>(0)

  const activeBuilding = computed(() =>
    tool.value.kind === 'build' ? tool.value.buildingType : null,
  )

  /** Elegir el mismo edificio otra vez lo suelta (como un interruptor). */
  function selectBuilding(buildingType: BuildingTypeId): void {
    if (activeBuilding.value === buildingType) return clear()
    tool.value = { kind: 'build', buildingType, rotation: rotation.value }
  }

  function selectDemolish(): void {
    tool.value = tool.value.kind === 'demolish' ? NO_TOOL : { kind: 'demolish' }
  }

  function selectBuyParcel(): void {
    tool.value = tool.value.kind === 'buyParcel' ? NO_TOOL : { kind: 'buyParcel' }
  }

  function rotate(): void {
    rotation.value = nextRotation(rotation.value)
    if (tool.value.kind !== 'build') return
    tool.value = { ...tool.value, rotation: rotation.value }
  }

  function clear(): void {
    tool.value = NO_TOOL
  }

  return {
    tool,
    rotation,
    activeBuilding,
    selectBuilding,
    selectDemolish,
    selectBuyParcel,
    rotate,
    clear,
  }
})
