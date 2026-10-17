Estoy desarrollando un videojuego y quiero que me ayudes a afinar la siguiente fase de desarrollo antes de programarla. Actúa como diseñador de juegos con experiencia en juegos de gestión y construcción (Prison Architect, Anno, Timberborn, Two Point Hospital, Rimworld). Tu trabajo:

1. Leer todo el contexto de abajo.
2. **Hacerme preguntas** (por tandas de 3-5, no todas de golpe) sobre lo que necesites decidir o no veas claro.
3. Proponer ideas y mejoras, y cuestionar lo que veas flojo o aburrido. Prioriza que el juego sea **entretenido y bonito**, no realista.
4. Cuando lo tengamos cerrado, entregarme una **especificación final** con el formato que indico al final, que yo pasaré a mi agente de programación (Claude Code) para que la implemente.

---

## 1. El juego

**Club Builder** (nombre provisional "Grassroots"): juego 2D en vista cenital, estilo visual de Prison Architect (formas planas, contorno oscuro fino, sombras planas, encanto sobre realismo). Combina construcción, estrategia y gestión con un club de fútbol como núcleo.

- **No es un Football Manager**: no hay tácticas complejas ni fichajes directos. En mecánicas se parece más a Anno/Timberborn.
- Empiezas con un campo de tierra en un pueblo y vas construyendo instalaciones.
- Los jugadores **llegan** atraídos por la fama del club y las instalaciones (o vía agentes) y tienen **necesidades por nivel**, como los ciudadanos de Anno. Si no se cubren, rinden peor o se van. (Esto llega en la Fase 4; no es de esta fase, pero la economía debe dejarle sitio.)
- Los partidos se simulan rápido y el resultado depende de lo construido: moral, cansancio, instalaciones y afición. (Fase 3.)
- Ascender de división desbloquea edificios y sistemas nuevos. Divisiones actuales (provisionales): Liga Comarcal → Regional → Autonómica → Nacional B → Nacional A → Liga Élite.
- Ambiente "norte lluvioso": pueblo verde y húmedo, piedra gris, pizarra, luz cálida de focos y ventanas.
- Todo es ficticio: nada de clubes, ligas ni jugadores reales.
- Objetivo de calidad: tiene que sentirse **vivo y cuidado**, no una hoja de cálculo con mapa. Nada aparece de golpe (andamio → rebote + polvo), las cifras del HUD cuentan hacia arriba/abajo, los ingresos flotan como "+120 €" sobre el edificio que los genera, ciclo día/noche más adelante, UI con identidad (madera, lona, pizarra de vestuario, libreta de papel con letra manuscrita).

**Tecnología** (por si influye en tus propuestas): web con Vue 3 + PixiJS + TypeScript. La simulación está separada del render y avanza en **ticks deterministas: 1 tick = 1 hora de juego**; la velocidad (pausa / ×1 / ×3) solo cambia cuántos ticks se procesan por segundo real. Todo el contenido (edificios, costes, desbloqueos) se define como **datos**, así que las cifras se pueden ajustar sin tocar lógica. Guardado local en el navegador (IndexedDB). Rendimiento comprobado: 60 fps con un estadio grande y más de 200 objetos.

---

## 2. Lo que ya está hecho (Fases 0 a 1D)

Ahora mismo es un "editor de mapas" bonito y completo, **sin tiempo ni dinero**:

- **Mapa** de 240×160 casillas, todo construible. Carretera fija en el borde derecho con la entrada de la ciudad deportiva (garitas, barrera, aparcamiento, muelles de carga, árboles y farolas).
- **Construcción estilo Prison Architect**:
  - Suelos pintados por arrastre: hierba, tierra, grava, losa, hormigón, madera, baldosa, césped artificial/natural/híbrido, asfalto.
  - Muros (ladrillo, hormigón, enlucido, piedra, valla, seto) y puertas.
  - **Cimientos**: arrastras un rectángulo y se levantan los muros del perímetro con suelo interior.
  - **Salas** designadas con un clic dentro de un espacio cerrado. Cada tipo tiene requisitos y capacidad y avisa de lo que falta ("Vestuario: faltan 2 duchas"). Tipos: vestuario, oficina, recepción y algunos más.
- **27 objetos**: taquilla, banco, ducha, váter, lavabo, pizarra táctica, mesa, silla, archivador, mostrador, estantería, planta, fuente de agua, banquillo, portería de entrenamiento, banderín, árbol, farola, papelera, banco de parque, fuente, camilla de fisio, banco de pesas, bicicleta estática, barra de bar, máquina expendedora y mesa de cafetería.
- **Niveles de mejora** en algunos objetos (taquilla metálica → de madera → de lujo), con una "calidad" que alimentará las necesidades de los jugadores en la Fase 4.
- **Campos** de fútbol 11 y fútbol 7 mejorables en el sitio (tierra → artificial → natural → híbrido), con uso principal / filial / entrenamiento.
- **Estadio modular**: gradas pegadas a los lados del campo que crecen hacia fuera en 6 niveles, más córners. Cada grada tiene su **aforo**, y un estadio al máximo llega a unos 98 500 espectadores.
- **Desbloqueos por división** ya marcados en los datos (provisionales).
- **Herramientas de edición**:
  - Mover objetos.
  - Mover un campo con su estadio.
  - Mover bloques enteros (un edificio con salas y objetos, con giro).
  - Menú contextual con clic derecho (Mover, Mejorar, Ver ficha, Demoler).

### Cifras que ya están en los datos (provisionales, nunca se han probado jugando)
- Suelo por casilla: hierba 0, tierra 2, grava 4, hormigón 6, losa 8, madera 10, baldosa 12. Los céspedes son más caros (20 / 30 / 60).
- Muro por casilla: valla 3-4, hormigón 12, ladrillo 15, enlucido 18, piedra 25. Puertas: 120 a 400.
- Objetos: de 10 (papelera) a 600 (los más caros). Mejoras de taquilla 80 → 150 → 400; de ducha 150 → 250 → 600.
- Gradas por nivel (coste de cada mejora y espectadores por casilla de largo del lado):

| Nivel | Coste | Espectadores por casilla |
|---|---|---|
| Talud | 200 | 15 |
| Bancos de madera | 1 500 | 25 |
| Asientos | 8 000 | 45 |
| Tribuna cubierta | 30 000 | 80 |
| Grada de estadio | 150 000 | 200 |
| Gran tribuna | 600 000 | 440 |

  Los córners cuestan la mitad.
- Moneda: euros sin decimales. La escala es libre: se puede cambiar entera si propones otra mejor.

---

## 3. La fase que quiero afinar: Fase 2 — Tiempo y economía

**Resultado esperado:** el reloj avanza, el dinero sube y baja y el HUD lo muestra. Es el salto de editor a juego.

Plan actual (borrador, todo es discutible):

1. **Bucle de tiempo**: ticks de 1 hora, pausa / ×1 / ×3 (teclas espacio y 1-3), fecha y hora visibles.
2. **Recursos**: dinero, fama y afición.
3. **Costes**: construir cuesta (por casilla de suelo y de muro, por objeto, por mejora) y cada sala tiene **mantenimiento semanal**. Hoy la obra es instantánea; los obreros llegarán en fases posteriores.
4. **Ingresos básicos**: taquilla según aforo de las gradas y afición, cuotas de socios y quizá una subvención municipal. Los partidos y la liga llegan en la Fase 3, así que aquí hay que decidir si se simulan "días de partido" sencillos o se deja la taquilla preparada.
5. **Quiebra**: dinero negativo durante X semanas → fin de partida (o algo menos brusco).
6. **HUD** en la parte superior: fecha, velocidad y recursos con su variación (+/−) y cifras animadas. Textos flotantes "+120 €" sobre lo que genera dinero.
7. **Ficha de sala** ampliada: tipo, capacidad, requisitos, mantenimiento y qué aporta.
8. **Guardado**: partidas versionadas con migraciones, autoguardado semanal, guardado manual y exportar/importar a `.json`.
9. **Tema visual de UI "carpeta del míster"**: papel, clip, pestañas de colores, letra manuscrita para títulos y otra legible para datos.
10. **Informes** (como los Reports de Prison Architect): un cuaderno con pestañas de colores a la izquierda que van apareciendo con cada sistema. En esta fase entran **Finanzas** (ingresos y gastos por concepto, saldo neto por semana) y **Valoración** (qué piensa el pueblo o la afición del club, o cuánto vale el club).

**Checkpoint al terminar:** una partida de 10 minutos tiene sentido económico, y guardar y cargar funciona.

---

## 4. Referencia: cómo lo hace Prison Architect (datos de su wiki oficial)

Te lo paso como inspiración, no para copiarlo:

- **Arranque**: $30 000 iniciales. Un "fondo federal" de $2 000 al día (unos $840 tras un 30 % de impuestos) más $150 por preso y día. Bonus de hasta $10 000 por días sin incidentes.
- **Gastos**: salarios diarios (obreros $100/día), comida, programas e impuestos (30 % → 15 % → 1 % con investigación).
- **Subvenciones (grants)**: hasta 2 simultáneas (3 con investigación). Cada una tiene **adelanto al aceptar + bonus al completar objetivos**, y cancelar devuelve el adelanto con un 10 % de multa. Guían el orden de construcción y dan metas a corto plazo. Ejemplos: "Centro básico" $20 000 + $10 000; "Educación" $15 000 + $40 000. Hay una subvención de rescate oculta si entras en bancarrota.
- **Burocracia**: un árbol de investigación donde cada rama exige **contratar un cargo** y pagar **dinero + tiempo** (p. ej. Finanzas: contratar al contable, $500, 6 h → desbloquea los informes de finanzas y valoración y los préstamos).
- **Préstamos**: interés por hora y calificación crediticia.
- **Tiempo**: un día de juego dura unos 24 min reales a velocidad normal. Velocidades hasta ×5 (×10 en algunos controles). Reloj arriba a la derecha y barra superior con saldo, flujo de caja diario y capacidad.
- **Lista de tareas**: una nota adhesiva arriba a la izquierda con subvenciones, llegadas, eventos y estado.
- **Informes**: 12 pestañas (Finanzas y Valoración requieren contable). Valoración = valor de la prisión, y se pueden vender acciones.
- **Demoler** no reembolsa dinero.

Lo que ya teníamos pensado adaptar (repartido entre fases): patrocinios con adelanto + bonus como versión de las subvenciones (Fase 5, o una versión simple en la 2), subvención municipal + cuotas de socios como "fondo federal" (Fase 2), un tablón del vestuario como lista de tareas (Fase 2), una junta directiva como árbol de burocracia (Fase 5), préstamos y venta de acciones (más adelante) y el horario del club (Fase 3).

---

## 5. Decisiones abiertas que quiero resolver contigo

- **Escala de números**: ¿euros "realistas" de fútbol modesto o cifras simplificadas? ¿Dinero inicial? ¿Cuadran los costes actuales con los ingresos que propongas?
- **Ritmo**: cuánto dura un día, una semana y una temporada en tiempo real a ×1. No quiero que una temporada se haga eterna ni demasiado corta. ¿Cuántos ticks por segundo?
- **Ingresos antes de que existan los partidos (Fase 3)**: ¿qué da dinero al principio? Socios, subvención, cafetería o bar, alquiler del campo, escuelas de fútbol, patrocinio local…
- **Fama y afición**: ¿qué las sube y qué las baja?, ¿para qué sirven ya en esta fase?, ¿se ven en el mapa (gente, banderas…)?
- **Mantenimiento**: ¿por sala, por objeto, por casilla? ¿Qué pasa si no se paga?
- **Mover y demoler**: ¿mover cuesta dinero (p. ej. un % como mano de obra)? ¿Demoler devuelve algo?
- **Quiebra**: ¿fin de partida, rescate con condiciones o pérdida de algo (instalaciones, división)?
- **Inicio de partida**: ¿empieza con el campo de tierra ya colocado y algo de dinero, o con el mapa vacío?
- **Metas a corto plazo** para que los primeros 10 minutos enganchen: ¿una versión simple de patrocinios u objetivos ya en esta fase?
- **Valoración**: ¿qué mide exactamente y qué la hace subir?
- Cualquier cosa que falte en el plan para que el juego sea entretenido, o que sobre en esta fase y convenga mover a otra.

---

## 6. Formato de la especificación final (cuando hayamos cerrado todo)

Entrégamela en Markdown, en español, con estas secciones:

1. **Resumen de decisiones**: una lista corta con cada decisión tomada y su porqué en una línea.
2. **Bucle de juego de la Fase 2**: qué hace el jugador minuto a minuto en los primeros 10 minutos.
3. **Tiempo**: duración de día, semana y temporada, ticks por segundo y velocidades.
4. **Economía en tablas de datos**: dinero inicial, ingresos (concepto, fórmula, cuándo se cobra), gastos (concepto, fórmula, cuándo se paga), costes de construcción revisados (si cambian) y quiebra. Fórmulas concretas con números, no descripciones vagas.
5. **Fama y afición**: qué las mueve (con números) y qué efectos tienen.
6. **Interfaz**: HUD, textos flotantes, ficha de sala, informes (qué pestañas y qué muestra cada una), tablón de tareas si entra… Descríbelo con el estilo visual del juego.
7. **Lista de tareas** para el plan, en orden de implementación, marcando cada una como 🧠 (arquitectura, simulación, decisiones) o ⚡ (sencilla y bien definida). Indica qué se ve al terminar cada bloque y cómo probarlo.
8. **Lo que se deja fuera** de esta fase y a qué fase va.
9. **Checkpoint**: cómo se valida que la fase está bien hecha.

Empieza haciéndome tu primera tanda de preguntas.
