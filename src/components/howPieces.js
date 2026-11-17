// Los componentes de la plataforma que flotan en «Cómo funciona»: un fragmento del
// tablero de la Envasadora 1 y, en el paso de Argus, el campo del chat con preguntas
// que se escriben y un recorrido por el reporte. Cada uno es la plataforma real con
// todo lo demás oculto (sin fondo, sin el resto de la pantalla), a escala ≤ 1.

const mobile = () => window.innerWidth < 720

/** Deja a la vista solo este elemento, sin el fondo de la app: queda flotando. */
function float(el) {
  for (let node = el; node.parentElement && node.tagName !== 'BODY'; node = node.parentElement) {
    for (const sibling of node.parentElement.children) if (sibling !== node) sibling.style.visibility = 'hidden'
    node.parentElement.style.background = 'none'
    node.parentElement.style.backdropFilter = 'none'
    node.parentElement.style.boxShadow = 'none'
  }
}

const rectOf = (el) => el.getBoundingClientRect()

/** El rectángulo que abarca todos estos elementos. */
function union(els) {
  const rs = els.map(rectOf)
  const left = Math.min(...rs.map((r) => r.left))
  const top = Math.min(...rs.map((r) => r.top))
  return { left, top, width: Math.max(...rs.map((r) => r.right)) - left, height: Math.max(...rs.map((r) => r.bottom)) - top }
}

/** El tamaño del cuadro donde se ve la app (en la landing). */
const stageOf = (d) => {
  const stage = d.win().frameElement.parentElement
  return { w: stage.clientWidth, h: stage.clientHeight }
}

/** Una hoja de estilos propia dentro de la app: le gana al estilo en línea que la
 * plataforma vuelve a escribir en cada actualización. */
function injectCss(d, css) {
  const style = d.doc().createElement('style')
  style.textContent = css
  d.doc().head.appendChild(style)
}

/** Encuadra `box` a la escala `s`, centrado; `top` (px del cuadro) lo apoya arriba. */
async function place(d, box, s, { top, duration = 0 } = {}) {
  const { w, h } = stageOf(d)
  const vw = w / s
  const vh = h / s
  const y = top === undefined ? box.top - (vh - box.height) / 2 : box.top - top / s
  await d.frameOn({ left: box.left - (vw - box.width) / 2, top: y, width: vw, height: vh }, { pad: 0, max: s, duration })
}

// ---------- Paso 3: Argus ----------
// Dos piezas distintas, del mismo ancho y alineadas: arriba el campo del chat, grande
// (la app angosta, agrandada), y abajo, separado, el reporte en una tarjeta más chica.
// El ancho de las dos lo fija la tarjeta del reporte (HowItWorks.vue, --argus-w).
const QUESTIONS = ['¿Por qué paró la Llenadora?', '¿Cómo viene la producción de hoy?', '¿Qué máquina consume más energía?']
const CARD_PAD = 20

export const HOW_PIECES = {
  // «Lo ves en vivo»: un fragmento del tablero. Arriba los cuatro indicadores; abajo,
  // los dos gráficos uno sobre otro, a todo el ancho del grupo. Más chico que el real.
  widget: {
    key: 'widget',
    route: '/dashboard',
    // Siempre el diseño de escritorio de la plataforma, también en el celular de la landing
    width: 1280,
    height: 1700,
    cut: false,
    async script(d) {
      // Por el título de la tarjeta (los nuevos, de una palabra, o los de antes)
      const card = (...titles) => titles.map((t) => d.find('.widget-card', t)).find(Boolean)
      await d.until(() => card('Temperatura De Mordazas')?.querySelector('canvas'), 14000)
      const indicators = [card('Producido'), card('Rechazos'), card('Energía'), card('Produciendo', 'En producción')].filter(Boolean)
      const charts = [card('Velocidad De Línea'), card('Temperatura De Mordazas')].filter(Boolean)
      const kept = [...indicators, ...charts]
      const grid = kept[0].parentElement
      // Cuatro indicadores en una fila y los dos gráficos debajo, a todo el ancho
      indicators.forEach((el, i) => el.setAttribute('data-how', `i${i}`))
      charts.forEach((el, i) => el.setAttribute('data-how', `c${i}`))
      injectCss(d, `
        .widgets-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; grid-template-rows: none !important; grid-auto-rows: auto !important; grid-auto-flow: row !important; }
        .widgets-grid > :not([data-how]) { display: none !important; }
        .widgets-grid > .widget-card[data-how^='i'] { grid-area: auto !important; grid-column: span 1 !important; grid-row: auto !important; min-height: 0 !important; }
        .widgets-grid > .widget-card[data-how^='c'] { grid-area: auto !important; grid-column: 1 / -1 !important; grid-row: auto !important; height: 300px !important; }
        [data-how='i0'] { order: 0 } [data-how='i1'] { order: 1 } [data-how='i2'] { order: 2 } [data-how='i3'] { order: 3 }
        [data-how='c0'] { order: 10 } [data-how='c1'] { order: 11 }
      `)
      // Los gráficos se vuelven a dibujar al nuevo ancho
      d.win().dispatchEvent(new (d.win().Event)('resize'))
      float(grid)
      await d.wait(600)
      const { w, h } = stageOf(d)
      const box = union(kept)
      // Con aire alrededor y siempre más chico que el tamaño real
      const s = Math.min(0.92, (w * 0.86) / box.width, (h * 0.86) / box.height)
      await d.frameOn(box, { pad: 0, max: s, duration: 0 })
      d.fade(1)
      await d.wait(14000)
    },
    async reset() {},
  },

  // Arriba: el campo del chat de Argus, grande, con preguntas que se escriben y se borran
  ask: {
    key: 'ask',
    route: '/ai',
    width: () => (mobile() ? 380 : 420),
    height: 900,
    cut: false,
    async script(d) {
      if (!d.find('.chat-drawer')) (await d.until(() => d.find('button[aria-label="Abrir Argus Chat"]'))).click()
      const row = await d.until(() => d.find('.chat-input-row'))
      const input = row.querySelector('.chat-input')
      float(row)
      // El campo solo: sin los bordes del panel del chat alrededor
      for (let node = row.parentElement; node && node.tagName !== 'BODY'; node = node.parentElement) node.style.border = 'none'
      await d.wait(700)
      if (!this.started) {
        const { w } = stageOf(d)
        const r = rectOf(row)
        await place(d, r, w / r.width)
        d.fade(1)
        this.started = true
      }
      const Proto = d.win().HTMLTextAreaElement
      const setValue = Object.getOwnPropertyDescriptor(input instanceof Proto ? Proto.prototype : d.win().HTMLInputElement.prototype, 'value').set
      const write = (text) => {
        setValue.call(input, text)
        input.dispatchEvent(new (d.win().Event)('input', { bubbles: true }))
      }
      for (const q of QUESTIONS) {
        await d.wait(700)
        await d.type(input, q, 52)
        await d.wait(1800)
        for (let i = q.length; i >= 0; i -= 2) {
          write(q.slice(0, i))
          await d.wait(18)
        }
      }
    },
    async reset() {},
  },

  // Abajo: una tarjeta que recorre el reporte de Argus, bloque por bloque
  report: {
    key: 'report',
    route: '/ai',
    width: () => (mobile() ? 390 : 640),
    height: 4600,
    cut: false,
    async script(d) {
      const findings = await d.until(() => {
        const list = [...d.doc().querySelectorAll('.argus-findings > li')]
        return list.length >= 3 && list
      }, 12000)
      const report = findings[0].closest('.argus-report') || findings[0].closest('.page-shell')
      const byTitle = (t) => findings.find((li) => li.textContent.includes(t))
      // Cada hallazgo: qué pasó, por qué y la evidencia (en celular, sin el gráfico)
      const extras = '.finding-why, .feedback, .finding-actions' + (mobile() ? ', .finding-evidence' : '')
      for (const li of findings) for (const extra of li.querySelectorAll(extras)) extra.style.display = 'none'
      // La tarjeta la pone la landing: los paneles de adentro, sin borde ni fondo propio
      injectCss(d, '.argus-panel, .argus-findings > li { border-color: transparent !important; background: none !important; box-shadow: none !important; }')
      float(report)
      await d.wait(300)
      const blocks = [d.find('.headline'), byTitle('mordazas'), byTitle('Llenadora'), byTitle('aire')].filter(Boolean)
      const all = [...report.querySelectorAll('.headline, .kpi-strip, .argus-findings > li, .topics, .argus-panel, .improvements, .argus-panel h2, .argus-panel h3, .argus-panel header')]
      const only = (shown) => {
        for (const el of all) el.style.visibility = shown.some((b) => b === el || b.contains(el) || el.contains(b)) ? '' : 'hidden'
      }
      const { w } = stageOf(d)
      const s = Math.min(0.85, (w - CARD_PAD * 2) / rectOf(findings[0]).width)
      let prev = null
      for (const block of [...blocks, blocks[0]]) {
        // Mientras la cámara pasa de un bloque al otro se ven los dos; después, solo el nuevo
        only(prev ? [prev, block] : [block])
        await place(d, rectOf(block), s, { top: CARD_PAD, duration: prev ? 1.4 : 0 })
        if (!prev) d.fade(1)
        only([block])
        if (block !== prev && prev && block === blocks[0]) break
        prev = block
        await d.wait(3600)
      }
    },
    async reset() {},
  },
}
