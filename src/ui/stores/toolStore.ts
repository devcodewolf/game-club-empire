/**
 * Estado de UI de la herramienta activa (construir, pintar suelo, demoler).
 * Setup store de Pinia: estado con `ref`, acciones como funciones.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BuildingTypeId } from '@/sim/buildings/buildings'
import type { RoomTypeId } from '@/sim/rooms/roomTypes'
import type { FloorId } from '@/sim/map/floors'
import { nextRotation, type Rotation } from '@/sim/geometry'
import { NO_TOOL, type Tool } from '@/render/input/tool'
import type { DoorId, WallId } from '@/sim/map/structureTypes'

/** Los cimientos siempre dejan hormigón dentro; el muro es lo único que se elige. */
const FOUNDATION_FLOOR: FloorId = 'concrete'

export const useToolStore = defineStore('tool', () => {
  const tool = ref<Tool>(NO_TOOL)
  /** Se recuerda el último giro para que no se pierda al cambiar de edificio. */
  const rotation = ref<Rotation>(0)

  const activeBuilding = computed(() =>
    tool.value.kind === 'build' || tool.value.kind === 'stand' ? tool.value.buildingType : null,
  )
  const activeFloor = computed(() => (tool.value.kind === 'paintFloor' ? tool.value.floor : null))
  const activeFoundation = computed(() =>
    tool.value.kind === 'foundation' ? tool.value.wall : null,
  )
  const activeWall = computed(() => (tool.value.kind === 'wall' ? tool.value.wall : null))
  const activeDoor = computed(() => (tool.value.kind === 'door' ? tool.value.door : null))

  const activeRoom = computed(() => (tool.value.kind === 'room' ? tool.value.roomType : null))

  /** Elegir el mismo edificio otra vez lo suelta (como un interruptor). */
  function selectBuilding(buildingType: BuildingTypeId): void {
    if (activeBuilding.value === buildingType) return clear()
    tool.value = { kind: 'build', buildingType, rotation: rotation.value }
  }

  /** Gradas: se colocan en el lado de un campo, sin giro. */
  function selectStand(buildingType: BuildingTypeId): void {
    if (activeBuilding.value === buildingType) return clear()
    tool.value = { kind: 'stand', buildingType }
  }

  /** Elegir el mismo suelo otra vez lo suelta. */
  function selectFloor(floor: FloorId): void {
    if (activeFloor.value === floor) return clear()
    tool.value = { kind: 'paintFloor', floor }
  }

  function selectDemolish(): void {
    tool.value = tool.value.kind === 'demolish' ? NO_TOOL : { kind: 'demolish' }
  }

  /** Cimientos con ese muro; elegir los mismos otra vez los suelta. */
  function selectFoundation(wall: WallId): void {
    if (activeFoundation.value === wall) return clear()
    tool.value = { kind: 'foundation', wall, floor: FOUNDATION_FLOOR }
  }

  function selectWall(wall: WallId): void {
    if (activeWall.value === wall) return clear()
    tool.value = { kind: 'wall', wall }
  }

  function selectDoor(door: DoorId): void {
    if (activeDoor.value === door) return clear()
    tool.value = { kind: 'door', door }
  }

  /** Designar salas de ese tipo; elegir el mismo tipo otra vez lo suelta. */
  function selectRoom(roomType: RoomTypeId): void {
    if (activeRoom.value === roomType) return clear()
    tool.value = { kind: 'room', roomType }
  }

  function selectRemoveRoom(): void {
    tool.value = tool.value.kind === 'removeRoom' ? NO_TOOL : { kind: 'removeRoom' }
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
    activeFloor,
    activeFoundation,
    activeWall,
    activeDoor,
    activeRoom,
    selectBuilding,
    selectStand,
    selectFloor,
    selectDemolish,
    selectFoundation,
    selectWall,
    selectDoor,
    selectRoom,
    selectRemoveRoom,
    rotate,
    clear,
  }
})
