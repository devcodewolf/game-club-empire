/**
 * Marcadores provisionales de edificio, generados por código.
 *
 * Sustituyen a los sprites hasta que existan los atlas. Solo dibujan: no
 * conocen la simulación más allá de la definición del edificio (`BuildingDef`).
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js'
import type { BuildingDef } from '@/sim/buildings'
import { rotateSize, type Rotation } from '@/sim/geometry'
import { TILE_SIZE } from './grid'
import { createPitchMarker } from './pitchMarker'
import { palette } from './palette'
import type { RenderAssets } from './renderAssets'

/** Desplazamiento de la sombra plana (hacia abajo a la derecha), en px. */
const SHADOW_OFFSET = 4
/** Radio de las esquinas del cuerpo, en px. */
const CORNER_RADIUS = 4
/** Margen del borde interior respecto al cuerpo, en px. */
const INNER_INSET = 6
/** Tamaño máximo del icono, en px. */
const ICON_MAX_SIZE = 48
/** Huella mínima (en casillas) para mostrar el nombre. */
const NAME_MIN_TILES = { width: 3, height: 2 } as const

/**
 * Crea el marcador de un edificio. El origen (0,0) del contenedor es la
 * esquina superior izquierda de la huella ya girada.
 */
export function createBuildingMarker(
  def: BuildingDef,
  rotation: Rotation,
  assets?: RenderAssets,
): Container {
  // Los terrenos de juego tienen su propio dibujo (superficie + líneas de cal).
  if (def.pitch) {
    return createPitchMarker(
      def,
      rotation,
      assets?.floors.pattern(def.pitch.surface) ?? def.markerColor,
    )
  }

  const tiles = rotateSize(def.size, rotation)
  const width = tiles.width * TILE_SIZE
  const height = tiles.height * TILE_SIZE

  const marker = new Container({ label: `building:${def.id}` })

  // Sombra plana, cuerpo con contorno interior y borde interior sutil.
  const body = new Graphics()
    .roundRect(SHADOW_OFFSET, SHADOW_OFFSET, width, height, CORNER_RADIUS)
    .fill({ color: palette.grassShadow })
    .roundRect(0, 0, width, height, CORNER_RADIUS)
    .fill({ color: def.markerColor })
    .stroke({ width: 1.5, color: palette.outline, alignment: 1 })
    .rect(INNER_INSET, INNER_INSET, width - INNER_INSET * 2, height - INNER_INSET * 2)
    .stroke({ width: 1, color: palette.outline, alpha: 0.25 })
  if (!def.symmetric) drawFrontArrow(body, width, height, rotation)
  marker.addChild(body)

  const showName = tiles.width >= NAME_MIN_TILES.width && tiles.height >= NAME_MIN_TILES.height

  const iconSize = Math.min(ICON_MAX_SIZE, Math.min(width, height) * 0.45)
  // Con nombre, el icono sube un poco para dejar sitio debajo.
  const iconY = showName ? height / 2 - 8 : height / 2
  addIcon(marker, assets?.icons.get(def.icon), width / 2, iconY, iconSize)

  if (!showName) return marker

  const name = new Text({
    text: def.name,
    style: {
      fontSize: 13,
      fill: palette.chalk,
      stroke: { color: palette.outline, width: 3 },
      fontFamily: 'Trebuchet MS, sans-serif',
      fontWeight: 'bold',
    },
    resolution: 2,
  })
  name.anchor.set(0.5)
  name.position.set(width / 2, iconY + iconSize / 2 + 12)
  marker.addChild(name)

  return marker
}

/**
 * Icono de línea blanco con una sombra oscura desplazada, para que se lea
 * sobre cualquier color de marcador. Sin textura (aún cargando) no dibuja nada.
 */
function addIcon(
  marker: Container,
  texture: ReturnType<RenderAssets['icons']['get']>,
  x: number,
  y: number,
  size: number,
): void {
  if (!texture) return

  const shadow = new Sprite({ texture, anchor: 0.5, tint: palette.outline, alpha: 0.6 })
  shadow.setSize(size)
  shadow.position.set(x + 1.5, y + 1.5)
  const icon = new Sprite({ texture, anchor: 0.5 })
  icon.setSize(size)
  icon.position.set(x, y)
  marker.addChild(shadow, icon)
}

/** Dirección del frente del edificio según el giro (sentido horario, 0 = abajo). */
const FRONT_DIRECTIONS = [
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
] as const

/** Distancia de la flecha al borde y tamaño de su punta, en px. */
const ARROW_INSET = 16
const ARROW_SIZE = 11

/**
 * Flecha junto al borde "frontal" (p. ej. hacia dónde mira la grada). Hace
 * visible cualquier giro, incluso en edificios cuadrados o girados 180°.
 */
function drawFrontArrow(
  graphics: Graphics,
  width: number,
  height: number,
  rotation: Rotation,
): void {
  const dir = FRONT_DIRECTIONS[rotation]
  // Punta pegada al borde frontal, centrada en ese lado.
  const tipX = width / 2 + dir.x * (width / 2 - ARROW_INSET)
  const tipY = height / 2 + dir.y * (height / 2 - ARROW_INSET)
  // Base perpendicular a la dirección, retrasada hacia el centro.
  const baseX = tipX - dir.x * ARROW_SIZE * 1.3
  const baseY = tipY - dir.y * ARROW_SIZE * 1.3
  const perpX = -dir.y * ARROW_SIZE
  const perpY = dir.x * ARROW_SIZE

  graphics
    .poly([tipX, tipY, baseX + perpX, baseY + perpY, baseX - perpX, baseY - perpY])
    .fill({ color: palette.chalk, alpha: 0.85 })
    .stroke({ width: 1, color: palette.outline })
}

/** Libera el marcador y sus hijos (los `Text` liberan su textura al destruirse). */
export function destroyBuildingMarker(marker: Container): void {
  marker.destroy({ children: true })
}
