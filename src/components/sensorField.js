// La red de sensores del fondo de la web, dibujada con un shader (WebGL, sin librerías).
//
// Una grilla de puntos casi invisible, como los sensores de una planta. Cada tanto uno
// manda un pulso: salta de punto en punto en horizontal y después derecho hasta la
// plataforma más cercana (el filo del marco del hero, o un video), y se apaga al entrar.
// Muchas fuentes que llegan a un solo lugar: tus máquinas mandando datos a la plataforma
// (la misma idea que el >< de la marca). Con el mouse, los puntos de alrededor se
// encienden apenas, como si el cursor los estuviera midiendo.
//
// - Un solo lienzo fijo, del tamaño de la ventana. La grilla acompaña el scroll a un
//   quinto de la velocidad: queda atrás, con profundidad.
// - Alrededor de cada video y de cada marco la grilla se abre en un claro suave: los
//   videos son rectángulos opacos y, si no, se vería su caja recortada en la grilla.
// - Barato: un triángulo a pantalla completa; cada píxel que no es un punto sale al
//   instante. 30 cuadros por segundo (60 mientras se scrollea o se mueve el mouse), y
//   nada con la pestaña oculta.

const PULSES = 6
const RECTS = 12
const PARALLAX = 0.2

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uRes;        // lienzo, en px de dispositivo
uniform float uDpr;
uniform float uStep;      // separación de la grilla, en px de CSS
uniform float uScroll;    // corrimiento de la grilla (el scroll por PARALLAX), en px
uniform float uTop;       // debajo del header: ahí empieza la grilla
uniform vec4 uText;       // el título del hero (x, y, ancho, alto): detrás, más tenue
uniform vec4 uRects[${RECTS}]; // videos y marcos (x, y, ancho, alto): alrededor, un claro
uniform float uRectCount;
uniform vec3 uMouse;      // x, y en px de CSS; z: cuánto se ve (0..1)
uniform vec4 uPulse[${PULSES}];   // celda de salida (x, y) y de llegada (x, y), en la grilla
uniform vec2 uPulseT[${PULSES}];  // cabeza: celdas recorridas; brillo (0..1)

const vec3 ACCENT = vec3(0.686, 0.890, 0.910); // #afe3e8, el turquesa claro de la marca

float pulseAt(vec2 cell, vec4 p, vec2 t) {
  if (t.y <= 0.0) return 0.0;
  float s = -1.0;
  if (abs(cell.y - p.y) < 0.5 && cell.x >= min(p.x, p.z) - 0.5 && cell.x <= max(p.x, p.z) + 0.5) {
    s = abs(cell.x - p.x);
  } else if (abs(cell.x - p.z) < 0.5 && cell.y >= min(p.y, p.w) - 0.5 && cell.y <= max(p.y, p.w) + 0.5) {
    s = abs(p.z - p.x) + abs(cell.y - p.y);
  }
  if (s < 0.0) return 0.0;
  float k = t.x - s;
  if (k < 0.0 || k > 6.0) return 0.0;
  float trail = 1.0 - k / 6.0;
  return trail * trail * t.y;
}

// Distancia de un punto al borde de un rectángulo (positiva afuera)
float outside(vec2 q, vec4 r) {
  vec2 c = r.xy + r.zw * 0.5;
  vec2 d = abs(q - c) - r.zw * 0.5;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 grid = vec2(px.x, px.y + uScroll);
  vec2 cell = floor(grid / uStep + 0.5);
  vec2 center = cell * uStep - vec2(0.0, uScroll); // el punto, en la ventana
  float d = length(px - center);
  // Casi todos los píxeles no son un punto: salen sin calcular nada más
  if (d > 2.6) { gl_FragColor = vec4(0.0); return; }

  float mask = smoothstep(uTop, uTop + 90.0, center.y);
  vec2 tc = (center - (uText.xy + uText.zw * 0.5)) / max(uText.zw * 0.62, vec2(1.0));
  mask *= mix(0.32, 1.0, smoothstep(0.7, 1.15, length(tc)));
  for (int i = 0; i < ${RECTS}; i++) {
    if (float(i) >= uRectCount) break;
    mask *= smoothstep(0.0, 48.0, outside(center, uRects[i]));
  }
  if (mask <= 0.001) { gl_FragColor = vec4(0.0); return; }

  float base = 0.065;
  float mouse = 0.22 * uMouse.z * exp(-pow(length(center - uMouse.xy) / 95.0, 2.0));

  float pulse = 0.0;
  for (int i = 0; i < ${PULSES}; i++) pulse += pulseAt(cell, uPulse[i], uPulseT[i]);
  pulse = min(pulse, 1.0);

  float r = 1.05 + 0.75 * pulse;
  float aa = 0.75 / uDpr + 0.35;
  float shape = smoothstep(r + aa, r - aa, d);

  float alpha = shape * mask * min(1.0, base + mouse + pulse * 0.85);
  vec3 color = mix(vec3(1.0), ACCENT, clamp(pulse * 1.4, 0.0, 1.0));
  gl_FragColor = vec4(color * alpha, alpha);
}
`

/**
 * @param canvas  el lienzo fijo, del tamaño de la ventana
 * @param layout  () => { top, text: [x, y, w, h] | null, edge: [x, y, w, h] | null,
 *                rects: [[x, y, w, h], …] }, en px de CSS de la ventana. `edge` es el
 *                marco del hero (los pulsos llegan a su filo de arriba); `rects`, los
 *                videos y marcos (claros en la grilla y destino de los pulsos).
 */
export function createSensorField(canvas, layout, { reduceMotion = false, touch = false } = {}) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
  if (!gl) return null

  const compile = (type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const u = (name) => gl.getUniformLocation(program, name)
  const U = {
    res: u('uRes'), dpr: u('uDpr'), step: u('uStep'), scroll: u('uScroll'), top: u('uTop'), text: u('uText'),
    rects: u('uRects'), rectCount: u('uRectCount'), mouse: u('uMouse'), pulse: u('uPulse'), pulseT: u('uPulseT'),
  }

  let dpr = 1
  let width = 0
  let height = 0
  let step = 28
  let scroll = 0
  let current = { top: 72, text: null, edge: null, rects: [] }
  let frame = 0
  let last = -Infinity
  let busyUntil = 0
  const mouse = { x: -9999, y: -9999, on: 0, goal: 0 }
  const rectData = new Float32Array(RECTS * 4)

  const pulses = Array.from({ length: PULSES }, () => ({ live: false }))
  let nextAt = 0
  const SPEED = 15
  const pulseData = new Float32Array(PULSES * 4)
  const pulseT = new Float32Array(PULSES * 2)

  // De la ventana a la grilla y al revés (la grilla se corre con el scroll)
  const toRow = (y) => (y + scroll) / step
  const toCol = (x) => x / step

  const inside = (x, y, r, margin = 0) => x > r[0] - margin && x < r[0] + r[2] + margin && y > r[1] - margin && y < r[1] + r[3] + margin
  const onScreen = (r) => r[1] < height && r[1] + r[3] > current.top && r[0] < width && r[0] + r[2] > 0

  // A dónde va un pulso nuevo: el filo de arriba del marco del hero si se ve; si no, el
  // borde de arriba (o de abajo) de un video que se vea; si no hay ninguno, un sensor
  function pickTarget() {
    const { edge, rects, top } = current
    const ok = (y) => y > top + step * 2 && y < height - step
    if (edge && onScreen(edge) && ok(edge[1])) {
      return { x0: edge[0], x1: edge[0] + edge[2], row: Math.floor(toRow(edge[1]) - 0.5) }
    }
    const visible = rects.filter(onScreen)
    for (let tries = 0; tries < 4 && visible.length; tries++) {
      const r = visible[Math.floor(Math.random() * visible.length)]
      if (ok(r[1])) return { x0: r[0], x1: r[0] + r[2], row: Math.floor(toRow(r[1]) - 0.5) }
      if (ok(r[1] + r[3])) return { x0: r[0], x1: r[0] + r[2], row: Math.ceil(toRow(r[1] + r[3]) + 0.5) }
    }
    return null
  }

  function spawn(now) {
    const slot = pulses.find((p) => !p.live)
    if (!slot || !width) return
    const target = pickTarget()
    const rowTop = Math.ceil(toRow(current.top + step * 2))
    const rowBottom = Math.floor(toRow(height - step))
    let tx
    let ty
    if (target) {
      const c0 = Math.ceil(toCol(target.x0)) + 1
      const c1 = Math.floor(toCol(target.x0 + (target.x1 - target.x0))) - 1
      if (c1 <= c0) return
      tx = c0 + Math.floor(Math.random() * (c1 - c0 + 1))
      ty = target.row
    } else {
      tx = 1 + Math.floor(Math.random() * Math.max(1, Math.floor(width / step) - 2))
      ty = rowTop + Math.floor(Math.random() * Math.max(1, rowBottom - rowTop))
    }
    // La salida: un sensor a la vista, fuera de los claros y del título, no pegado al destino
    const blocked = [...current.rects, ...(current.text ? [current.text] : [])]
    for (let tries = 0; tries < 16; tries++) {
      const sx = 1 + Math.floor(Math.random() * Math.max(1, Math.floor(width / step) - 2))
      const sy = rowTop + Math.floor(Math.random() * Math.max(1, rowBottom - rowTop))
      const x = sx * step
      const y = sy * step - scroll
      if (blocked.some((r) => inside(x, y, r, 40))) continue
      if (Math.abs(sx - tx) < 5 || Math.abs(sy - ty) < 3) continue
      const length = Math.abs(tx - sx) + Math.abs(ty - sy)
      if (length > 46) continue
      Object.assign(slot, { live: true, sx, sy, tx, ty, start: now, length })
      return
    }
  }

  function update(now) {
    current = layout()
    if (!reduceMotion && now >= nextAt) {
      spawn(now)
      nextAt = now + 800 + Math.random() * 1000
    }
    pulses.forEach((p, i) => {
      let head = 0
      let alpha = 0
      if (p.live) {
        head = ((now - p.start) / 1000) * SPEED
        const over = head - p.length
        alpha = over <= 0 ? 1 : Math.max(0, 1 - over / 7)
        if (over > 7) p.live = false
        head = Math.min(head, p.length + 7)
      }
      pulseData.set([p.sx || 0, p.sy || 0, p.tx || 0, p.ty || 0], i * 4)
      pulseT.set([head, alpha], i * 2)
    })
    mouse.on += (mouse.goal - mouse.on) * 0.12
    const rects = current.rects.filter(onScreen).slice(0, RECTS)
    rectData.fill(0)
    rects.forEach((r, i) => rectData.set(r, i * 4))
    return rects.length
  }

  function draw(rectCount) {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(U.res, canvas.width, canvas.height)
    gl.uniform1f(U.dpr, dpr)
    gl.uniform1f(U.step, step)
    gl.uniform1f(U.scroll, scroll)
    gl.uniform1f(U.top, current.top)
    gl.uniform4f(U.text, ...(current.text || [-9999, -9999, 1, 1]))
    gl.uniform4fv(U.rects, rectData)
    gl.uniform1f(U.rectCount, rectCount)
    gl.uniform3f(U.mouse, mouse.x, mouse.y, mouse.on)
    gl.uniform4fv(U.pulse, pulseData)
    gl.uniform2fv(U.pulseT, pulseT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function render(now) {
    scroll = (window.scrollY * PARALLAX) % (step * 1000)
    draw(update(now))
  }

  function loop(now = performance.now()) {
    frame = 0
    if (document.hidden) return
    // 30 cuadros por segundo; 60 mientras se scrollea o se mueve el mouse
    const interval = now < busyUntil ? 0 : 1000 / 30 - 1
    if (now - last >= interval) {
      render(now)
      last = now
    }
    frame = requestAnimationFrame(loop)
  }

  const busy = () => {
    busyUntil = performance.now() + 250
    if (reduceMotion) requestAnimationFrame(() => render(performance.now()))
  }
  const onVisibility = () => !document.hidden && !frame && !reduceMotion && loop()
  window.addEventListener('scroll', busy, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  return {
    resize(w, h) {
      dpr = Math.min(window.devicePixelRatio || 1, w < 720 ? 1.5 : 2)
      width = w
      height = h
      step = w < 720 ? 24 : 28
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      render(performance.now())
    },
    start() {
      if (reduceMotion) render(performance.now())
      else if (!frame) loop()
    },
    // El mouse, en px de CSS de la ventana; null cuando sale
    pointer(point) {
      if (touch || reduceMotion) return
      busy()
      if (point) Object.assign(mouse, { x: point.x, y: point.y, goal: 1 })
      else mouse.goal = 0
    },
    destroy() {
      cancelAnimationFrame(frame)
      frame = -1
      window.removeEventListener('scroll', busy)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
