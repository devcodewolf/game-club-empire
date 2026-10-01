import { describe, expect, it } from 'vitest'
import { createRandom, seedFromText } from './random'

describe('createRandom', () => {
  it('es determinista: la misma semilla da la misma secuencia', () => {
    const a = createRandom(42)
    const b = createRandom(42)
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next())
  })

  it('semillas distintas dan secuencias distintas', () => {
    expect(createRandom(1).next()).not.toBe(createRandom(2).next())
  })

  it('next, range e int respetan sus límites', () => {
    const rnd = createRandom(7)
    for (let i = 0; i < 500; i++) {
      const n = rnd.next()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
      const r = rnd.range(-3, 5)
      expect(r).toBeGreaterThanOrEqual(-3)
      expect(r).toBeLessThan(5)
      const k = rnd.int(2, 4)
      expect([2, 3, 4]).toContain(k)
    }
  })

  it('pick devuelve elementos de la lista', () => {
    const rnd = createRandom(3)
    for (let i = 0; i < 50; i++) expect(['a', 'b', 'c']).toContain(rnd.pick(['a', 'b', 'c']))
  })
})

describe('seedFromText', () => {
  it('es estable y distingue textos', () => {
    expect(seedFromText('gravel')).toBe(seedFromText('gravel'))
    expect(seedFromText('gravel')).not.toBe(seedFromText('planks'))
  })
})
