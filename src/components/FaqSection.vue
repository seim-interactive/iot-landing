<!--
  Preguntas frecuentes, antes del contacto. Una lista abierta (sin acordeón): cada
  pregunta con su respuesta a la vista, separadas por una línea fina, como las
  diferencias de «A tu medida». En escritorio, el título a la izquierda y la lista a la
  derecha, con la grilla de «Cómo funciona» (5 y 6). El texto sale de src/seo/faq.js,
  el mismo que usa el JSON-LD FAQPage del head.
-->
<script setup>
import { FAQ } from '@/seo/faq.js'
</script>

<template>
  <div class="faq">
    <h2 id="preguntas-titulo" class="faq-title" data-reveal>Preguntas frecuentes.<br><span>Lo que nos consultan antes de arrancar.</span></h2>

    <div class="faq-list">
      <div v-for="item in FAQ" :key="item.q" class="faq-item" data-reveal>
        <h3 class="faq-q">{{ item.q }}</h3>
        <p class="faq-a">{{ item.a }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.faq {
  --rule: rgba(255, 255, 255, 0.09);
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  align-items: start;
  gap: clamp(48px, 6vw, 112px);
}

.faq-title,
.faq-q,
.faq-a {
  margin: 0;
}

/* En escritorio el título acompaña la lista mientras se lee */
.faq-title {
  position: sticky;
  top: calc(var(--header-h, 72px) + 40px);
  font-size: clamp(30px, 3.6vw, 52px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.faq-title span {
  color: rgba(255, 255, 255, 0.45);
}

.faq-list {
  border-bottom: 1px solid var(--rule);
}

.faq-item {
  padding: clamp(24px, 2.4vw, 32px) 0;
  border-top: 1px solid var(--rule);
}

.faq-q {
  font-size: clamp(18px, 1.45vw, 21px);
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: -0.015em;
  color: #fff;
}

.faq-a {
  margin-top: 12px;
  max-width: 620px;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.62);
}

@media (max-width: 900px) {
  .faq {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .faq-title {
    position: static;
  }
}

@media (max-width: 719px) {
  .faq-title {
    font-size: 28px;
    line-height: 1.12;
  }

  .faq-a {
    font-size: 15px;
  }
}
</style>
