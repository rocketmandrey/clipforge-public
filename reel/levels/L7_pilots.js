// L7 «ПИЛОТЫ»: chibi_paper (squared notebook, coloured-pencil chibi kids, ballpoint/pencil). Mini-scene, no fight.
// b0–b1 the hero brings the OK stamp (L6 loot) and slams it on the spread → perforated lines split it into columns А / Б / В.
// b2–b5 three kids draw three pilots of the hero in sync (hatch / dots / solid); the hero tosses each an orange pencil.
// b6–b7 everything freezes: the fork, the kids look up. b8 (seg.kill) a big system cursor clicks Б: red circle, kids cheer, А/В fade.
// lootDrop page Б tears off along the perforation and falls, lootGrab the hero catches it and runs it, held high, into a pen-drawn door.
// Kit: levels/L7/* (the clipforge chibi_paper kit). Frame = pure function of t.
import { heroShapes, ORG, INK, RED, GUN } from '../hero.js';
import { pencil, kline, poly, ell, rr } from './L7/chibi.js';
import { rng, wob, strokePart, grainStyle, arc } from './L7/pen.js';
import { grid } from './L7/paper.js';
import { kid, cl, ss, seg, lerp } from './L7/stage.js';
import { EMOTIONS, POSES } from './L7/emotions.js';

const BT = 60 / 144, b = i => i * BT;
const T_HIT = b(1), T_DRAW0 = b(2), T_DRAW1 = b(6) - .05, T_KILL = b(8), T_DROP = b(10), T_GRAB = b(11), T_RUN0 = b(12), T_RUN1 = b(14);
const TOSS = [b(3), b(3.5), b(4)];                        // orange pencils fly to kids А, Б, В
const COLS = [70, 390, 710], CW = 300, CY0 = 175, CY1 = 700, PAN = 260, PY = 410;   // columns and pilot panels (square-world coords)
const KIDS = ['kudryash', 'kepka', 'kosichkiRyzhie'], KK = .78, KSIT = PY + 14 * KK, MARGIN = 720;   // kids sit on the top edge of their panel
const GROUND = 862, HS = .55, HX = 600;                     // hero ground (bottom margin), scale, standing x
const DOOR = { x: 925, y: 680, w: 120, h: 182 };
const PEN = '#23306f', GRAPH = '#4a4744', REDPEN = '#d23a2e', PAPER = '#f3f1ea';
const BG = new Map();
const cache = {};

// ---- small helpers ----
const flat = pts => pts.flatMap(p => p);
const lineTo = (c, p) => { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); };
function wobbly(key, pts, seed, amp = 1.2) { return cache[key] ??= wob(pts, rng(seed), amp, 10); }
function penStroke(c, pts, f, col = PEN, w = 5) { if (f <= 0) return; c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = c.lineJoin = 'round'; strokePart(c, pts, cl(f)); c.restore(); }
const pathOf = pts => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) p.lineTo(q[0], q[1]); p.closePath(); return p; };

// handwritten capital letters, unit box (x 0..0.7, y 0..1 down)
const GLYPH = {
  'А': [[0, 1, .36, 0, .72, 1], [.14, .62, .58, .62]],
  'Б': [[.66, 0, .06, 0, .06, 1, .46, 1, .68, .86, .68, .64, .46, .5, .06, .5]],
  'В': [[.06, 1, .06, 0, .42, 0, .62, .12, .6, .36, .4, .48, .06, .48], [.4, .48, .68, .6, .68, .88, .46, 1, .06, 1]],
};
function letter(c, ch, x, y, h, f, seed) {
  const strokes = GLYPH[ch].map((s, k) => wobbly(`L${ch}${k}`, s.map((v, i) => i % 2 ? y + v * h : x + v * h + (1 - s[i + 1]) * h * .1), seed + k, 1.4));
  strokes.forEach((s, k) => penStroke(c, s, f * strokes.length - k, PEN, 7));
}

// ---- the hero in the kit's coloured-pencil technique (scribble fill that misses the line + wobbly graphite line) ----
const COL = { arm: ORG, leg: ORG, body: ORG, band: RED, tail: RED, gun: '#5a5a66' };
function drawHero(c, H) {
  H.shapes.forEach(({ role, pts }, i) => {
    if (role === 'flash') return;
    if (role === 'eye') { c.fillStyle = INK; c.fill(pathOf(pts)); return; }
    const p = poly(flat(pts)), r = rng(700 + i * 13); c.fillStyle = COL[role]; c.fill(p);   // solid base keeps the hero the strongest spot
    pencil(c, p, COL[role], r, { gap: 4, press: 1.3, outline: false }); kline(c, p, r, 2.6);
  });
}

// the hero's stage tool: a big orange pencil in the front paw (no weapons anywhere), same kit pencil technique
function heroPencil(c, H) {
  const P = pts => poly(pts.flatMap(([u, v]) => H.u2s(u, v)));
  const part = (pts, col, sd) => { const p = P(pts), r = rng(sd); c.fillStyle = col; c.fill(p); pencil(c, p, col, r, { gap: 4, press: 1.3, outline: false }); kline(c, p, r, 2.4); };
  part([[150, 36], [380, 36], [380, 84], [150, 84]], ORG, 951);
  part([[104, 36], [150, 36], [150, 84], [104, 84]], '#e48a8a', 952);
  part([[380, 36], [446, 60], [380, 84]], '#efd2a8', 953);
  c.fillStyle = INK; c.fill(pathOf([[424, 52], [446, 60], [424, 68]].map(([u, v]) => H.u2s(u, v))));
}

// ---- pilots: the same mini-scene in three manners ----
const GROUND_PTS = (() => { const p = []; for (let x = 0; x <= PAN; x += 10) p.push(x, 205 - 34 * Math.exp(-(((x - 205) / 38) ** 2))); return p; })();
const groundPoly = () => poly([...GROUND_PTS, PAN, PAN - 2, 0, PAN - 2]);
function fillTech(c, kind, path, col, f, box, seed) {   // reveal fraction f of the fill inside path; box = [x0,y0,x1,y1] anchor of the pattern
  if (f <= 0) return; const [x0, y0, x1, y1] = box, r = rng(seed);
  c.save(); c.clip(path);
  if (kind === 0) {   // hatch: parallel diagonal pencil strokes
    const n = Math.ceil((x1 - x0 + y1 - y0) / 4.5), m = Math.ceil(n * cl(f)); c.strokeStyle = grainStyle(c, col); c.lineCap = 'round';
    for (let i = 0; i < m; i++) { const o = i * 4.5, j = (r() - .5) * 2; c.lineWidth = 2 + r(); c.beginPath(); c.moveTo(x0 + o - (y1 - y0) + j, y1 + 2); c.lineTo(x0 + o + j, y0 - 2); c.stroke(); }
  } else if (kind === 1) {   // dots: stipple
    const n = Math.round((x1 - x0) * (y1 - y0) / 22), m = Math.ceil(n * cl(f)); c.fillStyle = col;
    for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), R = 1.4 + r() * 1.3; if (i < m) { c.beginPath(); c.arc(x, y, R, 0, 6.283); c.fill(); } }
  } else {   // solid: flat fill swept left → right with a wobbly edge
    const e = x0 + (x1 - x0 + 12) * cl(f); c.beginPath(); c.moveTo(x0 - 4, y0 - 4);
    for (let y = y0 - 4; y <= y1 + 4; y += 6) c.lineTo(e + Math.sin(y * .3) * 4, y); c.lineTo(x0 - 4, y1 + 4); c.fillStyle = col; c.fill();
  }
  c.restore();
}
// panel-local tip of the pencil at drawing progress p (where the kid's pencil is right now)
function pilot(c, k, t, p, hop, eye, fFrame) {
  const kinds = k, outline = [GRAPH, PEN, '#1d1b1a'][k], ow = [2.2, 2.4, 3.4][k];
  const fGL = seg(p, .1, .2), fScene = seg(p, .18, .4), fHero = seg(p, .4, .7), fFill = (p - .7) / .3;
  let tip = null;
  const frame = wobbly(`fr${k}`, [0, 0, PAN, 0, PAN, PAN, 0, PAN, 0, 0], 40 + k, 1.6);
  penStroke(c, frame, fFrame, outline, ow + .6);
  // scene: ground with a hill, a sun
  const gp = groundPoly(), sun = ell(62, 62, 26, 26), skyBox = [0, 0, PAN, PAN];
  fillTech(c, kinds, gp, ['#6a8f5a', '#5f8a4e', '#86b46e'][k], fScene, skyBox, 50 + k);
  fillTech(c, kinds, sun, '#e9b43c', fScene, [30, 30, 94, 94], 60 + k);
  penStroke(c, wobbly(`gl${k}`, GROUND_PTS, 70 + k), fGL, outline, ow);
  if (fGL > 0 && fGL < 1) tip = [GROUND_PTS[Math.floor(fGL * 26) * 2], GROUND_PTS[Math.floor(fGL * 26) * 2 + 1]];
  if (fScene > 0 && fScene < 1) tip = [36 + 52 * ((fScene * 7) % 1), 40 + fScene * 150];
  // the mini hero, hopping on every beat (all three in sync)
  const H = heroShapes({ x: 120, y: 200, s: .24, t, run: 0, jump: hop, eye, gun: false });
  const [bx0, by0, bx1, by1] = H.bbox, box = [bx0 - 4, by0 - 4, bx1 + 4, by1 + 4];
  const fillOrder = { arm: 0, leg: 0, body: 0, band: 1, tail: 1, gun: 2 }, span = [[0, .7], [.7, .88], [.88, 1]];
  for (const { role, pts } of H.shapes) {
    if (role === 'flash' || role === 'eye') continue; const [a, z] = span[fillOrder[role]];
    fillTech(c, kinds, pathOf(pts), COL[role], (fFill - a) / (z - a), box, 80 + k);
  }
  const n = H.shapes.length;
  H.shapes.forEach(({ role, pts }, i) => { if (role === 'flash') return; const f = fHero * n - i;
    if (role === 'eye') { if (f > 0) { c.fillStyle = INK; c.fill(pathOf(pts)); } return; }
    if (f > 0) { const q = [...flat(pts), pts[0][0], pts[0][1]]; c.save(); c.strokeStyle = outline; c.lineWidth = ow; c.lineJoin = 'round'; strokePart(c, q, cl(f)); c.restore(); } });
  if (fHero > 0 && fHero < 1) tip = [lerp(bx0, bx1, (fHero * 5) % 1), lerp(by0, by1, fHero)];
  if (fFill > 0 && fFill < 1) { const z = (fFill * 6) % 1; tip = [lerp(bx0, bx1, z < .5 ? z * 2 : 2 - z * 2), lerp(by0, by1, fFill)]; }
  return tip;
}

// a pencil from tip to back end (kid's pencil), body colour col
function pencilTool(c, tip, back, col) {
  const dx = back[0] - tip[0], dy = back[1] - tip[1], L = Math.hypot(dx, dy);
  c.save(); c.translate(tip[0], tip[1]); c.rotate(Math.atan2(dy, dx));
  c.fillStyle = 'rgba(40,30,20,.16)'; c.fillRect(30, 2, L - 20, 12);
  c.fillStyle = col; c.fillRect(26, -7, L - 26, 14); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(26, 2, L - 26, 5);
  c.fillStyle = '#e48a8a'; c.fillRect(L, -7, 14, 14); c.fillStyle = '#b9bcc2'; c.fillRect(L - 6, -7, 7, 14);
  c.fillStyle = '#efd2a8'; c.beginPath(); c.moveTo(26, -7); c.lineTo(26, 7); c.lineTo(0, 0); c.closePath(); c.fill();
  c.fillStyle = col === ORG ? ORG : '#2b2b33'; c.beginPath(); c.moveTo(9, -2.5); c.lineTo(9, 2.5); c.lineTo(0, 0); c.closePath(); c.fill();
  c.strokeStyle = '#2a2421'; c.lineWidth = 2; c.strokeRect(26, -7, L - 12, 14); c.beginPath(); c.moveTo(26, -7); c.lineTo(0, 0); c.lineTo(26, 7); c.stroke();
  c.restore();
}

// chibi arm geometry (same formulas as L7/chibi.js arm()): hand position of the right arm for a pose, in kid-local units
const handR = (yaw, ang, elbow = 0) => { const x0 = 33 * Math.cos(yaw) * (1 - .25 * Math.abs(Math.sin(yaw))), y0 = -118, a = .3 + ang,
  dir = cl(Math.cos(yaw) + Math.sin(yaw) * 1.1, -1, 1) || 1, xe = x0 + Math.sin(a) * 27.84 * dir, ye = y0 + Math.cos(a) * 27.84,
  x1 = xe + Math.sin(a + elbow) * 28.8 * dir, y1 = ye + Math.cos(a + elbow) * 28.8; return [x1 + (x1 - xe) * .2, y1 + (y1 - ye) * .2]; };

// ---- the OK stamp (L6 loot) ----
function stampTool(c, x, y, sc) {   // bottom centre of the rubber at (x, y)
  c.save(); c.translate(x, y); c.scale(sc, sc);
  pencil(c, rr(-70, -40, 140, 40, 6), '#c8372d', rng(901), { gap: 4 });
  pencil(c, rr(-60, -78, 120, 40, 6), '#a7744a', rng(902), { gap: 4 });
  pencil(c, rr(-16, -150, 32, 76, 10), '#a7744a', rng(903), { gap: 4 });
  pencil(c, ell(0, -165, 38, 26), '#7a4a32', rng(904), { gap: 4 });
  c.restore();
}
function okImprint(c, x, y, sc, a) {
  if (a <= 0) return; c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(-.12); c.globalAlpha = a;
  c.strokeStyle = grainStyle(c, REDPEN); c.lineWidth = 12; c.lineCap = 'round';
  c.beginPath(); c.ellipse(0, 0, 118, 82, 0, 0, 6.283); c.stroke(); c.lineWidth = 6; c.beginPath(); c.ellipse(0, 0, 100, 66, 0, 0, 6.283); c.stroke();
  c.lineWidth = 15; c.beginPath(); c.ellipse(-36, 0, 26, 38, 0, 0, 6.283); c.moveTo(16, -38); c.lineTo(16, 38); c.moveTo(58, -38); c.lineTo(18, 4); c.lineTo(60, 38); c.stroke();
  c.restore();
}

// ---- the big system cursor ----
const ARROW = [[0, 0], [0, 21], [5, 16.5], [8.6, 24.6], [11.6, 23.3], [8.1, 15.4], [14.7, 15.4]];
function cursor(c, x, y, sc) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  c.save(); c.translate(.8, 1); c.fillStyle = 'rgba(0,0,0,.28)'; c.fill(pathOf(ARROW)); c.restore();
  c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.1; c.lineJoin = 'round'; const p = pathOf(ARROW); c.fill(p); c.stroke(p);
  c.restore();
}

// ---- column content (letter, pilot) for column k, at progress p ----
function column(c, k, t, p, hop, eye, writeF) {
  const x = COLS[k];
  letter(c, 'АБВ'[k], x + 190, 205, 92, writeF, 10 + k * 5);
  c.save(); c.translate(x + 20, PY); const tip = pilot(c, k, t, p, hop, eye, writeF); c.restore();
  return tip && [tip[0] + x + 20, tip[1] + PY];
}
function perforation(c, f) {   // dashed tear lines spreading from the stamp impact (540, 470)
  if (f <= 0) return; c.save(); c.strokeStyle = PEN; c.lineWidth = 3.4; c.setLineDash([14, 10]); c.lineCap = 'round';
  for (const x of [COLS[1] - 10, COLS[2] - 10]) { c.beginPath(); c.moveTo(x, 470 - (470 - CY0) * f); c.lineTo(x + 1, 470 + (CY1 - 470) * f); c.stroke(); }
  for (const y of [CY0, CY1]) { c.beginPath(); c.moveTo(540 - 490 * f, y); c.lineTo(540 + 490 * f, y); c.stroke(); }
  c.restore();
}

// ---- hero track ----
function hero(t) {
  let x, face = 1, run = 0, eye = 'open', armUp = 0, shot = -1, jump = 0;
  if (t < b(2)) { x = lerp(90, HX, ss(t / b(2.2))); run = t < b(1.8) ? 1 : 0; armUp = t < .3 ? 1 : 0; if (t > .18 && t < .45) jump = 50 * Math.sin(Math.PI * (t - .18) / .27); eye = t < T_HIT + .2 && t > T_HIT - .1 ? 'squint' : 'happy'; }
  else if (t < b(6)) { x = HX; eye = 'happy'; const i = TOSS.findIndex(s => t >= s && t < s + .2); if (i >= 0) { shot = t - TOSS[i]; face = i < 2 ? -1 : 1; armUp = 1; }
    jump = 6 * Math.abs(Math.sin(Math.PI * (t - b(2)) / BT)); }
  else if (t < T_KILL) { x = HX; eye = 'wide'; }
  else if (t < T_RUN0) { x = HX; eye = 'happy'; jump = t > b(9) && t < b(10) ? 40 * Math.sin(Math.PI * (t - b(9)) / BT) : 0; armUp = cl((t - (T_GRAB - .25)) / .25); }
  else { x = lerp(HX, DOOR.x + DOOR.w / 2, ss((t - T_RUN0) / (T_RUN1 - T_RUN0))); run = t < T_RUN1 + .1 ? 1 : 0; eye = 'happy'; armUp = 1; }
  if (t >= T_GRAB) armUp = 1;
  return { x, face, run, eye, armUp, shot, jump };
}
const hold = H => H.u2s(-195, -95);
const PS = .5;   // page Б scale in the hero's paws   // the raised paw: what the hero carries sits on it

// page Б as an object: bg patch + its content, drawn with its centre at (0, 0)
function pageB(c, bg, ox, t, ps) {
  const x0 = COLS[1] - 10, w = CW + 20, h = CY1 - CY0;
  c.save(); c.translate(-w / 2, -h / 2);
  c.fillStyle = 'rgba(40,30,20,.25)'; c.fillRect(8, 10, w, h);
  c.drawImage(bg, ox + x0, CY0, w, h, 0, 0, w, h);
  c.translate(-x0, -CY0); column(c, 1, t, ps.p, 0, ps.eye, 1); redCircle(c, 1);
  c.restore();
}
function redCircle(c, f) {
  const pts = cache.circ ??= wob(arc(0, 0, 1, -1.9, -1.9 + 6.283 * 1.1, .02).map((v, i) => i % 2 ? 437 + v * 255 : 540 + v * 142), rng(77), 2.5, 12);
  penStroke(c, pts, f, REDPEN, 8);
}

export default {
  async init(S) { if (!BG.has(S.W)) BG.set(S.W, grid(S.W, S.H, { cell: 36, seed: 4 })); },
  door(t, S) { const z = cam(t), ox = (S.W - 1080) / 2, X = v => S.W / 2 + (v + ox - S.W / 2 - z.dx) * z.s, Y = v => 540 + (v - 540) * z.s;
    return { x: X(DOOR.x), y: Y(DOOR.y), w: DOOR.w * z.s, h: DOOR.h * z.s }; },
  events: [{ t: .25, k: 'jump' }, { t: T_HIT, k: 'hit' }, ...TOSS.map(t => ({ t, k: 'whoosh' })), { t: T_KILL, k: 'click' }, { t: T_KILL, k: 'kill' },
    { t: T_DROP, k: 'whoosh' }, { t: T_GRAB, k: 'loot' }, { t: 6.0, k: 'door' }],
  draw(c, t, S) {
    const { W } = S, ox = (W - 1080) / 2, bg = BG.get(W) || (BG.set(W, grid(W, S.H, { cell: 36, seed: 4 })), BG.get(W)), z = cam(t);
    c.fillStyle = PAPER; c.fillRect(0, 0, W, S.H);
    c.save(); c.translate(W / 2, 540); c.scale(z.s, z.s); c.translate(-W / 2 - z.dx, -540);
    c.drawImage(bg, 0, 0);
    c.translate(ox, 0);
    // bottom margin line of the notebook (the hero runs on the margin)
    c.save(); c.strokeStyle = 'rgba(210,90,90,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-ox, MARGIN); c.lineTo(1080 + ox, MARGIN + 1); c.stroke(); c.restore();

    const tq = Math.floor(t * 12) / 12;                                   // kids & pencils on twos, like the ref
    const frozen = t >= T_DRAW1 + .05, p = cl((Math.min(t, T_DRAW1) - T_DRAW0) / (T_DRAW1 - T_DRAW0));
    const hop = t >= T_DRAW0 && !frozen ? 14 * Math.sin(Math.PI * (((t - T_DRAW0) / BT) % 1)) : 0;
    const mEye = frozen && t < T_KILL ? 'wide' : t >= T_KILL ? 'happy' : 'open';
    const torn = t >= T_DROP, pick = seg(t, T_KILL, T_KILL + .45);

    // the stamp hit and its imprint (moves to the corner as a teacher's mark)
    perforation(c, seg(t, T_HIT, T_HIT + .4));
    const imp = seg(t, T_HIT + .15, T_HIT + .65);
    okImprint(c, lerp(540, 965, imp), lerp(470, 345, imp), lerp(1, .38, imp), t >= T_HIT ? 1 : 0);

    // three columns
    const tips = [];
    for (let k = 0; k < 3; k++) {
      const wf = seg(t, .45 + k * .08, .7 + k * .08);
      if (k === 1 && torn) {   // torn out: a faint shadow and ragged stubs along the perforation
        c.save(); c.fillStyle = 'rgba(60,50,40,.05)'; c.fillRect(COLS[1] - 10, CY0, CW + 20, CY1 - CY0); c.restore(); tips.push(null); continue; }
      tips.push(column(c, k, t, p, hop, mEye, wf));
      if (k !== 1 && pick > 0) { c.save(); c.globalAlpha = .62 * pick; c.fillStyle = PAPER; c.fillRect(COLS[k] - 6, CY0 + 4, CW + 10, CY1 - CY0 - 8); c.restore(); }
    }
    if (t >= T_KILL && !torn) redCircle(c, seg(t, T_KILL, T_KILL + .3));

    // kids sit on the top edge of their panels: idle → drawing down into it (arm points at the pencil tip) → look up at the fork → cheer
    for (let k = 0; k < 3; k++) {
      const kx = COLS[k] + 70, yaw = .45, rest = [COLS[k] + 230, PY + 225]; let pose, pen = null, x = kx, y = KSIT;
      const nod = t >= T_DRAW0 && !frozen ? Math.round(Math.sin(Math.PI * 2 * (tq - T_DRAW0) / BT) * 2) / 2 * .06 : 0;
      const got = t >= TOSS[k] + .3, face = { eyes: 'half', brows: 'flat', mouth: k === 1 ? 'o' : 'smirk', head: .14 + nod };
      const aim = tp => { const sh = [kx + 26 * KK, KSIT - 78 * KK], ang = Math.round((Math.atan2(tp[0] - sh[0], tp[1] - sh[1]) - .3) / .12) * .12, hd = handR(yaw, ang);
        const back = [kx + hd[0] * KK, KSIT + (hd[1] + 40) * KK], d = Math.hypot(tp[0] - back[0], tp[1] - back[1]), m = Math.max(1, 80 / d);   // a pencil is at least 80 px
        return { ang, pen: { tip: tp, back: [tp[0] + (back[0] - tp[0]) * m, tp[1] + (back[1] - tp[1]) * m] } }; };
      if (t < T_DRAW0) pose = { ...POSES.sit, yaw, eyes: 'open', brows: 'up', mouth: 'smile', head: -.08 };
      else if (!frozen) { const tp = tips[k] || rest, A = aim([tp[0] + ((tq * 97) % 1 - .5) * 3, tp[1]]); pose = { ...POSES.sit, yaw, armR: A.ang, elbowR: 0, ...face }; pen = A.pen; }
      else if (t < T_KILL) { const A = aim(rest); pose = { ...POSES.sit, yaw: .25, armR: A.ang, elbowR: 0, eyes: 'wide', brows: 'up', mouth: 'o', head: -.26, shrug: 6 }; pen = A.pen; }
      else {
        const hopA = Math.abs(Math.sin(Math.PI * (t - T_KILL) / BT));
        if (k === 1) {   // Б jumps off her panel down to the margin and bounces there
          const u = seg(t, T_KILL, T_KILL + .42); x = lerp(kx, 330, u); y = lerp(KSIT, GROUND, u) - 150 * Math.sin(Math.PI * u) - (u >= 1 ? 22 * hopA : 0);
          pose = { ...EMOTIONS.delight, yaw: .3 };
        } else pose = k === 0 ? { ...POSES.sitClap, yaw: .3 } : { ...POSES.sit, yaw: .2, armL: 2.7, armR: 2.7, elbowL: -.1, elbowR: -.1, eyes: 'happy', brows: 'up', mouth: 'big' };
        if (k !== 1) y = KSIT - 6 * hopA;
        const u = seg(t, T_KILL, T_KILL + .35), A = aim(rest).pen, L = [COLS[k] + 120, CY1 - 8];   // pencils drop and lie on the column's bottom edge
        pen = { tip: [lerp(A.tip[0], L[0] - 60, u), lerp(A.tip[1], L[1], u * u)], back: [lerp(A.back[0], L[0] + 60, u), lerp(A.back[1], L[1] - 4, u * u)] };
      }
      if (t < .75 + k * .08) y = KSIT - 760 * (1 - seg(t, .4 + k * .08, .75 + k * .08)) ** 2;   // kids drop in onto their fresh panels
      kid(c, KIDS[k], { x, y: Math.round(y), k: KK, pose, spec: { prop: null } });
      if (pen) pencilTool(c, pen.tip, pen.back, got ? ORG : '#55595f');
    }

    // orange pencils tossed from the hero to the kids
    const h = hero(t), H = heroShapes({ x: h.x, y: GROUND, s: HS, t, run: h.run, face: h.face, jump: h.jump, eye: h.eye, armUp: h.armUp, shot: h.shot, gun: false });
    TOSS.forEach((s, k) => { const u = (t - s) / .3; if (u < 0 || u >= 1) return; const a = [h.x, GROUND - 110], z = [COLS[k] + 120, KSIT - 20];
      const x = lerp(a[0], z[0], u), y = lerp(a[1], z[1], u) - 160 * Math.sin(Math.PI * u), r = u * 9;
      pencilTool(c, [x + Math.cos(r) * 60, y + Math.sin(r) * 60], [x - Math.cos(r) * 60, y - Math.sin(r) * 60], ORG); });

    // falling page Б → into the hero's paws, carried into the door
    if (torn) {
      const hp = hold(H), ph = (CY1 - CY0) * PS / 2;
      let cx, cy, sc, rot;
      if (t < T_GRAB) { const u = (t - T_DROP) / (T_GRAB - T_DROP), e = u * u; cx = lerp(540, hp[0], e); cy = lerp((CY0 + CY1) / 2, hp[1] - ph, e) - 50 * Math.sin(Math.PI * u);
        sc = lerp(1, PS, ss(u)); rot = -.22 * Math.sin(Math.PI * u) + .06 * u; }
      else { cx = hp[0]; cy = hp[1] - ph; sc = PS; rot = .05 * Math.sin((t - T_GRAB) * 9) * Math.exp(-(t - T_GRAB) * 2); }
      c.save(); c.translate(cx, cy); c.rotate(rot); c.scale(sc, sc); pageB(c, bg, ox, t, { p: 1, eye: 'happy' }); c.restore();
    }

    // the door, drawn by itself in ballpoint on the margin
    const df = seg(t, T_GRAB, T_RUN0 + .2);
    if (df > 0) { const { x, y, w, h: dh } = DOOR, r = w / 2;
      const outl = cache.door ??= wob([x, y + dh, ...arc(x + r, y + r, r, Math.PI, 2 * Math.PI, 6), x + w, y + dh], rng(55), 1.5, 10);
      c.save(); c.globalAlpha = seg(df, .5, 1); c.beginPath(); c.moveTo(x, y + dh); c.arc(x + r, y + r, r, Math.PI, 2 * Math.PI); c.lineTo(x + w, y + dh); c.closePath();
      c.fillStyle = '#2a3270'; c.fill(); c.restore();
      penStroke(c, outl, df * 1.4, PEN, 6); penStroke(c, [x - 16, y + dh + 4, x + w + 16, y + dh + 2], df * 1.2 - .2, PEN, 5); }

    // the hero (drawn last: the most contrasting spot); during b0 he carries the stamp
    drawHero(c, H); heroPencil(c, H);
    if (t < T_HIT + .5) {
      const hp = hold(H), u = cl((t - .2) / (T_HIT - .2)), lift = seg(t, T_HIT + .05, T_HIT + .3);
      if (t < .2) stampTool(c, hp[0] + 10, hp[1] - 10, .7);
      else stampTool(c, lerp(hp[0] + 10, 540, ss(u)), lerp(hp[1] - 10, 470 + 60, u * u) - 180 * Math.sin(Math.PI * u) * (1 - u) - 760 * lift, lerp(.7, 1, u));
    }

    // the human's choice: a big system cursor slides in and clicks Б
    const cin = seg(t, b(7), T_KILL - .03), cout = seg(t, T_KILL + .45, T_KILL + .85);
    if (cin > 0 && cout < 1) {
      const tx = 545, ty = 455, sx = lerp(1180, tx, cin) + 400 * cout * cout, sy = lerp(1060, ty, cin) + 500 * cout * cout;
      const press = t >= T_KILL && t < T_KILL + .12 ? .88 : 1;
      const rp = (t - T_KILL) / .4; if (rp > 0 && rp < 1) for (const d of [0, .3]) { const q = rp - d; if (q <= 0) continue;
        c.save(); c.globalAlpha = 1 - q; c.strokeStyle = REDPEN; c.lineWidth = 5; c.beginPath(); c.arc(tx, ty, 14 + q * 90, 0, 6.283); c.stroke(); c.restore(); }
      cursor(c, sx, sy, 8.5 * press);
    }
    c.restore();
  },
};
// camera: still notebook, a slow push-in and a gentle drift after the hero on his final run
function cam(t) { return { s: 1 + .035 * ss(t / 6.667), dx: 40 * seg(t, T_RUN0, 6.2) }; }
