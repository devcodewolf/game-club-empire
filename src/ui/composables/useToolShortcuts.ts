/**
 * Atajos de teclado de la herramienta activa: R gira, Escape suelta la herramienta o cierra el menú.
 * Se registran al montar el componente y se retiran al desmontarlo.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { useBuildMenu } from '@/ui/composables/useBuildMenu'
import { useSelectionStore } from '@/ui/stores/selectionStore'
import { useToolStore } from '@/ui/stores/toolStore'

/** Indica si el foco está en un campo de texto editable. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  )
}

export function useToolShortcuts(): void {
  const toolStore = useToolStore()
  const buildMenu = useBuildMenu()
  const selection = useSelectionStore()

  /** Escape: suelta la herramienta; si no hay, deselecciona la sala u objeto; si tampoco, cierra el menú. */
  function onEscape(): void {
    if (toolStore.tool.kind !== 'none') return toolStore.clear()
    if (selection.selection !== null) return selection.clear()
    buildMenu.close()
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (isEditableTarget(event.target)) return

    if (event.key === 'Escape') return onEscape()
    if (event.key.toLowerCase() === 'r') return toolStore.rotate()
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
}
