/**
 * Menú de construcción (estilo Prison Architect): una barra de categorías
 * abajo a la izquierda; cada categoría despliega hacia arriba un panel con
 * pestañas y sus opciones.
 *
 * Es solo datos: añadir una opción = añadir una entrada. Las opciones
 * 'planned' se ven en gris con la fase en la que llegarán, para que el menú
 * muestre desde ya hacia dónde crece el juego.
 */
import type { StarterBuildingId } from './buildings'
import type { DoorTypeId } from './doors'
import type { FloorTypeId } from './floors'
import { ROOMS, type RoomTypeId } from './rooms'
import type { WallTypeId } from './walls'
import type { IconName } from './icons'

/** Color del botón por categoría (ver "plano de obra" en la guía de estilo). */
export type MenuColor = 'blue' | 'green' | 'yellow' | 'orange' | 'red'

export type MenuItem =
  | {
      readonly kind: 'building'
      readonly id: StarterBuildingId
      /** Rótulo corto para el botón si el nombre completo no cabe (la pestaña da el contexto). */
      readonly label?: string
    }
  | { readonly kind: 'floor'; readonly id: FloorTypeId }
  /** Cimientos con ese tipo de muro (suelo interior de hormigón). */
  | { readonly kind: 'foundation'; readonly wall: WallTypeId }
  | { readonly kind: 'wall'; readonly id: WallTypeId }
  | { readonly kind: 'door'; readonly id: DoorTypeId }
  /** Demoler: clic quita lo de encima; arrastrar arrasa la zona. */
  | { readonly kind: 'demolish' }
  | { readonly kind: 'room'; readonly id: RoomTypeId }
  | { readonly kind: 'removeRoom' }
  | {
      readonly kind: 'planned'
      readonly label: string
      readonly icon: IconName
      /** Cuándo llegará, p. ej. "Fase 1B · hito 2". */
      readonly arrives: string
    }

export interface MenuTab {
  readonly label: string
  readonly items: readonly MenuItem[]
}

export interface MenuCategory {
  readonly id: string
  readonly label: string
  readonly icon: IconName
  readonly color: MenuColor
  readonly tabs: readonly MenuTab[]
}

const building = (id: StarterBuildingId, label?: string): MenuItem => ({
  kind: 'building',
  id,
  label,
})
const floor = (id: FloorTypeId): MenuItem => ({ kind: 'floor', id })
const foundation = (wall: WallTypeId): MenuItem => ({ kind: 'foundation', wall })
const wall = (id: WallTypeId): MenuItem => ({ kind: 'wall', id })
const door = (id: DoorTypeId): MenuItem => ({ kind: 'door', id })
const room = (id: RoomTypeId): MenuItem => ({ kind: 'room', id })
const planned = (label: string, icon: IconName, arrives: string): MenuItem => ({
  kind: 'planned',
  label,
  icon,
  arrives,
})

/** Ids de las salas, en el orden del catálogo. */
const ROOM_IDS = Object.keys(ROOMS) as RoomTypeId[]

export const BUILD_CATEGORIES: readonly MenuCategory[] = [
  {
    id: 'pitches',
    label: 'Campos',
    icon: 'soccer-field',
    color: 'green',
    tabs: [
      {
        label: 'Campos',
        items: [building('pitch11', 'Fútbol 11'), building('pitch7', 'Fútbol 7 (cantera)')],
      },
    ],
  },
  {
    id: 'stands',
    label: 'Gradas',
    icon: 'building-stadium',
    color: 'orange',
    tabs: [
      {
        label: 'Gradas',
        items: [building('stand', 'Lateral / Fondo'), building('standCorner', 'Córner')],
      },
    ],
  },
  {
    id: 'foundations',
    label: 'Cimientos',
    icon: 'blocks',
    color: 'blue',
    tabs: [
      {
        label: 'Cimientos',
        items: [
          foundation('brick'),
          foundation('concrete'),
          foundation('plaster'),
          foundation('stone'),
        ],
      },
    ],
  },
  {
    id: 'walls',
    label: 'Muros y puertas',
    icon: 'wall',
    color: 'blue',
    tabs: [
      {
        label: 'Muros',
        items: [
          wall('brick'),
          wall('concrete'),
          wall('plaster'),
          wall('stone'),
          wall('fence'),
          wall('hedge'),
        ],
      },
      {
        label: 'Puertas',
        items: [door('woodDoor'), door('staffDoor'), door('gate'), door('glassDoor')],
      },
    ],
  },
  {
    id: 'floors',
    label: 'Suelos',
    icon: 'texture',
    color: 'blue',
    tabs: [
      {
        label: 'Exterior',
        items: [floor('grass'), floor('dirt'), floor('gravel'), floor('stoneSlab')],
      },
      { label: 'Interior', items: [floor('concrete'), floor('wood'), floor('whiteTile')] },
    ],
  },
  {
    id: 'rooms',
    label: 'Salas',
    icon: 'layout-grid',
    color: 'green',
    tabs: [
      {
        label: 'Salas',
        items: [
          ...ROOM_IDS.map(room),
          planned('Sala de prensa', 'camera', 'Fase 5'),
          { kind: 'removeRoom' },
        ],
      },
    ],
  },
  {
    id: 'objects',
    label: 'Objetos',
    icon: 'armchair',
    color: 'blue',
    tabs: [
      {
        label: 'Vestuario',
        items: [
          building('locker'),
          building('changingBench'),
          building('shower'),
          building('toilet'),
          building('sink'),
          building('tacticsBoard'),
        ],
      },
      {
        label: 'Oficina',
        items: [
          building('officeDesk'),
          building('officeChair'),
          building('filingCabinet'),
          building('plant'),
          building('waterCooler'),
        ],
      },
      {
        label: 'Recepción',
        items: [building('receptionDesk'), building('storageShelf')],
      },
      {
        label: 'Campo',
        items: [building('dugout'), building('trainingGoal'), building('cornerFlag')],
      },
      {
        label: 'Exterior',
        items: [
          building('tree'),
          building('streetLamp'),
          building('bin'),
          building('parkBench'),
          building('fountain'),
        ],
      },
      {
        label: 'Salud y ocio',
        items: [
          building('physioTable'),
          building('weightsBench'),
          building('exerciseBike'),
          building('barCounter'),
          building('cafeTable'),
          building('vendingMachine'),
        ],
      },
    ],
  },
  {
    id: 'utilities',
    label: 'Suministros',
    icon: 'bolt',
    color: 'yellow',
    tabs: [
      {
        label: 'Suministros',
        items: [
          planned('Generador', 'bolt', 'Fase 4B'),
          planned('Foco', 'bulb', 'Fase 4B'),
          planned('Depósito de agua', 'droplet', 'Fase 4B'),
        ],
      },
    ],
  },
  {
    id: 'staff',
    label: 'Personal',
    icon: 'users',
    color: 'yellow',
    tabs: [
      {
        label: 'Personal',
        items: [
          planned('Entrenador', 'clipboard', 'Fase 4'),
          planned('Jardinero', 'lawn-mower', 'Fase 4'),
          planned('Seguridad', 'shield', 'Fase 4'),
        ],
      },
    ],
  },
  {
    id: 'demolish',
    label: 'Demoler',
    icon: 'hammer',
    color: 'red',
    tabs: [{ label: 'Demoler', items: [{ kind: 'demolish' }] }],
  },
]
