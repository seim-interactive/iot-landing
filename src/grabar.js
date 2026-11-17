// Página del grabador de videos (grabar.html): monta UNA pieza de la plataforma
// al tamaño exacto de su caja, en px de CSS, sobre negro y sin nada más.
//
//   /grabar.html?pieza=mediciones&w=438&h=403&pantalla=1440[&fade=0]
//
// `pantalla`: el ancho de la pantalla que se simula. Algunas piezas eligen su
// diseño según window.innerWidth (howPieces.js), y acá la ventana mide lo que la
// caja: sin esto, una caja de escritorio se dibujaría como en el celular.
//
// El grabador (scripts/grabar-plataforma/grabar.mjs) controla el reloj y saca los
// cuadros; acá solo se arma la escena y se avisa cuándo empieza cada vuelta del
// guion (window.__loopMark, que llama platformDriver.js).
import { createApp, h } from 'vue'
import PlatformPiece from './components/PlatformPiece.vue'
import { PIECES } from './components/platformPieces'

const q = new URLSearchParams(location.search)
const key = q.get('pieza') || 'mediciones'
const w = Number(q.get('w')) || 420
const hgt = Number(q.get('h')) || Math.round(w * 0.92)
const screenWidth = Number(q.get('pantalla')) || 1440
Object.defineProperty(window, 'innerWidth', { get: () => screenWidth, configurable: true })

window.__marks = []
window.__loopMark = (lap) => window.__marks.push({ lap, t: Date.now() })

async function findPiece(name) {
  const fromGrid = PIECES.find((p) => p.key === name)
  if (fromGrid) return { piece: fromGrid, fade: true }
  // Las de «Cómo funciona» se cargan solo si hacen falta
  const { HOW_PIECES } = await import('./components/howPieces')
  if (HOW_PIECES?.[name]) return { piece: HOW_PIECES[name], fade: false }
  throw new Error(`No existe la pieza «${name}»`)
}

const { piece, fade } = await findPiece(key)
const fadeParam = q.get('fade')

createApp({
  render: () =>
    h('div', { style: { width: `${w}px`, height: `${hgt}px`, overflow: 'hidden', background: '#000' } }, [
      h(PlatformPiece, { piece, ratio: `${w} / ${hgt}`, fade: fadeParam == null ? fade : fadeParam !== '0' }),
    ]),
}).mount('#grabar')
