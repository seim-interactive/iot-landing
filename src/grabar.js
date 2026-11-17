// Página del grabador de videos (grabar.html): monta UNA pieza de la plataforma
// al tamaño exacto de su caja, en px de CSS, sobre negro y sin nada más.
//
//   /grabar.html?pieza=mediciones&w=465&h=428&pantalla=1440[&fade=0]
//
// `pantalla`: el ancho de la pantalla que se simula. Algunas piezas eligen su
// diseño según window.innerWidth (howPieces.js), y acá la ventana mide lo que la
// caja: sin esto, una caja de escritorio se dibujaría como en el celular.
//
// El grabador (scripts/grabar-plataforma/grabar.mjs) controla el reloj y saca los
// cuadros; acá solo se arma la escena y se avisa cuándo empieza cada vuelta del
// guion (window.__loopMark, que llama platformDriver.js) y lo que la pieza cuenta
// en el camino (window.__events: en «A tu medida», el equipo de la pestaña).
import { createApp, h } from 'vue'
import PlatformPiece from './components/PlatformPiece.vue'
import { PIECES } from './components/platformPieces'

const DEMO_URL = import.meta.env.VITE_PLATFORM_DEMO_URL || '/plataforma/index.html'
const q = new URLSearchParams(location.search)
const key = q.get('pieza') || 'mediciones'
const w = Number(q.get('w')) || 420
const hgt = Number(q.get('h')) || Math.round(w * 0.92)
const screenWidth = Number(q.get('pantalla')) || 1440
Object.defineProperty(window, 'innerWidth', { get: () => screenWidth, configurable: true })

window.__marks = []
window.__loopMark = (lap) => window.__marks.push({ lap, t: Date.now() })
window.__events = []
const event = (name) => window.__events.push({ name, t: Date.now() })

// El reporte de Argus va en su tarjeta (HowItWorks.vue, .how-report): el video la
// trae puesta, así en la landing no hay un rectángulo negro sobre el degradé.
const CARD = {
  boxSizing: 'border-box',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.05))',
}

async function findPiece(name) {
  const fromGrid = PIECES.find((p) => p.key === name)
  if (fromGrid) return { piece: fromGrid, fade: true }
  if (name === 'medida') {
    const { createFitPiece } = await import('./components/platformFit')
    return { piece: createFitPiece({ small: screenWidth < 720, onMachine: event }), fade: false }
  }
  // Las de las páginas por tema (t-*): la app de escritorio o la de celular según la
  // pantalla. Son recortes de la interfaz, con los bordes fundidos como la grilla;
  // t-equipos es la pantalla entera del celular, sin fundido.
  if (name.startsWith('t-')) {
    const { TEMA_PIECES } = await import('./components/temaPieces')
    const piece = TEMA_PIECES[screenWidth < 720 ? 'celular' : 'escritorio'][name]
    if (piece) return { piece, fade: name !== 't-equipos' }
  }
  // Las de «Cómo funciona» se cargan solo si hacen falta
  const { HOW_PIECES } = await import('./components/howPieces')
  if (HOW_PIECES?.[name]) return { piece: HOW_PIECES[name], fade: false, style: name === 'report' ? CARD : undefined }
  throw new Error(`No existe la pieza «${name}»`)
}

// El hero: la pantalla de PlatformStage.vue sin el marco (el marco y su luz quedan
// en la landing). La app a tamaño de pantalla real, escalada entera a la caja, con
// el recorrido de platformTour.js. Sin fundido entre vueltas: del final de Argus al
// login, corte seco.
async function mountHero(root) {
  const { createPlatformTour } = await import('./components/platformTour')
  const mobile = screenWidth <= 720
  const screen = mobile ? { w: 390, h: 780 } : { w: 1440, h: 900 }
  Object.assign(root.style, { position: 'relative', width: `${w}px`, height: `${hgt}px`, overflow: 'hidden', background: '#000' })
  const frame = document.createElement('iframe')
  frame.width = screen.w
  frame.height = screen.h
  Object.assign(frame.style, {
    position: 'absolute', top: '0', left: '0', border: '0', transformOrigin: '0 0', transform: `scale(${w / screen.w})`,
    background: 'transparent', colorScheme: 'dark', pointerEvents: 'none',
  })
  const cursor = document.createElement('div')
  Object.assign(cursor.style, { position: 'absolute', top: '0', left: '0', zIndex: '4', opacity: '0', pointerEvents: 'none', willChange: 'transform', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' })
  cursor.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 2.5 17.5 11l-6 1.4-2.9 5.6L4 2.5Z" fill="#fff" stroke="#0b0c10" stroke-width="1.2" stroke-linejoin="round" /></svg>'
  root.append(frame, cursor)
  frame.addEventListener('load', () => createPlatformTour({ frame, cursor, mode: () => (mobile ? 'mobile' : 'desktop'), cut: false }).setVisible(true, true), { once: true })
  frame.src = DEMO_URL
}

const root = document.getElementById('grabar')
if (key === 'hero') {
  await mountHero(root)
} else {
  const { piece, fade, style } = await findPiece(key)
  const fadeParam = q.get('fade')
  createApp({
    render: () =>
      h('div', { style: { width: `${w}px`, height: `${hgt}px`, overflow: 'hidden', background: '#000' } }, [
        h(PlatformPiece, { piece, ratio: `${w} / ${hgt}`, fade: fadeParam == null ? fade : fadeParam !== '0', style }),
      ]),
  }).mount(root)
}
