<!--
  «A tu medida»: la misma plataforma con un tablero distinto para cada equipo. El
  guion cambia de equipo con el selector real y el tablero pasa a ser el de esa
  máquina. Al lado, las cuatro diferencias con una plataforma enlatada.
-->
<script setup>
import { ref } from 'vue'
import PlatformPiece from './PlatformPiece.vue'

const MACHINES = ['Envasadora 1', 'Horno', 'Llenadora', 'Envasadora 2']
const active = ref(MACHINES[0])

const differences = [
  { canned: 'Tu operación se acomoda al software', ours: 'El software se adapta a tu operación' },
  { canned: 'Funciones fijas: si no está, no se puede', ours: 'Desarrollamos lo que tu proceso necesita' },
  { canned: 'Límites de equipos, usuarios o plantas', ours: 'Escala sin límite: equipos, líneas y plantas' },
  { canned: 'Entornos compartidos con otras empresas', ours: 'Un entorno privado, solo para tu empresa' },
]

const piece = {
  key: 'medida',
  route: '/dashboard',
  width: 1440,
  height: 1008,
  cut: false,
  async script(d) {
    await d.until(() => d.find('.widget-card canvas'), 14000)
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
      // Nunca más allá de los bordes de la plataforma: si no, asoma el fondo del marco
      await d.frameOn({ left: r.right - 640, top: 0, width: 660, height: 380 }, { pad: 0, max: 2, duration: 1.3, within: whole() })
      await d.click(trigger)
      await d.wait(500)
      await d.click(await d.until(() => d.find('.plc-switcher-option', name)))
      active.value = name
      d.hideCursor()
      // Se queda en el selector mientras carga el tablero nuevo: se aleja recién
      // cuando los gráficos tienen sus datos y las agujas llegaron a su valor.
      await d.until(() => !d.find('[data-test="dashboard-skeleton"]') && d.find('.widget-card canvas'), 14000)
      await d.wait(1600)
      await d.frameOn(whole(), { pad: 0, max: 1, duration: 1.5 })
      await d.wait(3200)
    }
  },
  async reset() {},
}
</script>

<template>
  <div class="fit">
    <div class="fit-copy">
      <h2 class="fit-title" data-reveal>La plataforma se adapta a tu planta.<br><span>No tu planta a la plataforma.</span></h2>

      <ul class="fit-list">
        <li v-for="item in differences" :key="item.ours" class="fit-item" data-reveal>
          <s class="fit-old"><span class="visually-hidden">Plataformas enlatadas: </span>{{ item.canned }}</s>
          <p class="fit-new"><span class="visually-hidden">Nuestra plataforma: </span>{{ item.ours }}</p>
        </li>
      </ul>

      <p class="fit-close" data-reveal>La diseñamos, la desarrollamos y la operamos nosotros.</p>
    </div>

    <div class="fit-stage" data-reveal>
      <!-- Qué equipo se está viendo: cada uno tiene su propio tablero -->
      <ul class="fit-machines" aria-hidden="true">
        <li v-for="name in MACHINES" :key="name" :class="{ 'is-active': name === active }">{{ name }}</li>
      </ul>
      <PlatformPiece :piece="piece" ratio="1440 / 1008" :fade="false" />
    </div>
  </div>
</template>

<style scoped>
.fit {
  --rule: rgba(255, 255, 255, 0.09);
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: clamp(40px, 5vw, 88px);
  align-items: center;
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

.fit-list {
  margin-top: clamp(32px, 4vw, 56px);
  padding: 0;
  list-style: none;
}

.fit-item {
  padding: 18px 0;
  border-top: 1px solid var(--rule);
}

.fit-old {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.34);
  text-decoration-color: rgba(255, 255, 255, 0.28);
}

.fit-new {
  margin-top: 4px;
  font-size: clamp(17px, 1.35vw, 20px);
  font-weight: 400;
  letter-spacing: -0.015em;
  color: #fff;
}

.fit-close {
  padding-top: 20px;
  border-top: 1px solid var(--rule);
  font-size: 15px;
  color: rgba(255, 255, 255, 0.58);
}

.fit-stage {
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
  transition: color 0.5s ease, background-color 0.5s ease;
}

.fit-machines li.is-active {
  color: #fff;
  background: rgba(255, 255, 255, 0.09);
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
  .fit {
    grid-template-columns: 1fr;
  }

  .fit-machines {
    overflow-x: auto;
  }

  .fit-machines li {
    white-space: nowrap;
  }
}
</style>
