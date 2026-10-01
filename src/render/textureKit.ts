/**
 * Utilidades para generar texturas repetibles por código (suelos, muros…).
 *
 * Cada textura mide PATTERN×PATTERN px (2×2 casillas). Todo lo que toca un
 * borde se dibuja también en el opuesto, así la textura se repite sin
 * costuras. `bakePattern` la convierte en un FillPattern en espacio global,
 * alineado con la rejilla del mundo.
 */
import { FillPattern, Graphics, Rectangle, type Renderer, type Texture } from 'pixi.js'
import { TILE_SIZE } from './grid'
import { createRandom, seedFromText, type Random } from './random'

/** Lado de la textura: 2×2 casillas. */
export const PATTERN = TILE_SIZE * 2

export interface BakedPattern {
  readonly texture: Texture
  readonly pattern: FillPattern
}

/**
 * Dibuja una textura con `paint` (con un generador sembrado por `seed`) y la
 * prepara como patrón repetible en espacio global.
 */
export function bakePattern(
  renderer: Renderer,
  seed: string,
  paint: (g: Graphics, rnd: Random) => void,
): BakedPattern {
  const g = new Graphics()
  paint(g, createRandom(seedFromText(seed)))
  const texture = renderer.generateTexture({
    target: g,
    frame: new Rectangle(0, 0, PATTERN, PATTERN),
    antialias: true,
  })
  g.destroy()

  const pattern = new FillPattern({ texture, repetition: 'repeat', textureSpace: 'global' })
  // FillPattern cambia el modo de repetición del estilo pero no llama a update():
  // sin esto la GPU sigue en 'clamp-to-edge' y fuera de los primeros 128 px se
  // repite el píxel del borde (se ve liso). Pixi 8.21.
  texture.source.style.update()
  return { texture, pattern }
}

/** Dibuja algo en (x, y) y, si queda cerca de un borde, también en el lado opuesto. */
export function wrapped(
  x: number,
  y: number,
  margin: number,
  draw: (x: number, y: number) => void,
): void {
  const xs = [
    x,
    ...(x < margin ? [x + PATTERN] : []),
    ...(x > PATTERN - margin ? [x - PATTERN] : []),
  ]
  const ys = [
    y,
    ...(y < margin ? [y + PATTERN] : []),
    ...(y > PATTERN - margin ? [y - PATTERN] : []),
  ]
  for (const wx of xs) for (const wy of ys) draw(wx, wy)
}

/** Motas sueltas de uno o varios tonos. */
export function speckles(
  g: Graphics,
  rnd: Random,
  count: number,
  colors: number[],
  radius: [number, number],
): void {
  for (let i = 0; i < count; i++) {
    const r = rnd.range(radius[0], radius[1])
    const color = rnd.pick(colors)
    wrapped(rnd.range(0, PATTERN), rnd.range(0, PATTERN), r, (x, y) =>
      g.circle(x, y, r).fill(color),
    )
  }
}

/**
 * Rellena una fila con piezas de largo aleatorio (losas, tablas) que cubren
 * exactamente un periodo de PATTERN px, empezando en un desplazamiento al azar.
 * Las piezas que se salen por la derecha se dibujan también por la izquierda,
 * así la fila es continua al repetirse. Cada pieza recibe su propio generador
 * para que sus dos copias tengan el mismo tono y los mismos detalles.
 */
export function drawRowPieces(
  rnd: Random,
  y: number,
  height: number,
  lengths: [number, number],
  drawPiece: (x: number, y: number, width: number, height: number, piece: Random) => void,
): void {
  const start = rnd.range(0, lengths[0])
  const end = start + PATTERN
  let x = start

  while (x < end - 0.5) {
    let width = Math.round(rnd.range(lengths[0], lengths[1]))
    // Si lo que sobraría es más corto que una pieza mínima, se absorbe aquí.
    if (end - (x + width) < lengths[0]) width = end - x

    const seed = rnd.int(0, 2 ** 31)
    drawPiece(x, y, width, height, createRandom(seed))
    if (x + width > PATTERN) drawPiece(x - PATTERN, y, width, height, createRandom(seed))
    x += width
  }
}
