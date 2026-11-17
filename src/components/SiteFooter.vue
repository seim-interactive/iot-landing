<!--
  El pie de la landing y de las páginas por tema. `home`: dónde está la landing ('' en
  ella misma, '/' en las demás), así los links a sus secciones funcionan desde cualquier
  página. La columna «Plataforma» lleva a las páginas por tema (src/content/temas.js).
-->
<script setup>
import { TEMAS } from '@/content/temas'

defineProps({ home: { type: String, default: '' } })
</script>

<template>
  <footer class="footer">
    <div class="footer-light" aria-hidden="true"></div>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="@/assets/MARCA-14.png" alt="Seim Interactive" class="footer-logo" loading="lazy" decoding="async" />
          <p class="footer-about">
            Soluciones de telemetría industrial que conectan planta y nube de forma segura y confiable.
          </p>
        </div>
        <nav class="footer-column" aria-label="Plataforma">
          <h4 class="footer-title">Plataforma</h4>
          <ul class="footer-links">
            <li v-for="t in TEMAS" :key="t.slug"><a :href="`/${t.slug}/`">{{ t.nav }}</a></li>
          </ul>
        </nav>
        <nav class="footer-column" aria-label="Secciones">
          <h4 class="footer-title">Secciones</h4>
          <ul class="footer-links">
            <li><a :href="`${home}#partes`">Plataforma</a></li>
            <li><a :href="`${home}#solution`">A tu medida</a></li>
            <li><a :href="`${home}#technology`">Cómo funciona</a></li>
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
          <a href="https://seiminteractive.io/es/privacidad/" class="footer-bottom-link">Privacidad</a>
          <a href="#top" class="footer-bottom-link">Volver arriba</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer :where(h4, p, ul) {
  margin: 0;
  padding: 0;
}

.container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: var(--container, 1520px);
  margin: 0 auto;
  padding: 0 var(--gutter, 60px);
  box-sizing: border-box;
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
    flex-wrap: wrap;
    gap: 12px 20px;
  }
}
</style>
