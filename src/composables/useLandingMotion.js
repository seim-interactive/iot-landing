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

// Intro del hero: mismos valores que el diseño original.
function heroIntro(q) {
  const tl = gsap.timeline()

  // El header solo cambia de opacidad: un transform en él rompería el menú mobile
  // (que es position: fixed dentro del header).
  tl.from(q('.header'), { autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, 0)
    .fromTo(q('.hero-kicker'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0)
    .fromTo(
      q('.hero-title'),
      { opacity: 0, y: 40, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' },
      0.15
    )
    .fromTo(q('.announcement-button'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }, 0.35)
    .fromTo(q('.scroll-indicator'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.5)' }, 0.5)

  return tl
}

function heroIndicatorGlow(q) {
  gsap.to(q('.scroll-indicator svg'), {
    filter: 'drop-shadow(0 0 12px rgba(175, 227, 232, 0.5))',
    duration: 1,
    delay: 1.1,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  })
}

function heroParallax(q) {
  const hero = q('.hero')[0]
  if (!hero) return

  gsap.to(q('.hero-content'), {
    y: 80,
    opacity: 0.82,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.2 },
  })

  gsap.to(q('.light-container'), {
    opacity: 0.12,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'center top', scrub: 0.2 },
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
  gsap.set(items, hidden)

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

// Comparación enlatadas / nuestra plataforma: el scroll mueve --p de cada fila y el
// CSS deriva de ahí el tachado, el conector y el enfoque. Al estar atado al scroll
// se reproduce en los dos sentidos.
function contrastScrub(q) {
  q('.contrast-row').forEach((row) => {
    gsap.fromTo(
      row,
      { '--p': 0 },
      {
        '--p': 1,
        ease: 'none',
        // Arranca con la fila ya bien dentro de la pantalla, para que el tachado se vea
        scrollTrigger: { trigger: row, start: 'top 72%', end: 'top 34%', scrub: 0.8 },
      }
    )
  })
}

// Capacidades: cada renglón pasa de apagado a encendido mientras cruza la pantalla.
function capabilityScrub(q) {
  q('.capability').forEach((item) => {
    gsap.fromTo(
      item,
      { '--c': 0 },
      {
        '--c': 1,
        ease: 'none',
        scrollTrigger: { trigger: item, start: 'top 80%', end: 'top 55%', scrub: 0.6 },
      }
    )
  })
}

// La captura de la plataforma "se apoya" sobre la página mientras entra.
function deviceTilt(q) {
  const device = q('.device')[0]
  if (!device) return

  gsap.fromTo(
    device,
    { rotateX: 16, y: 60, scale: 0.94, transformOrigin: '50% 0%' },
    {
      rotateX: 0,
      y: 0,
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: device, start: 'top 98%', end: 'top 30%', scrub: 0.3 },
    }
  )
}

// Luz que sigue al puntero sobre las cards de casos de uso.
function spotlight(q) {
  const grid = q('.use-cases-grid')[0]
  if (!grid) return () => {}

  const onMove = (event) => {
    const card = event.target.closest('.use-case-card')
    if (!card) return
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    card.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }

  grid.addEventListener('pointermove', onMove, { passive: true })
  return () => grid.removeEventListener('pointermove', onMove)
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
        heroIntro(q)
        reveals(q)
        contrastScrub(q)
        capabilityScrub(q)
      })

      mm.add(`${MEDIA.desktop} and ${MEDIA.motionOk}`, () => {
        heroParallax(q)
        deviceTilt(q)
      })

      mm.add(MEDIA.finePointer, () => {
        heroIndicatorGlow(q)
        return spotlight(q)
      })
    })
  })

  onUnmounted(() => {
    cancelSetup()
    stopWatching()
    mm?.revert()
  })
}
