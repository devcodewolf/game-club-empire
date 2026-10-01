/**
 * Marcadores provisionales de edificio, generados por código.
 *
 * Sustituyen a los sprites hasta que existan los atlas. Solo dibujan: no
 * conocen la simulación más allá de la definición del edificio (`BuildingDef`).
 */
import { Container, Graphics, Text } from 'pixi.js'
import type { BuildingDef } from '@/sim/buildings'
import { rotateSize, type Rotation } from '@/sim/geometry'
import { TILE_SIZE } from './grid'
import { palette } from './palette'

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
export function createBuildingMarker(def: BuildingDef, rotation: Rotation): Container {
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
  marker.addChild(body)

  const showName = tiles.width >= NAME_MIN_TILES.width && tiles.height >= NAME_MIN_TILES.height

  const iconSize = Math.min(ICON_MAX_SIZE, Math.min(width, height) * 0.45)
  const icon = new Text({ text: def.icon, style: { fontSize: iconSize }, resolution: 2 })
  icon.anchor.set(0.5)
  // Con nombre, el icono sube un poco para dejar sitio debajo.
  icon.position.set(width / 2, showName ? height / 2 - 8 : height / 2)
  marker.addChild(icon)

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
  name.position.set(width / 2, icon.y + iconSize / 2 + 12)
  marker.addChild(name)

  return marker
}

/** Libera el marcador y sus hijos (los `Text` liberan su textura al destruirse). */
export function destroyBuildingMarker(marker: Container): void {
  marker.destroy({ children: true })
}
