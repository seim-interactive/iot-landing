// "Cómo funciona": el scroll de la pista se traduce en el recorrido de un dato por
// la órbita. Cada paso es un anillo; el dato entra por el anillo exterior (la planta)
// y avanza en espiral hasta el núcleo (la inteligencia).
//
// Mientras un paso está activo el dato gira sobre su anillo (DWELL); entre pasos
// cambia de radio. La posición se suaviza con gsap.quickTo: fluido, pero siempre
// atado a la posición exacta del scroll.
import { onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterNextPaint, isPrerendering } from './animationUtils'
import { MEDIA } from './useLandingMotion'

gsap.registerPlugin(ScrollTrigger)

const DWELL = 0.22 // fracción de cada tramo en la que el dato queda sobre un anillo
const EDGE = 0.04 // margen de scroll al inicio y al final de la pista
const ARRIVAL = 0.85 // desde acá del tramo, el paso siguiente pasa a estar activo
const START_ANGLE = -90 // grados: el dato arranca arriba, junto a la etiqueta del anillo
const SWEEP = 230 // grados que gira el dato por cada paso
const TRAIL_GAP = 0.022 // separación (en pasos) entre los puntos de la estela

const easeTravel = gsap.parseEase('power2.inOut')

export function useFlowScroll(trackRef, { radii, center, activeStep }) {
  let mm
  let cancelSetup = () => {}
  let trigger = null
  const segments = radii.length - 1

  // s: posición continua en pasos (0 = primer anillo, segments = núcleo).
  const travel = (s) => {
    const i = Math.min(Math.floor(s), segments - 1)
    const local = gsap.utils.clamp(0, 1, (s - i - DWELL) / (1 - DWELL * 2))
    return { i, local }
  }

  const pointAt = (s) => {
    const { i, local } = travel(s)
    const radius = radii[i] + (radii[i + 1] - radii[i]) * easeTravel(local)
    const angle = ((START_ANGLE + s * SWEEP) * Math.PI) / 180
    return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)]
  }

  onMounted(() => {
    if (isPrerendering()) return

    cancelSetup = afterNextPaint(() => {
      const track = trackRef.value
      // Sin overflow: clip el contenedor sticky no se fija; en ese caso la sección
      // queda como lista estática (ver estilos @supports).
      if (!track || !CSS.supports('overflow', 'clip')) return

      mm = gsap.matchMedia(track)

      // Con la sintaxis de objeto el callback corre si ALGUNA condición se cumple:
      // motionOk + reduce cubren todos los casos.
      mm.add({ motionOk: MEDIA.motionOk, reduce: MEDIA.reduce }, (context) => {
        const { reduce } = context.conditions
        const particle = track.querySelector('[data-orbit-particle]')
        const core = track.querySelector('[data-orbit-core]')
        const trail = Array.from(track.querySelectorAll('[data-orbit-trail] circle'))
        if (!particle || !core) return

        const state = { p: 0 }

        const place = (el, s) => {
          const [x, y] = pointAt(s)
          el.setAttribute('cx', x.toFixed(2))
          el.setAttribute('cy', y.toFixed(2))
        }

        const render = () => {
          const s = segments * gsap.utils.clamp(0, 1, (state.p - EDGE) / (1 - EDGE * 2))
          const { i, local } = travel(s)

          place(particle, s)
          trail.forEach((dot, k) => {
            const t = s - (k + 1) * TRAIL_GAP
            dot.style.opacity = t < 0 ? '0' : String(0.55 * (1 - k / trail.length))
            if (t >= 0) place(dot, t)
          })

          // El núcleo se enciende a medida que el dato llega a la inteligencia.
          core.style.opacity = String(0.12 + 0.88 * gsap.utils.clamp(0, 1, s - (segments - 1)))

          const next = local >= ARRIVAL ? i + 1 : i
          if (activeStep.value !== next) activeStep.value = next
        }

        const follow = reduce
          ? (value) => {
              state.p = value
              render()
            }
          : gsap.quickTo(state, 'p', { duration: 0.6, ease: 'power3.out', onUpdate: render })

        trigger = ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => follow(self.progress),
          onRefresh: (self) => {
            state.p = self.progress
            render()
          },
        })

        state.p = trigger.progress
        render()

        return () => {
          trigger = null
          gsap.killTweensOf(state)
        }
      })
    })
  })

  onUnmounted(() => {
    cancelSetup()
    mm?.revert()
  })

  // Lleva el scroll al punto exacto en que el dato llega al anillo del paso `index`.
  const scrollToStep = (index) => {
    if (!trigger) return
    const p = EDGE + (index / segments) * (1 - EDGE * 2)
    const top = trigger.start + p * (trigger.end - trigger.start)
    const reduce = window.matchMedia(MEDIA.reduce).matches
    window.scrollTo({ top: Math.round(top), behavior: reduce ? 'auto' : 'smooth' })
  }

  return { scrollToStep }
}
