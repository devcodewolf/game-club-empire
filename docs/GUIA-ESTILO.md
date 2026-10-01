# Guía de estilo visual

## Ambiente
**Norte lluvioso.** Un pueblo verde y húmedo: césped intenso, piedra gris, tejados de pizarra, muros de piedra seca, robles y charcos. Acogedor, no triste: la luz cálida de las ventanas y los focos contrasta con el gris de la lluvia.

El clima es parte del juego: la lluvia embarra el campo y crea charcos que se ven, y el césped se gasta primero en las áreas y en el centro.

## Vista y escala
- Vista cenital pura, sin perspectiva.
- Casilla de 64×64 px. Una persona ocupa unos 12×8 px (cuerpo) con cabeza de unos 5 px.
- Los edificios muestran tejado; al pasar el ratón o con zoom cercano, el tejado se desvanece y se ve el interior.

## Reglas de dibujo
- **Contorno:** marrón muy oscuro `#2e2a26`, nunca negro puro. 1,5 px en edificios y campos, 1 px en objetos pequeños y personas.
- **Sombra:** forma plana desplazada 4 px abajo y 4 px a la derecha, en el tono oscuro del suelo sobre el que cae. Sin difuminado ni degradados.
- **Relleno:** colores planos. El volumen se sugiere con líneas internas (hileras de pizarra, juntas de piedra) y con un segundo tono, nunca con degradados.
- **Imperfección con encanto:** calvas de barro, piedras irregulares, charcos de distinto tamaño. Nada perfectamente simétrico salvo las líneas del campo.

## Paleta

| Uso | Colores |
|---|---|
| Césped | `#5f8f3e` base · `#6e9c45` campo · `#476e2c` sombra · `#557f37` variación |
| Barro y caminos | `#7a5a3a` · `#5e4329` profundo |
| Piedra | `#8f9496` · `#6d7275` oscura |
| Pizarra (tejados) | `#4a5560` · `#3b444d` hileras |
| Madera | `#8a5f3c` |
| Suelo interior | `#b9a68a` |
| Agua y charcos | `#7c98a8` · `#a9c2cf` reflejo · `#5f7d8d` borde |
| Árboles | `#3f6630` copa · `#4e7a3a` luz · `#2a4420` contorno |
| Cal y líneas | `#eef0ea` |
| Luz cálida | `#f2c46b` ventanas y focos |
| Lluvia | `#cfdde4` al 55 % de opacidad |
| Contorno | `#2e2a26` |

Los colores del club (camisetas, banderas, gradas) los elige el jugador y no forman parte de esta paleta base.

## Implementación
- La paleta vive en `src/render/palette.ts` y es la única fuente de colores para sprites y efectos.
- Los sprites se dibujan en SVG en `assets/src/` usando solo colores de esta paleta.
- Cualquier color nuevo se añade primero aquí y en `palette.ts`.
