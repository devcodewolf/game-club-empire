<script setup lang="ts">
// Monta el renderer de Pixi en un div que ocupa todo el padre.
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { createGameRenderer, type GameRenderer } from '@/render/createGameRenderer'
import { MAP_SIZE } from '@/content/map'

const host = useTemplateRef('host')
let renderer: GameRenderer | null = null
// Evita la carrera: si se desmonta antes de que termine el init async.
let disposed = false

onMounted(async () => {
  if (!host.value) return

  const created = await createGameRenderer(host.value, MAP_SIZE)
  if (disposed) {
    created.destroy()
    return
  }
  renderer = created
})

onBeforeUnmount(() => {
  disposed = true
  renderer?.destroy()
  renderer = null
})
</script>

<template>
  <div ref="host" class="h-full w-full overflow-hidden" />
</template>
