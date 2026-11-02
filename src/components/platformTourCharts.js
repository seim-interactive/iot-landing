// Solo las piezas de ECharts que usa el recorrido de la plataforma (medidor, línea,
// barras, meta y ventana). Se importa de forma diferida desde PlatformTour.vue, así queda en su
// propio archivo y no suma peso a la carga inicial.
import { init, use } from 'echarts/core'
import { GaugeChart, LineChart, BarChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, MarkAreaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([GaugeChart, LineChart, BarChart, GridComponent, MarkLineComponent, MarkAreaComponent, CanvasRenderer])

export { init }
