<script setup lang="ts">
/**
 * Botón cuadrado estilo "plano de obra": icono sobre fondo de rejilla y
 * etiqueta con contorno oscuro debajo. El color depende de la categoría.
 */
export type BlueprintCategory = 'build' | 'land' | 'danger'

const props = defineProps<{
  label: string
  /** Emoji provisional hasta tener iconos propios. */
  icon: string
  category: BlueprintCategory
  active?: boolean
  disabled?: boolean
  /** Texto del `title` (tooltip nativo). */
  hint?: string
}>()

const emit = defineEmits<{ select: [] }>()

function onClick(): void {
  if (props.disabled) return
  emit('select')
}
</script>

<template>
  <button
    type="button"
    class="blueprint group flex w-[72px] flex-col items-center gap-1 rounded-md bg-transparent p-0 text-white outline-none motion-safe:transition-transform motion-safe:duration-150"
    :class="[
      `blueprint--${category}`,
      active ? '-translate-y-1' : '',
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    ]"
    :aria-pressed="active ? 'true' : 'false'"
    :disabled="disabled"
    :title="hint"
    @click="onClick"
  >
    <span
      class="blueprint__tile flex h-14 w-14 items-center justify-center rounded-md border-2 text-2xl motion-safe:transition-[filter,box-shadow] motion-safe:duration-150"
      :class="{ 'blueprint__tile--active': active, 'blueprint__tile--disabled': disabled }"
      aria-hidden="true"
    >
      {{ icon }}
    </span>
    <span
      class="blueprint__label line-clamp-2 w-full text-center text-[11px] leading-tight font-bold"
      :class="{ 'blueprint__label--disabled': disabled }"
    >
      {{ label }}
    </span>
  </button>
</template>

<style scoped>
/* Colores por categoría, expuestos como variables para el resto de reglas. */
.blueprint--build {
  --bp-bg: #3f8f3a;
  --bp-border: #2b6328;
}
.blueprint--land {
  --bp-bg: #2f62a8;
  --bp-border: #22477a;
}
.blueprint--danger {
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

.blueprint:hover:not(:disabled) .blueprint__tile {
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

/* Bloqueado: gris oscuro, sin rejilla. */
.blueprint__tile--disabled {
  background-color: #3a3a3a;
  background-image: none;
  border-color: #2a2a2a;
  box-shadow: none;
  opacity: 0.8;
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
.blueprint__label--disabled {
  color: #8a8a8a;
}
</style>
