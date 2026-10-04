/**
 * ¿Se puede mejorar un objeto ahora? Lo usan la ficha del objeto y el menú
 * contextual, para que los dos digan lo mismo.
 */
import {
  maxTier,
  type BuildingDef,
  type PlacedBuilding,
  type StandSlot,
  type TierDef,
} from '@/sim/buildings/buildings'
import { lowestNeighbour, validateStandUpgrade } from '@/sim/buildings/stands'
import type { Game } from '@/sim/game'

/** Nombre en español de cada lado, para los avisos de córner. */
const SIDE_NAMES: Partial<Record<StandSlot, string>> = {
  north: 'norte',
  south: 'sur',
  east: 'este',
  west: 'oeste',
}

export interface UpgradeLock {
  /** Siguiente nivel, o undefined si ya está al máximo o no tiene niveles. */
  readonly next: TierDef | undefined
  /** Motivo por el que no se puede mejorar todavía (o null si se puede). */
  readonly reason: string | null
}

/**
 * Siguiente nivel de `building` y, si no se puede alcanzar, por qué: la
 * división (`lockReason`, del store de progresión) o, en las gradas, que no
 * hay sitio detrás para crecer.
 */
export function upgradeLock(
  game: Game,
  building: PlacedBuilding,
  def: BuildingDef,
  lockReason: (requires?: string) => string | null,
): UpgradeLock {
  const hasTiers = (def.tiers?.length ?? 0) > 1
  const next = hasTiers && building.tier < maxTier(def) ? def.tiers?.[building.tier + 1] : undefined
  if (!next) return { next, reason: null }
  const reason = lockReason(next.requires) ?? (def.stand ? standUpgradeBlock(game, building) : null)
  return { next, reason }
}

/** Motivo por el que no se puede ampliar una grada (franja nueva ocupada o fuera del terreno). */
function standUpgradeBlock(game: Game, building: PlacedBuilding): string | null {
  const check = validateStandUpgrade(game.state, game.content, building, building.tier + 1)
  if (check.ok) return null
  if (check.reason === 'occupied' || check.reason === 'wall') {
    return 'Hay algo construido detrás de la grada'
  }
  if (check.reason === 'outOfBounds' || check.reason === 'reserved') {
    return 'La grada no cabe: llega al borde del terreno'
  }
  if (check.reason === 'needsNeighbours') return 'Le falta una grada vecina'
  if (check.reason === 'cornerAboveNeighbours' && building.attach) {
    const lowest = lowestNeighbour(game.state, building.attach.pitchId, building.attach.slot)
    const name = lowest && SIDE_NAMES[lowest]
    return name ? `Mejora antes la grada ${name}` : null
  }
  return null
}
