// L4/patterns.js — from the clipforge ink_pattern kit (own code, MIT with this repo). Only import paths changed.
// patterns.js: ornamental pen/pencil fill generators for the ink_pattern look (ref: kevin_t_ngo «JavaScript drawings by Claude Opus 5.5»).
// Every generator only adds strokes to a pen.js Plot; shape a region with Plot.group(t0, t1, fn, clipPath2D).
import { TAU, arc, rot, line } from './pen.js';

// parallel lines at angle a across a disc (cx,cy,R) — clip makes the real shape; jit = random gaps/length (hand hatching)
export function hatch(P, cx, cy, R, a, gap, { jit = .25, seg = 0 } = {}) {
  const r = P.r, ca = Math.cos(a), sa = Math.sin(a);
  for (let o = -R; o <= R; o += gap * (1 + (r() - .5) * jit)) {
    const h = Math.sqrt(Math.max(0, R * R - o * o)); if (h < 2) continue;
    const mx = cx - sa * o, my = cy + ca * o;
    if (seg) { for (let u = -h; u < h; u += seg * (.6 + r() * .8)) { const l = seg * (.5 + r() * .5); P.add(line(mx + ca * u, my + sa * u, mx + ca * (u + l), my + sa * (u + l))); } }
    else { const e0 = -h * (1 - r() * jit * .2), e1 = h * (1 - r() * jit * .2); P.add(line(mx + ca * e0, my + sa * e0, mx + ca * e1, my + sa * e1)); }
  }
}
export const cross = (P, cx, cy, R, a, gap, o) => { hatch(P, cx, cy, R, a, gap, o); hatch(P, cx, cy, R, a + Math.PI / 2.3, gap * 1.3, o); };

// fan scale: base point (x,y), opens toward angle dir, radius R. Ref-style: every rib is a bundle of 2-3 parallel lines from an
// inner arc to a double rim, a knob at the pivot; vary=true picks a dress per fan (plain / dots between ribs / zigzag star / lattice ticks).
// fc = paper colour fill (hides the hatching below)
export function fan(P, x, y, R, dir, { spokes = 9, span = 2.5, dots = false, fc = null, rim2 = true, vary = false, bundle = 3 } = {}) {
  const r = P.r, a0 = dir - span / 2, a1 = dir + span / 2, sh = [x, y, ...arc(x, y, R, a0, a1, 3)], v = vary ? r() * 4 | 0 : 0, ri = R * .3;
  const at = (a, q) => [x + Math.cos(a) * q, y + Math.sin(a) * q], step = (a1 - a0) / spokes;
  P.add(sh.concat(x, y), { fill: fc ? sh : null, fc, amp: .25 });
  if (rim2) P.add(arc(x, y, R * .9, a0 + .03, a1 - .03, 3), { amp: .15 });
  P.add(arc(x, y, ri, a0, a1, 2), { amp: .1 });
  for (let i = 1; i < spokes; i++) { const a = a0 + step * i;   // rib bundle: parallel offsets across the rib
    for (let k = 0; k < bundle; k++) { const o = (k - (bundle - 1) / 2) * Math.max(.9, R * .035), nx = -Math.sin(a) * o, ny = Math.cos(a) * o, [xa, ya] = at(a, ri), [xb, yb] = at(a, R * (rim2 ? .9 : .97));
      P.add(line(xa + nx, ya + ny, xb + nx, yb + ny), { amp: .12 }); } }
  if (v === 1 || dots) for (let i = 0; i < spokes; i++) P.dot(...at(a0 + step * (i + .5), R * (.5 + (i % 2) * .2)), Math.max(1, R * .055));   // dots between ribs
  if (v === 2) { const z = []; for (let i = 0; i <= spokes * 2; i++) z.push(...at(a0 + step * i / 2, R * (i % 2 ? .48 : .86))); P.add(z, { amp: .15 }); }   // zigzag star
  if (v === 3) for (let i = 0; i < spokes; i++) for (const q of [.62, .74]) { const b = a0 + step * i; P.add(line(...at(b + step * .15, R * q), ...at(b + step * .85, R * q)), { amp: .1 }); }   // lattice ticks
  P.dot(x, y, Math.max(1.2, R * .07));   // pivot knob
}

// rows of fans on rings around (cx,cy): radii r0..r1, each fan opens outward; rotation spin(row).
// rowGap / gap (in fan sizes) leave hatched sky between the fans, as in the ref
// up = 0..1 pulls each fan from facing outward toward facing up (ref fans stand mostly upright)
export function fanRings(P, cx, cy, r0, r1, size, { spin = () => 0, styleAt = null, rowGap = .9, gap = 1.25, up = 0, ...o } = {}) {
  let row = 0;
  for (let R = r0; R < r1; R += size * rowGap, row++) {
    const n = Math.max(6, Math.round(TAU * R / (size * gap))), ph = spin(row) + (row % 2) * Math.PI / n;
    for (let i = 0; i < n; i++) { const a = ph + TAU * i / n; if (styleAt) styleAt(P, R, a, row);
      fan(P, cx + Math.cos(a) * R, cy + Math.sin(a) * R, size * (.85 + P.r() * .2), a + Math.atan2(Math.sin(-Math.PI / 2 - a), Math.cos(-Math.PI / 2 - a)) * up, o); }
  }
}

export function dotRing(P, cx, cy, R, n, d, ph = 0) { for (let i = 0; i < n; i++) { const a = ph + TAU * i / n; P.dot(cx + Math.cos(a) * R, cy + Math.sin(a) * R, d); } }
export function beadRing(P, cx, cy, R, n, d, ph = 0) { for (let i = 0; i < n; i++) { const a = ph + TAU * i / n; P.add(arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, d, 0, TAU, 3), { amp: .2 }); } }
// scallop clusters: little triangles of circles ("grapes") around a ring
export function clusterRing(P, cx, cy, R, n, d, ph = 0) {
  for (let i = 0; i < n; i++) { const a = ph + TAU * i / n, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    for (let row = 0; row < 3; row++) for (let k = 0; k <= row; k++) { const u = (k - row / 2) * d * 1.8, v = (row - 1) * d * 1.6;
      const px = x + Math.cos(a) * -v + Math.cos(a + Math.PI / 2) * u, py = y + Math.sin(a) * -v + Math.sin(a + Math.PI / 2) * u; P.add(arc(px, py, d, 0, TAU, 2.5), { amp: .15 }); } }
}
// feather swirl: short curved strokes tangent to rings, sheared into a spiral
export function swirl(P, cx, cy, r0, r1, n, len, ph = 0, twist = .9) {
  const r = P.r;
  for (let i = 0; i < n; i++) { const R = r0 + (r1 - r0) * r(), a = ph + r() * TAU + (R - r0) / (r1 - r0) * twist, l = len * (.5 + r());
    P.add(arc(cx, cy, R, a, a + l / R, 5), { amp: .5 }); }
}

// horizontal motifs between x0..x1 at baseline y (phase = scroll)
export function wave(P, x0, x1, y, amp, per, ph = 0) { const p = []; for (let x = x0; x <= x1; x += 4) p.push(x, y + Math.sin((x / per + ph) * TAU) * amp); P.add(p, { amp: .3 }); }
export function zigzag(P, x0, x1, y, amp, per) { const p = []; let k = 0; for (let x = x0; x <= x1 + .1; x += per / 2, k++) p.push(x, y + (k % 2 ? -amp : amp)); P.add(p, { amp: .5 }); }
// fixed count (rng stays in step while ph scrolls)
export function scallops(P, x0, x1, y, R, ph = 0) { const s = x0 - 2 * R + ((ph * 2 * R) % (2 * R) + 2 * R) % (2 * R), n = Math.ceil((x1 - x0) / (2 * R)) + 2;
  for (let i = 0; i < n; i++) P.add(arc(s + i * 2 * R, y, R, Math.PI, TAU, 4), { amp: .4 }); }
export function dotLine(P, x0, y0, x1, y1, gap, d) { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / gap); for (let i = 0; i <= n; i++) P.dot(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, d); }
export function dashLine(P, x0, y0, x1, y1, dash, gap) { const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
  for (let s = 0; s < L; s += dash + gap) P.add(line(x0 + ux * s, y0 + uy * s, x0 + ux * Math.min(L, s + dash), y0 + uy * Math.min(L, s + dash))); }
export function diamonds(P, x0, x1, y, w, h) { for (let x = x0 + w / 2; x < x1; x += w * 1.2) P.add([x - w / 2, y, x, y - h, x + w / 2, y, x, y + h, x - w / 2, y], { amp: .4 }); }

// stipple / crayon: many tiny dots inside a disc; keep(x,y) filters to a region
export function stipple(P, cx, cy, R, n, d, keep = () => true) {
  const r = P.r; for (let i = 0; i < n; i++) { const a = r() * TAU, q = Math.sqrt(r()) * R, x = cx + Math.cos(a) * q, y = cy + Math.sin(a) * q; const k = keep(x, y); if (k) P.dot(x, y, d * (.5 + r())); }
}
// ---- moon-mandala motifs (ref p3) ----
// triangles pointing outward, each packed with rows of tiny circles ("grapes"), around a ring
export function triRing(P, cx, cy, R, n, h, d, ph = 0) {
  for (let i = 0; i < n; i++) { const a = ph + TAU * i / n, ca = Math.cos(a), sa = Math.sin(a), at = (u, v) => [cx + ca * (R + u) - sa * v, cy + sa * (R + u) + ca * v];
    const rows = Math.max(2, Math.round(h / (d * 1.7)));
    for (let k = 0; k < rows; k++) { const u = -h / 2 + (k + .5) * h / rows, half = (rows - k) * d * .95, m = Math.max(1, Math.round(half * 2 / (d * 2)));
      for (let j = 0; j < m; j++) { const [x, y] = at(u, -half + d + j * (2 * half - 2 * d) / Math.max(1, m - 1)); P.add(arc(x, y, d, 0, TAU, 2), { amp: .1 }); } } }
}
// a ring of outward half-circles (scallop band)
export function scallopRing(P, cx, cy, R, n, ph = 0) { const w = Math.PI / n;
  for (let i = 0; i < n; i++) { const a = ph + TAU * i / n, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, s = R * Math.sin(w) * .95; P.add(arc(x, y, s, a - Math.PI / 2, a + Math.PI / 2, 2.5), { amp: .2 }); } }
// radial ticks around a ring
export function tickRing(P, cx, cy, R, n, len, ph = 0) { for (let i = 0; i < n; i++) { const a = ph + TAU * i / n; P.add(line(cx + Math.cos(a) * R, cy + Math.sin(a) * R, cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len)), { amp: .2 }); } }
// feather: curved spine along a ring arc (radius R, from angle a, length len) with barbs on both sides
export function feather(P, cx, cy, R, a, len, w, { barb = 3.2 } = {}) {
  const n = Math.max(3, Math.round(len / barb)), da = len / R / n, sp = [];
  for (let i = 0; i <= n; i++) { const b = a + da * i, q = R + Math.sin(i / n * Math.PI) * w * .25; sp.push(cx + Math.cos(b) * q, cy + Math.sin(b) * q); }
  P.add(sp, { amp: .2 });
  for (let i = 1; i < n; i++) { const x = sp[2 * i], y = sp[2 * i + 1], b = a + da * i, tw = w * Math.sin(i / n * Math.PI), tx = -Math.sin(b), ty = Math.cos(b), rx = Math.cos(b), ry = Math.sin(b);
    for (const s of [-1, 1]) P.add(line(x, y, x + (rx * s * .9 + tx * .7) * tw, y + (ry * s * .9 + ty * .7) * tw), { amp: .1 }); }
}
// ring of feathers swirling around (cx,cy)
export function featherRing(P, cx, cy, R, n, len, w, ph = 0, o) { for (let i = 0; i < n; i++) feather(P, cx, cy, R * (.96 + P.r() * .08), ph + TAU * i / n, len * (.8 + P.r() * .4), w, o); }
// crater: rim ring + hatched shadow crescent (light from lx,ly direction)
export function crater(P, x, y, R, lx = -1, ly = -1, gap = 2) {
  P.add(arc(x, y, R, 0, TAU, 2), { amp: .15 });
  const L = Math.hypot(lx, ly), ux = lx / L, uy = ly / L;
  for (let o = -R; o <= R; o += gap) { const h = Math.sqrt(R * R - o * o) * .9; const sx = x - uy * o, sy = y + ux * o;   // lines across, on the lit side's opposite half
    P.add(line(sx + ux * h * .15, sy + uy * h * .15, sx + ux * h, sy + uy * h), { amp: .1 }); }
}
export { rot };
