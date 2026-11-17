<!--
  La plataforma real dentro de la landing. No es una recreación: es el frontend de
  iot compilado con datos de ejemplo (public/plataforma, ver scripts/plataforma-demo),
  cargado en un iframe del mismo origen y manejado por platformTour.js con clics de verdad.

  El iframe tiene el tamaño de una pantalla real (1440×900 en escritorio, 390×780 en
  celular, así la app usa su propio diseño mobile) y se escala entero para entrar en el marco.
-->
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { createPlatformTour } from './platformTour'

const props = defineProps({
  label: { type: String, default: 'La plataforma de Seim Interactive en uso: ingreso, activos, mediciones, acciones e inteligencia artificial' },
})

const DEMO_URL = import.meta.env.VITE_PLATFORM_DEMO_URL || '/plataforma/index.html'
const SCREENS = {
  desktop: { w: 1440, h: 900 },
  mobile: { w: 390, h: 780 },
}

const viewport = ref(null)
const frame = ref(null)
const cursor = ref(null)
const mode = ref('desktop')
const scale = ref(1)
const ready = ref(false)
const src = ref('')

const screen = computed(() => SCREENS[mode.value])

let observer = null
let resizeObserver = null
let tour = null
let ratio = 0
let loading = false
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function fit() {
  if (!viewport.value) return
  mode.value = window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop'
  scale.value = viewport.value.clientWidth / screen.value.w
}

function onLoad() {
  if (!src.value) return
  ready.value = true
  // Con movimiento reducido queda fija en Mediciones, sin recorrido.
  if (tour || reduceMotion) return
  tour = createPlatformTour({ frame: frame.value, cursor: cursor.value, mode: () => mode.value })
  sync()
}

// La app pesa: se pide cuando la landing ya terminó de cargar y el navegador
// está libre, para no competir con el primer pintado.
function load() {
  if (src.value || loading) return
  loading = true
  const go = () => (src.value = reduceMotion ? `${DEMO_URL}?logged` : DEMO_URL)
  const idle = () => (window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 300))
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}

// El recorrido arranca cuando el marco ya ocupa buena parte de la pantalla y
// después corre mientras se siga viendo.
function sync() {
  tour?.setVisible(ratio > 0.25, ratio > 0.55)
}

onMounted(() => {
  fit()
  resizeObserver = new ResizeObserver(fit)
  resizeObserver.observe(viewport.value)

  // La app se carga recién cuando el marco está por entrar en pantalla, y el
  // recorrido corre solo mientras se ve.
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) load()
      ratio = entry.intersectionRatio
      sync()
    },
    { threshold: [0, 0.25, 0.4, 0.55, 0.7] }
  )
  observer.observe(viewport.value)
})

onUnmounted(() => {
  observer?.disconnect()
  resizeObserver?.disconnect()
  tour?.destroy()
})
</script>

<template>
  <div class="stage" :class="[`stage--${mode}`, { 'is-ready': ready }]" role="img" :aria-label="props.label">
    <div class="stage-light" aria-hidden="true"></div>
    <div class="stage-shell">
      <div ref="viewport" class="stage-viewport" :style="{ aspectRatio: `${screen.w} / ${screen.h}` }">
        <iframe
          ref="frame"
          class="stage-frame"
          :src="src || undefined"
          :width="screen.w"
          :height="screen.h"
          :style="{ transform: `scale(${scale})` }"
          title=""
          tabindex="-1"
          aria-hidden="true"
          loading="lazy"
          @load="onLoad"
        ></iframe>
        <div ref="cursor" class="stage-cursor" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 2.5 17.5 11l-6 1.4-2.9 5.6L4 2.5Z" fill="#fff" stroke="#0b0c10" stroke-width="1.2" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
}

.stage--mobile {
  max-width: 400px;
}

/* La luz: blanca, apoyada sobre el borde de arriba del marco. Una línea fina que
   se pierde hacia los costados y, detrás, una claridad suave que sube. */
.stage-light {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.stage-light::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: calc(100% - 60px);
  width: 86%;
  height: 300px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse 50% 100% at 50% 100%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.07) 45%, transparent 72%);
}

.stage-light::after {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  top: 0;
  height: 1px;
  z-index: 3;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55) 22%, #fff 50%, rgba(255, 255, 255, 0.55) 78%, transparent);
  box-shadow: 0 0 18px 1px rgba(255, 255, 255, 0.35);
}

/* El marco: un borde translúcido alrededor de la pantalla, con un filo de luz arriba. */
.stage-shell {
  position: relative;
  padding: 8px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.025) 30%, rgba(255, 255, 255, 0.015));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.09),
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 60px 140px -40px rgba(0, 0, 0, 0.95);
}

.stage-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 15px;
  background: rgba(8, 9, 12, 0.72);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
}

.stage-frame {
  position: absolute;
  top: 0;
  left: 0;
  border: 0;
  transform-origin: 0 0;
  background: transparent;
  color-scheme: dark;
  /* El recorrido lo maneja la landing: la app no recibe el puntero del visitante. */
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.is-ready .stage-frame {
  opacity: 1;
}

.stage-cursor {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  will-change: transform;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.stage--mobile .stage-shell {
  padding: 6px;
  border-radius: 30px;
}

.stage--mobile .stage-viewport {
  border-radius: 25px;
}

.stage--mobile .stage-cursor {
  display: none;
}
</style>
