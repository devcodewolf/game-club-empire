<script setup lang="ts">
import GameCanvas from '@/ui/GameCanvas.vue'
import GameLayout from '@/ui/GameLayout.vue'
import BuildMenu from '@/ui/build-menu/BuildMenu.vue'
import NoticeToasts from '@/ui/components/NoticeToasts.vue'
import ObjectPanel from '@/ui/object-panel/ObjectPanel.vue'
import ContextMenu from '@/ui/context-menu/ContextMenu.vue'
import RoomPanel from '@/ui/room-panel/RoomPanel.vue'
import { provideGame } from '@/ui/composables/useGame'
import { useProgressionStore } from '@/ui/stores/progressionStore'
import { useToolShortcuts } from '@/ui/composables/useToolShortcuts'
import { markRaw } from 'vue'
import { GAME_CONTENT } from '@/content/gameContent'
import { MAP_CONFIG } from '@/content/map'
import { createGame } from '@/sim/game'

// markRaw: la simulación no debe ser reactiva (Vue la envolvería en Proxies
// y cada lectura del estado sería más lenta). La UI se entera por eventos.
const game = markRaw(createGame(MAP_CONFIG, GAME_CONTENT))

provideGame(game)
const { devMode } = useProgressionStore()
useToolShortcuts()
</script>

<template>
  <main class="relative h-full w-full">
    <GameCanvas :game="game" />
    <GameLayout>
      <template #top>
        <div class="flex flex-col items-center gap-2">
          <span class="pointer-events-none! text-sm font-bold text-amber-400">Grassroots</span>
          <span
            v-if="devMode"
            class="pointer-events-none! rounded-sm bg-amber-400 px-2 py-0.5 text-xs font-bold text-stone-900"
          >
            MODO DESARROLLO · todo desbloqueado
          </span>
          <NoticeToasts />
        </div>
      </template>
      <template #right>
        <RoomPanel />
        <ObjectPanel />
      </template>
      <template #bottom>
        <BuildMenu />
      </template>
    </GameLayout>
    <ContextMenu />
  </main>
</template>
