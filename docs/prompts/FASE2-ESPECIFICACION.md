# Fase 2 — Tiempo y economía: especificación

Todas las cifras son **datos** en `src/content/` y se ajustarán jugando. Moneda: euros sin decimales. Toda aleatoriedad usa el PRNG sembrado de la partida (nada de `Math.random()`).

---

## 1. Resumen de decisiones

| Decisión | Por qué |
|---|---|
| 1 día = 12 min reales a ×1; velocidades ×1 / ×3 / ×5 / ×10 + "próximo evento" | Días largos para ver el club vivo; la velocidad evita que se haga lento |
| Tick de simulación = 1 minuto de juego | Deja preparado el movimiento de personas de la Fase 4; la economía se dispara por hora, día o semana |
| Partido mínimo cada domingo (casa/fuera alternos) | El ritmo semanal que culmina en el partido es el corazón del juego; sin él la fase es solo ver bajar el dinero |
| Escala realista redondeada | Ver crecer el presupuesto de miles a millones es parte de la gracia |
| Inicio: campo de tierra + caseta vieja + dinero + ayuda municipal decreciente | Historia desde el minuto uno, arranque holgado y presión que llega cuando ya se entiende el juego |
| 8 fuentes de ingreso (subvención, socios, taquilla, bar, alquiler del campo, escuela, vallas, aparcamiento) + lotería de Navidad | Variedad de decisiones desde el principio, todas temáticas |
| Mantenimiento semanal por objeto, suelo y grada + personal abstracto con cobertura | Coste continuo que obliga a crecer con cabeza; el personal se verá caminando en la Fase 4 sin cambiar reglas |
| Mover objeto gratis, mover bloque/campo 10 %, demoler devuelve 50 % objetos y 25 % suelos y muros, deshacer 10 s al 100 % | No castigar a quien ordena, pero que equivocarse tenga coste |
| Patrocinios locales con adelanto + bonus en un tablón | Metas cortas y tutorial encubierto |
| Afición = personas (local); fama = reputación 0-100 | No se solapan: la afición da dinero, la fama abre puertas |
| Dos rescates municipales; la tercera quiebra termina la partida | Perdonar errores sin quitar tensión |
| Valoración = valor del club en € + opinión del pueblo en frases | Marcador a largo plazo y explicación amena de qué funciona |

---

## 2. Bucle de juego: los primeros minutos

1. **Minuto 0.** Lunes 23 de agosto, año 1, 09:00, en pausa. Se ve el campo de tierra, la caseta vieja junto a él (vestuario precario: funciona, pero calidad 1) y el tablón con dos patrocinios ofrecidos y una nota del alcalde: *"El pueblo confía en vosotros. Os ayudamos este primer mes."*
2. **Minutos 1-8.** Acepta un patrocinio (cobra el adelanto, la cifra sube animada). Construye un vestuario de verdad, contrata un jardinero y quizá pone un talud en un lateral. Cada obra resta dinero con su "−X €" flotante.
3. **Minutos 8-15.** Pone ×5 o ×10. Cada día suben los "+30 €" del bar y del alquiler. El lunes llega el **lunes de cuentas**: aviso con el resumen semanal (subvención, sueldos, mantenimiento).
4. **Primer domingo de septiembre.** El juego se detiene solo antes del partido (próximo evento). El jugador baja a ×1 y ve el resultado: marcador, asistencia, taquilla, aparcamiento y bar flotando sobre sus edificios, y la fama y la afición moviéndose.
5. **Semanas 2-6.** Cumple el primer patrocinio (bonus), pone vallas publicitarias, abre la escuela. La ayuda municipal baja en la semana 5 y la presión aparece: hay que equilibrar personal, mantenimiento e ingresos.

---

## 3. Tiempo

| Concepto | Valor |
|---|---|
| Constante principal | `MINUTOS_REALES_POR_DIA = 12` (única fuente; todo lo demás se deriva) |
| Tick | 1 minuto de juego → 1 440 ticks por día |
| Ticks por segundo real | ×1: 2 · ×3: 6 · ×5: 10 · ×10: 20 |
| Semana | 84 min a ×1 · 8,4 min a ×10 |
| Temporada (agosto–mayo, ~40 semanas) | ~56 h a ×1 · ~5,6 h a ×10 |
| Teclas | Espacio pausa · 1 ×1 · 2 ×3 · 3 ×5 · 4 ×10 |
| Próximo evento | Corre a ×10 y se detiene solo antes de: partido, lunes de cuentas, oferta o vencimiento de patrocinio, avería, aviso de quiebra, lotería |
| Clima | Cada día, 35 % de probabilidad de lluvia (sembrado). En esta fase solo es un icono en el HUD y un efecto numérico |
| Inicio | Lunes 23 de agosto del año 1, 09:00 |

Los ritmos económicos (sueldos, necesidades futuras, ingresos) van por días u horas de juego, nunca por minutos reales.

---

## 4. Economía

### 4.1 Arranque

| Concepto | Valor |
|---|---|
| Dinero inicial | 12 000 € |
| Afición inicial | 300 personas |
| Socios iniciales | 60 |
| Fama inicial | 5 |
| Caseta vieja (vestuario precario) | Pre-colocada, 4×3, 2 bancos y 1 ducha de nivel 1, calidad 1. Se puede mejorar o demoler (devuelve 300 €) |
| Campo | Fútbol 11 de tierra pre-colocado, estado 50 |

### 4.2 Precios por división (tabla de datos; en esta fase solo se usa Comarcal)

| División | Entrada | Cuota socio/mes | Subvención base/semana |
|---|---|---|---|
| Comarcal | 5 € | 15 € | 500 € |
| Regional | 7 € | 20 € | 400 € |
| Autonómica | 10 € | 30 € | 300 € |
| Nacional B | 15 € | 40 € | 200 € |
| Nacional A | 25 € | 60 € | 0 € |
| Élite | 45 € | 90 € | 0 € |

### 4.3 Ingresos

| Concepto | Fórmula | Cuándo |
|---|---|---|
| Subvención municipal | Base de la división + ayuda de arranque: +1 000 € semanas 1-4, +500 € semanas 5-8 | Lunes 08:00 |
| Cuotas de socios | `socios × cuota` | Día 1 de cada mes, 08:00 |
| Taquilla | `max(0, asistentes − sociosAsistentes) × entrada`. Los socios entran gratis | Domingo, al empezar el partido en casa |
| Bar o cafetería | 30 €/día si hay una sala Bar completa + `asistentes × 1,5 €` en partido en casa | Diario 22:00 · partido |
| Aparcamiento de pago | `min(plazas, ceil(asistentes / 4)) × 2 €` | Partido en casa |
| Alquiler del campo | Por campo con alquiler activado: F7 30 €/día, F11 50 €/día; ×3 si es artificial, ×2 si es natural o híbrido. Nunca el domingo de partido | Diario 21:00 |
| Escuela de fútbol | `alumnos × 25 €`, con `alumnos = min(capacidad, floor(afición × 0,10))` y `capacidad = 15 × monitores` | Día 1 de cada mes |
| Vallas publicitarias | Cada valla ocupada: `20 € × (1 + fama / 50)` | Lunes |
| Patrocinio local | Adelanto al aceptar; bonus al cumplir | Al aceptar · al cumplir |
| Lotería de Navidad | Ver 4.8 | 22 de diciembre |

**Asistentes a un partido en casa:**
```
sociosAsistentes = round(socios × 0,9)
publico          = round((afición − socios) × 0,5 × satisfacción/100 × lluvia)   // lluvia = 0,85 si llueve, si no 1
asistentes       = min(aforo, sociosAsistentes + publico)
aforo            = 100 (de pie junto a la valla) + aforo de todas las gradas del campo principal
```
Si `sociosAsistentes + publico > aforo`, la diferencia se queda fuera: se registra como "público sin sitio" y pesa en la opinión del pueblo.

**Socios:** cada lunes, `socios += round((afición × 0,25 − socios) × 0,10)`.

**Escuela:** se abre desde el panel del club (2 000 €). Requisitos: un vestuario completo y un campo. Cada 15 alumnos necesitan un monitor (personal, 150 €/semana).

**Vallas:** objeto "Valla publicitaria", 2×1, 150 €, solo colocable en el pasillo perimetral del campo. Cada lunes, una valla vacía consigue anunciante con probabilidad `0,3 + fama/200`. El anunciante es un negocio inventado del pueblo con su cartel pintado y se queda entre 4 y 12 semanas.

### 4.4 Gastos

| Concepto | Fórmula | Cuándo |
|---|---|---|
| Mantenimiento de objetos | 2 % del coste del objeto (incluidas sus mejoras) por semana | Lunes |
| Mantenimiento de interiores | 0,2 € por casilla de suelo interior por semana | Lunes |
| Mantenimiento de césped | Por casilla y semana: tierra 0,05 €, artificial 0,10 €, híbrido 0,40 €, natural 0,60 € | Lunes |
| Mantenimiento de gradas | 1 % del coste acumulado de la grada por semana | Lunes |
| Sueldos del personal | Ver 4.5 | Lunes |
| Desplazamiento | 100 € por partido fuera (furgoneta alquilada) | Domingo |
| Reparaciones | 25 % del coste del objeto averiado | Al pagar la reparación |
| Lotería | Coste de las participaciones encargadas | 1 de diciembre |

Todo cargo semanal se agrupa en el **lunes de cuentas**.

### 4.5 Personal (abstracto en esta fase)

Se contrata desde el panel de Personal. No aparece en el mapa hasta la Fase 4.

| Puesto | Sueldo/semana | Cobertura por persona | Si falta cobertura |
|---|---|---|---|
| Jardinero | 250 € | 1 500 casillas de césped o tierra de campo | El estado del campo deja de recuperarse |
| Limpieza | 200 € | 400 casillas de interior + 1 500 de aforo | Baja la satisfacción de la afición |
| Mantenimiento | 250 € | 15 000 € de valor en objetos | Averías |
| Monitor de escuela | 150 € | 15 alumnos | Limita la capacidad de la escuela |

`cobertura = min(1, capacidadTotal / necesidad)`, mostrada en % en el panel.

**Estado del campo** (0-100, por campo):
- Cada día: `+4 × coberturaJardinería`, hasta el máximo de su superficie (tierra 60, artificial 85, natural 100, híbrido 100).
- Por partido: −8. Por día de alquiler: −3 en natural o híbrido, −1 en el resto. Por día de lluvia: −2 en tierra y natural, −1 en híbrido, 0 en artificial.

**Averías:** cada lunes, cada objeto tiene una probabilidad `0,05 × (1 − coberturaMantenimiento)` de averiarse. Un objeto averiado no cuenta para los requisitos ni la calidad de su sala, y muestra un icono de llave inglesa hasta que se paga la reparación.

### 4.6 Partido mínimo

- Cada domingo a las 17:00, alternando casa y fuera. Rival inventado de una lista de pueblos ficticios.
- **Fuerza del club** = `40 + instalaciones + (estadoCampo / 10 si se juega en casa) + 5 si se juega en casa`
- **Instalaciones** (máximo 30) = `calidad del mejor vestuario × 1,5 + superficie (tierra 0, artificial 5, natural 8, híbrido 10) + 3 si hay gimnasio completo + 3 si hay sala de fisio completa`
- **Fuerza del rival** = `45 + entero aleatorio entre −10 y +10`
- **Goles:** `λ_propia = 1,3 × (fuerzaPropia / fuerzaRival)^1,5`, `λ_rival = 1,3 × (fuerzaRival / fuerzaPropia)^1,5`. Se muestrea una Poisson para cada equipo.
- El partido dura 2 horas de juego (1 minuto real a ×1). Al terminar, aparece una pantalla de resultado: marcador, 2-3 frases de crónica, asistencia, ingresos del día por concepto y cambios de fama y afición.

### 4.7 Patrocinios locales

- Se muestran en el tablón; máximo 2 activos y 2 ofertas a la vista. Cada 2 semanas aparece una oferta nueva si hay hueco.
- **Adelanto:** 500-1 500 €. **Bonus:** 1 500-4 000 €. **Plazo:** 3-6 semanas. Valores según la dificultad del objetivo.
- **Objetivos (datos):** vestuario completo · calidad de vestuario ≥ X · N socios · ganar N partidos · aforo ≥ N · abrir el bar · abrir la escuela · estado del campo ≥ 70 durante 2 semanas · N vallas ocupadas.
- **Cumplir:** cobra el bonus y +2 de fama. **No cumplir:** no hay penalización económica, pero −2 de fama. **Cancelar:** devuelve el adelanto más un 10 %.
- Los negocios son inventados (*Panadería Hermanos Ríos*, *Talleres Lamela*, *Sidrería O Muíño*...), con un pequeño logotipo dibujado.

### 4.8 Lotería de Navidad

- **1 de diciembre:** aviso en el tablón. El jugador encarga 0, 500, 1 000 o 2 000 participaciones a 4 € cada una.
- Se venden a 5 € (1 € de beneficio por participación). `vendidas = min(encargadas, socios × 3 + floor(afición × 0,5))`. Las que no se venden se pierden.
- **22 de diciembre:** se cobra la venta. Hay un 3 % de probabilidad de "pedrea": +1 000 € y +3 de fama, con una celebración en pantalla.

### 4.9 Construcción, mover y demoler

- Se mantienen los costes de construcción actuales. Un vestuario básico completo ronda los 2 500-3 000 €, coherente con el dinero inicial.
- **Mover un objeto:** gratis. **Mover un bloque o un campo con su estadio:** 10 % de su valor.
- **Demoler:** devuelve el 50 % del valor de los objetos (incluidas mejoras) y el 25 % de suelos, muros y gradas.
- **Deshacer:** durante 10 segundos reales tras construir, botón "Deshacer" con reembolso del 100 %.
- No se puede construir si no hay dinero suficiente. La vista previa muestra el coste en rojo y no deja colocar.

### 4.10 Quiebra

- Con saldo negativo, el HUD muestra el dinero en rojo y el tablón un aviso.
- Si el saldo está en negativo **4 lunes seguidos**, se dispara un rescate:

| Rescate | Ayuda | Condiciones |
|---|---|---|
| 1.º | El ayuntamiento cubre la deuda + 5 000 € | Fama −10 · obras congeladas 2 semanas · subvención al 50 % el resto de la temporada |
| 2.º | Cubre la deuda + 2 000 € | Fama −20 · obras congeladas 4 semanas · sin subvención el resto de la temporada |
| 3.ª quiebra | Fin de partida | Pantalla "El club se disuelve" con resumen y la opción de cargar una partida guardada |

"Obras congeladas" significa que no se puede construir, mejorar ni mover, aunque sí demoler.

---

## 5. Fama y afición

**Fama** (0-100, inicial 5):

| Evento | Efecto |
|---|---|
| Victoria / empate / derrota | +2 / +0,5 / −1 |
| Patrocinio cumplido / fallido | +2 / −2 |
| Primera sala completa de cada tipo | +1 (una vez por tipo) |
| Pedrea de la lotería | +3 |
| Rescates | −10 / −20 |
| Deriva | Cada lunes, −0,2 si está por encima de la base de la división (Comarcal 5) |

Efectos ahora: probabilidad de ocupar vallas, valor de las vallas y calidad de las ofertas de patrocinio (con fama ≥ 20 aparecen ofertas más jugosas). En la Fase 4 atraerá jugadores y agentes.

**Afición** (personas, inicial 300):

| Evento | Efecto |
|---|---|
| Victoria / empate / derrota | +3 % / +1 % / −1 % |
| Tras un partido en casa | `× (1 + (satisfacción − 60) / 2000)` |
| Escuela abierta | +1 % al mes |
| Techo | `1 000 + fama × 100`; por encima no crece |

**Satisfacción de la afición** (0-100, se calcula en cada partido en casa):
`70 − 30 × (1 − coberturaLimpieza) + 10 si hay bar + 5 si hay aparcamiento + 10 si hay grada cubierta − 15 si se quedó gente fuera − 10 si llueve y no hay grada cubierta`, limitada a 0-100.

**En el mapa:** la cantidad de banderines con los colores del club en las farolas de la entrada crece con la afición (por tramos: 300, 800, 2 000, 5 000).

---

## 6. Interfaz (estilo "carpeta del míster")

**HUD superior** (listón de madera con letra manuscrita para las etiquetas y otra legible para las cifras):
- Izquierda: fecha y hora (*"Dom 5 sep · 17:00 · Año 1"*), icono del clima.
- Centro: dinero con la variación de la semana en verde o rojo; socios, afición y fama (estrella). Las cifras cuentan hacia arriba o abajo con GSAP en lugar de saltar.
- Derecha: botones de velocidad (pausa, ×1, ×3, ×5, ×10) y "⏭ Próximo evento".

**Textos flotantes:** cada ingreso o gasto con origen en el mapa aparece sobre su edificio ("+30 €" sobre el bar, "−100 €" sobre la entrada al salir la furgoneta), sube y se desvanece. Si coinciden muchos a la vez, se agrupan por edificio.

**Lunes de cuentas:** una hoja de libreta aparece unos segundos en una esquina con el resumen (*"Ingresos 1 240 € · Gastos 980 € · Neto +260 €"*). Al hacer clic, abre la pestaña de Finanzas.

**Tablón del vestuario** (corcho arriba a la izquierda, con chinchetas): próximo partido, patrocinios activos con su progreso, ofertas, avisos de averías y de quiebra, y la lotería en diciembre. Cada nota es un papel con un color por tipo.

**Ficha de sala** (hoja de libreta): tipo, capacidad, calidad (0-10), requisitos con ✓/✗, objetos averiados, mantenimiento €/semana y qué aporta (*"Bar: 30 €/día y 1,5 € por espectador en partido"*).

**Cuaderno de informes** (pestañas de colores en el lateral izquierdo que aparecen al desbloquearse):
- **Finanzas:** tabla de ingresos y gastos por concepto de las últimas 8 semanas, saldo neto semanal y un gráfico de barras dibujado como a lápiz.
- **Valoración:** valor del club (`70 % del coste de las instalaciones + fama × 1 000 + socios × 50 − deuda`) con su evolución, y la **opinión del pueblo**: 3-5 frases manuscritas generadas por reglas (*"El bar del campo es el mejor del pueblo"*, *"El domingo se quedó gente fuera: hacen falta gradas"*, *"El campo está hecho un barrizal"*).
- **Personal:** contratar y despedir, sueldos y barras de cobertura por puesto.
- **Partidos:** últimos resultados con asistencia e ingresos, y el próximo partido.

---

## 7. Lista de tareas

Cada bloque termina con algo visible y se valida antes de pasar al siguiente.

**Bloque A — Reloj y tema visual**
- [ ] 🧠 Bucle de ticks (1 tick = 1 min de juego) con `MINUTOS_REALES_POR_DIA`, velocidades ×1/×3/×5/×10 y pausa. Calendario con fecha, hora y día de la semana
- [ ] 🧠 Planificador de eventos (por hora, día, semana, mes y fecha concreta) y "próximo evento"
- [ ] 🧠 Clima diario sembrado
- [ ] ⚡ Tokens del tema "carpeta del míster" en Tailwind (madera, papel, corcho, tipografías)
- [ ] ⚡ HUD: fecha, hora, clima y velocidades, con teclas

*Se ve:* el reloj avanza a cada velocidad, "próximo evento" salta al lunes y se detiene. *Prueba:* 1 día a ×1 dura 12 min (cronometrar a ×10: 72 s).

**Bloque B — Libro de cuentas y costes**
- [ ] 🧠 Libro de cuentas: cada movimiento con fecha, concepto, importe y origen (edificio o club). Será la fuente de Finanzas
- [ ] 🧠 Cobro de construcción, mejoras, mover, demoler y deshacer según 4.9; bloqueo sin fondos
- [ ] 🧠 Inicio de partida: caseta vieja, campo de tierra, recursos iniciales
- [ ] ⚡ Dinero en el HUD con cifra animada
- [ ] ⚡ Textos flotantes con agrupación

*Se ve:* construir resta dinero con su "−X €". *Prueba:* construir y deshacer deja el saldo igual; demoler devuelve los porcentajes correctos.

**Bloque C — Ingresos y gastos regulares**
- [ ] 🧠 Subvención con ayuda de arranque, socios, bar, alquiler del campo (interruptor en la ficha del campo)
- [ ] 🧠 Mantenimiento semanal (objetos, interiores, césped y gradas) y lunes de cuentas
- [ ] ⚡ Aviso del lunes de cuentas
- [ ] ⚡ Ficha de sala ampliada con mantenimiento y aportaciones

*Se ve:* el dinero sube y baja solo. *Prueba:* test de una semana completa que cuadre con las fórmulas.

**Bloque D — Personal y estado del campo**
- [ ] 🧠 Personal abstracto con cobertura (jardinero, limpieza, mantenimiento)
- [ ] 🧠 Estado del campo y averías
- [ ] ⚡ Pestaña Personal del cuaderno
- [ ] ⚡ Icono de avería sobre el objeto y botón de reparar en su ficha

*Se ve:* sin jardinero el campo no se recupera; sin mantenimiento aparecen averías. *Prueba:* tests de cobertura y de probabilidad de averías con semilla fija.

**Bloque E — Partido mínimo, fama y afición**
- [ ] 🧠 Partido semanal con fuerza, goles por Poisson, asistencia, taquilla, bar y aparcamiento
- [ ] 🧠 Fama, afición, satisfacción y socios según la sección 5
- [ ] ⚡ Pantalla de resultado del partido
- [ ] ⚡ Socios, afición y fama en el HUD
- [ ] ⚡ Banderines en las farolas según la afición

*Se ve:* cada domingo hay partido con ingresos que flotan sobre sus edificios. *Prueba:* simular 20 partidos con semilla fija; la distribución de resultados es razonable (ni siempre ganar ni siempre perder).

**Bloque F — Tablón, patrocinios y nuevas fuentes**
- [ ] 🧠 Tablón del vestuario y patrocinios locales con objetivos como datos
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
- [ ] ⚡ Cuaderno con pestañas: Finanzas, Valoración (con opinión del pueblo), Personal y Partidos
- [ ] 🧠 Reglas de la opinión del pueblo (cada frase, con su condición, como dato)

**Bloque I — Guardado**
- [ ] 🧠 Partidas con número de versión y migraciones; autoguardado cada lunes y guardado manual
- [ ] ⚡ Exportar e importar `.json`

*Prueba:* guardar a mitad de semana, recargar y comprobar que todo (incluido el PRNG) continúa igual.

---

## 8. Lo que se deja fuera

| Elemento | Fase |
|---|---|
| Liga, clasificación, ascensos y divisiones en juego | 3 |
| Horario semanal (microciclo de entrenamientos) | 3 |
| Jugadores, necesidades y personal visible caminando | 4 |
| Lluvia visible, charcos y deterioro visual de objetos y césped | 4B / 6 |
| Electricidad y agua | 4B |
| Patrocinio de camiseta, campus de verano, tienda del club, eventos en el campo (fiestas, conciertos) | 5 o backlog |
| Junta directiva (árbol de burocracia), préstamos, inversores y venta de acciones | 5 / backlog |
| Obreros y obra no instantánea | Backlog |

---

## 9. Checkpoint

La fase está bien hecha cuando:

1. Una sesión de **unos 45 minutos reales**, mezclando velocidades, cubre 4-5 semanas de juego y 2-3 partidos en casa, y en ella el jugador toma decisiones económicas con sentido: no le sobra el dinero ni está siempre en quiebra.
2. Con una construcción razonable, el saldo de las primeras 4 semanas es positivo; al retirarse la ayuda (semanas 5-8) se ajusta, y sin vallas, escuela ni patrocinios se acerca a cero.
3. Ningún ingreso domina: ninguna fuente supera el 50 % de los ingresos de un mes típico.
4. Guardar, recargar, exportar e importar conservan el estado exacto.
5. Los tests de la economía (semana tipo, partido, patrocinios, quiebra) pasan con semilla fija.
6. Raul juega una partida y le apetece seguir jugando.
