# Prison Architect: construcción, logística y suministros

> Fiabilidad: **[wiki]** oficial · **[est.]** estimación. Catálogo de salas y objetos: [pa-salas-y-objetos.md](pa-salas-y-objetos.md). Escala y mapa: [pa-escala-y-mapa.md](pa-escala-y-mapa.md).

## 1. Flujo de construcción

1. El jugador **designa** (arrastrando un rectángulo o una línea): cimientos, muros, suelos, sala u objeto.
2. Se crea una **tarea** en la cola de trabajos; los **obreros** (Workmen) la ejecutan si hay materiales y dinero.
3. Los materiales salen de **almacén** o de la **zona de entrega**; si faltan, se piden y llega un camión por la carretera.
4. La obra se completa, la sala se activa si cumple requisitos (objetos obligatorios, tamaño, cerrada o abierta).
5. Si un obrero no puede llegar (atrapado, zona en disturbio) la obra se marca con una **X roja**.

### Obreros
| Dato | Valor |
|---|---|
| Inicio (sandbox) | 8 obreros |
| Contratación | $500 (requiere Capataz, que desbloquea Foreman en burocracia) |
| Salario | $100 por día |
| Funciones | Construir/demoler, recoger materiales, mover basura a su zona, descargar camiones, exportaciones, desmontar objetos, talar árboles, servir comida si no hay cocinero, reparar automáticamente si hay fondos |
| Consejo oficial | Plantilla grande durante obras; despedir a la mayoría en épocas tranquilas, dejando unos pocos para tareas básicas. |

Los tiempos de obra no se indican en horas: dependen de **cuántos obreros haya** y de la dureza del material. Se mide en segundos de trabajo por casilla (ver tabla de muros).

### Planificación y Quick build
Ver [pa-interfaz-y-controles.md](pa-interfaz-y-controles.md) sección 4.

## 2. Cimientos [wiki: Foundations]

- **Coste = ancho x alto x $10** (más acero y hormigón del suelo por defecto).
- Material del muro a elegir: ladrillo u hormigón.
- Los cimientos **comparten muro** con un edificio adyacente al terminar.
- Necesitan **una puerta en el perímetro** para considerarse completados (la puerta debe estar en el muro).
- Las luces de techo se colocan solas en rejilla cada 4 columnas y 4 filas (se puede desactivar).
- Demolición con el bulldozer (ver doc de interfaz).

## 3. Materiales: muros y suelos [wiki: Materials]

### Muros (coste por casilla / segundos de obra)
| Muro | Coste | Obra | Observación |
|---|---|---|---|
| Ladrillo, hormigón, blanco, "classy" | $50 | 5 s | Estándar, bloquea visión |
| Embaldosado, de seguridad | $90 | 5 s | Seguridad, 5 colores por sector |
| Con barrotes | $70 | 5 s | No bloquea visión |
| Art deco, Yutani | $100 | 5 s | Estético |
| Acolchado | $110 | 5 s | Solo interior (DLC) |
| Perimetral | $200 | 25 s | Frena túneles |
| Valla, seto | $3 | 10 s | Solo exterior |
| Bambú | $3 | 5 s | Solo exterior |
| Deteriorados (derelict, rusty, slum, overgrown, decayed) | $20 | 1-5 s | Bajan la calificación de la celda |
| Acantilado | $250 | 25 s | Impide el paso (DLC) |

### Suelos (coste por casilla / velocidad)
| Suelo | Coste | Velocidad | Nota |
|---|---|---|---|
| Tierra, barro, arena | $0 | 0,7 / 0,5 / 0,5 | Tierra por defecto |
| Hierba, nieve | $5 | 0,7 | |
| Grava | $10 | 0,7 | |
| Hormigón, adoquín, metal, cargo, mosaico | $10 | 1,2 - 1,3 | Más rápido |
| Piedra, baldosa blanca, mármol | $10 | 1,0 | |
| Cerámico, madera, moqueta | $50 | 1,0 | Calidad alta |
| Pista de atletismo | $50 | 2,0 | Ejercicio |
| Agua | $10 | 0 | Bloquea |

Método de instalación: elegir tipo, arrastrar el área y se crea la tarea. **Vender suelo** es inmediato y sin obreros.

## 4. Ítems y almacenaje [wiki: Items, Storage, Delivery]

| Ítem | Precio | Uso |
|---|---|---|
| Ladrillos | $50 | Muros y varios suelos |
| Hormigón | $10 | Suelos |
| Acero | $10 | Cimientos |
| Bandeja de comida | $1 | Servir en el comedor |
| Comida (ración) | $15 aprox. | 1 a 3 ingredientes según la política |
| Troncos / madera | $100 compra / $50 venta | 1 árbol = 3 troncos; 1 tronco = 4 madera |
| Chapa | $10 | Matrículas en taller |

- Todos los materiales se **apilan** para ahorrar espacio.
- **Zona de entrega** (Delivery): mín. 1x3; recibe los camiones; si es alta caben varios camiones a la vez. Solo se distingue del **almacén** en que ahí descargan los camiones y llegan los presos.
- **Almacén** (Storage): recoge los objetos desmontados y los materiales; sin almacén todo cae al suelo. Los obreros descansan allí. Riesgo: herramientas robables (contrabando).
- Basura: bolsas que van a la zona de basura; los obreros las llevan allí.
- Camiones: **no usan carreteras construidas por el jugador**, sólo la prefabricada con marcas. Frecuencia y horarios de camiones: **no documentados** en la wiki [est.: entregas diarias en horario fijo, ligadas al pedido].
- Con *Island Bound* el jugador asigna muelles, helipuertos y carretera a destinos (entrega, basura, exportación, almacén, recepción).
- Contrabando por entregas: perros guardianes y detectores de metales; los presos que llegan en entrega van esposados.

## 5. Dureza (toughness) [wiki: Toughness]

- La dureza es la **vida** de objetos, muros, presos y personal.
- Valores: muros y suelos 1; objetos por defecto 1; guardias y presos 20 (30 con chaleco); fuego 10.
- Daño: porra 1,5; tijeras 10; fuego 0,1 cada minuto de juego.
- Con más del **70 % de daño** un objeto funciona mal (p. ej. las puertas no cierran del todo); al 100 % se destruye y hay que reponer. Una persona con más del 70 % cae inconsciente.
- Los obreros reparan solos si hay dinero.

## 6. Suministros [wiki: Power_Station, Capacitor, Water_Pump_Station]

### Electricidad
| Elemento | Valor |
|---|---|
| Central eléctrica | $5.000, 3x3, dureza 50, **50 unidades** |
| Condensador | $1.000, **+50 unidades**, máx. 16 por central, debe ir **pegado** a la central |
| Condensador 2.0 | +100 unidades, cuesta el doble |
| Cable | sin límite de longitud con una sola central; los cables pequeños automáticos no atraviesan paredes |
| Consumo bajo | 1 ud.: luces, CCTV, televisores |
| Consumo medio | 10 ud.: detectores de metales, lavadoras |
| Consumo alto | 25 ud.: cocinas, neveras, sistemas de puertas |
| Consumo muy alto | 100 ud.: bomba de agua, silla eléctrica |

- **Sobrecarga**: por encima del 80 % puede haber un incendio de la central; al 95 % explota y desaparece (evento "Power Station Fire").
- **Sin energía**: los objetos eléctricos dejan de funcionar (neveras, luces, puertas controladas, cámaras). La wiki no detalla más.

### Agua
| Elemento | Valor |
|---|---|
| Estación de bombeo | $5.000, 3x3, dureza 50 |
| Consumo eléctrico de la bomba | ~50 % de una central o de 1 condensador |
| Tuberías grandes | alcance 761 casillas antes de perder presión |
| Tuberías pequeñas | alcance 39 casillas |
| Consumidores | váteres, lavabos, duchas, cocinas |

- **Sin agua**: lavabos, váteres y duchas no funcionan (necesidades de higiene, vejiga y comida afectadas). La bomba genera calor y puede sobrecalentar a los presos cercanos.
- **Evento**: tubería rota inunda la zona y hay que reponerla.
- Se dibujan en una vista de **Servicios** (cables y tuberías).

## 7. Propuesta para Grassroots

| Mecánica de PA | Adaptación | Fase |
|---|---|---|
| Obreros y cola de tareas | Cuadrilla de mantenimiento; la obra no es instantánea y depende de nº de operarios. Empezar con "obra instantánea con coste" y luego añadir operarios. | 2 / backlog |
| Cimientos por m2 + puerta obligatoria | Ya implementado. Añadir que un edificio no "cierra" sin puerta. | 1B (hecho) |
| Tiempos por muro | `buildSeconds` en `content/` y animación de andamio acorde. | 1B pulido |
| Materiales y entregas por carretera | Camión de obra a la recepción de mercancías (ya hay muelles): material de obra como recurso que se agota. | 4B / backlog |
| Almacén y objetos desmontados | Almacén del club con material y objetos reutilizables. | 4B |
| Dureza/estado | Desgaste del césped, de los vestuarios; reparación con dinero. Objeto con "estado" 0-100 y funcionamiento reducido a partir de un umbral. | 4B / 5 |
| Red eléctrica con generador y condensadores | Generador con unidades; focos 25, bomba de agua 100, luces 1; vestuarios necesitan electricidad. Cable "radio de alcance" (decisión abierta en el plan). | 4B |
| Agua con bomba y tuberías | Depósito/bomba; duchas y riego consumen; sin agua baja moral y el césped se seca. | 4B |
| Sectores | Zonas "solo personal", "jugadores", "público". | 4 |
| Velocidad por suelo | Caminos que aceleran el desplazamiento de personas. | 6 |

## Fuentes
- https://prisonarchitect.paradoxwikis.com/Foundations
- https://prisonarchitect.paradoxwikis.com/Materials
- https://prisonarchitect.paradoxwikis.com/Planning
- https://prisonarchitect.paradoxwikis.com/Quick_build
- https://prisonarchitect.paradoxwikis.com/Items
- https://prisonarchitect.paradoxwikis.com/Storage
- https://prisonarchitect.paradoxwikis.com/Delivery
- https://prisonarchitect.paradoxwikis.com/Road
- https://prisonarchitect.paradoxwikis.com/Logistics
- https://prisonarchitect.paradoxwikis.com/Workman
- https://prisonarchitect.paradoxwikis.com/Toughness
- https://prisonarchitect.paradoxwikis.com/Utilities
- https://prisonarchitect.paradoxwikis.com/Power_Station
- https://prisonarchitect.paradoxwikis.com/Capacitor
- https://prisonarchitect.paradoxwikis.com/Water_Pump_Station
- https://prisonarchitect.paradoxwikis.com/Events
- https://prisonarchitect.paradoxwikis.com/Objects
- https://prisonarchitect.paradoxwikis.com/Rooms
