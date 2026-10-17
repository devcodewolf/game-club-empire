<script setup lang="ts">
/**
 * Botón "Informes" (abajo a la derecha): un dibujo de la carpeta de informes
 * con su etiqueta debajo, como los accesos de Prison Architect, en vez de un
 * cuadrado de plano de obra como los del menú de construcción.
 */
import { useReports } from '@/ui/reports/useReports'

const reports = useReports()
</script>

<template>
  <button
    type="button"
    class="reports-button group ml-auto flex cursor-pointer flex-col items-center gap-0.5 bg-transparent p-1 outline-none"
    :aria-pressed="reports.isOpen.value ? 'true' : 'false'"
    title="Informes"
    @click="reports.toggle()"
  >
    <svg
      viewBox="0 0 64 56"
      class="h-14 w-16 overflow-visible drop-shadow-[2px_3px_0_rgb(0_0_0/0.45)] motion-safe:transition-transform motion-safe:duration-150 group-hover:-translate-y-1 group-hover:-rotate-2 group-focus-visible:-translate-y-1"
      stroke="#2e2a26"
      stroke-width="1.6"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <!-- Marcapáginas por debajo -->
      <path d="M30 48h11v6h-11Z" fill="#3f78c4" />
      <path d="M43 48h11v6h-11Z" fill="#d2463b" />
      <!-- Carpeta -->
      <path
        d="M6 6h50a2 2 0 0 1 2 2v40a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        fill="#e6a23a"
      />
      <!-- Hoja de debajo y hoja con renglones -->
      <path d="M11 4.5h38v41H11Z" fill="#efebe2" transform="rotate(3 30 25)" />
      <path d="M10 3h38v42H10Z" fill="#fcfbf7" />
      <path d="M15 8h28v6H15Z" fill="#9fdcae" stroke-width="1.2" />
      <path d="M15 20h22M15 25h26M15 30h18M15 35h24" stroke="#9a948a" stroke-width="1.4" />
      <!-- Foto con clip, asomando por la derecha -->
      <g transform="rotate(8 52 26)">
        <path d="M45 17h14v17H45Z" fill="#f6f4ee" stroke-width="1.2" />
        <path d="M47 19h10v10H47Z" fill="#5c9a46" stroke="none" />
        <path d="M47 24h10" stroke="#fff" stroke-width="1" />
      </g>
      <!-- Posit -->
      <path d="M2 40l13-2 1.5 11-13 2Z" fill="#f7e27d" stroke-width="1.2" />
    </svg>
    <span
      class="font-hand text-[17px] leading-none text-white [text-shadow:-1px_-1px_0_#1c1a18,1px_-1px_0_#1c1a18,-1px_1px_0_#1c1a18,1px_1px_0_#1c1a18,2px_2px_0_#1c1a18] group-focus-visible:underline"
      >Informes</span
    >
  </button>
</template>
