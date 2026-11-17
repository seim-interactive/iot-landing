// La luz del marco de la plataforma, dibujada con un shader (WebGL, sin librerías).
//
// Con degradés de CSS la luz sobre negro se ve en escalones y quieta, y se lee como
// pintada. Acá cada píxel se calcula: la luz nace en el filo del marco, cae de forma
// exponencial hacia arriba (como un resplandor real), respira muy lento y lleva un
// tramado fino que borra los escalones. Nunca pasa por encima de la pantalla.

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uRes;      // tamaño del lienzo en px
uniform float uEdge;    // altura del filo del marco, desde abajo, en px
uniform float uWidth;   // ancho del marco en px
uniform float uTime;
uniform float uGlint;   // 0..1, avanza con el scroll
uniform float uDpr;

float hash(vec2 q) {
  q = fract(q * vec2(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

float noise(vec2 q) {
  vec2 i = floor(q), f = fract(q);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float fbm(vec2 q) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(q); q *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 px = gl_FragCoord.xy / uDpr;
  vec2 res = uRes / uDpr;
  float edge = uEdge / uDpr;
  float half_w = uWidth / uDpr * 0.5;

  // x: -1..1 a lo ancho del marco. y: px por encima (+) o por debajo (-) del filo.
  float x = (px.x - res.x * 0.5) / half_w;
  float y = px.y - edge;

  // El foco se corre con el scroll: la luz acompaña al brillo del borde.
  float cx = mix(-0.34, 0.34, uGlint);
  float dx = x - cx * 0.55;

  // Respira: el ancho y la altura de la luz varían apenas, muy lento.
  float t = uTime * 0.07;
  float breathe = fbm(vec2(x * 1.6 + t, t * 0.6));
  float flicker = 0.9 + 0.2 * breathe;

  // Perfil a lo ancho: una campana que cae a cero antes de las esquinas.
  float span = exp(-pow(abs(dx) / 0.62, 2.4));
  float corners = smoothstep(1.02, 0.7, abs(x));

  float up = max(y, 0.0);
  float down = max(-y, 0.0);

  // Tres capas con caída exponencial: el resplandor pegado al filo, el halo y el aire.
  float core = 0.60 * exp(-up / 9.0) * exp(-pow(abs(dx) / 0.36, 2.0));
  float halo = 0.22 * exp(-up / (34.0 * flicker)) * span;
  float air = 0.075 * exp(-up / (120.0 * flicker)) * exp(-pow(abs(dx) / 0.9, 2.0));

  // La intensidad varía apenas a lo ancho y se corre muy lento. Solo a lo ancho:
  // si variara con la altura se verían vetas sobre el título.
  float drift = 0.88 + 0.24 * fbm(vec2(x * 2.2 - t * 0.8, t * 0.5));
  float light = (core + halo * drift + air) * corners;

  // Por debajo del filo solo queda un resto que el vidrio del marco difumina.
  light *= exp(-down / 16.0);

  // Tramado: rompe los escalones del degradé.
  light += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0 * 1.6;
  light = max(light, 0.0);

  vec3 tint = vec3(0.90, 0.94, 1.0);
  gl_FragColor = vec4(tint * light, light);
}
`

export function createStageLight(canvas, { reduceMotion = false } = {}) {
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

  const uniform = (name) => gl.getUniformLocation(program, name)
  const u = { res: uniform('uRes'), edge: uniform('uEdge'), width: uniform('uWidth'), time: uniform('uTime'), glint: uniform('uGlint'), dpr: uniform('uDpr') }

  let dpr = 1
  let frame = 0
  let visible = false
  let glint = 0
  let below = 0
  let stageWidth = 0
  const start = performance.now()

  function draw() {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u.res, canvas.width, canvas.height)
    gl.uniform1f(u.edge, below * dpr)
    gl.uniform1f(u.width, stageWidth * dpr)
    gl.uniform1f(u.time, (performance.now() - start) / 1000)
    gl.uniform1f(u.glint, glint)
    gl.uniform1f(u.dpr, dpr)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function loop() {
    frame = 0
    if (!visible) return
    draw()
    if (!reduceMotion) frame = requestAnimationFrame(loop)
  }

  return {
    // `edgeFromBottom`: a cuántos px del borde de abajo del lienzo está el filo del marco.
    resize(width, height, edgeFromBottom, widthOfStage) {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      below = edgeFromBottom
      stageWidth = widthOfStage
      draw()
    },
    setGlint(value) {
      glint = value
      if (reduceMotion && visible) draw()
    },
    setVisible(next) {
      visible = next
      if (visible && !frame) loop()
    },
    destroy() {
      visible = false
      cancelAnimationFrame(frame)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
