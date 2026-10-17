<script setup lang="ts">
/**
 * Fila de fichas sueltas arriba en el centro (como las casillas de Prison
 * Architect): cada dato en su propia ficha pequeña de papel. De momento, el
 * clima y la fecha; en los Bloques B y E se añaden dinero, socios, afición y fama.
 */
import { formatNumber } from '@/render/core/formatNumber'
import { gsap } from 'gsap'
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import AppIcon from '@/ui/components/AppIcon.vue'
import { useGame } from '@/ui/composables/useGame'
import { useGameVersion } from '@/ui/composables/useGameVersion'
import { formatSignedEuros } from '@/ui/composables/formatMoney'
import { useAccountsStore } from '@/ui/stores/accountsStore'
import { useTimeStore } from '@/ui/stores/timeStore'
import { formatDay, formatYear } from '@/ui/time/formatTime'

const time = useTimeStore()
const accounts = useAccountsStore()
const raining = computed(() => time.weather === 'rain')
const weatherLabel = computed(() => (raining.value ? 'Lluvia' : 'Despejado'))

const game = useGame()
const version = useGameVersion()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const tweens: gsap.core.Tween[] = []

/** Cifra mostrada: cuenta hacia el valor real en ~0,6 s (salta con movimiento reducido). */
function useCountUp(source: () => number): Ref<number> {
  const shown = ref(source())
  const counter = { value: shown.value }
  let tween: gsap.core.Tween | null = null
  watch(source, (target) => {
    tween?.kill()
    if (reduced) {
      shown.value = counter.value = target
      return
    }
    tween = gsap.to(counter, {
      value: target,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        shown.value = counter.value
      },
    })
    tweens.push(tween)
  })
  return shown
}

const money = computed(() => (version.value, game.state.money))
const members = computed(() => (version.value, game.state.club.members))
const fans = computed(() => (version.value, game.state.club.fans))
const fame = computed(() => (version.value, game.state.club.fame))

const shown = useCountUp(() => money.value)
const shownMembers = useCountUp(() => members.value)
const shownFans = useCountUp(() => fans.value)
const shownFame = useCountUp(() => fame.value)
onBeforeUnmount(() => tweens.forEach((tween) => tween.kill()))

const moneyText = computed(() => `${formatNumber(shown.value)} €`)
const membersText = computed(() => formatNumber(Math.round(shownMembers.value)))
const fansText = computed(() => formatNumber(Math.round(shownFans.value)))
/** Un decimal solo si la fama real lo tiene (también mientras cuenta). */
const fameText = computed(() => {
  const hasDecimal = Math.round(fame.value * 10) % 10 !== 0
  return hasDecimal
    ? (Math.round(shownFame.value * 10) / 10).toFixed(1).replace('.', ',')
    : String(Math.round(shownFame.value))
})

/** Estilo común de cada ficha. */
const chip =
  'pointer-events-auto flex h-7 items-center gap-1.5 rounded-sm border-2 border-ink bg-paper px-2 text-ink shadow-[2px_2px_0_rgb(0_0_0/0.35)]'
</script>

<template>
  <div class="flex items-start gap-2" role="group" aria-label="Datos del club">
    <div :class="chip" title="Saldo del club">
      <span role="img" aria-label="Saldo" class="text-ink-blue">
        <AppIcon name="coin-euro" :size="16" :stroke="2.25" />
      </span>
      <span
        class="font-data text-xs font-bold tabular-nums"
        :class="money < 0 ? 'text-red-700' : ''"
        >{{ moneyText }}</span
      >
      <span
        v-if="accounts.lastReport"
        class="font-data text-[10px] font-bold tabular-nums"
        :class="accounts.lastReport.net < 0 ? 'text-red-700' : 'text-green-700'"
        title="Neto de la última semana cerrada"
        >{{ formatSignedEuros(accounts.lastReport.net) }}</span
      >
    </div>
    <div :class="chip" title="Socios: pagan cuota cada mes y entran gratis">
      <span role="img" aria-label="Socios" class="text-ink-blue">
        <AppIcon name="ticket" :size="16" :stroke="2.25" />
      </span>
      <span class="font-data text-xs font-bold tabular-nums">{{ membersText }}</span>
    </div>
    <div :class="chip" title="Afición: gente del pueblo que sigue al club">
      <span role="img" aria-label="Afición" class="text-ink-blue">
        <AppIcon name="users" :size="16" :stroke="2.25" />
      </span>
      <span class="font-data text-xs font-bold tabular-nums">{{ fansText }}</span>
    </div>
    <div :class="chip" title="Fama: reputación del club (0-100)">
      <span role="img" aria-label="Fama" class="text-amber-600">★</span>
      <span class="font-data text-xs font-bold tabular-nums">{{ fameText }}</span>
    </div>
    <div
      :class="chip"
      :title="`${weatherLabel} · ${formatDay(time.time)}, ${formatYear(time.time)}`"
    >
      <span
        role="img"
        :aria-label="weatherLabel"
        :class="raining ? 'text-ink-blue' : 'text-amber-600'"
      >
        <AppIcon :name="raining ? 'cloud-rain' : 'sun'" :size="16" :stroke="2.25" />
      </span>
      <span class="font-data text-xs font-bold tabular-nums">{{ formatYear(time.time) }}</span>
    </div>
  </div>
</template>
