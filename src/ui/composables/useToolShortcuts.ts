/**
 * Atajos de teclado de la herramienta activa: R gira, Escape la suelta.
 * Se registran al montar el componente y se retiran al desmontarlo.
 */
import { onBeforeUnmount, onMounted } from 'vue'
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

  function onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (isEditableTarget(event.target)) return

    if (event.key === 'Escape') return toolStore.clear()
    if (event.key.toLowerCase() === 'r') return toolStore.rotate()
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
}
