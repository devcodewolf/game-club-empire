<script setup lang="ts">
import GameCanvas from '@/ui/GameCanvas.vue'
import GameLayout from '@/ui/GameLayout.vue'
import BuildBar from '@/ui/BuildBar.vue'
import { useToolShortcuts } from '@/ui/composables/useToolShortcuts'
import { markRaw } from 'vue'
import { BUILDINGS } from '@/content/buildings'
import { MAP_CONFIG } from '@/content/map'
import { createGame } from '@/sim/game'

// markRaw: la simulación no debe ser reactiva (Vue la envolvería en Proxies
// y cada lectura del estado sería más lenta). La UI se entera por eventos.
const game = markRaw(createGame(MAP_CONFIG, BUILDINGS))

useToolShortcuts()
</script>

<template>
  <main class="relative h-full w-full">
    <GameCanvas :game="game" />
    <GameLayout>
      <template #top>
        <span class="pointer-events-none! text-sm font-bold text-amber-400">Grassroots</span>
      </template>
      <template #bottom>
        <BuildBar />
      </template>
    </GameLayout>
  </main>
</template>
