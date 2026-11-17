// Maneja la plataforma real cargada en un iframe del mismo origen, como lo haría
// una persona: busca los elementos reales, espera a que existan, mueve el cursor,
// hace clic, escribe y scrollea. Lo usan el recorrido del hero (platformTour.js) y
// los segmentos de la grilla (platformPieces.js).
//
// Nada se dibuja a mano. Si la plataforma cambia y un paso no encuentra lo suyo,
// el guion vuelve a empezar en vez de quedarse trabado.
import gsap from 'gsap'

const STOP = Symbol('stop')

/**
 * @param frame   el iframe con la app, o una función que lo devuelve (el cuadrado puede alternar entre dos)
 * @param cursor  el elemento del cursor; tiene que compartir contenedor con el iframe
 * @param script  async (driver) => {}: una vuelta completa del guion; se repite sola
 * @param reset   async (driver) => {}: deja la app lista para la vuelta siguiente
 * @param camera  true si el guion mueve la cámara (zoom y paneo sobre el iframe)
 * @param touch   () => boolean: sin cursor (celular)
 * @param cut     false = la vuelta siguiente empalma sin fundido a negro
 */
export function createDriver({ frame, cursor, script, reset, camera = false, touch = () => false, cut = true }) {
  let alive = true
  let visible = false
  let started = false
  let run = 0
  const view = { x: 0, y: 0, scale: 1 }

  const F = () => (typeof frame === 'function' ? frame() : frame)
  const doc = () => F().contentDocument
  const win = () => F().contentWindow
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const check = (id) => {
    if (!alive || id !== run) throw STOP
  }

  function applyView() {
    F().style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`
  }

  function make(id) {
    // El tiempo del guion solo corre mientras se ve.
    async function wait(ms) {
      let left = ms
      while (left > 0) {
        check(id)
        if (visible && !document.hidden) left -= 80
        await sleep(80)
      }
    }

    function find(selector, text) {
      return [...doc().querySelectorAll(selector)].find(
        (el) => el.getClientRects().length && (!text || el.textContent.trim().includes(text))
      )
    }

    async function until(get, timeout = 9000) {
      for (let waited = 0; waited < timeout; waited += 80) {
        check(id)
        const value = get()
        if (value) return value
        await sleep(80)
      }
      throw new Error('El guion no encontró un elemento de la plataforma')
    }

    // Dónde cae un punto de la app dentro del contenedor, con el zoom y el paneo actuales.
    function place(el) {
      const rect = el.getBoundingClientRect()
      const box = F().getBoundingClientRect()
      const parent = cursor.offsetParent.getBoundingClientRect()
      const k = box.width / F().offsetWidth
      return {
        x: box.left - parent.left + (rect.left + Math.min(rect.width / 2, 120)) * k,
        y: box.top - parent.top + (rect.top + rect.height / 2) * k,
      }
    }

    async function moveTo(el) {
      if (touch()) return
      gsap.to(cursor, { opacity: 1, duration: 0.3, overwrite: 'auto' })
      await gsap.to(cursor, { ...place(el), duration: 0.75, ease: 'power2.inOut' })
      await wait(120)
    }

    async function click(el) {
      await moveTo(el)
      if (!touch()) gsap.fromTo(cursor, { scale: 0.82 }, { scale: 1, duration: 0.35, ease: 'power2.out' })
      el.click()
    }

    // Los campos son de Vue: hay que usar el setter nativo y avisar con `input`.
    async function type(el, text, pace = 46) {
      const Proto = el instanceof win().HTMLTextAreaElement ? win().HTMLTextAreaElement : win().HTMLInputElement
      const setValue = Object.getOwnPropertyDescriptor(Proto.prototype, 'value').set
      el.focus({ preventScroll: true })
      for (let i = 1; i <= text.length; i++) {
        setValue.call(el, text.slice(0, i))
        el.dispatchEvent(new (win().Event)('input', { bubbles: true }))
        await wait(pace + ((i * 37) % 40))
      }
    }

    async function scroll(el, top, duration = 1.6) {
      if (!el) return
      await gsap.to(el, { scrollTop: top, duration, ease: 'power2.inOut' })
      await wait(200)
    }

    // Cámara: encuadra un elemento de la app (o un rectángulo {left, top, width, height}
    // en px de la app) dentro del contenedor, con `pad` px de aire alrededor.
    // `within`: hasta dónde hay contenido. La cámara no muestra más allá de sus bordes
    // de arriba y de abajo (más el aire): así no quedan huecos vacíos en el cuadro.
    async function frameOn(target, { pad = 24, duration = 1.4, max = 1.25, align = 'center', within } = {}) {
      const rect = target.getBoundingClientRect ? target.getBoundingClientRect() : target
      const stage = cursor.offsetParent
      const w = stage.clientWidth
      const h = stage.clientHeight
      const scale = Math.min(max, (w - pad * 2) / rect.width, (h - pad * 2) / rect.height)
      let x = (w - rect.width * scale) / 2 - rect.left * scale
      let y = align === 'top' ? pad - rect.top * scale : (h - rect.height * scale) / 2 - rect.top * scale
      if (within) {
        const box = within.getBoundingClientRect ? within.getBoundingClientRect() : within
        // Lo mismo a lo ancho: ni a la izquierda ni a la derecha del contenido
        const leftmost = w - pad - (box.left + box.width) * scale
        const rightmost = pad - box.left * scale
        if (leftmost <= rightmost) x = Math.min(rightmost, Math.max(leftmost, x))
        const lowest = h - pad - (box.top + box.height) * scale
        const highest = pad - box.top * scale
        // Si el contenido es más bajo que el cuadro, manda el borde de arriba: lo
        // que viene después (una respuesta que se está escribiendo) crece hacia abajo.
        y = lowest > highest ? highest : Math.min(highest, Math.max(lowest, y))
      }
      gsap.to(cursor, { opacity: 0, duration: 0.2, overwrite: 'auto' })
      if (duration === 0) {
        Object.assign(view, { x, y, scale })
        applyView()
        return
      }
      await gsap.to(view, { x, y, scale, duration, ease: 'power3.inOut', onUpdate: applyView })
      await wait(150)
    }

    // La pantalla entera de la app, como rectángulo para la cámara
    const screen = () => ({ left: 0, top: 0, width: F().offsetWidth, height: F().offsetHeight })
    // Vuelve a cargar la app desde su dirección original. No sirve location.reload():
    // la app ya cambió su propia dirección a la de la ruta (/operations…), que en el
    // origen de la landing es otra página.
    async function reload() {
      F().src = F().getAttribute('src')
      await wait(600)
      await until(() => doc()?.querySelector('#app')?.firstElementChild && win().__demo, 20000)
    }

    const fade = (opacity, duration = 0.5) => gsap.to(F(), { opacity, duration })
    const hideCursor = () => gsap.to(cursor, { opacity: 0, duration: 0.3 })

    return { wait, find, until, moveTo, click, type, scroll, frameOn, screen, reload, fade, hideCursor, doc, win, touch }
  }

  async function loop() {
    const id = ++run
    const d = make(id)
    try {
      await d.until(() => doc()?.querySelector('#app')?.firstElementChild && win().__demo, 20000)
      let lap = 0
      while (alive && id === run) {
        // Para el grabador de videos (scripts/grabar-plataforma): avisa cuándo
        // empieza cada vuelta del guion, así graba exactamente una y el video
        // vuelve a empezar sin salto. En la landing no hay nadie escuchando.
        window.__loopMark?.(++lap)
        await script(d)
        d.hideCursor()
        if (cut) await d.fade(0)
        await reset?.(d)
      }
    } catch (error) {
      if (error === STOP || !alive) return
      console.warn('[plataforma]', error.message)
      await sleep(1500)
      if (!alive || id !== run) return
      await gsap.to(F(), { opacity: 0, duration: 0.4 })
      try {
        await reset?.(make(id))
      } catch {
        /* se reintenta en la vuelta siguiente */
      }
      loop()
    }
  }

  if (camera) applyView()

  return {
    /** `canStart`: recién ahí arranca por primera vez; después corre mientras `next` sea true. */
    setVisible(next, canStart = next) {
      visible = next
      // Fuera de pantalla, la app deja de recibir datos en vivo (ver kit/network.ts).
      try {
        if (win()) win().__demoPaused = !next
      } catch {
        /* el iframe todavía no cargó */
      }
      if (canStart && !started) {
        started = true
        loop()
      }
    },
    destroy() {
      alive = false
      gsap.killTweensOf([cursor, F(), view])
    },
  }
}
