# Plan de desarrollo — Club Builder

Leyenda: 🧠 agente principal (Opus) · ⚡ delegable a Sonnet · ✅ checkpoint (parar y validar con Raul)

**MVP = final de la Fase 3**: construir → ganar dinero y fama → jugar una temporada → ascender → desbloquear algo nuevo. Con arte de marcador (rectángulos de colores con icono), pero jugable de principio a fin.

---

## Fase 0 — Esqueleto del proyecto
**Resultado visible:** abres el navegador y ves una rejilla cenital vacía.

- [x] ⚡ Crear proyecto Vite + Vue 3 + TS, instalar PixiJS v8, Tailwind v4, GSAP, Pinia, Vitest, ESLint, Prettier
- [x] ⚡ Crear la estructura de carpetas de `CLAUDE.md`
- [x] 🧠 Utilidades de rejilla: conversión casilla ↔ pantalla (casillas de 64×64 px) y sistema de capas de render
- [x] ⚡ Componente `GameCanvas.vue` que monta Pixi y dibuja una rejilla de 30×30
- [x] ⚡ Tests de las conversiones de rejilla

✅ **Validar:** la rejilla se ve bien y se adapta al tamaño de ventana.

---

## Fase 1 — Mapa y construcción base
**Resultado visible:** mueves la cámara, eliges un edificio y lo colocas en el mapa.

- [x] 🧠 Modelo de estado del mapa en `sim/`: casillas, parcelas compradas/no compradas, ocupación
- [x] 🧠 Sistema de comandos (`colocarEdificio`, `demolerEdificio`, `comprarParcela`) con validación
- [x] ⚡ Definir 4 edificios iniciales en `content/buildings.ts`: campo de tierra, vestuario básico, oficina, grada pequeña (tamaño, coste, color de marcador)
- [x] ⚡ Cámara: arrastrar para mover, rueda para zoom, con límites (adelantada en Fase 0)
- [x] 🧠 Modo construcción: vista previa del edificio bajo el cursor (verde válido / rojo inválido)
- [x] ⚡ Barra de construcción en Vue con los edificios disponibles
- [x] ⚡ Marcadores sencillos por edificio (rectángulo con color, contorno e icono) generados por código (con Graphics de Pixi en vez de SVG)
- [x] ⚡ Tests de validación de colocación

> Las parcelas comprables de esta fase se eliminan en la Fase 1B: todo el mapa es construible desde el inicio.
> Los edificios de tamaño fijo de esta fase pasan a ser la base del sistema de **objetos** de la Fase 1B (taquillas, duchas, porterías…): misma colocación, giro y validación.

---

## Fase 1B — Construcción estilo Prison Architect
**Resultado visible:** un mapa grande y apaisado con una carretera que sale por el borde derecho y la entrada de la ciudad deportiva. Arrastrando se pintan suelos y caminos, se levantan salas con muros, se asigna qué es cada sala y se colocan objetos dentro.

**Mapa y mundo**
- [x] 🧠 Mapa de 240×160 casillas (3:2), todo construible desde el inicio (se eliminan las parcelas)
- [x] ⚡ Candados de ampliación junto a los bordes de arriba, izquierda y abajo; al pulsarlos, aviso "Ampliación no disponible todavía" (la ampliación de pago llega en la versión 2)
- [x] 🧠 Carretera fija en el borde derecho que sale del mapa por arriba y por abajo (no se construye ni se compra), con un acceso a la entrada del terreno
- [x] ⚡ Cámara inicial con vista global centrada en la entrada (borde derecho); zoom mínimo para ver el mapa entero

**Suelos, rejilla y campos** (bloque A)
- [x] 🧠 Texturas de suelo generadas por código al estilo Prison Architect (juntas, tablas, grava, losas), alineadas con la rejilla
- [x] ⚡ Rejilla siempre visible (se atenúa al alejar, nunca desaparece)
- [x] 🧠 Campos de fútbol predefinidos con medidas reglamentarias (no se arrastran): fútbol 11 (56×38 con margen) y fútbol 7 (34×24, cantera)

**Entrada de la ciudad deportiva** (bloque C)
- [x] 🧠 Entrada fija junto a la carretera: garitas de seguridad, barrera de acceso, valla perimetral con puerta, zona de recepción de mercancía con muelles, árboles, farolas y jardineras

> Referencias de Prison Architect para todas las fases (escala, interfaz, construcción, economía, personal, salas y objetos): `docs/referencias/README.md`.

**Construcción por arrastre** (botón izquierdo: pulsar, arrastrar y soltar; vista previa con coste y tamaño)
- [x] 🧠 Herramienta de arrastre genérica: rectángulo (suelos, cimientos, salas) y línea (muros, caminos) — rectángulo hecho para suelos; falta la línea
- [x] 🧠 Suelos en `sim/`: un tipo por casilla. Tipos iniciales en `content/floors.ts`: hierba, tierra, grava, losa de piedra, hormigón, madera, baldosa blanca y asfalto
- [x] 🧠 Muros y puertas: los muros ocupan casillas y las puertas se colocan sobre un muro (el eje de la puerta sale de los muros vecinos)
- [x] 🧠 Cimientos: arrastrar un rectángulo levanta los muros del perímetro y pone el suelo interior (solapar cimientos amplía el edificio y comparte pared)
- [x] 🧠 Salas: se designan arrastrando sobre casillas. El tipo de sala se define en `content/rooms.ts` con requisitos (cerrada o al aire libre, tamaño mínimo, objetos necesarios) y una capacidad que depende del tamaño. Tipos iniciales: vestuario, oficina y recepción (los campos de fútbol son objetos de tamaño fijo, ver bloque A) — implementado como en PA: clic dentro del edificio y la sala ocupa todo el espacio cerrado (flood fill); 7 tipos con requisitos y capacidad
- [x] 🧠 Objetos: colocación con giro reutilizando el sistema de la Fase 1. Objetos iniciales en `content/objects.ts`: portería, banquillo, taquilla, ducha, banco, mesa, silla y mostrador — 27 objetos y 6 gradas dibujados por código al estilo PA
- [x] 🧠 Validación de salas: indicar qué le falta a cada una ("Vestuario: faltan 2 duchas") (aviso sobre el suelo y panel de sala con lista de comprobación)
- [x] ⚡ Render: suelos por casilla, muros con autotiling, remate, cara de material y sombras, puertas y nombre de la sala sobre el suelo
- [x] ⚡ Demoler unificado (bulldozer de PA): clic quita lo de encima (objeto → puerta → muro → suelo) y arrastrar arrasa la zona; "Quitar sala" aparte
- [x] ⚡ Zoom inicial ×0,5 (~60×34 casillas en 1080p, como PA); referencias de escala en `docs/referencias/pa-escala-y-mapa.md`
- [x] ⚡ Tests: suelos, muros, cimientos, designación de salas, requisitos y capacidad

**Menú de construcción por categorías** (bloque B, se adelanta)
- [x] ⚡ Iconos de línea con Tabler Icons (Vue y texturas Pixi para los marcadores)
- [x] ⚡ Catálogo inicial: 8 campos (fútbol 11 y 7 × 4 superficies), 6 gradas por aforo y 21 objetos, con desbloqueos por división (provisionales)
- [x] ⚡ Barra abajo a la izquierda con categorías (Cimientos, Muros y puertas, Suelos, Salas, Objetos, Demoler) que despliega hacia arriba un panel con las opciones, estilo "plano de obra" (como Prison Architect)
- [x] ⚡ Elementos bloqueados en gris con el requisito al pasar el ratón (p. ej. "Se desbloquea en 3.ª División"), con los desbloqueos como datos en `content/`

**Pulido de la construcción**
- [x] ⚡ Panel de construcción: pestañas en vertical a la DERECHA del panel (como Prison Architect), en lugar de arriba
- [x] ⚡ Animación de construcción: andamio → sala o objeto con rebote + polvo; demolición que se desvanece con polvo
- [x] ⚡ Cámara con inercia y zoom suave (GSAP), más teclado: WASD/flechas para mover y Q/E para el zoom

✅ **Validar:** se puede montar a mano un vestuario cerrado con puerta, taquillas y duchas, y un campo de fútbol 11 de tierra con porterías. El juego dice qué le falta a cada sala.

---

## Fase 1C — Estilo visual base
**Resultado visible:** suelos, muros, carretera y objetos iniciales con arte propio, no con rectángulos de color.

- [x] Hoja de muestra de estilo validada por Raul (escala A de personas; pide más textura y detalle)
- [ ] Completar `docs/GUIA-ESTILO.md` y `src/render/palette.ts` con pieles, pelo y colores de club
- [ ] 🧠 Caché de texturas horneadas: cada pintor se hornea una vez por (id, nivel, colores del club) con `generateTexture` y se dibuja como `Sprite`, con el marcador de color como fallback; prueba de 200 edificios a 60 fps
  > Decisión (4-oct-2026): se descarta el pipeline SVG → PNG → atlas. Todo el arte se pinta por código con `Graphics` (niveles y colores del club salen por parámetro) y se hornea en tiempo de carga.
- [x] Texturas de los suelos iniciales con variación por casilla (adelantado a la Fase 1B, bloque A; se pulirán aquí)
- [ ] Pintores de piezas de muro para el autotiling (recto, esquina, T, cruz y final) y puerta
- [ ] Pintores de los objetos iniciales, cada uno con sus 2-3 detalles característicos y su sombra
- [ ] Pintores de carretera, arcén y entrada
- [ ] Iconos de líneas blancas para el menú de construcción
- [ ] ⚡ Crear `docs/ASSETS-LICENSES.md` y registrar los recursos externos (Tabler Icons, Patrick Hand y demás fuentes)

**Skill de arte (`.claude/skills/pixi-artist/`)**
- [x] 🧠 `src/render/style.ts`, validador de colores con baseline, galería `/gallery.html` (solo desarrollo) y `tools/capture.mjs`
- [x] 🧠 Niveles de objetos: `tiers` en `BuildingDef`, comando `upgradeBuilding`, ficha de objeto con mejora, calidad de sala y modo `?dev`; piloto en taquilla, banco y ducha (3 niveles)
- [x] 🧠 Campos mejorables en el sitio (tierra → artificial → natural → híbrido) con uso principal / filial / entrenamiento
- [x] 🧠 Estadio modular (`docs/DISENO-ESTADIO-Y-NIVELES.md`): gradas ligadas a los huecos del campo, que crecen hacia fuera con el nivel; a) laterales y fondos 1-3, b) niveles 4-6 con cubiertas unidas, c) esquinas
  - [x] a) Laterales y fondos, niveles 1-3 (talud, bancos, asientos); aforo por casilla de largo con tope de 100 000; galería `?scene=estadio`
  - [x] b) Niveles 4-6 en anillos escalonados (pasillos con vomitorios, palcos en la gran tribuna), visera que se desvanece con el ratón y sombra según la altura; galería `?scene=estadio-alto`
  - [x] c) Córners: botón propio en el menú, se colocan y mejoran a mano; necesitan las dos gradas vecinas y no pasan del nivel de la más baja; filas en arco que empalman con los lados; sombras en capa propia (RenderLayer)
- [x] 🧠 Sombra de objetos que sigue la silueta (en lugar del rectángulo genérico): silueta horneada por objeto y nivel (`silhouettes.ts`); los halos de luz no proyectan sombra

✅ **Validar:** un vestuario y un campo montados a mano se ven coherentes con la guía de estilo.

---

## Fase 1D — Herramientas de edición
**Resultado visible:** se puede mover un objeto o un bloque entero (edificio con sus salas y objetos) sin demoler y reconstruir.

- [ ] 🧠 Mover un elemento: herramienta "Mover", clic sobre un objeto, campo o grada → fantasma en el cursor, R para girar, clic para soltar (verde/rojo). Mover un campo se lleva sus gradas
- [ ] 🧠 Mover un bloque: arrastrar un rectángulo (como Demoler) selecciona muros, puertas, suelos, objetos y salas; se mueve en fantasma y se suelta. Un único comando atómico, destino validado entero, salas recalculadas, objetos con su nivel y uso
- [ ] ⚡ Tests de mover (objeto, bloque, destino inválido sin cambios, salas y niveles conservados)
- [ ] ⚡ Animación al soltar (polvo y rebote) y vista previa del bloque completo

> En la Fase 2 se decide si mover cuesta dinero; con obreros (Fase 4/6), mover dejará de ser instantáneo, como en Prison Architect. PA solo mueve objetos: mover bloques es una mejora sobre el original.

✅ **Validar:** mover una taquilla, un vestuario completo y el campo principal con su estadio, sin dejar nada a medias.

---

## Fase 2 — Tiempo y economía
**Resultado visible:** el reloj avanza, el dinero sube y baja, y el HUD lo muestra.

- [ ] 🧠 Bucle de ticks determinista con pausa / 1x / 3x
- [ ] 🧠 Recursos: dinero, fama, afición. Coste de construcción (por casilla de suelo y muro, por objeto) y mantenimiento semanal por sala
- [ ] 🧠 Ingresos básicos: taquilla según grada y afición; cuotas de socios
- [ ] ⚡ HUD en Vue: fecha, velocidad, recursos con variación (+/−)
- [ ] ⚡ Panel de sala al hacer clic: tipo, capacidad, requisitos cumplidos, mantenimiento y qué aporta
- [ ] 🧠 Condición de quiebra (dinero negativo X semanas)
- [ ] 🧠 Guardado en IndexedDB tras una interfaz `SaveRepository` (permite pasar a archivos si se empaqueta como app de escritorio)
- [ ] 🧠 Partidas versionadas: versión del formato + migraciones para no romper partidas antiguas
- [ ] ⚡ Autoguardado semanal, botón manual y exportar/importar partida como `.json`
- [ ] ⚡ Tests de economía (ingresos/gastos de una semana)
- [ ] ⚡ Cifras del HUD animadas y textos flotantes "+120 €" sobre las salas
- [ ] 🧠 Sistema de temas visuales de UI con Tailwind: estilo "carpeta del míster" (papel, clip, pestañas de colores en el lateral), fuente manuscrita para títulos y otra legible para datos
- [ ] 🧠 **Informes** (como Reports de Prison Architect): botón "Informes" (icono de carpeta con papeles) abajo a la derecha que abre un cuaderno/carpeta con pestañas de colores en vertical a la IZQUIERDA. Hoja de papel con título en recuadro verde, secciones con cabecera de color, barras y listas. Las pestañas aparecen a medida que llegan los sistemas: Finanzas y Valoración (Fase 2) · Horario (Fase 3) · Plantilla y personal, Llegadas y fichajes, Trabajos y Necesidades (Fase 4) · Normas y Patrocinios (Fase 5) · Cantera (backlog)
- [ ] ⚡ Pestaña Finanzas: ingresos y gastos por concepto y saldo neto por semana (como Finance de PA)

✅ **Validar:** una partida de 10 minutos tiene sentido económico; guardar y cargar funciona.

---

## Fase 3 — Temporada, partidos y ascenso (MVP)
**Resultado visible:** juegas una liga completa, ves la clasificación y puedes ascender.

- [ ] 🧠 Diseño de la progresión en `docs/PROGRESION.md`: divisiones (de Regional a Primera), qué hace falta para ascender y qué desbloquea cada ascenso (salas, objetos, suelos, sistemas)
  - Las divisiones deben imitar la pirámide real del fútbol (categorías regionales → nacionales → profesional), con nombres ficticios. **El número de niveles de objetos, campos y gradas irá correlativo al número de categorías** (hoy son provisionales: 3 en objetos, 4 en campos, 6 en gradas).
- [ ] 🧠 Generador de liga ficticia: nombres de clubes y pueblos inventados, 10 equipos por división
- [ ] 🧠 Calendario de temporada (ida y vuelta) integrado en los ticks
- [ ] 🧠 Simulación de partido simple: fuerza del equipo derivada de instalaciones + moral + factor local
- [ ] ⚡ Pantalla de resultado del partido (marcador + 2-3 frases de resumen)
- [ ] ⚡ Tabla de clasificación
- [ ] 🧠 Fin de temporada: ascenso/descenso, premio económico, subida de fama
- [ ] 🧠 Desbloqueos por ascenso conectados con el menú de construcción (p. ej. césped natural y grada mediana)
- [ ] ⚡ Tests: una temporada completa simulada sin errores
- [ ] ⚡ Día de partido animado: afición llegando por la carretera, focos, sonido de grada (placeholder)

✅ **Validar MVP:** jugar una temporada entera, ascender y usar algo desbloqueado. **Aquí decidimos juntos si el bucle es divertido antes de seguir.**

---

## Fase 4 — Jugadores con necesidades
**Resultado visible:** llegan jugadores por tu fama y se quejan si les faltan cosas.

- [ ] 🧠 Modelo de jugador: nivel (tier), calidad, moral, necesidades
- [ ] 🧠 Llegada de jugadores por la carretera y la recepción según fama e instalaciones; salida si no están satisfechos
- [ ] 🧠 Necesidades por nivel (alojamiento, fisio, gimnasio, ocio) cubiertas por salas y objetos
- [ ] 🧠 Agentes como eventos con propuesta aceptar/rechazar
- [ ] ⚡ Nuevas salas y objetos: pensión, residencia, fisioterapia, gimnasio
- [ ] ⚡ Panel de plantilla en Vue

✅ **Validar:** las decisiones de construcción afectan claramente a quién llega y cómo rinde.

---

## Fase 4B — Suministros: energía y agua
**Resultado visible:** sin generador no hay luz ni focos; sin agua no hay duchas.

- [ ] 🧠 Red eléctrica: generador (objeto) con potencia, consumo por objeto (focos, luces, máquinas) y cableado o radio de alcance (decidir)
- [ ] 🧠 Red de agua: depósito o bomba, tuberías y consumo (duchas, riego del césped)
- [ ] 🧠 Efectos: sin luz no hay partidos de noche ni entrenamientos al anochecer; sin agua baja la moral y el césped se seca
- [ ] ⚡ Vista de suministros (capa que muestra cables y tuberías, como en Prison Architect)
- [ ] ⚡ Tests de la red: potencia, consumo y cortes

✅ **Validar:** quedarse sin energía o sin agua se nota y obliga a planificar.

---

## Fase 5 — Árbol de habilidades y desbloqueos
- [ ] 🧠 Sistema de investigación/puntos (p. ej. puntos de prestigio por temporada)
- [ ] ⚡ Definir el árbol en `content/tech-tree.ts` (ramas: deportiva, comercial, infraestructura)
- [ ] ⚡ UI del árbol en Vue
- [ ] 🧠 Conectar desbloqueos con edificios y mecánicas

✅ **Validar:** el árbol da decisiones interesantes, no solo "comprar todo".

---

## Fase 6 — Arte y mundo vivo
> Guía de estilo, caché de texturas y pintores iniciales se adelantaron a la Fase 1C.

- [ ] Pintores del resto de suelos, muros, objetos, personas y vehículos siguiendo la guía
- [ ] 🧠 Techos que se desvanecen para mostrar el interior de las salas
- [ ] ⚡ Figuritas caminando (jugadores, staff, afición) con balanceo y rutas simples
- [ ] ⚡ Terreno: hierba con variaciones, tierra, caminos, árboles y bordes suaves
- [ ] 🧠 Ciclo día/noche con tintado y focos del estadio

✅ **Validar:** el juego se ve coherente y "vivo" en una captura de pantalla.

> El arte lo pinta Claude por código (skill `pixi-artist`) siguiendo `docs/GUIA-ESTILO.md` y Raul lo valida. Prison Architect es solo referencia de estilo: nunca se copian sus assets.

---

## Backlog (fases futuras, se desbloquean en el juego)
- Logística: flota (furgoneta → autobús → avión), cansancio por viaje, hoteles
- Economía: préstamos con intereses, vallas publicitarias con posición, patrocinios, merchandising, conciertos que dañan el césped, inversores
- Ampliación del mapa (versión 2): comprar franjas nuevas por arriba, izquierda o abajo (la derecha es la carretera)
- Territorio: barrio que crece alrededor del estadio, tráfico en la carretera, clima y estado del césped, iluminación y derechos de TV
- Estrategia: club rival en la ciudad, ayuntamiento y permisos, facciones de afición, eventos aleatorios
- Cantera: escuelas en barrios, ojeadores
- Cadenas de suministro: cocina, lavandería, taller de equipaciones
