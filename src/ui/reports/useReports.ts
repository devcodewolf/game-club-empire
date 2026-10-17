/**
 * Estado del cuaderno de informes: abierto o cerrado y pestaña activa. Es
 * estado compartido de módulo para que el botón, la carpeta y el atajo
 * (Escape) vean lo mismo sin pasar props (igual que `useBuildMenu`).
 */
import { computed, readonly, ref } from 'vue'
import { REPORT_TABS } from '@/ui/reports/reportTabs'

const isOpen = ref(false)
const activeId = ref<string>(REPORT_TABS[0]?.id ?? '')

export function useReports() {
  const activeTab = computed(
    () => REPORT_TABS.find((tab) => tab.id === activeId.value && tab.unlocked()) ?? REPORT_TABS[0],
  )

  function open(): void {
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
  }

  /** Pulsar el botón con la carpeta abierta la cierra. */
  function toggle(): void {
    isOpen.value = !isOpen.value
  }

  function selectTab(id: string): void {
    const tab = REPORT_TABS.find((t) => t.id === id)
    if (tab?.unlocked()) activeId.value = id
  }

  return {
    isOpen: readonly(isOpen),
    activeId: readonly(activeId),
    activeTab,
    open,
    close,
    toggle,
    selectTab,
  }
}
