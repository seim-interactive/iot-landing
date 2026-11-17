// Los componentes de la plataforma que flotan en «Cómo funciona»: el gráfico de
// temperatura de las mordazas, la alarma de sobretemperatura y el hallazgo de Argus.
// Cada uno es la plataforma real con todo lo demás oculto (sin fondo, sin el resto
// de la pantalla) y la cámara sobre él, sin pasar nunca de su tamaño real.

const AIR = 24

// En celular la app se dibuja más angosta: así el componente entra sin achicarse tanto.
const width = () => (window.innerWidth < 720 ? 390 : 600)

/** Deja a la vista solo este elemento, sin el fondo de la app: queda flotando. */
function float(el) {
  for (let node = el; node.parentElement && node.tagName !== 'BODY'; node = node.parentElement) {
    for (const sibling of node.parentElement.children) if (sibling !== node) sibling.style.visibility = 'hidden'
    node.parentElement.style.background = 'none'
    node.parentElement.style.backdropFilter = 'none'
    node.parentElement.style.boxShadow = 'none'
  }
}

export const HOW_PIECES = {
  // «Lo ves en vivo»: el gráfico de temperatura, que se actualiza solo con cada lectura
  widget: {
    key: 'widget',
    route: '/dashboard',
    width,
    height: 2600,
    cut: false,
    async script(d) {
      const card = await d.until(() => d.find('.widget-card', 'Temperatura De Mordazas'), 14000)
      await d.until(() => card.querySelector('canvas'), 14000)
      float(card)
      await d.frameOn(card, { pad: AIR, max: 1, duration: 0 })
      d.fade(1)
      await d.wait(12000)
    },
    async reset() {},
  },

  // «Te avisa»: la alarma sola, dentro de su lista; el cursor la reconoce
  alarma: {
    key: 'alarma',
    route: '/operations',
    width,
    height: 1700,
    async script(d) {
      const row = await d.until(() => d.find('.alarm-row.status-open', 'Sobretemperatura'), 12000)
      // El panel entero de la lista (con su borde), con solo «Activas» y esta alarma
      const board = row.closest('.alarms-board') || row
      const group = row.closest('.alarms-group')
      for (const other of board.querySelectorAll('.alarms-group')) if (other !== group) other.style.display = 'none'
      for (const other of board.querySelectorAll('.alarm-row')) if (other !== row) other.style.display = 'none'
      board.style.maxHeight = 'none'
      board.style.minHeight = '0'
      float(board)
      await d.frameOn(board, { pad: AIR, max: 1, duration: 0 })
      d.fade(1)
      await d.wait(2400)
      const ack = await d.until(() => row.querySelector('[data-test="alarm-acknowledge"]'))
      await d.click(ack)
      await d.until(() => !row.classList.contains('status-open'))
      d.hideCursor()
      await d.wait(3600)
    },
    // Borra lo hecho y vuelve a cargar la app: la alarma vuelve a estar abierta.
    async reset(d) {
      d.win().__demoReset?.()
      await d.reload()
    },
  },

  // «Y te dice qué hacer»: el hallazgo de Argus sobre esas mismas mordazas
  argus: {
    key: 'argus',
    route: '/ai',
    width,
    height: 3600,
    cut: false,
    async script(d) {
      const finding = await d.until(() => d.find('.argus-findings > li', 'mordazas'), 12000)
      const panel = finding.closest('.argus-panel') || finding
      for (const other of panel.querySelectorAll('.argus-findings > li')) if (other !== finding) other.style.display = 'none'
      // Qué pasa y qué conviene hacer; sin la evidencia, el «¿Por qué?» ni la valoración
      for (const extra of finding.querySelectorAll('.finding-number, .finding-evidence, .finding-why, .feedback')) extra.style.display = 'none'
      float(panel)
      await d.frameOn(panel, { pad: AIR, max: 1, duration: 0 })
      d.fade(1)
      await d.wait(12000)
    },
    async reset() {},
  },
}
