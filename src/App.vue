<script setup lang="ts">
import GameCanvas from '@/ui/GameCanvas.vue'
import GameLayout from '@/ui/GameLayout.vue'
import BuildMenu from '@/ui/build-menu/BuildMenu.vue'
import NoticeToasts from '@/ui/components/NoticeToasts.vue'
import { useToolShortcuts } from '@/ui/composables/useToolShortcuts'
import { markRaw } from 'vue'
import { BUILDINGS } from '@/content/buildings'
import { DOORS } from '@/content/doors'
import { FLOORS } from '@/content/floors'
import { MAP_CONFIG } from '@/content/map'
import { WALLS } from '@/content/walls'
import { createGame } from '@/sim/game'

// markRaw: la simulación no debe ser reactiva (Vue la envolvería en Proxies
// y cada lectura del estado sería más lenta). La UI se entera por eventos.
const game = markRaw(
  createGame(MAP_CONFIG, { buildings: BUILDINGS, floors: FLOORS, walls: WALLS, doors: DOORS }),
)

useToolShortcuts()
</script>

<template>
  <main class="relative h-full w-full">
    <GameCanvas :game="game" />
    <GameLayout>
      <template #top>
        <div class="flex flex-col items-center gap-2">
          <span class="pointer-events-none! text-sm font-bold text-amber-400">Grassroots</span>
          <NoticeToasts />
        </div>
      </template>
      <template #bottom>
        <BuildMenu />
      </template>
    </GameLayout>
  </main>
</template>
