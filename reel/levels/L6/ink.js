// L6/ink.js — Rorschach ink helpers for level 6 (КРИТИКИ), canvas 2D, pure functions of t.
// Kit: 2D port of the Rorschach look from the clipforge harness (own code):
//   rng() = its mulberry32 copied verbatim; the blot idea is ported from its WebGL SDF to 2D polygons: half sheet + mirror,
//   lobes on a base ellipse, crisp rough edge, crawl between beats, morph to a new key shape on strong beats with an
//   ease-out overshoot, capillary veins at the edge, pooled (darker rim) fill. Rule: always a crisp dark symmetric blot, never fog.
// Stamp lettering: Impact (system font; heavy condensed caps, no network fonts).
export const INKC = '#15100e', PAPER = '#efe5cf', HOLE = '#f8f2e3', STAMP = '#c8372d';
export const NH = 72;   // samples per half outline
export function rng(s) { return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = p => (p = cl(p), p * p * (3 - 2 * p));
export const back = p => { p = cl(p); const c = 2.2; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
export const lerp = (a, b, p) => a + (b - a) * p;

// shape {rx, ry, lobes: [[theta (0 = up, PI = down), width, amp]...], seed, jag} -> half radii (theta 0..PI)
export function radii(sh) {
  const R = new Float32Array(NH), r = rng(sh.seed | 0);
  for (let j = 0; j < NH; j++) { const th = j / (NH - 1) * Math.PI;
    let v = 1 / Math.hypot(Math.sin(th) / sh.rx, Math.cos(th) / sh.ry);
    for (const [a, w, amp] of sh.lobes) v += amp * Math.exp(-(((th - a) / w) ** 2));
    R[j] = v + (r() - .5) * (sh.jag ?? 3.5); }
  return R;
}
export const lerpR = (A, B, p) => A.map((a, j) => a + (B[j] - a) * p);

// world points (clockwise: top, right side down, left side up); rot: radians about the centre; live crawl between beats
export function blotPts(cx, cy, R, { rot = 0, sc = 1, t = 0, ph = 0, add = null } = {}) {
  const c = Math.cos(rot), s = Math.sin(rot), out = new Array(2 * NH);
  for (let j = 0; j < NH; j++) { const th = j / (NH - 1) * Math.PI;
    const rr = (R[j] + 2.6 * Math.sin(th * 6 + t * 1.7 + ph) + 1.6 * Math.sin(th * 11 - t * 1.1 + 2 * ph) + (add ? add(th) : 0)) * sc;
    const x = Math.sin(th) * rr, y = -Math.cos(th) * rr;
    out[j] = [cx + x * c - y * s, cy + x * s + y * c];
    out[2 * NH - 1 - j] = [cx - x * c - y * s, cy - x * s + y * c]; }
  return out;
}
export function path(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
// ink body: dark wet rim, greyer pooled band, dark core (coffee-ring look, still a crisp silhouette)
export function drawBlot(ctx, pts, cx, cy) {
  path(ctx, pts); ctx.fillStyle = INKC; ctx.fill();
  const shrink = k => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
  path(ctx, shrink(.8)); ctx.fillStyle = 'rgba(92,76,66,.30)'; ctx.fill();
  path(ctx, shrink(.5)); ctx.fillStyle = 'rgba(21,16,14,.55)'; ctx.fill();
}

// big check mark resampled to 2*NH points, clockwise, starting at its top tip (morph target for the three critics)
export function checkPts(cx, cy, k = 1) {
  const V = [[-175, -5], [-118, -62], [-48, 8], [128, -178], [186, -120], [-48, 118]].map(([x, y]) => [x * k, y * k]);
  const seg = V.map((p, i) => { const q = V[(i + 1) % V.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]); }), L = seg.reduce((a, b) => a + b);
  const N = 2 * NH, out = [];
  for (let n = 0; n < N; n++) { let d = n / N * L, i = 0; while (d > seg[i]) d -= seg[i++];
    const p = V[i], q = V[(i + 1) % V.length], f = d / seg[i]; out.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]); }
  const r = rng(77); out.forEach(p => { p[0] += (r() - .5) * 4; p[1] += (r() - .5) * 4; });   // rough ink edge
  let st = 0; out.forEach((p, i) => { if (p[1] < out[st][1]) st = i; });   // top tip first
  return out.slice(st).concat(out.slice(0, st)).map(([x, y]) => [cx + x, cy + y]);
}

// hero polygons in ink: orange/red wash inside a heavy ink contour + a dry-brush echo
const FILL = { arm: '#D87754', leg: '#D87754', body: '#D87754', band: '#C8372D', tail: '#C8372D', eye: INKC, gun: '#2a2220', flash: '#ff9a3c' };
export function inkHero(ctx, H, lw = 4.5, skip = null) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const sh of H.shapes) { if (skip && skip(sh)) continue;
    path(ctx, sh.pts); ctx.fillStyle = FILL[sh.role]; ctx.fill();
    if (sh.role === 'eye' || sh.role === 'flash') continue;
    ctx.strokeStyle = INKC; ctx.lineWidth = lw; ctx.stroke();
    ctx.save(); ctx.translate(lw * .35, lw * .25); ctx.globalAlpha = .35; ctx.lineWidth = lw * .4; ctx.stroke(); ctx.restore(); }
  ctx.restore();
}

// stamps: rendered once, distressed by punching seeded paper specks out of the red
function distress(c, seed, n) {
  const x = c.getContext('2d'), r = rng(seed); x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < n; i++) { x.globalAlpha = .3 + .7 * r(); x.beginPath(); x.arc(r() * c.width, r() * c.height, .6 + 2.6 * r() ** 3, 0, 7); x.fill(); }
  x.globalAlpha = .55; x.lineWidth = 2; for (let i = 0; i < 5; i++) { const y = r() * c.height; x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y + (r() - .5) * 20); x.stroke(); }
  return c;
}
const FONT = px => `${px}px Impact, "Arial Black", sans-serif`;
export function makeFail() {
  const c = document.createElement('canvas'); c.width = 320; c.height = 140; const x = c.getContext('2d');
  x.strokeStyle = x.fillStyle = STAMP; x.lineWidth = 9; x.strokeRect(8, 8, 304, 124); x.lineWidth = 3; x.strokeRect(20, 20, 280, 100);
  x.font = FONT(96); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('FAIL', 160, 74);
  return distress(c, 61, 900);
}
export function makeOk() {
  const c = document.createElement('canvas'); c.width = c.height = 170; const x = c.getContext('2d');
  x.strokeStyle = x.fillStyle = STAMP; x.lineWidth = 9; x.beginPath(); x.arc(85, 85, 76, 0, 7); x.stroke();
  x.lineWidth = 3; x.beginPath(); x.arc(85, 85, 62, 0, 7); x.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.arc(85 + Math.cos(a) * 69, 85 + Math.sin(a) * 69, 2.2, 0, 7); x.fill(); }
  x.font = FONT(74); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('OK', 85, 89);
  return distress(c, 67, 700);
}
