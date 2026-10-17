<script setup lang="ts">
/**
 * Ficha "Deshacer": aparece tras una obra que se puede deshacer y se queda 10 s
 * reales con cuenta atrás. Desaparece al acabar, al pulsarla o si otra cosa
 * cambia el mapa (la simulación ya no puede deshacer). Atajo: Ctrl+Z.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '@/ui/components/AppIcon.vue'
import { useGame } from '@/ui/composables/useGame'
import { isEditableTarget } from '@/ui/composables/useToolShortcuts'

const WINDOW_MS = 10_000

const game = useGame()
const visible = ref(false)
const remaining = ref(0)
let deadline = 0
let timer: ReturnType<typeof setInterval> | null = null

function stop(): void {
  if (timer) clearInterval(timer)
  timer = null
  visible.value = false
}

function start(): void {
  deadline = performance.now() + WINDOW_MS
  remaining.value = WINDOW_MS
  visible.value = true
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    remaining.value = Math.max(0, deadline - performance.now())
    if (remaining.value <= 0) stop()
  }, 100)
}

function undo(): void {
  if (!visible.value || !game.canUndo()) return
  stop()
  game.dispatch({ type: 'undo' })
}

const unsubscribe = game.subscribe((event) => {
  if (!game.canUndo()) return stop()
  // Solo una obra nueva (construir, mejorar o mover; su cargo llega como
  // transacción) reinicia la cuenta atrás: los ingresos y gastos del calendario no
  const isWork =
    event.type === 'transaction' &&
    event.entry.amount < 0 &&
    (event.entry.concept === 'construction' ||
      event.entry.concept === 'upgrade' ||
      event.entry.concept === 'move')
  if (isWork) start()
})

const onKeyDown = (event: KeyboardEvent): void => {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
  if (isEditableTarget(event.target) || !visible.value) return
  event.preventDefault()
  undo()
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  unsubscribe()
  stop()
})
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-200"
    enter-from-class="motion-safe:-translate-y-2 motion-safe:opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-150"
    leave-to-class="motion-safe:-translate-y-2 motion-safe:opacity-0"
  >
    <button
      v-if="visible"
      type="button"
      class="pointer-events-auto flex h-7 cursor-pointer items-center gap-1.5 rounded-sm border-2 border-ink bg-paper px-2 text-ink shadow-[2px_2px_0_rgb(0_0_0/0.35)] hover:bg-white"
      title="Deshacer la última obra (Ctrl+Z)"
      @click="undo"
    >
      <AppIcon name="arrow-back-up" :size="16" :stroke="2.25" />
      <span class="font-hand text-sm leading-none">Deshacer</span>
      <span class="font-data text-xs font-bold tabular-nums">
        {{ Math.ceil(remaining / 1000) }}s
      </span>
    </button>
  </Transition>
</template>
