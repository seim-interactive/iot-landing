import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import { extname, join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf'
}

function startStaticServer(root) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      let filePath = join(root, decodeURIComponent(url.pathname))
      if (filePath.endsWith('/')) filePath = join(filePath, 'index.html')
      let data
      try {
        data = await readFile(filePath)
      } catch {
        data = await readFile(join(root, 'index.html'))
        filePath = join(root, 'index.html')
      }
      res.setHeader('Content-Type', MIME[extname(filePath)] || 'application/octet-stream')
      res.end(data)
    } catch (err) {
      res.statusCode = 500
      res.end(String(err))
    }
  })
  return new Promise((resolveListen) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      resolveListen({ server, port })
    })
  })
}

// Lo que tiene que quedar en el HTML exactamente una vez, como está escrito en index.html.
const ONCE = [
  'googletagmanager.com/gtm.js?id=GTM-MR942JM7',
  "gtag('js', new Date());",
  "'send_to': 'AW-18565933587/",
]
// Lo que nunca puede quedar grabado: hits de terceros con random y timestamp fijos, iframes.
const NEVER = ['doubleclick.net', 'google-analytics.com/g/collect', 'facebook.net', 'facebook.com/tr', '<iframe']

function count(haystack, needle) {
  return haystack.split(needle).length - 1
}

async function main() {
  console.log('[prerender] starting…')
  // El index.html que armó Vite, antes del prerender: es la referencia de qué scripts van.
  const template = await readFile(join(distDir, 'index.html'), 'utf8')
  const { server, port } = await startStaticServer(distDir)
  console.log(`[prerender] static server on http://127.0.0.1:${port}`)

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // Flag for composables to skip GSAP setup
  await page.evaluateOnNewDocument(() => {
    window.__PRERENDER__ = true
  })

  // Durante el prerender solo se carga lo nuestro. GTM, Google Ads, Meta y cualquier otro
  // tercero quedan bloqueados: si corren acá, lo que inyectan (scripts, píxeles, iframes)
  // queda grabado en el HTML y se dispara en cada visita con los datos de este momento.
  const origin = `http://127.0.0.1:${port}`
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const url = req.url()
    if (url.startsWith(origin + '/') || url.startsWith('data:') || url.startsWith('blob:')) req.continue()
    else req.abort('blockedbyclient')
  })

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0', timeout: 30000 })

  // Wait until Vue has rendered actual content into #app
  await page.waitForFunction(
    () => {
      const app = document.querySelector('#app')
      return app && app.innerText && app.innerText.trim().length > 200
    },
    { timeout: 15000 }
  )

  // Snapshot the full document
  const html = await page.evaluate((templateHtml) => {
    // Strip any GSAP-injected inline styles defensively
    document.querySelectorAll('[style]').forEach((el) => {
      const s = el.getAttribute('style') || ''
      if (/opacity\s*:\s*0|visibility\s*:\s*hidden|transform\s*:\s*translate/i.test(s)) {
        el.removeAttribute('style')
      }
    })

    // Fuera lo que no está en el index.html original: scripts que agregó alguien en tiempo
    // de ejecución, iframes y recursos de otros dominios. Se quedan los CSS y modulepreload
    // propios que suma Vite al cargar la landing (sin ellos, el HTML se vería sin estilos).
    const original = new DOMParser().parseFromString(templateHtml, 'text/html')
    const scriptKey = (el) => (el.getAttribute('src') ? 'src:' + el.getAttribute('src') : 'inline:' + el.textContent.trim())
    const keepScripts = new Set([...original.querySelectorAll('script')].map(scriptKey))
    const keepLinks = new Set([...original.querySelectorAll('link[href]')].map((el) => el.getAttribute('href')))
    const ours = (url) => {
      try { return new URL(url, location.href).origin === location.origin } catch { return false }
    }

    document.querySelectorAll('script').forEach((el) => {
      if (!keepScripts.has(scriptKey(el))) el.remove()
    })
    document.querySelectorAll('iframe').forEach((el) => el.remove())
    document.querySelectorAll('link[href]').forEach((el) => {
      const href = el.getAttribute('href')
      if (!keepLinks.has(href) && !ours(href)) el.remove()
    })
    document.querySelectorAll('img[src], video[src], source[src], embed[src], object[data]').forEach((el) => {
      if (!ours(el.getAttribute('src') || el.getAttribute('data'))) el.remove()
    })

    return '<!DOCTYPE html>\n' + document.documentElement.outerHTML
  }, template)

  await browser.close()
  server.close()

  // Si algo se coló, que falle el build y no se publique.
  const problems = [
    ...ONCE.filter((needle) => count(html, needle) !== 1).map((needle) => `«${needle}» aparece ${count(html, needle)} veces (tiene que ser 1)`),
    ...NEVER.filter((needle) => html.includes(needle)).map((needle) => `quedó grabado «${needle}»`),
  ]
  if (problems.length) throw new Error('el HTML prerenderizado no está limpio:\n  ' + problems.join('\n  '))

  const outFile = join(distDir, 'index.html')
  await writeFile(outFile, html, 'utf8')
  console.log(`[prerender] wrote ${outFile} (${(html.length / 1024).toFixed(1)} KB)`)
}

main().catch((err) => {
  console.error('[prerender] failed:', err)
  process.exit(1)
})
