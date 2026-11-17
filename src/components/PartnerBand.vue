<!-- Una franja chica con el partner de automatización: quién se encarga de las máquinas, junto a nosotros. -->
<template>
  <aside class="partner" aria-label="Partner en automatización industrial">
    <a class="partner-logo" href="https://saisistemas.com.ar/" target="_blank" rel="noopener">
      <img src="/partners/sai-sistemas.png" alt="SAI Sistemas" width="416" height="194" loading="lazy" decoding="async" />
    </a>
    <p class="partner-text">
      En proyectos de IoT industrial trabajamos junto a <strong>SAI Sistemas</strong>, con más de 20 años en
      automatización: PLCs, SCADA y redes industriales.
    </p>
    <a class="partner-link" href="https://saisistemas.com.ar/" target="_blank" rel="noopener">
      saisistemas.com.ar
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </a>
  </aside>
</template>

<style scoped>
.partner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(24px, 4vw, 56px);
  padding: 28px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.partner-logo img {
  display: block;
  width: auto;
  height: 38px;
}

.partner-text {
  max-width: 620px;
  font-size: 16px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.6);
}

.partner-text strong {
  font-weight: 500;
  color: #fff;
}

.partner-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.3s ease;
}

@media (hover: hover) and (pointer: fine) {
  .partner-link:hover,
  .partner-logo:hover + .partner-text + .partner-link {
    color: #fff;
  }
}

@media (max-width: 760px) {
  .partner {
    grid-template-columns: 1fr;
    justify-items: start;
    gap: 16px;
  }

  .partner-logo img {
    height: 32px;
  }

  .partner-text {
    font-size: 15px;
  }
}
</style>
