import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'
import '@/assets/console.css'
import '@/assets/fonts/inter.css'

const app = createApp(App)
app.use(router)
app.use(PrimeVue)

// La entrada del hero (header, botón y plataforma) es CSS y arranca con el HTML
// prerenderizado, sin esperar a este JS. Al montar, Vue vuelve a crear ese DOM y la
// entrada empezaría de nuevo: las animaciones nuevas se ponen en el mismo punto que
// las del HTML prerenderizado (o terminadas, si ya terminaron).
const INTRO = ['.header', '.hero-cta', '.hero-stage']
const cssAnimations = (el) => el.getAnimations?.().filter((a) => a instanceof CSSAnimation) ?? []

function introStart() {
  const cta = document.querySelector('#app .hero-cta')
  if (!cta) return undefined
  const [intro] = cssAnimations(cta)
  return intro ? intro.startTime : 'terminada'
}

function keepIntro(start) {
  if (start === undefined || start === null) return
  for (const el of document.querySelectorAll(INTRO.join(','))) {
    for (const animation of cssAnimations(el)) {
      if (start === 'terminada') animation.finish()
      else animation.startTime = start
    }
  }
}

// Hasta que el navegador registra el primer pintado del HTML prerenderizado (su LCP).
// Si Vue reemplaza el título antes, ese pintado no cuenta y el LCP pasa a ser el del
// título nuevo, más tarde. Como mucho 500 ms; sin contenido prerenderizado, al toque.
function prerenderedPaint() {
  const prerendered = document.querySelector('#app')?.children.length
  if (!prerendered || !PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    let observer = null
    const done = () => {
      clearTimeout(timer)
      observer?.disconnect()
      resolve()
    }
    const timer = setTimeout(done, 500)
    observer = new PerformanceObserver(done)
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  })
}

// Se monta recién con la ruta resuelta (la landing se carga aparte): si no, el contenido
// prerenderizado se vacía mientras llega el código de la página.
// Si se entra con un #ancla (un link a «Preguntas frecuentes», por ejemplo), el scroll
// suave del navegador se corta cuando Vue vuelve a crear la página: ya montada, se va
// directo a la sección.
function goToHash() {
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)))
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }))
}

Promise.all([router.isReady(), prerenderedPaint()]).then(() => {
  const start = introStart()
  app.mount('#app')
  keepIntro(start)
  goToHash()
})
