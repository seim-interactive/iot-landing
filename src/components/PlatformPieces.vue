<!-- Partes clave de la plataforma: una grilla de segmentos reales, cada uno en loop. -->
<script setup>
import PlatformPiece from './PlatformPiece.vue'
import { PIECES } from './platformPieces'
</script>

<template>
  <div class="pieces">
    <header class="pieces-head" data-reveal>
      <h2 class="pieces-title">Todo lo que pasa en tu planta,<br><span>a la vista.</span></h2>
      <p class="pieces-lead">No son capturas: son partes de la plataforma, funcionando.</p>
    </header>

    <ul class="pieces-grid">
      <li v-for="piece in PIECES" :key="piece.key" class="piece">
        <PlatformPiece :piece="piece" />
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
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
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

.pieces-lead {
  max-width: 300px;
  font-size: 16px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.62);
}

.pieces-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
}

.piece + .piece {
  border-left: 1px solid var(--rule);
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

  .piece + .piece {
    border-left: 0;
    border-top: 1px solid var(--rule);
  }
}
</style>
