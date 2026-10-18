<script setup lang="ts">
/**
 * Apartado del tablón con las subvenciones en marcha: título en negrita con
 * su cuadradito, lo que se cobra al cumplir en rojo a la derecha y las tareas
 * debajo, tachadas al cumplirse. Si hay ofertas sin aceptar, una línea que
 * lleva a la pestaña Subvenciones del cuaderno, donde se gestiona todo.
 */
import { computed } from 'vue'
import { formatEuros } from '@/ui/composables/formatMoney'
import { useReports } from '@/ui/reports/useReports'
import ObjectiveRows from './ObjectiveRows.vue'
import { useGrantsBoard } from './useGrantsBoard'

const reports = useReports()
const { active, offered } = useGrantsBoard()

const offeredText = computed(() =>
  offered.value.length === 1
    ? 'El ayuntamiento ofrece 1 subvención'
    : `El ayuntamiento ofrece ${offered.value.length} subvenciones`,
)

function openGrants(): void {
  reports.selectTab('grants')
  reports.open()
}
</script>

<template>
  <section v-for="grant in active" :key="grant.def.id" class="mt-1">
    <h3 class="flex items-baseline gap-1.5">
      <span class="bullet" aria-hidden="true" />
      <button
        type="button"
        class="cursor-pointer text-left font-hand text-[18px] leading-5 font-bold hover:text-ink-blue focus-visible:outline-2 focus-visible:outline-ink"
        title="Abrir Subvenciones en Informes"
        @click="openGrants"
      >
        {{ grant.def.name }}
      </button>
      <span class="ml-auto pl-1 font-hand text-[16px] leading-5 whitespace-nowrap text-red-800">{{
        formatEuros(grant.def.bonus)
      }}</span>
    </h3>
    <ObjectiveRows class="pl-3" :rows="grant.rows" todo compact />
  </section>

  <section v-if="offered.length > 0" class="mt-1">
    <h3 class="flex items-baseline gap-1.5">
      <span class="bullet" aria-hidden="true" />
      <span class="font-hand text-[18px] leading-5 font-bold">Ofertas nuevas</span>
    </h3>
    <button
      type="button"
      class="cursor-pointer pl-5 text-left font-hand text-[15px] leading-5 text-ink-blue underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
      @click="openGrants"
    >
      {{ offeredText }} (ver en Informes)
    </button>
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
