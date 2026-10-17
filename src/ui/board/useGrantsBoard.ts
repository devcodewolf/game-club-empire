/**
 * Datos de subvenciones para el tablón: ofrecidas y activas con el texto de
 * sus objetivos ya compuesto. Se recalcula con cada evento de la partida.
 */
import { computed } from 'vue'
import { availableGrants, grantDef, type GrantDef } from '@/sim/club/grants'
import { objectiveStatus } from '@/sim/club/objectives'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import { objectiveProgressText, objectiveShortText, objectiveText } from './objectiveText'

export interface ObjectiveRow {
  readonly key: string
  readonly text: string
  /** Texto corto para el tablón. */
  readonly short: string
  readonly progress: string
  readonly done: boolean
}

export interface ActiveGrantView {
  readonly def: GrantDef
  readonly rows: readonly ObjectiveRow[]
  /** Lo que cuesta cancelarla. */
  readonly cancelCost: number
}

export interface OfferedGrantView {
  readonly def: GrantDef
  readonly rows: readonly ObjectiveRow[]
}

export function useGrantsBoard() {
  const game = useGame()
  const version = useGameVersion()

  const active = computed<ActiveGrantView[]>(() => {
    void version.value
    const { state, content } = game
    const views: ActiveGrantView[] = []
    for (const grant of state.club.grants.active) {
      const def = grantDef(content, grant.id)
      if (!def) continue
      views.push({
        def,
        cancelCost: Math.round(def.advance * content.grants.cancelRate),
        rows: def.objectives.map((objective, i) => {
          const done = grant.done[i] === true
          return {
            key: `${def.id}:${i}`,
            text: objectiveText(objective, content),
            short: objectiveShortText(objective, content),
            progress: done
              ? ''
              : objectiveProgressText(
                  objective,
                  objectiveStatus(state, content, objective, grant, i),
                ),
            done,
          }
        }),
      })
    }
    return views
  })

  const offered = computed<OfferedGrantView[]>(() => {
    void version.value
    const { state, content } = game
    return availableGrants(state, content).map((def) => ({
      def,
      rows: def.objectives.map((objective, i) => ({
        key: `${def.id}:${i}`,
        text: objectiveText(objective, content),
        short: objectiveShortText(objective, content),
        progress: '',
        done: false,
      })),
    }))
  })

  const completed = computed<GrantDef[]>(() => {
    void version.value
    const { state, content } = game
    return state.club.grants.completed.flatMap((id) => grantDef(content, id) ?? [])
  })

  const maxActive = computed(() => game.content.grants.maxActive)
  const money = computed(() => (void version.value, game.state.money))

  /** Pendiente: ofrecidas sin aceptar + objetivos sin cumplir de las activas. */
  const pending = computed(
    () =>
      offered.value.length +
      active.value.reduce((sum, grant) => sum + grant.rows.filter((r) => !r.done).length, 0),
  )

  return { active, offered, completed, maxActive, money, pending }
}
