// La red de sensores del hero, dibujada con un shader (WebGL, sin librerías).
//
// Una grilla de puntos casi invisible, como los sensores de una planta. Cada tanto uno
// manda un pulso: salta de punto en punto en horizontal y después baja derecho hasta el
// filo de arriba del marco de la plataforma, como un cable que se enchufa. Muchas fuentes
// que llegan a un solo lugar: tus máquinas mandando datos a la plataforma (la misma idea
// que el >< de la marca). Con el mouse, los puntos de alrededor se encienden apenas, como
// si el cursor los estuviera midiendo.
//
// Barato: un solo triángulo a pantalla completa, todo se calcula por píxel con unos pocos
// pulsos como uniforms. El lienzo cubre solo la franja de arriba del marco, se dibuja a
// 30 cuadros por segundo y solo mientras se ve.

const PULSES = 6

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uRes;        // lienzo, en px de dispositivo
uniform float uDpr;
uniform float uStep;      // separación de la grilla, en px de CSS
uniform vec4 uText;       // el bloque del título (x, y, ancho, alto), en px de CSS
uniform float uTop;       // debajo del header: ahí empieza la grilla
uniform vec3 uMouse;      // x, y en px de CSS; z: cuánto se ve (0..1)
uniform vec4 uPulse[${PULSES}];   // celda de salida (x, y) y de llegada (x, y)
uniform vec2 uPulseT[${PULSES}];  // cabeza: celdas recorridas; brillo (0..1)

const vec3 ACCENT = vec3(0.686, 0.890, 0.910); // #afe3e8, el turquesa claro de la marca

// Cuánto brilla la celda por el pulso i: la estela detrás de la cabeza
float pulseAt(vec2 cell, vec4 p, vec2 t) {
  if (t.y <= 0.0) return 0.0;
  float s = -1.0;
  // Tramo horizontal, en la fila de salida
  if (abs(cell.y - p.y) < 0.5 && cell.x >= min(p.x, p.z) - 0.5 && cell.x <= max(p.x, p.z) + 0.5) {
    s = abs(cell.x - p.x);
  }
  // Tramo vertical, en la columna de llegada
  else if (abs(cell.x - p.z) < 0.5 && cell.y >= min(p.y, p.w) - 0.5 && cell.y <= max(p.y, p.w) + 0.5) {
    s = abs(p.z - p.x) + abs(cell.y - p.y);
  }
  if (s < 0.0) return 0.0;
  float k = t.x - s;
  if (k < 0.0 || k > 6.0) return 0.0;
  float trail = 1.0 - k / 6.0;
  return trail * trail * t.y;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 cell = floor(px / uStep + 0.5);
  vec2 center = cell * uStep;
  float d = length(px - center);

  // La grilla se apaga bajo el header, abajo (sobre el filo del marco queda la luz) y,
  // en parte, detrás del título
  float h = uRes.y / uDpr;
  float mask = smoothstep(uTop, uTop + 140.0, center.y) * smoothstep(h + 2.0, h - 60.0, center.y);
  vec2 tc = (center - (uText.xy + uText.zw * 0.5)) / (uText.zw * 0.62);
  mask *= mix(0.32, 1.0, smoothstep(0.7, 1.15, length(tc)));

  float base = 0.065 * mask;
  float mouse = 0.22 * uMouse.z * exp(-pow(length(center - uMouse.xy) / 95.0, 2.0)) * smoothstep(uTop, uTop + 40.0, center.y);

  float pulse = 0.0;
  for (int i = 0; i < ${PULSES}; i++) pulse += pulseAt(cell, uPulse[i], uPulseT[i]);
  pulse = min(pulse, 1.0);

  // El punto: 1 px de radio, un poco más grande cuando pasa un pulso
  float r = 1.05 + 0.75 * pulse;
  float aa = 0.75 / uDpr + 0.35;
  float shape = smoothstep(r + aa, r - aa, d);

  float alpha = shape * min(1.0, base + mouse + pulse * 0.85);
  vec3 color = mix(vec3(1.0), ACCENT, clamp(pulse * 1.4, 0.0, 1.0));
  gl_FragColor = vec4(color * alpha, alpha);
}
`

export function createSensorField(canvas, { reduceMotion = false, touch = false } = {}) {
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
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const u = (name) => gl.getUniformLocation(program, name)
  const U = {
    res: u('uRes'), dpr: u('uDpr'), step: u('uStep'), text: u('uText'), top: u('uTop'),
    mouse: u('uMouse'), pulse: u('uPulse'), pulseT: u('uPulseT'),
  }

  let dpr = 1
  let width = 0
  let height = 0
  let step = 28
  let top = 0
  let text = [0, 0, 1, 1]
  // Dónde está el filo del marco: las columnas a las que llegan los pulsos
  let target = { x0: 0, x1: 0 }
  let visible = false
  let frame = 0
  let last = -Infinity
  const mouse = { x: -9999, y: -9999, on: 0, goal: 0 }

  // Los pulsos: salida, llegada, cuándo arrancaron y a qué velocidad (celdas por segundo)
  const pulses = Array.from({ length: PULSES }, () => ({ live: false }))
  let nextAt = 0
  const SPEED = 15
  const pulseData = new Float32Array(PULSES * 4)
  const pulseT = new Float32Array(PULSES * 2)

  const rows = () => Math.floor(height / step)
  const cols = () => Math.floor(width / step)

  function spawn(now) {
    const slot = pulses.find((p) => !p.live)
    if (!slot || !width) return
    const arrive = rows() // la última fila, pegada al filo del marco
    const c0 = Math.ceil(target.x0 / step) + 1
    const c1 = Math.floor(target.x1 / step) - 1
    if (c1 <= c0) return
    const tx = c0 + Math.floor(Math.random() * (c1 - c0 + 1))
    // La salida: lejos del título y del filo, a cualquier altura de la grilla
    const r0 = Math.ceil((top + 160) / step)
    const r1 = arrive - 4
    if (r1 <= r0) return
    let sx = 0
    let sy = 0
    for (let tries = 0; tries < 12; tries++) {
      sx = 1 + Math.floor(Math.random() * (cols() - 1))
      sy = r0 + Math.floor(Math.random() * (r1 - r0 + 1))
      const cx = (sx * step - (text[0] + text[2] / 2)) / (text[2] * 0.62)
      const cy = (sy * step - (text[1] + text[3] / 2)) / (text[3] * 0.62)
      if (Math.hypot(cx, cy) > 1.05 && Math.abs(sx - tx) > 4) break
    }
    const length = Math.abs(tx - sx) + Math.abs(arrive - sy)
    Object.assign(slot, { live: true, sx, sy, tx, ty: arrive, start: now, length })
  }

  function update(now) {
    if (now >= nextAt) {
      spawn(now)
      nextAt = now + 900 + Math.random() * 1100
    }
    pulses.forEach((p, i) => {
      let head = 0
      let alpha = 0
      if (p.live) {
        head = ((now - p.start) / 1000) * SPEED
        // Llega y se apaga en el filo, como si lo absorbiera la luz del marco
        const over = head - p.length
        alpha = over <= 0 ? 1 : Math.max(0, 1 - over / 7)
        if (over > 7) p.live = false
        head = Math.min(head, p.length + 7)
      }
      pulseData.set([p.sx || 0, p.sy || 0, p.tx || 0, p.ty || 0], i * 4)
      pulseT.set([head, alpha], i * 2)
    })
    mouse.on += (mouse.goal - mouse.on) * 0.12
  }

  function draw() {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(U.res, canvas.width, canvas.height)
    gl.uniform1f(U.dpr, dpr)
    gl.uniform1f(U.step, step)
    gl.uniform4f(U.text, ...text)
    gl.uniform1f(U.top, top)
    gl.uniform3f(U.mouse, mouse.x, mouse.y, mouse.on)
    gl.uniform4fv(U.pulse, pulseData)
    gl.uniform2fv(U.pulseT, pulseT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function loop(now = performance.now()) {
    frame = 0
    if (!visible || document.hidden) return
    // 30 cuadros por segundo: los pulsos saltan de punto en punto, no hace falta más
    if (now - last >= 1000 / 30 - 1) {
      update(now)
      draw()
      last = now
    }
    frame = requestAnimationFrame(loop)
  }

  function onVisibility() {
    if (!document.hidden && visible && !frame && !reduceMotion) loop()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    /**
     * @param size   ancho y alto del lienzo, en px de CSS
     * @param layout { top, text: [x, y, w, h], target: { x0, x1 } }, relativos al lienzo
     */
    resize({ w, h }, layout) {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = w
      height = h
      step = w < 720 ? 24 : 28
      top = layout.top
      text = layout.text
      target = layout.target
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      update(performance.now())
      draw()
    },
    // El mouse, en px de CSS relativos al lienzo; null cuando sale
    pointer(point) {
      if (touch || reduceMotion) return
      if (point) Object.assign(mouse, { x: point.x, y: point.y, goal: 1 })
      else mouse.goal = 0
    },
    setVisible(next) {
      visible = next
      if (reduceMotion) {
        if (visible) draw()
        return
      }
      if (visible && !frame) loop()
    },
    destroy() {
      visible = false
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
