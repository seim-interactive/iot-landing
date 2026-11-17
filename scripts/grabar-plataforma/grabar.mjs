#!/usr/bin/env node
// Graba las piezas de la plataforma como video, cuadro por cuadro.
//
//   node scripts/grabar-plataforma/grabar.mjs --pieza mediciones
//   node scripts/grabar-plataforma/grabar.mjs --todas
//   opciones: --version escritorio|celular|ambas (ambas)  --url http://localhost:4813
//             --datos quietos|vivos (quietos)  --sin-codificar  --cuadros <carpeta>
//             --reusar (codifica los cuadros que ya están en --cuadros, sin grabar)
//
// Nada se graba en tiempo real. Cada pieza se abre sola en grabar.html, al tamaño
// de su caja, con el reloj de Playwright pausado: el grabador lo adelanta 1/60 s,
// pone las animaciones CSS en ese mismo instante (el reloj no las mueve), saca la
// captura y sigue. Así no hay cuadros perdidos ni saltos, y el video sale igual
// cada vez.
//
// El loop: el guion avisa cuándo empieza cada vuelta (window.__loopMark en
// platformDriver.js). Se graba exactamente una vuelta, de la 2 a la 3 (la 1 arranca
// ya encuadrada y no empalma), así que el último cuadro empalma con el primero.
//
// Salida en public/media/plataforma/: <pieza>[-celular].av1.mp4 (AV1 10 bits:
// Chrome, Firefox, Edge), .hevc.mp4 (HEVC Main10, hvc1: Safari), .h264.mp4 (último
// respaldo) y -poster.jpg. Ver README.md de esta carpeta.
import { chromium } from 'playwright-core'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(ROOT, 'public/media/plataforma')
const FPS = 60

// Tamaño de cada caja en la landing, en px de CSS: en escritorio (pantalla de
// 1440) y en el celular (390). Si cambia el diseño de una sección, se cambia acá.
const PIEZAS = {
  argus: { escritorio: [438, 403], celular: [340, 313] },
  alarmas: { escritorio: [438, 403], celular: [340, 313] },
  mediciones: { escritorio: [438, 403], celular: [340, 313] },
  activos: { escritorio: [438, 403], celular: [340, 313] },
  paradas: { escritorio: [438, 403], celular: [340, 313] },
  reporte: { escritorio: [438, 403], celular: [340, 313] },
}
// Piezas que no salen de la plataforma: una secuencia de cuadros ya renderizada,
// que se compone sobre negro (#000, el fondo de la landing) y se arma en loop:
// el movimiento, una pausa sobre el último cuadro y corte seco al primero.
const CONTENIDO = process.env.SEIM_CONTENIDO_REPO || path.resolve(ROOT, '../seim-global-landing')
const SECUENCIAS = {
  // Paso 1 de «Cómo funciona»: las fichas que se enchufan (Blender, plc.py →
  // renders/hub-web). Se renderizó a 30 fps; en el video de 60 cada cuadro va dos veces.
  conectar: {
    frames: path.join(CONTENIDO, 'promo/iot-idioma-blender/renders/hub-web/f_%04d.png'),
    size: [2160, 1920],
    fps: 30,
    // El encuadre del video anterior: a 1600 de ancho, 1600 × 1200 desde y = 44
    vf: 'scale=1600:-1:flags=lanczos,crop=1600:1200:0:44',
    hold: 1.2,
  },
}

const VERSIONES = {
  escritorio: { pantalla: 1440, dpr: 2, sufijo: '' },
  celular: { pantalla: 390, dpr: 3, sufijo: '-celular' },
}
// Una hora de trabajo cualquiera: lo que muestre la plataforma (horas, «hoy»)
// queda fijo en el video, así que mejor una que no llame la atención.
const START = new Date('2026-11-17T10:30:00-03:00')

function args() {
  const a = process.argv.slice(2)
  const get = (name, fallback) => {
    const i = a.indexOf(`--${name}`)
    return i >= 0 && a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : fallback
  }
  return {
    piezas: a.includes('--todas') ? [...Object.keys(PIEZAS), ...Object.keys(SECUENCIAS)] : [get('pieza', 'mediciones')],
    version: get('version', 'ambas'),
    url: get('url', 'http://localhost:4813'),
    datos: get('datos', 'quietos'),
    codificar: !a.includes('--sin-codificar'),
    cuadros: get('cuadros', null),
    reusar: a.includes('--reusar'),
  }
}

// En cada documento (la página y el iframe de la app): pone las animaciones y
// transiciones CSS en el instante del reloj. Cada una se toma como nacida en el
// primer cuadro en que aparece.
function animationSync() {
  const born = new WeakMap()
  window.__syncAnimations = (now) => {
    for (const anim of document.getAnimations()) {
      if (!born.has(anim)) born.set(anim, now)
      if (anim.playState !== 'paused') anim.pause()
      anim.currentTime = Math.max(0, now - born.get(anim))
    }
  }
}

// Datos quietos: la app deja de recibir datos nuevos y su fecha queda fija (Date).
// Los timers, requestAnimationFrame y performance.now siguen, así que las
// animaciones y la cámara se mueven, pero lo que depende de la hora (la ventana de
// «8 h» de un gráfico, «hace 0 s») no se corre. Se congela desde la vuelta 1: los
// widgets se redibujan solos cada tanto, y así, cuando arranca la vuelta grabada,
// ya están dibujados con esa hora; el primer cuadro y el último muestran lo mismo.
function freezeApp() {
  window.__demoPaused = true
  const RealDate = Date
  const frozen = RealDate.now()
  class FrozenDate extends RealDate {
    constructor(...a) {
      if (a.length === 0) super(frozen)
      else super(...a)
    }
    static now() {
      return frozen
    }
  }
  window.Date = FrozenDate
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function record({ key, version, url, datos, framesDir }) {
  const [w, h] = PIEZAS[key][version]
  const { pantalla, dpr } = VERSIONES[version]
  const browser = await chromium.launch({ channel: 'chrome' })
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: dpr,
    timezoneId: 'America/Argentina/Buenos_Aires',
    locale: 'es-AR',
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  })
  await context.clock.install({ time: START })
  await context.clock.pauseAt(new Date(START.getTime() + 1000))
  await context.addInitScript(animationSync)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.text().includes('[plataforma]') && errors.push(m.text()))
  await page.goto(`${url}/grabar.html?pieza=${key}&w=${w}&h=${h}&pantalla=${pantalla}`, { waitUntil: 'domcontentloaded' })

  const step = 1000 / FPS
  const marks = () => page.evaluate(() => window.__marks || [])
  const appFrame = () => page.frames().find((f) => f.url().includes('/plataforma/'))

  // Hasta que arranca la vuelta 2, el reloj corre más o menos a la par del real
  // (la app tiene que cargar sus archivos, que llegan en tiempo real) y sin capturas.
  const warmStart = Date.now()
  let lap2
  let frozen = false
  for (;;) {
    await context.clock.runFor(Math.round(step))
    const seen = await marks()
    if (!frozen && datos === 'quietos' && seen.length) {
      await appFrame()?.evaluate(freezeApp)
      frozen = true
    }
    lap2 = seen.find((m) => m.lap === 2)
    if (lap2) break
    if (Date.now() - warmStart > 180000) throw new Error(`«${key}» no llegó a la segunda vuelta del guion`)
    await sleep(6)
  }

  // Los cuadros caen en T2 + k/60 s, exactos (en ms enteros del reloj).
  const t2 = lap2.t
  let now = await page.evaluate(() => Date.now())
  await rm(framesDir, { recursive: true, force: true })
  await mkdir(framesDir, { recursive: true })
  const frames = []
  let k = 1
  const t0 = Date.now()
  for (;;) {
    const target = Math.round(t2 + k * step)
    if (target > now) await context.clock.runFor(target - now)
    now = await page.evaluate(() => Date.now())
    for (const f of page.frames()) await f.evaluate((t) => window.__syncAnimations?.(t), now).catch(() => {})
    const name = path.join(framesDir, `${String(k).padStart(5, '0')}.png`)
    await page.screenshot({ path: name, type: 'png', caret: 'initial', animations: 'allow' })
    frames.push({ k, t: now - t2 })
    const lap3 = (await marks()).find((m) => m.lap === 3)
    // El primer cuadro desde que arrancó la vuelta 3 es el «cuadro 0» de la vuelta
    // siguiente: va, así el salto del último al primero mide menos de un cuadro.
    if (lap3 && now >= lap3.t) {
      frames.lapLength = lap3.t - t2
      break
    }
    if (k > FPS * 120) throw new Error(`«${key}»: la vuelta dura más de 2 minutos`)
    k++
  }
  const clockCheck = await Promise.all(page.frames().map((f) => f.evaluate(() => Date.now()).catch(() => null)))
  await browser.close()
  return { frames, w, h, dpr, errors, recordMs: Date.now() - t0, warmMs: t0 - warmStart, clockCheck }
}

const sizeOf = async (f) => ((await stat(f)).size / 1024).toFixed(0) + ' KB'
const ff = (argv) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: ['ignore', 'pipe', 'pipe'] })

// PNG (sRGB) → YUV BT.709 de rango limitado, etiquetado, que es lo que los
// navegadores esperan; sin etiquetas, un video chico se interpreta como BT.601.
const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']
// 4:2:0 pide ancho y alto pares: si la caja por el DPR da impar, se suma 1 px negro.
const toYuv = (fmt) =>
  `pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:black,scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=${fmt}`

function encode(framesDir, base) {
  const input = ['-framerate', String(FPS), '-i', path.join(framesDir, '%05d.png')]
  const gop = ['-g', String(FPS * 4)]
  const outs = {
    av1: `${base}.av1.mp4`,
    hevc: `${base}.hevc.mp4`,
    h264: `${base}.h264.mp4`,
    poster: `${base}-poster.jpg`,
  }
  // AV1 10 bits: los degradés oscuros sin bandas
  ff([...input, '-vf', toYuv('yuv420p10le'), '-c:v', 'libsvtav1', '-preset', '3', '-crf', '18',
    '-svtav1-params', 'tune=0:enable-qm=1:qm-min=0', ...gop, ...COLOR, '-an', '-movflags', '+faststart', outs.av1])
  // HEVC Main10 con tag hvc1, que es lo que Safari reproduce
  ff([...input, '-vf', toYuv('yuv420p10le'), '-c:v', 'libx265', '-preset', 'slow', '-crf', '14', '-profile:v', 'main10',
    '-x265-params', `aq-mode=3:keyint=${FPS * 4}:log-level=error`, '-tag:v', 'hvc1', ...COLOR, '-an', '-movflags', '+faststart', outs.hevc])
  // H.264 de 8 bits: solo si el navegador no tiene ninguno de los anteriores
  ff([...input, '-vf', toYuv('yuv420p'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high',
    '-x264-params', 'aq-mode=3', ...gop, ...COLOR, '-an', '-movflags', '+faststart', outs.h264])
  ff(['-i', path.join(framesDir, '00001.png'), '-q:v', '2', outs.poster])
  return outs
}

// Calidad medida contra los cuadros originales: SSIM y PSNR sobre la misma
// conversión a YUV, y VMAF (libvmaf, si el ffmpeg la tiene).
function quality(framesPattern, video, fmt) {
  const graph = (metric) => `[0:v]${toYuv(fmt)}[r];[1:v]format=${fmt}[d];[d][r]${metric}`
  const log = (metric) =>
    spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-framerate', String(FPS), '-i', framesPattern, '-i', video, '-lavfi', graph(metric), '-f', 'null', '-'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }).stderr
  return {
    ssim: log('ssim').match(/All:([\d.]+)/)?.[1] ?? null,
    psnr: log('psnr').match(/average:([\d.inf]+)/)?.[1] ?? null,
    vmaf: log('libvmaf=n_threads=8').match(/VMAF score: ([\d.]+)/)?.[1] ?? null,
  }
}

async function buildSequence(key, framesDir) {
  const seq = SECUENCIAS[key]
  await rm(framesDir, { recursive: true, force: true })
  await mkdir(framesDir, { recursive: true })
  const [w, h] = seq.size
  ff([
    '-framerate', String(seq.fps), '-i', seq.frames,
    '-filter_complex',
    `color=black:s=${w}x${h}:r=${seq.fps}[bg];[bg][0:v]overlay=format=auto:shortest=1,${seq.vf},` +
      `tpad=stop_mode=clone:stop_duration=${seq.hold},fps=${FPS}`,
    '-start_number', '1', path.join(framesDir, '%05d.png'),
  ])
  return (await readdir(framesDir)).filter((f) => f.endsWith('.png')).length
}

const opts = args()
await mkdir(OUT, { recursive: true })
const report = []
for (const key of opts.piezas) {
  if (SECUENCIAS[key]) {
    const framesDir = path.join(opts.cuadros || path.join(os.tmpdir(), 'grabar-plataforma'), key)
    const n = opts.reusar ? (await readdir(framesDir)).filter((f) => f.endsWith('.png')).length : await buildSequence(key, framesDir)
    console.log(`▸ ${key}: ${n} cuadros (${(n / FPS).toFixed(2)} s de loop)`)
    const entry = { key, frames: n, framesDir }
    if (opts.codificar) {
      const outs = encode(framesDir, path.join(OUT, key))
      for (const [fmt, file] of Object.entries(outs)) {
        if (fmt === 'poster') {
          entry.poster = { file, size: await sizeOf(file) }
          continue
        }
        const q = quality(path.join(framesDir, '%05d.png'), file, fmt === 'h264' ? 'yuv420p' : 'yuv420p10le')
        entry[fmt] = { file, size: await sizeOf(file), ...q }
        console.log(`  ${fmt.padEnd(5)} ${entry[fmt].size.padStart(8)}  SSIM ${q.ssim}  PSNR ${q.psnr} dB  VMAF ${q.vmaf ?? '—'}`)
      }
      console.log(`  portada ${entry.poster.size}`)
    }
    report.push(entry)
    continue
  }
  if (!PIEZAS[key]) throw new Error(`No hay tamaño de caja para «${key}» en PIEZAS`)
  const versions = opts.version === 'ambas' ? Object.keys(VERSIONES) : [opts.version]
  for (const version of versions) {
    const framesDir = opts.cuadros ? path.join(opts.cuadros, `${key}-${version}`) : path.join(os.tmpdir(), 'grabar-plataforma', `${key}-${version}`)
    let n
    const [cw, ch] = PIEZAS[key][version]
    if (opts.reusar) {
      n = (await readdir(framesDir)).filter((f) => f.endsWith('.png')).length
      console.log(`▸ ${key} (${version}): ${n} cuadros ya grabados en ${framesDir}`)
    } else {
      console.log(`▸ ${key} (${version}): grabando…`)
      const rec = await record({ key, version, url: opts.url, datos: opts.datos, framesDir })
      n = rec.frames.length
      console.log(`  ${n} cuadros (${(n / FPS).toFixed(2)} s de video, vuelta de ${(rec.frames.lapLength / 1000).toFixed(3)} s) en ${(rec.recordMs / 1000).toFixed(0)} s; arranque ${(rec.warmMs / 1000).toFixed(0)} s`)
      console.log(`  relojes (página, iframe): ${rec.clockCheck.join(', ')}`)
      if (rec.errors.length) console.log('  avisos de la página:', [...new Set(rec.errors)].join(' | '))
    }
    const dpr = VERSIONES[version].dpr
    const entry = { key, version, frames: n, w: cw * dpr, h: ch * dpr, framesDir }
    if (opts.codificar) {
      const base = path.join(OUT, key + VERSIONES[version].sufijo)
      const outs = encode(framesDir, base)
      for (const [fmt, file] of Object.entries(outs)) {
        if (fmt === 'poster') {
          entry.poster = { file, size: await sizeOf(file) }
          continue
        }
        const q = quality(path.join(framesDir, '%05d.png'), file, fmt === 'h264' ? 'yuv420p' : 'yuv420p10le')
        entry[fmt] = { file, size: await sizeOf(file), ...q }
        console.log(`  ${fmt.padEnd(5)} ${entry[fmt].size.padStart(8)}  SSIM ${q.ssim}  PSNR ${q.psnr} dB  VMAF ${q.vmaf ?? '—'}`)
      }
      console.log(`  portada ${entry.poster.size}`)
    }
    report.push(entry)
  }
}
await writeFile(path.join(OUT, 'grabacion.json'), JSON.stringify(report, null, 2))
