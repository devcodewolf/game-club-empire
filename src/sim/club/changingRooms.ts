/**
 * Vestuarios local y visitante (Fase 2, Bloque E; idea de Raul en docs/IDEAS.md).
 *
 * Cada sala de vestuario completa tiene un uso, local o visitante, elegible
 * en su ficha como el de los campos. Quién hace de cada uno:
 *  - Local: el mejor vestuario que no sea de visitantes. La fuerza del equipo
 *    usa su calidad.
 *  - Visitante: el mejor marcado como visitante; si no hay ninguno marcado y
 *    hay dos o más vestuarios, el segundo mejor sin marcar hace de visitante.
 *  - La caseta vieja cubre el hueco que falte (primero el local): así no hay
 *    que demolerla al construir el vestuario de verdad.
 *
 * Calidad de un vestuario (0-10): la calidad media de sus objetos × la escala
 * del contenido. La de la caseta es la de su nivel.
 */
import type { BuildingId } from '../buildings/buildings'
import { tierQuality } from '../buildings/buildings'
import type { SimContent } from '../content'
import type { MapState } from '../map/map'
import { evaluateRoom, type RoomStatus } from '../rooms/rooms'
import type { RoomId } from '../rooms/roomTypes'

export type ChangingRoomUse = 'home' | 'away'

/** Quién hace de vestuario local o visitante. */
export type ChangingRoomSource =
  | { readonly kind: 'room'; readonly roomId: RoomId; readonly quality: number }
  | { readonly kind: 'shed'; readonly buildingId: BuildingId; readonly quality: number }
  | { readonly kind: 'none'; readonly quality: 0 }

export interface ClubChangingRooms {
  readonly home: ChangingRoomSource
  readonly away: ChangingRoomSource
}

const NONE: ChangingRoomSource = { kind: 'none', quality: 0 }

/** Calidad 0-10 de una sala de vestuario evaluada. */
export function changingRoomQuality(content: SimContent, status: RoomStatus): number {
  const count = Object.values(status.objects).reduce((sum, n) => sum + n, 0)
  if (count === 0) return 0
  const quality = (status.quality / count) * content.match.changingRoom.qualityScale
  return Math.min(10, Math.round(quality * 10) / 10)
}

/** ¿Es una sala de vestuario (el tipo que pide el partido)? */
export function isChangingRoom(state: MapState, content: SimContent, roomId: RoomId): boolean {
  return state.rooms[roomId]?.type === content.match.changingRoom.roomType
}

/** Vestuarios que hacen de local y de visitante ahora mismo. */
export function clubChangingRooms(state: MapState, content: SimContent): ClubChangingRooms {
  const rooms: { roomId: RoomId; quality: number; use?: ChangingRoomUse }[] = []
  for (const key of Object.keys(state.rooms)) {
    const roomId = Number(key)
    if (!isChangingRoom(state, content, roomId)) continue
    const status = evaluateRoom(state, content, roomId)
    if (!status?.ok) continue
    const use = state.rooms[roomId]?.use
    rooms.push({ roomId, quality: changingRoomQuality(content, status), ...(use ? { use } : {}) })
  }
  // Mejor primero; a igual calidad, el más antiguo
  rooms.sort((a, b) => b.quality - a.quality || a.roomId - b.roomId)
  const asSource = (r: (typeof rooms)[number] | undefined): ChangingRoomSource =>
    r ? { kind: 'room', roomId: r.roomId, quality: r.quality } : NONE

  const homeRoom = rooms.find((r) => r.use !== 'away')
  const awayRoom =
    rooms.find((r) => r.use === 'away') ?? rooms.find((r) => r !== homeRoom && r.use === undefined)
  let home = asSource(homeRoom)
  let away = asSource(awayRoom)

  const shed = oldShed(state, content)
  if (shed) {
    if (home.kind === 'none') home = shed
    else if (away.kind === 'none') away = shed
  }
  return { home, away }
}

/** La caseta vieja como vestuario precario (si sigue en pie y no está averiada). */
function oldShed(state: MapState, content: SimContent): ChangingRoomSource | null {
  const shedType = content.match.changingRoom.shed
  for (const building of Object.values(state.buildings)) {
    if (building.type !== shedType || building.broken) continue
    const def = content.buildings[building.type]
    if (!def) continue
    return { kind: 'shed', buildingId: building.id, quality: tierQuality(def, building.tier) }
  }
  return null
}
