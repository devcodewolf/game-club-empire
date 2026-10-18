# Cuaderno de ideas

Ideas de Raul y propuestas de Claude para que el juego sea entretenido, bonito y no se haga cuesta arriba. Cada idea lleva la fase o bloque donde encaja y su estado:

- **En el plan:** ya está como tarea en `docs/PLAN.md`.
- **Propuesta:** pendiente de que Raul la valide.
- **Descartada:** se decidió no hacerla (con el motivo).

Las cifras son orientativas: se ajustan jugando.

---

## Ideas de Raul

### Subvenciones con objetivos, como las de Prison Architect · Fase 2, Bloque F · En el plan
El ayuntamiento (y más adelante la federación) ofrece **subvenciones con objetivos concretos**: se cobra un **adelanto al aceptar** y un **bonus al cumplirlos todos**. Hacen de tutorial encubierto y guían qué construir. Se distinguen de los **patrocinios** (negocios del pueblo, temporales y algo aleatorios):

| | Subvenciones | Patrocinios |
|---|---|---|
| Quién | Ayuntamiento, federación | Panadería, taller, sidrería… |
| Cuáles | Lista fija, encadenada: cumplir una desbloquea otras | Ofertas que aparecen cada 2 semanas |
| A la vez | 2 activas | 2 activos |
| Cancelar | Devuelve el adelanto + 10 % | Devuelve el adelanto + 10 % |

Ejemplos de la cadena inicial:
1. **"Un club en regla"** (inicial): vestuario completo + oficina completa → 2.000 € al aceptar + 3.000 € al cumplir.
2. **"Campo digno"**: contratar un jardinero + estado del campo ≥ 55 durante una semana seguida → 0 + 3.000 €. (Con 70 y dos semanas era imposible: la tierra llega a 60 y cada partido en casa le quita 8.)
3. **"Escuela del pueblo"** (se abre al cumplir la 1): abrir la escuela + 30 alumnos → 1.000 + 4.000 €.
4. **"Casa llena"** (se abre al cumplir la 2): aforo ≥ 600 + un partido sin gente fuera → 2.000 + 5.000 €.
5. **"Rescate municipal"** (oculta): solo aparece en quiebra (Bloque G).

En el tablón y en la pestaña Subvenciones del cuaderno, los objetivos se tachan al cumplirse, como en PA.

### Estado del campo visible y reparación de pago · Fase 2, Bloque D · En el plan
- La ficha del campo muestra su **estado (0-100)** con una barra y por qué baja: lluvia, partidos, alquileres y, más adelante, conciertos y eventos.
- Botón **"Reparar el césped"**: cuesta según la superficie y recupera estado de golpe. El campo queda unos días sin poder alquilarse; si coincide con partido, se juega en peor estado.
- **Cambiar de césped** ya existe: mejorar el campo (tierra → artificial → natural → híbrido).
- En el mapa, más adelante (Fase 4B/6), zonas gastadas en las áreas y el centro, y charcos con lluvia.

### Vestuario local y vestuario visitante · Fase 2, Bloque E · En el plan
- En la ficha de un vestuario se elige su uso: **Local** o **Visitante**, igual que el uso de los campos.
- La fuerza del equipo usa la calidad del **vestuario local**.
- Para jugar en casa hace falta un **vestuario visitante**. Si no lo hay, la federación multa (200 €) y baja la fama (−1). Un buen vestuario visitante sube un poco la satisfacción.
- La **caseta vieja** puede servir de vestuario visitante cuando se construya el local de verdad: así no hay que demolerla.

### Acceso de la afición como en un estadio de verdad · Fase 3 · En el plan
- El recinto del campo se cierra con **muros o vallas** y se abren **puertas de acceso con tornos** (objeto nuevo), junto a una **taquilla** de venta.
- Cada torno deja pasar un número de personas por partido: la asistencia se limita por los tornos además de por el aforo.
- Sin recinto cerrado entra gente sin pagar ("colados"): la taquilla recauda menos.
- El día de partido, la afición llega por la carretera y hace cola en los tornos (con las personas de la Fase 4).

### Banquillos en zonas fijas junto al campo · Fase 2, Bloque E · Hecho
- Cada campo trae **dos zonas acotadas** a la altura del centro del campo, fuera de la línea de banda (local y visitante), marcadas en el césped. Solo ahí se pueden poner banquillos, igual que las vallas publicitarias del Bloque F van pegadas al campo.
- El banquillo es un dato del campo, no un objeto suelto: se mueve, gira y se mejora con él.
- **Mejoras por niveles** desde la ficha del campo, desbloqueadas por división: banco de madera (+2 de fuerza en casa) → techo de chapa (+3, Regional) → cubierto con asientos (+4, Autonómica) → de estadio con calefacción (+5, Nacional B).
- Efecto: un pequeño extra de moral y fuerza en casa con el banquillo local, y satisfacción con el visitante. Sin banquillos, el partido se juega igual, con una nota en el tablón ("Los suplentes se sientan en el suelo").

### Túnel de vestuarios hasta el campo · Fase 3 · En el plan
- Un **túnel** (pasillo cubierto) que une el **vestuario local** con el campo. Se dibuja como un muro o pasillo, desde una puerta del vestuario hasta la zona de banquillos.
- **Calidades y precios** por casilla: pasillo de lona → túnel de obra → túnel con iluminación y escudo.
- Efecto: con túnel, el equipo sale al campo sin mojarse ni cruzarse con la afición, con un extra de moral que sube con la calidad. En la Fase 4 los jugadores lo recorren de verdad el día de partido.
- Enlaza con el acceso de la afición (Fase 3): el túnel separa jugadores y público dentro del recinto cerrado.

### Pestaña de Partidos con clasificación y temporadas anteriores · Fase 2 (resultados) y Fase 3 (clasificación) · En el plan
- En el cuaderno, la pestaña **Partidos**: próximo partido, resumen de la temporada (jugados, ganados, empatados, perdidos, goles y puntos) y la lista de resultados. Hecha en la Fase 2.
- La **clasificación** llega con la liga en la Fase 3.
- **Temporadas anteriores:** no hace falta guardarlas enteras. Propuesta de Claude: una línea por temporada (división, puesto, puntos y si se ascendió), como un pequeño palmarés. Es barato de guardar y da sensación de historia.

### La fuerza del equipo también depende de los jugadores · Fase 4 · En el plan
- Cuando lleguen los jugadores (Fase 4), su nivel, moral y cansancio entran en la fuerza del equipo, además de las instalaciones.
- En el cuaderno, pestañas de **Plantilla** (jugadores) y **Personal** (ya existe).

### Pestaña de entrenamientos · Fase 3 (horario del equipo) y Fase 4 (por jugador) · En el plan
- Una pestaña **Entrenamientos** (como el "Regime" de Prison Architect) para repartir la semana: qué días se entrena y cuántas horas de **campo**, **táctica**, **gimnasio** y **físico**.
- Cada tipo suma algo distinto a la fuerza del partido: táctica y campo, el juego; gimnasio y físico, aguantar el partido y lesionarse menos. Necesita las salas correspondientes (gimnasio, sala de vídeo o táctica).
- **Pero entrenar mucho cansa y baja la moral y el contento**: hay que dejar días de descanso, sobre todo antes del partido. Es una decisión con equilibrio, no "cuanto más, mejor".
- En la Fase 3 se aplica al equipo entero; en la Fase 4, cada jugador lo nota según sus necesidades.

### Árbol de decisiones con el presidente, como la "Bureaucracy" de PA · Fase 5 · En el plan
- Un tablero con el **presidente** arriba y, unidos con líneas, los cargos y áreas del club (secretario técnico, director financiero, coordinador de cantera, jefe de mantenimiento, prensa…). Cada uno, una ficha con su retrato dibujado, su precio y lo que desbloquea (sistemas, pestañas del cuaderno, edificios, mejoras). Lo que aún no se puede pagar o no está desbloqueado sale apagado.
- Encaja con el árbol de la Fase 5: en vez de un árbol abstracto, son **personas del club** que se van incorporando.
- Se abre con un icono en la cabecera del tablón (la cara del presidente), como los iconos de la lista "Todo" de PA.

### Tablón como la lista "Todo" de PA · Fase 2, Bloque F · Hecho
- Hoja de libreta con renglones arriba a la izquierda: "Tablón 1/4" (tareas cumplidas sobre el total), apartados con cuadradito negro y título en negrita, el dinero de cada subvención en rojo a la derecha y las tareas tachadas al cumplirse. Toda la gestión, en las pestañas de Informes.
- Más adelante, iconos en la cabecera (presidente, avisos…), como en PA.

### Focos del campo y partidos de noche · Fase 3 (con el ciclo día/noche) · En el plan
- Cada campo trae un **hueco para focos en sus cuatro esquinas**, como los banquillos: un dato del campo que se compra y se **mejora por niveles** (postes con dos focos → torres → torres de estadio).
- Con el ciclo día/noche, en invierno anochece pronto: un partido a las 21:00 se juega a oscuras. Sin focos (o con focos flojos) baja la fuerza en casa y la asistencia, o directamente no se puede programar el partido tarde. Con buenos focos, partidos nocturnos con más público.
- En el mapa, los focos se encienden de noche (ya está en la guía visual: "focos del estadio que se encienden de noche").

### Derechos de televisión · Fase 3 · En el plan
- Al llegar a **Segunda y Primera**, las cadenas pagan por retransmitir: un ingreso por partido (o por temporada) según la división y la fama. Puede pedir requisitos (focos de cierto nivel, una tribuna de prensa, aforo mínimo) que den motivos para construir.
- Encaja como fuente de ingreso que sustituye a las pequeñas del pueblo cuando el club crece.

### Marcas deportivas (inventadas) · Fase 5 · Propuesta
- Además de los negocios del pueblo, **marcas deportivas** que visten al club: equipación, balones, botas. Encaja con el "patrocinio de camiseta" de la Fase 5. Contrato por temporada, cuanto más fama y división, mejores marcas y más dinero. El logotipo sale en la camiseta de las figuritas, en las vallas y en la tienda del club.
- **Siempre inventadas**, como los clubes: Nike, Adidas, Puma, Joma, Kelme… son marcas registradas, y usarlas en un juego publicado es un riesgo. Nombres con el mismo aire y sin parecerse a ninguna real, por ejemplo **Zancada**, **Brío Sport**, **Dorsal 9**, **Remate** o **Taco Pro**. Hay que comprobar cada nombre antes de usarlo.

### Pantalla de inicio con el nombre del club · Fase 2, Bloque I · En el plan
- Al empezar una partida nueva se elige el **nombre del club** y otras cosas que se decidirán en su momento (colores, escudo dibujado, dificultad…). Hasta entonces el club se llama "Tu club".
- Va junto al guardado: la pantalla de inicio ofrece nueva partida, continuar y cargar.
- **El guardado se analiza antes con Claude chat** (qué se guarda, ranuras, autoguardado, versiones y migraciones), como se hizo con el diseño de la Fase 2.

### Rivales con nombres de ciudades reales en las categorías altas · Fase 3 · En el plan
- Raul propone: equipos inventados en las categorías bajas y, a partir de Tercera, nombres de capitales y ciudades importantes de las comunidades autónomas (Oviedo, Madrid, Sevilla, Langreo, Mieres…).
- **Choca con una regla de CLAUDE.md:** "Todo el contenido es ficticio: nada de clubes, ligas, escudos ni jugadores reales". Los nombres de ciudades no son de nadie, pero los de clubes sí (Atlético de Madrid, Sevilla F.C., U.P. Langreo, Real Oviedo… son marcas registradas). Si el juego se publica, usarlos es un riesgo.
- **Decisión de Raul:** nombres de **ciudades, pueblos y barrios** reales, nunca de clubes. Más grandes cuanto más alta la división: pueblos inventados en las categorías bajas y, desde Tercera, ciudades medianas y grandes y barrios de las capitales ("Oviedo", "Langreo", "Mieres", "Chamartín", "Vallecas", "Getafe", "Madrid"…).
- El nombre va **solo**, sin siglas. Ojo: añadir "C.F." o "Real" puede dar justo el nombre de un club que existe ("Getafe C.F.", "Real Oviedo"). Si se quiere variedad, sufijos que no coincidan con ninguno, comprobando cada nombre antes de usarlo.

---

## Propuestas de Claude

### Para que sea más entretenido
- **Peñas de aficionados** · Fase 3 · En el plan: con suficiente afición nace una peña con nombre propio que pide cosas ("una grada cubierta para el fondo norte") y, si se las das, sube la afición y anima en los partidos (más fuerza en casa).
- **Rivalidad con el pueblo vecino** · Fase 3 · En el plan: un rival fijo; el derbi llena el estadio y vale el doble de fama.
- **Eventos de temporada** · Fase 5 · En el plan: fiestas del pueblo, concierto de verano o feria en el campo. Dan mucho dinero y fama, pero desgastan el césped (enlaza con el estado del campo).
- **Logros** · Fase 5 · En el plan: "Rey del barro" (ascender con campo de tierra), "Cien socios", "Casa llena"… (ver `docs/referencias/README.md`).

### Para que sea más fácil y menos tedioso
- **Copiar un bloque** · Fase 2, Bloque J · En el plan (pagando lo que cuesta construirlo): como el "Quick build" de PA. Con la herramienta de mover bloques ya hecha, copiar un vestuario entero y pegarlo en otro sitio (pagando lo que cuesta) es casi inmediato y ahorra mucho trabajo repetitivo.
- **Planificar en pausa** · Fase 2 o backlog · Propuesta: dibujar obras como plano (fantasma azul, sin coste) y confirmarlas todas a la vez cuando haya dinero.
- **El tablón avisa de lo que frena al club** · Fase 2, Bloque F · En el plan: notas como "El vestuario no cuenta: le faltan 2 duchas" o "Nadie cuida el campo: contrata un jardinero", que llevan a la ficha al hacer clic.
- **Dificultad elegible** · Fase 3 · Propuesta: Fácil / Normal / Difícil como multiplicadores de ingresos, costes y paciencia de la afición (todo son datos de `content/`).
- **"¿Por qué pierdo dinero?"** · Fase 2, Bloque H · Propuesta: en Finanzas, una frase que señala el mayor gasto y el ingreso que más ha bajado.
