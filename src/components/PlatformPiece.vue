<!--
  Un cuadrado de la grilla: la plataforma real en un iframe, con la cámara puesta
  sobre un componente y un guion en loop (platformPieces.js). Se carga cuando el
  cuadrado está por entrar en pantalla y corre solo mientras se ve.
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createDriver } from './platformDriver'

const props = defineProps({ piece: { type: Object, required: true } })

const DEMO_URL = import.meta.env.VITE_PLATFORM_DEMO_URL || '/plataforma/index.html'
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const stage = ref(null)
const frame = ref(null)
const cursor = ref(null)
const src = ref('')
const height = ref(typeof props.piece.height === 'number' ? props.piece.height : 400)

let observer = null
let driver = null
let seen = false

function onLoad() {
  if (!src.value || driver) return
  driver = createDriver({
    frame: frame.value,
    cursor: cursor.value,
    camera: true,
    script: (d) => props.piece.script(d),
    reset: (d) => props.piece.reset(d),
    cut: props.piece.cut !== false,
  })
  driver.setVisible(seen)
}

onMounted(() => {
  if (props.piece.height === 'fit') {
    height.value = Math.round((props.piece.width * stage.value.clientHeight) / stage.value.clientWidth)
  }
  observer = new IntersectionObserver(
    ([entry]) => {
      seen = entry.intersectionRatio > 0.3
      if (entry.isIntersecting && !src.value && !reduceMotion) src.value = `${DEMO_URL}?logged&ruta=${props.piece.route}`
      driver?.setVisible(seen)
    },
    { rootMargin: '300px 0px', threshold: [0, 0.3, 0.6] }
  )
  observer.observe(stage.value)
})

onUnmounted(() => {
  observer?.disconnect()
  driver?.destroy()
})
</script>

<template>
  <div ref="stage" class="piece-stage" aria-hidden="true">
    <iframe
      ref="frame"
      class="piece-frame"
      :src="src || undefined"
      :width="piece.width"
      :height="height"
      title=""
      tabindex="-1"
      @load="onLoad"
    ></iframe>
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
  aspect-ratio: 1 / 0.92;
  overflow: hidden;
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
  will-change: transform;
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
