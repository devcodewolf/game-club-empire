# Prison Architect: gestión, burocracia y economía

> Fiabilidad: **[wiki]** oficial. Ver también [pa-personal-y-necesidades.md](pa-personal-y-necesidades.md).

## 1. Dinero inicial y flujo diario [wiki: Quickstart, Sandbox_Mode, Reports]

| Concepto | Valor |
|---|---|
| Fondos iniciales | $30.000 |
| Obreros iniciales | 8 ($100/día cada uno) |
| Fondo federal | +$2.000/día (queda en **$840** tras el 30 % de impuesto de sociedades, según la guía) |
| Subvención por preso | +$150 por preso y día |
| Bonus por días sin incidentes | hasta $10.000 |
| Exportaciones y tienda | ingresos variables |
| Gastos | salarios, comida, programas, salarios de presos, impuestos (30 % → 15 % → 1 %) |
| Recursos iniciales (sandbox) | 100 ladrillos, 100 hormigón, 80 acero, 20 cables, 20 tuberías grandes, central, bomba y condensador |

Orden recomendado de construcción: electricidad y agua → oficinas → celdas de detención → cocina y comedor → duchas → patio → enfermería → perímetro → bloques de celdas. Primera tanda de presos a las 24 h (ajustable). Valla $3/casilla.

## 2. Burocracia: árbol de investigación [wiki: Bureaucracy]

Se desbloquea contratando al **Alcaide (Warden)**. Cada rama exige el cargo correspondiente y pagar dinero + esperar horas.

### Árbol principal
| Investigación | Coste | Tiempo | Desbloquea |
|---|---|---|---|
| Seguridad | $500 | 6 h | Jefe, medidor de peligro, despliegue |
| Psicología | $500 | 6 h | Psicólogo, informe de necesidades, terapias |
| Salud | $500 | 6 h | Doctor, enfermería, morgue |
| Educación | $2.000 | 12 h | Aula, programas de educación |
| Legal | $5.000 | 12 h | Abogado, subárbol legal |
| Mantenimiento | $500 | 6 h | Capataz, subárbol de mantenimiento |
| Finanzas | $500 | 6 h | Contable, informes de finanzas |
| Política carcelaria | $1.000 | 6 h | Informe de política, castigos |
| Microgestión | $1.000 | 6 h | Perfiles de despliegue, logística |

### Subárbol de Seguridad (requiere Jefe)
Vigilancia (CCTV) $2.000/6 h · Despliegue $1.000/6 h · Inteligencia $1.000/6 h · Patrullas $1.000/6 h · Perros $1.000/6 h · Acceso remoto $2.000/6 h · Armería $2.000/12 h · Tazers $1.000 + $400/ud. · Chalecos $1.000 + $100/ud. · Torres de guardia $5.000/18 h.

### Subárbol de Finanzas (requiere Contable)
| Investigación | Coste | Tiempo | Efecto |
|---|---|---|---|
| Alivio fiscal | $10.000 | 2 días | Impuestos al 15 % |
| Paraíso fiscal | $50.000 | 2 días | Impuestos al 1 % (requiere el anterior) |
| Préstamo bancario | $500 | 12 h | Sistema de préstamos |
| Subvención extra | $500 | 6 h | Tercera subvención simultánea |
| Ampliación de terreno | $1.000 | 12 h | Compra direccional de terreno |

### Legal y Mantenimiento
Celdas pequeñas $10.000/24 h · Castigos permanentes $5.000/24 h · Pena de muerte $10.000/24 h · Legal Prep $50.000/72 h · Defensa legal $50.000/3 h · Trabajo penitenciario $1.000/6 h · Limpieza $2.000/6 h · Jardinería $2.000/6 h.

Patrón de diseño: **coste + tiempo + prerequisito de personal**. Una pieza de personal contratado es la "llave" de cada rama.

## 3. Subvenciones (Grants) [wiki: Grants]

- Máximo **2 simultáneas**, 3 con la investigación "Extra Grant".
- Estructura: **adelanto** (se cobra al aceptar) + **bonus de finalización** (al completar todos los objetivos).
- Tipos: iniciales, bloqueadas (se abren al completar otras) y ocultas.
- Cancelar: se devuelve el adelanto + **10 % de multa**.

| Subvención | Adelanto | Final | Total |
|---|---|---|---|
| Basic Detention Centre (inicial) | $20.000 | $10.000 | $30.000 |
| Administration Centre | $5.000 | $5.000 | $10.000 |
| Health and Well Being | $10.000 | $10.000 | $20.000 |
| Reform through Education | $15.000 | $40.000 | $55.000 |
| Staff Well-being | $0 | $10.000 | $10.000 |
| Cell Block A (bloqueada) | $20.000 | $20.000 | $40.000 |
| Max-Sec Infrastructure | $20.000 | $20.000 | $40.000 |
| Prison Manufacturing Facility | $20.000 | $10.000 | $30.000 |
| Government Bailout (oculta, si caes en bancarrota) | $50.000 | $50.000 | $100.000 |
| Cell Block B a E (ocultas) | $10.000 | $20.000 | $30.000 |
| Short/Long-term Investment | -$5.000 | $16.000 | $11.000 |

Además hay otras (Visitation, Security Certification, Carpentry, Crackdown on Drugs, Tool Cleanup...) de $10.000 a $30.000.

### Préstamos
Requiere Contable y la investigación Bank Loan. Capacidad inicial $2.500; máximo $250.000. Interés pagado cada hora; pagar a tiempo sube la calificación crediticia; los impagos la hunden y bloquean nuevos préstamos. Hay que reembolsar manualmente.

## 4. Régimen (horario) [wiki: Regime]

Cuadrícula de 24 horas; se pinta cada hora con una actividad.

| Actividad | Efecto |
|---|---|
| Encierro (Lockup) | Presos en celdas; abusar sube "libertad" y supresión |
| Sueño | Recomendado ≥5 h (no duermen entre las 8:00 y 20:00) |
| Comer | Van al comedor; los cocineros preparan 4 h antes |
| Patio | Ejercicio al aire libre |
| Ducha | Higiene obligatoria |
| Tiempo libre | Hacen lo que quieren; reduce violencia al dispersar |
| Trabajo | Con o sin encierro para quien no trabaja |
| Programas | Citas psiquiátricas (DLC) |

El tiempo sin planificar provoca aburrimiento y destrozos. Los presos de pena de muerte ignoran el régimen.
Eventos de reivindicación: si el trabajo es ≥7 h piden menos; si duermen ≤6 h piden más; si el tiempo libre ≤2 h piden más.

## 5. Programas [wiki: Programs]

| Programa | Coste/sesión | Plazas x sesiones | Duración | Requisitos | Efecto |
|---|---|---|---|---|---|
| Terapia de alcohólicos | $200 | 20 x 10 | 2 h | Psicología, Psicólogo | Reforma |
| Tratamiento de adicción | $200 | 10 x 3 | 1 h | Salud, Doctor | Recuperación |
| Terapia conductual | $200 | 1 x 5 | 2 h | Psicología, Oficina | Menos violencia |
| Seguridad en taller | $100 | 10 x 2 | 2 h | Trabajo penitenciario | Habilita taller |
| Carpintería | $500 | 5 x 5 | 2 h | Seguridad completada | Habilidades |
| Educación básica | $300 | 20 x 5 | 3 h | Aula | Formación |
| GED (titulación) | $500 | 10 x 10 | 3 h | Básica completada | Titulación |
| Guía espiritual | $250 | 20 x 1 | 2 h | Capilla | Espiritualidad |
| Audiencia de libertad condicional | gratis | 1 x 1 | 4 h | Política | Opción de libertad |

Programas de personal: certificación de tazer ($100, obligatoria, 10 plazas, 1 h).

## 6. Informes, finanzas y valoración [wiki: Reports]

- 12 pestañas de informes (ver doc de interfaz).
- **Finanzas**: ingresos vs gastos por concepto (requiere Contable).
- **Valoración**: valor de la prisión; se puede vender hasta el 50 % de acciones (10 % del valor por cada 10 % de propiedad) o la prisión entera (requiere ≥20 presos, valor ≥$50.000 y sin muertes ni fugas en 24 h).
- Logro: vender la prisión con $1.000.000+ de beneficio.

## 7. Bancarrota y fallos
En sandbox se puede configurar la condición de fracaso (p. ej. demasiadas muertes o dinero negativo). La subvención "Government Bailout" ofrece $100.000 si hay flujo de caja positivo.

## 8. Adaptación a Grassroots

| Mecánica de PA | Grassroots | Fase |
|---|---|---|
| Fondo federal + subvención por preso | Subvención municipal base + cuota por socio y jugador | 2 |
| Impuesto sobre sociedades reducible | Cuota federativa/IVA reducibles con investigación | 5 |
| Subvenciones con adelanto + bonus | **Patrocinios**: adelanto al firmar, bonus al cumplir objetivos (p. ej. "tener 3 vestuarios", "ganar 5 partidos") con multa del 10 % por cancelar | 5 (o 2 versión simple) |
| Préstamos con interés horario | Préstamo del banco con interés semanal; calificación crediticia | Backlog |
| Burocracia/árbol de investigación | Junta directiva/federación: contratar cargo (director deportivo, tesorero) y pagar dinero + tiempo para desbloquear | 5 |
| Régimen (horario 24 h) | **Horario del club**: entrenamientos, descanso, comida, tiempo libre; con partidos fijos | 3 (Horario) |
| Programas | Cursos de formación para entrenadores y jugadores (táctica, fisioterapia) con plazas y coste | 4/5 |
| Informes con pestañas | Ya previsto (Finanzas, Valoración, Horario...) | 2-5 |
| Valoración/vender acciones | Valor del club y venta de participaciones (inversores) | Backlog |
| Bonus por días sin incidentes | Prima de convivencia/limpieza | 4 |

## Fuentes
- https://prisonarchitect.paradoxwikis.com/Quickstart_guide
- https://prisonarchitect.paradoxwikis.com/Sandbox_Mode
- https://prisonarchitect.paradoxwikis.com/Bureaucracy
- https://prisonarchitect.paradoxwikis.com/Grants
- https://prisonarchitect.paradoxwikis.com/Regime
- https://prisonarchitect.paradoxwikis.com/Programs
- https://prisonarchitect.paradoxwikis.com/Reports
- https://prisonarchitect.paradoxwikis.com/Events
- https://prisonarchitect.paradoxwikis.com/Achievements
