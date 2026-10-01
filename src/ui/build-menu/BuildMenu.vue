<script setup lang="ts">
/**
 * Menú de construcción estilo Prison Architect: barra de categorías abajo y,
 * encima, el panel de la categoría abierta (crece hacia arriba).
 */
import { computed } from 'vue'
import { BUILD_CATEGORIES } from '@/content/buildMenu'
import CategoryBar from '@/ui/build-menu/CategoryBar.vue'
import CategoryPanel from '@/ui/build-menu/CategoryPanel.vue'
import { useBuildMenu } from '@/ui/composables/useBuildMenu'

const menu = useBuildMenu()

const openCategory = computed(
  () => BUILD_CATEGORIES.find((category) => category.id === menu.openCategoryId.value) ?? null,
)
</script>

<template>
  <div class="flex flex-col items-start gap-2">
    <Transition
      enter-active-class="motion-safe:transition motion-safe:duration-150 motion-safe:ease-out"
      enter-from-class="motion-safe:translate-y-2 motion-safe:opacity-0"
      leave-active-class="motion-safe:transition motion-safe:duration-100 motion-safe:ease-in"
      leave-to-class="motion-safe:translate-y-2 motion-safe:opacity-0"
    >
      <CategoryPanel
        v-if="openCategory"
        :key="openCategory.id"
        :category="openCategory"
        :tab-index="menu.activeTab(openCategory.id)"
        @close="menu.close()"
        @select-tab="(index) => menu.selectTab(openCategory?.id ?? '', index)"
      />
    </Transition>
    <CategoryBar :open-id="menu.openCategoryId.value" @toggle="menu.toggle" />
  </div>
</template>
