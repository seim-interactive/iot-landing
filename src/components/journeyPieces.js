// Los tramos de «Cómo funciona» que pasan por la plataforma: el mismo dato (la
// temperatura de las mordazas de la Envasadora 1) en el tablero, en la alarma y en
// el hallazgo de Argus. Cada uno es la plataforma real con la cámara sobre un solo
// componente (ver platformDriver.js), sin pasar nunca de su tamaño real.

const AIR = 28

function part(el, { top = 0, height } = {}) {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top + top, width: r.width, height: height ?? r.height - top }
}

const button = (root, label) => [...root.querySelectorAll('button')].find((b) => b.textContent.includes(label))

export const JOURNEY_PIECES = {
  widget: {
    key: 'widget',
    route: '/dashboard',
    width: 600,
    height: 3600,
    cut: false,
    async script(d) {
      const card = await d.until(() => d.find('.widget-card', 'Temperatura De Mordazas'), 14000)
      await d.until(() => card.querySelector('canvas'), 14000)
      await d.frameOn(card, { pad: AIR, max: 1, duration: 0 })
      d.fade(1)
      // Queda en vivo: el gráfico se actualiza solo con cada lectura.
      await d.wait(8000)
    },
    async reset() {},
  },

  alarma: {
    key: 'alarma',
    route: '/operations',
    width: 430,
    height: 1700,
    async script(d) {
      const row = await d.until(() => d.find('.alarm-row.status-open', 'Sobretemperatura'), 12000)
      // La alarma sola, con el título de la lista arriba
      const group = row.closest('.alarms-group') || row
      const g = group.getBoundingClientRect()
      const r = row.getBoundingClientRect()
      await d.frameOn({ left: g.left, top: g.top, width: g.width, height: r.bottom - g.top + 8 }, { pad: AIR, max: 1, duration: 0 })
      d.fade(1)
      await d.wait(2200)
      const ack = await d.until(() => button(row, 'Reconocer') || row.querySelector('[data-test="alarm-acknowledge"]'))
      await d.click(ack)
      await d.until(() => !row.classList.contains('status-open'))
      d.hideCursor()
      await d.wait(3000)
    },
    // Borra lo hecho y vuelve a entrar: la alarma vuelve a estar abierta.
    async reset(d) {
      d.win().__demoReset?.()
      d.find('.bottom-nav-item', 'Activos')?.click()
      await d.wait(600)
      d.find('.bottom-nav-item', 'Acciones')?.click()
      await d.until(() => d.find('.alarm-row.status-open', 'Sobretemperatura'), 12000)
    },
  },

  argus: {
    key: 'argus',
    route: '/ai',
    width: 430,
    height: 3600,
    cut: false,
    async script(d) {
      const finding = await d.until(() => d.find('.argus-findings > li', 'mordazas'), 12000)
      // El hallazgo: qué pasa y qué conviene hacer, y después la evidencia.
      await d.frameOn(part(finding, { top: -44, height: 300 }), { pad: AIR, max: 1, duration: this.started ? 1.6 : 0, align: 'top' })
      this.started = true
      d.fade(1)
      await d.wait(4200)
      await d.frameOn(part(finding, { top: 170, height: 330 }), { pad: AIR, max: 1, duration: 1.6, align: 'top' })
      await d.wait(4200)
    },
    async reset() {},
  },
}
