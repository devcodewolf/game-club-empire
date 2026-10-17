/**
 * Formato de importes en euros con punto de miles siempre ("1.240 €") y signo
 * menos tipográfico (ver `formatNumber`).
 */
import { formatNumber } from '@/render/core/formatNumber'

/** "1.240 €" (el menos va como "−"). */
export function formatEuros(amount: number): string {
  return `${formatNumber(amount)} €`
}

/** "+260 €" / "−120 €" (el cero sin signo). */
export function formatSignedEuros(amount: number): string {
  const rounded = Math.round(amount)
  return `${rounded > 0 ? '+' : ''}${formatEuros(rounded)}`
}
