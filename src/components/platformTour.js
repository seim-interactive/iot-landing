// Recorrido por la plataforma real cargada en el iframe de PlatformStage.
//
// No hay nada dibujado a mano: el script usa la app como una persona. Escribe en el
// login, hace clic en la barra lateral, scrollea el tablero y le pregunta algo a Argus.
// Por eso cada paso busca los elementos reales (por selector o por texto) y espera a
// que existan. Si la plataforma cambia y un paso no encuentra lo suyo, el recorrido
// vuelve a empezar en vez de quedarse trabado.
import gsap from 'gsap'

const STOP = Symbol('stop')
const EMAIL = 'operaciones@plantademo.com'
const QUESTION = '¿Por qué está detenida la Llenadora?'

export function createPlatformTour({ frame, cursor, mode }) {
  let alive = true
  let visible = false
  let started = false
  let run = 0

  const doc = () => frame.contentDocument
  const win = () => frame.contentWindow
  const scale = () => frame.getBoundingClientRect().width / frame.offsetWidth
  const mobile = () => mode() === 'mobile'
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  // El tiempo del recorrido solo corre mientras el marco se ve.
  async function wait(ms, id) {
    let left = ms
    while (left > 0) {
      if (!alive || id !== run) throw STOP
      if (visible && !document.hidden) left -= 80
      await sleep(80)
    }
  }

  function find(selector, text) {
    return [...doc().querySelectorAll(selector)].find(
      (el) => el.getClientRects().length && (!text || el.textContent.trim().includes(text))
    )
  }

  async function until(get, id, timeout = 9000) {
    for (let waited = 0; waited < timeout; waited += 80) {
      if (!alive || id !== run) throw STOP
      const value = get()
      if (value) return value
      await sleep(80)
    }
    throw new Error('El recorrido no encontró un elemento de la plataforma')
  }

  async function moveTo(el, id) {
    if (mobile()) return
    const rect = el.getBoundingClientRect()
    const k = scale()
    const x = (rect.left + Math.min(rect.width / 2, 120)) * k
    const y = (rect.top + rect.height / 2) * k
    gsap.to(cursor, { opacity: 1, duration: 0.3, overwrite: 'auto' })
    await gsap.to(cursor, { x, y, duration: 0.75, ease: 'power2.inOut' })
    await wait(120, id)
  }

  async function click(el, id) {
    await moveTo(el, id)
    if (!mobile()) gsap.fromTo(cursor, { scale: 0.82 }, { scale: 1, duration: 0.35, ease: 'power2.out' })
    el.click()
  }

  // Los campos son de Vue: hay que usar el setter nativo y avisar con `input`.
  async function type(el, text, id, pace = 46) {
    const Proto = el instanceof win().HTMLTextAreaElement ? win().HTMLTextAreaElement : win().HTMLInputElement
    const setValue = Object.getOwnPropertyDescriptor(Proto.prototype, 'value').set
    el.focus({ preventScroll: true })
    for (let i = 1; i <= text.length; i++) {
      setValue.call(el, text.slice(0, i))
      el.dispatchEvent(new (win().Event)('input', { bubbles: true }))
      await wait(pace + ((i * 37) % 40), id)
    }
  }

  async function scrollMain(top, id, duration = 1.6) {
    const main = find('.app-main')
    if (!main) return
    await gsap.to(main, { scrollTop: top, duration, ease: 'power2.inOut' })
    await wait(200, id)
  }

  const navItem = (label) => (mobile() ? find('.bottom-nav-item', label) : find('#app-sidebar .sidebar-item', label))

  async function goTo(label, id) {
    await click(await until(() => navItem(label), id), id)
    await wait(900, id)
  }

  // ---------- Los pasos ----------

  async function login(id) {
    const email = await until(() => find('#login-email'), id)
    await wait(900, id)
    await moveTo(email, id)
    await type(email, EMAIL, id)
    await wait(250, id)
    const password = find('#login-password')
    await moveTo(password, id)
    await type(password, '••••••••••', id, 60)
    await wait(350, id)
    await click(await until(() => find('button[type="submit"]'), id), id)
    await until(() => find('.app-main'), id, 12000)
  }

  async function measurements(id) {
    await until(() => find('.app-main canvas'), id, 12000)
    await wait(3600, id)
    await scrollMain(mobile() ? 620 : 520, id)
    await wait(3200, id)
    await scrollMain(0, id, 1.1)
  }

  async function assets(id) {
    await goTo('Activos', id)
    await until(() => find('.app-main', 'Llenadora'), id)
    await wait(3400, id)
  }

  async function actions(id) {
    await goTo('Acciones', id)
    await until(() => find('.tab-btn', 'Paradas'), id)
    await wait(2800, id)
    await click(find('.tab-btn', 'Paradas'), id)
    await wait(3400, id)
  }

  async function insights(id) {
    await goTo('IA', id)
    await wait(3000, id)
    await scrollMain(mobile() ? 520 : 420, id)
    await wait(2600, id)
    await scrollMain(0, id, 1)
  }

  async function chat(id) {
    await click(await until(() => find('button[aria-label="Abrir Argus Chat"]'), id), id)
    const input = await until(() => find('.chat-input'), id)
    await wait(700, id)
    await moveTo(input, id)
    await type(input, QUESTION, id, 34)
    await wait(400, id)
    await click(await until(() => find('.chat-send-btn'), id), id)
    // La respuesta llega de a partes, como en la plataforma.
    await wait(11000, id)
    const close = find('.chat-drawer button[aria-label="Cerrar"]')
    if (close) await click(close, id)
    await wait(600, id)
  }

  async function loop() {
    const id = ++run
    try {
      while (alive && id === run) {
        await until(() => doc()?.querySelector('#app')?.firstElementChild && win().__demo, id, 20000)
        if (win().__demo.isSignedIn()) {
          win().__demo.signOut()
          await wait(500, id)
        }
        gsap.to(frame, { opacity: 1, duration: 0.5 })
        await login(id)
        await measurements(id)
        await assets(id)
        await actions(id)
        await insights(id)
        await chat(id)
        // Vuelve al login con un fundido, sin que se vea el cambio de pantalla.
        gsap.to(cursor, { opacity: 0, duration: 0.3 })
        await gsap.to(frame, { opacity: 0, duration: 0.5 })
        await goToStart(id)
      }
    } catch (error) {
      if (error === STOP || !alive) return
      console.warn('[plataforma]', error.message)
      await sleep(1500)
      if (alive && id === run) {
        await gsap.to(frame, { opacity: 0, duration: 0.4 })
        await goToStart(id).catch(() => {})
        loop()
      }
    }
  }

  async function goToStart(id) {
    win().__demo?.signOut()
    await until(() => find('#login-email'), id)
    gsap.set(cursor, { opacity: 0 })
  }

  return {
    setVisible(next, canStart = next) {
      visible = next
      if (canStart && !started) {
        started = true
        loop()
      }
    },
    destroy() {
      alive = false
      gsap.killTweensOf([cursor, frame])
    },
  }
}
