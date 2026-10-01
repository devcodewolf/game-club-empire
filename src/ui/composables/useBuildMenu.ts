/**
 * Estado del menú de construcción: categoría abierta y pestaña activa de cada
 * categoría (se recuerda al reabrirla). Es estado compartido de módulo para
 * que el menú y los atajos (Escape) vean lo mismo sin pasar props ni provide.
 * Cerrar el menú NO suelta la herramienta activa.
 */
import { computed, readonly, ref } from 'vue'

const openCategoryId = ref<string | null>(null)
const activeTabByCategory = ref<Record<string, number>>({})

export function useBuildMenu() {
  const isOpen = computed(() => openCategoryId.value !== null)

  function open(categoryId: string): void {
    openCategoryId.value = categoryId
  }

  function close(): void {
    openCategoryId.value = null
  }

  /** Pulsar la categoría abierta la cierra; si no, abre esa. */
  function toggle(categoryId: string): void {
    if (openCategoryId.value === categoryId) return close()
    open(categoryId)
  }

  function activeTab(categoryId: string): number {
    return activeTabByCategory.value[categoryId] ?? 0
  }

  function selectTab(categoryId: string, index: number): void {
    activeTabByCategory.value = { ...activeTabByCategory.value, [categoryId]: index }
  }

  return {
    openCategoryId: readonly(openCategoryId),
    isOpen,
    open,
    close,
    toggle,
    activeTab,
    selectTab,
  }
}
