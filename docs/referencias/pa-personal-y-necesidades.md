# Prison Architect: personal, necesidades, peligro y eventos

> Fiabilidad: **[wiki]** oficial. Economía: [pa-gestion-y-economia.md](pa-gestion-y-economia.md).

## 1. Personal [wiki: Staff]

| Tipo | Contratación | Salario/día | Función | Requisito |
|---|---|---|---|---|
| Alcaide (Warden) | $1.000 | $200 | Desbloquea la burocracia | - |
| Jefe, Capataz, Psicólogo, Contable | $1.000 | $200 | Cada uno abre una rama | Alcaide |
| Abogado | $5.000 | $200 | Investigación legal | Alcaide |
| Obrero | $500 | $100 | Obras, entregas, basura | Capataz |
| Cocinero | $500 | $100 | Comida | Capataz |
| Doctor | $1.000 | $100 | Cura y reanima | - |
| Jardinero / Limpiador | $500 | $50 | Limpieza exterior / interior | Capataz |
| Guardia | $500 | $100-150 | Seguridad, escoltas, registros, motines | Jefe |
| Guía canino | $500 | $150 | Perros patrulla | Jefe |
| Guardia armado | $1.500 | $350 | Dispara en fuego libre | Jefe |
| Francotirador | $2.000 | $500 | Torres | Jefe |
| Externos (profesor, líder espiritual, abogados de libertad condicional, conductor) | gratis | gratis | Programas y entregas | - |
| Emergencias (policía antidisturbios $100 por escuadra de 6, bomberos, paramédicos $100-2.000) | por uso | gratis | Intervienen y se van | - |

**Guardias**: 20 de dureza, porra (tazer con certificación +$400, chaleco +$100); escoltan, registran, abren puertas, llevan comida a aislados, manejan CCTV; **no previenen incidentes por sí solos**; no entran donde hay motín; sueltan armas y llaves si caen inconscientes.

### Despliegue [wiki: Deployment]
- Asignar guardias a **sectores** (clic izquierdo; círculo azul = disponible), dejando algunos libres para emergencias.
- **Patrullas**: guardia, perros o armados, dibujando rutas con arrastre.
- **Perfiles horarios**: hasta 8 (1 blanco + 7 de color) sobre 24 h, con Microgestión.
- Líneas pintadas en el suelo guían a presos y personal (los ignoran los presos díscolos, los médicos, las emergencias y todos durante motines).

### Energía del personal [wiki: Energy]
- Pierde **0,05 por minuto** (3 por hora) al trabajar; agotado por debajo de 5; "cansado" por debajo de 20.
- Sin sala de personal: recupera 18 por hora hasta 50 (~16 h útiles).
- Con **sala de personal**: recupera 120 por hora, 100 en 50 min (~32 h útiles).
- Los agotados buscan solos la sala más cercana.

### Inteligencia [wiki: Intelligence]
Vista que muestra contrabando por sala, oferta y demanda de armas, drogas y lujos, y qué se encontró en las últimas 24 h y 7 días y por dónde entró. Informantes y escuchas revelan reputación, objetivos, escondites, túneles y bandas.

## 2. Presos [wiki: Prisoners]

| Nivel | Pago inicial | Pago diario | Perfil |
|---|---|---|---|
| Mínima | $300 | $100 | Poco riesgo |
| Media | $500 | $150 | Más agresivos |
| Máxima | $1.000 | $250 | Violentos |
| Supermáxima | $2.000 | $250 | Muy peligrosos, asignación manual |
| Protección | - | $200 | Aislar a los amenazados |
| Corredor de la muerte | $2.500 | $300 | Apelaciones |
| Enfermos mentales | $3.000 | $300 | Alojamiento especial |

- **Reputación**: rasgos visibles (fuerte, duro, rápido, líder, soplón, predicador, proveedor, etc.).
- **Rasgos ocultos**: listo, violento, letal, destructivo, adicto, ladrón, leal, controlador, mezquino, temerario.
- **Valoración**: castigo, reforma, seguridad, salud y porcentaje de reincidencia (decide la libertad condicional).
- Entrada: camión diario; ratios de entrada ajustables en Informes → Entradas.
- 1 año de condena = 120 h de juego.

## 3. Necesidades [wiki: Needs]

| Necesidad | Se satisface con | Si falla |
|---|---|---|
| Vejiga / intestino | Váteres | Orina en el suelo / se ensucia |
| Sueño | Camas | Fatiga |
| Comida | Cocina + cocinero + comedor | Hambre y muerte |
| Higiene | Duchas | Queja |
| Ropa | Lavandería | Queja |
| Comodidad | Camas, bancos, sillas | Queja |
| Ejercicio | Patio, pesas | Queja |
| Seguridad | Bajar el peligro, más guardias | Huyen de las amenazas |
| Libertad | Más tiempo libre, recreativas | Excavan túneles |
| Familia | Cabinas, visitas | Queja |
| Ocio | Billar, TV, radio, sala común | Aburrimiento |
| Entorno | Limpiadores | Queja |
| Privacidad | Celda propia | Queja |
| Alfabetización | Biblioteca | Queja |
| Espiritualidad | Capilla | Queja |
| Drogas / alcohol | Tratamientos | Síndrome de abstinencia |
| Calor | Radiadores | Queja |
| Lujos | Tienda de la prisión | Queja |

Las necesidades se muestran en Informes → Necesidades con colores (rojo crítico, naranja alto, amarillo medio, verde satisfecho, azul en curso). Las necesidades insatisfechas provocan quejas, destrozos, peleas y, al final, **disturbios**. **La wiki no da tasas de decaimiento ni umbrales.**

Necesidades del personal: baño, descanso, comida, comodidad, seguridad, ocio, entorno, calor (se cubren en la sala de personal).

### Calidad de salas (grading) [wiki: Room_grading]
Escala 0-10 (0-15 con DLC). En celdas: objetos ±1 cada uno, tamaño +1 (6 casillas), +2 (9), +3 (16), ventana al exterior +2 (sin ventana -1). Los presos ganan 1 punto de derecho por día de buena conducta; un mal comportamiento los reinicia a 0. Mejores celdas = menos mala conducta ("por querer conservarla"). Patios: +1 por pesas, gradas, saco, neumáticos; tamaño ≥100 casillas +1, ≥200 +2, ≤50 -1.

## 4. Peligro (danger) [wiki: Danger]

- Termómetro arriba, visible tras contratar al Jefe.
- **Sube** con: necesidades críticas, motines, guardias armados, muertes recientes, peleas, personal descontento, castigo a un líder de banda.
- **Baja** con: presos bien tratados, buenas comidas, visitas a la capilla, personal satisfecho.
- Riesgo si sube: un **motín** repentino. El "Pacifier" (alcaide) resta 25 puntos permanentemente.
- Acciones de emergencia [wiki: Emergency]: Cierre (puertas cerradas), Encierro (todos a la celda), Registro general, Fuego libre, Registro de túneles, Pase de lista (solo en horario de sueño).

## 5. Eventos [wiki: Events]
Aleatorios, desde 50-150 presos mínimos; no durante motines; se avisan por teléfono y lista de tareas; cada uno tiene una versión "extrema".

| Evento | Mínimo de presos | Efecto |
|---|---|---|
| Incendio de la central | - (central al >80 %) | Daña, explota al 95 % |
| Incendio en cocina | - | Corta comidas |
| Rotura de tubería | - | Inunda |
| Entrada masiva | 100 | 25-40 presos en 1 h |
| Accidente en taller | - | Preso herido |
| Hundimiento | - | Cae un tramo de muro |
| Virus | 100 | 4 infectados que se propagan |
| Asesinato masivo | 150 | 7-10 testigos amenazados |
| Exigencias del alcalde | - | 94,5 h; multas de $5.000 a $20.000 |
| Exigencias de presos | - | Menos trabajo, más sueño, más tiempo libre |
| Oleada de contrabando | 50 | Mucho contrabando |
| Intoxicación | 100 | 20 enfermos |
| Radio agitadora | - | Quitar radios 72 h |
| Filtración de informantes | 6 informantes | Se descubren |
| Túneles masivos | 100 | Fugas simultáneas |
| Conversión | 100 | Suben necesidades espirituales |
| Tiempo (lluvia, ola de calor) | - | Con temperatura activa |

## 6. Contrabando (solo por analogía) [wiki: Contraband]
Entra por presos nuevos, visitas, entregas, lanzamientos por la valla (hasta 10 casillas), robo interno y fabricación. Se detecta con detectores de metales (caros, consumen), perros, registros manuales (dependen de la moral del personal) y recepción. No hay detección del 100 %.

## 7. Logros (ideas) [wiki: Achievements]
18 logros base, p. ej.: 100/500/1.000 presos (Stone Walls, Iron Bars, Confined); vender con $1.000.000 de beneficio (D.B. Cooper); mantener $50.000+ de flujo; frenar un motín con 50+ presos; desbloquear todo el árbol (Wait and Hope); reincidencia ≤25 % (Get Busy Living); compartir y cargar de Workshop.

## 8. Adaptación a Grassroots

| PA | Grassroots | Fase |
|---|---|---|
| Presos | Jugadores | 4 |
| Niveles de seguridad (mínima a supermáxima) | Niveles de jugador (cantera, amateur, semiprofesional) | 4 |
| Pago inicial + pago diario | Ficha y sueldo; cuota de socio | 4 |
| Guardias / obreros / cocineros | Utillero, jardinero (césped), fisio, cocinero, seguridad de estadio | 4 |
| Sala de personal con energía | Sala de personal / vestuario del cuerpo técnico | 4 |
| Despliegue | Asignar personal a campos y zonas el día de partido | 4/5 |
| Régimen | **Horario de entrenamientos**: sueño, comida, entrenamiento, tiempo libre | 3 |
| Necesidades | Alojamiento, fisio, gimnasio, ocio, comida (ya previstas) | 4 |
| Peligro | **Tensión del vestuario / moral global**; si sube, riesgo de motín = plantón o huelga | 4 |
| Disturbio | Plantilla se niega a entrenar o juega peor | 4 |
| Calidad de celda (grading) | Calidad de vestuario, residencia y campo según tamaño y objetos | 1B/4 |
| Eventos | Agentes, lesiones masivas, filtración, invasión de campo, aguacero, bulos | 4/5 |
| Exigencias de presos | Peticiones de plantilla (más descanso, mejor instalación) | 4 |
| Informantes / Inteligencia | Ojeadores y red de informadores | Backlog |
| Logros | Ver lista tras el índice de README | 5 |

## Fuentes
- https://prisonarchitect.paradoxwikis.com/Staff
- https://prisonarchitect.paradoxwikis.com/Guards
- https://prisonarchitect.paradoxwikis.com/Deployment
- https://prisonarchitect.paradoxwikis.com/Intelligence
- https://prisonarchitect.paradoxwikis.com/Emergency
- https://prisonarchitect.paradoxwikis.com/Energy
- https://prisonarchitect.paradoxwikis.com/Prisoners
- https://prisonarchitect.paradoxwikis.com/Needs
- https://prisonarchitect.paradoxwikis.com/Danger
- https://prisonarchitect.paradoxwikis.com/Events
- https://prisonarchitect.paradoxwikis.com/Contraband
- https://prisonarchitect.paradoxwikis.com/Room_grading
- https://prisonarchitect.paradoxwikis.com/Yard
- https://prisonarchitect.paradoxwikis.com/Achievements
