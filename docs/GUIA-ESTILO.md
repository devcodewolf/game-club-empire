# Guía de estilo visual

## Ambiente
**Norte lluvioso.** Un pueblo verde y húmedo: césped intenso, piedra gris, tejados de pizarra, muros de piedra seca, robles y charcos. Acogedor, no triste: la luz cálida de las ventanas y los focos contrasta con el gris de la lluvia.

El clima es parte del juego: la lluvia embarra el campo y crea charcos que se ven, y el césped se gasta primero en las áreas y en el centro.

## Vista y escala
- Vista cenital pura, sin perspectiva.
- Casilla de 64×64 px. Una persona ocupa unos 12×8 px (cuerpo) con cabeza de unos 5 px.
- Los edificios muestran tejado; al pasar el ratón o con zoom cercano, el tejado se desvanece y se ve el interior.

## Reglas de dibujo
- **Contorno:** marrón muy oscuro `#2e2a26`, nunca negro puro. 1,5 px en edificios y campos, 1 px en objetos pequeños y personas.
- **Sombra:** forma plana desplazada 4 px abajo y 4 px a la derecha, en el tono oscuro del suelo sobre el que cae. Sin difuminado ni degradados.
- **Relleno:** colores planos. El volumen se sugiere con líneas internas (hileras de pizarra, juntas de piedra) y con un segundo tono, nunca con degradados.
- **Imperfección con encanto:** calvas de barro, piedras irregulares, charcos de distinto tamaño. Nada perfectamente simétrico salvo las líneas del campo.

## Paleta

| Uso | Colores |
|---|---|
| Césped | `#5f8f3e` base · `#6e9c45` campo · `#476e2c` sombra · `#557f37` variación |
| Barro y caminos | `#7a5a3a` · `#5e4329` profundo |
| Piedra | `#8f9496` · `#6d7275` oscura |
| Pizarra (tejados) | `#4a5560` · `#3b444d` hileras |
| Madera | `#8a5f3c` |
| Suelo interior | `#b9a68a` |
| Suelos construidos | `#9b9385` grava · `#a8aaa5` hormigón · `#dfe3dc` baldosa blanca · `#3e4347` asfalto |
| Carretera | `#eef0ea` línea (cal) · `#6d7275` bordillo (piedra oscura) |
| Agua y charcos | `#7c98a8` · `#a9c2cf` reflejo · `#5f7d8d` borde |
| Árboles | `#3f6630` copa · `#4e7a3a` luz · `#2a4420` contorno |
| Cal y líneas | `#eef0ea` |
| Luz cálida | `#f2c46b` ventanas y focos |
| Lluvia | `#cfdde4` al 55 % de opacidad |
| Contorno | `#2e2a26` |

Los colores del club (camisetas, banderas, gradas) los elige el jugador y no forman parte de esta paleta base.

## Implementación
- La paleta vive en `src/render/palette.ts` y es la única fuente de colores para sprites y efectos.
- El arte se pinta por código con `Graphics` de PixiJS en `src/render/` (skill `pixi-artist`), usando solo colores de esta paleta, y se hornea a texturas en tiempo de carga. No hay sprites SVG ni atlas en disco (decisión del 4-oct-2026).
- Cualquier color nuevo se añade primero aquí y en `palette.ts`.

## Decisiones de la hoja de muestra (1-oct-2026)
Muestra: `assets/src/muestras/muestra-estilo.svg` (se regenera con `node tools/muestras/muestra-estilo.mjs assets/src/muestras/muestra-estilo.svg`).

- **Escala de personas: opción A**, unos 40 px de ancho por persona en una casilla de 64 px (escala "de juego", como Prison Architect). Sustituye a los 12×8 px de "Vista y escala".
- **Pieles, pelo y colores del club:** se aceptan como punto de partida los de la muestra; se pasarán a la paleta en la Fase 1B.
- **Primera aproximación aceptada, pero hace falta más textura y más detalle** (referencia: materiales y salas de Prison Architect):
  - Materiales con más vida: segundo y tercer tono, juntas, vetas y piezas irregulares (madera en tablas desalineadas, baldosas con junta, grava con piedras sueltas). Siguen siendo colores planos, sin degradados.
  - Sombras planas interiores: una franja oscura junto a los muros dentro de las salas y bajo los muebles, para dar profundidad.
  - Objetos reconocibles a primera vista: cada objeto debe tener sus 2-3 detalles característicos (la ducha con plato, grifo y alcachofa; la taquilla con puerta, rejilla y tirador), con contorno y una sombra propia.
- **Botones de menú de construcción** (estilo "plano de obra"): cuadrado de color según la categoría (azul = suelos y materiales, verde = salas operativas, amarillo = ocio y bienestar, naranja = jugadores, rojo = demoler o acciones de riesgo), fondo con rejilla de plano más clara, icono de líneas blancas gruesas, texto debajo con contorno oscuro y botones bloqueados en gris oscuro con el texto apagado.

## Colores de interfaz sobre el mapa
No forman parte del mundo, solo dan feedback al jugador.

| Uso | Color |
|---|---|
| Vista previa válida | `#8fd16a` |
| Vista previa inválida / demoler | `#e0574a` |
| Zona bloqueada (velo de ampliación) | `#2e2a26` a baja opacidad |
| Fondo fuera del mapa | `#1b2a1f` |

## Texturas de suelo (Fase 1B)
- Se generan por código en `src/render/art/floorTextures.ts`, cada una de 128×128 px (2×2 casillas) para que casillas vecinas no sean idénticas.
- Solo usan el color base de cada suelo (`src/content/floors.ts`) y tonos derivados con `shade()` (más claro/más oscuro): nada de colores sueltos.
- Lo que toca un borde se repite en el opuesto: la textura es continua y queda alineada con la rejilla.
- Referencia de aspecto: los materiales de Prison Architect (solo como referencia; no se copian sus imágenes).
- Idea para cuando haya personas: cada suelo modifica la velocidad al caminar (hierba y barro frenan, asfalto y losa aceleran), como en Prison Architect.

## Interfaz: libreta y pestañas (Fase 1B)
- **Letra manuscrita**: Patrick Hand (SIL Open Font License), empaquetada en local con `@fontsource/patrick-hand`. Clase `font-hand`. Para títulos, notas y fichas; los datos densos siguen en la letra normal.
- **Hoja de libreta** (`src/ui/components/NotebookSheet.vue`): papel `#f7efd9`, renglones azules cada 24 px, margen rojo y sombra plana. Para fichas, avisos y (Fase 2) informes. El texto se alinea a los renglones con `leading-6`.
- **Pestañas laterales**: lengüetas en colores pastel con el extremo en bisel; la activa sobresale y tiene el color pleno; el texto se lee de abajo arriba.
- Tokens en `src/style.css` (`@theme`): `--font-hand`, `--color-paper`, `--color-paper-line`, `--color-paper-margin`, `--color-ink`, `--color-ink-blue`.
