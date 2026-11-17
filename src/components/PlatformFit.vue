<!--
  «A tu medida»: la misma plataforma con un tablero distinto para cada equipo. En el
  video (grabado con el guion de platformFit.js) se cambia de equipo con el selector
  real y el tablero pasa a ser el de esa máquina. Arriba el título, en el medio la
  plataforma grande a todo el ancho y abajo, en una fila, las cuatro diferencias con
  una plataforma enlatada.
-->
<script setup>
import { ref } from 'vue'
import PlatformVideo from './PlatformVideo.vue'
import { MACHINES } from './platformFit'

// El equipo de la pestaña: lo marca el video, en el mismo instante en que el
// selector de la plataforma cambia (las marcas se guardan al grabar)
const active = ref(MACHINES[0])

const differences = [
  { canned: 'Tu operación se acomoda al software', ours: 'El software se adapta a tu operación' },
  { canned: 'Funciones fijas: si no está, no se puede', ours: 'Desarrollamos lo que tu proceso necesita' },
  { canned: 'Límites de equipos, usuarios o plantas', ours: 'Escala sin límite: equipos, líneas y plantas' },
  { canned: 'Entornos compartidos con otras empresas', ours: 'Un entorno privado, solo para tu empresa' },
]
</script>

<template>
  <div class="fit">
    <h2 class="fit-title" data-reveal>La plataforma se adapta a tu planta.<br><span>No tu planta a la plataforma.</span></h2>

    <div class="fit-stage" data-reveal>
      <!-- Qué equipo se está viendo: cada uno tiene su propio tablero -->
      <ul class="fit-machines" aria-hidden="true">
        <li v-for="name in MACHINES" :key="name" :class="{ 'is-active': name === active }">{{ name }}</li>
      </ul>
      <PlatformVideo class="fit-video" name="medida" @mark="active = $event" />
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
  /* El ancho del bloque (título, plataforma y diferencias), centrado en la página: sale
     del alto de la pantalla (header, pestañas y margen ≈ 240 px) para que la plataforma
     entre casi entera, nunca menos de 900 ni más que el contenedor */
  --fit-w: min(100%, max(900px, calc((100vh - 240px) * 16 / 9)));
}

/* Todo el bloque centrado; el título, alineado con el borde de la plataforma */
.fit-title,
.fit-stage,
.fit-list,
.fit-close {
  max-width: var(--fit-w);
  margin-left: auto;
  margin-right: auto;
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

/* En escritorio, una pantalla real de 1680 × 945 (16:9): la interfaz se ve a escala
   de escritorio, no ampliada. En el celular, el diseño de escritorio a 1100 px de
   ancho, donde el tablero entero mide 1100 × 1400: se ve completo, sin bandas. */
.fit-video {
  aspect-ratio: 16 / 9;
}

/* Las cuatro diferencias en una fila, sin cajas: una línea fina arriba de cada una */
.fit-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(20px, 2.4vw, 40px);
  margin-top: clamp(40px, 4.5vw, 64px);
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

  .fit-video {
    aspect-ratio: 1100 / 1400;
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
