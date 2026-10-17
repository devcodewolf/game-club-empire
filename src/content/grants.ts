/**
 * Subvenciones del ayuntamiento con objetivos (Fase 2, Bloque F; idea de Raul
 * en docs/IDEAS.md). Una cadena: cumplir una abre las siguientes. Las cifras
 * se ajustan jugando.
 */
import type { GrantsContent } from '@/sim/club/grants'

export const GRANTS: GrantsContent = {
  maxActive: 2,
  // Cancelar devuelve el adelanto y un 10 % más
  cancelRate: 1.1,
  list: [
    {
      id: 'clubEnRegla',
      name: 'Un club en regla',
      from: 'Ayuntamiento',
      pitch: 'Si queréis jugar en serio, el club tiene que estar en regla: vestuario y oficina.',
      advance: 2000,
      bonus: 3000,
      fame: 1,
      objectives: [
        { kind: 'room', roomType: 'changingRoom' },
        { kind: 'room', roomType: 'office' },
      ],
    },
    {
      id: 'campoDigno',
      name: 'Un campo digno',
      from: 'Ayuntamiento',
      pitch: 'El campo es la cara del pueblo. Cuidadlo y os echamos una mano.',
      advance: 0,
      bonus: 3000,
      fame: 1,
      objectives: [
        { kind: 'staff', role: 'gardener', min: 1 },
        // La tierra llega como mucho a 60 y cada partido en casa le quita 8: una semana
        // seguida (no dos) para que se pueda cumplir entre partido y partido
        { kind: 'pitchCondition', min: 55, days: 7 },
      ],
    },
    {
      id: 'sitioAficion',
      name: 'Un sitio para la afición',
      from: 'Ayuntamiento',
      pitch: 'Los vecinos quieren ver los partidos sentados. Poned gradas.',
      advance: 1000,
      bonus: 1500,
      fame: 1,
      requires: ['clubEnRegla'],
      objectives: [{ kind: 'capacity', min: 300 }],
    },
    {
      id: 'cienSocios',
      name: 'Cien socios',
      from: 'Ayuntamiento',
      pitch: 'Un club con cien socios ya es un club del pueblo de verdad.',
      advance: 0,
      bonus: 2500,
      fame: 1,
      requires: ['sitioAficion'],
      objectives: [{ kind: 'members', min: 100 }],
    },
    {
      id: 'escuelaPueblo',
      name: 'La escuela del pueblo',
      from: 'Ayuntamiento',
      pitch: 'Los críos del pueblo necesitan dónde jugar. Abrid una escuela de fútbol.',
      advance: 1000,
      bonus: 4000,
      fame: 2,
      requires: ['clubEnRegla'],
      objectives: [{ kind: 'students', min: 30 }],
    },
    {
      id: 'casaLlena',
      name: 'Casa llena',
      from: 'Ayuntamiento',
      pitch: 'Queremos ver el campo lleno un domingo sin que nadie se quede en la puerta.',
      advance: 2000,
      bonus: 5000,
      fame: 2,
      requires: ['campoDigno', 'sitioAficion'],
      objectives: [
        { kind: 'capacity', min: 600 },
        { kind: 'fullHouse', count: 1 },
      ],
    },
  ],
}
