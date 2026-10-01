/**
 * Contador que sube con cada evento de la partida. La simulación no es
 * reactiva (markRaw), así que los `computed` que la lean deben depender de
 * este valor para recalcularse cuando algo cambia.
 */
import { onBeforeUnmount, ref, type Ref } from 'vue'
import { useGame } from '@/ui/composables/useGame'

export function useGameVersion(): Readonly<Ref<number>> {
  const game = useGame()
  const version = ref(0)
  const unsubscribe = game.subscribe(() => {
    version.value++
  })
  onBeforeUnmount(unsubscribe)
  return version
}
