/**
 * Vista previa de la herramienta bajo el cursor (capa overlay):
 *  - construir: edificio fantasma + huella verde (válido) o roja (inválido)
 *  - demoler: huella roja del edificio bajo el cursor
 *  - pintar suelo: rectángulo del arrastre con el color del suelo, borde verde
 *    o rojo y su tamaño ("12×8")
 *
 * Solo lee el estado (validatePlacement, validateFloorPaint): nunca lo modifica.
 */
import { Container, Graphics, Text } from 'pixi.js'
import type { Game } from '@/sim/game'
import { footprint, perimeterTiles, type TileCoord, type TileRect } from '@/sim/geometry'
import { buildingAt, buildingFootprint, validateFloorPaint, validatePlacement } from '@/sim/map/map'
import { doorAxis, validateDoor, validateFoundation, validateWalls } from '@/sim/map/structures'
import { regionFrom, roomAt, validateDesignateRoom } from '@/sim/rooms/rooms'
import { demolishTargetAt } from '@/sim/map/demolish'
import { checkStandArea, maxStandRect, placementRect, validatePlaceStand } from '@/sim/buildings/stands'
import { createBuildingMarker, destroyBuildingMarker } from '../art/buildingMarker'
import { TILE_SIZE } from '../core/grid'
import type { RenderAssets } from '../core/renderAssets'
import { palette } from '../palette'
import { NO_TOOL, type Tool } from './tool'
import { commandForDrag, commandForTool } from './toolActions'

const GHOST_ALPHA = 0.6

export interface ToolPreview {
  setTool(tool: Tool): void
  setHover(tile: TileCoord | null): void
  /** Casilla donde empezó el arrastre en curso, o null si no se arrastra. */
  setDragStart(tile: TileCoord | null): void
  /**
   * Zoom actual de la cámara. Bordes y rótulos se dibujan a tamaño constante
   * en pantalla (se dividen por el zoom), así se leen igual de cerca que de lejos.
   */
  setZoom(scale: number): void
  destroy(): void
}

export function createToolPreview(layer: Container, game: Game, assets: RenderAssets): ToolPreview {
  const root = new Container({ label: 'toolPreview' })
  const highlight = new Graphics()
  const sizeLabel = new Text({
    text: '',
    style: {
      fontSize: 18,
      fill: palette.chalk,
      stroke: { color: palette.outline, width: 6 },
      fontFamily: 'Trebuchet MS, sans-serif',
      fontWeight: 'bold',
    },
    resolution: 2,
  })
  sizeLabel.anchor.set(0.5, 1)
  root.addChild(highlight, sizeLabel)
  layer.addChild(root)

  let tool: Tool = NO_TOOL
  let hover: TileCoord | null = null
  let dragStart: TileCoord | null = null
  let ghost: Container | null = null
  let ghostKey = ''
  let zoom = 1
  /** Fantasma de grada: cambia con el campo y el lado, no con la herramienta. */
  let standGhost: Container | null = null
  let standGhostKey = ''

  const syncStandGhost = (key: string, create: () => Container | null): void => {
    if (key === standGhostKey) return
    if (standGhost) destroyBuildingMarker(standGhost)
    standGhost = create()
    standGhostKey = key
    if (!standGhost) return
    standGhost.alpha = GHOST_ALPHA
    root.addChildAt(standGhost, 0)
  }

  /** El fantasma solo se recrea si cambia el edificio o el giro. */
  const syncGhost = (): void => {
    const key = tool.kind === 'build' ? `${tool.buildingType}:${tool.rotation}` : ''
    if (key === ghostKey) return

    if (ghost) destroyBuildingMarker(ghost)
    ghost = null
    ghostKey = key

    const def = tool.kind === 'build' ? game.content.buildings[tool.buildingType] : undefined
    if (!def || tool.kind !== 'build') return

    ghost = createBuildingMarker(def, tool.rotation, assets)
    ghost.alpha = GHOST_ALPHA
    root.addChildAt(ghost, 0)
  }

  const redraw = (): void => {
    syncGhost()
    highlight.clear()
    sizeLabel.visible = false
    if (ghost) ghost.visible = false
    if (standGhost) standGhost.visible = false
    if (!hover) return

    const command = dragStart
      ? commandForDrag(tool, dragStart, hover, game.state)
      : commandForTool(tool, hover, game.state, game.content)
    if (!command) return

    switch (command.type) {
      case 'placeBuilding': {
        const def = game.content.buildings[command.buildingType]
        if (!def) return
        const check = validatePlacement(
          game.state,
          game.content.buildings,
          command.buildingType,
          command.origin,
          command.rotation,
        )
        const rect = footprint(command.origin, def.size, command.rotation)
        if (ghost) {
          ghost.visible = true
          ghost.position.set(rect.x * TILE_SIZE, rect.y * TILE_SIZE)
        }
        drawRect(highlight, rect, zoom, check.ok ? palette.previewValid : palette.previewInvalid)
        return
      }
      case 'placeStand': {
        const def = game.content.buildings[command.buildingType]
        const check = validatePlaceStand(
          game.state,
          game.content,
          command.buildingType,
          command.pitchId,
          command.slot,
        )
        const placement = check.placement
        if (!def || !placement) return
        const rect = placementRect(placement)
        syncStandGhost(`${command.pitchId}:${command.slot}`, () =>
          createBuildingMarker(def, placement.rotation, assets, { size: placement.size }),
        )
        if (standGhost && check.ok) {
          standGhost.visible = true
          standGhost.position.set(rect.x * TILE_SIZE, rect.y * TILE_SIZE)
        }
        // Huella máxima (nivel más alto): avisa en ámbar si ya hay algo que le impedirá crecer.
        const max = maxStandRect(
          game.state,
          game.content,
          command.buildingType,
          command.pitchId,
          command.slot,
        )
        if (check.ok && max) {
          const blocked = checkStandArea(game.state, max) !== null
          drawDashedRect(highlight, max, zoom, blocked ? palette.warmLight : palette.chalk)
        }
        drawRect(highlight, rect, zoom, check.ok ? palette.previewValid : palette.previewInvalid)
        return
      }
      case 'demolishBuilding': {
        const building = buildingAt(game.state, hover)
        const def = building && game.content.buildings[building.type]
        if (building && def) {
          drawRect(highlight, buildingFootprint(building, def), zoom, palette.previewInvalid)
        }
        return
      }
      case 'paintFloor': {
        const check = validateFloorPaint(
          game.state,
          game.content.floors,
          command.rect,
          command.floor,
        )
        // 'nothingToPaint' no es un error de verdad: se muestra como válido.
        const valid = check.ok || check.reason === 'nothingToPaint'
        // Válido: se ve el suelo que quedará. Inválido: rojo, sin dudas.
        const floorColor = game.content.floors[command.floor]?.color ?? palette.previewValid
        drawRect(
          highlight,
          command.rect,
          zoom,
          valid ? palette.previewValid : palette.previewInvalid,
          valid ? floorColor : palette.previewInvalid,
          valid ? 0.7 : 0.45,
        )
        showSize(sizeLabel, command.rect, zoom)
        return
      }
      case 'buildWalls': {
        const check = validateWalls(game.state, game.content, command.rect, command.wall)
        const valid = check.ok || check.reason === 'nothingToBuild'
        const cap = game.content.walls[command.wall]?.capColor ?? palette.stone
        drawRect(
          highlight,
          command.rect,
          zoom,
          valid ? palette.previewValid : palette.previewInvalid,
          valid ? cap : palette.previewInvalid,
          0.75,
        )
        showSize(sizeLabel, command.rect, zoom)
        return
      }
      case 'buildFoundation': {
        const check = validateFoundation(
          game.state,
          game.content,
          command.rect,
          command.wall,
          command.floor,
        )
        const border = check.ok ? palette.previewValid : palette.previewInvalid
        const cap = game.content.walls[command.wall]?.capColor ?? palette.stone
        const floor = game.content.floors[command.floor]?.color ?? palette.stone
        // Suelo interior y muros fantasma en el perímetro
        drawRect(
          highlight,
          command.rect,
          zoom,
          border,
          check.ok ? floor : palette.previewInvalid,
          0.4,
        )
        for (const tile of perimeterTiles(command.rect)) {
          highlight
            .rect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            .fill({ color: check.ok ? cap : palette.previewInvalid, alpha: 0.75 })
        }
        showSize(sizeLabel, command.rect, zoom)
        return
      }
      case 'placeDoor': {
        const check = validateDoor(game.state, game.content, command.tile, command.door)
        const color = game.content.doors[command.door]?.color ?? palette.wood
        const rect = { ...command.tile, width: 1, height: 1 }
        drawRect(
          highlight,
          rect,
          zoom,
          check.ok ? palette.previewValid : palette.previewInvalid,
          palette.previewInvalid,
          check.ok ? 0 : 0.35,
        )
        if (check.ok) {
          // Hoja fantasma orientada según el muro
          const across = doorAxis(game.state, command.tile) !== 'horizontal'
          const x = command.tile.x * TILE_SIZE
          const y = command.tile.y * TILE_SIZE
          const leaf = across
            ? [x + 7, y + TILE_SIZE / 2 - 6, TILE_SIZE - 14, 12]
            : [x + TILE_SIZE / 2 - 6, y + 7, 12, TILE_SIZE - 14]
          highlight
            .rect(leaf[0] ?? 0, leaf[1] ?? 0, leaf[2] ?? 0, leaf[3] ?? 0)
            .fill({ color, alpha: 0.85 })
        }
        return
      }
      case 'designateRoom': {
        const check = validateDesignateRoom(
          game.state,
          game.content,
          command.tile,
          command.roomType,
        )
        const color = game.content.rooms[command.roomType]?.color ?? palette.previewValid
        if (!check.ok) {
          drawRect(
            highlight,
            { ...command.tile, width: 1, height: 1 },
            zoom,
            palette.previewInvalid,
            palette.previewInvalid,
            0.35,
          )
          return
        }
        // Tinte de toda la zona que pasará a ser sala
        for (const t of regionFrom(game.state, command.tile).tiles) {
          highlight
            .rect(t.x * TILE_SIZE, t.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            .fill({ color, alpha: 0.35 })
        }
        return
      }
      case 'removeRoom': {
        const id = roomAt(game.state, command.tile)
        if (!id) return
        game.state.roomOf.forEach((roomId, index) => {
          if (roomId !== id) return
          const x = index % game.state.size.width
          const y = Math.floor(index / game.state.size.width)
          highlight
            .rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            .fill({ color: palette.previewInvalid, alpha: 0.3 })
        })
        return
      }
      case 'demolishAt': {
        const target = demolishTargetAt(game.state, command.tile)
        if (!target) return
        // Se resalta justo lo que se quitaría: el objeto entero o la casilla
        const def =
          target.kind === 'building' ? game.content.buildings[target.building.type] : undefined
        const rect =
          target.kind === 'building' && def
            ? buildingFootprint(target.building, def)
            : { ...command.tile, width: 1, height: 1 }
        drawRect(highlight, rect, zoom, palette.previewInvalid, palette.previewInvalid, 0.35)
        return
      }
      case 'demolishArea':
        drawRect(highlight, command.rect, zoom, palette.previewInvalid, palette.previewInvalid, 0.3)
        showSize(sizeLabel, command.rect, zoom)
        return
      case 'demolishStructures':
        drawRect(highlight, command.rect, zoom, palette.previewInvalid, palette.previewInvalid, 0.3)
        showSize(sizeLabel, command.rect, zoom)
        return
    }
  }

  // Si el estado cambia bajo el cursor (p. ej. se acaba de construir), refresca.
  const unsubscribe = game.subscribe(redraw)

  return {
    setTool(next) {
      tool = next
      dragStart = null
      redraw()
    },
    setHover(tile) {
      if (tile && hover && tile.x === hover.x && tile.y === hover.y) return
      hover = tile
      redraw()
    },
    setDragStart(tile) {
      dragStart = tile
      redraw()
    },
    setZoom(scale) {
      zoom = scale
      redraw()
    },
    destroy() {
      unsubscribe()
      root.destroy({ children: true })
    },
  }
}

/** Grosor del borde de la vista previa, en px de PANTALLA. */
const BORDER_PX = 3

function drawRect(
  graphics: Graphics,
  rect: TileRect,
  zoom: number,
  borderColor: number,
  fillColor: number = borderColor,
  fillAlpha = 0.3,
): void {
  graphics
    .rect(rect.x * TILE_SIZE, rect.y * TILE_SIZE, rect.width * TILE_SIZE, rect.height * TILE_SIZE)
    .fill({ color: fillColor, alpha: fillAlpha })
    .stroke({ color: borderColor, width: BORDER_PX / zoom, alignment: 1 })
}

/** Largo de cada trazo y de cada hueco del borde discontinuo, en px de PANTALLA. */
const DASH_PX = 10

/** Borde discontinuo (Pixi no tiene trazo discontinuo: se dibujan los tramos). */
function drawDashedRect(graphics: Graphics, rect: TileRect, zoom: number, color: number): void {
  const x0 = rect.x * TILE_SIZE
  const y0 = rect.y * TILE_SIZE
  const x1 = x0 + rect.width * TILE_SIZE
  const y1 = y0 + rect.height * TILE_SIZE
  const dash = DASH_PX / zoom
  const sides: [number, number, number, number][] = [
    [x0, y0, x1, y0],
    [x1, y0, x1, y1],
    [x1, y1, x0, y1],
    [x0, y1, x0, y0],
  ]
  for (const [ax, ay, bx, by] of sides) {
    const length = Math.hypot(bx - ax, by - ay)
    for (let d = 0; d < length; d += dash * 2) {
      const from = d / length
      const to = Math.min(d + dash, length) / length
      graphics
        .moveTo(ax + (bx - ax) * from, ay + (by - ay) * from)
        .lineTo(ax + (bx - ax) * to, ay + (by - ay) * to)
    }
  }
  graphics.stroke({ color, width: BORDER_PX / zoom, alpha: 0.9 })
}

/** Rótulo "ancho×alto" encima del rectángulo (solo si es mayor de 1×1). */
function showSize(label: Text, rect: TileRect, zoom: number): void {
  if (rect.width * rect.height <= 1) return
  label.text = `${rect.width}×${rect.height}`
  label.scale.set(1 / zoom)
  label.position.set((rect.x + rect.width / 2) * TILE_SIZE, rect.y * TILE_SIZE - 6 / zoom)
  label.visible = true
}
