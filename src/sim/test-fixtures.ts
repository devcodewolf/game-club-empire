/**
 * Utilidades compartidas por los tests de la simulación.
 *
 * Usan un catálogo de prueba propio, independiente de `src/content/`.
 */
import type { BuildingCatalog } from './buildings'
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

/**
 * Mapa 20×20 con parcelas de 5. Las parcelas iniciales son las 2×2 de arriba a
 * la izquierda, es decir, son propias las casillas 0..9 en cada eje.
 */
export function createTestMap(overrides: Partial<MapConfig> = {}): MapState {
  return createMapState({
    size: { width: 20, height: 20 },
    parcelSize: 5,
    initialParcels: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    ...overrides,
  })
}
