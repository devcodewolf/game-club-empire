/**
 * Inicio de partida (Fase 2, docs/prompts/FASE2-ESPECIFICACION.md §4.1): un
 * campo de fútbol 11 de tierra cerca del centro del mapa (con sitio alrededor
 * para crecer) y la caseta vieja junto a él. Se aplica gratis al crear la partida.
 */
import type { Command } from '@/sim/commands'

/** Esquina del campo de inicio: centrado hacia la mitad del mapa (x 120), a la altura del acceso. */
export const START_PITCH_ORIGIN = { x: 92, y: 61 } as const

export const START_SCENARIO: readonly Command[] = [
  { type: 'placeBuilding', buildingType: 'pitch11', origin: START_PITCH_ORIGIN, rotation: 0 },
  // Caseta vieja al este del campo, con la puerta mirando al campo
  { type: 'placeBuilding', buildingType: 'oldShed', origin: { x: 150, y: 78 }, rotation: 1 },
]
