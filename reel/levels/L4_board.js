// L4 «РАСКАДРОВКА» (storyboard + judge), ink_pattern «Старик и море» look (kit: levels/L4/pen.js, patterns.js, kit.js, copied
// from the clipforge ink_pattern kit). Black ink on paper; the hero (orange body, red bandana) is the only colour.
// Mini-scene, no shooting (SHOWREEL.md «Драматургия»): the look card from L3 drops onto the hook, the hero casts it; a marlin whose scales
// are shuffled storyboard frames (3 1 5 2 4) takes it and fights; the hero heaves on the beats. Climax = seg.kill: the frames fly off
// and line up along the fishing line 1-2-3-4-5, the fish gives up and dives. The strip rolls into a scroll, drops in the boat, the
// hero lifts it up big and sails into a dark ornamented sea grotto (the door). Frame = pure function of t.
// World x: 0..1080 = the square frame at camera 0; 16:9 adds (W-1080)/2 on each side.
import { Plot, paper, canvas, rng, clamp, TAU, arc, line, polyPath } from './L4/pen.js';
import * as K from './L4/patterns.js';
import { xform, hull, rig, fish, FISH } from './L4/kit.js';
import { heroShapes, ORG, RED } from '../hero.js';

const INK = '#1d1a22', INK2 = '#5d5763', PAP = '#efe6d2', ORGD = '#9b4a2c', REDD = '#7a1d18';
const BT = 60 / 144, HZ = 432, WL = 778;                       // beat, horizon, near water line (fish clip)
const KILL = 8 * BT, DROP = 10 * BT, GRAB = 11 * BT, DOORIN = 6.0;
const PULLS = [3, 4, 5, 6, 7].map(b => b * BT);                 // heaves on the beats (b3..b7), climax heave = KILL
const ORDER = [3, 1, 5, 2, 4];                                  // frame numbers on the fish, nose → tail
const SUN = [380, HZ], SKY0 = -440, SKYW = 2320, CLIFF0 = 1060, CLIFFW = 1700;
const ARCH = { x0: 1180, x1: 1400, cy: 560, r: 110 };           // grotto opening: rect x0..x1 below cy + half disc on top
const E = [905, 790], M0 = [380, 690];                          // the strip's line: from the hero's paw to the water point
const CWB = 80, CHB = 60, CWF = 52, CHF = 39;                   // frame size in the strip / as a fish scale
const FSC = .95;                                                // fish scale (local length ~500)

const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const camX = t => 590 * sm(4.7, 6.3, t);
const boatX = t => 220 + 760 * sm(4.85, 6.3, t);
const bob = t => 2.2 * Math.sin(t * 2.1);                       // the boat breathes with the waves, never shakes

// ---------------- prerendered layers (deterministic seeds) ----------------
let R = null;
function plotTo(c, P) { P.draw(c.getContext('2d'), 1e9); return c; }
function rect(x0, y0, x1, y1) { return polyPath([x0, y0, x1, y0, x1, y1, x0, y1]); }

function buildSky() {
  const cv = canvas(SKYW, HZ), P = new Plot(41), sx = SUN[0] - SKY0, sy = SUN[1];
  P.pen(INK2, .9, .75); P.group(0, 1, () => { K.hatch(P, SKYW / 2, HZ / 2, SKYW * .6, -.18, 3.4, { seg: 70, jit: .5 }); K.hatch(P, SKYW / 2, HZ / 2, SKYW * .6, .62, 4.4, { seg: 55, jit: .5 }); }, rect(0, 0, SKYW, HZ));
  P.group(0, 1, () => K.fanRings(P, sx, sy, 175, 1250, 40, { spokes: 9, span: 2.3, bundle: 2, fc: PAP, vary: true, rowGap: 1.3, gap: 1.9, up: .45,
    styleAt: (P, Rr) => P.pen(Rr < 400 ? INK : INK2, .85, .95) }), rect(0, 0, SKYW, HZ - 3));
  const sun = new Path2D(); sun.arc(sx, sy, 140, 0, TAU);
  P.pen(INK, 1, .95); P.group(0, 1, () => { const R0 = 112, dk = arc(sx, sy, R0 + 28, 0, TAU, 6); P.add(dk, { fill: dk, fc: PAP });
    for (const q of [R0 + 22, R0 + 14, R0, R0 - 9, R0 * .66, R0 * .38]) P.add(arc(sx, sy, q, 0, TAU, 5));
    for (let i = 0; i < 24; i++) { const a = TAU * i / 24; P.add(line(sx + Math.cos(a) * R0 * .38, sy + Math.sin(a) * R0 * .38, sx + Math.cos(a) * (R0 - 9), sy + Math.sin(a) * (R0 - 9))); }
    for (let i = 0; i < 16; i++) { const a = TAU * i / 16; P.add(line(sx, sy, sx + Math.cos(a) * R0 * .36, sy + Math.sin(a) * R0 * .36), { amp: .2 }); }
    for (let i = 0; i < 24; i += 4) { const a0 = TAU * i / 24, a1 = a0 + TAU / 24, am = (a0 + a1) / 2;   // a few hatched cells
      P.add([...arc(sx, sy, R0 * .66, a0, a1, 5), ...arc(sx, sy, R0 - 9, a1, a0, 5)]); K.hatch(P, sx + Math.cos(am) * R0 * .8, sy + Math.sin(am) * R0 * .8, 22, am + .3, 2.6, { seg: 12 }); }
  }, [rect(0, 0, SKYW, HZ), sun]);
  return plotTo(cv, P);
}

// sea grotto: a patchwork rock (bands split into blocks, each block its own motif) with a dark arched opening framed by ornament
function buildCliff() {
  const cv = canvas(CLIFFW, 1080), P = new Plot(77), X = x => x - CLIFF0, r = rng(5);
  const top = [[1060, 430], [1085, 365], [1125, 330], [1170, 300], [1230, 262], [1300, 250], [1360, 228], [1420, 250], [1500, 208], [1580, 190], [1700, 228], [1800, 168], [1950, 198], [2100, 150], [2300, 188], [2500, 140], [2760, 160]];
  const poly = [X(1060), 800, ...top.flatMap(([x, y]) => [X(x), y]), X(2760), 800], rock = polyPath(poly);
  P.pen(INK, 1, .9); P.group(0, 1, () => P.add(poly.concat(poly[0], poly[1]), { fill: poly, fc: PAP, amp: .5 }), rock);
  for (let y = 120, j = 0; y < 800; y += 46 + (j % 3) * 8, j++) {
    let x = X(1060) - (j % 2) * 50;
    while (x < CLIFFW) { const w = 90 + r() * 90, m = (j * 5 + Math.round(x / 37)) % 6, q = [x, y + (r() - .5) * 6, x + w, y + (r() - .5) * 6, x + w, y + 50 + (r() - .5) * 6, x, y + 50], cx = x + w / 2, cy = y + 25, pc = polyPath(q);
      P.pen(INK, .9, .9); P.group(0, 1, () => { P.add(q.concat(q[0], q[1]), { amp: .6 });
        if (m === 0) K.cross(P, cx, cy, w * .7, .7, 4.2);
        else if (m === 1) for (let yy = y + 8; yy < y + 52; yy += 9) K.scallops(P, x - 6, x + w + 6, yy, 4.5);
        else if (m === 2) for (let yy = y + 5; yy < y + 50; yy += 7) for (let xx = x + 4 + (yy % 2) * 3; xx < x + w; xx += 7) P.dot(xx, yy, 1.1);
        else if (m === 3) K.hatch(P, cx, cy, w * .7, -.9, 3.2, { seg: 14 });
        else if (m === 4) for (let yy = y + 8; yy < y + 50; yy += 10) K.zigzag(P, x, x + w, yy, 3, 10);
        else K.hatch(P, cx, cy, w * .7, .2, 2.6);
      }, [rock, pc]);
      x += w; }
  }
  P.pen(INK, 2.2, .95); P.group(0, 1, () => P.add(poly.slice(2, -2), { amp: .8 }));   // firm rock edge
  plotTo(cv, P);
  // opening: solid ink, an ornament frame (voussoirs + double arc + paper beads), dim water lines inside
  const c = cv.getContext('2d'), ax0 = X(ARCH.x0), ax1 = X(ARCH.x1), acx = (ax0 + ax1) / 2, op = new Path2D();
  op.moveTo(ax0, 800); op.lineTo(ax0, ARCH.cy); op.arc(acx, ARCH.cy, ARCH.r, Math.PI, TAU); op.lineTo(ax1, 800); op.closePath();
  const F = new Plot(9); F.pen(INK, 1.4, .95);
  const fr = new Path2D(); fr.moveTo(ax0 - 40, 800); fr.lineTo(ax0 - 40, ARCH.cy); fr.arc(acx, ARCH.cy, ARCH.r + 40, Math.PI, TAU); fr.lineTo(ax1 + 40, 800); fr.closePath();
  F.group(0, 1, () => { const q = [ax0 - 40, 800, ax0 - 40, ARCH.cy, ...arc(acx, ARCH.cy, ARCH.r + 40, Math.PI, TAU, 4), ax1 + 40, ARCH.cy, ax1 + 40, 800];
    F.add(q, { fill: q, fc: PAP });
    for (let i = 0; i <= 14; i++) { const a = Math.PI + Math.PI * i / 14; F.add(line(acx + Math.cos(a) * ARCH.r, ARCH.cy + Math.sin(a) * ARCH.r, acx + Math.cos(a) * (ARCH.r + 40), ARCH.cy + Math.sin(a) * (ARCH.r + 40))); }
    for (let y = ARCH.cy + 20; y < 800; y += 30) for (const x of [ax0 - 40, ax1]) F.add(line(x, y, x + 40, y));
    F.add(arc(acx, ARCH.cy, ARCH.r + 20, Math.PI, TAU, 4));
    for (let i = 0; i < 14; i++) { const a = Math.PI + Math.PI * (i + .5) / 14; F.dot(acx + Math.cos(a) * (ARCH.r + 10), ARCH.cy + Math.sin(a) * (ARCH.r + 10), 2.2); }
    for (let i = 0; i < 14; i++) { const a = Math.PI + Math.PI * (i + .5) / 14; K.hatch(F, acx + Math.cos(a) * (ARCH.r + 30), ARCH.cy + Math.sin(a) * (ARCH.r + 30), 9, a, 2.4); }
  }, fr);
  F.draw(c, 1e9);
  c.fillStyle = INK; c.fill(op);
  c.save(); c.clip(op); c.strokeStyle = 'rgba(239,230,210,.22)'; c.lineWidth = 1;
  for (let y = 700, k = 0; y < 800; y += 9, k++) { c.beginPath(); for (let x = ax0; x <= ax1; x += 8) c.lineTo(x, y + Math.sin(x / 30 + k) * 1.5); c.stroke(); }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke(op);
  return cv;
}

function buildBoat() {
  const S = 1.7, mk = () => canvas(520, 440), T = xform(260, 380, S);
  const H = new Plot(31); hull(H, T, { ink: INK, PAP });
  const G = new Plot(32); rig(G, T, { ink: INK, ink2: INK, PAP, sailFlip: -1 });
  return { hull: plotTo(mk(), H), rig: plotTo(mk(), G), ox: 260, oy: 380 };
}
function buildFish() {   // at 1x (1 px ink), facing left (flip), centre at (275, 150)
  const cv = canvas(550, 300), P = new Plot(53); fish(P, xform(275, 150, FSC, 0, -1), { ink: INK, ink2: INK2, PAP, halo: true });
  return plotTo(cv, P);
}

// --- storyboard frames: tiny ink scenes 1..5 (dawn, boat goes out, the bite, the leap, home to the grotto), drawn at 2x ---
function waves(c, x0, x1, y, n, amp, gap, ph = 0) { for (let k = 0; k < n; k++) { c.beginPath(); for (let x = x0; x <= x1; x += 2) c.lineTo(x, y + k * gap + Math.sin(x / 5 + k * 1.7 + ph) * amp); c.stroke(); } }
function miniBoat(c, x, y, s) { c.beginPath(); c.moveTo(x - 10 * s, y); c.lineTo(x + 10 * s, y); c.lineTo(x + 7 * s, y + 4 * s); c.lineTo(x - 7 * s, y + 4 * s); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 14 * s); c.lineTo(x - 8 * s, y - 2 * s); c.closePath(); c.stroke(); }
function miniFish(c, x, y, s, a) { c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); c.beginPath(); c.ellipse(0, 0, 10, 3.6, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-9, 0); c.lineTo(-14, -4); c.lineTo(-14, 4); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(10, 0); c.lineTo(16, -.5); c.stroke();
  c.beginPath(); c.moveTo(-2, -3); c.lineTo(2, -8); c.lineTo(5, -3); c.stroke(); c.restore(); }
function frameCard(n) {
  const cv = canvas(CWB * 2, CHB * 2), c = cv.getContext('2d'), w = CWB, h = CHB; c.scale(2, 2);
  c.fillStyle = PAP; c.fillRect(0, 0, w, h); c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = .8; c.lineCap = 'round';
  const ix = 4, iy = 4, iw = w - 8, ih = h - 8; c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip();
  const r = rng(n * 13);
  if (n === 1) { const hz = 33; c.beginPath(); c.arc(40, hz, 13, Math.PI, TAU); c.stroke(); c.beginPath(); c.arc(40, hz, 8, Math.PI, TAU); c.stroke();
    for (let i = 0; i < 11; i++) { const a = Math.PI + Math.PI * (i + .5) / 11; c.beginPath(); c.moveTo(40 + Math.cos(a) * 16, hz + Math.sin(a) * 16); c.lineTo(40 + Math.cos(a) * 23, hz + Math.sin(a) * 23); c.stroke(); }
    c.beginPath(); c.moveTo(0, hz); c.lineTo(w, hz); c.stroke(); waves(c, 0, w, hz + 5, 5, .9, 4.5); }
  if (n === 2) { waves(c, 0, w, 36, 5, .9, 4.5); c.fillStyle = PAP; miniBoat(c, 34, 33, 1.3); c.fillStyle = INK; c.beginPath(); c.arc(64, 14, 5, 0, TAU); c.stroke();
    for (let x = 0; x < w; x += 3) { c.beginPath(); c.moveTo(x, 4); c.lineTo(x + 3, 8); c.stroke(); } }
  if (n === 3) { waves(c, 0, w, 16, 2, .8, 4); for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(-10 + k * 13, 56); c.lineTo(10 + k * 13, 26); c.globalAlpha = .45; c.stroke(); c.globalAlpha = 1; }
    c.beginPath(); c.moveTo(26, 0); c.lineTo(26, 36); c.stroke(); c.beginPath(); c.arc(28.5, 36, 2.5, Math.PI, Math.PI * 1.9, true); c.stroke();
    c.fillStyle = PAP; c.fillRect(22, 26, 8, 7); c.strokeRect(22, 26, 8, 7); c.fillStyle = INK; miniFish(c, 52, 38, 1.15, -.05); }
  if (n === 4) { waves(c, 0, w, 40, 4, .9, 4.5); c.fillStyle = PAP; miniBoat(c, 16, 38, .9); c.fillStyle = INK; miniFish(c, 50, 22, 1.25, -.45);
    c.beginPath(); c.moveTo(16, 26); c.quadraticCurveTo(30, 18, 34, 28); c.stroke();
    for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(40 + r() * 26, 32 + r() * 6, .9, 0, TAU); c.fill(); } }
  if (n === 5) { c.beginPath(); c.moveTo(48, 40); c.lineTo(48, 16); c.lineTo(60, 8); c.lineTo(w, 6); c.lineTo(w, 40); c.closePath(); c.fillStyle = PAP; c.fill(); c.stroke();
    c.save(); c.clip(); for (let x = 40; x < w + 30; x += 3) { c.beginPath(); c.moveTo(x, 4); c.lineTo(x - 30, 42); c.stroke(); } c.restore();
    c.fillStyle = INK; c.beginPath(); c.moveTo(56, 40); c.lineTo(56, 28); c.arc(63, 28, 7, Math.PI, TAU); c.lineTo(70, 40); c.closePath(); c.fill();
    waves(c, 0, w, 42, 4, .8, 4.2); c.fillStyle = PAP; miniBoat(c, 30, 40, 1); c.fillStyle = INK;
    c.beginPath(); c.arc(16, 13, 6, 0, TAU); c.stroke(); c.beginPath(); c.arc(18.5, 11.5, 5, 0, TAU); c.fill(); }
  c.restore();
  c.lineWidth = 1.6; c.strokeRect(1.5, 1.5, w - 3, h - 3); c.lineWidth = .7; c.strokeRect(ix, iy, iw, ih);
  c.fillStyle = INK; c.fillRect(2, 2, 15, 14); c.fillStyle = PAP; c.font = 'bold 12px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), 9.5, 9.5);
  return cv;
}
function lookCard() {   // the L3 loot: a «look» card (three swatches of the chosen look), drawn in ink
  const cv = canvas(96, 120), c = cv.getContext('2d'); c.scale(2, 2); const w = 48, h = 60;
  c.fillStyle = PAP; c.fillRect(0, 0, w, h); c.strokeStyle = INK; c.lineWidth = .8;
  c.save(); c.beginPath(); c.rect(5, 5, w - 10, 16); c.clip(); for (let x = -20; x < w; x += 3) { c.beginPath(); c.moveTo(x, 21); c.lineTo(x + 16, 5); c.stroke(); } c.restore();
  c.fillStyle = INK; for (let y = 25; y < 37; y += 3.4) for (let x = 7 + (y % 2) * 1.7; x < w - 5; x += 3.4) { c.beginPath(); c.arc(x, y, .7, 0, TAU); c.fill(); }
  for (let y = 43; y < 55; y += 4) { c.beginPath(); for (let x = 5; x < w - 5; x += 4) c.arc(x + 2, y, 2, Math.PI, TAU); c.stroke(); }
  c.lineWidth = 1.6; c.strokeRect(1, 1, w - 2, h - 2);
  return cv;
}

function stampCard() {   // red round grading stamp «84» with worn ink, made once
  const cv = canvas(136, 136), c = cv.getContext('2d'); c.translate(68, 68); c.strokeStyle = c.fillStyle = RED;
  c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 60, 0, TAU); c.stroke(); c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 49, 0, TAU); c.stroke();
  for (let i = 0; i < 24; i++) { const an = TAU * i / 24; c.beginPath(); c.arc(Math.cos(an) * 54.5, Math.sin(an) * 54.5, 1.6, 0, TAU); c.fill(); }
  c.font = 'bold 52px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('84', 0, 3);
  const rr = rng(84); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 140; i++) { const an = rr() * TAU, q = Math.sqrt(rr()) * 64; c.beginPath(); c.arc(Math.cos(an) * q, Math.sin(an) * q, .6 + rr() * 1.6, 0, TAU); c.fill(); }
  return cv;
}

// ---------------- per-frame pieces ----------------
function sea(c, t, W, cam, off) {
  const sunX = SUN[0] - cam * .35 + off, breathe = 1 + .3 * Math.sin(t * 1.6);
  c.save(); c.strokeStyle = INK; c.lineCap = 'round';
  for (let y = HZ + 3, k = 0; y < 1080; k++) {
    const dd = (y - HZ) / (1080 - HZ), amp = (.4 + dd * 1.8) * breathe, per = 90 + dd * 220, ph = t * .22 * (k % 2 ? 1 : -1) + k * .37, par = .35 + .65 * dd, rr = 70 * (1 - dd * .4) + Math.sin(k * 1.3) * 10;
    c.lineWidth = .8 + dd * .5; c.globalAlpha = .55 + dd * .35; c.beginPath(); let pen = false;
    for (let sx = -10; sx <= W + 10; sx += 12) { const wx = sx + cam * par, yy = y + Math.sin((wx / per + ph) * TAU) * amp, gap = Math.abs(sx - sunX) < rr && (k % 3 !== 0);
      if (gap) { pen = false; continue; } pen ? c.lineTo(sx, yy) : c.moveTo(sx, yy); pen = true; }
    c.stroke(); y += 3.4 + dd * 5.5;
  }
  c.globalAlpha = .9; c.lineWidth = 1;   // rows of wave crests (scallops) that roll
  for (let y = HZ + 24, k = 0; y < 1080; y += 26 + (y - HZ) * .09, k++) { const dd = (y - HZ) / (1080 - HZ), Rr = 4 + dd * 9, par = .35 + .65 * dd, step = 2 * Rr * (1 + (k % 2) * .6),
      s0 = -((cam * par + t * 14 * (k % 2 ? 1 : -1) + k * 17) % step) - step; c.beginPath();
    for (let x = s0; x < W + step; x += step) { if (Math.abs(x - sunX) < 60 * (1 - dd * .4)) continue; c.moveTo(x + Rr * 2, y); c.arc(x + Rr, y, Rr, 0, Math.PI, true); }
    c.stroke(); }
  c.restore();
}
function ripple(c, x, y, t, t0, n = 3) { const g = t - t0; if (g < 0 || g > 1.2) return; c.save(); c.strokeStyle = INK; c.lineWidth = 1.4;
  for (let i = 0; i < n; i++) { const q = g - i * .15; if (q <= 0) continue; c.globalAlpha = Math.max(0, 1 - q / 1); c.beginPath(); c.ellipse(x, y, 12 + q * 110, 3 + q * 22, 0, 0, TAU); c.stroke(); } c.restore(); }
// ink splash crown: paper-filled crown with ink rim + flying ink drops (falls back by gravity)
function splash(c, x, y, t, t0, seed, s = 1) { const g = (t - t0) / .7; if (g <= 0 || g >= 1) return; const r = rng(seed), hgt = Math.sin(g * Math.PI) * 70 * s;
  c.save(); c.fillStyle = PAP; c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - 60 * s, y);
  for (let i = 0; i <= 8; i++) { const u = i / 8, xx = x + (u - .5) * 120 * s, peak = (i % 2 ? 1 : .5) * hgt * (.7 + .6 * Math.sin(u * Math.PI)); c.lineTo(xx, y - peak); }
  c.lineTo(x + 60 * s, y); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = INK; for (let i = 0; i < 14; i++) { const a = Math.PI * (1.1 + r() * .8), v = (120 + r() * 200) * s, gg = g * .7, dx = Math.cos(a) * v * gg, dy = Math.sin(a) * v * gg + 500 * gg * gg;
    c.beginPath(); c.arc(x + dx, y + dy, (2 + r() * 3.5) * s * (1 - g * .5), 0, TAU); c.fill(); }
  c.restore(); }
// ink blot (the climax burst): spiky blob that pops and fades, flicked drops around it
function blot(c, x, y, t, t0, seed) { const g = t - t0; if (g < 0 || g > .4) return; const r = rng(seed), k = Math.min(1, g / .09), a = g < .12 ? 1 : 1 - (g - .12) / .28, Rr = 85 * (.4 + .6 * k);
  c.save(); c.globalAlpha = a * .92; c.fillStyle = INK; c.beginPath();
  for (let i = 0; i < 36; i++) { const an = TAU * i / 36, q = Rr * (i % 3 === 0 ? 1.15 + r() * .6 : .7 + r() * .25); c.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q); }
  c.closePath(); c.fill(); c.fillStyle = PAP; c.globalAlpha = a; c.beginPath(); for (let i = 0; i < 24; i++) { const an = TAU * i / 24, q = Rr * (.45 + r() * .12) * k; c.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q); } c.closePath(); c.fill();
  c.fillStyle = INK; for (let i = 0; i < 18; i++) { const an = r() * TAU, q = Rr * (1.3 + r() * 1.2) * k; c.beginPath(); c.arc(x + Math.cos(an) * q, y + Math.sin(an) * q, 2 + r() * 5, 0, TAU); c.fill(); }
  c.restore(); }

// hero in ink: hero.js polygons, slightly wobbled ink contour, flat orange with an inked pattern fill (fan scales on the body)
const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) - .5; };
function wobPath(pts, sid) { const p = new Path2D(); pts.forEach(([x, y], i) => { const [nx, ny] = pts[(i + 1) % pts.length];
    for (let j = 0; j < 3; j++) { const u = j / 3, d = j ? hsh(sid + i, j) * 1.6 : 0, L = Math.hypot(nx - x, ny - y) || 1; const px = x + (nx - x) * u - (ny - y) / L * d, py = y + (ny - y) * u + (nx - x) / L * d; i || j ? p.lineTo(px, py) : p.moveTo(px, py); } });
  p.closePath(); return p; }
function heroInk(c, Hs) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  Hs.shapes.forEach(({ role, pts }, si) => {
    const p = wobPath(pts, si * 17);
    c.fillStyle = role === 'eye' ? INK : role === 'band' || role === 'tail' ? RED : role === 'gun' ? INK : ORG; c.fill(p);
    if (role !== 'eye') { c.save(); c.clip(p); const [a, b] = pts, L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      c.transform(ux, uy, -uy, ux, a[0], a[1]);
      if (role === 'body') { c.strokeStyle = ORGD; c.globalAlpha = .55; c.lineWidth = 1.1; for (let v = 22, row = 0; v < 140; v += 11, row++) { c.beginPath(); for (let u = -10 + (row % 2) * 6; u < L + 12; u += 12) { c.moveTo(u + 6, v); c.arc(u, v, 6, 0, Math.PI, true); } c.stroke(); } }
      else if (role === 'band') { c.fillStyle = REDD; for (let u = 4; u < L; u += 9) { c.beginPath(); c.arc(u, 9, 1.8, 0, TAU); c.fill(); } }
      else { c.strokeStyle = role === 'tail' ? REDD : ORGD; c.globalAlpha = .55; c.lineWidth = 1; c.beginPath(); for (let u = -60; u < L + 60; u += 5) { c.moveTo(u, -20); c.lineTo(u + 40, 60); } c.stroke(); }
      c.restore(); }
    if (role !== 'eye') { c.strokeStyle = INK; c.lineWidth = role === 'body' ? 2.6 : 2.1; c.stroke(p); }
  });
  c.restore();
}
function drawScroll(c, x, y, len, dia, ang, tongue = 0) {   // rolled storyboard: paper cylinder, ink shading, spiral ends, a tie; tongue = strip end showing frame 1
  c.save(); c.translate(x, y); c.rotate(ang); const hl = len / 2, r = dia / 2;
  if (tongue > 0) { c.fillStyle = PAP; c.strokeStyle = INK; c.lineWidth = 1.6; const tw = dia * 1.25 * tongue; c.fillRect(-hl * .82, r * .4, len * .82, tw); c.strokeRect(-hl * .82, r * .4, len * .82, tw);
    c.lineWidth = 1; for (let i = 0; i < 4; i++) { const x0 = -hl * .82 + 6 + i * (len * .82 - 6) / 4; c.strokeRect(x0, r * .4 + 5, (len * .82 - 6) / 4 - 6, tw - 10); } }
  c.fillStyle = PAP; c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.rect(-hl, -r, len, dia); c.fill();
  c.save(); c.clip(); c.lineWidth = 1; c.globalAlpha = .8; for (let k = 0; k < 6; k++) { const yy = r - k * dia * .09; c.beginPath(); c.moveTo(-hl, yy); c.lineTo(hl, yy); c.stroke(); }
  for (let u = -hl; u < hl; u += 5) { c.beginPath(); c.moveTo(u, r * .3); c.lineTo(u + 4, r); c.stroke(); } c.restore();
  c.lineWidth = 2.2; c.strokeRect(-hl, -r, len, dia);
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * hl, 0, r * .38, r, 0, 0, TAU); c.fillStyle = PAP; c.fill(); c.stroke();
    c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 30; i++) { const a = i * .55, q = r * .9 * (1 - i / 32); c.lineTo(s * hl + Math.cos(a) * q * .38, Math.sin(a) * q); } c.stroke(); c.lineWidth = 2.2; }
  c.fillStyle = INK; c.fillRect(-dia * .18, -r - 2, dia * .36, dia + 4);
  c.restore();
}

// fish pose: Catmull-Rom through keys [t, x, y, a]; a > 0 lifts the nose (fish faces left)
const FK = [[.9, 800, 920, .8], [1.04, 792, 790, .75], [1.3, 780, 545, .45], [1.6, 760, 470, .1], [1.9, 790, 580, -.3], [2.2, 760, 560, .15], [2.5, 785, 500, .35],
  [2.8, 745, 590, -.2], [3.1, 755, 530, .25], [3.333, 735, 515, .1], [3.6, 760, 550, -.05], [3.85, 780, 700, -.45], [4.05, 790, 900, -.8], [4.2, 790, 1000, -.9]];
function fishPose(t) { let i = 0; while (i < FK.length - 2 && t > FK[i + 1][0]) i++; const p0 = FK[Math.max(0, i - 1)], p1 = FK[i], p2 = FK[i + 1], p3 = FK[Math.min(FK.length - 1, i + 2)];
  const u = clamp((t - p1[0]) / (p2[0] - p1[0])), cr = k => { const a = p0[k], b = p1[k], c = p2[k], d = p3[k]; return .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u); };
  return { x: cr(1), y: cr(2), a: cr(3) }; }
const fpt = (F, u, v) => { const c = Math.cos(F.a), s = Math.sin(F.a), X = -u * FSC, Y = v * FSC; return [F.x + X * c - Y * s, F.y + X * s + Y * c]; };   // fish-local (u, v) → screen-world
const SLOT_U = [150, 90, 30, -30, -90];
const ribbonAt = n => { const f = .13 + .185 * (n - 1); return [lerp(M0[0], E[0], f), lerp(M0[1], E[1], f)]; };
const RIB_A = Math.atan2(E[1] - M0[1], E[0] - M0[0]);

function drawCard(c, img, x, y, w, h, a, sx = 1) { c.save(); c.translate(x, y); c.rotate(a); c.scale(sx, 1); c.drawImage(img, -w / 2, -h / 2, w, h); c.restore(); }

export default {
  async init(S) {
    if (R && R.W === S.W) return;
    R = { W: S.W, paper: paper(S.W, 1080, { base: PAP, seed: 4 }), sky: buildSky(), cliff: buildCliff(), boat: buildBoat(), fish: buildFish(),
      cards: [0, 1, 2, 3, 4, 5].map(n => n ? frameCard(n) : null), look: lookCard(), stamp: stampCard() };
  },
  draw(c, t, S) {
    if (!R || R.W !== S.W) { this.init(S); }   // init is sync inside (no awaits), safe as a fallback
    const W = S.W, off = (W - 1080) / 2, cam = camX(t), X = wx => wx - cam + off;
    c.drawImage(R.paper, 0, 0);
    c.drawImage(R.sky, SKY0 - cam * .35 + off, 0);
    c.save(); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, HZ); c.lineTo(W, HZ); c.stroke(); c.restore();
    sea(c, t, W, cam, off);
    const cx0 = X(CLIFF0); if (cx0 < W) c.drawImage(R.cliff, cx0, 0);

    // --- the boat and the hero ---
    const bx = X(boatX(t)), by = 760 + bob(t), B = R.boat;
    const sail = t > 4.85 && t < 6.6;
    if (sail) { c.save(); c.strokeStyle = INK; c.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const ph = (t * 3 + i * .25) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(bx - 210 - ph * 120, by + 48, 20 + ph * 40, 4 + ph * 6, 0, 0, TAU); c.stroke(); } c.restore(); }
    c.drawImage(B.rig, bx - B.ox, by - B.oy);

    const yank = Math.max(0, ...[...PULLS, KILL].map(p => t >= p ? Math.exp(-((t - p) / .14)) : 0));
    const fight = t > 1.0 && t < 3.6, wind = sm(.2, .4, t) * (1 - sm(.42, .55, t));
    const lean = fight ? -(5 + 11 * yank) : t < .6 ? -8 * wind : t > 4.85 ? 4 * sm(4.85, 5.1, t) : 0;
    const eye = t < 1.0 ? 'open' : t < 1.35 ? 'wide' : t < KILL ? 'squint' : 'happy';
    const hold = t >= GRAB ? 1 : t > GRAB - .08 ? (t - GRAB + .08) / .08 : 0;
    const Hs = heroShapes({ x: bx + 60, y: by, s: .55, t, run: 0, face: 1, lean, eye, gun: false, armUp: hold });
    heroInk(c, Hs);
    c.drawImage(B.hull, bx - B.ox, by - B.oy);
    c.save(); c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); for (let x = bx - 230; x < bx + 240; x += 14) { c.moveTo(x + 14, by + 52); c.arc(x + 7, by + 52, 7, 0, Math.PI, true); } c.stroke(); c.restore();   // foam at the hull

    // --- the line, bait and fish ---
    const paw = Hs.u2s(221, 30);
    const F = fishPose(t), mouth = fpt(F, 205, 2);
    let end = null, sag = 0;
    if (t < .833) {   // bait: card drops onto the hook (held up), wind-up, cast to the water point
      const hook0 = [paw[0] + 110, paw[1] - 120], back = [paw[0] - 60, paw[1] - 170], water = [X(770), WL];
      if (t < .4) end = hook0; else if (t < .5) { const u = sm(.4, .5, t); end = [lerp(hook0[0], back[0], u), lerp(hook0[1], back[1], u)]; }
      else { const u = clamp((t - .5) / .333); end = [lerp(back[0], water[0], u), lerp(back[1], water[1], u) - Math.sin(u * Math.PI) * 160]; }
      sag = t < .5 ? 0 : 20;
    } else if (t < 1.04) { end = [X(770), WL]; sag = 30; }
    else if (t < KILL) { end = mouth; sag = 18 * (1 - yank); }
    else if (t < 3.95) { const u = sm(KILL, 3.6, t); end = [lerp(mouth[0], X(E[0]), u), lerp(mouth[1], E[1], u)]; sag = 0; }
    else if (t < 4.25) { const u = sm(3.95, 4.25, t); end = [lerp(X(E[0]), paw[0], u), lerp(E[1], paw[1], u)]; sag = 12 * u; }
    if (end) { c.save(); c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(paw[0], paw[1]); c.quadraticCurveTo((paw[0] + end[0]) / 2, (paw[1] + end[1]) / 2 + sag, end[0], end[1]); c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(paw[0], paw[1], 3, 0, TAU); c.fill(); c.restore(); }
    if (t < .833 && end) {   // hook + the look card
      c.save(); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(end[0], end[1]); c.lineTo(end[0], end[1] + 14); c.arc(end[0] + 6, end[1] + 14, 6, Math.PI, Math.PI * .1, true); c.stroke(); c.restore();
      const drop = t < .33 ? sm(0, .33, t) : 1, ly = t < .33 ? lerp(-60, end[1] + 18, drop * drop) : end[1] + 18, lx = end[0] + 2, rot = t < .33 ? (1 - drop) * .5 : Math.sin(t * 18) * .08;
      drawCard(c, R.look, lx, ly + 30, 48, 60, rot);
    }
    ripple(c, X(770), WL, t, .833); splash(c, X(770), WL, t, .833, 3, .6);
    splash(c, X(790), WL, t, 1.04, 7, 1.1); ripple(c, X(790), WL, t, 1.1);

    if (t > .95 && t < 4.2) {
      const clipW = t < 1.45 || t > 3.65;
      c.save(); if (clipW) { c.beginPath(); c.rect(0, 0, W, WL + 4); c.clip(); }
      c.translate(X(F.x), F.y); c.rotate(F.a); c.drawImage(R.fish, -275, -150, 550, 300); c.restore();
    }
    ripple(c, X(790), WL, t, 3.8, 4);

    // --- the frames: scales on the fish → strip along the line → scroll ---
    blot(c, X(F.x), F.y, t, KILL, 21);   // behind the flying frames
    const fly = sm(KILL, 3.6, t), roll = sm(3.95, DROP, t);
    if (t > .95 && t < DROP) {
      const clipW = t < 1.45;
      c.save(); if (clipW) { c.beginPath(); c.rect(0, 0, W, WL + 4); c.clip(); }
      ORDER.forEach((n, i) => {
        const tilt = [.12, -.1, .07, -.14, .1][i] + (fight ? Math.sin(t * 9 + i * 2) * .04 : 0);
        const [fx, fy] = fpt(F, SLOT_U[i], -2), [rx, ry] = ribbonAt(n), k = clamp(fly * 1.25 - i * .06), ek = k * k * (3 - 2 * k);
        let x = lerp(X(fx), X(rx), ek), y = lerp(fy, ry, ek) - Math.sin(ek * Math.PI) * (60 + i * 18), a = lerp(F.a + tilt, RIB_A, ek), w = lerp(CWF, CWB, ek), h = lerp(CHF, CHB, ek), sx = 1;
        if (roll > 0) { const [cxr, cyr] = ribbonAt(3); x = lerp(x, X(cxr), roll); y = lerp(y, cyr, roll); sx = 1 - roll; }
        if (sx > .02) drawCard(c, R.cards[n], x, y, w, h, a, sx);
      });
      c.restore();
    }
    // the judge: a round red grading stamp «84» slams onto the assembled strip on b9 (3.75), lifts away as the strip rolls
    if (t > 3.6 && t < DROP) { const [sx0, sy0] = ribbonAt(3), u = sm(3.6, 3.75, t), z = lerp(1.7, 1, u * u), a = (t < 3.75 ? u : 1) * (1 - roll);
      c.save(); c.translate(X(sx0) + 10, sy0 - 8); c.rotate(-.22); c.scale(z, z); c.globalAlpha = a * .92; c.drawImage(R.stamp, -68, -68, 136, 136); c.restore(); }
    if (t > KILL && t < 3.95) {   // pins on the line where the frames hang
      c.save(); c.fillStyle = INK; for (let n = 1; n <= 5; n++) { const [rx, ry] = ribbonAt(n), k = sm(3.5, 3.62, t); if (k <= 0) continue; c.beginPath(); c.arc(X(rx), ry - CHB / 2 + 3, 3.2 * k, 0, TAU); c.fill(); } c.restore();
    }
    // scroll: forms at the strip centre, falls into the boat, then held up big by the hero and carried to the grotto
    if (t > 3.95) {
      const [cxr, cyr] = ribbonAt(3), deck = [bx + 150, by - 20];
      let x, y, len, dia, ang, tongue = 0;
      if (t < DROP) { len = lerp(10, 66, roll); dia = 26; x = X(cxr); y = cyr; ang = RIB_A + Math.PI / 2; }
      else if (t < 4.5) { const u = clamp((t - DROP) / (4.5 - DROP)); x = lerp(X(cxr), deck[0], u); y = lerp(cyr, deck[1], u) - Math.sin(u * Math.PI) * 120; len = 66; dia = 26; ang = lerp(RIB_A + Math.PI / 2, 0, u); }
      else if (t < GRAB - .08) { x = deck[0]; y = deck[1]; len = 66; dia = 26; ang = 0; }
      else { const hp = Hs.u2s(-232, -45), u = sm(GRAB - .08, GRAB + .12, t); x = lerp(deck[0], hp[0], u); y = lerp(deck[1], hp[1] - 40, u); len = lerp(66, 170, u); dia = lerp(26, 46, u); ang = lerp(0, -Math.PI / 2 + .25, u); tongue = sm(GRAB + .1, GRAB + .4, t); }
      drawScroll(c, x, y, len, dia, ang, tongue);
      if (t > GRAB - .08) { const p = wobPath(Hs.shapes.find(s => s.role === 'arm').pts, 3); c.save(); c.fillStyle = ORG; c.fill(p); c.strokeStyle = INK; c.lineWidth = 2.1; c.stroke(p); c.restore(); }   // paw over the scroll
    }
  },
  door(t, S) { const off = (S.W - 1080) / 2, x = ARCH.x0 + 20 - camX(t) + off; return { x, y: 505, w: ARCH.x1 - ARCH.x0 - 40, h: 275 }; },
  doorIn: DOORIN,
  events: [
    { t: .333, k: 'click' }, { t: .417, k: 'whoosh' }, { t: .833, k: 'splash' }, { t: 1.042, k: 'splash' },
    ...PULLS.map(t => ({ t, k: 'hit' })), { t: KILL, k: 'kill' }, { t: 3.75, k: 'ok' }, { t: 3.8, k: 'splash' }, { t: DROP, k: 'whoosh' }, { t: GRAB, k: 'loot' }, { t: DOORIN, k: 'door' },
  ],
};
