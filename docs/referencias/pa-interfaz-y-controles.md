# Prison Architect: interfaz, controles y demolición

> Fiabilidad: **[wiki]** wiki oficial · **[web]** otras fuentes · **[est.]** estimación. Salas y objetos: [pa-salas-y-objetos.md](pa-salas-y-objetos.md).

## 1. Disposición de la interfaz [wiki: User_interface]

| Zona | Contenido |
|---|---|
| **Barra superior** | Medidor de peligro (aparece al contratar al Jefe de seguridad), contador de días, saldo bancario, flujo de caja diario, guardias disponibles, capacidad de presos. |
| **Barra inferior (menú principal)** | Herramientas de construcción: Cimientos, Materiales, Salas, Objetos, Personal. Sistemas avanzados: Servicios (electricidad y fontanería), Despliegue, Logística, Inteligencia. Acciones de emergencia: Fuego libre, Registro general, Cierre, Encierro, Pase de lista. |
| **Reloj** (esquina superior derecha) | Hora, día y control de velocidad; muestra temperatura si está activada. |
| **Lista de tareas** (nota adhesiva arriba a la izquierda) | Subvenciones, entradas de presos, fechas de liberación, grupos de visitas, descanso del personal, estado de las comidas, eventos. |
| **Menú Informes** | Finanzas, demografía de presos, programas, necesidades. 12 pestañas (ver abajo). |
| **Menú contextual** | Al hacer clic en objetos o personas: desmontar, tirar, registrar, reparar, despedir. |
| **Avisos** | Símbolos de alarma sobre el mapa; llamadas telefónicas que avisan de eventos; la lista de tareas los resume. |

### Informes (12 pestañas) [wiki: Reports]
Personal · Presos · Traslados · Entradas · Trabajos · Necesidades (necesita psicólogo; código de color rojo crítico, naranja alto, amarillo medio, verde satisfecho, azul en curso) · Régimen · Política · Subvenciones · Programas · Finanzas (necesita contable) · Valoración (necesita contable).

### Vistas / capas
PA tiene vistas conmutables sobre el mapa: Servicios (cables y tuberías), Despliegue (sectores y patrullas), Inteligencia (contrabando), Logística (calidad de sala, reparto de comida/ropa), Peligro. Cada una atenúa el resto y resalta lo suyo.

## 2. Controles [wiki: Controls]

### Cámara y vista
| Acción | Control |
|---|---|
| Mover | W/A/S/D o flechas |
| Arrastrar cámara | Rueda pulsada |
| Acercar / alejar | Q o rueda arriba / E o rueda abajo |
| Escala de la interfaz | + y ) |
| Captura | Ctrl + P |

### Construcción
| Acción | Control |
|---|---|
| Colocar | Clic izquierdo |
| Girar / reflejar | Clic en rueda o R; F para reflejar (clonar) |
| Cancelar | Clic derecho o Esc |
| Cancelar varios | Clic derecho y arrastrar un área |
| Priorizar tarea | Ctrl + clic izquierdo |
| Quitar prioridad | Ctrl + clic derecho |
| Ciclar entre objetos | Z / X |
| Cerrar menú | C o Esc |

### Selección y órdenes
Clic izquierdo = seleccionar; arrastrar = selección múltiple; clic derecho = enviar personal a un punto o abrir una puerta.

### Velocidades [wiki: Controls; User_interface]
| Tecla | Velocidad |
|---|---|
| Espacio | Pausa |
| 1 | Normal |
| 2 | 2x |
| 3 | 5x |
| 4 | 10x |

La página de interfaz solo cita hasta 5x; la de controles añade 10x. Un día de juego dura ~24 min reales a velocidad normal [web].

## 3. Herramientas de demolición (bulldozer) [wiki: Materials, Foundations, Planning] + [web]

PA no tiene una sola herramienta: tiene **cuatro** con alcance distinto.

| Herramienta | Menú | Qué borra | Quién | Coste / dinero |
|---|---|---|---|---|
| **Demoler muros** | Materiales | Solo muros/vallas seleccionados | Obreros (crean tarea) | Gratis |
| **Limpiar área interior** | Materiales | Muros interiores, objetos, suelos y designaciones de sala; **conserva** cimientos y servicios | Obreros | Los objetos desmontados van a almacén |
| **Bulldozer** | Cimientos | Todo el edificio: cimientos, muros, objetos, suelos, salas, cables y tuberías; deja escombros y basura | Obreros | No hay reembolso documentado |
| **Vender suelo** | Suelos | Un tipo de suelo concreto | **Inmediato**, sin obreros | Sin reembolso documentado |
| Quitar túneles | Materiales | Túneles de fuga | Obreros | $20 |

Reglas de uso:
- Se aplica **arrastrando un rectángulo** (clic izquierdo mantenido). Clic derecho/arrastre derecho sobre designaciones de sala o planos las borra.
- **Prioridad**: no hay jerarquía visible entre capas; cada herramienta actúa solo sobre su tipo. La "limpieza" es el equivalente a "todo menos estructura"; el bulldozer es "todo".
- Los objetos no se destruyen: los obreros los **desmontan y los guardan** en almacén para reutilizarlos (y se pueden tirar a la basura). Si no hay almacén se quedan en el suelo.
- **Dinero**: la wiki no menciona reembolso por demoler; el ahorro está en reutilizar lo desmontado. Colocar solo exige tener fondos **o** el objeto en almacén.
- Los muros demolidos devuelven materiales como escombro/basura que los obreros retiran a la zona de basura.

## 4. Planos y construcción asistida [wiki: Planning, Quick_build]

- **Planificación**: dibujar con clic izquierdo, borrar con derecho; líneas (muros exteriores) y cuadrados (salas; cajas mayores de 2x2 incluyen cimientos). Botón *Build Plans* → diálogo para elegir material de muro. Los obreros empiezan al aceptar. Los planos se limpian solos al construir o con *Clear Plans*. Los objetos y senderos planificados son solo ayuda visual.
- **Quick build**: menú de salas prefabricadas y herramienta clon (clic derecho para seleccionar, clic izquierdo para pegar; R gira, F refleja). Tamaños predefinidos: celda 11x7 (8 camas), cocina 10x8, comedor 13x12 (32 presos), duchas 11x7 (33 cabezales), taller 15x16.

## 5. Adaptación a Grassroots

| PA | Propuesta nuestra | Fase |
|---|---|---|
| Barra inferior con categorías | Ya implementada (bloque B de la Fase 1B). | 1B (hecho) |
| Informes en carpeta con pestañas | Ya planificado: carpeta del míster abajo a la derecha. | 2 |
| Lista de tareas tipo nota adhesiva | "Tablón del vestuario" con avisos y próximos partidos. | 2 |
| Teclas de velocidad 1/2/3 + espacio | Pausa / 1x / 3x (ya definido). Añadir teclas 1-3 y espacio. | 2 |
| Bulldozer 4 niveles | Demoler objeto / muro / sala / edificio entero con vista previa de lo que se borra; vender suelo inmediato. Reutilizar objetos desmontados en almacén. | 1B (hecho parte), pulido en 2 |
| Z/X para ciclar, Ctrl+clic para priorizar | Atajos de construcción; priorizar solo si añadimos obreros (Fase 2+). | 2 |
| Clon de salas | Copiar un vestuario completo; muy útil al crecer. | 2-4 |

## Fuentes
- https://prisonarchitect.paradoxwikis.com/User_interface
- https://prisonarchitect.paradoxwikis.com/Controls
- https://prisonarchitect.paradoxwikis.com/Reports
- https://prisonarchitect.paradoxwikis.com/Materials
- https://prisonarchitect.paradoxwikis.com/Foundations
- https://prisonarchitect.paradoxwikis.com/Planning
- https://prisonarchitect.paradoxwikis.com/Quick_build
- https://prisonarchitect.paradoxwikis.com/Objects
- https://prisonarchitect.paradoxwikis.com/Prison
- Búsqueda web sobre el bulldozer (guías de Steam y foros de Introversion sobre el uso de "Clean Indoor Area" y "Sell Flooring").
