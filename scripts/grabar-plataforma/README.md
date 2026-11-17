# Grabar la plataforma como video

Todo lo que la landing muestra de la plataforma son videos grabados de la misma app: la grilla, «Cómo funciona», «A tu medida» y el hero. Antes eran copias en vivo, un iframe con la app por cada caja. Así la página no carga ninguna app y el scroll no se traba.

Los guiones que manejan la app siguen en el repo, porque con ellos se graba:
- `platformPieces.js`: la grilla;
- `howPieces.js`: «Cómo funciona»;
- `platformFit.js`: «A tu medida»;
- `platformTour.js`: el hero.

Todos usan `platformDriver.js`.

## Cómo se regenera

1. Compilá la demo de la plataforma desde el repo `iot` con `scripts/plataforma-demo/build.sh` (ver su README).
2. Levantá el dev server de la landing: `npx vite --port 4813`.
3. Grabá:

```bash
node scripts/grabar-plataforma/grabar.mjs --pieza mediciones       # una pieza, escritorio y celular
node scripts/grabar-plataforma/grabar.mjs --todas                  # todas (incluye el paso 1 de Blender)
node scripts/grabar-plataforma/grabar.mjs --manifiesto             # rehace platformVideos.json sin grabar
```

Opciones:

| Opción | Qué hace |
|---|---|
| `--version escritorio\|celular\|ambas` | Qué versión grabar. Por defecto, `ambas`. |
| `--url` | Dónde está el dev server. Por defecto, `http://localhost:4813`. |
| `--datos vivos\|quietos` | Por defecto `vivos`: los datos corren y, cuando el video vuelve a empezar, saltan (es una muestra de la app). `quietos` los congela desde la vuelta 1. |
| `--sin-codificar` | Solo graba los cuadros. |
| `--cuadros <carpeta>` | Dónde guardar los PNG. Por defecto, en la carpeta temporal del sistema. |
| `--reusar` | Codifica los PNG que ya están en `--cuadros`, sin volver a grabar. Sirve para probar otra calidad. |

Hace falta:
- Google Chrome instalado (se usa con `channel: 'chrome'`);
- ffmpeg con libsvtav1, libx265, libx264 y libvmaf.

Los pósters los codifica en WebP el mismo Chrome.

## Qué sale

En `public/media/plataforma/`, por cada pieza (las de celular, con `-celular`):

| Archivo | Formato | Para |
|---|---|---|
| `<pieza>.av1.mp4` | AV1 10 bits (yuv420p10le) | Chrome, Firefox, Edge |
| `<pieza>.hevc.mp4` | HEVC Main10, tag `hvc1` | Safari en Mac, iPhone y iPad |
| `<pieza>.h264.mp4` | H.264 8 bits | Último respaldo |
| `<pieza>-poster.webp` | El primer cuadro | Imagen de abajo del video: nunca se ve negro |

Además:
- **`src/components/platformVideos.json`:** lo que lee la landing (`PlatformVideo.vue`). Por cada pieza y versión trae:
  - el tamaño;
  - la duración;
  - `v`, que cambia con cada grabación y va en la URL como `?v=`, así nginx les da caché de un año;
  - el `codecs` exacto de cada archivo, para que el navegador elija uno que pueda reproducir;
  - las marcas: en «A tu medida», qué equipo muestra el selector en cada momento, para la pestaña de arriba.
- **`scripts/grabar-plataforma/grabacion.json`:** el detalle de cada grabación, con el peso y la calidad medida contra los cuadros originales (SSIM, PSNR y VMAF). El objetivo es VMAF ≥ 97 o SSIM ≥ 0,995. No se publica.

Los videos no van dentro de la imagen de Docker: el deploy los sube aparte con rsync (solo los que cambiaron) y el contenedor los monta (ver `.github/workflows/deploy.yml`). La demo, `public/plataforma`, tampoco se publica.

## Cómo graba

- `grabar.html` monta una sola pieza al tamaño exacto de su caja (`PIEZAS` en `grabar.mjs`), sobre negro.
  - **En escritorio**, el tamaño más grande que alcanza la caja, así el video nunca se estira. **En el celular**, el de una pantalla de 390, que a DPR 3 cubre también las de 430.
  - **El hero** es la pantalla de `PlatformStage.vue` sin el marco: el marco y su luz quedan en la landing. Entre vueltas no hay fundido: del final de Argus al login es un corte seco.
  - **El reporte de Argus** se graba con su tarjeta, con el borde y el degradé.
  - **La grilla** se graba con el fundido de los bordes.
  - El parámetro `pantalla` simula el ancho de la pantalla, porque algunas piezas eligen su diseño según `window.innerWidth`.
  - No entra al build: `vite build` solo compila `index.html`.
- **Nada es en tiempo real.**
  - El reloj de Playwright está pausado y el grabador lo adelanta 1/60 s por cuadro. Ese reloj mueve los timers, `requestAnimationFrame`, `Date` y `performance.now`, en la página y en el iframe de la app: GSAP (la cámara) y ECharts van con él.
  - Las animaciones y transiciones CSS no las mueve ese reloj, así que en cada cuadro se pausan y se ponen en el mismo instante.
  - Después sale la captura, en PNG sin pérdida.
- **Escritorio a DPR 2, celular a DPR 3,** como un iPhone. 60 fps.

## El loop

- El guion avisa cuándo empieza cada vuelta (`window.__loopMark` en `platformDriver.js`). Se graba exactamente una vuelta, de la 2 a la 3, porque la 1 arranca ya encuadrada y no empalma.
- **El `loop` nativo del navegador,** al volver a empezar, muestra el último cuadro 1 o 2 cuadros más. Como las vueltas terminan en una pausa, no se nota.

## Secuencias ya renderizadas

`SECUENCIAS` toma cuadros que no salen de la plataforma: el render de Blender del paso 1 (`conectar`), que viene del repo de contenido. La variable `SEIM_CONTENIDO_REPO` cambia dónde está ese repo.
- El render: `promo/iot-idioma-blender/plc.py --shot hub --web --fps 60 --frames 252 --dark`. Es un loop de 4,2 s en 16:9, con su piso y su negro dentro del cuadro. La cámara frena suave y el video vuelve a la toma abierta.
- Se arma una versión por tamaño (escritorio y celular) y se codifica igual que el resto.
