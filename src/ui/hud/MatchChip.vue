<script setup lang="ts">
/** Ficha "En juego" bajo el reloj mientras se disputa el partido del domingo. */
import AppIcon from '@/ui/components/AppIcon.vue'
import { useMatchStore } from '@/ui/stores/matchStore'

const match = useMatchStore()
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
    enter-from-class="motion-safe:translate-x-4 motion-safe:opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-150 motion-safe:ease-in"
    leave-to-class="motion-safe:translate-x-4 motion-safe:opacity-0"
  >
    <div
      v-if="match.current"
      class="pointer-events-auto flex h-7 items-center gap-1.5 rounded-sm border-2 border-ink bg-paper px-2 text-ink shadow-[2px_2px_0_rgb(0_0_0/0.35)]"
      role="status"
    >
      <AppIcon name="ball-football" :size="16" :stroke="2.25" class="text-ink-blue" />
      <span class="font-data text-xs font-bold whitespace-nowrap">
        En juego · vs {{ match.current.opponent }} ({{ match.current.home ? 'casa' : 'fuera' }})
      </span>
    </div>
  </Transition>
</template>
