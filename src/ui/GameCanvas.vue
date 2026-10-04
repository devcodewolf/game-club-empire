<script setup lang="ts">
/**
 * Monta el renderer de Pixi y hace de puente con la UI:
 *  - pasa la herramienta activa (Pinia) al renderer
 *  - despacha en la partida los comandos que propone el renderer
 */
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { createGameRenderer, type GameRenderer } from '@/render/createGameRenderer'
import type { Command } from '@/sim/commands'
import type { Game } from '@/sim/game'
import type { TileCoord } from '@/sim/geometry'
import { buildingAt } from '@/sim/map/map'
import { moveTargetAt } from '@/sim/buildings/move'
import { NO_ROOM } from '@/sim/rooms/roomTypes'
import { roomAt } from '@/sim/rooms/rooms'
import { useNoticeStore } from '@/ui/stores/noticeStore'
import { useSelectionStore } from '@/ui/stores/selectionStore'
import { useToolStore } from '@/ui/stores/toolStore'

const props = defineProps<{ game: Game }>()

const toolStore = useToolStore()
const noticeStore = useNoticeStore()
const selectionStore = useSelectionStore()
const host = useTemplateRef('host')
let renderer: GameRenderer | null = null
// Evita la carrera: si se desmonta antes de que termine el init async.
let disposed = false

function onCommand(command: Command): void {
  const result = props.game.dispatch(command)
  // Mover: si se soltó bien, la herramienta vuelve a estar lista para coger otra cosa
  if (result.ok && command.type === 'moveBuilding') toolStore.putDown()
}

/** Herramienta Mover sin nada cogido: coge el objeto o campo de la casilla (una grada coge su campo). */
function onPickUp(tile: TileCoord): void {
  const target = moveTargetAt(props.game.state, tile)
  if (target) toolStore.pickUp(target.id, target.rotation)
}

/** Clic sin herramienta: selecciona el objeto de la casilla (prioridad), si no la sala, si no limpia. */
function onInspect(tile: TileCoord): void {
  const building = buildingAt(props.game.state, tile)
  if (building) return selectionStore.selectBuilding(building.id)
  const roomId = roomAt(props.game.state, tile)
  if (roomId === NO_ROOM) return selectionStore.clear()
  selectionStore.selectRoom(roomId)
}

onMounted(async () => {
  if (!host.value) return

  const created = await createGameRenderer(host.value, props.game, {
    onCommand,
    onCancel: toolStore.cancel,
    onInspect,
    onPickUp,
    onExpansionClick: () =>
      noticeStore.show('🔒', 'Ampliación no disponible todavía. Llegará en una versión futura.'),
  })
  if (disposed) {
    created.destroy()
    return
  }
  renderer = created
  renderer.setTool(toolStore.tool)
})

watch(
  () => toolStore.tool,
  (tool) => renderer?.setTool(tool),
)

onBeforeUnmount(() => {
  disposed = true
  renderer?.destroy()
  renderer = null
})
</script>

<template>
  <div ref="host" class="h-full w-full overflow-hidden" />
</template>
