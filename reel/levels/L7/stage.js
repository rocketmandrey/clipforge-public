// L7/stage.js — from the clipforge chibi_paper kit (own code, MIT with this repo). Only import paths changed.
// stage.js: shared bits for chibi_paper episodes — timing helpers, a run cycle, and kid(): a hero drawn on the sheet from a cache.
import { drawChibi, cutout } from './chibi.js';
import { HEROES } from './heroes.js';

export const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ss = x => { x = cl(x); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => ss((t - a) / (b - a)), lerp = (a, b, u) => a + (b - a) * u;
export const onTwos = T => Math.floor(T * 12) / 12;   // 12 drawings per second, like the ref
// talk windows: { who: [[t0, t1], ...] } → mouth flaps at 8 Hz inside a window
export const talking = (TALK, who, t) => (TALK[who] || []).some(([a, b]) => t > a && t < b) && Math.floor(t * 8) % 2 === 0;
// run from x0 to x1 over [t0, t1]: profile turned toward the run, legs/arms swing, body bobs
export const run = (t, t0, t1, x0, x1) => { const u = seg(t, t0, t1), on = t > t0 && t < t1, ph = (t - t0) * 14;
  return { x: lerp(x0, x1, u), on, bob: on ? -Math.abs(Math.sin(ph)) * 10 : 0,
    pose: on ? { yaw: Math.sign(x1 - x0) * Math.PI / 2, legL: Math.sin(ph) * .5, legR: -Math.sin(ph) * .5, armL: .4 - Math.sin(ph) * .4, armR: .4 + Math.sin(ph) * .4 } : {} }; };

// kid(c, id, {x, y, pose, k, clipY, spin, spinY, spec}) — feet at (x, y), scale k; clipY hides everything below it (slits, sand, piles);
// spec overrides fields of the hero (e.g. drop a judge's printed sign)
const CACHE = new Map();
export function kid(c, id, st) {
  const k = st.k ?? .62, key = JSON.stringify([id, st.pose || {}, st.spec || 0]);
  let cv = CACHE.get(key); if (!cv) { cv = cutout(cc => drawChibi(cc, { ...HEROES[id], ...st.spec }, st.pose || {}), { w: 400, h: 480, ox: 200, oy: 440 }); if (CACHE.size > 500) CACHE.clear(); CACHE.set(key, cv); }
  c.save();
  if (st.clipY != null) { c.beginPath(); c.rect(-2000, -2000, 5000, st.clipY + 2000); c.clip(); }
  c.translate(st.x, st.y); if (st.rot) c.rotate(st.rot);   // rot: whole figure sways about its feet (free: no new cutout)
  if (st.spin) { const sy = st.spinY ?? 110; c.translate(0, -sy * k); c.rotate(st.spin); c.translate(0, sy * k); }
  c.scale(k, k);
  if (st.shadow !== false) { c.save(); c.filter = 'brightness(0) blur(5px)'; c.globalAlpha = .2; c.drawImage(cv, -200 + 5, -440 + 7); c.restore(); }   // soft shadow: the drawing lifts off the sheet a little (no white margin)
  c.drawImage(cv, -200, -440); c.restore();
}

// follow-through for a bend that moves over time: bendAt(f, t) → {bend, head, armL, armR} additions; the head and the arms trail the
// torso by ~0.12 / 0.18 s and then catch up (f: t → bend in rad).  Spread into a pose: { ...pose, ...bendAt(f, t) }.
export const bendAt = (f, t, pose = {}) => { const b = f(t), dh = f(t - .12) - b, da = f(t - .18) - b;
  return { bend: b, head: (pose.head || 0) + dh * 1.1, armL: (pose.armL ?? 0) - da * 1.4, armR: (pose.armR ?? 0) + da * 1.4 }; };
