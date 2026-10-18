<script setup lang="ts">
/**
 * Logotipo de un negocio del pueblo: un sello redondo del color del negocio,
 * con contorno oscuro fino y el dibujo (pan, llave, botella…) en su color de
 * realce. Plano y simpático, legible a 28-40 px.
 */
import { computed } from 'vue'
import type { BusinessLogo } from '@/sim/club/sponsors'

const props = withDefaults(defineProps<{ logo: BusinessLogo; size?: number }>(), { size: 32 })

const INK = '#2e2a26'
const hex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`
const color = computed(() => hex(props.logo.color))
const accent = computed(() => hex(props.logo.accent))
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 40 40"
    class="shrink-0"
    stroke-linejoin="round"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <!-- Sombra plana y sello -->
    <circle cx="21" cy="21.5" r="18" fill="rgb(0 0 0 / 0.25)" />
    <circle cx="20" cy="20" r="18" :fill="color" :stroke="INK" stroke-width="2" />

    <g :fill="accent" :stroke="INK" stroke-width="1.6">
      <!-- Barra de pan -->
      <template v-if="logo.shape === 'bread'">
        <ellipse cx="20" cy="21" rx="12" ry="7.5" />
        <path d="M13.5 17.5l3 6M19 16.5l3 7M24.5 17.5l3 6" fill="none" />
      </template>

      <!-- Llave inglesa -->
      <g v-else-if="logo.shape === 'wrench'" transform="rotate(45 20 20)">
        <rect x="17.8" y="15" width="4.4" height="16" rx="2.2" />
        <circle cx="20" cy="12.5" r="5.8" />
        <rect x="18.4" y="5.5" width="3.2" height="7" :fill="color" stroke="none" />
      </g>

      <!-- Botella de sidra -->
      <template v-else-if="logo.shape === 'bottle'">
        <rect x="17.2" y="9" width="5.6" height="8" />
        <rect x="13.5" y="15" width="13" height="19" rx="4.5" />
        <rect x="16.6" y="6.5" width="6.8" height="3.6" rx="1" />
        <rect x="13.5" y="21" width="13" height="7" :fill="color" />
      </template>

      <!-- Martillo -->
      <g v-else-if="logo.shape === 'hammer'" transform="rotate(-45 20 20)">
        <rect x="18.4" y="14" width="3.6" height="18" rx="1.5" />
        <rect x="11" y="8.5" width="18" height="7.5" rx="1.5" />
      </g>

      <!-- Manzana -->
      <template v-else-if="logo.shape === 'apple'">
        <path
          d="M20 14c-3-2.5-10-1.5-10 6 0 6 4 11 7 11 1.5 0 2-0.8 3-0.8s1.5 0.8 3 0.8c3 0 7-5 7-11 0-7.5-7-8.5-10-6Z"
        />
        <path d="M20 14c0-3 0.5-4.5 2-6" fill="none" />
        <path d="M22 11c1-3 4-4 6-3.5-0.5 3-3 4.5-6 3.5Z" fill="#6aa84f" />
      </template>

      <!-- Taza humeante -->
      <template v-else-if="logo.shape === 'cup'">
        <path d="M27 18h2a4 4 0 0 1 0 8h-3" fill="none" stroke-width="3.200" />
        <path d="M10.500 17h17v6a8.500 8.500 0 0 1-17 0Z" />
        <path
          d="M15 14c-1.500-2 1.500-3 0-5M20 14c-1.500-2 1.500-3 0-5M25 14c-1.500-2 1.500-3 0-5"
          fill="none"
          :stroke="accent"
          stroke-width="1.800"
        />
      </template>

      <!-- Pez -->
      <template v-else-if="logo.shape === 'fish'">
        <path d="M26 20l8-7v14Z" />
        <ellipse cx="18" cy="20" rx="11" ry="7" />
        <circle cx="12.500" cy="18.500" r="1.300" :fill="INK" stroke="none" />
        <path d="M20 15c1.500 3 1.500 7 0 10" fill="none" />
      </template>

      <!-- Tijeras -->
      <template v-else>
        <path d="M13 8l14 18M27 8L13 26" fill="none" :stroke="INK" stroke-width="5" />
        <circle cx="13" cy="30" r="4" fill="none" :stroke="INK" stroke-width="4.500" />
        <circle cx="27" cy="30" r="4" fill="none" :stroke="INK" stroke-width="4.500" />
        <path d="M13 8l14 18M27 8L13 26" fill="none" :stroke="accent" stroke-width="2.200" />
        <circle cx="13" cy="30" r="4" fill="none" :stroke="accent" stroke-width="2" />
        <circle cx="27" cy="30" r="4" fill="none" :stroke="accent" stroke-width="2" />
      </template>
    </g>
  </svg>
</template>
