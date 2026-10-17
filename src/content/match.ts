/**
 * Datos del partido semanal, la fama y la afición (Fase 2, Bloque E; ver
 * docs/prompts/FASE2-ESPECIFICACION.md §4.6 y §5). Todo se ajusta jugando.
 */
import type { MatchContent } from '@/sim/club/match'
import { ENTRANCE_PROPS, PARKING } from './entrance'

/** Plazas del aparcamiento de visitantes: las de sus filas de aparcamiento. */
const PARKING_SPACES = ENTRANCE_PROPS.reduce(
  (total, prop) =>
    prop.kind === 'parkingBays' ? total + Math.floor(prop.rect.width / prop.stallWidth) : total,
  0,
)

export const MATCH: MatchContent = {
  // Primer partido: domingo 5 de septiembre (dos semanas para preparar el club)
  firstMatch: { month: 9, day: 5 },
  offSeasonMonths: [6, 7, 8],
  // Equipos de pueblos inventados
  rivals: [
    'C.D. Villarrana',
    'U.D. Fuenteguinda',
    'Atlético Torremiel',
    'Deportivo Navaloca',
    'C.F. Aldeapiedra',
    'S.D. Valdecardos',
    'Peñaflorida C.F.',
    'Racing Castrogallo',
    'U.D. San Teodulfo',
    'C.D. Robledo Chico',
    'Unión Mazaruela',
    'Club Quintanagrande',
  ],
  // Un vestuario básico (todo de nivel 1) tiene calidad 2,5; la caseta vieja, 1
  changingRoom: { roomType: 'changingRoom', shed: 'oldShed', qualityScale: 2.5 },
  strength: {
    base: 40,
    home: 5,
    pitchDivisor: 10,
    facilitiesMax: 30,
    changingRoomFactor: 1.5,
    surface: { dirt: 0, artificialTurf: 5, naturalGrass: 8, hybridGrass: 10 },
    rooms: { gym: 3, physio: 3 },
    rival: { base: 45, spread: 10 },
  },
  goals: { base: 1.3, exponent: 1.5, max: 9 },
  attendance: { memberShare: 0.9, publicShare: 0.5, rainFactor: 0.85, standing: 100 },
  matchday: {
    barPerSpectator: 1.5,
    parking: { spaces: PARKING_SPACES, fee: 2, perCar: 4, rect: PARKING },
    travelCost: 100,
    noVisitorRoom: { fine: 200, fame: -1 },
  },
  fame: {
    start: 5,
    result: { win: 2, draw: 0.5, loss: -1 },
    firstRoom: 1,
    drift: 0.2,
    divisionBase: {
      comarcal: 5,
      regional: 15,
      autonomica: 25,
      nacionalB: 40,
      nacionalA: 55,
      elite: 70,
    },
  },
  fans: {
    start: 300,
    result: { win: 0.03, draw: 0.01, loss: -0.01 },
    ceilingBase: 1000,
    ceilingPerFame: 100,
    satisfactionPivot: 60,
    satisfactionDivisor: 2000,
  },
  satisfaction: {
    start: 70,
    base: 70,
    cleaning: 30,
    bar: 10,
    parking: 5,
    coveredStand: 10,
    // Tribuna cubierta (4.º nivel de grada) en adelante
    coveredStandTier: 3,
    crowdOut: 15,
    rainUncovered: 10,
    // Un vestuario visitante cuidado (calidad 5 o más) también se agradece
    goodVisitorQuality: 5,
    goodVisitorRoom: 5,
  },
  members: { targetShare: 0.25, rate: 0.1 },
  benches: { cost: 300, strength: 2 },
}
