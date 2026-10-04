/**
 * Acciones del menú contextual de un objeto, campo o grada, como datos.
 *
 * Añadir una opción nueva (asignar personal, ver consumo…) = añadir una
 * entrada aquí: el menú solo recorre la lista. Cada acción decide si aparece
 * para ese objeto (`available`) y, si aparece pero no se puede usar todavía,
 * por qué (`lockReason`, se muestra en gris con el motivo).
 */
import type { IconName } from '@/content/icons'
import type { BuildingDef, PlacedBuilding } from '@/sim/buildings/buildings'
import type { Game } from '@/sim/game'
import { upgradeLock } from '@/ui/composables/upgradeLock'

/** Lo que una acción necesita saber y poder hacer. Lo monta el menú. */
export interface ActionContext {
  readonly game: Game
  readonly building: PlacedBuilding
  readonly def: BuildingDef
  /** Motivo de bloqueo por división (store de progresión). */
  readonly lockReason: (requires?: string) => string | null
  /** Coge el objeto con la herramienta Mover (una grada coge su campo). */
  readonly startMove: (building: PlacedBuilding) => void
  /** Abre la ficha lateral del objeto. */
  readonly showSheet: (building: PlacedBuilding) => void
}

export interface BuildingAction {
  readonly id: string
  readonly label: (ctx: ActionContext) => string
  readonly icon: IconName
  /** Acción de riesgo (se pinta en rojo). */
  readonly danger?: boolean
  /** ¿Aparece en el menú de este objeto? Por defecto, siempre. */
  readonly available?: (ctx: ActionContext) => boolean
  /** Si aparece pero no se puede usar ahora, el motivo. */
  readonly lockReason?: (ctx: ActionContext) => string | null
  readonly run: (ctx: ActionContext) => void
}

/** Campo de una grada (las gradas no se mueven solas: se mueve su campo). */
function pitchOf(ctx: ActionContext): PlacedBuilding | undefined {
  const pitchId = ctx.building.attach?.pitchId
  return pitchId === undefined ? undefined : ctx.game.state.buildings[pitchId]
}

export const BUILDING_ACTIONS: readonly BuildingAction[] = [
  {
    id: 'move',
    label: (ctx) => (ctx.building.attach ? 'Mover el campo' : 'Mover'),
    icon: 'arrows-move',
    run: (ctx) => ctx.startMove(pitchOf(ctx) ?? ctx.building),
  },
  {
    id: 'upgrade',
    label: (ctx) => {
      const next = upgradeLock(ctx.game, ctx.building, ctx.def, ctx.lockReason).next
      return next ? `Mejorar: ${next.name}` : 'Mejorar'
    },
    icon: 'arrow-big-up-lines',
    available: (ctx) =>
      upgradeLock(ctx.game, ctx.building, ctx.def, ctx.lockReason).next !== undefined,
    lockReason: (ctx) => upgradeLock(ctx.game, ctx.building, ctx.def, ctx.lockReason).reason,
    run: (ctx) => ctx.game.dispatch({ type: 'upgradeBuilding', buildingId: ctx.building.id }),
  },
  {
    id: 'sheet',
    label: () => 'Ver ficha',
    icon: 'notebook',
    run: (ctx) => ctx.showSheet(ctx.building),
  },
  {
    id: 'demolish',
    label: (ctx) => (ctx.def.pitch ? 'Demoler (con sus gradas)' : 'Demoler'),
    icon: 'hammer',
    danger: true,
    run: (ctx) => ctx.game.dispatch({ type: 'demolishBuilding', buildingId: ctx.building.id }),
  },
]
