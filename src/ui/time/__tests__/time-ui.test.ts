import { describe, expect, it } from 'vitest'
import { fromDate } from '@/sim/time/calendar'
import { formatClock } from '../formatTime'
import { MAX_FRAME_MS, ticksForFrame } from '../gameLoop'

describe('bucle de juego', () => {
  it('a 2 ticks/s, 60 fotogramas de 1/60 s dan exactamente 2 ticks (lo sobrante se acumula)', () => {
    const acc = { carry: 0 }
    let total = 0
    for (let i = 0; i < 60; i++) total += ticksForFrame(acc, 1000 / 60, 2)
    expect(total).toBe(2)
  })

  it('un fotograma enorme (pestaña oculta) se recorta', () => {
    const acc = { carry: 0 }
    expect(ticksForFrame(acc, 10_000, 20)).toBe(Math.floor((MAX_FRAME_MS / 1000) * 20))
  })
})

describe('formato de fecha', () => {
  it('"Lun 23 ago · 09:00 · Año 1" al empezar y "Dom 5 sep · 17:00 · Año 1" el primer domingo de septiembre', () => {
    expect(formatClock(fromDate({ year: 1, month: 8, day: 23, hour: 9 }))).toBe(
      'Lun 23 ago · 09:00 · Año 1',
    )
    expect(formatClock(fromDate({ year: 1, month: 9, day: 5, hour: 17 }))).toBe(
      'Dom 5 sep · 17:00 · Año 1',
    )
  })
})
