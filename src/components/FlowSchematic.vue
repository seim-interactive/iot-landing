<!--
  "Cómo funciona": esquema de la arquitectura como lo dibujaría un equipo de producto.
  Seis módulos con su propia interfaz (planta → gateway → nube → datos → dashboards → IA)
  unidos por un bus que se enciende a medida que el dato avanza con el scroll.

  La posición continua llega por render(pos) (0 = PLCs, 5 = IA) sin pasar por la
  reactividad de Vue: solo se escriben el trazo del bus y una variable CSS.
-->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  steps: { type: Array, required: true },
  active: { type: Number, default: 0 },
})
const emit = defineEmits(['select'])

// Centros de los módulos en el viewBox 520×600: la serpiente recorre 1→2, baja, 3←4…
const CENTERS = [
  [120, 90],
  [400, 90],
  [400, 300],
  [120, 300],
  [120, 510],
  [400, 510],
]
const BUS = 'M' + CENTERS.map(([x, y]) => `${x},${y}`).join(' L')
const LENGTHS = CENTERS.slice(1).map(([x, y], i) => Math.hypot(x - CENTERS[i][0], y - CENTERS[i][1]))
const TOTAL = LENGTHS.reduce((a, b) => a + b, 0)

// Tramos visibles entre módulos (el resto del bus queda debajo de las tarjetas)
const LINKS = [
  'M240,90 H280',
  'M400,180 V210',
  'M280,300 H240',
  'M120,390 V420',
  'M240,510 H280',
]

const root = ref(null)
const lit = ref(null)
const head = ref(null)

function pointAt(len) {
  let rest = len
  for (let i = 0; i < LENGTHS.length; i++) {
    if (rest <= LENGTHS[i] || i === LENGTHS.length - 1) {
      const t = Math.min(1, rest / LENGTHS[i])
      const [x0, y0] = CENTERS[i]
      const [x1, y1] = CENTERS[i + 1]
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]
    }
    rest -= LENGTHS[i]
  }
  return CENTERS.at(-1)
}

function render(pos) {
  const i = Math.min(Math.floor(pos), LENGTHS.length - 1)
  const len = LENGTHS.slice(0, i).reduce((a, b) => a + b, 0) + LENGTHS[i] * (pos - i)
  if (lit.value) lit.value.style.strokeDashoffset = String(TOTAL - len)
  if (head.value) {
    const [x, y] = pointAt(len)
    head.value.setAttribute('cx', x.toFixed(1))
    head.value.setAttribute('cy', y.toFixed(1))
  }
  root.value?.style.setProperty('--pos', (pos / (CENTERS.length - 1)).toFixed(4))
}

defineExpose({ render })

const state = (i) => ({
  'is-active': props.active === i,
  'is-past': i < props.active,
  'is-next': i > props.active,
})

// Últimas lecturas que llegan a la plataforma de datos
const feed = [
  { key: 'linea1.produccion', value: '1.284', unit: 'u/h', ago: '1 s' },
  { key: 'envasado.temp', value: '72,4', unit: '°C', ago: '2 s' },
  { key: 'caldera.presion', value: '4,2', unit: 'bar', ago: '2 s' },
  { key: 'motor3.vibracion', value: '6,8', unit: 'mm/s', ago: '3 s' },
]

// Barras de ingesta (deterministas para que el prerender y el cliente coincidan)
const ingest = [38, 44, 41, 52, 47, 58, 55, 61, 49, 57, 66, 62, 70, 64, 72, 68, 77, 71, 80, 74, 83, 79, 86, 90]
</script>

<template>
  <div ref="root" class="schematic" :style="{ '--total': TOTAL }">
    <!-- Bus de datos -->
    <svg class="bus" viewBox="0 0 520 600" preserveAspectRatio="none">
      <path class="bus-base" :d="BUS" />
      <path ref="lit" class="bus-lit" :d="BUS" :style="{ strokeDasharray: TOTAL, strokeDashoffset: TOTAL }" />
      <path
        v-for="(d, k) in LINKS"
        :key="d"
        class="bus-flow"
        :class="{ 'is-on': k < active }"
        :d="d"
      />
      <circle ref="head" class="bus-head" r="3.2" :cx="CENTERS[0][0]" :cy="CENTERS[0][1]" />
    </svg>

    <!-- Riel compacto (mobile) -->
    <div class="rail" aria-hidden="true">
      <span class="rail-track"><span class="rail-fill" /></span>
      <button
        v-for="(s, i) in steps"
        :key="s.short"
        type="button"
        tabindex="-1"
        class="rail-dot"
        :class="state(i)"
        :style="{ '--i': i }"
        @click="emit('select', i)"
      />
    </div>

    <!-- 01 · PLCs -->
    <article class="mod" :class="state(0)" style="--x: 0; --y: 0" @click="emit('select', 0)">
      <header class="mod-head">
        <span class="mod-title">{{ steps[0].short }}</span>
        <span class="mod-meta">3 equipos</span>
      </header>
      <ul class="plc">
        <li>
          <i class="led" style="--d: 0s" />
          <span class="plc-name">S7-1500<em>Línea 1</em></span>
          <b class="num">1.284<small> u/h</small></b>
        </li>
        <li>
          <i class="led" style="--d: 0.7s" />
          <span class="plc-name">CompactLogix<em>Envasado</em></span>
          <b class="num">72,4<small> °C</small></b>
        </li>
        <li>
          <i class="led" style="--d: 1.3s" />
          <span class="plc-name">Modicon M221<em>Caldera</em></span>
          <b class="num">4,2<small> bar</small></b>
        </li>
      </ul>
    </article>

    <!-- 02 · Gateway -->
    <article class="mod" :class="state(1)" style="--x: 1; --y: 0" @click="emit('select', 1)">
      <header class="mod-head">
        <span class="mod-title">{{ steps[1].short }}</span>
        <span class="mod-meta pill"><i class="dot" />En línea</span>
      </header>
      <div class="chips">
        <span>OPC UA</span><span>Modbus TCP</span><span>MQTT</span>
      </div>
      <dl class="kv">
        <div><dt>Cifrado</dt><dd class="num">TLS 1.3</dd></div>
        <div><dt>Respaldo local</dt><dd class="num">72 h</dd></div>
        <div><dt>Latencia</dt><dd class="num">38 ms</dd></div>
      </dl>
    </article>

    <!-- 03 · Nube -->
    <article class="mod" :class="state(2)" style="--x: 1; --y: 1" @click="emit('select', 2)">
      <header class="mod-head">
        <span class="mod-title">{{ steps[2].short }}</span>
        <span class="mod-meta">Entorno privado</span>
      </header>
      <div class="ingest">
        <div class="big num">12,4<small> k</small></div>
        <div class="big-label">mensajes por segundo</div>
      </div>
      <div class="bars">
        <i v-for="(h, n) in ingest" :key="n" :style="{ '--h': h, '--n': n }" />
      </div>
      <div class="foot"><span>Disponibilidad</span><b class="num">99,95 %</b></div>
    </article>

    <!-- 04 · Datos -->
    <article class="mod" :class="state(3)" style="--x: 0; --y: 1" @click="emit('select', 3)">
      <header class="mod-head">
        <span class="mod-title">{{ steps[3].short }}</span>
        <span class="mod-meta pill"><i class="dot" />En vivo</span>
      </header>
      <!-- Lo que llega a la plataforma: cada variable con su último valor -->
      <table class="feed">
        <thead>
          <tr><th>Variable</th><th>Valor</th><th>Hace</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, n) in feed" :key="row.key" :style="{ '--n': n }">
            <td class="key">{{ row.key }}</td>
            <td class="num">{{ row.value }}<small>{{ row.unit }}</small></td>
            <td class="ago">{{ row.ago }}</td>
          </tr>
        </tbody>
      </table>
    </article>

    <!-- 05 · Dashboards -->
    <article class="mod" :class="state(4)" style="--x: 0; --y: 2" @click="emit('select', 4)">
      <header class="mod-head">
        <span class="mod-title">{{ steps[4].short }}</span>
        <span class="mod-meta">Turno mañana</span>
      </header>
      <div class="oee">
        <div>
          <div class="big num">83,9<small> %</small></div>
          <div class="big-label">OEE</div>
        </div>
        <svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path class="spark-fill" d="M0,30 C10,28 16,22 26,24 S42,14 52,17 S70,8 80,11 S94,5 100,6 V40 H0 Z" />
          <path class="spark-line" d="M0,30 C10,28 16,22 26,24 S42,14 52,17 S70,8 80,11 S94,5 100,6" />
        </svg>
      </div>
      <dl class="kpis">
        <div><dt>Disponib.</dt><dd class="num">92 %</dd></div>
        <div><dt>Rendim.</dt><dd class="num">95 %</dd></div>
        <div><dt>Calidad</dt><dd class="num">96 %</dd></div>
      </dl>
    </article>

    <!-- 06 · IA -->
    <article class="mod" :class="state(5)" style="--x: 1; --y: 2" @click="emit('select', 5)">
      <header class="mod-head">
        <span class="mod-title">{{ steps[5].short }}</span>
        <span class="mod-meta pill warn"><i class="dot" />Anomalía</span>
      </header>
      <div class="chart">
      <svg class="anomaly" viewBox="0 0 100 36" preserveAspectRatio="none">
        <path class="band" d="M0,14 C20,12 40,15 60,13 S90,12 100,13 V25 C80,26 60,24 40,26 S10,25 0,26 Z" />
        <path
          class="signal"
         
          d="M0,20 L6,18 L12,21 L18,19 L24,20 L30,18 L36,21 L42,19 L48,20 L54,18 L60,20 L66,19 L72,17 L76,9 L80,5 L84,11 L88,16 L94,18 L100,17"
        />
      </svg>
      <span class="hit" aria-hidden="true" />
      </div>
      <div class="alert">
        <b>Vibración fuera de patrón</b>
        <span>Motor 3 · revisar en 48 h</span>
      </div>
    </article>
  </div>
</template>

<style scoped>
.schematic {
  --u: calc(100cqw / 520);
  --warn: #f2b56b;
  position: relative;
  width: 100%;
  aspect-ratio: 520 / 600;
  font-family: var(--font);
  color: var(--text);
  user-select: none;
}

/* ---------- Bus ---------- */
.bus {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.bus path {
  fill: none;
  vector-effect: non-scaling-stroke;
}
.bus-base {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
}
.bus-lit {
  stroke: rgba(175, 227, 232, 0.55);
  stroke-width: 1;
}
.bus-flow {
  stroke: var(--accent);
  stroke-width: 1.5;
  stroke-dasharray: 2 9;
  opacity: 0;
  transition: opacity 0.6s ease;
  animation: flow 1.1s linear infinite;
}
.bus-flow.is-on {
  opacity: 0.9;
}
.bus-head {
  fill: #fff;
  filter: drop-shadow(0 0 6px rgba(175, 227, 232, 0.9));
}
@keyframes flow {
  to {
    stroke-dashoffset: -11;
  }
}

/* ---------- Módulo ---------- */
.mod {
  position: absolute;
  left: calc(var(--x) * 280 * var(--u));
  top: calc(var(--y) * 210 * var(--u));
  width: calc(240 * var(--u));
  height: calc(180 * var(--u));
  padding: calc(14 * var(--u)) calc(16 * var(--u));
  display: flex;
  flex-direction: column;
  gap: calc(12 * var(--u));
  border-radius: calc(14 * var(--u));
  background: linear-gradient(180deg, #111316 0%, #0a0b0d 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 calc(18 * var(--u)) calc(40 * var(--u)) calc(-18 * var(--u)) rgba(0, 0, 0, 0.9);
  font-size: calc(11 * var(--u));
  cursor: pointer;
  overflow: hidden;
  transition: opacity 0.6s ease, box-shadow 0.6s ease, transform 0.8s var(--ease-out);
}
/* Atenuado con un velo (no con opacity) para que el bus no se vea a través */
.mod::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #060607;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
}
.mod.is-next::after {
  opacity: 0.62;
}
.mod.is-past::after {
  opacity: 0.28;
}
.mod.is-active {
  box-shadow:
    inset 0 0 0 1px rgba(175, 227, 232, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 calc(4 * var(--u)) rgba(175, 227, 232, 0.06),
    0 calc(24 * var(--u)) calc(60 * var(--u)) calc(-20 * var(--u)) rgba(175, 227, 232, 0.22);
}

.mod-head {
  display: flex;
  align-items: center;
  gap: calc(8 * var(--u));
  padding-bottom: calc(10 * var(--u));
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.mod-title {
  font-size: calc(12.5 * var(--u));
  font-weight: 500;
  letter-spacing: -0.01em;
}
.mod-meta {
  margin-left: auto;
  font-size: calc(9.5 * var(--u));
  color: var(--text-3);
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: calc(5 * var(--u));
  padding: calc(2 * var(--u)) calc(7 * var(--u));
  border-radius: 99px;
  background: rgba(175, 227, 232, 0.08);
  color: var(--accent);
}
.pill .dot {
  width: calc(5 * var(--u));
  height: calc(5 * var(--u));
  border-radius: 50%;
  background: currentColor;
}
.pill.warn {
  background: rgba(242, 181, 107, 0.1);
  color: var(--warn);
}
.mod.is-active .pill .dot {
  animation: blink 1.6s ease-in-out infinite;
}

.num {
  font-variant-numeric: tabular-nums;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  letter-spacing: -0.02em;
}
.num small {
  font-size: 0.72em;
  color: var(--text-3);
  font-weight: 400;
}

/* PLCs */
.plc {
  display: grid;
  gap: calc(9 * var(--u));
  list-style: none;
  margin: 0;
  padding: 0;
}
.plc li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: calc(9 * var(--u));
}
.led {
  width: calc(6 * var(--u));
  height: calc(6 * var(--u));
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 calc(6 * var(--u)) rgba(74, 222, 128, 0.7);
  animation: blink 2s var(--d) ease-in-out infinite;
}
.plc-name {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  font-weight: 500;
}
.plc-name em {
  font-style: normal;
  font-weight: 400;
  font-size: calc(9.5 * var(--u));
  color: var(--text-3);
}
.plc .num {
  font-size: calc(12 * var(--u));
}

/* Gateway */
.chips {
  display: flex;
  gap: calc(5 * var(--u));
}
.chips span {
  padding: calc(4 * var(--u)) calc(7 * var(--u));
  border-radius: calc(6 * var(--u));
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
  font-variant-numeric: tabular-nums;
  font-size: calc(9 * var(--u));
  color: var(--text-2);
  white-space: nowrap;
}
.kv,
.kpis {
  margin: 0;
}
.kv {
  display: grid;
  gap: calc(7 * var(--u));
}
.kv div {
  display: flex;
  justify-content: space-between;
}
.kv dt,
.kpis dt,
.foot span,
.big-label {
  color: var(--text-3);
}
.kv dd,
.kpis dd {
  margin: 0;
}

/* Nube */
.ingest {
  display: flex;
  align-items: baseline;
  gap: calc(8 * var(--u));
}
.big {
  font-size: calc(26 * var(--u));
  line-height: 1;
}
.big-label {
  font-size: calc(9.5 * var(--u));
}
.bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: calc(2.5 * var(--u));
  min-height: 0;
}
.bars i {
  flex: 1;
  height: calc(var(--h) * 1%);
  border-radius: calc(1.5 * var(--u)) calc(1.5 * var(--u)) 0 0;
  background: linear-gradient(180deg, rgba(175, 227, 232, 0.75), rgba(175, 227, 232, 0.15));
  transform-origin: bottom;
  transform: scaleY(0.25);
  transition: transform 0.7s var(--ease-out) calc(var(--n) * 18ms);
}
.mod:not(.is-next) .bars i {
  transform: none;
}
.foot {
  display: flex;
  justify-content: space-between;
}

/* Datos */
.feed {
  width: 100%;
  border-collapse: collapse;
  font-size: calc(10.5 * var(--u));
}
.feed th {
  padding-bottom: calc(6 * var(--u));
  font-weight: 400;
  font-size: calc(9 * var(--u));
  color: var(--text-4);
  text-align: right;
}
.feed th:first-child,
.feed .key {
  text-align: left;
}
.feed td {
  padding: calc(5 * var(--u)) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: right;
  white-space: nowrap;
}
.feed .key {
  color: var(--text-2);
}
.feed .num {
  font-size: calc(11 * var(--u));
}
.feed .num small {
  margin-left: 0.3em;
}
.feed .ago {
  width: calc(34 * var(--u));
  color: var(--text-4);
  font-size: calc(9 * var(--u));
}
/* Las filas llegan una tras otra cuando el dato alcanza este módulo */
.feed tbody tr {
  opacity: 0.25;
  transition: opacity 0.5s ease calc(var(--n) * 0.12s);
}
.mod:not(.is-next) .feed tbody tr {
  opacity: 1;
}
/* La última fila (la vibración) es la que después marca la IA */
.feed tbody tr:last-child .num {
  color: var(--warn);
}

/* Dashboards */
.oee {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: end;
  gap: calc(14 * var(--u));
  flex: 1;
  min-height: 0;
}
.oee .big-label {
  margin-top: calc(5 * var(--u));
}
.spark {
  width: 100%;
  height: calc(46 * var(--u));
  overflow: visible;
}
.spark-fill {
  fill: rgba(175, 227, 232, 0.08);
}
.spark-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}
.spark,
.anomaly {
  clip-path: inset(-20% 100% -20% 0);
  transition: clip-path 1.3s var(--ease-out) 0.15s;
}
.mod:not(.is-next) .spark,
.mod:not(.is-next) .anomaly {
  clip-path: inset(-20% 0 -20% 0);
}
.kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: calc(8 * var(--u));
  padding-top: calc(10 * var(--u));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.kpis dt {
  font-size: calc(9 * var(--u));
}
.kpis dd {
  margin-top: calc(3 * var(--u));
  font-size: calc(12 * var(--u));
}

/* IA */
.chart {
  position: relative;
}
.anomaly {
  display: block;
  width: 100%;
  height: calc(62 * var(--u));
  overflow: visible;
}
.band {
  fill: rgba(175, 227, 232, 0.07);
}
.signal {
  fill: none;
  stroke: rgba(255, 255, 255, 0.55);
  stroke-width: 1.25;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.hit {
  position: absolute;
  /* pico de la señal: x 80/100, y 5/36 del gráfico */
  left: 80%;
  top: calc(5 / 36 * 100%);
  margin: calc(-6 * var(--u)) 0 0 calc(-6 * var(--u));
  width: calc(12 * var(--u));
  height: calc(12 * var(--u));
  border-radius: 50%;
  box-shadow: inset 0 0 0 calc(1.5 * var(--u)) var(--warn);
  opacity: 0;
  transform: scale(0.4);
  transition: opacity 0.4s ease 1s, transform 0.6s var(--ease-out) 1s;
}
.mod.is-active .hit {
  opacity: 1;
  transform: none;
  animation: ping 2.4s ease-out 1.6s infinite;
}
.alert {
  display: flex;
  flex-direction: column;
  gap: calc(3 * var(--u));
  padding-left: calc(9 * var(--u));
  border-left: calc(2 * var(--u)) solid var(--warn);
  line-height: 1.3;
}
.alert b {
  font-weight: 500;
}
.alert span {
  font-size: calc(9.5 * var(--u));
  color: var(--text-3);
}

@keyframes blink {
  50% {
    opacity: 0.35;
  }
}
@keyframes ping {
  0% {
    box-shadow: inset 0 0 0 calc(1.5 * var(--u)) var(--warn), 0 0 0 0 rgba(242, 181, 107, 0.5);
  }
  70%,
  100% {
    box-shadow: inset 0 0 0 calc(1.5 * var(--u)) var(--warn), 0 0 0 calc(10 * var(--u)) rgba(242, 181, 107, 0);
  }
}

/* ---------- Riel (solo compacto) ---------- */
.rail {
  display: none;
}

/* ---------- Compacto (mobile): riel arriba y un módulo a la vez ---------- */
@container (max-width: 460px) {
  .schematic {
    --u: calc(100cqw / 300);
    aspect-ratio: 300 / 214;
  }
  .bus {
    display: none;
  }
  .rail {
    position: absolute;
    left: calc(8 * var(--u));
    right: calc(8 * var(--u));
    top: 0;
    height: calc(14 * var(--u));
    display: block;
  }
  .rail-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
  }
  .rail-fill {
    position: absolute;
    inset: 0;
    background: var(--accent);
    transform-origin: 0 50%;
    transform: scaleX(var(--pos, 0));
  }
  .rail-dot {
    position: absolute;
    top: 50%;
    left: calc(var(--i) * 20%);
    width: calc(14 * var(--u));
    height: calc(14 * var(--u));
    margin: calc(-7 * var(--u)) 0 0 calc(-7 * var(--u));
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .rail-dot::before {
    content: '';
    position: absolute;
    inset: calc(4 * var(--u));
    border-radius: 50%;
    background: #000;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
    transition: background 0.4s ease, box-shadow 0.4s ease, transform 0.4s var(--ease-out);
  }
  .rail-dot.is-past::before {
    background: var(--accent);
    box-shadow: none;
  }
  .rail-dot.is-active::before {
    background: #fff;
    box-shadow: 0 0 0 calc(3 * var(--u)) rgba(175, 227, 232, 0.25);
    transform: scale(1.25);
  }

  .mod {
    left: 0;
    top: calc(30 * var(--u));
    width: 100%;
    height: calc(184 * var(--u));
    font-size: calc(11.5 * var(--u));
  }
  .mod.is-next,
  .mod.is-past {
    opacity: 0;
    visibility: hidden;
    transform: translateY(calc(8 * var(--u)));
    transition: opacity 0.35s ease, transform 0.6s var(--ease-out), visibility 0s linear 0.6s;
  }
  .mod.is-past {
    transform: translateY(calc(-8 * var(--u)));
  }
  .mod.is-active {
    transition: opacity 0.5s ease 0.08s, transform 0.75s var(--ease-out) 0.08s, visibility 0s;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bus-flow,
  .led,
  .pill .dot,
  .mod.is-active .hit {
    animation: none !important;
  }
  .mod,
  .bars i,
  .feed tbody tr,
  .spark,
  .anomaly,
  .hit {
    transition: none !important;
  }
}
</style>
