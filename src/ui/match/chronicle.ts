/**
 * Crónica del partido generada por reglas: cada frase es un dato con su
 * condición y su prioridad; se enseñan las primeras (de mayor prioridad)
 * que se cumplan. Sin minutos de juego no hay remontadas ni goles tardíos.
 */
import type { MatchResult } from '@/sim/club/match'

export interface ChronicleLine {
  readonly id: string
  /** Mayor número = antes en la crónica. */
  readonly priority: number
  readonly when: (match: MatchResult) => boolean
  readonly text: (match: MatchResult, club: string) => string
}

export const CHRONICLE_LINES: readonly ChronicleLine[] = [
  {
    id: 'thrashing',
    priority: 100,
    when: (m) => m.goalsFor - m.goalsAgainst >= 3,
    text: (m) => `Una goleada de ${m.goalsFor}-${m.goalsAgainst}: el rival no supo qué hacer.`,
  },
  {
    id: 'humiliated',
    priority: 100,
    when: (m) => m.goalsAgainst - m.goalsFor >= 3,
    text: (m) => `Un golpe duro: ${m.goalsFor}-${m.goalsAgainst} y a pensar en lo que falla.`,
  },
  {
    id: 'goalless',
    priority: 60,
    when: (m) => m.goalsFor === 0 && m.goalsAgainst === 0,
    text: () => 'Mucho trabajo y ninguna red movida: 0-0.',
  },
  {
    id: 'noVisitorRoom',
    priority: 90,
    when: (m) => m.noVisitorRoom,
    text: (m) => `${m.opponent} no tuvo vestuario donde cambiarse: multa y mala fama.`,
  },
  {
    id: 'badPitch',
    priority: 80,
    when: (m) => m.home && m.strength.pitch < 4,
    text: () => 'El campo estaba hecho un erial y se notó en cada pase.',
  },
  {
    id: 'crowdedOut',
    priority: 75,
    when: (m) => (m.attendance?.leftOut ?? 0) > 0,
    text: (m) => `Lleno hasta la bandera: ${m.attendance?.leftOut ?? 0} se quedaron sin entrada.`,
  },
  {
    id: 'rain',
    priority: 50,
    when: (m) => m.raining,
    text: () => 'Llovió durante todo el partido y los pocos paraguas se agradecieron.',
  },
  {
    id: 'emptyStands',
    priority: 55,
    when: (m) => m.attendance !== null && m.attendance.total < m.attendance.capacity * 0.25,
    text: () => 'Las gradas estuvieron casi vacías; hace falta más fama para llenarlas.',
  },
  {
    id: 'fullHouse',
    priority: 40,
    when: (m) =>
      m.attendance !== null &&
      m.attendance.capacity > 0 &&
      m.attendance.total >= m.attendance.capacity * 0.9,
    text: () => 'El público respondió y el ambiente fue de los que enganchan.',
  },
  {
    id: 'awayTrip',
    priority: 30,
    when: (m) => !m.home,
    text: (m) => `Viaje a casa de ${m.opponent} en la furgoneta, sin más contratiempos.`,
  },
  {
    id: 'win',
    priority: 20,
    when: (m) => m.outcome === 'win',
    text: (_m, club) => `${club} se llevó los tres puntos.`,
  },
  {
    id: 'draw',
    priority: 20,
    when: (m) => m.outcome === 'draw',
    text: () => 'Reparto de puntos: nadie quiso arriesgar.',
  },
  {
    id: 'loss',
    priority: 20,
    when: (m) => m.outcome === 'loss',
    text: () => 'Se escapó el partido, pero queda mucho campeonato.',
  },
]

/** Hasta `max` frases de crónica, de mayor a menor prioridad. */
export function buildChronicle(match: MatchResult, club: string, max = 3): string[] {
  return CHRONICLE_LINES.filter((line) => line.when(match))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max)
    .map((line) => line.text(match, club))
}
