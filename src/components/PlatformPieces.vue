<!-- Partes clave de la plataforma: una grilla de segmentos reales, cada uno en loop.
     Cada cuadrado es un video grabado de la plataforma (PlatformVideo); los guiones con
     que se graban están en platformPieces.js. -->
<script setup>
import PlatformVideo from './PlatformVideo.vue'
import { PIECES } from './platformPieces'
</script>

<template>
  <div class="pieces">
    <header class="pieces-head" data-reveal>
      <h2 class="pieces-title">Todo lo que pasa en tu planta,<br><span>a la vista.</span></h2>
    </header>

    <ul class="pieces-grid">
      <li v-for="piece in PIECES" :key="piece.key" class="piece">
        <!-- El fundido de los bordes ya viene en el video (se graba con él) -->
        <PlatformVideo class="piece-video" :name="piece.key" />
        <div class="piece-copy">
          <h3 class="piece-title">{{ piece.title }}</h3>
          <p class="piece-text">{{ piece.text }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pieces {
  --rule: rgba(255, 255, 255, 0.09);
  border: 1px solid var(--rule);
  border-radius: 20px;
}

.pieces-head {
  padding: clamp(28px, 3.4vw, 48px);
  border-bottom: 1px solid var(--rule);
}

.pieces-title {
  font-size: clamp(30px, 3.6vw, 52px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.pieces-title span {
  color: rgba(255, 255, 255, 0.45);
}


.pieces-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Líneas finas entre cuadrados: a la derecha salvo el último de cada fila, y arriba
   desde la segunda fila */
.piece:not(:nth-child(3n)) {
  border-right: 1px solid var(--rule);
}

.piece:nth-child(n + 4) {
  border-top: 1px solid var(--rule);
}

/* La proporción de cada cuadrado: la misma con la que se grabó (grabar.mjs, GRILLA) */
.piece-video {
  aspect-ratio: 1 / 0.92;
}

.piece-copy {
  padding: 8px clamp(22px, 2.4vw, 36px) clamp(28px, 3vw, 40px);
}

.piece-title {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.015em;
}

.piece-text {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.58);
}

@media (max-width: 900px) {
  .pieces-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .pieces-grid {
    grid-template-columns: 1fr;
  }

  .piece:not(:nth-child(3n)) {
    border-right: 0;
  }

  .piece + .piece {
    border-top: 1px solid var(--rule);
  }
}
</style>
