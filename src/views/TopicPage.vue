<!--
  Una página por tema (src/content/temas.js): responde una búsqueda concreta con su
  propio contenido y los videos reales de la plataforma. Misma estética que la landing:
  negro, Inter, la grilla de texto 5 y visual 6 de «Cómo funciona», el contacto y el pie.

  Los links entre páginas son <a> comunes: cada página viene prerenderizada con su
  title, su descripción, su canonical y sus datos estructurados (usePageMeta).
-->
<script setup>
import { computed, ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import PlatformVideo from '@/components/PlatformVideo.vue'
import ContactAsk from '@/components/ContactAsk.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { TEMAS, temaPorSlug } from '@/content/temas'
import { useLandingMotion } from '@/composables/useLandingMotion'
import { usePageMeta } from '@/composables/usePageMeta'

const props = defineProps({ slug: { type: String, required: true } })

const tema = computed(() => temaPorSlug(props.slug))
const otros = computed(() => TEMAS.filter((t) => t.slug !== props.slug))
const href = (slug) => `/${slug}/`

// Cada visual: un video para escritorio (d) y otro para el celular (m), ver temas.js.
// La proporción de cada uno es la de su caja al grabarse (grabar.mjs, PIEZAS).
const RATIO_D = {
  widget: '708 / 574',
  medida: '16 / 9',
  conectar: '16 / 9',
  't-alarmas': '708 / 443',
  't-activos': '708 / 443',
  't-paradas': '708 / 443',
  't-reporte': '708 / 443',
  't-argus': '708 / 443',
}
const RATIO_M = {
  alarmas: '340 / 313',
  activos: '340 / 313',
  paradas: '340 / 313',
  reporte: '340 / 313',
  mediciones: '340 / 313',
  conectar: '16 / 9',
  't-argus': '340 / 313',
  't-equipos': '340 / 600',
}
// Las pantallas enteras van en un marco; los recortes de la interfaz flotan sobre el negro
const FRAMED_D = new Set(['medida'])
const FRAMED_M = new Set(['t-equipos'])
const visualClass = (v) => ({ 'is-framed-d': FRAMED_D.has(v.d), 'is-framed-m': FRAMED_M.has(v.m) })
const ratio = (v) => ({ '--r-d': RATIO_D[v.d], '--r-m': RATIO_M[v.m] })

const rootEl = ref(null)
useLandingMotion(rootEl)
usePageMeta(tema.value)
</script>

<template>
  <div ref="rootEl" class="landing topic">
    <Navbar home="/" />

    <main id="top" class="topic-hero container">
      <div class="topic-hero-copy">
        <p class="topic-eyebrow">{{ tema.eyebrow }}</p>
        <h1 class="topic-title">{{ tema.h1 }}</h1>
        <p class="topic-lede">{{ tema.lede }}</p>
        <a href="#contact" class="topic-cta">Hablemos</a>
      </div>
      <div class="topic-visual" :class="visualClass(tema.video)">
        <PlatformVideo class="topic-video" :name="tema.video.d" :mobile-name="tema.video.m" :style="ratio(tema.video)" />
      </div>
    </main>

    <section class="section" aria-label="Cómo funciona">
      <div class="container">
        <ol class="topic-steps">
          <li
            v-for="(section, index) in tema.sections"
            :key="section.title"
            class="topic-step"
            :class="{ 'is-flipped': index % 2 === 1, 'is-text': !section.video }"
          >
            <div class="topic-step-copy" data-reveal>
              <h2 class="topic-step-title">{{ section.title }}</h2>
              <p class="topic-step-text">{{ section.text }}</p>
              <a v-if="section.link" class="topic-more" :href="href(section.link)">
                {{ temaPorSlug(section.link).nav }}
              </a>
            </div>
            <div v-if="section.video" class="topic-visual" :class="visualClass(section.video)" data-reveal>
              <PlatformVideo class="topic-video" :name="section.video.d" :mobile-name="section.video.m" :style="ratio(section.video)" />
            </div>
          </li>
        </ol>
      </div>
    </section>

    <section class="section" aria-labelledby="faq-title">
      <div class="container">
        <h2 id="faq-title" class="topic-h2" data-reveal>Preguntas frecuentes</h2>
        <dl class="topic-faq">
          <div v-for="item in tema.faq" :key="item.q" class="topic-faq-item" data-reveal>
            <dt>{{ item.q }}</dt>
            <dd>{{ item.a }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="section" aria-labelledby="more-title">
      <div class="container">
        <h2 id="more-title" class="topic-h2" data-reveal>Más de la plataforma</h2>
        <ul class="topic-links">
          <li v-for="t in otros" :key="t.slug" data-reveal>
            <a :href="href(t.slug)">{{ t.nav }}</a>
          </li>
          <li data-reveal><a href="/">La plataforma completa</a></li>
        </ul>
      </div>
    </section>

    <section id="contact" class="section contact-section">
      <div class="container">
        <ContactAsk />
      </div>
    </section>

    <SiteFooter home="/" />
  </div>
</template>

<style scoped>
.landing {
  --text: #fff;
  --text-2: rgba(255, 255, 255, 0.62);
  --text-3: rgba(255, 255, 255, 0.45);
  --line: rgba(255, 255, 255, 0.09);
  --accent: #afe3e8;
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --container: 1520px;
  --gutter: 60px;
  --header-h: 72px;
  --section-pad: clamp(112px, 14vw, 220px);

  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #000;
  color: var(--text);
  font-family: var(--font);
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: clip;
}

.landing :where(h1, h2, p, dl, dd, ol, ul) {
  margin: 0;
  padding: 0;
}

.container {
  position: relative;
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--gutter);
  box-sizing: border-box;
}

.section {
  position: relative;
  padding: calc(var(--section-pad) / 2) 0;
}

/* ---------- Arriba: el tema y su video ---------- */
.topic-hero {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  align-items: center;
  gap: clamp(48px, 6vw, 112px);
  padding-top: calc(var(--header-h) + clamp(56px, 7vw, 112px));
  padding-bottom: calc(var(--section-pad) / 2);
}

.topic-eyebrow {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--text-3);
}

.topic-title {
  margin-top: 16px;
  font-size: clamp(34px, 4vw, 60px);
  font-weight: 400;
  line-height: 1.06;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.topic-lede {
  margin-top: 24px;
  max-width: 560px;
  font-size: 18px;
  line-height: 1.55;
  color: var(--text-2);
}

.topic-cta {
  display: inline-block;
  margin-top: 32px;
  padding: 12px 22px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  font-size: 15px;
  font-weight: 400;
  color: #fff;
  text-decoration: none;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.topic-cta:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.4);
}

/* ---------- Los videos ---------- */
.topic-visual {
  min-width: 0;
}

.topic-video {
  aspect-ratio: var(--r-d);
}

/* Una pantalla entera de la plataforma: en su marco, como en «A tu medida» */
.topic-visual.is-framed-d {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
}

/* ---------- Los pasos: texto 5 y visual 6, alternando lados ---------- */
.topic-steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: clamp(88px, 11vw, 168px);
}

.topic-step {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  align-items: center;
  gap: clamp(48px, 6vw, 112px);
}

.topic-step.is-flipped {
  grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
}

.topic-step.is-flipped .topic-step-copy {
  order: 2;
}

/* Un paso sin video: el texto solo, a lo ancho de la columna de texto */
.topic-step.is-text {
  grid-template-columns: minmax(0, 7fr) minmax(0, 4fr);
}

.topic-step.is-text .topic-step-copy {
  order: 0;
}

.topic-step-title {
  font-size: clamp(26px, 2.5vw, 38px);
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: -0.025em;
}

.topic-step-text {
  margin-top: 20px;
  font-size: 17px;
  line-height: 1.55;
  color: var(--text-2);
}

.topic-more {
  display: inline-block;
  margin-top: 24px;
  font-size: 15px;
  color: #fff;
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.3);
  text-underline-offset: 5px;
  transition: text-decoration-color 0.3s ease;
}

.topic-more:hover {
  text-decoration-color: #fff;
}

/* ---------- Preguntas y más temas: listas con líneas finas ---------- */
.topic-h2 {
  font-size: clamp(30px, 3.3vw, 48px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.topic-faq {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 clamp(32px, 4vw, 72px);
  margin-top: clamp(36px, 4vw, 56px);
}

.topic-faq-item {
  padding: 24px 0 28px;
  border-top: 1px solid var(--line);
}

.topic-faq-item dt {
  font-size: clamp(17px, 1.35vw, 20px);
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: -0.015em;
}

.topic-faq-item dd {
  margin-top: 10px;
  font-size: 16px;
  line-height: 1.55;
  color: var(--text-2);
}

.topic-links {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0 clamp(20px, 2.4vw, 40px);
  margin-top: clamp(36px, 4vw, 56px);
}

.topic-links li {
  border-top: 1px solid var(--line);
}

.topic-links a {
  display: block;
  padding: 20px 0;
  font-size: clamp(17px, 1.35vw, 20px);
  font-weight: 400;
  letter-spacing: -0.015em;
  color: #fff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.topic-links a:hover {
  color: var(--text-2);
}

/* ---------- Tablet y celular ---------- */
@media (max-width: 960px) {
  .topic-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .topic-hero,
  .topic-step,
  .topic-step.is-flipped,
  .topic-step.is-text {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .topic-step.is-flipped .topic-step-copy {
    order: 0;
  }

  .topic-faq {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .landing {
    --gutter: 24px;
    --header-h: 64px;
    --section-pad: 128px;
  }

  .topic-lede {
    font-size: 16px;
  }

  .topic-step-text {
    font-size: 16px;
  }
}

@media (max-width: 719px) {
  .topic-video {
    aspect-ratio: var(--r-m);
  }

  .topic-visual.is-framed-d {
    border: 0;
    border-radius: 0;
  }

  /* La pantalla del celular, entera: en su marco y no más ancha que un teléfono */
  .topic-visual.is-framed-m {
    overflow: hidden;
    max-width: 340px;
    margin: 0 auto;
    border: 1px solid var(--line);
    border-radius: 28px;
  }

  .topic-links {
    grid-template-columns: 1fr;
  }
}
</style>
