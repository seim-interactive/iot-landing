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
    service: 'Vamos a tu planta, relevamos los equipos y los conectamos sin frenar la producción.',
  },
  {
    key: 'ver',
    title: 'Lo ves en vivo, desde donde estés.',
    text: 'Cada máquina y cada variable, en un tablero armado para tu proceso. Lo abrís desde cualquier lado: la compu de la planta, una tablet o tu celular.',
    service: 'Armamos los tableros con tu equipo, uno para cada máquina y para cada rol.',
  },
  {
    key: 'avisar',
    title: 'Argus, nuestra IA, analiza tu fábrica.',
    subtitle: 'Y te dice cómo mejorarla.',
    text: 'Revisa todos los datos de la planta, encuentra lo que se sale de lo normal, te explica por qué pasa y te propone qué hacer. Y si tenés una duda, se la preguntás.',
    service: 'Definimos con vos qué es un desvío y le damos a Argus el contexto de tu planta.',
  },
]
</script>

<template>
  <div class="how">
    <h2 class="how-title" data-reveal>Cómo funciona.<br><span>De la máquina a la decisión.</span></h2>

    <ol class="how-steps">
      <li v-for="(step, index) in STEPS" :key="step.key" class="how-step" :class="{ 'is-flipped': index % 2 === 1 }">
        <div class="how-copy" data-reveal>
          <h3 class="how-step-title">{{ step.title }}<template v-if="step.subtitle"><br><span>{{ step.subtitle }}</span></template></h3>
          <p class="how-step-text">{{ step.text }}</p>
          <p class="how-service"><span>Lo que hacemos</span>{{ step.service }}</p>
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

          <!-- Argus: dos piezas del mismo ancho, alineadas y separadas. Arriba el campo
               del chat, grande; abajo el reporte, más chico, en su propia tarjeta -->
          <div v-else class="how-pair">
            <PlatformPiece class="how-ask" :piece="HOW_PIECES.ask" ratio="25 / 4" :fade="false" />
            <PlatformPiece class="how-report" :piece="HOW_PIECES.report" ratio="1 / 1" :fade="false" />
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 740px);
  align-items: center;
  gap: clamp(40px, 5vw, 96px);
}

/* El visual se alterna de lado: el orden lo da la secuencia, sin numeritos */
.how-step.is-flipped {
  grid-template-columns: minmax(0, 740px) minmax(0, 1fr);
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
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 28px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.86);
}

.how-service span {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.42);
}

/* La caja de los visuales: la misma en los tres pasos */
.how-visual {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
}

/* contain sobre negro: el video entra entero, sea del tamaño que sea */
.how-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

/* La pieza del paso 2 llena la caja, sea cual sea su proporción */
.how-visual > :deep(.piece-stage) {
  height: 100%;
  aspect-ratio: auto !important;
}

.how-step-title span {
  color: rgba(255, 255, 255, 0.45);
}

.how-pair {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 82%;
  height: 100%;
  margin: 0 auto;
}

/* El reporte, en una tarjeta como las de la plataforma */
.how-pair > .how-report {
  flex: 1;
  aspect-ratio: auto !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.05));
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

  /* En celular las tres cajas son 2:3, iguales entre sí: entran la alarma y el
     hallazgo apilados, del mismo ancho, como en escritorio */
  .how-visual {
    aspect-ratio: 2 / 3;
  }

  .how-pair {
    width: 100%;
    gap: 22px;
  }

  .how-pair > .how-ask {
    aspect-ratio: 342 / 72 !important;
  }
}
</style>
