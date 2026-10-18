/**
 * Texto de los objetivos del tablón, compuesto a partir de sus datos.
 * Los textos viven como datos por `kind`; los nombres de salas, puestos y
 * banquillos salen del contenido del juego.
 */
import type { SimContent } from '@/sim/content'
import type { Objective, ObjectiveStatus } from '@/sim/club/objectives'
import { formatNumber } from '@/render/core/formatNumber'

type TextFn<K extends Objective['kind']> = (
  objective: Extract<Objective, { kind: K }>,
  content: SimContent,
) => string

type Texts = { [K in Objective['kind']]: TextFn<K> }

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1)

const TEXTS: Texts = {
  room: (o, content) => {
    const name = content.rooms[o.roomType]?.name ?? o.roomType
    const count = o.count ?? 1
    return count > 1 ? `${count} salas completas: ${name}` : `Sala completa: ${name}`
  },
  staff: (o, content) => {
    const name = lower(content.economy.staff[o.role]?.name ?? o.role)
    return o.min > 1 ? `Contratar ${o.min} × ${name}` : `Contratar 1 ${name}`
  },
  members: (o) => `Llegar a ${formatNumber(o.min)} socios`,
  fans: (o) => `Afición de ${formatNumber(o.min)} personas`,
  fame: (o) => `Fama ${formatNumber(o.min)}`,
  capacity: (o) => `Aforo de ${formatNumber(o.min)} espectadores`,
  pitchCondition: (o) =>
    `Estado del campo de ${o.min} o más durante ${o.days} ${o.days === 1 ? 'día' : 'días'}`,
  wins: (o) => (o.count === 1 ? 'Ganar 1 partido' : `Ganar ${o.count} partidos`),
  fullHouse: (o) =>
    o.count === 1
      ? 'Un partido en casa sin gente fuera'
      : `${o.count} partidos en casa sin gente fuera`,
  students: (o) => `${formatNumber(o.min)} alumnos en la escuela`,
  benches: (o, content) =>
    `Banquillos: ${content.match.benches[o.tier]?.name ?? `nivel ${o.tier + 1}`}`,
  changingRoomQuality: (o) => `Vestuario local de calidad ${formatNumber(o.min)} o más`,
  billboards: (o) =>
    o.min === 1
      ? '1 valla publicitaria con anunciante'
      : `${o.min} vallas publicitarias con anunciante`,
}

/** Textos cortos para el tablón, donde cabe poco ("Campo a 55+ · 7 días"). */
const SHORT_TEXTS: Texts = {
  room: (o, content) => {
    const name = content.rooms[o.roomType]?.name ?? o.roomType
    const count = o.count ?? 1
    return count > 1 ? `${count} × ${name}` : name
  },
  staff: (o, content) => `${o.min} × ${lower(content.economy.staff[o.role]?.name ?? o.role)}`,
  members: (o) => `${formatNumber(o.min)} socios`,
  fans: (o) => `${formatNumber(o.min)} de afición`,
  fame: (o) => `Fama ${formatNumber(o.min)}`,
  capacity: (o) => `Aforo ${formatNumber(o.min)}`,
  pitchCondition: (o) => `Campo a ${o.min}+ · ${o.days} ${o.days === 1 ? 'día' : 'días'}`,
  wins: (o) => (o.count === 1 ? 'Ganar 1 partido' : `Ganar ${o.count}`),
  fullHouse: (o) => (o.count === 1 ? 'Casa llena' : `${o.count} × casa llena`),
  students: (o) => `${formatNumber(o.min)} alumnos`,
  benches: (o, content) => content.match.benches[o.tier]?.name ?? `Banquillos ${o.tier + 1}`,
  changingRoomQuality: (o) => `Vestuario de calidad ${formatNumber(o.min)}`,
  billboards: (o) => (o.min === 1 ? '1 valla ocupada' : `${o.min} vallas ocupadas`),
}

/** Texto corto de un objetivo para el tablón ("100 socios"). */
export function objectiveShortText(objective: Objective, content: SimContent): string {
  const fn = SHORT_TEXTS[objective.kind] as (o: Objective, c: SimContent) => string
  return fn(objective, content)
}

/** Texto de un objetivo ("Llegar a 100 socios"). */
export function objectiveText(objective: Objective, content: SimContent): string {
  const fn = TEXTS[objective.kind] as (o: Objective, c: SimContent) => string
  return fn(objective, content)
}

/** Avance corto ("1/2", "3/7 días", "62/100"). */
export function objectiveProgressText(objective: Objective, status: ObjectiveStatus): string {
  const current = Math.min(status.current, status.target)
  if (objective.kind === 'pitchCondition') {
    return `${current}/${status.target} días`
  }
  return `${formatNumber(current)}/${formatNumber(status.target)}`
}
