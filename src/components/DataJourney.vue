<!--
  «Cómo funciona», con los servicios adentro: se sigue un solo dato real, la
  temperatura de las mordazas de la Envasadora 1, desde el PLC hasta el hallazgo
  de Argus. Cada tramo dice qué pasa con el dato y qué hacemos nosotros ahí.

  Los tramos de planta (PLC, gateway, nube) son lecturas sobrias del dato en cada
  lugar. Los de la plataforma (tablero, alarma, Argus) son la plataforma real
  (PlatformPiece + journeyPieces.js). Un hilo de luz baja por la izquierda con el
  scroll y une todo.
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PlatformPiece from './PlatformPiece.vue'
import { JOURNEY_PIECES } from './journeyPieces'

gsap.registerPlugin(ScrollTrigger)

const STAGES = [
  {
    key: 'plc',
    place: 'En la máquina',
    title: 'El dato nace en el PLC',
    text: 'El PLC de la Envasadora 1 mide la temperatura de las mordazas: 155,3 °C. El dato ya existía; solo faltaba que alguien lo mirara.',
    service: 'Integración industrial',
    serviceText: 'Nos conectamos a tus PLCs y sistemas como están, sin detener la planta.',
  },
  {
    key: 'gateway',
    place: 'En la planta',
    title: 'Sale de la planta, cifrado',
    text: 'Un gateway lo lee cada segundo y lo manda por un canal cifrado. La red de la planta no queda expuesta.',
    service: 'Ciberseguridad OT',
    serviceText: 'Protegemos la planta y los datos de punta a punta.',
  },
  {
    key: 'nube',
    place: 'En la nube',
    title: 'Llega a tu nube privada',
    text: 'Se recibe, se valida y se guarda con su hora exacta, en una infraestructura solo para tu empresa.',
    service: 'Arquitectura cloud industrial',
    serviceText: 'Privada, segura y preparada para crecer con tu operación.',
  },
  {
    key: 'widget',
    place: 'En la plataforma',
    title: 'Aparece en el tablero',
    text: 'En menos de un segundo está en el gráfico de temperatura, con la historia del día al lado.',
    service: 'Dashboards y visualización',
    serviceText: 'Tableros pensados para cada máquina y para cada rol.',
  },
  {
    key: 'alarma',
    place: 'En la plataforma',
    title: 'Pasa el límite y avisa',
    text: 'Superó los 155 °C: la alarma llega con su equipo y su gravedad, y alguien de turno la reconoce.',
    service: 'Reglas a medida',
    serviceText: 'Qué es un desvío en tu proceso lo definimos con tu equipo.',
  },
  {
    key: 'argus',
    place: 'En Argus',
    title: 'Argus te dice qué hacer',
    text: 'Cruza la temperatura con la producción y los rechazos, y te marca qué revisar antes de que suban.',
    service: 'Inteligencia artificial aplicada',
    serviceText: 'Detección de anomalías y mantenimiento predictivo, con tus propios datos.',
  },
]

const ACROSS = [
  { title: 'Soporte y operación 24/7', text: 'Monitoreamos y operamos la plataforma todo el día, todos los días.' },
  { title: 'Consultoría Industria 4.0', text: 'Una hoja de ruta para que tu planta avance paso a paso, sin saltos al vacío.' },
]

// Las horas del recorrido: las de ahora, para que la lectura se vea viva.
const pad = (n, w = 2) => String(n).padStart(w, '0')
function clock(ms) {
  const t = new Date(ms)
  return `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}.${pad(t.getMilliseconds(), 3)}`
}
const base = Date.now() - 4000
const times = {
  read: clock(base + 212),
  received: clock(base + 218),
  validated: clock(base + 231),
  stored: clock(base + 240),
  sent: clock(base + 262),
}

const root = ref(null)
const rail = ref(null)
let observer = null
let ctx = null

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Cada tramo se enciende cuando entra en pantalla (y queda encendido).
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) entry.target.classList.add('is-in')
    },
    { rootMargin: '0px 0px -25% 0px', threshold: 0.1 }
  )
  root.value.querySelectorAll('.stage').forEach((el) => observer.observe(el))

  if (reduce) {
    rail.value.style.setProperty('--fill', '1')
    return
  }
  // El hilo de luz baja a la par del scroll.
  ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: root.value.querySelector('.stages'),
      start: 'top 65%',
      end: 'bottom 65%',
      scrub: 0.4,
      onUpdate: (self) => rail.value?.style.setProperty('--fill', self.progress.toFixed(4)),
    })
  }, root.value)
})

onUnmounted(() => {
  observer?.disconnect()
  ctx?.revert()
})
</script>

<template>
  <div ref="root" class="journey">
    <header class="journey-head" data-reveal>
      <h2 class="journey-title">Cómo funciona.<br><span>Un dato, de la máquina a la decisión.</span></h2>
      <p class="journey-lead">
        Seguimos una lectura real, la temperatura de las mordazas de la Envasadora 1, por todo el camino. En cada tramo, lo que hacemos nosotros.
      </p>
    </header>

    <div class="stages-wrap">
      <div ref="rail" class="rail" aria-hidden="true"><span class="rail-fill"></span></div>

      <ol class="stages">
        <li v-for="(stage, index) in STAGES" :key="stage.key" class="stage" :class="`stage--${stage.key}`">
          <span class="stage-dot" aria-hidden="true"></span>

          <div class="stage-copy">
            <p class="stage-place"><span class="stage-num">{{ String(index + 1).padStart(2, '0') }}</span>{{ stage.place }}</p>
            <h3 class="stage-title">{{ stage.title }}</h3>
            <p class="stage-text">{{ stage.text }}</p>
            <div class="stage-service">
              <p class="stage-service-label">Lo que hacemos</p>
              <p class="stage-service-title">{{ stage.service }}</p>
              <p class="stage-service-text">{{ stage.serviceText }}</p>
            </div>
          </div>

          <div class="stage-visual" aria-hidden="true">
            <!-- PLC: los registros que lee la integración -->
            <div v-if="stage.key === 'plc'" class="panel">
              <div class="panel-head"><span>Envasadora 1 · PLC</span><span>PROFINET</span></div>
              <table class="regs">
                <thead><tr><th>Dirección</th><th>Variable</th><th class="num">Valor</th></tr></thead>
                <tbody>
                  <tr class="line" style="--i: 0"><td>DB12.DBD36</td><td>velocidad_linea</td><td class="num">74,0 paq/min</td></tr>
                  <tr class="line is-key" style="--i: 1"><td>DB12.DBD40</td><td>temp_mordazas</td><td class="num">155,3 °C</td></tr>
                  <tr class="line" style="--i: 2"><td>DB12.DBD44</td><td>presion_aire</td><td class="num">5,46 bar</td></tr>
                </tbody>
              </table>
            </div>

            <!-- Gateway: el mensaje que sale de la planta -->
            <div v-else-if="stage.key === 'gateway'" class="panel">
              <div class="panel-head"><span>Gateway · Planta Pilar</span><span>Cifrado TLS</span></div>
              <dl class="msg">
                <div class="line" style="--i: 0"><dt>Tema</dt><dd class="code">factory/planta-demo/pilar/linea-1/envasadora-1/telemetry</dd></div>
                <div class="line is-key" style="--i: 1"><dt>Mensaje</dt><dd class="code">{ "temp_mordazas": 155.3, "ts": "{{ times.read }}" }</dd></div>
                <div class="line" style="--i: 2"><dt>Firma</dt><dd>Certificado propio del equipo</dd></div>
              </dl>
            </div>

            <!-- Nube: lo que pasa al llegar -->
            <div v-else-if="stage.key === 'nube'" class="panel">
              <div class="panel-head"><span>Nube privada · Planta Demo</span><span>En vivo</span></div>
              <ul class="log">
                <li class="line" style="--i: 0"><span class="log-time">{{ times.received }}</span><span>Recibido</span></li>
                <li class="line" style="--i: 1"><span class="log-time">{{ times.validated }}</span><span>Validado: rango y hora</span></li>
                <li class="line is-key" style="--i: 2"><span class="log-time">{{ times.stored }}</span><span>Guardado en la serie temp_mordazas</span></li>
                <li class="line" style="--i: 3"><span class="log-time">{{ times.sent }}</span><span>Enviado a los tableros</span></li>
              </ul>
            </div>

            <!-- Los tramos de la plataforma: la plataforma real -->
            <!-- Los tramos de la plataforma: la plataforma real, a lo sumo de su tamaño
                 real (más grande se vería pixelada) -->
            <div v-else class="panel panel--live" :style="{ maxWidth: `${JOURNEY_PIECES[stage.key].width + 56}px` }">
              <PlatformPiece :piece="JOURNEY_PIECES[stage.key]" ratio="4 / 3.2" />
            </div>
          </div>
        </li>
      </ol>
    </div>

    <div class="across">
      <p class="across-label">Y en todo el recorrido</p>
      <ul class="across-list">
        <li v-for="item in ACROSS" :key="item.title" class="across-item" data-reveal>
          <h3 class="across-title">{{ item.title }}</h3>
          <p class="across-text">{{ item.text }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.journey {
  --rule: rgba(255, 255, 255, 0.09);
  --muted: rgba(255, 255, 255, 0.45);
  --soft: rgba(255, 255, 255, 0.62);
}

/* ---------- Encabezado ---------- */
.journey-head {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  align-items: end;
  gap: 40px;
  margin-bottom: clamp(56px, 7vw, 104px);
}

.journey-title {
  font-size: clamp(30px, 3.6vw, 52px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.journey-title span {
  color: var(--muted);
}

.journey-lead {
  font-size: 16px;
  line-height: 1.55;
  color: var(--soft);
}

/* ---------- El hilo ---------- */
.stages-wrap {
  position: relative;
}

.rail {
  --fill: 0;
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 5px;
  width: 1px;
  background: var(--rule);
}

.rail-fill {
  position: absolute;
  inset: 0;
  transform: scaleY(var(--fill));
  transform-origin: top;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), #fff);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.35);
}

.stages {
  list-style: none;
  margin: 0;
  padding: 0;
}

.stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(32px, 5vw, 80px);
  align-items: center;
  padding: 0 0 clamp(72px, 9vw, 128px) 44px;
}

.stage:last-child {
  padding-bottom: 0;
}

.stage-dot {
  position: absolute;
  top: 6px;
  left: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: #000;
  transition: background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease;
}

.stage.is-in .stage-dot {
  border-color: #fff;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.08);
}

.stage-copy {
  align-self: start;
}

/* ---------- El texto de cada tramo ---------- */
.stage-place {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
  color: var(--muted);
}

.stage-num {
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.3);
}

.stage-title {
  margin-top: 12px;
  font-size: clamp(22px, 2.1vw, 30px);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.stage-text {
  margin-top: 14px;
  max-width: 440px;
  font-size: 16px;
  line-height: 1.55;
  color: var(--soft);
}

.stage-service {
  margin-top: 28px;
  padding-top: 18px;
  max-width: 440px;
  border-top: 1px solid var(--rule);
}

.stage-service-label {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.stage-service-title {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 500;
}

.stage-service-text {
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--soft);
}

/* ---------- Los paneles ---------- */
.panel {
  overflow: hidden;
  border: 1px solid var(--rule);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.015);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--rule);
  font-size: 12px;
  color: var(--muted);
}

.panel-head span:first-child {
  color: var(--soft);
}

.line {
  opacity: 0.18;
  transition: opacity 0.7s ease calc(var(--i) * 0.18s + 0.15s);
}

.stage.is-in .line {
  opacity: 1;
}

.stage.is-in .line:not(.is-key) {
  opacity: 0.55;
}

/* PLC */
.regs {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.regs th {
  padding: 12px 20px 8px;
  font-size: 12px;
  font-weight: 400;
  text-align: left;
  color: var(--muted);
}

.regs td {
  padding: 14px 20px;
  border-top: 1px solid var(--rule);
  color: #fff;
}

.regs .num {
  text-align: right;
  white-space: nowrap;
}

.regs .is-key td {
  font-weight: 500;
}

/* Gateway */
.msg {
  margin: 0;
  padding: 6px 0;
}

.msg > div {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 16px;
  padding: 12px 20px;
}

.msg dt {
  font-size: 12px;
  color: var(--muted);
}

.msg dd {
  margin: 0;
  font-size: 14px;
  color: #fff;
  overflow-wrap: anywhere;
}

.code {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px !important;
}

/* Nube */
.log {
  list-style: none;
  margin: 0;
  padding: 6px 0;
}

.log li {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 16px;
  padding: 12px 20px;
  font-size: 14px;
  color: #fff;
}

.log-time {
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

/* Plataforma */
.panel--live {
  margin-left: auto;
  margin-right: auto;
  background: rgba(255, 255, 255, 0.01);
}

/* ---------- Lo que cruza todo ---------- */
.across {
  margin-top: clamp(80px, 10vw, 140px);
  padding-top: 28px;
  border-top: 1px solid var(--rule);
}

.across-label {
  font-size: 13px;
  color: var(--muted);
}

.across-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.across-title {
  font-size: clamp(20px, 1.8vw, 26px);
  font-weight: 400;
  letter-spacing: -0.02em;
}

.across-text {
  margin-top: 8px;
  max-width: 440px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--soft);
}

@media (prefers-reduced-motion: reduce) {
  .line,
  .stage-dot {
    transition: none;
  }
}

@media (max-width: 900px) {
  .journey-head {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stage {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-left: 32px;
  }

  .across-list {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .regs th,
  .regs td,
  .msg > div,
  .log li,
  .panel-head {
    padding-left: 16px;
    padding-right: 16px;
  }

  .regs td:first-child,
  .regs th:first-child {
    display: none;
  }

  .msg > div {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .log li {
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 12px;
    font-size: 13px;
  }
}
</style>
