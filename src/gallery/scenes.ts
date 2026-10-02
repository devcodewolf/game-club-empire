/**
 * Escenas de "vecinos habituales" para la galería: pequeñas partidas
 * construidas con comandos reales (cimientos, puertas, salas y objetos), para
 * ver cada pieza en su contexto.
 */
import type { Command } from '@/sim/commands'
import type { GridSize } from '@/sim/geometry'

export interface GalleryScene {
  readonly name: string
  readonly size: GridSize
  /** Piezas que se ven en esta escena (ids de BUILDINGS). */
  readonly pieces: readonly string[]
  readonly commands: readonly Command[]
}

const place = (
  buildingType: string,
  x: number,
  y: number,
  rotation: 0 | 1 | 2 | 3 = 0,
): Command => ({
  type: 'placeBuilding',
  buildingType,
  origin: { x, y },
  rotation,
})

/** Vestuario completo: cimientos de ladrillo con interior de 8×6. */
const CHANGING_ROOM: GalleryScene = {
  name: 'vestuario',
  size: { width: 12, height: 10 },
  pieces: ['locker', 'changingBench', 'shower', 'toilet', 'sink', 'tacticsBoard'],
  commands: [
    {
      type: 'buildFoundation',
      rect: { x: 1, y: 1, width: 10, height: 8 },
      wall: 'brick',
      floor: 'concrete',
    },
    { type: 'placeDoor', tile: { x: 5, y: 8 }, door: 'woodDoor' },
    { type: 'designateRoom', tile: { x: 5, y: 4 }, roomType: 'changingRoom' },
    place('locker', 2, 2),
    place('locker', 3, 2),
    place('locker', 4, 2),
    place('locker', 5, 2),
    place('shower', 8, 2),
    place('shower', 9, 2),
    place('changingBench', 3, 5),
    place('sink', 9, 5, 3),
    place('toilet', 9, 7, 3),
    place('tacticsBoard', 2, 7),
  ],
}

/** Oficina: despacho pequeño de enlucido. */
const OFFICE: GalleryScene = {
  name: 'oficina',
  size: { width: 9, height: 8 },
  pieces: ['officeDesk', 'officeChair', 'filingCabinet', 'plant', 'waterCooler'],
  commands: [
    {
      type: 'buildFoundation',
      rect: { x: 1, y: 1, width: 7, height: 6 },
      wall: 'plaster',
      floor: 'wood',
    },
    { type: 'placeDoor', tile: { x: 4, y: 6 }, door: 'staffDoor' },
    { type: 'designateRoom', tile: { x: 4, y: 3 }, roomType: 'office' },
    place('officeDesk', 2, 2),
    place('officeChair', 2, 3, 2),
    place('filingCabinet', 6, 2),
    place('plant', 2, 5),
    place('waterCooler', 6, 5),
  ],
}

const stand = (slot: 'north' | 'south' | 'east' | 'west'): Command => ({
  type: 'placeStand',
  buildingType: 'stand',
  pitchId: 1,
  slot,
})
const upgrade = (buildingId: number): Command => ({ type: 'upgradeBuilding', buildingId })

/**
 * Estadio: campo de fútbol 11 con gradas de niveles mezclados (norte nivel 3,
 * sur y oeste nivel 2, este nivel 1). Ids: campo 1; gradas 2 (N), 3 (S), 4 (E), 5 (O).
 */
const STADIUM: GalleryScene = {
  name: 'estadio',
  size: { width: 68, height: 50 },
  pieces: ['stand', 'pitch11'],
  commands: [
    place('pitch11', 6, 6),
    stand('north'),
    stand('south'),
    stand('east'),
    stand('west'),
    upgrade(2),
    upgrade(2),
    upgrade(3),
    upgrade(5),
  ],
}

export const GALLERY_SCENES: readonly GalleryScene[] = [CHANGING_ROOM, OFFICE, STADIUM]

export function sceneFor(assetId: string): GalleryScene | undefined {
  return GALLERY_SCENES.find((scene) => scene.pieces.includes(assetId))
}
