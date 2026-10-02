---
name: pixi-artist
description: Dibuja, revisa y mejora el arte del juego Grassroots, que se pinta por código con Graphics de PixiJS (pintores de objetos en objectArt.ts, suelos en floorTextures.ts, muros en wallsView.ts/wallTextures.ts, gradas, campos, decorado de entrada, efectos). Úsala SIEMPRE que crees o modifiques un pintor, un suelo, un muro, una grada, un nivel de objeto, un decorado o cualquier color o forma de src/render/, y cuando Raul pida "mejorar", "pulir", "arreglar" o "que se vea mejor" algo visual, aunque no mencione la skill.
---

# Pixi artist

El arte de Grassroots es código: pintores `(g, w, h, rnd, tier?) => void` que dibujan sobre un `Graphics`. El objetivo es que cada pieza sea bonita y, sobre todo, que todas parezcan del mismo juego. La coherencia vale más que el detalle.

Fuentes de verdad, por orden:
1. `docs/GUIA-ESTILO.md`: ambiente, reglas de dibujo y paleta.
2. `src/render/palette.ts`: los colores en código. Ningún color nuevo sin darlo de alta antes en la guía y aquí.
3. `src/render/style.ts`: grosores de contorno, sombras y tamaños mínimos (créalo si no existe; ver abajo).
4. `docs/DISENO-ESTADIO-Y-NIVELES.md`: cómo deben verse las gradas y los niveles de objetos.

## Contrato del pintor

- Dibuja **sin girar**, con el frente hacia abajo, origen (0,0) arriba a la izquierda y (w,h) el tamaño en px. `createArtMarker` gira y añade la sombra.
- Usa el `rnd` sembrado que recibe, nunca `Math.random()`: el mismo objeto debe verse igual en cada carga.
- Usa los helpers (`box`, `line`, `shade`) y las constantes de `style.ts`. No escribas grosores ni alfas sueltos.
- Si el objeto tiene niveles, recibe `tier` y dibuja el nivel pedido (ver "Niveles").

## Constantes de estilo (`src/render/style.ts`)

```ts
export const OUTLINE_DETAIL = 1     // detalles internos (mínimo absoluto)
export const OUTLINE = 1.5          // contorno de objetos, campos, decorado
export const OUTLINE_WALL = 2.5     // muros: trazo grueso estilo Prison Architect
export const SHADOW_OFFSET = 4      // px abajo y a la derecha
export const SHADOW_ALPHA = 0.28    // única opacidad de sombra proyectada
export const MIN_DETAIL = 2         // ningún detalle visible más pequeño que esto
```

## Legibilidad (la regla más importante)

El zoom inicial es ×0,5: una casilla mide **32 px en pantalla**. Diseña para esa escala:

- Ningún detalle de menos de `MIN_DETAIL` px ni contorno de menos de `OUTLINE_DETAIL`. Si un clavo, tirador o agujero de ducha no se ve a ×0,5, sobra o debe ser más grande.
- **2-4 rasgos reconocibles por objeto**, no más. Una taquilla se reconoce por la rejilla y el tirador; lo demás es ruido.
- El objeto se distingue del suelo por **contraste de valor** (claro sobre oscuro o al revés), no solo por el contorno.
- Los objetos deben tener una riqueza parecida a la de suelos y muros: un segundo tono con `shade()` y algún grano o veta sutil, para no parecer pegatinas sobre un suelo texturizado.

## Flujo obligatorio para cada pieza

Nunca des una pieza por terminada sin verla renderizada.

1. **Planifica** en 2-3 líneas: qué es, tamaño en casillas, sus 2-4 rasgos reconocibles y, si tiene niveles, qué cambia en cada uno.
2. **Dibuja** el pintor.
3. **Valida colores:** `node .claude/skills/pixi-artist/scripts/check-colors.mjs`. Debe salir 0 nuevos.
4. **Captura** con el servidor de Grassroots en marcha (`pnpm dev --port 5199 --strictPort`; el 5173 puede estar ocupado por otro proyecto de Raul, nunca lo uses ni lo cierres):
   ```bash
   node tools/capture.mjs "http://localhost:5199/gallery.html?asset=<id>" <scratchpad>/arte-<id>.png --full
   ```
   `capture.mjs` usa el Edge/Chrome instalado, espera a que la galería termine de dibujar (`data-ready`) y con `--full` captura la página entera. Guarda las capturas en el scratchpad, no en el repo. Alternativa: Raul tiene instalado el CLI de Playwright (`playwright screenshot --full-page --wait-for-timeout=800 <url> <png>`), pero hay que ajustar la espera a mano.
   Para revisar de cerca, `--clip=x,y,ancho,alto` captura solo esa zona (px CSS). `?scene=<nombre>` (vestuario, oficina, estadio) dibuja solo esa escena a ×0,5: es la forma cómoda de ver el estadio entero.
   La galería muestra la pieza a ×0,5 y ×1, sobre césped, madera, baldosa y hormigón, girada en las 4 orientaciones, todos sus niveles en fila y al lado de sus vecinos habituales (un vestuario completo, una grada junto a su campo).
5. **Mira la captura** y revísala con la lista de abajo, fijándote primero en la vista ×0,5.
6. **Corrige y repite** 3-5. Máximo 4 vueltas; si no convence, para y explícale a Raul el problema.
7. **Enseña** a Raul la captura de antes y la de después.

## Lista de comprobación

- [ ] A ×0,5 se entiende qué es sin leer el nombre.
- [ ] Contornos solo con las constantes de `style.ts`; nada de negro puro.
- [ ] Riqueza parecida a la del suelo sobre el que va (segundo tono, algún grano).
- [ ] Escala coherente: un banco es más largo que una persona (~40 px), una puerta mide una casilla.
- [ ] Bien en las 4 orientaciones.
- [ ] Niveles distinguibles a ×0,5 (ver abajo).
- [ ] No destaca entre sus vecinos por más saturado, más oscuro o más detallado.
- [ ] Colores del club como parámetro, nunca fijos (`clubRed`/`clubBlue` son deuda a eliminar).
- [ ] Ningún `Math.random()`.

## Niveles de objetos

Cuando un objeto tiene niveles (taquilla básica → mejorada → de lujo):

- **Misma huella** en todos los niveles: se mejora en el sitio sin mover nada.
- **Cada nivel se distingue por material, color y silueta**, nunca solo por detalles diminutos. Progresión típica: metal gris sencillo → madera clara con más elementos → madera oscura con color del club y luz cálida (`warmLight`).
- El nivel máximo debe dar sensación de lujo a simple vista, pero con la misma paleta y el mismo trazo que el resto.
- Dibuja los niveles en el mismo pintor con un `switch (tier)` sobre una base común, para que compartan proporciones.

## Gradas y estadio

Las gradas no son objetos sueltos: son módulos pegados a los lados del campo. Sigue `docs/DISENO-ESTADIO-Y-NIVELES.md`. Al dibujarlas, comprueba siempre en la galería la vista del campo completo con gradas de niveles mezclados: las cubiertas de lados y esquinas deben unirse y leerse desde arriba como un único estadio.

## Deuda conocida

`check-colors.mjs --baseline` registra los colores fuera de paleta que ya existían, para que el validador solo falle con colores nuevos. Cuando toques un archivo con deuda, migra sus colores a `palette.ts` (dándolos de alta en la guía) o a `shade()` de uno existente, y vuelve a generar la baseline.

## Assets externos (Recraft, Higgsfield, packs CC0)

El juego no carga imágenes todavía. Si Raul trae una, úsala como **referencia visual** para escribir el pintor, no como archivo. Si más adelante se decide cargar sprites, se diseñará el pipeline aparte. Registra cualquier referencia con licencia en `docs/ASSETS-LICENSES.md`.
