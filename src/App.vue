<script setup lang="ts">
import GameCanvas from '@/ui/GameCanvas.vue'
import GameLayout from '@/ui/GameLayout.vue'
import BuildMenu from '@/ui/build-menu/BuildMenu.vue'
import NoticeToasts from '@/ui/components/NoticeToasts.vue'
import HudClock from '@/ui/hud/HudClock.vue'
import HudStats from '@/ui/hud/HudStats.vue'
import MatchChip from '@/ui/hud/MatchChip.vue'
import UndoChip from '@/ui/hud/UndoChip.vue'
import WeeklyReportNote from '@/ui/hud/WeeklyReportNote.vue'
import { useAccountsStore } from '@/ui/stores/accountsStore'
import { useMatchStore } from '@/ui/stores/matchStore'
import MatchResult from '@/ui/match/MatchResult.vue'
import ObjectPanel from '@/ui/object-panel/ObjectPanel.vue'
import ContextMenu from '@/ui/context-menu/ContextMenu.vue'
import RoomPanel from '@/ui/room-panel/RoomPanel.vue'
import ReportsButton from '@/ui/reports/ReportsButton.vue'
import ReportsFolder from '@/ui/reports/ReportsFolder.vue'
import { provideGame } from '@/ui/composables/useGame'
import { detectTestMoney, useProgressionStore } from '@/ui/stores/progressionStore'
import { useToolShortcuts } from '@/ui/composables/useToolShortcuts'
import { useGameLoop } from '@/ui/composables/useGameLoop'
import { useTimeShortcuts } from '@/ui/composables/useTimeShortcuts'
import { markRaw, onBeforeUnmount } from 'vue'
import { GAME_CONTENT } from '@/content/gameContent'
import { MAP_CONFIG } from '@/content/map'
import { createGame } from '@/sim/game'
import { START_SCENARIO } from '@/content/start'

// markRaw: la simulación no debe ser reactiva (Vue la envolvería en Proxies
// y cada lectura del estado sería más lenta). La UI se entera por eventos.
// `?infinite` o `?money=N` en la URL: dinero de pruebas (ver `detectTestMoney`)
const testMoney = detectTestMoney()
const game = markRaw(
  createGame(MAP_CONFIG, GAME_CONTENT, { scenario: START_SCENARIO, money: testMoney }),
)

provideGame(game)
onBeforeUnmount(useAccountsStore().listen(game))
onBeforeUnmount(useMatchStore().listen(game))
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
            <UndoChip />
            <span
              v-if="devMode"
              class="rounded-sm bg-amber-400 px-2 py-0.5 text-xs font-bold text-stone-900"
            >
              MODO DESARROLLO · todo desbloqueado{{ testMoney ? ' · dinero de pruebas' : '' }}
            </span>
          </div>
          <!-- Reloj y, debajo, todo lo que "pasa" (avisos, lunes de cuentas…), flotando
               sobre lo de abajo para no empujar las fichas laterales al aparecer -->
          <div class="relative justify-self-end">
            <HudClock />
            <div class="absolute top-full right-0 z-30 mt-2 flex flex-col items-end gap-2">
              <MatchChip />
              <WeeklyReportNote />
              <NoticeToasts />
            </div>
          </div>
        </div>
      </template>
      <template #right>
        <RoomPanel />
        <ObjectPanel />
      </template>
      <template #bottom>
        <BuildMenu />
        <ReportsButton />
      </template>
    </GameLayout>
    <ContextMenu />
    <ReportsFolder />
    <MatchResult />
  </main>
</template>
