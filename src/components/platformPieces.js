// Los segmentos de la grilla «partes clave»: cada uno es la plataforma real, en su
// diseño de celular, con la cámara encuadrando un solo componente y un guion corto
// en loop (ver platformDriver.js).
//
// `width` y `height`: tamaño de la pantalla de la app, en px. Hasta 768 de ancho la app
// usa su diseño de celular. Más alto = más contenido dibujado para que la cámara
// recorra. `height: 'fit'` = la pantalla tiene la proporción exacta del cuadrado (para
// lo que va pegado abajo, como el campo del chat).

export const PIECES = [
  {
    key: 'argus',
    title: 'Preguntale a tu planta',
    text: 'Argus responde con los datos reales de tus equipos: qué pasó, por qué y qué conviene hacer.',
    route: '/ai',
    width: 390,
    height: 'fit',
    async script(d) {
      await d.frameOn(d.screen(), { pad: 0, max: 4, duration: 0, align: 'top' })
      if (!d.find('.chat-drawer')) (await d.until(() => d.find('button[aria-label="Abrir Argus Chat"]'))).click()
      const input = await d.until(() => d.find('.chat-input'))
      d.fade(1)
      await d.wait(1200)
      await d.moveTo(input)
      await d.type(input, '¿Cómo viene la producción de hoy?', 38)
      await d.wait(450)
      await d.click(await d.until(() => d.find('.chat-send-btn')))
      d.hideCursor()
      // La respuesta llega de a partes; la lista baja sola con cada tramo.
      await d.wait(13000)
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
      const button = (row, label) => [...row.querySelectorAll('button')].find((b) => b.textContent.includes(label))
      const first = await d.until(open, 12000)
      const group = first.closest('.alarms-group')
      await d.frameOn(group, { pad: 14, max: 1.2, duration: 0, align: 'top' })
      d.fade(1)
      await d.wait(2400)
      // Acerca la alarma abierta, la reconoce y después la resuelve: sale de la lista.
      await d.frameOn(first, { pad: 18, max: 1.3, duration: 1.3 })
      await d.wait(600)
      await d.click(await d.until(() => button(first, 'Reconocer')))
      await d.until(() => !open())
      await d.wait(2200)
      const row = d.find('.alarm-row', 'Sobretemperatura')
      if (row && button(row, 'Resolver')) await d.click(button(row, 'Resolver'))
      await d.wait(1600)
      await d.frameOn(d.find('.alarms-group') || group, { pad: 14, max: 1.2, duration: 1.3, align: 'top' })
      await d.wait(3400)
    },
    // Borra lo hecho y vuelve a entrar a la pantalla: las alarmas quedan como al principio.
    async reset(d) {
      d.win().__demoReset?.()
      d.find('.bottom-nav-item', 'Activos')?.click()
      await d.wait(700)
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
    async script(d) {
      await d.until(() => d.find('.widget-card canvas'), 14000)
      const card = (title) => d.until(() => d.find('.widget-card', title))
      const shot = { pad: 16, max: 1.3 }
      // La primera vez aparece ya encuadrado; en las vueltas siguientes la cámara
      // vuelve desde el último gráfico, sin corte.
      await d.frameOn(await card('Velocidad De Línea'), { ...shot, duration: this.started ? 1.9 : 0 })
      this.started = true
      d.fade(1)
      await d.wait(3600)
      await d.frameOn(await card('Temperatura De Mordazas'), { ...shot, duration: 1.5 })
      await d.wait(3400)
      await d.frameOn(await card('Producción Por Hora'), { ...shot, duration: 1.7 })
      await d.wait(3400)
      await d.frameOn(await card('Estados de la máquina'), { ...shot, duration: 1.5 })
      await d.wait(3600)
    },
    cut: false,
    async reset() {},
  },
]
