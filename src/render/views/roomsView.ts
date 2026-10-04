/**
 * Rótulos de sala: el nombre en grande, semitransparente y "pintado" sobre el
 * suelo (como "SHOWER" en Prison Architect). Si la sala no cumple sus
 * requisitos, debajo aparece un aviso con lo que le falta.
 *
 * Se recalcula todo cuando cambia algo que afecta a las salas (son pocas).
 */
import { Container, Graphics, Text } from 'pixi.js'
import type { Game } from '@/sim/game'
import { evaluateRoom, type RoomStatus } from '@/sim/rooms/rooms'
import { TILE_SIZE } from '../core/grid'
import { palette } from '../palette'

const WARNING = 0xb03a2e

export interface RoomsView {
  destroy(): void
}

export function createRoomsView(layer: Container, game: Game): RoomsView {
  const root = new Container({ label: 'rooms' })
  layer.addChild(root)

  const redraw = (): void => {
    for (const child of root.removeChildren()) child.destroy({ children: true })
    for (const key of Object.keys(game.state.rooms)) {
      const status = evaluateRoom(game.state, game.content, Number(key))
      if (status) root.addChild(createRoomLabel(game, status))
    }
  }

  redraw()
  const unsubscribe = game.subscribe((event) => {
    const affectsRooms =
      event.type === 'roomDesignated' ||
      event.type === 'roomRemoved' ||
      event.type === 'buildingPlaced' ||
      event.type === 'buildingDemolished' ||
      event.type === 'buildingMoved' ||
      event.type === 'structuresChanged' ||
      event.type === 'areaDemolished'
    if (affectsRooms) redraw()
  })

  return {
    destroy() {
      unsubscribe()
      root.destroy({ children: true })
    },
  }
}

function createRoomLabel(game: Game, status: RoomStatus): Container {
  const def = game.content.rooms[status.type]
  const label = new Container({ label: `room:${status.id}` })
  const name = (def?.name ?? status.type).toUpperCase()
  const { bounds } = status
  const width = bounds.width * TILE_SIZE
  const cx = (bounds.x + bounds.width / 2) * TILE_SIZE
  const cy = (bounds.y + bounds.height / 2) * TILE_SIZE

  // Tamaño de letra que quepa en el ancho de la sala (mín. 20, máx. 96 px)
  const fontSize = Math.max(20, Math.min(96, (width * 0.85) / (name.length * 0.62)))
  const title = new Text({
    text: name,
    style: {
      fontSize,
      fill: palette.outline,
      fontFamily: 'Trebuchet MS, sans-serif',
      fontWeight: 'bold',
      letterSpacing: 2,
    },
    resolution: 2,
  })
  title.anchor.set(0.5)
  title.alpha = 0.22
  title.position.set(cx, cy)
  label.addChild(title)

  if (status.ok) return label

  // Aviso: triángulo con "!" y lista breve de lo que falta
  const problems = describeProblems(game, status)
  const warnY = cy + fontSize * 0.55 + 14
  const icon = new Graphics()
    .poly([cx, warnY - 11, cx + 12, warnY + 9, cx - 12, warnY + 9])
    .fill(palette.warmLight)
    .stroke({ color: palette.outline, width: 1.5 })
    .rect(cx - 1.5, warnY - 4, 3, 7)
    .fill(palette.outline)
    .circle(cx, warnY + 5.5, 1.6)
    .fill(palette.outline)
  label.addChild(icon)

  const text = new Text({
    text: problems.join(' · '),
    style: {
      fontSize: 18,
      fill: WARNING,
      fontFamily: 'Trebuchet MS, sans-serif',
      fontWeight: 'bold',
      stroke: { color: palette.chalk, width: 4 },
      wordWrap: true,
      wordWrapWidth: Math.max(160, width - 20),
      align: 'center',
    },
    resolution: 2,
  })
  text.anchor.set(0.5, 0)
  text.position.set(cx, warnY + 14)
  label.addChild(text)
  return label
}

/** Frases cortas con lo que impide que la sala funcione. */
export function describeProblems(game: Game, status: RoomStatus): string[] {
  const def = game.content.rooms[status.type]
  const problems: string[] = []
  if (!status.enclosed) problems.push('No está cerrada')
  if (!status.hasDoor) problems.push('Falta una puerta')
  if (status.tooSmall && def) problems.push(`Mínimo ${def.minSize.width}×${def.minSize.height}`)
  for (const m of status.missing) {
    const object = game.content.buildings[m.object]?.name ?? m.object
    problems.push(`Falta ${m.need - m.have} × ${object}`)
  }
  return problems
}
