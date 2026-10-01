/**
 * Vista de parcelas: velo sobre el terreno ajeno, borde del terreno propio y,
 * con la herramienta de compra activa, resalte de las parcelas comprables.
 *
 * Son como mucho unas decenas de rectángulos, así que se redibuja entero (un
 * solo Graphics) solo cuando cambia algo: compra de parcela o cambio de modo.
 */
import { Graphics, type Container } from 'pixi.js'
import { canBuyParcel } from '@/sim/commands'
import type { Game } from '@/sim/game'
import type { TileCoord } from '@/sim/geometry'
import { isParcelOwned, parcelGridSize, parcelRect } from '@/sim/map'
import { TILE_SIZE } from './grid'
import { palette } from './palette'

const SIDES = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
] as const

export interface ParcelsView {
  /** Activa o desactiva el resalte de parcelas comprables. */
  setBuyMode(enabled: boolean): void
  destroy(): void
}

export function createParcelsView(layer: Container, game: Game): ParcelsView {
  const graphics = new Graphics({ label: 'parcels' })
  layer.addChild(graphics)
  let buyMode = false

  const redraw = (): void => {
    graphics.clear()
    const grid = parcelGridSize(game.state)

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        drawParcel(graphics, game, { x, y }, buyMode)
      }
    }
  }

  redraw()
  const unsubscribe = game.subscribe((event) => {
    if (event.type === 'parcelBought') redraw()
  })

  return {
    setBuyMode(enabled) {
      if (enabled === buyMode) return
      buyMode = enabled
      redraw()
    },
    destroy() {
      unsubscribe()
      graphics.destroy()
    },
  }
}

function drawParcel(graphics: Graphics, game: Game, parcel: TileCoord, buyMode: boolean): void {
  const { state } = game
  const rect = parcelRect(state, parcel)
  const px = {
    x: rect.x * TILE_SIZE,
    y: rect.y * TILE_SIZE,
    w: rect.width * TILE_SIZE,
    h: rect.height * TILE_SIZE,
  }

  if (!isParcelOwned(state, parcel)) {
    graphics.rect(px.x, px.y, px.w, px.h).fill({ color: palette.parcelLocked, alpha: 0.5 })

    if (buyMode && canBuyParcel(state, parcel).ok) {
      graphics
        .rect(px.x + 4, px.y + 4, px.w - 8, px.h - 8)
        .fill({ color: palette.parcelBuyable, alpha: 0.18 })
        .stroke({ color: palette.parcelBuyable, width: 3, alpha: 0.9 })
    }
    return
  }

  // Borde del terreno propio: solo en los lados que dan a una parcela ajena.
  for (const { dx, dy } of SIDES) {
    if (isParcelOwned(state, { x: parcel.x + dx, y: parcel.y + dy })) continue

    const x1 = dx === 1 ? px.x + px.w : px.x
    const y1 = dy === 1 ? px.y + px.h : px.y
    const x2 = dx === 0 ? px.x + px.w : x1
    const y2 = dy === 0 ? px.y + px.h : y1
    graphics.moveTo(x1, y1).lineTo(x2, y2)
  }
  graphics.stroke({ color: palette.chalk, width: 3, alpha: 0.7 })
}
