/**
 * Cuentas del club para la UI: último informe semanal (lunes de cuentas).
 * Escucha la partida una sola vez (`listen`, llamado desde App.vue) en lugar
 * de un suscriptor por componente.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WeeklyReport } from '@/sim/economy/recurring'
import type { Game } from '@/sim/game'

export const useAccountsStore = defineStore('accounts', () => {
  /** Último informe semanal cerrado (`null` antes del primer lunes). */
  const lastReport = ref<WeeklyReport | null>(null)
  /** Sube con cada informe nuevo (para que el aviso reaparezca aunque el informe sea igual). */
  const reportCount = ref(0)

  /** Se suscribe a la partida; devuelve la función para darse de baja. */
  function listen(game: Game): () => void {
    return game.subscribe((event) => {
      if (event.type !== 'weeklyReport') return
      lastReport.value = event.report
      reportCount.value++
    })
  }

  return { lastReport, reportCount, listen }
})
