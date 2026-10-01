/**
 * Paleta única del render, sacada de `docs/GUIA-ESTILO.md`.
 * Ningún color del canvas se escribe fuera de aquí: un color nuevo se añade
 * primero a la guía y después a este archivo.
 */
export const palette = {
  // Césped
  grass: 0x5f8f3e,
  grassPitch: 0x6e9c45,
  grassShadow: 0x476e2c,
  grassVariation: 0x557f37,
  // Barro y caminos
  mud: 0x7a5a3a,
  mudDeep: 0x5e4329,
  // Piedra y pizarra
  stone: 0x8f9496,
  stoneDark: 0x6d7275,
  slate: 0x4a5560,
  slateRows: 0x3b444d,
  // Madera e interiores
  wood: 0x8a5f3c,
  floor: 0xb9a68a,
  // Agua
  water: 0x7c98a8,
  waterShine: 0xa9c2cf,
  waterEdge: 0x5f7d8d,
  // Árboles
  tree: 0x3f6630,
  treeLight: 0x4e7a3a,
  treeOutline: 0x2a4420,
  // Cal, luz y contorno
  chalk: 0xeef0ea,
  warmLight: 0xf2c46b,
  outline: 0x2e2a26,

  // Fondo fuera del mapa
  background: 0x1b2a1f,

  // Feedback de interfaz sobre el mapa
  previewValid: 0x8fd16a,
  previewInvalid: 0xe0574a,
  lockedVeil: 0x2e2a26,
} as const

export type PaletteColor = keyof typeof palette
