#!/usr/bin/env node
/**
 * Captura de pantalla de una URL con el navegador ya instalado (Edge o
 * Chrome), vía el protocolo de depuración. Sin dependencias: sustituye a
 * `npx playwright screenshot` en la skill pixi-artist.
 *
 *   node tools/capture.mjs <url> <salida.png> [--viewport=1400,900] [--wait=800] [--full]
 *
 * Espera a que la página marque `document.body.dataset.ready` (la galería lo
 * hace al terminar de dibujar) o, si no lo hace, el tiempo de --wait.
 * Con --full captura la página entera aunque sea más alta que la ventana.
 * Navegador: variable de entorno BROWSER o rutas habituales de Edge/Chrome.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import process from 'node:process'
import console from 'node:console'

const [url, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const flag = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback
const full = process.argv.includes('--full')
if (!url || !out) {
  console.error(
    'Uso: node tools/capture.mjs <url> <salida.png> [--viewport=1400,900] [--wait=800] [--full]',
  )
  process.exit(2)
}
const [width, height] = flag('viewport', '1400,900').split(',').map(Number)
const wait = Number(flag('wait', '800'))

const CANDIDATES = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const browserPath = CANDIDATES.find((p) => existsSync(p))
if (!browserPath) {
  console.error('No encuentro Edge ni Chrome. Indica la ruta con la variable BROWSER.')
  process.exit(2)
}

const port = 9300 + Math.floor(Math.random() * 500)
const profile = join(tmpdir(), `capture-${port}`)
const browser = spawn(
  browserPath,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--window-size=${width},${height}`,
    '--no-first-run',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

try {
  let targets
  for (let i = 0; i < 60 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    } catch {
      await sleep(250)
    }
  }
  const page = targets?.find((t) => t.type === 'page')
  if (!page) throw new Error('El navegador no ha arrancado')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve) => ws.addEventListener('open', resolve))
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data)
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg)
    if (msg.method === 'Runtime.exceptionThrown')
      console.error('Error en la página:', msg.params.exceptionDetails.exception?.description)
  })
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const n = ++id
      pending.set(n, resolve)
      ws.send(JSON.stringify({ id: n, method, params }))
    })

  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url })

  // Espera la marca de "listo" (máx. 15 s) y después el margen de --wait
  for (let i = 0; i < 60; i++) {
    const r = await send('Runtime.evaluate', {
      expression: 'document.body?.dataset.ready === "true"',
      returnByValue: true,
    })
    if (r.result?.result?.value) break
    await sleep(250)
  }
  await sleep(wait)

  let clip
  if (full) {
    const metrics = await send('Page.getLayoutMetrics')
    const size = metrics.result.cssContentSize ?? metrics.result.contentSize
    clip = { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 }
  }
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: full,
    ...(clip ? { clip } : {}),
  })
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
  console.log(`Captura guardada: ${out}`)
  ws.close()
} finally {
  browser.kill()
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
}
