import { describe, expect, it } from 'vitest'
import { shade } from './color'

describe('shade', () => {
  it('0 deja el color igual', () => {
    expect(shade(0x5f8f3e, 0)).toBe(0x5f8f3e)
  })

  it('-1 da negro y 1 da blanco', () => {
    expect(shade(0x5f8f3e, -1)).toBe(0x000000)
    expect(shade(0x5f8f3e, 1)).toBe(0xffffff)
  })

  it('oscurecer baja cada canal y aclarar lo sube', () => {
    const base = 0x806040
    const dark = shade(base, -0.5)
    const light = shade(base, 0.5)
    expect(dark).toBe(0x403020)
    expect((light >> 16) & 0xff).toBeGreaterThan(0x80)
    expect(light & 0xff).toBeGreaterThan(0x40)
  })

  it('valores fuera de [-1, 1] se limitan', () => {
    expect(shade(0x123456, -5)).toBe(0x000000)
    expect(shade(0x123456, 5)).toBe(0xffffff)
  })
})
