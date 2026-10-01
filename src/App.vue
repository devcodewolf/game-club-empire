<script setup lang="ts">
import GameCanvas from '@/ui/GameCanvas.vue'
import GameLayout from '@/ui/GameLayout.vue'
</script>

<template>
  <main class="relative h-full w-full">
    <GameCanvas />
    <GameLayout>
      <template #top>
        <span class="pointer-events-none! text-sm font-bold text-amber-400">Grassroots</span>
      </template>
    </GameLayout>
  </main>
</template>
