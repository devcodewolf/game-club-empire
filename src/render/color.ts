/**
 * Utilidades de color para derivar tonos de un color base de la paleta.
 * La guía pide colores planos: el volumen se sugiere con un segundo y tercer
 * tono, que salen de aquí en vez de inventar colores sueltos.
 */

/**
 * Aclara (amount > 0) u oscurece (amount < 0) un color 0xRRGGBB.
 * `amount` va de -1 (negro) a 1 (blanco).
 */
export function shade(color: number, amount: number): number {
  const target = amount < 0 ? 0 : 255
  const t = Math.min(Math.abs(amount), 1)
  const mix = (channel: number): number => Math.round(channel + (target - channel) * t)

  const r = mix((color >> 16) & 0xff)
  const g = mix((color >> 8) & 0xff)
  const b = mix(color & 0xff)
  return (r << 16) | (g << 8) | b
}
