// Conduce el juego en Edge/Chrome sin ventana con una lista de pasos y saca capturas.
// Sirve para probar herramientas interactivas (clics, arrastres, teclas) sin intervención.
//
// Uso:
//   node tools/drive.mjs <url> '<json de pasos>' [--out=carpeta]
// Pasos (se ejecutan en orden):
//   {"click":[x,y]}               clic izquierdo ({"button":"right"} para el derecho)
//   {"drag":[x1,y1,x2,y2]}        arrastre (derecho por defecto: mueve la cámara; {"button":"left"} para herramientas)
//   {"move":[x,y]}                mover el ratón
//   {"key":"Escape"}              tecla (" " para espacio, "r", "1"…)
//   {"wait":ms}                   esperar
//   {"shot":"archivo.png"}        captura de la ventana (1400×900)
// Los avisos y errores de la consola del juego se imprimen por la salida.
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import console from 'node:console'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
]
const args = process.argv.slice(2)
const [url, stepsJson] = args.filter((a) => !a.startsWith('--'))
if (!url || !stepsJson) {
  console.error("Uso: node tools/drive.mjs <url> '<json de pasos>' [--out=carpeta]")
  process.exit(1)
}
const out = args.find((a) => a.startsWith('--out='))?.slice(6) ?? '.'
const steps = JSON.parse(stepsJson)
const browser = BROWSERS.find((path) => existsSync(path))
if (!browser) throw new Error('No encuentro Edge ni Chrome')

const port = 9300 + Math.floor(Math.random() * 500)
const proc = spawn(browser, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'drive-'))}`,
  '--window-size=1400,900',
  'about:blank',
])

let ws
for (let i = 0; i < 50 && !ws; i++) {
  await sleep(200)
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    const page = list.find((t) => t.type === 'page')
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl)
  } catch {
    // el navegador aún no escucha
  }
}
await new Promise((r) => ws.addEventListener('open', r))

let id = 0
const pending = new Map()
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result)
    pending.delete(msg.id)
  }
  if (msg.method === 'Runtime.consoleAPICalled' && ['warning', 'error'].includes(msg.params.type)) {
    const text = msg.params.args.map((a) => a.value ?? a.description).join(' ')
    console.log(`[consola ${msg.params.type}]`, text)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    console.log('[excepción]', msg.params.exceptionDetails.exception?.description)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id
    pending.set(n, resolve)
    ws.send(JSON.stringify({ id: n, method, params }))
  })
const mouse = (type, x, y, button = 'none', buttons = 0) =>
  send('Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button,
    buttons,
    clickCount: 1,
    pointerType: 'mouse',
  })
const maskOf = (button) => (button === 'right' ? 2 : 1)

await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 1400,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})
await send('Page.navigate', { url })
await sleep(3000)

for (const step of steps) {
  if (step.wait) await sleep(step.wait)
  if (step.move) await mouse('mouseMoved', ...step.move)
  if (step.click) {
    const [x, y] = step.click
    const button = step.button ?? 'left'
    await mouse('mouseMoved', x, y)
    await mouse('mousePressed', x, y, button, maskOf(button))
    await mouse('mouseReleased', x, y, button, 0)
    await sleep(300)
  }
  if (step.drag) {
    const [x1, y1, x2, y2] = step.drag
    const button = step.button ?? 'right'
    await mouse('mouseMoved', x1, y1)
    await mouse('mousePressed', x1, y1, button, maskOf(button))
    for (let i = 1; i <= 10; i++) {
      await mouse(
        'mouseMoved',
        x1 + ((x2 - x1) * i) / 10,
        y1 + ((y2 - y1) * i) / 10,
        button,
        maskOf(button),
      )
      await sleep(30)
    }
    await sleep(400)
    await mouse('mouseReleased', x2, y2, button, 0)
    await sleep(1500)
  }
  if (step.key) {
    const key = step.key
    const code = key === 'Escape' ? 'Escape' : key === ' ' ? 'Space' : `Key${key.toUpperCase()}`
    const vk = key === 'Escape' ? 27 : key === ' ' ? 32 : key.toUpperCase().charCodeAt(0)
    const digit = /^\d$/.test(key) ? `Digit${key}` : code
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code: digit,
      windowsVirtualKeyCode: vk,
    })
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: digit,
      windowsVirtualKeyCode: vk,
    })
    await sleep(300)
  }
  if (step.shot) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(out, step.shot), Buffer.from(data, 'base64'))
    console.log('captura', join(out, step.shot))
  }
}
proc.kill()
process.exit(0)
