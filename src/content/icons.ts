/**
 * Iconos disponibles (Tabler Icons, estilo línea). El contenido los nombra con
 * `IconName` y cada capa tiene su registro: componentes Vue en
 * `src/ui/icons.ts` y texturas Pixi en `src/render/iconTextures.ts`.
 *
 * Añadir un icono = añadir su nombre aquí (el de https://tabler.io/icons) y
 * TypeScript obligará a registrarlo en ambos sitios.
 */
export const ICON_NAMES = [
  // Categorías del menú
  'soccer-field',
  'building-stadium',
  'blocks',
  'wall',
  'texture',
  'layout-grid',
  'armchair',
  'bolt',
  'users',
  'hammer',
  // Campos y gradas
  'ball-football',
  'stairs',
  'play-football',
  'flag',
  // Vestuario y oficina
  'archive',
  'bath',
  'toilet-paper',
  'wash-hand',
  'armchair-2',
  'desk',
  'chair-director',
  'folder',
  // Exterior
  'tree',
  'plant',
  'lamp',
  'trash',
  'picnic-table',
  'fountain',
  'seedling',
  // Salud, gimnasio y restauración
  'massage',
  'barbell',
  'stretching',
  'coffee',
  'cup',
  // Salas, construcción, suministros y personal (planificados)
  'shirt-sport',
  'briefcase',
  'ticket',
  'first-aid-kit',
  'package',
  'camera',
  'door',
  'fence',
  'droplet',
  'bulb',
  'lawn-mower',
  'shield',
  'clipboard',
  'device-cctv',
  // Interfaz
  'lock',
  'rotate-clockwise',
] as const

export type IconName = (typeof ICON_NAMES)[number]
