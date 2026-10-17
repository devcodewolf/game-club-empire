<script setup lang="ts">
/**
 * Tablón del vestuario (como la lista "Todo" de Prison Architect): un corcho
 * plegable arriba a la izquierda con notas clavadas. Cada sección del tablón
 * es un componente pequeño: para añadir otra (patrocinios, averías…) basta
 * con ponerla en la plantilla de abajo.
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
const { pending, active, offered } = useGrantsBoard()
/** Sin nada en marcha ni ofertas, el tablón no se muestra. */
const visible = computed(() => active.value.length > 0 || offered.value.length > 0)

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
  <section v-if="visible" class="pointer-events-auto w-[270px]" aria-label="Tablón">
    <button
      type="button"
      class="flex w-full cursor-pointer items-center gap-2 border-2 border-cork-dark bg-cork px-3 py-0.5 text-left text-ink shadow-[3px_3px_0_rgb(0_0_0/0.35)] focus-visible:outline-2 focus-visible:outline-white"
      :aria-expanded="!folded"
      @click="folded = !folded"
    >
      <span class="font-hand text-[22px] leading-7">Tablón</span>
      <span
        v-if="pending > 0"
        class="grid size-5 place-items-center rounded-full border-2 border-ink bg-red-600 font-data text-[11px] leading-none font-bold text-white"
        :aria-label="`${pending} pendientes`"
        >{{ pending }}</span
      >
      <span aria-hidden="true" class="ml-auto font-data text-xs">{{ folded ? '▸' : '▾' }}</span>
    </button>
    <div
      v-show="!folded"
      class="board-cork flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto border-2 border-t-0 border-cork-dark bg-cork p-2 pt-3 shadow-[3px_3px_0_rgb(0_0_0/0.35)]"
    >
      <BoardGrantsSection />
    </div>
  </section>
</template>

<style scoped>
.board-cork {
  background-image:
    radial-gradient(rgb(0 0 0 / 0.16) 1px, transparent 1.5px),
    radial-gradient(rgb(255 255 255 / 0.14) 1px, transparent 1.5px);
  background-size:
    9px 9px,
    13px 13px;
  background-position:
    0 0,
    4px 6px;
}
</style>
