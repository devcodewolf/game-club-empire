<script setup lang="ts">
/**
 * Figurita de busto de un empleado para los informes: hombros y cabeza con
 * contorno oscuro y la ropa de su puesto (gorra y peto de jardinero, gorro y
 * delantal de limpieza, casco y chaleco de mantenimiento, chándal y silbato de
 * monitor). Hueca (`ghost`): silueta discontinua de un puesto sin cubrir.
 */
import { computed } from 'vue'
import type { StaffRole } from '@/sim/economy/staff'

const props = withDefaults(
  defineProps<{
    role: StaffRole
    /** Varía piel y pelo entre figuritas del mismo puesto. */
    variant?: number
    ghost?: boolean
  }>(),
  { variant: 0, ghost: false },
)

const SKIN = ['#f2cba6', '#d9a073', '#b07448', '#7a4b2c']
const HAIR = ['#3b2a20', '#6b4a2b', '#c99a4f', '#1f1b18', '#8a3b22']

const skin = computed(() => SKIN[props.variant % SKIN.length])
const hair = computed(() => HAIR[(props.variant * 3 + 1) % HAIR.length])
</script>

<template>
  <svg
    viewBox="0 0 32 36"
    class="block h-11 w-10 overflow-visible"
    aria-hidden="true"
    stroke="#2e2a26"
    stroke-width="1.4"
    stroke-linejoin="round"
  >
    <g v-if="ghost" fill="rgb(0 0 0 / 0.04)" stroke="#9b958a" stroke-dasharray="2.5 2">
      <path d="M2.5 35.5C2.5 27 8.5 23 16 23s13.5 4 13.5 12.5Z" />
      <circle cx="16" cy="13.5" r="7.5" />
    </g>

    <template v-else-if="role === 'gardener'">
      <path d="M2.5 35.5C2.5 27 8.5 23 16 23s13.5 4 13.5 12.5Z" fill="#ece4cf" />
      <!-- Peto con tirantes -->
      <path d="M9 35.5V27.5h14v8Z" fill="#6f9a4a" />
      <path d="M9.5 27.5 7 24.5M22.5 27.5 25 24.5" fill="none" />
      <circle cx="16" cy="13.5" r="7.5" :fill="skin" />
      <!-- Gorra con visera -->
      <path d="M8.6 12.4a7.4 7.4 0 0 1 14.8 0Z" fill="#4f8a3c" />
      <path d="M14 12.4h11.5a1.4 1.4 0 0 1 0 2.4H15Z" fill="#3f7330" />
    </template>

    <template v-else-if="role === 'cleaner'">
      <path d="M2.5 35.5C2.5 27 8.5 23 16 23s13.5 4 13.5 12.5Z" fill="#7fb3d5" />
      <!-- Delantal -->
      <path d="M11 35.5V27a5 5 0 0 1 10 0v8.5Z" fill="#f6f3ea" />
      <circle cx="16" cy="13.5" r="7.5" :fill="skin" />
      <!-- Gorro de tela -->
      <path
        d="M8.5 13a7.5 7.5 0 0 1 15 0c-2-1.6-4.6-2.2-7.5-2.2S10.5 11.4 8.5 13Z"
        fill="#5d93ba"
      />
    </template>

    <template v-else-if="role === 'maintenance'">
      <path d="M2.5 35.5C2.5 27 8.5 23 16 23s13.5 4 13.5 12.5Z" fill="#4a5560" />
      <!-- Chaleco reflectante abierto con bandas plateadas -->
      <path
        d="M4.5 35.5C4.5 29 7.5 25.5 12 24l2.5 11.5ZM27.5 35.5C27.5 29 24.5 25.5 20 24l-2.5 11.5Z"
        fill="#d9e24b"
      />
      <path d="M6 31.5h7.4M18.6 31.5H26" stroke="#c9cfd4" stroke-width="1.6" />
      <circle cx="16" cy="13.5" r="7.5" :fill="skin" />
      <!-- Casco de obra -->
      <path d="M8.3 12.2a7.7 7.7 0 0 1 15.4 0Z" fill="#f2c53d" />
      <path d="M6.5 12.2h19v2h-19Z" fill="#e0ad22" />
    </template>

    <template v-else>
      <path d="M2.5 35.5C2.5 27 8.5 23 16 23s13.5 4 13.5 12.5Z" fill="#c8473d" />
      <!-- Rayas del chándal y silbato colgado -->
      <path d="M6.5 27 9 35.5M25.5 27 23 35.5" stroke="#f6f3ea" stroke-width="1.8" />
      <path d="M13 23.5 16 29l3-5.5" fill="none" stroke-width="1" />
      <circle cx="16" cy="30" r="1.6" fill="#c9cfd4" stroke-width="1" />
      <circle cx="16" cy="13.5" r="7.5" :fill="skin" />
      <!-- Pelo corto -->
      <path
        d="M8.6 12.8a7.4 7.4 0 0 1 14.8 0c-1.6-2.4-4.2-3.4-7.4-3.4s-5.8 1-7.4 3.4Z"
        :fill="hair"
      />
    </template>
  </svg>
</template>
