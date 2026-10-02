/**
 * Colores del club: los elige el jugador (no forman parte de la paleta base,
 * ver docs/GUIA-ESTILO.md). Los pintores los reciben como parámetro para
 * teñir camisetas, asientos o la franja de las taquillas de lujo.
 *
 * Hasta que exista la creación del club, se usan estos por defecto (un único
 * sitio: cambiar aquí cambia todo el arte).
 */
import { palette } from './palette'

export interface ClubColors {
  /** Color principal (camiseta, asientos, franjas). */
  readonly primary: number
  /** Color secundario (ribetes, detalles). */
  readonly secondary: number
}

export const DEFAULT_CLUB_COLORS: ClubColors = {
  primary: 0x8c2f39,
  secondary: palette.chalk,
}
