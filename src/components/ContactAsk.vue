<!--
  Contacto: un campo grande, como el de Argus. Lo que se escribe abre WhatsApp con
  el mensaje ya redactado. Es un link (no un window.open) para que el script del
  head mida la conversión como cualquier otro link a wa.me.

  Sobre la caja, la misma luz del marco del hero (stageLight.js): nace en el filo de
  arriba y cae hacia arriba, por detrás del título. Se dibuja solo mientras se ve, a
  30 cuadros en equipos modestos y quieta con movimiento reducido.
-->
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { createStageLight } from './stageLight'

const WHATSAPP = '5493413551507'
const EMAIL = 'hello@seiminteractive.io'
const EXAMPLES = ['La temperatura de un horno', 'Las paradas de una línea', 'El consumo de energía de la planta']

const text = ref('')
const send = ref(null)

const message = computed(() => {
  const what = text.value.trim()
  return what ? `Hola! Quiero medir esto en mi planta: ${what}` : 'Hola! Quiero consultar por la plataforma IoT'
})
const href = computed(() => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message.value)}`)

// Enter manda; Shift + Enter hace un salto de línea.
function onKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  send.value?.click()
}

function useExample(example) {
  text.value = example
}

// ---------- La luz ----------
// El lienzo sobresale LIGHT_ABOVE px por arriba de la caja y entra LIGHT_BELOW por
// debajo del filo; a los costados, apenas (fuera del ancho de la caja la luz es cero).
const LIGHT_ABOVE = 220
const LIGHT_BELOW = 40
const LIGHT_SIDE = 0.04

const stage = ref(null)
const lightCanvas = ref(null)
const hasLight = ref(false)
let light = null
let resizeObserver = null
let observer = null
let raf = 0
let glint = 0.5

function fit() {
  const width = stage.value?.clientWidth
  if (width) light?.resize(width * (1 + LIGHT_SIDE * 2), LIGHT_ABOVE + LIGHT_BELOW, LIGHT_BELOW, width)
}

// Como en el hero: el brillo recorre el filo mientras la caja sube por la pantalla
function trackLight() {
  raf = 0
  const el = stage.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight
  if (rect.bottom < 0 || rect.top > vh) return
  const target = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)))
  glint += (target - glint) * 0.12
  el.style.setProperty('--glint', glint.toFixed(4))
  light.setGlint(glint)
  if (Math.abs(target - glint) > 0.0005) raf = requestAnimationFrame(trackLight)
}

function onScroll() {
  if (!raf) raf = requestAnimationFrame(trackLight)
}

onMounted(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const modest = window.matchMedia('(max-width: 900px)').matches || (navigator.hardwareConcurrency || 8) <= 4
  light = createStageLight(lightCanvas.value, { reduceMotion, fps: modest ? 30 : 60 })
  if (!light) return
  hasLight.value = true
  fit()
  resizeObserver = new ResizeObserver(fit)
  resizeObserver.observe(stage.value)
  observer = new IntersectionObserver(([entry]) => {
    light.setVisible(entry.isIntersecting)
    if (entry.isIntersecting) onScroll()
  })
  observer.observe(stage.value)
  if (!reduceMotion) window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  observer?.disconnect()
  resizeObserver?.disconnect()
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(raf)
  light?.destroy()
})
</script>

<template>
  <div class="ask">
    <h2 class="ask-title" data-reveal>Contanos qué querés medir<br><span>en tu planta.</span></h2>

    <div ref="stage" class="ask-stage" :class="{ 'has-light': hasLight }" data-reveal>
      <canvas
        ref="lightCanvas"
        class="ask-glow"
        :style="{ height: `${LIGHT_ABOVE + LIGHT_BELOW}px`, bottom: `calc(100% - ${LIGHT_BELOW}px)`, left: `${-LIGHT_SIDE * 100}%`, width: `${(1 + LIGHT_SIDE * 2) * 100}%` }"
        aria-hidden="true"
      ></canvas>
      <div class="ask-edge" aria-hidden="true"></div>
      <div class="ask-box">
        <label class="visually-hidden" for="ask-input">Qué querés medir en tu planta</label>
        <textarea
          id="ask-input"
          v-model="text"
          class="ask-input"
          rows="3"
          maxlength="600"
          placeholder="Por ejemplo: cuánto produce cada línea por turno y por qué para."
          @keydown="onKeydown"
        ></textarea>
        <div class="ask-bar">
          <div class="ask-examples" aria-label="Ejemplos">
            <button v-for="example in EXAMPLES" :key="example" type="button" class="ask-example" @click="useExample(example)">
              {{ example }}
            </button>
          </div>
          <a ref="send" :href="href" target="_blank" rel="noopener" class="ask-send">
            Enviar por WhatsApp
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <p class="ask-after" data-reveal>
      Después del arranque seguimos con vos: operamos la plataforma <strong>24/7</strong> y armamos juntos la hoja de ruta.
    </p>

    <dl class="ask-meta" data-reveal>
      <div>
        <dt>Email</dt>
        <dd><a :href="`mailto:${EMAIL}`">{{ EMAIL }}</a></dd>
      </div>
      <div>
        <dt>WhatsApp</dt>
        <dd><a :href="`https://wa.me/${WHATSAPP}`" target="_blank" rel="noopener">+54 9 341 355-1507</a></dd>
      </div>
      <div>
        <dt>Respuesta</dt>
        <dd>En menos de 24 horas</dd>
      </div>
      <div>
        <dt>Cobertura</dt>
        <dd>Toda Argentina, en planta y remoto</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.ask {
  --rule: rgba(255, 255, 255, 0.09);
  max-width: 920px;
  margin: 0 auto;
}

.ask-title {
  /* Por encima de la luz de la caja */
  position: relative;
  z-index: 2;
  font-size: clamp(32px, 4.2vw, 60px);
  font-weight: 400;
  line-height: 1.06;
  letter-spacing: -0.03em;
  text-align: center;
  text-wrap: balance;
}

.ask-title span {
  color: rgba(255, 255, 255, 0.45);
}

/* La caja y su luz */
.ask-stage {
  --glint: 0.5;
  position: relative;
  z-index: 1;
  isolation: isolate;
  margin-top: clamp(40px, 5vw, 64px);
}

.ask-glow {
  position: absolute;
  z-index: 0;
  pointer-events: none;
}

/* La línea nítida del filo, con el brillo que sigue al scroll (como en el hero) */
.ask-edge {
  display: none;
  position: absolute;
  z-index: 2;
  top: 0;
  left: 4%;
  right: 4%;
  height: 1px;
  pointer-events: none;
  background: radial-gradient(ellipse 40% 100% at calc(26% + var(--glint) * 48%) 50%, #fff, rgba(226, 236, 255, 0.5) 40%, transparent);
}

.has-light .ask-edge {
  display: block;
}

/* La caja: el mismo lenguaje que el marco de la plataforma, con su filo de luz */
.ask-box {
  position: relative;
  z-index: 1;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 40px 100px -40px rgba(0, 0, 0, 0.9);
  transition: box-shadow 0.4s ease;
}

.ask-box:focus-within {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 40px 100px -40px rgba(0, 0, 0, 0.9);
}

.ask-input {
  display: block;
  width: 100%;
  min-height: 132px;
  padding: 26px 28px 8px;
  border: 0;
  background: transparent;
  resize: none;
  font: inherit;
  font-size: clamp(17px, 1.5vw, 20px);
  line-height: 1.5;
  color: #fff;
}

.ask-input::placeholder {
  color: rgba(255, 255, 255, 0.36);
}

.ask-input:focus {
  outline: none;
}

.ask-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px 14px 22px;
}

.ask-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.ask-example {
  height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.ask-example:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.24);
}

.ask-send {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 22px;
  border-radius: 999px;
  background: #fff;
  color: #0a0a0a;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-decoration: none;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.14);
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.ask-send svg {
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) and (pointer: fine) {
  .ask-send:hover {
    transform: translateY(-1px);
  }

  .ask-send:hover svg {
    transform: translateX(3px);
  }
}

.ask-send:focus-visible,
.ask-example:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

/* En el mismo eje que el título y la caja, en dos renglones parejos */
.ask-after {
  max-width: 34em;
  margin: clamp(40px, 5vw, 64px) auto 0;
  text-align: center;
  text-wrap: balance;
  font-size: 17px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.62);
}

.ask-after strong {
  font-weight: 500;
  color: #fff;
}

/* Los datos de siempre, chicos, abajo */
.ask-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin: clamp(40px, 5vw, 64px) 0 0;
  padding-top: 22px;
  border-top: 1px solid var(--rule);
}

.ask-meta > div {
  text-align: center;
}

.ask-meta dt {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.42);
}

.ask-meta dd {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.78);
}

.ask-meta a {
  color: inherit;
  text-decoration: none;
}

.ask-meta a:hover {
  color: #fff;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ---------- Celular: alineado a la izquierda, un solo eje ---------- */
@media (max-width: 760px) {
  .ask-title {
    font-size: 30px;
    line-height: 1.1;
    text-align: left;
    text-wrap: pretty;
  }

  .ask-stage {
    margin-top: 44px;
  }

  .ask-box {
    border-radius: 20px;
  }

  .ask-input {
    min-height: 112px;
    padding: 20px 20px 4px;
    font-size: 17px;
  }

  /* El botón a la derecha, a su medida: fino y proporcionado a la caja */
  .ask-bar {
    justify-content: flex-end;
    padding: 8px 10px 10px;
  }

  .ask-examples {
    display: none;
  }

  .ask-send {
    height: 40px;
    gap: 8px;
    padding: 0 16px;
    font-size: 14px;
  }

  .ask-after {
    max-width: none;
    margin-top: 28px;
    text-align: left;
    text-wrap: pretty;
    font-size: 15px;
  }

  /* Los datos, como filas: el nombre a la izquierda y el dato a la derecha */
  .ask-meta {
    display: block;
    margin-top: 36px;
    padding-top: 0;
  }

  .ask-meta > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--rule);
    text-align: left;
  }

  .ask-meta dt {
    flex: none;
    font-size: 13px;
  }

  .ask-meta dd {
    margin: 0;
    text-align: right;
  }
}
</style>
