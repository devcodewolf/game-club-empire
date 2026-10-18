<script setup lang="ts">
/**
 * Apartado del tablón con las ofertas sin aceptar: una línea por tipo
 * (subvenciones del ayuntamiento, patrocinios de los negocios) que abre su
 * pestaña del cuaderno de informes, donde se eligen.
 */
import { computed } from 'vue'
import { useReports } from '@/ui/reports/useReports'
import { useGrantsBoard } from './useGrantsBoard'
import { useSponsorsBoard } from './useSponsorsBoard'

const reports = useReports()
const { offered } = useGrantsBoard()
const { offers } = useSponsorsBoard()

const lines = computed(() => {
  const list: { key: string; text: string; tab: string }[] = []
  const grants = offered.value.length
  const sponsors = offers.value.length
  if (grants > 0)
    list.push({
      key: 'grants',
      text:
        grants === 1 ? '1 subvención del ayuntamiento' : `${grants} subvenciones del ayuntamiento`,
      tab: 'grants',
    })
  if (sponsors > 0)
    list.push({
      key: 'sponsors',
      text: sponsors === 1 ? '1 patrocinio de un negocio' : `${sponsors} patrocinios de negocios`,
      tab: 'sponsors',
    })
  return list
})

function open(tab: string): void {
  reports.selectTab(tab)
  reports.open()
}
</script>

<template>
  <section v-if="lines.length > 0" class="mt-1">
    <h3 class="flex items-baseline gap-1.5">
      <span class="bullet" aria-hidden="true" />
      <span class="font-hand text-[18px] leading-5 font-bold">Ofertas nuevas</span>
    </h3>
    <ul class="pl-3">
      <li v-for="line in lines" :key="line.key" class="flex items-baseline gap-1.5">
        <span class="size-[5px] shrink-0 -translate-y-0.5 bg-ink" aria-hidden="true" />
        <button
          type="button"
          class="cursor-pointer text-left font-hand text-[15px] leading-5 text-ink-blue underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
          title="Ver en Informes"
          @click="open(line.tab)"
        >
          {{ line.text }}
        </button>
      </li>
    </ul>
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
