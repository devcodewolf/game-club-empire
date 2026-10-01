/**
 * Paleta única del render. Ningún color del canvas se escribe fuera de aquí.
 * Valores provisionales; la guía de estilo definitiva llega en la Fase 6.
 */
export const palette = {
  background: 0x1b2a1f,
  grassLight: 0x6fa055,
  grassDark: 0x67974f,
  gridLine: 0x2f4a2a,
  outline: 0x1f2a24,
} as const

export type PaletteColor = keyof typeof palette
