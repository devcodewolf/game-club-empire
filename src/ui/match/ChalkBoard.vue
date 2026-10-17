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

/** Esquinas del marco con tornillo. */
const SCREWS = ['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'] as const
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
        class="pointer-events-auto flex max-h-full w-[min(660px,100%)] flex-col outline-none"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <!-- Marco de madera con un tornillo en cada esquina -->
        <div class="frame relative min-h-0 rounded-md p-[14px]">
          <span
            v-for="corner in SCREWS"
            :key="corner"
            class="screw absolute h-2.5 w-2.5 rounded-full"
            :class="corner"
            aria-hidden="true"
          />
          <div
            class="board relative max-h-[calc(100vh-9rem)] overflow-y-auto px-6 pt-4 pb-5 font-hand text-[19px] leading-6 text-white"
          >
            <!-- Una jugada a medio borrar en la esquina, como en cualquier vestuario -->
            <svg
              class="pointer-events-none absolute bottom-2 left-3 h-14 w-20 opacity-[0.13]"
              viewBox="0 0 128 96"
              fill="none"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="18" cy="70" r="7" />
              <circle cx="40" cy="30" r="7" />
              <circle cx="62" cy="76" r="7" />
              <path d="M88 20l10 10m0-10L88 30M104 58l10 10m0-10l-10 10" />
              <path d="M24 64c14-14 28-24 46-30" />
              <path d="M66 31l6 2-3 6" />
              <path d="M48 32c18 2 34 12 46 28" stroke-dasharray="5 6" />
              <path d="M90 56l5 5-6 2" />
            </svg>
            <div class="relative">
              <slot />
            </div>
          </div>
        </div>
        <!-- Repisa con tizas y borrador -->
        <div class="tray relative mx-6 h-4 rounded-b-md" aria-hidden="true">
          <span class="chalk absolute -top-1 left-[18%] h-2 w-10 rounded-full bg-[#f4f1e8]" />
          <span class="chalk absolute -top-1 left-[30%] h-2 w-7 rounded-full bg-[#f3d77a]" />
          <span class="eraser absolute -top-3 right-[16%] h-5 w-16 rounded-sm" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Marco de madera: veta suave y bisel claro arriba, oscuro abajo */
.frame {
  background:
    repeating-linear-gradient(
      90deg,
      rgb(0 0 0 / 0.06) 0 2px,
      transparent 2px 9px,
      rgb(255 255 255 / 0.04) 9px 11px,
      transparent 11px 23px
    ),
    linear-gradient(#a06a34, #85552a);
  box-shadow:
    inset 0 2px 0 rgb(255 255 255 / 0.18),
    inset 0 -3px 0 rgb(0 0 0 / 0.25),
    0 0 0 2px #4a2d12,
    6px 8px 0 rgb(0 0 0 / 0.4);
}

/* Tornillos de cabeza plana con su ranura */
.screw {
  background: radial-gradient(circle at 35% 35%, #d9d4c7, #8d8679 70%);
  box-shadow: 0 0 0 1px #3b2a18;
}
.screw::after {
  content: '';
  position: absolute;
  inset: 45% 15%;
  background: #4a4238;
  transform: rotate(-35deg);
}

/* Pizarra: verde oscuro, tiza borrada a manchas y polvo fino */
.board {
  background-color: #24402f;
  background-image:
    radial-gradient(ellipse at 20% 15%, rgb(255 255 255 / 0.09), transparent 55%),
    radial-gradient(ellipse at 85% 90%, rgb(255 255 255 / 0.06), transparent 50%),
    radial-gradient(ellipse 40% 12% at 70% 45%, rgb(255 255 255 / 0.05), transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.5 0 0 0 -0.32'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  box-shadow:
    inset 0 0 0 2px #1a2e22,
    inset 0 0 28px rgb(0 0 0 / 0.5);
  text-shadow: 0 0 1px rgb(255 255 255 / 0.35);
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 0.25) transparent;
}

/* Repisa de madera bajo la pizarra */
.tray {
  background: linear-gradient(#93602f, #6f4520);
  box-shadow:
    0 0 0 2px #4a2d12,
    4px 5px 0 rgb(0 0 0 / 0.35);
}
.chalk {
  box-shadow: 1px 1px 0 rgb(0 0 0 / 0.3);
}

/* Borrador: fieltro gris con lomo de madera */
.eraser {
  background: linear-gradient(#b98a52 0 45%, #7d7a74 45%);
  box-shadow:
    0 0 0 1.5px #3b2a18,
    1px 2px 0 rgb(0 0 0 / 0.3);
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
