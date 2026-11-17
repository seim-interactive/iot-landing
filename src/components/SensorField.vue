<!--
  La red de sensores del fondo (sensorField.js): un lienzo fijo, del tamaño de la ventana,
  detrás de todo el contenido. En cada cuadro le cuenta al shader dónde están, en la
  ventana:
  - el título del hero o de la página por tema (detrás, la grilla va más tenue);
  - el marco de la plataforma del hero (los pulsos llegan a su filo de arriba);
  - los videos y los marcos (alrededor, la grilla se abre en un claro, y los pulsos
    llegan a su borde).
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createSensorField } from './sensorField'

const canvas = ref(null)

// Las cajas enteras (marcos, la grilla de piezas, el contacto) y, fuera de ellas, cada video
const BOXES = '.stage-shell, .fit-stage, .ask-stage, .pieces, .topic-more-panel'
const TITLES = '.hero-content, .topic-hero-copy'

let field = null
let boxes = []
let titles = []
let lastQuery = 0

const rectOf = (el) => {
  const r = el.getBoundingClientRect()
  return [r.left, r.top, r.width, r.height]
}

// Los elementos se buscan de vez en cuando (la página puede cambiar); sus posiciones, en
// cada cuadro (cambian con el scroll)
function query() {
  const containers = [...document.querySelectorAll(BOXES)]
  const videos = [...document.querySelectorAll('.platform-video')].filter((v) => !containers.some((c) => c.contains(v)))
  boxes = [...containers, ...videos]
  titles = [...document.querySelectorAll(TITLES)]
  lastQuery = performance.now()
}

function layout() {
  if (performance.now() - lastQuery > 1000) query()
  const header = document.querySelector('.header')
  const shell = boxes.find((el) => el.classList.contains('stage-shell'))
  return {
    top: header ? header.getBoundingClientRect().bottom : 72,
    text: titles[0] ? rectOf(titles[0]) : null,
    edge: shell ? rectOf(shell) : null,
    rects: boxes.map(rectOf),
  }
}

function resize() {
  field?.resize(window.innerWidth, window.innerHeight)
}

function onPointer(event) {
  field.pointer({ x: event.clientX, y: event.clientY })
}

function onLeave() {
  field.pointer(null)
}

onMounted(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches
  query()
  field = createSensorField(canvas.value, layout, { reduceMotion, touch })
  if (!field) return
  resize()
  field.start()
  window.addEventListener('resize', resize, { passive: true })
  if (!touch) {
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onPointer)
  document.documentElement.removeEventListener('pointerleave', onLeave)
  field?.destroy()
})
</script>

<template>
  <canvas ref="canvas" class="sensor-field" aria-hidden="true"></canvas>
</template>

<style scoped>
/* Detrás de todo: las secciones van por encima (posicionadas y sin fondo propio) */
.sensor-field {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>
