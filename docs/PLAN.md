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
- [x] Completar `docs/GUIA-ESTILO.md` y `src/render/palette.ts` con pieles, pelo y colores de club
- [x] 🧠 Caché del arte (`render/art/artCache.ts`): cada pintor se dibuja una vez por (objeto, nivel, tamaño) en un `GraphicsContext` compartido por todas las copias; las siluetas de sombra sí se hornean a textura. Escena de prueba `?scene=rendimiento` (estadio grande + 215 objetos en una vista de 1600×900, como el juego alejado): 57 fps en una gráfica integrada Intel UHD 730. `?bench` mide cualquier escena; `?scale=` y `?hide=floors,walls,buildings,grass` sirven para diagnosticar
  > Decisión (4-oct-2026): se descarta el pipeline SVG → PNG → atlas. Todo el arte se pinta por código con `Graphics` (niveles y colores del club salen por parámetro). Se comparte la geometría en vez de hornear a `Sprite`: sigue nítida con zoom ×2 en pantallas de alta densidad y las gradas (hasta 56×14 casillas) no ocupan decenas de MB en texturas.
- [x] Texturas de los suelos iniciales con variación por casilla (adelantado a la Fase 1B, bloque A; se pulirán aquí)
- [x] Pintores de piezas de muro para el autotiling (recto, esquina, T, cruz y final) y puerta (hechos en la Fase 1B: `views/wallsView.ts` con remate, cara de material y sombra)
- [x] Pintores de los objetos iniciales, cada uno con sus 2-3 detalles característicos y su sombra (repaso de los 27: más tamaño y contraste, contornos de `style.ts`, colores de la paleta, color del club por parámetro)
- [x] Pintores de carretera, arcén y entrada (líneas de borde del arcén; roble y farola compartidos entre objetos y entrada)
- [x] Iconos de líneas blancas para el menú de construcción (Tabler en línea blanca sobre el color de la categoría)
- [x] ⚡ Crear `docs/ASSETS-LICENSES.md` y registrar los recursos externos (Tabler Icons, Patrick Hand y demás fuentes)

**Skill de arte (`.claude/skills/pixi-artist/`)**
- [x] 🧠 `src/render/style.ts`, validador de colores con baseline, galería `/gallery.html` (solo desarrollo) y `tools/capture.mjs`
- [x] 🧠 Niveles de objetos: `tiers` en `BuildingDef`, comando `upgradeBuilding`, ficha de objeto con mejora, calidad de sala y modo `?dev`; piloto en taquilla, banco y ducha (3 niveles)
- [x] 🧠 Campos mejorables en el sitio (tierra → artificial → natural → híbrido) con uso principal / filial / entrenamiento
- [x] 🧠 Estadio modular (`docs/DISENO-ESTADIO-Y-NIVELES.md`): gradas ligadas a los huecos del campo, que crecen hacia fuera con el nivel; a) laterales y fondos 1-3, b) niveles 4-6 con cubiertas unidas, c) esquinas
  - [x] a) Laterales y fondos, niveles 1-3 (talud, bancos, asientos); aforo por casilla de largo con tope de 100 000; galería `?scene=estadio`
  - [x] b) Niveles 4-6 en anillos escalonados (pasillos con vomitorios, palcos en la gran tribuna), visera que se desvanece con el ratón y sombra según la altura; galería `?scene=estadio-alto`
  - [x] c) Córners: botón propio en el menú, se colocan y mejoran a mano; necesitan las dos gradas vecinas y no pasan del nivel de la más baja; filas en arco que empalman con los lados; sombras en capa propia (RenderLayer)
- [x] 🧠 Sombra de objetos que sigue la silueta (en lugar del rectángulo genérico): silueta horneada por objeto y nivel (`silhouettes.ts`); los halos de luz no proyectan sombra

✅ **Validar:** un vestuario y un campo montados a mano se ven coherentes con la guía de estilo. — **Validado por Raul el 4-oct-2026.**

---

## Fase 1D — Herramientas de edición
**Resultado visible:** se puede mover un objeto o un bloque entero (edificio con sus salas y objetos) sin demoler y reconstruir.

- [x] 🧠 Mover un elemento: herramienta "Mover", clic sobre un objeto, campo o grada → fantasma en el cursor, R para girar, clic para soltar (verde/rojo). Mover un campo se lleva sus gradas (comando atómico `moveBuilding` en `sim/buildings/move.ts`; clic en una grada coge su campo; Esc devuelve la pieza)
- [x] 🧠 Menú contextual con el botón derecho sobre un objeto, campo o grada (sin herramienta activa): Mover, Demoler, Mejorar y Ver ficha. Acciones como datos para añadir opciones nuevas (personal, consumo…) sin tocar el menú (`src/ui/context-menu/buildingActions.ts`; Mover desde el menú es de un solo uso)
- [x] 🧠 Mover un bloque: arrastrar un rectángulo (como Demoler) selecciona muros, puertas, suelos, objetos y salas; se mueve en fantasma y se suelta. Un único comando atómico, destino validado entero, salas recalculadas, objetos con su nivel y uso (comando atómico `moveBlock` en `sim/map/moveBlock.ts`; solo se mueve lo construido, R gira el bloque, no deja cortar objetos ni salas)
- [x] ⚡ Tests de mover (objeto, bloque, destino inválido sin cambios, salas y niveles conservados): 42 en `move.test.ts` y 34 en `moveBlock.test.ts`
- [x] ⚡ Animación al soltar (polvo y rebote) y vista previa del bloque completo (`playDrop` en `effects.ts`; maqueta de suelos, muros y puertas en el fantasma del bloque)

> En la Fase 2 se decide si mover cuesta dinero; con obreros (Fase 4/6), mover dejará de ser instantáneo, como en Prison Architect. PA solo mueve objetos: mover bloques es una mejora sobre el original.

✅ **Validar:** mover una taquilla, un vestuario completo y el campo principal con su estadio, sin dejar nada a medias. — **Validado por Raul el 17-oct-2026.**

---

## Fase 2 — Tiempo y economía
**Resultado visible:** el reloj avanza, el dinero sube y baja, hay partido cada domingo y el HUD lo muestra.

> Especificación completa (cifras, fórmulas e interfaz): [`docs/prompts/FASE2-ESPECIFICACION.md`](prompts/FASE2-ESPECIFICACION.md). Todas las cifras son datos en `src/content/`; toda aleatoriedad usa el PRNG sembrado de la partida. Cada bloque termina con algo visible y se valida antes de pasar al siguiente.

**Bloque A — Reloj y tema visual**
- [x] 🧠 Bucle de ticks (1 tick = 1 min de juego) con `MINUTOS_REALES_POR_DIA`, velocidades ×1/×3/×5/×10 y pausa. Calendario con fecha, hora y día de la semana
- [x] 🧠 Planificador de eventos (por hora, día, semana, mes y fecha concreta) y "próximo evento"
- [x] 🧠 Clima diario sembrado
- [x] ⚡ Tokens del tema "carpeta del míster" en Tailwind (madera, papel, corcho, tipografías)
- [x] ⚡ HUD: fecha, hora, clima y velocidades, con teclas

*Se ve:* el reloj avanza a cada velocidad, "próximo evento" salta al lunes y se detiene. *Prueba:* 1 día a ×1 dura 12 min (cronometrar a ×10: 72 s).

**Bloque B — Libro de cuentas y costes**
- [x] 🧠 Libro de cuentas: cada movimiento con fecha, concepto, importe y origen (edificio o club). Será la fuente de Finanzas
- [x] 🧠 Cobro de construcción, mejoras, mover, demoler y deshacer (mover objeto gratis, bloque o campo 10 %; demoler devuelve 50 % objetos y 25 % suelos, muros y gradas; deshacer 10 s al 100 %); bloqueo sin fondos
- [x] 🧠 Inicio de partida: caseta vieja, campo de tierra, recursos iniciales
- [x] ⚡ Dinero en el HUD con cifra animada
- [x] ⚡ Textos flotantes con agrupación

*Se ve:* construir resta dinero con su "−X €". *Prueba:* construir y deshacer deja el saldo igual; demoler devuelve los porcentajes correctos.

**Bloque C — Ingresos y gastos regulares**
- [x] 🧠 Subvención con ayuda de arranque, socios, bar, alquiler del campo (interruptor en la ficha del campo)
- [x] 🧠 Mantenimiento semanal (objetos, interiores, césped y gradas) y lunes de cuentas
- [x] ⚡ Aviso del lunes de cuentas
- [x] ⚡ Ficha de sala ampliada con mantenimiento y aportaciones

*Se ve:* el dinero sube y baja solo. *Prueba:* test de una semana completa que cuadre con las fórmulas.

**Bloque D — Personal y estado del campo**
- [ ] 🧠 Personal abstracto con cobertura (jardinero, limpieza, mantenimiento)
- [ ] 🧠 Estado del campo y averías
- [ ] 🧠 Ficha del campo con su estado (barra 0-100 y por qué baja) y botón "Reparar el césped" de pago: recupera estado de golpe y deja el campo unos días sin alquilar (idea de Raul, ver `docs/IDEAS.md`)
- [ ] ⚡ Pestaña Personal del cuaderno
- [ ] ⚡ Icono de avería sobre el objeto y botón de reparar en su ficha

*Se ve:* sin jardinero el campo no se recupera; sin mantenimiento aparecen averías. *Prueba:* tests de cobertura y de probabilidad de averías con semilla fija.

**Bloque E — Partido mínimo, fama y afición**
- [ ] 🧠 Partido semanal con fuerza, goles por Poisson, asistencia, taquilla, bar y aparcamiento
- [ ] 🧠 Fama, afición, satisfacción y socios
- [ ] 🧠 Vestuario local y visitante: uso elegible en la ficha (como el de los campos); la fuerza usa el local; sin visitante, multa de la federación y −1 de fama al jugar en casa; la caseta vieja puede hacer de visitante (idea de Raul)
- [ ] ⚡ Pantalla de resultado del partido
- [ ] ⚡ Socios, afición y fama en el HUD
- [ ] ⚡ Banderines en las farolas según la afición

*Se ve:* cada domingo hay partido con ingresos que flotan sobre sus edificios. *Prueba:* simular 20 partidos con semilla fija; la distribución de resultados es razonable (ni siempre ganar ni siempre perder).

**Bloque F — Tablón, patrocinios y nuevas fuentes**
- [ ] 🧠 Subvenciones del ayuntamiento como las de Prison Architect: lista encadenada con objetivos, adelanto al aceptar y bonus al cumplir, 2 activas, se tachan los objetivos al cumplirlos (idea de Raul; cadena inicial en `docs/IDEAS.md`)
- [ ] 🧠 El tablón avisa de lo que frena al club ("El vestuario no cuenta: le faltan 2 duchas", "Nadie cuida el campo: contrata un jardinero"); cada nota lleva a su ficha al hacer clic
- [ ] 🧠 Tablón del vestuario y patrocinios locales con objetivos como datos. El tablón es el equivalente a la lista "Todo" de Prison Architect: nota de corcho arriba a la izquierda con secciones (próximo partido, patrocinios con sus objetivos tachados al cumplirlos, ofertas, averías, quiebra, lotería) y un contador de pendientes
- [ ] 🧠 Vallas publicitarias (objeto, colocación en el pasillo perimetral, anunciantes)
- [ ] 🧠 Escuela de fútbol con monitores
- [ ] 🧠 Lotería de Navidad
- [ ] ⚡ Notas del tablón, carteles de los anunciantes y logotipos de los patrocinadores

*Se ve:* el tablón propone metas; las vallas muestran anuncios. *Prueba:* aceptar, cumplir, fallar y cancelar un patrocinio dan los importes y la fama correctos.

**Bloque G — Quiebra**
- [ ] 🧠 Contador de lunes en negativo, dos rescates con condiciones y fin de partida
- [ ] ⚡ Avisos y pantalla "El club se disuelve"

*Prueba:* forzar el saldo negativo y comprobar los dos rescates y el final.

**Bloque H — Informes**
- [ ] ⚡ Cuaderno con pestañas: Finanzas, Valoración (con opinión del pueblo), Personal y Partidos. Como los Reports de Prison Architect: botón "Informes" abajo a la derecha (icono de carpeta con papeles) que abre una carpeta con hojas de papel, título en recuadro de color, secciones con cabecera y pestañas de colores en vertical a la IZQUIERDA que **aparecen a medida que se desbloquean** sus sistemas. Pestañas futuras: Horario (Fase 3) · Plantilla y personal, Llegadas y fichajes, Trabajos y Necesidades (Fase 4) · Normas y Patrocinios (Fase 5) · Cantera (backlog)
- [ ] 🧠 Reglas de la opinión del pueblo (cada frase, con su condición, como dato)

**Bloque I — Guardado**
- [ ] 🧠 Partidas con número de versión y migraciones; autoguardado cada lunes y guardado manual (IndexedDB tras una interfaz `SaveRepository`)
- [ ] ⚡ Exportar e importar `.json`

*Prueba:* guardar a mitad de semana, recargar y comprobar que todo (incluido el PRNG) continúa igual.

**Bloque J — Comodidades de construcción**
- [ ] 🧠 Copiar un bloque: se selecciona como al mover un bloque, se lleva en fantasma (R gira) y se pega en otro sitio pagando lo que costaría construirlo; se puede pegar varias veces seguidas

*Prueba:* copiar un vestuario completo cobra lo mismo que construirlo a mano y la copia es una sala completa e independiente.

**Fuera de esta fase:** liga, clasificación y ascensos (3) · horario semanal (3) · jugadores, necesidades y personal visible (4) · lluvia visible y deterioro visual (4B / 6) · electricidad y agua (4B) · patrocinio de camiseta, campus, tienda y eventos (5 o backlog) · junta directiva, préstamos e inversores (5 / backlog) · obreros y obra no instantánea (backlog).

✅ **Validar:**
1. Una sesión de unos 45 minutos reales, mezclando velocidades, cubre 4-5 semanas de juego y 2-3 partidos en casa, con decisiones económicas con sentido: no sobra el dinero ni se está siempre en quiebra.
2. Con una construcción razonable, el saldo de las primeras 4 semanas es positivo; al retirarse la ayuda (semanas 5-8) se ajusta, y sin vallas, escuela ni patrocinios se acerca a cero.
3. Ninguna fuente supera el 50 % de los ingresos de un mes típico.
4. Guardar, recargar, exportar e importar conservan el estado exacto.
5. Los tests de la economía (semana tipo, partido, patrocinios, quiebra) pasan con semilla fija.
6. Raul juega una partida y le apetece seguir jugando.

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
- [ ] 🧠 Peñas de aficionados: con suficiente afición nace una peña con nombre que pide mejoras; si se cumplen, sube la afición y anima en casa
- [ ] 🧠 Rival fijo del pueblo vecino: el derbi llena el estadio y vale el doble de fama
- [ ] 🧠 Acceso de la afición como en un estadio real: recinto cerrado con muros o vallas, puertas de acceso con tornos (objeto nuevo) y taquilla; los tornos limitan la asistencia y sin recinto cerrado hay "colados" que no pagan (idea de Raul)

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
- [ ] 🧠 Eventos de temporada en el campo (fiestas del pueblo, concierto, feria): mucho dinero y fama a cambio de desgastar el césped
- [ ] ⚡ Logros ("Rey del barro", "Cien socios", "Casa llena"…)

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
