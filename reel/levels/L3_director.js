// L3_director.js — showreel level 3 «РЕЖИССЁР: луки» (SHOWREEL.md, LEVELS.md). Mini-scene, no fight:
// b0–b1 the timeline ribbon (loot of L2) drops and hangs over the director's chair; b2 a BLANK PAGE slides in and leans over Clawd
// (its shadow presses); b3–b4 Clawd thinks (dots) → idea (bulb); b5–b7 he grabs the pencil from the armrest and flicks quick pencil
// strokes onto the page on the eighths, three sketches appear (wave / grid / circles); kill 3.333 = climax: the page straightens and
// splits into 3 look cards that colour in (ink wave, pixel grid, candy circles) under a soft pencil-hatch flash; lootDrop 4.167 the
// cards fall in a fan, lootGrab 4.583 Clawd catches them (armUp, happy eyes), hops off the chair and runs to a door drawn on the paper.
// Look: the Wonder Clawd kit (L3/wonder.js, from the clipforge harness). Acting (look-up thinking + «dots», «idea» bulb
// with take): ported from JohnHeibel/ClaudeAnimationBase src/clawd.js (MIT). Skeleton: ../hero.js; heroShapes(gun:false); the pencil is a separate prop in the front stub.
import { heroShapes, RED } from '../hero.js';
import { INK, ORG, GROUND, rng, sstep, paperTex, NV, drawHatch, radial } from './L3/wonder.js';

const GY = 800, SEAT = 640, HX0 = 300, S = .6, CHX = -60;   // CHX: chair shift
const PW = 450, PH = 630, BH3 = PH / 3;                       // the page and its three bands (= the three look cards)
const DOOR = { x: 1230, y: 380, w: 280, h: 420 };             // doorway in world coordinates
const STROKES = [2.083, 2.292, 2.5, 2.708, 2.917, 3.125];     // pencil flicks on the eighths, band = i % 3
const FLY = .15, KILL = 10 / 3, DROP = 4.167, GRAB = 4.583, HOP = 4.7, LAND = 4.95, DOORIN = 6.0, IDEA = 1.667;
const PALE = '#FBFAF4', PENCIL = '#E2B54A', WOOD = '#C9B79A';
const lerp = (a, b, p) => a + (b - a) * p, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const backOut = p => { const k = 1.7; p = clamp(p); return 1 + (k + 1) * Math.pow(p - 1, 3) + k * Math.pow(p - 1, 2); };
const sd = n => rng(((n * 7919 + 13) % 2147483646) + 1);

// ---------- pencil helpers (boil = new jitter every 4 frames) ----------
const path = (c, pts, r, amp, close = true) => { c.beginPath(); pts.forEach(([x, y], i) => { const X = x + (r() - .5) * 2 * amp, Y = y + (r() - .5) * 2 * amp; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); if (close) c.closePath(); };
const inkPoly = (c, pts, fill, lw, seed, amp = .8) => { c.lineJoin = 'round'; path(c, pts, sd(seed), amp); if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); } };
const hatchIn = (c, pts, col, lw, gap, ang, seed) => {   // clipped diagonal hatching inside a polygon
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), r = sd(seed);
  c.save(); path(c, pts, () => .5, 0); c.clip(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
  const L = (x1 - x0) + (y1 - y0); for (let k = -L; k < L; k += gap) { const j = (r() - .5) * gap * .6; c.moveTo(x0 + k + j, y1 + 2); c.lineTo(x0 + k + j + (y1 - y0 + 4) * ang, y0 - 2); }
  c.stroke(); c.restore();
};
const pts2 = (o, u, v) => [o[0] + u, o[1] + v];

// ---------- the story as functions of t ----------
const hitT = i => STROKES[i] + FLY;
const bandProg = (k, t) => STROKES.reduce((a, s, i) => a + (i % 3 === k ? sstep(hitT(i), hitT(i) + .22, t) / 2 : 0), 0);
const drawn = t => STROKES.reduce((a, s, i) => a + sstep(hitT(i), hitT(i) + .2, t), 0) / STROKES.length;
const pageLean = t => 18 * sstep(.83, 1.75, t) * (1 - drawn(t)) * (1 - sstep(3.15, KILL, t));      // degrees, top leans toward Clawd
const pageX = t => lerp(1650, 690, backOut(sstep(.55, 1.05, t) ** .7)) - 90 * sstep(1.05, 1.9, t) + 25 * drawn(t);
const page = t => { const lean = pageLean(t), skew = PH * Math.tan(lean * Math.PI / 180), bx = pageX(t); return { bx, skew, lean, tr: [1, 0, skew / PH, 1, bx - skew, GY - PH] }; };
const pagePt = (P, px, py) => [P.tr[4] + px + P.tr[2] * py, P.tr[5] + py];
const TARGET = [[.33, .5], [.5, .5], [.62, .55], [.7, .45], [.4, .5], [.3, .6]];   // where each stroke lands, band-local fractions
const cam = t => 670 * sstep(4.7, 6.05, t);

function heroAt(t) {
  let x = HX0, y = SEAT, jump = 0, run = 0;
  if (t >= IDEA && t < IDEA + .25) jump = 26 * Math.sin(Math.PI * (t - IDEA) / .25);   // the «idea» take: a small hop
  if (t >= HOP && t < LAND) { const p = (t - HOP) / (LAND - HOP); x = lerp(HX0, 460, p); y = lerp(SEAT, GY, p * p); jump = 70 * 4 * p * (1 - p) * (1 - p * .3); }
  else if (t >= LAND) { const p = t - LAND; x = Math.min(1450, 460 + 950 * p) - 70 * Math.max(0, .25 - p) ** 2 * 4; y = GY; run = clamp(p / .15); }
  let eye = 'open', look = [0, -.9];                                                     // b0–b1: looking up at the ribbon
  if (t >= .83 && t < 1.12) { eye = 'wide'; look = [.6, 0]; }                            // take: the blank page
  else if (t >= 1.12 && t < IDEA) look = [-.4, -.9];                                     // thinking (CAB: lookY −.8, dots)
  else if (t >= IDEA && t < 2.0) { eye = 'wide'; look = [0, -.5]; }                      // idea
  else if (t >= 2.0 && t < KILL) { eye = 'squint'; look = [.6, -.2]; }                   // sketching, concentrated
  else if (t >= KILL && t < GRAB - .1) { eye = 'wide'; look = [.5, -.8]; }               // wow at the cards
  else if (t >= GRAB - .1 && t < LAND + .3) { eye = 'happy'; look = [0, 0]; }
  else if (t >= LAND + .3) look = [.5, 0];
  let shot = -1; for (const s of STROKES) if (t >= s) shot = t - s;
  const k = STROKES.findIndex(s => t < s + .1), aim = [-7, -2, 3];
  const lean = t >= 2.0 && t < KILL + .2 ? aim[(k < 0 ? 5 : k) % 3] * (1 - sstep(KILL, KILL + .2, t)) : t >= 1.12 && t < IDEA ? 2 * Math.sin(t * 7) : undefined;
  const armUp = t >= 1.12 && t < IDEA ? .35 : 1.4 * sstep(GRAB - .2, GRAB, t);
  return { x, y, s: S, t, run, face: 1, jump, lean, shot: shot > .3 ? -1 : shot, eye, gun: false, armUp, look };   // no weapon anywhere: the pencil is a separate prop (penHeld)
}

// ---------- hero in Wonder pencil technique ----------
function drawHero(c, o, bi) {
  const H = heroShapes(o), s = H.s, o0 = H.u2s(0, 0), lu = H.u2s(o.look[0] * 12, o.look[1] * 14), dl = [lu[0] - o0[0], lu[1] - o0[1]];
  for (const [n, { role, pts }] of H.shapes.entries()) {
    const seed = bi * 97 + n * 13;
    if (role === 'tail') inkPoly(c, pts, RED, 2.6, seed, .6);
    else if (role === 'arm' || role === 'leg') {
      inkPoly(c, pts, ORG, 6 * s, seed, .7);
      if (role === 'leg') { const d = [(pts[3][0] - pts[0][0]) * .23, (pts[3][1] - pts[0][1]) * .23]; c.fillStyle = 'rgba(176,84,52,.55)'; c.beginPath(); c.moveTo(...pts[0]); c.lineTo(...pts[1]); c.lineTo(pts[1][0] + d[0], pts[1][1] + d[1]); c.lineTo(pts[0][0] + d[0], pts[0][1] + d[1]); c.fill(); }
      hatchIn(c, pts, 'rgba(160,66,38,.5)', 1, 5, .8, seed);
    } else if (role === 'body') {
      const [p0, p1, , p3] = pts, w = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / s, h = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / s, r = sd(bi + 5);
      c.save(); c.translate((p0[0] + pts[2][0]) / 2 + (r() - .5), (p0[1] + pts[2][1]) / 2 + (r() - .5)); c.rotate(Math.atan2(p1[1] - p0[1], p1[0] - p0[0])); c.scale(s, s);
      c.fillStyle = ORG; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 11); c.fill();
      c.save(); c.clip(); drawHatch(c, w, h, bi % 3, 1.3); c.restore();
      c.strokeStyle = INK; c.lineJoin = 'round'; c.lineWidth = 6.2; c.beginPath(); c.roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 14); c.stroke();
      c.lineWidth = 2.4; c.beginPath(); c.roundRect(-w / 2 - 2.4 + (r() - .5) * 2, -h / 2 - 2.8, w + 5, h + 5.6, 13); c.stroke(); c.restore();
    } else if (role === 'band') { inkPoly(c, pts, RED, 0, seed, 0); hatchIn(c, pts, 'rgba(110,20,20,.35)', 1, 4, 1.2, seed); inkPoly(c, pts, null, 2.6, seed, .6); }
    else if (role === 'eye') {
      const q = pts.map(p => [p[0] + dl[0], p[1] + dl[1]]);
      if (o.eye === 'happy') { c.strokeStyle = INK; c.lineWidth = 7 * s; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...q[0]); c.lineTo(...q[1]); c.lineTo(...q[2]); c.stroke(); continue; }
      const xs = q.map(p => p[0]), ys = q.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
      c.fillStyle = INK; c.beginPath(); c.roundRect(x0, y0, w, h, Math.min(5.5 * s, h / 2.2)); c.fill();
      if (h > 30 * s) { c.fillStyle = '#F4EFE4'; c.beginPath(); c.roundRect(x0 + w - 11.5 * s, y0 + 1.5 * s, 9.5 * s, 9.5 * s, 2.6 * s); c.fill(); }
    }
  }
  return H;
}
// a real pencil from back (x0,y0) to graphite tip (x1,y1): hexagonal yellow body (facet lines), metal ferrule, pink eraser,
// sharpened wood cone with a graphite point. No grip, no trigger guard.
function pencilProp(c, x0, y0, x1, y1, th, seed) {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy * th / 2, ny = ux * th / 2;
  const at = (d, k = 0) => [x0 + ux * d + nx * k, y0 + uy * d + ny * k], cone = L - th * 1.8, er = th * .9, fe = er + th * .7;
  inkPoly(c, [at(fe, 1), at(cone, 1), at(cone, -1), at(fe, -1)], PENCIL, 2.2, seed, .4);
  c.fillStyle = 'rgba(255,240,180,.5)'; c.beginPath(); c.moveTo(...at(fe, -.33)); c.lineTo(...at(cone, -.33)); c.lineTo(...at(cone, -.85)); c.lineTo(...at(fe, -.85)); c.fill();
  c.strokeStyle = 'rgba(150,105,25,.7)'; c.lineWidth = 1.1; c.beginPath();
  for (const k of [-.33, .33]) { c.moveTo(...at(fe, k)); c.lineTo(...at(cone, k)); } c.stroke();                   // hex facets
  inkPoly(c, [at(er, 1.05), at(fe, 1.05), at(fe, -1.05), at(er, -1.05)], '#B8B4AC', 2, seed + 3, .3);             // ferrule
  inkPoly(c, [at(0, .95), at(er, .95), at(er, -.95), at(0, -.95)], '#E89A9A', 2, seed + 2, .3);                  // eraser
  inkPoly(c, [at(cone, 1), [x1, y1], at(cone, -1)], '#E9C9A0', 2, seed + 1, .3);                                  // wood cone
  inkPoly(c, [at(L - th * .7, .38), [x1, y1], at(L - th * .7, -.38)], '#3A3532', 0, seed + 4, 0);                 // graphite
}
// the pencil in the FRONT stub: lies across the stub tip, outside the body silhouette; pops into the paw at 1.875
const penGeom = H => { const a = H.shapes.filter(x => x.role === 'arm')[1].pts, m = [(a[1][0] + a[2][0]) / 2, (a[1][1] + a[2][1]) / 2], d = [a[1][0] - a[0][0], a[1][1] - a[0][1]], L = Math.hypot(...d);
  return { m, u: [d[0] / L, d[1] / L] }; };
const penTip = H => { const { m, u } = penGeom(H); return [m[0] + u[0] * 210 * H.s, m[1] + u[1] * 210 * H.s - 4]; };
function penHeld(c, t, H, bi) {
  if (t < 1.875 || t >= HOP + .1) return;
  const { m, u } = penGeom(H), k = backOut(sstep(1.875, 2.0, t)), b0 = 28 * H.s * k, b1 = 210 * H.s * k;   // starts at the stub tip, outside the body
  if (k < .02) return;
  pencilProp(c, m[0] - u[0] * b0, m[1] - u[1] * b0 - 4, m[0] + u[0] * b1, m[1] + u[1] * b1 - 4, 15 * k, bi + 60);
}

// ---------- sketches + finished looks on the three bands (band-local 450 x 210) ----------
const SK = [[], [], []];
{ // wave: crest with a curl, two foam claws, horizon
  const w = []; for (let i = 0; i <= 40; i++) { const x = 30 + i * 9.8; w.push([x, 160 - 70 * Math.exp(-(((x - 170) / 90) ** 2)) - 12 * Math.sin(x / 30)]); } SK[0].push(w);
  const cu = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * 5.2, r = 34 - i; cu.push([170 + Math.cos(a + 2.6) * r, 100 + Math.sin(a + 2.6) * r]); } SK[0].push(cu);
  SK[0].push([[30, 70], [420, 70]]);
  for (const x0 of [120, 260]) { const f = []; for (let i = 0; i < 6; i++) f.push([x0 + i * 9, 92 + (i % 2) * 10 - (x0 === 260 ? -30 : 0)]); SK[0].push(f); }
  // grid: frame, columns, rows, a sun square
  SK[1].push([[45, 25], [405, 25], [405, 185], [45, 185], [45, 25]]);
  for (let i = 1; i < 9; i++) SK[1].push([[45 + i * 40, 25], [45 + i * 40, 185]]);
  for (let j = 1; j < 4; j++) SK[1].push([[45, 25 + j * 40], [405, 25 + j * 40]]);
  // circles
  for (const [x, y, r] of [[95, 105, 55], [205, 80, 38], [215, 150, 30], [300, 110, 50], [380, 70, 30], [385, 155, 26]]) { const p = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.4 + x; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r * .95]); } SK[2].push(p); }
}
const skLen = SK.map(list => list.map(p => p.length));
function sketch(c, k, prog, bi, al) {
  if (prog <= 0 || al <= 0) return;
  const list = SK[k], n = list.length, f = prog * n, r = sd(bi * 31 + k);
  c.save(); c.strokeStyle = `rgba(52,44,42,${.95 * al})`; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < n && i < f; i++) { const m = Math.max(2, Math.ceil(skLen[k][i] * Math.min(1, f - i))); path(c, list[i].slice(0, m), r, 1.1, false); c.stroke(); }
  c.restore();
}
const PIX = ['#5B8BD9', '#7FB0F0', '#9CC8F5', '#F2C230', '#5DB86A', '#3E9A55', '#2E7A45'];
function look(c, k, al) {
  if (al <= 0) return; c.save(); c.globalAlpha *= al;
  if (k === 0) {   // ink wave
    c.fillStyle = '#EDE3CC'; c.fillRect(0, 0, PW, BH3);
    c.fillStyle = '#22304F'; c.beginPath(); c.moveTo(0, BH3); SK[0][0].forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(PW, 150); c.lineTo(PW, BH3); c.fill();
    c.strokeStyle = '#22304F'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); SK[0][1].slice(0, 18).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.fillStyle = '#F6F0E2'; for (let i = 0; i < 14; i++) { const [x, y] = SK[0][0][8 + i]; c.beginPath(); c.arc(x, y + 4, 4 + (i % 3), 0, 6.3); c.fill(); }
    c.fillStyle = '#C8372D'; c.beginPath(); c.arc(360, 45, 18, 0, 6.3); c.fill();
  } else if (k === 1) {   // pixel grid landscape
    for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) { const sun = i === 7 && j === 0, h = (i * 7 + j * 13) % 3;
      c.fillStyle = sun ? PIX[3] : j < 2 ? PIX[h] : j === 2 ? PIX[4 + (h > 1 ? 1 : 0)] : PIX[5 + (h > 0 ? 1 : 0)]; c.fillRect(45 + i * 40, 25 + j * 40, 40, 40); }
    c.fillStyle = '#EDE6D6'; c.fillRect(0, 0, PW, 25); c.fillRect(0, 185, PW, 25); c.fillRect(0, 0, 45, BH3); c.fillRect(405, 0, 45, BH3);
  } else {   // candy circles
    c.fillStyle = '#FBE3EC'; c.fillRect(0, 0, PW, BH3);
    const cols = ['#F28DB2', '#7FD6C2', '#F9D65C', '#B79AF0', '#F28DB2', '#7FD6C2'];
    [[95, 105, 55], [205, 80, 38], [215, 150, 30], [300, 110, 50], [380, 70, 30], [385, 155, 26]].forEach(([x, y, r], i) => {
      c.fillStyle = cols[i]; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill();
      c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(x - r * .35, y - r * .4, r * .28, r * .16, -.6, 0, 6.3); c.fill(); });
  }
  c.restore();
}
// hit scribbles that each stroke leaves where it lands (band-local)
const SCRIB = STROKES.map((s, i) => { const r = sd(500 + i), out = []; for (let j = 0; j < 9; j++) { const x = (r() - .5) * 60, y = (r() - .5) * 40; out.push([x, y, 10 + r() * 16]); } return out; });
function band(c, k, t, bi) {
  c.save(); c.beginPath(); c.rect(0, 0, PW, BH3); c.clip();
  const col = sstep(KILL, KILL + .4, t);
  look(c, k, col);
  sketch(c, k, bandProg(k, t), bi, 1 - .65 * col);
  c.strokeStyle = `rgba(58,54,52,${.55 * (1 - col)})`; c.lineWidth = 1.3; c.beginPath();
  STROKES.forEach((s, i) => { if (i % 3 !== k || t < hitT(i)) return; const [fx, fy] = TARGET[i], cx = fx * PW, cy = fy * BH3, gr = sstep(hitT(i), hitT(i) + .1, t);
    for (const [x, y, l] of SCRIB[i]) { c.moveTo(cx + x, cy + y); c.lineTo(cx + x + l * gr, cy + y - l * gr); } });
  c.stroke(); c.restore();
}

// ---------- props ----------
function chair(c, bi) {
  const L = 2.6; c.lineCap = 'round';
  inkPoly(c, [[190, 448], [262, 452], [258, 540], [194, 536]], '#8A7F6C', L, bi + 1);                    // back canvas
  hatchIn(c, [[190, 448], [262, 452], [258, 540], [194, 536]], 'rgba(30,30,28,.25)', 1, 5, .7, bi + 2);
  for (const [a, b] of [[[222, 440], [214, 640]], [[214, 640], [450, GY]], [[450, 640], [214, GY]], [[450, 640], [452, 556]]]) inkPoly(c, [a, [b[0] + 4, b[1]], [b[0] - 4, b[1]], [a[0] - 4, a[1]]], WOOD, 2.2, bi + a[0]);
  inkPoly(c, [[205, 552], [520, 552], [520, 562], [205, 562]], WOOD, 2.2, bi + 7);                        // armrest
  inkPoly(c, [[200, 636], [470, 636], [470, 650], [200, 650]], '#8A7F6C', 2.4, bi + 8);                   // seat canvas
  c.fillStyle = 'rgba(90,90,90,.14)'; c.beginPath(); c.ellipse(332, GY + 1, 150, 10, 0, 0, 6.3); c.fill();
}
function ribbon(c, t, bi) {
  const y = lerp(70, 225, backOut(sstep(0, .55, t) ** .8)), a = .06 * Math.exp(-3 * Math.max(0, t - .4)) * Math.sin(9 * t) + .008 * Math.sin(t * 2.1), x0 = 90, w = 400, h = 70;
  c.save(); c.translate(x0 + w / 2, y); c.rotate(a);
  c.strokeStyle = 'rgba(58,54,52,.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-w / 2 + 12, 0); c.lineTo(-w / 2 + 12 - 6, -y - 20); c.moveTo(w / 2 - 12, 0); c.lineTo(w / 2 - 12 + 6, -y - 20); c.stroke();
  inkPoly(c, [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]], '#F4F0E4', 2.4, bi + 21, .7);
  c.lineWidth = 1.2; c.strokeStyle = 'rgba(47,28,28,.7)'; c.beginPath();
  for (let i = 0; i < 24; i++) { const x = -w / 2 + 8 + i * 16.3; c.moveTo(x, 2); c.lineTo(x, i % 4 ? 8 : 14); } c.stroke();     // beat ticks
  ['#E8457A', '#2E6FE0', '#F2C230', '#2BA37A'].forEach((col, j) => { c.strokeStyle = col; c.lineWidth = 2.6; c.beginPath();
    for (let i = 0; i <= 60; i++) { const x = -w / 2 + 8 + i * 6.4, yy = 22 + j * 11 + Math.sin(i * (.7 + j * .4) + j) * (2 + (i * 7 + j) % 4); i ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); });
  const ph = -w / 2 + 8 + ((t / (60 / 144)) * 16.3) % (w - 16);                                                   // playhead runs on the beats
  c.strokeStyle = '#C8372D'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(ph, -4); c.lineTo(ph, h + 4); c.stroke();
  c.restore();
}
function door(c, bi) {
  const { x, y, w, h } = DOOR, fr = [[x - 18, y - 18], [x + w + 18, y - 18], [x + w + 18, GY], [x - 18, GY]];
  inkPoly(c, fr, '#DCD6C6', 2.6, bi + 40, .8); hatchIn(c, fr, 'rgba(70,64,60,.25)', 1, 6, .5, bi + 41);
  const dw = [[x, y], [x + w, y], [x + w, GY], [x, GY]];
  inkPoly(c, dw, 'rgba(47,28,28,.82)', 2.6, bi + 42, .6);
  hatchIn(c, dw, 'rgba(20,12,12,.6)', 1.4, 5, .9, bi + 43); hatchIn(c, dw, 'rgba(20,12,12,.45)', 1.2, 6, -.9, bi + 44);
  c.fillStyle = GROUND; c.fillRect(x - 40, GY, w + 160, 2);
}
function doorLeaf(c, bi) {   // the open leaf stands in front: whatever walks in disappears behind it
  const { x, y, w } = DOOR, lf = [[x + w + 18, y - 14], [x + w + 96, y + 12], [x + w + 96, GY - 10], [x + w + 18, GY]];
  inkPoly(c, lf, '#EFEADC', 2.6, bi + 45, .8); hatchIn(c, lf, 'rgba(70,64,60,.3)', 1, 7, .4, bi + 46);
  c.fillStyle = INK; c.beginPath(); c.arc(x + w + 80, 610, 6, 0, 6.3); c.fill();
}
function emotes(c, t, H) {
  const top = H.u2s(40, -210), sz = 26;
  if (t >= 1.12 && t < IDEA) for (let i = 0; i < 3; i++) {   // CAB «dots»: three dots pop in one after another
    const q = backOut(clamp((t - 1.18 - i * .14) / .12)); if (q < .02) continue;
    c.fillStyle = INK; c.beginPath(); c.arc(top[0] + (i - 1) * 1.3 * sz, top[1] + 10, .42 * sz * q, 0, 6.3); c.fill(); }
  const b = backOut(clamp((t - IDEA) / .18)) * (1 - sstep(2.05, 2.3, t));
  if (b > .02) {   // CAB «bulb», in pencil
    const [bx, by] = H.u2s(0, -230), gl = .5 + .5 * Math.sin((t - IDEA) * 10);
    c.save(); c.translate(bx, by); c.scale(b, b);
    const g = c.createRadialGradient(0, -1.4 * sz, 0, 0, -1.4 * sz, 4.5 * sz); g.addColorStop(0, `rgba(255,210,122,${.55 + .2 * gl})`); g.addColorStop(1, 'rgba(255,210,122,0)');
    c.fillStyle = g; c.fillRect(-5 * sz, -6 * sz, 10 * sz, 10 * sz);
    c.strokeStyle = '#B07A22'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .45, r0 = 1.6 * sz, r1 = (2.2 + .4 * gl) * sz; c.moveTo(Math.cos(a) * r0, -1.4 * sz + Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, -1.4 * sz + Math.sin(a) * r1); } c.stroke();
    c.fillStyle = '#FFE68A'; c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.ellipse(0, -1.4 * sz, 1.15 * sz, 1.2 * sz, 0, 0, 6.3); c.fill(); c.stroke();
    inkPoly(c, [[-.5 * sz, -.3 * sz], [.5 * sz, -.3 * sz], [.5 * sz, .5 * sz], [-.5 * sz, .5 * sz]], '#9A93A8', 2.2, 77, .3);
    c.restore();
  }
}

// ---------- cards after the climax ----------
const CARD_S = .42;   // held big: the hand-off must read as a picture (SHOWREEL.md, v3)
function cardXf(k, t) {   // -> [cx, cy, rot, scale] in world
  const P = page(KILL), c0 = pagePt(P, PW / 2, (k + .5) * BH3);
  const hover = [P.bx + PW / 2 - 60 + (k - 1) * 170, 330 + Math.abs(k - 1) * 22 + 6 * Math.sin(t * 4 + k), (k - 1) * .16, .36];
  if (t < DROP) { const p = backOut(sstep(KILL, KILL + .45, t) ** .9); return [lerp(c0[0], hover[0], p), lerp(c0[1], hover[1], p), hover[2] * p, lerp(1, hover[3], p)]; }
  const H = heroShapes(heroAt(t)), arm = H.shapes.find(x => x.role === 'arm').pts, a = [(arm[0][0] + arm[1][0]) / 2, (arm[0][1] + arm[1][1]) / 2];
  const fan = [a[0] + 22 + (k - 1) * 46, a[1] - 84 - (1 - Math.abs(k - 1)) * 12, (k - 1) * .3 - .12, CARD_S];
  const p = sstep(DROP, GRAB, t), q = p * p;
  return [lerp(hover[0], fan[0], q), lerp(hover[1], fan[1], p) - 50 * Math.sin(Math.PI * p), lerp(hover[2], fan[2], p), lerp(hover[3], fan[3], p)];
}

function cards(c, t, bi) {
  for (const k of [0, 2, 1]) { const [x, y, r, s] = cardXf(k, t);
    c.save(); c.translate(x, y); c.rotate(r); c.scale(s, s); c.translate(-PW / 2, -BH3 / 2);
    if (t > KILL + .05) { c.fillStyle = 'rgba(60,50,40,.12)'; c.fillRect(8, 10, PW, BH3); }
    band(c, k, t, bi); inkPoly(c, [[0, 0], [PW, 0], [PW, BH3], [0, BH3]], null, 3 / Math.max(s, .3), bi + 70 + k, .8); c.restore(); }
}
let paperW = 2700;
export default {
  async init() { for (let v = 0; v < NV; v++) paperTex(v, paperW); },
  draw(c, t, St) {
    const { W } = St, idx = Math.floor(t * 24 + 1e-6), bi = Math.floor(idx / 4), ox = (W - 1080) / 2, cx = cam(t);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(paperTex(bi % NV, paperW), -450 + ox - cx, 0);
    c.translate(ox - cx, 0);
    c.fillStyle = GROUND; c.fillRect(-600, GY, 3400, 1.2);
    door(c, bi); c.save(); c.translate(CHX, 0); chair(c, bi); c.restore();
    if (t >= HOP + .1) pencilProp(c, 395, 548, 475, 536, 12, bi + 60);   // put back on the armrest after use
    ribbon(c, t, bi);
    const P = page(t), alive = t < KILL + .02;
    if (alive && t > .5) {   // the page's shadow presses on the chair corner
      const al = .14 * P.lean / 18; if (al > .005) { const sh = [[P.bx - P.skew * 2.2, GY + 14], [P.bx + 40, GY + 14], [P.bx - P.skew, GY - PH], [P.bx - P.skew * 2.2 - 40, GY - PH * .8]];
        c.save(); c.globalAlpha = al / .2; hatchIn(c, sh, 'rgba(47,28,28,.2)', 1.2, 4, .7, bi + 50); c.fillStyle = 'rgba(40,36,34,.06)'; path(c, sh, () => .5, 0); c.fill(); c.restore(); }
    }
    const HO = heroAt(t);
    const hc = () => { drawHero(c, HO, bi); penHeld(c, t, heroShapes(HO), bi); if (t >= GRAB) cards(c, t, bi); };
    const drawH = () => { if (t >= DOORIN - .4) {   // walking into the dark doorway: the part inside fades
      const fade = 1 - sstep(DOORIN - .35, DOORIN - .05, t), { x, y, w, h } = DOOR;
      c.save(); c.beginPath(); c.rect(-2000, -100, 6000, 1300); c.rect(x, y, w, h); c.clip('evenodd'); c.globalAlpha = 1 - sstep(DOORIN - .2, DOORIN - .02, t); hc(); c.restore();
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.globalAlpha = fade; hc(); c.restore();
    } else hc(); };
    if (t >= HOP) drawH();
    if (alive && t > .5) {   // the blank page
      c.save(); c.transform(...P.tr);
      c.fillStyle = 'rgba(90,90,90,.12)'; c.beginPath(); c.ellipse(PW / 2 + P.skew * .5, PH + 2, PW * .55, 11, 0, 0, 6.3); c.fill();
      const ear = 54, outline = [[ear, 0], [PW, 0], [PW, PH], [0, PH], [0, ear]];
      inkPoly(c, outline, PALE, 3, bi + 30, .9);
      for (let k = 0; k < 3; k++) { c.save(); c.translate(0, k * BH3); band(c, k, t, bi); c.restore(); }
      inkPoly(c, outline, null, 3, bi + 30, .9);
      inkPoly(c, [[0, ear], [ear, 0], [ear + 6, ear + 6]], '#E4E2D8', 2.4, bi + 31, .6);     // dog-eared corner
      c.restore();
    }
    if (t < HOP) drawH();
    doorLeaf(c, bi);
    const H = heroShapes(HO);
    emotes(c, t, H);
    // pencil strokes flying from the pencil tip to the page
    STROKES.forEach((s, i) => {
      if (t < s || t > hitT(i) + .3) return;
      const tip = penTip(heroShapes(heroAt(s))), Ph = page(hitT(i)), k = i % 3, end = pagePt(Ph, TARGET[i][0] * PW, (k + TARGET[i][1]) * BH3);
      const ctl = [(tip[0] + end[0]) / 2, Math.min(tip[1], end[1]) - 80], p = clamp((t - s) / FLY), p0 = clamp((t - s - .08) / FLY), fade = 1 - sstep(hitT(i), hitT(i) + .3, t);
      const B = u => [(1 - u) ** 2 * tip[0] + 2 * u * (1 - u) * ctl[0] + u * u * end[0], (1 - u) ** 2 * tip[1] + 2 * u * (1 - u) * ctl[1] + u * u * end[1]];
      c.strokeStyle = `rgba(52,46,44,${.85 * fade})`; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
      for (let j = 0; j <= 16; j++) { const u = lerp(p0, p, j / 16), [x, y] = B(u), w = Math.sin(u * 40 + i) * 3; j ? c.lineTo(x, y + w) : c.moveTo(x, y + w); } c.stroke();
    });
    if (t >= KILL) {   // climax: soft pencil-hatch flash, then the three look cards
      const P0 = page(KILL), fx = P0.bx + PW / 2, fy = GY - PH / 2;
      radial(c, 1 - sstep(KILL, KILL + .6, t), sstep(KILL - .05, KILL + .2, t), fx, fy, 640);
      const fl = .35 * (1 - sstep(KILL, KILL + .25, t)); if (fl > 0) { const g = c.createRadialGradient(fx, fy, 0, fx, fy, 420); g.addColorStop(0, `rgba(255,253,244,${fl})`); g.addColorStop(1, 'rgba(255,253,244,0)'); c.fillStyle = g; c.fillRect(fx - 420, fy - 420, 840, 840); }
      if (t < GRAB) cards(c, t, bi);
    }
  },
  door(t, St) { const ox = (St.W - 1080) / 2, cx = cam(t); return { x: DOOR.x + ox - cx, y: DOOR.y, w: DOOR.w, h: DOOR.h }; },
  events: [{ t: IDEA, k: 'click' }, ...STROKES.flatMap((s, i) => [{ t: s, k: 'shot' }, { t: hitT(i), k: 'hit' }]),
    { t: KILL, k: 'kill' }, { t: DROP, k: 'whoosh' }, { t: GRAB, k: 'loot' }, { t: HOP, k: 'jump' }, { t: DOORIN, k: 'door' }],
};
