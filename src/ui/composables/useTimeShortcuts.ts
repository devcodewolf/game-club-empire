/**
 * Atajos de teclado del tiempo: Espacio pausa o reanuda; 1-4 eligen las
 * velocidades del contenido (×1, ×3, ×5, ×10).
 */
import { onBeforeUnmount, onMounted } from 'vue'
import type { Game } from '@/sim/game'
import { isEditableTarget } from '@/ui/composables/useToolShortcuts'
import { useTimeStore } from '@/ui/stores/timeStore'

export function useTimeShortcuts(game: Game): void {
  const store = useTimeStore()

  function onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (isEditableTarget(event.target)) return

    if (event.code === 'Space') {
      event.preventDefault() // sin esto, el espacio "pulsa" el botón con foco
      return store.togglePause()
    }
    const index = Number(event.key) - 1
    const speed = game.content.time.speeds[index]
    if (Number.isInteger(index) && speed !== undefined) store.setSpeed(speed)
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
}
