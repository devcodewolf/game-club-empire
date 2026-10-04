/**
 * Utilidades compartidas por los tests de la simulación.
 *
 * Usan un catálogo de prueba propio, independiente de `src/content/`.
 */
import type { BuildingCatalog } from '../buildings/buildings'
import type { SimContent } from '../content'
import type { FloorCatalog } from '../map/floors'
import type { RoomCatalog } from '../rooms/roomTypes'
import type { DoorCatalog, WallCatalog } from '../map/structureTypes'
import { createMapState, type MapConfig, type MapState } from '../map/map'

/** Catálogo de prueba: 1×1, 3×2, 4×4 y 'tiered' (1×1 con 3 niveles). */
export const TEST_CATALOG: BuildingCatalog = {
  small: {
    id: 'small',
    name: 'Pequeño',
    size: { width: 1, height: 1 },
    cost: 10,
    markerColor: 0xff0000,
    icon: 'S',
  },
  wide: {
    id: 'wide',
    name: 'Ancho',
    size: { width: 3, height: 2 },
    cost: 20,
    markerColor: 0x00ff00,
    icon: 'W',
  },
  big: {
    id: 'big',
    name: 'Grande',
    size: { width: 4, height: 4 },
    cost: 40,
    markerColor: 0x0000ff,
    icon: 'B',
  },
  /** Campo pequeño 4×3 con 3 niveles (una superficie por nivel), para probar los usos. */
  field: {
    id: 'field',
    name: 'Campo',
    size: { width: 4, height: 3 },
    cost: 50,
    markerColor: 0x00aa00,
    icon: 'F',
    pitch: { format: 7, surfaces: ['dirt', 'grass', 'stone'] },
    tiers: [
      { name: 'Tierra', cost: 50, quality: 1 },
      { name: 'Césped', cost: 100, quality: 2 },
      { name: 'Piedra', cost: 200, quality: 4 },
    ],
  },
  /** Grada modular de prueba: fondo 1/2/3 y aforo 10/20/30 por casilla de largo. */
  stand: {
    id: 'stand',
    name: 'Grada',
    size: { width: 1, height: 1 },
    cost: 100,
    markerColor: 0xaa5500,
    icon: 'G',
    stand: { depths: [1, 2, 3], capacityPerTile: [10, 20, 30] },
    tiers: [
      { name: 'Grada básica', cost: 100, quality: 1 },
      { name: 'Grada media', cost: 200, quality: 2 },
      { name: 'Grada alta', cost: 400, quality: 4 },
    ],
  },
  /** Córner de prueba: mismos fondos y aforos que la grada, pero en las esquinas del campo. */
  standCorner: {
    id: 'standCorner',
    name: 'Córner',
    size: { width: 1, height: 1 },
    cost: 100,
    markerColor: 0xaa5500,
    icon: 'C',
    stand: { depths: [1, 2, 3], capacityPerTile: [10, 20, 30], corner: true },
    tiers: [
      { name: 'Córner básico', cost: 100, quality: 1 },
      { name: 'Córner medio', cost: 200, quality: 2 },
      { name: 'Córner alto', cost: 400, quality: 4 },
    ],
  },
  /** 1×1 con 3 niveles, para probar las mejoras. */
  tiered: {
    id: 'tiered',
    name: 'Mejorable',
    size: { width: 1, height: 1 },
    cost: 10,
    markerColor: 0xffff00,
    icon: 'T',
    tiers: [
      { name: 'Básico', cost: 10, quality: 1 },
      { name: 'Medio', cost: 30, quality: 2 },
      { name: 'Alto', cost: 80, quality: 4 },
    ],
  },
}

/** Suelos de prueba: hierba (por defecto), tierra y piedra. */
export const TEST_FLOORS: FloorCatalog = {
  grass: { id: 'grass', name: 'Hierba', costPerTile: 0, color: 0x4caf50, pattern: 'grass' },
  dirt: { id: 'dirt', name: 'Tierra', costPerTile: 2, color: 0x8d6e63, pattern: 'dirt' },
  stone: { id: 'stone', name: 'Piedra', costPerTile: 5, color: 0x9e9e9e, pattern: 'slabs' },
}

/** Muros de prueba: ladrillo (estructural) y valla (no estructural). */
export const TEST_WALLS: WallCatalog = {
  brick: {
    id: 'brick',
    name: 'Ladrillo',
    costPerTile: 15,
    pattern: 'brick',
    capColor: 0xe6dccb,
    faceColor: 0xb5643c,
    structural: true,
  },
  fence: {
    id: 'fence',
    name: 'Valla',
    costPerTile: 4,
    pattern: 'fence',
    capColor: 0x6d7275,
    faceColor: 0x8f9496,
    structural: false,
  },
}

/** Puertas de prueba. */
export const TEST_DOORS: DoorCatalog = {
  door: { id: 'door', name: 'Puerta', cost: 150, color: 0xc98b3c, pattern: 'wood' },
}

/**
 * Salas de prueba: 'kit' (2×2, pide 1 'small', aforo 1 por 'small') y
 * 'depot' (2×3, pide 1 'wide', sin aforo).
 */
export const TEST_ROOMS: RoomCatalog = {
  kit: {
    id: 'kit',
    name: 'Kit',
    icon: 'K',
    color: 0x5b8fb9,
    minSize: { width: 2, height: 2 },
    requirements: [{ object: 'small', min: 1 }],
    capacity: { object: 'small', per: 1, unit: 'plazas' },
  },
  depot: {
    id: 'depot',
    name: 'Depósito',
    icon: 'D',
    color: 0x9b9385,
    minSize: { width: 2, height: 3 },
    requirements: [{ object: 'wide', min: 1 }],
  },
}

/** Contenido de prueba completo, el que reciben `executeCommand` y `createGame`. */
export const TEST_CONTENT: SimContent = {
  buildings: TEST_CATALOG,
  floors: TEST_FLOORS,
  walls: TEST_WALLS,
  doors: TEST_DOORS,
  rooms: TEST_ROOMS,
}

/**
 * Configuración del mapa de prueba: 20×20 con una "carretera" reservada de
 * suelo 'stone' en las columnas x=18..19 (ancho 2, alto 20). Por tanto las
 * columnas 0..17 son libres (hierba, construibles y pintables).
 */
export const TEST_MAP_CONFIG: MapConfig = {
  size: { width: 20, height: 20 },
  features: [{ rect: { x: 18, y: 0, width: 2, height: 20 }, floor: 'stone', reserved: true }],
}

/** Crea el mapa de prueba (`TEST_MAP_CONFIG`), con posibilidad de sobrescribir la config. */
export function createTestMap(overrides: Partial<MapConfig> = {}): MapState {
  return createMapState({ ...TEST_MAP_CONFIG, ...overrides })
}
