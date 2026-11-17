# Grabar la plataforma como video

Las piezas de la landing que muestran la plataforma se pasan de copias en vivo (un iframe con la app por cada cuadro) a videos grabados de la misma app. Así la página no carga varias apps a la vez y el scroll no se traba.

## Cómo se regenera

1. Compilá la demo de la plataforma desde el repo `iot` con `scripts/plataforma-demo/build.sh` (ver su README).
2. Levantá el dev server de la landing (`npx vite --port 4813`).
3. Grabá:

```bash
node scripts/grabar-plataforma/grabar.mjs --pieza mediciones       # una pieza, escritorio y celular
node scripts/grabar-plataforma/grabar.mjs --todas                  # todas
```

Opciones:

| Opción | Qué hace |
|---|---|
| `--version escritorio\|celular\|ambas` | Qué versión grabar. Por defecto, `ambas`. |
| `--url` | Dónde está el dev server. Por defecto, `http://localhost:4813`. |
| `--datos vivos` | No congela los datos (ver «El loop»). |
| `--sin-codificar` | Solo graba los cuadros. |
| `--cuadros <carpeta>` | Dónde guardar los PNG. Por defecto, en la carpeta temporal del sistema. |
| `--reusar` | Codifica los PNG que ya están en `--cuadros`, sin volver a grabar. Sirve para probar otra calidad. |

Hace falta Google Chrome instalado (se usa con `channel: 'chrome'`) y ffmpeg con libsvtav1, libx265, libx264 y libvmaf.

## Qué sale

En `public/media/plataforma/`, por cada pieza (las de celular, con `-celular`):

| Archivo | Formato | Para |
|---|---|---|
| `<pieza>.av1.mp4` | AV1 10 bits (yuv420p10le) | Chrome, Firefox, Edge |
| `<pieza>.hevc.mp4` | HEVC Main10, tag `hvc1` | Safari en Mac, iPhone y iPad |
| `<pieza>.h264.mp4` | H.264 8 bits | Último respaldo |
| `<pieza>-poster.jpg` | El primer cuadro | Portada mientras carga |

En el HTML, las fuentes van en ese orden: AV1, HEVC y H.264. Los 10 bits son para que los degradés oscuros de la interfaz no hagan bandas.

`grabacion.json` guarda, de cada archivo, el peso y la calidad medida contra los cuadros originales (SSIM, PSNR y VMAF). El objetivo es VMAF ≥ 97 o SSIM ≥ 0,995.

## Cómo graba

- `grabar.html` monta una sola pieza al tamaño exacto de su caja (`PIEZAS` en `grabar.mjs`), sobre negro.
  - El parámetro `pantalla` simula el ancho de la pantalla, porque algunas piezas eligen su diseño según `window.innerWidth`.
  - No entra al build: `vite build` solo compila `index.html`.
- **Nada es en tiempo real.**
  - El reloj de Playwright está pausado y el grabador lo adelanta 1/60 s por cuadro. Ese reloj mueve los timers, `requestAnimationFrame`, `Date` y `performance.now`, en la página y en el iframe de la app: GSAP (la cámara) y ECharts van con él.
  - Las animaciones y transiciones CSS no las mueve ese reloj, así que en cada cuadro se pausan y se ponen en el mismo instante.
  - Después sale la captura, en PNG sin pérdida.
- **Escritorio a DPR 2, celular a DPR 3,** como un iPhone. 60 fps.

## El loop

- El guion avisa cuándo empieza cada vuelta (`window.__loopMark` en `platformDriver.js`). Se graba exactamente una vuelta, de la 2 a la 3, porque la 1 arranca ya encuadrada y no empalma.
- **Con `--datos quietos` (por defecto), desde la vuelta 1 la app no recibe datos nuevos y su fecha queda fija.**
  - Las animaciones y la cámara siguen.
  - Lo que depende de la hora no se corre: la ventana de «8 h» de un gráfico, «hace 0 s».
  - Sin esto, los números y los gráficos saltan en la costura.
- **La costura se mide:** el salto del último cuadro al primero tiene que parecerse al de cualquier otro arranque de cámara de la vuelta.
- **El `loop` nativo de Chrome,** al volver a empezar, muestra el último cuadro 1 o 2 cuadros más y se saltea el cuadro 0. Como las vueltas terminan en una pausa, no se nota.

## Secuencias ya renderizadas

`SECUENCIAS` toma cuadros que no salen de la plataforma, por ejemplo el render de Blender del paso 1 (`conectar`, desde el repo de contenido; la variable `SEIM_CONTENIDO_REPO` cambia dónde está ese repo):
- se componen sobre negro;
- se encuadran;
- se arman con el movimiento, una pausa sobre el último cuadro y corte seco al primero;
- se codifican igual que el resto.

## Falta

- Sumar a `PIEZAS` las cajas de «Cómo funciona» (`HOW_PIECES`) cuando se cierren sus tamaños.
- El guion de «A tu medida» está dentro de `PlatformFit.vue` y el recorrido del hero en `platformTour.js` (con `PlatformStage`): para grabarlos, hay que exportarlos o montarlos en `grabar.html`.
