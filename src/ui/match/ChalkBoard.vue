<script setup lang="ts">
/**
 * Marco de la pizarra de vestuario (verde oscuro, marco de madera, tiza) para
 * las ventanas del partido. Es modal: una capa oscura tapa el mapa (pulsarla
 * emite `close`), el foco entra en la pizarra y, mientras está abierta, el
 * teclado es suyo: Escape emite `close` y Enter emite `confirm`. Quien la usa
 * pone el contenido y decide qué hacen esas dos salidas (y si pausa el juego).
 */
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; label: string }>()
const emit = defineEmits<{ close: []; confirm: [] }>()

const dialog = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

watch(
  () => props.open,
  async (now, before) => {
    if (now && !before) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      dialog.value?.focus({ preventScroll: true })
    } else if (!now && before) {
      returnFocus?.focus({ preventScroll: true })
      returnFocus = null
    }
  },
)

function onKeydown(event: KeyboardEvent): void {
  event.stopPropagation()
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  } else if (event.key === 'Enter') {
    event.preventDefault()
    emit('confirm')
  }
}
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition-opacity motion-safe:duration-200"
    enter-from-class="opacity-0"
    leave-active-class="motion-safe:transition-opacity motion-safe:duration-150"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="absolute inset-0 z-40 bg-[rgb(10_12_16/0.6)]"
      aria-hidden="true"
      @pointerdown="emit('close')"
      @contextmenu.prevent
    />
  </Transition>

  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.2,0.9,0.3,1.15)]"
    enter-from-class="motion-safe:-translate-y-[50vh] motion-safe:-rotate-2 opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-in"
    leave-to-class="motion-safe:translate-y-[40vh] motion-safe:rotate-1 opacity-0"
  >
    <div
      v-if="open"
      class="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-clip p-4"
    >
      <div
        ref="dialog"
        class="board pointer-events-auto max-h-full w-[min(640px,100%)] overflow-y-auto border-[14px] px-6 pt-4 pb-5 font-hand text-[19px] leading-6 text-white outline-none"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Pizarra: verde oscuro con un poco de tiza borrada y marco de madera */
.board {
  background-color: #24402f;
  background-image:
    radial-gradient(ellipse at 20% 15%, rgb(255 255 255 / 0.08), transparent 55%),
    radial-gradient(ellipse at 85% 90%, rgb(255 255 255 / 0.05), transparent 50%);
  border-style: solid;
  border-color: #8a5a2b;
  box-shadow:
    inset 0 0 0 2px #5e3a17,
    inset 0 0 24px rgb(0 0 0 / 0.45),
    6px 8px 0 rgb(0 0 0 / 0.4);
  text-shadow: 0 0 1px rgb(255 255 255 / 0.35);
}
</style>

<style>
/* Rayas de tiza que usan las ventanas de la pizarra en su contenido */
.chalk-rule {
  height: 0;
  border-top: 2px dashed rgb(255 255 255 / 0.4);
}

.chalk-total {
  border-top: 1px solid rgb(255 255 255 / 0.4);
}
</style>
