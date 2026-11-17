// Imagen para compartir (og:image y twitter:image): 1200 × 630, en public/og/og-es.png.
// Negro real, el isotipo arriba a la izquierda y el título en Inter, blanco y gris,
// alineado a la izquierda. Sin efectos. Se dibuja con Chrome desde un HTML.
//
//   node scripts/og-image.mjs
//
// Hace falta Google Chrome instalado (playwright-core lo usa con channel: 'chrome').
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/og/og-es.png')
const font = (await readFile(resolve(root, 'src/assets/fonts/inter-latin-300-600.woff2'))).toString('base64')

const html = `<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Inter';
    font-weight: 300 600;
    src: url(data:font/woff2;base64,${font}) format('woff2');
  }
  html, body { margin: 0; }
  body {
    width: 1200px;
    height: 630px;
    box-sizing: border-box;
    padding: 84px 96px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #000;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  svg { display: block; width: 108px; height: auto; }
  h1 {
    margin: 0;
    font-size: 80px;
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.035em;
    color: #fff;
  }
  h1 span { color: rgba(255, 255, 255, 0.45); }
</style>
</head>
<body>
  <svg viewBox="0 0 2014 868" aria-hidden="true">
    <path fill="#fff" d="M0 0 842 395v78L0 868V749l673-315L0 118Z"/>
    <path fill="#fff" d="M2014 0 1172 395v78l842 395V749L1341 434l673-316Z"/>
  </svg>
  <h1>Monitoreo de producción<br><span>con IoT industrial.</span></h1>
</body>
</html>`

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
// Que la fuente sea Inter y no la de reemplazo
const ok = await page.evaluate(() => document.fonts.check('400 80px Inter'))
if (!ok) throw new Error('Inter no cargó')
await page.screenshot({ path: out, type: 'png' })
await browser.close()
console.log(`[og] ${out}`)
