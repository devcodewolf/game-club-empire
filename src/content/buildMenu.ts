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
import type { FloorTypeId } from './floors'
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
  | { readonly kind: 'demolish' }
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
const planned = (label: string, icon: IconName, arrives: string): MenuItem => ({
  kind: 'planned',
  label,
  icon,
  arrives,
})

export const BUILD_CATEGORIES: readonly MenuCategory[] = [
  {
    id: 'pitches',
    label: 'Campos',
    icon: 'soccer-field',
    color: 'green',
    tabs: [
      {
        label: 'Fútbol 11',
        items: [
          building('pitch11Dirt', 'Tierra'),
          building('pitch11Artificial', 'Césped artificial'),
          building('pitch11Natural', 'Césped natural'),
          building('pitch11Hybrid', 'Césped híbrido'),
        ],
      },
      {
        label: 'Fútbol 7',
        items: [
          building('pitch7Dirt', 'Tierra'),
          building('pitch7Artificial', 'Césped artificial'),
          building('pitch7Natural', 'Césped natural'),
          building('pitch7Hybrid', 'Césped híbrido'),
        ],
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
        items: [
          building('standEarthBank', 'Talud'),
          building('standWoodBenches', 'Bancos de madera'),
          building('standMetalSeats', 'Con asientos'),
          building('standCovered', 'Tribuna cubierta'),
          building('standStadium', 'De estadio'),
          building('standGrand', 'Gran tribuna'),
        ],
      },
    ],
  },
  {
    id: 'foundations',
    label: 'Cimientos',
    icon: 'blocks',
    color: 'blue',
    tabs: [{ label: 'Cimientos', items: [planned('Cimientos', 'blocks', 'Fase 1B · hito 2')] }],
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
          planned('Muro de ladrillo', 'wall', 'Fase 1B · hito 2'),
          planned('Muro de piedra', 'wall', 'Fase 1B · hito 2'),
          planned('Valla', 'fence', 'Fase 1B · hito 2'),
        ],
      },
      { label: 'Puertas', items: [planned('Puerta', 'door', 'Fase 1B · hito 2')] },
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
          planned('Vestuario', 'shirt-sport', 'Fase 1B · hito 3'),
          planned('Oficina', 'briefcase', 'Fase 1B · hito 3'),
          planned('Recepción', 'ticket', 'Fase 1B · hito 3'),
          planned('Enfermería', 'first-aid-kit', 'Fase 4'),
          planned('Gimnasio', 'barbell', 'Fase 4'),
          planned('Almacén', 'package', 'Fase 4'),
          planned('Sala de prensa', 'camera', 'Fase 5'),
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
        ],
      },
      {
        label: 'Oficina',
        items: [building('officeDesk'), building('officeChair'), building('filingCabinet')],
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
