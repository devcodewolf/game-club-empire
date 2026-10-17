/**
 * Estado de UI del tiempo: velocidad, pausa y "próximo evento", más una copia
 * reactiva del instante y el clima para el HUD (la simulación no es reactiva;
 * el bucle de juego la actualiza cada fotograma).
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Weather } from '@/sim/time/clock'

export const useTimeStore = defineStore('time', () => {
  /** Multiplicador elegido (×1, ×3, ×5, ×10). Se conserva al pausar. */
  const speed = ref(1)
  /** La partida empieza en pausa. */
  const paused = ref(true)
  /** "Próximo evento": corre a la velocidad máxima hasta el siguiente evento que detenga. */
  const fastForward = ref(false)
  /** Copia del instante de la simulación (minutos desde el 1 de enero del año 1). */
  const time = ref(0)
  const weather = ref<Weather>('dry')

  function togglePause(): void {
    fastForward.value = false
    paused.value = !paused.value
  }

  /** Elegir una velocidad la pone en marcha (y cancela el "próximo evento"). */
  function setSpeed(value: number): void {
    speed.value = value
    fastForward.value = false
    paused.value = false
  }

  function nextEvent(): void {
    fastForward.value = true
    paused.value = false
  }

  /** Lo llama el bucle cuando el "próximo evento" llega a su evento. */
  function stopAtEvent(): void {
    fastForward.value = false
    paused.value = true
  }

  function sync(nextTime: number, nextWeather: Weather): void {
    time.value = nextTime
    weather.value = nextWeather
  }

  return {
    speed,
    paused,
    fastForward,
    time,
    weather,
    togglePause,
    setSpeed,
    nextEvent,
    stopAtEvent,
    sync,
  }
})
