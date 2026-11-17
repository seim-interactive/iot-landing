<!--
  La red de sensores del fondo del hero (sensorField.js). Va dentro de .hero, detrás del
  título, y cubre solo la franja que está arriba del marco de la plataforma: los pulsos
  llegan al filo de ese marco, donde está su luz.

  Las medidas salen del layout (offsetTop/offsetLeft), no de la pantalla: la entrada del
  hero mueve el marco con transform y, si no, los pulsos llegarían a un lugar corrido.
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createSensorField } from './sensorField'

const canvas = ref(null)
const height = ref(0)

let field = null
let resizeObserver = null
let observer = null
let raf = 0

// Posición de un elemento relativa a `root`, sumando offsets hasta llegar a él
function offsetIn(el, root) {
  let x = 0
  let y = 0
  for (let node = el; node && node !== root; node = node.offsetParent) {
    x += node.offsetLeft
    y += node.offsetTop
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

function measure() {
  const hero = canvas.value?.parentElement
  const shell = hero?.querySelector('.stage-shell')
  const content = hero?.querySelector('.hero-content')
  if (!hero || !shell || !content || !field) return
  const edge = offsetIn(shell, hero)
  const text = offsetIn(content, hero)
  const header = parseFloat(getComputedStyle(hero).getPropertyValue('--header-h')) || 72
  height.value = Math.round(edge.y)
  field.resize(
    { w: hero.clientWidth, h: edge.y },
    { top: header, text: [text.x, text.y, text.w, text.h], target: { x0: edge.x, x1: edge.x + edge.w } }
  )
}

function onPointer(event) {
  const r = canvas.value.getBoundingClientRect()
  const x = event.clientX - r.left
  const y = event.clientY - r.top
  field.pointer(x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x, y } : null)
}

onMounted(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches
  field = createSensorField(canvas.value, { reduceMotion, touch })
  if (!field) return

  const schedule = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(measure)
  }
  measure()
  resizeObserver = new ResizeObserver(schedule)
  resizeObserver.observe(canvas.value.parentElement)
  document.fonts?.ready.then(schedule)
  window.addEventListener('load', schedule, { once: true })

  observer = new IntersectionObserver(([entry]) => field.setVisible(entry.isIntersecting))
  observer.observe(canvas.value)
  if (!touch) window.addEventListener('pointermove', onPointer, { passive: true })
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  resizeObserver?.disconnect()
  observer?.disconnect()
  window.removeEventListener('pointermove', onPointer)
  field?.destroy()
})
</script>

<template>
  <canvas ref="canvas" class="sensor-field" :style="{ height: `${height}px` }" aria-hidden="true"></canvas>
</template>

<style scoped>
.sensor-field {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
}
</style>
