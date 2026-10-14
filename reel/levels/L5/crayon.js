// L5 crayon technique. Adapted from the doodle_story kit (kevin_t_ngo crayon-doodle look):
//   hash, resample, jitter, path, makeGrain, crayon, marker, PAL, ell, rrect. Own code of the clipforge harness (style inspired by kevin_t_ngo). Changes: screen-space coords (k = 1), variable point count,
//   the crayon knock-out fills paper colour instead of a background canvas, offscreen shapes are skipped.
export const PAL = {
  ink: '#1d1a17', paper: '#f5f1e6', navy: '#1b2566', guide: '#7fa6d9', red: '#d9493b', yellow: '#f1bf45', blue: '#2e4fa6',
  lblue: '#9cc0e8', pink: '#e08690', green: '#4d9e57', brown: '#8a5a3a', cream: '#fbf7ec', white: '#fbfaf5', gray: '#8d877d', black: '#161412',
};
export const BOIL = 8;   // boil steps per second (kit value: "on threes" at 24 fps)

export const hash = (...a) => { let h = 2166136261; for (const v of a) { h = Math.imul(h ^ (v * 1000 | 0), 16777619); h ^= h >>> 13; } return ((h >>> 0) % 100000) / 100000; };
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const ease = p => (p = clamp(p), p < .5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
export const ell = (cx, cy, rx, ry = rx, a0 = 0, a1 = Math.PI * 2, n = 40) =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
export const rrect = (x, y, w, h, r = 18) => [
  ...ell(x + w - r, y + r, r, r, -Math.PI / 2, 0, 6), ...ell(x + w - r, y + h - r, r, r, 0, Math.PI / 2, 6),
  ...ell(x + r, y + h - r, r, r, Math.PI / 2, Math.PI, 6), ...ell(x + r, y + r, r, r, Math.PI, Math.PI * 1.5, 6)];

// resample a polyline to ~one point per `step` px; closed parts run 4% past the start (marker overshoot)
export function resample(pts, closed, step = 7) {
  const P = closed ? [...pts, pts[0]] : pts, L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const tot = L[L.length - 1] || 1, span = closed ? tot * 1.04 : tot, N = Math.max(8, Math.min(260, Math.round(span / step))), out = [];
  for (let k = 0, j = 1; k < N; k++) {
    let d = span * k / (N - 1); if (d > tot) d -= tot, j = 1;
    while (j < L.length - 1 && L[j] < d) j++;
    const q = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
    out.push([lerp(P[j - 1][0], P[j][0], q), lerp(P[j - 1][1], P[j][1], q)]);
  }
  return out;
}

// boil: low-frequency wobble + a little grit, new every 1/BOIL s
export function jitter(pts, key, step, amp) {
  const f1 = .12 + hash(key, step, 1) * .15, f2 = .12 + hash(key, step, 2) * .15, p1 = hash(key, step, 3) * 6.3, p2 = hash(key, step, 4) * 6.3;
  return pts.map(([x, y], i) => [x + amp * (Math.sin(i * f1 + p1) * .8 + (hash(key, step, i, 5) - .5) * .5),
                                 y + amp * (Math.sin(i * f2 + p2) * .8 + (hash(key, step, i, 6) - .5) * .5)]);
}

export function path(g, pts) {   // smooth through midpoints
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
}

let grain = null, scratch = null;
function makeGrain() {   // crayon alpha mask: diagonal waxy strokes with paper showing through
  const c = new OffscreenCanvas(512, 512), g = c.getContext('2d');
  g.lineCap = 'round';
  for (let i = 0; i < 12000; i++) {
    const x = hash(i, 1) * 560 - 24, y = hash(i, 2) * 560 - 24, l = 8 + hash(i, 3) * 26, a = -.38 + (hash(i, 4) - .5) * .3;
    g.strokeStyle = `rgba(0,0,0,${.45 + hash(i, 5) * .55})`; g.lineWidth = 1.2 + hash(i, 6) * 2.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${.5 + hash(i, 9) * .5})`; g.fillRect(hash(i, 7) * 512, hash(i, 8) * 512, 1.5, 1.5); }
  return c;
}
function makePaper() {   // cream paper tile with faint tooth (kit makeBg 'paper')
  const c = new OffscreenCanvas(512, 512), g = c.getContext('2d');
  g.fillStyle = PAL.paper; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) { g.fillStyle = hash(i, 1) < .5 ? 'rgba(120,100,70,.05)' : 'rgba(255,255,255,.25)'; g.fillRect(hash(i, 2) * 512, hash(i, 3) * 512, 2, 2); }
  return c;
}
export let paperTile = null;
export function init(W, H) { grain = grain || makeGrain(); paperTile = paperTile || makePaper(); if (!scratch || scratch.width !== W) scratch = new OffscreenCanvas(W, H); }

// wax fill: paper knock-out, light wash, grain-masked wax. pts in screen px.
export function crayon(g, pts, color, alpha, key, step) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  const bx = Math.max(0, Math.floor(x0) - 4), by = Math.max(0, Math.floor(y0) - 4);
  const bw = Math.min(scratch.width - bx, Math.ceil(x1 - bx) + 8), bh = Math.min(scratch.height - by, Math.ceil(y1 - by) + 8);
  if (bw <= 0 || bh <= 0 || alpha <= 0) return;
  const s = scratch.getContext('2d');
  s.globalCompositeOperation = 'source-over'; s.clearRect(bx, by, bw, bh);
  s.fillStyle = color; path(s, pts); s.fill();
  const pat = s.createPattern(grain, 'repeat');
  pat.setTransform(new DOMMatrix().translate(hash(key, step, 11) * 512, hash(key, step, 12) * 512).scale(1.1));
  s.globalCompositeOperation = 'destination-in'; s.fillStyle = pat; s.fillRect(bx, by, bw, bh);
  g.save(); g.globalAlpha = alpha; path(g, pts); g.clip();
  g.fillStyle = PAL.paper; g.fillRect(bx, by, bw, bh);
  g.globalAlpha = alpha * .28; g.fillStyle = color; g.fillRect(bx, by, bw, bh);
  g.globalAlpha = alpha; g.drawImage(scratch, bx, by, bw, bh, bx, by, bw, bh); g.restore();
}

export function marker(g, pts, color, w, key, alpha = 1) {
  g.lineCap = g.lineJoin = 'round'; g.strokeStyle = color;
  g.globalAlpha = .93 * alpha; g.lineWidth = w; path(g, pts); g.stroke();
  g.globalAlpha = .35 * alpha; g.lineWidth = w * .45;   // second, thinner pass a hair off: uneven marker edge
  const o = (hash(key, 21) - .5) * 1.6; path(g, pts.map(([x, y]) => [x + o, y - o * .7])); g.stroke();
  g.globalAlpha = 1;
}

// one doodle part: { d: pts, c: closed, f: fill, w: line width (0 = none), ink, a: alpha, amp }
export function part(g, p, key, step, W) {
  let x0 = 1e9, x1 = -1e9; for (const [x] of p.d) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  if (x1 < -20 || x0 > W + 20) return;
  const pts = resample(p.d, !!p.c), amp = p.amp ?? 1.6, a = p.a ?? 1;
  if (p.f) crayon(g, jitter(pts, key + 500, step, amp * 1.8), p.f, a, key, step);
  if (p.w !== 0) marker(g, jitter(pts, key, step, amp), p.ink || PAL.ink, p.w || 4, key, a);
}
