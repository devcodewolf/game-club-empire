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
import type { TileCoord, TileRect } from '@/sim/geometry'
import { buildingAt } from '@/sim/map/map'
import { moveTargetAt } from '@/sim/buildings/move'
import { planBlockMove, type BlockMoveError } from '@/sim/map/moveBlock'
import { NO_ROOM } from '@/sim/rooms/roomTypes'
import { roomAt } from '@/sim/rooms/rooms'
import { useNoticeStore } from '@/ui/stores/noticeStore'
import { useSelectionStore } from '@/ui/stores/selectionStore'
import { useToolStore } from '@/ui/stores/toolStore'
import { useContextMenuStore } from '@/ui/context-menu/contextMenuStore'

const props = defineProps<{ game: Game }>()

const toolStore = useToolStore()
const noticeStore = useNoticeStore()
const selectionStore = useSelectionStore()
const contextMenu = useContextMenuStore()
const host = useTemplateRef('host')
let renderer: GameRenderer | null = null
// Evita la carrera: si se desmonta antes de que termine el init async.
let disposed = false

function onCommand(command: Command): void {
  const result = props.game.dispatch(command)
  if (!result.ok && result.reason === 'notEnoughMoney') {
    noticeStore.show('💸', 'No hay dinero suficiente para esta obra.')
  }
  // Mover: si se soltó bien, la herramienta vuelve a estar lista para coger otra cosa
  if (result.ok && (command.type === 'moveBuilding' || command.type === 'moveBlock')) {
    toolStore.putDown()
  }
}

/** Avisos al seleccionar un bloque que no se puede coger. */
const BLOCK_REFUSALS: Partial<Record<BlockMoveError, string>> = {
  nothingToMove: 'No hay nada construido en esa zona.',
  cutsObject: 'La selección corta un objeto: amplíala para que entre entero.',
  cutsRoom: 'La selección corta una sala: amplíala para que entre entera.',
}

/** Mover bloque: coge lo seleccionado si se puede mover entero; si no, avisa por qué. */
function onBlockSelected(rect: TileRect): void {
  const check = planBlockMove(props.game.state, props.game.content, rect, rect, 0)
  const refusal = check.ok ? undefined : BLOCK_REFUSALS[check.reason]
  if (refusal) return noticeStore.show('✋', refusal)
  toolStore.pickUpBlock(rect)
}

/** Clic derecho sin herramienta: menú del objeto de la casilla (o cierra el que hubiera). */
function onContextMenu(tile: TileCoord, client: { x: number; y: number }): void {
  const building = buildingAt(props.game.state, tile)
  if (!building) return contextMenu.close()
  contextMenu.open(building.id, client.x, client.y)
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
    onContextMenu,
    onBlockSelected,
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
