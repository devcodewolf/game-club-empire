# Referencia: salas y objetos de Prison Architect y adaptación a Club Builder

Fuente de datos: wiki de Paradox (ver sección 5). Los datos de precio, tamaño, requisitos y electricidad/agua vienen de la wiki. Las **descripciones visuales** son orientativas: la wiki en texto apenas las detalla, así que se han completado con el aspecto conocido del juego y criterio propio (marcadas como "visual propuesto"). Los tamaños con "~" son estimaciones. Los datos de PA están en dólares ($), la propuesta de Club Builder en euros (€).

---

## 1. Cómo funcionan las salas en PA

- **Designación:** se elige el tipo de sala y se arrastra sobre el suelo; el clic derecho la quita. La zona se pinta con un damero de color y el nombre. Designar no cuesta nada: se paga la cimentación y los objetos.
- **Requisitos:** cada sala exige objetos mínimos (p. ej. oficina = mesa + silla + archivador). Un icono de aviso aparece en la sala incompleta hasta que se cumplen. El tooltip del menú muestra el mínimo.
- **Interior / exterior:** cada sala es "Indoors" (recinto cerrado, sin contar las puertas exteriores en la designación) u "Outdoors" (patio, forestal). El patio además debe ser "seguro" (vallado con puerta).
- **Tamaño mínimo:** va de 1x3 (entregas, basura) a 6x6 (capilla). Típicos: oficina/seguridad/sala de personal 4x4; patio, taller, aula, biblioteca 5x5; gimnasio 7x7; armario de limpieza 3x3. Muchas salas no tienen mínimo explícito (cocina, comedor, ducha, almacén, enfermería ~5x3).
- **Puerta:** algunas salas piden un tipo de puerta (celda = puerta de celda, oficina/zona de personal = puerta de personal). La puerta normal sirve a casi todas.
- **Capacidad:** depende de la superficie: una lavandería/biblioteca/limpieza admite un trabajador por 4-12 casillas (máx. 100); un dormitorio, un preso por 4 casillas.
- **Calidad ("grade", 0-10):** existe en celdas, dormitorios, comedor, gimnasio, aula y patio. Sube con objetos concretos (1 punto por categoría y, a veces, por cada N presos), ventanas al exterior, superficie mínima y mejores camas/comidas; baja sin ventanas o con materiales deprimentes. Es el mecanismo que PA usa para convertir "decorar" en un beneficio medible.
- **Salas de producción** (cocina, lavandería, taller, biblioteca) emplean a presos o personal y tienen contrabando asociado. En Club Builder esto se traduce en personal de club/voluntarios.

---

## 2. Tabla de salas de PA

| Sala | Int/Ext | Tamaño mín. | Objetos requeridos | Opcionales / mejoras | Para qué sirve |
|---|---|---|---|---|---|
| Office (oficina) | Int | 4x4 | Office Desk, Chair, Filing Cabinet | - (el tamaño extra no aporta) | Trabajo del alcaide, contable, psicólogo, abogado |
| Security (seguridad) | Int | 4x4 | Office Desk, Chair, Filing Cabinet | CCTV Monitor, control de puertas, Phone Tap | Cuartel de guardias, cámaras, puertas remotas |
| Reception (recepción) | Int | ~4x4 | Office Desk, Table, Chair | Lavandería conectada | Registro y cacheo de recién llegados |
| Kitchen (cocina) | Int | sin mínimo (~5x4) | Cooker, Fridge, Sink | Bin, Staff Door | Prepara la comida del comedor |
| Canteen (comedor) | Int | sin mínimo | Serving Table, Table, Bench | Bin, Chair, ventanas, Fan, Plants, Water Cooler, máquinas | Comidas; grade 0-10 |
| Shower (duchas) | Int | sin mínimo (~3x3) | Shower Head | Drain (desagüe) | Necesidad de higiene |
| Staff Room (sala de personal) | Int | 4x4 | Sofa Chair Double, Drink Machine | Sofa simple, radio, arcade, billar, Serving Table, Toilet | Recuperar energía del personal |
| Infirmary (enfermería) | Int | ~5x3 | Medical Bed (mín. 1) | Morgue Slab | Tratar heridos; el médico descansa aquí |
| Storage (almacén) | Int | sin mínimo | ninguno | - | Depósito de materiales y reposo de operarios |
| Deliveries (entregas) | Ext/Int | 1x3 | ninguno | - | Punto de llegada de camiones |
| Garbage (basura) | Ext/Int | 1x3 | ninguno | Bin | Recogida de residuos |
| Common Room (sala común) | Int | sin mínimo (bonus 25+/50+ casillas) | ninguno | TV, billar, futbolín, cabina, estantería, silla, radio, arcade, máquina de snacks | Recreo en tiempo libre |
| Gymnasium (gimnasio) | Int | 7x7 | Weights Bench, Gym Mat | Treadmill, Punch Bag, Boxing Ring, Fan, Water Cooler, Dumbbell Rack, ventanas | Ejercicio, fuerza/velocidad; grade 0-10 |
| Yard (patio) | Ext seguro | 5x5 | - (vallado + puerta) | Bench, Weights Bench, Phone Booth, Dumbbell Rack, Bleachers, Punch Bag | Aire libre y ejercicio; grade 0-10 |
| Laundry (lavandería) | Int | 4 casillas por trabajador | Laundry Machine, Laundry Basket, Ironing Board | Table | Lavar, planchar y repartir uniformes |
| Cleaning Cupboard | Int | 3x3 | ninguno (suministra lejía) | - | Empleo de limpiadores |
| Classroom (aula) | Int | 5x5 | School Desk (1/alumno), Office Desk | Bookshelf, Water Cooler, Blackboard, ventanas | Programas educativos; grade 0-10 |
| Library (biblioteca) | Int | 5x5 | Library Shelf, Sorting Desk | Chair | Lectura y trabajo |
| Visitation (visitas) | Int | sin mínimo | Visitor Table o cabina | - | Visitas de familia |
| Dormitory / Cell | Int | 2x3 | Bed/Bunk, Toilet, puerta de celda | Shower Head, TV, Table, Bookshelf, Chair, Fan, ventanas | Alojamiento; grade 0-10 |
| Shop / Mail Room / Workshop | Int | 4x4 / 5x5 / 5x5 | Shop Shelf+Table / Sorting Desk+Table / Saw+Press+Table | - | Comercio, correo, producción |
| Armoury (armería) | Int | sin mínimo | Weapon Rack, Guard Locker, Table | puertas reforzadas | Equipo de guardias armados |
| Chapel / Parole / Psychiatrist / Nursery / Kennel / Morgue / Forestry | varios | 6x6 / 5x5 / 4x4 / ~ / 5x5 / ~ / 5x5 | Altar+Pews / Visitor Table / Office Desk+sofá+archivador / Crib+mesa / jaula / Morgue Slab / - | - | Fuera de interés para el club |

Salas con página consultada: Office, Kitchen, Canteen, Shower, Staff Room, Infirmary, Storage, Common Room, Laundry, Yard, Reception, Security, Gymnasium, Classroom, Dormitory, Visitation, Library, Cleaning Cupboard, Armoury (19). La tabla general de la página Room cubre ~38 tipos.

---

## 3. Tabla de objetos de PA

Leyenda: Elec = necesita electricidad (cable), Agua = tubería. Tamaño en casillas ancho x alto. "~" = estimado. Tiempo de construcción: la wiki **no lo indica en ninguna de las páginas consultadas**. Descripciones: visual propuesto, vista cenital.

### Administración
| Objeto | Tamaño | Precio | Elec/Agua | Salas | Descripción visual |
|---|---|---|---|---|---|
| Office Desk | 2x1 | 30 $ | No | Oficina, Seguridad, Aula, Celda (opc.) | Rectángulo de madera marrón; papeles blancos, teclado/monitor pequeño y una taza |
| Filing Cabinet | 1x1 | 30 $ | No | Oficina, Seguridad | Cuadrado gris metálico; 3 líneas de cajones con tirador y borde oscuro |
| Chair | 1x1 | 30 $ | No | Oficina, Seguridad, Recepción, Celda, Común | Cuadrado/círculo de madera con respaldo en un lado, visto como arco |
| Bench (grande / pequeño) | 4x1 / 2x1 (oak 3x1) | 30 $ / 20 $ (oak 20 $) | No | Comedor, Celda de espera, Patio | Tablón de madera alargado con 2 patas marcadas en los extremos |
| Table / Small Table | 4x1 / 2x1 | 100 $ / 50 $ | No | Comedor, Recepción, Tienda, Armería, Taller | Rectángulo de madera clara con borde oscuro y 4 puntos de patas |
| Visitor Table | 2x3 | 300 $ | No | Visitas, Libertad condicional | Mesa ancha con un tabique central y sillas a los lados |
| Guard Locker | 1x1 | 200 $ | No | Armería | Taquilla gris azulado, línea de puertas y rejillas |

### Decoración y confort
| Objeto | Tamaño | Precio | Elec/Agua | Salas | Descripción visual |
|---|---|---|---|---|---|
| Plants | 1x1 | 30 $ | No | Cualquiera | Maceta terracota circular con hojas verdes radiales; variante cactus |
| Painting | 1x1 | 150 $ | No | En pared | Marco fino de madera con lienzo de color; 2 variantes |
| Water Cooler | 1x1 | 250 $ | ~Agua (no lo indica) | Comedor, Aula, Dormitorio, Gimnasio | Cuadrado blanco con garrafa azul circular encima |
| Fan | 1x1 | 30 $ | ~Elec | Comedor, Dormitorio, Gimnasio | Círculo gris con 3-4 aspas |
| Bookshelf | 1x1 | 30 $ | No | Común, Celda, Dormitorio | Estantería marrón con lomos de colores en línea |
| Blackboard | 2x1 | 50 $ | No | Aula | Panel verde oscuro/negro con marco de madera y tiza |
| Moose Head / Warden Statue | 1x1 | 500 $ / 1.000 $ | No | Oficina | Trofeo en pared / pedestal de piedra con figura |
| Bathroom Sink | 1x1 | 100 $ | Agua (tubo pequeño) | Duchas, Celda | Lavabo blanco ovalado con grifo |
| Bin | 1x1 | 20 $ | No | Cualquiera | Cilindro gris visto como círculo con borde y tapa |
| Window (normal / elegante) | 1x1 o 2x1 | 200 $ / 300 $ | No | En pared | Hueco en el muro con cristal azul claro y marco; barras en la versión normal |
| Radiator | 1x1 | 200 $ | Agua caliente (caldera) | Interior | Panel blanco con aletas verticales pegado a la pared |
| Lamp | 1x1 | ~ | No | Cualquiera | Lámpara de pie: círculo amarillo con halo |

### Necesidades y descanso
| Objeto | Tamaño | Precio | Elec/Agua | Salas | Descripción visual |
|---|---|---|---|---|---|
| Toilet | 1x1 | 100 $ | Agua | Celda, Dormitorio, Espera | Taza blanca ovalada con tapa y cisterna rectangular |
| Shower Head | 1x1 | 20 $ | Agua (fría/caliente) | Duchas | Disco gris con puntos de salida y un baldosín mojado azul |
| Sink (cocina) | 3x1 | 20 $ | Agua | Cocina | Encimera de acero con 2 cubetas y grifo |
| Bed / Old / Comfy / Foam | 2x1 | 200 / 50 / 800 / 10 $ | No | Celda, Dormitorio | Colchón con almohada en un extremo; sábana de color según calidad |
| Bunk Bed | 2x1 | 500 $ | No | Dormitorio | Igual que la cama pero más oscura, con barandilla |
| Sofa Chair Single / Double | 1x1 / 2x1 | 200 / 300 $ | No | Sala de personal | Sillón acolchado marrón/rojo con respaldo y reposabrazos |
| Medical Bed | 2x2 | 500 $ | No (~) | Enfermería | Camilla blanca con almohada, manta verde azulada y cruz |

### Cocina y trabajo
| Objeto | Tamaño | Precio | Elec/Agua | Salas | Descripción visual |
|---|---|---|---|---|---|
| Cooker | 2x1 | 500 $ | Elec (~20 %) | Cocina | Encimera de acero con 4 fuegos circulares negros y sartén |
| Fridge | 2x1 | 500 $ | Elec (~20 %) | Cocina | Bloque blanco con tirador, vista desde arriba como rectángulo liso |
| Serving Table | 5x1 | 20 $ | No | Comedor | Barra de acero con bandejas y recipientes de comida |
| Laundry Machine | 1x1 | 1.000 $ | Elec (~20 %) + Agua | Lavandería | Cuadrado blanco con ojo de buey circular azul |
| Laundry Basket | 1x1 | 100 $ | No | Lavandería | Cesto de mimbre redondo con ropa asomando |
| Ironing Board | 1x3 o 1x2 | 100 / 50 $ | No (~) | Lavandería | Tabla alargada gris azulada con plancha |
| Shop Shelf | 1x3 | 250 $ | No | Tienda | Estantería con cajas y productos de colores |

### Recreación y ejercicio
| Objeto | Tamaño | Precio | Elec/Agua | Salas | Descripción visual |
|---|---|---|---|---|---|
| Weights Bench | 1x1 | 100 $ | No | Patio, Común, Gimnasio | Banco acolchado negro con barra de pesas y discos |
| Treadmill | 2x1 | 500 $ | Elec | Gimnasio | Cinta gris oscura con pantalla de control en un extremo |
| Dumbbell Rack | 1x1 | 100 $ | No | Gimnasio, Patio | Soporte con 2 filas de mancuernas negras |
| Gym Mat | 1x1 | 30 $ | No | Gimnasio | Esterilla azul con borde más oscuro |
| Punch Bag | 1x1 | 150 $ | No | Gimnasio, Patio | Círculo rojo/marrón con cadena central |
| Bleachers | 3x4 | 200 $ | No | Patio | Gradas escalonadas de madera en filas |
| Pool Table | 2x3 | 300 $ | No (~) | Común, Patio | Paño verde con troneras en las esquinas y marco marrón |
| TV | 1x1 | 200 $ | Elec (~2 %) | Común, Celda | Pantalla negra plana con marco gris |
| Phone Booth | 1x1 | 300 $ | No | Patio, Común | Cabina cuadrada con auricular |
| Snack Machine / Drink Machine | 1x1 | 500 / 500 $ | ~Elec | Comedor, Común / Sala de personal | Máquina rojo y azul con ventana de productos |

### Seguridad, puertas e iluminación
| Objeto | Tamaño | Precio | Elec/Agua | Salas | Descripción visual |
|---|---|---|---|---|---|
| Door | 1x1 | 50 $ | No | Cualquiera | Hoja de madera marrón sobre el hueco, con bisagra y arco |
| Jail Door | 1x1 | 200 $ | No | Celdas | Barrotes metálicos grises |
| Staff Door | 1x1 | 100 $ | No | Zonas de personal | Puerta con franja distintiva y letrero |
| Remote Door | 1x1 | 500 $ | Servo + elec | Seguridad | Puerta metálica gris con luz de estado |
| Solitary Door | 1x1 | 500 $ | No | Aislamiento | Hierro grueso con remaches |
| Road Gate | 7x1 | 1.000 $ | Servo + elec | Carretera | Dos hojas metálicas con franjas de color |
| Road Barrier | 7x1 | 10.000 $ | Servo + elec | Carretera | Pluma rayada rojiblanca sobre pivote |
| Light | 1x1 | 30 $ | Elec (~2 %) | Interior/exterior | Disco amarillo claro con halo de luz |
| Wall Light | 1x1 | 150 $ | No (según wiki) | Muros/vallas | Pequeña luz pegada al muro con haz |
| Street Lamp | 1x1 | 150 $ | No (según wiki) | Exterior | Farola: poste y cabeza oscura con halo |
| Flood Light | 1x1 | 250 $ | No (según wiki) | Exterior | Foco alto con cono amplio |
| CCTV | 1x1 | 200 $ | Elec (~2 %) | Interior | Cámara negra sobre pared con cono de visión |
| Metal Detector | 1x1 | 1.000 $ | Elec (~20 %) | Cualquiera | Arco de detección gris con luz verde/roja |

Objetos documentados: **64 filas** (con variantes) en ~50 familias. Páginas no encontradas: `Trees` (404). `Lamp` y `Plants` devolvieron el resumen de decorativos, sin ficha propia. `Fan` y `Windows` también son resúmenes agregados.

---

## 4. Propuesta de adaptación a Club Builder

### 4.1 Principios
- **La "calidad de sala" de PA es la mejor idea para trasladar:** cada sala tiene un nivel 0-10 que sube con objetos opcionales, tamaño y ventanas, y alimenta una necesidad del jugador (descanso, forma física, moral).
- **Sala = designación + objetos mínimos.** Mismo patrón que `content/*.ts`: una entrada por sala con `requisitos`, `tamañoMin`, `divisionMin` y `efectos`.
- **Escala de precios:** PA ronda 30-1.000 $; para un club modesto se aplica aproximadamente un factor 0,4-0,6, con redondeos y un mínimo de 10 €.

### 4.2 Salas del club

División mínima en orden: comarcal, regional, autonomica, nacionalB, nacionalA, elite.

| Sala | Requisitos mínimos de objetos | Tamaño mín. | División mín. | Qué aporta |
|---|---|---|---|---|
| Vestuario local | 6 Taquillas/Banco, 1 Ducha, 1 Inodoro, 1 Pizarra táctica | 4x5 | comarcal | Preparación de partidos; moral y descanso; calidad sube con duchas y taquillas |
| Vestuario visitante | 6 Bancos de vestuario, 1 Ducha, 1 Inodoro | 4x4 | comarcal | Requisito de licencia de campo; evita sanciones y mala fama |
| Vestuario de árbitros | 1 Banco, 1 Ducha, 1 Taquilla | 3x3 | regional | Requisito federativo; mejora la valoración del árbitro hacia el club |
| Oficina | Mesa de oficina, Silla, Archivador | 4x4 | comarcal | Desbloquea gestión: contratos, patrocinios, finanzas |
| Recepción / Secretaría | Mostrador, Silla, Mesa | 4x4 | regional | Altas de jugadores, abonos y atención al socio; aumenta captación |
| Almacén de material | Estantería de material (x2) | 3x3 | comarcal | Guarda balones, petos y conos; reduce coste de reposición |
| Lavandería | Lavadora, Cesto, Tabla de planchar | 4x4 | regional | Equipaciones limpias; moral y presentación; coste de agua y luz |
| Enfermería / Fisioterapia | Camilla (x2), Armario médico | 5x3 | autonomica | Recupera lesionados más rápido; reduce lesiones largas |
| Gimnasio | Banco de pesas, Esterilla, Cinta, Rack de mancuernas | 7x7 | autonomica | Sube forma física y resistencia; cansancio baja más rápido |
| Cafetería / Bar | Barra, Mesa, 4 Bancos/Sillas, Nevera, Cafetera | 5x5 | comarcal | Ingresos por aficionados, moral, ambiente en día de partido |
| Cocina | Cocina, Nevera, Fregadero | 4x4 | regional | Suministra la cafetería y el comedor de los jugadores; sube necesidades |
| Sala de prensa | Atril, 6 Sillas, Panel de patrocinadores | 5x5 | nacionalB | Fama y patrocinios tras los partidos |
| Sala de trofeos | 3 Vitrinas, Cuadro, Alfombra | 4x4 | autonomica | Prestigio pasivo y orgullo; atrae jugadores |
| Sala de vídeo / análisis | Pantalla, 6 Sillas, Mesa con portátil | 4x5 | nacionalB | Bonus táctico y menos derrotas por mal planteamiento |
| Dormitorios de cantera | 4 Camas, Taquilla, Inodoro, Ducha | 3x4 por 4 plazas | nacionalA | Aloja jóvenes; genera jugadores de cantera, necesita residencia y comedor |
| Sala de calderas / máquinas | Caldera, Cuadro eléctrico, Depósito | 3x3 | autonomica | Produce agua caliente y calefacción; imprescindible en Fase 4B |
| Garita de seguridad | Mesa, Silla, Monitor CCTV | 3x3 | regional | Control de acceso, reduce incidentes y multas |
| Sala de personal | Sofá doble, Máquina de café | 4x4 | regional | Recupera energía de entrenadores y médicos |
| Sala de reuniones del club | Mesa larga, 8 Sillas, Pizarra | 5x4 | nacionalB | Eventos de directiva y negociaciones |

### 4.3 Objetos equivalentes (€ y tamaño)

| Objeto | Tamaño | Precio | Elec | Agua | Uso principal |
|---|---|---|---|---|---|
| Taquilla | 1x1 | 40 € | no | no | Vestuarios |
| Banco de vestuario | 3x1 | 30 € | no | no | Vestuarios, patio |
| Ducha (cabezal) | 1x1 | 25 € | no | si (caliente) | Vestuarios |
| Inodoro | 1x1 | 60 € | no | si | Vestuarios, dormitorios |
| Lavabo | 2x1 | 50 € | no | si | Vestuarios, cocina |
| Pizarra táctica | 2x1 | 80 € | no | no | Vestuarios, vídeo |
| Mesa de oficina | 2x1 | 50 € | no | no | Oficina, recepción |
| Silla | 1x1 | 20 € | no | no | General |
| Archivador | 1x1 | 40 € | no | no | Oficina |
| Ordenador / portátil | 1x1 | 200 € | si | no | Oficina, vídeo |
| Mostrador de recepción | 3x1 | 120 € | no | no | Recepción |
| Estantería de material | 1x2 | 60 € | no | no | Almacén |
| Lavadora industrial | 1x1 | 500 € | si | si | Lavandería |
| Secadora | 1x1 | 450 € | si | no | Lavandería |
| Cesto de ropa | 1x1 | 30 € | no | no | Lavandería, vestuarios |
| Camilla de fisioterapia | 2x1 | 250 € | no | no | Enfermería |
| Armario médico | 1x1 | 120 € | no | no | Enfermería |
| Bañera de hielo | 2x1 | 400 € | no | si | Enfermería |
| Banco de pesas | 1x1 | 60 € | no | no | Gimnasio |
| Cinta de correr | 2x1 | 300 € | si | no | Gimnasio |
| Rack de mancuernas | 1x1 | 80 € | no | no | Gimnasio |
| Esterilla | 1x1 | 15 € | no | no | Gimnasio |
| Saco de boxeo | 1x1 | 90 € | no | no | Gimnasio |
| Barra de bar | 3x1 | 180 € | no | no | Cafetería |
| Cafetera | 1x1 | 250 € | si | si | Cafetería, sala de personal |
| Nevera | 2x1 | 300 € | si | no | Cocina, cafetería |
| Cocina / fogones | 2x1 | 300 € | si | no | Cocina |
| Fregadero industrial | 3x1 | 100 € | no | si | Cocina |
| Mesa de comedor | 4x1 | 60 € | no | no | Cafetería, comedor |
| Máquina expendedora | 1x1 | 300 € | si | no | Cafetería, personal |
| Sofá doble | 2x1 | 180 € | no | no | Sala de personal |
| Atril de prensa | 1x1 | 80 € | no | no | Sala de prensa |
| Panel de patrocinadores | 2x1 | 120 € | no | no | Sala de prensa |
| Vitrina de trofeos | 1x1 | 150 € | no | no | Sala de trofeos |
| Pantalla / TV | 1x1 | 120 € | si | no | Vídeo, bar |
| Cama / litera | 2x1 | 100 € / 220 € | no | no | Dormitorios |
| Caldera | 2x2 | 800 € | si | si | Sala de calderas |
| Radiador | 1x1 | 90 € | no | si (caliente) | Interiores |
| Cuadro eléctrico | 1x1 | 400 € | si | no | Sala de máquinas |
| Planta | 1x1 | 15 € | no | no | Decoración |
| Cuadro / foto | 1x1 | 60 € | no | no | Decoración |
| Papelera | 1x1 | 10 € | no | no | General |
| Puerta | 1x1 | 30 € | no | no | General |
| Puerta de personal | 1x1 | 60 € | no | no | Zonas restringidas |
| Puerta automática | 2x1 | 300 € | si | no | Entradas |
| Foco | 1x1 | 120 € | si | no | Exterior, estadio |
| Farola | 1x1 | 70 € | si | no | Calles y accesos |
| Luz de techo | 1x1 | 15 € | si | no | Interior |
| Cámara CCTV | 1x1 | 120 € | si | no | Garita, exterior |
| Barrera de acceso | 4x1 | 1.500 € | si | no | Entrada |
| Gradas pequeñas | 3x4 | 200 € | no | no | Campo (ya existen gradas por aforo) |

### 4.4 Suministros para la Fase 4B

- **Necesitan electricidad:** luces (consumo bajo), CCTV, TV/pantallas, ordenadores, cinta de correr, cafetera, neveras, cocinas eléctricas, lavadora, secadora, máquinas expendedoras, focos y farolas, barrera/puerta automática, caldera (bomba), cuadro eléctrico. En PA el consumo es del ~2 % por luz/cámara/TV y ~20 % por aparato grande (cocina, nevera, lavadora, detector).
- **Necesitan agua (fría):** inodoros, lavabos, fregaderos, lavadoras, cafetera, bañera de hielo.
- **Necesitan agua caliente (caldera):** duchas, bañera de hielo, radiadores. En PA la ducha funciona con caldera o con bomba de agua fría.
- **Sin suministro:** mobiliario, taquillas, bancos, mesas, sillas, camillas, mancuernas, esterillas, plantas, cuadros.
- **Regla de diseño:** modelar dos redes (cableado eléctrico y tuberías) como en PA, con consumo en unidades fijas. Importante: la wiki dice que luces exteriores y de pared de PA funcionan sin cable; en Club Builder conviene que sí lo necesiten para dar sentido a la Fase 4B.

### 4.5 Ideas clave para el diseño
1. **Calidad de sala 0-10 por objetos opcionales** (patrón del comedor, gimnasio y dormitorio de PA): cada vestuario/gimnasio/dormitorio tendría una nota que afecta al descanso, forma y moral de forma medible.
2. **Contador por ocupación** (1 trabajador por 4 casillas en lavandería, 1 preso por 4 en dormitorio): usar una regla análoga de "casillas por plaza" para capacidad de vestuarios y dormitorios de cantera.
3. **Desbloqueo por división igual que PA por investigación**: la sala de prensa, vídeo y dormitorios de cantera como metas de ascenso. Los iconos de aviso en salas incompletas dan feedback inmediato de qué falta.

---

## 5. Fuentes (wiki de Paradox consultada)

Base: https://prisonarchitect.paradoxwikis.com/ + Room, Objects.
Salas: Office, Kitchen, Canteen, Shower, Staff_Room, Infirmary, Storage, Common_Room, Laundry, Yard, Reception, Security, Gymnasium, Classroom, Dormitory, Visitation, Library, Cleaning_Cupboard, Armoury.
Objetos: Office_Desk, Light, Filing_Cabinet, Chair, Bench, Shower_Head, Toilet, Sink, Table, Medical_Bed, Weights_Bench, Treadmill, Fridge, Cooker, Serving_Table, Bookshelf, Plants, Water_Cooler, Sofa_Chair_Single, Sofa_Chair_Double, TV, Pool_Table, Drink_Machine, Snack_Machine, Bin, Radiator, Lamp, Shop_Shelf, Dumbbell_Rack, Gym_Mat, Punch_Bag, Bleachers, Phone_Booth, CCTV, Metal_Detector, Door, Staff_Door, Road_Gate, Road_Barrier, Street_Lamp, Flood_Light, Wall_Light, Laundry_Machine, Ironing_Board, Laundry_Basket, Bed, Bunk_Bed, Guard_Locker, Windows, Visitor_Table, Fan.
No encontrada (404): Trees.
