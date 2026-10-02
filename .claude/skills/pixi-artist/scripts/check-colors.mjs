#!/usr/bin/env node
/**
 * Validador de colores del arte (skill pixi-artist).
 *
 * Busca colores escritos a mano (0xRRGGBB y #rrggbb) en src/render y
 * src/content y los compara con la paleta oficial (src/render/palette.ts).
 *
 *   node .claude/skills/pixi-artist/scripts/check-colors.mjs             → falla (exit 1) si hay colores NUEVOS fuera de paleta
 *   node .claude/skills/pixi-artist/scripts/check-colors.mjs --baseline  → guarda la deuda actual en colors-baseline.json
 *
 * La baseline registra los colores fuera de paleta que ya existían, para que
 * el validador solo se queje de los nuevos. Al pagar deuda, regenérala.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import console from 'node:console'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..', '..')
const BASELINE = join(HERE, 'colors-baseline.json')
const SCAN_DIRS = ['src/render', 'src/content']
const PALETTE_FILE = 'src/render/palette.ts'
const GUIDE_FILE = 'docs/GUIA-ESTILO.md'

const HEX = /(?:0x|#)([0-9a-fA-F]{6})\b/g
const norm = (hex) => `#${hex.toLowerCase()}`
const rel = (path) => relative(ROOT, path).replaceAll('\\', '/')

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (/\.(ts|vue)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) yield path
  }
}

function colorsIn(text) {
  return [...text.matchAll(HEX)].map((m) => norm(m[1]))
}

const palette = new Set(colorsIn(readFileSync(join(ROOT, PALETTE_FILE), 'utf8')))
const guide = new Set(colorsIn(readFileSync(join(ROOT, GUIDE_FILE), 'utf8')))

/** color → { count, files: Set } para los colores fuera de paleta */
const offPalette = new Map()
let total = 0
let inPalette = 0
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    if (rel(file) === PALETTE_FILE) continue
    for (const color of colorsIn(readFileSync(file, 'utf8'))) {
      total++
      if (palette.has(color)) {
        inPalette++
        continue
      }
      const entry = offPalette.get(color) ?? { count: 0, files: new Set() }
      entry.count++
      entry.files.add(rel(file))
      offPalette.set(color, entry)
    }
  }
}

const sorted = [...offPalette.entries()].sort((a, b) => b[1].count - a[1].count)
const offUses = sorted.reduce((sum, [, e]) => sum + e.count, 0)
const inGuideOnly = sorted.filter(([c]) => guide.has(c))

/** Resumen por archivo: cuántos usos fuera de paleta tiene cada uno. */
function byFile() {
  const files = new Map()
  for (const [, e] of sorted) for (const f of e.files) files.set(f, (files.get(f) ?? 0) + 1)
  return [...files.entries()].sort((a, b) => b[1] - a[1])
}

function printSummary() {
  console.log(`Colores escritos a mano en ${SCAN_DIRS.join(', ')}: ${total} usos`)
  console.log(`  · de la paleta (palette.ts): ${inPalette} usos`)
  console.log(`  · fuera de paleta: ${offUses} usos de ${sorted.length} colores distintos`)
  console.log(`    (${inGuideOnly.length} están en la guía pero no en palette.ts)`)
  console.log('\nColores distintos fuera de paleta por archivo:')
  for (const [file, n] of byFile()) console.log(`  ${String(n).padStart(3)}  ${file}`)
  console.log('\nLos 10 más usados:')
  for (const [color, e] of sorted.slice(0, 10)) {
    const tag = guide.has(color) ? ' (en la guía)' : ''
    console.log(`  ${color} ×${e.count}${tag}  ${[...e.files].join(', ')}`)
  }
}

if (process.argv.includes('--baseline')) {
  const data = {
    note: 'Deuda de colores fuera de paleta. Regenerar con --baseline al migrar colores a palette.ts.',
    colors: Object.fromEntries(sorted.map(([c, e]) => [c, [...e.files].sort()])),
  }
  writeFileSync(BASELINE, `${JSON.stringify(data, null, 2)}\n`)
  printSummary()
  console.log(`\nBaseline guardada: ${rel(BASELINE)} (${sorted.length} colores)`)
  process.exit(0)
}

const baseline = existsSync(BASELINE)
  ? new Set(Object.keys(JSON.parse(readFileSync(BASELINE, 'utf8')).colors))
  : new Set()
const fresh = sorted.filter(([c]) => !baseline.has(c))
if (fresh.length === 0) {
  console.log(`OK: 0 colores nuevos fuera de paleta (${sorted.length} en la deuda conocida).`)
  process.exit(0)
}
console.log(`ERROR: ${fresh.length} colores nuevos fuera de paleta:`)
for (const [color, e] of fresh) console.log(`  ${color} ×${e.count}  ${[...e.files].join(', ')}`)
console.log(
  '\nDalos de alta en docs/GUIA-ESTILO.md y src/render/palette.ts, o usa shade() de uno existente.',
)
process.exit(1)
