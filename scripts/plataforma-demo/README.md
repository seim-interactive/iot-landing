# La plataforma dentro de la landing

Lo que se ve en el marco de la landing es la plataforma real (el frontend del repo `iot`), compilada sin backend y con datos de ejemplo. No es una recreación: el header, la barra lateral, el login y los widgets son los de la app.

## Cómo está armado

| Pieza | Dónde | Qué hace |
|---|---|---|
| La app compilada | `public/plataforma/` | Se genera con `build.sh` y se sube al repo, porque el deploy no tiene acceso al repo `iot`. `VERSION` dice de qué commit salió. |
| El marco | `src/components/PlatformStage.vue` | Carga la app en un iframe del mismo origen, del tamaño de una pantalla real (1440 × 900, o 390 × 780 en celular), y lo escala. Pone la luz y el borde. |
| El recorrido | `src/components/platformTour.js` | Usa la app con clics y tipeo de verdad: login, Mediciones, Activos, Acciones, IA y una pregunta a Argus. |
| El kit | `scripts/plataforma-demo/kit/` | Lo único que no es de la plataforma (ver abajo). |

El kit reemplaza tres cosas desde afuera, sin modificar ningún archivo de `iot/frontend/src`:

- **Firebase** (`firebase-app.ts`, `firebase-auth.ts`): una sesión simulada. El login acepta cualquier mail y contraseña.
- **La red** (`network.ts`): la API, el streaming del chat y el WebSocket responden con `handlers.mjs`.
- **El fondo** (`overrides.css`): transparente, para que se vea la luz de la landing. Los componentes no se tocan.

`handlers.mjs` tiene todos los datos: «Planta Demo», con Envasadora 1, Envasadora 2, Llenadora y Horno. Salen de un solo modelo de paradas, así que los números coinciden entre pantallas, y son relativos a la hora actual.

Cada equipo tiene su propio tablero de Mediciones, con las variables de ese tipo de máquina (el Horno, temperatura por zona y gas; la Llenadora, presión de llenado y nivel de tanque). La sección «A tu medida» de la landing depende de que sean distintos.

Lo que se hace en la sesión (reconocer o resolver una alarma, ponerle motivo a una parada) se guarda en memoria y se pierde al recargar. `window.__demoReset()` lo borra sin recargar; la pestaña Paradas recién lo refleja cuando vuelve a pedir los datos.

## Actualizar la demo cuando cambia la plataforma

```bash
scripts/plataforma-demo/build.sh            # usa ../iot
scripts/plataforma-demo/build.sh /ruta/al/repo/iot
```

Después corré `npm run dev`, mirá el recorrido entero en escritorio y en celular, y subí `public/plataforma/`.

Si la plataforma suma un pedido a la API que `handlers.mjs` no conoce, la consola del navegador avisa `[demo] sin datos de ejemplo: …`. Si cambia un selector que usa el recorrido, la consola avisa `[plataforma] …` y el recorrido vuelve a empezar.

## Problema ya resuelto

El tablero tiene que llegar después de la primera telemetría. Si un gauge nace sin valor y el valor llega después, ECharts falla y la pantalla muestra «Algo salió mal». Por eso `responseDelayMs()` demora 750 ms el pedido del tablero y el WebSocket emite cada 500 ms.
