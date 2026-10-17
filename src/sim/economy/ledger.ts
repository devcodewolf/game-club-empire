/**
 * Libro de cuentas: cada movimiento de dinero con su fecha, concepto, importe
 * y, si lo tiene, el lugar del mapa que lo generó (para los "+120 €" que
 * flotan sobre el edificio). Es la fuente de la pestaña Finanzas.
 */
import type { TileRect } from '../geometry'
import type { StaffRole, StaffRoleDef } from './staff'

/** Conceptos de movimientos. Los nombres en español los pone la interfaz. */
export type LedgerConcept =
  /** Obras nuevas: objetos, suelos, muros, puertas, cimientos, gradas. */
  | 'construction'
  /** Mejoras de nivel de un objeto, campo o grada. */
  | 'upgrade'
  /** Mover un campo con su estadio o un bloque. */
  | 'move'
  /** Lo que se recupera al demoler. */
  | 'demolish'
  /** Reembolso íntegro al deshacer la última obra. */
  | 'undo'
  /** Subvención municipal semanal (con la ayuda de arranque). */
  | 'subsidy'
  /** Cuotas mensuales de los socios. */
  | 'memberFees'
  /** Caja del bar. */
  | 'bar'
  /** Alquiler de los campos. */
  | 'pitchRental'
  /** Mantenimiento semanal de objetos (2 % de su valor). */
  | 'maintenanceObjects'
  /** Mantenimiento semanal de las zonas interiores. */
  | 'maintenanceInteriors'
  /** Mantenimiento semanal del césped de los campos. */
  | 'maintenanceTurf'
  /** Mantenimiento semanal de las gradas. */
  | 'maintenanceStands'
  /** Sueldos semanales del personal. */
  | 'wages'
  /** Reparaciones (césped y objetos averiados). */
  | 'repairs'
  /** Taquilla de los partidos en casa. */
  | 'tickets'
  /** Aparcamiento de pago en los partidos en casa. */
  | 'parking'
  /** Desplazamiento a los partidos fuera. */
  | 'travel'
  /** Multas de la federación (jugar sin vestuario visitante). */
  | 'fines'
  /** Subvenciones con objetivos: adelanto, bonus y devolución al cancelar. */
  | 'grants'

export interface LedgerEntry {
  /** Instante (minutos de juego). */
  readonly at: number
  readonly concept: LedgerConcept
  /** Positivo = ingreso; negativo = gasto. */
  readonly amount: number
  /** Zona del mapa que lo generó, si la hay. */
  readonly rect?: TileRect
}

/** Lo que el libro necesita del estado de la partida. */
export interface LedgerHolder {
  money: number
  readonly ledger: LedgerEntry[]
  readonly clock: { readonly time: number }
}

/** Datos de la economía (ver `src/content/economy.ts`). */
export interface EconomyContent {
  /** Dinero al empezar la partida. */
  readonly startMoney: number
  /** Parte del valor que se recupera al demoler. */
  readonly refund: {
    /** Objetos (con sus mejoras). */
    readonly objects: number
    /** Suelos, muros, puertas, gradas y campos. */
    readonly structures: number
  }
  /** Parte del valor que cuesta mover un campo con su estadio o un bloque (mover un objeto es gratis). */
  readonly moveRate: number
  /** División con la que empieza el club y socios iniciales. */
  readonly start: { readonly division: string; readonly members: number }
  /** Precios por división: entrada, cuota mensual de socio y subvención base semanal. */
  readonly divisions: Readonly<
    Record<string, { readonly entry: number; readonly memberFee: number; readonly subsidy: number }>
  >
  /** Ayuda de arranque del ayuntamiento: importe extra semanal por tramos de semanas. */
  readonly startupAid: readonly {
    readonly fromWeek: number
    readonly toWeek: number
    readonly amount: number
  }[]
  /** Bar: tipo de sala que cuenta y caja diaria si está completa. */
  readonly bar: { readonly roomType: string; readonly perDay: number }
  /** Alquiler de campos: € por día según formato y multiplicador por superficie. */
  readonly rental: {
    readonly perDay: Readonly<Record<number, number>>
    readonly surfaceMultiplier: Readonly<Record<string, number>>
  }
  /** Personal: sueldo y trabajo que cubre cada puesto. */
  readonly staff: Readonly<Record<StaffRole, StaffRoleDef>>
  /** Estado de los campos. */
  readonly pitch: {
    /** Estado con el que se construye un campo nuevo. */
    readonly startCondition: number
    /** Máximo por superficie. */
    readonly maxCondition: Readonly<Record<string, number>>
    /** Recuperación por noche con jardinería al 100 %. */
    readonly dailyRecovery: number
    /** Desgaste por día de lluvia, por superficie. */
    readonly rainDamage: Readonly<Record<string, number>>
    /** Desgaste por día de alquiler, por superficie. */
    readonly rentalDamage: Readonly<Record<string, number>>
    /** Desgaste por partido (Bloque E). */
    readonly matchDamage: number
    /** € por casilla para reparar el césped, por superficie. */
    readonly repairPerTile: Readonly<Record<string, number>>
    /** Días sin alquilar tras una reparación. */
    readonly repairRestDays: number
  }
  /** Averías de objetos. */
  readonly breakdown: {
    /** Probabilidad semanal de avería de cada objeto sin mantenimiento. */
    readonly weeklyChance: number
    /** Parte del valor del objeto que cuesta repararlo. */
    readonly repairRate: number
  }
  /** Mantenimiento semanal. */
  readonly maintenance: {
    /** Parte del valor de cada objeto. */
    readonly objectRate: number
    /** Parte del coste acumulado de cada grada. */
    readonly standRate: number
    /** € por casilla de zona interior. */
    readonly interiorPerTile: number
    /** € por casilla de campo según su superficie. */
    readonly turfPerTile: Readonly<Record<string, number>>
  }
}

/** Anota un movimiento y actualiza el saldo. Devuelve la entrada (o null si el importe es 0). */
export function record(
  state: LedgerHolder,
  concept: LedgerConcept,
  amount: number,
  rect?: TileRect,
): LedgerEntry | null {
  const rounded = Math.round(amount)
  if (rounded === 0) return null
  const entry: LedgerEntry = {
    at: state.clock.time,
    concept,
    amount: rounded,
    ...(rect ? { rect } : {}),
  }
  state.ledger.push(entry)
  state.money += rounded
  return entry
}
