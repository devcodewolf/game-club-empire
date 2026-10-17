/**
 * Mover un bloque: todo lo construido dentro de un rectángulo (suelos
 * pintados, muros, puertas, zona interior, salas y objetos) se lleva a otro
 * sitio de una vez, opcionalmente girado 90°, 180° o 270°.
 *
 * Reglas:
 *  - Solo se mueve el CONTENIDO: una casilla de hierba sin nada no cuenta, así
 *    que no pisa los caminos del destino. Las casillas reservadas se ignoran.
 *  - Nada a medias: el rectángulo no puede cortar un objeto (un campo cuenta
 *    con sus gradas) ni una sala.
 *  - El destino de cada casilla con contenido tiene que estar libre de muros,
 *    puertas, objetos, salas y zona interior (salvo lo que el propio bloque
 *    deja libre al moverse) y no ser reservado. Un suelo pintado sí se pisa.
 *  - Atómico: `planBlockMove` valida sin tocar el estado; `applyBlockMove`
 *    solo se llama con un plan válido.
 *
 * Los objetos conservan id, nivel y uso; las salas, su id y su tipo.
 */
import { rotateSlot, type Move } from '../buildings/move'
import type { BuildingId, PlacedBuilding } from '../buildings/buildings'
import type { SimContent } from '../content'
import {
  isInsideGrid,
  rotateSize,
  tilesInRect,
  type Rotation,
  type TileCoord,
  type TileRect,
} from '../geometry'
import { NO_ROOM } from '../rooms/roomTypes'
import { removeEmptyRooms } from '../rooms/rooms'
import { DEFAULT_FLOOR } from './floors'
import { buildingFootprint, EMPTY_TILE, tileIndex, type MapState } from './map'
import { occupy, release } from '../buildings/stands'
import { NO_DOOR, NO_WALL } from './structureTypes'

export type BlockMoveError =
  | 'outOfBounds'
  /** El rectángulo no contiene nada construido. */
  | 'nothingToMove'
  /** Mismo sitio y mismo giro. */
  | 'samePlace'
  /** El rectángulo corta un objeto (o deja fuera las gradas de un campo). */
  | 'cutsObject'
  /** El rectángulo corta una sala. */
  | 'cutsRoom'
  /** Alguna casilla de destino es reservada (carretera, acceso…). */
  | 'reserved'
  /** Alguna casilla de destino ya tiene muro, puerta, objeto, sala o zona interior. */
  | 'blocked'

/** Una casilla con contenido: de dónde sale y adónde va. */
export interface BlockTile {
  readonly from: TileCoord
  readonly to: TileCoord
}

export type BlockMoveCheck =
  | {
      readonly ok: true
      readonly tiles: readonly BlockTile[]
      readonly moves: readonly Move[]
      /** Rectángulo que ocupa el bloque en el destino. */
      readonly target: TileRect
    }
  | {
      readonly ok: false
      readonly reason: BlockMoveError
      /** Lo calculado hasta el fallo, para la vista previa (casillas y objetos). */
      readonly tiles?: readonly BlockTile[]
      readonly moves?: readonly Move[]
      readonly target?: TileRect
      /** Casillas de destino en conflicto (o de origen cortadas), para pintarlas en rojo. */
      readonly conflicts?: readonly TileCoord[]
    }

/**
 * Posición de una casilla del bloque tras girarlo `rotation` cuartos de vuelta
 * (sentido horario) y colocar su esquina superior izquierda en `to`.
 */
export function transformTile(
  rect: TileRect,
  to: TileCoord,
  rotation: Rotation,
  tile: TileCoord,
): TileCoord {
  let x = tile.x - rect.x
  let y = tile.y - rect.y
  let height = rect.height
  let width = rect.width
  for (let i = 0; i < rotation; i++) {
    // Un cuarto de vuelta horario: (x, y) → (alto − 1 − y, x)
    ;[x, y] = [height - 1 - y, x]
    ;[width, height] = [height, width]
  }
  return { x: to.x + x, y: to.y + y }
}

/** Rectángulo que ocupa el bloque en el destino. */
export function blockTarget(rect: TileRect, to: TileCoord, rotation: Rotation): TileRect {
  // Solo el tamaño: `rotateSize` con giro 0 o 2 devuelve el propio rect (con su x/y)
  const size = rotateSize({ width: rect.width, height: rect.height }, rotation)
  return { x: to.x, y: to.y, width: size.width, height: size.height }
}

/** Rectángulo de `inner` (dentro del bloque) una vez movido y girado. */
function transformRect(
  rect: TileRect,
  to: TileCoord,
  rotation: Rotation,
  inner: TileRect,
): TileRect {
  const a = transformTile(rect, to, rotation, { x: inner.x, y: inner.y })
  const b = transformTile(rect, to, rotation, {
    x: inner.x + inner.width - 1,
    y: inner.y + inner.height - 1,
  })
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x) + 1,
    height: Math.abs(a.y - b.y) + 1,
  }
}

const inside = (rect: TileRect, tile: TileCoord): boolean =>
  tile.x >= rect.x &&
  tile.y >= rect.y &&
  tile.x < rect.x + rect.width &&
  tile.y < rect.y + rect.height

/** ¿Tiene la casilla algo que mover (además de hierba sin construir)? */
function hasContent(state: MapState, index: number): boolean {
  return (
    state.floors[index] !== DEFAULT_FLOOR ||
    state.walls[index] !== NO_WALL ||
    state.doors[index] !== NO_DOOR ||
    state.indoor[index] === true ||
    state.roomOf[index] !== NO_ROOM ||
    state.occupancy[index] !== EMPTY_TILE
  )
}

/**
 * Objetos que se mueven con el bloque. Un campo arrastra sus gradas y una
 * grada a su campo: si alguna pieza queda fuera del rectángulo, el bloque
 * corta un objeto. Devuelve los ids o las casillas cortadas.
 */
function blockBuildings(
  state: MapState,
  content: SimContent,
  rect: TileRect,
): { ids: Set<BuildingId>; cut: TileCoord[] } {
  const ids = new Set<BuildingId>()
  const cut: TileCoord[] = []
  for (const tile of tilesInRect(rect)) {
    const id = state.occupancy[tileIndex(state, tile)]
    if (id === undefined || id === EMPTY_TILE) continue
    ids.add(id)
  }
  // Se completa con las piezas unidas (campo ↔ gradas)
  for (const id of [...ids]) {
    const building = state.buildings[id]
    if (building?.attach) ids.add(building.attach.pitchId)
  }
  for (const building of Object.values(state.buildings)) {
    if (building.attach && ids.has(building.attach.pitchId)) ids.add(building.id)
  }
  for (const id of ids) {
    const building = state.buildings[id]
    const def = building && content.buildings[building.type]
    if (!building || !def) continue
    for (const tile of tilesInRect(buildingFootprint(building, def))) {
      if (!inside(rect, tile)) cut.push(tile)
    }
  }
  return { ids, cut }
}

/** Casillas fuera del rectángulo que pertenecen a una sala que el rectángulo toca. */
function cutRoomTiles(state: MapState, rect: TileRect): TileCoord[] {
  const rooms = new Set<number>()
  for (const tile of tilesInRect(rect)) {
    const room = state.roomOf[tileIndex(state, tile)]
    if (room !== undefined && room !== NO_ROOM) rooms.add(room)
  }
  if (rooms.size === 0) return []
  const cut: TileCoord[] = []
  for (let y = 0; y < state.size.height; y++) {
    for (let x = 0; x < state.size.width; x++) {
      const tile = { x, y }
      if (inside(rect, tile)) continue
      if (rooms.has(state.roomOf[tileIndex(state, tile)] ?? NO_ROOM)) cut.push(tile)
    }
  }
  return cut
}

/**
 * ¿Se puede mover el bloque `rect` a `to` (esquina superior izquierda del
 * bloque ya girado) con giro `rotation`? No modifica el estado.
 */
export function planBlockMove(
  state: MapState,
  content: SimContent,
  rect: TileRect,
  to: TileCoord,
  rotation: Rotation,
): BlockMoveCheck {
  const end = { x: rect.x + rect.width - 1, y: rect.y + rect.height - 1 }
  if (
    rect.width < 1 ||
    rect.height < 1 ||
    !isInsideGrid(rect, state.size) ||
    !isInsideGrid(end, state.size)
  ) {
    return { ok: false, reason: 'outOfBounds' }
  }
  const target = blockTarget(rect, to, rotation)
  const sourceIndexes = new Set<number>()
  const tiles: BlockTile[] = []
  for (const tile of tilesInRect(rect)) {
    const index = tileIndex(state, tile)
    if (state.reserved[index] || !hasContent(state, index)) continue
    sourceIndexes.add(index)
    tiles.push({ from: tile, to: transformTile(rect, to, rotation, tile) })
  }
  if (tiles.length === 0) return { ok: false, reason: 'nothingToMove' }

  const { ids, cut } = blockBuildings(state, content, rect)
  const moves: Move[] = [...ids].flatMap((id) => {
    const building = state.buildings[id]
    const def = building && content.buildings[building.type]
    if (!building || !def) return []
    const footprint = transformRect(rect, to, rotation, buildingFootprint(building, def))
    const moved: PlacedBuilding = {
      ...building,
      origin: { x: footprint.x, y: footprint.y },
      rotation: ((building.rotation + rotation) % 4) as Rotation,
      ...(building.attach
        ? { attach: { ...building.attach, slot: rotateSlot(building.attach.slot, rotation) } }
        : {}),
    }
    return [{ from: building, to: moved }]
  })
  const preview = { tiles, moves, target }
  if (cut.length > 0) return { ok: false, reason: 'cutsObject', ...preview, conflicts: cut }
  const roomCut = cutRoomTiles(state, rect)
  if (roomCut.length > 0) return { ok: false, reason: 'cutsRoom', ...preview, conflicts: roomCut }
  if (to.x === rect.x && to.y === rect.y && rotation === 0) {
    return { ok: false, reason: 'samePlace', ...preview }
  }

  // Destino: dentro del mapa, no reservado y libre (salvo lo que deja el propio bloque)
  const conflicts: TileCoord[] = []
  let reason: BlockMoveError | null = null
  for (const { to: dest } of tiles) {
    if (!isInsideGrid(dest, state.size)) {
      conflicts.push(dest)
      reason ??= 'outOfBounds'
      continue
    }
    const index = tileIndex(state, dest)
    if (state.reserved[index]) {
      conflicts.push(dest)
      reason ??= 'reserved'
      continue
    }
    if (sourceIndexes.has(index)) continue
    const occupant = state.occupancy[index]
    const busy =
      state.walls[index] !== NO_WALL ||
      state.doors[index] !== NO_DOOR ||
      state.indoor[index] === true ||
      state.roomOf[index] !== NO_ROOM ||
      (occupant !== undefined && occupant !== EMPTY_TILE && !ids.has(occupant))
    if (busy) {
      conflicts.push(dest)
      reason ??= 'blocked'
    }
  }
  if (reason) return { ok: false, reason, ...preview, conflicts }
  return { ok: true, tiles, moves, target }
}

/** Aplica un movimiento de bloque ya validado por `planBlockMove`. */
export function applyBlockMove(
  state: MapState,
  content: SimContent,
  plan: { readonly tiles: readonly BlockTile[]; readonly moves: readonly Move[] },
): void {
  // 1. Se copia el contenido de origen antes de tocar nada (origen y destino pueden solaparse)
  const copied = plan.tiles.map(({ from, to }) => {
    const index = tileIndex(state, from)
    return {
      to,
      floor: state.floors[index] ?? DEFAULT_FLOOR,
      wall: state.walls[index] ?? NO_WALL,
      door: state.doors[index] ?? NO_DOOR,
      indoor: state.indoor[index] ?? false,
      room: state.roomOf[index] ?? NO_ROOM,
    }
  })
  // 2. Se vacía el origen: vuelve a ser hierba sin nada
  for (const { from } of plan.tiles) {
    const index = tileIndex(state, from)
    state.floors[index] = DEFAULT_FLOOR
    state.walls[index] = NO_WALL
    state.doors[index] = NO_DOOR
    state.indoor[index] = false
    state.roomOf[index] = NO_ROOM
  }
  for (const { from } of plan.moves) {
    const def = content.buildings[from.type]
    if (def) release(state, from, def)
  }
  // 3. Se escribe en el destino (la hierba sin pintar no pisa el suelo que hubiera)
  for (const tile of copied) {
    const index = tileIndex(state, tile.to)
    if (tile.floor !== DEFAULT_FLOOR) state.floors[index] = tile.floor
    state.walls[index] = tile.wall
    state.doors[index] = tile.door
    state.indoor[index] = tile.indoor
    state.roomOf[index] = tile.room
  }
  for (const { to } of plan.moves) {
    const def = content.buildings[to.type]
    if (!def) continue
    state.buildings[to.id] = to
    occupy(state, buildingFootprint(to, def), to.id)
  }
  removeEmptyRooms(state)
}
