#!/usr/bin/env node
// Graba las piezas de la plataforma como video, cuadro por cuadro.
//
//   node scripts/grabar-plataforma/grabar.mjs --pieza mediciones
//   node scripts/grabar-plataforma/grabar.mjs --todas
//   opciones: --version escritorio|celular|ambas (ambas)  --url http://localhost:4813
//             --datos vivos|quietos (vivos)  --sin-codificar  --cuadros <carpeta>
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
// respaldo) y -poster.webp. La landing lee src/components/platformVideos.json (tamaño,
// duración y marcas de cada video). Ver README.md de esta carpeta.
import { chromium } from 'playwright-core'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(ROOT, 'public/media/plataforma')
// El detalle de cada grabación (calidad medida, cuadros, marcas). Va al repo pero no se
// publica: por eso no está en public/
const REPORT = path.join(ROOT, 'scripts/grabar-plataforma/grabacion.json')
const FPS = 60

// Tamaño de cada caja en la landing, en px de CSS. En escritorio, el más grande que
// alcanza la caja (las cajas crecen con la pantalla: así el video nunca se estira);
// en el celular, el de una pantalla de 390 (a DPR 3 cubre también las de 430). Si
// cambia el diseño de una sección, se cambia acá.
const GRILLA = { escritorio: [465, 428], celular: [340, 313] }
const PIEZAS = {
  // «Todo lo que pasa en tu planta» (PlatformPieces.vue)
  argus: GRILLA,
  alarmas: GRILLA,
  mediciones: GRILLA,
  activos: GRILLA,
  paradas: GRILLA,
  reporte: GRILLA,
  // «Cómo funciona» (HowItWorks.vue): el fragmento del tablero, el campo de Argus y
  // el reporte en su tarjeta
  widget: { escritorio: [708, 574], celular: [342, 340] },
  ask: { escritorio: [708, 113], celular: [342, 72] },
  report: { escritorio: [708, 529], celular: [342, 485] },
  // «A tu medida» (PlatformFit.vue). En escritorio la caja crece con el alto de la
  // pantalla (hasta 1398 × 786): 1120 × 630 cubre a DPR 2 las notebooks comunes
  medida: { escritorio: [1120, 630], celular: [340, 433] },
  // El hero (PlatformStage.vue): la pantalla dentro del marco, sin el marco
  hero: { escritorio: [1224, 765], celular: [330, 660] },
}
// Piezas que no salen de la plataforma: una secuencia de cuadros ya renderizada,
// que se compone sobre negro (#000, el fondo de la landing) y se arma en loop:
// el movimiento, una pausa sobre el último cuadro y corte seco al primero.
const CONTENIDO = process.env.SEIM_CONTENIDO_REPO || path.resolve(ROOT, '../seim-global-landing')
const SECUENCIAS = {
  // Paso 1 de «Cómo funciona»: las fichas que se enchufan (Blender, plc.py --shot hub
  // --web --fps 60, ver su README). Un loop de 4,2 s a 60 fps, 16:9, con su piso y su
  // negro dentro del cuadro: la cámara frena suave y vuelve a la toma abierta.
  conectar: {
    frames: path.join(CONTENIDO, 'promo/iot-idioma-blender/renders/conectar-web/f_%04d.png'),
    size: [1920, 1080],
    fps: 60,
    // La caja mide hasta 708 de ancho en escritorio (DPR 2) y 382 en el celular (DPR 3)
    versiones: {
      escritorio: 'scale=1440:810:flags=lanczos',
      celular: 'scale=1152:648:flags=lanczos',
    },
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
    datos: get('datos', 'vivos'),
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
    if (Date.now() - warmStart > 420000) throw new Error(`«${key}» no llegó a la segunda vuelta del guion`)
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
  // Lo que la pieza avisó durante la vuelta (en «A tu medida», el equipo de la
  // pestaña), en segundos desde el primer cuadro; arranca con lo que estaba antes.
  const events = await page.evaluate(() => window.__events || [])
  const before = events.filter((e) => e.t <= t2).at(-1)
  const lapMarks = [
    ...(before ? [{ t: 0, name: before.name }] : []),
    ...events.filter((e) => e.t > t2 && e.t < t2 + frames.lapLength).map((e) => ({ t: +((e.t - t2) / 1000).toFixed(3), name: e.name })),
  ]
  await browser.close()
  return { frames, w, h, dpr, errors, marks: lapMarks, recordMs: Date.now() - t0, warmMs: t0 - warmStart, clockCheck }
}

// El póster (el primer cuadro) en WebP: lo codifica Chrome, que ya está, así no hace
// falta otra herramienta.
async function posterWebp(png, out) {
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage()
  const data = (await readFile(png)).toString('base64')
  const webp = await page.evaluate(async (src) => {
    const img = new Image()
    img.src = src
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d').drawImage(img, 0, 0)
    return canvas.toDataURL('image/webp', 0.9).split(',')[1]
  }, `data:image/png;base64,${data}`)
  await browser.close()
  await writeFile(out, Buffer.from(webp, 'base64'))
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
    poster: `${base}-poster.webp`,
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

async function buildSequence(key, version, framesDir) {
  const seq = SECUENCIAS[key]
  await rm(framesDir, { recursive: true, force: true })
  await mkdir(framesDir, { recursive: true })
  const [w, h] = seq.size
  ff([
    '-framerate', String(seq.fps), '-i', seq.frames,
    '-filter_complex', `color=black:s=${w}x${h}:r=${seq.fps}[bg];[bg][0:v]overlay=format=auto:shortest=1,${seq.versiones[version]},fps=${FPS}`,
    '-start_number', '1', path.join(framesDir, '%05d.png'),
  ])
  return (await readdir(framesDir)).filter((f) => f.endsWith('.png')).length
}

const opts = args()
await mkdir(OUT, { recursive: true })
const report = []

// --manifiesto: rehace src/components/platformVideos.json desde grabacion.json, sin grabar
// ni codificar (por ejemplo, si cambia lo que guarda el manifiesto)
if (process.argv.includes('--manifiesto')) {
  const all = JSON.parse(await readFile(REPORT, 'utf8'))
  await save(all.filter((e) => e.av1 && e.version).map((e) => ({ ...e, dur: e.dur ?? +(e.frames / FPS).toFixed(3) })))
  console.log(`manifiesto: ${all.length} videos`)
  process.exit(0)
}

// Codifica los cuadros, mide la calidad de cada formato y saca el póster
async function finish(entry, framesDir, base) {
  const outs = encode(framesDir, base)
  for (const [fmt, file] of Object.entries(outs)) {
    if (fmt === 'poster') continue
    const q = quality(path.join(framesDir, '%05d.png'), file, fmt === 'h264' ? 'yuv420p' : 'yuv420p10le')
    entry[fmt] = { file: path.relative(ROOT, file), size: await sizeOf(file), ...q }
    console.log(`  ${fmt.padEnd(5)} ${entry[fmt].size.padStart(8)}  SSIM ${q.ssim}  PSNR ${q.psnr} dB  VMAF ${q.vmaf ?? '—'}`)
  }
  await posterWebp(path.join(framesDir, '00001.png'), outs.poster)
  entry.poster = { file: path.relative(ROOT, outs.poster), size: await sizeOf(outs.poster) }
  console.log(`  póster ${entry.poster.size}`)
}

const framesRoot = opts.cuadros || path.join(os.tmpdir(), 'grabar-plataforma')
const countFrames = async (dir) => (await readdir(dir)).filter((f) => f.endsWith('.png')).length

for (const key of opts.piezas) {
  if (!PIEZAS[key] && !SECUENCIAS[key]) throw new Error(`No hay tamaño de caja para «${key}» en PIEZAS`)
  const versions = opts.version === 'ambas' ? Object.keys(VERSIONES) : [opts.version]
  for (const version of versions) {
    const framesDir = path.join(framesRoot, `${key}-${version}`)
    const entry = { key, version, framesDir }
    if (SECUENCIAS[key]) {
      entry.frames = opts.reusar ? await countFrames(framesDir) : await buildSequence(key, version, framesDir)
      const [w, h] = SECUENCIAS[key].versiones[version].match(/scale=(\d+):(\d+)/).slice(1).map(Number)
      Object.assign(entry, { w, h })
      console.log(`▸ ${key} (${version}): ${entry.frames} cuadros (${(entry.frames / FPS).toFixed(2)} s de loop)`)
    } else {
      const [cw, ch] = PIEZAS[key][version]
      const dpr = VERSIONES[version].dpr
      Object.assign(entry, { w: cw * dpr, h: ch * dpr, css: [cw, ch] })
      if (opts.reusar) {
        entry.frames = await countFrames(framesDir)
        console.log(`▸ ${key} (${version}): ${entry.frames} cuadros ya grabados en ${framesDir}`)
      } else {
        console.log(`▸ ${key} (${version}): grabando…`)
        const rec = await record({ key, version, url: opts.url, datos: opts.datos, framesDir })
        entry.frames = rec.frames.length
        entry.marks = rec.marks
        console.log(`  ${entry.frames} cuadros (${(entry.frames / FPS).toFixed(2)} s de video, vuelta de ${(rec.frames.lapLength / 1000).toFixed(3)} s) en ${(rec.recordMs / 1000).toFixed(0)} s; arranque ${(rec.warmMs / 1000).toFixed(0)} s`)
        console.log(`  relojes (página, iframe): ${rec.clockCheck.join(', ')}`)
        if (rec.marks.length) console.log(`  marcas: ${rec.marks.map((m) => `${m.t}s ${m.name}`).join(' · ')}`)
        if (rec.errors.length) console.log('  avisos de la página:', [...new Set(rec.errors)].join(' | '))
      }
    }
    entry.dur = +(entry.frames / FPS).toFixed(3)
    if (opts.codificar) await finish(entry, framesDir, path.join(OUT, key + VERSIONES[version].sufijo))
    report.push(entry)
    await save([entry])
  }
}

// El parámetro `codecs` de cada archivo, para el atributo type de <source>: así el
// navegador sabe de antemano si lo puede reproducir (perfil y nivel reales, de ffprobe).
function codecsOf(file) {
  const [codec, , level] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,profile,level', '-of', 'csv=p=0', path.resolve(ROOT, file)], { encoding: 'utf8' }).trim().split(',')
  const n = Number(level)
  if (codec === 'av1') return `av01.0.${String(n).padStart(2, '0')}M.10`
  if (codec === 'hevc') return `hvc1.2.4.L${n}.B0`
  return `avc1.6400${n.toString(16).padStart(2, '0')}`
}

// grabacion.json (detalle y calidad) y src/components/platformVideos.json (lo que
// lee la landing) acumulan: cada corrida reemplaza solo las piezas que grabó.
async function save(entries) {
  const previous = await readFile(REPORT, 'utf8').then(JSON.parse).catch(() => [])
  const id = (e) => `${e.key}/${e.version ?? ''}`
  // Sin rutas de esta máquina: los archivos, relativos al repo; la carpeta de cuadros, afuera
  const clean = (e) => {
    const { framesDir, ...rest } = e
    for (const f of ['av1', 'hevc', 'h264', 'poster']) if (rest[f]?.file) rest[f] = { ...rest[f], file: path.relative(ROOT, path.resolve(ROOT, rest[f].file)) }
    return rest
  }
  const merged = [...previous.filter((e) => e.version && !entries.some((r) => id(r) === id(e))), ...entries].map(clean)
  await writeFile(REPORT, JSON.stringify(merged, null, 2) + '\n')

  const manifestFile = path.join(ROOT, 'src/components/platformVideos.json')
  const manifest = await readFile(manifestFile, 'utf8').then(JSON.parse).catch(() => ({}))
  for (const e of entries) {
    if (!e.av1) continue
    const prev = manifest[e.key]?.[e.version]
    manifest[e.key] = {
      ...manifest[e.key],
      // v: cambia con cada grabación; va en la URL (?v=), así el servidor puede dar caché de un año
      [e.version]: { w: e.w, h: e.h, dur: e.dur ?? +(e.frames / FPS).toFixed(3), v: createHash('sha1').update(await readFile(path.resolve(ROOT, e.av1.file))).digest('hex').slice(0, 10), codecs: { av1: codecsOf(e.av1.file), hevc: codecsOf(e.hevc.file), h264: codecsOf(e.h264.file) }, ...(e.marks?.length ? { marks: e.marks } : prev?.marks && (opts.reusar || process.argv.includes('--manifiesto')) ? { marks: prev.marks } : {}) },
    }
  }
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
}
