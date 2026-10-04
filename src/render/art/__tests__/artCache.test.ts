import type { Renderer } from 'pixi.js'
import { describe, expect, it, vi } from 'vitest'
import { createArtCache } from '../artCache'

// La parte de dibujos compartidos no usa el renderer (solo las siluetas).
// Los pintores no dibujan nada: rellenar necesita el DOM y aquí solo se prueba la caché.
const cache = () => createArtCache({} as Renderer)

describe('caché del arte', () => {
  it('pinta cada clave una sola vez y comparte el contexto', () => {
    const art = cache()
    const paint = vi.fn()
    const first = art.context('locker:0:1x1', paint)
    const second = art.context('locker:0:1x1', paint)
    expect(first).not.toBeNull()
    expect(second).toBe(first)
    expect(paint).toHaveBeenCalledTimes(1)
  })

  it('claves distintas (otro nivel) dan dibujos distintos', () => {
    const art = cache()
    expect(art.context('locker:0:1x1', () => {})).not.toBe(art.context('locker:1:1x1', () => {}))
  })

  it('devuelve null (y lo recuerda) si no hay nada que dibujar', () => {
    const art = cache()
    const paint = vi.fn(() => false)
    expect(art.context('stand:0:14x3:roof', paint)).toBeNull()
    expect(art.context('stand:0:14x3:roof', paint)).toBeNull()
    expect(paint).toHaveBeenCalledTimes(1)
  })

  it('al destruir la caché libera los contextos', () => {
    const art = cache()
    const ctx = art.context('bin:0:1x1', () => {})
    art.destroy()
    expect(ctx?.destroyed).toBe(true)
  })
})
