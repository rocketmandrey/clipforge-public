// L5 АНИМАТИК (SHOWREEL.md): crayon-on-paper mini scene in the doodle_story technique (levels/L5/crayon.js).
// b0–b1 the storyboard scroll (L4 loot) unrolls into a long film strip of crayon cards as the hero runs along it;
// b2–b5 three ЗЕВАКИ (black boredom cards: sleepy eyes, yawns) sit in the strip — the hero snips each one out with big crayon
// scissors on the beats, the cut card drops away and the strip closes up; kill 2.5 = the last snip, crayon star;
// the good cards fold into a flipbook that falls into the hero's raised paw (lootGrab 3.333); he carries it to a crayon door.
// Frame = pure function of t. World x scrolls with a camera; everything else is screen px (y shared).
import { heroShapes, ORG, INK, RED } from '../hero.js';
import { PAL, BOIL, hash, clamp, lerp, ease, ell, rrect, init as initCrayon, crayon, marker, part, resample, jitter, path, paperTile } from './L5/crayon.js';

const P = 228, CW = 214, CH = 308, HOLES = [3, 4, 5], NC = 9, GROUND = 800, SY = 610;   // slot pitch, card size, strip centre y
const GOOD = [0, 1, 2, 6, 7, 8], MOTIF = { 0: 4, 1: 0, 2: 1, 6: 2, 7: 3, 8: 4 };
const CUTS = [[1.042, 1.25], [1.667, 1.875], [2.292, 2.5]];   // two snips per boredom card (left edge, right edge), on the beat grid
const CLOSE = .2, FOLD0 = 2.7, DROP = 2.917, GRAB = 3.333, RUN0 = 3.4, DIN = 4.333;
const DX = 1450, DY = 470, DW = 220, DH = GROUND - 470;    // door opening (world x)
const C0 = [540, SY];                                        // canonical on-screen centre a slot is drawn at, then transformed
const outQ = p => 1 - (1 - clamp(p)) ** 2;

// ---- clocks ----
const closeE = (h, t) => clamp((t - CUTS[h][1]) / CLOSE);            // gap closing after card h is cut
const slotX = (i, t) => { let x = i * P; HOLES.forEach((hi, h) => { if (hi < i) x -= P * ease(closeE(h, t)); }); return x; };   // card left edge
const stripEnd = t => slotX(NC - 1, t) + CW + 7;
const unroll = t => 60 + (stripEnd(0) - 60) * outQ(t / .95);
function heroX(t) {
  if (t < .833) return -150 + 604 * outQ(t / .833);
  if (t < RUN0) { let b = 0, st = 0; for (const [a, c] of CUTS) { b += Math.max(0, 1 - Math.abs(t - a) / .1) + Math.max(0, 1 - Math.abs(t - c) / .1);
    st += ease((t - a - .05) / .15) - ease((t - c - .02) / .2); }   // steps along the card for the second snip, back after it drops
    return 454 + 10 * b + 120 * st; }
  if (t < DIN) { const p = (t - RUN0) / (DIN - RUN0), a = .3, q = p < a ? p * p / (2 * a) : p - a / 2; return 454 + 986 * q / (1 - a / 2); }
  const v = 986 / (DIN - RUN0) / (1 - .15), tau = Math.min(t - DIN, 2 * 120 / v); return 1440 + v * tau - v * v / 480 * tau * tau;
}
function camX(t) {
  if (t < .833) return heroX(t) - 170;
  if (t < RUN0) return 284;
  return 284 + 736 * ease((t - RUN0) / (DIN - RUN0));
}
function heroPose(t, sx) {
  const fight = t >= .833 && t < RUN0, running = !fight;
  const o = { x: sx, y: GROUND, s: .6, t, run: running ? 1 : 0, face: 1, gun: false, eye: t < .833 ? 'open' : t < 2.5 ? 'squint' : 'happy',
    armUp: t < 3.15 ? 0 : ease((t - 3.15) / (GRAB - 3.15)) };
  if (t > DIN) o.run = clamp(1 - (t - DIN) / .25);
  if (t >= 2.5 && t < 2.85) o.jump = Math.sin(Math.PI * (t - 2.5) / .35) * 34;   // happy hop on the climax
  return heroShapes(o);
}
// scissors target: left edge of the slot under the cut, then its right edge
const SLOT = 3 * P;
function snipTarget(t) {
  for (let h = 0; h < 3; h++) { const [a, b] = CUTS[h]; if (t < a + .05) return [SLOT - 4, SY + 30, h];
    if (t < b + .05) return [lerp(SLOT - 4, SLOT + CW + 4, ease((t - a - .05) / .15)), SY + 30, h]; }
  return [SLOT - 4, SY + 30, 3];
}
const snipClose = t => { let c = 0; for (const cut of CUTS) for (const s of cut) { const d = t - s; if (d > -.06 && d < .2) c = Math.max(c, d < 0 ? 1 + d / .06 : 1 - d / .2); } return clamp(c); };

// ---- drawing helpers ----
const loc = (pts, dx = 0, dy = 0) => pts.map(([x, y]) => [x + C0[0] + dx, y + C0[1] + dy]);
function rails(g, key, step, a) {
  for (const y of [-182, 154]) part(g, { d: loc(rrect(-114, y, 228, 28, 3)), c: true, f: '#2b2622', w: 0, a, amp: 1 }, key + y, step, 1e9);
  g.globalAlpha = .9 * a; g.fillStyle = PAL.cream;
  for (const y of [-174, 162]) for (let j = 0; j < 6; j++) g.fillRect(C0[0] - 102 + j * 38 + (hash(key, j, y, step) - .5) * 1.5, C0[1] + y, 16, 12);
  g.globalAlpha = 1;
}
function motif(type) {
  const L = [];
  if (type === 0) { L.push({ d: loc(ell(0, 150, 130, 95, Math.PI, Math.PI * 2, 24)), c: true, f: PAL.green },
    { d: loc(ell(-36, -60, 34)), c: true, f: PAL.yellow }, ...[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * 6.28; return { d: loc([[-36 + Math.cos(a) * 46, -60 + Math.sin(a) * 46], [-36 + Math.cos(a) * 62, -60 + Math.sin(a) * 62]]), w: 3 }; })); }
  if (type === 1) L.push({ d: loc([[-60, -10], [60, -10], [60, 110], [-60, 110]]), c: true, f: PAL.pink }, { d: loc([[-78, -8], [0, -84], [78, -8]]), c: true, f: PAL.red },
    { d: loc([[-16, 110], [-16, 54], [16, 54], [16, 110]]), c: true, f: PAL.brown, w: 3 });
  if (type === 2) L.push({ d: loc([[-14, 120], [-12, 10], [12, 10], [14, 120]]), c: true, f: PAL.brown }, { d: loc(ell(0, -30, 70, 62)), c: true, f: PAL.green },
    { d: loc([[-100, 120], [100, 120]]), w: 3 });
  if (type === 3) L.push({ d: loc([[-70, 30], [70, 30], [46, 70], [-46, 70]]), c: true, f: PAL.red }, { d: loc([[0, 28], [0, -90], [58, 10]]), c: true, f: PAL.white, w: 3.4 },
    ...[0, 1].map(k => ({ d: loc(Array.from({ length: 21 }, (_, n) => [-96 + n * 9.6, 92 + k * 26 + Math.sin(n * .9 + k) * 6])), w: 3, ink: PAL.blue })));
  if (type === 4) L.push(   // the hero himself in the storyboard: a tiny crayon Clawd
    ...[-52, -28, 28, 52].map(u => ({ d: loc([[u - 6, 34], [u + 6, 34], [u + 6, 66], [u - 6, 66]]), c: true, f: ORG, w: 2.6 })),
    { d: loc([[-78, -30], [78, -30], [78, 40], [-78, 40]]), c: true, f: ORG }, { d: loc([[-80, -32], [80, -32], [80, -18], [-80, -18]]), c: true, f: RED, w: 2.6 },
    { d: loc([[-46, -8], [-34, -8], [-34, 16], [-46, 16]]), c: true, f: INK, w: 0 }, { d: loc([[30, -8], [42, -8], [42, 16], [30, 16]]), c: true, f: INK, w: 0 },
    { d: loc(Array.from({ length: 8 }, (_, n) => [-80 - n * 9, -26 + n * 3 + Math.sin(n) * 3])), w: 4, ink: RED });
  return L;
}
function goodCard(g, i, step, a) {
  rails(g, i * 10, step, a);
  part(g, { d: loc(rrect(-107, -154, CW, CH, 14)), c: true, f: PAL.white, w: 4 }, i * 10 + 1, step, 1e9);
  motif(MOTIF[i]).forEach((p, k) => part(g, p, i * 10 + 2 + k * 37, step, 1e9));
}
// a ЗЕВАКА: black crayon card, sleepy slit eyes, a yawn, floating z's
function holeCard(g, h, t, step, withRails = true) {
  if (withRails) rails(g, 900 + h * 10, step, 1);
  part(g, { d: loc(rrect(-107, -154, CW, CH, 14)), c: true, w: 3, ink: PAL.gray }, 901 + h * 10, step, 1e9);
  part(g, { d: loc(rrect(-98, -146, 196, 292, 30)), c: true, f: PAL.black, w: 5, ink: PAL.black, amp: 3 }, 902 + h * 10, step, 1e9);
  part(g, { d: loc(rrect(-98, -146, 196, 292, 30)), c: true, f: PAL.black, w: 0, amp: 4 }, 903 + h * 10, step, 1e9);   // second wax pass: deep black
  const ph = t / 1.3 + h * .37, yawn = Math.max(0, Math.sin(ph * 6.283)) ** 2, open = (.32 + .1 * Math.sin(t * 2.1 + h)) * (1 - .85 * yawn);
  for (const ex of [-46, 46]) {   // eye: heavy flat lid over a cream lens, open fraction `open`
    const lens = [...ell(ex, -62, 30, 24 * open + 2, 0, Math.PI, 12), [ex - 30, -62]];
    part(g, { d: loc(lens), c: true, f: PAL.cream, w: 0, amp: .8 }, 910 + h * 10 + ex, step, 1e9);
    part(g, { d: loc([[ex - 34, -64 + 2 * yawn], [ex + 34, -64 - 2 * yawn]]), w: 5, ink: PAL.cream, amp: .8 }, 911 + h * 10 + ex, step, 1e9);
    if (open > .12) part(g, { d: loc(ell(ex + 4, -62 + 10 * open, 6, 6 * Math.min(1, open * 2.5), 0, 6.3, 10)), c: true, f: PAL.black, w: 0, amp: .5 }, 912 + h * 10 + ex, step, 1e9);
  }
  const mw = 26 + 22 * yawn, mh = 6 + 56 * yawn;
  part(g, { d: loc(ell(0, 40 + mh * .3, mw, mh, 0, 6.3, 24)), c: true, f: '#7a1e22', w: 4, ink: PAL.cream, amp: 1.2 }, 920 + h * 10, step, 1e9);
  for (let k = 0; k < 2; k++) {   // z's float up from the yawn
    const q = (t * .8 + h * .31 + k * .5) % 1, s = 10 + 12 * q, zx = 40 + 30 * q, zy = -100 - 60 * q;
    if (q < .85) part(g, { d: loc([[zx - s, zy - s], [zx + s, zy - s], [zx - s, zy + s], [zx + s, zy + s]]), w: 3.4, ink: PAL.cream, a: Math.sin(q / .85 * Math.PI), amp: .8 }, 930 + h * 10 + k, step, 1e9);
  }
}
function scissors(g, hand, tip, closeAmt, key, step) {
  const dx = tip[0] - hand[0], dy = tip[1] - hand[1], L = Math.hypot(dx, dy), a = Math.atan2(dy, dx), op = .42 * (1 - closeAmt);
  const piv = [hand[0] + Math.cos(a) * 34, hand[1] + Math.sin(a) * 34], bl = clamp(L - 20, 165, 230);
  for (const sg of [-1, 1]) {
    const b = a + sg * op / 2, ux = Math.cos(b), uy = Math.sin(b), nx = -uy, ny = ux;
    const blade = [[piv[0] + nx * 22, piv[1] + ny * 22], [piv[0] + ux * bl * .55 + nx * 14, piv[1] + uy * bl * .55 + ny * 14], [piv[0] + ux * bl, piv[1] + uy * bl], [piv[0] - nx * 9, piv[1] - ny * 9]];
    part(g, { d: blade, c: true, f: '#dfe4ec', w: 3.6, amp: 1 }, key + sg, step, 1e9);
    const hb = a + Math.PI - sg * op / 2, hc = [piv[0] + Math.cos(hb) * 34, piv[1] + Math.sin(hb) * 40];
    part(g, { d: ell(hc[0], hc[1], 26, 18, 0, 6.3, 16), c: true, f: PAL.red, w: 3.6, amp: 1 }, key + 5 + sg, step, 1e9);
  }
  part(g, { d: ell(piv[0], piv[1], 5, 5, 0, 6.3, 8), c: true, f: PAL.ink, w: 0 }, key + 9, step, 1e9);
}
function star(g, x, y, r, a, key, step) {
  const pts = Array.from({ length: 11 }, (_, i) => { const q = i / 10 * 6.283 - Math.PI / 2, R = i % 2 ? r * .45 : r; return [x + Math.cos(q) * R, y + Math.sin(q) * R]; });
  part(g, { d: pts, c: true, f: PAL.yellow, w: 5, a }, key, step, 1e9);
}

// flipbook pose (centre, scale, tilt) at t: hangs in the air while the pages fold in, falls, then rides in the raised paw
function bookHold(t, sxH) {
  const H = heroPose(t, sxH), arm = H.shapes.find(s => s.role === 'arm').pts, ax = arm.reduce((s, p) => s + p[0], 0) / 4, ay = Math.min(...arm.map(p => p[1]));
  return [ax + 44, ay + 14 - CH * .7 / 2];
}
function bookPose(t, toS) {
  const hold = bookHold(Math.max(t, GRAB), toS(heroX(Math.max(t, GRAB))));
  if (t >= GRAB) return { x: hold[0], y: hold[1], r: Math.sin(t * 9) * .03 };
  const apex = [hold[0], 330]; if (t < DROP) return { x: apex[0], y: apex[1], r: 0 };
  const p = (t - DROP) / (GRAB - DROP); return { x: apex[0], y: lerp(apex[1], hold[1], p * p), r: -.05 * p };
}

const L = {
  async init(S) { initCrayon(S.W, S.H); },
  draw(g, t, S) {
    const { W, H } = S, ox = (W - 1080) / 2, cam = camX(t), toS = x => x - cam + ox, step = Math.floor(t * BOIL);
    initCrayon(W, H);
    // paper, world-anchored tooth
    const pat = g.createPattern(paperTile, 'repeat'); pat.setTransform(new DOMMatrix().translate(-cam, 0));
    g.fillStyle = pat; g.fillRect(0, 0, W, H);
    // ground: marker line in world segments (jitter keyed by segment, so it does not crawl with the camera)
    for (let s = Math.floor((cam - ox) / 400) - 1, e = s + Math.ceil(W / 400) + 2; s < e; s++) {
      const x0 = toS(s * 400);
      part(g, { d: [[x0 - 4, GROUND + 2], [x0 + 404, GROUND + 2]], w: 4.5 }, 3000 + s, step, W);
      [0, 1, 2].forEach(k => part(g, { d: [[x0 + 40 + k * 90 * hash(s, k), GROUND + 16 + k * 10], [x0 + 200 + k * 50 + 120 * hash(s, k, 2), GROUND + 16 + k * 10]], w: 1.6, ink: PAL.gray }, 3100 + s * 3 + k, step, W));
    }
    // sky doodles on the paper above the strip (half-speed parallax): scribbled sun, clouds
    const sky = x => x - cam * .5 + ox;
    { const sx = sky(760), sy = 290; part(g, { d: ell(sx, sy, 52), c: true, f: PAL.yellow, w: 4 }, 3500, step, W);
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + .3; part(g, { d: [[sx + Math.cos(a) * 68, sy + Math.sin(a) * 68], [sx + Math.cos(a) * 92, sy + Math.sin(a) * 92]], w: 4 }, 3510 + k, step, W); } }
    for (let c = 0; c < 4; c++) { const cx = sky(-200 + c * 640 + 120 * hash(c, 1)), cy = 200 + 90 * hash(c, 2), d = [];
      for (let k = 0; k < 5; k++) d.push(...ell(cx - 80 + k * 40, cy - (k % 2 ? 26 : 14), 34, 30, Math.PI, Math.PI * 2, 8));
      part(g, { d: [...d, [cx + 114, cy + 16], [cx - 114, cy + 16]], c: true, f: c % 2 ? PAL.lblue : PAL.white, w: 3.6 }, 3600 + c, step, W); }
    // crayon door: outline draws itself 3.25–3.6, leaf colours 3.45–3.75, swings open 3.85–4.2
    if (t > 3.25) {
      const dx = toS(DX), rv = clamp((t - 3.25) / .35), fill = clamp((t - 3.45) / .3), o = ease((t - 3.85) / .35);
      if (o > 0) part(g, { d: [[dx, DY], [dx + DW, DY], [dx + DW, GROUND], [dx, GROUND]], c: true, f: PAL.navy, w: 0 }, 4000, step, W);
      const lw = DW * (1 - .82 * o), leaf = [[dx, DY], [dx + lw, DY - 14 * o], [dx + lw, GROUND + 6 * o], [dx, GROUND]];
      if (fill > 0) {
        part(g, { d: leaf, c: true, f: PAL.lblue, w: 3, ink: PAL.blue, a: fill }, 4001, step, W);
        g.save(); path(g, leaf); g.closePath(); g.clip();
        for (let k = 0; k < 14; k++) { const y0 = DY - 60 + k * 30; marker(g, jitter(resample([[dx - 10, y0 + 60], [dx + lw + 10, y0]], false, 12), 4010 + k, step, 1.4), PAL.blue, 2.2, 4010 + k, fill * .8); }
        g.restore();
        part(g, { d: ell(dx + lw - 24, SY + 40, 10, 10, 0, 6.3, 12), c: true, f: PAL.yellow, w: 3, a: fill }, 4002, step, W);
      }
      const frame = resample([[dx - 14, GROUND], [dx - 14, DY - 14], [dx + DW + 14, DY - 14], [dx + DW + 14, GROUND]], false, 6), n = Math.max(2, Math.round(frame.length * rv));
      marker(g, jitter(frame.slice(0, n), 4003, step, 2), PAL.blue, 7, 4003);
    }
    // the strip: cards in layout until FOLD0, then each good card flies into the flipbook stack
    const rollX = Math.min(unroll(t), stripEnd(t)), fold = k => ease((t - FOLD0 - k * .012) / .15);
    g.save(); if (t < 1) { g.beginPath(); g.rect(0, 0, Math.max(0, toS(rollX)), H); g.clip(); }
    const bk = bookPose(t, toS);
    GOOD.slice().reverse().forEach((i, j) => {   // back pages first: card 0 is the cover
      const k = GOOD.length - 1 - j, f = t < FOLD0 ? 0 : fold(k), lx = toS(slotX(i, Math.min(t, FOLD0)) + CW / 2);
      const sc = lerp(1, .7, f), x = lerp(lx, bk.x + k * 5, f), y = lerp(SY, bk.y - k * 5, f), r = lerp(0, bk.r, f) + Math.sin(f * Math.PI) * (k % 2 ? .25 : -.25);
      if (f === 0 && (x < -150 || x > W + 150)) return;
      g.save(); g.translate(x, y); g.rotate(r); g.scale(sc, sc); g.translate(-C0[0], -C0[1]);
      if (t < FOLD0 || f < 1) rails(g, i * 10, step, 1 - f);
      g.restore(); g.save(); g.translate(x, y); g.rotate(r); g.scale(sc, sc); g.translate(-C0[0], -C0[1]);
      part(g, { d: loc(rrect(-107, -154, CW, CH, 14)), c: true, f: PAL.white, w: 4 / Math.max(sc, .7) }, i * 10 + 1, step, 1e9);
      motif(MOTIF[i]).forEach((p, m) => part(g, p, i * 10 + 2 + m * 37, step, 1e9));
      g.restore();
    });
    // flipbook binding once stacked
    if (t >= FOLD0 + .14) { const a = clamp((t - FOLD0 - .14) / .08);
      g.save(); g.translate(bk.x, bk.y); g.rotate(bk.r);
      part(g, { d: [[-CW * .35 - 2, -CH * .35 + 4], [-CW * .35 - 2, CH * .35 - 4]], w: 9, ink: PAL.ink, a }, 4100, step, 1e9);
      for (let k = 0; k < 5; k++) part(g, { d: ell(-CW * .35 - 2, -CH * .28 + k * CH * .14, 7, 5, 0, 6.3, 10), w: 3, ink: PAL.gray, a }, 4101 + k, step, 1e9);
      g.restore(); }
    // boredom cards still in the strip
    HOLES.forEach((hi, h) => { if (t >= CUTS[h][1]) return; const x = toS(slotX(hi, t) + CW / 2); if (x < -150 || x > W + 150) return;
      g.save(); g.translate(x - C0[0], 0); holeCard(g, h, t, step); g.restore(); });
    g.restore();
    // cut lines: after the first snip, a jagged crayon cut through the strip at the card's left edge
    for (let h = 0; h < 3; h++) { const [a, b] = CUTS[h]; if (t < a || t >= b) continue; const x = toS(SLOT - 7);
      marker(g, jitter(resample(Array.from({ length: 12 }, (_, n) => [x + (n % 2 ? 5 : -5), 420 + n * 34.5]), false, 8), 4200 + h, step, 1), PAL.ink, 3, 4200 + h); }
    // the scroll roll (unrolling front, then the strip's end; folds away with the cards)
    const ra = t < FOLD0 ? 1 : clamp(1 - (t - FOLD0) / .12);
    if (ra > 0) { const rx = toS(rollX), r = 14 + 58 * Math.sqrt(1 - outQ(t / .95));
      part(g, { d: [[rx - r, 420], [rx + r, 420], [rx + r, GROUND], [rx - r, GROUND]], c: true, f: '#e9dcc0', w: 4, a: ra }, 4300, step, W);
      part(g, { d: [[rx + r * .45, 430], [rx + r * .45, GROUND - 10]], w: 2, ink: PAL.gray, a: ra }, 4301, step, W);
      part(g, { d: ell(rx, 420, r, r * .32, 0, 6.3, 24), c: true, f: PAL.cream, w: 4, a: ra }, 4302, step, W);
      part(g, { d: Array.from({ length: 30 }, (_, n) => { const q = n / 29 * 6.283 * 2.2; return [rx + Math.cos(q) * r * (1 - n / 34), 420 + Math.sin(q) * r * .32 * (1 - n / 34)]; }), w: 2.4, a: ra }, 4303, step, W); }
    // cut ЗЕВАКИ drop away, still yawning
    HOLES.forEach((hi, h) => { const tau = t - CUTS[h][1]; if (tau < 0 || tau > .5) return;
      const x = toS(SLOT + CW / 2), s = 1 - .5 * tau / .5;
      g.save(); g.globalAlpha = 1; g.translate(x, SY + 900 * tau * tau); g.rotate(1.6 * tau * (h % 2 ? -1 : 1)); g.scale(s, s); g.translate(-C0[0], -C0[1]);
      g.globalAlpha = clamp(1 - tau / .5); holeCard(g, h, t, step, false); g.restore(); g.globalAlpha = 1; });
    // climax star where the strip closed
    if (t >= 2.5 && t < 3.1) { const p = (t - 2.5) / .6, pop = Math.min(1, (t - 2.5) / .12), r = 70 * (pop + .25 * Math.sin(Math.min(1, pop) * Math.PI));
      const sx = toS(SLOT), sy = SY - 30 - 60 * p; star(g, sx, sy, r, clamp((1 - p) * 1.6), 4400, step);
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + .2, r0 = r * 1.2 + 120 * p, r1 = r0 + 30;
        part(g, { d: [[sx + Math.cos(a) * r0, sy + Math.sin(a) * r0], [sx + Math.cos(a) * r1, sy + Math.sin(a) * r1]], w: 4, ink: PAL.yellow, a: clamp(1 - p * 1.4) }, 4410 + k, step, W); } }
    // hero (+ scissors in the front paw until he tosses them on the climax)
    const sxH = toS(heroX(t)), Hs = heroPose(t, sxH), FILL = { arm: ORG, leg: ORG, body: ORG, eye: INK, band: RED, tail: RED };
    const hand = Hs.u2s(214, 30), tossT = 2.6, [tx, ty] = snipTarget(t);
    const tossed = t >= tossT ? (() => { const tau = t - tossT, h0 = heroPose(tossT, toS(heroX(tossT))).u2s(214, 30), land = Math.min(tau, .55);
      return { p: [h0[0] + 520 * land - (cam - camX(tossT)), Math.min(GROUND - 8, h0[1] - 700 * land + 1600 * land * land)], a: land / .55 * 4 * Math.PI }; })() : null;
    if (tossed) { const { p, a } = tossed; scissors(g, p, [p[0] + Math.cos(a) * 170, p[1] + Math.sin(a) * 170], 0, 4500, step); }   // two spins, lands flat
    Hs.shapes.forEach((s, k) => part(g, { d: s.pts, c: true, f: FILL[s.role], w: s.role === 'eye' ? 3 : 3.6, amp: s.role === 'eye' ? .5 : 1.1 }, 5000 + k, step, W));
    if (!tossed && t >= .5) scissors(g, hand, [toS(tx), ty], snipClose(t), 4500, step);
    // snip bursts
    for (const cut of CUTS) for (const s of cut) { const d = t - s; if (d < 0 || d > .2) continue; const [bx, by] = snipTarget(s - .001).map((v, i) => i ? v : toS(v));
      for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283, r0 = 16 + 140 * d, r1 = r0 + 22;
        part(g, { d: [[bx + Math.cos(a) * r0, by + Math.sin(a) * r0], [bx + Math.cos(a) * r1, by + Math.sin(a) * r1]], w: 4, ink: PAL.red, a: 1 - d / .2 }, 4600 + k, step, W); } }
  },
  door(t, S) { const ox = (S.W - 1080) / 2; return { x: DX - camX(t) + ox, y: DY, w: DW, h: DH }; },
  bossHp() { return null; },
  events: [{ t: .05, k: 'whoosh' }, ...CUTS.flat().map(s => ({ t: s, k: s === 2.5 ? 'kill' : 'click' })), { t: FOLD0, k: 'whoosh' }, { t: GRAB, k: 'loot' }, { t: DIN, k: 'door' }],
};
export default L;
