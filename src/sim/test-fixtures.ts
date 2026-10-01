/**
 * Utilidades compartidas por los tests de la simulación.
 *
 * Usan un catálogo de prueba propio, independiente de `src/content/`.
 */
import type { BuildingCatalog } from './buildings'
import type { SimContent } from './content'
import type { FloorCatalog } from './floors'
import { createMapState, type MapConfig, type MapState } from './map'

/** Catálogo de prueba: 1×1, 3×2 y 4×4. */
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
}

/** Suelos de prueba: hierba (por defecto), tierra y piedra. */
export const TEST_FLOORS: FloorCatalog = {
  grass: { id: 'grass', name: 'Hierba', costPerTile: 0, color: 0x4caf50, pattern: 'grass' },
  dirt: { id: 'dirt', name: 'Tierra', costPerTile: 2, color: 0x8d6e63, pattern: 'dirt' },
  stone: { id: 'stone', name: 'Piedra', costPerTile: 5, color: 0x9e9e9e, pattern: 'slabs' },
}

/** Contenido de prueba completo, el que reciben `executeCommand` y `createGame`. */
export const TEST_CONTENT: SimContent = { buildings: TEST_CATALOG, floors: TEST_FLOORS }

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
