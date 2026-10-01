/**
 * Vista previa de la herramienta bajo el cursor (capa overlay):
 *  - construir: edificio fantasma + huella verde (válido) o roja (inválido)
 *  - demoler: huella roja del edificio bajo el cursor
 *  - comprar parcela: la parcela bajo el cursor, cálida si se puede comprar
 *
 * Solo lee el estado (validatePlacement, canBuyParcel): nunca lo modifica.
 */
import { Container, Graphics } from 'pixi.js'
import { canBuyParcel } from '@/sim/commands'
import type { Game } from '@/sim/game'
import { footprint, type TileCoord, type TileRect } from '@/sim/geometry'
import { buildingAt, buildingFootprint, parcelRect, validatePlacement } from '@/sim/map'
import { createBuildingMarker, destroyBuildingMarker } from './buildingMarker'
import { TILE_SIZE } from './grid'
import { palette } from './palette'
import { NO_TOOL, type Tool } from './tool'
import { commandForTool } from './toolActions'

const GHOST_ALPHA = 0.6

export interface ToolPreview {
  setTool(tool: Tool): void
  setHover(tile: TileCoord | null): void
  destroy(): void
}

export function createToolPreview(layer: Container, game: Game): ToolPreview {
  const root = new Container({ label: 'toolPreview' })
  const highlight = new Graphics()
  root.addChild(highlight)
  layer.addChild(root)

  let tool: Tool = NO_TOOL
  let hover: TileCoord | null = null
  let ghost: Container | null = null
  let ghostKey = ''

  /** El fantasma solo se recrea si cambia el edificio o el giro. */
  const syncGhost = (): void => {
    const key = tool.kind === 'build' ? `${tool.buildingType}:${tool.rotation}` : ''
    if (key === ghostKey) return

    if (ghost) destroyBuildingMarker(ghost)
    ghost = null
    ghostKey = key

    const def = tool.kind === 'build' ? game.catalog[tool.buildingType] : undefined
    if (!def || tool.kind !== 'build') return

    ghost = createBuildingMarker(def, tool.rotation)
    ghost.alpha = GHOST_ALPHA
    root.addChildAt(ghost, 0)
  }

  const redraw = (): void => {
    syncGhost()
    highlight.clear()
    if (ghost) ghost.visible = false
    if (!hover) return

    const command = commandForTool(tool, hover, game.state, game.catalog)
    if (!command) return

    switch (command.type) {
      case 'placeBuilding': {
        const check = validatePlacement(
          game.state,
          game.catalog,
          command.buildingType,
          command.origin,
          command.rotation,
        )
        const def = game.catalog[command.buildingType]
        if (!def) return
        const rect = footprint(command.origin, def.size, command.rotation)
        if (ghost) {
          ghost.visible = true
          ghost.position.set(rect.x * TILE_SIZE, rect.y * TILE_SIZE)
        }
        drawRect(highlight, rect, check.ok ? palette.previewValid : palette.previewInvalid)
        return
      }
      case 'demolishBuilding': {
        const building = buildingAt(game.state, hover)
        const def = building && game.catalog[building.type]
        if (building && def)
          drawRect(highlight, buildingFootprint(building, def), palette.previewInvalid)
        return
      }
      case 'buyParcel': {
        const buyable = canBuyParcel(game.state, command.parcel).ok
        drawRect(
          highlight,
          parcelRect(game.state, command.parcel),
          buyable ? palette.parcelBuyable : palette.previewInvalid,
        )
        return
      }
    }
  }

  // Si el estado cambia bajo el cursor (p. ej. se acaba de construir), refresca.
  const unsubscribe = game.subscribe(redraw)

  return {
    setTool(next) {
      tool = next
      redraw()
    },
    setHover(tile) {
      if (tile && hover && tile.x === hover.x && tile.y === hover.y) return
      hover = tile
      redraw()
    },
    destroy() {
      unsubscribe()
      root.destroy({ children: true })
    },
  }
}

function drawRect(graphics: Graphics, rect: TileRect, color: number): void {
  graphics
    .rect(rect.x * TILE_SIZE, rect.y * TILE_SIZE, rect.width * TILE_SIZE, rect.height * TILE_SIZE)
    .fill({ color, alpha: 0.3 })
    .stroke({ color, width: 3, alignment: 1 })
}
