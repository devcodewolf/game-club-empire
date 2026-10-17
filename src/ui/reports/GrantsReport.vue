<script setup lang="ts">
/**
 * Informe de Subvenciones: toda la gestión. Las que están en marcha (con sus
 * objetivos y cancelación en dos pasos), las que ofrece el ayuntamiento
 * (aceptar) y las ya cumplidas. El tablón solo muestra un resumen.
 */
import { computed, ref } from 'vue'
import { formatEuros, formatSignedEuros } from '@/ui/composables/formatMoney'
import { useGame } from '@/ui/composables/useGame'
import ObjectiveRows from '@/ui/board/ObjectiveRows.vue'
import { useGrantsBoard } from '@/ui/board/useGrantsBoard'
import { useNoticeStore } from '@/ui/stores/noticeStore'
import ReportSection from '@/ui/reports/ReportSection.vue'

const game = useGame()
const notices = useNoticeStore()
const { active, offered, completed, maxActive, money } = useGrantsBoard()

/** Subvención que está pidiendo confirmación para cancelar. */
const confirming = ref<string | null>(null)

const full = computed(() => active.value.length >= maxActive.value)
const fullReason = computed(() =>
  maxActive.value === 1
    ? 'Ya tienes 1 subvención en marcha'
    : `Ya tienes ${maxActive.value} subvenciones en marcha`,
)

function cancel(grantId: string): void {
  confirming.value = null
  const result = game.dispatch({ type: 'cancelGrant', grantId })
  if (!result.ok) notices.show('💸', 'No hay dinero suficiente para cancelarla.')
}

function accept(grantId: string): void {
  const result = game.dispatch({ type: 'acceptGrant', grantId })
  if (!result.ok) notices.show('✋', 'No se puede aceptar esta subvención ahora.')
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <ReportSection title="En marcha" :count="`${active.length}/${maxActive}`">
      <p v-if="active.length === 0" class="font-hand text-[17px] leading-6 text-ink/60">
        Ninguna subvención en marcha.
      </p>
      <article
        v-for="grant in active"
        :key="grant.def.id"
        class="border-b border-dashed border-ink/30 py-1.5 last:border-b-0"
      >
        <p class="font-data text-[11px] font-bold tracking-wide text-ink/70 uppercase">
          {{ grant.def.from }}
        </p>
        <h4 class="font-hand text-[22px] leading-6">{{ grant.def.name }}</h4>
        <ObjectiveRows :rows="grant.rows" checks />
        <p class="mt-1 font-data text-[12px] font-bold">
          Al cumplir: {{ formatSignedEuros(grant.def.bonus) }}
          <template v-if="grant.def.fame > 0"> y +{{ grant.def.fame }} de fama</template>
        </p>
        <div class="mt-1 font-data text-[12px]">
          <span v-if="confirming === grant.def.id" class="flex items-center gap-2">
            ¿Seguro?
            <button
              type="button"
              class="cursor-pointer font-bold text-red-700 underline"
              @click="cancel(grant.def.id)"
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
            :disabled="money < grant.cancelCost"
            :title="
              money < grant.cancelCost ? 'No hay dinero para devolver el adelanto' : undefined
            "
            @click="confirming = grant.def.id"
          >
            Cancelar{{ grant.cancelCost > 0 ? ` (devuelve ${formatEuros(grant.cancelCost)})` : '' }}
          </button>
        </div>
      </article>
    </ReportSection>

    <ReportSection title="El ayuntamiento ofrece" :count="offered.length">
      <p v-if="offered.length === 0" class="font-hand text-[17px] leading-6 text-ink/60">
        Por ahora no hay ofertas nuevas.
      </p>
      <article
        v-for="grant in offered"
        :key="grant.def.id"
        class="border-b border-dashed border-ink/30 py-1.5 last:border-b-0"
      >
        <h4 class="font-hand text-[22px] leading-6">{{ grant.def.name }}</h4>
        <p class="font-hand text-[17px] leading-5 italic">«{{ grant.def.pitch }}»</p>
        <ObjectiveRows :rows="grant.rows" />
        <p class="mt-1 font-data text-[12px] font-bold">
          <template v-if="grant.def.advance > 0"
            >+{{ formatEuros(grant.def.advance) }} ahora · </template
          >+{{ formatEuros(grant.def.bonus) }} al cumplir
          <template v-if="grant.def.fame > 0"> · +{{ grant.def.fame }} de fama</template>
        </p>
        <div class="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            class="cursor-pointer border-2 border-ink bg-[#f6d77a] px-3 font-hand text-[17px] leading-6 shadow-[2px_2px_0_rgb(0_0_0/0.3)] enabled:hover:bg-[#fae39c] focus-visible:outline-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            :disabled="full"
            @click="accept(grant.def.id)"
          >
            Aceptar
          </button>
          <span v-if="full" class="font-data text-[12px] font-bold text-red-700">{{
            fullReason
          }}</span>
        </div>
      </article>
    </ReportSection>

    <ReportSection title="Cumplidas" :count="completed.length">
      <p v-if="completed.length === 0" class="font-hand text-[17px] leading-6 text-ink/60">
        Aún no has cumplido ninguna.
      </p>
      <ul v-else class="flex flex-col">
        <li
          v-for="grant in completed"
          :key="grant.id"
          class="flex items-baseline justify-between gap-2 font-hand text-[18px] leading-6"
        >
          <span><span aria-hidden="true">☑</span> {{ grant.name }}</span>
          <span class="font-data text-[12px] font-bold tabular-nums">
            {{ formatSignedEuros(grant.bonus)
            }}<template v-if="grant.fame > 0"> · +{{ grant.fame }} de fama</template>
          </span>
        </li>
      </ul>
    </ReportSection>
  </div>
</template>
