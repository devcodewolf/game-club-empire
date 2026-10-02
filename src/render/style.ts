/**
 * Constantes de estilo del arte (skill pixi-artist). Todos los pintores deben
 * usar estas constantes en lugar de grosores y opacidades sueltos, para que
 * todas las piezas parezcan del mismo juego.
 *
 * Diseñadas para el zoom inicial ×0,5: una casilla mide 32 px en pantalla.
 */

/** Detalles internos (juntas, vetas, tiradores). Mínimo absoluto de un trazo. */
export const OUTLINE_DETAIL = 1

/** Contorno de objetos, campos y decorado. */
export const OUTLINE = 1.5

/** Muros: trazo grueso estilo Prison Architect. */
export const OUTLINE_WALL = 2.5

/** Desplazamiento de la sombra proyectada, en px hacia abajo y a la derecha. */
export const SHADOW_OFFSET = 4

/** Única opacidad de sombra proyectada. */
export const SHADOW_ALPHA = 0.28

/** Ningún detalle visible más pequeño que esto, en px de mundo. */
export const MIN_DETAIL = 2
