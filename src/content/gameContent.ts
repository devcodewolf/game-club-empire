/**
 * Todo el contenido del juego agrupado como lo pide la simulación
 * (`SimContent`). Lo usan la partida (`App.vue`) y la galería de arte.
 */
import type { SimContent } from '@/sim/content'
import { BUILDINGS } from './buildings'
import { DOORS } from './doors'
import { FLOORS } from './floors'
import { ROOMS } from './rooms'
import { WALLS } from './walls'

export const GAME_CONTENT: SimContent = {
  buildings: BUILDINGS,
  floors: FLOORS,
  walls: WALLS,
  doors: DOORS,
  rooms: ROOMS,
}
