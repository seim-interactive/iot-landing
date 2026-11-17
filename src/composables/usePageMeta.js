// Title, descripción, canonical, Open Graph y datos estructurados de una página por
// tema (src/content/temas.js). Se escriben en el <head> apenas se arma la página, así
// el prerender (scripts/prerender.mjs) los guarda en el HTML de cada ruta.
//
// Los datos estructurados son los de lo que se ve: la página, su lugar en el sitio
// (BreadcrumbList) y sus preguntas frecuentes, iguales a las de la página (FAQPage).

const SITE = 'https://iot.seiminteractive.io'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

export function structuredData(tema) {
  const url = `${SITE}/${tema.slug}/`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: tema.title,
        description: tema.description,
        inLanguage: 'es-AR',
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': 'https://seiminteractive.io/#organization' },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Seim Interactive IoT', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: tema.nav, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: tema.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }
}

export function usePageMeta(tema) {
  if (typeof document === 'undefined' || !tema) return
  const url = `${SITE}/${tema.slug}/`
  document.title = tema.title
  document.documentElement.lang = 'es-AR'
  setMeta('name', 'description', tema.description)
  setMeta('property', 'og:title', tema.title)
  setMeta('property', 'og:description', tema.description)
  setMeta('property', 'og:url', url)
  setMeta('name', 'twitter:title', tema.title)
  setMeta('name', 'twitter:description', tema.description)
  setCanonical(url)

  // Los datos estructurados de la landing describen la landing: en esta página van los suyos
  for (const el of document.head.querySelectorAll('script[type="application/ld+json"]')) el.remove()
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.dataset.page = tema.slug
  script.textContent = JSON.stringify(structuredData(tema))
  document.head.appendChild(script)
}
