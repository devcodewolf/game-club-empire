/**
 * Patrocinios locales (Fase 2, Bloque F; docs/prompts/FASE2-ESPECIFICACION.md
 * §4.7): negocios inventados del pueblo con su logotipo y plantillas de tratos
 * con objetivos. Las cifras se ajustan jugando.
 */
import type { SponsorsContent } from '@/sim/club/sponsors'

export const SPONSORS: SponsorsContent = {
  maxActive: 2,
  maxOffers: 2,
  offerEveryWeeks: 2,
  offerLifetimeWeeks: 4,
  cancelRate: 1.1,
  // Por dificultad: fácil, normal, difícil
  advance: [500, 1000, 1500],
  bonus: [1500, 2500, 4000],
  moneySpread: 0.1,
  fame: { completed: 2, failed: -2 },
  // Colores de la paleta: los logotipos saldrán también en las vallas del mapa
  businesses: [
    {
      id: 'rios',
      name: 'Panadería Hermanos Ríos',
      logo: { shape: 'bread', color: 0xc99a4a, accent: 0xeef0ea },
    },
    {
      id: 'lamela',
      name: 'Talleres Lamela',
      logo: { shape: 'wrench', color: 0x3f6fa8, accent: 0xeef0ea },
    },
    {
      id: 'muino',
      name: 'Sidrería O Muíño',
      logo: { shape: 'bottle', color: 0x557f37, accent: 0xf2c46b },
    },
    {
      id: 'clavo',
      name: 'Ferretería El Clavo',
      logo: { shape: 'hammer', color: 0x8c2f39, accent: 0xeef0ea },
    },
    {
      id: 'huerta',
      name: 'Frutería La Huerta',
      logo: { shape: 'apple', color: 0xe0574a, accent: 0x8fd16a },
    },
    {
      id: 'pepe',
      name: 'Bar Casa Pepe',
      logo: { shape: 'cup', color: 0x7a5a3a, accent: 0xeef0ea },
    },
    {
      id: 'mareas',
      name: 'Pescadería Mareas',
      logo: { shape: 'fish', color: 0x7c98a8, accent: 0xeef0ea },
    },
    {
      id: 'tijeras',
      name: 'Peluquería Tijeras de Oro',
      logo: { shape: 'scissors', color: 0xe0bf3a, accent: 0x2e2a26 },
    },
  ],
  templates: [
    {
      id: 'vestuario',
      difficulty: 1,
      weeks: [4, 6],
      objectives: [{ objective: { kind: 'room', roomType: 'changingRoom' } }],
    },
    {
      id: 'vestuarioBueno',
      difficulty: 2,
      weeks: [4, 6],
      objectives: [{ objective: { kind: 'changingRoomQuality', min: 4 } }],
    },
    {
      id: 'socios',
      difficulty: 1,
      weeks: [3, 5],
      objectives: [{ objective: { kind: 'members', min: 10 }, relative: true }],
    },
    {
      id: 'muchosSocios',
      difficulty: 2,
      weeks: [5, 6],
      objectives: [{ objective: { kind: 'members', min: 30 }, relative: true }],
    },
    {
      id: 'victorias',
      difficulty: 1,
      weeks: [4, 6],
      objectives: [{ objective: { kind: 'wins', count: 2 } }],
    },
    {
      id: 'rachaVictorias',
      difficulty: 3,
      weeks: [5, 6],
      objectives: [{ objective: { kind: 'wins', count: 4 } }],
    },
    {
      id: 'grada',
      difficulty: 2,
      weeks: [3, 5],
      objectives: [{ objective: { kind: 'capacity', min: 200 }, relative: true }],
    },
    {
      id: 'campoCuidado',
      difficulty: 2,
      weeks: [3, 5],
      objectives: [
        { objective: { kind: 'staff', role: 'gardener', min: 1 } },
        { objective: { kind: 'pitchCondition', min: 55, days: 7 } },
      ],
    },
    {
      id: 'banquillos',
      difficulty: 1,
      weeks: [3, 4],
      objectives: [{ objective: { kind: 'benches', tier: 0 } }],
    },
    {
      id: 'casaLlena',
      difficulty: 2,
      weeks: [4, 6],
      objectives: [{ objective: { kind: 'fullHouse', count: 1 } }],
    },
    {
      id: 'vallas',
      difficulty: 2,
      weeks: [4, 6],
      objectives: [{ objective: { kind: 'billboards', min: 2 }, relative: true }],
    },
    {
      id: 'barAbierto',
      difficulty: 2,
      weeks: [4, 6],
      divisions: ['regional', 'autonomica', 'nacionalB', 'nacionalA', 'elite'],
      objectives: [{ objective: { kind: 'room', roomType: 'cafe' } }],
    },
  ],
}
