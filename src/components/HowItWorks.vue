<!--
  «Cómo funciona», en tres pasos contados como beneficio: conectamos las máquinas,
  lo ves en vivo, te avisa y te dice qué hacer. Cada paso tiene su visual en la
  misma caja (mismo ancho y alto): el render 3D real de los equipos y, después, los
  componentes reales de la plataforma flotando (howPieces.js).
-->
<script setup>
import PlatformPiece from './PlatformPiece.vue'
import { HOW_PIECES } from './howPieces'

const STEPS = [
  {
    key: 'conectar',
    title: 'Conectamos tus máquinas, sin parar la planta.',
    text: 'No importa la marca ni la edad del equipo. Nos conectamos a lo que ya tenés y los datos empiezan a salir, cifrados, sin tocar cómo trabaja la línea.',
    service: 'Integración industrial y ciberseguridad OT',
  },
  {
    key: 'ver',
    title: 'Lo ves en vivo, desde donde estés.',
    text: 'Cada máquina, cada variable, en un tablero armado para tu proceso. Lo abrís en la planta o desde el celular.',
    service: 'Tableros a medida, en una nube privada',
  },
  {
    key: 'avisar',
    title: 'Te avisa y te dice qué hacer.',
    text: 'Si algo se sale de rango te enterás al instante, y Argus te explica qué pasó y qué conviene revisar antes de que se convierta en una parada.',
    service: 'Alertas a medida e inteligencia artificial',
  },
]
</script>

<template>
  <div class="how">
    <h2 class="how-title" data-reveal>Cómo funciona.<br><span>De la máquina a la decisión.</span></h2>

    <ol class="how-steps">
      <li v-for="(step, index) in STEPS" :key="step.key" class="how-step" :class="{ 'is-flipped': index % 2 === 1 }">
        <div class="how-copy" data-reveal>
          <h3 class="how-step-title">{{ step.title }}</h3>
          <p class="how-step-text">{{ step.text }}</p>
          <p class="how-service"><span>Lo hacemos nosotros:</span> {{ step.service }}</p>
        </div>

        <!-- Los tres visuales en la misma caja -->
        <div class="how-visual" data-reveal aria-hidden="true">
          <video
            v-if="step.key === 'conectar'"
            class="how-video"
            autoplay
            muted
            loop
            playsinline
            preload="none"
            poster="/media/conectar-poster.jpg"
          >
            <source src="/media/conectar.webm" type="video/webm" />
            <source src="/media/conectar.mp4" type="video/mp4" />
          </video>

          <PlatformPiece v-else-if="step.key === 'ver'" :piece="HOW_PIECES.widget" ratio="4 / 3" :fade="false" />

          <div v-else class="how-pair">
            <PlatformPiece :piece="HOW_PIECES.alarma" ratio="100 / 31" :fade="false" />
            <PlatformPiece :piece="HOW_PIECES.argus" ratio="100 / 41" :fade="false" />
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.how-title {
  max-width: 900px;
  font-size: clamp(30px, 3.6vw, 52px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.how-title span {
  color: rgba(255, 255, 255, 0.45);
}

.how-steps {
  margin: clamp(64px, 8vw, 120px) 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: clamp(88px, 11vw, 168px);
}

.how-step {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 600px);
  align-items: center;
  gap: clamp(40px, 6vw, 112px);
}

/* El visual se alterna de lado: el orden lo da la secuencia, sin numeritos */
.how-step.is-flipped {
  grid-template-columns: minmax(0, 600px) minmax(0, 1fr);
}

.how-step.is-flipped .how-copy {
  order: 2;
}

.how-copy {
  max-width: 480px;
}

.how-step-title {
  font-size: clamp(26px, 2.5vw, 38px);
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: -0.025em;
  color: #fff;
}

.how-step-text {
  margin-top: 20px;
  font-size: 17px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.62);
}

.how-service {
  margin-top: 28px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.86);
}

.how-service span {
  color: rgba(255, 255, 255, 0.42);
}

/* La caja de los visuales: la misma en los tres pasos */
.how-visual {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
}

.how-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.how-pair {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  gap: 4%;
}

@media (max-width: 900px) {
  .how-step,
  .how-step.is-flipped {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .how-step.is-flipped .how-copy {
    order: 0;
  }

  .how-step-text {
    font-size: 16px;
  }

  /* En celular las tres cajas son 3:4, iguales entre sí */
  .how-visual {
    aspect-ratio: 3 / 4;
  }

  .how-video {
    object-fit: contain;
  }

  /* Apilados no se leerían: la alarma y el hallazgo se turnan en la caja */
  .how-pair {
    position: relative;
    display: block;
  }

  .how-pair :deep(.piece-stage) {
    position: absolute;
    inset: 0;
    height: 100%;
    aspect-ratio: auto !important;
    animation: how-turn 18s ease-in-out infinite;
  }

  .how-pair :deep(.piece-stage:last-child) {
    animation-delay: -9s;
  }
}

@keyframes how-turn {
  0%, 46% { opacity: 1; }
  50%, 96% { opacity: 0; }
  100% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .how-pair :deep(.piece-stage:last-child) {
    display: none;
  }
}
</style>
