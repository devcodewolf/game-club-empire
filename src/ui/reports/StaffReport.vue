<script setup lang="ts">
/**
 * Informe de Personal: un apartado por puesto con una figurita por empleado
 * y siluetas huecas por cada persona que falta para cubrirlo todo (pulsar una
 * la contrata). Debajo, la cobertura, el trabajo que hay y qué pasa si falta
 * gente; al final, los sueldos de la semana. Sin personal en el mapa hasta la
 * Fase 4.
 */
import { computed } from 'vue'
import { formatNumber } from '@/render/core/formatNumber'
import { STAFF_ROLES, staffCoverage, staffWorkload, weeklyWages } from '@/sim/economy/staff'
import type { StaffRole } from '@/sim/economy/staff'
import { formatEuros } from '@/ui/composables/formatMoney'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import ReportSection from '@/ui/reports/ReportSection.vue'
import StaffFigure from '@/ui/reports/StaffFigure.vue'

const game = useGame()
const version = useGameVersion()

/** Figuritas como mucho por apartado (contratadas + huecas); el resto, "+N". */
const MAX_FIGURES = 14

/** Nombre del apartado de cada puesto. */
const SECTIONS: Record<StaffRole, string> = {
  gardener: 'Jardinería',
  cleaner: 'Limpieza',
  maintenance: 'Mantenimiento',
  monitor: 'Escuela',
}

/** Nombre y unidad de cada cantidad de trabajo del club. */
const UNITS: Record<string, { readonly label: string; readonly unit: string }> = {
  pitchTiles: { label: 'campos', unit: 'casillas' },
  indoorTiles: { label: 'interiores', unit: 'casillas' },
  seats: { label: 'gradas', unit: 'asientos' },
  objectsValue: { label: 'objetos', unit: '€ de valor' },
  students: { label: 'alumnos', unit: 'alumnos' },
}

/** Qué pasa si falta personal de cada puesto. */
const CONSEQUENCES: Record<StaffRole, string> = {
  gardener: 'el campo no se recupera.',
  cleaner: 'baja la satisfacción de la afición.',
  maintenance: 'habrá averías.',
  monitor: 'limita los alumnos de la escuela.',
}

type Level = 'ok' | 'warn' | 'bad'
const LEVEL_TEXT: Record<Level, string> = {
  ok: 'text-green-700',
  warn: 'text-amber-700',
  bad: 'text-red-700',
}

const rows = computed(() => {
  void version.value
  const workload = staffWorkload(game.state, game.content)
  return STAFF_ROLES.map((role) => {
    const def = game.content.economy.staff[role]
    const { hired, needed, coverage } = staffCoverage(game.state, game.content, role)
    const units = Object.entries(def.covers)
    const percent = Math.round(coverage * 100)
    const level: Level = percent >= 100 ? 'ok' : percent >= 50 ? 'warn' : 'bad'
    const neededPeople = Math.ceil(needed - 1e-9)
    const missing = Math.max(0, neededPeople - hired)
    const shownHired = Math.min(hired, MAX_FIGURES)
    const shownMissing = Math.min(missing, MAX_FIGURES - shownHired)
    return {
      role,
      title: SECTIONS[role],
      hired,
      wage: def.wage,
      percent,
      levelText: LEVEL_TEXT[level],
      shownHired,
      shownMissing,
      hidden: hired + missing - shownHired - shownMissing,
      spare: hired > neededPeople ? hired - neededPeople : 0,
      work: units
        .map(([unit, per]) => {
          const u = UNITS[unit]
          return `${u?.label ?? unit}: ${formatNumber(Math.round(workload[unit] ?? 0))} ${u?.unit ?? ''} (${formatNumber(per)} por persona)`
        })
        .join(' · '),
      consequence: percent < 100 ? CONSEQUENCES[role] : null,
    }
  })
})

const totalWages = computed(() => {
  void version.value
  return weeklyWages(game.state, game.content)
})

function hire(role: StaffRole): void {
  game.dispatch({ type: 'hireStaff', role })
}
function fire(role: StaffRole): void {
  game.dispatch({ type: 'fireStaff', role })
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <ReportSection
      v-for="row in rows"
      :key="row.role"
      :title="row.title"
      :count="row.hired"
      :data-role="row.role"
    >
      <div class="flex items-center gap-3">
        <ul class="flex min-h-11 flex-1 flex-wrap items-end gap-x-0.5 gap-y-1">
          <li v-for="i in row.shownHired" :key="`h${i}`">
            <StaffFigure :role="row.role" :variant="i + row.role.length" />
          </li>
          <li v-for="i in row.shownMissing" :key="`m${i}`">
            <button
              type="button"
              class="ghost relative block cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-ink"
              :title="`Contratar (${formatEuros(row.wage)}/semana)`"
              :aria-label="`Contratar: ${row.title}`"
              @click="hire(row.role)"
            >
              <StaffFigure :role="row.role" ghost />
              <span
                class="ghost__plus absolute inset-0 flex items-center justify-center pt-2 font-hand text-[22px] text-ink opacity-0"
                aria-hidden="true"
                >+</span
              >
            </button>
          </li>
          <li v-if="row.hidden > 0" class="self-center px-1 font-hand text-[18px]">
            +{{ row.hidden }}
          </li>
          <li
            v-if="row.shownHired + row.shownMissing === 0"
            class="self-center font-hand text-[17px] text-ink/60"
          >
            Nadie, y de momento no hace falta.
          </li>
        </ul>
        <span class="flex shrink-0 gap-1.5">
          <button
            type="button"
            class="cursor-pointer border-2 border-ink bg-transparent px-2 font-hand text-[17px] leading-6 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
            :disabled="row.hired === 0"
            @click="fire(row.role)"
          >
            − Despedir
          </button>
          <button
            type="button"
            class="cursor-pointer border-2 border-ink bg-[#f6d77a] px-2 font-hand text-[17px] leading-6 shadow-[2px_2px_0_rgb(0_0_0/0.3)] hover:bg-[#fae39c] focus-visible:outline-2 focus-visible:outline-ink active:translate-x-px active:translate-y-px active:shadow-none"
            @click="hire(row.role)"
          >
            + Contratar
          </button>
        </span>
      </div>
      <p class="mt-1 font-data text-[13px] leading-5 text-ink/80">
        <span class="font-bold tabular-nums" :class="row.levelText"
          >Cubre el {{ row.percent }} %</span
        >
        · {{ formatEuros(row.wage) }}/semana cada uno · {{ row.work }}
      </p>
      <p v-if="row.consequence" class="font-hand text-[17px] leading-6 text-red-700">
        Falta gente: {{ row.consequence }}
      </p>
      <p v-else-if="row.spare > 0" class="font-hand text-[17px] leading-6 text-ink-blue">
        Sobra {{ row.spare === 1 ? 'una persona' : `${row.spare} personas` }}: podrías ahorrarte
        {{ formatEuros(row.spare * row.wage) }} a la semana.
      </p>
    </ReportSection>

    <!-- Total, con doble raya como el pie de una cuenta -->
    <p
      class="mt-auto flex items-baseline justify-between border-y-[3px] border-double border-ink px-2 pt-1 font-hand text-[28px] leading-10"
    >
      <span>Sueldos</span>
      <span class="tabular-nums" :class="totalWages > 0 ? 'text-red-700' : ''"
        >{{ formatEuros(totalWages > 0 ? -totalWages : 0) }} / semana</span
      >
    </p>
  </div>
</template>

<style scoped>
.ghost:hover .ghost__plus,
.ghost:focus-visible .ghost__plus {
  opacity: 1;
}
.ghost:hover :deep(svg g) {
  stroke: var(--color-ink);
  fill: rgb(0 0 0 / 0.08);
}
</style>
