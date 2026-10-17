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
2. **"Campo digno"**: contratar un jardinero + estado del campo ≥ 70 durante 2 semanas → 0 + 3.000 €.
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

---

## Propuestas de Claude

### Para que sea más entretenido
- **Peñas de aficionados** · Fase 3 · Propuesta: con suficiente afición nace una peña con nombre propio que pide cosas ("una grada cubierta para el fondo norte") y, si se las das, sube la afición y anima en los partidos (más fuerza en casa).
- **Rivalidad con el pueblo vecino** · Fase 3 · Propuesta: un rival fijo; el derbi llena el estadio y vale el doble de fama.
- **Eventos de temporada** · Fase 5 · Propuesta: fiestas del pueblo, concierto de verano o feria en el campo. Dan mucho dinero y fama, pero desgastan el césped (enlaza con el estado del campo).
- **Logros** · Fase 5 · Propuesta: "Rey del barro" (ascender con campo de tierra), "Cien socios", "Casa llena"… (ver `docs/referencias/README.md`).

### Para que sea más fácil y menos tedioso
- **Copiar un bloque** · Fase 2 o backlog · Propuesta: como el "Quick build" de PA. Con la herramienta de mover bloques ya hecha, copiar un vestuario entero y pegarlo en otro sitio (pagando lo que cuesta) es casi inmediato y ahorra mucho trabajo repetitivo.
- **Planificar en pausa** · Fase 2 o backlog · Propuesta: dibujar obras como plano (fantasma azul, sin coste) y confirmarlas todas a la vez cuando haya dinero.
- **El tablón avisa de lo que frena al club** · Fase 2, Bloque F · Propuesta: notas como "El vestuario no cuenta: le faltan 2 duchas" o "Nadie cuida el campo: contrata un jardinero", que llevan a la ficha al hacer clic.
- **Dificultad elegible** · Fase 3 · Propuesta: Fácil / Normal / Difícil como multiplicadores de ingresos, costes y paciencia de la afición (todo son datos de `content/`).
- **"¿Por qué pierdo dinero?"** · Fase 2, Bloque H · Propuesta: en Finanzas, una frase que señala el mayor gasto y el ingreso que más ha bajado.
