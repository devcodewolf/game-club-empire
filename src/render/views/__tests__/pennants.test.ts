/** Tests del reparto de banderines por farola según la afición. */
import { describe, expect, it } from 'vitest'
import { pennantLayout, pennantTier } from '../pennantsView'

const THRESHOLDS = [300, 800, 2000, 5000]

describe('banderines', () => {
  it('el tramo es cuántas cifras de afición se han alcanzado', () => {
    expect(pennantTier(299, THRESHOLDS)).toBe(0)
    expect(pennantTier(300, THRESHOLDS)).toBe(1)
    expect(pennantTier(1999, THRESHOLDS)).toBe(2)
    expect(pennantTier(9000, THRESHOLDS)).toBe(4)
  })

  it('con 6 farolas: 2, 4 y 6 con uno; en el último tramo, dos en cada una', () => {
    expect(pennantLayout(0, 4, 6)).toEqual([0, 0, 0, 0, 0, 0])
    expect(pennantLayout(1, 4, 6)).toEqual([1, 1, 0, 0, 0, 0])
    expect(pennantLayout(2, 4, 6)).toEqual([1, 1, 1, 1, 0, 0])
    expect(pennantLayout(3, 4, 6)).toEqual([1, 1, 1, 1, 1, 1])
    expect(pennantLayout(4, 4, 6)).toEqual([2, 2, 2, 2, 2, 2])
  })
})
