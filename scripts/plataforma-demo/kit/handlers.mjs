// Datos de ejemplo de la plataforma IoT (copia de referencia).
// Isomórfico: JavaScript puro, sin imports ni acceso a disco. Se puede importar
// igual desde Node (mock.mjs) y desde el navegador.
//
// Formato del export default: mapa 'METODO /ruta' → valor JSON | (url, req, body) => valor JSON.
// Un `*` en la clave matchea un segmento de la ruta. `body` es el JSON del pedido (POST/PUT).
// Además exporta `wsMessages(now, sinceMs)`, `chatStream(body, now)` y `WS_AUTHENTICATED`.

/* ───────────────────────── tiempo y azar determinista ───────────────────────── */

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const TZ = 'America/Argentina/Buenos_Aires';
const TZ_OFFSET = -3 * HOUR; // Argentina no cambia la hora
const DAY_START_MIN = 360; // la jornada arranca 06:00

/**
 * El momento en que arrancó la demo: se fija una vez por sesión (en el
 * navegador, al cargar; en Node, mientras viva el proceso). Lo «reciente»
 * (la parada de la Llenadora, las alarmas activas) se ancla acá, así el pasado
 * no cambia mientras alguien mira.
 */
function bootTime(now) {
  const g = globalThis;
  // (un `now` anterior es un cálculo «congelado» en el pasado, como el reporte: no la mueve)
  if (!g.__plantaDemoBoot || now - g.__plantaDemoBoot > 6 * HOUR) {
    // Se redondea al minuto para que todo lo anclado caiga en minutos enteros
    g.__plantaDemoBoot = Math.floor(now / MIN) * MIN;
    g.__plantaDemoCache = new Map();
  }
  return g.__plantaDemoBoot;
}
function cache() {
  return globalThis.__plantaDemoCache || (globalThis.__plantaDemoCache = new Map());
}

const iso = (ms) => new Date(ms).toISOString();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v, d = 0) => { const k = 10 ** d; return Math.round(v * k) / k; };

/** Entero → [0, 1), siempre igual. */
function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
/** Generador con semilla (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Ruido suave en [-1, 1]: interpola valores fijos cada `period` ms. */
function noise(t, period, seed) {
  const x = t / period;
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = hash(i * 7919 + seed * 104729);
  const b = hash((i + 1) * 7919 + seed * 104729);
  return (a + (b - a) * s) * 2 - 1;
}

/** El inicio (UTC, ms) del día operativo al que pertenece `t`. */
function dayStartOf(t) {
  const shift = DAY_START_MIN * MIN - TZ_OFFSET; // 06:00 local = 09:00 UTC
  return Math.floor((t - shift) / DAY) * DAY + shift;
}
/** 'YYYY-MM-DD' del día operativo → su inicio. */
function dayStartFromDate(date) {
  const [y, m, d] = String(date).split('-').map(Number);
  return Date.UTC(y, m - 1, d) + DAY_START_MIN * MIN - TZ_OFFSET;
}
/** "14:05" en la hora de la planta. */
function hhmm(ms) {
  const d = new Date(ms + TZ_OFFSET);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/* ───────────────────────── cliente, planta y equipos ───────────────────────── */

const TENANT = { id: '7c1f0a52-3b6e-4d1a-9a41-5e0c2f7d1001', slug: 'planta-demo', name: 'Planta Demo', iconUrl: null };
const PLANT = {
  id: '2a9d4c10-6f3b-4e8a-b7c5-1d2e3f4a5001',
  plantId: 'planta-pilar',
  name: 'Planta Pilar',
  province: 'Buenos Aires',
  timezone: TZ,
  operationalDayStartMinutes: DAY_START_MIN,
};
const USER = { uid: 'demo', email: 'operaciones@plantademo.com', name: 'Operaciones', role: 'supervisor' };
const CREATED_AT = '2025-03-10T13:00:00.000Z';

const actor = (email = USER.email, source = 'user') => ({ email, source });

/**
 * Los cuatro equipos. Cada uno tiene las mismas nueve métricas (con otro
 * nombre y otra escala), así los cuatro tableros salen de la misma plantilla.
 *  - prod / rej: contadores del día (vuelven a 0 con la jornada).
 *  - speed / temp / pres / power: medidores.
 *  - run / starved / fault: estados.
 */
const MACHINES = [
  {
    key: 'env1', id: 'b3e1a7c4-58d2-4f6b-9c10-a1b2c3d40001', thing: 'envasadora-1', name: 'Envasadora 1', seed: 11,
    nominal: 82, speedUnit: 'paq/min', speedMax: 100, prodUnit: 'paq', rejectRate: 0.012,
    prod: { id: 'paquetes_producidos', label: 'Paquetes producidos' },
    rej: { id: 'paquetes_rechazados', label: 'Paquetes rechazados' },
    speed: { id: 'velocidad_linea', label: 'Velocidad de línea' },
    temp: { id: 'temp_mordazas', label: 'Temperatura de mordazas', unit: '°C', base: 148, amp: 2.4, min: 120, max: 180, gaugeMax: 200 },
    pres: { id: 'presion_aire', label: 'Presión de aire', unit: 'bar', base: 6.1, amp: 0.16, min: 4, max: 8 },
    power: { id: 'potencia_activa', label: 'Potencia activa', unit: 'kW', idle: 3.8, load: 14.6, min: 0, max: 25 },
    energy: { id: 'energia_activa', label: 'Energía activa' },
    run: { id: 'en_produccion', label: 'En producción' },
    starved: { id: 'falta_film', label: 'Falta de film' },
    fault: { id: 'falla_general', label: 'Falla general' },
    stopsPerDay: [5, 7],
    reasons: [
      { code: 'falta_film', label: 'Falta de film', kind: 'starved', min: 4, max: 9 },
      { code: 'cambio_bobina', label: 'Cambio de bobina', kind: 'planned', min: 6, max: 11 },
      { code: 'atasco_mordazas', label: 'Atasco de producto en mordazas', kind: 'fault', min: 5, max: 14 },
      { code: 'ajuste_fotocelda', label: 'Ajuste de fotocelda', kind: 'fault', min: 3, max: 8 },
      { code: 'limpieza', label: 'Limpieza programada', kind: 'planned', min: 12, max: 20 },
      { code: 'cambio_formato', label: 'Cambio de formato', kind: 'planned', min: 18, max: 30 },
    ],
  },
  {
    key: 'env2', id: 'b3e1a7c4-58d2-4f6b-9c10-a1b2c3d40002', thing: 'envasadora-2', name: 'Envasadora 2', seed: 23,
    nominal: 78, speedUnit: 'paq/min', speedMax: 100, prodUnit: 'paq', rejectRate: 0.008,
    prod: { id: 'paquetes_producidos', label: 'Paquetes producidos' },
    rej: { id: 'paquetes_rechazados', label: 'Paquetes rechazados' },
    speed: { id: 'velocidad_linea', label: 'Velocidad de línea' },
    temp: { id: 'temp_mordazas', label: 'Temperatura de mordazas', unit: '°C', base: 146, amp: 1.8, min: 120, max: 180, gaugeMax: 200 },
    pres: { id: 'presion_aire', label: 'Presión de aire', unit: 'bar', base: 6.2, amp: 0.12, min: 4, max: 8 },
    power: { id: 'potencia_activa', label: 'Potencia activa', unit: 'kW', idle: 3.6, load: 13.9, min: 0, max: 25 },
    energy: { id: 'energia_activa', label: 'Energía activa' },
    run: { id: 'en_produccion', label: 'En producción' },
    starved: { id: 'falta_film', label: 'Falta de film' },
    fault: { id: 'falla_general', label: 'Falla general' },
    stopsPerDay: [2, 4],
    reasons: [
      { code: 'falta_film', label: 'Falta de film', kind: 'starved', min: 4, max: 8 },
      { code: 'cambio_bobina', label: 'Cambio de bobina', kind: 'planned', min: 6, max: 10 },
      { code: 'atasco_mordazas', label: 'Atasco de producto en mordazas', kind: 'fault', min: 4, max: 10 },
      { code: 'limpieza', label: 'Limpieza programada', kind: 'planned', min: 12, max: 18 },
      { code: 'cambio_formato', label: 'Cambio de formato', kind: 'planned', min: 18, max: 28 },
    ],
  },
  {
    key: 'llen', id: 'b3e1a7c4-58d2-4f6b-9c10-a1b2c3d40003', thing: 'llenadora', name: 'Llenadora', seed: 37,
    nominal: 118, speedUnit: 'bot/min', speedMax: 150, prodUnit: 'bot', rejectRate: 0.006,
    prod: { id: 'botellas_llenadas', label: 'Botellas llenadas' },
    rej: { id: 'botellas_rechazadas', label: 'Botellas rechazadas' },
    speed: { id: 'velocidad_linea', label: 'Velocidad de línea' },
    temp: { id: 'temp_producto', label: 'Temperatura de producto', unit: '°C', base: 18.4, amp: 0.7, min: 10, max: 30, gaugeMax: 40 },
    pres: { id: 'presion_llenado', label: 'Presión de llenado', unit: 'bar', base: 2.8, amp: 0.1, min: 1, max: 4 },
    power: { id: 'potencia_activa', label: 'Potencia activa', unit: 'kW', idle: 2.9, load: 9.4, min: 0, max: 16 },
    energy: { id: 'energia_activa', label: 'Energía activa' },
    run: { id: 'en_produccion', label: 'En producción' },
    starved: { id: 'falta_botellas', label: 'Falta de botellas' },
    fault: { id: 'falla_general', label: 'Falla general' },
    stopsPerDay: [2, 4],
    /** Detenida ahora: la pararon para revisar la válvula, después de que cayó la presión de llenado. */
    stoppedNow: { code: 'revision_valvula', label: 'Revisión de válvula de llenado', kind: 'other', sinceMin: 47 },
    reasons: [
      { code: 'falta_botellas', label: 'Falta de botellas', kind: 'starved', min: 3, max: 8 },
      { code: 'falla_valvula', label: 'Falla en válvula de llenado', kind: 'fault', min: 6, max: 15 },
      { code: 'revision_valvula', label: 'Revisión de válvula de llenado', kind: 'other', min: 10, max: 20 },
      { code: 'atasco_transporte', label: 'Atasco en transporte de entrada', kind: 'fault', min: 3, max: 9 },
      { code: 'limpieza_cip', label: 'Limpieza CIP', kind: 'planned', min: 25, max: 35 },
      { code: 'cambio_formato', label: 'Cambio de formato', kind: 'planned', min: 20, max: 30 },
    ],
  },
  {
    key: 'horno', id: 'b3e1a7c4-58d2-4f6b-9c10-a1b2c3d40004', thing: 'horno', name: 'Horno', seed: 53,
    nominal: 14, speedUnit: 'band/min', speedMax: 20, prodUnit: 'band', rejectRate: 0.004,
    prod: { id: 'bandejas_horneadas', label: 'Bandejas horneadas' },
    rej: { id: 'bandejas_descartadas', label: 'Bandejas descartadas' },
    speed: { id: 'velocidad_cinta', label: 'Velocidad de cinta' },
    temp: { id: 'temp_camara', label: 'Temperatura de cámara', unit: '°C', base: 214, amp: 3.2, min: 180, max: 250, gaugeMax: 300 },
    pres: { id: 'presion_gas', label: 'Presión de gas', unit: 'mbar', base: 21.5, amp: 0.6, min: 15, max: 28 },
    power: { id: 'potencia_activa', label: 'Potencia activa', unit: 'kW', idle: 11.5, load: 22.4, min: 0, max: 45 },
    energy: { id: 'energia_activa', label: 'Energía activa' },
    run: { id: 'en_produccion', label: 'En producción' },
    starved: { id: 'falta_producto', label: 'Falta de producto' },
    fault: { id: 'falla_general', label: 'Falla general' },
    stopsPerDay: [1, 2],
    reasons: [
      { code: 'falta_producto', label: 'Falta de producto en la entrada', kind: 'starved', min: 4, max: 10 },
      { code: 'falla_quemador', label: 'Falla de encendido en quemador', kind: 'fault', min: 6, max: 12 },
      { code: 'limpieza', label: 'Limpieza programada', kind: 'planned', min: 15, max: 22 },
    ],
  },
];
const machineBy = (idOrThing) => MACHINES.find((m) => m.id === idOrThing || m.thing === idOrThing || m.key === idOrThing) || MACHINES[0];

/* ───────────────────────── paradas (la fuente de todo lo demás) ───────────────────────── */

const MICRO_REASON = { code: 'microparada', label: 'Microparada', kind: 'micro' };
const MICRO_STARVED = { code: 'microparada', label: 'Microparada', kind: 'starved' };

/**
 * Las paradas de un equipo en un día operativo, siempre las mismas para ese
 * día. Nada se detiene después de `boot − 25 min`: desde ahí el pasado ya no
 * cambia. La Llenadora suma su parada en curso.
 */
function stopsOfDay(m, dayStart, now) {
  const boot = bootTime(now);
  const key = `stops|${m.key}|${dayStart}`;
  const hit = cache().get(key);
  if (hit) return hit;
  const dayNo = Math.floor(dayStart / DAY);
  const rand = rng(dayNo * 131 + m.seed * 7907);
  const [lo, hi] = m.stopsPerDay;
  const count = lo + Math.floor(rand() * (hi - lo + 1));
  const list = [];
  for (let i = 0; i < count; i++) {
    // El motivo rota con el día, así cada jornada tiene de todo (falta de producto, fallas y programadas)
    const pick = rand();
    const reason = m.reasons[(i * 2 + dayNo + (pick > 0.7 ? 1 : 0)) % m.reasons.length];
    // En minutos enteros, repartidas por la jornada (cada una en su franja)
    const slot = (DAY - 2 * HOUR) / count;
    const startMin = Math.floor((HOUR / 2 + i * slot + rand() * (slot - 50 * MIN)) / MIN);
    const durMin = reason.min + Math.floor(rand() * (reason.max - reason.min + 1));
    const secs = Math.floor(rand() * 50);
    const hasReason = rand() > 0.22;
    list.push({
      id: `stop-${m.key}-${dayNo}-${i}`,
      start: dayStart + startMin * MIN,
      end: dayStart + (startMin + durMin) * MIN + secs * SEC,
      reason, hasReason, ongoing: false,
    });
  }
  // Microparadas: menos de un minuto, sin motivo
  const micros = 6 + Math.floor(rand() * 7);
  for (let i = 0; i < micros; i++) {
    const start = dayStart + Math.floor(rand() * (DAY - HOUR) / SEC) * SEC + 20 * MIN;
    const end = start + (12 + Math.floor(rand() * 40)) * SEC;
    if (list.some((s) => start < s.end + 10 * MIN && end > s.start - 10 * MIN)) continue;
    // Una de cada dos es un corte breve de alimentación (film, botellas, producto)
    list.push({ id: `stop-${m.key}-${dayNo}-m${i}`, start, end, reason: i % 2 ? MICRO_STARVED : MICRO_REASON, hasReason: false, ongoing: false, micro: true });
  }
  list.sort((a, b) => a.start - b.start);
  const limit = boot - 25 * MIN;
  let stops = list.filter((s) => s.end < limit);
  if (m.stoppedNow) {
    const start = boot - m.stoppedNow.sinceMin * MIN;
    stops = stops.filter((s) => s.end < start - 20 * MIN);
    if (start >= dayStart && start < dayStart + DAY) {
      stops.push({ id: `stop-${m.key}-actual`, start, end: Infinity, reason: m.stoppedNow, hasReason: true, ongoing: true });
    } else if (start < dayStart) {
      // Viene detenida desde la jornada anterior
      stops.unshift({ id: `stop-${m.key}-actual`, start, end: Infinity, reason: m.stoppedNow, hasReason: true, ongoing: true });
    }
  }
  // En las envasadoras, la última parada terminada todavía no tiene el motivo cargado
  if (m.key === 'env1' || m.key === 'env2') {
    const ended = stops.filter((s) => !s.micro && !s.ongoing);
    if (ended.length > 0) ended[ended.length - 1].hasReason = false;
  }
  cache().set(key, stops);
  return stops;
}

/** Las paradas que tocan [from, to), recortadas a `now`. */
function stopsBetween(m, from, to, now) {
  const out = [];
  for (let d = dayStartOf(from); d < to; d += DAY) {
    for (const s of stopsOfDay(m, d, now)) {
      if (s.start >= d && s.start < to && Math.min(s.end, now) > from && !out.includes(s)) out.push(s);
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** La parada que contiene a `t`, si hay. */
function stopAt(m, t, now) {
  const d = dayStartOf(t);
  for (const s of stopsOfDay(m, d, now)) if (t >= s.start && t < s.end) return s;
  // Una en curso que viene del día anterior
  for (const s of stopsOfDay(m, d - DAY, now)) if (t >= s.start && t < s.end) return s;
  return null;
}

/** 0 detenida, 1 a régimen; sube en 90 s después de cada parada. */
function runFactor(m, t, now) {
  if (stopAt(m, t, now)) return 0;
  const d = dayStartOf(t);
  let last = null;
  for (const s of stopsOfDay(m, d, now)) if (s.end <= t && (!last || s.end > last.end)) last = s;
  if (!last) return 1;
  const rampMs = last.micro ? 20 * SEC : 90 * SEC;
  const since = t - last.end;
  return since < rampMs ? clamp(since / rampMs, 0.15, 1) : 1;
}

/* ───────────────────────── las métricas en un instante ───────────────────────── */

function speedAt(m, t, now) {
  const f = runFactor(m, t, now);
  if (f === 0) return 0;
  const wave = 0.94 + 0.05 * noise(t, 53 * MIN, m.seed) + 0.028 * noise(t, 11 * MIN, m.seed + 1) + 0.012 * noise(t, 3 * MIN, m.seed + 3) + 0.005 * noise(t, 40 * SEC, m.seed + 2);
  return m.nominal * wave * f;
}

/** Lo propio de la Envasadora 1 en la última hora: las mordazas calientan y cae la presión de aire. */
function env1Drift(now) {
  const boot = bootTime(now);
  return {
    tempFrom: boot - 52 * MIN, tempFull: boot - 24 * MIN, tempRise: 9.5,
    presFrom: boot - 31 * MIN, presFull: boot - 19 * MIN, presDrop: 0.82,
  };
}
const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ease = (x) => x * x * (3 - 2 * x);

function tempAt(m, t, now) {
  let v = m.temp.base + m.temp.amp * (0.7 * noise(t, 38 * MIN, m.seed + 10) + 0.3 * noise(t, 5 * MIN, m.seed + 11)) + m.temp.amp * 0.08 * noise(t, 30 * SEC, m.seed + 12);
  if (m.key === 'env1') { const d = env1Drift(now); v += d.tempRise * ease(ramp(t, d.tempFrom, d.tempFull)); }
  return v;
}
function presAt(m, t, now) {
  let v = m.pres.base + m.pres.amp * (0.65 * noise(t, 26 * MIN, m.seed + 20) + 0.35 * noise(t, 4 * MIN, m.seed + 21)) + m.pres.amp * 0.1 * noise(t, 25 * SEC, m.seed + 22);
  if (m.key === 'env1') { const d = env1Drift(now); v -= d.presDrop * ease(ramp(t, d.presFrom, d.presFull)); }
  if (m.key === 'llen') { const boot = bootTime(now); v -= 0.74 * ease(ramp(t, boot - 58 * MIN, boot - 48 * MIN)); }
  return v;
}
function powerAt(m, t, now) {
  const load = speedAt(m, t, now) / m.nominal;
  return m.power.idle + m.power.load * load + 0.35 * noise(t, 3 * MIN, m.seed + 30) + 0.12 * noise(t, 20 * SEC, m.seed + 31);
}

/** Lo producido y lo rechazado, acumulado minuto a minuto, de un día operativo. */
function dayCum(m, dayStart, now) {
  const key = `cum|${m.key}|${dayStart}`;
  const hit = cache().get(key);
  if (hit) return hit;
  const prod = new Float64Array(1441);
  const rej = new Float64Array(1441);
  const energy = new Float64Array(1441);
  for (let i = 0; i < 1440; i++) {
    const t = dayStart + i * MIN + 30 * SEC;
    const p = speedAt(m, t, now);
    const rate = m.rejectRate * (1 + 0.45 * noise(t, 70 * MIN, m.seed + 40) + 0.25 * noise(t, 9 * MIN, m.seed + 41));
    prod[i + 1] = prod[i] + p;
    rej[i + 1] = rej[i] + p * Math.max(0, rate);
    energy[i + 1] = energy[i] + powerAt(m, t, now) / 60;
  }
  const out = { prod, rej, energy };
  cache().set(key, out);
  return out;
}
/** El contador del día (entero) en el instante `t`. */
function counterAt(m, which, t, now) {
  const tt = Math.min(t, now);
  const d = dayStartOf(tt);
  const arr = dayCum(m, d, now)[which];
  const x = (tt - d) / MIN;
  const i = Math.min(1439, Math.floor(x));
  return Math.floor(arr[i] + (arr[i + 1] - arr[i]) * (x - i));
}
/** Lo contado entre dos instantes, aunque crucen de jornada. */
function countedBetween(m, which, from, to, now) {
  const b = Math.min(to, now);
  if (b <= from) return 0;
  let total = 0;
  for (let d = dayStartOf(from); d < b; d += DAY) {
    const a0 = Math.max(from, d);
    const b0 = Math.min(b, d + DAY);
    if (b0 <= a0) continue;
    // El contador vuelve a 0 con la jornada: el final de un día es su total
    const endCount = b0 === d + DAY ? Math.floor(dayCum(m, d, now)[which][1440]) : counterAt(m, which, b0, now);
    total += endCount - counterAt(m, which, a0, now);
  }
  return total;
}

/** El catálogo de métricas de un equipo. */
function metricsOf(m) {
  return [
    { ...m.prod, kind: 'prod', valueType: 'counter', unit: m.prodUnit, role: 'produced' },
    { ...m.rej, kind: 'rej', valueType: 'counter', unit: m.prodUnit, role: 'rejected' },
    { ...m.speed, kind: 'speed', valueType: 'gauge', unit: m.speedUnit, role: 'line_speed' },
    { ...m.temp, kind: 'temp', valueType: 'gauge', unit: m.temp.unit, role: null },
    { ...m.pres, kind: 'pres', valueType: 'gauge', unit: m.pres.unit, role: null },
    { ...m.power, kind: 'power', valueType: 'gauge', unit: m.power.unit, role: null },
    { ...m.energy, kind: 'energy', valueType: 'counter', unit: 'kWh', role: 'energy' },
    { ...m.run, kind: 'run', valueType: 'state', unit: null, role: 'running' },
    { ...m.starved, kind: 'starved', valueType: 'state', unit: null, role: 'product_starved' },
    { ...m.fault, kind: 'fault', valueType: 'state', unit: null, role: 'machine_fault' },
  ];
}
const metricOf = (m, metricId) => metricsOf(m).find((x) => x.id === metricId) || null;

const DECIMALS = { speed: 1, temp: 1, pres: 2, power: 1 };

/** El valor de una métrica en un instante, como lo manda el PLC. */
function valueAt(m, kind, t, now) {
  switch (kind) {
    case 'prod': return counterAt(m, 'prod', t, now);
    case 'rej': return counterAt(m, 'rej', t, now);
    case 'energy': return counterAt(m, 'energy', t, now);
    case 'speed': return round(speedAt(m, t, now), 1);
    case 'temp': return round(tempAt(m, t, now), 1);
    case 'pres': return round(presAt(m, t, now), m.pres.unit === 'mbar' ? 1 : 2);
    case 'power': return round(powerAt(m, t, now), 1);
    case 'run': return !stopAt(m, t, now);
    case 'starved': { const s = stopAt(m, t, now); return !!s && s.reason.kind === 'starved'; }
    case 'fault': { const s = stopAt(m, t, now); return !!s && s.reason.kind === 'fault'; }
    default: return null;
  }
}

/* ───────────────────────── arranque: sesión, plantas, equipos ───────────────────────── */

const CAPABILITIES = [
  'alarms.create', 'alarms.acknowledge', 'alarms.resolve', 'alarms.delete',
  'alarmRules.create', 'alarmRules.update', 'alarmRules.delete',
  'incidents.create', 'incidents.update', 'incidents.changeStatus', 'incidents.close', 'incidents.delete',
  'downtime.manage', 'downtimeReasons.manage', 'productionRuns.update', 'productionRuns.close',
];

const sitePlcs = () => MACHINES.map((m) => ({ id: m.id, name: m.name, plcThingName: m.thing }));
const plantRef = () => ({ plantId: PLANT.plantId, province: PLANT.province, name: PLANT.name });

function plcRecords(now) {
  return MACHINES.map((m) => ({
    id: m.id,
    tenantId: TENANT.id,
    plantId: PLANT.id,
    gatewayId: 'gw-pilar-01',
    plcThingName: m.thing,
    name: m.name,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    state: { plcId: m.id, tenantId: TENANT.id, plantId: PLANT.id, lastTs: iso(now - 2 * SEC), updatedAt: iso(now - 2 * SEC) },
    plant: plantRef(),
  }));
}

function equipmentState(m, now) {
  const s = stopAt(m, now, now);
  return {
    running: !s,
    stopped: !!s,
    productStarved: !!s && s.reason.kind === 'starved',
    fault: !!s && s.reason.kind === 'fault',
    currentProduct: null,
    asOf: iso(now - 2 * SEC),
  };
}

function overview(now) {
  const from = dayStartOf(now);
  return {
    generatedAt: iso(now),
    plants: [{
      id: PLANT.id,
      plantId: PLANT.plantId,
      name: PLANT.name,
      province: PLANT.province,
      timezone: TZ,
      productionDay: { from: iso(from), to: iso(from + DAY) },
      plcs: MACHINES.map((m) => {
        const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        for (const a of activeAlarms(now)) if (a.plcId === m.id) { counts.total++; counts[a.severity]++; }
        return {
          id: m.id,
          name: m.name,
          plcThingName: m.thing,
          isOnline: true,
          lastSeenAt: iso(now - 2 * SEC),
          hasStateSignal: true,
          state: equipmentState(m, now),
          alarms: counts,
          production: { label: m.prod.label, unit: m.prodUnit, today: counterAt(m, 'prod', now, now), failed: false },
        };
      }),
    }],
  };
}

/* ───────────────────────── tableros ───────────────────────── */

const lastRange = (value, unit) => ({ type: 'last', relative: { value, unit }, absolute: { from: '', to: '' }, date: null, shiftIndex: 1 });

function areaChart(m, metric, { color, hours = 8, interval = 5, yMin, yMax, aggregate }) {
  return {
    metrics: [{ metricId: metric.id, ...(aggregate ? { pointAggregate: aggregate } : {}) }],
    seriesQuery: { resolutionMode: 'fixed', intervalMinutes: interval, timeRange: { type: 'last', duration: `${hours}h` } },
    timeRange: lastRange(hours, 'hours'),
    chartStyle: 'area',
    color,
    horizontal: false,
    xAxisName: '',
    yAxisName: '',
    yAxisMin: yMin ?? null,
    yAxisMax: yMax ?? null,
    showBarLabels: false,
    showGridLines: true,
    showTooltip: true,
    smooth: true,
    areaOpacity: 0.9,
    lineWidth: 2,
    userEditable: { timeRange: true },
  };
}

function dashboardOf(m) {
  const did = `d0${m.id.slice(2)}`;
  const wid = (n) => `${did.slice(0, -2)}${String(n).padStart(2, '0')}`.replace(/^d0/, 'e0');
  let order = 0;
  const w = (n, type, label, metricId, unit, configJson, layoutJson) => ({
    id: wid(n), widgetKey: `${m.key}-${n}`, type, label, metricId, unit: unit ?? null, dataType: null,
    configJson, layoutJson, sortOrder: order++, isVisible: true,
  });
  const theoretical = Math.round(m.nominal * 1.08);
  const widgets = [
    // Arriba: los contadores del día y las luces de estado
    w(1, 'counter', 'Producido hoy', m.prod.id, m.prodUnit, { color: 'green' }, { x: 0, y: 0, w: 2, h: 2 }),
    w(2, 'counter', 'Rechazos hoy', m.rej.id, m.prodUnit, { color: 'red' }, { x: 2, y: 0, w: 2, h: 2 }),
    w(3, 'counter', 'Energía hoy', m.energy.id, 'kWh', { color: 'blue' }, { x: 4, y: 0, w: 2, h: 2 }),
    w(4, 'status', m.run.label, m.run.id, null, { color: 'green' }, { x: 6, y: 0, w: 2, h: 2 }),
    w(5, 'status', m.starved.label, m.starved.id, null, { color: 'yellow' }, { x: 8, y: 0, w: 2, h: 2 }),
    w(6, 'status', m.fault.label, m.fault.id, null, { color: 'red' }, { x: 10, y: 0, w: 2, h: 2 }),

    // Las áreas de las últimas 8 horas
    w(7, 'chart', m.speed.label, m.speed.id, m.speedUnit,
      areaChart(m, m.speed, { color: 'cyan', yMin: 0, yMax: m.speedMax }), { x: 0, y: 2, w: 4, h: 4 }),
    w(8, 'chart', m.temp.label, m.temp.id, m.temp.unit,
      areaChart(m, m.temp, { color: 'orange', yMin: m.temp.min, yMax: m.temp.max }), { x: 4, y: 2, w: 4, h: 4 }),
    w(9, 'chart', m.power.label, m.power.id, m.power.unit,
      areaChart(m, m.power, { color: 'purple', yMin: m.power.min, yMax: m.power.max }), { x: 8, y: 2, w: 4, h: 4 }),
    w(10, 'chart', m.pres.label, m.pres.id, m.pres.unit,
      areaChart(m, m.pres, { color: 'blue', yMin: m.pres.min, yMax: m.pres.max }), { x: 0, y: 6, w: 6, h: 4 }),

    // Los indicadores
    w(11, 'gauge', m.speed.label, m.speed.id, m.speedUnit, { max: m.speedMax }, { x: 6, y: 6, w: 3, h: 4 }),
    w(12, 'gauge', 'Rendimiento de línea', m.speed.id, '%', {
      efficiency: { enabled: true, theoreticalProduction: theoretical },
      userEditable: { theoreticalProduction: true },
    }, { x: 9, y: 6, w: 3, h: 4 }),

    // La producción por hora de la jornada y la línea de estado
    w(13, 'chart', 'Producción por hora', m.prod.id, m.prodUnit, {
      metrics: [{ metricId: m.prod.id }],
      seriesQuery: { resolutionMode: 'fixed', intervalMinutes: 60, timeRange: { type: 'operationalDay', date: null } },
      timeRange: { type: 'operationalDay', relative: { value: 24, unit: 'hours' }, absolute: { from: '', to: '' }, date: null, shiftIndex: 1 },
      chartStyle: 'bar', color: 'green', horizontal: false, xAxisName: '', yAxisName: '', yAxisMin: 0, yAxisMax: null,
      showBarLabels: false, showGridLines: true, showTooltip: true, userEditable: { timeRange: false },
    }, { x: 0, y: 10, w: 6, h: 4 }),
    w(14, 'state_timeline', 'Estados de la máquina', m.run.id, null, {
      signals: [m.run, m.starved, m.fault].map((s) => ({ plcId: m.id, metricId: s.id })),
      timeRange: lastRange(8, 'hours'),
      userEditable: { timeRange: true },
    }, { x: 6, y: 10, w: 6, h: 4 }),
  ];
  return {
    tenant: { ...TENANT },
    plant: { id: PLANT.id, plantId: PLANT.plantId, name: PLANT.name, province: PLANT.province, timezone: TZ, operationalDayStartMinutes: DAY_START_MIN },
    plc: { id: m.id, plcThingName: m.thing, name: m.name },
    dashboard: { id: did, name: m.name, iconUrl: null, layoutVersion: 1 },
    widgets,
  };
}

/* ───────────────────────── series y líneas de estado ───────────────────────── */

function durationMs(text) {
  const mt = /^(\d+)([mhdw])$/.exec(String(text || '24h'));
  if (!mt) return 24 * HOUR;
  return Number(mt[1]) * { m: MIN, h: HOUR, d: DAY, w: 7 * DAY }[mt[2]];
}

/** El período pedido → [from, to) en ms. */
function resolveRange(range, now) {
  const r = range || {};
  if (r.type === 'custom' && r.from && r.to) return { from: Date.parse(r.from), to: Date.parse(r.to) };
  if (r.type === 'operationalDay' || r.type === 'shift') {
    const from = r.date ? dayStartFromDate(r.date) : dayStartOf(now);
    if (r.type === 'shift') {
      const idx = clamp((Number(r.shiftIndex) || 1) - 1, 0, 2);
      return { from: from + idx * 8 * HOUR, to: from + (idx + 1) * 8 * HOUR };
    }
    return { from, to: from + DAY };
  }
  if (r.type === 'weekOperational') {
    const day = r.date ? dayStartFromDate(r.date) : dayStartOf(now);
    const dow = (new Date(day + TZ_OFFSET + 12 * HOUR).getUTCDay() + 6) % 7; // lunes = 0
    const from = day - dow * DAY;
    return { from, to: from + 7 * DAY };
  }
  const span = durationMs(r.duration);
  return { from: now - span, to: now };
}

const ALLOWED_INTERVALS = [1, 5, 15, 60, 1440];
function autoInterval(spanMs) {
  if (spanMs <= 2 * HOUR) return 1;
  if (spanMs <= 12 * HOUR) return 5;
  if (spanMs <= 48 * HOUR) return 15;
  if (spanMs <= 14 * DAY) return 60;
  return 1440;
}

function seriesData(body, now) {
  bootTime(now);
  const scope = body?.scope || { mode: 'tenant' };
  const m = machineBy(scope.plcId);
  const { from, to } = resolveRange(body?.range, now);
  const requested = body?.resolution?.type === 'fixed' ? Number(body.resolution.intervalMinutes) || 60 : null;
  let interval = requested ?? autoInterval(to - from);
  const maxPoints = Number(body?.options?.downsample?.maxPoints) || 1200;
  let downsampled = false;
  while ((to - from) / (interval * MIN) > maxPoints) {
    const next = ALLOWED_INTERVALS.find((i) => i > interval);
    if (!next) break;
    interval = next; downsampled = true;
  }
  const step = interval * MIN;
  // La grilla de la jornada: cada balde arranca en un múltiplo desde las 06:00
  const anchor = dayStartOf(from);
  const first = anchor + Math.floor((from - anchor) / step) * step;
  const end = Math.min(to, now);
  const series = (body?.series || []).map((item) => {
    const metric = metricOf(m, item.metricId);
    if (!metric || metric.valueType === 'state') {
      return { metricId: item.metricId, alias: item.alias, label: metric?.label || item.metricId, unit: null, points: [] };
    }
    const points = [];
    for (let b = first; b < end; b += step) {
      const bEnd = Math.min(b + step, end);
      let value;
      if (metric.valueType === 'counter') {
        value = countedBetween(m, metric.kind, Math.max(b, from), bEnd, now);
      } else {
        const agg = item.pointAggregate || 'avg';
        const n = Math.max(2, Math.min(12, Math.round((bEnd - b) / MIN)));
        const samples = [];
        for (let k = 0; k < n; k++) samples.push(sample(m, metric.kind, b + ((k + 0.5) * (bEnd - b)) / n, now));
        if (agg === 'min') value = Math.min(...samples);
        else if (agg === 'max') value = Math.max(...samples);
        else if (agg === 'last') value = samples[samples.length - 1];
        else value = samples.reduce((a, c) => a + c, 0) / n;
        value = round(value, metric.kind === 'pres' && m.pres.unit !== 'mbar' ? 2 : 1);
      }
      points.push({ ts: iso(b), value });
    }
    return {
      metricId: item.metricId,
      alias: item.alias,
      label: metric.label,
      unit: metric.unit,
      aggregate: metric.valueType === 'counter' ? 'delta' : (item.pointAggregate || 'avg'),
      points,
    };
  });
  return {
    meta: {
      timezone: TZ,
      fromUtc: iso(from),
      toUtc: iso(to),
      requestedIntervalMinutes: requested,
      intervalMinutes: interval,
      downsampled,
      maxPointsApplied: downsampled ? maxPoints : null,
      storageIntervalMinutes: 1,
      scope,
    },
    series,
  };
}
function sample(m, kind, t, now) {
  if (kind === 'speed') return speedAt(m, t, now);
  if (kind === 'temp') return tempAt(m, t, now);
  if (kind === 'pres') return presAt(m, t, now);
  return powerAt(m, t, now);
}

function stateTimeline(body, now) {
  bootTime(now);
  const { from, to: rawTo } = resolveRange(body?.range, now);
  const to = Math.min(rawTo, now);
  const signals = (body?.signals || []).map((ref) => {
    const m = machineBy(ref.plcId);
    const metric = metricOf(m, ref.metricId);
    const kind = metric?.kind || 'run';
    const isTrue = (stop) => (kind === 'run' ? !stop : !!stop && stop.reason.kind === kind);
    // Los cortes: cada inicio y fin de parada dentro del período
    const cuts = [from];
    for (const s of stopsBetween(m, from, to, now)) {
      if (s.start > from && s.start < to) cuts.push(s.start);
      if (s.end > from && s.end < to) cuts.push(s.end);
    }
    cuts.push(to);
    cuts.sort((a, b) => a - b);
    const segments = [];
    let trueMs = 0; let falseMs = 0; let transitionsToTrue = 0;
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i]; const b = cuts[i + 1];
      if (b <= a) continue;
      const value = isTrue(stopAt(m, (a + b) / 2, now));
      const prev = segments[segments.length - 1];
      if (prev && prev.value === value) { prev.end = iso(b); prev.ongoing = b >= to && rawTo >= now; }
      else {
        if (value && prev) transitionsToTrue++;
        segments.push({ start: iso(a), end: iso(b), value, ongoing: b >= to && rawTo >= now });
      }
      if (value) trueMs += b - a; else falseMs += b - a;
    }
    return {
      plcId: m.id, plcName: m.name, metricId: ref.metricId, label: metric?.label || ref.metricId, role: metric?.role || null,
      segments,
      totals: { trueMs, falseMs, unknownMs: 0, transitionsToTrue, periodMs: to - from },
    };
  });
  return { meta: { timezone: TZ, fromUtc: iso(from), toUtc: iso(rawTo), nowUtc: iso(now) }, signals };
}

/* ───────────────────────── alarmas ───────────────────────── */

const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');
const plcRef = (m) => ({ plcThingName: m.thing, name: m.name });
const plantLite = () => ({ plantId: PLANT.plantId, name: PLANT.name });

const RULES = [
  { n: 1, plc: 'env1', metric: 'temp', name: 'Sobretemperatura en mordazas', operator: 'gt', value: 155, severity: 'high', window: 60 },
  { n: 2, plc: 'env1', metric: 'pres', name: 'Presión de aire baja', operator: 'lt', value: 5.5, severity: 'medium', window: 120 },
  { n: 3, plc: 'env1', metric: 'speed', name: 'Velocidad de línea baja', operator: 'lt', value: 60, severity: 'low', window: 300 },
  { n: 4, plc: 'env2', metric: 'temp', name: 'Sobretemperatura en mordazas', operator: 'gt', value: 155, severity: 'high', window: 60 },
  { n: 5, plc: 'env2', metric: 'pres', name: 'Presión de aire baja', operator: 'lt', value: 5.5, severity: 'medium', window: 120 },
  { n: 6, plc: 'llen', metric: 'pres', name: 'Presión de llenado fuera de rango', operator: 'outside', min: 2.4, max: 3.2, severity: 'high', window: 60 },
  { n: 7, plc: 'llen', metric: 'temp', name: 'Temperatura de producto alta', operator: 'gt', value: 22, severity: 'medium', window: 300 },
  { n: 8, plc: 'horno', metric: 'temp', name: 'Temperatura de cámara fuera de rango', operator: 'outside', min: 200, max: 230, severity: 'high', window: 180 },
  { n: 9, plc: 'horno', metric: 'pres', name: 'Presión de gas baja', operator: 'lt', value: 18, severity: 'critical', window: 30 },
];
const ruleId = (n) => `a7f0c3d2-91b4-4e6a-8d20-0000000000${String(n).padStart(2, '0')}`;

function alarmRules() {
  return RULES.map((r) => {
    const m = machineBy(r.plc);
    const metric = m[r.metric];
    return {
      id: ruleId(r.n), tenantId: TENANT.id, plantId: PLANT.id, plcId: m.id,
      metricId: metric.id, metricLabel: metric.label, name: r.name, operator: r.operator,
      thresholdValue: r.value ?? null, thresholdMin: r.min ?? null, thresholdMax: r.max ?? null,
      severity: r.severity, windowSeconds: r.window, cooldownSeconds: 600, hysteresisValue: null,
      messageTemplate: null, enabled: true, createdBy: actor('mantenimiento@plantademo.com'),
      createdAt: '2025-04-02T14:10:00.000Z', updatedAt: '2025-09-18T12:30:00.000Z',
      plc: plcRef(m), plant: plantLite(),
    };
  });
}

function alarmOf(m, a) {
  const rule = a.rule ? RULES.find((r) => r.n === a.rule) : null;
  const metric = rule ? m[rule.metric] : null;
  return {
    id: a.id, tenantId: TENANT.id, plantId: PLANT.id, plcId: m.id,
    source: rule ? 'rule' : 'plc', status: a.status, severity: a.severity,
    type: rule ? 'threshold' : 'plc_signal', message: a.message, fingerprint: null,
    ruleId: rule ? ruleId(rule.n) : null, metricId: metric?.id ?? null, metricLabel: metric?.label ?? null,
    triggerValue: a.triggerValue ?? null,
    thresholdValue: rule ? (rule.value ?? (a.triggerValue !== undefined && a.triggerValue < rule.min ? rule.min : rule.max)) : null,
    payloadJson: null, notes: a.notes ?? null,
    startedAt: iso(a.startedAt),
    acknowledgedAt: a.acknowledgedAt ? iso(a.acknowledgedAt) : null,
    acknowledgedBy: a.acknowledgedAt ? actor(a.ackBy) : null,
    resolvedAt: a.resolvedAt ? iso(a.resolvedAt) : null,
    resolvedBy: a.resolvedAt ? (a.resolvedBySystem ? actor(null, 'system') : actor(a.resolvedBy)) : null,
    createdAt: iso(a.startedAt), updatedAt: iso(a.resolvedAt || a.acknowledgedAt || a.startedAt),
    plc: plcRef(m), plant: plantLite(), rule: rule ? { id: ruleId(rule.n), name: rule.name } : null,
  };
}

const ALARM_IDS = { temp: 'c4d2e6f8-0a1b-4c3d-9e5f-000000000001', aire: 'c4d2e6f8-0a1b-4c3d-9e5f-000000000002', llenado: 'c4d2e6f8-0a1b-4c3d-9e5f-000000000003' };

/** Las tres alarmas sin resolver: dos de la Envasadora 1 y una de la Llenadora. */
function activeAlarms(now) {
  const boot = bootTime(now);
  const env1 = machineBy('env1');
  const llen = machineBy('llen');
  return [
    alarmOf(env1, {
      id: ALARM_IDS.temp, rule: 1, status: 'open', severity: 'high', startedAt: boot - 33 * MIN, triggerValue: 155.3,
      message: 'Sobretemperatura en mordazas: 155,3 °C (límite 155 °C)',
    }),
    alarmOf(env1, {
      id: ALARM_IDS.aire, rule: 2, status: 'acknowledged', severity: 'medium', startedAt: boot - 23 * MIN, triggerValue: 5.46,
      acknowledgedAt: boot - 19 * MIN, ackBy: USER.email,
      message: 'Presión de aire baja: 5,46 bar (mínimo 5,5 bar)',
    }),
    alarmOf(llen, {
      id: ALARM_IDS.llenado, rule: 6, status: 'acknowledged', severity: 'high', startedAt: boot - 51 * MIN, triggerValue: 2.37,
      acknowledgedAt: boot - 48 * MIN, ackBy: 'mantenimiento@plantademo.com',
      message: 'Presión de llenado fuera de rango: 2,37 bar (rango 2,4 a 3,2 bar)',
    }),
  ];
}

const STOP_ALARMS = {
  falta_film: ['Falta de film', 'medium'],
  atasco_mordazas: ['Atasco de producto en mordazas', 'high'],
  ajuste_fotocelda: ['Fotocelda de marca sin lectura', 'medium'],
  falta_botellas: ['Falta de botellas en la entrada', 'medium'],
  falla_valvula: ['Falla en válvula de llenado', 'high'],
  atasco_transporte: ['Atasco en transporte de entrada', 'medium'],
  falta_producto: ['Falta de producto en la entrada del horno', 'low'],
  falla_quemador: ['Falla de encendido en quemador', 'critical'],
};
const OPERATORS = ['operaciones@plantademo.com', 'mantenimiento@plantademo.com', 'turno.tarde@plantademo.com', 'turno.noche@plantademo.com'];

/** El historial: cada parada por falla o por falta de producto de los últimos 7 días dejó su alarma, ya resuelta. */
function historyAlarms(now) {
  const boot = bootTime(now);
  const hit = cache().get('history');
  if (hit) return hit;
  const out = [];
  const from = dayStartOf(now) - 6 * DAY;
  for (const m of MACHINES) {
    for (const s of stopsBetween(m, from, now, now)) {
      const def = STOP_ALARMS[s.reason.code];
      if (!def || s.ongoing || s.end > boot - 30 * MIN) continue;
      const h = hash(Math.floor(s.start / SEC) + m.seed);
      const system = h < 0.4;
      out.push(alarmOf(m, {
        id: `c4d2e6f8-0a1b-4c3d-9e5f-${String(Math.floor(s.start / SEC) % 1e12).padStart(12, '0')}`,
        status: 'resolved', severity: def[1], message: def[0],
        startedAt: s.start - 6 * SEC,
        acknowledgedAt: system ? null : s.start + (40 + Math.floor(h * 120)) * SEC, ackBy: OPERATORS[Math.floor(h * 97) % OPERATORS.length],
        resolvedAt: s.end + (15 + Math.floor(h * 90)) * SEC, resolvedBySystem: system, resolvedBy: OPERATORS[Math.floor(h * 97) % OPERATORS.length],
        notes: system ? null : `${s.reason.label}. Se normalizó y la máquina volvió a producir.`,
      }));
    }
  }
  out.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  cache().set('history', out);
  return out;
}

function alarmsHub(url, now) {
  const q = url.searchParams;
  const status = q.get('status');
  const severity = q.get('severity');
  const limit = Number(q.get('limit')) || 50;
  const offset = Number(q.get('offset')) || 0;
  const bySeverity = (a) => !severity || a.severity === severity;
  const active = activeAlarms(now).filter((a) => bySeverity(a) && (!status || a.status === status));
  const history = historyAlarms(now).filter((a) => bySeverity(a) && (!status || status === 'resolved'));
  return { active, history: history.slice(offset, offset + limit), historyTotal: history.length };
}

function activeCount(url, now) {
  const plcId = url.searchParams.get('plcId');
  const list = activeAlarms(now).filter((a) => !plcId || a.plcId === plcId);
  const bySeverity = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
  for (const a of list) bySeverity[a.severity]++;
  return { count: list.length, bySeverity };
}

/* ───────────────────────── incidentes ───────────────────────── */

function incidents(now) {
  const boot = bootTime(now);
  const today = dayStartOf(boot);
  const env1 = machineBy('env1'); const env2 = machineBy('env2'); const llen = machineBy('llen'); const horno = machineBy('horno');
  const active = activeAlarms(now);
  const related = (id) => {
    const a = active.find((x) => x.id === id);
    return a ? [{ alarm: { id: a.id, message: a.message, severity: a.severity, status: a.status, startedAt: a.startedAt } }] : [];
  };
  const item = (n, m, d) => {
    const id = `e9b1d4a6-2c3f-4a5b-8c7d-0000000000${String(n).padStart(2, '0')}`;
    const created = d.createdAt;
    const updated = d.updatedAt ?? created;
    return {
      id, tenantId: TENANT.id, plantId: PLANT.id, plcId: m.id, moduleType: 'incident', status: 'confirmed',
      title: d.title, summary: d.summary, severity: d.severity, occurredAt: iso(d.occurredAt ?? created),
      startAt: iso(d.occurredAt ?? created), endAt: d.endAt ? iso(d.endAt) : null, recordedAt: iso(created),
      createdBy: d.createdBy ?? actor(), createdAt: iso(created), updatedAt: iso(updated),
      incident: {
        actionId: id, status: d.status, category: d.category, impact: d.impact,
        rootCause: d.rootCause ?? null, correctiveAction: d.correctiveAction ?? null,
        createdAt: iso(created), updatedAt: iso(updated),
      },
      plant: plantLite(), plc: plcRef(m), relatedAlarms: d.related ?? [],
      revisions: (d.history ?? [['open', created, d.createdBy?.email ?? USER.email, 'Alta del incidente']]).map(([st, at, who, reason], i) => ({
        id: `${id}-r${i + 1}`, actionId: id, revisionNo: i + 1, changedBy: actor(who), changeReason: reason, changedAt: iso(at),
        afterJson: { status: st },
      })),
    };
  };
  return [
    item(1, llen, {
      title: 'Llenadora detenida por pérdida de presión de llenado',
      summary: 'La presión de llenado cayó de 2,8 a 2,1 bar y se detuvo la máquina para revisar la válvula N.º 3. Mantenimiento está cambiando el diafragma.',
      severity: 'high', status: 'open', category: 'maintenance', impact: 'high',
      createdAt: boot - 44 * MIN, updatedAt: boot - 21 * MIN, occurredAt: boot - 47 * MIN,
      related: related(ALARM_IDS.llenado),
      history: [
        ['open', boot - 44 * MIN, USER.email, 'Alta del incidente'],
        ['open', boot - 21 * MIN, 'mantenimiento@plantademo.com', 'Se confirma pérdida en el diafragma de la válvula N.º 3'],
      ],
    }),
    item(2, env1, {
      title: 'Sobretemperatura en mordazas de Envasadora 1',
      summary: 'La temperatura de mordazas subió de 148 °C a más de 155 °C en media hora, con la máquina en producción. Revisar el controlador de temperatura y la termocupla de la mordaza inferior.',
      severity: 'medium', status: 'reviewing', category: 'maintenance', impact: 'medium',
      createdAt: boot - 26 * MIN, updatedAt: boot - 12 * MIN, occurredAt: boot - 33 * MIN,
      related: related(ALARM_IDS.temp),
      history: [
        ['open', boot - 26 * MIN, USER.email, 'Alta del incidente'],
        ['reviewing', boot - 12 * MIN, 'mantenimiento@plantademo.com', 'Mantenimiento lo toma para revisar en la próxima parada'],
      ],
    }),
    item(3, env2, {
      title: 'Rechazos por sellado defectuoso en Envasadora 2',
      summary: 'Durante el turno tarde de ayer aparecieron paquetes con el sellado longitudinal abierto. Se ajustó la presión de mordazas; falta confirmar con calidad.',
      severity: 'medium', status: 'pending', category: 'quality', impact: 'medium',
      createdAt: today - 15 * HOUR, updatedAt: today - 13 * HOUR,
      history: [
        ['open', today - 15 * HOUR, 'turno.tarde@plantademo.com', 'Alta del incidente'],
        ['pending', today - 13 * HOUR, 'calidad@plantademo.com', 'A la espera del resultado del ensayo de hermeticidad'],
      ],
    }),
    item(4, llen, {
      title: 'Atascos repetidos en el transporte de entrada de la Llenadora',
      summary: 'Tres atascos en el mismo turno por botellas caídas en la curva de entrada.',
      severity: 'low', status: 'resolved', category: 'process', impact: 'low',
      rootCause: 'Guía lateral de la curva de entrada desalineada después del último cambio de formato.',
      correctiveAction: 'Se realineó la guía y se agregó el control al instructivo de cambio de formato.',
      createdAt: today - 2 * DAY + 3 * HOUR, updatedAt: today - 2 * DAY + 9 * HOUR, endAt: today - 2 * DAY + 9 * HOUR,
      history: [
        ['open', today - 2 * DAY + 3 * HOUR, USER.email, 'Alta del incidente'],
        ['resolved', today - 2 * DAY + 9 * HOUR, 'mantenimiento@plantademo.com', 'Guía realineada; sin atascos en las 4 horas siguientes'],
      ],
    }),
    item(5, horno, {
      title: 'Falla de encendido en quemador del Horno',
      summary: 'El quemador de la zona 2 no encendió en dos intentos seguidos al arrancar el turno.',
      severity: 'high', status: 'closed', category: 'maintenance', impact: 'high',
      rootCause: 'Electrodo de encendido con depósitos de carbón.',
      correctiveAction: 'Se limpió y calibró el electrodo. Se sumó la limpieza al plan de mantenimiento mensual.',
      createdAt: today - 4 * DAY + 1 * HOUR, updatedAt: today - 3 * DAY + 2 * HOUR, endAt: today - 4 * DAY + 3 * HOUR,
      history: [
        ['open', today - 4 * DAY + 1 * HOUR, 'turno.noche@plantademo.com', 'Alta del incidente'],
        ['resolved', today - 4 * DAY + 3 * HOUR, 'mantenimiento@plantademo.com', 'Electrodo limpio y calibrado'],
        ['closed', today - 3 * DAY + 2 * HOUR, USER.email, 'Verificado en tres arranques sin fallas'],
      ],
    }),
    item(6, env1, {
      title: 'Bobina de film con empalme defectuoso',
      summary: 'Un empalme mal pegado cortó el film y generó dos paradas por falta de film.',
      severity: 'low', status: 'closed', category: 'quality', impact: 'low',
      rootCause: 'Empalme de fábrica sin cinta de refuerzo en el lote recibido.',
      correctiveAction: 'Se reclamó el lote al proveedor y se revisan los empalmes en la recepción.',
      createdAt: today - 6 * DAY + 5 * HOUR, updatedAt: today - 5 * DAY + 4 * HOUR, endAt: today - 6 * DAY + 6 * HOUR,
      history: [
        ['open', today - 6 * DAY + 5 * HOUR, USER.email, 'Alta del incidente'],
        ['closed', today - 5 * DAY + 4 * HOUR, 'calidad@plantademo.com', 'Reclamo enviado al proveedor'],
      ],
    }),
  ];
}
const isOpenIncident = (i) => !['resolved', 'closed'].includes(i.incident.status);

function incidentList(url, now) {
  const q = url.searchParams;
  let list = incidents(now);
  if (q.get('status')) list = list.filter((i) => i.incident.status === q.get('status'));
  if (q.get('category')) list = list.filter((i) => i.incident.category === q.get('category'));
  if (q.get('plcId')) list = list.filter((i) => i.plcId === q.get('plcId'));
  const limit = Number(q.get('limit')) || 200;
  const offset = Number(q.get('offset')) || 0;
  return { incidents: list.slice(offset, offset + limit).map(({ revisions: _r, ...rest }) => rest), total: list.length };
}

/* ───────────────────────── paradas y producción (Operations Hub) ───────────────────────── */

function stopDay(m, now) {
  bootTime(now);
  const from = dayStartOf(now);
  const all = stopsBetween(m, from, now, now);
  // Una en curso que viene de la jornada anterior
  const carried = stopAt(m, from, now);
  if (carried && !all.includes(carried)) all.unshift(carried);
  let stoppedMs = 0; let microMs = 0; let micro = 0; let withReason = 0;
  const views = [];
  for (const s of all) {
    const start = Math.max(s.start, from);
    const end = Math.min(s.end, now);
    const dur = end - start;
    stoppedMs += dur;
    if (s.micro) { micro++; microMs += dur; continue; }
    if (s.hasReason) withReason++;
    const h = hash(Math.floor(s.start / SEC) + m.seed * 3);
    views.push({
      id: s.id, source: 'detected', startTs: iso(s.start), endTs: s.ongoing ? null : iso(s.end),
      status: s.ongoing ? 'ongoing' : 'ended', lastDataTs: null, durationMs: dur, startedBefore: s.start < from,
      reason: s.hasReason ? { code: s.reason.code, label: s.reason.label } : null,
      comment: s.ongoing ? 'Mantenimiento está cambiando el diafragma de la válvula N.º 3.' : (s.hasReason && h > 0.6 ? STOP_COMMENTS[s.reason.code] ?? null : null),
      reasonSetBy: s.hasReason ? actor(OPERATORS[Math.floor(h * 89) % OPERATORS.length]) : null,
      reasonSetAt: s.hasReason ? iso(Math.min(now, (s.ongoing ? s.start : s.end) + (2 + Math.floor(h * 9)) * MIN)) : null,
    });
  }
  const stops = views.length + micro;
  return {
    mode: 'detected',
    signal: { source: 'running', label: m.run.label },
    window: { from: iso(from), to: iso(from + DAY) },
    stops: views,
    microstops: { count: micro, totalMinutes: microMs / MIN },
    summary: {
      stops, withReason, withoutReason: views.length - withReason, microstops: micro,
      stoppedMinutes: stoppedMs / MIN, noDataMinutes: 0,
    },
  };
}
const STOP_COMMENTS = {
  falta_film: 'Se terminó la bobina antes de lo previsto.',
  cambio_bobina: 'Cambio de bobina programado.',
  atasco_mordazas: 'Se retiró producto atrapado y se limpió la mordaza.',
  ajuste_fotocelda: 'Se recalibró la fotocelda de marca.',
  limpieza: 'Limpieza de rutina del turno.',
  cambio_formato: 'Cambio de formato según el plan de producción.',
  falta_botellas: 'Demora en el despaletizado.',
  falla_valvula: 'Se reinició la válvula y retomó el ciclo.',
  atasco_transporte: 'Botella caída en la curva de entrada.',
  limpieza_cip: 'Ciclo CIP completo.',
  falta_producto: 'Demora en la línea de armado.',
  falla_quemador: 'Segundo intento de encendido correcto.',
};

function downtimeReasons(m) {
  const seen = new Set();
  return m.reasons.filter((r) => !seen.has(r.code) && seen.add(r.code)).map((r, i) => ({
    id: `f2a4c6e8-1b3d-4f5a-9c7e-${m.seed}00000000${String(i).padStart(2, '0')}`.slice(0, 36),
    tenantId: TENANT.id, plantId: PLANT.id, plcId: m.id, code: r.code, label: r.label, description: null,
    sortOrder: i, isActive: true, createdAt: CREATED_AT, updatedAt: CREATED_AT,
  }));
}

function hubRoles(m) {
  return {
    stopSignal: { source: 'running', metricId: m.run.id, label: m.run.label },
    produced: { metricId: m.prod.id, label: m.prod.label, unit: m.prodUnit },
    energy: { metricId: m.energy.id, label: m.energy.label, unit: 'kWh' },
  };
}

const PRODUCTS = {
  env1: ['Galletitas de agua 3×101 g', 'Galletitas dulces 150 g', 'Galletitas de salvado 200 g'],
  env2: ['Galletitas dulces 150 g', 'Bizcochos 180 g'],
  llen: ['Jugo de naranja 500 ml', 'Jugo de manzana 500 ml', 'Agua saborizada 1,5 l'],
  horno: ['Galletitas de agua', 'Galletitas dulces'],
};
const runId = (m, dayNo) => `0d1e2f3a-4b5c-4d6e-8f70-${String(m.seed).padStart(2, '0')}${String(dayNo).padStart(10, '0')}`;

function productionRun(m, dayStart, now) {
  const dayNo = Math.floor(dayStart / DAY);
  const open = dayStart === dayStartOf(now);
  const total = open ? counterAt(m, 'prod', now, now) : Math.floor(dayCum(m, dayStart, now).prod[1440]);
  const products = PRODUCTS[m.key];
  const end = dayStart + DAY;
  return {
    id: runId(m, dayNo), tenantId: TENANT.id, plantId: PLANT.id, plcId: m.id, metricId: m.prod.id,
    startTs: iso(dayStart + 40 * SEC), startValue: 0,
    endTs: open ? null : iso(end - 20 * SEC), endValue: open ? null : total,
    totalProduction: open ? null : total, status: open ? 'open' : 'closed', closeReason: open ? null : 'reset_detected',
    productId: products[dayNo % products.length], shiftId: null,
    notes: !open && hash(dayNo + m.seed) > 0.7 ? 'Jornada completa, sin novedades.' : null,
    metadataLockedFields: [], createdAt: iso(dayStart + 40 * SEC), updatedAt: iso(open ? now : end),
    liveProduction: total,
  };
}

function productionRuns(url, now) {
  bootTime(now);
  const q = url.searchParams;
  const m = machineBy(q.get('plcId'));
  const status = q.get('status');
  const limit = Number(q.get('limit')) || 10;
  const offset = Number(q.get('offset')) || 0;
  const today = dayStartOf(now);
  const HISTORY_DAYS = 28;
  const runs = [];
  if (status !== 'closed') runs.push(productionRun(m, today, now));
  if (status !== 'open') for (let i = 1; i <= HISTORY_DAYS; i++) runs.push(productionRun(m, today - i * DAY, now));
  return { runs: runs.slice(offset, offset + limit), nextCursor: null, total: runs.length };
}

function counterTotal(url, metricId, now) {
  bootTime(now);
  const m = machineBy(url.searchParams.get('plcId'));
  const metric = metricOf(m, metricId) || metricsOf(m)[0];
  const dayNo = Math.floor(dayStartOf(now) / DAY);
  const days = dayNo - 20150; // en marcha desde marzo de 2025
  const perDay = metric.kind === 'prod' ? m.nominal * 60 * 22.6 : metric.kind === 'rej' ? m.nominal * 60 * 22.6 * m.rejectRate : (m.power.idle + m.power.load) * 23;
  const which = ['prod', 'rej', 'energy'].includes(metric.kind) ? metric.kind : 'prod';
  const today = counterAt(m, which, now, now);
  return {
    totalSinceEver: Math.round(perDay * days) + today,
    firstEventTs: CREATED_AT, lastEventTs: iso(now - 2 * SEC), lastRawValue: today, resetCountAll: days,
  };
}

/* ───────────────────────── Argus: el reporte ───────────────────────── */

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function dayAndMonth(ms) {
  const d = new Date(ms + TZ_OFFSET);
  return `${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
}
const REPORT_REFRESH_MS = 6 * HOUR;
const MAX_REJECT_RATE = 1.5;

const KPI_LABELS = {
  produced: ['Producidas', 'u'], rejected: ['Rechazadas', 'u'], reject_rate: ['Tasa de rechazo', '%'],
  output_per_hour: ['Producción por hora', 'u/h'], line_speed_avg: ['Velocidad de línea promedio', null],
  running_minutes: ['Tiempo en producción', 'min'], stopped_minutes: ['Tiempo detenida', 'min'], stop_count: ['Paradas', null],
  starved_minutes: ['Tiempo con falta de producto', 'min'], fault_minutes: ['Tiempo en falla', 'min'],
  unknown_minutes: ['Tiempo sin datos de marcha', 'min'],
  energy_kwh: ['Energía consumida', 'kWh'], energy_per_unit: ['Energía por unidad', 'kWh/u'],
  alarms_total: ['Alarmas', null], alarms_critical: ['Alarmas críticas', null],
};

/** Lo medido de un equipo en [from, to). */
function measure(m, from, to, now) {
  const produced = countedBetween(m, 'prod', from, to, now);
  const rejected = countedBetween(m, 'rej', from, to, now);
  const energy = countedBetween(m, 'energy', from, to, now);
  const end = Math.min(to, now);
  let stoppedMs = 0; let starvedMs = 0; let faultMs = 0; let stops = 0;
  const all = stopsBetween(m, from, end, now);
  const carried = stopAt(m, from, now);
  if (carried && !all.includes(carried)) all.unshift(carried);
  for (const s of all) {
    const dur = Math.min(s.end, end) - Math.max(s.start, from);
    if (dur <= 0) continue;
    stops++; stoppedMs += dur;
    if (s.reason.kind === 'starved') starvedMs += dur;
    if (s.reason.kind === 'fault') faultMs += dur;
  }
  const alarms = [...historyAlarms(now), ...activeAlarms(now)].filter((a) => a.plcId === m.id && Date.parse(a.startedAt) >= from && Date.parse(a.startedAt) < end);
  return {
    produced, rejected, energy, stops, stoppedMs, starvedMs, faultMs, periodMs: end - from,
    alarms: alarms.length, critical: alarms.filter((a) => a.severity === 'critical').length,
  };
}
const sumMeasures = (list) => list.reduce((a, b) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + b[k]])));

function kpiValues(x, machines) {
  const runMin = (x.periodMs * machines - x.stoppedMs) / MIN;
  return {
    produced: x.produced,
    rejected: x.rejected,
    reject_rate: x.produced > 0 ? round((x.rejected / x.produced) * 100, 2) : null,
    output_per_hour: x.periodMs > 0 ? round(x.produced / (x.periodMs / HOUR), 0) : null,
    line_speed_avg: machines === 1 && runMin > 0 ? round(x.produced / runMin, 1) : null,
    running_minutes: round(runMin, 0),
    stopped_minutes: round(x.stoppedMs / MIN, 0),
    stop_count: x.stops,
    starved_minutes: round(x.starvedMs / MIN, 0),
    fault_minutes: round(x.faultMs / MIN, 0),
    unknown_minutes: 0,
    energy_kwh: round(x.energy, 0),
    energy_per_unit: x.produced > 0 ? round(x.energy / x.produced, 4) : null,
    alarms_total: x.alarms,
    alarms_critical: x.critical,
  };
}

function kpiSet(machines, period, previous, slots, now, units) {
  const of = (w) => kpiValues(sumMeasures(machines.map((m) => measure(m, w.from, w.to, now))), machines.length);
  const current = of(period);
  const before = previous ? of(previous) : {};
  const perSlot = slots.map((s) => of(s));
  const set = {};
  for (const [id, [label, unit]] of Object.entries(KPI_LABELS)) {
    if (current[id] === null && id === 'line_speed_avg') continue;
    set[id] = {
      id, label,
      unit: id === 'line_speed_avg' ? units.speed : (unit === 'u' ? units.unit : unit === 'u/h' ? `${units.unit}/h` : unit === 'kWh/u' ? `kWh/${units.unit}` : unit),
      value: current[id], previous: before[id] ?? null,
      goal: id === 'reject_rate' ? MAX_REJECT_RATE : id === 'line_speed_avg' && machines.length === 1 ? machines[0].nominal : null,
      series: slots.map((s, i) => ({ ts: iso(s.from), value: perSlot[i][id] })),
      coverage: 1,
    };
  }
  return set;
}

/** Cuándo se generó el último reporte de la sesión: unos 15 minutos antes de entrar. */
function latestReportTime(now) {
  const boot = bootTime(now);
  return Math.floor((boot - 14 * MIN) / (5 * MIN)) * (5 * MIN);
}

function reportWindow(generatedAt) {
  const day = dayStartOf(generatedAt);
  if (generatedAt - day >= 3 * HOUR) {
    return { from: day, to: generatedAt, label: `${dayAndMonth(day)}, ${hhmm(day)} a ${hhmm(generatedAt)}` };
  }
  return { from: day - DAY, to: day, label: dayAndMonth(day - DAY) };
}

const TOPICS = [
  ['production', 'Producción', true], ['quality', 'Calidad', true], ['downtime', 'Paradas', true],
  ['predictive_maintenance', 'Mantenimiento predictivo', false, { kind: 'role', mode: 'any', keys: ['run_hours', 'condition'], label: 'Horas de marcha o Condición del equipo' }],
  ['anomalies', 'Anomalías', true], ['energy', 'Energía', true],
  ['costs', 'Costos', false, { kind: 'goal', keys: ['rejectUnitCost', 'downtimeHourCost', 'energyCostPerKwh'], label: 'los costos del cliente' }],
  ['alarms', 'Alarmas', true], ['trends', 'Tendencias', true],
];

const reportIdOf = (generatedAt) => `5a6b7c8d-9e0f-4a1b-8c2d-${String(Math.floor(generatedAt / MIN)).padStart(12, '0')}`;

function buildReport(generatedAt, now, latest) {
  const period = reportWindow(generatedAt);
  const span = period.to - period.from;
  const previous = { from: period.from - span, to: period.from };
  const step = span > 8 * HOUR ? HOUR : 30 * MIN;
  const slots = [];
  for (let t = period.from; t < period.to; t += step) slots.push({ from: t, to: Math.min(t + step, period.to) });
  // El reporte se congela en su hora: lo que pasó después no cuenta
  const at = generatedAt;
  const equipment = MACHINES.map((m) => ({
    plcId: m.id, name: m.name, state: { ...equipmentState(m, latest ? now : at), asOf: iso(at - 4 * SEC) },
    kpis: kpiSet([m], period, previous, slots, at, { unit: m.prodUnit, speed: m.speedUnit }),
  }));
  const plantKpis = kpiSet(MACHINES, period, previous, slots, at, { unit: 'u', speed: null });
  const facts = {
    formatVersion: 1, scope: 'plant',
    period: { from: iso(period.from), to: iso(period.to), timezone: TZ, label: period.label },
    previousPeriod: { from: iso(previous.from), to: iso(previous.to) },
    generatedAt: iso(generatedAt),
    plants: [{ plantId: PLANT.id, name: PLANT.name, timezone: TZ, equipment, kpis: plantKpis }],
    totals: plantKpis,
    topics: TOPICS.map(([topic, label, active, missing]) => ({
      topic, label, active, missing: missing ? [missing] : [],
      boosters: topic === 'production'
        ? [{ kind: 'role', role: 'line_speed', present: true, label: 'Velocidad de línea' }, { kind: 'role', role: 'running', present: true, label: 'En producción' }]
        : topic === 'downtime'
          ? [{ kind: 'role', role: 'product_starved', present: true, label: 'Falta de producto' }, { kind: 'role', role: 'machine_fault', present: true, label: 'Falla de máquina' }]
          : [],
    })),
    coverage: ['sin_costos', 'sin_documentos'],
    goals: { maxRejectRate: MAX_REJECT_RATE },
  };
  return {
    id: reportIdOf(generatedAt),
    generatedAt: iso(generatedAt),
    periodStart: iso(period.from), periodEnd: iso(period.to),
    timezone: TZ, operationalDayStartMinutes: DAY_START_MIN,
    facts,
    narrative: latest ? latestNarrative(facts, generatedAt, now) : routineNarrative(facts),
    executedActions: [],
    findingFeedback: latest ? [{ findingId: 'f1', useful: true }] : [],
    refreshIntervalMs: REPORT_REFRESH_MS,
  };
}

const num = (v) => new Intl.NumberFormat('es-AR').format(v);
function minutesText(min) {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  return m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.floor(m / 60)} h`;
}

/** El relato del reporte de ahora: la Llenadora detenida y las dos alarmas de la Envasadora 1. */
function latestNarrative(facts, generatedAt, now) {
  const boot = bootTime(now);
  const eq = (key) => facts.plants[0].equipment.find((e) => e.plcId === machineBy(key).id);
  const env1 = eq('env1'); const env2 = eq('env2'); const llen = eq('llen'); const horno = eq('horno');
  const total = facts.totals;
  const stopStart = boot - machineBy('llen').stoppedNow.sinceMin * MIN;
  const stoppedFor = Math.round((generatedAt - stopStart) / MIN);
  const tempNow = fmt(tempAt(machineBy('env1'), generatedAt, now), 1);
  const presNow = fmt(presAt(machineBy('env1'), generatedAt, now), 2);
  const speedNow = fmt(speedAt(machineBy('env1'), generatedAt, now), 0);
  const rate = fmt(total.reject_rate.value, 2);
  const window = (fromMs) => ({ from: iso(Math.max(fromMs, Date.parse(facts.period.from))), to: facts.period.to });
  return {
    formatVersion: 1,
    status: 'warning',
    headline: `La Llenadora está detenida desde las ${hhmm(stopStart)} por una caída en la presión de llenado, y la Envasadora 1 trabaja con dos alarmas activas. La Envasadora 2 y el Horno producen sin desvíos.`,
    findings: [
      {
        id: 'f1', severity: 'critical', topic: 'downtime', plantId: PLANT.id, plcId: llen.plcId,
        title: 'La Llenadora está detenida',
        text: `Lleva ${stoppedFor} min detenida para revisar la válvula de llenado, después de que la presión cayó de 2,8 a 2,1 bar. En el período acumula ${minutesText(llen.kpis.stopped_minutes.value)} sin producir en ${llen.kpis.stop_count.value} paradas.`,
        evidence: { kpi: 'stopped_minutes', plcId: llen.plcId, window: window(stopStart - 30 * MIN) },
        why: `Cada hora detenida son unas ${num(Math.round(machineBy('llen').nominal * 60 / 100) * 100)} botellas que no se llenan.`,
      },
      {
        id: 'f2', severity: 'warning', topic: 'anomalies', plantId: PLANT.id, plcId: env1.plcId,
        title: 'Las mordazas de la Envasadora 1 se están calentando',
        text: `La temperatura de mordazas subió de 148 °C a ${tempNow} °C en la última media hora y pasó el límite de 155 °C. La máquina sigue en producción a ${speedNow} paq/min.`,
        evidence: { kpi: 'alarms_total', plcId: env1.plcId, window: window(boot - 55 * MIN) },
        why: 'Por encima del límite el sellado puede quemar el film y subir los rechazos.',
      },
      {
        id: 'f3', severity: 'warning', topic: 'alarms', plantId: PLANT.id, plcId: env1.plcId,
        title: 'Presión de aire baja en la Envasadora 1',
        text: `La presión de aire bajó a ${presNow} bar, por debajo del mínimo de 5,5 bar, y la alarma sigue activa. Hasta ahora la velocidad de línea no cambió.`,
        evidence: { kpi: 'line_speed_avg', plcId: env1.plcId, window: window(boot - 40 * MIN) },
        why: 'Con poca presión las mordazas cierran con menos fuerza y el sellado pierde hermeticidad.',
      },
      {
        id: 'f4', severity: 'info', topic: 'quality', plantId: PLANT.id, plcId: null,
        title: 'El rechazo de la planta está dentro de la meta',
        text: `La planta rechazó el ${rate} % de lo producido, por debajo de la meta de 1,5 %. La Envasadora 1 es la que más rechaza, con ${fmt(env1.kpis.reject_rate.value, 2)} %.`,
        evidence: { kpi: 'reject_rate', plcId: null, window: null },
        why: null,
      },
      {
        id: 'f5', severity: 'info', topic: 'production', plantId: PLANT.id, plcId: env2.plcId,
        title: 'La Envasadora 2 y el Horno trabajan parejo',
        text: `La Envasadora 2 produjo ${num(env2.kpis.produced.value)} paquetes y el Horno ${num(horno.kpis.produced.value)} bandejas, con ${minutesText(env2.kpis.stopped_minutes.value + horno.kpis.stopped_minutes.value)} detenidas entre las dos.`,
        evidence: { kpi: 'produced', plcId: env2.plcId, window: null },
        why: null,
      },
    ],
    actions: [
      { id: 'a1', text: 'Revisar el controlador de temperatura de las mordazas de la Envasadora 1 antes de que suban los rechazos.', findingIds: ['f2'], kind: 'none' },
      { id: 'a2', text: 'Registrar un incidente por la presión de aire baja en la Envasadora 1.', findingIds: ['f3'], kind: 'create_incident' },
      { id: 'a3', text: 'Completar el motivo de las paradas de hoy que quedaron sin cargar.', findingIds: ['f1'], kind: 'open_downtime' },
    ],
    plantStatuses: [{ plantId: PLANT.id, status: 'warning', reason: 'Un equipo detenido y dos alarmas activas en la Envasadora 1.' }],
  };
}

/** El relato de un reporte anterior: una jornada sin novedades. */
function routineNarrative(facts) {
  const total = facts.totals;
  const worst = [...facts.plants[0].equipment].sort((a, b) => b.kpis.stopped_minutes.value - a.kpis.stopped_minutes.value)[0];
  return {
    formatVersion: 1,
    status: 'ok',
    headline: `La planta produjo ${num(total.produced.value)} unidades con ${fmt(total.reject_rate.value, 2)} % de rechazo, dentro de la meta. No hubo alarmas críticas en el período.`,
    findings: [
      {
        id: 'f1', severity: 'info', topic: 'production', plantId: PLANT.id, plcId: null,
        title: 'Producción dentro de lo esperado',
        text: `Los cuatro equipos sumaron ${num(total.produced.value)} unidades, a ${num(total.output_per_hour.value)} por hora.`,
        evidence: { kpi: 'produced', plcId: null, window: null }, why: null,
      },
      {
        id: 'f2', severity: 'info', topic: 'downtime', plantId: PLANT.id, plcId: worst.plcId,
        title: `${worst.name} fue el equipo con más tiempo detenido`,
        text: `Estuvo ${minutesText(worst.kpis.stopped_minutes.value)} sin producir en ${worst.kpis.stop_count.value} paradas, la mayoría programadas.`,
        evidence: { kpi: 'stopped_minutes', plcId: worst.plcId, window: null }, why: null,
      },
    ],
    actions: [],
    plantStatuses: [{ plantId: PLANT.id, status: 'ok', reason: 'Sin desvíos en el período.' }],
  };
}

function reportTimes(now) {
  const latest = latestReportTime(now);
  const grid = Math.floor((latest - 1) / REPORT_REFRESH_MS) * REPORT_REFRESH_MS;
  const times = [latest];
  for (let i = 0; i < 8; i++) times.push(grid - i * REPORT_REFRESH_MS);
  return times;
}
function reportById(id, now) {
  const times = reportTimes(now);
  const t = times.find((x) => reportIdOf(x) === id) ?? times[0];
  return buildReport(t, now, t === times[0]);
}
function reportList(now) {
  return {
    reports: reportTimes(now).map((t) => ({ id: reportIdOf(t), generatedAt: iso(t), periodLabel: reportWindow(t).label })),
  };
}

/* ───────────────────────── Argus: el chat ───────────────────────── */

const fence = (type, json) => '```argus-' + type + '\n' + JSON.stringify(json) + '\n```';
const CONV_IDS = ['3c4d5e6f-7a8b-4c9d-8e0f-000000000001', '3c4d5e6f-7a8b-4c9d-8e0f-000000000002', '3c4d5e6f-7a8b-4c9d-8e0f-000000000003'];

function answerLlenadora(now) {
  const boot = bootTime(now);
  const m = machineBy('llen');
  const start = boot - m.stoppedNow.sinceMin * MIN;
  return [
    `La **Llenadora** está detenida desde las **${hhmm(start)}**. La secuencia fue así:`,
    '',
    `1. A las ${hhmm(boot - 58 * MIN)} la presión de llenado empezó a caer desde 2,8 bar.`,
    `2. A las ${hhmm(boot - 51 * MIN)} saltó la alarma **Presión de llenado fuera de rango** (2,37 bar, rango 2,4 a 3,2).`,
    `3. A las ${hhmm(start)} se detuvo la máquina con el motivo **Revisión de válvula de llenado**.`,
    '',
    fence('kpi', [
      { label: 'Tiempo detenida', value: String(Math.round((now - start) / MIN)), unit: 'min', status: 'critical' },
      { label: 'Presión de llenado', value: fmt(presAt(m, now, now), 2), unit: 'bar', status: 'warning' },
      { label: 'Botellas hoy', value: num(counterAt(m, 'prod', now, now)) },
    ]),
    '',
    'Hay un incidente abierto de mantenimiento: están cambiando el diafragma de la válvula N.º 3.',
    '',
    fence('suggestions', ['¿Cuántas botellas se perdieron por esta parada?', '¿Cómo viene la Envasadora 1?', 'Mostrame las paradas de hoy de la Llenadora']),
  ].join('\n');
}

function answerEnvasadora(now) {
  const boot = bootTime(now);
  const m = machineBy('env1');
  const points = [];
  for (let t = now - 60 * MIN; t <= now; t += 10 * MIN) points.push({ label: hhmm(t), value: round(tempAt(m, t, now), 1) });
  return [
    `La **Envasadora 1** está en producción a **${fmt(speedAt(m, now, now), 0)} paq/min**, pero tiene dos alarmas activas:`,
    '',
    fence('table', {
      title: 'Alarmas activas de la Envasadora 1',
      headers: ['Alarma', 'Desde', 'Valor', 'Límite'],
      rows: [
        ['Sobretemperatura en mordazas', hhmm(boot - 33 * MIN), `${fmt(tempAt(m, now, now), 1)} °C`, '155 °C'],
        ['Presión de aire baja', hhmm(boot - 23 * MIN), `${fmt(presAt(m, now, now), 2)} bar`, '5,5 bar'],
      ],
    }),
    '',
    'La temperatura de mordazas venía estable en 148 °C y empezó a subir hace unos 50 minutos:',
    '',
    fence('chart', { type: 'line', title: 'Temperatura de mordazas, última hora', unit: '°C', data: points }),
    '',
    `Hoy lleva **${num(counterAt(m, 'prod', now, now))} paquetes** con ${fmt((counterAt(m, 'rej', now, now) / Math.max(1, counterAt(m, 'prod', now, now))) * 100, 2)} % de rechazo, dentro de la meta de 1,5 %. Conviene revisar el controlador de temperatura antes de que el sellado empiece a fallar.`,
  ].join('\n');
}

function answerProduction(now) {
  return [
    'Así viene la producción de hoy, desde las 06:00:',
    '',
    fence('table', {
      title: 'Producción del día por equipo',
      headers: ['Equipo', 'Producido', 'Rechazo', 'Tiempo detenido'],
      rows: MACHINES.map((m) => {
        const x = measure(m, dayStartOf(now), now, now);
        return [m.name, `${num(x.produced)} ${m.prodUnit}`, `${fmt(x.produced ? (x.rejected / x.produced) * 100 : 0, 2)} %`, minutesText(x.stoppedMs / MIN)];
      }),
    }),
    '',
    fence('chart', {
      type: 'bar', title: 'Envasadora 1: paquetes por hora', unit: 'paq',
      data: (() => {
        const m = machineBy('env1'); const out = [];
        const last = Math.floor(now / HOUR) * HOUR;
        for (let t = Math.max(dayStartOf(now), last - 7 * HOUR); t < last; t += HOUR) out.push({ label: hhmm(t), value: countedBetween(m, 'prod', t, t + HOUR, now) });
        return out;
      })(),
    }),
    '',
    'La Llenadora es la única por debajo de lo esperado: está detenida por la revisión de la válvula de llenado.',
  ].join('\n');
}

function answerSummary(now) {
  const active = activeAlarms(now);
  return [
    'Este es el estado de **Planta Pilar** ahora:',
    '',
    fence('kpi', [
      { label: 'Equipos en marcha', value: '3', unit: 'de 4' },
      { label: 'Alarmas activas', value: String(active.length), status: 'warning' },
      { label: 'Detenidos', value: '1', status: 'critical' },
    ]),
    '',
    '- **Envasadora 1**: en producción, con sobretemperatura en mordazas y presión de aire baja.',
    '- **Envasadora 2**: en producción, sin alarmas.',
    '- **Llenadora**: detenida por revisión de la válvula de llenado.',
    '- **Horno**: en producción, sin alarmas.',
    '',
    fence('suggestions', ['¿Por qué está detenida la Llenadora?', '¿Cómo viene la Envasadora 1?', '¿Cómo viene la producción de hoy?']),
  ].join('\n');
}

/** Qué responde Argus a un mensaje: por palabras clave. */
function chatAnswer(content, now) {
  const text = String(content || '').toLowerCase();
  if (/llenadora|botella|v[aá]lvula|llenado/.test(text)) return { tools: ['get_plc_status', 'get_downtime', 'get_alarms'], answer: answerLlenadora(now) };
  if (/envasadora 1|mordaza|temperatura|aire|presi[oó]n/.test(text)) return { tools: ['get_realtime_values', 'get_alarms', 'get_metric_data'], answer: answerEnvasadora(now) };
  if (/producci[oó]n|produj|cu[aá]nto|paquete|rechazo/.test(text)) return { tools: ['get_metric_catalog', 'get_metric_data'], answer: answerProduction(now) };
  return { tools: ['get_plc_status', 'get_alarms'], answer: answerSummary(now) };
}

function conversations(now) {
  const boot = bootTime(now);
  const today = dayStartOf(boot);
  return [
    { id: CONV_IDS[0], plantId: PLANT.id, title: '¿Por qué está detenida la Llenadora?', messageCount: 4, createdAt: iso(boot - 11 * MIN), updatedAt: iso(boot - 8 * MIN) },
    { id: CONV_IDS[1], plantId: PLANT.id, title: 'Producción de hoy por equipo', messageCount: 2, createdAt: iso(boot - 3 * HOUR), updatedAt: iso(boot - 3 * HOUR + MIN) },
    { id: CONV_IDS[2], plantId: PLANT.id, title: 'Estado general de la planta', messageCount: 2, createdAt: iso(today - 5 * HOUR), updatedAt: iso(today - 5 * HOUR + MIN) },
  ];
}

function conversationDetail(id, now) {
  const boot = bootTime(now);
  const list = conversations(now);
  const conversation = list.find((c) => c.id === id);
  if (!conversation) {
    return { conversation: { id, plantId: PLANT.id, title: null, messageCount: 0, createdAt: iso(now), updatedAt: iso(now) }, messages: [] };
  }
  const msg = (n, role, content, at) => ({ id: `${id}-m${n}`, role, content, actionId: null, createdAt: iso(at) });
  let messages;
  if (id === CONV_IDS[0]) {
    // Se congela en la hora de la conversación
    const at = boot - 8 * MIN;
    messages = [
      msg(1, 'user', '¿Por qué está detenida la Llenadora?', boot - 11 * MIN),
      msg(2, 'assistant', answerLlenadora(boot - 10 * MIN), boot - 10 * MIN),
      msg(3, 'user', '¿Cómo viene la Envasadora 1?', boot - 9 * MIN),
      msg(4, 'assistant', answerEnvasadora(at), at),
    ];
  } else if (id === CONV_IDS[1]) {
    const at = boot - 3 * HOUR;
    messages = [msg(1, 'user', '¿Cómo viene la producción de hoy?', at), msg(2, 'assistant', answerProduction(at + MIN), at + MIN)];
  } else {
    const at = Date.parse(conversation.createdAt);
    messages = [
      msg(1, 'user', '¿Cómo está la planta?', at),
      msg(2, 'assistant', 'Los cuatro equipos de **Planta Pilar** están en producción y no hay alarmas activas. La jornada viene dentro de lo esperado.', at + MIN),
    ];
  }
  return { conversation, messages };
}

/**
 * La respuesta del chat como eventos SSE: lo que manda
 * POST /api/ai/chat/conversations/:id/messages. Cada evento es
 * `event: <nombre>\ndata: <JSON>\n\n`; `delayMs` es cuánto esperar antes de mandarlo.
 */
export function chatStream(body, now = Date.now()) {
  const { tools, answer } = chatAnswer(body?.content, now);
  const events = [{ delayMs: 350, event: 'iteration', data: { iteration: 1 } }];
  for (const tool of tools) {
    events.push({ delayMs: 250, event: 'tool_start', data: { tool, input: {} } });
    events.push({ delayMs: 650, event: 'tool_end', data: { tool, isError: false } });
  }
  // De a pocas palabras; un bloque argus-* va entero, como lo escribe el modelo
  const pieces = [];
  for (const line of answer.split('\n')) {
    if (line.startsWith('```') || line.startsWith('[') || line.startsWith('{')) pieces.push(`${line}\n`);
    else {
      const words = line.split(' ');
      for (let i = 0; i < words.length; i += 3) pieces.push(words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '\n'));
    }
  }
  pieces.forEach((delta, i) => events.push({ delayMs: i === 0 ? 300 : 45, event: 'text_delta', data: { delta } }));
  events.push({ delayMs: 120, event: 'done', data: { messageId: `msg-${Math.floor(now / SEC)}` } });
  return events;
}
const sseChunk = (e) => ({ delayMs: e.delayMs, data: `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n` });

/* ───────────────────────── WebSocket ───────────────────────── */

/** Lo que el servidor responde al `{ type: 'auth', token, filters }` del cliente. */
export const WS_AUTHENTICATED = { type: 'authenticated', clientId: 'demo', message: 'Connected to IoT Telemetry WebSocket' };

/** Cada cuánto conviene llamar a `wsMessages` (ms). */
export const WS_TICK_MS = 500;

/**
 * Cuánto hay que demorar una respuesta (ms). El tablero se demora más que un
 * tick del WebSocket a propósito: los indicadores (gauge) tienen que nacer
 * con su primera lectura ya recibida. Si nacen sin valor y el valor llega
 * después, ECharts se rompe al pasar de «sin aguja» a «con aguja» y la
 * pantalla muestra «Algo salió mal».
 */
export function responseDelayMs(method, pathname) {
  if (method === 'GET' && /^\/tenants\/[^/]+\/plants\/[^/]+\/plcs\/[^/]+\/dashboard$/.test(pathname)) return WS_TICK_MS + 250;
  return 0;
}

/**
 * Los mensajes que el servidor emite en el instante `now` (ms). Llamala cada
 * `WS_TICK_MS`, después de responder `WS_AUTHENTICATED`:
 *  - siempre: un `telemetry` por equipo, con el valor de cada métrica, y un
 *    `production_update` por equipo en marcha;
 *  - cada 10 s (cuando entre `sinceMs` y `now` se cruza un múltiplo de 10 s):
 *    un `aggregated_update` por métrica, que hace que los gráficos y las
 *    líneas de estado vuelvan a pedir sus datos.
 */
export function wsMessages(now = Date.now(), sinceMs = now - WS_TICK_MS) {
  bootTime(now);
  const out = [];
  for (const m of MACHINES) {
    const values = {};
    for (const metric of metricsOf(m)) values[metric.id] = { value: valueAt(m, metric.kind, now, now), quality: true, ts: now };
    out.push({ type: 'telemetry', tenantId: TENANT.id, plantId: PLANT.id, plcId: m.id, plcThingName: m.thing, gatewayId: 'gw-pilar-01', ts: now, values });
    // El contador de producción también avisa su corrida (la sección Producción del Hub)
    if (values[m.prod.id].value > 0 && !stopAt(m, now, now)) {
      const produced = values[m.prod.id].value;
      out.push({
        type: 'production_update', tenantId: TENANT.id, plantId: PLANT.id, plcId: m.id, metricId: m.prod.id,
        runId: runId(m, Math.floor(dayStartOf(now) / DAY)), rawValue: produced, totalProduction: produced, isReset: false, ts: now,
      });
    }
  }
  if (Math.floor(now / (10 * SEC)) !== Math.floor(sinceMs / (10 * SEC))) {
    const bucket = iso(Math.floor(now / MIN) * MIN);
    for (const m of MACHINES) {
      for (const metric of metricsOf(m)) {
        out.push({
          type: 'aggregated_update', tenantId: TENANT.id, plantId: PLANT.id, plcId: m.id, metricId: metric.id,
          ...(metric.valueType === 'state' ? {} : { bucket, intervalMinutes: 1 }),
        });
      }
    }
  }
  return out;
}

/* ───────────────────────── rutas ───────────────────────── */

const nowOf = () => Date.now();

export default {
  // Sesión y arranque
  'GET /api/admin/access': { allowed: false, adminOnly: false, role: USER.role },
  'GET /api/me/permissions': { role: USER.role, capabilities: Object.fromEntries(CAPABILITIES.map((c) => [c, true])) },
  'GET /api/me/tutorial-completed': { tutorialCompleted: true, tutorialCompletedAt: '2025-03-12T14:20:00.000Z' },
  'POST /api/me/tutorial-completed': { tutorialCompleted: true },
  'GET /api/tenants/me': { ...TENANT },
  'GET /api/sites': () => ({
    plants: [{ id: PLANT.id, plantId: PLANT.plantId, province: PLANT.province, name: PLANT.name, timezone: TZ, operationalDayStartMinutes: DAY_START_MIN, plcs: sitePlcs() }],
    userRole: USER.role,
  }),
  'GET /api/plcs/by-plant/*': () => plcRecords(nowOf()),
  'GET /health': { status: 'ok', db: 'ok', redis: 'ok', mqtt: 'ok' },

  // Activos
  'GET /api/plcs/overview': () => overview(nowOf()),

  // Mediciones
  'GET /tenants/*/plants/*/plcs/*/dashboard': (url) => dashboardOf(machineBy(decodeURIComponent(url.pathname.split('/')[6]))),
  'GET /api/dashboard-overrides/*': (url) => ({ dashboardId: url.pathname.split('/').pop(), overrides: { version: 1, widgets: {} }, updatedAt: null }),
  'PUT /api/dashboard-overrides/*': (url, _req, body) => {
    const widgets = {};
    if (body?.patch?.widgetId && body.patch.value !== null) widgets[body.patch.widgetId] = { [body.patch.key]: body.patch.value };
    return { dashboardId: url.pathname.split('/').pop(), overrides: { version: 1, widgets }, updatedAt: iso(nowOf()) };
  },
  'POST /api/telemetry/series-data': (_url, _req, body) => seriesData(body, nowOf()),
  'POST /api/telemetry/state-timeline': (_url, _req, body) => stateTimeline(body, nowOf()),

  // Acciones (Operations Hub)
  'GET /api/alarms/hub': (url) => alarmsHub(url, nowOf()),
  'GET /api/alarms/active-count': (url) => activeCount(url, nowOf()),
  'GET /api/alarms/rules': (url) => alarmRules().filter((r) => !url.searchParams.get('plcId') || r.plcId === url.searchParams.get('plcId')),
  'POST /api/alarms/*/acknowledge': (url) => {
    const now = nowOf();
    const a = [...activeAlarms(now), ...historyAlarms(now)].find((x) => x.id === url.pathname.split('/')[3]);
    return { ...(a || {}), status: 'acknowledged', acknowledgedAt: iso(now), acknowledgedBy: actor() };
  },
  'POST /api/alarms/*/resolve': (url, _req, body) => {
    const now = nowOf();
    const a = [...activeAlarms(now), ...historyAlarms(now)].find((x) => x.id === url.pathname.split('/')[3]);
    return { ...(a || {}), status: 'resolved', resolvedAt: iso(now), resolvedBy: actor(), notes: body?.notes ?? null };
  },
  'GET /api/incidents': (url) => incidentList(url, nowOf()),
  'GET /api/incidents/open-count': (url) => ({
    count: incidents(nowOf()).filter((i) => isOpenIncident(i) && (!url.searchParams.get('plcId') || i.plcId === url.searchParams.get('plcId'))).length,
  }),
  'GET /api/incidents/*': (url) => {
    const list = incidents(nowOf());
    return list.find((i) => i.id === url.pathname.split('/').pop()) || list[0];
  },
  'GET /api/actions/*/*/hub-config': { sections: ['ops.widget-config', 'ops.actions', 'ops.production'], modules: ['downtime'] },
  'GET /api/actions/*/*/hub-roles': (url) => hubRoles(machineBy(url.pathname.split('/')[4])),
  'GET /api/actions/*/*/downtime-reasons': (url) => downtimeReasons(machineBy(url.pathname.split('/')[4])),
  'GET /api/actions/*/*/stops': (url) => stopDay(machineBy(url.pathname.split('/')[4]), nowOf()),
  'GET /api/actions/*/*/stops/summary': (url) => {
    const day = stopDay(machineBy(url.pathname.split('/')[4]), nowOf());
    return { mode: day.mode, window: day.window, summary: day.summary };
  },
  'PUT /api/actions/stops/*/reason': (_url, _req, body) => ({ ok: true, reasonCode: body?.reasonCode ?? null, comment: body?.comment ?? null }),
  'GET /api/telemetry/runs': (url) => productionRuns(url, nowOf()),
  'GET /api/telemetry/counters/*/total': (url) => counterTotal(url, decodeURIComponent(url.pathname.split('/')[4]), nowOf()),
  'GET /api/telemetry/counters/*/events': { events: [], nextCursor: null },

  // IA (Argus): el reporte
  'GET /api/ai/insights/company': { status: 'disabled', message: 'El resumen de compañía no está habilitado.', reason: 'company_off' },
  'GET /api/ai/insights/company/reports': { reports: [] },
  'GET /api/ai/insights/*': () => { const now = nowOf(); return buildReport(latestReportTime(now), now, true); },
  'GET /api/ai/insights/*/reports': () => reportList(nowOf()),
  'GET /api/ai/insights/*/reports/*': (url) => reportById(url.pathname.split('/').pop(), nowOf()),
  'PUT /api/ai/insights/reports/*/findings/*/feedback': (_url, _req, body) => ({ useful: body?.useful ?? null }),
  'POST /api/ai/insights/reports/*/actions/*': () => ({
    status: 'done', kind: 'create_incident', result: { incidentId: 'e9b1d4a6-2c3f-4a5b-8c7d-000000000007' },
    message: 'Se creó el incidente.',
  }),

  // IA (Argus): el chat
  'GET /api/ai/chat/status': { hasChat: true, available: true },
  'GET /api/ai/chat/conversations': () => ({ conversations: conversations(nowOf()) }),
  'POST /api/ai/chat/conversations': () => {
    const now = nowOf();
    return { id: `3c4d5e6f-7a8b-4c9d-8e0f-${String(Math.floor(now / SEC) % 1e12).padStart(12, '0')}`, plantId: PLANT.id, title: null, messageCount: 0, createdAt: iso(now), updatedAt: iso(now) };
  },
  'GET /api/ai/chat/conversations/*': (url) => conversationDetail(url.pathname.split('/').pop(), nowOf()),
  // Stream SSE: el servidor de ejemplo manda cada `data` después de su `delayMs`
  'POST /api/ai/chat/conversations/*/messages': (_url, _req, body) => ({
    __stream: { contentType: 'text/event-stream', chunks: chatStream(body, nowOf()).map(sseChunk) },
  }),
  'POST /api/ai/chat/conversations/*/confirm-action': { ok: true, message: 'Listo.' },
  'POST /api/ai/chat/conversations/*/cancel-action': { ok: true, message: 'Acción cancelada.' },
};
