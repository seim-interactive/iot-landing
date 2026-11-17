// Datos estructurados de la landing: un solo @graph. El plugin de vite.config.js lo
// arma en el build y lo pone en el head de index.html, con el title y la description
// que ya tiene ese archivo. Solo datos que están en la landing: nada de dirección,
// coordenadas ni año de fundación.
import { FAQ } from './faq.js'
const SITE = 'https://iot.seiminteractive.io'
const ORG = `${SITE}/#organization`
const WEBSITE = `${SITE}/#website`
const WEBPAGE = `${SITE}/#webpage`
const ARGENTINA = { '@type': 'Country', name: 'Argentina' }

// El video del hero: la plataforma real grabada (PlatformVideo, name="hero").
// La duración sale de platformVideos.json (hero.escritorio.dur) cuando el video esté grabado.
export const HERO_VIDEO = {
  contentUrl: `${SITE}/media/plataforma/hero.h264.mp4`,
  thumbnailUrl: `${SITE}/media/plataforma/hero-poster.webp`,
  uploadDate: '2026-11-17',
  duration: 'PT1M',
}

export function jsonLd({ title, description, videoDuration }) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG,
        name: 'Seim Interactive IoT',
        url: `${SITE}/`,
        logo: { '@type': 'ImageObject', url: `${SITE}/og/isotipo.png`, width: 1024, height: 1024 },
        email: 'hello@seiminteractive.io',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'sales',
          email: 'hello@seiminteractive.io',
          telephone: '+5493413551507',
          availableLanguage: 'es',
          areaServed: ARGENTINA,
        },
        areaServed: ARGENTINA,
        parentOrganization: {
          '@type': 'Organization',
          '@id': 'https://seiminteractive.io/#organization',
          name: 'Seim Interactive',
          url: 'https://seiminteractive.io/',
          sameAs: ['https://www.linkedin.com/company/seim-interactive', 'https://www.instagram.com/seiminteractive'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE,
        url: `${SITE}/`,
        name: 'Seim Interactive IoT',
        inLanguage: 'es-AR',
        publisher: { '@id': ORG },
      },
      {
        // La landing es también la página de preguntas frecuentes: las de la sección visible
        '@type': ['WebPage', 'FAQPage'],
        '@id': WEBPAGE,
        url: `${SITE}/`,
        name: title,
        description,
        inLanguage: 'es-AR',
        isPartOf: { '@id': WEBSITE },
        about: { '@id': `${SITE}/#service` },
        primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/og/og-es.png`, width: 1200, height: 630 },
        video: { '@id': `${SITE}/#video-hero` },
        mainEntity: FAQ.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      {
        '@type': 'Service',
        '@id': `${SITE}/#service`,
        name: 'Monitoreo de producción con IoT industrial',
        serviceType: 'Monitoreo de producción',
        description:
          'Conectamos las máquinas que ya tenés, sin parar la planta, y ves la producción en vivo en una plataforma que se adapta a tu proceso.',
        url: `${SITE}/`,
        provider: { '@id': ORG },
        areaServed: ARGENTINA,
      },
      {
        '@type': 'VideoObject',
        '@id': `${SITE}/#video-hero`,
        name: 'Así se ve la plataforma de monitoreo de Seim Interactive',
        description:
          'La plataforma real, con datos de ejemplo: los equipos de la planta, sus mediciones en vivo y Argus, la IA que analiza los datos.',
        contentUrl: HERO_VIDEO.contentUrl,
        thumbnailUrl: HERO_VIDEO.thumbnailUrl,
        uploadDate: HERO_VIDEO.uploadDate,
        duration: videoDuration || HERO_VIDEO.duration,
        inLanguage: 'es-AR',
        isPartOf: { '@id': WEBPAGE },
      },
    ],
  }
}
