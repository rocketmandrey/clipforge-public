// L2/riso.js — from the clipforge riso kit (own code, MIT with this repo). Only import paths changed.
// L2 change: non-square plates (w x h, for the 16:9 showreel world); the canvas is any element the level owns (blitted with drawImage).
// riso/riso.js: risograph print on dark paper. Each ink is a Canvas2D DENSITY plate (white = ink), composited in WebGL2:
// per-plate halftone screen (own angle), misregistration, ink-edge wobble, density unevenness, speckle, paper grain.
// Inks overprint like fluoro riso on a white underbase (colours multiply: m*y = hot red, c*m = violet, c*y = toxic green);
// plates flagged key:true are a dark ink laid last (contours, dot shadows). Pure code, no bitmaps.
// usage:
//   import { Riso } from '/engine/riso/riso.js';
//   const R = new Riso(canvas, { size: 1080, cell: 8, paper: '#0d0a1f', inks: { y: ['#ffe81f', 0], m: ['#ff2e93', 75],
//     c: ['#16d4ff', 15], v: ['#4a2cff', 45], k: ['#0b0718', 45, true] } });
//   R.clear(); R.fill(path, { y: 1, m: R.radial(x, y, 0, r, .2, .9) }); R.stroke(path, 4, { k: 1 }); R.fill(path, { m: -1 }) // knock out
//   R.window(540, 540, r, () => drawNextWorld(), { c: 1 }, 5);          // round window: inside cleared and redrawn, thin ink ring
//   R.render({ off: { m: [3, 0] }, on: { c: 0 }, swell: .3, flash: 1, shake: [4, 0], zoom: 1.1 });
//   R.path(pts) -> Path2D of a closed polyline.  R.ctx.y etc. are the raw plate contexts (1080 coords, transform preset).
const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FS = `#version 300 es
precision highp float; precision highp sampler2DArray;
uniform sampler2DArray P; uniform int N; uniform vec3 COL[6]; uniform float ANG[6], ON[6], KEY[6]; uniform vec2 OFF[6];
uniform vec3 PAPER, FLASHC; uniform float CELL, SWELL, FLASH, ZOOM; uniform vec2 SZ, SHAKE;
out vec4 o;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+1.), f.x), f.y); }
void main(){
  vec2 px = vec2(gl_FragCoord.x, SZ.y - gl_FragCoord.y), c0 = SZ * .5;
  vec2 q = (px - c0) / ZOOM + c0 - SHAKE;                 // image space (camera); the screen stays fixed on the paper
  vec3 ink = vec3(1.); float bare = 1., keyA = 0.; vec3 keyC = vec3(0.);
  for (int i = 0; i < 6; i++) { if (i >= N) break;
    float fi = float(i);
    vec2 w = vec2(vn(px * .07 + fi * 17.), vn(px * .07 + fi * 31. + 5.)) - .5;         // ink-edge wobble
    float d = texture(P, vec3((q - OFF[i] + w * 2.6) / SZ, fi)).r;
    d *= .8 + .32 * vn(px * .011 + fi * 7.3);                                          // uneven ink density
    d = min(1., d * (1. + SWELL));
    float a = ANG[i]; vec2 sp = mat2(cos(a), sin(a), -sin(a), cos(a)) * px / CELL;
    float s = .5 - .25 * (cos(6.2832 * sp.x) + cos(6.2832 * sp.y));                   // round dots -> checker -> holes
    float e = d - s, cov = clamp(e / max(fwidth(e), 1e-3) + .5, 0., 1.) * step(.03, d);
    cov *= ON[i] * (1. - step(.988, h(floor(px * .5) + fi * 3.1)));                     // ink starvation specks
    if (KEY[i] > .5) { keyA = max(keyA, cov); keyC = COL[i]; }
    else { ink *= mix(vec3(1.), COL[i], cov); bare *= 1. - cov * .96; }
  }
  float g = h(floor(px)) - .5, mott = vn(px * .006);
  vec3 col = PAPER * (1. + .22 * g + .25 * (mott - .5));
  col = mix(col, ink * (.93 + .1 * g), 1. - bare);
  col = mix(col, keyC, keyA * .94);
  col += .035 * smoothstep(.82, 1., vn(px * vec2(.015, .21))) ;                       // paper fibres
  o = vec4(mix(col, FLASHC, FLASH), 1.);
}`;
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255);

export class Riso {
  constructor(canvas, { size = 1080, w = size, h = size, cell = 8, paper = '#0d0a1f', flash = '#fffbe6', inks, res = 1 }) {
    Object.assign(this, { S: size, w, h, cell, paper: hex(paper), flashC: hex(flash), names: Object.keys(inks), inks });
    canvas.width = w; canvas.height = h;
    const nw = Math.round(w * res), nh = Math.round(h * res), gl = this.gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    this.ctx = {}; this.cv = {};
    for (const k of this.names) {
      const c = this.cv[k] = new OffscreenCanvas(nw, nh), x = this.ctx[k] = c.getContext('2d');
      x.setTransform(res, 0, 0, res, 0, 0); x.lineJoin = x.lineCap = 'round';
    }
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = this.pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, gl.createTexture());
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, nw, nh, this.names.length);
    for (const p of ['MIN_FILTER', 'MAG_FILTER']) gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl['TEXTURE_' + p], gl.LINEAR);
    for (const p of ['WRAP_S', 'WRAP_T']) gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl['TEXTURE_' + p], gl.CLAMP_TO_EDGE);
    this.u = k => gl.getUniformLocation(pr, k);
    const L = this.names.map(k => inks[k]);
    gl.uniform1i(this.u('N'), L.length); gl.uniform2f(this.u('SZ'), w, h); gl.uniform1f(this.u('CELL'), cell);
    gl.uniform3fv(this.u('COL'), L.flatMap(i => hex(i[0]))); gl.uniform1fv(this.u('ANG'), L.map(i => i[1] * Math.PI / 180));
    gl.uniform1fv(this.u('KEY'), L.map(i => i[2] ? 1 : 0));
    gl.uniform3fv(this.u('PAPER'), this.paper); gl.uniform3fv(this.u('FLASHC'), this.flashC);
  }
  clear() { for (const k of this.names) { const x = this.ctx[k]; x.save(); x.resetTransform(); x.fillStyle = '#000'; x.fillRect(0, 0, 1e5, 1e5); x.restore(); } }
  style(x, v) { return typeof v === 'function' ? v(x) : v >= 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; }
  fill(path, dens) { for (const k in dens) { const x = this.ctx[k]; x.fillStyle = this.style(x, dens[k]); x.fill(path); } }
  stroke(path, w, dens) { for (const k in dens) { const x = this.ctx[k]; x.lineWidth = w; x.strokeStyle = this.style(x, dens[k]); x.stroke(path); } }
  all(v, except = []) { return Object.fromEntries(this.names.filter(k => !except.includes(k)).map(k => [k, v])); }
  radial(x0, y0, r0, r1, a0, a1, x1 = x0, y1 = y0) { return x => { const g = x.createRadialGradient(x1, y1, Math.max(0, r0), x0, y0, Math.max(1e-3, r1));
    g.addColorStop(0, `rgba(255,255,255,${a0})`); g.addColorStop(1, `rgba(255,255,255,${a1})`); return g; }; }
  path(pts) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; }
  circle(x, y, r) { const p = new Path2D(); p.arc(x, y, Math.max(0, r), 0, 6.2832); return p; }
  // round window: clears a disc on every plate, draws `inner` clipped to it, then a thin ink ring with knocked-out gaps
  window(cx, cy, r, inner, ring = { c: 1 }, w = 5) {
    const disc = this.circle(cx, cy, r), X = Object.values(this.ctx);
    X.forEach(x => { x.save(); x.clip(disc); x.fillStyle = '#000'; x.fillRect(-1e4, -1e4, 2e4, 2e4); });
    inner(); X.forEach(x => x.restore());
    this.stroke(this.circle(cx, cy, r), w * 3, this.all(-1)); this.stroke(this.circle(cx, cy, r), w, ring);
  }
  render({ off = {}, on = {}, swell = 0, flash = 0, shake = [0, 0], zoom = 1 } = {}) {
    const gl = this.gl, c0 = this.cv[this.names[0]], nw = c0.width, nh = c0.height;
    this.names.forEach((k, i) => gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, nw, nh, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.cv[k]));
    gl.uniform2fv(this.u('OFF'), this.names.flatMap(k => off[k] || [0, 0])); gl.uniform1fv(this.u('ON'), this.names.map(k => on[k] ?? 1));
    gl.uniform1f(this.u('SWELL'), swell); gl.uniform1f(this.u('FLASH'), Math.min(1, flash)); gl.uniform1f(this.u('ZOOM'), zoom);
    gl.uniform2fv(this.u('SHAKE'), shake);
    gl.viewport(0, 0, this.w, this.h); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();
  }
}
