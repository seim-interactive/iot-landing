<!--
  «A tu medida»: la misma plataforma con un tablero distinto para cada equipo. El
  guion cambia de equipo con el selector real y el tablero pasa a ser el de esa
  máquina. Arriba el título, en el medio la plataforma grande a todo el ancho y
  abajo, en una fila, las cuatro diferencias con una plataforma enlatada.
-->
<script setup>
import { ref } from 'vue'
import PlatformPiece from './PlatformPiece.vue'

const MACHINES = ['Envasadora 1', 'Horno', 'Llenadora', 'Envasadora 2']
const active = ref(MACHINES[0])
// La app ya se ve: la foto del primer cuadro se apaga (ver .fit-piece)
const live = ref(false)

const differences = [
  { canned: 'Tu operación se acomoda al software', ours: 'El software se adapta a tu operación' },
  { canned: 'Funciones fijas: si no está, no se puede', ours: 'Desarrollamos lo que tu proceso necesita' },
  { canned: 'Límites de equipos, usuarios o plantas', ours: 'Escala sin límite: equipos, líneas y plantas' },
  { canned: 'Entornos compartidos con otras empresas', ours: 'Un entorno privado, solo para tu empresa' },
]

// En el celular: el diseño de escritorio de la plataforma a 1100 px de ancho, donde
// el tablero entero mide 1100 × 1400. La caja tiene esa proporción, así la vista
// entera lo muestra completo, sin bandas vacías. En escritorio, una pantalla real de
// 1680 × 945 (16:9): la interfaz se ve a escala de escritorio, no ampliada.
const small = window.innerWidth < 720
const ratio = small ? '1100 / 1400' : '16 / 9'

const piece = {
  key: 'medida',
  // PlatformPiece lo vuelve a false cuando descarga la app: ahí vuelve la foto
  get started() {
    return live.value
  },
  set started(value) {
    live.value = value
  },
  route: '/dashboard',
  width: small ? 1100 : 1680,
  // El alto sale de la proporción de la caja (PlatformPiece)
  height: 'fit',
  cut: false,
  async script(d) {
    await d.until(() => d.find('.widget-card canvas'), 14000)
    // La pestaña de arriba muestra el equipo que tiene el selector real: cuando la
    // app se vuelve a cargar, arranca de nuevo en el primero.
    const current = d.find('[data-test="plc-switcher-trigger"]')?.textContent || ''
    active.value = MACHINES.find((name) => current.includes(name)) || MACHINES[0]
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
      active.value = name
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
</script>

<template>
  <div class="fit">
    <h2 class="fit-title" data-reveal>La plataforma se adapta a tu planta.<br><span>No tu planta a la plataforma.</span></h2>

    <div class="fit-stage" data-reveal>
      <!-- Qué equipo se está viendo: cada uno tiene su propio tablero -->
      <ul class="fit-machines" aria-hidden="true">
        <li v-for="name in MACHINES" :key="name" :class="{ 'is-active': name === active }">{{ name }}</li>
      </ul>
      <!-- De fondo, una foto del primer cuadro: mientras la app arranca la caja nunca
           está vacía, y cuando entra no se nota el cambio -->
      <PlatformPiece class="fit-piece" :class="{ 'is-live': live }" :piece="piece" :ratio="ratio" :fade="false" />
    </div>

    <ul class="fit-list">
      <li v-for="item in differences" :key="item.ours" class="fit-item" data-reveal>
        <s class="fit-old"><span class="visually-hidden">Plataformas enlatadas: </span>{{ item.canned }}</s>
        <p class="fit-new"><span class="visually-hidden">Nuestra plataforma: </span>{{ item.ours }}</p>
      </li>
    </ul>

    <p class="fit-close" data-reveal>La diseñamos, la desarrollamos y la operamos nosotros.</p>
  </div>
</template>

<style scoped>
.fit {
  --rule: rgba(255, 255, 255, 0.09);
  /* El ancho del bloque (plataforma y diferencias), alineado con el título: el que
     deja entrar el título y la plataforma en una pantalla (header, título, aire,
     pestañas y margen ≈ 323 px), nunca menos de 720 */
  --fit-w: min(100%, max(720px, calc((100vh - 323px) * 16 / 9)));
}

.fit-title {
  font-size: clamp(30px, 3.3vw, 48px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.fit-title span {
  color: rgba(255, 255, 255, 0.45);
}

/* La plataforma, grande */
.fit-stage {
  max-width: var(--fit-w);
  margin-top: clamp(36px, 4vw, 56px);
  overflow: hidden;
  border: 1px solid var(--rule);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.015);
}

.fit-machines {
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 10px;
  border-bottom: 1px solid var(--rule);
  list-style: none;
}

.fit-machines li {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  transition: color 0.5s ease, background-color 0.5s ease;
}

.fit-machines li.is-active {
  color: #fff;
  background: rgba(255, 255, 255, 0.09);
}

/* La foto del primer cuadro, por debajo de la app (que no tiene fondo): una captura
   de esta misma caja con la app andando, en escritorio y en el celular. Se apaga
   mientras entra la app, así no se superponen. Si la plataforma cambia mucho,
   conviene volver a sacarla. */
.fit-piece::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/media/medida-poster-d.jpg') center / cover no-repeat;
  pointer-events: none;
  transition: opacity 0.5s ease;
}

.fit-piece.is-live::before {
  opacity: 0;
}

/* Las cuatro diferencias en una fila, sin cajas: una línea fina arriba de cada una */
.fit-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: var(--fit-w);
  gap: clamp(20px, 2.4vw, 40px);
  margin: clamp(40px, 4.5vw, 64px) 0 0;
  padding: 0;
  list-style: none;
}

.fit-item {
  padding-top: 18px;
  border-top: 1px solid var(--rule);
}

.fit-old {
  display: block;
  font-size: 14px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.34);
  text-decoration-color: rgba(255, 255, 255, 0.28);
}

.fit-new {
  margin-top: 8px;
  font-size: clamp(17px, 1.35vw, 20px);
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: -0.015em;
  color: #fff;
}

.fit-close {
  margin-top: clamp(32px, 3.5vw, 48px);
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 960px) {
  .fit-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 28px;
  }
}

/* ---------- Celular ---------- */
@media (max-width: 719px) {
  .fit {
    --fit-w: 100%;
  }

  .fit-title {
    font-size: 28px;
    line-height: 1.12;
    text-wrap: balance;
  }

  .fit-stage {
    margin-top: 28px;
    border-radius: 16px;
  }

  .fit-piece::before {
    background-image: url('/media/medida-poster-m.jpg');
  }

  /* Las cuatro pestañas entran siempre, en partes iguales */
  .fit-machines {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 2px;
    padding: 6px;
  }

  .fit-machines li {
    padding: 7px 2px;
    font-size: 11.5px;
    letter-spacing: -0.01em;
    text-align: center;
  }

  .fit-list {
    gap: 24px 18px;
    margin-top: 32px;
  }

  .fit-item {
    padding-top: 14px;
  }

  .fit-old {
    font-size: 12px;
  }

  .fit-new {
    margin-top: 6px;
    font-size: 15px;
  }

  .fit-close {
    margin-top: 28px;
    font-size: 14px;
  }
}
</style>
