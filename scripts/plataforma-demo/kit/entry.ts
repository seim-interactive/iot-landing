// Punto de entrada de la demo: prepara el entorno y recién después carga la app real.
import './network';
import './overrides.css';

// Siempre en modo oscuro, que es el que se integra con la landing.
window.localStorage.setItem('theme', 'dark');
window.localStorage.removeItem('sidebarCollapsed');

// La app corre dentro de un iframe en /plataforma/. Sus rutas son absolutas
// (/dashboard, /plants…): se las damos sin recargar. Y navegar adentro no tiene
// que sumar pasos al botón «atrás» de la landing.
const params = new URLSearchParams(location.search);
history.replaceState(null, '', (params.get('ruta') || '/dashboard') + location.search);
history.pushState = history.replaceState.bind(history);

void import('/src/main.ts');
