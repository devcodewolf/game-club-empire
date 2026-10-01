/**
 * Avisos breves para el jugador ("Ampliación no disponible todavía").
 * Cada aviso se cierra solo tras unos segundos; repetir el mismo texto no
 * apila duplicados, solo reinicia su temporizador.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notice {
  readonly id: number
  readonly icon: string
  readonly text: string
}

const DURATION_MS = 3500

export const useNoticeStore = defineStore('notice', () => {
  const notices = ref<Notice[]>([])
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  let nextId = 1

  function dismiss(id: number): void {
    notices.value = notices.value.filter((notice) => notice.id !== id)
    clearTimeout(timers.get(id))
    timers.delete(id)
  }

  function show(icon: string, text: string): void {
    const existing = notices.value.find((notice) => notice.text === text)
    const id = existing?.id ?? nextId++
    if (!existing) notices.value = [...notices.value, { id, icon, text }]

    clearTimeout(timers.get(id))
    timers.set(
      id,
      setTimeout(() => dismiss(id), DURATION_MS),
    )
  }

  return { notices, show, dismiss }
})
