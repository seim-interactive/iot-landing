<!--
  Preguntas frecuentes, antes del contacto (la landing y cada página por tema). En
  escritorio, una lista abierta: cada pregunta con su respuesta a la vista, separadas por
  una línea fina; el título a la izquierda y la lista a la derecha, con la grilla de
  «Cómo funciona» (5 y 6). En el celular, un desplegable: se toca la pregunta y se abre
  su respuesta (una a la vez), con el alto animado de verdad (grid-template-rows de 0fr a
  1fr) y la respuesta que aparece mientras se abre.

  Las respuestas están siempre en la página (solo se ocultan con CSS): Google las lee y
  coinciden con el JSON-LD FAQPage. El texto de la landing sale de src/seo/faq.js; el de
  las páginas por tema, de src/content/temas.js.
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { FAQ } from '@/seo/faq.js'

const props = defineProps({
  items: { type: Array, default: () => FAQ },
  title: { type: String, default: 'Preguntas frecuentes.' },
  subtitle: { type: String, default: 'Lo que nos consultan antes de arrancar.' },
  titleId: { type: String, default: 'preguntas-titulo' },
})

// La que está abierta en el celular: arranca la primera, así se entiende que se despliega
const open = ref(0)
const compact = ref(false)
let mq = null
const sync = () => (compact.value = mq.matches)

function toggle(index) {
  if (!compact.value) return
  open.value = open.value === index ? -1 : index
}

onMounted(() => {
  mq = window.matchMedia('(max-width: 719px)')
  sync()
  mq.addEventListener('change', sync)
})

onUnmounted(() => mq?.removeEventListener('change', sync))

const idOf = (index) => `${props.titleId}-r${index}`
</script>

<template>
  <div class="faq" :class="{ 'is-compact': compact }">
    <h2 :id="titleId" class="faq-title" data-reveal>{{ title }}<br><span>{{ subtitle }}</span></h2>

    <div class="faq-list">
      <div v-for="(item, index) in items" :key="item.q" class="faq-item" :class="{ 'is-open': !compact || open === index }" data-reveal>
        <h3 class="faq-q">
          <button
            type="button"
            class="faq-toggle"
            :aria-expanded="!compact || open === index"
            :aria-controls="idOf(index)"
            :tabindex="compact ? 0 : -1"
            @click="toggle(index)"
          >
            <span>{{ item.q }}</span>
            <span class="faq-icon" aria-hidden="true"></span>
          </button>
        </h3>
        <div :id="idOf(index)" class="faq-panel" role="region" :aria-label="item.q">
          <div class="faq-panel-inner">
            <p class="faq-a">{{ item.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.faq {
  --rule: rgba(255, 255, 255, 0.09);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
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
  border-top: 1px solid var(--rule);
}

.faq-toggle {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  padding: clamp(24px, 2.4vw, 32px) 0 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: clamp(18px, 1.45vw, 21px);
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: -0.015em;
  text-align: left;
  color: #fff;
  cursor: default;
}

/* El ícono solo aparece en el celular */
.faq-icon {
  display: none;
}

/* El alto de la respuesta se anima de verdad: la fila pasa de 0fr a 1fr */
.faq-panel {
  display: grid;
  grid-template-rows: 1fr;
}

.faq-panel-inner {
  min-height: 0;
  overflow: hidden;
}

.faq-a {
  max-width: 620px;
  padding: 12px 0 clamp(24px, 2.4vw, 32px);
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

/* ---------- Celular: desplegable ---------- */
@media (max-width: 719px) {
  .faq-title {
    font-size: 28px;
    line-height: 1.12;
  }

  .is-compact .faq-toggle {
    align-items: center;
    padding: 20px 0;
    font-size: 17px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* Un + fino que gira a × al abrir */
  .is-compact .faq-icon {
    position: relative;
    display: block;
    flex: none;
    width: 14px;
    height: 14px;
    transition: transform 0.5s var(--ease);
  }

  .is-compact .faq-icon::before,
  .is-compact .faq-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1.5px;
    margin-top: -0.75px;
    border-radius: 1px;
    background: rgba(255, 255, 255, 0.7);
  }

  .is-compact .faq-icon::after {
    transform: rotate(90deg);
  }

  .is-compact .is-open .faq-icon {
    transform: rotate(135deg);
  }

  .is-compact .faq-panel {
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.55s var(--ease);
  }

  .is-compact .is-open .faq-panel {
    grid-template-rows: 1fr;
  }

  /* La respuesta aparece mientras se abre: sube apenas y se aclara */
  .is-compact .faq-a {
    padding: 0 0 22px;
    font-size: 15px;
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity 0.35s ease, transform 0.55s var(--ease);
  }

  .is-compact .is-open .faq-a {
    opacity: 1;
    transform: none;
    transition: opacity 0.45s ease 0.08s, transform 0.55s var(--ease);
  }

  .faq-toggle:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.6);
    outline-offset: 4px;
    border-radius: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq-panel,
  .faq-a,
  .faq-icon {
    transition: none !important;
  }
}
</style>
