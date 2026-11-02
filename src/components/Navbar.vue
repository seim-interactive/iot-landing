<template>
  <header class="header" :class="{ 'is-scrolled': scrolled, 'is-open': menuOpen }">
    <div class="header-inner">
      <a href="#top" class="logo" aria-label="Seim Interactive, ir al inicio" @click="closeMenu">
        <img src="../assets/MARCA-14.png" alt="Seim Interactive" class="logo-img" />
      </a>

      <nav class="nav" aria-label="Secciones">
        <a
          v-for="item in menuItems"
          :key="item.id"
          :href="`#${item.id}`"
          class="nav-link"
          :class="{ 'is-active': activeId === item.id }"
          :aria-current="activeId === item.id ? 'location' : undefined"
        >
          {{ item.label }}
        </a>
      </nav>

      <a href="#contact" class="cta-button desktop-only">
        Hablemos
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>

      <button
        class="menu-toggle"
        type="button"
        :class="{ active: menuOpen }"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="toggleMenu"
      >
        <span class="menu-line"></span>
        <span class="menu-line"></span>
      </button>
    </div>

    <Transition name="menu-fade">
      <div v-if="menuOpen" id="mobile-menu" class="mobile-menu">
        <div class="menu-content">
          <nav class="mobile-nav" aria-label="Secciones">
            <a
              v-for="(item, index) in menuItems"
              :key="item.id"
              :href="`#${item.id}`"
              class="mobile-nav-link"
              :style="{ animationDelay: `${80 + index * 55}ms` }"
              @click="closeMenu"
            >
              <span class="nav-text">{{ item.label }}</span>
              <span class="nav-arrow" aria-hidden="true">
                <i class="pi pi-arrow-right"></i>
              </span>
            </a>
          </nav>

          <div class="menu-footer">
            <div class="menu-contact">
              <a href="https://wa.me/5493413551507" target="_blank" rel="noopener" class="menu-contact-link" aria-label="WhatsApp">
                <i class="pi pi-whatsapp"></i>
              </a>
              <a href="mailto:hello@seiminteractive.io" class="menu-contact-link" aria-label="Email">
                <i class="pi pi-envelope"></i>
              </a>
            </div>
            <span class="menu-copyright">© 2026 Seim Interactive</span>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterNextPaint, isPrerendering } from '../composables/animationUtils'

gsap.registerPlugin(ScrollTrigger)

const menuItems = [
  { id: 'solution', label: 'Solución' },
  { id: 'use-cases', label: 'Casos de uso' },
  { id: 'technology', label: 'Cómo funciona' },
  { id: 'services', label: 'Servicios' },
  { id: 'contact', label: 'Contacto' },
]

const menuOpen = ref(false)
const scrolled = ref(false)
const activeId = ref(null)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

const onKeydown = (event) => {
  if (event.key === 'Escape') closeMenu()
}

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

let context
let cancelSetup = () => {}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (isPrerendering()) return

  cancelSetup = afterNextPaint(() => {
    context = gsap.context(() => {
      // Fondo del header apenas se scrollea. Se decide por la posición (y no por
      // isActive) para que siga activo también en el último píxel de la página.
      const updateScrolled = (self) => {
        scrolled.value = self.scroll() > 8
      }
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: updateScrolled,
        onRefresh: updateScrolled,
      })

      // Sección activa: la que cruza la mitad del viewport.
      menuItems.forEach(({ id }) => {
        const section = document.getElementById(id)
        if (!section) return

        ScrollTrigger.create({
          trigger: section,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (self.isActive) activeId.value = id
            else if (activeId.value === id) activeId.value = null
          },
        })
      })
    })
  })
})

onUnmounted(() => {
  cancelSetup()
  context?.revert()
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  height: var(--header-h, 72px);
}

/* El blur va en un pseudo-elemento: si estuviera en .header, el menú mobile
   (position: fixed) quedaría contenido dentro del header. */
.header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  opacity: 0;
  transition: opacity 0.45s var(--ease-out, ease);
  pointer-events: none;
}

.header.is-scrolled::before {
  opacity: 1;
}

.header-inner {
  position: relative;
  z-index: 101;
  height: 100%;
  padding: 0 var(--gutter, 60px);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-self: start;
}

.logo-img {
  height: 24px;
  width: auto;
  display: block;
  opacity: 0.95;
}

.nav {
  display: flex;
  align-items: center;
  gap: 36px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.nav-link:hover,
.nav-link.is-active {
  color: #fff;
}

.cta-button {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  background: #fff;
  color: #000;
  font-size: 13px;
  font-weight: 400;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.3s ease;
}

.cta-button svg {
  transition: transform 0.35s var(--ease-out, ease);
}

.cta-button:hover {
  background: var(--accent, #afe3e8);
}

.cta-button:hover svg {
  transform: translateX(3px);
}

.nav-link:focus-visible,
.cta-button:focus-visible,
.logo:focus-visible,
.menu-toggle:focus-visible,
.mobile-nav-link:focus-visible,
.menu-contact-link:focus-visible {
  outline: 2px solid var(--accent, #afe3e8);
  outline-offset: 3px;
}

/* Menú mobile */
.menu-toggle {
  display: none;
  justify-self: end;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  width: 40px;
  height: 40px;
  margin-right: -8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
}

.menu-line {
  width: 22px;
  height: 1.5px;
  background: rgba(255, 255, 255, 0.9);
  transition: transform 0.35s var(--ease-out, ease);
}

.menu-toggle.active .menu-line:first-child {
  transform: translateY(3.75px) rotate(45deg);
}

.menu-toggle.active .menu-line:last-child {
  transform: translateY(-3.75px) rotate(-45deg);
}

.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: #000;
  display: flex;
  flex-direction: column;
}

.mobile-menu::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 90% 60% at 100% 0%, rgba(175, 227, 232, 0.12), transparent 60%);
  pointer-events: none;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.35s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}

.menu-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 96px 28px 120px;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  text-decoration: none;
  opacity: 0;
  transform: translateY(12px);
  animation: menu-item-in 0.6s var(--ease-out, ease) forwards;
}

.mobile-nav-link:first-child {
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

@keyframes menu-item-in {
  to {
    opacity: 1;
    transform: none;
  }
}

.nav-text {
  flex: 1;
  font-size: 26px;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.9);
}

.nav-arrow {
  font-size: 12px;
  color: rgba(175, 227, 232, 0.6);
}

.menu-footer {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-contact {
  display: flex;
  gap: 8px;
}

.menu-contact-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
}

.menu-copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 1100px) {
  .nav {
    gap: 24px;
  }

  .nav-link {
    font-size: 13px;
  }
}

@media (max-width: 900px) {
  .header-inner {
    grid-template-columns: 1fr auto;
  }

  .nav,
  .desktop-only {
    display: none;
  }

  .menu-toggle {
    display: flex;
  }

  .logo-img {
    height: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-link {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
