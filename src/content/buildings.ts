/**
 * Catálogo de objetos de tamaño fijo (campos, gradas y mobiliario). Añadir uno
 * = añadir una entrada a `BUILDINGS` (y ponerlo en `buildMenu.ts` para que
 * aparezca en la barra de construcción).
 *
 * Los costes se cobran a partir de la Fase 2; en la Fase 1 solo se definen.
 * Tamaños en casillas de 64 px, sin girar (ancho × alto).
 */
import type { BuildingDef } from '@/sim/buildings'
import type { IconName } from './icons'
import type { DivisionId } from './progression'

/**
 * Función identidad que solo sirve para tipar: obliga a que la clave de cada
 * entrada coincida con su `id`, que `icon` sea un `IconName` y `requires` una
 * `DivisionId`, y conserva los literales para que `StarterBuildingId` sea exacto.
 */
function defineBuildings<
  const T extends {
    [K in keyof T]: BuildingDef & {
      readonly id: K
      readonly icon: IconName
      readonly requires?: DivisionId
    }
  },
>(catalog: T): T {
  return catalog
}

type PitchFormat = 7 | 11
type PitchSurface = 'dirt' | 'artificialTurf' | 'naturalGrass' | 'hybridGrass'

/** Tamaño reglamentario por formato: medidas a escala de juego (metros / 2) más margen. */
const PITCH_SIZE = {
  11: { width: 56, height: 38 },
  7: { width: 34, height: 24 },
} as const satisfies Record<PitchFormat, { width: number; height: number }>

/** Nombre y color de marcador (el de la superficie) por superficie. */
const SURFACE_INFO = {
  dirt: { label: 'Tierra', color: 0x7a5a3a },
  artificialTurf: { label: 'Césped artificial', color: 0x4f9a4a },
  naturalGrass: { label: 'Césped natural', color: 0x5a9a3a },
  hybridGrass: { label: 'Césped híbrido', color: 0x64a844 },
} as const satisfies Record<PitchSurface, { label: string; color: number }>

/** Genera la entrada de un campo para no repetir datos. */
function pitch<const Id extends string>(
  id: Id,
  format: PitchFormat,
  surface: PitchSurface,
  cost: number,
  requires?: DivisionId,
) {
  const info = SURFACE_INFO[surface]
  return {
    id,
    name: `Fútbol ${format} · ${info.label}`,
    size: PITCH_SIZE[format],
    cost,
    markerColor: info.color,
    icon: 'ball-football' as const,
    pitch: { format, surface },
    requires,
  }
}

export const BUILDINGS = defineBuildings({
  // Campos de fútbol: tamaño reglamentario fijo, no se arrastran.
  pitch11Dirt: pitch('pitch11Dirt', 11, 'dirt', 500),
  pitch11Artificial: pitch('pitch11Artificial', 11, 'artificialTurf', 40000, 'regional'),
  pitch11Natural: pitch('pitch11Natural', 11, 'naturalGrass', 60000, 'autonomica'),
  pitch11Hybrid: pitch('pitch11Hybrid', 11, 'hybridGrass', 150000, 'nacionalA'),
  pitch7Dirt: pitch('pitch7Dirt', 7, 'dirt', 300, 'regional'),
  pitch7Artificial: pitch('pitch7Artificial', 7, 'artificialTurf', 15000, 'autonomica'),
  pitch7Natural: pitch('pitch7Natural', 7, 'naturalGrass', 25000, 'nacionalB'),
  pitch7Hybrid: pitch('pitch7Hybrid', 7, 'hybridGrass', 60000, 'elite'),

  // Gradas: el aforo crece con el tamaño y la división.
  standEarthBank: {
    id: 'standEarthBank',
    name: 'Talud de tierra',
    size: { width: 14, height: 3 },
    cost: 200,
    markerColor: 0x8a6a48,
    icon: 'stairs',
    capacity: 200,
  },
  standWoodBenches: {
    id: 'standWoodBenches',
    name: 'Grada de bancos de madera',
    size: { width: 14, height: 4 },
    cost: 1500,
    markerColor: 0x9a6b3f,
    icon: 'building-stadium',
    capacity: 350,
  },
  standMetalSeats: {
    id: 'standMetalSeats',
    name: 'Grada metálica con asientos',
    size: { width: 20, height: 5 },
    cost: 8000,
    markerColor: 0x8b9298,
    icon: 'building-stadium',
    capacity: 800,
    requires: 'regional',
  },
  standCovered: {
    id: 'standCovered',
    name: 'Tribuna cubierta',
    size: { width: 28, height: 7 },
    cost: 30000,
    markerColor: 0xb5523b,
    icon: 'building-stadium',
    capacity: 2000,
    requires: 'autonomica',
  },
  standStadium: {
    id: 'standStadium',
    name: 'Grada de estadio',
    size: { width: 40, height: 10 },
    cost: 150000,
    markerColor: 0xa04632,
    icon: 'building-stadium',
    capacity: 6000,
    requires: 'nacionalA',
  },
  standGrand: {
    id: 'standGrand',
    name: 'Gran tribuna',
    size: { width: 56, height: 14 },
    cost: 600000,
    markerColor: 0x7d3a2b,
    icon: 'building-stadium',
    capacity: 18000,
    requires: 'elite',
  },

  // Vestuario
  locker: {
    id: 'locker',
    name: 'Taquilla',
    size: { width: 1, height: 1 },
    cost: 80,
    markerColor: 0x6f8fa8,
    icon: 'archive',
  },
  changingBench: {
    id: 'changingBench',
    name: 'Banco de vestuario',
    size: { width: 3, height: 1 },
    cost: 60,
    markerColor: 0x9a6b3f,
    icon: 'armchair-2',
  },
  shower: {
    id: 'shower',
    name: 'Ducha',
    size: { width: 1, height: 1 },
    cost: 150,
    markerColor: 0x5b8fb9,
    icon: 'bath',
  },
  toilet: {
    id: 'toilet',
    name: 'Inodoro',
    size: { width: 1, height: 1 },
    cost: 120,
    markerColor: 0xdfe3dc,
    icon: 'toilet-paper',
  },
  sink: {
    id: 'sink',
    name: 'Lavabo',
    size: { width: 1, height: 1 },
    cost: 90,
    markerColor: 0xc5d3d8,
    icon: 'wash-hand',
  },

  // Oficina
  officeDesk: {
    id: 'officeDesk',
    name: 'Mesa de despacho',
    size: { width: 2, height: 1 },
    cost: 200,
    markerColor: 0x8a5f3c,
    icon: 'desk',
  },
  officeChair: {
    id: 'officeChair',
    name: 'Silla',
    size: { width: 1, height: 1 },
    cost: 40,
    markerColor: 0x3f4a56,
    icon: 'chair-director',
  },
  filingCabinet: {
    id: 'filingCabinet',
    name: 'Archivador',
    size: { width: 1, height: 1 },
    cost: 70,
    markerColor: 0x7d8790,
    icon: 'folder',
  },

  // Recepción y almacén
  receptionDesk: {
    id: 'receptionDesk',
    name: 'Mostrador de recepción',
    size: { width: 3, height: 1 },
    cost: 600,
    markerColor: 0xb5643c,
    icon: 'desk',
  },
  storageShelf: {
    id: 'storageShelf',
    name: 'Estantería de material',
    size: { width: 2, height: 1 },
    cost: 250,
    markerColor: 0x9b9385,
    icon: 'package',
  },

  // Vestuario (táctica)
  tacticsBoard: {
    id: 'tacticsBoard',
    name: 'Pizarra táctica',
    size: { width: 2, height: 1 },
    cost: 180,
    markerColor: 0x3f5a48,
    icon: 'clipboard',
  },

  // Decoración de interior
  plant: {
    id: 'plant',
    symmetric: true,
    name: 'Planta',
    size: { width: 1, height: 1 },
    cost: 40,
    markerColor: 0x4f8a3c,
    icon: 'plant',
  },
  waterCooler: {
    id: 'waterCooler',
    symmetric: true,
    name: 'Fuente de agua',
    size: { width: 1, height: 1 },
    cost: 120,
    markerColor: 0x7fb7d6,
    icon: 'droplet',
  },

  // Campo
  dugout: {
    id: 'dugout',
    name: 'Banquillo',
    size: { width: 5, height: 2 },
    cost: 600,
    markerColor: 0xc9a227,
    icon: 'armchair',
  },
  trainingGoal: {
    id: 'trainingGoal',
    name: 'Portería de entrenamiento',
    size: { width: 3, height: 1 },
    cost: 250,
    markerColor: 0xe8e8e0,
    icon: 'play-football',
  },
  cornerFlag: {
    id: 'cornerFlag',
    symmetric: true,
    name: 'Banderín de córner',
    size: { width: 1, height: 1 },
    cost: 10,
    markerColor: 0xd9a21b,
    icon: 'flag',
  },

  // Exterior
  tree: {
    id: 'tree',
    symmetric: true,
    name: 'Árbol',
    size: { width: 2, height: 2 },
    cost: 30,
    markerColor: 0x3f7a35,
    icon: 'tree',
  },
  streetLamp: {
    id: 'streetLamp',
    symmetric: true,
    name: 'Farola',
    size: { width: 1, height: 1 },
    cost: 120,
    markerColor: 0x4a5058,
    icon: 'lamp',
  },
  bin: {
    id: 'bin',
    symmetric: true,
    name: 'Papelera',
    size: { width: 1, height: 1 },
    cost: 20,
    markerColor: 0x5f6b62,
    icon: 'trash',
  },
  parkBench: {
    id: 'parkBench',
    name: 'Banco de jardín',
    size: { width: 2, height: 1 },
    cost: 60,
    markerColor: 0x9a6b3f,
    icon: 'picnic-table',
  },
  fountain: {
    id: 'fountain',
    symmetric: true,
    name: 'Fuente',
    size: { width: 1, height: 1 },
    cost: 150,
    markerColor: 0x6fb0d0,
    icon: 'fountain',
  },

  // Salud y ocio
  physioTable: {
    id: 'physioTable',
    name: 'Camilla de fisioterapia',
    size: { width: 2, height: 1 },
    cost: 900,
    markerColor: 0xd8d4c8,
    icon: 'massage',
    requires: 'regional',
  },
  weightsBench: {
    id: 'weightsBench',
    name: 'Banco de pesas',
    size: { width: 2, height: 2 },
    cost: 1200,
    markerColor: 0x56606a,
    icon: 'barbell',
    requires: 'autonomica',
  },
  exerciseBike: {
    id: 'exerciseBike',
    name: 'Bicicleta estática',
    size: { width: 1, height: 2 },
    cost: 800,
    markerColor: 0x6a7480,
    icon: 'stretching',
    requires: 'autonomica',
  },
  barCounter: {
    id: 'barCounter',
    name: 'Barra de bar',
    size: { width: 4, height: 1 },
    cost: 1500,
    markerColor: 0x7a4f2e,
    icon: 'coffee',
    requires: 'regional',
  },
  cafeTable: {
    id: 'cafeTable',
    name: 'Mesa de cafetería',
    size: { width: 2, height: 2 },
    cost: 300,
    markerColor: 0xd9a441,
    icon: 'coffee',
    requires: 'regional',
  },
  vendingMachine: {
    id: 'vendingMachine',
    name: 'Máquina expendedora',
    size: { width: 1, height: 1 },
    cost: 700,
    markerColor: 0xb5523b,
    icon: 'cup',
    requires: 'regional',
  },
})

/** Identificadores de los objetos del catálogo. */
export type StarterBuildingId = keyof typeof BUILDINGS

/** Edificio del catálogo con los tipos de contenido ya concretados (icono y división). */
export type CatalogBuilding = BuildingDef & {
  readonly icon: IconName
  readonly requires?: DivisionId
}

/**
 * Acceso tipado a un edificio. La simulación solo conoce `BuildingDef` (con
 * `icon: string`); la UI usa esto para tener `IconName` sin que `sim/` dependa
 * de `content/`.
 */
export function getBuilding(id: StarterBuildingId): CatalogBuilding {
  return BUILDINGS[id]
}
