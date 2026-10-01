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

## Fase 1 — Mapa y construcción
**Resultado visible:** mueves la cámara, eliges un edificio y lo colocas en el mapa.

- [x] 🧠 Modelo de estado del mapa en `sim/`: casillas, parcelas compradas/no compradas, ocupación
- [x] 🧠 Sistema de comandos (`colocarEdificio`, `demolerEdificio`, `comprarParcela`) con validación
- [x] ⚡ Definir 4 edificios iniciales en `content/buildings.ts`: campo de tierra, vestuario básico, oficina, grada pequeña (tamaño, coste, color de marcador)
- [x] ⚡ Cámara: arrastrar para mover, rueda para zoom, con límites (adelantada en Fase 0)
- [ ] 🧠 Modo construcción: vista previa del edificio bajo el cursor (verde válido / rojo inválido)
- [ ] ⚡ Barra de construcción en Vue con los edificios disponibles
- [ ] ⚡ Marcadores SVG sencillos por edificio (rectángulo con color, contorno e icono) generados por código
- [x] ⚡ Tests de validación de colocación
- [ ] ⚡ Animación de construcción: andamio → edificio con rebote + polvo; demolición que se desvanece con polvo
- [ ] ⚡ Cámara con inercia y zoom suave (GSAP)

✅ **Validar:** se puede construir y demoler sin fallos; no se solapan edificios.

---

## Fase 1B — Estilo visual base
**Resultado visible:** los 4 edificios iniciales y el suelo se ven con arte propio, no con rectángulos de color.

- [ ] Hoja de muestra de estilo validada por Raul (escala de personas, grosor de contorno, pieles y pelo)
- [ ] Completar `docs/GUIA-ESTILO.md` y `src/render/palette.ts` con lo decidido en la muestra
- [ ] 🧠 Pipeline de assets en `tools/`: SVG → PNG (a 1x y 2x) → atlas, con un solo comando
- [ ] Sprites propios de los edificios iniciales (campo, vestuario, oficina, grada) siguiendo la guía
- [ ] ⚡ Cargador de atlas con fallback al marcador de color
- [ ] ⚡ Crear `docs/ASSETS-LICENSES.md` y registrar cada asset

✅ **Validar:** el mapa con los 4 edificios se ve coherente con la guía de estilo.

---

## Fase 2 — Tiempo y economía
**Resultado visible:** el reloj avanza, el dinero sube y baja, y el HUD lo muestra.

- [ ] 🧠 Bucle de ticks determinista con pausa / 1x / 3x
- [ ] 🧠 Recursos: dinero, fama, afición. Edificios con coste de construcción y mantenimiento semanal
- [ ] 🧠 Ingresos básicos: taquilla según grada y afición; cuotas de socios
- [ ] ⚡ HUD en Vue: fecha, velocidad, recursos con variación (+/−)
- [ ] ⚡ Panel de edificio al hacer clic: nombre, mantenimiento, qué aporta
- [ ] 🧠 Condición de quiebra (dinero negativo X semanas)
- [ ] 🧠 Guardado en IndexedDB tras una interfaz `SaveRepository` (permite pasar a archivos si se empaqueta como app de escritorio)
- [ ] 🧠 Partidas versionadas: versión del formato + migraciones para no romper partidas antiguas
- [ ] ⚡ Autoguardado semanal, botón manual y exportar/importar partida como `.json`
- [ ] ⚡ Tests de economía (ingresos/gastos de una semana)
- [ ] ⚡ Cifras del HUD animadas y textos flotantes "+120 €" sobre los edificios
- [ ] 🧠 Sistema de temas visuales de UI con Tailwind: estilo "carpeta del míster" (papel, clip, pestañas de colores en el lateral), fuente manuscrita para títulos y otra legible para datos

✅ **Validar:** una partida de 10 minutos tiene sentido económico; guardar y cargar funciona.

---

## Fase 3 — Temporada, partidos y ascenso (MVP)
**Resultado visible:** juegas una liga completa, ves la clasificación y puedes ascender.

- [ ] 🧠 Generador de liga ficticia: nombres de clubes y pueblos inventados, 10 equipos por división
- [ ] 🧠 Calendario de temporada (ida y vuelta) integrado en los ticks
- [ ] 🧠 Simulación de partido simple: fuerza del equipo derivada de instalaciones + moral + factor local
- [ ] ⚡ Pantalla de resultado del partido (marcador + 2-3 frases de resumen)
- [ ] ⚡ Tabla de clasificación
- [ ] 🧠 Fin de temporada: ascenso/descenso, premio económico, subida de fama
- [ ] 🧠 Primer desbloqueo por ascenso (p. ej. césped natural y grada mediana)
- [ ] ⚡ Tests: una temporada completa simulada sin errores
- [ ] ⚡ Día de partido animado: afición llegando al estadio, focos, sonido de grada (placeholder)

✅ **Validar MVP:** jugar una temporada entera, ascender y usar un edificio desbloqueado. **Aquí decidimos juntos si el bucle es divertido antes de seguir.**

---

## Fase 4 — Jugadores con necesidades
**Resultado visible:** llegan jugadores por tu fama y se quejan si les faltan cosas.

- [ ] 🧠 Modelo de jugador: nivel (tier), calidad, moral, necesidades
- [ ] 🧠 Llegada de jugadores según fama e instalaciones; salida si no están satisfechos
- [ ] 🧠 Necesidades por nivel (alojamiento, fisio, gimnasio, ocio) cubiertas por edificios con radio de efecto
- [ ] 🧠 Agentes como eventos con propuesta aceptar/rechazar
- [ ] ⚡ Nuevos edificios: pensión, residencia, fisioterapia, gimnasio
- [ ] ⚡ Panel de plantilla en Vue

✅ **Validar:** las decisiones de construcción afectan claramente a quién llega y cómo rinde.

---

## Fase 5 — Árbol de habilidades y desbloqueos
- [ ] 🧠 Sistema de investigación/puntos (p. ej. puntos de prestigio por temporada)
- [ ] ⚡ Definir el árbol en `content/tech-tree.ts` (ramas: deportiva, comercial, infraestructura)
- [ ] ⚡ UI del árbol en Vue
- [ ] 🧠 Conectar desbloqueos con edificios y mecánicas

✅ **Validar:** el árbol da decisiones interesantes, no solo "comprar todo".

---

## Fase 6 — Arte y mundo vivo
> Guía de estilo, pipeline de assets, sprites iniciales y cargador de atlas se adelantaron a la Fase 1B.

- [ ] Sprites del resto de edificios, objetos, personas y vehículos siguiendo la guía
- [ ] 🧠 Techos que se desvanecen para mostrar el interior de los edificios
- [ ] ⚡ Figuritas caminando (jugadores, staff, afición) con balanceo y rutas simples
- [ ] ⚡ Terreno: hierba con variaciones, tierra, caminos, árboles y bordes suaves
- [ ] 🧠 Ciclo día/noche con tintado y focos del estadio

✅ **Validar:** el juego se ve coherente y "vivo" en una captura de pantalla.

> El arte lo dibuja Claude en SVG (`assets/src/`) siguiendo `docs/GUIA-ESTILO.md` y Raul lo valida. Prison Architect es solo referencia de estilo: nunca se copian sus assets.

---

## Backlog (fases futuras, se desbloquean en el juego)
- Logística: flota (furgoneta → autobús → avión), cansancio por viaje, hoteles
- Economía: préstamos con intereses, vallas publicitarias con posición, patrocinios, merchandising, conciertos que dañan el césped, inversores
- Territorio: barrio que crece alrededor del estadio, compra de parcelas, clima y estado del césped, iluminación y derechos de TV
- Estrategia: club rival en la ciudad, ayuntamiento y permisos, facciones de afición, eventos aleatorios
- Cantera: escuelas en barrios, ojeadores
- Cadenas de suministro: cocina, lavandería, taller de equipaciones
