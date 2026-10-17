/**
 * Pestañas del cuaderno de informes, como datos: añadir un informe = añadir
 * una entrada (el Bloque H del plan las irá desbloqueando por división o fase).
 */
import type { Component } from 'vue'
import type { Game } from '@/sim/game'
import { STAFF_ROLES } from '@/sim/economy/staff'
import GrantsReport from '@/ui/reports/GrantsReport.vue'
import MatchesReport from '@/ui/reports/MatchesReport.vue'
import StaffReport from '@/ui/reports/StaffReport.vue'

export interface ReportTab {
  readonly id: string
  readonly title: string
  /** Color pastel de la lengüeta y del recuadro del título. */
  readonly color: string
  readonly component: Component
  /** Cifra junto al título (p. ej. cuánta gente hay en plantilla). */
  readonly count?: (game: Game) => number
  /** ¿Está desbloqueada? Las bloqueadas no se muestran. */
  readonly unlocked: () => boolean
}

export const REPORT_TABS: readonly ReportTab[] = [
  {
    id: 'staff',
    title: 'Personal',
    color: '#9fdcae',
    component: StaffReport,
    count: (game) => STAFF_ROLES.reduce((sum, role) => sum + (game.state.club.staff[role] ?? 0), 0),
    unlocked: () => true,
  },
  {
    id: 'matches',
    title: 'Partidos',
    color: '#f4c77d',
    component: MatchesReport,
    count: (game) => game.state.club.matches.length,
    unlocked: () => true,
  },
  {
    id: 'grants',
    title: 'Subvenciones',
    color: '#c9b6e8',
    component: GrantsReport,
    count: (game) => game.state.club.grants.active.length,
    unlocked: () => true,
  },
]
