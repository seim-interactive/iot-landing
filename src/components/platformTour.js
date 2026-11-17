// El recorrido del hero por la plataforma real (ver platformDriver.js): entra por el
// login, mira Mediciones, pasa por Activos, Acciones e IA, y le pregunta algo a Argus.
import { createDriver } from './platformDriver'

const EMAIL = 'operaciones@plantademo.com'
const QUESTION = '¿Por qué está detenida la Llenadora?'

// `cut`: false = la vuelta siguiente empalma sin fundido (el grabador de videos:
// del final de Argus al login, con corte seco)
export function createPlatformTour({ frame, cursor, mode, cut = true }) {
  const mobile = () => mode() === 'mobile'

  async function goTo(d, label) {
    const item = () => (mobile() ? d.find('.bottom-nav-item', label) : d.find('#app-sidebar .sidebar-item', label))
    await d.click(await d.until(item))
    await d.wait(900)
  }

  async function script(d) {
    d.fade(1)

    // Login
    const email = await d.until(() => d.find('#login-email'))
    await d.wait(900)
    await d.moveTo(email)
    await d.type(email, EMAIL)
    await d.wait(250)
    const password = d.find('#login-password')
    await d.moveTo(password)
    await d.type(password, '••••••••••', 60)
    await d.wait(350)
    await d.click(await d.until(() => d.find('button[type="submit"]')))
    await d.until(() => d.find('.app-main'), 12000)

    // Mediciones
    await d.until(() => d.find('.app-main canvas'), 12000)
    await d.wait(3600)
    await d.scroll(d.find('.app-main'), mobile() ? 620 : 520)
    await d.wait(3200)
    await d.scroll(d.find('.app-main'), 0, 1.1)

    // Activos
    await goTo(d, 'Activos')
    await d.until(() => d.find('.app-main', 'Llenadora'))
    await d.wait(3400)

    // Acciones
    await goTo(d, 'Acciones')
    await d.until(() => d.find('.tab-btn', 'Paradas'))
    await d.wait(2800)
    await d.click(d.find('.tab-btn', 'Paradas'))
    await d.wait(3400)

    // IA
    await goTo(d, 'IA')
    await d.wait(3000)
    await d.scroll(d.find('.app-main'), mobile() ? 520 : 420)
    await d.wait(2600)
    await d.scroll(d.find('.app-main'), 0, 1)

    // Argus
    await d.click(await d.until(() => d.find('button[aria-label="Abrir Argus Chat"]')))
    const input = await d.until(() => d.find('.chat-input'))
    await d.wait(700)
    await d.moveTo(input)
    await d.type(input, QUESTION, 34)
    await d.wait(400)
    await d.click(await d.until(() => d.find('.chat-send-btn')))
    // La respuesta llega de a partes, como en la plataforma.
    await d.wait(11000)
    const close = d.find('.chat-drawer button[aria-label="Cerrar"]')
    if (close) await d.click(close)
    await d.wait(600)
  }

  // Vuelve al login. Ya con el login en pantalla, la app pasa al tablero por debajo: al
  // volver a entrar, la app sigue en la última página que tenía abierta (IA) y la vuelta
  // siguiente arrancaría distinta de la primera (el guion espera Mediciones).
  async function reset(d) {
    d.win().__demo?.signOut()
    await d.until(() => d.find('#login-email'))
    const router = d.doc().querySelector('#app')?.__vue_app__?.config.globalProperties.$router
    await router?.replace('/dashboard')
    await d.wait(300)
  }

  return createDriver({ frame, cursor, script, reset, touch: mobile, cut })
}
