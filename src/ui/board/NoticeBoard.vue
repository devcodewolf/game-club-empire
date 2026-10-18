<script setup lang="ts">
/**
 * Tablón (como la lista "Todo" de Prison Architect): una hoja de libreta con
 * renglones arriba a la izquierda. La cabecera lleva el icono, "Tablón" y los
 * objetivos cumplidos sobre el total; pulsarla pliega la hoja. Debajo, cada
 * apartado con su cuadradito negro y su título en negrita, y las tareas con
 * un cuadradito pequeño, tachadas al cumplirse.
 *
 * Cada apartado es un componente pequeño: para añadir otro (patrocinios,
 * averías…) basta con ponerlo en la plantilla de abajo. A la derecha de la
 * cabecera queda sitio para más iconos (p. ej. el presidente).
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { grantDef } from '@/sim/club/grants'
import { useGame } from '@/ui/composables/useGame'
import { formatSignedEuros } from '@/ui/composables/formatMoney'
import { useNoticeStore } from '@/ui/stores/noticeStore'
import BoardGrantsSection from './BoardGrantsSection.vue'
import { useGrantsBoard } from './useGrantsBoard'

const STORAGE_KEY = 'club.board.folded'

const game = useGame()
const notices = useNoticeStore()
const { active, offered } = useGrantsBoard()
/** Sin nada en marcha ni ofertas, el tablón no se muestra. */
const visible = computed(() => active.value.length > 0 || offered.value.length > 0)

/** Tareas cumplidas sobre el total, como el "3/11" de Prison Architect. */
const tally = computed(() => {
  const rows = active.value.flatMap((grant) => grant.rows)
  return { done: rows.filter((row) => row.done).length, total: rows.length }
})

function loadFolded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
const folded = ref(loadFolded())
watch(folded, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // Sin almacenamiento: solo se pierde la comodidad
  }
})

// Aviso al cumplir una subvención
const unsubscribe = game.subscribe((event) => {
  if (event.type !== 'grantCompleted') return
  const def = grantDef(game.content, event.grantId)
  if (def) {
    notices.show('✅', `¡Subvención cumplida: ${def.name}! ${formatSignedEuros(def.bonus)}`)
  }
})
onBeforeUnmount(unsubscribe)
</script>

<template>
  <section
    v-if="visible"
    class="todo pointer-events-auto w-[270px] text-ink shadow-[3px_3px_0_rgb(0_0_0/0.35)]"
    aria-label="Tablón"
  >
    <!-- Cabecera: icono, título y cuenta; pulsarla pliega la hoja -->
    <button
      type="button"
      class="todo-head flex w-full cursor-pointer items-center gap-2 px-2 py-1 text-left focus-visible:outline-2 focus-visible:outline-ink"
      :aria-expanded="!folded"
      title="Plegar o desplegar el tablón"
      @click="folded = !folded"
    >
      <!-- Libreta de espiral -->
      <svg
        viewBox="0 0 20 22"
        class="h-6 w-5 shrink-0"
        fill="none"
        stroke="#2e2a26"
        stroke-width="1.5"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 2.5h14v18H3Z" fill="#fbf6e2" />
        <path d="M6 7.5h8M6 11h8M6 14.5h6" stroke="#8aa3b3" />
        <path d="M5 1v3M8.5 1v3M12 1v3M15.5 1v3" stroke-linecap="round" />
      </svg>
      <span class="font-hand text-[22px] leading-7">Tablón</span>
      <span v-if="tally.total > 0" class="font-hand text-[20px] leading-7 tabular-nums"
        >{{ tally.done }}/{{ tally.total }}</span
      >
      <span aria-hidden="true" class="ml-auto font-data text-[11px] text-ink/60">{{
        folded ? '▸' : '▾'
      }}</span>
    </button>

    <!-- Hoja con renglones -->
    <div v-show="!folded" class="todo-sheet max-h-[60vh] overflow-y-auto px-2.5 pt-1 pb-3">
      <BoardGrantsSection />
    </div>
  </section>
</template>

<style scoped>
/* Papel de libreta crema, algo translúcido como el de Prison Architect */
.todo {
  background: rgb(250 246 226 / 0.94);
  border: 1.5px solid rgb(46 42 38 / 0.55);
}

.todo-head {
  border-bottom: 1.5px solid rgb(46 42 38 / 0.45);
  background: rgb(240 233 205 / 0.9);
}

/* Renglones finos cada 20 px, alineados con el texto de las tareas */
.todo-sheet {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0 19px,
    rgb(138 163 179 / 0.45) 19px 20px
  );
  background-attachment: local;
  scrollbar-width: thin;
  scrollbar-color: rgb(46 42 38 / 0.3) transparent;
}
</style>
