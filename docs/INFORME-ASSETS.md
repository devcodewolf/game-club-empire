# Informe de assets visuales de Grassroots

Fecha: 2026-10-02. Informe de solo lectura del estado visual del juego, pensado para diseñar una skill de arte. Todo lo que aquí se llama "asset" es **código de dibujo con `Graphics` de PixiJS** en `src/render/`: casi no hay archivos de arte (solo iconos Tabler y una hoja de muestra SVG). `assets/dist/` está vacío y no existe aún el pipeline SVG → PNG → atlas (pendiente en la Fase 1C de `docs/PLAN.md`).

Resumen rápido:
- 11 suelos, 6 muros, 4 puertas, 27 objetos con pintor propio, 6 gradas, 8 campos, 11 tipos de decorado de entrada, 50 iconos Tabler.
- 0 personas, 0 techos, 0 sprites, 0 atlas.
- 71 colores hexadecimales literales distintos fuera de `palette.ts`; solo 12 coinciden con la guía.

---

## 1. Inventario

Tamaños en casillas (1 casilla = 64 px). "Textura" = tiene patrón repetible (`FillPattern` de 128×128) o no (formas dibujadas).

### 1.1 Suelos (tipo: suelo)

Se pintan en `src/render/floorTextures.ts` (objeto `PAINTERS`, un pintor por `pattern`) y se hornean con `bakePattern` (`textureKit.ts`). Datos (color base y patrón) en `src/content/floors.ts`. Se colocan por trozos en `floorsView.ts`.

| Id | Pintor (`PAINTERS[...]`) | Tamaño | Textura | Color base |
|---|---|---|---|---|
| grass | `grass` | 1×1 (patrón 2×2) | Sí: 14 manchas elípticas + 170 briznas | `#5f8f3e` |
| dirt | `dirt` | 1×1 (patrón 2×2) | Sí: 26 manchas, motas claras y oscuras | `#7a5a3a` |
| gravel | `gravel` | 1×1 (patrón 2×2) | Sí: 520 piedrecitas en 4 tonos | `#9b9385` |
| stoneSlab | `slabs` | 1×1 (patrón 2×2) | Sí: filas de losas de 24-48 px con junta (`drawRowPieces`) | `#8f9496` |
| concrete | `concrete` | 1×1 (patrón 2×2) | Sí: una placa por casilla, motas y 2 grietas | `#a8aaa5` |
| wood | `planks` | 1×1 (patrón 2×2) | Sí: tablas de 40-88 px, vetas y clavos | `#8a5f3c` |
| whiteTile | `tiles` | 1×1 (patrón 2×2) | Sí: baldosas de 16 px con junta y brillo | `#dfe3dc` |
| artificialTurf | `turf` | 1×1 (patrón 2×2) | Sí: franjas de corte + 420 motas | `#4f9a4a` |
| naturalGrass | `lawn` | 1×1 (patrón 2×2) | Sí: franjas + 220 briznas | `#5a9a3a` |
| hybridGrass | `lawn` (mismo pintor, otro color) | 1×1 (patrón 2×2) | Sí | `#64a844` |
| asphalt | `asphalt` | 1×1 (patrón 2×2) | Sí: 260 motas en 3 tonos | `#3e4347` |

### 1.2 Muros, cimientos y puertas (tipos: pared / cimiento / puerta)

Dibujo en `src/render/wallsView.ts` (`drawChunk` → `drawShadow`, `drawWall`, `drawFence`, `drawHedge`, `drawDoor`); texturas de cara y remate en `src/render/wallTextures.ts`. Datos en `src/content/walls.ts` y `doors.ts`.

| Id | Tipo | Función de dibujo | Tamaño | Textura |
|---|---|---|---|---|
| brick (Ladrillo) | pared | `drawWall` + `FACES.brick` | 1×1 por casilla, autotiling | Sí (cara 128×128 + remate 128×128) |
| concrete (Hormigón) | pared | `drawWall` + `FACES.concrete` | 1×1 | Sí |
| plaster (Enlucido) | pared | `drawWall` + `FACES.plaster` | 1×1 | Sí |
| stone (Piedra) | pared | `drawWall` + `FACES.stone` | 1×1 | Sí |
| fence (Valla metálica) | pared baja | `drawFence` (formas propias; la textura de respaldo no se usa) | 1×1 | No (malla de líneas) |
| hedge (Seto) | pared baja / decorado | `drawHedge` (hojas con semilla por casilla) | 1×1 | No (círculos en 2 tonos) |
| Cimientos (suelo interior + perímetro) | cimiento | Sin dibujo propio: es un suelo (hormigón) + muros en el perímetro, pintados por `floorsView.ts` + `wallsView.ts` | por rectángulo | Hereda suelo y muro |
| woodDoor / staffDoor / gate / glassDoor | puerta | `drawDoor` (4 variantes por `def.pattern`: wood, metal, gate, glass) | 1×1, orientada sola con `doorAxis` | No (formas planas con detalle) |

### 1.3 Objetos (tipo: objeto)

Pintores en `src/render/objectArt.ts` (registro `OBJECT_ART`). Cada uno dibuja SIN GIRAR con el frente hacia abajo; la sombra la añade `buildingMarker.ts`. Datos en `src/content/buildings.ts`. Ninguno usa textura de patrón: son formas con contorno.

| Id | Tamaño | Detalle destacado |
|---|---|---|
| locker | 1×1 | techo, puerta con rejilla, tirador |
| changingBench | 3×1 | patas, 2 tablas, toalla |
| shower | 1×1 | plato con juntas, desagüe, alcachofa de 6 agujeros |
| toilet | 1×1 | cisterna, taza, agua |
| sink | 1×1 | pila, grifo, espejo |
| tacticsBoard | 2×1 | pizarra con jugada (círculos, cruces, flecha) |
| officeDesk | 2×1 | monitor, teclado, papeles, taza |
| officeChair | 1×1 | brazos, asiento, respaldo |
| filingCabinet | 1×1 | 3 cajones con tiradores |
| receptionDesk | 3×1 | mostrador, monitor, papel, timbre |
| storageShelf | 2×1 | balda con cajas, balones y conos (al azar con semilla) |
| plant | 1×1 | 7 hojas en círculo, maceta |
| waterCooler | 1×1 | garrafa, brillo, grifo |
| dugout | 5×2 | pared, asientos, cubierta de metacrilato |
| trainingGoal | 3×1 | red con cuadrícula, palos |
| cornerFlag | 1×1 | banderín |
| tree | 2×2 | 6 copas, contorno, sombra interior, luces |
| streetLamp | 1×1 | charco de luz, poste, luminaria |
| bin | 1×1 | contenedor circular |
| parkBench | 2×1 | 3 tablas, patas |
| fountain | 1×1 | borde de piedra, agua |
| physioTable | 2×1 | camilla, toalla, agujero facial |
| weightsBench | 2×2 | banco, barra, discos |
| exerciseBike | 1×2 | rueda, manillar, sillín |
| barCounter | 4×1 | barra, botellas, grifo, vasos |
| cafeTable | 2×2 | mesa redonda, 4 sillas, taza |
| vendingMachine | 1×1 | escaparate con productos |

Todos son `const nombre: ObjectPainter` en `objectArt.ts` con el mismo nombre que el id.

### 1.4 Edificios y campos (tipo: edificio o campo)

| Elemento | Archivo y función | Tamaño | Textura |
|---|---|---|---|
| 8 campos (`pitch11Dirt/Artificial/Natural/Hybrid`, `pitch7...`) | `pitchMarker.ts` · `createPitchMarker` + `drawMarkings` | Fútbol 11: 56×38; fútbol 7: 34×24 | Usa el `FillPattern` del suelo de su superficie; líneas de cal proporcionales al reglamento |
| 6 gradas (`standEarthBank`, `standWoodBenches`, `standMetalSeats`, `standCovered`, `standStadium`, `standGrand`) | `objectArt.ts` · `stand(kind)` | 14×3, 14×4, 20×5, 28×7, 40×10, 56×14 | No: filas, escalones, asientos, cubierta de pizarra con listones |
| Marcador genérico (fallback) | `buildingMarker.ts` · `createBuildingMarker` (rama sin pintor) | cualquiera | No: rectángulo con `markerColor`, flecha frontal, icono Tabler y nombre. **Hoy no lo usa ningún edificio del catálogo** (los 41 tienen pintor o campo) |

### 1.5 Decorado (tipo: decorado)

Todo en `src/render/entranceView.ts` (`drawEntrance` → `drawProp`), dibujado una vez en la capa `scenery` con un único `Graphics`. Datos en `src/content/entrance.ts`.

| `kind` | Función | Tamaño aproximado | Textura |
|---|---|---|---|
| fence (valla perimetral con puerta) | `drawFence` | 1 columna × 160 casillas, hueco de 8 | No (aspas, raíles, postes) |
| booth (garita) | `drawBooth` | 4×3 | No (hileras de pizarra, ventanas) |
| barrier (barrera) | `drawBarrier` | 1×4 | No (franjas rojo y cal) |
| tree (roble) | `drawTree` | 2×2 | No (7 copas) |
| lamp (farola) | `drawLamp` | 1×1 | No |
| planter (jardinera) | `drawPlanter` | 2×1 | No (14 flores con semilla) |
| parkingBays + coches | `drawParkingBays`, `drawCar` | 16×5 por hilera | No |
| loadingBays + camión | `drawLoadingBays`, `drawTruck` | 14×6 | No |
| warehouse (nave) | `drawWarehouse` | 16×8 | No (chapa ondulada, claraboyas, muelles) |
| laneMarkings | `drawLaneMarkings` | 46×8 | No |
| label | `createLabel` (Text) | texto | Texto Trebuchet MS |

Además: carretera (`roadView.ts` · `drawRoad`: acera, asfalto, bordillos, línea central discontinua, prolongada 40 casillas fuera del mapa), césped de fondo (`drawGround`, `TilingSprite` de la textura `grass`), rejilla (`drawGridLines`) y zonas de ampliación bloqueadas (`expansionsView.ts`: velo, borde discontinuo, candado).

### 1.6 Efectos (tipo: efecto)

| Efecto | Archivo y función | Notas |
|---|---|---|
| Andamio | `effects.ts` · `createScaffold` | postes de madera, riostras, lona translúcida (`chalk` alfa 0,18) |
| Aparición con rebote | `effects.ts` · `playBuild` | GSAP `back.out(3)` |
| Nube de polvo | `effects.ts` · `dustPuff` | círculos `#d8cdb8` con brillo; usa `Math.random()` (no determinista) |
| Derribo | `effects.ts` · `playDemolish` | hunde y desvanece |
| Vista previa de herramienta | `toolPreview.ts` · `drawRect`, fantasma alfa 0,6 | verde `#8fd16a` / rojo `#e0574a`, borde de 3 px de pantalla |
| Sombra de muros e interior | `wallsView.ts` · `drawShadow` | plana, alfa 0,05-0,3 |

### 1.7 Interfaz (tipo: interfaz)

| Elemento | Archivo | Notas |
|---|---|---|
| Rótulos de sala pintados en el suelo | `roomsView.ts` | `Text` Trebuchet MS bold, color `outline` alfa 0,22; aviso con triángulo y texto `#b03a2e` |
| Nombre del edificio (marcador genérico) | `buildingMarker.ts` | `Text` 13 px con trazo de 3 px |
| Candado de ampliación | `expansionsView.ts` | círculo `slate`, emoji "🔒" y rótulo |
| Libreta (ficha de sala, avisos) | `src/ui/components/NotebookSheet.vue`, `NoticeToasts.vue`, `src/ui/room-panel/` | papel `#f7efd9`, renglones azules cada 24 px, letra Patrick Hand |
| Pestañas laterales | `src/ui/build-menu/CategoryBar.vue`, `CategoryPanel.vue` | pasteles con bisel, la activa sobresale |
| Botones "plano de obra" | `src/ui/components/BlueprintButton.vue`, `blueprint.ts` (54 px) | 5 colores por categoría, rejilla con `linear-gradient`, icono blanco, candado si bloqueado |
| Tokens de tema | `src/style.css` (`@theme`) | `--font-hand`, `--color-paper`, `--color-paper-line`, `--color-paper-margin`, `--color-ink`, `--color-ink-blue` |

### 1.8 Iconos (tipo: icono)

50 iconos de línea de Tabler (`@tabler/icons`, estilo `outline`), registrados dos veces: `src/render/iconTextures.ts` (texturas Pixi para el mapa) y `src/ui/icons.ts` (componentes Vue). Nombres válidos en `src/content/icons.ts` (`ICON_NAMES`). Origen 24 px, rasterizado a 96 px.

### 1.9 Otros

| Elemento | Archivo | Notas |
|---|---|---|
| Hoja de muestra de estilo (único SVG de arte propio) | `assets/src/muestras/muestra-estilo.svg` (58 KB, 18×12 casillas), generada por `tools/muestras/muestra-estilo.mjs` | Vestuario (tejado e interior), campo, robles, charcos, muro de piedra seca, banquillo y **figuritas de persona** (símbolo `#persona`). Es referencia visual: el juego no la carga |

### 1.10 Lo que falta

- **Personas**: no existen en el juego. Solo hay un símbolo SVG `#persona` en la hoja de muestra (cuerpo en campana + cabeza + pelo, ~40 px en una casilla de 64 px, decisión "opción A"). La capa `people` existe, vacía, en `LAYER_ORDER`.
- **Techos y edificios con interior**: no hay techo que se desvanezca. Las salas son muros + suelo + objetos. "Tejado" solo aparece en la garita y la nave de la entrada.
- **Vehículos**: solo coche y camión estáticos del decorado de la entrada.
- **Atlas, sprites, pipeline** de exportación: `tools/` solo contiene `muestras/`; `assets/dist/` está vacío. `docs/ASSETS-LICENSES.md` tampoco existe, aunque CLAUDE.md pide registrar ahí cada asset.
- **Mundo vivo**: no hay ciclo día/noche, focos, banderas ni árboles con movimiento, lluvia ni charcos (la guía los describe; el código no).
- **Colores del club** como parámetro (ver sección 4).
- **Desgaste del campo** (calvas, charcos): el campo es plano.

---

## 2. Cómo están hechos

### 2.1 Técnicas de textura

- **`FillPattern` de 128×128.** `bakePattern` (`textureKit.ts`) crea un `Graphics`, lo pinta, lo convierte con `renderer.generateTexture({ target, frame: Rectangle(0,0,128,128), antialias: true })` y lo envuelve en `new FillPattern({ texture, repetition: 'repeat', textureSpace: 'global' })`. `PATTERN = TILE_SIZE * 2 = 128`: cada textura cubre 2×2 casillas para que casillas vecinas no sean idénticas. Con `textureSpace: 'global'` el patrón queda alineado con la rejilla del mundo.
- **Arreglo para Pixi 8.21**: tras crear el patrón se llama `texture.source.style.update()`; sin esto la GPU se queda en `clamp-to-edge` y el suelo se ve liso fuera de los primeros 128 px.
- **PRNG sembrado.** `random.ts` (mulberry32) + `seedFromText(id)`: la semilla es el id del suelo (`grass`) o `"<muro>:face"` / `"<muro>:cap"`. Mismo dibujo en cada recarga. Los pintores de objetos reciben un `Random` sembrado con `def.id`. El decorado de entrada usa `createRandom(1987)`. El seto usa un hash de la casilla (`x*73856093 ^ y*19349663`). **Excepción**: `effects.ts` usa `Math.random()`.
- **Formas repetidas**: briznas (líneas de 1-1,2 px con inclinación), manchas (`ellipse`), piedrecitas (`ellipse` pequeñas con `rnd.pick(tones)`), baldosas y bloques (`rect` con margen de 1 px sobre fondo del color de la junta).
- **Motas** (`speckles`): círculos de 0,35-2 px en uno o varios tonos; en tierra, hormigón, asfalto, césped artificial, remates de muro y enlucido.
- **Piezas desalineadas** (`drawRowPieces`): cada fila empieza en un desplazamiento al azar, las piezas tienen largo aleatorio dentro de `[min, max]` y suman exactamente 128 px; la pieza que se sale por la derecha se vuelve a dibujar a la izquierda con la misma semilla (mismo tono y detalles). Se usa en losas, tablas, ladrillos, bloques de hormigón y piedra.
- **Sin costuras (wrapping).** Todo lo que toca un borde se repite en el opuesto: `wrapped(x, y, margin, draw)` duplica el trazo en x/y ± 128 si queda cerca del borde. El hormigón se divide por casilla (2×2 placas), el césped usa franjas de 32 px, las baldosas encajan en 128/16.
- **Tono en vez de color nuevo.** Cada textura recibe un color base y deriva segundo y tercer tono con `shade(base, ±n)` (99 llamadas en `render` y `content`).
- **Texturas de muro**: cara (`FACES[pattern]`) y remate (`paintCap`) por muro. La cara lateral reutiliza la textura girada 90°: `new FillPattern(...)` + `side.setTransform(new Matrix().rotate(Math.PI / 2))`.
- **Sin textura (formas directas)**: valla, seto, objetos, entrada y campos se dibujan con formas, no con patrón.

### 2.2 Degradados, filtros, opacidades, sombras y texto

| Recurso | ¿Se usa? | Detalle |
|---|---|---|
| Degradados (`FillGradient`) | **No** | Cumple la guía. En la UI Vue sí hay `linear-gradient` (rejilla de los botones y renglones de la libreta), nunca en el mapa |
| Filtros de Pixi (`filters`) | **No** | Ninguno en `src/render/`. Solo la hoja de muestra SVG usa `feFlood`/`feOffset` para la sombra |
| Blend modes | **No** | `blendMode` nunca se toca |
| Opacidad | **Sí, mucho** | Sombras `outline` a alfa 0,12-0,4; sombra de muros 0,16-0,3; sombras interiores 0,22/0,12/0,05; cristal 0,35-0,85; rótulo de sala 0,22; fantasma de construcción 0,6; velo de ampliación 0,25; tinte `chalk` sobre muro 0,06 |
| Sombras dibujadas | **Sí, planas, sin difuminado** | Objetos: `roundRect` `outline` alfa 0,28 desplazado 4 px, sin girar (`createArtMarker`). Muros: franja exterior abajo (16 px) y derecha (11 px) + 3 franjas interiores escalonadas. Entrada: `rect` desplazado 4 px (8 px en edificios grandes), alfa 0,25-0,4. Árboles de la entrada: copas en `grassShadow` desplazadas 12 px. Campos: rectángulo `grassShadow` desplazado 4 px |
| Texto | **Sí, con `Text`, nunca `BitmapText`** | Trebuchet MS bold, `resolution: 2`: rótulos de sala (20-96 px), nombre en marcador genérico (13 px), tamaño del arrastre (18 px), rótulos de la entrada (20-34 px), candado (emoji). Trazo oscuro de 3-6 px alrededor. En la UI Vue la fuente es Patrick Hand |
| Tintes | Solo en iconos | `Sprite.tint = palette.outline` para la sombra del icono (ver sección 4) |

### 2.3 Contornos en la práctica

La guía dice `#2e2a26`, 1,5 px en edificios y campos, 1 px en objetos pequeños y personas. En el código:

| Dónde | Grosor real | Color |
|---|---|---|
| Caja principal de objetos (`box()`, `LINE`) | **1,5 px** | `#2e2a26` |
| Detalles de objetos (patas, grifos, tiradores) | **0,8 px o 1 px** (de los `stroke` en `render`: 49 usos de `width: 1`, 16 de `0.8`, 10 de `1.5`, 7 de `2`) | `#2e2a26` |
| Campos (`pitchMarker.ts`) | 1,5 px (`alignment: 1` = interior) | `#2e2a26` |
| Marcador genérico | 1,5 px cuerpo; 1 px borde interior (alfa 0,25) y flecha | `#2e2a26` |
| Muros (`wallsView.ts`, `OUTLINE`) | **2,5 px**, solo en lados expuestos (rects, no `stroke`) | `#2e2a26` |
| Edificios y vallas de la entrada | 1,5 px (`OUTLINE`) y 1 px en detalles | `#2e2a26` |
| Puertas | hoja 1,5 px, jambas 1 px, tirador 0,8 px | `#2e2a26` |
| Poste de valla (`drawFence` de muros) | 1,5 px | `#2e2a26` |
| Árbol, seto y hojas de `plant` | contorno por círculo más grande (+2 px en árboles, +1,5 px en seto) o 1 px (`plant`) | `#2a4420` (`treeOutline`), no `outline` |
| Cuadrícula | 1 px de pantalla (`pixelLine`), alfa 0,28; borde exterior 2 px | `#2e2a26` |
| Líneas de cal | 5 px (`LINE`), alfa 0,95; palos de portería 5+3 px | `#eef0ea` / `#2e2a26` |

Conclusión: el contorno va de 0,8 a 2,5 px. El muro grueso (2,5 px) es deliberado (imita el trazo de Prison Architect), pero queda casi el doble de grueso que el de un mueble.

### 2.4 Repetición sin costuras y conexión de paredes

- **Suelos**: sin costuras (ver 2.1). Se pintan por trozos de 16×16 casillas, uniendo en un solo rectángulo las casillas iguales de una fila. La hierba base es un `TilingSprite` que cubre todo el mapa.
- **Paredes (autotiling)**: por cada casilla de muro `linksOf` calcula 4 conexiones (`n,e,s,w` = hay muro o puerta vecinos) y 4 flags de interior (`indoorN/E/S/W`). `drawWall` ajusta cada cara según los vecinos:
  - **Remate** (arriba, claro, `textures.cap`) más estrecho que la casilla donde se ve cara.
  - **Fachada** de 26 px (`FACE_DEPTH`) abajo si no hay muro debajo.
  - **Cara lateral** de 18 px (`SIDE_FACE`) en el lado exterior de un muro vertical; por el interior solo un canto de 6 px (`INNER_EDGE`) oscurecido (alfa 0,45) con un filo de `shade(face, -0,45)`.
  - **Inglete a 45°**: las caras laterales son trapecios (`g.poly`) que se cortan en diagonal con la fachada.
  - **Contorno**: rects de 2,5 px solo en lados sin vecino.
  - **Pie oscuro**: franja de 3 px, alfa 0,35, donde la fachada toca el suelo.
  - Esquinas, T y cruces salen solos de las 4 conexiones.
- **Sombra interior**: `INDOOR_SHADE` = franjas de 10, 10 y 12 px con alfa 0,22 / 0,12 / 0,05, con más fuerza bajo el muro de arriba (`strength` 1 sur, 0,8 este y oeste, 0,5 norte). Es un escalonado plano que simula degradado sin usarlo.
- **Sombra exterior**: franja de 16 px (muros altos) u 8 px (valla/seto) hacia abajo y ~70 % de ese largo hacia la derecha.
- **Puertas**: `doorAxis` da la orientación; jambas del color del remate del muro vecino (`jambWall`), hoja de 12 px, umbral oscuro, tirador `warmLight`.
- **Valla y seto**: se dibujan conectados: paneles hacia cada vecino y un poste por casilla (valla); núcleo redondeado con brazos rectos hacia los vecinos (seto).
- **Redibujado**: trozos de 16×16 casillas, `cullable = true` con `cullArea` ampliado 1 casilla (por las sombras). Solo se redibujan los trozos tocados y sus vecinos.

---

## 3. Colores

Método: recuento de literales `0xRRGGBB` en `src/render/*.ts` (sin tests ni `palette.ts`) y `src/content/*.ts`, más usos por nombre `palette.x` en los mismos archivos (excluidos `palette.ts` y tests). **Derivado** = el color final se calcula con `shade(base, n)` y no se enumera (99 llamadas).

### 3.1 Paleta (`palette.ts`) y usos por nombre

Todos los colores de `palette.ts` están en `docs/GUIA-ESTILO.md`. La guía lista además `#9b9385`, `#a8aaa5`, `#dfe3dc` y `#3e4347` (suelos construidos, viven en `content/floors.ts`) y `#cfdde4` (lluvia, sin uso en código).

| Nombre `palette.x` | Hex | Usos por nombre | En la guía |
|---|---|---|---|
| grass | `#5f8f3e` | 0 | Sí |
| grassPitch | `#6e9c45` | 0 | Sí |
| grassShadow | `#476e2c` | 3 | Sí |
| grassVariation | `#557f37` | 1 | Sí |
| mud | `#7a5a3a` | 0 | Sí |
| mudDeep | `#5e4329` | 2 | Sí |
| stone | `#8f9496` | 18 | Sí |
| stoneDark | `#6d7275` | 12 | Sí |
| slate | `#4a5560` | 4 | Sí |
| slateRows | `#3b444d` | 3 | Sí |
| wood | `#8a5f3c` | 6 | Sí |
| floor | `#b9a68a` | 0 | Sí |
| water | `#7c98a8` | 2 | Sí |
| waterShine | `#a9c2cf` | 4 | Sí |
| waterEdge | `#5f7d8d` | 0 | Sí |
| tree | `#3f6630` | 5 | Sí |
| treeLight | `#4e7a3a` | 6 | Sí |
| treeOutline | `#2a4420` | 4 | Sí |
| chalk | `#eef0ea` | 41 | Sí |
| warmLight | `#f2c46b` | 18 | Sí |
| outline | `#2e2a26` | 63 | Sí |
| background | `#1b2a1f` | 1 | Sí |
| previewValid | `#8fd16a` | 7 | Sí |
| previewInvalid | `#e0574a` | 20 | Sí |
| lockedVeil | `#2e2a26` | 1 | Sí |


### 3.2 Literales hexadecimales fuera de `palette.ts`

Literales distintos: **71**. En la guía: **12**. Fuera de la guía y de la paleta: **59**. Columnas: color, usos literales, archivos donde aparece, si está en la guía.

| Color | Usos | Archivos | En la guía |
|---|---|---|---|
| `#2f3540` | 6 | objectArt.ts | No |
| `#3f6fa8` | 5 | entranceView.ts, objectArt.ts | No |
| `#3f6630` | 4 | objectArt.ts, walls.ts | Sí |
| `#557f37` | 4 | entranceView.ts, objectArt.ts | Sí |
| `#8c2f39` | 4 | entranceView.ts, objectArt.ts, rooms.ts | No |
| `#b5643c` | 4 | objectArt.ts, buildings.ts, rooms.ts, walls.ts | No |
| `#8f9496` | 3 | floors.ts, walls.ts | Sí |
| `#9a6b3f` | 3 | buildings.ts | No |
| `#9b9385` | 3 | buildings.ts, floors.ts, rooms.ts | Sí |
| `#b5523b` | 3 | entranceView.ts, buildings.ts | No |
| `#c9d6dc` | 3 | objectArt.ts | No |
| `#d9a441` | 3 | buildings.ts, doors.ts, rooms.ts | No |
| `#3e4347` | 2 | entranceView.ts, floors.ts | Sí |
| `#4f9a4a` | 2 | buildings.ts, floors.ts | No |
| `#5a7a96` | 2 | objectArt.ts | No |
| `#5a9a3a` | 2 | buildings.ts, floors.ts | No |
| `#5b8fb9` | 2 | buildings.ts, rooms.ts | No |
| `#64a844` | 2 | buildings.ts, floors.ts | No |
| `#6d7275` | 2 | doors.ts, walls.ts | Sí |
| `#7a5a3a` | 2 | buildings.ts, floors.ts | Sí |
| `#8a5f3c` | 2 | buildings.ts, floors.ts | Sí |
| `#c9a227` | 2 | buildings.ts, rooms.ts | No |
| `#d8d4c8` | 2 | buildings.ts, walls.ts | No |
| `#d8e4ea` | 2 | objectArt.ts | No |
| `#dfe3dc` | 2 | buildings.ts, floors.ts | Sí |
| `#2f5124` | 1 | walls.ts | No |
| `#3e4a5a` | 1 | objectArt.ts | No |
| `#3f4a56` | 1 | buildings.ts | No |
| `#3f5a48` | 1 | buildings.ts | No |
| `#3f7a35` | 1 | buildings.ts | No |
| `#4a5058` | 1 | buildings.ts | No |
| `#4a5260` | 1 | objectArt.ts | No |
| `#4f8a3c` | 1 | buildings.ts | No |
| `#56606a` | 1 | buildings.ts | No |
| `#5aa39a` | 1 | objectArt.ts | No |
| `#5d6872` | 1 | objectArt.ts | No |
| `#5f6b62` | 1 | buildings.ts | No |
| `#5f8f3e` | 1 | floors.ts | Sí |
| `#6a4428` | 1 | objectArt.ts | No |
| `#6a7480` | 1 | buildings.ts | No |
| `#6b7f8f` | 1 | objectArt.ts | No |
| `#6f8fa8` | 1 | buildings.ts | No |
| `#6fb0d0` | 1 | buildings.ts | No |
| `#6fb3a0` | 1 | rooms.ts | No |
| `#7a4f2e` | 1 | buildings.ts | No |
| `#7d3a2b` | 1 | buildings.ts | No |
| `#7d8790` | 1 | buildings.ts | No |
| `#7fb7d6` | 1 | buildings.ts | No |
| `#8a6a48` | 1 | buildings.ts | No |
| `#8a8378` | 1 | walls.ts | No |
| `#8a96a3` | 1 | objectArt.ts | No |
| `#8b9298` | 1 | buildings.ts | No |
| `#8f979c` | 1 | objectArt.ts | No |
| `#a04632` | 1 | buildings.ts | No |
| `#a8aaa5` | 1 | floors.ts | Sí |
| `#a9c2cf` | 1 | doors.ts | Sí |
| `#b03a2e` | 1 | roomsView.ts | No |
| `#b98a55` | 1 | objectArt.ts | No |
| `#b9b4a8` | 1 | walls.ts | No |
| `#c5d3d8` | 1 | buildings.ts | No |
| `#c98b3c` | 1 | doors.ts | No |
| `#c9cbc6` | 1 | walls.ts | No |
| `#d8cdb8` | 1 | effects.ts | No |
| `#d9706a` | 1 | entranceView.ts | No |
| `#d9a21b` | 1 | buildings.ts | No |
| `#d9d9d4` | 1 | objectArt.ts | No |
| `#e08a3c` | 1 | objectArt.ts | No |
| `#e6dccb` | 1 | walls.ts | No |
| `#e8e8e0` | 1 | buildings.ts | No |
| `#f1efe8` | 1 | walls.ts | No |
| `#f2f2ee` | 1 | objectArt.ts | No |


### 3.3 Colores de la interfaz Vue (`src/ui`, `src/style.css`)

Unos 35 hex distintos. Botones "plano de obra" (`BlueprintButton.vue`, fondo y borde): azul `#2f62a8`/`#22477a`, verde `#3f8f3a`/`#2b6328`, amarillo `#c9a227`/`#8f7219`, naranja `#c46a2a`/`#8c4a1c`, rojo `#b0372d`/`#7c241d`; bloqueado `#2b2d30`, borde `#1f2124`, texto `#6f7378`; contorno de rótulo `#1d1a17` (8 usos). Pestañas pastel (`CategoryPanel.vue`): `#b9b4e6`, `#f2b38a`, `#9fdcae`, `#f2dc8a`, `#9ccbe8`, `#f0a8b8`, `#c6dc8f`. Libreta y tokens (`style.css`): `#f7efd9` papel, `#a9c2cf` renglón, `#e08a8a` margen, `#2e2a26` tinta, `#2f4f7a` tinta azul, `#14171c` fondo. La guía solo describe estos colores con palabras ("azul, verde, amarillo, naranja, rojo"), sin hex; los 5 de categoría y los pasteles no están en la paleta.

### 3.4 Lectura

- `palette.ts` está bien usada: `outline` (63 usos), `chalk` (41), `previewInvalid` (20), `stone` (18) y `warmLight` (18). No se usan nunca por nombre: `grass`, `grassPitch`, `mud`, `floor`, `waterEdge` (hierba y barro solo entran vía el literal de `content/floors.ts`).
- **`palette.ts` afirma que "ningún color del canvas se escribe fuera de aquí", pero no se cumple**: `objectArt.ts` define unos 20 colores propios (`#6b7f8f`, `#2f3540`, `#8a96a3`...), `entranceView.ts` otros 4-5, `roomsView.ts` el aviso `#b03a2e` y `content/buildings.ts` unos 40 `markerColor`.
- Los `markerColor` de `buildings.ts` ya casi no se ven: todos los objetos tienen pintor propio. Solo cuentan como respaldo del suelo del campo. Son literales muertos que parecen paleta oficial.
- Colores "de club" sueltos: `0x8c2f39` (rojo) y `0x3f6fa8` (azul) están en objetos, entrada y salas; no hay mecanismo de teñido.

---

## 4. Cómo se cargan y pintan en el juego

- **Tamaño de casilla**: `TILE_SIZE = 64` (`src/render/grid.ts`). Mapa de 240×160 casillas = 15.360×10.240 px de mundo. Zoom inicial ×0,5 (32 px por casilla en pantalla).
- **Iconos SVG**: `iconTextures.ts` importa cada SVG con `?raw`, sustituye `currentColor` por `#ffffff` y lo carga con `Assets.load({ src: 'data:image/svg+xml;charset=utf8,...', parser: 'svg', data: { resolution: 4 } })`. Es el modo **textura** (rasteriza el navegador a 4×: 96 px para un icono de 24; el modo vectorial de Pixi no respeta las puntas redondeadas). El color final se da con `sprite.tint`: hoy solo la sombra del icono (`outline`, alfa 0,6, desplazada 1,5 px); el icono va en blanco.
- **Atlas**: **no hay**. `renderAssets.ts` comenta que "en la Fase 1C se añadirán aquí los atlas". `assets/dist/` vacío. No hay cargador de atlas con fallback (pendiente en el plan).
- **Qué se hornea**: suelos y muros (`generateTexture` + `FillPattern`) al montar el renderer: 11 + 6×2 = 23 texturas de 128×128. Todo lo demás se vuelve a dibujar con `Graphics` cada vez que se crea un marcador (sin caché de marcadores ni `cacheAsTexture`).
- **Capas** (`LAYER_ORDER`, de abajo a arriba): `ground`, `floors`, `road`, `grid`, `scenery`, `roomLabels`, `structures`, `outside`, `buildings`, `people`, `effects`, `overlay`. Todas cuelgan de `world`, único contenedor al que se aplica la cámara.
- **Dibujo por trozos y culling**: suelos y muros se pintan en `Graphics` de 16×16 casillas (`CHUNK = 16`), `cullable = true` con `cullArea` y `CullerPlugin` registrado. Los edificios son un `Container` por objeto (sin culling propio). La entrada es un único `Graphics` grande (sin culling).
- **Sombras automáticas**: **no hay un sistema**. Cada pintor o vista dibuja la suya: objetos (automática para todo pintor de `OBJECT_ART` en `createArtMarker`), muros (`drawShadow`), campos, entrada. No hay filtro ni capa de sombras.
- **Techos que se desvanecen**: **no existen**. Ni techo ni interacción de ratón/zoom que lo oculte.
- **Colores del club teñidos**: **no existen**. `Sprite.tint` solo se usa en el icono. Los rojos y azules del club están fijos (`C.clubRed = 0x8c2f39`, `C.clubBlue = 0x3f6fa8`).
- **Rotación**: el pintor dibuja sin girar y `createArtMarker` gira el `Graphics` `rotation * π/2` alrededor del centro; la sombra no se gira.
- **Animación**: `effects.ts` con GSAP (andamio, rebote, polvo, derribo); respeta `prefers-reduced-motion`.
- **Resolución**: canvas con `antialias: true`, `autoDensity: true`, `resolution: devicePixelRatio`. Texto con `resolution: 2`. Texturas hornead a resolución 1 con `antialias: true`.

---

## 5. Convenciones actuales

- **Nombres**: archivos de render en camelCase (`floorTextures.ts`, `wallsView.ts`, `objectArt.ts`); funciones `createXxx` (crea y devuelve un objeto con `destroy`), `drawXxx` (dibuja sobre un `Graphics`), `paintXxx`. Ids de contenido en camelCase (`stoneSlab`, `standEarthBank`). Comentarios y textos en español.
- **Carpetas**:
  - `src/render/`: todo el arte por código.
  - `src/content/`: datos tipados con `defineXxx(...)` (identidad que valida clave = id y conserva literales): `floors.ts`, `walls.ts`, `doors.ts`, `buildings.ts`, `entrance.ts`, `rooms.ts`, `icons.ts`, `buildMenu.ts`.
  - `assets/src/muestras/` (solo la hoja de muestra), `assets/dist/` (vacío), `tools/muestras/muestra-estilo.mjs` (único script).
  - `docs/GUIA-ESTILO.md`, `docs/PLAN.md`. `docs/ASSETS-LICENSES.md` no existe todavía.
- **Arte a mano o generado**: se escribe a mano en TypeScript (coordenadas en px como literales) y se genera en ejecución con `Graphics`. Solo la hoja de muestra es SVG generado por script, y el juego no la usa.
- **Cómo se registra un objeto nuevo**:
  1. **Contenido**: entrada en `BUILDINGS` de `src/content/buildings.ts` (`id`, `name`, `size` en casillas sin girar, `cost`, `markerColor`, `icon` de `IconName`; opcionales `symmetric`, `capacity`, `requires`).
  2. **Pintor**: `const miObjeto: ObjectPainter = (g, w, h, rnd) => { ... }` en `src/render/objectArt.ts` (sin girar, frente hacia abajo, (0,0) arriba a la izquierda, (w,h) = tamaño en px) y añadirlo al registro `OBJECT_ART` con el **mismo id** que en `BUILDINGS`.
  3. **Menú**: añadirlo a `src/content/buildMenu.ts` (y a `rooms.ts` si es requisito de una sala). Sin pintor propio cae al marcador genérico (rectángulo + icono + nombre).
- **Helpers del código de dibujo**: `box(g, x, y, w, h, color, radius)` (caja con contorno y brillo superior), `line(...)`; colores propios en un objeto `C`; `O = palette.outline`; `LINE = 1.5`.
- **Suelo nuevo**: entrada en `FLOORS` y, si el patrón es nuevo, función en `PAINTERS` (tipo `FloorPattern` en `src/sim/floors`). **Muro nuevo**: entrada en `WALLS` + función en `FACES` (`WallPattern` en `src/sim/structureTypes`).

---

## 6. Ejemplos (código completo)

### 6.1 Suelo con textura: `planks` (madera) y el helper `drawRowPieces`

De `src/render/floorTextures.ts`:

```ts
  /** Madera: tablas horizontales de largo variable, desalineadas, con vetas. */
  planks(g, base, rnd) {
    const rowHeight = TILE_SIZE / 4
    const joint = shade(base, -0.4)
    g.rect(0, 0, PATTERN, PATTERN).fill(joint)
    for (let row = 0; row < PATTERN / rowHeight; row++) {
      drawRowPieces(rnd, row * rowHeight, rowHeight, [40, 88], (x, y, w, h, piece) => {
        const tone = shade(base, piece.range(-0.1, 0.08))
        g.rect(x + 0.75, y + 0.75, w - 1.5, h - 1.5).fill(tone)
        // Vetas
        for (let v = 0; v < 2; v++) {
          const vy = y + piece.range(4, h - 4)
          g.moveTo(x + 3, vy)
            .lineTo(x + w * piece.range(0.3, 0.9), vy + piece.range(-1, 1))
            .stroke({ color: shade(tone, -0.12), width: 0.8 })
        }
        // Clavos en los extremos
        g.circle(x + 3, y + h / 2, 0.9).fill(joint)
      })
    }
  },
```

Helper de `src/render/textureKit.ts` (desalinea las tablas y hace la fila continua al repetirse):

```ts
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
```

### 6.2 Pared: `drawWall` de `src/render/wallsView.ts`

Constantes que usa (mismo archivo):

```ts
const T = TILE_SIZE
const CHUNK = 16
/** Alto de la fachada (cara de abajo) cuando no hay muro debajo. */
const FACE_DEPTH = 26
/** Cara lateral visible en el lado EXTERIOR de un muro vertical. */
const SIDE_FACE = 18
/** Canto en sombra en el lado INTERIOR de un muro vertical. */
const INNER_EDGE = 6
/** Grosor del contorno exterior (como el trazo negro de Prison Architect). */
const OUTLINE = 2.5
const SHADOW_LENGTH = 16
const SHADOW_OFFSET = 4
/** Sombra interior junto a las paredes: franjas escalonadas (px, opacidad). */
const INDOOR_SHADE: ReadonlyArray<readonly [number, number]> = [
  [10, 0.22],
  [10, 0.12],
  [12, 0.05],
]
```

```ts
/**
 * Muro con volumen estilo Prison Architect. Por casilla:
 *  - remate (arriba, claro) más estrecho que la casilla;
 *  - fachada abajo (hiladas horizontales) si no hay muro debajo;
 *  - cara lateral (hiladas verticales) en el lado EXTERIOR de los muros
 *    verticales; por el lado interior, solo un filo oscuro;
 *  - las caras se unen en diagonal (inglete a 45°) en las esquinas;
 *  - contorno grueso por fuera.
 */
function drawWall(
  g: Graphics,
  tile: TileCoord,
  links: Links,
  def: WallDef,
  textures: WallTextures,
): void {
  if (def.pattern === 'fence') return drawFence(g, tile, links, def)
  if (def.pattern === 'hedge') return drawHedge(g, tile, links, def)

  const x = tile.x * T
  const y = tile.y * T

  // Anchura de cada cara según lo que haya al otro lado
  const top = links.n ? 0 : OUTLINE
  const faceS = links.s ? 0 : FACE_DEPTH
  const faceW = links.w ? 0 : links.indoorW ? INNER_EDGE : SIDE_FACE
  const faceE = links.e ? 0 : links.indoorE ? INNER_EDGE : SIDE_FACE

  const capL = x + faceW
  const capR = x + T - faceE
  const capT = y + top
  const capB = y + T - faceS

  const faceFill = textures.face(def.id) ?? def.faceColor
  const sideFill = textures.side(def.id) ?? def.faceColor
  const darkEdge = shade(def.faceColor, -0.45)

  // Caras laterales (trapecios: se cortan en diagonal con la fachada de abajo)
  if (faceW > 0) {
    const west = [x, y, capL, capT, capL, capB, x, y + T]
    g.poly(west).fill(sideFill)
    if (faceW === INNER_EDGE) {
      g.poly(west).fill({ color: palette.outline, alpha: 0.45 })
      g.rect(capL - 1.5, capT, 1.5, capB - capT).fill(darkEdge)
    } else {
      // La cara que mira a la izquierda recibe algo más de luz
      g.poly(west).fill({ color: palette.chalk, alpha: 0.06 })
    }
  }
  if (faceE > 0) {
    const east = [x + T, y, capR, capT, capR, capB, x + T, y + T]
    g.poly(east).fill(sideFill)
    g.poly(east).fill({ color: palette.outline, alpha: faceE === INNER_EDGE ? 0.45 : 0.12 })
  }
  // Fachada de abajo
  if (faceS > 0) {
    g.poly([x, y + T, capL, capB, capR, capB, x + T, y + T]).fill(faceFill)
    // Pie oscuro donde el muro toca el suelo
    g.rect(x, y + T - 3, T, 3).fill({ color: palette.outline, alpha: 0.35 })
  }

  // Remate
  g.rect(capL, capT, capR - capL, capB - capT).fill(textures.cap(def.id) ?? def.capColor)
  const capEdge = shade(def.capColor, -0.3)
  if (faceS > 0) g.rect(capL, capB - 1.5, capR - capL, 1.5).fill(capEdge)
  if (faceW > 0) g.rect(capL, capT, 1.5, capB - capT).fill(capEdge)
  if (faceE > 0) g.rect(capR - 1.5, capT, 1.5, capB - capT).fill(capEdge)
  if (!links.n) g.rect(capL, capT, capR - capL, 1.5).fill(shade(def.capColor, 0.3))

  // Contorno exterior grueso solo en los lados expuestos
  const outline = palette.outline
  if (!links.n) g.rect(x, y, T, OUTLINE).fill(outline)
  if (!links.s) g.rect(x, y + T - OUTLINE, T, OUTLINE).fill(outline)
  if (!links.w) g.rect(x, y, OUTLINE, T).fill(outline)
  if (!links.e) g.rect(x + T - OUTLINE, y, OUTLINE, T).fill(outline)
}
```

### 6.3 Objeto más detallado: `stand()` (gradas) y `storageShelf`

`stand()` es el pintor más largo y parametrizado (6 gradas con un solo código). De `src/render/objectArt.ts`:

```ts
/** Grada: filas paralelas al frente (abajo), con estilo según el tipo. */
function stand(kind: 'earth' | 'wood' | 'seats' | 'covered' | 'stadium' | 'grand'): ObjectPainter {
  return (g, w, h) => {
    const rows = Math.max(2, Math.floor(h / 22))
    const rowH = (h - 8) / rows
    // Base: talud de hierba, hormigón o estructura
    const base = kind === 'earth' ? palette.grassVariation : palette.stone
    box(g, 2, 2, w - 4, h - 4, base, 3)
    for (let r = 0; r < rows; r++) {
      const y = 4 + r * rowH
      // Escalón: borde de sombra en cada fila
      g.rect(4, y + rowH - 3, w - 8, 3).fill({ color: O, alpha: kind === 'earth' ? 0.2 : 0.3 })
      if (kind === 'earth') continue
      if (kind === 'wood') {
        g.rect(6, y + 4, w - 12, rowH - 9)
          .fill(C.woodLight)
          .stroke({ color: O, width: 1 })
        continue
      }
      // Asientos individuales con los colores del club
      const seatW = 12
      for (let x = 8; x + seatW < w - 8; x += seatW + 3) {
        const aisle = Math.floor((x - 8) / (seatW + 3)) % 12 === 11
        if (aisle) continue
        g.roundRect(x, y + 4, seatW, rowH - 9, 2).fill(
          r % 2 === 0 ? C.clubRed : shade(C.clubRed, 0.15),
        )
      }
    }
    // Cubierta: tribuna (mitad trasera), estadio (2/3) o gran tribuna (casi entera)
    const roof = kind === 'covered' ? 0.5 : kind === 'stadium' ? 0.62 : kind === 'grand' ? 0.8 : 0
    if (roof > 0) {
      g.rect(0, 0, w, h * roof)
        .fill(palette.slate)
        .stroke({ color: O, width: LINE })
      for (let x = 12; x < w; x += 24) line(g, x, 2, x, h * roof - 2, palette.slateRows, 2)
      g.rect(0, h * roof - 6, w, 6).fill(palette.stoneDark)
      for (let x = 20; x < w - 10; x += Math.max(80, w / 6)) g.rect(x, h * roof - 4, 6, 8).fill(O)
    }
  }
}
```

Un objeto pequeño con detalle (`storageShelf`) y el helper `box`:

```ts
/** Caja con contorno y un brillo fino en el borde superior. */
function box(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  radius = 3,
): void {
  g.roundRect(x, y, w, h, radius).fill(color).stroke({ color: O, width: LINE })
  g.roundRect(x + 2, y + 1.5, w - 4, Math.min(3, h / 4), 1).fill(shade(color, 0.22))
}

const storageShelf: ObjectPainter = (g, w, h, rnd) => {
  box(g, 4, 8, w - 8, h - 16, C.metal, 2)
  line(g, w / 2, 9, w / 2, h - 9, C.metalDark, 2)
  // Material: cajas, balones y conos
  const items = ['box', 'ball', 'cone', 'ball', 'box', 'cone'] as const
  for (let i = 0; i < 4; i++) {
    const x = 12 + i * ((w - 24) / 4)
    const kind = rnd.pick(items)
    if (kind === 'box') box(g, x, 14, 22, 20, C.cardboard, 1)
    if (kind === 'ball') {
      g.circle(x + 11, 24, 9)
        .fill(palette.chalk)
        .stroke({ color: O, width: 1 })
      g.poly([x + 11, 20, x + 14, 23, x + 13, 27, x + 9, 27, x + 8, 23]).fill(O)
    }
    if (kind === 'cone') {
      g.poly([x + 11, 14, x + 20, 34, x + 2, 34])
        .fill(C.orange)
        .stroke({ color: O, width: 1 })
      line(g, x + 6, 27, x + 16, 27, palette.chalk, 2)
    }
  }
}
```

Cómo se sombrea y gira cualquier pintor (`src/render/buildingMarker.ts`):

```ts
/**
 * Marcador con dibujo propio. El pintor dibuja el objeto sin girar con el
 * frente hacia abajo; aquí se gira el dibujo entero alrededor de su centro.
 * La sombra va aparte y sin girar, para que caiga siempre abajo a la derecha.
 */
function createArtMarker(def: BuildingDef, rotation: Rotation, painter: ObjectPainter): Container {
  const w = def.size.width * TILE_SIZE
  const h = def.size.height * TILE_SIZE
  const rotated = rotateSize(def.size, rotation)
  const rw = rotated.width * TILE_SIZE
  const rh = rotated.height * TILE_SIZE

  const marker = new Container({ label: `building:${def.id}` })
  const shadowInset = def.symmetric ? 14 : 6
  marker.addChild(
    new Graphics()
      .roundRect(
        shadowInset + SHADOW_OFFSET,
        shadowInset + SHADOW_OFFSET,
        rw - shadowInset * 2,
        rh - shadowInset * 2,
        6,
      )
      .fill({ color: palette.outline, alpha: 0.28 }),
  )

  const art = new Graphics()
  painter(art, w, h, createRandom(seedFromText(def.id)))
  art.pivot.set(w / 2, h / 2)
  art.position.set(rw / 2, rh / 2)
  art.rotation = (rotation * Math.PI) / 2
  marker.addChild(art)
  return marker
}
```

### 6.4 Hoja de muestra: vestuario (generador y SVG resultante)

`assets/src/muestras/muestra-estilo.svg` se genera con `tools/muestras/muestra-estilo.mjs`. El interior del vestuario (tejado desvanecido) sale de esta función:

```js
function interior(x, y, w, h) {
  const wall = 10
  const out = [`<g filter="url(#sombra)">`]
  // muro de piedra
  out.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.stone}" stroke="${C.line}" stroke-width="1.5"/>`,
  )
  out.push(
    `<rect x="${x + wall}" y="${y + wall}" width="${w - wall * 2}" height="${h - wall * 2}" fill="${C.floor}" stroke="${C.line}" stroke-width="1.5"/>`,
  )
  out.push('</g>')
  // juntas del suelo
  for (let xx = x + wall + 24; xx < x + w - wall; xx += 24)
    out.push(
      `<path d="M${xx} ${y + wall}V${y + h - wall}" stroke="${C.line}" stroke-opacity=".12"/>`,
    )
  for (let yy = y + wall + 24; yy < y + h - wall; yy += 24)
    out.push(
      `<path d="M${x + wall} ${yy}H${x + w - wall}" stroke="${C.line}" stroke-opacity=".12"/>`,
    )
  // puerta (hueco abajo) y ventana con luz cálida (izquierda)
  out.push(
    `<rect x="${x + 100}" y="${y + h - wall - 1}" width="40" height="${wall + 2}" fill="${C.floor}"/>`,
  )
  out.push(
    `<path d="M${x + 100} ${y + h - wall}A40 40 0 0 1 ${x + 140} ${y + h - wall - 40}" fill="none" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 3"/>`,
  )
  out.push(
    `<rect x="${x + 100}" y="${y + h - wall - 40}" width="5" height="40" fill="${C.wood}" stroke="${C.line}" stroke-width="1"/>`,
  )
  out.push(
    `<rect x="${x - 1}" y="${y + 60}" width="${wall + 2}" height="36" fill="${C.warm}" stroke="${C.line}" stroke-width="1"/>`,
  )
  // taquillas
  for (let i = 0; i < 7; i++) {
    const lx = x + wall + 6 + i * 30
    out.push(
      `<rect x="${lx}" y="${y + wall}" width="28" height="22" fill="${C.stoneDark}" stroke="${C.line}" stroke-width="1"/>`,
    )
    out.push(`<rect x="${lx + 20}" y="${y + wall + 12}" width="4" height="2" fill="${C.chalk}"/>`)
  }
  // banco central
  out.push(
    `<rect x="${x + 48}" y="${y + 92}" width="160" height="18" rx="2" fill="${C.wood}" stroke="${C.line}" stroke-width="1"/>`,
  )
  out.push(`<path d="M${x + 48} ${y + 101}H${x + 208}" stroke="${C.mudDeep}" stroke-width="1"/>`)
  // ducha con charquito
  out.push(
    `<rect x="${x + w - wall - 54}" y="${y + h - wall - 54}" width="54" height="54" fill="${C.waterShine}" stroke="${C.line}" stroke-width="1"/>`,
  )
  out.push(
    `<path d="${blob(x + w - wall - 27, y + h - wall - 27, 14, 10, 8, 0.25)}" fill="${C.water}"/>`,
  )
  out.push(
    `<circle cx="${x + w - wall - 10}" cy="${y + h - wall - 44}" r="4" fill="${C.stone}" stroke="${C.line}" stroke-width="1"/>`,
  )
  return out.join('')
}
```

Filtro de sombra plana que usa (en `<defs>`; solo existe en el SVG de muestra, el juego usa una forma desplazada):

```xml
<filter id="sombra" x="-20%" y="-20%" width="150%" height="150%">
  <feFlood flood-color="#476e2c"/><feComposite in2="SourceAlpha" operator="in"/>
  <feOffset dx="4" dy="4" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
```

Inicio del SVG resultante del interior (el resto son más rectángulos y trazos igual de planos):

```xml
<g filter="url(#sombra)">
<rect x="384" y="64" width="256" height="192" fill="#8f9496" stroke="#2e2a26" stroke-width="1.5"/>
<rect x="394" y="74" width="236" height="172" fill="#b9a68a" stroke="#2e2a26" stroke-width="1.5"/>
</g>
<path d="M418 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M442 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M466 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M490 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M514 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M538 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M562 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M586 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M610 74V246" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M394 98H630" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M394 122H630" stroke="#2e2a26" stroke-opacity=".12"/>
<path d="M394 146H630" strok
<!-- ... -->
```

---

## 7. Mi opinión: los 3 puntos débiles

### 7.1 Dos "familias" de arte: suelos y muros ricos, objetos y entrada más pobres y desiguales

- Suelos y muros tienen **textura rica** (128×128, 2-3 tonos, juntas, grano, desalineado); los objetos de `objectArt.ts` son **formas planas con un brillo** y casi sin grano. Un mueble sobre un suelo de madera con vetas y clavos parece de otro juego.
- **Contornos de grosor distinto**: 0,8-1 px en detalles, 1,5 px en cajas, 2 px en árboles y 2,5 px en muros. A zoom ×0,5 (el inicial) los muebles quedan con contorno de ~0,75 px y se pierden junto al muro de 1,25 px.
- **Escala de detalle desigual**: la entrada (`drawBooth`, `drawCar`, `drawWarehouse`) está muy trabajada; algunos objetos se quedan en 3-4 formas. Detalles de 0,8-1 px (clavos, tiradores, agujeros de ducha, vetas) son invisibles a la escala real de juego (un 1×1 mide ~32 px en pantalla).
- **Tres árboles distintos**: `drawTree` (entrada, 7 copas con sombra), `tree` de `objectArt` (6 copas, sin sombra de copa) y el seto, con distintos contornos.

### 7.2 Colores fuera de la paleta y datos muertos

- 59 de 71 literales no están en la guía ni en `palette.ts`; la regla de `palette.ts` no se cumple. Los más repetidos son los del club (`#8c2f39`, `#3f6fa8`) y los grises azulados del metal (`#2f3540`, `#8a96a3`, `#5d6872`...).
- Los ~40 `markerColor` de `buildings.ts` no afectan al aspecto (todos los objetos tienen pintor), pero parecen paleta oficial y confunden.
- `walls.ts` tiene 6 colores de remate y cara (`#e6dccb`, `#c9cbc6`, `#f1efe8`, `#b9b4a8`, `#8a8378`, `#2f5124`) que la guía no recoge.
- Sin mecanismo de color de club: no se puede teñir camiseta, grada o banderín con el color del jugador; hará falta al llegar las personas y las gradas.

### 7.3 Falta de vida y volumen: sin personas, sin techos y sombras sin sistema

- **No hay personas**, el elemento que más haría sentir el juego "vivo". Tampoco techos que se desvanezcan: las salas se leen como muros y suelo.
- Las **sombras** no son un sistema: cada pieza dibuja la suya con valores distintos (alfa 0,25 / 0,28 / 0,3 / 0,35 / 0,4; desplazamiento 4 u 8 px; `grassShadow` en campo y árboles, `outline` en el resto). Los objetos tienen una sombra rectangular genérica (`roundRect` con inset de 6 o 14 px) que no sigue la silueta (una silla redonda o la maceta tienen sombra de caja).
- Los muebles **no tienen sombra interior de apoyo**, aunque la guía la pide ("sombras planas bajo los muebles").
- **Texto**: el candado usa un emoji y los rótulos usan Trebuchet MS, que depende del sistema; la tipografía del juego (Patrick Hand) solo está en Vue.
- **Mundo plano**: hierba y campo sin calvas ni charcos aunque la guía pide "norte lluvioso"; `grassPitch` y `waterEdge` ni se usan.

### Recomendación para la skill de arte

1. Centralizar constantes de estilo (`OUTLINE_THIN = 1`, `OUTLINE = 1.5`, `OUTLINE_WALL = 2.5`, `SHADOW_OFFSET = 4`, alfas de sombra) en un módulo que importen todos los pintores.
2. Pasar los colores de `objectArt.ts` y `entranceView.ts` a `palette.ts` (con alta previa en la guía) o a `shade()` de colores existentes.
3. Dar a la skill el contrato del pintor (`(g, w, h, rnd) => void`, sin girar, frente abajo), los helpers `box`/`line`, la regla de 2-3 detalles por objeto y el criterio de legibilidad a zoom ×0,5 (detalles de al menos 2 px, contorno de al menos 1,5 px).
4. Pedirle que registre cada asset nuevo en `docs/ASSETS-LICENSES.md` (hay que crearlo).
