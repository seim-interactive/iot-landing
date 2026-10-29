<template>
  <div ref="rootEl" class="landing">
    <Navbar />

    <!-- ==================== HERO ==================== -->
    <main id="top" class="hero">
      <!-- Contenedor de luz con conic gradients - SOLO EN HERO -->
      <div class="light-container">
        <div class="conic-light conic-light-top"></div>
        <div class="conic-light conic-light-bottom"></div>
      </div>

      <div class="hero-content">
        <h1 class="hero-kicker">
          Plataforma IoT para la Industria 4.0
        </h1>
        <p class="hero-title">
          La nueva era<br>
          de la Industria Inteligente
        </p>

        <a href="#solution" class="announcement-button">
          <span class="dot"></span>
          Conocé nuestra Solución IoT
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

      <!-- Scroll indicator -->
      <a class="scroll-indicator" href="#services" aria-label="Ir a servicios">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </main>

    <!-- ==================== SERVICIOS ==================== -->
    <section id="services" ref="servicesEl" class="section services">
      <div class="container">
        <header class="section-head" data-reveal>
          <h2 class="section-title">
            Ingeniería de punta a punta.
            <span class="muted">Del PLC a la inteligencia artificial.</span>
          </h2>
          <p class="section-lead">
            Un solo equipo responsable de toda la cadena: integración en planta, infraestructura cloud, visualización, IA, seguridad y operación continua.
          </p>
        </header>

        <!-- Desktop: pestañas con avance automático -->
        <div
          class="services-panel desktop-services"
          :class="{ 'is-paused': servicesPaused }"
          data-reveal
          @mouseenter="hoverPaused = true"
          @mouseleave="hoverPaused = false"
          @focusin="hoverPaused = true"
          @focusout="hoverPaused = false"
        >
          <ul class="services-tabs" role="tablist" aria-label="Servicios">
            <li v-for="(service, index) in services" :key="service.name">
              <button
                :id="`service-tab-${index}`"
                type="button"
                role="tab"
                class="service-tab"
                :class="{ 'is-active': activeIndex === index }"
                :aria-selected="activeIndex === index"
                :aria-controls="`service-panel-${index}`"
                @click="setActiveService(index)"
              >
                {{ service.name }}
                <span class="tab-progress" aria-hidden="true">
                  <span class="tab-progress-fill" @animationend="nextService"></span>
                </span>
              </button>
            </li>
          </ul>

          <div class="service-stage">
            <article
              v-for="(service, index) in services"
              :id="`service-panel-${index}`"
              :key="service.name"
              role="tabpanel"
              class="service-detail"
              :class="{ 'is-active': activeIndex === index }"
              :aria-labelledby="`service-tab-${index}`"
              :aria-hidden="activeIndex !== index"
            >
              <h3 class="detail-title">{{ service.title }}</h3>
              <p class="detail-desc">{{ service.mainDescription }}</p>
              <p class="detail-note">{{ service.secondaryDescription }}</p>
            </article>
          </div>
        </div>

        <!-- Mobile: carrusel con swipe -->
        <div
          class="mobile-services-carousel"
          :class="{ 'is-paused': servicesPaused }"
          data-reveal
        >
          <span class="carousel-progress" aria-hidden="true">
            <span :key="activeIndex" class="carousel-progress-fill" @animationend="nextService"></span>
          </span>

          <div
            class="carousel-track"
            :class="swipeDirection"
            @touchstart.passive="handleTouchStart"
            @touchmove.passive="handleTouchMove"
            @touchend="handleTouchEnd"
            @touchcancel="handleTouchEnd"
          >
            <article
              v-for="(service, index) in services"
              :key="service.name"
              class="carousel-slide"
              :class="{ 'is-active': activeIndex === index }"
              :aria-hidden="activeIndex !== index"
            >
              <h3 class="carousel-title">{{ service.title }}</h3>
              <p class="carousel-description">{{ service.mainDescription }}</p>
              <p class="carousel-secondary">{{ service.secondaryDescription }}</p>
            </article>
          </div>

          <div class="carousel-dots">
            <button
              v-for="(service, index) in services"
              :key="service.name"
              type="button"
              class="carousel-dot"
              :class="{ 'is-active': activeIndex === index }"
              :aria-label="`Ver ${service.name}`"
              @click="setActiveService(index)"
            ></button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== SOLUCIÓN ==================== -->
    <section id="solution" class="section solution">
      <div class="solution-glow" aria-hidden="true"></div>

      <div class="container">
        <header class="section-head section-head--center" data-reveal>
          <h2 class="section-title">Plataforma de Control Industrial</h2>
          <p class="section-lead">
            La plataforma que entregamos es privada, dedicada y adaptada a cada cliente, funcionando como el punto central de control y análisis de la operación.
          </p>
        </header>

        <div class="solution-showcase">
          <figure class="device">
            <img
              src="@/assets/capturaLoginPlataforma02.png"
              alt="Plataforma de Control Industrial"
              class="device-image"
              width="3024"
              height="1722"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <p class="device-caption">Vista unificada de métricas, estados y variables críticas de la operación industrial.</p>
        </div>

        <div class="solution-grid">
          <div class="solution-copy" data-reveal>
            <h3 class="block-title">Solución IoT Industrial a Medida</h3>
            <p>Nuestro enfoque combina integración industrial, arquitectura cloud y visualización inteligente para brindar visibilidad real sobre la operación.</p>
            <p>Cada solución es diseñada a medida, respetando los procesos existentes y acompañando la toma de decisiones operativas y estratégicas.</p>
          </div>

          <div class="capabilities" data-reveal>
            <h3 class="block-title">Capacidades de la Plataforma</h3>
            <ul class="capability-list">
              <li v-for="capability in capabilities" :key="capability" class="capability">{{ capability }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== CASOS DE USO ==================== -->
    <section id="use-cases" class="section use-cases">
      <div class="container">
        <header class="section-head section-head--split" data-reveal>
          <h2 class="section-title">Casos de Uso de IoT en la Industria</h2>
          <p class="section-lead">
            Soluciones IoT para monitoreo de producción, mantenimiento predictivo y eficiencia operativa en plantas industriales.
          </p>
        </header>

        <!-- Desktop: grilla -->
        <div class="use-cases-grid desktop-use-cases">
          <article v-for="useCase in useCases" :key="useCase.title" class="use-case-card" data-reveal>
            <svg class="card-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="useCase.icon"></svg>
            <h3 class="card-title">{{ useCase.title }}</h3>
            <p class="card-description">{{ useCase.summary }}</p>
          </article>
        </div>

        <!-- Mobile: acordeón -->
        <Accordion type="single" collapsible class="mobile-use-cases-accordion" default-value="item-0" data-reveal>
          <AccordionItem
            v-for="(useCase, index) in useCases"
            :key="useCase.title"
            :value="`item-${index}`"
            class="accordion-item"
          >
            <AccordionTrigger class="accordion-header">
              <span class="accordion-title">{{ useCase.title }}</span>
              <span class="accordion-toggle" aria-hidden="true"></span>
            </AccordionTrigger>
            <AccordionContent class="accordion-content">
              <p class="accordion-description">{{ useCase.description }}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>

    <!-- ==================== CÓMO FUNCIONA ==================== -->
    <section id="technology" class="flow" aria-labelledby="flow-title">
      <div ref="flowTrack" class="flow-track" :style="{ '--steps': flowSteps.length }">
        <div class="flow-sticky">
          <div class="flow-beam" aria-hidden="true"></div>

          <div class="container flow-layout">
            <header class="flow-head">
              <h2 id="flow-title" class="section-title">Cómo funciona</h2>
              <p class="section-lead">El flujo de datos desde la planta hasta la inteligencia operativa.</p>
            </header>

            <!-- Paso activo (visual). El contenido completo para lectores de pantalla
                 y buscadores está en la lista .flow-all. -->
            <div class="flow-detail" aria-hidden="true">
              <article
                v-for="(step, index) in flowSteps"
                :key="step.title"
                class="flow-step"
                :class="{ 'is-active': activeStep === index, 'is-past': index < activeStep }"
              >
                <h3 class="flow-step-title">{{ step.title }}</h3>
                <p class="flow-step-desc">{{ step.description }}</p>
              </article>
            </div>

            <!-- Órbita: los datos entran por el anillo exterior (la planta) y avanzan
                 en espiral hacia el núcleo (la inteligencia). -->
            <div class="flow-visual" aria-hidden="true">
              <svg class="orbit" viewBox="0 0 640 640">
                <defs>
                  <radialGradient id="orbit-ambient">
                    <stop offset="0%" stop-color="#afe3e8" stop-opacity="0.14" />
                    <stop offset="100%" stop-color="#afe3e8" stop-opacity="0" />
                  </radialGradient>
                  <radialGradient id="orbit-core">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
                    <stop offset="25%" stop-color="#afe3e8" stop-opacity="0.85" />
                    <stop offset="100%" stop-color="#afe3e8" stop-opacity="0" />
                  </radialGradient>
                  <filter id="orbit-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" />
                  </filter>
                </defs>

                <circle cx="320" cy="320" r="318" fill="url(#orbit-ambient)" />

                <g
                  v-for="(radius, index) in orbitRadii"
                  :key="radius"
                  class="ring"
                  :class="{ 'is-reached': index <= activeStep, 'is-current': index === activeStep }"
                >
                  <circle class="ring-glow" cx="320" cy="320" :r="radius" filter="url(#orbit-glow)" />
                  <circle class="ring-line" cx="320" cy="320" :r="radius" />
                </g>

                <circle data-orbit-core class="orbit-core" cx="320" cy="320" r="96" fill="url(#orbit-core)" />

                <g data-orbit-trail>
                  <circle v-for="n in 18" :key="n" class="trail-dot" cx="320" cy="320" :r="3.6 - n * 0.16" />
                </g>
                <circle data-orbit-particle class="particle" cx="320" cy="40" r="5" />

                <text
                  v-for="(radius, index) in orbitRadii"
                  :key="`label-${radius}`"
                  class="ring-label"
                  :class="{ 'is-reached': index <= activeStep, 'is-current': index === activeStep }"
                  x="320"
                  :y="320 - radius - 12"
                  text-anchor="middle"
                  @click="scrollToStep(index)"
                >{{ flowSteps[index].short }}</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <ol class="flow-all">
        <li v-for="step in flowSteps" :key="step.title">
          <h3 class="flow-step-title">{{ step.title }}</h3>
          <p class="flow-step-desc">{{ step.description }}</p>
        </li>
      </ol>
    </section>

    <!-- ==================== CONTACTO ==================== -->
    <section id="contact" class="section contact">
      <div class="container">
        <div class="contact-panel" data-reveal>
          <div class="contact-glow" aria-hidden="true"></div>

          <div class="contact-main">
            <h2 class="contact-title">Trabajemos juntos.</h2>
            <p class="section-lead">
              Conectá con nuestro equipo para explorar cómo podemos transformar tu operación industrial.
            </p>

            <div class="contact-actions">
              <a href="https://wa.me/5493413551507" target="_blank" rel="noopener" class="btn btn-primary">
                <i class="pi pi-whatsapp" aria-hidden="true"></i>
                Escribinos por WhatsApp
              </a>
              <a href="mailto:hello@seiminteractive.io" class="btn btn-ghost">
                <i class="pi pi-envelope" aria-hidden="true"></i>
                Envianos un email
              </a>
            </div>
          </div>

          <dl class="contact-meta">
            <div>
              <dt>Email</dt>
              <dd><a href="mailto:hello@seiminteractive.io">hello@seiminteractive.io</a></dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd><a href="https://wa.me/5493413551507" target="_blank" rel="noopener">+54 9 341 355-1507</a></dd>
            </div>
            <div>
              <dt>Respuesta</dt>
              <dd>Respondemos en menos de 24 horas</dd>
            </div>
            <div>
              <dt>Cobertura</dt>
              <dd>Toda Argentina, on-site y remoto</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- ==================== FOOTER ==================== -->
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

          <nav class="footer-column" aria-label="Servicios">
            <h4 class="footer-title">Servicios</h4>
            <ul class="footer-links">
              <li><a href="#services">Integración Industrial</a></li>
              <li><a href="#services">Arquitectura Cloud</a></li>
              <li><a href="#services">Visualización</a></li>
              <li><a href="#services">Inteligencia Artificial</a></li>
            </ul>
          </nav>

          <nav class="footer-column" aria-label="Secciones">
            <h4 class="footer-title">Secciones</h4>
            <ul class="footer-links">
              <li><a href="#solution">Solución</a></li>
              <li><a href="#use-cases">Casos de Uso</a></li>
              <li><a href="#technology">Cómo funciona</a></li>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { useLandingMotion } from '@/composables/useLandingMotion'
import { useFlowScroll } from '@/composables/useFlowScroll'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const rootEl = ref(null)
const servicesEl = ref(null)
const flowTrack = ref(null)

const services = [
  {
    name: 'Integración Industrial',
    title: 'Integración Industrial',
    mainDescription: 'Conectamos PLCs (Siemens, Allen Bradley, Rockwell) y sistemas industriales existentes de forma segura y no invasiva. Trabajamos con protocolos OPC-UA, MQTT y Modbus, respetando la operación y evitando interrupciones en planta.',
    secondaryDescription: 'La integración IoT se adapta a cada entorno industrial, capturando datos críticos desde el origen.',
  },
  {
    name: 'Arquitectura Cloud',
    title: 'Arquitectura Cloud Industrial',
    mainDescription: 'Diseñamos y operamos arquitecturas cloud robustas, escalables y seguras para entornos industriales. Cada solución IoT se construye según la criticidad de la operación.',
    secondaryDescription: 'La infraestructura cloud industrial está preparada para crecer junto a la planta, manteniendo estabilidad y control.',
  },
  {
    name: 'Visualización',
    title: 'Dashboards y Visualización',
    mainDescription: 'Creamos dashboards industriales claros con KPIs, OEE y métricas en tiempo real, enfocados en cada rol y proceso. La información se presenta de forma simple, priorizando la toma de decisiones.',
    secondaryDescription: 'No mostramos datos por mostrar: estructuramos la información para reflejar el estado real de la operación industrial.',
  },
  {
    name: 'Inteligencia Artificial',
    title: 'Inteligencia Artificial Aplicada',
    mainDescription: 'Incorporamos inteligencia artificial y machine learning para analizar patrones, detectar anomalías y generar insights sobre los datos industriales y de producción.',
    secondaryDescription: 'El objetivo no es reemplazar decisiones humanas, sino potenciar el criterio operativo con información contextualizada por IA.',
  },
  {
    name: 'Seguridad',
    title: 'Ciberseguridad OT',
    mainDescription: 'La ciberseguridad OT es un pilar central de cada implementación IoT. Aplicamos aislamiento de red, control de accesos y protección de datos industriales con buenas prácticas IEC 62443.',
    secondaryDescription: 'Cada entorno es privado y diseñado específicamente para el cliente, evitando exposiciones innecesarias.',
  },
  {
    name: 'Soporte y Operación',
    title: 'Soporte y Operación 24/7',
    mainDescription: 'Operamos y monitoreamos la plataforma IoT de forma continua 24/7, asegurando disponibilidad, performance y correcto funcionamiento de la solución.',
    secondaryDescription: 'La operación no termina en la implementación: es un proceso vivo con soporte técnico continuo.',
  },
  {
    name: 'Consultoría y Evolución',
    title: 'Consultoría Industria 4.0',
    mainDescription: 'Acompañamos a empresas argentinas en la evolución de su madurez digital y transformación hacia la Industria 4.0. Analizamos procesos, métricas y roadmap futuro.',
    secondaryDescription: 'La plataforma IoT y el servicio evolucionan junto a la operación y al negocio.',
  },
]

const capabilities = [
  'Integración con PLCs y sistemas industriales',
  'Arquitectura cloud privada y escalable',
  'Dashboards operativos a medida',
  'Métricas en tiempo real',
  'Seguridad industrial y de datos',
  'Inteligencia artificial aplicada',
  'Soporte y operación continua',
]

// summary: texto de la card en desktop. description: texto del acordeón en mobile.
const useCases = [
  {
    title: 'Monitoreo de Producción',
    summary: 'Visibilidad en tiempo real del estado de líneas y procesos.',
    description: 'Visibilidad en tiempo real del estado de líneas y procesos productivos. Seguimiento continuo de métricas clave para tomar decisiones informadas.',
    icon: '<path d="M3 12h4l3-9 4 18 3-9h4"/>',
  },
  {
    title: 'Eficiencia Operativa y OEE',
    summary: 'Indicadores clave (OEE, KPIs) para optimizar el desempeño industrial.',
    description: 'Indicadores clave (OEE, KPIs) para optimizar el desempeño industrial. Identificación de cuellos de botella y oportunidades de mejora continua.',
    icon: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  },
  {
    title: 'Continuidad Operativa y Alertas en Tiempo Real',
    summary: 'Supervisión 24/7 con alertas tempranas para asegurar estabilidad y previsibilidad.',
    description: 'Supervisión 24/7 con alertas tempranas para asegurar estabilidad y previsibilidad de variables críticas.',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  },
  {
    title: 'Mantenimiento Predictivo con IA',
    summary: 'Anticipación de fallas basada en datos operativos y modelos de IA predictivos.',
    description: 'Anticipación de fallas basada en datos operativos y modelos de IA predictivos. Reducción de paradas no planificadas y optimización de recursos de mantenimiento.',
    icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  },
  {
    title: 'Gestión Multi-Planta',
    summary: 'Control centralizado de múltiples plantas o líneas.',
    description: 'Control centralizado de múltiples plantas o líneas. Comparativas de rendimiento y estandarización de procesos entre ubicaciones.',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  },
  {
    title: 'Inteligencia Artificial Aplicada a la Industria',
    summary: 'Insights automáticos, análisis predictivo y detección de patrones para decisiones estratégicas.',
    description: 'Insights automáticos, análisis predictivo y detección de patrones en grandes volúmenes de datos para decisiones estratégicas.',
    icon: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  },
]

const flowSteps = [
  {
    short: 'PLCs',
    title: 'PLCs y Sistemas Industriales',
    description: 'Los datos nacen en los PLCs y sistemas de control que gobiernan la operación industrial.',
  },
  {
    short: 'Gateway',
    title: 'Gateway Industrial',
    description: 'Un gateway industrial captura la información en planta y la envía de forma segura hacia la nube.',
  },
  {
    short: 'Nube',
    title: 'Nube Industrial',
    description: 'La información se procesa, organiza y almacena en una infraestructura cloud privada y escalable.',
  },
  {
    short: 'Datos',
    title: 'Plataforma de Datos',
    description: 'Los datos se transforman en métricas claras y estados operativos accesibles en tiempo real.',
  },
  {
    short: 'Dashboards',
    title: 'Dashboards Operativos',
    description: 'Visualizaciones diseñadas a medida permiten entender el estado de la operación de un vistazo.',
  },
  {
    short: 'IA',
    title: 'Inteligencia Artificial',
    description: 'La inteligencia artificial analiza patrones y comportamientos para generar insights relevantes.',
  },
]

// Radio de cada anillo de la órbita (en unidades del viewBox 640×640), de afuera
// hacia adentro: un anillo por paso.
const orbitRadii = [280, 228, 176, 124, 76, 30]

const activeStep = ref(0)

useLandingMotion(rootEl)
const { scrollToStep } = useFlowScroll(flowTrack, { radii: orbitRadii, center: 320, activeStep })

// ---------- Servicios: avance automático ----------
// El temporizador ES la animación CSS de la barra de progreso de la pestaña activa:
// al terminar (animationend) se pasa al siguiente servicio. Pausar la barra pausa el
// avance, así que barra y contenido nunca se desincronizan. Con movimiento reducido
// la barra no se anima y no hay avance automático.
const activeIndex = ref(0)
const swipeDirection = ref('slide-left')
const hoverPaused = ref(false)
const touchPaused = ref(false)
const servicesInView = ref(false)
const servicesPaused = computed(() => hoverPaused.value || touchPaused.value || !servicesInView.value)

const setActiveService = (index) => {
  swipeDirection.value = index >= activeIndex.value ? 'slide-left' : 'slide-right'
  activeIndex.value = index
}

const nextService = () => {
  swipeDirection.value = 'slide-left'
  activeIndex.value = (activeIndex.value + 1) % services.length
}

const prevService = () => {
  swipeDirection.value = 'slide-right'
  activeIndex.value = (activeIndex.value - 1 + services.length) % services.length
}

let touchStartX = 0
let touchEndX = 0

const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  touchEndX = touchStartX
  touchPaused.value = true
}

const handleTouchMove = (e) => {
  touchEndX = e.touches[0].clientX
}

const handleTouchEnd = () => {
  const diff = touchStartX - touchEndX

  if (Math.abs(diff) > 50) {
    if (diff > 0) nextService()
    else prevService()
  }

  touchPaused.value = false
}

let servicesObserver = null

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

  servicesObserver = new IntersectionObserver(
    ([entry]) => {
      servicesInView.value = entry.isIntersecting
    },
    { threshold: 0.35 }
  )
  if (servicesEl.value) servicesObserver.observe(servicesEl.value)
})

onUnmounted(() => {
  servicesObserver?.disconnect()
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
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  /* 1520 = a 1440px de ancho el contenido queda a 60px, igual que el hero */
  --container: 1520px;
  --gutter: 60px;
  --header-h: 72px;
  --section-pad: clamp(112px, 12vw, 168px);

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
  padding: var(--section-pad) 0;
}

a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 6px;
}

/* ==================== PRIMITIVAS ==================== */
.section-head {
  max-width: 820px;
  margin-bottom: clamp(56px, 7vw, 96px);
}

.section-title {
  font-size: clamp(34px, 4.4vw, 60px);
  font-weight: 400;
  line-height: 1.06;
  letter-spacing: -0.03em;
  color: var(--text);
  text-wrap: balance;
}

.section-title .muted {
  color: var(--text-4);
}

.section-lead {
  margin-top: 24px;
  max-width: 580px;
  font-size: clamp(16px, 1.25vw, 18px);
  line-height: 1.65;
  color: var(--text-2);
  text-wrap: pretty;
}

.section-head--center {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.section-head--center .section-lead {
  margin-left: auto;
  margin-right: auto;
}

.section-head--split {
  max-width: none;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  align-items: end;
  gap: 48px;
}

.section-head--split .section-lead {
  justify-self: end;
  margin-top: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 50px;
  padding: 0 24px;
  border-radius: 8px;
  font-family: var(--font);
  font-size: 15px;
  font-weight: 400;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease;
}

.btn .pi {
  font-size: 15px;
}

.btn-primary {
  background: #fff;
  color: #000;
}

.btn-primary:hover {
  background: var(--accent);
}

.btn-ghost {
  border: 1px solid var(--line-strong);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
}

.btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.07);
}

/* ==================== HERO (original) ==================== */
/* Contenedor de luz - Extendido para cubrir hero y parte de services */
.light-container {
  position: absolute;
  top: -20%;
  right: -2rem;
  width: 90vw;
  height: 140vh;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  z-index: 1;
  filter: blur(20px);
  mask-image: radial-gradient(
    ellipse 120% 120% at 100% 40%,
    rgb(255, 255, 255) 0%,
    rgba(255, 255, 255, 0.95) 10%,
    rgba(255, 255, 255, 0.9) 20%,
    rgba(255, 255, 255, 0.8) 30%,
    rgba(255, 255, 255, 0.65) 40%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.35) 60%,
    rgba(255, 255, 255, 0.2) 70%,
    rgba(255, 255, 255, 0.1) 80%,
    rgba(255, 255, 255, 0.03) 90%,
    rgba(255, 255, 255, 0) 100%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 120% 120% at 100% 40%,
    rgb(255, 255, 255) 0%,
    rgba(255, 255, 255, 0.95) 10%,
    rgba(255, 255, 255, 0.9) 20%,
    rgba(255, 255, 255, 0.8) 30%,
    rgba(255, 255, 255, 0.65) 40%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.35) 60%,
    rgba(255, 255, 255, 0.2) 70%,
    rgba(255, 255, 255, 0.1) 80%,
    rgba(255, 255, 255, 0.03) 90%,
    rgba(255, 255, 255, 0) 100%
  );
}

.conic-light {
  flex: 1;
  width: 100%;
}

.conic-light-top {
  background: conic-gradient(
    from 180deg at 99.78% 35%,
    rgb(255, 255, 255) 0deg,
    rgb(255, 255, 255) 15deg,
    rgb(175, 227, 232) 25deg,
    rgb(160, 212, 222) 40deg,
    rgba(145, 195, 205, 0.5) 60deg,
    rgba(17, 17, 17, 0) 90deg,
    rgba(17, 17, 17, 0) 342deg,
    rgb(255, 255, 255) 360deg
  );
}

.conic-light-bottom {
  background: conic-gradient(
    from 0deg at 99.78% 65%,
    rgb(255, 255, 255) 0deg,
    rgb(255, 255, 255) 10deg,
    rgba(17, 17, 17, 0) 20deg,
    rgba(17, 17, 17, 0) 270deg,
    rgb(160, 212, 222) 315deg,
    rgb(175, 227, 232) 330deg,
    rgb(255, 255, 255) 342deg,
    rgb(255, 255, 255) 360deg
  );
}

.hero {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  z-index: 10;
  padding-top: 80px;
  background: #000;
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: left;
  max-width: 1200px;
  padding: 0 60px;
}

.hero-kicker {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 24px 0;
  line-height: 1.4;
  max-width: 640px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.45) 30%,
    rgba(255, 255, 255, 0.7) 60%,
    rgba(255, 255, 255, 0.9) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}

.hero-title {
  font-size: clamp(40px, 6vw, 72px);
  font-weight: 400;
  line-height: 1.1;
  margin-bottom: 40px;
  letter-spacing: -0.02em;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.7) 30%,
    rgba(255, 255, 255, 0.95) 60%,
    rgba(255, 255, 255, 1) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.announcement-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background-color 0.25s ease, border-color 0.3s ease, color 0.3s ease;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.announcement-button svg {
  transition: transform 0.25s ease;
  opacity: 0.6;
}

@media (hover: hover) and (pointer: fine) {
  .announcement-button:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .announcement-button:hover svg {
    transform: translateX(4px);
  }
}

.dot {
  width: 6px;
  height: 6px;
  background: #06f62e;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 60px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 6px;
  transition: color 0.3s ease, transform 0.3s ease;
  animation: bounce 2s ease-in-out infinite;
}

.scroll-indicator:hover {
  color: rgba(255, 255, 255, 0.7);
  transform: translateY(4px);
}

.scroll-indicator svg {
  width: 20px;
  height: 20px;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(8px);
  }
}

/* ==================== SERVICIOS ==================== */
.services-panel {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  gap: clamp(40px, 6vw, 112px);
  align-items: stretch;
}

.services-tabs {
  list-style: none;
}

.service-tab {
  position: relative;
  width: 100%;
  display: block;
  padding: 18px 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: none;
  color: var(--text-3);
  font-family: var(--font);
  font-size: 17px;
  font-weight: 300;
  text-align: left;
  cursor: pointer;
  transition: color 0.35s ease;
}

.service-tab:hover {
  color: var(--text-2);
}

.service-tab.is-active {
  color: var(--text);
  font-weight: 400;
}

.tab-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  overflow: hidden;
}

.tab-progress-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
}

.service-tab.is-active .tab-progress-fill {
  animation: service-timer 7s linear forwards;
}

.services-panel.is-paused .tab-progress-fill,
.mobile-services-carousel.is-paused .carousel-progress-fill {
  animation-play-state: paused;
}

@keyframes service-timer {
  to { transform: scaleX(1); }
}

/* Todos los paneles se apilan en la misma celda: el alto lo marca el más largo,
   así que cambiar de servicio nunca mueve el resto de la página. */
.service-stage {
  position: relative;
  display: grid;
  align-items: center;
}

.service-detail {
  grid-area: 1 / 1;
  opacity: 0;
  visibility: hidden;
  transform: translateY(16px);
  transition: opacity 0.4s ease, transform 0.6s var(--ease-out), visibility 0s linear 0.6s;
}

.service-detail.is-active {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity 0.55s ease 0.1s, transform 0.8s var(--ease-out) 0.1s, visibility 0s;
}

.detail-title {
  font-size: clamp(32px, 3.4vw, 48px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.detail-desc {
  margin-top: 24px;
  max-width: 620px;
  font-size: 18px;
  line-height: 1.7;
  color: var(--text-2);
}

.detail-note {
  margin-top: 18px;
  max-width: 580px;
  font-size: 16px;
  line-height: 1.65;
  color: var(--text-3);
}

/* Carrusel mobile */
.mobile-services-carousel {
  display: none;
  flex-direction: column;
}

.carousel-progress {
  display: block;
  height: 1px;
  margin-bottom: 28px;
  background: var(--line-strong);
  overflow: hidden;
}

.carousel-progress-fill {
  display: block;
  height: 100%;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
  animation: service-timer 7s linear forwards;
}

.carousel-track {
  display: grid;
  touch-action: pan-y;
  user-select: none;
  --slide-from: 28px;
}

.carousel-track.slide-right {
  --slide-from: -28px;
}

.carousel-slide {
  grid-area: 1 / 1;
  opacity: 0;
  visibility: hidden;
  transform: translateX(var(--slide-from));
  transition: opacity 0.3s ease, transform 0.5s var(--ease-out), visibility 0s linear 0.5s;
}

.carousel-slide.is-active {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity 0.45s ease 0.08s, transform 0.6s var(--ease-out) 0.08s, visibility 0s;
}

.carousel-title {
  font-size: 28px;
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.carousel-description {
  margin-top: 18px;
  font-size: 15.5px;
  line-height: 1.7;
  color: var(--text-2);
}

.carousel-secondary {
  margin-top: 14px;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--text-3);
}

.carousel-dots {
  display: flex;
  gap: 6px;
  margin-top: 36px;
}

.carousel-dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.16);
  cursor: pointer;
  transition: width 0.4s var(--ease-out), background-color 0.3s ease;
}

.carousel-dot.is-active {
  width: 22px;
  background: var(--accent);
}

/* ==================== SOLUCIÓN ==================== */
.solution-glow {
  position: absolute;
  left: 50%;
  top: 34%;
  width: min(1200px, 120vw);
  height: 720px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(175, 227, 232, 0.13), transparent 70%);
  pointer-events: none;
  z-index: 1;
}

.solution-showcase {
  perspective: 1800px;
  max-width: 1120px;
  margin: 0 auto;
}

.device {
  position: relative;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: #050607;
  overflow: hidden;
  box-shadow:
    0 50px 120px -30px rgba(0, 0, 0, 0.9),
    0 30px 120px -50px rgba(175, 227, 232, 0.35);
  will-change: transform;
}

.device-image {
  display: block;
  width: 100%;
  height: auto;
}

.device-caption {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-3);
}

.solution-grid {
  margin-top: clamp(80px, 10vw, 140px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(40px, 7vw, 120px);
}

.block-title {
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--line);
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -0.015em;
}

.solution-copy p {
  font-size: 17px;
  line-height: 1.75;
  color: var(--text-2);
}

.solution-copy p + p {
  margin-top: 18px;
}

.capabilities .block-title {
  margin-bottom: 0;
}

.capability-list {
  list-style: none;
}

.capability {
  position: relative;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  font-size: 16px;
  color: var(--text-2);
  transition: color 0.3s ease;
}

.capability::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.6s var(--ease-out);
}

.capability:hover {
  color: var(--text);
}

.capability:hover::before {
  transform: scaleX(1);
}

/* ==================== CASOS DE USO ==================== */
.use-cases-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}

.use-case-card {
  --mx: 50%;
  --my: -30%;
  position: relative;
  min-height: 280px;
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  background: #000;
  overflow: hidden;
  isolation: isolate;
}

.use-case-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(380px circle at var(--mx) var(--my), rgba(175, 227, 232, 0.11), transparent 65%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.use-case-card:hover::before {
  opacity: 1;
}

.card-icon {
  color: var(--text-3);
  transition: color 0.4s ease;
}

.use-case-card:hover .card-icon {
  color: var(--accent);
}

.card-title {
  margin-top: auto;
  padding-top: 56px;
  font-size: 21px;
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: -0.015em;
  text-wrap: balance;
}

.card-description {
  margin-top: 12px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-3);
  transition: color 0.4s ease;
}

.use-case-card:hover .card-description {
  color: var(--text-2);
}

/* Acordeón mobile */
.mobile-use-cases-accordion {
  display: none;
  flex-direction: column;
  border-top: 1px solid var(--line);
}

.accordion-item {
  border-bottom: 1px solid var(--line);
}

.accordion-header {
  width: 100%;
  padding: 22px 0 !important;
  color: inherit;
  font-family: var(--font);
}

.accordion-title {
  font-size: 17px;
  font-weight: 300;
  color: var(--text-2);
  text-align: left;
  transition: color 0.3s ease;
}

.accordion-item[data-state='open'] .accordion-title {
  color: var(--text);
  font-weight: 400;
}

/* Ícono +/− dibujado con CSS */
.accordion-toggle {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-left: 16px;
}

.accordion-toggle::before,
.accordion-toggle::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 1px;
  margin: -0.5px 0 0 -7px;
  background: var(--text-2);
  transition: transform 0.4s var(--ease-out), background-color 0.3s ease;
}

.accordion-toggle::after {
  transform: rotate(90deg);
}

.accordion-item[data-state='open'] .accordion-toggle::before,
.accordion-item[data-state='open'] .accordion-toggle::after {
  background: var(--accent);
}

.accordion-item[data-state='open'] .accordion-toggle::after {
  transform: rotate(0deg);
}

.accordion-content {
  overflow: hidden;
}

.accordion-content[data-state='open'] {
  animation: accordion-down 0.45s var(--ease-out);
}

.accordion-content[data-state='closed'] {
  animation: accordion-up 0.3s ease;
}

@keyframes accordion-down {
  from { height: 0; opacity: 0; }
  to { height: var(--reka-accordion-content-height); opacity: 1; }
}

@keyframes accordion-up {
  from { height: var(--reka-accordion-content-height); opacity: 1; }
  to { height: 0; opacity: 0; }
}

.accordion-description {
  padding-bottom: 24px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-2);
}

/* ==================== CÓMO FUNCIONA ==================== */
.flow {
  position: relative;
  z-index: 2;
}

/* La pista define cuánto scroll dura el recorrido; el contenido queda fijo. */
.flow-track {
  position: relative;
  height: calc(100vh + var(--steps) * 62vh);
}

.flow-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  overflow: clip;
}

/* Haz de luz desde la derecha, el mismo lenguaje que el hero */
.flow-beam {
  position: absolute;
  top: 0;
  right: 0;
  width: 70%;
  height: 100%;
  background: radial-gradient(ellipse 60% 55% at 100% 50%, rgba(175, 227, 232, 0.16), transparent 70%);
  pointer-events: none;
}

.flow-layout {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  grid-template-areas:
    'head visual'
    'detail visual';
  grid-template-rows: auto 1fr;
  column-gap: clamp(40px, 6vw, 112px);
  height: 100%;
  padding-top: calc(var(--header-h) + clamp(32px, 7vh, 80px));
  padding-bottom: clamp(32px, 7vh, 80px);
}

.flow-head {
  grid-area: head;
}

.flow-detail {
  grid-area: detail;
  display: grid;
  align-content: center;
}

.flow-step {
  grid-area: 1 / 1;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: opacity 0.35s ease, transform 0.6s var(--ease-out), visibility 0s linear 0.6s;
}

.flow-step.is-past {
  transform: translateY(-20px);
}

.flow-step.is-active {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity 0.5s ease 0.08s, transform 0.75s var(--ease-out) 0.08s, visibility 0s;
}

.flow-step-title {
  font-size: clamp(28px, 2.8vw, 40px);
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.flow-step-desc {
  margin-top: 18px;
  max-width: 460px;
  font-size: 17px;
  line-height: 1.65;
  color: var(--text-2);
}

.flow-visual {
  grid-area: visual;
  align-self: center;
  justify-self: center;
  width: min(100%, calc(100vh - var(--header-h) - 120px));
}

.orbit {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.ring-line {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
  transition: stroke 0.6s ease;
}

.ring.is-reached .ring-line {
  stroke: rgba(175, 227, 232, 0.32);
}

.ring.is-current .ring-line {
  stroke: var(--accent);
  stroke-width: 1.25;
}

.ring-glow {
  fill: none;
  stroke: var(--accent);
  stroke-width: 4;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.ring.is-current .ring-glow {
  opacity: 0.55;
}

.orbit-core {
  opacity: 0.12;
}

.particle {
  fill: #fff;
}

.trail-dot {
  fill: var(--accent);
}

.ring-label {
  font-family: var(--font);
  font-size: 17px;
  font-weight: 400;
  fill: var(--text-4);
  paint-order: stroke;
  stroke: #000;
  stroke-width: 6px;
  stroke-linejoin: round;
  cursor: pointer;
  transition: fill 0.4s ease;
}

.ring-label.is-reached {
  fill: var(--text-2);
}

.ring-label.is-current {
  fill: #fff;
}

/* Contenido completo de los pasos: oculto a la vista, disponible para lectores de
   pantalla y buscadores (y visible si el navegador no soporta la versión fija). */
.flow-all {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@supports not (overflow: clip) {
  .flow-track {
    height: auto;
  }

  .flow-sticky {
    position: relative;
    height: auto;
    padding: var(--section-pad) 0 0;
  }

  .flow-detail {
    display: none;
  }

  .flow-all {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip-path: none;
    white-space: normal;
    list-style: none;
    max-width: var(--container);
    margin: 0 auto;
    padding: 48px var(--gutter) var(--section-pad);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
  }
}

/* ==================== CONTACTO ==================== */
.contact-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: clamp(40px, 6vw, 96px);
  align-items: end;
  padding: clamp(40px, 6vw, 88px);
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #040506;
  overflow: hidden;
  isolation: isolate;
}

.contact-glow {
  position: absolute;
  z-index: -1;
  right: -20%;
  top: -60%;
  width: 80%;
  height: 160%;
  background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(175, 227, 232, 0.16), transparent 70%);
  pointer-events: none;
}

.contact-title {
  font-size: clamp(44px, 6vw, 88px);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.04em;
}

.contact-actions {
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.contact-meta {
  display: grid;
  border-top: 1px solid var(--line);
}

.contact-meta > div {
  display: grid;
  gap: 4px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}

.contact-meta dt {
  font-size: 13px;
  color: var(--text-3);
}

.contact-meta dd {
  font-size: 16px;
  font-weight: 400;
  color: var(--text);
}

.contact-meta a {
  color: inherit;
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-meta a:hover {
  color: var(--accent);
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

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1100px) {
  .services-panel {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .use-cases-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 960px) {
  .section-head--split {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .section-head--split .section-lead {
    justify-self: start;
    margin-top: 24px;
  }

  .solution-grid,
  .contact-panel {
    grid-template-columns: 1fr;
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }
}

/* Laptops bajas: compactar "Cómo funciona" para que entre en un viewport */
@media (min-width: 769px) and (max-height: 780px) {
  .flow-head .section-lead {
    display: none;
  }
}

@media (max-width: 768px) {
  .landing {
    min-height: var(--app-height, 100svh);
    --gutter: 24px;
    --header-h: 64px;
  }

  /* Hero (original) */
  .hero {
    padding-top: 100px;
    min-height: var(--app-height, 100svh);
    align-items: flex-start;
    padding-bottom: 100px;
  }

  .hero-content {
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: calc(var(--app-height, 100svh) - 200px);
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

  .announcement-button {
    font-size: 10px;
    padding: 12px 20px;
    align-self: flex-start;
  }

  .scroll-indicator {
    bottom: 24px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 32px;
    height: 32px;
    animation-name: bounce-centered;
  }

  .scroll-indicator:hover {
    transform: translateX(-50%) translateY(4px);
  }

  .scroll-indicator svg {
    width: 24px;
    height: 24px;
  }

  .light-container {
    width: 100vw;
    right: -20%;
    height: calc(var(--app-height, 100svh) * 1.4);
  }

  /* Secciones */
  .section {
    padding: 96px 0;
  }

  .section-head {
    margin-bottom: 48px;
  }

  .section-title {
    font-size: clamp(30px, 8.6vw, 40px);
  }

  .section-lead {
    margin-top: 18px;
    font-size: 15.5px;
  }

  .desktop-services,
  .desktop-use-cases {
    display: none;
  }

  .mobile-services-carousel,
  .mobile-use-cases-accordion {
    display: flex;
  }

  .solution-showcase {
    margin: 0 -12px;
  }

  .device {
    border-radius: 10px;
  }

  .device-caption {
    margin-top: 18px;
    font-size: 13px;
  }

  .solution-grid {
    margin-top: 72px;
    gap: 56px;
  }

  .block-title {
    font-size: 20px;
  }

  .solution-copy p {
    font-size: 15.5px;
  }

  .capability {
    font-size: 15px;
  }

  /* Cómo funciona: órbita arriba y paso activo debajo */
  .flow-track {
    height: calc(100svh + var(--steps) * 55svh);
  }

  .flow-sticky {
    height: 100svh;
    align-items: stretch;
  }

  .flow-beam {
    width: 100%;
    background: radial-gradient(ellipse 80% 40% at 50% 45%, rgba(175, 227, 232, 0.12), transparent 70%);
  }

  .flow-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'head'
      'visual'
      'detail';
    grid-template-rows: auto auto 1fr;
    row-gap: 16px;
    padding-top: calc(var(--header-h) + 28px);
    padding-bottom: 24px;
  }

  .flow-head .section-lead {
    display: none;
  }

  .flow-visual {
    width: min(100%, 44svh);
  }

  /* En mobile solo se ve la etiqueta del paso activo: las seis juntas no entran */
  .ring-label {
    font-size: 26px;
    stroke-width: 8px;
    opacity: 0;
    transition: opacity 0.4s ease, fill 0.4s ease;
  }

  .ring-label.is-current {
    opacity: 1;
  }

  .flow-detail {
    align-content: start;
  }

  .flow-step-title {
    font-size: 26px;
  }

  .flow-step-desc {
    margin-top: 12px;
    font-size: 15.5px;
  }

  /* Contacto */
  .contact-panel {
    padding: 40px 24px;
    gap: 40px;
  }

  .contact-title {
    font-size: clamp(42px, 12vw, 56px);
  }

  .contact-actions {
    flex-direction: column;
  }

  .contact-actions .btn {
    width: 100%;
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

@keyframes bounce-centered {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-progress-fill,
  .carousel-progress-fill,
  .service-tab.is-active .tab-progress-fill {
    animation: none;
  }

  .service-detail,
  .service-detail.is-active,
  .carousel-slide,
  .carousel-slide.is-active,
  .flow-step,
  .flow-step.is-active {
    transition: none;
    transform: none;
  }

  .accordion-content[data-state='open'],
  .accordion-content[data-state='closed'] {
    animation: none;
  }
}
</style>
