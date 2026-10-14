// L4/kit.js — from the clipforge ink_pattern kit (own code, MIT with this repo). Only import paths changed.
// Kept: xform, mapPts, region, lgrid, the boat (split into hull() and rig() so the hero can stand between them) and the marlin fish().
// No people (the old man / boy are not used: the only one in the boat is our hero).
import { TAU, arc, line, polyPath } from './pen.js';

export function xform(x, y, s = 1, a = 0, flip = 1) {
  const c = Math.cos(a), sn = Math.sin(a), T = (u, v) => { u *= s * flip; v *= s; return [x + u * c - v * sn, y + u * sn + v * c]; };
  T.s = s; return T;
}
export const mapPts = (pts, T) => { const o = []; for (let i = 0; i < pts.length; i += 2) o.push(...T(pts[i], pts[i + 1])); return o; };
export function region(P, T, poly, t0, t1, motif, { fc = null, outline = true, clip = null } = {}) {
  const Wp = mapPts(poly, T), cl = clip ? [].concat(clip, polyPath(Wp)) : polyPath(Wp);
  P.group(t0, t1, () => { const s = P.items.length;
    if (fc) P.add(poly.concat(poly[0], poly[1]), { fill: poly, fc, amp: 0, raw: true, st: { kind: 'pen', col: fc, w: 1, a: 1 } });
    motif(); P.xf(s, T); }, cl);
  if (outline) P.group(t0, t0 + (t1 - t0) * .3, () => { const s = P.items.length; P.add(poly.concat(poly[0], poly[1]), { raw: true }); P.xf(s, T); }, clip);
}
const lgrid = (P, T, x0, y0, x1, y1, gap, d) => { for (let y = y0; y < y1; y += gap / T.s) for (let x = x0 + ((y / (gap / T.s)) % 2) * gap / T.s / 2; x < x1; x += gap / T.s) P.dot(x, y, d); };

// ---- boat: planked hull; mast + patchwork sail (each patch its own motif) ----
export const HULL = [-125, -8, 130, -8, 98, 30, -82, 30];
export function hull(P, T, { ink, PAP }) {
  P.pen(ink, 1, .92); region(P, T, HULL, 0, 1, () => { for (let v = -6; v < 31; v += 3 / T.s) P.add(line(-130, v, 135, v), { amp: .3 }); for (let u = -100; u < 120; u += 40) P.add(line(u, -8, u - 4, 30), { amp: .2 }); }, { fc: PAP });
  P.pen(ink, 2, .95); P.group(0, 1, () => { const s = P.items.length; P.add(HULL.concat(HULL[0], HULL[1]), { raw: true }); P.xf(s, T); });   // a firmer rim (ours)
}
export function rig(P, T0, { ink, ink2, PAP, sailFlip = -1 }) {
  P.pen(ink, 1.8, .95); P.group(0, 1, () => { const s = P.items.length; P.add(line(2, -8, 2, -200), { amp: .3 }); P.xf(s, T0); });
  const SAIL = [6, -196, 6, -16, 104, -22], T = Object.assign((u, v) => T0(2 + (u - 2) * sailFlip, v), { s: T0.s });
  P.pen(ink2, .95, .92); region(P, T, SAIL, 0, 1, () => {
    for (let k = 0; k < 6; k++) { const y0 = -196 + k * 30, y1 = y0 + 30; P.add(line(0, y1, 110, y1), { amp: .2 });
      if (k % 3 === 0) for (let v = y0 + 2; v < y1; v += 3 / T.s) P.add(line(0, v, 110, v - 6), { amp: .15 });
      else if (k % 3 === 1) lgrid(P, T, 4, y0 + 4, 108, y1, 7, 1.2);
      else { for (let u = 2; u < 110; u += 4 / T.s) P.add(line(u, y0, u + 8, y1), { amp: .15 }); for (let u = 2; u < 110; u += 8 / T.s) P.add(line(u + 8, y0, u, y1), { amp: .15 }); } }
    for (let k = 0; k < 6; k++) { const y = -190 + k * 30; P.add(line(14, y, 20, y + 6), { amp: .1 }); P.add(line(20, y, 14, y + 6), { amp: .1 }); }
  }, { fc: PAP });
}

// ---- big fish (marlin), facing +u: scale rows, dot stripes, sail fin, crescent tail. Local length ~500 ----
export const FISH = [262, -3, 200, -6, 178, -20, 150, -38, 100, -48, 20, -50, -60, -42, -130, -26, -175, -8, -175, 8, -130, 24, -40, 38, 60, 42, 140, 30, 180, 14, 200, 4, 262, 0];
const DORSAL = [120, -45, 95, -115, 60, -128, 20, -110, -10, -75, -30, -46];
const TAIL = [-170, -6, -212, -58, -240, -74, -210, 0, -240, 74, -212, 58, -170, 6];
const PECT = [120, 20, 80, 58, 98, 22];
export function fish(P, T, { ink, ink2, PAP, halo = false, fc = PAP }) {
  const t0 = 0, t1 = 1, d = 1, clip = null, o = { fc, clip }, rim = (w, col, a) => { P.pen(col, w, a); P.group(t0, t0 + d * .3, () => { const s = P.items.length; for (const q of [FISH, DORSAL, TAIL]) P.add(q.concat(q[0], q[1]), { raw: true }); P.xf(s, T); }, clip); };
  if (halo) rim(14, PAP, 1);
  P.pen(ink, .9, .92); region(P, T, DORSAL, t0, t0 + d * .35, () => { for (let i = 0; i <= 12; i++) { const u = -28 + i * 12.5; P.add(line(u, -46, 95 - (12 - i) * 5, -125 + Math.abs(i - 7) * 4), { amp: .2 }); P.add(line(u + 3, -46, 97 - (12 - i) * 5, -122 + Math.abs(i - 7) * 4), { amp: .2 }); } }, o);
  P.pen(ink, .9, .92); region(P, T, TAIL, t0 + d * .1, t0 + d * .4, () => { for (let i = -8; i <= 8; i++) P.add(line(-172, i * .7, -236, i * 9), { amp: .2 }); }, o);
  P.pen(ink, .85, .92); region(P, T, FISH, t0 + d * .2, t1, () => {
    for (let v = -50, row = 0; v < 46; v += 8, row++) for (let u = -176 + (row % 2) * 5; u < 200; u += 10) P.add(arc(u, v, 5.5, Math.PI / 2, Math.PI * 1.5, 2), { amp: .1 });
    P.pen(ink2, .9, .95); for (let u = -110; u < 150; u += 34) for (let v = -44; v < 38; v += 7) P.dot(u + v * .15, v, 1.6);
    P.pen(ink, .85, .92); P.add(line(178, -20, 170, 14), { amp: .2 }); P.add(line(183, -17, 176, 12), { amp: .2 });
  }, o);
  P.pen(ink, .9, .92); region(P, T, PECT, t0 + d * .7, t1, () => { for (let i = 0; i < 6; i++) P.add(line(118 - i * 3, 21, 82 + i * 3, 56 - i * 5), { amp: .1 }); }, o);
  P.pen(ink, 1, .95); P.group(t0 + d * .8, t1, () => { const s = P.items.length; P.add(arc(176, -12, 7, 0, TAU, 2), { amp: .1 }); P.dot(177, -12, 3); P.add(line(200, -3, 262, -2), { amp: .1 }); P.xf(s, T); }, clip);
  if (halo) rim(1.9, ink, .95);
}
