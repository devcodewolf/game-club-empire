<script setup lang="ts">
import { BLUEPRINT_TILE } from './blueprint'
/**
 * Botón cuadrado estilo "plano de obra": icono de líneas blancas sobre fondo
 * de rejilla y etiqueta con contorno oscuro debajo. El color depende de la
 * categoría. Bloqueado: oscuro, sin rejilla y con candado.
 */
import { computed } from 'vue'
import type { MenuColor } from '@/content/buildMenu'
import type { IconName } from '@/content/icons'
import AppIcon from '@/ui/components/AppIcon.vue'

const props = withDefaults(
  defineProps<{
    label: string
    icon?: IconName
    color: MenuColor
    active?: boolean
    disabled?: boolean
    /** Bloqueado: no emite `select`, aspecto apagado y candado. */
    locked?: boolean
    /** Texto pequeño dentro del cuadrado, abajo (p. ej. aforo o fase). */
    badge?: string
    /** Color 0xRRGGBB: sustituye al icono por un cuadrado con juntas (suelos). */
    swatch?: number
    /** Lado del cuadrado en px. */
    tileSize?: number
    /** Texto del `title` (tooltip nativo). */
    title?: string
  }>(),
  {
    tileSize: BLUEPRINT_TILE,
    icon: undefined,
    badge: undefined,
    swatch: undefined,
    title: undefined,
  },
)

const emit = defineEmits<{ select: [] }>()

const isInert = computed(() => props.disabled || props.locked)

const swatchColor = computed(() =>
  props.swatch === undefined ? undefined : `#${props.swatch.toString(16).padStart(6, '0')}`,
)

function onClick(): void {
  if (isInert.value) return
  emit('select')
}
</script>

<template>
  <button
    type="button"
    class="blueprint group flex flex-col items-center gap-1 rounded-md bg-transparent p-0 text-white outline-none motion-safe:transition-transform motion-safe:duration-150"
    :class="[
      `blueprint--${color}`,
      active ? '-translate-y-0.5' : '',
      isInert ? 'cursor-not-allowed' : 'cursor-pointer',
    ]"
    :style="{ width: `${tileSize + 8}px` }"
    :aria-pressed="active ? 'true' : 'false'"
    :aria-disabled="locked ? 'true' : undefined"
    :disabled="disabled"
    :title="title ?? label"
    @click="onClick"
  >
    <span
      class="blueprint__tile relative flex items-center justify-center rounded-md border-2 motion-safe:transition-[filter,box-shadow] motion-safe:duration-150"
      :class="{
        'blueprint__tile--active': active,
        'blueprint__tile--locked': isInert,
      }"
      :style="{ width: `${tileSize}px`, height: `${tileSize}px` }"
      aria-hidden="true"
    >
      <span
        v-if="swatchColor"
        class="blueprint__swatch"
        :style="{ backgroundColor: swatchColor }"
      />
      <AppIcon v-else-if="icon" :name="icon" :size="Math.round(tileSize * 0.5)" :stroke="1.75" />
      <AppIcon v-if="locked" name="lock" :size="14" class="absolute top-1 right-1" />
      <span v-if="badge" class="blueprint__badge absolute inset-x-0 bottom-0.5 text-center">
        {{ badge }}
      </span>
    </span>
    <span
      class="blueprint__label line-clamp-2 w-full text-center text-[11px] leading-tight font-bold"
      :class="{ 'blueprint__label--locked': isInert }"
    >
      {{ label }}
    </span>
  </button>
</template>

<style scoped>
/* Colores por categoría, expuestos como variables para el resto de reglas. */
.blueprint--blue {
  --bp-bg: #2f62a8;
  --bp-border: #22477a;
}
.blueprint--green {
  --bp-bg: #3f8f3a;
  --bp-border: #2b6328;
}
.blueprint--yellow {
  --bp-bg: #c9a227;
  --bp-border: #8f7219;
}
.blueprint--orange {
  --bp-bg: #c46a2a;
  --bp-border: #8c4a1c;
}
.blueprint--red {
  --bp-bg: #b0372d;
  --bp-border: #7c241d;
}

/* Rejilla de plano (líneas claras al 25 %) y marco interior más claro. */
.blueprint__tile {
  background-color: var(--bp-bg);
  background-image:
    linear-gradient(rgb(255 255 255 / 0.25) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.25) 1px, transparent 1px);
  background-size: 8px 8px;
  border-color: var(--bp-border);
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.3);
}

/* Cuadrado de suelo con juntas sutiles (líneas oscuras al 10 %). */
.blueprint__swatch {
  position: absolute;
  inset: 6px;
  border-radius: 2px;
  border: 2px solid #1d1a17;
  background-image:
    linear-gradient(rgb(0 0 0 / 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgb(0 0 0 / 0.1) 1px, transparent 1px);
  background-size: 8px 8px;
}

.blueprint:hover:not(:disabled) .blueprint__tile:not(.blueprint__tile--locked) {
  filter: brightness(1.15);
}

.blueprint:focus-visible .blueprint__tile {
  box-shadow:
    inset 0 0 0 2px rgb(255 255 255 / 0.3),
    0 0 0 3px #fff;
}

/* Activo: anillo ámbar de 3 px. */
.blueprint__tile--active,
.blueprint:focus-visible .blueprint__tile--active {
  box-shadow:
    inset 0 0 0 2px rgb(255 255 255 / 0.3),
    0 0 0 3px #f2c46b;
}

/* Bloqueado: gris oscuro, sin rejilla, icono apagado. */
.blueprint__tile--locked,
.blueprint:focus-visible .blueprint__tile--locked {
  background-color: #2b2d30;
  background-image: none;
  border-color: #1f2124;
  box-shadow: none;
  color: #6f7378;
}
.blueprint:focus-visible .blueprint__tile--locked {
  box-shadow: 0 0 0 3px #fff;
}

.blueprint__badge {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 1px 0 #1d1a17;
}

/* Etiqueta con contorno oscuro para leerse sobre cualquier fondo. */
.blueprint__label {
  color: #fff;
  text-shadow:
    -1px -1px 0 #1d1a17,
    1px -1px 0 #1d1a17,
    -1px 1px 0 #1d1a17,
    1px 1px 0 #1d1a17,
    0 2px 0 #1d1a17;
}
.blueprint__label--locked {
  color: #8a8a8a;
}
</style>
