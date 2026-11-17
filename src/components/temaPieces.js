// Las piezas que se graban solo para las páginas por tema (src/content/temas.js).
//
// En la landing, los cuadrados de la grilla usan la app con su diseño de celular, que
// es lo que mejor se lee en una caja chica. En una página por tema el video ocupa media
// pantalla, así que en escritorio tiene que verse la app de escritorio y en el celular
// la de celular. Estas son las versiones que faltaban:
//  - en escritorio (t-alarmas, t-activos, t-paradas, t-reporte, t-argus): los mismos
//    guiones de la grilla (platformPieces.js), con la app a 1440 de ancho, que usa su
//    diseño de escritorio;
//  - en el celular (t-argus, t-equipos): la app a 390, con su diseño de celular.
//
// Se graban con scripts/grabar-plataforma (PIEZAS, claves t-*).
import { PIECES } from './platformPieces'

const fromGrid = (key, width, height) => {
  const piece = PIECES.find((p) => p.key === key)
  return { ...piece, key: `t-${key}`, width, height, started: false }
}

// Los equipos del selector, en el orden en que se recorren
const MACHINES = ['Envasadora 1', 'Horno', 'Llenadora', 'Envasadora 2']

// En el celular: la app con su diseño de celular. El nombre del equipo es el título de
// la pantalla y abre el selector; se cambia de equipo y el tablero pasa a ser el suyo.
function equiposMovil() {
  return {
    key: 't-equipos',
    route: '/dashboard',
    width: 390,
    height: 'fit',
    cut: false,
    started: false,
    async script(d) {
      await d.until(() => d.find('.widget-card canvas'), 14000)
      const whole = () => d.screen()
      await d.frameOn(whole(), { pad: 0, max: 1, duration: 0 })
      d.fade(1)
      await d.wait(2600)
      const scroller = () => d.find('.app-main')
      for (const name of [...MACHINES.slice(1), MACHINES[0]]) {
        await d.scroll(scroller(), 0, 0.8)
        const trigger = await d.until(() => d.find('[data-test="plc-switcher-trigger"]'))
        await d.click(trigger)
        await d.wait(600)
        await d.click(await d.until(() => d.find('.plc-switcher-option', name)))
        await d.until(() => !d.find('[data-test="dashboard-skeleton"]') && d.find('.widget-card canvas'), 14000)
        await d.wait(1500)
        // Baja un poco por el tablero: los indicadores y el primer gráfico
        await d.scroll(scroller(), 360, 1.4)
        await d.wait(1800)
      }
      await d.scroll(scroller(), 0, 0.8)
    },
    async reset() {},
  }
}

export const TEMA_PIECES = {
  escritorio: {
    't-alarmas': fromGrid('alarmas', 1440, 1700),
    't-activos': fromGrid('activos', 1440, 1900),
    't-paradas': fromGrid('paradas', 1440, 2400),
    't-reporte': fromGrid('reporte', 1440, 3600),
    't-argus': fromGrid('argus', 1440, 1000),
  },
  celular: {
    't-argus': fromGrid('argus', 390, 1000),
    't-equipos': equiposMovil(),
  },
}
