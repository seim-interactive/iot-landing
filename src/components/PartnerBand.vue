<!--
  La alianza con SAI Sistemas, antes de «Cómo funciona»: ellos llegan hasta la máquina
  (el paso 1 del recorrido). Textos y datos, los mismos que publica la web global.
-->
<template>
  <aside class="partner" aria-labelledby="partner-title">
    <a class="partner-mark" href="https://saisistemas.com.ar/" target="_blank" rel="noopener" aria-label="SAI Sistemas">
      <img src="/partners/sai-sistemas.png" alt="SAI Sistemas" width="416" height="194" loading="lazy" decoding="async" />
    </a>

    <div class="partner-body">
      <p class="partner-kicker">Alianza</p>
      <h2 id="partner-title" class="partner-title">
        Junto a SAI Sistemas,<br /><span>llegamos hasta la máquina.</span>
      </h2>
      <p class="partner-text">
        En proyectos de IoT industrial trabajamos junto a SAI Sistemas: ellos ponen la experiencia en automatización
        y nosotros, la plataforma.
      </p>

      <dl class="partner-facts">
        <div>
          <dt>Experiencia</dt>
          <dd>+20 años en automatización</dd>
        </div>
        <div>
          <dt>Especialidad</dt>
          <dd>PLCs, SCADA y redes industriales</dd>
        </div>
      </dl>

      <a class="partner-link" href="https://saisistemas.com.ar/" target="_blank" rel="noopener">
        Conocer SAI Sistemas
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
    </div>
  </aside>
</template>

<style scoped>
.partner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: center;
  gap: clamp(40px, 6vw, 96px);
  padding: clamp(40px, 5vw, 72px);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 24px;
}

.partner-mark {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  border-radius: 18px;
  background: radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255, 255, 255, 0.05), transparent 70%);
}

.partner-mark img {
  width: min(72%, 320px);
  height: auto;
}

.partner-kicker {
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.partner-title {
  margin-top: 16px;
  font-size: clamp(28px, 3.2vw, 46px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.partner-title span {
  color: rgba(255, 255, 255, 0.45);
}

.partner-text {
  margin-top: 20px;
  max-width: 520px;
  font-size: 17px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.62);
}

.partner-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
}

.partner-facts > div {
  padding-top: 18px;
}

.partner-facts dt {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.partner-facts dd {
  margin: 6px 0 0;
  font-size: 18px;
  letter-spacing: -0.01em;
  color: #fff;
}

.partner-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 32px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: color 0.3s ease;
}

@media (hover: hover) and (pointer: fine) {
  .partner-link:hover {
    color: #fff;
  }
}

@media (max-width: 860px) {
  .partner {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 28px 24px 32px;
  }

  .partner-mark {
    aspect-ratio: 16 / 9;
  }

  .partner-facts {
    grid-template-columns: 1fr;
  }
}
</style>
