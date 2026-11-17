<!--
  La plataforma real dentro de la landing. No es una recreación: es un video del
  frontend de iot compilado con datos de ejemplo (public/plataforma), manejado por
  platformTour.js con clics de verdad y grabado cuadro por cuadro
  (scripts/grabar-plataforma). Así la página no carga la app.

  La pantalla tiene la proporción de una real (1440×900 en escritorio, 390×780 en
  celular, donde la app usa su propio diseño mobile).
-->
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PlatformVideo from './PlatformVideo.vue'
import { createStageLight } from './stageLight'

const props = defineProps({
  label: { type: String, default: 'La plataforma de Seim Interactive en uso: ingreso, activos, mediciones, acciones e inteligencia artificial' },
})

const SCREENS = {
  desktop: { w: 1440, h: 900 },
  mobile: { w: 390, h: 780 },
}

const root = ref(null)
const viewport = ref(null)
const lightCanvas = ref(null)
const shaderLight = ref(false)
const mode = ref('desktop')

const screen = computed(() => SCREENS[mode.value])

let observer = null
let resizeObserver = null
let raf = 0
let glint = 0
let light = null

// El lienzo de la luz sobresale por arriba y a los costados del marco, y entra
// LIGHT_BELOW px por debajo del filo para que el vidrio del marco la difumine.
const LIGHT_ABOVE = 380
const LIGHT_BELOW = 56
const LIGHT_SIDE = 0.16

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
  light?.setGlint(glint)
  raf = Math.abs(target - glint) > 0.0005 && rect.bottom > 0 && rect.top < vh ? requestAnimationFrame(trackLight) : 0
}

function onScroll() {
  if (!raf) raf = requestAnimationFrame(trackLight)
}
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function fit() {
  if (!viewport.value) return
  mode.value = window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop'
  const width = root.value.clientWidth
  light?.resize(width * (1 + LIGHT_SIDE * 2), LIGHT_ABOVE + LIGHT_BELOW, LIGHT_BELOW, width)
}

onMounted(() => {
  light = createStageLight(lightCanvas.value, { reduceMotion })
  shaderLight.value = !!light
  fit()
  resizeObserver = new ResizeObserver(fit)
  resizeObserver.observe(viewport.value)

  if (!reduceMotion) {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

  // La luz se dibuja solo mientras se ve (el video se pausa solo, ver PlatformVideo)
  observer = new IntersectionObserver(([entry]) => light?.setVisible(entry.isIntersecting))
  observer.observe(viewport.value)
})

onUnmounted(() => {
  observer?.disconnect()
  resizeObserver?.disconnect()
  light?.destroy()
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div ref="root" class="stage" :class="[`stage--${mode}`, { 'has-shader': shaderLight }]" role="img" :aria-label="props.label">
    <canvas
      ref="lightCanvas"
      class="stage-glow"
      :style="{ height: `${LIGHT_ABOVE + LIGHT_BELOW}px`, bottom: `calc(100% - ${LIGHT_BELOW}px)`, left: `${-LIGHT_SIDE * 100}%`, width: `${(1 + LIGHT_SIDE * 2) * 100}%` }"
      aria-hidden="true"
    ></canvas>
    <div class="stage-light" aria-hidden="true"></div>
    <div class="stage-shell">
      <div ref="viewport" class="stage-viewport" :style="{ aspectRatio: `${screen.w} / ${screen.h}` }">
        <PlatformVideo class="stage-video" name="hero" mobile-query="(max-width: 720px)" priority />
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
/* El resplandor lo dibuja un shader (stageLight.js) en este lienzo. Sale del filo
   de arriba del marco y nunca pasa por encima de la pantalla. */
.stage-glow {
  position: absolute;
  pointer-events: none;
}

/* Encima del resplandor, la línea nítida del filo. Si el navegador no tiene WebGL,
   ::before hace de resplandor con un degradé. */
.stage-light {
  --light: 226, 236, 255;
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Solo sin WebGL */
.has-shader .stage-light::before {
  display: none;
}

.stage-light::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 100%;
  width: 92%;
  height: 170px;
  transform: translateX(calc(-50% + (var(--glint) - 0.5) * 80px));
  /* Cada capa cae en curva, no en línea recta: así no se ve dónde termina */
  background:
    radial-gradient(ellipse 20% 30% at 50% 100%, rgba(var(--light), 0.300) 0%, rgba(var(--light), 0.168) 22%, rgba(var(--light), 0.078) 45%, rgba(var(--light), 0.027) 68%, rgba(var(--light), 0.006) 86%, transparent 100%),
    radial-gradient(ellipse 50% 100% at 50% 100%, rgba(var(--light), 0.130) 0%, rgba(var(--light), 0.073) 22%, rgba(var(--light), 0.034) 45%, rgba(var(--light), 0.012) 68%, rgba(var(--light), 0.003) 86%, transparent 100%);
}

.stage-light::after {
  content: '';
  position: absolute;
  left: 3%;
  right: 3%;
  top: 0;
  height: 1px;
  z-index: 3;
  background: radial-gradient(ellipse 40% 100% at var(--glint-x) 50%, #fff, rgba(var(--light), 0.55) 40%, transparent);
  box-shadow: 0 0 10px 0 rgba(var(--light), 0.5), 0 -1px 28px 1px rgba(var(--light), 0.22);
}

/* ---------- El marco ---------- */
.stage-shell {
  position: relative;
  padding: 8px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.025) 18%, rgba(255, 255, 255, 0.012) 60%);
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
  background: rgba(7, 8, 11, 0.82);
}

.stage-viewport::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05) 30%, rgba(255, 255, 255, 0.03));
}

.stage-video {
  position: absolute;
  inset: 0;
  height: 100%;
}

.stage--mobile .stage-shell {
  padding: 6px;
  border-radius: 32px;
}

.stage--mobile .stage-viewport {
  border-radius: 26px;
}

.stage--mobile .stage-light::before {
  height: 110px;
}
</style>
