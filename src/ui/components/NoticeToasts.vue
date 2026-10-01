<script setup lang="ts">
/**
 * Lista de avisos breves, centrada arriba. Cada aviso es una tarjeta de
 * papel que se cierra al hacer clic (o sola, desde el store).
 */
import { useNoticeStore } from '@/ui/stores/noticeStore'

const noticeStore = useNoticeStore()
</script>

<template>
  <TransitionGroup
    tag="div"
    class="pointer-events-none flex flex-col items-center gap-2"
    role="status"
    aria-live="polite"
    enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
    enter-from-class="motion-safe:-translate-y-3 motion-safe:opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-in"
    leave-to-class="motion-safe:opacity-0"
  >
    <button
      v-for="notice in noticeStore.notices"
      :key="notice.id"
      type="button"
      class="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-md border-2 border-[#2e2a26] bg-[#f2e6c9] px-3 py-2 text-left text-[14px] text-[#2e2a26] shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
      @click="noticeStore.dismiss(notice.id)"
    >
      <span aria-hidden="true">{{ notice.icon }}</span>
      <span>{{ notice.text }}</span>
    </button>
  </TransitionGroup>
</template>
