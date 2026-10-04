/**
 * Datos del mapa: tamaño y elementos fijos del mundo.
 *
 * 240×160 casillas (3:2, apaisado) de 64 px = 15.360×10.240 px de mundo.
 * Todo es construible salvo la carretera del borde derecho, su acera y la
 * entrada de la ciudad deportiva (`entrance.ts`), que se marcan como reservados.
 */
import type { MapConfig, MapFeature } from '@/sim/map/map'
import { ACCESS, ENTRANCE_FEATURES } from './entrance'

const WIDTH = 240
const HEIGHT = 160

/** Carretera general: sale del mapa por arriba y por abajo (da sensación de mundo exterior). */
export const ROAD = {
  /** Primera columna del asfalto. */
  x: 226,
  /** Ancho del asfalto en casillas (dos carriles). */
  width: 8,
  /** Ancho de la acera a cada lado. */
  sidewalk: 2,
} as const

/** Acceso desde la carretera (definido en `entrance.ts`): filas que ocupa. */
export const ENTRANCE = { y: ACCESS.y, height: ACCESS.height } as const

const sidewalkLeftX = ROAD.x - ROAD.sidewalk
const roadRightX = ROAD.x + ROAD.width

const features: MapFeature[] = [
  // Acera izquierda y asfalto, de arriba abajo
  {
    rect: { x: sidewalkLeftX, y: 0, width: ROAD.sidewalk, height: HEIGHT },
    floor: 'concrete',
    reserved: true,
  },
  {
    rect: { x: ROAD.x, y: 0, width: ROAD.width, height: HEIGHT },
    floor: 'asphalt',
    reserved: true,
  },
  // Acera derecha y arcén de hierba hasta el borde del mapa
  {
    rect: { x: roadRightX, y: 0, width: ROAD.sidewalk, height: HEIGHT },
    floor: 'concrete',
    reserved: true,
  },
  {
    rect: {
      x: roadRightX + ROAD.sidewalk,
      y: 0,
      width: WIDTH - roadRightX - ROAD.sidewalk,
      height: HEIGHT,
    },
    floor: 'grass',
    reserved: true,
  },
  // Entrada de la ciudad deportiva (valla, control, aparcamiento, recepción)
  ...ENTRANCE_FEATURES,
]

export const MAP_CONFIG: MapConfig = {
  size: { width: WIDTH, height: HEIGHT },
  features,
}

export const MAP_SIZE = MAP_CONFIG.size

/** Bordes por los que se podrá ampliar el mapa en el futuro (la derecha es la carretera). */
export const EXPANSION_SIDES = ['top', 'left', 'bottom'] as const
export type ExpansionSide = (typeof EXPANSION_SIDES)[number]
