// Los componentes de la plataforma que flotan en «Cómo funciona»: un fragmento del
// tablero de la Envasadora 1, la alarma de sobretemperatura y el hallazgo de Argus.
// Cada uno es la plataforma real con todo lo demás oculto (sin fondo, sin el resto
// de la pantalla) y la cámara sobre él, sin pasar nunca de su tamaño real.

const AIR = 16

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

// Paso 3: la alarma y el hallazgo son una sola pieza. Los dos paneles tienen el
// mismo ancho (la app al mismo ancho en los dos, 640 o 390 en celular) y quedan
// centrados, con GAP entre ellos: la alarma apoyada abajo de su cuadro y el hallazgo
// arriba del suyo.
const PAIR_WIDTH = 640
const GAP = 14

/** Encuadra `box` a escala ≤ 1, centrado a lo ancho y apoyado arriba o abajo del cuadro. */
async function pin(d, box, edge, options = {}) {
  const { w, h } = stageOf(d)
  const s = Math.min(1, w / box.width)
  const vw = w / s
  const vh = h / s
  const half = GAP / 2 / s
  const top = edge === 'bottom' ? box.top + box.height + half - vh : box.top - half
  await d.frameOn({ left: box.left - (vw - box.width) / 2, top, width: vw, height: vh }, { pad: 0, max: 1, ...options })
}

export const HOW_PIECES = {
  // «Lo ves en vivo»: un fragmento del tablero, cada tarjeta suelta sobre negro
  widget: {
    key: 'widget',
    route: '/dashboard',
    // En escritorio, la app a 1280: los cuatro de arriba y los dos gráficos de abajo
    // ocupan exactamente el mismo ancho.
    width: () => (mobile() ? 390 : 1280),
    height: 1700,
    cut: false,
    async script(d) {
      const card = (title) => d.find('.widget-card', title)
      await d.until(() => card('Temperatura De Mordazas')?.querySelector('canvas'), 14000)
      const grid = card('Producido hoy').parentElement
      const keep = mobile()
        ? ['Producido hoy', 'Rechazos hoy', 'Temperatura De Mordazas']
        : ['Producido hoy', 'Rechazos hoy', 'Energía hoy', 'En producción', 'Velocidad De Línea', 'Temperatura De Mordazas']
      const kept = keep.map(card).filter(Boolean)
      for (const other of grid.children) {
        if (kept.includes(other)) continue
        // En celular la grilla es una columna: se sacan y las elegidas quedan juntas.
        // En escritorio se ocultan sin moverse, para no romper la grilla.
        if (mobile()) other.style.display = 'none'
        else other.style.visibility = 'hidden'
      }
      float(grid)
      await d.wait(200)
      await d.frameOn(union(kept), { pad: AIR, max: 1, duration: 0 })
      d.fade(1)
      await d.wait(12000)
    },
    async reset() {},
  },

  // «Te avisa»: la alarma sola en su panel, sin el encabezado de la lista; el cursor la reconoce
  alarma: {
    key: 'alarma',
    route: '/operations',
    width: () => (mobile() ? 390 : PAIR_WIDTH),
    height: 1700,
    async script(d) {
      const row = await d.until(() => d.find('.alarm-row.status-open', 'Sobretemperatura'), 12000)
      const board = row.closest('.alarms-board') || row
      const group = row.closest('.alarms-group')
      for (const other of board.querySelectorAll('.alarms-group')) if (other !== group) other.style.display = 'none'
      for (const other of board.querySelectorAll('.alarm-row')) if (other !== row) other.style.display = 'none'
      for (const header of board.querySelectorAll('.alarms-group-header')) header.style.display = 'none'
      board.style.maxHeight = 'none'
      board.style.minHeight = '0'
      float(board)
      await d.wait(150)
      await pin(d, rectOf(board), 'bottom', { duration: 0 })
      d.fade(1)
      await d.wait(2600)
      await d.click(await d.until(() => row.querySelector('[data-test="alarm-acknowledge"]')))
      await d.until(() => !row.classList.contains('status-open'))
      d.hideCursor()
      await d.wait(3800)
    },
    // Borra lo hecho y le avisa a la app que la pestaña volvió a estar visible: la
    // plataforma vuelve a pedir las alarmas (como cuando el operario vuelve a la
    // pestaña) y la alarma reaparece abierta en ~0,3 s, sin recargar.
    async reset(d) {
      d.win().__demoReset?.()
      d.doc().dispatchEvent(new (d.win().Event)('visibilitychange'))
      await d.until(() => d.find('.alarm-row.status-open', 'Sobretemperatura'), 12000)
    },
  },

  // «Y te dice qué hacer»: el hallazgo de Argus sobre esas mismas mordazas
  argus: {
    key: 'argus',
    route: '/ai',
    width: () => (mobile() ? 390 : PAIR_WIDTH),
    height: 3600,
    cut: false,
    async script(d) {
      const finding = await d.until(() => d.find('.argus-findings > li', 'mordazas'), 12000)
      const panel = finding.closest('.argus-panel') || finding
      for (const other of panel.querySelectorAll('.argus-findings > li')) if (other !== finding) other.style.display = 'none'
      // Qué pasa y qué conviene hacer; sin la evidencia, el «¿Por qué?», la valoración
      // ni el número (con un solo hallazgo, la tarjeta va en una columna)
      for (const extra of finding.querySelectorAll('.finding-number, .finding-evidence, .finding-why, .feedback')) extra.style.display = 'none'
      const article = finding.querySelector('article')
      if (article) article.style.display = 'block'
      float(panel)
      await d.wait(150)
      await pin(d, rectOf(panel), 'top', { duration: 0 })
      d.fade(1)
      await d.wait(12000)
    },
    async reset() {},
  },
}
