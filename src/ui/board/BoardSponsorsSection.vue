<script setup lang="ts">
/**
 * Apartado del tablón con los patrocinios en marcha: negocio en negrita con su
 * cuadradito y logotipo diminuto, el bonus en rojo a la derecha, los días que
 * quedan y las tareas debajo, tachadas al cumplirse. Las ofertas van en
 * `BoardOffersSection`.
 */
import { formatEuros } from '@/ui/composables/formatMoney'
import { useReports } from '@/ui/reports/useReports'
import BusinessLogo from './BusinessLogo.vue'
import ObjectiveRows from './ObjectiveRows.vue'
import { useSponsorsBoard } from './useSponsorsBoard'

const reports = useReports()
const { active } = useSponsorsBoard()

function openSponsors(): void {
  reports.selectTab('sponsors')
  reports.open()
}
</script>

<template>
  <section v-for="view in active" :key="view.sponsor.id" class="mt-1">
    <h3 class="flex items-center gap-1.5">
      <span class="bullet" aria-hidden="true" />
      <BusinessLogo v-if="view.business" :logo="view.business.logo" :size="18" />
      <button
        type="button"
        class="cursor-pointer text-left font-hand text-[18px] leading-5 font-bold hover:text-ink-blue focus-visible:outline-2 focus-visible:outline-ink"
        title="Abrir Patrocinios en Informes"
        @click="openSponsors"
      >
        {{ view.name }}
      </button>
      <span class="ml-auto pl-1 font-hand text-[16px] leading-5 whitespace-nowrap text-red-800">{{
        formatEuros(view.sponsor.bonus)
      }}</span>
    </h3>
    <p
      class="pl-3 font-hand text-[14px] leading-5"
      :class="view.daysLeft <= 7 ? 'text-red-800' : 'text-ink/70'"
    >
      {{ view.daysLeft === 1 ? 'queda 1 día' : `quedan ${view.daysLeft} días` }}
    </p>
    <ObjectiveRows class="pl-3" :rows="view.rows" todo compact />
  </section>
</template>

<style scoped>
/* Cuadradito negro de cada apartado */
.bullet {
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  background: var(--color-ink);
  transform: translateY(-1px);
}
</style>
