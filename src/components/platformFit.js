// El guion de «A tu medida» (ver PlatformFit.vue): la misma plataforma con un tablero
// distinto para cada equipo. Cambia de equipo con el selector real y el tablero pasa a
// ser el de esa máquina. Lo usa el grabador de videos (src/grabar.js).
//
// `small`: el celular de la landing. Ahí la app va con su diseño de escritorio a 1100 px
// de ancho, donde el tablero entero mide 1100 × 1400; en escritorio, una pantalla real
// de 1680 × 945 (16:9), así la interfaz se ve a escala de escritorio, no ampliada.
// `onMachine(name)`: avisa qué equipo muestra el selector (la pestaña de arriba).
export const MACHINES = ['Envasadora 1', 'Horno', 'Llenadora', 'Envasadora 2']

export function createFitPiece({ small, onMachine = () => {} }) {
  return {
    key: 'medida',
    started: false,
    route: '/dashboard',
    width: small ? 1100 : 1680,
    // El alto sale de la proporción de la caja (PlatformPiece)
    height: 'fit',
    cut: false,
    async script(d) {
      await d.until(() => d.find('.widget-card canvas'), 14000)
      // La pestaña muestra el equipo que tiene el selector real: cuando la app se
      // vuelve a cargar, arranca de nuevo en el primero.
      const current = d.find('[data-test="plc-switcher-trigger"]')?.textContent || ''
      onMachine(MACHINES.find((name) => current.includes(name)) || MACHINES[0])
      // El menú lateral contraído: el tablero gana ancho y se ve entero.
      const collapse = d.find('[data-test="sidebar-collapse"][aria-expanded="true"]')
      if (collapse) {
        collapse.click()
        await d.wait(500)
      }
      // La pantalla entera, y para elegir el equipo la cámara se acerca al selector.
      // Se ve nítido porque el iframe no lleva will-change (ver PlatformPiece): el
      // navegador lo vuelve a dibujar al tamaño acercado en vez de estirar una imagen.
      const whole = () => d.screen()
      await d.frameOn(whole(), { pad: 0, max: 1, duration: this.started ? 1.4 : 0 })
      this.started = true
      d.fade(1)
      await d.wait(3000)

      for (const name of [...MACHINES.slice(1), MACHINES[0]]) {
        const trigger = await d.until(() => d.find('[data-test="plc-switcher-trigger"]'))
        const r = trigger.getBoundingClientRect()
        // Nunca más allá de los bordes de la plataforma: si no, asoma el fondo del marco.
        // En el celular, un recorte con la proporción de la caja (entra la lista abierta).
        // En escritorio, un recorte de 16:9 que deja ver la lista abierta (×1,35 aprox.)
        const selector = small
          ? { left: r.right - 520, top: 0, width: 540, height: 687 }
          : { left: r.right - 740, top: 0, width: 760, height: 428 }
        await d.frameOn(selector, { pad: 0, max: 2, duration: 1.3, within: whole() })
        await d.click(trigger)
        await d.wait(500)
        await d.click(await d.until(() => d.find('.plc-switcher-option', name)))
        onMachine(name)
        d.hideCursor()
        // Se queda en el selector mientras carga el tablero nuevo: se aleja recién
        // cuando los gráficos tienen sus datos y las agujas llegaron a su valor.
        await d.until(() => !d.find('[data-test="dashboard-skeleton"]') && d.find('.widget-card canvas'), 14000)
        await d.wait(1600)
        // En el celular, antes de la vista entera, de cerca: el nombre del equipo, sus
        // indicadores y los primeros gráficos, que así se leen
        if (small) {
          await d.frameOn({ left: 110, top: 0, width: 680, height: 865 }, { pad: 0, max: 2, duration: 1.4, within: whole() })
          await d.wait(2600)
        }
        await d.frameOn(whole(), { pad: 0, max: 1, duration: 1.5 })
        await d.wait(small ? 2200 : 3200)
      }
    },
    async reset() {},
  }
}
