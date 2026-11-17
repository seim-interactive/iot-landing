<!--
  Un video de la plataforma real, grabado cuadro por cuadro de la misma app
  (scripts/grabar-plataforma). Reemplaza a las copias en vivo: la página no carga
  ninguna app y el scroll no se traba.

  - Nunca se ve negro ni vacío: abajo está el primer cuadro como imagen (con su
    versión de celular), y el video aparece recién cuando muestra ese mismo cuadro,
    así el cambio no se nota.
  - Se pide una pantalla antes de entrar, corre mientras se ve y se pausa fuera.
  - Cada navegador baja un solo archivo: AV1 (Chrome, Firefox, Edge), HEVC (Safari)
    o H.264, según lo que sepa reproducir (el códec exacto sale de platformVideos.json).
  - El loop es el del navegador: el último cuadro empalma con el primero.
  - Con movimiento reducido o ahorro de datos queda la imagen quieta.

  El tamaño lo da quien lo usa (una clase con aspect-ratio o un alto).
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import VIDEOS from './platformVideos.json'

const props = defineProps({
  name: { type: String, required: true },
  // Hasta dónde se usa la versión de celular
  mobileQuery: { type: String, default: '(max-width: 719px)' },
  // Los bordes se funden con el negro de la página (la grilla)
  fade: { type: Boolean, default: false },
})
// `mark`: lo que pasa en el video en cada momento (en «A tu medida», el equipo)
const emit = defineEmits(['mark'])

const BASE = '/media/plataforma/'
const file = (version) => BASE + props.name + (version === 'celular' ? '-celular' : '')
// ?v= cambia con cada grabación: el servidor les da caché de un año (nginx.conf)
const stamp = (version) => (VIDEOS[props.name]?.[version]?.v ? `?v=${VIDEOS[props.name][version].v}` : '')
const poster = (version) => `${file(version)}-poster.webp${stamp(version)}`

const video = ref(null)
const sources = ref([])
const playing = ref(false)

let mq = null
let near = null
let seen = null
let visible = false
let frameCb = 0
let lastMark = null

const versionNow = () => (mq?.matches ? 'celular' : 'escritorio')

function load() {
  const version = versionNow()
  const meta = VIDEOS[props.name]?.[version]
  // Sin datos del video (todavía no se grabó), queda la imagen
  if (!meta?.codecs) return
  const base = file(version)
  const v = stamp(version)
  sources.value = [
    { src: `${base}.av1.mp4${v}`, type: `video/mp4; codecs="${meta.codecs.av1}"` },
    { src: `${base}.hevc.mp4${v}`, type: `video/mp4; codecs="${meta.codecs.hevc}"` },
    { src: `${base}.h264.mp4${v}`, type: `video/mp4; codecs="${meta.codecs.h264}"` },
  ]
  playing.value = false
  // Las <source> nuevas se toman con load()
  requestAnimationFrame(() => {
    video.value?.load()
    if (visible) play()
  })
}

function play() {
  const v = video.value
  if (!v || !sources.value.length) return
  v.play().catch(() => {
    /* sin permiso para reproducir: queda la imagen */
  })
}

// Qué marca corresponde a este instante del video
function trackMarks() {
  const marks = VIDEOS[props.name]?.[versionNow()]?.marks
  const v = video.value
  if (!marks?.length || !v) return
  const step = (time) => {
    const mark = marks.findLast((m) => m.t <= time) || marks[0]
    if (mark.name !== lastMark) {
      lastMark = mark.name
      emit('mark', mark.name)
    }
  }
  if (v.requestVideoFrameCallback) {
    const onFrame = (_now, meta) => {
      step(meta.mediaTime)
      frameCb = v.requestVideoFrameCallback(onFrame)
    }
    frameCb = v.requestVideoFrameCallback(onFrame)
  } else {
    const onTime = () => step(v.currentTime)
    v.addEventListener('timeupdate', onTime)
  }
}

function onPlaying() {
  playing.value = true
}

function onVersionChange() {
  if (sources.value.length) load()
  const marks = VIDEOS[props.name]?.[versionNow()]?.marks
  if (marks?.length) {
    lastMark = marks[0].name
    emit('mark', lastMark)
  }
}

onMounted(() => {
  mq = window.matchMedia(props.mobileQuery)
  mq.addEventListener('change', onVersionChange)
  const marks = VIDEOS[props.name]?.[versionNow()]?.marks
  if (marks?.length) {
    lastMark = marks[0].name
    emit('mark', lastMark)
  }

  const still =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData
  if (still) return

  trackMarks()
  // Se pide una pantalla antes de que entre: cuando llega, ya tiene cuadros
  near = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !sources.value.length) load()
    },
    { rootMargin: '100% 0px' }
  )
  near.observe(video.value)
  seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) play()
    else video.value?.pause()
  })
  seen.observe(video.value)
})

onUnmounted(() => {
  mq?.removeEventListener('change', onVersionChange)
  near?.disconnect()
  seen?.disconnect()
  if (frameCb) video.value?.cancelVideoFrameCallback?.(frameCb)
})
</script>

<template>
  <div class="platform-video" :class="{ 'platform-video--fade': fade }" aria-hidden="true">
    <picture>
      <source :media="mobileQuery" :srcset="poster('celular')" />
      <!-- Si la imagen faltara, no queda el ícono de imagen rota -->
      <img class="platform-video-poster" :src="poster('escritorio')" alt="" decoding="async" loading="lazy" @error="$event.target.style.visibility = 'hidden'" />
    </picture>
    <video
      ref="video"
      class="platform-video-media"
      :class="{ 'is-playing': playing }"
      muted
      loop
      playsinline
      disablepictureinpicture
      disableremoteplayback
      preload="auto"
      tabindex="-1"
      @playing="onPlaying"
    >
      <source v-for="s in sources" :key="s.src" :src="s.src" :type="s.type" />
    </video>
  </div>
</template>

<style scoped>
.platform-video {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.platform-video--fade {
  /* El componente se pierde hacia los bordes: no hay marco que lo corte */
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 12%, #000 86%, transparent), linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(180deg, transparent, #000 12%, #000 86%, transparent), linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
  mask-composite: intersect;
}

.platform-video-poster,
.platform-video-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Hasta que muestra su primer cuadro (el mismo de la imagen), el video no se ve */
.platform-video-media {
  opacity: 0;
}

.platform-video-media.is-playing {
  opacity: 1;
}
</style>
