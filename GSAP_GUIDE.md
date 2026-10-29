# Animaciones de la landing

Todo el movimiento de la landing sale de dos composables:

| Archivo | Qué hace |
|---|---|
| `src/composables/useLandingMotion.js` | Intro y parallax del hero (mismos valores que el diseño original), revelado al hacer scroll, inclinación de la captura de la plataforma y luz que sigue al mouse en los casos de uso. |
| `src/composables/useFlowScroll.js` | Sección "Cómo funciona": traduce el scroll en el recorrido del dato por la órbita y define el paso activo. |

El Navbar (`src/components/Navbar.vue`) maneja su propio fondo al scrollear y el resaltado de la sección activa. El avance automático de Servicios es una animación CSS: la barra de progreso de la pestaña activa es el temporizador.

## Reglas

1. **Todo dentro de `gsap.matchMedia`.** Al cruzar el breakpoint (768px) o cambiar la preferencia de movimiento, GSAP revierte lo creado y lo vuelve a armar. No quedan estilos inline colgados.
2. **El contenido es visible por defecto.** Los estados iniciales (opacidad 0, desplazamiento) los pone JS justo antes de animar. Si JS falla, nada queda oculto.
3. **Solo `transform` y `opacity`.** Nada de `filter: blur`, `letter-spacing`, `box-shadow` ni gradientes animados: causan tirones. Única excepción: el blur de entrada del título del hero, que se mantiene igual al diseño original (corre una sola vez al cargar).
4. **Precisión al scroll.** `useLandingMotion` recalcula ScrollTrigger cuando cambia el alto de la página (fuentes, imágenes lazy, acordeones), con debounce. Si agregás contenido que cambia de alto, no hace falta nada extra.
5. **`prefers-reduced-motion`.** Con movimiento reducido no se registran revelados ni parallax, y las transiciones CSS se desactivan. El mapa de "Cómo funciona" sigue al scroll sin suavizado.
6. **Prerender.** Con `window.__PRERENDER__` no se monta ninguna animación, así el HTML generado queda con todo visible.

## Cómo animar algo nuevo

Para que un elemento entre al hacer scroll, agregale el atributo `data-reveal`:

```html
<header class="section-head" data-reveal>...</header>
```

Los elementos que entran juntos en pantalla se escalonan solos (`ScrollTrigger.batch`).

Para algo más específico, agregá una función en `useLandingMotion.js` y registrala en el grupo de `mm.add` que corresponda:

- `MEDIA.motionOk`: en todos los tamaños, solo si el usuario no pidió reducir movimiento.
- `` `${MEDIA.desktop} and ${MEDIA.motionOk}` ``: solo en desktop.

Ojo con la sintaxis de objeto de `mm.add({ a, b }, fn)`: el callback corre si **alguna** condición se cumple. Incluí condiciones que cubran todos los casos (por ejemplo `isDesktop` + `isMobile`).

## "Cómo funciona"

- La altura de `.flow-track` define cuánto scroll dura el recorrido; `.flow-sticky` queda fijo mientras tanto.
- El gráfico es una órbita: un anillo por paso, de afuera (PLCs) hacia adentro (IA). Los radios están en `orbitRadii` (`Landing.vue`), en unidades del `viewBox` 640×640.
- El dato gira sobre el anillo del paso activo y entre pasos cambia de radio (espiral). Para cambiar el ritmo, ajustá `DWELL`, `SWEEP`, `EDGE` y `ARRIVAL` en `useFlowScroll.js`.
- `.landing` usa `overflow-x: clip` (no `hidden`): con `hidden`, `position: sticky` deja de funcionar.
