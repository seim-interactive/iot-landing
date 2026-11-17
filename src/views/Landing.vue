<template>
  <div ref="rootEl" class="landing">
    <Navbar />

    <!-- ==================== HERO ==================== -->
    <main id="top" class="hero">
      <div class="hero-content">
        <h1 class="hero-kicker">
          Monitoreo de producción con IoT industrial
        </h1>
        <p class="hero-title">
          La nueva era<br>
          de la Industria Inteligente
        </p>

        <a href="#plataforma" class="hero-cta">
          Conocé la plataforma
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

      <!-- La plataforma asoma desde la primera pantalla: es lo que sigue al scrollear -->
      <div id="plataforma" class="hero-stage">
        <PlatformStage />
      </div>
    </main>

    <!-- ==================== PARTES CLAVE ==================== -->
    <section id="partes" class="section pieces-section">
      <div class="container">
        <PlatformPieces />
      </div>
    </section>

    <!-- ==================== A TU MEDIDA ==================== -->
    <section id="solution" class="section fit-section">
      <div class="container">
        <PlatformFit />
      </div>
    </section>

    <!-- ==================== PARTNER ==================== -->
    <section id="alianza" class="partner-section">
      <div class="container">
        <PartnerBand />
      </div>
    </section>

    <!-- ==================== CÓMO FUNCIONA (con los servicios) ==================== -->
    <section id="technology" class="section how-section" aria-label="Cómo funciona">
      <div class="container">
        <HowItWorks />
      </div>
    </section>

    <!-- ==================== PREGUNTAS FRECUENTES ==================== -->
    <section id="preguntas" class="section faq-section" aria-labelledby="preguntas-titulo">
      <div class="container">
        <FaqSection />
      </div>
    </section>

    <!-- ==================== CONTACTO ==================== -->
    <section id="contact" class="section contact-section">
      <div class="container">
        <ContactAsk />
      </div>
    </section>

    <!-- ==================== FOOTER ==================== -->
    <footer class="footer">
      <div class="footer-light" aria-hidden="true"></div>

      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <img :src="logo2x" :srcset="`${logo2x} 2x, ${logo3x} 3x`" width="300" height="49" alt="Seim Interactive" class="footer-logo" loading="lazy" decoding="async" />
            <p class="footer-about">
              Soluciones de telemetría industrial que conectan planta y nube de forma segura y confiable.
            </p>
          </div>

          <nav class="footer-column" aria-label="Servicios">
            <h4 class="footer-title">Servicios</h4>
            <ul class="footer-links">
              <li><a href="#technology">Integración industrial</a></li>
              <li><a href="#technology">Arquitectura cloud</a></li>
              <li><a href="#technology">Dashboards</a></li>
              <li><a href="#technology">Inteligencia artificial</a></li>
            </ul>
          </nav>

          <nav class="footer-column" aria-label="Secciones">
            <h4 class="footer-title">Secciones</h4>
            <ul class="footer-links">
              <li><a href="#partes">Plataforma</a></li>
              <li><a href="#solution">A tu medida</a></li>
              <li><a href="#technology">Cómo funciona</a></li>
              <li><a href="#preguntas">Preguntas frecuentes</a></li>
              <li><a href="#contact">Contacto</a></li>
            </ul>
          </nav>

          <nav class="footer-column footer-contact-column" aria-label="Contacto">
            <h4 class="footer-title">Contacto</h4>
            <ul class="footer-links">
              <li><a href="https://wa.me/5493413551507" target="_blank" rel="noopener">WhatsApp</a></li>
              <li><a href="mailto:hello@seiminteractive.io">Email</a></li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Marca a todo el ancho: el texto se ajusta exacto al ancho disponible -->
      <svg class="footer-wordmark" viewBox="0 0 1000 124" aria-hidden="true">
        <defs>
          <linearGradient id="wordmark-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </linearGradient>
        </defs>
        <text x="0" y="104" textLength="1000" lengthAdjust="spacingAndGlyphs" fill="url(#wordmark-fade)">Seim Interactive</text>
      </svg>

      <div class="container">
        <div class="footer-bottom">
          <span>© 2026 Seim Interactive. Todos los derechos reservados.</span>
          <div class="footer-bottom-links">
            <a href="https://seiminteractive.io/" class="footer-bottom-link">Parte de Seim Interactive</a>
            <a href="#top" class="footer-bottom-link">Volver arriba</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import PlatformStage from '@/components/PlatformStage.vue'
import PlatformPieces from '@/components/PlatformPieces.vue'
import PlatformFit from '@/components/PlatformFit.vue'
import HowItWorks from '@/components/HowItWorks.vue'
import ContactAsk from '@/components/ContactAsk.vue'
import FaqSection from '@/components/FaqSection.vue'
import PartnerBand from '@/components/PartnerBand.vue'
import { useLandingMotion } from '@/composables/useLandingMotion'
// El logo a 2x y 3x de lo que se muestra (~150 px de ancho); el original es de 3500 px
import logo2x from '@/assets/logo-seim-300.png'
import logo3x from '@/assets/logo-seim-450.png'

const rootEl = ref(null)

useLandingMotion(rootEl)

// ---------- Alto de viewport estable en mobile ----------
let removeViewportHeightListeners = null
let lastViewportWidth = 0

const updateAppHeight = () => {
  lastViewportWidth = window.innerWidth
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}

const setupViewportHeight = () => {
  const mediaQuery = window.matchMedia('(max-width: 768px)')

  const applyHeight = () => {
    if (mediaQuery.matches) {
      updateAppHeight()
      return
    }

    document.documentElement.style.removeProperty('--app-height')
  }

  const handleResize = () => {
    // Ignorar cambios de alto causados por la barra del navegador mobile.
    if (Math.abs(window.innerWidth - lastViewportWidth) < 80) return
    applyHeight()
  }

  applyHeight()

  window.addEventListener('resize', handleResize, { passive: true })
  window.addEventListener('orientationchange', applyHeight, { passive: true })
  mediaQuery.addEventListener('change', applyHeight)

  return () => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', applyHeight)
    mediaQuery.removeEventListener('change', applyHeight)
    document.documentElement.style.removeProperty('--app-height')
  }
}

onMounted(() => {
  removeViewportHeightListeners = setupViewportHeight()
})

onUnmounted(() => {
  removeViewportHeightListeners?.()
})
</script>

<style>
/* Global (sin scoped) para afectar html y body */
:root {
  --app-height: 100vh;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  background: #000;
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
</style>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ==================== TOKENS ==================== */
.landing {
  --text: #fff;
  --text-2: rgba(255, 255, 255, 0.68);
  --text-3: rgba(255, 255, 255, 0.45);
  --text-4: rgba(255, 255, 255, 0.28);
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.14);
  --accent: #afe3e8;
  --accent-soft: rgba(175, 227, 232, 0.12);
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  /* 1520 = a 1440px de ancho el contenido queda a 60px, igual que el hero */
  --container: 1520px;
  --gutter: 60px;
  --header-h: 72px;
  /* Ritmo vertical único: la distancia entre dos bloques grandes es siempre --section-pad.
     Cada sección aporta la mitad arriba y la mitad abajo; los bloques internos grandes
     (comparación, texto de la solución) se separan con el valor completo. */
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
  /* clip (y no hidden) para no romper position: sticky en "Cómo funciona" */
  overflow-x: hidden;
  overflow-x: clip;
}

.container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.section {
  position: relative;
  padding: calc(var(--section-pad) / 2) 0;
}

a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 6px;
}

/* ==================== HERO ==================== */

.hero {
  position: relative;
  width: 100%;
  z-index: 10;
  padding: calc(var(--header-h) + clamp(48px, 10vh, 112px)) var(--gutter) 0;
  background: #000;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

/* La plataforma arranca dentro de la primera pantalla y sigue hacia abajo */
.hero-stage {
  position: relative;
  margin-top: clamp(48px, 8vh, 84px);
  scroll-margin-top: calc(var(--header-h) + 24px);
}

.hero-kicker {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 24px 0;
  line-height: 1.4;
  color: var(--text-3);
  /* En el celular entra en dos líneas parejas */
  text-wrap: balance;
}

.hero-title {
  font-size: clamp(38px, 5vw, 66px);
  font-weight: 400;
  line-height: 1.08;
  margin-bottom: 36px;
  letter-spacing: -0.03em;
  background: linear-gradient(180deg, #fff 35%, rgba(255, 255, 255, 0.66) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 24px;
  border-radius: 999px;
  background: #fff;
  color: #0a0a0a;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-decoration: none;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.14);
  transition: transform 0.45s var(--ease-out);
}

.hero-cta svg {
  transition: transform 0.45s var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .hero-cta:hover {
    transform: translateY(-2px);
  }

  .hero-cta:hover svg {
    transform: translateY(3px);
  }
}

.hero-cta:active {
  transform: scale(0.97);
}

/* Entrada del hero. El h1 y el título se ven desde el primer cuadro, sin animarse
   (son el LCP). El botón y la plataforma entran con CSS: arrancan ocultos desde el
   primer pintado del HTML prerenderizado, así no hay parpadeo ni hace falta esperar
   al JS. Cuando Vue monta y vuelve a crear este DOM, main.js pone las animaciones
   nuevas en el punto en que iban, así no empiezan de nuevo. Con movimiento reducido
   no hay entrada: todo visible. */
@media (prefers-reduced-motion: no-preference) {
  .hero-cta {
    animation: hero-rise 0.7s cubic-bezier(0.5, 1, 0.89, 1) 0.15s backwards;
  }

  /* La plataforma sube desde abajo y se apoya: es lo que sigue a la primera pantalla */
  .hero-stage {
    animation: hero-stage-in 1.2s cubic-bezier(0.33, 1, 0.68, 1) 0.25s backwards;
  }
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
}

@keyframes hero-stage-in {
  from {
    opacity: 0;
    transform: translateY(70px);
  }
}

/* La pista define cuánto scroll dura el recorrido; el contenido queda fijo. */
.flow-track {
  position: relative;
  height: calc(100vh + var(--steps) * 62vh);
}

/* ==================== FOOTER ==================== */
.footer {
  position: relative;
  z-index: 2;
  padding: 40px 0 32px;
  overflow: hidden;
}

.footer-light {
  position: absolute;
  bottom: -40%;
  left: -20%;
  right: -20%;
  height: 100%;
  background: radial-gradient(ellipse 60% 70% at 50% 100%, rgba(175, 227, 232, 0.18), transparent 70%);
  pointer-events: none;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 48px;
  padding: 56px 0;
  border-top: 1px solid var(--line);
}

.footer-logo {
  width: 150px;
  height: auto;
  opacity: 0.9;
}

.footer-about {
  margin-top: 20px;
  max-width: 320px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--text-3);
}

.footer-title {
  margin-bottom: 18px;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-3);
}

.footer-links {
  list-style: none;
  display: grid;
  gap: 12px;
}

.footer-links a {
  font-size: 15px;
  color: var(--text-2);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: var(--accent);
}

.footer-wordmark {
  position: relative;
  display: block;
  width: calc(100% - 48px);
  height: auto;
  margin: 8px auto 0;
  overflow: visible;
}

.footer-wordmark text {
  font-family: var(--font);
  font-size: 128px;
  font-weight: 600;
  letter-spacing: -0.04em;
}

.footer-bottom {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--text-3);
}

.footer-bottom-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.footer-bottom-link {
  color: var(--text-2);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-bottom-link:hover {
  color: var(--accent);
}

@media (max-width: 960px) {

  .footer-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .landing {
    min-height: var(--app-height, 100svh);
    --gutter: 24px;
    --header-h: 64px;
    --section-pad: 128px;
  }

  /* Hero */
  .hero {
    padding-top: calc(var(--header-h) + 48px);
  }

  .hero-stage {
    margin-top: 44px;
  }

  .hero-kicker {
    font-size: 11px;
    letter-spacing: 0.16em;
    margin-bottom: 18px;
  }

  .hero-title {
    font-size: clamp(32px, 10vw, 48px);
    margin-bottom: 24px;
    line-height: 1.15;
  }

  .hero-cta {
    height: 46px;
    padding: 0 22px;
  }

  /* Secciones */
  .section {
    padding: calc(var(--section-pad) / 2) 0;
  }

  /* El contacto es lo último antes del footer: sin aire de más abajo */
  .contact-section {
    padding-bottom: 16px;
  }

  /* Footer */
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 36px 24px;
    padding: 40px 0;
  }

  .footer-contact-column {
    display: none;
  }

  .footer-logo {
    width: 120px;
  }

  .footer-wordmark {
    width: calc(100% - 32px);
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .footer-bottom-links {
    gap: 20px;
  }
}
</style>
