/**
 * Mover un objeto, campo o grada ya colocado, sin demoler ni reconstruir.
 *
 * Se conserva todo lo del objeto (id, nivel, uso del campo). Un campo se lleva
 * sus gradas: cada una se recoloca en su hueco alrededor del campo nuevo (si
 * el campo gira, el hueco gira con él: la grada norte pasa a ser la este…).
 *
 * Es atómico: `planMove` valida el destino de TODAS las piezas sin tocar el
 * estado, ignorando las casillas que ellas mismas dejan libres (así un objeto
 * se puede desplazar una casilla sobre su propia huella). Solo si todo cabe,
 * `applyMove` libera las huellas viejas y ocupa las nuevas.
 */
import type { SimContent } from '../content'
import {
  footprint,
  isRectInsideGrid,
  tilesInRect,
  type Rotation,
  type TileCoord,
  type TileRect,
} from '../geometry'
import {
  buildingAt,
  buildingFootprint,
  EMPTY_TILE,
  tileIndex,
  type MapState,
  type PlacementError,
} from '../map/map'
import { NO_DOOR, NO_WALL } from '../map/structureTypes'
import type { BuildingId, PlacedBuilding, StandSlot } from './buildings'
import { occupy, release, standDepth, standPlacement, standsOf } from './stands'

export type MoveError =
  | PlacementError
  | 'buildingNotFound'
  /** Las gradas no se mueven solas: se mueve su campo. */
  | 'attachedToPitch'
  /** Mismo sitio y mismo giro: no hay nada que mover. */
  | 'samePlace'

/** Una pieza que se mueve: cómo estaba y cómo quedará. */
export interface Move {
  readonly from: PlacedBuilding
  readonly to: PlacedBuilding
}

export type MoveCheck =
  | { readonly ok: true; readonly moves: readonly Move[] }
  | {
      readonly ok: false
      readonly reason: MoveError
      /** Movimientos calculados aunque no quepan (para la vista previa en rojo). */
      readonly moves?: readonly Move[]
      /** Huellas de destino calculadas, en el mismo orden que `moves`. */
      readonly rects?: readonly TileRect[]
    }

/** Huecos en el orden de un giro de 90° en sentido horario (igual que `Rotation`). */
const SIDES: readonly StandSlot[] = ['north', 'east', 'south', 'west']
const CORNERS: readonly StandSlot[] = ['northEast', 'southEast', 'southWest', 'northWest']

/** Hueco en el que queda una grada cuando su campo gira `turns` cuartos de vuelta. */
export function rotateSlot(slot: StandSlot, turns: number): StandSlot {
  const ring = SIDES.includes(slot) ? SIDES : CORNERS
  const index = ring.indexOf(slot)
  return ring[(index + turns + 4 * 4) % 4] ?? slot
}

/**
 * ¿Se puede mover `buildingId` a `origin` con giro `rotation`? No modifica el
 * estado. Para un campo, calcula también dónde quedan sus gradas.
 */
export function planMove(
  state: MapState,
  content: SimContent,
  buildingId: BuildingId,
  origin: TileCoord,
  rotation: Rotation,
): MoveCheck {
  const building = state.buildings[buildingId]
  const def = building && content.buildings[building.type]
  if (!building || !def) return { ok: false, reason: 'buildingNotFound' }
  if (def.stand) return { ok: false, reason: 'attachedToPitch' }
  const sameOrigin = origin.x === building.origin.x && origin.y === building.origin.y
  if (sameOrigin && rotation === building.rotation) return { ok: false, reason: 'samePlace' }

  const moves: Move[] = [{ from: building, to: { ...building, origin, rotation } }]
  if (def.pitch) {
    const pitchRect = footprint(origin, def.size, rotation)
    const turns = rotation - building.rotation
    for (const stand of standsOf(state, buildingId)) {
      const standDef = content.buildings[stand.type]
      const depth = standDef && standDepth(standDef, stand.tier)
      if (!stand.attach || depth === undefined) continue
      const slot = rotateSlot(stand.attach.slot, turns)
      const placement = standPlacement(pitchRect, slot, depth)
      if (!placement) continue
      moves.push({
        from: stand,
        to: { ...stand, ...placement, attach: { pitchId: buildingId, slot } },
      })
    }
  }

  const rects = moves.map(({ to }) => buildingFootprint(to, content.buildings[to.type] ?? def))
  const moving = new Set(moves.map(({ from }) => from.id))
  for (const rect of rects) {
    const error = checkDestination(state, rect, moving)
    if (error) return { ok: false, reason: error, moves, rects }
  }
  return { ok: true, moves }
}

/**
 * Lo que se coge al hacer clic con la herramienta Mover en una casilla: el
 * objeto o campo que haya; si es una grada, su campo (que se lleva el estadio).
 */
export function moveTargetAt(state: MapState, tile: TileCoord): PlacedBuilding | undefined {
  const building = buildingAt(state, tile)
  if (!building?.attach) return building
  return state.buildings[building.attach.pitchId]
}

/** Aplica un movimiento ya validado por `planMove`. */
export function applyMove(state: MapState, content: SimContent, moves: readonly Move[]): void {
  // Primero se liberan todas las huellas viejas: las nuevas pueden pisarlas.
  for (const { from } of moves) {
    const def = content.buildings[from.type]
    if (def) release(state, from, def)
  }
  for (const { to } of moves) {
    const def = content.buildings[to.type]
    if (!def) continue
    state.buildings[to.id] = to
    occupy(state, buildingFootprint(to, def), to.id)
  }
}

/**
 * ¿Está libre el destino? Las casillas ocupadas por las piezas que se mueven
 * (`moving`) cuentan como libres, porque las dejarán al moverse.
 */
function checkDestination(
  state: MapState,
  rect: TileRect,
  moving: ReadonlySet<BuildingId>,
): PlacementError | null {
  if (rect.x < 0 || rect.y < 0 || !isRectInsideGrid(rect, state.size)) return 'outOfBounds'
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    if (state.reserved[index]) return 'reserved'
    const occupant = state.occupancy[index]
    if (occupant !== undefined && occupant !== EMPTY_TILE && !moving.has(occupant))
      return 'occupied'
    if (state.walls[index] !== NO_WALL || state.doors[index] !== NO_DOOR) return 'wall'
  }
  return null
}
