/**
 * Números enteros con punto de miles, como en es-ES pero agrupando SIEMPRE:
 * `Intl` en es-ES deja sin agrupar las cifras de 4 dígitos ("1500") y se
 * leería distinto que "12.000". Lo usan el HUD, las fichas, el menú, la vista
 * previa y los textos flotantes, para que todas las cantidades se lean igual.
 */
export function formatNumber(value: number): string {
  const rounded = Math.round(Math.abs(value))
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return value < 0 && rounded !== 0 ? `−${grouped}` : grouped
}
