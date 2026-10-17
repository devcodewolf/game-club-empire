<script setup lang="ts">
/**
 * Resultado del partido: la pizarra de vestuario (`ChalkBoard`) que aparece al
 * terminar el partido del domingo. Es modal y el juego queda en pausa mientras
 * está abierta; al cerrarla vuelve a como estaba.
 */
import { gsap } from 'gsap'
import { computed, nextTick, ref, watch } from 'vue'
import ChalkBoard from '@/ui/match/ChalkBoard.vue'
import { formatNumber } from '@/render/core/formatNumber'
import { formatSignedEuros } from '@/ui/composables/formatMoney'
import { buildChronicle } from '@/ui/match/chronicle'
import { useMatchStore } from '@/ui/stores/matchStore'
import { useTimeStore } from '@/ui/stores/timeStore'

/** Nuestro club, de momento sin nombre propio. */
const CLUB_NAME = 'Tu club'

const store = useMatchStore()
const time = useTimeStore()
const match = computed(() => store.pendingResult)
const score = ref<HTMLElement | null>(null)

const HEADLINES = { win: '¡Victoria!', draw: 'Empate', loss: 'Derrota' } as const
const headline = computed(() => (match.value ? HEADLINES[match.value.outcome] : ''))

/** El local va primero: fuera de casa, el rival. */
const sides = computed(() => {
  const m = match.value
  if (!m) return undefined
  const us = { name: CLUB_NAME, goals: m.goalsFor }
  const them = { name: m.opponent, goals: m.goalsAgainst }
  return m.home ? { left: us, right: them } : { left: them, right: us }
})

const chronicle = computed(() => (match.value ? buildChronicle(match.value, CLUB_NAME) : []))

/** Conceptos del día; la furgoneta y la multa son gastos (la simulación las da en positivo). */
const MONEY_LABELS = [
  ['tickets', 'Taquilla', 1],
  ['bar', 'Bar', 1],
  ['parking', 'Aparcamiento', 1],
  ['travel', 'Furgoneta', -1],
  ['fine', 'Multa', -1],
] as const

/** Dinero del día: solo conceptos distintos de 0, con el total. */
const money = computed(() => {
  const m = match.value
  if (!m) return { rows: [], total: 0 }
  const rows = MONEY_LABELS.map(([key, label, sign]) => ({
    label,
    amount: m.money[key] * sign,
  })).filter((row) => row.amount !== 0)
  return { rows, total: rows.reduce((sum, row) => sum + row.amount, 0) }
})

/** Un decimal solo si lo tiene, con coma y menos tipográfico. */
function plain(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const text = Math.abs(rounded).toFixed(1).replace('.', ',').replace(/,0$/, '')
  return `${rounded < 0 ? '−' : ''}${text}`
}

/** Igual, con "+" delante de los positivos. */
function signed(value: number): string {
  const text = plain(value)
  return value > 0 && text !== '0' ? `+${text}` : text
}

const strengthRows = computed(() => {
  const m = match.value
  if (!m) return []
  const s = m.strength
  const rows = [
    { label: 'Vestuario', value: s.changingRoom },
    { label: 'Superficie', value: s.surface },
    { label: 'Salas', value: s.rooms },
    { label: 'Estado del campo', value: s.pitch },
    { label: 'Factor campo', value: s.home },
    { label: 'Banquillos', value: s.benches },
  ]
  // Lo que solo cuenta en casa se oculta fuera
  return m.home ? rows : rows.filter((row) => row.value !== 0)
})

/** Color de una cifra de cambio (fama, afición, dinero) sobre la pizarra. */
function changeClass(value: number): string {
  return value > 0 ? 'text-green-300' : value < 0 ? 'text-red-300' : 'text-white/70'
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Al abrirse pausa el juego (recordando si ya lo estaba); el marcador rebota. Al cerrarse se restaura todo.
 */
let wasPaused = true
watch(match, async (now, before) => {
  if (now && !before) {
    wasPaused = time.paused
    time.paused = true
    time.jumpRequested = false
    await nextTick()
    if (!reduced && score.value) {
      gsap.fromTo(
        score.value,
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, delay: 0.25, ease: 'back.out(2.2)' },
      )
    }
  } else if (!now && before) {
    time.paused = wasPaused
  }
})

function close(): void {
  store.dismiss()
}
</script>

<template>
  <ChalkBoard
    :open="match !== null && sides !== undefined"
    :label="`Resultado de la jornada ${match?.number ?? ''}`"
    @close="close"
    @confirm="close"
  >
    <template v-if="match && sides">
      <p class="text-center text-[18px] tracking-wide text-white/75 uppercase">
        Jornada {{ match.number }} · {{ match.home ? 'en casa' : 'fuera' }}
      </p>

      <div
        class="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center"
        aria-live="polite"
      >
        <span class="text-[26px] leading-7">{{ sides.left.name }}</span>
        <span ref="score" class="font-data text-[56px] leading-none font-bold tabular-nums">
          {{ sides.left.goals }} – {{ sides.right.goals }}
        </span>
        <span class="text-[26px] leading-7">{{ sides.right.name }}</span>
      </div>

      <h2
        class="mt-2 text-center text-[40px] leading-10 underline decoration-2 underline-offset-4"
        :class="{
          'text-green-300': match.outcome === 'win',
          'text-amber-200': match.outcome === 'draw',
          'text-red-300': match.outcome === 'loss',
        }"
      >
        {{ headline }}
      </h2>

      <ul class="mt-3 space-y-0.5 text-[19px] text-white/90">
        <li v-for="line in chronicle" :key="line">· {{ line }}</li>
      </ul>

      <div class="chalk-rule my-3" aria-hidden="true" />

      <div class="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <section aria-label="Público y dinero">
          <template v-if="match.attendance">
            <p>
              Asistencia:
              <span class="font-data text-[15px] font-bold tabular-nums"
                >{{ formatNumber(match.attendance.total) }} /
                {{ formatNumber(match.attendance.capacity) }}</span
              >
            </p>
            <p v-if="match.attendance.leftOut > 0" class="text-amber-200">
              {{ formatNumber(match.attendance.leftOut) }} se quedaron fuera
            </p>
            <p v-if="match.satisfaction !== null">
              Satisfacción:
              <span class="font-data text-[15px] font-bold tabular-nums"
                >{{ Math.round(match.satisfaction) }} %</span
              >
            </p>
          </template>
          <p v-else class="text-white/75">Partido fuera: sin taquilla.</p>

          <p class="mt-2 text-[21px] underline underline-offset-2">Dinero del día</p>
          <p v-if="money.rows.length === 0" class="text-white/75">Sin movimientos.</p>
          <p v-for="row in money.rows" :key="row.label" class="flex justify-between gap-3">
            <span>{{ row.label }}</span>
            <span
              class="font-data text-[15px] font-bold tabular-nums"
              :class="changeClass(row.amount)"
              >{{ formatSignedEuros(row.amount) }}</span
            >
          </p>
          <p v-if="money.rows.length" class="chalk-total flex justify-between gap-3 pt-0.5">
            <span>Total</span>
            <span
              class="font-data text-[15px] font-bold tabular-nums"
              :class="changeClass(money.total)"
              >{{ formatSignedEuros(money.total) }}</span
            >
          </p>
        </section>

        <section aria-label="Fama y afición">
          <p class="flex justify-between gap-3">
            <span>Fama ★</span>
            <span
              class="font-data text-[15px] font-bold tabular-nums"
              :class="changeClass(match.fameChange)"
              >{{ signed(match.fameChange) }}</span
            >
          </p>
          <p class="flex justify-between gap-3">
            <span>Afición</span>
            <span
              class="font-data text-[15px] font-bold tabular-nums"
              :class="changeClass(match.fansChange)"
              >{{ signed(match.fansChange) }} personas</span
            >
          </p>

          <p class="mt-2 text-[21px] underline underline-offset-2">¿De dónde sale la fuerza?</p>
          <p class="flex justify-between gap-3 text-[17px] leading-5">
            <span>Base</span>
            <span class="font-data text-[14px] font-bold tabular-nums">{{
              plain(match.strength.base)
            }}</span>
          </p>
          <p
            v-for="row in strengthRows"
            :key="row.label"
            class="flex justify-between gap-3 text-[17px] leading-5"
          >
            <span>{{ row.label }}</span>
            <span
              class="font-data text-[14px] font-bold tabular-nums"
              :class="changeClass(row.value)"
              >{{ signed(row.value) }}</span
            >
          </p>
          <p class="chalk-total flex justify-between gap-3 pt-0.5">
            <span>Tu fuerza</span>
            <span class="font-data text-[15px] font-bold tabular-nums">{{
              plain(match.strength.total)
            }}</span>
          </p>
          <p class="flex justify-between gap-3 text-white/80">
            <span>Fuerza del rival</span>
            <span class="font-data text-[15px] font-bold tabular-nums">{{
              plain(match.rivalStrength)
            }}</span>
          </p>
        </section>
      </div>

      <button
        type="button"
        class="mx-auto mt-4 block cursor-pointer border-2 border-white/80 bg-white/10 px-8 py-1 text-[22px] leading-7 text-white shadow-[3px_3px_0_rgba(0,0,0,0.35)] hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        @click="close"
      >
        Seguir
      </button>
    </template>
  </ChalkBoard>
</template>
