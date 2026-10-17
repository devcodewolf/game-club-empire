/**
 * Utilidades compartidas por los tests de la simulación.
 *
 * Usan un catálogo de prueba propio, independiente de `src/content/`.
 */
import type { EconomyContent } from '../economy/ledger'
import type { MatchContent } from '../club/match'
import type { GrantsContent } from '../club/grants'
import type { TimeContent } from '../time/clock'
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
/**
 * Tiempo de prueba: mismo ritmo que el juego, inicio el lunes 23 de agosto
 * del año 1 a las 09:00, lluvia al 35 % y un evento que detiene el avance
 * cada lunes a las 08:00 (como el lunes de cuentas).
 */
export const TEST_TIME: TimeContent = {
  realMinutesPerDay: 12,
  speeds: [1, 3, 5, 10],
  start: { year: 1, month: 8, day: 23, hour: 9 },
  rainChance: 0.35,
  events: [{ id: 'weeklyAccounts', rule: { every: 'week', weekday: 0, hour: 8 }, stops: true }],
}

/**
 * Economía de prueba: mucho dinero para que los tests de construcción no se
 * queden sin fondos; mismos porcentajes que el juego.
 */
export const TEST_ECONOMY: EconomyContent = {
  startMoney: 1_000_000,
  refund: { objects: 0.5, structures: 0.25 },
  moveRate: 0.1,
  start: { division: 'comarcal', members: 60 },
  divisions: { comarcal: { entry: 5, memberFee: 15, subsidy: 500 } },
  startupAid: [
    { fromWeek: 1, toWeek: 4, amount: 1000 },
    { fromWeek: 5, toWeek: 8, amount: 500 },
  ],
  bar: { roomType: 'cafe', perDay: 30 },
  rental: { perDay: { 7: 30, 11: 50 }, surfaceMultiplier: { dirt: 1 } },
  maintenance: {
    objectRate: 0.02,
    standRate: 0.01,
    interiorPerTile: 0.2,
    turfPerTile: { dirt: 0.05 },
  },
  staff: {
    gardener: { name: 'Jardinero', wage: 250, covers: { pitchTiles: 1500 } },
    cleaner: { name: 'Limpieza', wage: 200, covers: { indoorTiles: 400, seats: 1500 } },
    maintenance: { name: 'Mantenimiento', wage: 250, covers: { objectsValue: 15000 } },
    monitor: { name: 'Monitor', wage: 150, covers: { students: 15 } },
  },
  pitch: {
    startCondition: 50,
    maxCondition: { dirt: 60 },
    dailyRecovery: 4,
    rainDamage: { dirt: 2 },
    rentalDamage: { dirt: 1 },
    matchDamage: 8,
    repairPerTile: { dirt: 0.5 },
    repairRestDays: 3,
  },
  breakdown: { weeklyChance: 0.05, repairRate: 0.25 },
}

/**
 * Partido de prueba: mismas reglas que el juego. El vestuario es la sala
 * 'kit' (calidad = media de sus objetos × 2,5) y no hay caseta vieja
 * ('shed' no existe en el catálogo de prueba).
 */
export const TEST_MATCH: MatchContent = {
  firstMatch: { month: 9, day: 5 },
  kickoffEvent: 'matchKickoff',
  offSeasonMonths: [6, 7, 8],
  rivals: ['Rival A', 'Rival B', 'Rival C'],
  changingRoom: { roomType: 'kit', shed: 'shed', qualityScale: 2.5 },
  strength: {
    base: 40,
    home: 5,
    pitchDivisor: 10,
    facilitiesMax: 30,
    changingRoomFactor: 1.5,
    surface: { dirt: 0, grass: 8, stone: 10 },
    rooms: { depot: 3 },
    rival: { base: 45, spread: 10 },
  },
  goals: { base: 1.3, exponent: 1.5, max: 9 },
  attendance: { memberShare: 0.9, publicShare: 0.5, rainFactor: 0.85, standing: 100 },
  matchday: {
    barPerSpectator: 1.5,
    parking: { spaces: 10, fee: 2, perCar: 4, rect: { x: 18, y: 0, width: 2, height: 4 } },
    travelCost: 100,
    noVisitorRoom: { fine: 200, fame: -1 },
  },
  fame: {
    start: 5,
    result: { win: 2, draw: 0.5, loss: -1 },
    firstRoom: 1,
    drift: 0.2,
    divisionBase: { comarcal: 5 },
  },
  fans: {
    start: 300,
    result: { win: 0.03, draw: 0.01, loss: -0.01 },
    ceilingBase: 1000,
    ceilingPerFame: 100,
    satisfactionPivot: 60,
    satisfactionDivisor: 2000,
  },
  satisfaction: {
    start: 70,
    base: 70,
    cleaning: 30,
    bar: 10,
    parking: 5,
    coveredStand: 10,
    coveredStandTier: 2,
    crowdOut: 15,
    rainUncovered: 10,
    goodVisitorQuality: 5,
    goodVisitorRoom: 5,
  },
  members: { targetShare: 0.25, rate: 0.1 },
  benches: [
    { name: 'Banco', cost: 300, strength: 2 },
    { name: 'Con techo', cost: 1500, strength: 3 },
  ],
}

/** Subvenciones de prueba: una inicial con una sala 'kit', otra encadenada y una oculta. */
export const TEST_GRANTS: GrantsContent = {
  maxActive: 2,
  cancelRate: 1.1,
  list: [
    {
      id: 'first',
      name: 'Primera',
      from: 'Ayuntamiento',
      pitch: '',
      advance: 1000,
      bonus: 2000,
      fame: 1,
      objectives: [{ kind: 'room', roomType: 'kit' }],
    },
    {
      id: 'second',
      name: 'Segunda',
      from: 'Ayuntamiento',
      pitch: '',
      advance: 0,
      bonus: 500,
      fame: 1,
      requires: ['first'],
      objectives: [{ kind: 'members', min: 61 }],
    },
    {
      id: 'loose',
      name: 'Suelta',
      from: 'Ayuntamiento',
      pitch: '',
      advance: 200,
      bonus: 300,
      fame: 0,
      objectives: [{ kind: 'staff', role: 'gardener', min: 1 }],
    },
    {
      id: 'rescue',
      name: 'Rescate',
      from: 'Ayuntamiento',
      pitch: '',
      advance: 0,
      bonus: 0,
      fame: 0,
      hidden: true,
      objectives: [],
    },
  ],
}

export const TEST_CONTENT: SimContent = {
  buildings: TEST_CATALOG,
  floors: TEST_FLOORS,
  walls: TEST_WALLS,
  doors: TEST_DOORS,
  rooms: TEST_ROOMS,
  time: TEST_TIME,
  economy: TEST_ECONOMY,
  match: TEST_MATCH,
  grants: TEST_GRANTS,
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
