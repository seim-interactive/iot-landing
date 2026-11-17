// Motor de animaciones de la landing.
//
// Reglas que sostienen todo el archivo:
//  - Todo vive dentro de gsap.matchMedia: al cruzar un breakpoint o cambiar la
//    preferencia de movimiento, GSAP revierte lo creado y lo vuelve a armar, así que
//    nunca quedan estilos inline colgados de un layout anterior.
//  - El contenido es visible por defecto. Los estados iniciales los pone JS justo
//    antes de animar: si algo falla, nada queda oculto.
//  - Solo se animan transform y opacity (corren en el compositor, sin reflow).
//  - Los disparadores se recalculan cuando cambia el alto de la página (fuentes,
//    imágenes lazy, acordeones), para que cada animación arranque donde corresponde.
import { onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterNextPaint, isPrerendering } from './animationUtils'

gsap.registerPlugin(ScrollTrigger)

// En mobile, mostrar/ocultar la barra del navegador no debe recalcular todo.
ScrollTrigger.config({ ignoreMobileResize: true })

export const MEDIA = {
  desktop: '(min-width: 769px)',
  mobile: '(max-width: 768px)',
  reduce: '(prefers-reduced-motion: reduce)',
  motionOk: '(prefers-reduced-motion: no-preference)',
  finePointer: '(hover: hover) and (pointer: fine)',
}

const EASE = 'expo.out'

// Recalcula ScrollTrigger cuando el documento cambia de alto. Con debounce para no
// recalcular en cada frame mientras, por ejemplo, se abre un acordeón.
function watchLayout(root) {
  let timer = 0
  const refresh = () => {
    clearTimeout(timer)
    timer = setTimeout(() => ScrollTrigger.refresh(), 120)
  }

  const observer = new ResizeObserver(refresh)
  observer.observe(root)
  document.fonts?.ready.then(refresh)
  window.addEventListener('load', refresh, { once: true })

  return () => {
    clearTimeout(timer)
    observer.disconnect()
    window.removeEventListener('load', refresh)
  }
}

// La entrada del hero (header, botón y plataforma) es CSS: ver Landing.vue y Navbar.vue.
// Antes la hacía GSAP acá, y al cargar ocultaba el hero que ya venía prerenderizado
// para volver a mostrarlo: parpadeaba y atrasaba el LCP.

function heroParallax(q) {
  const hero = q('.hero')[0]
  if (!hero) return

  gsap.to(q('.hero-content'), {
    y: 40,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: '+=420', scrub: 0.2 },
  })
}

// [data-reveal]: el elemento entra al hacer scroll. Los que entran juntos en el
// viewport se escalonan entre sí (ScrollTrigger.batch).
//
// La entrada se repite: cuando el elemento vuelve a quedar por debajo del viewport
// (scrolleando hacia arriba) se resetea sin que se vea, y al bajar de nuevo anima otra vez.
function reveals(q) {
  const items = q('[data-reveal]')
  if (!items.length) return

  const hidden = { autoAlpha: 0, y: 36 }
  // Lo que ya está en pantalla cuando arranca el JS (por ejemplo, al recargar a mitad
  // de página) no se apaga: ya se vio. Entra con la animación la próxima vez.
  const inView = (el) => el.getBoundingClientRect().top < window.innerHeight
  gsap.set(items.filter((el) => !inView(el)), hidden)

  ScrollTrigger.batch(items, {
    start: 'top 90%',
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: EASE,
        stagger: 0.08,
        overwrite: true,
      }),
  })

  items.forEach((item) =>
    ScrollTrigger.create({
      trigger: item,
      start: 'top bottom',
      onLeaveBack: () => {
        gsap.killTweensOf(item)
        gsap.set(item, hidden)
      },
    })
  )
}

export function useLandingMotion(rootRef) {
  let mm
  let stopWatching = () => {}
  let cancelSetup = () => {}

  onMounted(() => {
    if (isPrerendering()) return

    cancelSetup = afterNextPaint(() => {
      const root = rootRef.value
      if (!root) return

      const q = gsap.utils.selector(root)
      stopWatching = watchLayout(root)
      mm = gsap.matchMedia(root)

      // Cada grupo depende solo de las condiciones que necesita: así, cruzar el
      // breakpoint no vuelve a reproducir la intro ni a ocultar lo ya revelado.
      // Con movimiento reducido no se registra nada y el contenido queda estático.
      mm.add(MEDIA.motionOk, () => {
        reveals(q)
      })

      mm.add(`${MEDIA.desktop} and ${MEDIA.motionOk}`, () => {
        heroParallax(q)
      })

      mm.add(MEDIA.finePointer, () => {
      })
    })
  })

  onUnmounted(() => {
    cancelSetup()
    stopWatching()
    mm?.revert()
  })
}
