// L6_critics.js — level 6 «КРИТИКИ» (keyframe gate): Rorschach ink on cream paper + a red stamp. Mini-scene, no fight:
// b0–b1 the flipbook (L5 loot) fans open, its pages land on the wall as 4 keyframes; three symmetric ink blots with eyes (the critics,
// allies) appear and morph on strong beats; b2–b3 they scan the frames; b4 (1.667) they point at frame 3 — our hero is drawn without
// one leg — red FAIL stamp, the frame cracks and glitches; b5–b7 the frame comes down to an easel, the hero paints the missing leg back
// with an ink brush in three strokes on the beats, the frame heals; kill 3.333 re-check: the blots fold into one big check mark + OK
// seal; 4.167 the seal hops off, 4.583 the hero takes it in his paws and carries it to the exit (a white arch in a symmetric blot).
// Frame = pure function of t. Ink helpers + attribution: ./L6/ink.js.
import { heroShapes } from '../hero.js';
import { INKC, PAPER, HOLE, NH, rng, cl, sm, back, lerp, radii, lerpR, blotPts, path, drawBlot, checkPts, inkHero, makeFail, makeOk } from './L6/ink.js';

const BT = 60 / 144, FAIL = 4 * BT, KILL = 8 * BT, DROP = 10 * BT, GRAB = 11 * BT, DOOR_T = 6.0;
const STROKES = [5, 6, 7].map(b => b * BT), SDUR = .25, HEAL = 7 * BT + SDUR;   // brush strokes on b5 b6 b7
const GROUND = 842, DEF = 2, EASEL = { x: 640, y: 566, r: 0, sc: 1.35 }, CHECK = [540, 300];
const DOORX = 1180, DOOR_OPEN = { x: DOORX - 100, y: 572, w: 200, h: 270 };
const CARDS = [
  { x: 180, y: 532, r: -.05, pose: { eye: 'open' }, deco: 'sun' },
  { x: 420, y: 526, r: .04, pose: { run: 1, t: .12 }, deco: 'speed' },
  { x: 660, y: 534, r: -.02, pose: { eye: 'open' }, deco: 'none' },
  { x: 900, y: 528, r: .05, pose: { jump: 26, eye: 'happy' }, deco: 'stars' }];
const CRIT = [
  { x: 230, y: 292, rx: 100, ry: 78, seed: 11, lobes: [[.55, .18, 50], [1.5, .25, 22], [2.6, .3, 26]], eye: [36, -14, 21, 13], ph: 0 },
  { x: 540, y: 286, rx: 90, ry: 90, seed: 23, lobes: [[.25, .1, 78], [1.35, .32, 24], [2.75, .25, 32]], eye: [30, -6, 19, 15], ph: 2 },
  { x: 850, y: 294, rx: 116, ry: 70, seed: 37, lobes: [[1.0, .35, 50], [.12, .07, 56], [2.2, .3, 32]], eye: [40, -10, 23, 12], ph: 4 }];

// key shape k of critic c (perturbed lobes, cached: deterministic)
const VC = new Map();
function variant(i, k) {
  const key = i * 1000 + k; if (VC.has(key)) return VC.get(key);
  const c = CRIT[i], r = rng(c.seed * 977 + k * 31 + 5);
  const lobes = c.lobes.map(([a, w, amp]) => [a + (r() - .5) * .35, w * (.8 + .4 * r()), amp * (.6 + .8 * r())]);
  lobes.push([.4 + 2.3 * r(), .12 + .15 * r(), 12 + 26 * r()]);
  const R = radii({ rx: c.rx * (.92 + .16 * r()), ry: c.ry * (.92 + .16 * r()), lobes, seed: c.seed + k * 7, jag: 3.5 });
  VC.set(key, R); return R;
}
const DOOR_R = radii({ rx: 215, ry: 235, lobes: [[.42, .2, 60], [1.25, .3, 42], [2.3, .25, 30], [.05, .08, 30]], seed: 91, jag: 4 });
const SPLAT = [[-250, 600, radii({ rx: 55, ry: 40, lobes: [[.8, .3, 22], [2.2, .2, 14]], seed: 5 })],
               [1440, 250, radii({ rx: 48, ry: 36, lobes: [[.3, .15, 20], [1.7, .3, 12]], seed: 9 })]];

// card transform (world) at t
function cardXf(i, t) {
  const C = CARDS[i], stack = { x: 540 - 6 * i, y: 560 + 5 * i, r: -.06 + .03 * i, sc: .85 };
  const fan = sm(t / .35), p = back((t - .42 - .08 * (3 - i)) / .3);
  let x = lerp(stack.x, C.x, p), y = lerp(stack.y, C.y, p), r = lerp(stack.r - (3 - i) * .12 * fan * (1 - p), C.r, p), sc = lerp(stack.sc, 1, p);
  if (i === DEF && t >= FAIL) {
    sc *= 1 + .22 * back((t - FAIL) / .12);
    const e = sm((t - 1.85) / .25); x = lerp(x, EASEL.x, e); y = lerp(y, EASEL.y, e); r = lerp(r, EASEL.r, e); sc = lerp(sc, EASEL.sc, e);
  }
  return { x, y, r, sc };
}
const toW = (f, [lx, ly]) => { const c = Math.cos(f.r), s = Math.sin(f.r); return [f.x + (lx * c - ly * s) * f.sc, f.y + (lx * s + ly * c) * f.sc]; };
const miniHero = (i, legs) => heroShapes({ x: -10, y: 58, s: .3, t: CARDS[i].pose.t ?? .3, gun: false, ...CARDS[i].pose, legs });
// the defect: leg #1 of the hero in frame 3 (its polygon, local card coords)
const LEG = miniHero(DEF, [1, 1, 1, 1]).shapes.filter(s => s.role === 'leg')[1].pts;
const LY0 = Math.min(...LEG.map(p => p[1])), LY1 = Math.max(...LEG.map(p => p[1])), LX = LEG.reduce((a, p) => a + p[0], 0) / 4;
const painted = t => STROKES.reduce((a, s) => a + cl((t - s) / SDUR), 0) / 3;

function drawCardContent(x, i, t) {
  const C = CARDS[i];
  x.strokeStyle = INKC; x.lineWidth = 2; x.beginPath(); x.moveTo(-92, 58.5); x.bezierCurveTo(-40, 56, 30, 61, 92, 57.5); x.stroke();
  if (C.deco === 'sun') { x.beginPath(); x.arc(64, -42, 15, 0, 7); x.stroke(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(64 + Math.cos(a) * 20, -42 + Math.sin(a) * 20); x.lineTo(64 + Math.cos(a) * 27, -42 + Math.sin(a) * 27); x.stroke(); } }
  if (C.deco === 'speed') for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(-96, -10 + k * 16); x.lineTo(-74 + k * 4, -10 + k * 16); x.stroke(); }
  if (C.deco === 'stars') for (const [sx, sy] of [[-70, -50], [70, -38], [58, 20]]) { x.beginPath(); x.moveTo(sx - 7, sy); x.lineTo(sx + 7, sy); x.moveTo(sx, sy - 7); x.lineTo(sx, sy + 7); x.stroke(); }
  const fixed = i === DEF && t >= HEAL;
  inkHero(x, miniHero(i, i === DEF && !fixed ? [1, 0, 1, 1] : [1, 1, 1, 1]), 2.4);
  if (i === DEF && !fixed && t >= STROKES[0]) {   // the leg being painted back, top to bottom
    const f = painted(t); x.save(); x.beginPath(); x.rect(-120, LY0 - 3, 240, (LY1 - LY0 + 6) * f); x.clip();
    path(x, LEG); x.fillStyle = '#D87754'; x.fill(); x.strokeStyle = INKC; x.lineWidth = 2.4; x.stroke(); x.restore();
  }
}
function drawCard(ctx, i, t) {
  const f = cardXf(i, t), def = i === DEF, broken = def && t >= FAIL && t < HEAL;
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.r); ctx.scale(f.sc, f.sc);
  ctx.fillStyle = 'rgba(21,16,14,.16)'; ctx.fillRect(-101, -76, 210, 160);   // soft drop on the wall
  ctx.fillStyle = HOLE; ctx.fillRect(-105, -80, 210, 160);
  ctx.save(); ctx.beginPath(); ctx.rect(-105, -80, 210, 160); ctx.clip();
  if (broken) {   // glitch: horizontal slices of the frame slide, calming as the leg comes back
    const g = 1 - painted(t), q = Math.floor(t * 12);
    for (let b = 0; b < 6; b++) { const r = rng(q * 13 + b * 7 + 1); ctx.save(); ctx.beginPath(); ctx.rect(-105, -80 + b * 26.7, 210, 26.7); ctx.clip();
      ctx.translate((r() - .5) * 22 * (.25 + g), 0); drawCardContent(ctx, i, t); ctx.restore(); }
  } else drawCardContent(ctx, i, t);
  ctx.restore();
  ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(-105, -80, 210, 160); ctx.lineWidth = 1; ctx.strokeRect(-102.5, -77, 207, 155);
  ctx.fillStyle = INKC; ctx.beginPath(); ctx.arc(0, -86, 5, 0, 7); ctx.fill();   // pin
  if (broken) {
    const cr = [[34, -80], [20, -42], [36, -12], [12, 22], [28, 52], [10, 80]], n = 1 + Math.floor(cl((t - FAIL) / .1) * 5);
    ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.beginPath(); cr.slice(0, n + 1).forEach(([a, b], k) => k ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke();
    ctx.strokeStyle = HOLE; ctx.lineWidth = 1.2; ctx.beginPath(); cr.slice(0, n + 1).forEach(([a, b], k) => k ? ctx.lineTo(a + 3, b) : ctx.moveTo(a + 3, b)); ctx.stroke();
    // critic's red loop around the gap
    const lp = cl((t - FAIL - .05) / .14); ctx.strokeStyle = '#c8372d'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.ellipse(LX, (LY0 + LY1) / 2 + 2, 15, 19, .2, -1.2, -1.2 + lp * 6.9); ctx.stroke();
  }
  if (def && t >= HEAL && t < HEAL + .9) {   // fresh leg glows red for a moment
    ctx.globalAlpha = 1 - (t - HEAL) / .9; path(ctx, LEG); ctx.strokeStyle = '#c8372d'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (def && t >= FAIL && t < KILL + .05) {   // FAIL stamp slams on b4
    const s = 1 + 1.3 * (1 - cl((t - FAIL) / .07)); ctx.save(); ctx.globalAlpha = .93 * (1 - cl((t - 3.2) / .13));
    ctx.translate(-22, -50); ctx.rotate(-.12); ctx.scale(.42 * s, .42 * s); ctx.drawImage(S6.fail, -160, -70); ctx.restore();
  }
  ctx.restore();
  return f;
}

// critic look target (world)
function look(t) {
  if (t < .833) return [540, 540];
  if (t < FAIL) return [CARDS[Math.floor((t - .833) / (BT / 2)) % 4].x, 530];
  if (t < STROKES[0]) return toW(cardXf(DEF, t), [LX, LY0]);
  if (t < KILL) return brushTip(t);
  return [540, 560];
}
function critic(ctx, i, t, mp) {
  const c = CRIT[i], a = back((t - .15 - .12 * i) / .35); if (a <= 0) return null;
  const k = Math.floor(t / (2 * BT)), p = back((t - k * 2 * BT) / .2);
  const R = k > 0 ? lerpR(variant(i, k - 1), variant(i, k), p) : variant(i, 0);
  const pt = back((t - FAIL) / .18) * (1 - sm((t - 2.3) / .4));
  const aim = (tx, ty) => cl(Math.atan2(-(tx - c.x), ty - c.y), -.6, .6);
  let rot = 0;
  if (t >= .833 && t < FAIL) rot = .35 * aim(look(t)[0], 530);
  rot = lerp(rot, aim(CARDS[DEF].x, CARDS[DEF].y), pt);
  const add = th => pt * 80 * Math.exp(-(((th - Math.PI) / .13) ** 2));
  let pts = blotPts(c.x, c.y, R, { rot, sc: a, t, ph: c.ph, add });
  if (mp > 0) { const ck = checkPts(...CHECK); pts = pts.map(([x, y], j) => [lerp(x, ck[j][0], mp), lerp(y, ck[j][1], mp)]); }
  const cx = lerp(c.x, CHECK[0], mp), cy = lerp(c.y, CHECK[1], mp);
  if (mp <= 0) {   // capillary veins + satellite drops (mirrored)
    const r = rng(c.seed + 5), co = Math.cos(rot), si = Math.sin(rot), W = ([x, y]) => [c.x + (x * co - y * si) * a, c.y + (x * si + y * co) * a];
    ctx.strokeStyle = INKC; ctx.fillStyle = INKC; ctx.lineWidth = 1.4; const L = (5 + 16 * Math.sqrt(cl(t - .4))) ;
    for (let v = 0; v < 7; v++) { const j = Math.floor((.08 + .84 * r()) * (NH - 1)), th = j / (NH - 1) * Math.PI, j1 = r(), j2 = r();
      for (const m of [1, -1]) { ctx.beginPath(); for (let s = 0; s <= 3; s++) { const rr = R[j] - 2 + L * s / 3, w = (s ? (s % 2 ? j1 : j2) - .5 : 0) * .08;
        const P = W([m * Math.sin(th + w) * rr, -Math.cos(th + w) * rr]); s ? ctx.lineTo(...P) : ctx.moveTo(...P); } ctx.stroke(); } }
    for (let d = 0; d < 5; d++) { const j = Math.floor((.1 + .8 * r()) * (NH - 1)), th = j / (NH - 1) * Math.PI, off = 10 + 18 * r(), rad = 2.5 + 3.5 * r();
      for (const m of [1, -1]) { const P = W([m * Math.sin(th) * (R[j] + off), -Math.cos(th) * (R[j] + off)]); ctx.beginPath(); ctx.arc(P[0], P[1], rad * a, 0, 7); ctx.fill(); } }
  }
  drawBlot(ctx, pts, cx, cy);
  const ea = 1 - cl((t - 3.13) / .1);
  if (ea > 0) {   // eyes: paper holes in the ink, pupils follow the work
    const [ex, ey, ew, eh] = c.eye, sq = 1 - .5 * pt, [tx, ty] = look(t);
    ctx.save(); ctx.globalAlpha = ea; ctx.translate(c.x, c.y); ctx.rotate(rot); ctx.scale(a, a);
    for (const m of [1, -1]) {
      ctx.fillStyle = HOLE; ctx.beginPath(); ctx.ellipse(m * ex, ey, ew, eh * sq, m * .18, 0, 7); ctx.fill();
      const wx = c.x + m * ex, wy = c.y + ey; let dx = tx - wx, dy = ty - wy; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const lx = dx * Math.cos(-rot) - dy * Math.sin(-rot), ly = dx * Math.sin(-rot) + dy * Math.cos(-rot);
      ctx.fillStyle = INKC; ctx.beginPath(); ctx.arc(m * ex + lx * ew * .45, ey + ly * eh * sq * .4, Math.min(ew, eh * sq) * .62, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  return pts;
}

// hero
function heroX(t) {
  if (t < 1.8) return 230; if (t < 2.05) return lerp(230, 337, sm((t - 1.8) / .25));
  if (t < 4.2) return 337; if (t < 4.6) return lerp(337, 410, sm((t - 4.2) / .38));
  if (t < DOOR_T) return lerp(410, DOORX, (q => q * q * (2 - q) * .5 + q * .5)((t - 4.6) / 1.4));   // fast start, steady run
  return DOORX + (t - DOOR_T) * 260;
}
const heroAt = t => heroShapes({ x: heroX(t), y: GROUND, s: .6, t, gun: false,
  run: t >= 1.8 && t < 2.05 ? .6 : t >= 4.2 && t < 4.6 ? .5 : t >= 4.6 ? 1 : 0,
  eye: t < FAIL ? 'open' : t < 2.0 ? 'wide' : t < KILL - .05 ? 'squint' : t < 4.6 ? 'happy' : 'open',
  armUp: t >= GRAB - .12 ? .55 : 0 });
// brush tip (world): strokes run down the gap of frame 3, between strokes the brush lifts and dips
function brushTip(t) {
  const f = cardXf(DEF, t); let y = LY0, lift = 1;
  for (const s of STROKES) { if (t >= s - .17) { const q = cl((t - s) / SDUR); y = LY0 + (LY1 - LY0) * ((STROKES.indexOf(s) + q) / 3); lift = t < s ? (s - t) / .17 : t < s + SDUR ? 0 : cl((t - s - SDUR) / .1); } }
  const [x, yy] = toW(f, [LX, y]); return [x - 14 * lift, yy - 22 * lift];
}
function drawBrush(ctx, H, t) {
  const al = cl((t - 1.95) / .12) * (1 - cl((t - KILL) / .15)); if (al <= 0) return;
  const hand = H.u2s(221, 30), tip = brushTip(t), dx = tip[0] - hand[0], dy = tip[1] - hand[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'round';
  const at = d => [hand[0] + ux * d, hand[1] + uy * d];
  ctx.strokeStyle = INKC; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(...at(-22)); ctx.lineTo(...at(L - 34)); ctx.stroke();
  ctx.strokeStyle = '#c8372d'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(...at(L - 40)); ctx.lineTo(...at(L - 28)); ctx.stroke();
  const b = at(L - 28); ctx.fillStyle = INKC; ctx.beginPath(); ctx.moveTo(b[0] - uy * 10, b[1] + ux * 10); ctx.quadraticCurveTo(tip[0] - uy * 9, tip[1] + ux * 9, tip[0], tip[1]);
  ctx.quadraticCurveTo(tip[0] + uy * 9, tip[1] - ux * 9, b[0] + uy * 10, b[1] - ux * 10); ctx.fill();
  ctx.beginPath(); ctx.arc(tip[0] - ux * 5, tip[1] - uy * 5, 7, 0, 7); ctx.fill();   // ink drop at the tip
  ctx.restore();
}

// loupe in the front paw while the critics study the frames (b0–b4), handed over to the brush at the repair
function drawLoupe(ctx, H, t) {
  const al = 1 - cl((t - 1.9) / .1); if (al <= 0) return;
  const hand = H.u2s(221, 30), c = [hand[0] + 46, hand[1] - 62 + 3 * Math.sin(t * 4)];
  ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'round'; ctx.strokeStyle = INKC;
  ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(...hand); ctx.lineTo(c[0] - 22, c[1] + 28); ctx.stroke();
  ctx.fillStyle = 'rgba(248,242,227,.55)'; ctx.beginPath(); ctx.arc(c[0], c[1], 34, 0, 7); ctx.fill();
  ctx.lineWidth = 8; ctx.stroke();
  ctx.strokeStyle = 'rgba(21,16,14,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c[0], c[1], 22, 3.6, 4.6); ctx.stroke();   // glint
  ctx.restore();
}
// OK seal: on the card from kill, hops off at lootDrop, taken at lootGrab, carried in the paws
function sealAt(t, H) {
  const f = cardXf(DEF, t), onCard = { p: toW(f, [66, -40]), sc: .55 * f.sc, r: .14 }, ground = { p: [640, GROUND - 62], sc: .74, r: -.1 };
  const hold = { p: H.u2s(250, -40), sc: .95, r: .05 };
  if (t < KILL) return null;
  if (t < DROP) return { ...onCard, sc: onCard.sc * (1 + 1.4 * (1 - cl((t - KILL) / .07))) };
  if (t < DROP + .28) { const q = (t - DROP) / .28; return { p: [lerp(onCard.p[0], ground.p[0], q), lerp(onCard.p[1], ground.p[1], q * q) - 90 * Math.sin(q * Math.PI)], sc: lerp(onCard.sc, ground.sc, q), r: lerp(.14, -.1 + 6.28, q) }; }
  if (t < GRAB) return ground;
  const q = sm((t - GRAB) / .1); return { p: [lerp(ground.p[0], hold.p[0], q), lerp(ground.p[1], hold.p[1], q)], sc: lerp(ground.sc, hold.sc, q), r: lerp(-.1, hold.r, q) };
}

function drawDoor(ctx, t) {
  const g = back((t - 4.3) / .35); if (g <= 0) return;
  const cx = DOORX, cy = GROUND - 200, pts = blotPts(cx, cy, DOOR_R, { sc: g, t, ph: 1 });
  drawBlot(ctx, pts, cx, cy);
  ctx.save(); ctx.translate(cx, GROUND); ctx.scale(g, g); ctx.translate(-cx, -GROUND);
  const { x, y, w, h } = DOOR_OPEN; ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, GROUND); ctx.closePath();
  ctx.fillStyle = HOLE; ctx.fill(); ctx.restore();
}

const S6 = {};
export default {
  async init(S) {
    S6.fail = makeFail(); S6.ok = makeOk();
    const PW = S.W + 420, c = document.createElement('canvas'); c.width = PW; c.height = S.H; const x = c.getContext('2d');
    x.fillStyle = PAPER; x.fillRect(0, 0, PW, S.H);
    const r = rng(606);
    for (let i = 0; i < 40; i++) { const gx = r() * PW, gy = r() * S.H, gr = 80 + 260 * r(), gg = x.createRadialGradient(gx, gy, 0, gx, gy, gr);
      gg.addColorStop(0, `rgba(${r() < .5 ? '120,95,60' : '255,250,235'},.05)`); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(gx - gr, gy - gr, 2 * gr, 2 * gr); }
    const im = x.getImageData(0, 0, PW, S.H), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n * .9; }
    x.putImageData(im, 0, 0); S6.paper = c;
    const v = document.createElement('canvas'); v.width = S.W; v.height = S.H; const vx = v.getContext('2d');
    const vg = vx.createRadialGradient(S.W / 2, S.H / 2, S.H * .35, S.W / 2, S.H / 2, S.W * .75); vg.addColorStop(0, 'rgba(60,40,20,0)'); vg.addColorStop(1, 'rgba(60,40,20,.22)');
    vx.fillStyle = vg; vx.fillRect(0, 0, S.W, S.H); S6.vig = v;
  },
  draw(ctx, t, S) {
    const off = (S.W - 1080) / 2, cam = sm((t - 4.5) / 1.5) * 300;
    ctx.drawImage(S6.paper, -cam - 60, 0);
    ctx.save(); ctx.translate(off - cam, 0);
    for (const [x, y, R] of SPLAT) drawBlot(ctx, blotPts(x, y, R, { t, ph: x }), x, y);
    ctx.strokeStyle = INKC; ctx.lineWidth = 4; ctx.beginPath();
    for (let x = -700; x <= 2400; x += 30) { const y = GROUND + 1.6 * Math.sin(x * .05) + .9 * Math.sin(x * .13); x > -700 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    drawDoor(ctx, t);
    if (t < .45) { ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.globalAlpha = 1 - cl((t - .3) / .15);   // flipbook rings
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(540 - 100, 500 + k * 32, 9, 6, 0, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; }
    const order = t < .42 ? [3, 2, 1, 0] : [0, 1, 3, 2];
    for (const i of order) drawCard(ctx, i, t);
    const mp = t < 3.13 ? 0 : back((t - 3.13) / (KILL - 3.13));
    if (t >= KILL + .25) { const ck = checkPts(...CHECK); drawBlot(ctx, ck, ...CHECK); }
    else for (let i = 0; i < 3; i++) critic(ctx, i, t, mp);
    const H = heroAt(t);
    inkHero(ctx, H, 4.5);
    drawLoupe(ctx, H, t);
    drawBrush(ctx, H, t);
    const sl = sealAt(t, H);
    if (sl) { ctx.save(); ctx.translate(...sl.p); ctx.rotate(sl.r); ctx.scale(sl.sc, sl.sc); ctx.drawImage(S6.ok, -85, -85); ctx.restore(); }
    ctx.restore();
    ctx.drawImage(S6.vig, 0, 0);
  },
  door(t, S) { const off = (S.W - 1080) / 2, cam = sm((t - 4.5) / 1.5) * 300; return { x: DOOR_OPEN.x - cam + off, y: DOOR_OPEN.y, w: DOOR_OPEN.w, h: DOOR_OPEN.h }; },
  bossHp: () => null,
  events: [{ t: .42, k: 'whoosh' }, { t: FAIL, k: 'fail' }, ...STROKES.map(t => ({ t, k: 'whoosh' })), { t: KILL, k: 'ok' }, { t: KILL, k: 'kill' },
    { t: DROP, k: 'jump' }, { t: GRAB, k: 'loot' }, { t: DOOR_T, k: 'door' }],
};
