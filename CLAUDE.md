# Club Builder — contexto para Claude Code

## Qué es este juego
Juego 2D en **vista cenital** (desde arriba, estilo visual de Prison Architect) que combina **construcción, estrategia y gestión de recursos** con un club de fútbol como núcleo. NO es un Football Manager: no hay tácticas complejas ni fichajes directos. En mecánicas se parece más a Anno/Timberborn:

- Empiezas con un campo de tierra en un pueblo y construyes instalaciones.
- Los jugadores **llegan** atraídos por la fama del club y las instalaciones (o vía agentes), y tienen **necesidades por nivel** (como los ciudadanos de Anno). Si no se cubren, rinden peor o se van.
- Los partidos se simulan rápido; el resultado depende de lo construido (moral, cansancio, instalaciones, afición).
- Ascender de división desbloquea edificios y sistemas nuevos.
- Todo el contenido es ficticio: nada de clubes, ligas, escudos ni jugadores reales.

## Stack
- Vite + Vue 3 (Composition API, `<script setup>`) + TypeScript estricto
- PixiJS v8 para el mapa cenital (solo renderizado)
- Tailwind CSS v4 (plugin `@tailwindcss/vite`) para toda la UI en Vue. No afecta al canvas de Pixi
- GSAP para animaciones (tweens en Pixi y en la UI)
- Pinia para el estado de la UI
- Vitest para tests
- Guardado local en IndexedDB
- Casillas cuadradas de 64×64 px
- Sprites 2D en estilo plano: fuente en SVG (`assets/src/`), exportados a PNG y empaquetados en atlas por script

## Arquitectura (reglas no negociables)
1. **La simulación no conoce a Pixi ni a Vue.** Vive en `src/sim/` como TypeScript puro, testeable sin navegador.
2. **Bucle de ticks determinista.** El tiempo avanza en ticks fijos (1 tick = 1 hora de juego). La velocidad (pausa/1x/3x) solo cambia cuántos ticks se procesan por segundo real.
3. **Contenido guiado por datos.** Edificios, recursos, desbloqueos y eventos se definen en `src/content/*.ts` como datos tipados, no como lógica dispersa. Añadir un edificio nuevo = añadir una entrada.
4. **Render lee, nunca escribe.** `src/render/` dibuja el estado de la simulación. Las acciones del jugador pasan por comandos (`src/sim/commands.ts`).
5. **UI en Vue.** Menús, HUD, paneles y árbol de habilidades en `src/ui/`. El canvas de Pixi se monta en un componente Vue.

```
src/
  sim/        # lógica pura: estado, ticks, economía, temporada
  content/    # datos: edificios, recursos, desbloqueos
  render/     # PixiJS: capas (suelo, edificios, personas, efectos), cámara, sprites
  ui/         # componentes Vue
  save/       # guardado/carga IndexedDB
assets/src/   # fuentes SVG de los sprites
assets/dist/  # atlas PNG generados (no editar a mano)
tools/        # scripts: exportar SVG → PNG y generar atlas
docs/PLAN.md  # plan por fases
docs/ASSETS-LICENSES.md # origen y licencia de cada asset
```

## Calidad visual (referencia visual: Prison Architect)
Bonito y con encanto, no realista. El juego tiene que sentirse vivo y cuidado, no como una hoja de cálculo con mapa.

- **Estilo:** vista cenital, formas simples, colores planos, contorno oscuro fino y sombra plana suave hacia abajo a la derecha. Paleta limitada y definida en `src/render/palette.ts`.
- **Edificios con interior:** el techo se desvanece al pasar el ratón o al hacer zoom, mostrando el interior (vestuario, gimnasio, despachos) con gente dentro.
- **Personas estilo figurita:** cuerpo y cabeza vistos desde arriba, con un leve balanceo al caminar; sin animación de piernas.

- **Nada aparece de golpe.** Construir: andamio → edificio que "rebota" al terminar + nube de polvo. Demoler: se desvanece con polvo. Paneles de UI: entran con transición suave.
- **El mundo respira.** Ciclo día/noche con tintado de luz, focos del estadio que se encienden de noche, banderas y árboles con movimiento sutil, pequeñas figuras caminando entre edificios.
- **Feedback de números.** Las cifras del HUD cuentan hacia arriba/abajo en lugar de saltar; ingresos flotan como "+120 €" sobre el edificio que los genera.
- **UI con identidad.** Paneles con aire deportivo y cálido (madera, lona, pizarra de vestuario), no un dashboard genérico. Una sola familia tipográfica de títulos con carácter y otra legible para datos.
- **Rendimiento primero.** Animaciones con tweens y sprites; nada que baje de 60 fps con 200 edificios. Respetar `prefers-reduced-motion` en la UI.
- Todo asset nuevo se registra en `docs/ASSETS-LICENSES.md` con su origen y licencia.

## Forma de trabajar
- **Fases con checkpoint.** Trabaja solo en la fase actual de `docs/PLAN.md`. Al terminar una fase, para, resume lo hecho, explica cómo probarlo y **espera la validación de Raul** antes de seguir.
- **Explica antes de ejecutar** comandos que modifiquen estado (instalar dependencias, borrar o mover archivos, cambios de git).
- **Cambios mínimos y quirúrgicos.** Nada de refactors grandes sin pedirlo.
- **Commits pequeños** por tarea, con mensaje en español.
- Marca las tareas completadas en `docs/PLAN.md` (`[x]`).

## Delegación a Sonnet
Las tareas marcadas con ⚡ en el plan son sencillas y se delegan al subagente `implementador` (modelo Sonnet). Las marcadas con 🧠 (arquitectura, simulación, decisiones de diseño) las hace el agente principal. Tras delegar, revisa el resultado antes de darlo por bueno.
