# Diseño: estadio modular y niveles de objetos

## 1. Estadio modular

### Idea
Las gradas dejan de ser objetos sueltos que se colocan en cualquier sitio. Son **módulos que se pegan a los lados del campo** y se mejoran en el sitio. Al ir subiendo de nivel, los cuatro lados y las esquinas se unen hasta formar, vistos desde arriba, un estadio cerrado.

### Huecos del campo
Cada campo de fútbol 11 tiene 8 huecos:
- 2 **laterales** (bandas), a lo largo del lado largo.
- 2 **fondos**, detrás de cada portería.
- 4 **esquinas**, que unen un lateral con un fondo.

Entre la línea del campo y la primera fila hay un **pasillo perimetral** fijo (2 casillas) que más adelante alojará las vallas publicitarias.

### Colocar y mejorar
- Para construir, el jugador elige un hueco y la grada se ajusta sola: largo igual al lado del campo y frente siempre mirando al campo. No hay que girarla ni medirla.
- Para mejorar, se selecciona la grada existente y se sube de nivel. La grada crece **hacia fuera**: la primera fila sigue pegada al pasillo.
- Durante la obra, la grada pierde parte de su aforo y se ve con andamios.
- Al elegir un hueco, se muestra en fantasma la **huella máxima** que ocuparía en el último nivel, para que el jugador no construya justo detrás y luego no pueda crecer.

### Niveles de grada (laterales y fondos)

| Nivel | Nombre | Fondo (casillas) | Aspecto |
|---|---|---|---|
| 1 | Talud | 3 | Terraplén de hierba con escalones de tierra, gente de pie |
| 2 | Bancos de madera | 4 | Tablones corridos sobre estructura de madera |
| 3 | Asientos | 5 | Gradas de hormigón con asientos del color del club |
| 4 | Tribuna cubierta | 7 | Un anillo de asientos y visera estrecha sobre las últimas filas |
| 5 | Grada de estadio | 10 | Dos anillos separados por un pasillo con vomitorios |
| 6 | Gran tribuna | 14 | Tres anillos, fila de palcos acristalados entre el segundo y el tercero |

La altura se finge, sin perspectiva: cada anillo es más claro que el de delante, lleva antepecho blanco y la cara del desnivel en sombra, y la sombra proyectada crece con el nivel. La visera se desvanece al pasar el ratón por encima.

Los niveles pueden mezclarse: tribuna principal en nivel 4 y fondos en nivel 1 es lo típico de un club modesto, y debe verse con encanto, no como algo roto.

### Esquinas (córners)
- Pieza propia en el menú ("Córner", junto a "Lateral / Fondo"), con los mismos 6 niveles a mitad de precio. El jugador la coloca y la mejora a mano.
- Necesita las dos gradas de los lados contiguos, y su nivel no puede pasar del de la más baja (la ficha dice cuál mejorar antes).
- Es un cuadrado de lado = fondo de su nivel pegado al vértice del campo; las filas son cuartos de arco a la misma distancia del campo que las de los lados, así que empalman. La punta exterior queda vacía: el estadio se ve redondeado.
- Aforo: cuenta como 0,65 casillas de largo por casilla de fondo. Con todo al máximo, un estadio de fútbol 11 llega a 98 560 (tope: 100 000).
- Con las cuatro esquinas, el estadio queda cerrado.

### Reglas visuales para que se lea como un estadio
- Las filas son siempre **paralelas a la línea del campo** y crecen hacia fuera.
- Las **cubiertas de lados y esquinas contiguos se unen** sin hueco cuando tienen nivel de cubierta: desde arriba se ve un anillo continuo de pizarra.
- Las **escaleras** se alinean entre niveles para que no parezcan pegotes.
- Los asientos usan los **colores del club** (teñidos, no fijos). Más adelante podrán formar franjas o iniciales.
- Las **torres de iluminación** se colocan en las esquinas cuando se desbloquean.
- En día de partido, la gente aparece como puntos de colores sobre las filas según la asistencia.

### Datos
- La grada es una entidad ligada al campo: `{ pitchId, slot, level }`. La posición y el tamaño se calculan a partir del campo y del nivel; no se guardan sueltos.
- El aforo depende de nivel y largo del lado.

## 2. Niveles de objetos

### Idea
Algunos objetos se mejoran en el sitio, con la misma huella. La calidad de una sala es la suma de la calidad de sus objetos y, en la Fase 4, alimentará las necesidades de los jugadores (un jugador de élite exige vestuario de lujo).

### Qué objetos tienen niveles
Solo los que afectan al bienestar o al rendimiento:
- **Vestuario:** taquillas, bancos, duchas, lavabos, váteres.
- **Gimnasio:** bancos de pesas, bicicletas.
- **Fisioterapia:** camillas.
- **Despachos:** mesas y sillas, solo si afecta a la gestión.

Sin niveles: decoración y utilidad (plantas, papeleras, farolas, fuentes, bancos del parque, máquinas expendedoras).

### Progresión visual (ejemplos)

| Objeto | Nivel 1 | Nivel 2 | Nivel 3 (lujo) |
|---|---|---|---|
| Taquilla | Metal gris, puerta con rejilla | Madera clara con balda y gancho | Madera oscura, franja del color del club, luz cálida |
| Banco | Tablón sobre patas | Banco con respaldo | Banco acolchado del color del club |
| Ducha | Plato con alcachofa | Con mampara de cristal | Ducha de lluvia con banco y suelo de piedra |

Cada nivel se distingue a zoom ×0,5 por material, color y silueta, no por detalles pequeños.

### Datos
- En `BuildingDef`, un campo opcional `tiers` con nombre, coste, calidad y requisito de desbloqueo de cada nivel.
- El pintor recibe `tier` como quinto parámetro.
- Mejorar es una acción del panel del objeto: cobra el coste y redibuja con una animación corta.
