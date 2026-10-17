<script setup lang="ts">
/**
 * Aviso del lunes de cuentas: una hoja de libreta pequeña que aparece unos
 * segundos con el resumen de la semana. Se cierra sola o al hacer clic.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import NotebookSheet from '@/ui/components/NotebookSheet.vue'
import { useAccountsStore } from '@/ui/stores/accountsStore'
import { formatEuros, formatSignedEuros } from '@/ui/composables/formatMoney'

const VISIBLE_MS = 8000

const accounts = useAccountsStore()
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function close(): void {
  if (timer) clearTimeout(timer)
  timer = null
  visible.value = false
}

function open(): void {
  // TODO Bloque H: abrir Finanzas
  close()
}

watch(
  () => accounts.reportCount,
  () => {
    if (timer) clearTimeout(timer)
    visible.value = true
    timer = setTimeout(close, VISIBLE_MS)
  },
)
onBeforeUnmount(close)
</script>

<template>
  <Transition
    enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
    enter-from-class="motion-safe:translate-x-4 motion-safe:opacity-0"
    leave-active-class="motion-safe:transition motion-safe:duration-150 motion-safe:ease-in"
    leave-to-class="motion-safe:translate-x-4 motion-safe:opacity-0"
  >
    <button
      v-if="visible && accounts.lastReport"
      type="button"
      class="pointer-events-auto block w-80 cursor-pointer text-left focus-visible:outline-2"
      aria-label="Lunes de cuentas: ver finanzas"
      @click="open"
    >
      <NotebookSheet class="pt-1 pr-3 pb-2 pl-10">
        <h2 class="font-hand text-[26px] leading-[40px] underline decoration-2 underline-offset-4">
          Lunes de cuentas
        </h2>
        <p class="font-data text-[11px] leading-6 font-bold whitespace-nowrap tabular-nums">
          Ingresos {{ formatEuros(accounts.lastReport.income) }} · Gastos
          {{ formatEuros(accounts.lastReport.expenses) }} · Neto
          <span :class="accounts.lastReport.net < 0 ? 'text-red-700' : 'text-green-700'">{{
            formatSignedEuros(accounts.lastReport.net)
          }}</span>
        </p>
      </NotebookSheet>
    </button>
  </Transition>
</template>
