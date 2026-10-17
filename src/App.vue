<script setup lang="ts">
import GameCanvas from '@/ui/GameCanvas.vue'
import GameLayout from '@/ui/GameLayout.vue'
import BuildMenu from '@/ui/build-menu/BuildMenu.vue'
import NoticeToasts from '@/ui/components/NoticeToasts.vue'
import HudClock from '@/ui/hud/HudClock.vue'
import HudStats from '@/ui/hud/HudStats.vue'
import ObjectPanel from '@/ui/object-panel/ObjectPanel.vue'
import ContextMenu from '@/ui/context-menu/ContextMenu.vue'
import RoomPanel from '@/ui/room-panel/RoomPanel.vue'
import { provideGame } from '@/ui/composables/useGame'
import { useProgressionStore } from '@/ui/stores/progressionStore'
import { useToolShortcuts } from '@/ui/composables/useToolShortcuts'
import { useGameLoop } from '@/ui/composables/useGameLoop'
import { useTimeShortcuts } from '@/ui/composables/useTimeShortcuts'
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
useGameLoop(game)
useTimeShortcuts(game)
</script>

<template>
  <main class="relative h-full w-full">
    <GameCanvas :game="game" />
    <GameLayout>
      <template #top>
        <!-- Sin capturar el ratón en los huecos: solo las fichas y el reloj reciben clics -->
        <div class="pointer-events-none! grid w-full grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div />
          <div class="flex flex-col items-center gap-2">
            <HudStats />
            <span
              v-if="devMode"
              class="rounded-sm bg-amber-400 px-2 py-0.5 text-xs font-bold text-stone-900"
            >
              MODO DESARROLLO · todo desbloqueado
            </span>
            <NoticeToasts />
          </div>
          <HudClock class="justify-self-end" />
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
