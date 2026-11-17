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
      const typing = () => part(drawer, { top: drawer.offsetHeight - 250, height: 250 })

      // Arranca cerca del campo: se ve escribir la pregunta.
      await d.frameOn(typing(), { pad: AIR, duration: 0 })
      d.fade(1)
      await d.wait(900)
      await d.moveTo(input)
      await d.type(input, '¿Cómo viene la producción de hoy?', 36)
      await d.wait(350)
      await d.click(await d.until(() => d.find('.chat-send-btn')))
      d.hideCursor()

      // Sube a la conversación y va siguiendo la respuesta mientras llega.
      const bubble = await d.until(() => d.find('.chat-bubble.user'))
      await d.frameOn(part(bubble.parentElement, { top: bubble.offsetTop - 16, height: 230 }), { pad: AIR, duration: 1.3 })
      await d.wait(1500)
      await d.frameOn(await d.until(() => d.find('.rich-table-block'), 12000), { pad: AIR, duration: 1.4 })
      await d.wait(3000)
      await d.frameOn(await d.until(() => d.find('.rich-chart-block'), 12000), { pad: AIR, duration: 1.4 })
      await d.wait(3000)
      // Cierra abierto: la conclusión con el gráfico arriba.
      const chart = d.find('.rich-chart-block')
      await d.frameOn(part(chart, { top: 70, height: chart.offsetHeight + 40 }), { pad: AIR, duration: 1.4 })
      await d.wait(3200)
    },
    async reset(d) {
      d.find('button[aria-label="Nueva conversación"]')?.click()
      await d.wait(400)
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
    // Borra lo hecho y vuelve a entrar a la pantalla: las alarmas quedan como al principio.
    async reset(d) {
      d.win().__demoReset?.()
      d.find('.bottom-nav-item', 'Activos')?.click()
      await d.wait(600)
      d.find('.bottom-nav-item', 'Acciones')?.click()
      await d.until(() => d.find('.alarm-row.status-open'), 12000)
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
