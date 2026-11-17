// Las páginas por tema de la landing (TopicPage.vue): cada una responde una búsqueda
// concreta con su propio contenido y reusa los videos de la plataforma.
//
// Todo lo que dicen sale de lo que ya afirma la landing (la grilla, «Cómo funciona»,
// «A tu medida», el partner y el contacto): no prometen nada nuevo ni suman cifras.
//
// `title`: el título de la pestaña y del resultado de Google. Va sin «| Seim Interactive»:
// Google ya muestra el nombre del sitio arriba de cada resultado, con el ícono.
// `video`: la clave del video en platformVideos.json. `link`: otra página por tema.

export const TEMAS = [
  {
    slug: 'monitoreo-de-produccion',
    nav: 'Monitoreo de producción',
    title: 'Monitoreo de producción en tiempo real',
    description:
      'Mirá en vivo qué produce cada equipo, a qué velocidad y cuánto consume, desde la compu, la tablet o el celular. Con tableros armados para tu proceso.',
    eyebrow: 'Monitoreo de producción',
    h1: 'Tu producción, en vivo y desde donde estés.',
    lede: 'Velocidad, temperatura, consumo y producción de cada equipo, en un tablero armado para tu proceso. Lo abrís desde la compu de la planta, una tablet o tu celular.',
    video: 'medida',
    sections: [
      {
        title: 'Cada equipo, con su tablero.',
        text: 'No es un tablero genérico: lo armamos con tu equipo, uno para cada máquina y para cada rol. Cambiás de equipo y ves lo suyo.',
        video: 'widget',
      },
      {
        title: 'Lo que pasa ahora, y lo que pasó antes.',
        text: 'Cada variable queda guardada con su historia. Ves cómo viene hoy y cuándo empezó a cambiar algo.',
        video: 'mediciones',
      },
      {
        title: 'Todos tus equipos, de un vistazo.',
        text: 'Qué está en marcha, qué está detenido y cuánto produjo cada uno hoy.',
        video: 'activos',
        link: 'paradas-y-alarmas',
      },
    ],
    faq: [
      {
        q: '¿Qué datos puedo ver?',
        a: 'Los que tus equipos ya miden: velocidad, temperatura, consumo, producción y lo que haga falta para tu proceso. Definimos juntos qué mirar en cada máquina.',
      },
      {
        q: '¿Tengo que cambiar mis máquinas?',
        a: 'No. Nos conectamos a lo que ya tenés, sin importar la marca ni la edad del equipo, y sin frenar la producción.',
      },
      {
        q: '¿Desde dónde lo veo?',
        a: 'Desde cualquier lado: la compu de la planta, una tablet o tu celular.',
      },
      {
        q: '¿Mis datos quedan expuestos?',
        a: 'No. Los datos salen cifrados y la plataforma corre en un entorno privado, solo para tu empresa.',
      },
    ],
  },
  {
    slug: 'paradas-y-alarmas',
    nav: 'Paradas y alarmas',
    title: 'Registro de paradas y alarmas de máquinas',
    description:
      'La plataforma detecta cada parada y cada desvío de tus equipos en tiempo real. Marcás el motivo con un toque y ves dónde se va el tiempo.',
    eyebrow: 'Paradas y alarmas',
    h1: 'Cada parada, con su motivo. Cada desvío, a tiempo.',
    lede: 'La plataforma detecta las paradas sola y te avisa cuando algo se sale de lo normal, con el equipo y su severidad. Así sabés dónde se va el tiempo y qué atender primero.',
    video: 'paradas',
    sections: [
      {
        title: 'Las paradas se registran solas.',
        text: 'No hace falta anotarlas en una planilla: la plataforma detecta cuándo un equipo para. Con un toque se marca el motivo, y se ve cuáles se llevan más tiempo.',
        video: 'activos',
      },
      {
        title: 'Alertas en tiempo real.',
        text: 'Cada desvío llega con su equipo y su severidad. Se reconoce y se resuelve desde el mismo lugar, así nada queda sin atender.',
        video: 'alarmas',
      },
      {
        title: 'Y por qué pasó.',
        text: 'Argus, nuestra IA, revisa los datos, te marca qué requiere atención y te propone el próximo paso, con la evidencia.',
        video: 'reporte',
        link: 'argus',
      },
    ],
    faq: [
      {
        q: '¿Cómo detecta las paradas?',
        a: 'Con los datos de cada equipo: cuando una máquina deja de producir, la parada queda registrada sola, sin que nadie la anote.',
      },
      {
        q: '¿Quién marca el motivo?',
        a: 'Cualquiera de tu equipo, con un toque, desde la compu, la tablet o el celular.',
      },
      {
        q: '¿Qué cuenta como desvío?',
        a: 'Lo definimos con vos: qué es normal en cada equipo y qué no.',
      },
      {
        q: '¿Puedo ver las alarmas desde el celular?',
        a: 'Sí. La plataforma se abre desde cualquier lado, y cada alarma se reconoce y se resuelve desde ahí mismo.',
      },
    ],
  },
  {
    slug: 'argus',
    nav: 'Argus, la IA',
    title: 'Argus: IA para analizar tu operación',
    description:
      'Argus revisa todos los datos de tus equipos, encuentra lo que se sale de lo normal, te explica por qué pasa y te propone qué hacer. Y le podés preguntar.',
    eyebrow: 'Argus, nuestra IA',
    h1: 'Argus analiza tu operación y te dice cómo mejorarla.',
    lede: 'Argus revisa todos los datos, encuentra lo que se sale de lo normal, te explica por qué pasa y te propone qué hacer. Y si tenés una duda, se la preguntás.',
    video: 'argus',
    sections: [
      {
        title: 'Preguntale a tu planta.',
        text: 'Le escribís como a una persona y te responde con los datos reales de tus equipos: qué pasó, por qué y qué conviene hacer.',
        video: 'ask',
      },
      {
        title: 'El resumen, ya analizado.',
        text: 'Argus te marca qué requiere atención, con la evidencia y el próximo paso. No hace falta revisar cada gráfico.',
        video: 'report',
      },
      {
        title: 'Con el contexto de tu operación.',
        text: 'Definimos con vos qué es un desvío y le damos a Argus el contexto de tu planta, así sus respuestas hablan de tu proceso.',
        video: 'reporte',
        link: 'paradas-y-alarmas',
      },
    ],
    faq: [
      {
        q: '¿Con qué datos trabaja Argus?',
        a: 'Con los datos reales de tus equipos, los mismos que ves en la plataforma.',
      },
      {
        q: '¿Qué le puedo preguntar?',
        a: 'Lo que quieras saber de tu operación: por qué paró un equipo, cómo viene la producción de hoy o qué máquina consume más energía.',
      },
      {
        q: '¿Cómo sabe qué es normal?',
        a: 'Lo definimos juntos: qué es un desvío en cada equipo y el contexto de tu planta.',
      },
    ],
  },
  {
    slug: 'conectar-plc',
    nav: 'Conectar PLC y máquinas',
    title: 'Conectar PLC a la nube: Siemens, Allen-Bradley y más',
    description:
      'Nos conectamos a los PLC y máquinas que ya tenés, de Siemens, Allen-Bradley, Schneider o cualquier otra marca, sin frenar la producción.',
    eyebrow: 'Conexión de equipos',
    h1: 'Tus PLC y tus máquinas, conectados a la nube.',
    lede: 'Siemens, Allen-Bradley, Schneider o la marca que sea, nuevo o con años: nos conectamos a lo que ya tenés y los datos empiezan a salir, cifrados, sin tocar cómo trabaja la línea.',
    video: 'conectar',
    sections: [
      {
        title: 'Distintos equipos, un solo idioma.',
        text: 'Cada máquina habla su protocolo: PROFINET, EtherNet/IP, Modbus. Los unimos en una sola plataforma, así ves todo junto.',
        video: 'activos',
      },
      {
        title: 'Sin frenar la producción.',
        text: 'Vamos a tu planta, relevamos los equipos y los conectamos sin frenar la línea. Lo hacemos junto a SAI Sistemas, con más de 20 años en automatización: PLCs, SCADA y redes industriales.',
      },
      {
        title: 'Y después, todo en un solo lugar.',
        text: 'Cada equipo aparece en la plataforma con sus datos en vivo, su historia y sus alarmas.',
        video: 'mediciones',
        link: 'monitoreo-de-produccion',
      },
    ],
    faq: [
      {
        q: '¿Qué equipos se pueden conectar?',
        a: 'Los de cualquier marca conocida, como Siemens, Allen-Bradley o Schneider, sin importar la edad. Relevamos cada uno en tu planta y vemos cómo sacarle los datos.',
      },
      {
        q: '¿Hay que parar la producción?',
        a: 'No. Los conectamos sin frenar la línea y sin tocar cómo trabaja.',
      },
      {
        q: '¿Los datos viajan seguros?',
        a: 'Sí: salen cifrados desde la planta.',
      },
      {
        q: '¿Trabajan en todo el país?',
        a: 'Sí, en toda Argentina, en planta y remoto.',
      },
    ],
  },
]

export const temaPorSlug = (slug) => TEMAS.find((t) => t.slug === slug)
