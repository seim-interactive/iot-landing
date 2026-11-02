<!--
  Recorrido animado por la plataforma, recreado con su diseño real (tokens, textos y
  componentes de iot/frontend): login → Activos → Mediciones → Operations Hub →
  reporte de Argus → chat de Argus. Reemplaza a la captura estática.

  El escenario mide 1280×800 px y se escala entero con transform, así que todas las
  medidas internas son las de la app y la posición del cursor se calcula una sola vez.
  El loop corre solo mientras está en pantalla; con movimiento reducido queda fijo en
  Mediciones.
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import loginArt from '@/assets/tour-login-art-light.jpg'

defineProps({
  label: { type: String, default: 'Recorrido por la plataforma: login, activos, mediciones, operaciones, reporte y chat de Argus' },
})

const W = 1280
const H = 800

const root = ref(null)
const stage = ref(null)
const scale = ref(1)

const nav = [
  { key: 'activos', label: 'Activos', d: 'M3 21V8l7-5 7 5v13M8 21v-6h4v6' },
  { key: 'mediciones', label: 'Mediciones', d: 'M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3' },
  { key: 'acciones', label: 'Acciones', d: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z' },
  { key: 'ia', label: 'IA', d: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z' },
]

const assets = [
  { name: 'Envasadora 1', sub: 'envasadora1 · Producto A', state: 'En marcha', tone: 'ok', prod: '2.224 u', alarms: '2 activas', alarmTone: 'danger', last: 'recién' },
  { name: 'Envasadora 2', sub: 'envasadora2 · Producto B', state: 'En marcha', tone: 'ok', prod: '1.986 u', alarms: '', last: 'hace 12 s' },
  { name: 'Llenadora', sub: 'llenadora · Botellas', state: 'Detenida', tone: 'warning', prod: '864 u', alarms: '1 activa', alarmTone: 'warning', last: 'hace 3 s' },
  { name: 'Horno', sub: 'horno · Línea 2', state: 'En marcha', tone: 'ok', prod: '—', alarms: '', last: 'recién' },
]

const alarms = [
  { msg: 'Velocidad de línea por debajo del mínimo', sev: 'Alta', tone: 'high', src: 'Automática', date: 'Hoy, 09:12', status: 'Reconocida' },
  { msg: 'Falta de producto en la llenadora', sev: 'Media', tone: 'medium', src: 'PLC', date: 'Hoy, 08:40', status: 'Resuelta' },
]

// Mediciones: contadores (con el color que elige el admin), series y estados
// StatusLight: el color que eligió el admin, encendida o apagada
const lights = [
  { label: 'Encendida', color: 'green', on: true },
  { label: 'Detenida', color: 'red', on: false },
  { label: 'Mantenimiento', color: 'blue', on: false },
  { label: 'Falta de producto', color: 'yellow', on: false },
]
const tiles = [
  { label: 'Producidas', value: 2224, dec: 0, color: 'green' },
  { label: 'Rechazadas', value: 86, dec: 0, color: 'green' },
]
const gauges = [
  { key: 'temp', label: 'Temperatura Del Cabezal', value: 72.4, max: 120, unit: '°C' },
  { key: 'speed', label: 'Velocidad', value: 118, max: 150, unit: 'u/min' },
]
const speedTimes = Array.from({ length: 46 }, (_, i) => `12:${String(i).padStart(2, '0')}`)
const speedData = speedTimes.map((_, i) => Math.round((112 + 6 * Math.sin(i / 4) + 3 * Math.sin(i / 1.7) + i * 0.08) * 10) / 10)
const hourly = [
  ['06:00', 284],
  ['07:00', 312],
  ['08:00', 326],
  ['09:00', 248],
  ['10:00', 318],
  ['11:00', 334],
  ['12:00', 302],
]
// StateTimelineWidget: chip del color «encendido», nombre y resumen («veces · duración»)
const states = [
  { name: 'Envasadora 1 · Detenida', on: '#dc2626', summary: '3 veces · 48 min', bands: [[22, 3], [38, 5], [71, 4]] },
  { name: 'Envasadora 1 · En producción', on: '#10b981', summary: '4 veces · 11 h', bands: [[0, 22], [25, 13], [43, 28], [75, 25]] },
  { name: 'Envasadora 1 · Falta de producto', on: '#f59e0b', summary: '1 vez · 22 min', bands: [[46, 6]] },
]

// Reporte de Argus (formato de ArgusReportView: indicadores, hallazgos, acciones, equipos)
const report = {
  kpis: [
    { label: 'Producido', value: '2.224', unit: 'u', delta: '12 %', up: true, better: true, spark: [180, 186, 190, 184, 192, 196, 188, 194, 199, 197, 201, 196] },
    { label: 'Rechazo', value: '17,5', unit: '%', delta: '78 %', up: true, better: false, goal: 'meta 12 %', spark: [9.6, 9.9, 9.4, 10.1, 9.7, 9.9, 9.5, 10.2, 9.8, 10.4, 14.8, 17.5] },
    { label: 'Paradas', value: '3', unit: '', delta: '1', up: true, better: false, spark: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0] },
    { label: 'Disponibilidad', value: '91', unit: '%', delta: '4 %', up: false, better: false, spark: [96, 95, 93, 95, 96, 92, 94, 95, 93, 90, 91, 91] },
    { label: 'Velocidad media', value: '112', unit: 'u/min', delta: '2 %', up: true, better: true, spark: [108, 110, 109, 112, 111, 113, 110, 112, 114, 113, 112, 112] },
  ],
  findings: [
    {
      title: 'El rechazo casi se duplicó en la última hora',
      severity: 'Crítico',
      tone: 'critical',
      chips: ['Planta Buenos Aires', 'Envasadora 1', 'Calidad'],
      text: 'Pasó de 9,8 % en el turno a 17,5 % entre las 17:24 y las 18:24. Coincide con la temperatura del cabezal por encima de 70 °C.',
      action: 'Revisar la selladora de la envasadora 1',
      button: 'Crear incidente',
    },
    {
      title: 'Paradas sin registrar',
      severity: 'Atención',
      tone: 'warning',
      chips: ['Planta Buenos Aires', 'Llenadora', 'Paradas'],
      text: 'Hubo 3 paradas (48 min) y ninguna tiene motivo cargado. Sin el motivo, Argus no puede decir qué las causó.',
      action: 'Cargar el motivo de las paradas',
      button: 'Ver paradas',
    },
    {
      title: 'Falta de producto sin alarma',
      severity: 'Para revisar',
      tone: 'info',
      chips: ['Planta Buenos Aires', 'Llenadora', 'Alarmas'],
      text: 'La llenadora estuvo 22 min sin producto y no saltó ninguna alarma.',
      action: 'Crear una alarma por falta de producto',
      button: 'Crear regla de alarma',
    },
  ],
  equipment: [
    { name: 'Envasadora 1', product: 'Producto A', produced: '2.224', reject: '17,5 %', state: 'En marcha', tone: 'ok' },
    { name: 'Envasadora 2', product: 'Producto B', produced: '1.986', reject: '4,1 %', state: 'En marcha', tone: 'ok' },
    { name: 'Llenadora', product: 'Botellas', produced: '864', reject: '3,2 %', state: 'Detenida', tone: 'warning' },
    { name: 'Horno', product: 'Línea 2', produced: '—', reject: '—', state: 'En marcha', tone: 'ok' },
  ],
}
const evidence = [9.6, 9.9, 9.4, 10.1, 9.7, 9.9, 9.5, 10.2, 9.8, 10.4, 11.0, 14.8, 17.5]

// Gráfico de área de Mediciones y barras del chat
const chatBars = [
  { label: 'Envasadora 1', value: 2224 },
  { label: 'Envasadora 2', value: 1986 },
  { label: 'Llenadora', value: 864 },
]

let tl
let io
let charts = []
let ec = null

// Colores de los gráficos en claro (chartColors() de useChartConfig con los tokens light)
const C = { axisLabel: '#5a6568', axisLine: '#d3d8da', grid: '#e6eaeb', text: '#0d1416', gaugeArc: '#58d9f9' }

// Mismas opciones que GaugeChart.vue en tamaño normal (el contenedor mide más de 260×190)
const gaugeOption = (value, max = 120, unit = '°C') => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      center: ['50%', '60%'],
      radius: '110%',
      min: 0,
      max,
      splitNumber: 10,
      itemStyle: { color: C.gaugeArc, shadowColor: 'rgba(0, 138, 255, 0.45)', shadowBlur: 10, shadowOffsetX: 2, shadowOffsetY: 2 },
      progress: { show: true, roundCap: true, width: 18 },
      pointer: {
        show: true,
        icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
        length: '75%',
        width: 12,
        offsetCenter: [0, '5%'],
      },
      axisLine: { roundCap: true, lineStyle: { width: 18 } },
      axisTick: { splitNumber: 2, lineStyle: { width: 2, color: C.axisLabel } },
      splitLine: { length: 5, lineStyle: { width: 2, color: C.axisLabel } },
      axisLabel: { distance: 30, color: C.axisLabel, fontSize: 12 },
      title: { show: false },
      detail: {
        offsetCenter: [0, '40%'],
        valueAnimation: true,
        formatter: (v) => `{value|${Math.round(v)}}{unit|${unit}}`,
        rich: {
          value: { fontSize: 32, fontWeight: 'bolder', color: C.text },
          unit: { fontSize: 14, color: C.axisLabel, padding: [0, 0, -2, 6] },
        },
      },
      data: [{ value }],
    },
  ],
})

// Ejes, grilla y series como buildXAxis / buildYAxis / buildGrid y buildAreaSeries / buildBarSeries
const axes = (categories, unit, isArea) => ({
  grid: { left: 50, right: 20, top: 30, bottom: 40 },
  xAxis: {
    type: 'category',
    data: categories,
    ...(isArea ? { boundaryGap: false } : {}),
    axisLine: { show: true, lineStyle: { color: C.axisLine } },
    axisTick: { show: true, ...(isArea ? {} : { alignWithLabel: true }), lineStyle: { color: C.axisLine } },
    axisLabel: { color: C.axisLabel, fontSize: 11, interval: 'auto' },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    name: `(${unit})`,
    nameLocation: 'middle',
    nameGap: 40,
    nameTextStyle: { color: C.axisLabel, fontSize: 12 },
    axisLine: isArea ? { show: false } : { show: true, lineStyle: { color: C.axisLine } },
    axisTick: { show: true, lineStyle: { color: C.axisLine } },
    axisLabel: { color: C.axisLabel, fontSize: 11 },
    splitLine: { show: true, lineStyle: { color: C.grid, type: 'dashed' } },
    ...(isArea ? { min: 90 } : {}),
  },
})

const speedOption = (data) => ({
  ...axes(speedTimes, 'u/min', true),
  series: [
    {
      type: 'line',
      data,
      smooth: false,
      showSymbol: false,
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f666' }, { offset: 1, color: '#3b82f608' }] },
        opacity: 0.3,
      },
    },
  ],
  animationDuration: 1600,
})

const hourlyOption = (data) => ({
  ...axes(hourly.map((h) => h[0]), 'unidades', false),
  series: [
    {
      type: 'bar',
      data,
      barWidth: '60%',
      barMaxWidth: 50,
      itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
    },
  ],
  animationDuration: 1000,
})

// ArgusChart (utils/reportChartOptions): línea en el teal de acento con su área, la
// meta punteada y la ventana resaltada; la chica sin ejes
const argusLine = '#0a6c78'
const sparkOption = (values, animate) => {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const room = (hi - lo) * 0.12 || Math.abs(hi) * 0.1 || 1
  const data = values.map((v, i) => [i, v])
  return {
    animation: animate,
    animationDuration: 420,
    animationEasing: 'cubicOut',
    grid: { left: 5, right: 6, top: 6, bottom: 4, containLabel: false },
    xAxis: { type: 'value', show: false, min: 0, max: values.length - 1 },
    yAxis: { type: 'value', show: false, min: lo - room, max: hi + room },
    series: [
      {
        type: 'line',
        data,
        showSymbol: false,
        lineStyle: { width: 1.5, color: argusLine, cap: 'round', join: 'round' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(10,108,120,0.14)' }, { offset: 1, color: 'rgba(10,108,120,0)' }] } },
      },
      {
        type: 'line',
        data: [{ value: data[data.length - 1], symbolSize: 6, itemStyle: { color: argusLine, borderColor: '#ffffff', borderWidth: 2 } }],
        showSymbol: true,
        symbol: 'circle',
        lineStyle: { opacity: 0, width: 0 },
      },
    ],
  }
}
const evidenceOption = (animate) => {
  const data = evidence.map((v, i) => [6.4 + i, v])
  return {
    animation: animate,
    animationDuration: 900,
    animationEasing: 'cubicOut',
    grid: { left: 8, right: 8, top: 10, bottom: 0, containLabel: true },
    xAxis: {
      type: 'value',
      min: 6.4,
      max: 18.4,
      axisLine: { show: true, lineStyle: { color: '#e7ebec' } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#6a7578', fontSize: 11, margin: 10, customValues: [9, 12, 15, 18], formatter: (x) => `${String(x).padStart(2, '0')}:00` },
    },
    yAxis: {
      type: 'value',
      min: 5,
      max: 20,
      interval: 5,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#e7ebec', type: 'dashed' } },
      axisLabel: { color: '#6a7578', fontSize: 11, formatter: (v) => `${v} %` },
    },
    series: [
      {
        type: 'line',
        data,
        showSymbol: false,
        lineStyle: { width: 2, color: argusLine, cap: 'round', join: 'round' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(10,108,120,0.16)' }, { offset: 1, color: 'rgba(10,108,120,0)' }] } },
        z: 3,
        markArea: { silent: true, data: [[{ xAxis: 17.4, itemStyle: { color: 'rgba(217, 154, 6, 0.12)' } }, { xAxis: 18.4 }]] },
        markLine: { silent: true, symbol: 'none', lineStyle: { type: 'dashed', color: 'rgba(220, 59, 59, 0.75)', width: 1 }, label: { show: false }, data: [{ yAxis: 12 }] },
      },
      {
        type: 'line',
        data: [{ value: data[data.length - 1], symbolSize: 8, itemStyle: { color: argusLine, borderColor: '#ffffff', borderWidth: 2 } }],
        showSymbol: true,
        symbol: 'circle',
        lineStyle: { opacity: 0, width: 0 },
        z: 4,
      },
    ],
  }
}

async function setupCharts(q) {
  const { init } = await import('./platformTourCharts.js')
  const dpr = Math.max(2, window.devicePixelRatio || 1)
  const make = (sel) => init(q(sel)[0], null, { renderer: 'canvas', devicePixelRatio: dpr })
  const gaugeCharts = gauges.map((g) => make(`.ec-gauge-${g.key}`))
  const speed = make('.ec-speed')
  const hours = make('.ec-hourly')
  const sparks = report.kpis.map((_, n) => make(`.ec-spark-${n}`))
  const ev = make('.ec-evidence')
  charts = [...gaugeCharts, speed, hours, ev, ...sparks]
  ec = {
    // Vacío y sin animación, para volver a dibujarse en cada vuelta
    reset() {
      gaugeCharts.forEach((c, n) => c.setOption(gaugeOption(0, gauges[n].max, gauges[n].unit), { notMerge: true, silent: true }))
      speed.setOption({ ...speedOption([]), animation: false }, { notMerge: true })
      hours.setOption({ ...hourlyOption(hourly.map(() => 0)), animation: false }, { notMerge: true })
      sparks.forEach((c) => c.clear())
      ev.clear()
    },
    report(animate = true) {
      sparks.forEach((c, n) => c.setOption(sparkOption(report.kpis[n].spark, animate), { notMerge: true }))
      ev.setOption(evidenceOption(animate), { notMerge: true })
    },
    show(animate = true) {
      gaugeCharts.forEach((c, n) => c.setOption({ ...gaugeOption(gauges[n].value, gauges[n].max, gauges[n].unit), animation: animate }))
      speed.setOption({ ...speedOption(speedData), animation: animate }, { notMerge: true })
      hours.setOption({ ...hourlyOption(hourly.map((h) => h[1])), animation: animate }, { notMerge: true })
    },
  }
  ec.reset()
}
let ro
let mm

function fit() {
  const el = root.value
  if (!el) return
  scale.value = el.clientWidth / W
}

// Centro de un elemento en coordenadas del escenario (sin escala)
function at(sel, dx = 0, dy = 0) {
  const s = stage.value.getBoundingClientRect()
  const r = stage.value.querySelector(sel).getBoundingClientRect()
  const k = s.width / W
  return { x: (r.left - s.left + r.width / 2) / k + dx, y: (r.top - s.top + r.height / 2) / k + dy }
}

function build(q) {
  const cursor = q('.cursor')[0]
  const setNav = (key) => {
    q('.nav-item').forEach((n) => n.classList.toggle('is-active', n.dataset.key === key))
  }
  const show = (view) => {
    q('[data-view]').forEach((v) => v.classList.toggle('is-on', v.dataset.view === view))
  }
  const type = (el, text, dur) => {
    const o = { n: 0 }
    return gsap.fromTo(o, { n: 0 }, {
      n: text.length,
      duration: dur,
      ease: 'none',
      onUpdate: () => (el.textContent = text.slice(0, Math.round(o.n))),
      onStart: () => (el.textContent = ''),
    })
  }
  const count = (el, from, to, dur, fmt = (v) => Math.round(v).toLocaleString('es-AR')) => {
    const o = { v: from }
    return gsap.fromTo(o, { v: from }, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => (el.textContent = fmt(o.v)) })
  }
  // p puede ser una posición o una función que la mide en el momento (para lo que se mueve con scroll)
  const move = (p, dur = 0.7) =>
    typeof p === 'function'
      ? gsap.to(cursor, { x: () => p().x, y: () => p().y, duration: dur, ease: 'power3.inOut' })
      : gsap.to(cursor, { x: p.x, y: p.y, duration: dur, ease: 'power3.inOut' })
  const click = () =>
    gsap.timeline()
      .to(cursor, { scale: 0.82, duration: 0.09, ease: 'power2.in' })
      .to(cursor, { scale: 1, duration: 0.2, ease: 'power2.out' })

  // El reporte de Argus es más alto que la pantalla: se baja hasta que el feedback del
  // primer hallazgo queda a la vista (sin pasarse del final)
  const medScroller = q('.med-scroll')[0]
  const medTarget = () => -Math.max(0, medScroller.scrollHeight - medScroller.parentElement.clientHeight + 24)

  // (se mide al empezar el scroll: recién ahí el reporte tiene su alto final)
  const scroller = q('.ia-scroll')[0]
  const view = scroller.parentElement
  const scrollTarget = () => {
    const current = Number(gsap.getProperty(scroller, 'y')) || 0
    const thumbY = at('.fb-up').y - current
    return -Math.max(0, Math.min(thumbY - 560, scroller.scrollHeight - view.clientHeight + 24))
  }

  // Posiciones del cursor (el escenario no cambia de tamaño interno)
  // Cada destino se mide al momento de moverse: el layout final (alturas animadas,
  // scroll, gráficos) ya está ahí
  const P = {
    email: () => at('.login-field.email .input', -120),
    pass: () => at('.login-field.pass .input', -120),
    submit: () => at('.login-submit', 40),
    row: () => at('.asset-row.first .asset-name', 30),
    navAcciones: () => at('.nav-item[data-key="acciones"]'),
    ack: () => at('.alarm-row.new .btn-ack'),
    navIa: () => at('.nav-item[data-key="ia"]'),
    thumb: () => at('.fb-up'),
    ask: () => at('.btn-ask'),
    composer: () => at('.composer-input', -60),
    send: () => at('.composer-send'),
  }

  const email = q('.login-field.email .value')[0]
  const pass = q('.login-field.pass .value')[0]
  const submitLabel = q('.login-submit .label')[0]
  const userMsg = q('.composer-input .value')[0]

  tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: 'power3.out' } })

  // ---------- Estado inicial (se reaplica en cada vuelta) ----------
  tl.call(() => {
    setNav('activos')
    show('activos')
    email.textContent = ''
    pass.textContent = ''
    userMsg.textContent = ''
    q('.chat-pill').forEach((p) => p.classList.remove('is-done'))
    q('.fb-up')[0].classList.remove('is-on')
    submitLabel.textContent = 'Ingresar'
    q('.login-submit')[0].classList.remove('is-busy')
    q('.alarm-row.new .status-label')[0].textContent = 'Abierta'
    q('.alarm-row.new')[0].classList.remove('is-ack')
    ec?.reset()
  })
  tl.fromTo(q('.login'), { autoAlpha: 0, scale: 1 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 0)
  tl.set(q('.app'), { autoAlpha: 0 }, 0)
  tl.set(q('.chat-layer'), { autoAlpha: 1 }, 0)
  tl.set(q('.chat'), { xPercent: 104 }, 0)
  tl.set(q('.chat-backdrop'), { autoAlpha: 0 }, 0)
  tl.set(q('.chat-msg, .chat-pill, .chat-answer > *'), { autoAlpha: 0, y: 8 }, 0)
  tl.set(cursor, { x: 980, y: 700, scale: 1, autoAlpha: 1 }, 0)
  tl.set(q('.login-rise'), { autoAlpha: 0, y: 14 }, 0)
  tl.set(q('.fade-in'), { autoAlpha: 0, y: 10 }, 0)
  tl.set(q('.alarm-row.new'), { height: 0, autoAlpha: 0 }, 0)
  tl.set(scroller, { y: 0 }, 0)
  tl.set(medScroller, { y: 0 }, 0)

  // ---------- Login ----------
  tl.to(q('.login-rise'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0.1)
  tl.add(move(P.email), 0.7)
  tl.add(click(), 1.4)
  tl.call(() => q('.login-field.email')[0].classList.add('is-focus'), null, 1.45)
  tl.add(type(email, 'lucia.perez@empresa.com', 0.9), 1.5)
  tl.add(move(P.pass, 0.5), 2.5)
  tl.add(click(), 3.0)
  tl.call(() => {
    q('.login-field.email')[0].classList.remove('is-focus')
    q('.login-field.pass')[0].classList.add('is-focus')
  }, null, 3.05)
  tl.add(type(pass, '••••••••••', 0.5), 3.1)
  tl.add(move(P.submit, 0.6), 3.7)
  tl.add(click(), 4.3)
  tl.call(() => {
    q('.login-field.pass')[0].classList.remove('is-focus')
    submitLabel.textContent = 'Verificando…'
    q('.login-submit')[0].classList.add('is-busy')
  }, null, 4.35)
  tl.call(() => (submitLabel.textContent = 'Entrando…'), null, 4.9)
  tl.to(q('.login'), { autoAlpha: 0, scale: 0.985, duration: 0.5, ease: 'power2.inOut' }, 5.3)
  tl.fromTo(q('.app'), { autoAlpha: 0, scale: 1.015 }, { autoAlpha: 1, scale: 1, duration: 0.6 }, 5.45)

  // ---------- Activos ----------
  tl.to(q('[data-view="activos"] .fade-in'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06 }, 5.6)
  q('[data-count]').forEach((el) => {
    const view = el.closest('[data-view]').dataset.view
    const t0 = { activos: 5.7, mediciones: 9.6, acciones: 15.4, ia: 19.8 }[view]
    const dec = Number(el.dataset.dec || 0)
    tl.add(count(el, 0, Number(el.dataset.count), 1.1, (v) => v.toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec })), t0)
  })
  tl.add(move(P.row, 0.9), 7.2)
  tl.call(() => q('.asset-row.first')[0].classList.add('is-hover'), null, 7.9)
  tl.add(click(), 8.4)

  // ---------- Mediciones ----------
  tl.call(() => {
    q('.asset-row.first')[0].classList.remove('is-hover')
    setNav('mediciones')
    show('mediciones')
  }, null, 8.6)
  tl.to(q('[data-view="mediciones"] .fade-in'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 }, 8.7)
  tl.call(() => ec?.show(), null, 9.2)
  // El tablero es más alto que la pantalla: baja hasta el final para verlo entero
  tl.to(medScroller, { y: medTarget, duration: 1.8, ease: 'power2.inOut' }, 10.9)
  tl.fromTo(q('.band'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, stagger: 0.05, ease: 'power2.out' }, 9.6)
  tl.add(move(P.navAcciones, 1.0), 13.4)
  tl.add(click(), 14.4)

  // ---------- Operations Hub ----------
  tl.call(() => {
    setNav('acciones')
    show('acciones')
  }, null, 14.55)
  tl.to(q('[data-view="acciones"] .fade-in'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06 }, 14.65)
  // Llega una alarma nueva
  tl.to(q('.alarm-row.new'), { height: 84, autoAlpha: 1, duration: 0.6, ease: 'power3.out' }, 16)
  tl.fromTo(q('.alarm-row.new'), { backgroundColor: 'rgba(239,68,68,0.10)' }, { backgroundColor: 'rgba(239,68,68,0)', duration: 1.6 }, 16.2)
  tl.add(move(P.ack, 0.8), 16.8)
  tl.add(click(), 17.6)
  tl.call(() => {
    q('.alarm-row.new .status-label')[0].textContent = 'Reconocida'
    q('.alarm-row.new')[0].classList.add('is-ack')
  }, null, 17.65)
  tl.add(move(P.navIa, 0.9), 18.4)
  tl.add(click(), 19.3)

  // ---------- Reporte de Argus ----------
  tl.call(() => {
    setNav('ia')
    show('ia')
  }, null, 19.45)
  tl.to(q('[data-view="ia"] .fade-in'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 }, 19.55)
  tl.call(() => ec?.report(), null, 19.8)
  // Baja para leer el hallazgo y marca que le sirvió; después vuelve arriba
  tl.add(move({ x: 640, y: 560 }, 0.7), 20.4)
  tl.to(scroller, { y: scrollTarget, duration: 1.6, ease: 'power2.inOut' }, 21.1)
  tl.add(move(P.thumb, 0.8), 22.8)
  tl.add(click(), 23.6)
  tl.call(() => q('.fb-up')[0].classList.add('is-on'), null, 23.65)
  tl.to(scroller, { y: 0, duration: 1.0, ease: 'power2.inOut' }, 24.1)
  tl.add(move(P.ask, 0.9), 24.4)
  tl.add(click(), 25.4)

  // ---------- Chat de Argus ----------
  const D = 2.4
  tl.to(q('.chat-backdrop'), { autoAlpha: 1, duration: 0.3 }, 23.1 + D)
  tl.to(q('.chat'), { xPercent: 0, duration: 0.55, ease: 'expo.out' }, 23.1 + D)
  tl.add(move(P.composer, 0.6), 23.7 + D)
  tl.add(type(userMsg, '¿Cómo viene la producción de hoy?', 1.1), 24.3 + D)
  tl.add(move(P.send, 0.4), 25.4 + D)
  tl.add(click(), 25.8 + D)
  tl.call(() => (userMsg.textContent = ''), null, 25.85 + D)
  tl.to(q('.chat-msg'), { autoAlpha: 1, y: 0, duration: 0.4 }, 25.9 + D)
  tl.to(q('.chat-pill'), { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.3 }, 26.3 + D)
  tl.call(() => q('.chat-pill').forEach((p) => p.classList.add('is-done')), null, 27.3 + D)
  tl.to(q('.chat-answer > *'), { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.25 }, 27.4 + D)
  tl.fromTo(q('.chat-bar-fill'), { scaleX: 0 }, { scaleX: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, 28.1 + D)
  tl.to(cursor, { x: 1180, y: 760, duration: 1.2, ease: 'power2.inOut' }, 27 + D)

  // ---------- Cierre y vuelta a empezar ----------
  tl.to(q('.app, .chat-layer'), { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, 32 + D)
  tl.to(cursor, { autoAlpha: 0, duration: 0.3 }, 32 + D)
  tl.set({}, {}, 32.8 + D)
}

onMounted(() => {
  fit()
  ro = new ResizeObserver(fit)
  ro.observe(root.value)

  const q = gsap.utils.selector(stage.value)
  mm = gsap.matchMedia()
  mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    // Los gráficos (ECharts) se descargan recién cuando la sección se acerca a la pantalla
    let ready = null
    const loadCharts = () => (ready ??= setupCharts(q))
    if (ctx.conditions.reduce) {
      // Vista fija: Mediciones con todo dibujado
      q('.login')[0].style.visibility = 'hidden'
      q('.app')[0].style.visibility = 'visible'
      q('.nav-item').forEach((n) => n.classList.toggle('is-active', n.dataset.key === 'mediciones'))
      q('[data-view]').forEach((v) => v.classList.toggle('is-on', v.dataset.view === 'mediciones'))
      q('.cursor')[0].style.visibility = 'hidden'
      q('[data-count]').forEach((el) => {
        const dec = Number(el.dataset.dec || 0)
        el.textContent = Number(el.dataset.count).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      })
      io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        loadCharts().then(() => {
          ec.show(false)
          ec.report(false)
        })
      }, { rootMargin: '400px 0px' })
      io.observe(root.value)
      return () => io?.disconnect()
    }
    // Se arma al acercarse (gráficos y fuentes listos, para medir las posiciones del
    // cursor) y corre solo mientras está a la vista
    let visible = false
    io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (!visible) return tl?.pause()
      if (tl) return tl.play()
      Promise.all([document.fonts?.ready, loadCharts()]).then(() => {
        if (tl) return
        build(q)
        if (import.meta.env.DEV) window.__platformTour = tl
        if (visible) tl.play()
      })
    }, { rootMargin: '200px 0px' })
    io.observe(root.value)
    return () => {
      io?.disconnect()
      tl?.kill()
    }
  })
})

onUnmounted(() => {
  ro?.disconnect()
  mm?.revert()
  charts.forEach((c) => c.dispose())
})
</script>

<template>
  <div ref="root" class="tour" :style="{ height: `${H * scale}px` }" role="img" :aria-label="label">
    <div ref="stage" class="stage" :style="{ transform: `scale(${scale})` }" aria-hidden="true">
      <!-- ================= LOGIN (rediseño de develop, tema oscuro) ================= -->
      <section class="login">
        <div class="login-art" :style="{ backgroundImage: `url(${loginArt})` }">
          <span class="wordmark">
            <svg viewBox="-120 -690 2254 2254"><path d="M0 0 842 395v78L0 868V749l673-315L0 118Z" /><path d="M2014 0 1172 395v78l842 395V749L1341 434l673-316Z" /></svg>
            <span>SEIM<br />INTERACTIVE</span>
          </span>
          <div class="tagline login-rise">
            <p class="tag-title"><span>Industrial</span><span class="accent">Intelligence.</span></p>
            <p class="tag-sub">Conectá. Monitoreá. Optimizá.</p>
          </div>
        </div>

        <div class="login-panel">
          <p class="secure-access">
            <svg viewBox="0 0 24 24"><rect x="4.75" y="10.75" width="14.5" height="10.5" rx="2" /><path d="M8 10.75V7.5a4 4 0 0 1 8 0v3.25M12 15v2" /></svg>
            Acceso seguro
          </p>
          <div class="form-block">
            <h1 class="login-rise">Bienvenido.</h1>
            <p class="form-sub login-rise">Ingresá para acceder a tu panel de control.</p>
            <label class="login-field email login-rise">
              <span class="field-label">Correo electrónico</span>
              <span class="input">
                <svg viewBox="0 0 24 24"><rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2" /><path d="m3.5 6.5 7.36 5.6a1.9 1.9 0 0 0 2.28 0l7.36-5.6" /></svg>
                <span class="value" />
                <span class="placeholder">usuario@empresa.com</span>
                <i class="caret" />
              </span>
            </label>
            <label class="login-field pass login-rise">
              <span class="field-label">Contraseña</span>
              <span class="input">
                <svg viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" /></svg>
                <span class="value" />
                <span class="placeholder">••••••••</span>
                <i class="caret" />
              </span>
            </label>
            <button type="button" class="login-submit login-rise" tabindex="-1">
              <i class="btn-spin" />
              <span class="label">Ingresar</span>
              <svg class="btn-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <p class="secure-note login-rise">
              <svg viewBox="0 0 24 24"><path d="M12 21.5s7.5-3.4 7.5-9.4V5.6L12 2.75 4.5 5.6v6.5c0 6 7.5 9.4 7.5 9.4Z" /><path d="m8.75 12 2.25 2.25 4.25-4.5" /></svg>
              Conexión cifrada
            </p>
          </div>
          <footer class="login-foot">
            <span>Desarrollado por <b>Seim Interactive</b></span>
            <i class="foot-line" />
            <span>v1.0.0</span>
          </footer>
        </div>
      </section>

      <!-- ================= APP ================= -->
      <div class="app">
        <aside class="sidebar">
          <div
            v-for="item in nav"
            :key="item.key"
            class="nav-item"
            :data-key="item.key"
            :class="{ 'is-active': item.key === 'activos' }"
          >
            <svg viewBox="0 0 24 24"><path :d="item.d" /></svg>
            {{ item.label }}
          </div>
        </aside>

        <div class="account">
          <span class="avatar">LP</span>
          <span class="who"><b>Lucía Pérez</b><small>Supervisora de planta</small></span>
        </div>

        <!-- ---------- Activos ---------- -->
        <section class="view" data-view="activos">
          <header class="page-head fade-in">
            <p class="eyebrow"><i />Activos</p>
            <h2>Plantas y equipos</h2>
            <p class="page-sub">Elegí un equipo para ver sus mediciones</p>
          </header>
          <div class="kpis fade-in">
            <div><span>En línea</span><b><em data-count="4">0</em><small> / 4</small></b><p>Todos en línea</p></div>
            <div><span>En marcha</span><b data-count="3">0</b><p>de 4 equipos con señal</p></div>
            <div><span>Detenidos</span><b data-count="1">0</b><p>Mirá sus paradas en Acciones</p></div>
            <div><span>Alarmas activas</span><b class="danger" data-count="3">0</b><p>1 crítica</p></div>
          </div>
          <div class="panel table fade-in">
            <div class="plant-head">
              <span class="plant-icon"><svg viewBox="0 0 24 24"><path d="M3 21V8l7-5 7 5v13M8 21v-6h4v6" /></svg></span>
              <span><b>Planta Buenos Aires</b><small>Buenos Aires · 4 equipos · desde las 06:00</small></span>
            </div>
            <div class="cols">
              <span>Equipo</span><span>Estado</span><span class="r">Producción hoy</span><span>Alarmas</span><span>Último dato</span><span />
            </div>
            <div v-for="(a, i) in assets" :key="a.name" class="asset-row" :class="{ first: i === 0 }">
              <span class="asset-name"><i class="conn" /><span><b>{{ a.name }}</b><small>{{ a.sub }}</small></span></span>
              <span class="dot-label" :class="a.tone"><i />{{ a.state }}</span>
              <span class="r num">{{ a.prod }}</span>
              <span><em v-if="a.alarms" class="pill" :class="a.alarmTone">{{ a.alarms }}</em><small v-else class="muted">Sin alarmas</small></span>
              <span class="muted">{{ a.last }}</span>
              <span class="chev"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg></span>
            </div>
          </div>
        </section>

        <!-- ---------- Mediciones ---------- -->
        <section class="view" data-view="mediciones">
          <div class="med-scroll">
          <header class="page-head fade-in">
            <p class="eyebrow"><i />Mediciones</p>
            <h2>Envasadora 1</h2>
            <p class="page-sub">Planta Buenos Aires</p>
          </header>
          <!-- El tablero real (DynamicDashboard): grilla de 12 columnas, filas de 70 px y los
               widgets de components/widgets con su marcado y su CSS. Arriba los chicos (luces y
               contadores); los gráficos de a dos y, si sobra uno, entero abajo. -->
          <div class="widgets">
            <div v-for="l in lights" :key="l.label" class="cell fade-in" style="grid-column: span 2; grid-row: span 2">
              <div class="status-light-container">
                <div class="light-label">{{ l.label }}</div>
                <div class="status-light" :class="[l.color, l.on ? 'active' : 'inactive']" />
              </div>
            </div>
            <div v-for="k in tiles" :key="k.label" class="cell fade-in" style="grid-column: span 2; grid-row: span 2">
              <div class="numeric-counter" :class="k.color && `color-${k.color}`">
                <div class="counter-label">{{ k.label }}</div>
                <div class="counter-value" :data-count="k.value" :data-dec="k.dec">0</div>
              </div>
            </div>

            <div v-for="g in gauges" :key="g.label" class="cell fade-in" style="grid-column: span 6; grid-row: span 4">
              <div class="gauge-container">
                <div class="gauge-title">{{ g.label }}</div>
                <div class="gauge-chart ec" :class="`ec-gauge-${g.key}`" />
              </div>
            </div>

            <div class="cell fade-in" style="grid-column: span 6; grid-row: span 5">
              <div class="chart-widget-container">
                <div class="chart-widget-header">
                  <div class="chart-widget-title">Velocidad De Línea</div>
                  <div class="chart-widget-status"><span class="status-badge">1 min</span><span class="status-time">hace 2s</span></div>
                </div>
                <div class="chart-scroll-wrapper"><div class="ec ec-speed" /></div>
              </div>
            </div>

            <div class="cell fade-in" style="grid-column: span 6; grid-row: span 5">
              <div class="state-widget">
                <div class="state-header">
                  <div class="state-title">Estado General</div>
                  <div class="state-status"><span class="state-badge">12 h</span><span class="state-time">hace 1m</span></div>
                </div>
                <div class="state-body">
                  <div class="state-rows" style="gap: 26px">
                    <div v-for="row in states" :key="row.name" class="state-row">
                      <div class="state-row-header">
                        <span class="state-row-chip" :style="{ background: row.on }" />
                        <span class="state-row-label">{{ row.name }}</span>
                        <span class="state-row-summary">{{ row.summary }}</span>
                      </div>
                      <div class="state-band" style="height: 32px">
                        <i v-for="(b, k) in row.bands" :key="k" class="band" :style="{ left: `${b[0]}%`, width: `${b[1]}%`, background: row.on }" />
                      </div>
                    </div>
                  </div>
                  <div class="state-axis"><span>06:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div>
                </div>
              </div>
            </div>

            <div class="cell fade-in" style="grid-column: span 12; grid-row: span 4">
              <div class="chart-widget-container">
                <div class="chart-widget-header">
                  <div class="chart-widget-title">Producción Por Hora</div>
                  <div class="chart-widget-status"><span class="status-badge">1 h</span><span class="status-time">hace 4m</span></div>
                </div>
                <div class="chart-scroll-wrapper"><div class="ec ec-hourly" /></div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <!-- ---------- Operations Hub ---------- -->
        <section class="view" data-view="acciones">
          <header class="page-head fade-in">
            <p class="eyebrow"><i />Operations Hub</p>
            <h2>Planta Buenos Aires</h2>
            <p class="page-sub">Inicio operativo 06:00 · Buenos Aires</p>
          </header>
          <div class="kpis fade-in">
            <div><span>Paradas desde las 06:00</span><b data-count="3">0</b><p>48 min detenida</p></div>
            <div><span>Estado de planta</span><b class="word">Precaución</b><p class="dot-label warning"><i />1 crít. · 1 alta</p></div>
            <div><span>Alarmas activas</span><b data-count="3">0</b><p>3 sin resolver</p></div>
            <div><span>Incidentes abiertos</span><b data-count="1">0</b><p>1 abierto</p></div>
          </div>
          <nav class="tabs fade-in">
            <span class="is-active">Alarmas <em class="count danger">3</em></span><span>Incidentes <em class="count">1</em></span><span>Paradas</span><span>Producción</span>
          </nav>
          <div class="panel alarms fade-in">
            <div class="alarm-row new">
              <i class="sev critical" />
              <span class="alarm-main"><b>Temperatura del cabezal fuera de rango</b><small><em class="sev-text critical">Crítica</em><em class="chip">PLC</em>Envasadora 1 · recién</small></span>
              <span class="alarm-status"><i class="mark" /><span class="status-label">Abierta</span></span>
              <span class="alarm-actions"><em class="btn-act btn-ack">Reconocer</em><em class="btn-act">Resolver</em></span>
            </div>
            <div v-for="a in alarms" :key="a.msg" class="alarm-row" :class="{ resolved: a.status === 'Resuelta' }">
              <i class="sev" :class="a.tone" />
              <span class="alarm-main"><b>{{ a.msg }}</b><small><em class="sev-text" :class="a.tone">{{ a.sev }}</em><em class="chip">{{ a.src }}</em>{{ a.date }}</small></span>
              <span class="alarm-status" :class="{ ring: true }"><i class="mark" />{{ a.status }}</span>
              <span class="alarm-actions"><em class="btn-act">Resolver</em></span>
            </div>
          </div>
        </section>

        <!-- ---------- Reporte de Argus ---------- -->
        <section class="view" data-view="ia">
          <!-- La pantalla de Argus (AIInsights + ArgusReportView): se recorre con scroll -->
          <div class="ia-scroll argus-screen">
            <header class="page-head fade-in">
              <p class="eyebrow"><i />Argus</p>
              <h2>Planta Buenos Aires</h2>
              <p class="page-sub">Últimas 12 h · Hoy, 06:24 a 18:24 · Generado hace 4 min · 4 equipos</p>
              <span class="btn-ask">Preguntarle a Argus</span>
            </header>

            <div class="argus-report">
              <section class="headline fade-in">
                <div class="headline-meta">
                  <span class="status-dot warning"><i class="status-dot-mark" />Requiere atención</span>
                  <span class="headline-divider" />
                  <span class="headline-source">Resumen de Argus</span>
                </div>
                <p class="headline-text">La envasadora 1 produjo 2.224 unidades, pero el rechazo casi se duplicó en la última hora. Hubo 3 paradas sin motivo cargado.</p>
              </section>

              <section class="kpi-strip argus-panel fade-in" :style="{ '--kpi-cols': report.kpis.length }">
                <ul class="kpi-strip-list">
                  <li v-for="(k, n) in report.kpis" :key="k.label" class="kpi-tile">
                    <p class="kpi-tile-label">{{ k.label }}</p>
                    <p class="kpi-tile-value"><span class="kpi-tile-number">{{ k.value }}</span><span v-if="k.unit" class="kpi-tile-unit">{{ k.unit }}</span></p>
                    <p class="kpi-tile-meta">
                      <span class="kpi-tile-delta" :class="k.better ? 'is-better' : 'is-worse'"><span class="kpi-tile-arrow">{{ k.up ? '▲' : '▼' }}</span>{{ k.delta }}</span>
                      <span class="kpi-tile-vs">vs anterior</span>
                    </p>
                    <p v-if="k.goal" class="kpi-tile-breach"><span class="kpi-tile-breach-dot" />Fuera de la meta <span class="kpi-tile-goal">({{ k.goal }})</span></p>
                    <div class="kpi-tile-spark"><div class="ec" :class="`ec-spark-${n}`" style="height: 36px" /></div>
                  </li>
                </ul>
              </section>

              <div class="argus-columns fade-in">
                <div class="argus-main">
                  <section class="argus-panel">
                    <header class="argus-panel-header">
                      <h2 class="argus-section-title">Hallazgos</h2>
                      <span class="argus-count">{{ report.findings.length }}</span>
                    </header>
                    <ol class="argus-findings">
                      <li v-for="(f, n) in report.findings" :key="f.title">
                        <article class="finding">
                          <span class="finding-number">{{ n + 1 }}</span>
                          <div class="finding-body">
                            <header class="finding-header">
                              <h3 class="finding-title">{{ f.title }}</h3>
                              <span class="status-dot finding-severity" :class="f.tone"><i class="status-dot-mark" />{{ f.severity }}</span>
                            </header>
                            <ul class="finding-chips">
                              <li v-for="c in f.chips" :key="c" class="finding-chip">{{ c }}</li>
                            </ul>
                            <p class="finding-text">{{ f.text }}</p>
                            <div v-if="n === 0" class="finding-evidence">
                              <p class="finding-evidence-title">Evidencia · Rechazo · Envasadora 1</p>
                              <div class="ec ec-evidence" style="height: 168px" />
                              <p class="argus-chart-caption">
                                <span class="argus-chart-note"><span class="argus-chart-swatch argus-chart-swatch--goal" />Meta 12 %</span>
                                <span class="argus-chart-note"><span class="argus-chart-swatch argus-chart-swatch--window" />17:24 a 18:24</span>
                              </p>
                            </div>
                            <div class="finding-actions">
                              <p class="finding-actions-title">Qué hacer</p>
                              <ul class="finding-actions-list">
                                <li class="finding-action"><span class="finding-action-text">{{ f.action }}</span><span class="base-btn">{{ f.button }}</span></li>
                              </ul>
                            </div>
                            <div class="finding-why">
                              <span class="finding-why-toggle"><svg class="finding-why-chevron" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" stroke-width="1.6" /></svg>¿Por qué?</span>
                            </div>
                            <div class="feedback">
                              <span class="feedback-question">¿Te sirvió este hallazgo?</span>
                              <div class="feedback-buttons">
                                <span class="feedback-button" :class="{ 'fb-up': n === 0 }"><svg viewBox="0 0 16 16"><path d="M5 7v6.5M5 7l2.6-4.6a1.2 1.2 0 0 1 2.2.8L9.4 6h3a1.2 1.2 0 0 1 1.2 1.4l-.9 5a1.2 1.2 0 0 1-1.2 1H5M5 7H2.8v6.5H5" stroke-width="1.4" /></svg></span>
                                <span class="feedback-button"><svg viewBox="0 0 16 16"><path d="M11 9V2.5M11 9l-2.6 4.6a1.2 1.2 0 0 1-2.2-.8L6.6 10h-3a1.2 1.2 0 0 1-1.2-1.4l.9-5a1.2 1.2 0 0 1 1.2-1H11M11 9h2.2V2.5H11" stroke-width="1.4" /></svg></span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </li>
                    </ol>
                  </section>
                </div>

                <aside class="argus-side">
                  <div class="argus-side-sticky">
                    <section class="argus-panel actions">
                      <header class="argus-panel-header">
                        <h2 class="argus-section-title">Qué hacer</h2>
                        <span class="argus-count">{{ report.findings.length }}</span>
                      </header>
                      <ol class="actions-list">
                        <li v-for="(f, n) in report.findings" :key="f.action" class="actions-item">
                          <span class="actions-index">{{ n + 1 }}</span>
                          <div class="actions-body">
                            <p class="actions-text">{{ f.action }}</p>
                            <div class="actions-foot">
                              <p class="actions-refs">Hallazgo {{ n + 1 }}</p>
                              <span class="base-btn action-button">{{ f.button }}</span>
                            </div>
                          </div>
                        </li>
                      </ol>
                    </section>

                    <section class="argus-panel">
                      <header class="argus-panel-header">
                        <h2 class="argus-section-title">Equipos</h2>
                        <span class="argus-count">{{ report.equipment.length }}</span>
                      </header>
                      <table class="argus-table equipment">
                        <thead>
                          <tr><th>Equipo</th><th class="num">Producido</th><th class="num">Rechazo</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                          <tr v-for="e in report.equipment" :key="e.name">
                            <th>{{ e.name }}<span class="equipment-product">{{ e.product }}</span></th>
                            <td class="num">{{ e.produced }}</td>
                            <td class="num">{{ e.reject }}</td>
                            <td><span class="status-dot" :class="e.tone"><i class="status-dot-mark" />{{ e.state }}</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </section>

                    <section class="improvements">
                      <span class="improvements-toggle">
                        <svg class="improvements-chevron" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" stroke-width="1.6" /></svg>
                        <span class="improvements-heading">Para mejorar este análisis</span>
                        <span class="argus-count">2</span>
                      </span>
                    </section>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ================= CHAT DE ARGUS ================= -->
      <div class="chat-layer">
        <div class="chat-backdrop" />
        <aside class="chat">
          <header class="chat-head">
            <b>Argus Chat</b>
            <span class="chat-icons">
              <i><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></i>
              <i><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></i>
              <i><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></i>
            </span>
          </header>
          <div class="chat-body">
            <div class="chat-msg">¿Cómo viene la producción de hoy?</div>
            <div class="chat-pills">
              <span class="chat-pill"><i class="spin" />Datos de métricas</span>
              <span class="chat-pill"><i class="spin" />Estado de PLCs</span>
            </div>
            <div class="chat-answer">
              <p>Hoy la planta lleva <b>5.074 unidades</b>, un 6 % más que ayer a esta hora. La envasadora 1 es la que más produjo; la llenadora está detenida desde las 09:12.</p>
              <div class="chat-kpi">
                <div><span>Producción de hoy</span><b>5.074</b><small>u</small></div>
                <div><span>Equipos en línea</span><b>4</b><small>/ 4</small></div>
                <div><span>Alarmas críticas</span><b class="crit"><i />1</b></div>
              </div>
              <div class="chat-chart">
                <span class="cc-title">Unidades por equipo, hoy</span>
                <div v-for="b in chatBars" :key="b.label" class="chat-bar">
                  <span>{{ b.label }}</span>
                  <span class="chat-bar-track"><i class="chat-bar-fill" :style="{ width: `${(b.value / 2224) * 100}%` }" /></span>
                  <b class="num">{{ b.value.toLocaleString('es-AR') }}</b>
                </div>
              </div>
              <p class="chat-sugs"><em>¿Por qué está detenida la llenadora?</em><em>¿Qué alarmas hubo hoy?</em></p>
            </div>
          </div>
          <footer class="composer">
            <span class="composer-input"><span class="value" /><span class="placeholder">Preguntale a Argus...</span><i class="caret" /></span>
            <span class="composer-send"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg></span>
          </footer>
        </aside>
      </div>

      <!-- Cursor -->
      <svg class="cursor" viewBox="0 0 24 24"><path d="M4 2l15 10.5-6.6 1.3 3.8 7.4-2.9 1.4-3.8-7.4L4 20z" /></svg>
    </div>
  </div>
</template>

<style scoped>
.tour {
  position: relative;
  width: 100%;
  overflow: hidden;
  /* Tokens de la plataforma, tema claro (globals.css :root[data-theme="light"]) */
  --brand: #0a6c78; /* --accent-text: el cian de marca legible sobre blanco */
  --brand-rgb: 175, 227, 232;
  --accent-soft: #eef7f8;
  --accent-border: rgba(175, 227, 232, 0.35);
  --t1: #0d1416;
  --t2: #3a4a4d;
  --t3: #6a7578;
  --root-bg: #ffffff;
  --elev: #ffffff;
  --hair: #e7ebec;
  --panel: #ffffff;
  --raised: #f6f8f8;
  --b-med: #c9d0d2;
  --b-def: #e6eaeb;
  --ok: #12a26f;
  --warn: #d99a06;
  --crit: #dc3b3b;
  --danger: #dc2626;
  --high: #c2410c;
  --medium: #a16207;

  /* Los mismos nombres que globals.css, para pegar el CSS de los componentes tal cual */
  --text-primary: #0d1416;
  --text-secondary: #3a4a4d;
  --text-muted: #6a7578;
  --accent-text: #0a6c78;
  --bg-card: #ffffff;
  --bg-elevated: #ffffff;
  --bg-card-active: #eceff1;
  --border-medium: #c9d0d2;
  --border-strong: #c9d0d2;
  --border-control: #8b9699;
  --border-solid-hover: #d0d5d7;
  --glass-border-strong: #d3d8da;
  --hairline: #e7ebec;
  --surface-panel: #ffffff;
  --surface-raised: #f6f8f8;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --radius-pill: 999px;
  --shadow-md: none;
  --shadow-lg: none;
  --transition-fast: 0.15s ease;
  --transition-slow: 0.3s ease;
  --color-success-text: #0f8a5f;
  --color-danger-text: #c0392b;
  --color-warning-text: #9a6b00;
  --color-success-rgb: 52, 211, 153;
  --color-warning-rgb: 251, 191, 36;
  --color-info-rgb: 96, 165, 250;
  --color-danger-rgb: 248, 113, 113;
  --color-success: #34d399;
  --value-success: #047857;
  --value-warning: #b45309;
  --value-info: #1d4ed8;
  --dot-ok: #12a26f;
  --dot-warning: #d99a06;
  --dot-critical: #dc3b3b;
  --dot-info: #2f7fe0;
  --dot-neutral: #9aa4a7;
  --chart-state-alert: #dc2626;
  --chart-state-warning: #f59e0b;
  --chart-state-ok: #10b981;
  --chart-state-inactive: #e3e7e9;
}

.stage {
  position: absolute;
  left: 0;
  top: 0;
  width: 1280px;
  height: 800px;
  transform-origin: 0 0;
  overflow: hidden;
  background: var(--root-bg);
  color: var(--t1);
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

/* Sin márgenes heredados del sitio que lo aloja: cada medida la pone este archivo */
.stage :where(h1, h2, h3, p, ul, ol, figure) {
  margin: 0;
  padding: 0;
}

svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

em {
  font-style: normal;
}

.num {
  font-variant-numeric: tabular-nums;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand);
}

.eyebrow i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ================= LOGIN ================= */
.login {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 50.7% 1fr;
  z-index: 3;
  background: #f7f8fa;
  color: #0b1117;
}

.login-art {
  position: relative;
  background-color: #e9ebf0;
  background-repeat: no-repeat;
  /* Mismo encuadre que la app: el pliegue del arte cae al 43 % del panel */
  background-size: auto 100%;
  background-position: -321px 0;
}

.wordmark {
  position: absolute;
  top: 56px;
  left: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: 0.06em;
}

.wordmark svg {
  width: 40px;
  height: 40px;
  fill: #0b1117;
  stroke: none;
}

.tagline {
  position: absolute;
  top: 35.4%;
  left: 56px;
  right: 56px;
}

.tag-title {
  font-size: 58px;
  font-weight: 600;
  line-height: 0.96;
  letter-spacing: -0.045em;
}

.tag-title span {
  display: block;
}

.tag-title .accent {
  color: #285879;
}

.tag-sub {
  margin-top: 22px;
  font-size: 19px;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: #4f5967;
}

.login-panel {
  position: relative;
  display: flex;
  flex-direction: column;
}

.secure-access {
  position: absolute;
  top: 60px;
  right: 46px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #5c6371;
}

.secure-access svg {
  width: 20px;
  height: 20px;
  stroke-width: 1.8;
  color: #33414e;
}

.form-block {
  width: 400px;
  margin: 168px auto 0;
}

.form-block h1 {
  font-size: 44px;
  font-weight: 600;
  line-height: 50px;
  letter-spacing: -0.045em;
}

.form-sub {
  margin-top: 6px;
  font-size: 16px;
  color: #5c6371;
}

.login-field {
  display: block;
  margin-top: 18px;
}

.form-sub + .login-field {
  margin-top: 30px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.input {
  position: relative;
  display: flex;
  align-items: center;
  height: 50px;
  padding-left: 58px;
  border-radius: 10px;
  border: 1px solid #80868f;
  background: #fbfbfc;
  font-size: 15.5px;
  outline: 3px solid transparent;
  transition: border-color 0.16s ease, outline-color 0.16s ease;
}

.input svg {
  position: absolute;
  left: 20px;
  width: 20px;
  height: 20px;
  stroke-width: 1.7;
  color: #2a3540;
}

.is-focus .input {
  border-color: #2563c9;
  outline-color: rgba(37, 99, 201, 0.2);
}

.placeholder {
  color: #697080;
}

.value:not(:empty) + .placeholder {
  display: none;
}

.caret {
  display: none;
  width: 1px;
  height: 18px;
  margin-left: 1px;
  background: #0b1117;
  animation: blink 1s steps(1) infinite;
}

.is-focus .caret {
  display: block;
}

.value:empty ~ .caret {
  order: -1;
}

.login-submit {
  margin-top: 22px;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 10px;
  background: #10181d;
  color: #ffffff;
  font: inherit;
  font-size: 16.5px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.btn-arrow {
  width: 17px;
  height: 17px;
  stroke-width: 1.8;
}

.btn-spin {
  display: none;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  opacity: 0.8;
  animation: spin 0.8s linear infinite;
}

.login-submit.is-busy .btn-spin {
  display: block;
}

.login-submit.is-busy .btn-arrow {
  display: none;
}

.secure-note {
  margin-top: 26px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: #5c6371;
}

.secure-note svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.7;
  color: #1a73a8;
}

.login-foot {
  margin: auto 46px 52px 100px;
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 12.5px;
  color: #5f6673;
  white-space: nowrap;
}

.login-foot b {
  font-weight: 600;
  color: #0b1117;
}

.foot-line {
  flex: 1;
  height: 1px;
  background: #cdd2d9;
}

/* ================= APP ================= */
.app {
  position: absolute;
  inset: 0;
  background: #ffffff;
  visibility: hidden;
}

.sidebar {
  position: absolute;
  top: 14px;
  left: 14px;
  bottom: 14px;
  width: 208px;
  padding: 12px 8px;
  border-radius: 22px;
  border: 1px solid var(--b-med);
  background: #ffffff;
}

.nav-item {
  height: 42px;
  margin-bottom: 4px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--t2);
  transition: background 0.3s ease, color 0.3s ease;
}

.nav-item svg {
  width: 20px;
  height: 20px;
}

.nav-item.is-active {
  background: #d6eef1;
  color: #0d4a52;
}

.account {
  position: absolute;
  top: 26px;
  right: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

.avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
}

.who {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.who b {
  font-size: 13px;
  font-weight: 600;
}

.who small {
  font-size: 12px;
  color: var(--t3);
}

.view {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 236px;
  padding: 24px 40px 0 18px;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.35s ease, visibility 0s linear 0.35s;
}

.view.is-on {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.35s ease;
}

.page-head {
  position: relative;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--hair);
}

.page-head h2 {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 600;
  line-height: 36px;
  letter-spacing: -0.025em;
}

.page-sub {
  font-size: 13px;
  color: var(--t3);
}

.panel {
  border: 1px solid var(--hair);
  border-radius: 16px;
  background: var(--panel);
}

/* KPI strip */
.kpis {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--hair);
  border-radius: 16px;
  background: var(--panel);
}

.kpis > div {
  padding: 16px 20px;
}

.kpis > div + div {
  border-left: 1px solid var(--hair);
}

.kpis span {
  font-size: 13px;
  font-weight: 500;
  color: var(--t2);
}

.kpis b {
  display: block;
  margin-top: 2px;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.kpis b em {
  font-style: normal;
}

.kpis b small {
  font-size: 16px;
  color: var(--t3);
}

.kpis b.word {
  font-size: 22px;
  line-height: 42px;
}

.kpis b.danger {
  color: #b91c1c;
}

.kpis p {
  font-size: 12px;
  color: var(--t3);
}

/* Status dot */
.dot-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--t2);
}

.dot-label i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dot, var(--t3));
  outline: 3px solid color-mix(in srgb, var(--dot, var(--t3)) 18%, transparent);
}

.ok {
  --dot: var(--ok);
}

.warning {
  --dot: var(--warn);
}

.critical {
  --dot: var(--crit);
}

/* Tabla de activos */
.table {
  margin-top: 20px;
}

.plant-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.plant-head b {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.plant-head small {
  font-size: 12px;
  color: var(--t3);
}

.plant-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--raised);
  color: var(--brand);
}

.plant-icon svg {
  width: 18px;
  height: 18px;
}

.cols,
.asset-row {
  display: grid;
  grid-template-columns: 2.2fr 1.2fr 1fr 1fr 1fr 40px;
  align-items: center;
  padding: 0 20px;
}

.cols {
  height: 36px;
  border-top: 1px solid var(--hair);
  font-size: 12px;
  color: var(--t3);
}

.r {
  text-align: right;
  padding-right: 24px;
}

.asset-row {
  min-height: 64px;
  border-top: 1px solid var(--hair);
  transition: background 0.25s ease;
}

.asset-row.is-hover {
  background: var(--raised);
}

.asset-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-name b {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.asset-name small {
  font-size: 12px;
  color: var(--t3);
}

.conn {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ok);
  animation: pulse 2.4s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    box-shadow: 0 0 0 5px rgba(18, 162, 111, 0.15);
  }
}

.asset-row .num {
  font-size: 14px;
  font-weight: 600;
}

.pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.pill.danger {
  background: rgba(248, 113, 113, 0.14);
  color: #c0392b;
}

.pill.warning {
  background: rgba(251, 191, 36, 0.16);
  color: #9a6b00;
}

.muted {
  font-size: 12px;
  color: var(--t3);
}

.chev svg {
  width: 16px;
  height: 16px;
  color: var(--t3);
}

/* ===== Tablero (DynamicDashboard) y widgets reales (components/widgets), CSS tal cual ===== */
.widgets {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 70px;
  gap: 1rem;
}

.cell {
  min-width: 0;
  min-height: 0;
}

.ec {
  width: 100%;
  height: 100%;
}

/* NumericCounter.vue */
.numeric-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 16px;
  padding: 1.25rem 1rem 1rem;
  width: 100%;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.counter-label {
  font-size: 0.95rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
  text-align: center;
}
.counter-value {
  font-size: 2.5rem;
  font-weight: 800;
  font-family: 'Monaco', 'Courier New', monospace;
  letter-spacing: -1px;
  line-height: 1;
  color: var(--text-primary);
}
.counter-unit {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 0.3px;
}
.numeric-counter.color-green {
  border-color: rgba(var(--color-success-rgb), 0.45);
}
.numeric-counter.color-green .counter-value {
  color: var(--color-success);
}
.numeric-counter.color-yellow {
  border-color: rgba(var(--color-warning-rgb), 0.45);
}
.numeric-counter.color-yellow .counter-value {
  color: var(--value-warning);
}

/* GaugeChart.vue */
.gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 16px;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
}
.gauge-title {
  position: relative;
  z-index: 1;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
  text-align: center;
  width: 100%;
}
.gauge-chart {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
}

/* StatusLight.vue */
.status-light-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  height: 100%;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 1rem;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
}
.light-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
  text-align: center;
}
.status-light {
  width: 84px;
  aspect-ratio: 1 / 1;
  height: auto;
  border-radius: 999px;
}
.status-light.green {
  background: var(--color-success);
}
.status-light.red {
  background: #ef4444;
}
.status-light.blue {
  background: #60a5fa;
}
.status-light.yellow {
  background: #fbbf24;
}
/* Light: apagadas en un tinte pálido del mismo color, opaco */
.status-light.red.inactive {
  background: rgba(var(--color-danger-rgb), 0.22);
}
.status-light.green.inactive {
  background: rgba(var(--color-success-rgb), 0.22);
}
.status-light.yellow.inactive {
  background: #78350f;
  opacity: 0.4;
}
.status-light.blue.inactive {
  background: rgba(var(--color-info-rgb), 0.22);
}

/* BaseChartWidget.vue */
.chart-widget-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  padding: 1rem;
}
.chart-widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
}
.chart-widget-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  text-align: left;
}
.chart-widget-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.status-time {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.status-badge {
  font-size: 0.65rem;
  color: var(--text-muted);
  border: 1px solid var(--border-solid-hover);
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-pill);
}
.chart-scroll-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  min-width: 0;
  width: 100%;
}

/* StateTimelineWidget.vue */
.state-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-width: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  padding: 1rem;
}
.state-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}
.state-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  white-space: nowrap;
}
.state-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.state-badge {
  font-size: 0.65rem;
  color: var(--text-muted);
  border: 1px solid var(--border-solid-hover);
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-pill);
}
.state-time {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.state-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.state-rows {
  display: flex;
  flex-direction: column;
}
.state-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.state-row-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  height: 16px;
  min-width: 0;
}
.state-row-chip {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.state-row-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}
.state-row-summary {
  margin-left: auto;
  padding-left: 0.75rem;
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.state-band {
  position: relative;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: var(--chart-state-inactive);
}
.band {
  position: absolute;
  top: 0;
  bottom: 0;
  transform-origin: left;
}
.state-axis {
  height: 24px;
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 11px;
  color: #5a6568;
}

/* Operations Hub */
.tabs {
  margin: 28px 0 18px;
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--hair);
  font-size: 14px;
  font-weight: 500;
  color: var(--t3);
}

.tabs span {
  padding-bottom: 12px;
}

.tabs .is-active {
  color: var(--t1);
  border-bottom: 2px solid var(--t1);
}

.count {
  margin-left: 4px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--raised);
  font-size: 11px;
}

.count.danger {
  background: rgba(248, 113, 113, 0.14);
  color: #b91c1c;
}

.alarms {
  overflow: hidden;
}

.alarm-row {
  display: grid;
  grid-template-columns: 24px 1fr 140px 210px;
  align-items: center;
  height: 84px;
  padding: 0 20px;
  border-bottom: 1px solid var(--hair);
  overflow: hidden;
}

.alarm-row:last-child {
  border-bottom: 0;
}

.alarm-row.resolved {
  opacity: 0.55;
}

.sev {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.sev.critical {
  background: var(--danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
}

.sev.high {
  background: var(--high);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.18);
}

.sev.medium {
  background: var(--medium);
  box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.18);
}

.alarm-main b {
  display: block;
  font-size: 14px;
  font-weight: 500;
}

.alarm-main small {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--t3);
}

.sev-text.critical {
  color: #b91c1c;
}

.sev-text.high {
  color: #9a3412;
}

.sev-text.medium {
  color: #854d0e;
}

.chip {
  padding: 1px 8px;
  border-radius: 6px;
  background: var(--raised);
  font-size: 12px;
  color: var(--t2);
}

.alarm-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--t2);
}

.mark {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--t2);
}

.alarm-row.new .alarm-status {
  font-weight: 600;
  color: var(--t1);
}

.alarm-row.new .mark {
  background: var(--t1);
  box-shadow: none;
}

.alarm-row.new.is-ack .alarm-status {
  font-weight: 400;
  color: var(--t2);
}

.alarm-row.new.is-ack .mark {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--t2);
}

.alarm-row.new.is-ack .btn-ack {
  opacity: 0.35;
}

.alarm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-act {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--b-med);
  font-size: 13px;
  font-weight: 500;
  color: var(--t2);
  white-space: nowrap;
  transition: opacity 0.3s ease;
}

/* ===== Argus (views/AIInsights, components/argus/*), CSS tal cual ===== */
.view[data-view='ia'],
.view[data-view='mediciones'] {
  overflow: hidden;
}

.ia-scroll {
  will-change: transform;
}

.btn-ask {
  position: absolute;
  right: 0;
  bottom: 22px;
  height: 36px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  background: #0d1416;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

/* StatusDot.vue */
.status-dot {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}
.status-dot-mark {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dot, var(--dot-neutral));
  outline: 3px solid color-mix(in srgb, var(--dot, var(--dot-neutral)) 18%, transparent);
}
.status-dot.ok {
  --dot: var(--dot-ok);
}
.status-dot.warning {
  --dot: var(--dot-warning);
}
.status-dot.critical {
  --dot: var(--dot-critical);
}
.status-dot.info {
  --dot: var(--dot-info);
}

/* argus-shared.css */
.argus-screen .argus-panel {
  border-radius: 16px;
  border: 1px solid var(--hairline);
  background: var(--surface-panel);
}
.argus-screen .argus-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px 12px;
}
.argus-screen .argus-section-title {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--text-primary);
}
.argus-screen .argus-count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--surface-raised);
  font-size: 12px;
  line-height: 20px;
  font-weight: 500;
  text-align: center;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.argus-screen .argus-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 20px;
}
.argus-screen .argus-table th,
.argus-screen .argus-table td {
  padding: 12px 6px;
  border-top: 1px solid var(--hairline);
  text-align: left;
  vertical-align: middle;
  color: var(--text-secondary);
}
.argus-screen .argus-table th:first-child,
.argus-screen .argus-table td:first-child {
  padding-left: 20px;
}
.argus-screen .argus-table th:last-child,
.argus-screen .argus-table td:last-child {
  padding-right: 20px;
}
.argus-screen .argus-table thead th {
  padding-top: 8px;
  padding-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}
.argus-screen .argus-table tbody th {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}
.argus-screen .argus-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.equipment-product {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  color: var(--text-muted);
}

/* ArgusReportView.vue */
.argus-report {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.argus-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 368px);
  gap: 24px;
}
.argus-main {
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
}
.argus-side {
  min-width: 0;
}
.argus-side-sticky {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.argus-findings {
  list-style: none;
  margin: 0;
  padding: 0;
}
.argus-findings > li {
  border-top: 1px solid var(--hairline);
}

/* ArgusHeadline.vue */
.headline {
  padding: 8px 0 0;
  max-width: 880px;
}
.headline-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}
.headline-divider {
  width: 1px;
  height: 12px;
  background: var(--hairline);
}
.headline-source {
  font-size: 13px;
  line-height: 20px;
  color: var(--text-muted);
}
.headline-text {
  margin: 12px 0 0;
  font-size: 21px;
  line-height: 1.45;
  font-weight: 450;
  letter-spacing: -0.012em;
  color: var(--text-primary);
  text-wrap: pretty;
}

/* ArgusKpiStrip.vue */
.kpi-strip {
  overflow: hidden;
}
.kpi-strip-list {
  list-style: none;
  margin: -1px 0 0 -1px;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
}
.kpi-tile {
  flex: 1 1 calc(100% / var(--kpi-cols) - 1px);
  min-width: 150px;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 12px;
  border-left: 1px solid var(--hairline);
  border-top: 1px solid var(--hairline);
}
.kpi-tile-label {
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.kpi-tile-value {
  margin: 8px 0 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  color: var(--text-primary);
  white-space: nowrap;
}
.kpi-tile-number {
  font-size: 28px;
  line-height: 32px;
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.kpi-tile-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}
.kpi-tile-meta {
  margin: 8px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 20px;
  color: var(--text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.kpi-tile-delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--surface-raised);
  font-weight: 600;
  color: var(--text-secondary);
}
.kpi-tile-arrow {
  font-size: 8px;
}
.kpi-tile-delta.is-better {
  color: var(--color-success-text);
}
.kpi-tile-delta.is-worse {
  color: var(--color-danger-text);
}
.kpi-tile-breach {
  margin: 0;
  font-size: 12px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-secondary);
}
.kpi-tile-breach-dot {
  display: inline-block;
  vertical-align: 1px;
  width: 6px;
  height: 6px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--dot-critical);
}
.kpi-tile-goal {
  white-space: nowrap;
  color: var(--text-muted);
}
.kpi-tile-spark {
  flex: none;
  height: 36px;
  margin-top: auto;
  padding-top: 12px;
  box-sizing: content-box;
}

/* ArgusFindingCard.vue */
.finding {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 0 16px;
  padding: 24px 24px 24px 16px;
}
.finding-number {
  font-size: 28px;
  line-height: 28px;
  font-weight: 300;
  letter-spacing: -0.03em;
  text-align: right;
  color: var(--text-muted);
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.finding-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.finding-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.finding-title {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}
.finding-severity {
  flex: none;
  margin-top: 2px;
}
.finding-chips {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.finding-chip {
  padding: 0 8px;
  border-radius: 6px;
  background: var(--surface-raised);
  font-size: 12px;
  line-height: 20px;
  color: var(--text-secondary);
}
.finding-text {
  margin: 12px 0 0;
  max-width: 72ch;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.finding-evidence {
  margin-top: 16px;
  padding: 16px 16px 12px;
  border-radius: 12px;
  border: 1px solid var(--hairline);
}
.finding-evidence-title {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: var(--text-muted);
}
.finding-actions {
  margin-top: 16px;
  border-top: 1px solid var(--hairline);
}
.finding-actions-title {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: var(--text-muted);
}
.finding-actions-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.finding-action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  min-height: 40px;
  padding: 4px 0;
}
.finding-action-text {
  flex: 1 1 240px;
  min-width: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
}
.finding-why {
  margin-top: 8px;
}
.finding-why-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: -4px;
  padding: 4px;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--text-muted);
}
.finding-why-chevron {
  width: 14px;
  height: 14px;
}

/* ArgusChart.vue (leyenda del grande) */
.argus-chart-caption {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.argus-chart-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.argus-chart-swatch {
  flex: none;
  display: inline-block;
}
.argus-chart-swatch--goal {
  width: 14px;
  height: 0;
  border-top: 1.5px dashed rgba(220, 59, 59, 0.75);
}
.argus-chart-swatch--window {
  width: 12px;
  height: 8px;
  border-radius: 2px;
  background: rgba(217, 154, 6, 0.12);
  box-shadow: inset 0 0 0 1px rgba(217, 154, 6, 0.12);
}

/* ArgusFindingFeedback.vue */
.feedback {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--hairline);
}
.feedback-question {
  font-size: 13px;
  line-height: 20px;
  color: var(--text-muted);
}
.feedback-buttons {
  display: inline-flex;
  gap: 4px;
}
.feedback-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--hairline);
  border-radius: 8px;
  color: var(--text-muted);
  transition: color var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
}
.feedback-button svg {
  width: 16px;
  height: 16px;
}
.feedback-button.is-on {
  color: var(--accent-text);
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

/* ArgusActionList.vue */
.actions-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.actions-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--hairline);
}
.actions-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.actions-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.actions-text {
  margin: 2px 0 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
}
.actions-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.actions-foot .action-button {
  margin-left: auto;
}
.actions-refs {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* BaseButton.vue: glass, tono brand, sm */
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--accent-border);
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-text);
  white-space: nowrap;
}

/* ArgusImprovements.vue */
.improvements {
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}
.improvements-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
  color: var(--text-secondary);
}
.improvements-chevron {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}
.improvements-heading {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
}

/* ================= CHAT ================= */
.chat-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  visibility: hidden;
}

.chat-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(13, 20, 22, 0.25);
  visibility: hidden;
}

.chat {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-left: 1px solid #e3e7e9;
}

.chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--hair);
  font-size: 15px;
}

.chat-head b {
  font-weight: 600;
}

.chat-icons {
  display: flex;
  gap: 6px;
}

.chat-icons i {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--t2);
}

.chat-icons svg {
  width: 16px;
  height: 16px;
}

.chat-body {
  flex: 1;
  padding: 22px 20px;
  overflow: hidden;
}

.chat-msg {
  margin-left: auto;
  width: fit-content;
  max-width: 88%;
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  font-size: 14px;
  line-height: 22px;
}

.chat-pills {
  display: flex;
  gap: 6px;
  margin-top: 16px;
}

.chat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 100px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  font-size: 11.5px;
  color: var(--brand);
}

.spin {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid var(--accent-border);
  border-top-color: var(--brand);
  animation: spin 0.8s linear infinite;
}

/* Al terminar, el spinner pasa a ser un tilde */
.chat-pill.is-done .spin {
  border: 0;
  animation: none;
  width: 9px;
  height: 5px;
  margin-top: -3px;
  border-left: 1.5px solid var(--brand);
  border-bottom: 1.5px solid var(--brand);
  border-radius: 0;
  transform: rotate(-45deg);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chat-answer {
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--t1);
}

.chat-answer > * + * {
  margin-top: 14px;
}

.chat-answer b {
  font-weight: 600;
}

.chat-kpi {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--hair);
  border-radius: 12px;
}

.chat-kpi > div {
  padding: 10px 12px;
}

.chat-kpi > div + div {
  border-left: 1px solid var(--hair);
}

.chat-kpi span {
  display: block;
  font-size: 11.5px;
  color: var(--t2);
}

.chat-kpi b {
  font-size: 20px;
}

.chat-kpi small {
  margin-left: 4px;
  font-size: 12px;
  color: var(--t3);
}

.chat-kpi .crit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.chat-kpi .crit i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--crit);
}

.chat-chart {
  padding: 12px 14px;
  border: 1px solid var(--hair);
  border-radius: 12px;
}

.cc-title {
  font-size: 12px;
  color: var(--t2);
}

.chat-bar {
  display: grid;
  grid-template-columns: 96px 1fr 48px;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--t2);
}

.chat-bar b {
  text-align: right;
  font-weight: 500;
  color: var(--t1);
}

.chat-bar-track {
  height: 8px;
}

.chat-bar-fill {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: #3fa9b5;
  transform-origin: left;
}

.chat-sugs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chat-sugs em {
  padding: 5px 12px;
  border: 1px solid var(--hair);
  border-radius: 999px;
  font-size: 12.5px;
  color: var(--brand);
}

.composer {
  display: flex;
  gap: 8px;
  padding: 14px 20px 20px;
  border-top: 1px solid var(--hair);
}

.composer-input {
  flex: 1;
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #8b9699;
  background: #ffffff;
  font-size: 13.5px;
}

.composer-input .caret {
  display: block;
  height: 16px;
}

.composer-send {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent-border);
  color: var(--brand);
}

.composer-send svg {
  width: 17px;
  height: 17px;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Cursor */
.cursor {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  width: 22px;
  height: 22px;
  margin: -3px 0 0 -5px;
  fill: #0d1416;
  stroke: #ffffff;
  stroke-width: 1.4;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
  transform-origin: 5px 3px;
  visibility: hidden;
}
</style>
