<script setup lang="ts">
/** Barra de categorías (fila de botones de plano de obra) sobre franja oscura. */
import { BUILD_CATEGORIES } from '@/content/buildMenu'
import BlueprintButton from '@/ui/components/BlueprintButton.vue'

defineProps<{ openId: string | null }>()
defineEmits<{ toggle: [categoryId: string] }>()
</script>

<template>
  <nav
    class="flex items-start gap-1.5 rounded-md bg-[rgba(20,22,25,0.65)] p-1.5"
    aria-label="Categorías de construcción"
  >
    <BlueprintButton
      v-for="category in BUILD_CATEGORIES"
      :key="category.id"
      :label="category.label"
      :icon="category.icon"
      :color="category.color"
      :active="openId === category.id"
      @select="$emit('toggle', category.id)"
    />
  </nav>
</template>
