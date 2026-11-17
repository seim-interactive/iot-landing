<!--
  Un cuadrado de la grilla: la plataforma real en un iframe, con la cámara puesta
  sobre un componente y un guion en loop (platformPieces.js). Se carga cuando el
  cuadrado está por entrar en pantalla, corre solo mientras se ve y se descarga
  cuando queda lejos: así la página nunca tiene muchas copias de la app a la vez.
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createDriver } from './platformDriver'

const props = defineProps({
  piece: { type: Object, required: true },
  // Proporción del cuadro (ancho / alto) y si los bordes se funden
  ratio: { type: String, default: '1 / 0.92' },
  fade: { type: Boolean, default: true },
})

const DEMO_URL = import.meta.env.VITE_PLATFORM_DEMO_URL || '/plataforma/index.html'
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const stage = ref(null)
const cursor = ref(null)
// Dos lugares para la app. Los guiones que terminan con la app cambiada (una alarma
// resuelta, un motivo cargado) no se reinician a la vista: la vuelta siguiente carga
// una app nueva en el otro lugar, por detrás, y entra con un fundido sobre la anterior.
// Así el cuadrado nunca queda vacío.
const frames = ref([])
const srcs = ref(['', ''])
const current = ref(0)
const url = () => `${DEMO_URL}?logged&ruta=${props.piece.route}`
const swaps = props.piece.cut !== false
// El ancho puede depender de la pantalla (en celular, la app más angosta)
const width = typeof props.piece.width === 'function' ? props.piece.width() : props.piece.width
const height = ref(typeof props.piece.height === 'number' ? props.piece.height : 400)

let observer = null
let farObserver = null
let driver = null
let seen = false

function load() {
  if (!srcs.value[current.value] && !reduceMotion) srcs.value[current.value] = url()
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Carga la app nueva en el otro lugar y, cuando está lista, la vuelve la actual. La
// anterior queda a la vista hasta que la nueva entra (el guion la funde) y después se saca.
async function swap() {
  const next = 1 - current.value
  const old = current.value
  srcs.value[next] = url()
  for (let t = 0; t < 20000; t += 100) {
    const f = frames.value[next]
    try {
      if (f?.contentWindow?.__demo && f.contentDocument.querySelector('#app')?.firstElementChild) break
    } catch {
      /* todavía cargando */
    }
    await sleep(100)
  }
  const f = frames.value[next]
  f.style.opacity = '0'
  f.style.zIndex = '1'
  frames.value[old].style.zIndex = '0'
  current.value = next
  setTimeout(() => {
    if (current.value === next) srcs.value[old] = ''
  }, 3000)
}

// Lejos de la pantalla: se corta el guion y se saca la app entera.
function unload() {
  if (!srcs.value.some(Boolean)) return
  driver?.destroy()
  driver = null
  srcs.value = ['', '']
  props.piece.started = false
}

function onLoad(i) {
  if (!srcs.value[i] || driver || i !== current.value) return
  driver = createDriver({
    frame: () => frames.value[current.value],
    cursor: cursor.value,
    camera: true,
    script: (d) => props.piece.script(d),
    reset: swaps ? () => swap() : (d) => props.piece.reset(d),
    cut: false,
  })
  driver.setVisible(seen)
}

onMounted(() => {
  if (props.piece.height === 'fit') {
    height.value = Math.round((width * stage.value.clientHeight) / stage.value.clientWidth)
  }
  observer = new IntersectionObserver(
    ([entry]) => {
      seen = entry.intersectionRatio > 0.3
      if (entry.isIntersecting) load()
      driver?.setVisible(seen)
    },
    { rootMargin: '300px 0px', threshold: [0, 0.3, 0.6] }
  )
  observer.observe(stage.value)
  farObserver = new IntersectionObserver(([entry]) => !entry.isIntersecting && unload(), { rootMargin: '150% 0px' })
  farObserver.observe(stage.value)
})

onUnmounted(() => {
  observer?.disconnect()
  farObserver?.disconnect()
  driver?.destroy()
})
</script>

<template>
  <div ref="stage" class="piece-stage" :class="{ 'piece-stage--fade': fade }" :style="{ aspectRatio: ratio }" aria-hidden="true">
    <template v-for="(s, i) in srcs" :key="i">
      <iframe
        v-if="s"
        :ref="(el) => (frames[i] = el)"
        class="piece-frame"
        :src="s"
        :width="width"
        :height="height"
        title=""
        tabindex="-1"
        @load="onLoad(i)"
      ></iframe>
    </template>
    <div ref="cursor" class="piece-cursor">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <path d="M4 2.5 17.5 11l-6 1.4-2.9 5.6L4 2.5Z" fill="#fff" stroke="#0b0c10" stroke-width="1.2" stroke-linejoin="round" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.piece-stage {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.piece-stage--fade {
  /* El componente se pierde hacia los bordes: no hay marco que lo corte */
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 12%, #000 86%, transparent), linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(180deg, transparent, #000 12%, #000 86%, transparent), linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
  mask-composite: intersect;
}

.piece-frame {
  position: absolute;
  top: 0;
  left: 0;
  border: 0;
  transform-origin: 0 0;
  background: transparent;
  color-scheme: dark;
  pointer-events: none;
  opacity: 0;
  /* Sin will-change: con él, Chrome guarda la app como una imagen y al acercar la
     cámara la agranda pixelada, en vez de volver a dibujarla nítida */
}

.piece-cursor {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  will-change: transform;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}
</style>
