<script setup lang="ts">
/**
 * Informe de Partidos: el próximo domingo con partido, el resumen de la
 * temporada (PJ, G, E, P, goles y puntos), la lista de resultados con su
 * dinero neto y una nota a mano para la clasificación, que llega con la liga
 * (Fase 3).
 */
import { computed } from 'vue'
import { formatNumber } from '@/render/core/formatNumber'
import { mainPitch } from '@/sim/club/match'
import type { MatchResult } from '@/sim/club/match'
import { MINUTES_PER_DAY, fromDate, toDate } from '@/sim/time/calendar'
import { formatSignedEuros } from '@/ui/composables/formatMoney'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import ReportSection from '@/ui/reports/ReportSection.vue'
import { formatDay, formatHour } from '@/ui/time/formatTime'

const game = useGame()
const version = useGameVersion()

/** Puntos por victoria y por empate. */
const POINTS_WIN = 3
const POINTS_DRAW = 1
/** Días que se buscan hacia delante el próximo partido (más de un año). */
const SEARCH_DAYS = 400

/** Momento del próximo domingo con partido a su hora de saque (o null si no hay ninguno). */
function nextKickoff(): number | null {
  const { state, content } = game
  const { match, time } = content
  const event = time.events.find((e) => e.id === match.kickoffEvent)
  const hour = event && 'hour' in event.rule ? event.rule.hour : 17
  const first = fromDate({ year: time.start.year, ...match.firstMatch, hour: 0 })
  const now = state.clock.time
  for (let i = 0; i <= SEARCH_DAYS; i++) {
    const date = toDate(now + i * MINUTES_PER_DAY)
    if (date.weekday !== 6 || match.offSeasonMonths.includes(date.month)) continue
    const kickoff = fromDate({ year: date.year, month: date.month, day: date.day, hour })
    if (kickoff > now && kickoff >= first) return kickoff
  }
  return null
}

const next = computed(() => {
  void version.value
  const { state, content } = game
  const club = state.club
  const hasPitch = mainPitch(state, content) !== null
  const live = club.currentMatch
  if (live) return { when: null, live: true, opponent: live.opponent, home: live.home, hasPitch }
  const announced = club.nextMatch
  if (announced) {
    return {
      when: announced.kickoff,
      live: false,
      opponent: announced.opponent,
      home: announced.home,
      hasPitch,
    }
  }
  const number = club.matches.length + 1
  return {
    when: nextKickoff(),
    live: false,
    opponent: null,
    // Impares en casa; sin campo principal, todo fuera
    home: number % 2 === 1 && hasPitch,
    hasPitch,
  }
})

/** Dinero neto del día de partido (furgoneta y multa son gastos). */
function net(match: MatchResult): number {
  const m = match.money
  return m.tickets + m.bar + m.parking - m.travel - m.fine
}

const OUTCOME_TEXT = {
  win: 'text-green-700',
  draw: 'text-amber-700',
  loss: 'text-red-700',
} as const

/** Resultados del más reciente al más antiguo; el local va primero en el marcador. */
const results = computed(() => {
  void version.value
  return [...game.state.club.matches].reverse().map((m) => ({
    number: m.number,
    day: formatDay(m.at),
    home: m.home,
    opponent: m.opponent,
    score: m.home ? `${m.goalsFor} – ${m.goalsAgainst}` : `${m.goalsAgainst} – ${m.goalsFor}`,
    scoreClass: OUTCOME_TEXT[m.outcome],
    attendance: m.attendance ? formatNumber(m.attendance.total) : '–',
    net: net(m),
  }))
})

const season = computed(() => {
  void version.value
  const matches = game.state.club.matches
  let won = 0
  let drawn = 0
  let lost = 0
  let goalsFor = 0
  let goalsAgainst = 0
  for (const m of matches) {
    if (m.outcome === 'win') won++
    else if (m.outcome === 'draw') drawn++
    else lost++
    goalsFor += m.goalsFor
    goalsAgainst += m.goalsAgainst
  }
  return [
    { label: 'PJ', value: matches.length },
    { label: 'G', value: won },
    { label: 'E', value: drawn },
    { label: 'P', value: lost },
    { label: 'GF', value: goalsFor },
    { label: 'GC', value: goalsAgainst },
    { label: 'Pts', value: won * POINTS_WIN + drawn * POINTS_DRAW },
  ]
})

const cell = 'px-2 py-0.5'
</script>

<template>
  <div class="flex min-h-full flex-col">
    <ReportSection title="Próximo partido">
      <p v-if="next.live" class="font-hand text-[20px] leading-7">
        En juego ahora: {{ next.home ? 'en casa' : 'fuera' }} contra {{ next.opponent }}
      </p>
      <template v-else>
        <p class="font-hand text-[20px] leading-7">
          <template v-if="next.when !== null"
            >{{ formatDay(next.when) }} · {{ formatHour(next.when) }}</template
          >
          <template v-else>Sin más partidos programados</template>
          · {{ next.home ? 'en casa' : 'fuera' }}
        </p>
        <p class="font-hand text-[18px] leading-6 text-ink-blue">
          {{ next.opponent ? `Rival: ${next.opponent}` : 'Rival por anunciar' }}
        </p>
      </template>
      <p v-if="!next.hasPitch" class="font-hand text-[17px] leading-6 text-red-700">
        No hay campo principal: todos los partidos se jugarán fuera.
      </p>
    </ReportSection>

    <ReportSection title="Temporada">
      <table class="w-full table-fixed border-collapse text-center" aria-label="Resumen">
        <thead>
          <tr class="font-hand text-[16px] leading-5 text-ink/70">
            <th v-for="item in season" :key="item.label" scope="col" class="font-normal">
              {{ item.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="font-data text-[18px] font-bold tabular-nums">
            <td v-for="item in season" :key="item.label">{{ item.value }}</td>
          </tr>
        </tbody>
      </table>
    </ReportSection>

    <ReportSection title="Resultados" :count="results.length">
      <p v-if="results.length === 0" class="font-hand text-[17px] leading-6 text-ink/60">
        Aún no se ha jugado ningún partido.
      </p>
      <div v-else class="max-h-72 overflow-y-auto">
        <table class="w-full border-collapse text-left" aria-label="Resultados">
          <thead>
            <tr class="sticky top-0 bg-paper font-hand text-[15px] leading-5 text-ink/70">
              <th scope="col" :class="[cell, 'font-normal']">J</th>
              <th scope="col" :class="[cell, 'font-normal']">Fecha</th>
              <th scope="col" :class="[cell, 'font-normal']">C/F</th>
              <th scope="col" :class="[cell, 'font-normal']">Rival</th>
              <th scope="col" :class="[cell, 'text-center font-normal']">Marcador</th>
              <th scope="col" :class="[cell, 'text-right font-normal']">Público</th>
              <th scope="col" :class="[cell, 'text-right font-normal']">Dinero</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in results"
              :key="row.number"
              class="border-t border-ink/25 font-data text-[13px] tabular-nums"
            >
              <td :class="cell">{{ row.number }}</td>
              <td :class="[cell, 'whitespace-nowrap']">{{ row.day }}</td>
              <td :class="cell">{{ row.home ? 'C' : 'F' }}</td>
              <td :class="[cell, 'font-hand text-[16px]']">{{ row.opponent }}</td>
              <td :class="[cell, 'text-center font-bold whitespace-nowrap', row.scoreClass]">
                {{ row.score }}
              </td>
              <td :class="[cell, 'text-right']">{{ row.attendance }}</td>
              <td
                :class="[
                  cell,
                  'text-right whitespace-nowrap',
                  row.net < 0 ? 'text-red-700' : 'text-green-700',
                ]"
              >
                {{ formatSignedEuros(row.net) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ReportSection>

    <ReportSection title="Clasificación">
      <p class="font-hand text-[19px] leading-6 text-ink-blue">
        La clasificación llegará con la liga (Fase 3).
      </p>
    </ReportSection>
  </div>
</template>
