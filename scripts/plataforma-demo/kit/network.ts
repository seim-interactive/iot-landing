// La API y el WebSocket de la demo: responden con los datos de ejemplo de
// handlers.mjs, sin salir a la red. Se instala antes de que cargue la app.
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import handlers, { resetDemoState, responseDelayMs, wsMessages, WS_AUTHENTICATED, WS_TICK_MS } from './handlers.mjs';

type Handler = unknown | ((_url: URL, _req: { method: string; headers: Record<string, string> }, _body: unknown) => unknown);
type Stream = { __stream: { contentType: string; chunks: { delayMs: number; data: string }[] } };
const table = handlers as Record<string, Handler>;
const patterns = Object.keys(table)
  .filter((key) => key.includes('*'))
  .map((key) => ({
    key,
    re: new RegExp('^' + key.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+') + '$'),
  }));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function find(method: string, pathname: string): Handler | undefined {
  const key = `${method} ${pathname}`;
  if (key in table) return table[key];
  return table[patterns.find((p) => p.re.test(key))?.key ?? ''];
}

function answer(method: string, url: URL, body: unknown): { status: number; data: unknown } {
  const handler = find(method, url.pathname);
  if (handler === undefined) {
    console.warn('[demo] sin datos de ejemplo:', method, url.pathname + url.search);
    return { status: 404, data: { error: { code: 'NOT_FOUND', message: 'Sin datos de ejemplo' } } };
  }
  const data = typeof handler === 'function' ? handler(url, { method, headers: {} }, body) : handler;
  return { status: 200, data };
}

const parse = (body: unknown) => {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

// --- axios ---
axios.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
  const url = new URL(axios.getUri(config), location.origin);
  const method = (config.method || 'get').toUpperCase();
  // Una espera corta, como una red de verdad, más la que pida cada ruta: el tablero
  // tiene que llegar después de la primera telemetría (ver handlers.mjs).
  await wait(120 + ((url.pathname.length * 37) % 140) + responseDelayMs(method, url.pathname));
  const { status, data } = answer(method, url, parse(config.data));
  const response = { data, status, statusText: status === 200 ? 'OK' : 'Not Found', headers: {}, config, request: {} };
  if (status >= 400) throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, {}, response as never);
  return response as never;
};

// --- fetch (el chat usa streaming) ---
const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw, location.origin);
  if (!url.pathname.startsWith('/api/')) return realFetch(input, init);
  const { status, data } = answer((init?.method || 'GET').toUpperCase(), url, parse(init?.body));
  const stream = (data as Stream | null)?.__stream;
  if (stream) {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        for (const chunk of stream.chunks) {
          await wait(chunk.delayMs);
          controller.enqueue(encoder.encode(chunk.data));
        }
        controller.close();
      },
    });
    return new Response(body, { status: 200, headers: { 'Content-Type': stream.contentType } });
  }
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
};

// --- WebSocket ---
class DemoSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readyState = 0;
  url: string;
  onopen: ((_e: Event) => void) | null = null;
  onmessage: ((_e: MessageEvent) => void) | null = null;
  onclose: ((_e: CloseEvent) => void) | null = null;
  onerror: ((_e: Event) => void) | null = null;
  private timer = 0;
  private last = Date.now();

  constructor(url: string) {
    super();
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      this.emit('open', new Event('open'));
      this.timer = window.setInterval(() => this.tick(), WS_TICK_MS);
    }, 120);
  }

  private emit(type: 'open' | 'message' | 'close', event: Event) {
    (this[`on${type}`] as ((_e: never) => void) | null)?.(event as never);
    this.dispatchEvent(event);
  }

  private tick() {
    // Con la pestaña oculta, o con el marco fuera de pantalla (la landing pone
    // __demoPaused), no hay nada que actualizar.
    if (document.hidden || (window as { __demoPaused?: boolean }).__demoPaused) return;
    const now = Date.now();
    for (const message of wsMessages(now, this.last)) this.deliver(message);
    this.last = now;
  }

  private deliver(message: unknown) {
    this.emit('message', new MessageEvent('message', { data: JSON.stringify(message) }));
  }

  send(data: string) {
    // El cliente se presenta una sola vez; sin esta respuesta corta la conexión.
    if ((parse(data) as { type?: string })?.type === 'auth') setTimeout(() => this.deliver(WS_AUTHENTICATED), 30);
  }

  close() {
    clearInterval(this.timer);
    this.readyState = 3;
    this.emit('close', new CloseEvent('close', { code: 1000 }));
  }
}
window.WebSocket = DemoSocket as unknown as typeof WebSocket;

// La landing borra lo hecho en la sesión (alarmas reconocidas…) entre una vuelta y otra.
(window as { __demoReset?: () => void }).__demoReset = resetDemoState;
