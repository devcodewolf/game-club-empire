/**
 * Estado de UI del tiempo: velocidad, pausa y "próximo evento" (salta de golpe
 * al siguiente evento destacado y se detiene), más una copia
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
  /** "Próximo evento" pedido: el bucle salta al siguiente evento destacado en el próximo fotograma. */
  const jumpRequested = ref(false)
  /** Copia del instante de la simulación (minutos desde el 1 de enero del año 1). */
  const time = ref(0)
  const weather = ref<Weather>('dry')

  function togglePause(): void {
    jumpRequested.value = false
    paused.value = !paused.value
  }

  /** Elegir una velocidad la pone en marcha. */
  function setSpeed(value: number): void {
    speed.value = value
    jumpRequested.value = false
    paused.value = false
  }

  /** Salta al siguiente evento destacado (partido, lunes de cuentas…) y se queda en pausa. */
  function nextEvent(): void {
    jumpRequested.value = true
  }

  /** Lo llama el bucle tras el salto: la partida queda en pausa en el evento. */
  function stopAtEvent(): void {
    jumpRequested.value = false
    paused.value = true
  }

  function sync(nextTime: number, nextWeather: Weather): void {
    time.value = nextTime
    weather.value = nextWeather
  }

  return {
    speed,
    paused,
    jumpRequested,
    time,
    weather,
    togglePause,
    setSpeed,
    nextEvent,
    stopAtEvent,
    sync,
  }
})
