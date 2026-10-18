/**
 * Datos de patrocinios para el tablón y el informe: tratos en marcha, ofertas
 * e historial, con los objetivos ya compuestos y los días que quedan.
 */
import { computed } from 'vue'
import { objectiveStatus, type Objective, type ObjectivesProgress } from '@/sim/club/objectives'
import {
  businessOf,
  type ActiveSponsor,
  type Business,
  type SponsorOffer,
  type SponsorOutcome,
} from '@/sim/club/sponsors'
import { MINUTES_PER_DAY } from '@/sim/time/calendar'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import { objectiveProgressText, objectiveShortText, objectiveText } from './objectiveText'
import type { ObjectiveRow } from './useGrantsBoard'

/** Días enteros que faltan hasta un minuto del reloj (mínimo 0). */
function daysUntil(time: number, target: number): number {
  return Math.max(0, Math.ceil((target - time) / MINUTES_PER_DAY))
}

export interface ActiveSponsorView {
  readonly sponsor: ActiveSponsor
  readonly business: Business | undefined
  readonly name: string
  readonly rows: readonly ObjectiveRow[]
  readonly daysLeft: number
  readonly cancelCost: number
}

export interface SponsorOfferView {
  readonly offer: SponsorOffer
  readonly business: Business | undefined
  readonly name: string
  readonly rows: readonly ObjectiveRow[]
  readonly daysLeft: number
}

export interface SponsorHistoryView {
  readonly id: string
  readonly business: Business | undefined
  readonly name: string
  readonly outcome: SponsorOutcome
}

const HISTORY_SHOWN = 8

export function useSponsorsBoard() {
  const game = useGame()
  const version = useGameVersion()

  function rowsOf(
    id: string,
    objectives: readonly Objective[],
    progress: ObjectivesProgress | null,
  ): ObjectiveRow[] {
    const { state, content } = game
    return objectives.map((objective, i) => {
      const done = progress?.done[i] === true
      return {
        key: `${id}:${i}`,
        text: objectiveText(objective, content),
        short: objectiveShortText(objective, content),
        progress:
          done || !progress
            ? ''
            : objectiveProgressText(
                objective,
                objectiveStatus(state, content, objective, progress, i),
              ),
        done,
      }
    })
  }

  const active = computed<ActiveSponsorView[]>(() => {
    void version.value
    const { state, content } = game
    return state.club.sponsors.active.map((sponsor) => {
      const business = businessOf(content, sponsor.business)
      return {
        sponsor,
        business,
        name: business?.name ?? sponsor.business,
        rows: rowsOf(sponsor.id, sponsor.objectives, sponsor),
        daysLeft: daysUntil(state.clock.time, sponsor.deadline),
        cancelCost: Math.round(sponsor.advance * content.sponsors.cancelRate),
      }
    })
  })

  const offers = computed<SponsorOfferView[]>(() => {
    void version.value
    const { state, content } = game
    return state.club.sponsors.offers.map((offer) => {
      const business = businessOf(content, offer.business)
      return {
        offer,
        business,
        name: business?.name ?? offer.business,
        rows: rowsOf(offer.id, offer.objectives, null),
        daysLeft: daysUntil(state.clock.time, offer.expiresAt),
      }
    })
  })

  const history = computed<SponsorHistoryView[]>(() => {
    void version.value
    const { state, content } = game
    return state.club.sponsors.history
      .slice(-HISTORY_SHOWN)
      .reverse()
      .map((entry) => {
        const business = businessOf(content, entry.business)
        return {
          id: entry.id,
          business,
          name: business?.name ?? entry.business,
          outcome: entry.outcome,
        }
      })
  })

  const maxActive = computed(() => game.content.sponsors.maxActive)
  const money = computed(() => (void version.value, game.state.money))

  return { active, offers, history, maxActive, money }
}
