/**
 * Datos del mapa. Tamaño en casillas de 64 px: 100×100 = 6400×6400 px de mundo,
 * similar a un mapa mediano de Prison Architect.
 */
import type { MapConfig } from '@/sim/map'

export const MAP_CONFIG: MapConfig = {
  size: { width: 100, height: 100 },
  /** Parcelas de 10×10 casillas: una cuadrícula de 10×10 parcelas. */
  parcelSize: 10,
  /** Se empieza con las 2×2 parcelas centrales (20×20 casillas). */
  initialParcels: [
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 4, y: 5 },
    { x: 5, y: 5 },
  ],
}

export const MAP_SIZE = MAP_CONFIG.size
