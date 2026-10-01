<script setup lang="ts">
/** Icono de línea del registro `ICON_COMPONENTS`, decorativo (oculto a lectores). */
import type { IconName } from '@/content/icons'
import { ICON_COMPONENTS } from '@/ui/icons'

withDefaults(defineProps<{ name: IconName; size?: number; stroke?: number }>(), {
  size: 24,
  stroke: 2,
})
</script>

<template>
  <component :is="ICON_COMPONENTS[name]" :size="size" :stroke="String(stroke)" aria-hidden="true" />
</template>
