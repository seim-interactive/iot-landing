// La cola de descarga de los videos de la plataforma (PlatformVideo).
//
// 1. El que tiene prioridad (el hero, o el de arriba en una página por tema) se pide
//    apenas se arma la página.
// 2. Cuando ese ya se puede reproducir (o cuando terminó de cargar la página), el resto
//    se baja en segundo plano, en el orden en que aparece en la página y de a uno, para
//    no competirle a lo que se está viendo. Así, cuando la persona llega, ya está.
// 3. Si la persona salta a una sección, ese video pasa al frente (PlatformVideo lo pide
//    directo cuando está a una pantalla).
// 4. Con ahorro de datos o una conexión lenta no se baja nada por adelantado: cada video
//    se pide recién cuando está cerca.

const waiting = new Set()
let running = false
let started = false
let priority = false

const connection = typeof navigator !== 'undefined' ? navigator.connection : null
const frugal = () => !!connection && (connection.saveData || /(^|-)2g|3g/.test(connection.effectiveType || ''))

// El orden de la página: el de más arriba primero
const byPosition = (a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)

async function drain() {
  if (running || !started || frugal()) return
  running = true
  while (waiting.size) {
    const next = [...waiting].sort(byPosition)[0]
    waiting.delete(next)
    await next.load()
  }
  running = false
}

/**
 * Anota un video en la cola.
 * @param el    el elemento (para el orden en la página)
 * @param load  () => Promise: pide el video y se resuelve cuando ya se puede reproducir
 * @returns     cancel(): lo saca de la cola (si ya se pidió por otro lado o se desmonta)
 */
export function enqueue(el, load) {
  const item = { el, load }
  waiting.add(item)
  drain()
  return () => waiting.delete(item)
}

// Si la cola ya arrancó (antes, lo que está cerca espera: no le compite al de prioridad)
export const queueStarted = () => started

// La página tiene un video con prioridad: la cola lo espera (PlatformVideo lo avisa al
// montarse, antes de que termine de cargar la página)
export function claimPriority() {
  priority = true
}

// La cola arranca cuando el de prioridad ya se puede reproducir. Si no hay ninguno,
// cuando terminó de cargar la página; si lo hay, igual arranca a los 6 s de eso, por si
// nunca llega a reproducirse
export function startQueue() {
  if (started) return
  started = true
  drain()
}

if (typeof window !== 'undefined') {
  const later = () => {
    if (priority) setTimeout(startQueue, 6000)
    else if (window.requestIdleCallback) window.requestIdleCallback(startQueue, { timeout: 2500 })
    else setTimeout(startQueue, 800)
  }
  if (document.readyState === 'complete') later()
  else window.addEventListener('load', later, { once: true })
}
