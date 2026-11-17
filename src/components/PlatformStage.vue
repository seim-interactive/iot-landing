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

const root = ref(null)
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
let raf = 0
let glint = 0

// El reflejo del marco sigue al scroll: mientras la plataforma sube por la pantalla,
// el brillo recorre el borde de arriba y baja por el costado. Va con un poco de
// inercia para que se sienta como luz sobre vidrio y no como una barra de progreso.
function trackLight() {
  const el = root.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight
  const target = Math.min(1, Math.max(0, (vh * 0.7 - rect.top) / (vh * 0.7 + rect.height * 0.5)))
  glint += (target - glint) * 0.09
  el.style.setProperty('--glint', glint.toFixed(4))
  raf = Math.abs(target - glint) > 0.0005 && rect.bottom > 0 && rect.top < vh ? requestAnimationFrame(trackLight) : 0
}

function onScroll() {
  if (!raf) raf = requestAnimationFrame(trackLight)
}
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

  if (!reduceMotion) {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

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
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div ref="root" class="stage" :class="[`stage--${mode}`, { 'is-ready': ready }]" role="img" :aria-label="props.label">
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
        <div class="stage-sheen" aria-hidden="true"></div>
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
  /* 0 → 1 mientras el marco sube por la pantalla (ver trackLight) */
  --glint: 0;
  --glint-x: calc(26% + var(--glint) * 56%);
  position: relative;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
}

.stage--mobile {
  max-width: 400px;
}

/* ---------- La luz ---------- */
/* Blanca. Un halo ancho que nace detrás del borde de arriba y entra en el
   contenedor (el fondo de la plataforma es translúcido), más una línea fina
   apoyada sobre el borde. */
.stage-light {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.stage-light::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -260px;
  width: 118%;
  height: 620px;
  transform: translateX(calc(-50% + (var(--glint) - 0.5) * 60px));
  background:
    radial-gradient(ellipse 34% 30% at 50% 42%, rgba(255, 255, 255, 0.34), transparent 70%),
    radial-gradient(ellipse 50% 50% at 50% 42%, rgba(255, 255, 255, 0.13), transparent 72%);
}

.stage-light::after {
  content: '';
  position: absolute;
  left: 4%;
  right: 4%;
  top: 0;
  height: 1px;
  z-index: 3;
  background: radial-gradient(ellipse 34% 100% at var(--glint-x) 50%, #fff, rgba(255, 255, 255, 0.5) 45%, transparent);
  box-shadow: 0 0 22px 2px rgba(255, 255, 255, 0.3);
}

/* ---------- El marco ---------- */
.stage-shell {
  position: relative;
  padding: 8px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03) 22%, rgba(255, 255, 255, 0.012) 60%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 70px 160px -50px rgba(0, 0, 0, 0.95);
}

/* El borde es un degradé: fuerte arriba, casi nada abajo. Encima, el reflejo que
   viaja con el scroll: por el borde de arriba y, al final, bajando por la derecha. */
.stage-shell::before,
.stage-viewport::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  padding: 1px;
  border-radius: inherit;
  pointer-events: none;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
}

.stage-shell::before {
  background:
    radial-gradient(ellipse 30% 26% at var(--glint-x) 0%, rgba(255, 255, 255, 0.95), transparent 72%),
    radial-gradient(ellipse 22% 34% at 100% calc(var(--glint) * 80% - 22%), rgba(255, 255, 255, 0.7), transparent 72%),
    radial-gradient(ellipse 22% 30% at 0% calc(118% - var(--glint) * 70%), rgba(255, 255, 255, 0.32), transparent 72%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.08) 26%, rgba(255, 255, 255, 0.035) 70%);
}

.stage-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 16px;
  /* Arriba deja pasar la luz; hacia abajo se cierra para que los datos se lean bien */
  background: linear-gradient(180deg, rgba(14, 16, 20, 0.5), rgba(7, 8, 11, 0.8) 34%, rgba(5, 6, 8, 0.9));
}

.stage-viewport::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05) 30%, rgba(255, 255, 255, 0.03));
}

/* Un velo de luz muy tenue sobre el vidrio, que se corre con el scroll */
.stage-sheen {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(112deg, transparent 30%, rgba(255, 255, 255, 0.045) 46%, rgba(255, 255, 255, 0.015) 54%, transparent 68%);
  background-size: 220% 100%;
  background-position: calc(100% - var(--glint) * 100%) 0;
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
  z-index: 4;
  opacity: 0;
  pointer-events: none;
  will-change: transform;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.stage--mobile .stage-shell {
  padding: 6px;
  border-radius: 32px;
}

.stage--mobile .stage-viewport {
  border-radius: 26px;
}

.stage--mobile .stage-cursor {
  display: none;
}

.stage--mobile .stage-light::before {
  top: -180px;
  width: 150%;
  height: 440px;
}
</style>
