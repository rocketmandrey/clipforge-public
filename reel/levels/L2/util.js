// L2/util.js — from the clipforge riso kit (own code, MIT with this repo). Only import paths changed.
// riso/util.js: pure helpers for riso pages (no DOM, node-importable). Self-test: node engine/riso/util.test.mjs
// usage:
//   env(T, kicks, 0, .09)            -> 1 on the hit frame, exp decay after (pass T = t + .5/fps so a hit lands on round(hit*fps))
//   lastHit(T, kicks) -> {i, dt}     jolt(T, kicks, ['y','m','c'], 12) -> {y:[dx,dy], ...} plates thrown apart, settled in ~120 ms
//   strobe(T, .103, ['m','c'])       -> {m:1, c:0} one plate off per step (16ths at 146 BPM = .103 s)
//   morph(polyA, polyB, k, 48)       -> arc-length resample + best-rotation (and direction) match + lerp of two closed polylines
//   rnd(seed) 0..1, noise1(x) 0..1 smooth, ease(x) smoothstep on clamp(x)
export const rnd = s => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, k) => a + (b - a) * k;
export function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(rnd(i), rnd(i + 1), u); }

// impulse envelope over a sorted hits list: linear attack (s), exponential decay (s); max over hits
export function env(T, hits, attack = 0, decay = .15) {
  let v = 0;
  for (const h of hits) { const x = T - h; if (x < 0) break; v = Math.max(v, x < attack ? x / attack : Math.exp(-(x - attack) / decay)); }
  return v;
}
export function lastHit(T, hits) { let i = -1; while (i + 1 < hits.length && hits[i + 1] <= T) i++; return { i, dt: i < 0 ? Infinity : T - hits[i] }; }

// kick jolt: each plate jumps amp px in its own random direction (new per hit), damped spring that settles in ~settle s
export function jolt(T, hits, plates, amp = 10, settle = .12) {
  const { i, dt } = lastHit(T, hits), k = i < 0 ? 0 : amp * Math.exp(-dt / (settle / 3.5)) * Math.cos(dt / settle * Math.PI * 1.5), o = {};
  plates.forEach((p, j) => { const a = rnd(i * 13.1 + j * 7.7) * 6.2832; o[p] = [Math.cos(a) * k, Math.sin(a) * k]; });
  return o;
}
// strobe: steps of `period`; on each step one of `plates` is off, cycling
export function strobe(T, period, plates) { const s = Math.floor(T / period) % plates.length, o = {}; plates.forEach((p, j) => o[p] = j === s ? 0 : 1); return o; }

// ---- shape morph (closed polylines of [x,y]) ----
export function resample(pts, n) {
  const m = pts.length, L = [0];
  for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % m]; L.push(L[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const out = []; let j = 0;
  for (let k = 0; k < n; k++) {
    const s = k * L[m] / n; while (j < m - 1 && L[j + 1] < s) j++;
    const a = pts[j], b = pts[(j + 1) % m], u = (s - L[j]) / ((L[j + 1] - L[j]) || 1);
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}
// reorder b (same length as a) by the cyclic shift and direction that minimise the summed squared distance to a
export function match(a, b) {
  const n = a.length; let best = null, bd = Infinity;
  for (const c of [b, [...b].reverse()]) for (let r = 0; r < n; r++) {
    let d = 0; for (let i = 0; i < n && d < bd; i++) { const p = a[i], q = c[(i + r) % n]; d += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; }
    if (d < bd) { bd = d; best = c.map((_, i) => c[(i + r) % n]); }
  }
  return best;
}
export const lerpPoly = (a, b, k) => a.map((p, i) => [lerp(p[0], b[i][0], k), lerp(p[1], b[i][1], k)]);
export function morph(A, B, k, n = 48) { const a = resample(A, n); return lerpPoly(a, match(a, resample(B, n)), k); }
