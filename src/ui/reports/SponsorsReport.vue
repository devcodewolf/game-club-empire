<script setup lang="ts">
/**
 * Informe de Patrocinios: toda la gestión de los tratos con los negocios del
 * pueblo. En marcha (objetivos, plazo, cancelar en dos pasos), ofertas
 * (aceptar) e historial. El tablón solo muestra un resumen.
 */
import { computed, ref } from 'vue'
import { formatEuros, formatSignedEuros } from '@/ui/composables/formatMoney'
import { useGame } from '@/ui/composables/useGame'
import BusinessLogo from '@/ui/board/BusinessLogo.vue'
import ObjectiveRows from '@/ui/board/ObjectiveRows.vue'
import { useSponsorsBoard } from '@/ui/board/useSponsorsBoard'
import { useNoticeStore } from '@/ui/stores/noticeStore'
import ReportSection from '@/ui/reports/ReportSection.vue'

const game = useGame()
const notices = useNoticeStore()
const { active, offers, history, maxActive, money } = useSponsorsBoard()

const fame = computed(() => game.content.sponsors.fame)

/** Trato que está pidiendo confirmación para cancelar. */
const confirming = ref<string | null>(null)

const full = computed(() => active.value.length >= maxActive.value)
const fullReason = computed(() =>
  maxActive.value === 1
    ? 'Ya tienes 1 patrocinio en marcha'
    : `Ya tienes ${maxActive.value} patrocinios en marcha`,
)

const OUTCOMES = {
  completed: { text: 'Cumplido ✓', class: 'text-green-700' },
  failed: { text: 'Vencido ✗', class: 'text-red-700' },
  cancelled: { text: 'Cancelado', class: 'text-ink/50' },
} as const

const days = (n: number): string => (n === 1 ? '1 día' : `${n} días`)

function cancel(sponsorId: string): void {
  confirming.value = null
  const result = game.dispatch({ type: 'cancelSponsor', sponsorId })
  if (!result.ok) notices.show('💸', 'No hay dinero suficiente para cancelarlo.')
}

function accept(offerId: string): void {
  const result = game.dispatch({ type: 'acceptSponsor', offerId })
  if (!result.ok) notices.show('✋', 'No se puede aceptar este patrocinio ahora.')
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <ReportSection title="En marcha" :count="`${active.length}/${maxActive}`">
      <p v-if="active.length === 0" class="font-hand text-[17px] leading-6 text-ink/60">
        Ningún patrocinio en marcha.
      </p>
      <article
        v-for="view in active"
        :key="view.sponsor.id"
        class="border-b border-dashed border-ink/30 py-1.5 last:border-b-0"
      >
        <h4 class="flex items-center gap-2 font-hand text-[22px] leading-8">
          <BusinessLogo v-if="view.business" :logo="view.business.logo" :size="32" />
          {{ view.name }}
        </h4>
        <ObjectiveRows :rows="view.rows" checks />
        <p
          class="mt-1 font-data text-[12px] font-bold"
          :class="view.daysLeft <= 7 ? 'text-red-700' : ''"
        >
          Quedan {{ days(view.daysLeft) }}
        </p>
        <p class="font-data text-[12px] font-bold">
          Al cumplir: {{ formatSignedEuros(view.sponsor.bonus) }} y +{{ fame.completed }} de fama ·
          Si vence: −{{ Math.abs(fame.failed) }} de fama
        </p>
        <div class="mt-1 font-data text-[12px]">
          <span v-if="confirming === view.sponsor.id" class="flex items-center gap-2">
            ¿Seguro?
            <button
              type="button"
              class="cursor-pointer font-bold text-red-700 underline"
              @click="cancel(view.sponsor.id)"
            >
              Sí
            </button>
            <button
              type="button"
              class="cursor-pointer font-bold underline"
              @click="confirming = null"
            >
              No
            </button>
          </span>
          <button
            v-else
            type="button"
            class="cursor-pointer text-ink/70 underline hover:text-ink disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            :disabled="money < view.cancelCost"
            :title="money < view.cancelCost ? 'No hay dinero para devolver el adelanto' : undefined"
            @click="confirming = view.sponsor.id"
          >
            Cancelar{{ view.cancelCost > 0 ? ` (devuelve ${formatEuros(view.cancelCost)})` : '' }}
          </button>
        </div>
      </article>
    </ReportSection>

    <ReportSection title="Ofertas" :count="offers.length">
      <p v-if="offers.length === 0" class="font-hand text-[17px] leading-6 text-ink/60">
        Por ahora no hay ofertas. Los negocios del pueblo se pasarán pronto.
      </p>
      <article
        v-for="view in offers"
        :key="view.offer.id"
        class="border-b border-dashed border-ink/30 py-1.5 last:border-b-0"
      >
        <h4 class="flex items-center gap-2 font-hand text-[22px] leading-8">
          <BusinessLogo v-if="view.business" :logo="view.business.logo" :size="32" />
          {{ view.name }}
        </h4>
        <ObjectiveRows :rows="view.rows" />
        <p class="mt-1 font-data text-[12px] font-bold">
          <template v-if="view.offer.advance > 0"
            >+{{ formatEuros(view.offer.advance) }} ahora · </template
          >+{{ formatEuros(view.offer.bonus) }} al cumplir · plazo
          {{ view.offer.weeks === 1 ? '1 semana' : `${view.offer.weeks} semanas` }}
        </p>
        <p class="font-data text-[12px] text-ink/70">
          La oferta caduca en {{ days(view.daysLeft) }}
        </p>
        <div class="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            class="cursor-pointer border-2 border-ink bg-[#f6d77a] px-3 font-hand text-[17px] leading-6 shadow-[2px_2px_0_rgb(0_0_0/0.3)] enabled:hover:bg-[#fae39c] focus-visible:outline-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            :disabled="full"
            @click="accept(view.offer.id)"
          >
            Aceptar
          </button>
          <span v-if="full" class="font-data text-[12px] font-bold text-red-700">{{
            fullReason
          }}</span>
        </div>
      </article>
    </ReportSection>

    <ReportSection title="Historial" :count="history.length">
      <p v-if="history.length === 0" class="font-hand text-[17px] leading-6 text-ink/60">
        Aún no has cerrado ningún trato.
      </p>
      <ul v-else class="flex flex-col gap-0.5">
        <li
          v-for="entry in history"
          :key="entry.id"
          class="flex items-center gap-2 font-hand text-[18px] leading-6"
        >
          <BusinessLogo v-if="entry.business" :logo="entry.business.logo" :size="24" />
          <span>{{ entry.name }}</span>
          <span
            class="ml-auto font-data text-[12px] font-bold"
            :class="OUTCOMES[entry.outcome].class"
            >{{ OUTCOMES[entry.outcome].text }}</span
          >
        </li>
      </ul>
    </ReportSection>
  </div>
</template>
