// Preguntas frecuentes de la landing. Es la única fuente del texto: la sección visible
// (FaqSection.vue) y el JSON-LD FAQPage del head (jsonLd.js) salen de acá, así nunca
// dicen cosas distintas. Las respuestas solo usan lo que ya dice la landing.
export const FAQ = [
  {
    q: '¿Qué máquinas se pueden conectar?',
    a: 'Las que ya tenés, sin importar la marca ni la edad del equipo. Nos conectamos a lo que hay en tu planta. Y en la parte de automatización trabajamos junto a SAI Sistemas, con más de 20 años en PLCs, SCADA y redes industriales.',
  },
  {
    q: '¿Hay que parar la planta para conectarlas?',
    a: 'No. Vamos a tu planta, relevamos los equipos y los conectamos sin frenar la producción. Los datos empiezan a salir sin tocar cómo trabaja la línea.',
  },
  {
    q: '¿Dónde quedan los datos?',
    a: 'En un entorno privado, solo para tu empresa, sin compartirlo con otras. Los datos salen cifrados de tus máquinas y los ves en vivo desde la compu de la planta, una tablet o tu celular.',
  },
  {
    q: '¿La plataforma se adapta a mi proceso?',
    a: 'Sí. Armamos los tableros con tu equipo, uno para cada máquina y para cada rol, y desarrollamos lo que tu proceso necesite. Y crece sin límite de equipos, líneas ni plantas.',
  },
  {
    q: '¿Trabajan en toda Argentina?',
    a: 'Sí, en todo el país, en planta y remoto. Después del arranque seguimos con vos: operamos la plataforma y armamos juntos la hoja de ruta.',
  },
]
