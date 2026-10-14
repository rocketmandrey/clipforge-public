// L4/pen.js — from the clipforge pen kit (own code, MIT with this repo). Only import paths changed.
// pen.js: shared hand-drawn stroke engine (ink_pattern, chibi_paper).
// A Plot collects strokes in paint order; each stroke gets a reveal window [t0, t0+d] and is drawn partially by arc length,
// so a picture "draws itself" stroke by stroke.  Rebuild the Plot every frame from the same seed: random draws must not depend
// on t (keep stroke counts fixed), then the wobble is identical frame to frame and only the animated params move.
export const rng = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = x => x * x * (3 - 2 * x);
export const TAU = Math.PI * 2;

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// paper: base colour + fine tooth (tiny mottle specks + linen weave) + fibre flecks + grain + light vignette, made once per scene.
// No big soft blobs: at phone size they read as blurry ink clouds while the picture draws in (ink_pattern v1 fail).
export function paper(w, h, { base = '#efe6d2', seed = 7, mottle = .05, fibres = 1400, grain = 14, vig = .14, weave = .035, ink = 'rgba(80,60,40,' } = {}) {
  const cv = canvas(w, h), c = cv.getContext('2d'), r = rng(seed);
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) { c.fillStyle = r() < .5 ? `rgba(0,0,0,${mottle * r()})` : `rgba(255,255,255,${mottle * r()})`; c.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5); }
  c.fillStyle = `rgba(0,0,0,${weave})`; for (let y = 0; y < h; y += 3) if (r() < .55) c.fillRect(0, y, w, 1);
  for (let x = 0; x < w; x += 3) if (r() < .55) c.fillRect(x, 0, 1, h);
  c.lineCap = 'round';
  for (let i = 0; i < fibres; i++) { const x = r() * w, y = r() * h, l = 3 + r() * 9, a = r() * TAU;
    c.strokeStyle = ink + (.04 + r() * .1) + ')'; c.lineWidth = .7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  const id = c.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * grain; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  c.putImageData(id, 0, 0);
  const g = c.createRadialGradient(w / 2, h / 2, w * .35, w / 2, h / 2, w * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20,10,0,${vig})`);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  return cv;
}

// pencil grain: a fixed screen-space noise pattern tinted per colour (stable, no boil)
const GR = {}; let NOISE;
function grainStyle(c, col) {
  if (GR[col]) return GR[col];
  if (!NOISE) { NOISE = canvas(256, 256); const x = NOISE.getContext('2d'), id = x.createImageData(256, 256), r = rng(99);
    for (let i = 0; i < id.data.length; i += 4) { id.data[i + 3] = r() < .62 ? 150 + r() * 105 : r() * 60; } x.putImageData(id, 0, 0); }
  const t = canvas(256, 256), x = t.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 256, 256); x.globalCompositeOperation = 'destination-in'; x.drawImage(NOISE, 0, 0);
  return (GR[col] = c.createPattern(t, 'repeat'));
}

// wobble: subdivide every ~step px, offset sideways by smoothed noise (amp px)
export function wob(pts, r, amp = .8, step = 14) {
  if (amp <= 0) return pts;
  const out = []; let n0 = 0;
  for (let i = 0; i < pts.length - 2; i += 2) {
    const x0 = pts[i], y0 = pts[i + 1], x1 = pts[i + 2], y1 = pts[i + 3], L = Math.hypot(x1 - x0, y1 - y0), k = Math.max(1, Math.ceil(L / step)), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    for (let j = 0; j < k; j++) { const u = j / k, n1 = (r() - .5) * 2 * amp; n0 = n0 * .5 + n1 * .5; out.push(x0 + (x1 - x0) * u + nx * n0, y0 + (y1 - y0) * u + ny * n0); }
  }
  out.push(pts[pts.length - 2], pts[pts.length - 1]);
  return out;
}

export const line = (x0, y0, x1, y1) => [x0, y0, x1, y1];
export function arc(cx, cy, R, a0, a1, step = 8) { const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * R / step)), p = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } return p; }
export function rot(pts, cx, cy, a) { const c = Math.cos(a), s = Math.sin(a), o = new Array(pts.length);
  for (let i = 0; i < pts.length; i += 2) { const x = pts[i] - cx, y = pts[i + 1] - cy; o[i] = cx + x * c - y * s; o[i + 1] = cy + x * s + y * c; } return o; }
export function polyPath(pts) { const p = new Path2D(); p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); p.closePath(); return p; }

// styles: kind 'pen' (ballpoint: solid thin), 'pencil' (grainy), 'chalk' (grainy, wider, light on dark)
export class Plot {
  constructor(seed = 1) { this.r = rng(seed); this.items = []; this.clip = null; this.style = { kind: 'pen', col: '#1b2a8a', w: 1.1, a: .85 }; this.amp = .7; this.g = null; }
  pen(col, w = 1.1, a = .85, kind = 'pen') { this.style = { kind, col, w, a }; return this; }
  // strokes added inside fn are revealed one after another across [t0, t1]
  group(t0, t1, fn, clip = null) { const s = this.items.length, prev = this.clip; this.clip = clip; fn(); this.clip = prev;
    const n = this.items.length - s, d = clamp((t1 - t0) / Math.max(1, n) * 8, .06, .5);
    for (let i = 0; i < n; i++) { const it = this.items[s + i]; it.t0 = t0 + (t1 - t0 - d) * (n > 1 ? i / (n - 1) : 0); it.d = d; } return this; }
  add(pts, o = {}) { this.items.push({ p: o.raw ? pts : wob(pts, this.r, o.amp ?? this.amp), st: o.st || this.style, clip: this.clip, fill: o.fill ? o.fill.slice() : null, fc: o.fc, t0: 0, d: .2 }); return this; }
  dot(x, y, R, o = {}) { this.items.push({ p: null, dot: [x, y, R], st: o.st || this.style, clip: this.clip, t0: 0, d: .1 }); return this; }
  // map the points of every item added since index s (build motifs in a local frame, then place / rotate them)
  xf(s, fn) { for (let i = s; i < this.items.length; i++) { const it = this.items[i];
    if (it.dot) { const [x, y] = fn(it.dot[0], it.dot[1]); it.dot[0] = x; it.dot[1] = y; continue; }
    for (let k = 0; k < it.p.length; k += 2) { const [x, y] = fn(it.p[k], it.p[k + 1]); it.p[k] = x; it.p[k + 1] = y; }
    if (it.fill) for (let k = 0; k < it.fill.length; k += 2) { const [x, y] = fn(it.fill[k], it.fill[k + 1]); it.fill[k] = x; it.fill[k + 1] = y; } } return this; }
  place(s, x, y, a = 0) { const c = Math.cos(a), sn = Math.sin(a); return this.xf(s, (u, v) => [x + u * c - v * sn, y + u * sn + v * c]); }
  draw(c, t) {
    let clip = undefined; c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const it of this.items) {
      const f = clamp((t - it.t0) / it.d); if (f <= 0) continue;
      if (it.clip !== clip) { c.restore(); c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; if (it.clip) for (const k of [].concat(it.clip)) c.clip(k); clip = it.clip; }   // an array of clips = their intersection
      const st = it.st, col = st.kind === 'pen' ? st.col : grainStyle(c, st.col);
      if (it.fill) { c.globalAlpha = clamp(f * 3); c.fillStyle = it.fc; c.fill(polyPath(it.fill)); }   // fill = flat polygon pts, under the stroke
      c.globalAlpha = st.a * (it.dot ? f : 1);
      if (it.dot) { c.fillStyle = col; c.beginPath(); c.arc(it.dot[0], it.dot[1], it.dot[2], 0, TAU); c.fill(); continue; }
      c.strokeStyle = col; c.lineWidth = st.w; strokePart(c, it.p, f);
    }
    c.restore();
  }
}

export function strokePart(c, p, f) {
  c.beginPath(); c.moveTo(p[0], p[1]);
  if (f >= 1) { for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke(); return; }
  let L = 0; for (let i = 2; i < p.length; i += 2) L += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
  let left = L * f;
  for (let i = 2; i < p.length; i += 2) { const l = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
    if (l >= left) { const u = left / (l || 1); c.lineTo(p[i - 2] + (p[i] - p[i - 2]) * u, p[i - 1] + (p[i + 1] - p[i - 1]) * u); break; }
    c.lineTo(p[i], p[i + 1]); left -= l; }
  c.stroke();
}
