/**
 * Catálogo de objetos de tamaño fijo (campos, gradas y mobiliario). Añadir uno
 * = añadir una entrada a `BUILDINGS` (y ponerlo en `buildMenu.ts` para que
 * aparezca en la barra de construcción).
 *
 * Los costes se cobran a partir de la Fase 2; en la Fase 1 solo se definen.
 * Tamaños en casillas de 64 px, sin girar (ancho × alto).
 */
import type { BuildingDef, TierDef } from '@/sim/buildings/buildings'
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
      readonly tiers?: readonly (TierDef & { readonly requires?: DivisionId })[]
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

/** Nombre de cada superficie, para el nombre de cada nivel del campo. */
const SURFACE_LABEL = {
  dirt: 'Tierra',
  artificialTurf: 'Césped artificial',
  naturalGrass: 'Césped natural',
  hybridGrass: 'Césped híbrido',
} as const satisfies Record<PitchSurface, string>

/** Orden de mejora de la superficie: cada nivel del campo es la siguiente. */
const SURFACES: readonly PitchSurface[] = ['dirt', 'artificialTurf', 'naturalGrass', 'hybridGrass']

/**
 * Genera un campo con sus 4 niveles de superficie. `costs` y `requires` van
 * por nivel; el coste del primero es el de construirlo.
 */
function pitch<const Id extends string>(
  id: Id,
  format: PitchFormat,
  costs: readonly [number, number, number, number],
  requires: readonly [DivisionId | undefined, DivisionId, DivisionId, DivisionId],
) {
  return {
    id,
    name: `Campo de fútbol ${format}`,
    size: PITCH_SIZE[format],
    cost: costs[0],
    markerColor: 0x7a5a3a,
    icon: 'ball-football' as const,
    pitch: { format, surfaces: SURFACES },
    requires: requires[0],
    tiers: SURFACES.map((surface, i) => ({
      name: `Fútbol ${format} · ${SURFACE_LABEL[surface]}`,
      cost: costs[i] ?? 0,
      quality: i + 1,
      requires: requires[i],
    })),
  }
}

/**
 * Niveles de la grada: fondo en casillas y espectadores por casilla de largo.
 * Con los 4 lados de un campo de fútbol 11 al máximo salen ~83 000; las
 * esquinas (entrega c) completan hasta MAX_STADIUM_CAPACITY. Provisional
 * hasta equilibrar la economía en la Fase 3.
 */
const STAND_TIERS = [
  { name: 'Talud', depth: 3, perTile: 15, cost: 200, requires: undefined },
  { name: 'Bancos de madera', depth: 4, perTile: 25, cost: 1500, requires: undefined },
  { name: 'Asientos', depth: 5, perTile: 45, cost: 8000, requires: 'regional' },
  { name: 'Tribuna cubierta', depth: 7, perTile: 80, cost: 30000, requires: 'autonomica' },
  { name: 'Grada de estadio', depth: 10, perTile: 200, cost: 150000, requires: 'nacionalA' },
  { name: 'Gran tribuna', depth: 14, perTile: 440, cost: 600000, requires: 'elite' },
] as const satisfies readonly {
  name: string
  depth: number
  perTile: number
  cost: number
  requires: DivisionId | undefined
}[]

export const BUILDINGS = defineBuildings({
  // Campos de fútbol: tamaño reglamentario fijo, no se arrastran. Se mejoran en
  // el sitio subiendo de superficie (tierra → artificial → natural → híbrido).
  pitch11: pitch(
    'pitch11',
    11,
    [500, 40000, 60000, 150000],
    [undefined, 'regional', 'autonomica', 'nacionalA'],
  ),
  pitch7: pitch(
    'pitch7',
    7,
    [300, 15000, 25000, 60000],
    ['regional', 'autonomica', 'nacionalB', 'elite'],
  ),

  // Grada modular: se pega a un lado de un campo y crece hacia fuera al
  // mejorarla. Su largo lo da el lado del campo y su fondo, el nivel
  // (docs/DISENO-ESTADIO-Y-NIVELES.md). `size` es solo la muestra del menú.
  stand: {
    id: 'stand',
    name: 'Grada',
    size: { width: 14, height: 3 },
    cost: STAND_TIERS[0].cost,
    markerColor: 0x8a6a48,
    icon: 'building-stadium',
    stand: {
      depths: STAND_TIERS.map((t) => t.depth),
      capacityPerTile: STAND_TIERS.map((t) => t.perTile),
    },
    tiers: STAND_TIERS.map(({ name, cost, requires }, i) => ({
      name,
      cost,
      quality: i + 1,
      requires,
    })),
  },
  // Córner: cierra la esquina entre dos gradas con las filas en arco. Mismos
  // niveles que la grada, a mitad de precio; no pasa del nivel de su vecina más baja.
  standCorner: {
    id: 'standCorner',
    name: 'Córner',
    size: { width: 3, height: 3 },
    cost: STAND_TIERS[0].cost / 2,
    markerColor: 0x8a6a48,
    icon: 'building-stadium',
    stand: {
      depths: STAND_TIERS.map((t) => t.depth),
      capacityPerTile: STAND_TIERS.map((t) => t.perTile),
      corner: true,
    },
    tiers: STAND_TIERS.map(({ name, cost, requires }, i) => ({
      name: `Córner · ${name}`,
      cost: cost / 2,
      quality: i + 1,
      requires,
    })),
  },

  // Vestuario
  locker: {
    id: 'locker',
    name: 'Taquilla',
    size: { width: 1, height: 1 },
    cost: 80,
    markerColor: 0x6f8fa8,
    icon: 'archive',
    tiers: [
      { name: 'Taquilla metálica', cost: 80, quality: 1 },
      { name: 'Taquilla de madera', cost: 150, quality: 2, requires: 'regional' },
      { name: 'Taquilla de lujo', cost: 400, quality: 4, requires: 'autonomica' },
    ],
  },
  changingBench: {
    id: 'changingBench',
    name: 'Banco de vestuario',
    size: { width: 3, height: 1 },
    cost: 60,
    markerColor: 0x9a6b3f,
    icon: 'armchair-2',
    tiers: [
      { name: 'Banco de tablón', cost: 60, quality: 1 },
      { name: 'Banco con respaldo', cost: 100, quality: 2, requires: 'regional' },
      { name: 'Banco acolchado', cost: 300, quality: 4, requires: 'autonomica' },
    ],
  },
  shower: {
    id: 'shower',
    name: 'Ducha',
    size: { width: 1, height: 1 },
    cost: 150,
    markerColor: 0x5b8fb9,
    icon: 'bath',
    tiers: [
      { name: 'Ducha sencilla', cost: 150, quality: 1 },
      { name: 'Ducha con mampara', cost: 250, quality: 2, requires: 'regional' },
      { name: 'Ducha de lluvia', cost: 600, quality: 4, requires: 'autonomica' },
    ],
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
