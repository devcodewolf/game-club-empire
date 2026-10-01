# Prison Architect: escala, mapa, terreno, zoom y cámara

> Leyenda de fiabilidad: **[wiki]** dato de la wiki oficial · **[web]** dato de otra fuente (foros, fandom, búsqueda) · **[est.]** estimación nuestra, no confirmada.
> Salas y objetos concretos: ver [pa-salas-y-objetos.md](pa-salas-y-objetos.md).

## 1. Respuesta corta a la pregunta de escala

| Aspecto | Valor en PA | Fiabilidad |
|---|---|---|
| Tamaño de mapa pequeño | **100 x 80 casillas** | [wiki: Sandbox_Mode] |
| Tamaño de mapa mediano | **150 x 120 casillas** | [wiki: Sandbox_Mode] |
| Tamaño de mapa grande | **200 x 160 casillas** | [wiki: Sandbox_Mode] |
| Relación de aspecto | 5:4 en los tres (ancho : alto) | calculado |
| Equivalencia de una casilla | aprox. 1 m2 ("each square roughly equals one square meter") | [wiki] |
| Casillas por persona | **1 casilla** (cada preso/guardia ocupa y se mueve por una casilla; el cuerpo mide menos de una casilla) | [est.] a partir de que las celdas mínimas son 2x3 y caben 1-2 presos |
| Celda mínima | 2 x 3 casillas (sin la investigación "Small Cells", que lo elimina) | [wiki: Rooms, Bureaucracy] |
| Oficina típica | 4 x 4 | [wiki: Quickstart] |
| Sala mínima de taller/aula | 5 x 5 | [wiki: Rooms] |
| Patio (Yard) | mínimo 5 x 5; ideal 100+ casillas (+1 nota) y 200+ (+2); 50 o menos penaliza | [wiki: Yard] |
| Compra de terreno | Investigación **Land Expansion** ($1.000, 12 h, requiere Contable): permite ampliar por direcciones. Tamaño exacto y precio por franja: no figura en la wiki | [wiki] parcial |
| Margen del mapa | no se construye en el borde exterior (1 casilla); carretera de 7 casillas de ancho con 5 casillas de tierra a su derecha | [web: foro/fandom] |
| Zoom | sin niveles documentados en la wiki: se controla con Q/E o rueda | ver sección 4 |

Conclusión: **PA es un juego de mapas pequeños y densos**. Un mapa pequeño tiene 8.000 casillas; el grande, 32.000. Nuestro mapa de 240 x 160 (38.400 casillas) es **un 20 % mayor que el grande de PA**, así que, si queremos la misma sensación de densidad, nuestras instalaciones deben ser grandes o el mapa se verá vacío.

## 2. Tamaños de mapa y comparación con Grassroots

| | PA pequeño | PA mediano | PA grande | Grassroots (actual) |
|---|---|---|---|---|
| Ancho x alto | 100x80 | 150x120 | 200x160 | 240x160 |
| Casillas | 8.000 | 18.000 | 32.000 | 38.400 |
| Relación | 5:4 | 5:4 | 5:4 | 3:2 |

Punto de referencia de la wiki: "una prisión grande mide 200 casillas de ancho; la diagonal ronda las 290 casillas" (página de la Water Pump Station). Útil para dimensionar redes de tuberías y cables.

Datos de escala verificados con la comunidad [web]:
- La escala **no es realista**: un jugador midió ~9 km entre el comedor y el taller de una prisión pequeña según la velocidad de los personajes. Los presos caminan muy lento respecto a su tamaño.
- Los desarrolladores aplican un "timewarp" interno en prisiones grandes (afecta al movimiento y a los programas, no a las necesidades).
- Las condenas no coinciden con el tiempo de juego: 1 año de condena = 120 horas de juego (5 días) [wiki: Prisoners].

Consecuencia de diseño: **la coherencia jugable pesa más que la métrica real**. Nos conviene definir una escala propia (ver sección 6).

## 3. Terreno, compra de tierra y sectores

- **Estado inicial** [wiki]: terreno de tierra con carretera pregenerada (los camiones y vehículos solo usan la carretera pregenerada con marcas, nunca una custom). Todo el mapa está disponible para construir, salvo si se activa el "fog of war" o el terreno generado (bosques, lagos, edificios) en Sandbox.
- **Ampliar tierra** [wiki: Bureaucracy → Finance]: la investigación *Land Expansion* ($1.000, 12 h) habilita la expansión direccional. No documentan el coste por parcela en esta wiki (hay que verificarlo en el juego).
- **Terreno natural**: árboles (3 troncos por árbol), agua (no transitable, $10/casilla si se coloca), barro y arena (velocidad 0,5).
- **Sectores** [wiki: Sector]: un sector es "toda zona completamente cerrada por muros y puertas que no es una sala". Se asigna a un nivel de seguridad (nueve designaciones con colores: Compartido blanco, Min Sec azul, Med Sec naranja, Max Sec rojo, Protegido amarillo, SuperMax rojo oscuro, Pena de muerte negro, Solo personal morado, Sin bloquear verde). El personal y los visitantes entran en todos; los presos escoltados también.
- **Calificación de sector**: de 0 a 250 según instalaciones y privilegios; incentiva mejorar progresivamente.
- Velocidad de movimiento por suelo [wiki: Materials]: tierra/hierba/grava 0,7; barro/arena 0,5; hormigón, adoquín, suelos industriales 1,2-1,3; pista de atletismo 2,0; agua 0,0. Esto es una **herramienta de diseño del movimiento** (caminos de piedra aceleran).

## 4. Zoom y cámara

Lo que dice la wiki [wiki: Controls, User_interface]:
- Zoom: **Q** o rueda arriba = acercar; **E** o rueda abajo = alejar.
- Mover cámara: W/A/S/D o flechas, o arrastrar con la rueda pulsada.
- Escala de la interfaz: teclas **+** y **)**.
- La wiki **no documenta** número de niveles de zoom, zoom mínimo/máximo ni qué se ve a cada zoom.

Lo que sabemos por otras vías [web] / [est.]:
- El zoom es **continuo (suave)** con rueda; no hay escalones discretos duros [est.].
- Cuando se aleja, los **techos no existen como capa**: en PA se ven siempre las salas desde arriba con "suelo con colores" y nombre de la sala; lo que cambia es el nivel de detalle (los iconos de objetos y personas se simplifican). El antiguo "techo oscuro con fog of war" se rediseñó: las zonas no vigiladas se muestran en gris con las entidades ocultas, pero los objetos estáticos siguen visibles [web].
- A zoom por defecto en una pantalla 1080p se ven **del orden de 60 x 35 casillas** (con la tile a unos 32 px) [est.]. Es una estimación: no hay fuente.
- El mapa pequeño (100x80) cabe casi entero con un zoom moderado; el grande exige alejar bastante [est.].
- Existe un modo 3D oculto (descubierto por la comunidad), no relevante.

## 5. Tiempo (relacionado con escala)

- Un día de juego = **24 horas**; 1 hora de juego = **aprox. 1 minuto real** a velocidad normal (día = ~24 min) [web: fandom/foros; no confirmado en la wiki oficial].
- Velocidades: pausa, 1x, 2x, 5x y 10x (teclas 1-4 según Controls; la página User_interface solo menciona hasta 5x).
- 1 tick de nuestro juego = 1 hora de juego, igual que la hora de PA.

## 6. Qué nos llevamos para Grassroots

| Decisión | Propuesta |
|---|---|
| Tamaño de casilla en pantalla | 64 px (ya fijado). Equivale a ~2 m para campos (11: 56x38 casillas = 112x76 m) y a ~1 m para interiores; aceptable porque PA tampoco es realista. |
| Persona | 1 casilla de ocupación lógica; dibujo de ~0,5 casilla de diámetro. En nuestro 64 px: figura de ~32 px. |
| Zoom | Continuo con rueda y atajos Q/E. Niveles clave: (a) mapa entero (mínimo, ya hecho), (b) vista de ciudad deportiva, (c) vista de sala (techos translúcidos, personas visibles). Documentar cifras en `docs/PLAN.md` al implementarlo. |
| Densidad del mapa | Con 38.400 casillas, hay que llenarlas con más cosas (campos secundarios, aparcamiento, fachadas) o reducir tamaño inicial con ampliaciones de pago (ya previsto en backlog). |
| Terreno por velocidad | Suelos con multiplicador de velocidad: caminos aceleran el movimiento (Fase 4). |
| Sectores | Zonas cerradas con permisos: público, jugadores, solo personal (Fase 4/5). |

## Fuentes
- https://prisonarchitect.paradoxwikis.com/Sandbox_Mode
- https://prisonarchitect.paradoxwikis.com/Prison
- https://prisonarchitect.paradoxwikis.com/Controls
- https://prisonarchitect.paradoxwikis.com/User_interface
- https://prisonarchitect.paradoxwikis.com/Rooms
- https://prisonarchitect.paradoxwikis.com/Yard
- https://prisonarchitect.paradoxwikis.com/Sector
- https://prisonarchitect.paradoxwikis.com/Materials
- https://prisonarchitect.paradoxwikis.com/Bureaucracy
- https://prisonarchitect.paradoxwikis.com/Water_Pump_Station
- https://prisonarchitect.paradoxwikis.com/Road
- https://prisonarchitect.paradoxwikis.com/Prisoners
- https://forums.introversion.co.uk/viewtopic.php?f=42&t=54628 (escala y velocidad de personajes)
- Resultados de búsqueda web (7 casillas de carretera, 5 de tierra, día = 24 min): fandom y foros de Introversion.
