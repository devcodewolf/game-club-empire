// Generador de la hoja de muestra de estilo (borrador).
// Uso: node tools/muestras/muestra-estilo.mjs assets/src/muestras/muestra-estilo.svg
// Colores SOLO de docs/GUIA-ESTILO.md, salvo pieles/pelo/club (marcados como propuesta).
import console from 'node:console'
import { writeFileSync } from 'node:fs'
import process from 'node:process'

const OUT = process.argv[2]
const T = 64
const W = 18 * T
const H = 12 * T

const C = {
  grass: '#5f8f3e',
  pitch: '#6e9c45',
  grassShadow: '#476e2c',
  grassVar: '#557f37',
  mud: '#7a5a3a',
  mudDeep: '#5e4329',
  stone: '#8f9496',
  stoneDark: '#6d7275',
  slate: '#4a5560',
  slateRows: '#3b444d',
  wood: '#8a5f3c',
  floor: '#b9a68a',
  water: '#7c98a8',
  waterShine: '#a9c2cf',
  waterEdge: '#5f7d8d',
  tree: '#3f6630',
  treeLight: '#4e7a3a',
  treeLine: '#2a4420',
  chalk: '#eef0ea',
  warm: '#f2c46b',
  line: '#2e2a26',
}
// Propuesta (no están en la guía todavía)
const SKIN = ['#e3b896', '#c08a63', '#8a5a3c']
const HAIR = ['#3b2a1f', '#c99a4a', '#1f1a17', '#9a9a96']
const CLUB = { home: '#8c2f39', away: '#3f6fa8', keeper: '#e0bf3a', coach: '#2f3b4c' }

// PRNG determinista (mulberry32)
let seed = 7
const rnd = () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const r = (a, b) => a + rnd() * (b - a)
const f = (n) => Math.round(n * 10) / 10

/** Mancha irregular cerrada alrededor de (cx, cy). */
function blob(cx, cy, rx, ry, points = 9, jitter = 0.28) {
  const pts = []
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    const k = 1 + r(-jitter, jitter)
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k])
  }
  // curva suave por puntos medios
  let d = ''
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i],
      n = pts[(i + 1) % pts.length]
    const m = [(p[0] + n[0]) / 2, (p[1] + n[1]) / 2]
    d += i === 0 ? `M${f(m[0])} ${f(m[1])}` : ''
    d += ` Q${f(n[0])} ${f(n[1])} ${f((n[0] + pts[(i + 2) % pts.length][0]) / 2)} ${f((n[1] + pts[(i + 2) % pts.length][1]) / 2)}`
  }
  return d + 'Z'
}

const parts = []
const add = (s) => parts.push(s)

// ── Defs: sombra plana y figurita ───────────────────────────────
add(`<defs>
  <filter id="sombra" x="-20%" y="-20%" width="150%" height="150%">
    <feFlood flood-color="${C.grassShadow}"/><feComposite in2="SourceAlpha" operator="in"/>
    <feOffset dx="4" dy="4" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="sombraP" x="-30%" y="-30%" width="170%" height="170%">
    <feFlood flood-color="${C.grassShadow}"/><feComposite in2="SourceAlpha" operator="in"/>
    <feOffset dx="2" dy="2" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <pattern id="red" width="6" height="6" patternUnits="userSpaceOnUse">
    <path d="M0 0H6M0 0V6" stroke="${C.chalk}" stroke-width="1" opacity=".75"/>
  </pattern>
  <!-- Figurita cenital: cuerpo en campana + cabeza. Colores por variables CSS. -->
  <symbol id="persona" viewBox="0 0 40 40" overflow="visible">
    <path d="M6 30Q6 17 20 17Q34 17 34 30Q34 35 29 35H11Q6 35 6 30Z" fill="var(--shirt)" stroke="${C.line}" stroke-width="1"/>
    <path d="M14 22Q20 26 26 22" fill="none" stroke="var(--trim)" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="20" cy="17.5" r="8.5" fill="var(--skin)" stroke="${C.line}" stroke-width="1"/>
    <path d="M11.6 16.4A8.5 8.5 0 0 1 28.4 16.4Q24.5 12.6 20 13.4Q15.5 12.6 11.6 16.4Z" fill="var(--hair)" stroke="${C.line}" stroke-width=".8"/>
    <circle cx="17" cy="19.6" r="1.1" fill="${C.line}"/><circle cx="23" cy="19.6" r="1.1" fill="${C.line}"/>
  </symbol>
</defs>`)

// ── Fondo de hierba con variaciones ─────────────────────────────
add(`<rect width="${W}" height="${H}" fill="${C.grass}"/>`)
for (let i = 0; i < 55; i++) {
  add(`<path d="${blob(r(0, W), r(0, H), r(6, 18), r(3, 7), 8, 0.4)}" fill="${C.grassVar}"/>`)
}

// ── Campo (esquina de un área) ─────────────────────────────────
const P = { x: 512, y: 384, w: 576, h: 320 }
for (let i = 0; i < P.w / T; i++) {
  add(
    `<rect x="${P.x + i * T}" y="${P.y}" width="${T}" height="${P.h}" fill="${i % 2 ? C.grass : C.pitch}"/>`,
  )
}
// Desgaste en el área chica y en el punto de penalti
for (const [cx, cy, rx, ry] of [
  [1006, 560, 34, 40],
  [944, 556, 18, 14],
  [985, 520, 14, 10],
]) {
  add(`<path d="${blob(cx, cy, rx, ry, 10, 0.32)}" fill="${C.mud}"/>`)
  add(`<path d="${blob(cx + 3, cy + 2, rx * 0.5, ry * 0.5, 8, 0.3)}" fill="${C.mudDeep}"/>`)
}
// Charco en el área
add(
  `<path d="${blob(1012, 600, 16, 9, 9, 0.2)}" fill="${C.water}" stroke="${C.waterEdge}" stroke-width="1"/>`,
)
add(
  `<path d="M1004 597q5 -3 10 -1" stroke="${C.waterShine}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
)
// Líneas de cal
const chalk = `fill="none" stroke="${C.chalk}" stroke-width="3"`
add(`<path d="M${P.x} 416H1040V${P.y + P.h}" ${chalk}/>`)
add(`<rect x="880" y="456" width="160" height="208" ${chalk}/>`)
add(`<rect x="992" y="512" width="48" height="96" ${chalk}/>`)
add(`<circle cx="944" cy="560" r="3" fill="${C.chalk}"/>`)
add(`<path d="M880 512A80 80 0 0 0 880 608" ${chalk}/>`)
add(`<path d="M1024 416A16 16 0 0 0 1040 432" ${chalk}/>`)
// Portería: red + palos
add(`<g filter="url(#sombra)">
  <path d="M1040 528H1072V592H1040" fill="url(#red)" stroke="${C.stone}" stroke-width="2"/>
  <path d="M1040 528V592" stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>
  <path d="M1040 528V592" stroke="${C.chalk}" stroke-width="4" stroke-linecap="round"/>
</g>`)
// Banderín de córner
add(`<g filter="url(#sombraP)"><path d="M1040 416l14 -6l-14 -6z" fill="${CLUB.home}" stroke="${C.line}" stroke-width="1"/>
  <circle cx="1040" cy="416" r="2.5" fill="${C.chalk}" stroke="${C.line}" stroke-width="1"/></g>`)

// ── Figuritas ───────────────────────────────────────────────────
function person(x, y, size, v) {
  const style = `--shirt:${v.shirt};--trim:${v.trim};--skin:${v.skin};--hair:${v.hair}`
  return `<use href="#persona" x="${f(x - size / 2)}" y="${f(y - size / 2)}" width="${size}" height="${size}" style="${style}" filter="url(#sombraP)"/>`
}
const V = {
  home: { shirt: CLUB.home, trim: C.chalk, skin: SKIN[0], hair: HAIR[0] },
  home2: { shirt: CLUB.home, trim: C.chalk, skin: SKIN[2], hair: HAIR[2] },
  away: { shirt: CLUB.away, trim: C.chalk, skin: SKIN[1], hair: HAIR[1] },
  keeper: { shirt: CLUB.keeper, trim: C.line, skin: SKIN[0], hair: HAIR[1] },
  coach: { shirt: CLUB.coach, trim: C.chalk, skin: SKIN[1], hair: HAIR[3] },
  fan: { shirt: C.stoneDark, trim: CLUB.home, skin: SKIN[2], hair: HAIR[0] },
}
const PA = 40 // escala tipo Prison Architect (px)
const GUIA = 17 // escala de la guía actual (cuerpo ≈ 12 px)

// En el campo
add(person(1012, 560, PA, V.keeper))
add(person(905, 505, PA, V.home))
add(person(965, 625, PA, V.away))
add(person(860, 600, PA, V.home2))
add(`<g filter="url(#sombraP)"><circle cx="932" cy="586" r="6" fill="${C.chalk}" stroke="${C.line}" stroke-width="1"/>
  <path d="M932 583l2.6 1.9-1 3h-3.2l-1-3z" fill="${C.line}"/></g>`)

// Banquillo junto a la banda
add(`<g filter="url(#sombra)">
  <rect x="624" y="380" width="224" height="8" rx="2" fill="${C.mudDeep}" stroke="${C.line}" stroke-width="1.5"/>
  <rect x="624" y="388" width="224" height="16" rx="2" fill="${C.wood}" stroke="${C.line}" stroke-width="1.5"/>
  <path d="M624 396H848" stroke="${C.mudDeep}" stroke-width="1"/>
</g>`)
add(person(668, 394, PA, V.home2))
add(person(712, 394, PA, V.home))
add(person(800, 398, PA, V.coach))
add(`<g filter="url(#sombraP)"><rect x="808" y="402" width="11" height="14" rx="1.5" fill="${C.chalk}" stroke="${C.line}" stroke-width="1" transform="rotate(14 813 409)"/>
  <rect x="811" y="400" width="5" height="3" fill="${C.wood}" transform="rotate(14 813 409)"/></g>`)

// ── Vestuario: tejado de pizarra ───────────────────────────────
function roof(x, y, w, h) {
  const out = [
    `<g filter="url(#sombra)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${C.slate}" stroke="${C.line}" stroke-width="1.5"/>`,
  ]
  for (let yy = y + 12; yy < y + h - 4; yy += 12) {
    out.push(`<path d="M${x + 2} ${yy}H${x + w - 2}" stroke="${C.slateRows}" stroke-width="1.5"/>`)
    for (let xx = x + r(6, 20); xx < x + w - 6; xx += r(14, 26)) {
      out.push(`<path d="M${f(xx)} ${yy - 12}V${yy}" stroke="${C.slateRows}" stroke-width="1"/>`)
    }
  }
  // Cumbrera y chimenea de piedra
  out.push(
    `<rect x="${x}" y="${y + h / 2 - 5}" width="${w}" height="10" fill="${C.stoneDark}" stroke="${C.line}" stroke-width="1.5"/>`,
  )
  out.push(
    `<rect x="${x + w - 58}" y="${y + 22}" width="22" height="22" fill="${C.stone}" stroke="${C.line}" stroke-width="1.5"/>`,
  )
  out.push(`<rect x="${x + w - 52}" y="${y + 28}" width="10" height="10" fill="${C.line}"/>`)
  out.push('</g>')
  return out.join('')
}
add(roof(64, 64, 256, 192))

// ── Vestuario: interior (tejado desvanecido) ───────────────────
function interior(x, y, w, h) {
  const wall = 10
  const out = [`<g filter="url(#sombra)">`]
  // muro de piedra
  out.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.stone}" stroke="${C.line}" stroke-width="1.5"/>`,
  )
  out.push(
    `<rect x="${x + wall}" y="${y + wall}" width="${w - wall * 2}" height="${h - wall * 2}" fill="${C.floor}" stroke="${C.line}" stroke-width="1.5"/>`,
  )
  out.push('</g>')
  // juntas del suelo
  for (let xx = x + wall + 24; xx < x + w - wall; xx += 24)
    out.push(
      `<path d="M${xx} ${y + wall}V${y + h - wall}" stroke="${C.line}" stroke-opacity=".12"/>`,
    )
  for (let yy = y + wall + 24; yy < y + h - wall; yy += 24)
    out.push(
      `<path d="M${x + wall} ${yy}H${x + w - wall}" stroke="${C.line}" stroke-opacity=".12"/>`,
    )
  // puerta (hueco abajo) y ventana con luz cálida (izquierda)
  out.push(
    `<rect x="${x + 100}" y="${y + h - wall - 1}" width="40" height="${wall + 2}" fill="${C.floor}"/>`,
  )
  out.push(
    `<path d="M${x + 100} ${y + h - wall}A40 40 0 0 1 ${x + 140} ${y + h - wall - 40}" fill="none" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 3"/>`,
  )
  out.push(
    `<rect x="${x + 100}" y="${y + h - wall - 40}" width="5" height="40" fill="${C.wood}" stroke="${C.line}" stroke-width="1"/>`,
  )
  out.push(
    `<rect x="${x - 1}" y="${y + 60}" width="${wall + 2}" height="36" fill="${C.warm}" stroke="${C.line}" stroke-width="1"/>`,
  )
  // taquillas
  for (let i = 0; i < 7; i++) {
    const lx = x + wall + 6 + i * 30
    out.push(
      `<rect x="${lx}" y="${y + wall}" width="28" height="22" fill="${C.stoneDark}" stroke="${C.line}" stroke-width="1"/>`,
    )
    out.push(`<rect x="${lx + 20}" y="${y + wall + 12}" width="4" height="2" fill="${C.chalk}"/>`)
  }
  // banco central
  out.push(
    `<rect x="${x + 48}" y="${y + 92}" width="160" height="18" rx="2" fill="${C.wood}" stroke="${C.line}" stroke-width="1"/>`,
  )
  out.push(`<path d="M${x + 48} ${y + 101}H${x + 208}" stroke="${C.mudDeep}" stroke-width="1"/>`)
  // ducha con charquito
  out.push(
    `<rect x="${x + w - wall - 54}" y="${y + h - wall - 54}" width="54" height="54" fill="${C.waterShine}" stroke="${C.line}" stroke-width="1"/>`,
  )
  out.push(
    `<path d="${blob(x + w - wall - 27, y + h - wall - 27, 14, 10, 8, 0.25)}" fill="${C.water}"/>`,
  )
  out.push(
    `<circle cx="${x + w - wall - 10}" cy="${y + h - wall - 44}" r="4" fill="${C.stone}" stroke="${C.line}" stroke-width="1"/>`,
  )
  return out.join('')
}
add(interior(384, 64, 256, 192))
add(person(470, 168, PA, V.home))
add(person(540, 172, PA, V.away))

// ── Robles ──────────────────────────────────────────────────────
function oak(cx, cy, size) {
  const circles = [
    [0, 0, 1],
    [-0.55, -0.25, 0.68],
    [0.5, -0.35, 0.7],
    [0.35, 0.5, 0.72],
    [-0.45, 0.45, 0.65],
  ].map(([dx, dy, k]) => [cx + dx * size, cy + dy * size, k * size * r(0.92, 1.08)])
  const outline = circles
    .map(
      ([x, y, rr]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr + 1.5)}" fill="${C.treeLine}"/>`,
    )
    .join('')
  const fill = circles
    .map(([x, y, rr]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${C.tree}"/>`)
    .join('')
  const light = circles
    .slice(0, 3)
    .map(
      ([x, y, rr]) =>
        `<path d="${blob(x - rr * 0.32, y - rr * 0.36, rr * 0.5, rr * 0.34, 9, 0.3)}" fill="${C.treeLight}"/>`,
    )
    .join('')
  return `<g filter="url(#sombra)">${outline}${fill}${light}</g>`
}
add(oak(770, 140, 46))
add(oak(905, 110, 32))
add(oak(1030, 205, 38))

// Charco y camino de barro
add(`<path d="${blob(176, 300, 90, 16, 12, 0.18)}" fill="${C.mud}"/>`)
add(
  `<path d="${blob(205, 302, 18, 7, 9, 0.22)}" fill="${C.water}" stroke="${C.waterEdge}" stroke-width="1"/>`,
)
add(
  `<path d="${blob(690, 300, 26, 13, 10, 0.25)}" fill="${C.water}" stroke="${C.waterEdge}" stroke-width="1"/>`,
)
add(
  `<path d="M678 296q8 -4 16 -1" stroke="${C.waterShine}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
)

// ── Muro de piedra seca ─────────────────────────────────────────
{
  const out = [`<g filter="url(#sombra)">`]
  for (let row = 0; row < 2; row++) {
    let x = 64 + (row ? r(4, 12) : 0)
    while (x < 1100) {
      const w = r(12, 24)
      const y = 330 + row * 11 + r(-1, 1)
      out.push(
        `<rect x="${f(x)}" y="${f(y)}" width="${f(Math.min(w, 1104 - x))}" height="${f(r(9, 12))}" rx="${f(r(2, 4))}" fill="${rnd() < 0.35 ? C.stoneDark : C.stone}" stroke="${C.line}" stroke-width="1"/>`,
      )
      x += w + r(0, 2)
    }
  }
  out.push('</g>')
  add(out.join(''))
}

// ── Comparativa de escalas ─────────────────────────────────────
add(
  `<rect x="48" y="400" width="432" height="320" rx="6" fill="${C.chalk}" stroke="${C.line}" stroke-width="1.5"/>`,
)
const label = (x, y, txt, size = 14, weight = 700) =>
  `<text x="${x}" y="${y}" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" fill="${C.line}">${txt}</text>`
add(label(64, 428, 'Escala de personas (1 casilla = 64 px)', 16))
const row = (y, size, title) => {
  add(label(64, y - 10, title, 13, 400))
  const vs = [V.home, V.away, V.keeper, V.coach, V.fan, V.home2]
  vs.forEach((v, i) => {
    const x = 64 + i * 66
    add(
      `<rect x="${x}" y="${y}" width="64" height="64" fill="${C.grass}" stroke="${C.grassShadow}" stroke-width="1"/>`,
    )
    add(person(x + 32, y + 32, size, v))
  })
}
row(470, PA, 'A · tipo Prison Architect (~40 px de ancho)')
row(590, GUIA, 'B · guía actual (cuerpo ≈ 12×8 px)')
add(label(64, 690, 'Local · Visitante · Portero · Míster · Aficionado · Local', 12, 400))
add(label(64, 708, 'Pieles, pelo y colores del club: PROPUESTA (no están en la guía)', 12, 400))

// Rótulos
const tag = (x, y, txt) =>
  add(
    `<g><rect x="${x}" y="${y}" width="${txt.length * 7.4 + 16}" height="22" rx="4" fill="${C.chalk}" stroke="${C.line}" stroke-width="1"/>${label(x + 8, y + 16, txt, 13, 700)}</g>`,
  )
tag(64, 30, 'Vestuario · tejado de pizarra')
tag(384, 30, 'Vestuario · interior (tejado desvanecido)')
tag(720, 30, 'Robles')
tag(560, 712, 'Área: desgaste, charco, cal, portería y banquillo')
tag(720, 260, 'Charco · muro de piedra seca')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<!-- Grassroots · hoja de muestra de estilo (BORRADOR). Generada por script; arte propio del proyecto. -->
${parts.join('\n')}
</svg>
`
writeFileSync(OUT, svg)
console.log('ok', OUT, Math.round(svg.length / 1024) + ' KB')
