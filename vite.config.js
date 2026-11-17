import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { jsonLd } from './src/seo/jsonLd.js'

// Duración del video del hero en ISO 8601, si ya está grabado (platformVideos.json la anota)
function heroVideoDuration() {
  const file = path.resolve(__dirname, 'src/components/platformVideos.json')
  if (!existsSync(file)) return null
  const dur = JSON.parse(readFileSync(file, 'utf8'))?.hero?.escritorio?.dur
  return dur ? `PT${Math.round(dur)}S` : null
}

// El JSON-LD del head se arma con src/seo/jsonLd.js: el WebPage usa el title y la
// description de index.html, así nunca dicen cosas distintas.
function structuredData() {
  return {
    name: 'seim-structured-data',
    transformIndexHtml(html) {
      if (!html.includes('<!-- json-ld -->')) return html
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
      const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1]
      if (!title || !description) throw new Error('index.html necesita <title> y <meta name="description"> para el JSON-LD')
      const json = JSON.stringify(jsonLd({ title, description, videoDuration: heroVideoDuration() }), null, 2)
        // Que ningún texto pueda cerrar el <script>
        .replace(/</g, '\\u003c')
      return html.replace('<!-- json-ld -->', `<script type="application/ld+json">\n${json}\n  </script>`)
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), structuredData()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173
  }
})
