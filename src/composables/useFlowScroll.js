// "Cómo funciona": el scroll de la pista se traduce en el recorrido de un dato por
// los módulos de la arquitectura, de la planta (PLCs) a la inteligencia (IA).
//
// Mientras un paso está activo el dato queda en su módulo (DWELL); entre pasos
// viaja al siguiente. onRender recibe la posición continua (0 = primer paso). La posición se suaviza con gsap.quickTo: fluido, pero siempre
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

const easeTravel = gsap.parseEase('power2.inOut')

export function useFlowScroll(trackRef, { steps, activeStep, onRender }) {
  let mm
  let cancelSetup = () => {}
  let trigger = null
  const segments = steps - 1

  // s: posición continua en pasos (0 = primer anillo, segments = núcleo).
  const travel = (s) => {
    const i = Math.min(Math.floor(s), segments - 1)
    const local = gsap.utils.clamp(0, 1, (s - i - DWELL) / (1 - DWELL * 2))
    return { i, local }
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
        const state = { p: 0 }

        const render = () => {
          const s = segments * gsap.utils.clamp(0, 1, (state.p - EDGE) / (1 - EDGE * 2))
          const { i, local } = travel(s)

          onRender(i + easeTravel(local))

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
