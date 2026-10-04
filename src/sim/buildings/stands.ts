/**
 * Gradas modulares (docs/DISENO-ESTADIO-Y-NIVELES.md).
 *
 * Una grada es un objeto colocado ligado a un hueco de un campo
 * (`attach: { pitchId, slot }`). Su posición, giro y tamaño no se eligen: se
 * calculan a partir del campo, el hueco y el nivel. Siempre mira al campo y
 * crece HACIA FUERA al subir de nivel (la primera fila sigue pegada al
 * pasillo perimetral, que es el margen de 2 casillas del propio campo).
 */
import type { BuildingDef, BuildingId, PlacedBuilding, StandSlot } from './buildings'
import type { SimContent } from '../content'
import {
  footprint,
  isRectInsideGrid,
  tilesInRect,
  type GridSize,
  type Rotation,
  type TileCoord,
  type TileRect,
} from '../geometry'
import { buildingFootprint, EMPTY_TILE, tileIndex, type MapState } from '../map/map'
import { NO_DOOR, NO_WALL } from '../map/structureTypes'

/**
 * Tope de espectadores de un estadio completo (4 lados y 4 esquinas al nivel
 * máximo). Provisional hasta equilibrar la economía en la Fase 3.
 */
export const MAX_STADIUM_CAPACITY = 100_000

/** Huecos de lado (laterales y fondos). */
export const SIDE_SLOTS: readonly StandSlot[] = ['north', 'south', 'east', 'west']

/** Huecos de esquina (córners). */
export const CORNER_SLOTS: readonly StandSlot[] = [
  'northEast',
  'southEast',
  'southWest',
  'northWest',
]

/** Lados vecinos de cada córner: el córner no puede pasar del nivel del más bajo. */
export const CORNER_NEIGHBOURS: Readonly<
  Partial<Record<StandSlot, readonly [StandSlot, StandSlot]>>
> = {
  northEast: ['north', 'east'],
  southEast: ['south', 'east'],
  southWest: ['south', 'west'],
  northWest: ['north', 'west'],
}

/**
 * Largo equivalente de un córner por casilla de fondo: sus filas son cuartos
 * de arco (≈ 0,785 × fondo a media altura) menos los pasillos; ajustado para
 * que un estadio completo de fútbol 11 se quede por debajo de MAX_STADIUM_CAPACITY.
 */
export const CORNER_LENGTH_PER_DEPTH = 0.65

export function isCornerSlot(slot: StandSlot): boolean {
  return CORNER_SLOTS.includes(slot)
}

/** Colocación calculada de una grada: lo que se guarda en el PlacedBuilding. */
export interface StandPlacement {
  readonly origin: TileCoord
  readonly rotation: Rotation
  /** Tamaño sin girar: ancho = largo del lado, alto = fondo de la grada. */
  readonly size: GridSize
}

/**
 * Colocación de una grada de fondo `depth` en un lado del campo. Sin girar,
 * el frente de una grada mira hacia abajo; el giro la orienta al campo.
 */
export function standPlacement(
  pitch: TileRect,
  slot: StandSlot,
  depth: number,
): StandPlacement | null {
  switch (slot) {
    case 'north':
      return {
        origin: { x: pitch.x, y: pitch.y - depth },
        rotation: 0,
        size: { width: pitch.width, height: depth },
      }
    case 'south':
      return {
        origin: { x: pitch.x, y: pitch.y + pitch.height },
        rotation: 2,
        size: { width: pitch.width, height: depth },
      }
    case 'east':
      return {
        origin: { x: pitch.x + pitch.width, y: pitch.y },
        rotation: 1,
        size: { width: pitch.height, height: depth },
      }
    case 'west':
      return {
        origin: { x: pitch.x - depth, y: pitch.y },
        rotation: 3,
        size: { width: pitch.height, height: depth },
      }
    // Córners: cuadrado de lado `depth` pegado al vértice del campo. Sin girar,
    // el vértice del campo queda abajo a la izquierda (como el córner noreste).
    case 'northEast':
      return corner(pitch.x + pitch.width, pitch.y - depth, 0, depth)
    case 'southEast':
      return corner(pitch.x + pitch.width, pitch.y + pitch.height, 1, depth)
    case 'southWest':
      return corner(pitch.x - depth, pitch.y + pitch.height, 2, depth)
    case 'northWest':
      return corner(pitch.x - depth, pitch.y - depth, 3, depth)
  }
}

function corner(x: number, y: number, rotation: Rotation, depth: number): StandPlacement {
  return { origin: { x, y }, rotation, size: { width: depth, height: depth } }
}

/** Rectángulo que ocupa una colocación. */
export function placementRect(placement: StandPlacement): TileRect {
  return footprint(placement.origin, placement.size, placement.rotation)
}

/** Fondo de la grada en un nivel (o undefined si el nivel no existe). */
export function standDepth(def: BuildingDef, tier: number): number | undefined {
  return def.stand?.depths[tier]
}

/**
 * Aforo de una grada colocada: aforo por casilla de largo × largo. En los
 * córners el largo equivale a una fracción del fondo (filas en arco).
 */
export function standCapacity(def: BuildingDef, building: PlacedBuilding): number {
  const perTile = def.stand?.capacityPerTile[building.tier] ?? 0
  const width = building.size?.width ?? 0
  const corner = building.attach && isCornerSlot(building.attach.slot)
  return perTile * (corner ? Math.round(width * CORNER_LENGTH_PER_DEPTH) : width)
}

/** Grada que ya ocupa un hueco de un campo, si la hay. */
export function standAt(
  state: MapState,
  pitchId: BuildingId,
  slot: StandSlot,
): PlacedBuilding | undefined {
  return Object.values(state.buildings).find(
    (b) => b.attach?.pitchId === pitchId && b.attach.slot === slot,
  )
}

/** Gradas ligadas a un campo. */
export function standsOf(state: MapState, pitchId: BuildingId): PlacedBuilding[] {
  return Object.values(state.buildings).filter((b) => b.attach?.pitchId === pitchId)
}

/** Aforo de un campo: la suma de sus gradas. */
export function pitchCapacity(state: MapState, content: SimContent, pitchId: BuildingId): number {
  return standsOf(state, pitchId).reduce((total, stand) => {
    const def = content.buildings[stand.type]
    return def ? total + standCapacity(def, stand) : total
  }, 0)
}

export type StandError =
  | 'unknownBuilding'
  | 'notAPitch'
  | 'notAStand'
  | 'slotTaken'
  | 'slotLocked'
  | 'outOfBounds'
  | 'reserved'
  | 'occupied'
  | 'wall'
  /** El córner necesita las dos gradas de los lados vecinos. */
  | 'needsNeighbours'
  /** El córner no puede pasar del nivel de la grada vecina más baja. */
  | 'cornerAboveNeighbours'

/**
 * Nivel máximo que admite un córner (el de su vecina más baja), o null si
 * le falta alguna de las dos gradas vecinas.
 */
export function cornerTierLimit(
  state: MapState,
  pitchId: BuildingId,
  slot: StandSlot,
): number | null {
  const neighbours = CORNER_NEIGHBOURS[slot]
  if (!neighbours) return null
  const tiers = neighbours.map((side) => standAt(state, pitchId, side)?.tier)
  if (tiers.some((tier) => tier === undefined)) return null
  return Math.min(...(tiers as number[]))
}

/** Vecina más baja de un córner (para decir cuál hay que mejorar antes). */
export function lowestNeighbour(
  state: MapState,
  pitchId: BuildingId,
  slot: StandSlot,
): StandSlot | undefined {
  const neighbours = CORNER_NEIGHBOURS[slot]
  if (!neighbours) return undefined
  const [a, b] = neighbours
  const tierA = standAt(state, pitchId, a)?.tier ?? -1
  const tierB = standAt(state, pitchId, b)?.tier ?? -1
  return tierA <= tierB ? a : b
}

/**
 * ¿Está libre la zona para una grada? Ignora las casillas del propio objeto
 * (`ignoreId`), para poder crecer sobre su huella actual al mejorar.
 */
export function checkStandArea(
  state: MapState,
  rect: TileRect,
  ignoreId?: BuildingId,
): StandError | null {
  if (!isRectInsideGrid(rect, state.size) || rect.x < 0 || rect.y < 0) return 'outOfBounds'
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    if (state.reserved[index]) return 'reserved'
    const occupant = state.occupancy[index]
    if (occupant !== EMPTY_TILE && occupant !== ignoreId) return 'occupied'
    if (state.walls[index] !== NO_WALL || state.doors[index] !== NO_DOOR) return 'wall'
  }
  return null
}

/** Datos del campo para colocar gradas, o el error. */
function pitchFor(
  state: MapState,
  content: SimContent,
  pitchId: BuildingId,
): TileRect | StandError {
  const pitch = state.buildings[pitchId]
  const def = pitch && content.buildings[pitch.type]
  if (!pitch || !def) return 'notAPitch'
  if (!def.pitch) return 'notAPitch'
  return buildingFootprint(pitch, def)
}

export type StandCheck =
  | { readonly ok: true; readonly placement: StandPlacement }
  | { readonly ok: false; readonly reason: StandError; readonly placement?: StandPlacement }

/** ¿Se puede construir la grada `standType` (nivel 1) en ese hueco? Sin modificar nada. */
export function validatePlaceStand(
  state: MapState,
  content: SimContent,
  standType: string,
  pitchId: BuildingId,
  slot: StandSlot,
): StandCheck {
  const def = content.buildings[standType]
  if (!def?.stand) return { ok: false, reason: 'unknownBuilding' }
  const pitch = pitchFor(state, content, pitchId)
  if (typeof pitch === 'string') return { ok: false, reason: pitch }
  // Cada pieza va en su tipo de hueco: gradas en los lados, córners en las esquinas.
  if (isCornerSlot(slot) !== Boolean(def.stand.corner)) return { ok: false, reason: 'slotLocked' }
  if (standAt(state, pitchId, slot)) return { ok: false, reason: 'slotTaken' }
  const depth = standDepth(def, 0) ?? 1
  const placement = standPlacement(pitch, slot, depth)
  if (!placement) return { ok: false, reason: 'slotLocked' }
  // Con la colocación, para que la vista previa marque en rojo dónde iría
  if (def.stand.corner && cornerTierLimit(state, pitchId, slot) === null) {
    return { ok: false, reason: 'needsNeighbours', placement }
  }
  const error = checkStandArea(state, placementRect(placement))
  return error ? { ok: false, reason: error, placement } : { ok: true, placement }
}

/**
 * Colocación de una grada al subir al nivel `tier`: crece hacia fuera desde
 * el mismo lado del campo. Valida que la franja nueva esté libre.
 */
export function validateStandUpgrade(
  state: MapState,
  content: SimContent,
  building: PlacedBuilding,
  tier: number,
): StandCheck {
  const def = content.buildings[building.type]
  if (!def?.stand || !building.attach) return { ok: false, reason: 'notAStand' }
  const pitch = pitchFor(state, content, building.attach.pitchId)
  if (typeof pitch === 'string') return { ok: false, reason: pitch }
  if (isCornerSlot(building.attach.slot)) {
    const limit = cornerTierLimit(state, building.attach.pitchId, building.attach.slot)
    if (limit === null) return { ok: false, reason: 'needsNeighbours' }
    if (tier > limit) return { ok: false, reason: 'cornerAboveNeighbours' }
  }

  const depth = standDepth(def, tier)
  const placement = depth === undefined ? null : standPlacement(pitch, building.attach.slot, depth)
  if (!placement) return { ok: false, reason: 'slotLocked' }
  const error = checkStandArea(state, placementRect(placement), building.id)
  return error ? { ok: false, reason: error, placement } : { ok: true, placement }
}

/**
 * Huella MÁXIMA del hueco (nivel más alto), para el fantasma que avisa de no
 * construir justo detrás de una grada que querrá crecer.
 */
export function maxStandRect(
  state: MapState,
  content: SimContent,
  standType: string,
  pitchId: BuildingId,
  slot: StandSlot,
): TileRect | null {
  const def = content.buildings[standType]
  const pitch = pitchFor(state, content, pitchId)
  if (!def?.stand || typeof pitch === 'string') return null
  const depth = def.stand.depths[def.stand.depths.length - 1] ?? 1
  const placement = standPlacement(pitch, slot, depth)
  return placement ? placementRect(placement) : null
}

/** Campo y hueco a los que apunta una casilla con la herramienta de gradas. */
export interface StandTarget {
  readonly pitchId: BuildingId
  readonly slot: StandSlot
}

/**
 * Hueco al que apunta el cursor: sobre el campo, el lado (o la esquina, si
 * `corner`) más cercano; fuera, el hueco en cuya zona (hasta el fondo máximo
 * de grada) cae la casilla. Se puede apuntar sobre el césped o donde irá.
 */
export function standTargetAt(
  state: MapState,
  content: SimContent,
  tile: TileCoord,
  maxDepth: number,
  corner = false,
): StandTarget | null {
  for (const building of Object.values(state.buildings)) {
    const def = content.buildings[building.type]
    if (!def?.pitch) continue
    const rect = buildingFootprint(building, def)
    const slot = corner ? cornerSlotFor(rect, tile, maxDepth) : sideSlotFor(rect, tile, maxDepth)
    if (slot) return { pitchId: building.id, slot }
  }
  return null
}

/** Esquina: sobre el campo, la del cuadrante; fuera, la zona de esquina en la que cae. */
function cornerSlotFor(r: TileRect, t: TileCoord, maxDepth: number): StandSlot | null {
  const right = r.x + r.width
  const bottom = r.y + r.height
  const inX = t.x >= r.x && t.x < right
  const inY = t.y >= r.y && t.y < bottom
  if (inX && inY) {
    const east = t.x >= r.x + r.width / 2
    const south = t.y >= r.y + r.height / 2
    if (south) return east ? 'southEast' : 'southWest'
    return east ? 'northEast' : 'northWest'
  }
  const eastZone = t.x >= right && t.x < right + maxDepth
  const westZone = t.x < r.x && t.x >= r.x - maxDepth
  const northZone = t.y < r.y && t.y >= r.y - maxDepth
  const southZone = t.y >= bottom && t.y < bottom + maxDepth
  if (northZone && eastZone) return 'northEast'
  if (southZone && eastZone) return 'southEast'
  if (southZone && westZone) return 'southWest'
  if (northZone && westZone) return 'northWest'
  return null
}

function sideSlotFor(r: TileRect, t: TileCoord, maxDepth: number): StandSlot | null {
  const insideX = t.x >= r.x && t.x < r.x + r.width
  const insideY = t.y >= r.y && t.y < r.y + r.height
  if (insideX && insideY) {
    const distances: [StandSlot, number][] = [
      ['north', (t.y - r.y) / r.height],
      ['south', (r.y + r.height - 1 - t.y) / r.height],
      ['west', (t.x - r.x) / r.width],
      ['east', (r.x + r.width - 1 - t.x) / r.width],
    ]
    distances.sort((a, b) => a[1] - b[1])
    return distances[0]?.[0] ?? null
  }
  if (insideX && t.y < r.y && t.y >= r.y - maxDepth) return 'north'
  if (insideX && t.y >= r.y + r.height && t.y < r.y + r.height + maxDepth) return 'south'
  if (insideY && t.x < r.x && t.x >= r.x - maxDepth) return 'west'
  if (insideY && t.x >= r.x + r.width && t.x < r.x + r.width + maxDepth) return 'east'
  return null
}

/** Escribe en la ocupación las casillas de una colocación. */
export function occupy(state: MapState, rect: TileRect, id: BuildingId): void {
  for (const tile of tilesInRect(rect)) state.occupancy[tileIndex(state, tile)] = id
}

/** Libera las casillas de un objeto colocado (según su huella actual). */
export function release(state: MapState, building: PlacedBuilding, def: BuildingDef): void {
  for (const tile of tilesInRect(buildingFootprint(building, def))) {
    if (state.occupancy[tileIndex(state, tile)] === building.id) {
      state.occupancy[tileIndex(state, tile)] = EMPTY_TILE
    }
  }
}
