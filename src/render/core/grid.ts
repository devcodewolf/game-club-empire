/**
 * Conversiones entre los tres sistemas de coordenadas del juego:
 *
 *   casilla (sim)  ──×TILE_SIZE──▶  mundo (px del mapa)  ──cámara──▶  pantalla (px del canvas)
 *
 * Son funciones puras y no importan Pixi, así que se testean sin navegador.
 */
import type { GridSize, TileCoord } from '@/sim/geometry'

/** Lado de una casilla en píxeles de mundo. */
export const TILE_SIZE = 64

/** Punto en píxeles (de mundo o de pantalla, según el contexto). */
export interface Point {
  readonly x: number
  readonly y: number
}

/** Tamaño en píxeles. */
export interface Size {
  readonly width: number
  readonly height: number
}

/**
 * Transformación de la cámara: `pantalla = mundo × scale + (x, y)`.
 * Es el mismo modelo que la posición y la escala de un Container de Pixi.
 */
export interface ViewTransform {
  readonly x: number
  readonly y: number
  readonly scale: number
}

export const IDENTITY_VIEW: ViewTransform = { x: 0, y: 0, scale: 1 }

// ── Casilla ↔ mundo ───────────────────────────────────────────────

/** Esquina superior izquierda de la casilla, en píxeles de mundo. */
export function tileToWorld(tile: TileCoord): Point {
  return { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE }
}

/** Centro de la casilla, en píxeles de mundo. Útil para colocar personas o textos. */
export function tileCenterToWorld(tile: TileCoord): Point {
  return { x: (tile.x + 0.5) * TILE_SIZE, y: (tile.y + 0.5) * TILE_SIZE }
}

/** Casilla que contiene un punto de mundo. Puede quedar fuera del mapa. */
export function worldToTile(point: Point): TileCoord {
  return { x: Math.floor(point.x / TILE_SIZE), y: Math.floor(point.y / TILE_SIZE) }
}

/** Tamaño del mapa completo en píxeles de mundo. */
export function gridWorldSize(grid: GridSize): Size {
  return { width: grid.width * TILE_SIZE, height: grid.height * TILE_SIZE }
}

// ── Mundo ↔ pantalla ──────────────────────────────────────────────

export function worldToScreen(point: Point, view: ViewTransform): Point {
  return { x: point.x * view.scale + view.x, y: point.y * view.scale + view.y }
}

export function screenToWorld(point: Point, view: ViewTransform): Point {
  return { x: (point.x - view.x) / view.scale, y: (point.y - view.y) / view.scale }
}

// ── Atajos casilla ↔ pantalla (p. ej. para saber qué casilla hay bajo el ratón) ──

export function tileToScreen(tile: TileCoord, view: ViewTransform): Point {
  return worldToScreen(tileToWorld(tile), view)
}

export function screenToTile(point: Point, view: ViewTransform): TileCoord {
  return worldToTile(screenToWorld(point, view))
}

// ── Encaje en pantalla ────────────────────────────────────────────

export interface FitOptions {
  /** Margen libre alrededor del mapa, en píxeles de pantalla. */
  readonly padding?: number
  /** Escala máxima; por defecto 1 para no agrandar las casillas por encima de 64 px. */
  readonly maxScale?: number
}

/**
 * Calcula la cámara que muestra el mapa entero y centrado en la pantalla.
 * Se recalcula al cambiar el tamaño de la ventana.
 */
export function fitGridToScreen(
  grid: GridSize,
  screen: Size,
  { padding = 24, maxScale = 1 }: FitOptions = {},
): ViewTransform {
  const world = gridWorldSize(grid)
  const availableWidth = Math.max(screen.width - padding * 2, 1)
  const availableHeight = Math.max(screen.height - padding * 2, 1)

  const scale = Math.min(availableWidth / world.width, availableHeight / world.height, maxScale)

  return {
    x: (screen.width - world.width * scale) / 2,
    y: (screen.height - world.height * scale) / 2,
    scale,
  }
}
