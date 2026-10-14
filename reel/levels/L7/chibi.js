// L7/chibi.js — from the clipforge chibi_paper kit (own code, MIT with this repo). Only import paths changed.
// chibi.js: procedural colored-pencil chibi kid on a connected 2.5D rig (chibi_paper look, ref kevin_t_ngo «animated GIFs on
// paper using JavaScript»), drawn the way a child draws with coloured pencils: shapes → scribble fill that misses the line → thin wobbly lead outline.
//
// Model (fixed proportions, chibi like the ref: head ≈ half the height):  feet y=0, hip −54, shoulder −118, head centre −190,
// head 80×74.  The head is a sphere: hair = head minus the face patch, the face patch and every facial feature sit at an azimuth
// and slide with the turn (yaw), so the hair, eyes and ears stay glued together from front to back.  Limbs are ONE segment each,
// hung from fixed joints, overlapping the torso, so nothing can fall off.
//
// drawChibi(c, spec, pose):  pose = { yaw (0 front, ±.6 3/4, ±π/2 profile, π back; + turns to screen right), lean, sx, sy,
//   armL/armR (rad: 0 hangs, π/2 forward/out, 2.6 up), legL/legR (rad about the hip), head (tilt), look (−1..1),
//   emo (preset) or eyes/brows/mouth, cover (right hand over the eyes), arms: 'hold',
//   elbowL/elbowR (forearm bend, rad, + = further round the same way as the arm), kneeL/kneeR (shin bend, raw rad),
//   bend (upper body tilt about the hip), shrug (px: shoulders up, neck in), drop (px: pelvis down — sit/kneel),
//   fore (thigh length 0..1: <1 = thigh points at the camera, sitting), shin (shin length 0..1: 0 = kneeling),
//   fx: 'tear sweat blush' (space-separated extras on the face) }
// Each part has its own seeded rng (hero seed + part name): poses and expressions never re-roll the hatching (no boil).
import { rng, grainStyle } from './pen.js';

export const TAU = Math.PI * 2;
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };
const cl = (x, a, b) => Math.max(a, Math.min(b, x));

// ---- path helpers (each keeps its outline points in .pts for the wobbly hand line) ----
const keep = (p, pts) => (p.pts = pts, p);
export const ell = (x, y, rx, ry, a = 0) => { const p = new Path2D(), pts = []; rx = Math.max(.5, rx); ry = Math.max(.5, ry); p.ellipse(x, y, rx, ry, a, 0, TAU);
  for (let i = 0; i < 32; i++) { const t = i / 32 * TAU, u = Math.cos(t) * rx, v = Math.sin(t) * ry; pts.push(x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)); } return keep(p, pts); };
export const rr = (x, y, w, h, r) => { const p = new Path2D(), pts = []; p.roundRect(x, y, w, h, r); r = Math.min(r, w / 2, h / 2);
  for (const [cx, cy, a0] of [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]])
    for (let i = 0; i <= 4; i++) { const t = a0 + i / 4 * Math.PI / 2; pts.push(cx + Math.cos(t) * r, cy + Math.sin(t) * r); } return keep(p, pts); };
export const poly = pts => { const p = new Path2D(); p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); p.closePath(); return keep(p, pts); };
export const capsule = (x0, y0, x1, y1, w) => { const a = Math.atan2(y1 - y0, x1 - x0), pts = [];
  for (let i = 0; i <= 8; i++) { const t = a - Math.PI / 2 + i / 8 * Math.PI; pts.push(x1 + Math.cos(t) * w / 2, y1 + Math.sin(t) * w / 2); }
  for (let i = 0; i <= 8; i++) { const t = a + Math.PI / 2 + i / 8 * Math.PI; pts.push(x0 + Math.cos(t) * w / 2, y0 + Math.sin(t) * w / 2); }
  return poly(pts); };

// ---- child's coloured pencil ----
// fill: one-direction scribble at a per-part angle, shifted a few px off the outline (spills out on one side, white gap on the
// other), strokes skipped or broken here and there, pressure varies per part and per stroke.  outline: thin graphite line that
// wobbles, starts anywhere, over- or under-shoots the join, sometimes goes round twice.  Every random draw comes from the part's
// seeded rng in a fixed count, so a pose never re-rolls the drawing (no boil).
const LEAD = 'rgba(34,28,26,', INKC = '#24201e', LINE = '#221d1b';   // colouring-book line: dark, confident
export function pencil(c, path, col, r, { gap = 5, outline = true, rule = 'nonzero', press = 1 } = {}) {
  const ang = -1.05 + (r() - .5) * .7, dx = (r() - .5) * 9, dy = (r() - .5) * 7, pr = (.8 + r() * .2) * press;
  if (outline) { c.save(); c.globalAlpha = .9; c.fillStyle = '#f1ede4'; c.fill(path, rule); c.restore(); }   // a part covers what is under it (paper; ruling shows faintly)
  c.save(); c.translate(dx, dy); c.clip(path, rule); c.translate(-dx, -dy);
  c.globalAlpha = .36; c.fillStyle = col; c.fillRect(-400, -560, 800, 760);
  const q = path.pts; let mx = 0, my = -190; if (q) { mx = my = 0; for (let i = 0; i < q.length; i += 2) { mx += q[i]; my += q[i + 1]; } mx /= q.length / 2; my /= q.length / 2; }   // hatch centred on the shape
  c.translate(mx, my); c.rotate(ang); c.strokeStyle = grainStyle(c, col); c.lineCap = 'round';
  for (let o = -340; o < 340; o += gap * (.75 + r() * .5)) {
    const skip = r() < .1, a = (.8 + r() * .2) * pr, w = 2.6 + r() * 1.6, cut = r() < .25 ? -300 + r() * 600 : 999, j = (r() - .5) * 3;
    if (skip) continue; c.globalAlpha = a; c.lineWidth = w; c.beginPath(); c.moveTo(o, -340); c.lineTo(o + j, Math.min(340, cut)); if (cut < 340) { c.moveTo(o + j, cut + 6 + r() * 10); c.lineTo(o, 340); } c.stroke(); }
  c.rotate(.55); c.strokeStyle = grainStyle(c, shade(col, .72));   // second pass, darker, across the first: pressure builds colour like a real pencil
  for (let o = -340; o < 340; o += gap * 1.7) { const on = r() < .4, a = .35 + r() * .25, w = 1.8 + r() * 1.2, l0 = -340 + r() * 300, l1 = l0 + 120 + r() * 300;
    if (!on) continue; c.globalAlpha = a * pr; c.lineWidth = w; c.beginPath(); c.moveTo(o, l0); c.lineTo(o + 2, l1); c.stroke(); }
  c.restore();
  if (outline) kline(c, path, r);
}
export function kline(c, path, r, lw = 1.7) {
  const ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU], twice = r() < .22, over = (r() - .4) * .16, st = r(), wk = .8 + r() * .5;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const pts = path.pts;
  if (!pts) { c.strokeStyle = LEAD + '.85)'; c.lineWidth = lw * wk; c.translate(Math.cos(ph[2]) * .8, Math.sin(ph[2]) * .8); c.stroke(path);
    if (twice) { c.strokeStyle = LEAD + '.4)'; c.lineWidth = lw * .7; c.translate(Math.cos(ph[3]) * 2, Math.sin(ph[3]) * 2); c.stroke(path); } c.restore(); return; }
  const P = []; const n = pts.length / 2;   // resample every ~6 px so long edges wobble too
  for (let i = 0; i < n; i++) { const x0 = pts[2 * i], y0 = pts[2 * i + 1], x1 = pts[(2 * i + 2) % pts.length], y1 = pts[(2 * i + 3) % pts.length], m = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 6));
    for (let k = 0; k < m; k++) P.push([x0 + (x1 - x0) * k / m, y0 + (y1 - y0) * k / m]); }
  const N = P.length, s0 = Math.floor(st * N), L = Math.round(N * (1 + over));
  for (let pass = 0; pass < (twice ? 2 : 1); pass++) {   // whole stretches of the curve drift (not every point); width swells and thins along it
    c.strokeStyle = grainStyle(c, LINE); c.globalAlpha = pass ? .45 : 1;
    let prev = null;
    for (let i = 0; i <= L; i++) { const [x, y] = P[(s0 + i) % N], q = i / N * TAU, amp = pass ? 1.6 : .9;
      const pt = [x + Math.sin(q * 3 + ph[0] + pass * 2) * amp + Math.sin(q * 7 + ph[1]) * amp * .4, y + Math.sin(q * 4 + ph[2] + pass) * amp + Math.sin(q * 9 + ph[3]) * amp * .3];
      if (prev) { c.lineWidth = lw * (pass ? .7 : wk) * (1.1 + .55 * Math.sin(q * 2 + ph[0])); c.beginPath(); c.moveTo(...prev); c.lineTo(...pt); c.stroke(); }
      prev = pt; } }
  c.restore();
}
export const INK = INKC;
export const ink = (c, f, lw = 2.2) => { c.save(); c.strokeStyle = INKC; c.fillStyle = INKC; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); f(c); c.restore(); };

// ---- model constants ----
const HY = -190, HR = 80, HRY = 74, SHY = -118, HIPY = -54, ARM = 48, NECK = -126;
const ALPHA = 1.45;   // face patch half-width (rad of azimuth)

// emotions: eyes (open|happy|closed|half|wide|squint), brows (flat|up|angry|sad|sly), mouth (smile|open|o|flat|frown|grin|smirk|wavy|big)
export const EMO = {
  neutral: { eyes: 'open', brows: 'flat', mouth: 'smile' }, happy: { eyes: 'happy', brows: 'up', mouth: 'open' },
  laugh: { eyes: 'closed', brows: 'up', mouth: 'big' }, surprised: { eyes: 'wide', brows: 'up', mouth: 'o' },
  angry: { eyes: 'half', brows: 'angry', mouth: 'frown' }, sad: { eyes: 'open', brows: 'sad', mouth: 'frown' },
  sly: { eyes: 'half', brows: 'sly', mouth: 'smirk' }, scared: { eyes: 'wide', brows: 'sad', mouth: 'wavy' },
  sleepy: { eyes: 'closed', brows: 'flat', mouth: 'flat' }, shout: { eyes: 'squint', brows: 'angry', mouth: 'big' },
};

// sphere projection: point at azimuth az (0 = nose), height dy from the head centre → screen x; vis > 0 = facing the camera
const sx = (az, yaw, dy) => HR * Math.sin(az + yaw) * Math.sqrt(Math.max(0, 1 - (dy / HRY) ** 2));
const vis = (az, yaw) => Math.cos(az + yaw);

// ---- head: skin ball, face features, hair as (head − face patch), hats, ears ----
function hairlineY(s, u) {   // u −1..1 across the face patch → y of the hairline
  const base = HY - 26;
  if (s.hair === 'spiky') return base + (Math.abs((u * 3.5 + 10) % 1 - .5) * 2) * 16;
  if (s.hair === 'curly' || s.hair === 'afro' || s.hair === 'curlyLong') return base + 6 + Math.abs(Math.sin(u * 7)) * 9;
  if (s.hair === 'bob') return base + 14;
  return base + 4 + Math.abs(u) * 10 - Math.sin(u * 3 + 1) * 4;   // soft side-swept fringe
}
function facePatch(s, yaw) {
  const w = a => Math.atan2(Math.sin(a), Math.cos(a));   // wrap to −π..π
  const c0 = w(yaw); let a1 = c0 - ALPHA, a2 = c0 + ALPHA;
  if (a1 >= Math.PI / 2 || a2 <= -Math.PI / 2) return null;
  const lo = Math.max(a1, -Math.PI / 2), hi = Math.min(a2, Math.PI / 2), p = new Path2D(), N = 18, pts = [];
  const mer = (az, y) => HR * Math.sin(az) * Math.sqrt(Math.max(0, 1 - ((y - HY) / HRY) ** 2));
  for (let i = 0; i <= N; i++) { const az = lo + (hi - lo) * i / N, y = hairlineY(s, cl((az - c0) / ALPHA, -1, 1)); pts.push([mer(az, y), y]); }
  const yh = pts[N][1]; for (let i = 1; i <= 10; i++) { const y = yh + (HY + HRY - yh) * i / 10; pts.push([mer(hi, y), y]); }
  const yl = pts[0][1]; for (let i = 10; i >= 0; i--) { const y = yl + (HY + HRY - yl) * i / 10; pts.push([mer(lo, y), y]); }
  p.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) p.lineTo(x, y); p.closePath();
  return p;
}
function eye(c, x, y, k, kind, look) {   // k = foreshortening 0..1
  const w = 10 * k;
  if (kind === 'happy') return ink(c, z => { z.moveTo(x - 11 * k, y + 3); z.quadraticCurveTo(x, y - 11, x + 11 * k, y + 3); z.lineWidth = 3.4; z.stroke(); });
  if (kind === 'closed') return ink(c, z => { z.moveTo(x - 11 * k, y); z.quadraticCurveTo(x, y + 7, x + 11 * k, y); z.lineWidth = 3.4; z.stroke(); });
  if (kind === 'squint') return ink(c, z => { z.moveTo(x - 10 * k, y - 7); z.lineTo(x + 6 * k, y); z.lineTo(x - 10 * k, y + 7); z.lineWidth = 3.4; z.stroke(); });
  const wide = kind === 'wide', half = kind === 'half', ry = wide ? 14 : half ? 8 : 13, cy = y + (half ? 3 : 0);
  c.save();
  // compact dark eye (ref: colouring-book chibi): iris, lighter lower half, two highlights, upper lid; «wide» = bigger, no white sclera
  const ex = x + look * 2.5, ew = w * (wide ? .95 : .82), eh = ry * (wide ? .95 : .78);
  c.fillStyle = INK; c.beginPath(); c.ellipse(ex, cy, ew, eh, 0, 0, TAU); c.fill();
  c.fillStyle = '#6b4a35'; c.beginPath(); c.ellipse(ex, cy + eh * .45, ew * .62, eh * .38, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + ew * .32, cy - eh * .38, 3.4 * Math.max(.6, k), 0, TAU); c.fill(); c.beginPath(); c.arc(ex - ew * .35, cy + eh * .35, 1.6, 0, TAU); c.fill();
  c.restore();
  ink(c, z => { z.moveTo(x - ew * 1.35, cy - eh * .55); z.quadraticCurveTo(x, cy - eh * 1.45, x + ew * 1.35, cy - eh * .55); z.lineWidth = 2.6; z.stroke(); });
  if (half) ink(c, z => { z.moveTo(x - 13 * k, y - 4); z.lineTo(x + 13 * k, y - 4); z.lineWidth = 3.6; z.stroke(); });
}
function brow(c, x, y, k, kind, side) {
  const t = { flat: [0, 0], up: [-6, -6], angry: [-6 * side, 4 * side], sad: [4 * side, -5 * side], sly: side > 0 ? [-8, -4] : [0, 0] }[kind] || [0, 0];
  ink(c, z => { z.moveTo(x - 10 * k, y + t[0]); z.quadraticCurveTo(x, y - 4 + (t[0] + t[1]) / 2, x + 10 * k, y + t[1]); z.lineWidth = 2.6; z.globalAlpha = .85; z.stroke(); });
}
function mouth(c, x, y, k, kind) {
  const w = 9 * Math.max(.5, k);
  if (kind === 'open' || kind === 'big') { const h = kind === 'big' ? 20 : 14; c.save(); c.fillStyle = '#7a2a2a'; c.beginPath(); c.moveTo(x - w * 1.1, y - 3); c.quadraticCurveTo(x, y + h, x + w * 1.1, y - 3); c.closePath(); c.fill();
    c.fillStyle = '#e57b7b'; c.beginPath(); c.ellipse(x, y + h * .45, w * .55, h * .18, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x - w * 1.1, y - 3); c.quadraticCurveTo(x, y + h, x + w * 1.1, y - 3); c.closePath(); c.stroke(); c.restore(); return; }
  if (kind === 'grin') { c.save(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - w * 1.2, y - 3); c.quadraticCurveTo(x, y + 12, x + w * 1.2, y - 3); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke(); c.restore(); return; }
  if (kind === 'grit') { c.save(); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - w * 1.1, y - 5, w * 2.2, 11, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
    c.beginPath(); c.moveTo(x - w * 1.1, y + .5); c.lineTo(x + w * 1.1, y + .5); for (let i = -1; i <= 1; i++) { c.moveTo(x + i * w * .55, y - 5); c.lineTo(x + i * w * .55, y + 6); } c.lineWidth = 1.4; c.stroke(); c.restore(); return; }
  ink(c, z => {
    if (kind === 'pout') { z.moveTo(x - w * .55, y + 3); z.quadraticCurveTo(x, y - 4, x + w * .55, y + 3); z.moveTo(x - w * .3, y + 6); z.quadraticCurveTo(x, y + 9, x + w * .3, y + 6); z.lineWidth = 2.4; z.stroke(); return; }
    if (kind === 'o') { z.ellipse(x, y + 2, 5 * Math.max(.6, k), 6.5, 0, 0, TAU); z.fill(); return; }
    if (kind === 'flat') { z.moveTo(x - w * .7, y); z.lineTo(x + w * .7, y); }
    else if (kind === 'frown') { z.moveTo(x - w, y + 4); z.quadraticCurveTo(x, y - 5, x + w, y + 4); }
    else if (kind === 'smirk') { z.moveTo(x - w * .8, y + 1); z.quadraticCurveTo(x + w * .3, y + 4, x + w, y - 4); }
    else if (kind === 'wavy') { z.moveTo(x - w, y); for (let i = 1; i <= 4; i++) z.lineTo(x - w + i * w / 2, y + (i % 2 ? -3 : 3)); }
    else { z.moveTo(x - w, y - 2); z.quadraticCurveTo(x, y + 6, x + w, y - 2); }
    z.lineWidth = 2.6; z.stroke(); });
}

function face(c, s, P, yaw, R) {
  const E = { ...(EMO[P.emo] || EMO[s.emo] || EMO.neutral) }; for (const k of ['eyes', 'brows', 'mouth']) if (P[k]) E[k] = P[k];
  const look = P.look || 0, ey = HY + 10, r = R('blush');
  for (const side of [-1, 1]) { const az = side * .7, v = vis(az, yaw); if (v > .2) pencil(c, ell(sx(az, yaw, 28), HY + 28, 11 * v, 6.5), '#f08f8f', r, { outline: false, light: false }); }
  if (s.freckles) for (const side of [-1, 1]) { const az = side * .62, v = vis(az, yaw); if (v > .25) ink(c, z => { for (let k = 0; k < 4; k++) { const x = sx(az, yaw, 20) + (k - 1.5) * 4 * v, y = HY + 20 + (k % 2) * 4; z.moveTo(x + 1.1, y); z.arc(x, y, 1.1, 0, TAU); } z.fillStyle = '#9a5a3a'; z.fill(); }); }
  for (const side of [-1, 1]) { const az = side * .4, v = vis(az, yaw); if (v < .18) continue; const k = cl(v, .35, 1), x = sx(az, yaw, ey - HY);
    eye(c, x, ey, k, E.eyes, look); brow(c, x, ey - 22 - (E.eyes === 'wide' ? 4 : 0), k, E.brows, side); }
  if (s.glasses) ink(c, z => { for (const side of [-1, 1]) { const az = side * .4, v = vis(az, yaw); if (v < .18) continue; const x = sx(az, yaw, 10); z.moveTo(x + 18 * v, ey); z.ellipse(x, ey, 18 * Math.max(.4, v), 18, 0, 0, TAU); } z.lineWidth = 2.6; z.stroke(); });
  const vm = vis(0, yaw); if (vm > .2) mouth(c, sx(0, yaw, 38), HY + 38, vm, E.mouth);
  const fx = P.fx || '';
  if (fx.includes('blush')) for (const side of [-1, 1]) { const az = side * .66, v = vis(az, yaw); if (v > .2) { const x = sx(az, yaw, 26);
    pencil(c, ell(x, HY + 27, 17 * v, 9), '#e8606a', r, { outline: false }); ink(c, z => { for (let k = -1; k <= 1; k++) { z.moveTo(x + k * 7 * v - 3, HY + 31); z.lineTo(x + k * 7 * v + 3, HY + 22); } z.lineWidth = 1.6; z.strokeStyle = '#b8323c'; z.stroke(); }); } }
  if (fx.includes('tear')) for (const side of [-1, 1]) { const az = side * .4, v = vis(az, yaw); if (v > .3) { const x = sx(az, yaw, 20) + side * 4;
    c.save(); c.fillStyle = '#8fc4ef'; c.strokeStyle = '#3c74b0'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, ey + 10); c.quadraticCurveTo(x + 7, ey + 26, x, ey + 30); c.quadraticCurveTo(x - 7, ey + 26, x, ey + 10); c.fill(); c.stroke(); c.restore(); } }
  if (fx.includes('sweat')) { const x = sx(.95, yaw, -30) + 8; c.save(); c.fillStyle = '#bfe0fa'; c.strokeStyle = '#3c74b0'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, HY - 44); c.quadraticCurveTo(x + 10, HY - 24, x, HY - 20); c.quadraticCurveTo(x - 10, HY - 24, x, HY - 44); c.fill(); c.stroke(); c.restore(); }
  const sn = Math.sin(yaw); if (Math.abs(sn) > .35 && vm > 0) ink(c, z => { const x = sx(0, yaw, 22); z.moveTo(x, HY + 18); z.quadraticCurveTo(x + Math.sign(sn) * 6, HY + 24, x, HY + 27); z.lineWidth = 2; z.globalAlpha = .7; z.stroke(); });
}

function ears(c, s, yaw, R, front) {
  for (const side of [-1, 1]) { const az = side * Math.PI / 2, v = vis(az, yaw); if ((v > -.35) !== front) continue; if (v < -.6) continue;
    const x = sx(az, yaw, 6) * 1.01, k = cl(Math.abs(Math.sin(az + yaw)) * .5 + Math.max(0, v) * .6, .45, 1);
    pencil(c, ell(x, HY + 6, 11 * k, 14), s.skin, R('ear' + side)); }
}
// hair silhouette attachments outside the head ball (spikes, curls, bun, topknot) — on the sphere silhouette, so turn-safe
function hairOutline(c, s, yaw, R, back) {
  const col = s.hairCol, H = s.hair, r = R('hairO');
  if (H === 'spiky' && back) {   // drawn behind the ball: only the spikes stick out
    const p = new Path2D(), n = 9; p.moveTo(-HR - 2, HY + 4);
    for (let i = 0; i <= n; i++) { const a = Math.PI * 1.02 + i / n * Math.PI * .96, R2 = 30 - Math.abs(i - n / 2) * 2.5, am = a + Math.PI / n / 2;
      p.lineTo(Math.cos(a) * (HR + 4), HY + Math.sin(a) * (HRY + 4)); if (i < n) p.lineTo(Math.cos(am) * (HR + R2), HY + Math.sin(am) * (HRY + R2)); }
    p.lineTo(HR + 2, HY + 4); p.closePath(); pencil(c, p, col, r); }
  if ((H === 'curly' || H === 'afro' || H === 'curlyLong') && back) { const p = new Path2D(), n = H === 'afro' ? 14 : 11, rad = H === 'afro' ? 34 : 22, ext = H === 'afro' ? 22 : 6;
    for (let i = 0; i < n; i++) { const a = Math.PI * .92 + i / (n - 1) * Math.PI * 1.16; p.ellipse(Math.cos(a) * (HR + ext - 8), HY + Math.sin(a) * (HRY + ext - 8), rad, rad, 0, 0, TAU); }
    pencil(c, p, col, r); }
  if (H === 'bun') { const az = Math.PI * .85, v = vis(az, yaw); if ((v < 0) === back) { const x = HR * .32 * Math.sin(az + yaw); pencil(c, ell(x, HY - HRY - 4, 30, 26), col, r);
      if (back) { ink(c, z => { z.moveTo(x - 6, HY - HRY - 8); z.lineTo(x + 38, HY - HRY - 40); z.stroke(); }); pencil(c, ell(x + 40, HY - HRY - 42, 7, 7), '#ef8fa8', r); } } }
  if (H === 'topknot' && back) { const p = new Path2D(); for (let i = -3; i <= 3; i++) { p.moveTo(i * 5 - 6, HY - HRY + 4); p.lineTo(i * 11, HY - HRY - 38 + Math.abs(i) * 6); p.lineTo(i * 5 + 6, HY - HRY + 4); } pencil(c, p, col, r); }
}
function hatOn(c, s, yaw, R) {
  const r = R('hat');
  if (s.hat === 'beanie') {
    const top = new Path2D(); top.moveTo(-HR - 6, HY - 6); top.bezierCurveTo(-HR - 8, HY - 132, HR + 8, HY - 132, HR + 6, HY - 6); top.closePath();
    pencil(c, top, s.hatCol, r);
    c.save(); c.clip(top); for (let k = 0; k < 4; k++) pencil(c, rr(-120, HY - 104 + k * 26, 240, 11, 0), s.hatCol2, r, { outline: false }); c.restore(); kline(c, top, r);
    pencil(c, rr(-HR - 10, HY - 26, 2 * HR + 20, 30, 14), s.hatCol2, r);
    ink(c, z => { z.globalAlpha = .5; z.lineWidth = 1.2; for (let u = -HR - 4; u < HR + 8; u += 9) { z.moveTo(u, HY - 22); z.lineTo(u + 3, HY); } z.stroke(); });
    pencil(c, ell(Math.sin(yaw) * -6, HY - 110, 18, 16), s.hatCol, r);
  }
  if (s.hat === 'cap') {
    const crown = new Path2D(); crown.moveTo(-HR - 8, HY - 8); crown.bezierCurveTo(-HR - 16, HY - 118, HR + 14, HY - 118, HR + 8, HY - 18); crown.closePath();
    pencil(c, crown, s.hatCol, r);
    c.save(); c.clip(crown); c.strokeStyle = shade(s.hatCol, .55); c.globalAlpha = .7; c.lineWidth = 2.4; c.beginPath();
    for (let u = -110; u < 120; u += 22) { c.moveTo(u, HY - 130); c.lineTo(u + 10, HY); } for (let v = HY - 110; v < HY; v += 22) { c.moveTo(-110, v); c.lineTo(110, v + 4); } c.stroke(); c.restore();
    if (vis(0, yaw) > -.2) pencil(c, ell(Math.sin(yaw) * 70, HY - 12, 30 + 30 * Math.abs(Math.cos(yaw)), 14, -.12 * Math.cos(yaw)), shade(s.hatCol, .85), r);
  }
}
export const probe = {};   // last head transform, read by the stability check
function head(c, s, P, yaw, R) {
  probe.head = c.getTransform();
  const back = vis(0, yaw) < -.05;
  hairOutline(c, s, yaw, R, true);                 // behind the ball: spikes, curls, topknot, bun seen from the front
  ears(c, s, yaw, R, false);
  pencil(c, ell(0, HY, HR, HRY), s.skin, R('head'));
  if (!back) face(c, s, P, yaw, R);
  // hair = head ball minus the face patch (whole ball from the back)
  if (s.hair !== 'none') { const fp = facePatch(s, yaw), hp = new Path2D(); hp.ellipse(0, HY, HR, HRY, 0, 0, TAU); if (fp) hp.addPath(fp);
    pencil(c, hp, s.hairCol, R('hair'), { rule: 'evenodd' });
    const rs = R('strand'); ink(c, z => { z.globalAlpha = .4; z.lineWidth = 1.2; for (let i = 0; i < 12; i++) { const a = Math.PI * 1.1 + i / 11 * Math.PI * .8, j = (rs() - .5) * 10; z.moveTo(Math.cos(a) * HR * .9, HY + Math.sin(a) * HRY * .9); z.quadraticCurveTo(Math.cos(a) * HR * .6, HY + Math.sin(a) * HRY * .55, Math.cos(a) * HR * .4 + j, HY - 34); } z.stroke(); }); }
  if (s.hair !== 'none' && vis(0, yaw) < .3) { const ball = ell(0, HY, HR, HRY), nx = -Math.sin(yaw) * HR * .3, rn = R('nape');   // nape: skin under the hair at the back
    c.save(); c.clip(ball); pencil(c, ell(nx, HY + HRY * 1.02, HR * .42, HRY * .3), s.skin, rn); c.restore(); }
  hairOutline(c, s, yaw, R, false);                // spikes, curls, bun seen from the back
  ears(c, s, yaw, R, true);
  hatOn(c, s, yaw, R);
}

// ---- body ----
function torso(c, s, yaw, R) {
  const k = 1 - .28 * Math.abs(Math.sin(yaw)), T = new Path2D(), w0 = 30 * k, w1 = 40 * k;
  T.moveTo(-w0, NECK); T.lineTo(w0, NECK); T.quadraticCurveTo(w0 + 10, NECK + 2, w0 + 10, NECK + 14); T.lineTo(w1, HIPY + 2); T.lineTo(-w1, HIPY + 2); T.lineTo(-w0 - 10, NECK + 14); T.quadraticCurveTo(-w0 - 10, NECK + 2, -w0, NECK); T.closePath();
  const r = R('torso'), front = vis(0, yaw), fx = Math.sin(yaw) * 34 * k;   // front centre line on the torso cylinder
  pencil(c, T, s.topCol, r);
  c.save(); c.clip(T);
  if (s.top === 'stripes') for (let y = NECK + 8, i = 0; y < HIPY; y += 13, i++) if (i % 2) pencil(c, rr(-70, y, 140, 7, 0), s.topCol2, r, { outline: false });
  if (s.top === 'blocks' && front > -.1) { pencil(c, rr(-80, NECK - 10, 80 + fx, 100, 0), s.topCol2, r, { outline: false }); pencil(c, rr(fx, NECK - 10, 80, 100, 0), s.topCol3, r, { outline: false }); }
  if (s.top === 'raglan') for (const side of [-1, 1]) pencil(c, poly([side * 70, NECK - 10, side * 12, NECK - 10, side * 40, NECK + 40, side * 70, NECK + 40]), s.topCol2, r, { outline: false });
  c.restore();
  if (['stripes', 'blocks', 'raglan'].includes(s.top)) kline(c, T, r);
  if (front > .15) {
    if (s.top === 'blocks') ink(c, z => { z.moveTo(fx, NECK + 2); z.lineTo(fx, HIPY + 2); z.stroke(); });
    if (s.top === 'kimono') ink(c, z => { z.moveTo(fx - 22 * k, NECK); z.lineTo(fx + 8, NECK + 40); z.moveTo(fx + 22 * k, NECK); z.lineTo(fx - 4, NECK + 28); z.stroke(); });
    if (s.top === 'hoodie') ink(c, z => { z.moveTo(fx - 24 * k, NECK); z.quadraticCurveTo(fx, NECK + 18, fx + 24 * k, NECK); z.stroke(); });
    if (s.top === 'jacket') pencil(c, poly([fx - 10, NECK, fx + 10, NECK, fx + 12, HIPY + 2, fx - 12, HIPY + 2]), s.topCol2, r);
  }
  if (s.top === 'kimono') pencil(c, rr(-w1 - 2, HIPY - 22, 2 * w1 + 4, 14, 3), s.topCol2, r);
  if (s.top === 'overalls' || s.overalls) { const oc = s.overallCol || s.bottomCol; if (front > -.1) { pencil(c, poly([fx - 24 * k, NECK + 26, fx + 24 * k, NECK + 26, w1 - 2, HIPY + 2, -w1 + 2, HIPY + 2]), oc, r); for (const sd of [-1, 1]) pencil(c, rr(fx + sd * 18 * k - 4, NECK, 8, 28, 3), oc, r); }
    else pencil(c, poly([-w1 + 4, NECK + 34, w1 - 4, NECK + 34, w1 - 2, HIPY + 2, -w1 + 2, HIPY + 2]), oc, r); }
}
function bottoms(c, s, yaw, R) {
  const r = R('bot'), k = 1 - .25 * Math.abs(Math.sin(yaw)), w = 42 * k;
  if (s.bottom === 'skirt') { const sk = poly([-w, HIPY - 14, w, HIPY - 14, w + 16 * k, HIPY + 24, -w - 16 * k, HIPY + 24]); pencil(c, sk, s.bottomCol, r);
    if (s.plaid) { c.save(); c.clip(sk); c.strokeStyle = shade(s.bottomCol, .5); c.lineWidth = 2; c.globalAlpha = .6; c.beginPath(); for (let u = -70; u < 70; u += 14) { c.moveTo(u, HIPY - 16); c.lineTo(u * 1.3, HIPY + 26); } for (let v = HIPY - 8; v < HIPY + 24; v += 11) { c.moveTo(-70, v); c.lineTo(70, v); } c.stroke(); c.restore(); }
    ink(c, z => { for (let u = -36; u <= 36; u += 14) { z.moveTo(u * k, HIPY - 12); z.lineTo(u * 1.35 * k, HIPY + 22); } z.lineWidth = 1.4; z.globalAlpha = .6; z.stroke(); }); }
  if (s.bottom === 'shorts') pencil(c, poly([-w, HIPY - 16, w, HIPY - 16, w + 4, HIPY + 14, 3, HIPY + 14, 0, HIPY + 2, -3, HIPY + 14, -w - 4, HIPY + 14]), s.bottomCol, r);
  if (s.bottom === 'pants') pencil(c, poly([-w, HIPY - 16, w, HIPY - 16, w - 6, HIPY + 6, -w + 6, HIPY + 6]), s.bottomCol, r, { outline: false });
}
function leg(c, s, side, yaw, ang, knee, fore, shin, R) {   // thigh + shin (knee bend), same 47 px reach as the old one-piece leg
  const r = R('leg' + side), hx = side * 16 * Math.cos(yaw), sn = Math.sin(yaw), col = s.bottom === 'pants' ? s.bottomCol : s.skin, L = 22 * fore;
  c.save(); c.translate(hx, HIPY); c.rotate(ang);
  if (shin > .05) { c.save(); c.translate(0, L); c.rotate(knee); const S = 25 * shin;
    if (s.socks) pencil(c, rr(-9, S - 27, 18, 22, 6), '#f4f1ea', r);
    pencil(c, rr(-10, -6, 20, S + 2, 8), col, r);
    pencil(c, ell(sn * 7, S, 18 + 6 * Math.abs(sn) + (1 - fore) * 4, 10 + (1 - fore) * 4), s.shoes || '#8c8d91', r);
    ink(c, z => { z.moveTo(sn * 7 - 14, S + 2); z.lineTo(sn * 7 + 14, S + 2); z.lineWidth = 1.4; z.globalAlpha = .6; z.stroke(); });
    c.restore(); }
  pencil(c, rr(-10, -4, 20, L + 10, 8), col, r);
  c.restore();
}
function arm(c, s, side, yaw, ang, elbow, shrug, hold, R) {   // upper arm + forearm (elbow bend); elbow 0 = the old straight arm
  const r = R('arm' + side), x0 = side * 33 * Math.cos(yaw) * (1 - .25 * Math.abs(Math.sin(yaw))), y0 = SHY - shrug * .6;
  if (hold) { const x1 = side * 22 * Math.cos(yaw) + Math.sin(yaw) * 26, y1 = SHY + 24; pencil(c, capsule(x0, y0, x1, y1, 20), s.sleeves || s.topCol, r); pencil(c, ell(x1, y1 + 3, 10, 10), s.skin, r); return; }
  const a = .3 + ang, dir = cl(side * Math.cos(yaw) + Math.sin(yaw) * 1.1, -1, 1) || side, U = ARM * .58, F = ARM * .6;
  const xe = x0 + Math.sin(a) * U * dir, ye = y0 + Math.cos(a) * U, x1 = xe + Math.sin(a + elbow) * F * dir, y1 = ye + Math.cos(a + elbow) * F;
  pencil(c, capsule(xe, ye, x1, y1, 18), s.sleeves || s.topCol, r);
  pencil(c, capsule(x0, y0, xe, ye, 20), s.sleeves || s.topCol, r);
  pencil(c, ell(x1 + (x1 - xe) * .2, y1 + (y1 - ye) * .2, 10, 10), s.skin, r);
}

const hash = (n, k) => { let h = (n * 2654435761) >>> 0; for (const ch of k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };

export function drawChibi(c, s, pose = {}) {
  const P = { ...pose }, yaw = P.yaw || 0, R = k => rng(hash(s.seed || 1, k)), sn = Math.sin(yaw);
  const hold = (P.arms || s.arms) === 'hold', cover = P.cover ?? (s.arms === 'eyes'), up = s.arms === 'up' ? 2.5 : 0;
  const backHalf = vis(0, yaw) < -.05, near = side => -side * sn > .05;   // yaw>0: screen-left limbs come forward
  const shrug = P.shrug || 0, bend = P.bend || 0, rot = bend * sn, fr = Math.cos(yaw) ** 2, hs = -rot * 30;
  // bend > 0 = forward, < 0 = back, whatever the facing.  Seen from the side it is a rotation at the hip with a counterweight (hs: the
  // pelvis slides back as the chest goes over, feet stay planted); seen from the front it is a bow: the upper body shortens toward the
  // camera and the head comes down (back: chest up, chin up)
  const usy = 1 - fr * (bend > 0 ? .45 * bend : .12 * bend), hdrop = fr * bend * 40;
  c.save(); c.scale(P.sx ?? 1, P.sy ?? 1); c.rotate(P.lean || 0); c.translate(0, P.drop || 0);
  const legs = side => { c.save(); c.translate(hs, 0); leg(c, s, side, yaw, (side < 0 ? P.legL || 0 : P.legR || 0) + Math.asin(cl(hs / 47, -.9, .9)), side < 0 ? P.kneeL || 0 : P.kneeR || 0, P.fore ?? 1, P.shin ?? 1, R); c.restore(); };   // feet stay planted
  const upper = f => { c.save(); c.translate(hs, HIPY); c.rotate(rot); c.scale(1, usy); c.translate(0, -HIPY); f(); c.restore(); };   // upper body bends at the (shifted) hip
  const arms = side => upper(() => { if (cover && side > 0 && !backHalf) return; const a = side < 0 ? P.armL ?? up : P.armR ?? up, dir = cl(side * Math.cos(yaw) + sn * 1.1, -1, 1) || side, g = cl(1 - Math.abs(a) / 1.4, 0, 1) * .85;
    arm(c, s, side, yaw, a + rot * dir * g, side < 0 ? P.elbowL || 0 : P.elbowR || 0, shrug, hold, R); });   // hanging arms keep pointing down (gravity) as the body bends
  const onNeck = f => upper(() => { c.save(); c.translate(0, NECK + shrug * .7 + hdrop); c.rotate((P.head || 0) + rot * .35); c.scale(1 / (P.sx ?? 1), 1 / ((P.sy ?? 1) * usy)); c.translate(0, -NECK); f(); c.restore(); });   // squash/stretch the body, never the head; the head carries the curve of the bend on
  // hair masses that hang behind the body (seen from the front half)
  onNeck(() => {
    if (['long', 'curlyLong'].includes(s.hair) && !backHalf) pencil(c, rr(-HR - 4, HY - 30, 2 * HR + 8, 150, 40), s.hairCol, R('hairBack'));
    if (s.hair === 'bob' && !backHalf) pencil(c, rr(-HR - 8, HY - 40, 2 * HR + 16, 90, 30), s.hairCol, R('hairBack'));
    if (s.hair === 'braids') for (const side of [-1, 1]) { const x = sx(side * 1.45, yaw, 0) * 1.02, p = new Path2D(); for (let k = 0; k < 6; k++) p.ellipse(x, HY + 14 + k * 20, 12, 12, 0, 0, TAU); pencil(c, p, s.hairCol, R('braid' + side)); }
    if (s.hair === 'ponytail') { const x = -sn * 70 + (Math.abs(sn) < .3 ? 64 : 0); pencil(c, capsule(x, HY - 30, x + 18, HY + 84, 30), s.hairCol, R('pony')); }
  });
  for (const side of [-1, 1]) if (!near(side) && Math.abs(sn) > .05) arms(side);
  for (const side of [-1, 1]) if (!near(side)) legs(side);
  for (const side of [-1, 1]) if (near(side)) legs(side);
  c.save(); c.translate(hs, 0); bottoms(c, s, yaw, R); c.restore();
  upper(() => torso(c, s, yaw, R));
  for (const side of [-1, 1]) if (near(side) || Math.abs(sn) <= .05) arms(side);
  onNeck(() => {
    head(c, s, P, yaw, R);
    if (backHalf && ['long', 'curlyLong'].includes(s.hair)) pencil(c, rr(-HR - 6, HY - 40, 2 * HR + 12, 150, 40), s.hairCol, R('hairBack'));
    if (backHalf && s.hair === 'bob') pencil(c, rr(-HR - 8, HY - 50, 2 * HR + 16, 96, 30), s.hairCol, R('hairBack'));
  });
  if (cover && !backHalf) { const r = R('cover'), x0 = 33 * Math.cos(yaw);
    onNeck(() => { const ex = sx(0, yaw, 10); pencil(c, capsule(x0, SHY, ex + 20, HY + 18, 20), s.sleeves || s.topCol, r); pencil(c, ell(ex + 4, HY + 10, 32, 15, -.12), s.skin, r);
      ink(c, z => { for (let k = 0; k < 3; k++) { z.moveTo(ex - 14 + k * 14, HY); z.lineTo(ex - 12 + k * 14, HY + 20); } z.lineWidth = 1.4; z.stroke(); }); }); }
  // props held in front
  const r = R('props');
  if (s.sign && !backHalf) { pencil(c, rr(-40, SHY - 4, 80, 60, 4), '#fbfaf5', r, { light: false });
    c.save(); c.fillStyle = INK; c.font = 'bold 40px "Comic Sans MS", sans-serif'; c.textAlign = 'center'; c.fillText(s.sign, 0, SHY + 42); c.restore(); }
  if (s.prop === 'yarn' && !backHalf) pencil(c, ell(sn * 20, SHY + 26, 18, 18), '#e9c13c', r);
  if (s.prop === 'pencil' && !backHalf) { c.save(); c.translate(54, SHY + 40); c.rotate(-.18); pencil(c, rr(-7, -130, 14, 150, 2), '#d8473a', r); pencil(c, poly([-7, 20, 7, 20, 0, 38]), '#efd2a8', r); c.restore(); }
  c.restore();
}

// ---- cutout: kept as the page API; the child draws straight on the sheet, so no paper margin and no shadow ----
export function cutout(draw, { w = 300, h = 420, ox = 150, oy = 400 } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const a = cv.getContext('2d'); a.translate(ox, oy); draw(a);
  cv.art = cv; cv.sil = cv; return cv;
}
