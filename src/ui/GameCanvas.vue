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
import { NO_ROOM } from '@/sim/roomTypes'
import { roomAt } from '@/sim/rooms'
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
  props.game.dispatch(command)
}

/** Clic sin herramienta: selecciona la sala de la casilla o limpia la selección. */
function onInspect(tile: TileCoord): void {
  const roomId = roomAt(props.game.state, tile)
  if (roomId === NO_ROOM) return selectionStore.clear()
  selectionStore.select(roomId)
}

onMounted(async () => {
  if (!host.value) return

  const created = await createGameRenderer(host.value, props.game, {
    onCommand,
    onCancel: toolStore.clear,
    onInspect,
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
