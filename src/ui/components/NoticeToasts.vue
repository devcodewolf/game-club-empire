<script setup lang="ts">
/**
 * Lista de avisos breves, centrada arriba. Cada aviso es una tarjeta de
 * papel que se cierra al hacer clic (o sola, desde el store).
 */
import NotebookSheet from '@/ui/components/NotebookSheet.vue'
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
      class="pointer-events-auto cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-white"
      @click="noticeStore.dismiss(notice.id)"
    >
      <NotebookSheet
        class="flex items-center gap-2 py-1 pr-4 pl-10 font-hand text-[18px] leading-6"
      >
        <span aria-hidden="true">{{ notice.icon }}</span>
        <span>{{ notice.text }}</span>
      </NotebookSheet>
    </button>
  </TransitionGroup>
</template>
