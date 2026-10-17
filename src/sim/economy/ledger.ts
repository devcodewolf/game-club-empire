/**
 * Libro de cuentas: cada movimiento de dinero con su fecha, concepto, importe
 * y, si lo tiene, el lugar del mapa que lo generó (para los "+120 €" que
 * flotan sobre el edificio). Es la fuente de la pestaña Finanzas.
 */
import type { TileRect } from '../geometry'

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
