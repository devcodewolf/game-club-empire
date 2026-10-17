<script setup lang="ts">
/**
 * Sección del tablón: resumen compacto de las subvenciones en marcha (título y
 * objetivos). Toda la gestión (aceptar, cancelar, detalle) está en la pestaña
 * Subvenciones del cuaderno de informes.
 */
import { computed } from 'vue'
import { useReports } from '@/ui/reports/useReports'
import ObjectiveRows from './ObjectiveRows.vue'
import PinnedNote from './PinnedNote.vue'
import { useGrantsBoard } from './useGrantsBoard'

const reports = useReports()
const { active, offered } = useGrantsBoard()

const offeredText = computed(() =>
  offered.value.length === 1
    ? '1 subvención nueva en Informes'
    : `${offered.value.length} subvenciones nuevas en Informes`,
)

function openGrants(): void {
  reports.selectTab('grants')
  reports.open()
}
</script>

<template>
  <PinnedNote v-for="grant in active" :id="grant.def.id" :key="grant.def.id">
    <h3 class="mb-0.5">
      <button
        type="button"
        class="cursor-pointer text-left font-hand text-[18px] leading-5 underline decoration-2 underline-offset-2 hover:text-ink-blue focus-visible:outline-2 focus-visible:outline-ink"
        title="Abrir Subvenciones en Informes"
        @click="openGrants"
      >
        {{ grant.def.name }}
      </button>
    </h3>
    <ObjectiveRows :rows="grant.rows" checks compact />
  </PinnedNote>
  <button
    v-if="offered.length > 0"
    type="button"
    class="cursor-pointer text-left font-hand text-[16px] leading-5 text-white underline [text-shadow:1px_1px_0_rgb(0_0_0/0.6)] focus-visible:outline-2 focus-visible:outline-white"
    @click="openGrants"
  >
    📋 {{ offeredText }}
  </button>
</template>
