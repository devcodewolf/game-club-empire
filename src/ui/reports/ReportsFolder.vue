<script setup lang="ts">
/**
 * Carpeta de informes: una carpeta de cartón con un taco de hojas de papel
 * encima, las pestañas de colores asomando por la izquierda y algún detalle
 * de oficina de club (foto del campo sujeta con un clip, posit, mancha de
 * café). Cada pestaña es un componente propio (ver `reportTabs.ts`).
 *
 * Es modal: una capa oscura tapa el mapa y el HUD (pulsarla cierra). El
 * teclado se queda en la carpeta salvo Espacio y 1-4, que siguen manejando
 * el tiempo como en Prison Architect.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { REPORT_TABS } from '@/ui/reports/reportTabs'
import { useReports } from '@/ui/reports/useReports'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'

const reports = useReports()
const game = useGame()
const version = useGameVersion()

const tabs = computed(() => REPORT_TABS.filter((tab) => tab.unlocked()))
const tabButtons = ref<HTMLButtonElement[]>([])
const dialog = ref<HTMLElement | null>(null)
const isOpen = computed(() => reports.isOpen.value && reports.activeTab.value !== undefined)

const count = computed(() => {
  void version.value
  return reports.activeTab.value?.count?.(game)
})

/**
 * Al abrir, el foco entra en la carpeta; al cerrar, vuelve a donde estaba.
 * Sin `preventScroll`, el navegador desplazaría la pantalla para enseñar la
 * carpeta, que aún está entrando desde abajo (el mapa pegaba un salto).
 */
let returnFocus: HTMLElement | null = null
watch(isOpen, async (open) => {
  if (open) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    dialog.value?.focus({ preventScroll: true })
  } else {
    returnFocus?.focus({ preventScroll: true })
    returnFocus = null
  }
})

/** Teclas que siguen llegando al juego con la carpeta abierta (tiempo). */
function passesThrough(event: KeyboardEvent): boolean {
  return event.code === 'Space' || /^[1-9]$/.test(event.key)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    reports.close()
    return
  }
  if (!passesThrough(event)) event.stopPropagation()
}

/** Flechas arriba/abajo: pestaña contigua (circular) con el foco. */
function onTabKeydown(event: KeyboardEvent): void {
  const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
  if (step === 0) return
  event.preventDefault()
  const current = tabs.value.findIndex((tab) => tab.id === reports.activeTab.value?.id)
  const next = (current + step + tabs.value.length) % tabs.value.length
  const tab = tabs.value[next]
  if (!tab) return
  reports.selectTab(tab.id)
  tabButtons.value[next]?.focus({ preventScroll: true })
}
</script>

<template>
  <!-- Capa que tapa el mapa: no deja arrastrar, hacer zoom ni pulsar nada debajo -->
  <Transition
    enter-active-class="motion-safe:transition-opacity motion-safe:duration-200"
    enter-from-class="opacity-0"
    leave-active-class="motion-safe:transition-opacity motion-safe:duration-150"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="absolute inset-0 z-40 bg-[rgb(10_12_16/0.6)]"
      aria-hidden="true"
      @pointerdown="reports.close()"
      @contextmenu.prevent
    />
  </Transition>

  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.2,0.9,0.3,1.15)]"
    enter-from-class="motion-safe:translate-y-[60vh] motion-safe:rotate-2 opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-in"
    leave-to-class="motion-safe:translate-y-[60vh] motion-safe:-rotate-1 opacity-0"
  >
    <div
      v-if="isOpen && reports.activeTab.value"
      class="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-clip py-5 pr-4 pl-14"
    >
      <div
        ref="dialog"
        class="pointer-events-auto relative h-[min(90vh,900px)] w-[min(700px,100%)] outline-none"
        role="dialog"
        aria-modal="true"
        aria-label="Informes"
        tabindex="-1"
        :style="{ '--tab-color': reports.activeTab.value.color }"
        @keydown="onKeydown"
      >
        <!-- Marcapáginas que asoman por debajo de la carpeta -->
        <span class="bookmark bottom-[-14px] left-[52%] bg-[#3f78c4]" aria-hidden="true" />
        <span class="bookmark bottom-[-14px] left-[70%] bg-[#d2463b]" aria-hidden="true" />

        <!-- Carpeta de cartón -->
        <div class="folder absolute inset-0 z-10 rounded-lg border-2 border-[#8f5d1c]">
          <!-- Foto del campo sujeta con un clip, asomando por la derecha -->
          <div class="photo absolute top-[34%] -right-5 h-28 w-24 rotate-[5deg]" aria-hidden="true">
            <div class="photo__pitch h-full w-full" />
          </div>

          <!-- Taco de hojas: dos debajo, algo torcidas, y la de arriba -->
          <div class="sheet sheet--under absolute inset-[16px_24px_30px_26px] rotate-[1.2deg]" />
          <div class="sheet sheet--under absolute inset-[16px_24px_30px_26px] -rotate-[0.8deg]" />
          <!-- Pestañas como separadores: entre el cartón y la hoja de arriba, asomando por la izquierda -->
          <div
            class="absolute top-10 right-[calc(100%-36px)] flex flex-col items-end gap-1"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Informes"
          >
            <button
              v-for="(tab, index) in tabs"
              :key="tab.id"
              :ref="
                (el) => {
                  if (el) tabButtons[index] = el as HTMLButtonElement
                }
              "
              type="button"
              role="tab"
              class="tab relative cursor-pointer border-2 border-r-0 border-ink py-4 pr-[34px] pl-1 font-hand text-[18px] leading-none text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:transition-[transform,filter] motion-safe:duration-150"
              :class="{ 'tab--active': tab.id === reports.activeTab.value.id }"
              :style="{ backgroundColor: tab.color }"
              :aria-selected="tab.id === reports.activeTab.value.id"
              :tabindex="tab.id === reports.activeTab.value.id ? 0 : -1"
              @click="reports.selectTab(tab.id)"
              @keydown="onTabKeydown"
            >
              <span class="block rotate-180 whitespace-nowrap [writing-mode:vertical-rl]">{{
                tab.title
              }}</span>
            </button>
          </div>

          <section
            class="sheet absolute inset-[16px_24px_30px_26px] flex flex-col text-ink"
            :aria-label="reports.activeTab.value.title"
          >
            <svg
              class="absolute top-[30%] -right-3 h-14 w-5"
              viewBox="0 0 20 56"
              fill="none"
              stroke="#7d848c"
              stroke-width="2.4"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 52V10a4 4 0 0 1 8 0v36a7 7 0 0 1-14 0V16" />
            </svg>

            <header class="relative px-8 pt-5 pb-1">
              <h2
                class="mx-auto flex w-[88%] items-baseline justify-center gap-4 border-[2.5px] border-ink py-1 font-hand text-[42px] leading-[52px] shadow-[3px_3px_0_rgb(0_0_0/0.25)]"
                :style="{ backgroundColor: reports.activeTab.value.color }"
              >
                <span>{{ reports.activeTab.value.title }}</span>
                <span v-if="count !== undefined" class="tabular-nums">{{ count }}</span>
              </h2>
              <button
                type="button"
                class="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-ink bg-[#8c8c8c] font-data text-lg font-bold text-white shadow-[2px_2px_0_rgb(0_0_0/0.3)] hover:bg-[#a33a32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-label="Cerrar informes"
                title="Cerrar (Esc)"
                @click="reports.close()"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </header>
            <div class="scroll min-h-0 flex-1 overflow-y-auto px-9 pt-2 pb-4">
              <component :is="reports.activeTab.value.component" />
            </div>
          </section>
        </div>

        <!-- Posit con una nota a mano sobre el borde de la carpeta -->
        <p
          class="absolute bottom-[-18px] left-10 z-30 w-36 -rotate-3 bg-[#f7e27d] px-3 pt-2 pb-3 font-hand text-[20px] leading-6 text-ink shadow-[2px_3px_0_rgb(0_0_0/0.25)]"
          aria-hidden="true"
        >
          ¡Pedir balones!
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Cartón: color miel con un leve degradado y una mancha de café en el margen */
.folder {
  background:
    radial-gradient(
      circle at calc(100% - 6px) 78%,
      transparent 0 30px,
      rgb(120 70 20 / 0.28) 31px 34px,
      rgb(120 70 20 / 0.1) 35px 40px,
      transparent 41px
    ),
    linear-gradient(160deg, #eeb04c, #e09a30 60%, #d48c27);
  box-shadow:
    inset 0 0 0 3px rgb(255 255 255 / 0.12),
    6px 7px 0 rgb(0 0 0 / 0.35);
}

/*
 * Papel blanco con textura de arrugas (ruido fractal en SVG, se rasteriza una
 * vez) y alguna marca de lápiz suelta.
 */
.sheet {
  background-color: #fcfbf7;
  background-image:
    linear-gradient(#b9b3a6, #b9b3a6), linear-gradient(#c3bdb1, #c3bdb1),
    linear-gradient(#bdb7aa, #bdb7aa),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.011' numOctaves='4' seed='5'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.4 0 0 0 0 0.37 0.32 0 0 0 -0.11'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:
    24px 1.5px,
    22px 1px,
    20px 1px,
    320px 320px;
  background-position:
    6px 13%,
    calc(100% - 4px) 47%,
    10px 88%,
    0 0;
  background-repeat: no-repeat, no-repeat, no-repeat, repeat;
  border: 1px solid #cfc8b8;
  box-shadow: 2px 3px 0 rgb(0 0 0 / 0.18);
}
.sheet--under {
  background-image: none;
  background-color: #f3f0e8;
}

/* Foto del campo: marco blanco y el campo visto desde arriba */
.photo {
  background: #f6f4ee;
  padding: 7px 7px 18px;
  border: 1px solid #b9b3a6;
  box-shadow: 2px 2px 0 rgb(0 0 0 / 0.25);
}
.photo__pitch {
  background:
    linear-gradient(#fff, #fff) center / 100% 1.5px no-repeat,
    radial-gradient(circle, transparent 0 9px, #fff 9px 10.5px, transparent 10.5px) center / 100%
      100% no-repeat,
    repeating-linear-gradient(#5c9a46 0 12px, #6aa851 12px 24px);
  outline: 1.5px solid #fff;
  outline-offset: -5px;
}

.bookmark {
  position: absolute;
  z-index: 0;
  width: 92px;
  height: 30px;
  border: 2px solid #2e2a26;
  border-radius: 0 0 10px 10px;
}

/* Lengüetas: esquinas redondeadas por fuera; las de detrás, más apagadas y metidas */
.tab {
  border-radius: 10px 0 0 10px;
  filter: brightness(0.8) saturate(0.7);
  transform: translateX(6px);
}
.tab:hover {
  filter: brightness(0.95);
  transform: translateX(2px);
}
/* Activa: color vivo, sale más que las otras, negrita y sombra plana */
.tab--active {
  filter: none;
  font-weight: 700;
  transform: translateX(-8px);
  box-shadow:
    inset 0 2px 0 rgb(255 255 255 / 0.45),
    -3px 3px 0 rgb(0 0 0 / 0.3);
}

.scroll {
  scrollbar-width: thin;
  scrollbar-color: #b9b3a6 transparent;
}
</style>
