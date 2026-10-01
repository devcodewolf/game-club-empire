/**
 * Catálogo de edificios. Añadir un edificio nuevo = añadir una entrada a
 * `BUILDINGS` (y a `BUILD_MENU` si debe aparecer en la barra de construcción).
 *
 * Los costes se cobran a partir de la Fase 2; en la Fase 1 solo se definen.
 * Tamaños en casillas de 64 px, sin girar (ancho × alto).
 */
import type { BuildingDef } from '@/sim/buildings'

/**
 * Función identidad que solo sirve para tipar: obliga a que la clave de cada
 * entrada coincida con su `id` (si no, falla el typecheck) y conserva los
 * tipos literales para que `StarterBuildingId` sea una unión exacta.
 */
function defineBuildings<const T extends { [K in keyof T]: BuildingDef & { readonly id: K } }>(
  catalog: T,
): T {
  return catalog
}

export const BUILDINGS = defineBuildings({
  // Terrenos de juego: medidas reglamentarias a escala "de juego" (metros / 2)
  // más 2 casillas de margen por lado. Tamaño fijo: no se arrastran.
  pitch11Dirt: {
    id: 'pitch11Dirt',
    name: 'Campo de fútbol 11 (tierra)',
    size: { width: 56, height: 38 },
    cost: 500,
    markerColor: 0x7a5a3a,
    icon: '⚽',
    pitch: { format: 11, surface: 'dirt' },
  },
  pitch7Dirt: {
    id: 'pitch7Dirt',
    name: 'Campo de fútbol 7 (tierra)',
    size: { width: 34, height: 24 },
    cost: 300,
    markerColor: 0x7a5a3a,
    icon: '⚽',
    pitch: { format: 7, surface: 'dirt' },
  },
  basicChangingRoom: {
    id: 'basicChangingRoom',
    name: 'Vestuario básico',
    size: { width: 4, height: 3 },
    cost: 1500,
    markerColor: 0x5b8fb9,
    icon: '🚿',
  },
  office: {
    id: 'office',
    name: 'Oficina',
    size: { width: 3, height: 3 },
    cost: 1000,
    markerColor: 0xc9a227,
    icon: '📋',
  },
  smallStand: {
    id: 'smallStand',
    name: 'Grada pequeña',
    size: { width: 8, height: 2 },
    cost: 2000,
    markerColor: 0xb5523b,
    icon: '🪑',
  },
})

/** Identificadores de los edificios iniciales. */
export type StarterBuildingId = keyof typeof BUILDINGS

/** Orden de los edificios en la barra de construcción. */
export const BUILD_MENU: readonly StarterBuildingId[] = [
  'pitch11Dirt',
  'pitch7Dirt',
  'basicChangingRoom',
  'office',
  'smallStand',
]
