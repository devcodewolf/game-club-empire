import { describe, expect, it, vi } from 'vitest'
import type { GridSize } from '@/sim/geometry'
import { clampView } from './camera'
import { createCameraController } from './cameraController'
import { screenToWorld, type Size, type ViewTransform } from './grid'

const REJILLA: GridSize = { width: 100, height: 100 }
const PANTALLA: Size = { width: 1280, height: 720 }
const CENTRO_MUNDO = { x: 3200, y: 3200 }

function crear(screen: Size = PANTALLA) {
  const onChange = vi.fn<(view: ViewTransform) => void>()
  const camara = createCameraController({ grid: REJILLA, screen, onChange })
  return { camara, onChange }
}

describe('createCameraController', () => {
  it('al crearse llama a onChange una vez con el mapa centrado a escala 1', () => {
    const { camara, onChange } = crear()

    expect(onChange).toHaveBeenCalledTimes(1)
    const vista = onChange.mock.calls[0]![0]
    expect(vista.scale).toBe(1)

    const centro = screenToWorld({ x: PANTALLA.width / 2, y: PANTALLA.height / 2 }, vista)
    expect(centro.x).toBeCloseTo(CENTRO_MUNDO.x)
    expect(centro.y).toBeCloseTo(CENTRO_MUNDO.y)
    expect(camara.view).toEqual(vista)
  })

  it('pan llama a onChange y respeta clampView incluso con un pan enorme', () => {
    const { camara, onChange } = crear()

    camara.pan(1e7, -1e7)

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith(camara.view)
    expect(camara.view).toEqual(clampView(camara.view, REJILLA, PANTALLA))
    expect(camara.view.x).toBe(320)
    expect(camara.view.y).toBe(720 - 6400 - 320)
  })

  it('zoomAt llama a onChange y deja la vista dentro de los límites', () => {
    const { camara, onChange } = crear()

    camara.zoomAt({ x: 0, y: 0 }, 1.5)

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(camara.view.scale).toBeCloseTo(1.5)
    expect(camara.view).toEqual(clampView(camara.view, REJILLA, PANTALLA))
  })

  it('resize conserva el punto de mundo del centro de la pantalla', () => {
    const { camara, onChange } = crear()
    const nueva: Size = { width: 1000, height: 600 }

    camara.resize(nueva)

    expect(onChange).toHaveBeenCalledTimes(2)
    const centro = screenToWorld({ x: nueva.width / 2, y: nueva.height / 2 }, camara.view)
    expect(centro.x).toBeCloseTo(CENTRO_MUNDO.x)
    expect(centro.y).toBeCloseTo(CENTRO_MUNDO.y)
  })
})
