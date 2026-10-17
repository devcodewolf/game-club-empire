/**
 * Copia de la parte construida del mapa (suelos, muros, puertas, zona
 * interior, salas y objetos) para poder deshacer la última obra.
 *
 * No incluye el reloj, el dinero, el libro de cuentas ni el PRNG: deshacer
 * solo devuelve el mapa a como estaba; el tiempo sigue y el reembolso se
 * anota aparte.
 */
import type { BuildingId, PlacedBuilding } from '../buildings/buildings'
import type { TileRect } from '../geometry'
import type { Room, RoomId } from '../rooms/roomTypes'
import type { MapState } from './map'

export interface MapSnapshot {
  readonly floors: MapState['floors']
  readonly walls: MapState['walls']
  readonly doors: MapState['doors']
  readonly indoor: MapState['indoor']
  readonly roomOf: MapState['roomOf']
  readonly occupancy: MapState['occupancy']
  readonly rooms: Record<RoomId, Room>
  readonly buildings: Record<BuildingId, PlacedBuilding>
  readonly nextRoomId: RoomId
  readonly nextBuildingId: BuildingId
}

/** Copia del mapa construido. Los objetos y salas son inmutables: basta con copiar los registros. */
export function captureMap(state: MapState): MapSnapshot {
  return {
    floors: [...state.floors],
    walls: [...state.walls],
    doors: [...state.doors],
    indoor: [...state.indoor],
    roomOf: [...state.roomOf],
    occupancy: [...state.occupancy],
    rooms: { ...state.rooms },
    buildings: { ...state.buildings },
    nextRoomId: state.nextRoomId,
    nextBuildingId: state.nextBuildingId,
  }
}

/** Qué cambiará al restaurar: casillas distintas (su rectángulo) y objetos que salen o vuelven. */
export function diffMap(
  state: MapState,
  snapshot: MapSnapshot,
): {
  readonly rect: TileRect | null
  readonly removed: readonly PlacedBuilding[]
  readonly added: readonly PlacedBuilding[]
} {
  const { width } = state.size
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < state.floors.length; i++) {
    const changed =
      state.floors[i] !== snapshot.floors[i] ||
      state.walls[i] !== snapshot.walls[i] ||
      state.doors[i] !== snapshot.doors[i] ||
      state.indoor[i] !== snapshot.indoor[i] ||
      state.roomOf[i] !== snapshot.roomOf[i]
    if (!changed) continue
    const x = i % width
    const y = Math.floor(i / width)
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  const rect =
    minX === Infinity ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  const removed = Object.values(state.buildings).filter((b) => snapshot.buildings[b.id] !== b)
  const added = Object.values(snapshot.buildings).filter((b) => state.buildings[b.id] !== b)
  return { rect, removed, added }
}

/** Devuelve el mapa construido a la copia. */
export function restoreMap(state: MapState, snapshot: MapSnapshot): void {
  const copy = <T>(target: T[], source: readonly T[]): void => {
    for (let i = 0; i < source.length; i++) target[i] = source[i] as T
  }
  copy(state.floors, snapshot.floors)
  copy(state.walls, snapshot.walls)
  copy(state.doors, snapshot.doors)
  copy(state.indoor, snapshot.indoor)
  copy(state.roomOf, snapshot.roomOf)
  copy(state.occupancy, snapshot.occupancy)
  const replace = <K extends number, V>(target: Record<K, V>, source: Record<K, V>): void => {
    for (const key of Object.keys(target)) delete target[Number(key) as K]
    Object.assign(target, source)
  }
  replace(state.rooms, snapshot.rooms)
  replace(state.buildings, snapshot.buildings)
  state.nextRoomId = snapshot.nextRoomId
  state.nextBuildingId = snapshot.nextBuildingId
}
