/**
 * Precio de cada comando: lo que cuesta (obras, mejoras, mover) y lo que se
 * recupera (demoler). Se calcula ANTES de ejecutar, sin tocar el estado, para
 * poder bloquear las obras sin fondos y enseñar el coste en la vista previa.
 *
 * Reglas (docs/prompts/FASE2-ESPECIFICACION.md §4.9):
 *  - Obras: precio de lo nuevo (suelo y muro por casilla que cambia, objeto,
 *    puerta, grada). Pintar encima de otro suelo no devuelve el anterior.
 *  - Mejoras: el coste del nivel siguiente.
 *  - Mover un objeto: gratis. Un campo con su estadio o un bloque: un % de su valor.
 *  - Demoler: se recupera un % del valor (objetos más que suelos, muros,
 *    puertas, gradas y campos).
 */
import { maxTier, type BuildingDef, type PlacedBuilding } from '../buildings/buildings'
import { planMove } from '../buildings/move'
import { placementRect, standsOf, validatePlaceStand } from '../buildings/stands'
import type { Command } from '../commands'
import type { SimContent } from '../content'
import { footprint, perimeterTiles, tilesInRect, type TileCoord, type TileRect } from '../geometry'
import { attachedTo, demolishTargetAt, validateDemolishArea } from '../map/demolish'
import { DEFAULT_FLOOR } from '../map/floors'
import { buildingFootprint, tileIndex, type MapState } from '../map/map'
import { planBlockMove } from '../map/moveBlock'
import { NO_DOOR, NO_WALL } from '../map/structureTypes'
import type { LedgerConcept } from './ledger'
import { buildingRepairCost, pitchRepairCost } from './upkeep'
import { grantDef } from '../club/grants'

export interface CommandPrice {
  /** Lo que se paga (≥ 0). */
  readonly cost: number
  /** Lo que se recupera (≥ 0). */
  readonly refund: number
  readonly concept: LedgerConcept
  /** Concepto de lo que se recupera o se cobra (por defecto, demoler). */
  readonly refundConcept?: LedgerConcept
  /** Zona del mapa a la que se asocia el movimiento (para el texto flotante). */
  readonly rect?: TileRect
}

const FREE: CommandPrice = { cost: 0, refund: 0, concept: 'construction' }

/** Valor de un objeto colocado: lo que costó construirlo más todas sus mejoras. */
export function buildingValue(def: BuildingDef, building: PlacedBuilding): number {
  if (!def.tiers || def.tiers.length === 0) return def.cost
  let value = 0
  for (let tier = 0; tier <= Math.min(building.tier, maxTier(def)); tier++) {
    value += def.tiers[tier]?.cost ?? 0
  }
  return value
}

/** ¿Se recupera como objeto (50 %) o como obra (25 %: campos y gradas)? */
function isStructure(def: BuildingDef): boolean {
  return Boolean(def.pitch || def.stand)
}

/** Lo que se recupera al demoler un objeto (y las gradas que caen con él si es un campo). */
function buildingRefund(state: MapState, content: SimContent, building: PlacedBuilding): number {
  let refund = 0
  for (const piece of [building, ...attachedTo(state, building)]) {
    const def = content.buildings[piece.type]
    if (!def) continue
    const rate = isStructure(def)
      ? content.economy.refund.structures
      : content.economy.refund.objects
    refund += buildingValue(def, piece) * rate
  }
  return refund
}

/** Valor de lo construido en una casilla (suelo pintado, muro y puerta). */
function tileValue(state: MapState, content: SimContent, index: number): number {
  const floor = state.floors[index]
  const wall = state.walls[index]
  const door = state.doors[index]
  let value = 0
  if (floor && floor !== DEFAULT_FLOOR) value += content.floors[floor]?.costPerTile ?? 0
  if (wall && wall !== NO_WALL) value += content.walls[wall]?.costPerTile ?? 0
  if (door && door !== NO_DOOR) value += content.doors[door]?.cost ?? 0
  return value
}

const tileRect = (tile: TileCoord): TileRect => ({ ...tile, width: 1, height: 1 })

/** Precio de un comando en el estado actual (sin modificarlo). No valida: si el comando falla, no se cobra. */
export function commandPrice(state: MapState, content: SimContent, command: Command): CommandPrice {
  const { buildings, floors, walls, doors } = content
  const refundRate = content.economy.refund.structures

  switch (command.type) {
    case 'placeBuilding': {
      const def = buildings[command.buildingType]
      if (!def) return FREE
      const cost = def.tiers?.[0]?.cost ?? def.cost
      return {
        cost,
        refund: 0,
        concept: 'construction',
        rect: footprint(command.origin, def.size, command.rotation),
      }
    }
    case 'placeStand': {
      const def = buildings[command.buildingType]
      if (!def) return FREE
      const check = validatePlaceStand(
        state,
        content,
        command.buildingType,
        command.pitchId,
        command.slot,
      )
      return {
        cost: def.tiers?.[0]?.cost ?? def.cost,
        refund: 0,
        concept: 'construction',
        ...(check.placement ? { rect: placementRect(check.placement) } : {}),
      }
    }
    case 'upgradeBuilding': {
      const building = state.buildings[command.buildingId]
      const def = building && buildings[building.type]
      if (!building || !def) return FREE
      return {
        cost: def.tiers?.[building.tier + 1]?.cost ?? 0,
        refund: 0,
        concept: 'upgrade',
        rect: buildingFootprint(building, def),
      }
    }
    case 'paintFloor': {
      const perTile = floors[command.floor]?.costPerTile ?? 0
      let cost = 0
      for (const tile of tilesInRect(command.rect)) {
        const index = tileIndex(state, tile)
        if (!state.reserved[index] && state.floors[index] !== command.floor) cost += perTile
      }
      return { cost, refund: 0, concept: 'construction', rect: command.rect }
    }
    case 'buildWalls': {
      const perTile = walls[command.wall]?.costPerTile ?? 0
      let cost = 0
      for (const tile of tilesInRect(command.rect)) {
        if (state.walls[tileIndex(state, tile)] !== command.wall) cost += perTile
      }
      return { cost, refund: 0, concept: 'construction', rect: command.rect }
    }
    case 'buildFoundation': {
      const wallCost = walls[command.wall]?.costPerTile ?? 0
      const floorCost = floors[command.floor]?.costPerTile ?? 0
      let cost = 0
      for (const tile of tilesInRect(command.rect)) {
        if (state.floors[tileIndex(state, tile)] !== command.floor) cost += floorCost
      }
      for (const tile of perimeterTiles(command.rect)) {
        const index = tileIndex(state, tile)
        if (state.doors[index] === NO_DOOR && state.walls[index] !== command.wall) cost += wallCost
      }
      return { cost, refund: 0, concept: 'construction', rect: command.rect }
    }
    case 'placeDoor':
      return {
        cost: doors[command.door]?.cost ?? 0,
        refund: 0,
        concept: 'construction',
        rect: tileRect(command.tile),
      }
    case 'moveBuilding': {
      const building = state.buildings[command.buildingId]
      const def = building && buildings[building.type]
      if (!building || !def) return FREE
      const check = planMove(state, content, command.buildingId, command.origin, command.rotation)
      const destination = check.ok ? check.moves[0]?.to : check.moves?.[0]?.to
      const rect = destination ? buildingFootprint(destination, def) : undefined
      // Mover un objeto es gratis; un campo (con su estadio) cuesta un % de su valor
      if (!def.pitch) return { cost: 0, refund: 0, concept: 'move', ...(rect ? { rect } : {}) }
      let value = buildingValue(def, building)
      for (const stand of standsOf(state, building.id)) {
        const standDef = buildings[stand.type]
        if (standDef) value += buildingValue(standDef, stand)
      }
      return {
        cost: value * content.economy.moveRate,
        refund: 0,
        concept: 'move',
        ...(rect ? { rect } : {}),
      }
    }
    case 'moveBlock': {
      const check = planBlockMove(state, content, command.rect, command.to, command.rotation)
      let value = 0
      for (const { from } of check.tiles ?? [])
        value += tileValue(state, content, tileIndex(state, from))
      for (const { from } of check.moves ?? []) {
        const def = buildings[from.type]
        if (def) value += buildingValue(def, from)
      }
      return {
        cost: value * content.economy.moveRate,
        refund: 0,
        concept: 'move',
        ...(check.target ? { rect: check.target } : {}),
      }
    }
    case 'demolishBuilding': {
      const building = state.buildings[command.buildingId]
      const def = building && buildings[building.type]
      if (!building || !def) return { ...FREE, concept: 'demolish' }
      return {
        cost: 0,
        refund: buildingRefund(state, content, building),
        concept: 'demolish',
        rect: buildingFootprint(building, def),
      }
    }
    case 'demolishAt': {
      const target = demolishTargetAt(state, command.tile)
      const index = tileIndex(state, command.tile)
      if (!target) return { ...FREE, concept: 'demolish' }
      if (target.kind === 'building') {
        const def = buildings[target.building.type]
        return {
          cost: 0,
          refund: buildingRefund(state, content, target.building),
          concept: 'demolish',
          rect: def ? buildingFootprint(target.building, def) : tileRect(command.tile),
        }
      }
      const value =
        target.kind === 'door'
          ? (doors[state.doors[index] ?? NO_DOOR]?.cost ?? 0)
          : target.kind === 'wall'
            ? (walls[state.walls[index] ?? NO_WALL]?.costPerTile ?? 0)
            : (floors[state.floors[index] ?? DEFAULT_FLOOR]?.costPerTile ?? 0)
      return {
        cost: 0,
        refund: value * refundRate,
        concept: 'demolish',
        rect: tileRect(command.tile),
      }
    }
    case 'demolishArea': {
      const check = validateDemolishArea(state, command.rect)
      let refund = 0
      // Las gradas de un campo derribado ya están en la lista: se cuentan una vez
      if (check.ok) {
        for (const building of check.buildings) {
          const def = buildings[building.type]
          if (!def) continue
          const rate = isStructure(def) ? refundRate : content.economy.refund.objects
          refund += buildingValue(def, building) * rate
        }
      }
      for (const tile of tilesInRect(command.rect)) {
        const index = tileIndex(state, tile)
        if (!state.reserved[index]) refund += tileValue(state, content, index) * refundRate
      }
      return { cost: 0, refund, concept: 'demolish', rect: command.rect }
    }
    case 'demolishStructures': {
      let refund = 0
      for (const tile of tilesInRect(command.rect)) {
        const index = tileIndex(state, tile)
        if (state.reserved[index]) continue
        const wall = state.walls[index]
        const door = state.doors[index]
        if (wall && wall !== NO_WALL) refund += (walls[wall]?.costPerTile ?? 0) * refundRate
        if (door && door !== NO_DOOR) refund += (doors[door]?.cost ?? 0) * refundRate
      }
      return { cost: 0, refund, concept: 'demolish', rect: command.rect }
    }
    case 'setRoomUse':
      return FREE
    case 'acceptGrant': {
      // El adelanto entra como un cobro
      const grant = grantDef(content, command.grantId)
      return { cost: 0, refund: grant?.advance ?? 0, concept: 'grants', refundConcept: 'grants' }
    }
    case 'cancelGrant': {
      const grant = grantDef(content, command.grantId)
      const active = state.club.grants.active.some((a) => a.id === command.grantId)
      if (!grant || !active) return { ...FREE, concept: 'grants' }
      return { cost: grant.advance * content.grants.cancelRate, refund: 0, concept: 'grants' }
    }
    case 'buildBenches':
    case 'upgradeBenches': {
      const building = state.buildings[command.buildingId]
      const def = building && buildings[building.type]
      if (!building || !def?.pitch) return FREE
      const upgrading = command.type === 'upgradeBenches'
      if (upgrading !== (building.benches !== undefined)) return FREE
      const tier = content.match.benches[upgrading ? (building.benches ?? 0) + 1 : 0]
      if (!tier) return FREE
      return {
        cost: tier.cost,
        refund: 0,
        concept: upgrading ? 'upgrade' : 'construction',
        rect: buildingFootprint(building, def),
      }
    }
    case 'repairPitch': {
      const building = state.buildings[command.buildingId]
      const def = building && buildings[building.type]
      if (!building || !def?.pitch) return { ...FREE, concept: 'repairs' }
      return {
        cost: pitchRepairCost(content, def, building),
        refund: 0,
        concept: 'repairs',
        rect: buildingFootprint(building, def),
      }
    }
    case 'repairBuilding': {
      const building = state.buildings[command.buildingId]
      const def = building && buildings[building.type]
      if (!building || !def || !building.broken) return { ...FREE, concept: 'repairs' }
      return {
        cost: buildingRepairCost(content, def, building),
        refund: 0,
        concept: 'repairs',
        rect: buildingFootprint(building, def),
      }
    }
    case 'hireStaff':
    case 'fireStaff':
    case 'setPitchRole':
    case 'setPitchRental':
    case 'designateRoom':
    case 'removeRoom':
    case 'undo':
      return FREE
  }
}
