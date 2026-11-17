// Los segmentos de la grilla «partes clave»: cada uno es la plataforma real con la
// cámara encuadrando un componente y un guion corto en loop (ver platformDriver.js).
//
// `width` y `height`: tamaño de la pantalla de la app, en px. Hasta 768 de ancho la app
// usa su diseño de celular; con más, el de escritorio. Se elige el que mejor se lee en
// el cuadrado. Más alto = más contenido dibujado para que la cámara recorra.
//
// AIR: aire alrededor de lo encuadrado. Los cuadrados respiran: nunca se llenan.

const AIR = 58

/** Un rectángulo relativo a un elemento, para encuadrar solo una parte. */
function part(el, { top = 0, height, left = 0, width } = {}) {
  const r = el.getBoundingClientRect()
  return { left: r.left + left, top: r.top + top, width: width ?? r.width - left, height: height ?? r.height - top }
}

/** Deja a la vista solo este elemento: oculta todo lo demás de la app (lo de atrás). */
function isolate(el) {
  for (let node = el; node.parentElement && node.tagName !== 'BODY'; node = node.parentElement) {
    for (const sibling of node.parentElement.children) if (sibling !== node) sibling.style.visibility = 'hidden'
  }
}

const button = (root, label) => [...root.querySelectorAll('button')].find((b) => b.textContent.includes(label))

export const PIECES = [
  {
    key: 'argus',
    title: 'Preguntale a tu planta',
    text: 'Argus responde con los datos reales de tus equipos: qué pasó, por qué y qué conviene hacer.',
    route: '/plants',
    width: 1280,
    height: 1000,
    async script(d) {
      if (!d.find('.chat-drawer')) (await d.until(() => d.find('button[aria-label="Abrir Argus Chat"]'))).click()
      const drawer = await d.until(() => d.find('.chat-drawer'))
      const input = await d.until(() => d.find('.chat-input'))
      // El panel entra deslizándose: se mide recién cuando terminó. Y queda solo,
      // sin la pantalla de atrás.
      isolate(drawer)
      await d.wait(700)
      const messages = () => d.find('.chat-messages')
      const r = () => drawer.getBoundingClientRect()
      // Lo que hay escrito en el chat: desde arriba del panel hasta la última línea.
      const written = () => {
        const last = Math.max(...[...messages().children].map((c) => c.getBoundingClientRect().bottom))
        return { left: r().left, top: r().top, width: r().width, height: last + 20 - r().top }
      }
      const shot = (target) => ({ pad: AIR, max: 1.1, within: written(), target })

      // Arranca con el campo apoyado abajo del cuadro y el chat vacío arriba: se ve
      // escribir la pregunta.
      await d.frameOn(part(drawer, { top: drawer.offsetHeight - 300, height: 300 }), { pad: AIR, duration: 0, within: drawer })
      d.fade(1)
      await d.wait(900)
      await d.moveTo(input)
      await d.type(input, '¿Cómo viene la producción de hoy?', 36)
      await d.wait(350)
      await d.click(await d.until(() => d.find('.chat-send-btn')))
      d.hideCursor()

      // Sube a la pregunta y va siguiendo la respuesta mientras llega, sin pasar
      // nunca de la última línea escrita.
      const bubble = await d.until(() => d.find('.chat-bubble.user'))
      await d.frameOn(part(bubble, { top: -16, height: 230, left: -(r().width - bubble.offsetWidth) }), { ...shot(), duration: 1.3, align: 'top' })
      await d.wait(1500)
      const table = await d.until(() => d.find('.rich-table-block'), 12000)
      await d.frameOn(table, { ...shot(), duration: 1.4 })
      await d.wait(3000)
      const chart = await d.until(() => d.find('.rich-chart-block'), 12000)
      await d.frameOn(chart, { ...shot(), duration: 1.4 })
      await d.wait(2600)
      // Cierra con el gráfico y la conclusión, que es lo último que escribe.
      await d.until(() => written().top + written().height > chart.getBoundingClientRect().bottom + 30, 9000)
      const c = chart.getBoundingClientRect()
      await d.frameOn({ left: r().left, top: c.top, width: r().width, height: written().top + written().height - c.top }, { ...shot(), duration: 1.4 })
      await d.wait(3400)
    },
    // Al toque: conversación nueva y la cámara vuelve al campo, sin fundido
    cut: false,
    async reset(d) {
      d.find('button[aria-label="Nueva conversación"]')?.click()
      await d.until(() => !d.find('.chat-bubble.user'), 4000)
    },
  },
  {
    key: 'alarmas',
    title: 'Alertas en tiempo real',
    text: 'Cada desvío llega con su equipo y su severidad. Se reconoce y se resuelve desde el mismo lugar.',
    route: '/operations',
    width: 430,
    // Alta, para que los botones flotantes de la app queden lejos del encuadre
    height: 1700,
    async script(d) {
      const open = () => d.find('.alarm-row.status-open')
      const first = await d.until(open, 12000)
      const group = first.closest('.alarms-group')
      const list = () => part(d.find('.alarms-group') || group, { height: 330 })
      await d.frameOn(list(), { pad: AIR, duration: 0 })
      d.fade(1)
      await d.wait(1500)
      // Acerca la alarma abierta, la reconoce y después la resuelve: sale de la lista.
      await d.frameOn(first, { pad: AIR + 6, max: 1.15, duration: 1 })
      await d.wait(350)
      await d.click(await d.until(() => button(first, 'Reconocer')))
      await d.until(() => !open())
      await d.wait(1400)
      const row = d.find('.alarm-row', 'Sobretemperatura')
      if (row && button(row, 'Resolver')) await d.click(button(row, 'Resolver'))
      await d.wait(900)
      await d.frameOn(list(), { pad: AIR, duration: 1 })
      await d.wait(2400)
    },
    // Al toque: borra lo hecho y la app vuelve a pedir las alarmas (le avisa que la
    // pestaña volvió a estar visible): reaparecen abiertas en menos de medio segundo
    cut: false,
    async reset(d) {
      d.win().__demoReset?.()
      d.doc().dispatchEvent(new (d.win().Event)('visibilitychange'))
      await d.until(() => d.find('.alarm-row.status-open'), 6000)
    },
  },
  {
    key: 'mediciones',
    title: 'Monitoreo de producción',
    text: 'Velocidad, temperatura, consumo y producción de cada equipo, en vivo y con su historia.',
    route: '/dashboard',
    width: 600,
    // Bien alta: así entra todo el tablero y la barra de navegación queda lejos, abajo
    height: 3600,
    cut: false,
    async script(d) {
      await d.until(() => d.find('.widget-card canvas'), 14000)
      const card = (title) => d.until(() => d.find('.widget-card', title))
      const shot = { pad: AIR, max: 1.1 }
      // La primera vez aparece ya encuadrado; en las vueltas siguientes la cámara
      // vuelve desde el último gráfico, sin corte.
      await d.frameOn(await card('Velocidad De Línea'), { ...shot, duration: this.started ? 1.9 : 0 })
      this.started = true
      d.fade(1)
      await d.wait(3400)
      await d.frameOn(await card('Temperatura De Mordazas'), { ...shot, duration: 1.5 })
      await d.wait(3200)
      await d.frameOn(await card('Producción Por Hora'), { ...shot, duration: 1.7 })
      await d.wait(3200)
      await d.frameOn(await card('Estados de la máquina'), { ...shot, duration: 1.5 })
      await d.wait(3400)
    },
    async reset() {},
  },
  {
    key: 'activos',
    title: 'Todos tus equipos, de un vistazo',
    text: 'Qué está en marcha, qué está detenido y cuánto produjo cada uno hoy.',
    route: '/plants',
    width: 430,
    height: 1900,
    cut: false,
    async script(d) {
      const kpis = await d.until(() => d.find('.assets-kpis'), 12000)
      const filter = (label) => d.until(() => d.find('.assets-filter-option', label))
      const list = () => d.find('.assets-list')
      await d.frameOn(kpis, { pad: AIR, duration: this.started ? 1.6 : 0 })
      this.started = true
      d.fade(1)
      await d.wait(2800)
      // Filtra los detenidos: queda solo la Llenadora.
      const toolbar = d.find('.assets-toolbar')
      await d.frameOn(part(toolbar, { top: -12, height: 250 }), { pad: AIR, duration: 1.4 })
      await d.click(await filter('Detenidos'))
      await d.wait(2600)
      await d.click(await filter('Todos'))
      d.hideCursor()
      await d.wait(700)
      // Recorre la lista completa.
      await d.frameOn(part(list(), { height: 290 }), { pad: AIR, duration: 1.4 })
      await d.wait(2400)
      await d.frameOn(part(list(), { top: list().offsetHeight - 290, height: 290 }), { pad: AIR, duration: 2 })
      await d.wait(2600)
    },
    async reset() {},
  },
  {
    key: 'paradas',
    title: 'Cada parada, con su motivo',
    text: 'La plataforma detecta las paradas sola. Con un toque se marca el motivo, y aparece dónde se va el tiempo.',
    route: '/operations',
    width: 430,
    height: 2400,
    // Al toque, sin fundido: el reinicio deja a la vista las paradas de la Envasadora 2 y
    // el guion arranca eligiendo la Envasadora 1 en el selector real, que llega con su
    // parada sin motivo (la app vuelve a pedir las paradas al cambiar de equipo).
    cut: false,
    async script(d) {
      const tab = await d.until(() => d.find('.tab-btn', 'Paradas'), 12000)
      if (!d.find('.stops-section')) tab.click()
      const picker = () => d.find('.stops-section .base-select-trigger')
      const summary = () => part(d.find('.stops-kpis'), { height: 172 })
      const head = () => {
        const p = picker().getBoundingClientRect()
        const k = d.find('.stops-kpis').getBoundingClientRect()
        return { left: k.left, top: p.top - 6, width: k.width, height: k.top + 172 - p.top + 6 }
      }
      await d.until(() => picker() && d.find('.stops-kpis') && d.find('.stops-row'), 12000)
      await d.frameOn(head(), { pad: AIR, duration: 0 })
      d.fade(1)
      if (!picker().textContent.includes('Envasadora 1')) {
        await d.wait(1400)
        await d.click(picker())
        await d.wait(400)
        await d.click(await d.until(() => d.find('.base-select-option', 'Envasadora 1')))
        d.hideCursor()
      }
      const pending = () => d.find('.stops-row', 'Sin motivo')
      const row = await d.until(() => d.find('.stops-kpis') && pending(), 12000)
      await d.wait(300)
      // El resumen del día: cuántas paradas quedaron sin motivo.
      await d.frameOn(summary(), { pad: AIR, duration: 1 })
      await d.wait(2200)
      // Baja a la parada sin motivo, se lo pone y lo guarda.
      await d.frameOn(row, { pad: AIR, max: 1.1, duration: 1.4 })
      await d.click(await d.until(() => button(row, 'Poner motivo')))
      await d.wait(500)
      await d.frameOn(row, { pad: AIR, max: 1.1, duration: 0.8 })
      await d.click(await d.until(() => row.querySelector('.base-select-trigger')))
      await d.wait(450)
      await d.click(await d.until(() => d.find('.base-select-option', 'bobina') || d.find('.base-select-option')))
      await d.wait(500)
      await d.click(await d.until(() => button(row, 'Guardar')))
      d.hideCursor()
      await d.wait(1500)
      // Vuelve al resumen: ya no queda ninguna sin motivo.
      await d.frameOn(summary(), { pad: AIR, duration: 1.4 })
      await d.wait(3000)
    },
    async reset(d) {
      d.win().__demoReset?.()
      d.find('.stops-section .base-select-trigger')?.click()
      const other = await d.until(() => d.find('.base-select-option', 'Envasadora 2'), 4000)
      other.click()
      // Con sus paradas ya dibujadas (el resumen se redibuja al cambiar de equipo)
      await d.until(() => d.find('.stops-section .base-select-trigger', 'Envasadora 2') && d.find('.stops-kpis') && d.find('.stops-row'), 6000)
      await d.wait(300)
      await d.frameOn(
        (() => {
          const p = d.find('.stops-section .base-select-trigger').getBoundingClientRect()
          const k = d.find('.stops-kpis').getBoundingClientRect()
          return { left: k.left, top: p.top - 6, width: k.width, height: k.top + 172 - p.top + 6 }
        })(),
        { pad: AIR, duration: 1.2 },
      )
    },
  },
  {
    key: 'reporte',
    title: 'El resumen de tu planta, ya analizado',
    text: 'Argus revisa los datos y te marca qué requiere atención, con la evidencia y el próximo paso.',
    route: '/ai',
    width: 430,
    height: 3600,
    cut: false,
    async script(d) {
      const headline = await d.until(() => d.find('.headline'), 12000)
      await d.frameOn(headline, { pad: AIR, duration: this.started ? 1.9 : 0 })
      this.started = true
      d.fade(1)
      await d.wait(3600)
      // Los indicadores del período, de a dos.
      const tiles = await d.until(() => d.find('.kpi-strip-list'))
      await d.frameOn(part(tiles, { height: 165 }), { pad: AIR, duration: 1.5 })
      await d.wait(2600)
      await d.frameOn(part(tiles, { top: 165, height: 165 }), { pad: AIR, duration: 1.2 })
      await d.wait(2600)
      // El primer hallazgo: qué pasó y, más abajo, la evidencia.
      const finding = await d.until(() => d.find('.argus-findings > li'))
      await d.frameOn(part(finding, { height: 230 }), { pad: AIR, duration: 1.7 })
      await d.wait(3400)
      const evidence = finding.querySelector('figure, canvas, svg')?.closest('figure, div') || finding
      await d.frameOn(part(finding, { top: 215, height: 290 }), { pad: AIR, duration: 1.5 })
      void evidence
      await d.wait(3400)
    },
    async reset() {},
  },
]
