<!--
  Contacto: un campo grande, como el de Argus. Lo que se escribe abre WhatsApp con
  el mensaje ya redactado. Es un link (no un window.open) para que el script del
  head mida la conversión como cualquier otro link a wa.me.
-->
<script setup>
import { computed, ref } from 'vue'

const WHATSAPP = '5493413551507'
const EMAIL = 'hello@seiminteractive.io'
const EXAMPLES = ['La temperatura de un horno', 'Las paradas de una línea', 'El consumo de energía de la planta']

const text = ref('')
const send = ref(null)

const message = computed(() => {
  const what = text.value.trim()
  return what ? `Hola! Quiero medir esto en mi planta: ${what}` : 'Hola! Quiero consultar por la plataforma IoT'
})
const href = computed(() => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message.value)}`)

// Enter manda; Shift + Enter hace un salto de línea.
function onKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  send.value?.click()
}

function useExample(example) {
  text.value = example
}
</script>

<template>
  <div class="ask">
    <h2 class="ask-title" data-reveal>Contanos qué querés medir<br><span>en tu planta.</span></h2>

    <div class="ask-box" data-reveal>
      <label class="visually-hidden" for="ask-input">Qué querés medir en tu planta</label>
      <textarea
        id="ask-input"
        v-model="text"
        class="ask-input"
        rows="3"
        maxlength="600"
        placeholder="Por ejemplo: cuánto produce cada línea por turno y por qué para."
        @keydown="onKeydown"
      ></textarea>
      <div class="ask-bar">
        <div class="ask-examples" aria-label="Ejemplos">
          <button v-for="example in EXAMPLES" :key="example" type="button" class="ask-example" @click="useExample(example)">
            {{ example }}
          </button>
        </div>
        <a ref="send" :href="href" target="_blank" rel="noopener" class="ask-send">
          Enviar por WhatsApp
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      </div>
    </div>

    <p class="ask-after" data-reveal>
      Y después del arranque seguimos con vos: operamos la plataforma <strong>24/7</strong> y armamos juntos la hoja de ruta para que tu planta avance paso a paso.
    </p>

    <dl class="ask-meta" data-reveal>
      <div>
        <dt>Email</dt>
        <dd><a :href="`mailto:${EMAIL}`">{{ EMAIL }}</a></dd>
      </div>
      <div>
        <dt>WhatsApp</dt>
        <dd><a :href="`https://wa.me/${WHATSAPP}`" target="_blank" rel="noopener">+54 9 341 355-1507</a></dd>
      </div>
      <div>
        <dt>Respuesta</dt>
        <dd>En menos de 24 horas</dd>
      </div>
      <div>
        <dt>Cobertura</dt>
        <dd>Toda Argentina, en planta y remoto</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.ask {
  --rule: rgba(255, 255, 255, 0.09);
  max-width: 920px;
  margin: 0 auto;
}

.ask-title {
  font-size: clamp(32px, 4.2vw, 60px);
  font-weight: 400;
  line-height: 1.06;
  letter-spacing: -0.03em;
  text-align: center;
  text-wrap: balance;
}

.ask-title span {
  color: rgba(255, 255, 255, 0.45);
}

/* La caja: el mismo lenguaje que el marco de la plataforma, con su filo de luz */
.ask-box {
  position: relative;
  margin-top: clamp(40px, 5vw, 64px);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 40px 100px -40px rgba(0, 0, 0, 0.9);
  transition: box-shadow 0.4s ease;
}

.ask-box:focus-within {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 40px 100px -40px rgba(0, 0, 0, 0.9);
}

.ask-input {
  display: block;
  width: 100%;
  min-height: 132px;
  padding: 26px 28px 8px;
  border: 0;
  background: transparent;
  resize: none;
  font: inherit;
  font-size: clamp(17px, 1.5vw, 20px);
  line-height: 1.5;
  color: #fff;
}

.ask-input::placeholder {
  color: rgba(255, 255, 255, 0.36);
}

.ask-input:focus {
  outline: none;
}

.ask-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px 14px 22px;
}

.ask-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.ask-example {
  height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.ask-example:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.24);
}

.ask-send {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 22px;
  border-radius: 999px;
  background: #fff;
  color: #0a0a0a;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-decoration: none;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.14);
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.ask-send svg {
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) and (pointer: fine) {
  .ask-send:hover {
    transform: translateY(-1px);
  }

  .ask-send:hover svg {
    transform: translateX(3px);
  }
}

.ask-send:focus-visible,
.ask-example:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.ask-after {
  max-width: 640px;
  margin-top: clamp(40px, 5vw, 64px);
  font-size: 17px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.62);
}

.ask-after strong {
  font-weight: 500;
  color: #fff;
}

/* Los datos de siempre, chicos, abajo */
.ask-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin: clamp(40px, 5vw, 64px) 0 0;
  padding-top: 22px;
  border-top: 1px solid var(--rule);
}

.ask-meta dt {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.42);
}

.ask-meta dd {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.78);
}

.ask-meta a {
  color: inherit;
  text-decoration: none;
}

.ask-meta a:hover {
  color: #fff;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 760px) {
  .ask-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 14px 14px;
  }

  .ask-examples {
    display: none;
  }

  .ask-send {
    justify-content: center;
  }

  .ask-meta {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
