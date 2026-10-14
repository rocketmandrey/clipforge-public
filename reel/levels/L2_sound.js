// L2 «ЗВУК» (audio truth), riso «answer» look (kit: levels/L2/riso.js + util.js, the clipforge riso kit).
// Story (mini-scene): the TRACK cassette flies in, its tape unspools into a riso wave; the wave swells into КАША (mixed sound, a muddy
// blob of all inks). The hero is the editor: each beam slice on a beat peels one coloured film off it (drums m, bass c, vocal y, guitar c+y). On seg.kill the blob bursts, the
// 4 films lie as parallel tracks, drum hits snap into a ruler grid, words into a line; the tracks fold into the ТАЙМЛАЙН loot,
// the hero grabs it and runs into a riso arch. Frame = pure function of t. World x: 0..1080 is the square; 16:9 adds (W-1080)/2 sides.
import { Riso } from './L2/riso.js';
import { rnd, clamp, ease, lerp, env, jolt } from './L2/util.js';
import { heroShapes } from '../hero.js';

const BT = 60 / 144, TAU = Math.PI * 2, GY = 820;                          // beat, ground (feet) y
// a mini-scene, not a fight (SHOWREEL.md «Драматургия»): the blaster is the editor's cutting beam. 4 slices on beats peel the 4 stems;
// the climax (seg.kill, b8) is the last cross-cut that splits what is left into the clean timeline.
const CUTS = [3, 4.5, 5.5, 7].map(b => b * BT);
const KILL = 8 * BT, BEAMS = [...CUTS, KILL], DROP = 10 * BT, GRAB = 11 * BT, DOORIN = 6.0;
const BEATS = Array.from({ length: 17 }, (_, i) => i * BT);
const BOSS = [760, 520], BR = 230;                                         // КАША centre / radius (world)
const DOORX = 1600, DW = 220, DH = 320;                                    // arch opening centre x / size (world), bottom on the ground
const LS = .38;                                                            // loot scale: held big in the hero's paws
const LANES = [['m', 'drums'], ['c', 'bass'], ['y', 'vocal'], ['cy', 'guitar']];   // stem ink (cy = cyan over yellow = riso green)

let R = null, cv = null;
const plates = () => Object.values(R.ctx);
const setT = (a, b, c, d, e, f) => plates().forEach(x => x.setTransform(a, b, c, d, e, f));
const inkOf = (k, v = 1) => k === 'cy' ? { c: v, y: v } : { [k]: v };

// ---------- motion (all pure in t) ----------
const heroX = t => t < 2 * BT ? lerp(-260, 280, ease(t / (2 * BT)))
  : t < KILL ? 280 + 70 * ease((t - 2 * BT) / (KILL - 2 * BT))
  : t < DROP ? 350
  : t < GRAB ? lerp(350, 470, ease((t - DROP) / (GRAB - DROP)))
  : t < DOORIN ? lerp(470, 1500, clamp((t - GRAB) / (DOORIN - GRAB)) ** 1.25)
  : lerp(1500, 1640, ease((t - DOORIN) / .667));
const heroRun = t => t < 2 * BT ? 1 : t < KILL ? .45 : t < DROP ? 0 : 1;
const cam = t => 780 * ease((t - 4.4) / 1.6);
const hp = t => t >= KILL ? 0 : 1 - .2 * CUTS.filter(c => t >= c).length;   // how much of the mix is still unsorted
const lastShot = t => { let s = -1; for (const x of BEAMS) if (x <= t) s = t - x; return s; };

// ---------- drawing helpers ----------
function blob(cx, cy, r, n, rough, s, ph) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + rough * (Math.sin(3 * a + s + ph) * .5 + Math.sin(5 * a + s * 2.1 - 1.3 * ph) * .3 + Math.sin(11 * a + s * 3.7 + 2.3 * ph) * .2);
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]); }
  return pts;
}
const solid = (p, dens, pad = 0) => { R.fill(p, R.all(-1)); if (pad) R.stroke(p, pad, R.all(-1)); R.fill(p, dens); };

function background(t, W) {      // equalizer skyline, parallax .3, pulses on beats; low density = open halftone
  const c = cam(t) * .3, pulse = env(t, BEATS, 0, .18);
  for (let i = -2; i < 40; i++) {
    const x = i * 64 - (c % 64), id = i + Math.floor(c / 64), h = 120 + 240 * rnd(id * 3.1) + 70 * pulse * rnd(id * 7.7);
    R.fill(R.path([[x + 6, GY], [x + 52, GY], [x + 52, GY - h], [x + 6, GY - h]]), id % 3 ? { c: .22 } : { m: .2 });
  }
  R.fill(R.circle(W * .5 + 330 - c * .5, 320, 110), { y: .28, m: .12 });   // flat riso sun far away
}
function ground(t, W, ox) {
  R.fill(R.path([[-10, GY], [W + 10, GY], [W + 10, 1090], [-10, 1090]]), { c: .55, m: .2 });
  const c = cam(t);
  for (let i = -1; i < 30; i++) { const x = i * 90 - ((c - ox) % 90 + 90) % 90; R.fill(R.path([[x, GY + 30], [x + 40, GY + 30], [x + 20, GY + 52], [x - 20, GY + 52]]), { k: .5 }); }
  R.stroke(R.path([[-10, GY], [W + 10, GY], [W + 10, GY + 1], [-10, GY + 1]]), 5, { k: 1 });
}
function cassette(x, y, a, sc = 1) {
  const C = Math.cos(a), S = Math.sin(a), P = (u, v) => [x + (u * C - v * S) * sc, y + (u * S + v * C) * sc];
  const body = R.path([P(-80, -50), P(80, -50), P(80, 50), P(-80, 50)]);
  solid(body, { m: .85, y: .5 }, 8); R.stroke(body, 4, { k: 1 });
  R.fill(R.path([P(-60, -38), P(60, -38), P(60, -6), P(-60, -6)]), { y: 1 });                 // label
  for (const u of [-38, 38]) { const [cx, cy] = P(u, 16); R.fill(R.circle(cx, cy, 17 * sc), R.all(-1)); R.stroke(R.circle(cx, cy, 15 * sc), 4, { k: 1 }); R.fill(R.circle(cx, cy, 6 * sc), { c: 1 }); }
  return P(38, 16);
}
function ribbon(x0, x1, y, amp, ph, w, dens) {    // one sine ribbon x0..x1
  const top = [], bot = [];
  for (let x = x0; x <= x1 + .1; x += 12) { const v = y + Math.sin(x * .018 + ph) * amp * clamp((x - x0) / 120) ; top.push([x, v - w / 2]); bot.unshift([x, v + w / 2]); }
  if (top.length > 1) R.fill(R.path([...top, ...bot]), dens);
}
function wave(x0, x1, t, amp = 40) {            // the riso wave: three overprinting ribbons
  if (x1 - x0 < 8) return;
  ribbon(x0, x1, 600, amp, t * 7, 24, { m: 1 });
  ribbon(x0, x1, 600, amp * .8, t * 7 + 2.1, 20, { c: 1 });
  ribbon(x0, x1, 600, amp * 1.1, t * 7 + 4.2, 18, { y: 1 });
}

// film strip (stem): x0..x1 at y, sine amplitude amp; perforations knocked out on both edges
function film(x0, x1, y, amp, ph, ink, h = 46) {
  if (x1 - x0 < 4) return;
  const top = [], bot = [], yy = x => y + Math.sin(x * .014 + ph) * amp;
  for (let x = x0; x <= x1 + .1; x += 10) { top.push([x, yy(x) - h / 2]); bot.unshift([x, yy(x) + h / 2]); }
  const p = R.path([...top, ...bot]); solid(p, inkOf(ink)); R.stroke(p, 3, { k: 1 });
  for (let x = x0 + 12; x < x1 - 10; x += 26) for (const s of [-1, 1]) {
    const v = yy(x) + s * (h / 2 - 7); R.fill(R.path([[x - 5, v - 4], [x + 5, v - 4], [x + 5, v + 4], [x - 5, v + 4]]), R.all(-1));
  }
}

// the 4-track timeline, local coords: x -450..450, lanes at y -120..120; deco 0..1 grows rulers / words / notes
function timeline(t, amp, deco, len = 1) {
  const x0 = -450, x1 = lerp(-450, 450, len);
  LANES.forEach(([ink], i) => film(x0, x1, -120 + i * 80, amp, t * 5 + i * 1.7, ink));
  if (deco <= 0) return;
  for (let j = 0; j < 16; j++) { const x = -430 + j * 54, k = clamp(deco * 18 - j); if (k <= 0) break;        // drums: ruler ticks
    const hh = (j % 4 ? 14 : 30) * ease(k); R.fill(R.path([[x - 3, -120 - hh / 2], [x + 3, -120 - hh / 2], [x + 3, -120 + hh / 2], [x - 3, -120 + hh / 2]]), { k: 1 }); }
  for (let j = 0; j < 8; j++) { const x = -420 + j * 108, k = clamp(deco * 10 - j); if (k <= 0) break;         // bass: long note bars
    R.fill(R.path([[x, -48], [x + 90 * k * (j % 3 ? .6 : 1), -48], [x + 90 * k * (j % 3 ? .6 : 1), -32], [x, -32]]), { k: 1 }); }
  const WORDS = ['ла', 'ла-ла', 'ла', 'ла-ла-ла'];                                                              // vocal: words in a line
  const X = R.ctx.k; X.font = 'bold 30px sans-serif'; X.textBaseline = 'middle'; X.fillStyle = '#fff';
  let wx = -420; WORDS.forEach((w, j) => { const k = clamp(deco * 6 - j); if (k > 0) { X.globalAlpha = k; X.fillText(w, wx, 41); X.globalAlpha = 1; } wx += X.measureText(w).width + 46; });
  for (let j = 0; j < 12; j++) { const x = -430 + j * 72, k = clamp(deco * 14 - j); if (k <= 0) break;         // guitar: strum zigzags
    R.stroke(R.path([[x, 128], [x + 14, 108], [x + 28, 128], [x + 42, 108], [x + 42, 108.5], [x + 28, 128.5], [x + 14, 108.5], [x, 128.5]]), 4 * k, { k: 1 }); }
}

function boss(t) {
  const h = hp(t), bub = env(t, BEATS, 0, .15), hit = env(t, CUTS, 0, .1), grow = ease((t - 2 * BT) / (BT));
  const r = BR * (.75 + .25 * h) * grow * (1 + .05 * bub - .06 * hit), ph = t * 2.2;
  if (r < 2) return;
  const [cx, cy] = [BOSS[0], BOSS[1] + (1 - grow) * 80], p = R.path(blob(cx, cy, r, 64, .14 + .06 * bub, 1.3, ph));
  solid(p, { y: .55 }, 12);
  R.fill(p, { m: R.radial(cx + 60 * Math.sin(ph), cy - 50, 0, r * 1.2, .95, .35) });               // all inks stuck together:
  R.fill(p, { c: R.radial(cx - 70, cy + 40 * Math.cos(ph * 1.3), 0, r * 1.1, .9, .3) });            // mottled overprint = mud
  R.fill(p, { o: R.radial(cx + 20, cy + 70, 0, r * .8, .35, 0) });
  for (let i = 0; i < 7; i++) { const a = rnd(i * 5.1) * TAU, d = r * (.25 + .55 * rnd(i * 2.3)), life = (t * 1.2 + rnd(i * 9)) % 1;   // bubbles
    const br = r * .09 * Math.sin(life * Math.PI) * (1 + .6 * bub), bx = cx + Math.cos(a) * d, by = cy + Math.sin(a) * d * .8 - life * 30;
    R.stroke(R.circle(bx, by, br), 3, { k: .9 }); R.fill(R.circle(bx - br * .3, by - br * .3, br * .3), { y: 1 }); }
  R.stroke(p, 5, { k: 1 });
}
function burst(t) {                          // КАША splatters on kill: ink drops fly out, rings
  const k = (t - KILL) / .5; if (k < 0 || k > 1) return;
  const [cx, cy] = BOSS, e = ease(k);
  for (let i = 0; i < 26; i++) { const a = rnd(i * 3.3) * TAU, d = 60 + 380 * e * (.5 + .5 * rnd(i * 1.7)), ink = ['m', 'c', 'y', 'o'][i % 4];
    R.fill(R.circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d + 160 * k * k, 26 * (1 - k) * (.5 + rnd(i))), { [ink]: 1 }); }
  R.stroke(R.circle(cx, cy, 60 + 340 * e), 18 * (1 - k), { m: 1 }); R.stroke(R.circle(cx, cy, 30 + 260 * e), 10 * (1 - k), { c: 1 });
}
function peeling(t) {                        // a stem film rips off the blob at each cut and slides into its lane
  CUTS.forEach((c, i) => { const k = (t - c) / .35; if (k < 0 || t >= KILL) return;
    const ink = LANES[i][0], y = laneY(i), len = ease(k), x1 = cutPt(c)[0] + 40;
    film(lerp(x1 - 40, 100, len), x1, y, 26 * (1 + .5 * Math.sin(t * 3)), t * 5 + i * 1.7, ink); });
}
function drawHero(t) {
  const x = heroX(t), run = heroRun(t), grab = t >= GRAB;
  const H = heroShapes({ x, y: GY, s: .6, t, run, face: 1, shot: t < KILL ? lastShot(t) : -1, eye: t >= KILL && t < GRAB + .3 ? 'happy' : t < KILL ? 'squint' : 'open',
    armUp: grab ? 1 : clamp((t - GRAB + .15) / .15), gun: false });
  for (const { pts } of H.shapes) { const p = R.path(pts); R.fill(p, R.all(-1)); R.stroke(p, 14, R.all(-1)); }   // knock-out pad: hero sits on bare paper
  const FILL = { arm: { o: 1 }, leg: { o: 1 }, body: { o: 1 }, band: { r: 1 }, tail: { r: 1 }, eye: { k: 1 }, flash: { y: 1, o: .5 } };
  for (const { role, pts } of H.shapes) { const p = R.path(pts); R.fill(p, FILL[role]); if (role === 'body') R.fill(p, { r: R.radial(H.u2s(60, 60)[0], H.u2s(60, 60)[1], 40, 200, 0, .35) });
    if (role !== 'eye' && role !== 'flash') R.stroke(p, 4.5, { k: 1 }); }
  if (t < GRAB - .1) fork(H, t);
  return H;
}
const laneY = i => 300 + i * 80;
const cutPt = c => { const i = CUTS.indexOf(c); return i < 0 ? [BOSS[0], BOSS[1]] : [BOSS[0] - BR * (.75 + .25 * hp(c - .01)) * .7, laneY(i)]; };
// tuning fork (no weapons): handle at the front paw, U of two riso tines outside the silhouette; tines buzz after each strike
const forkTip = H => H.u2s(352, 75);
function fork(H, t) {
  const v = env(t, BEAMS, 0, .12) * 5 * Math.sin(t * 160), P = (pts, dens) => { const p = R.path(pts.map(([u, w]) => H.u2s(u, w)));
    R.fill(p, R.all(-1)); R.stroke(p, 9, R.all(-1)); R.fill(p, dens); R.stroke(p, 3.5, { k: 1 }); };
  P([[150, 66], [258, 66], [258, 84], [150, 84]], { y: 1, m: .45 });                                     // handle
  P([[250, 40 - v], [266, 40 - v], [266, 110 + v], [250, 110 + v]], { y: 1, m: .45 });                  // yoke
  P([[262, 40 - v], [352, 40 - v], [352, 56 - v], [262, 56 - v]], { m: 1 });                            // tine 1
  P([[262, 94 + v], [352, 94 + v], [352, 110 + v], [262, 110 + v]], { c: 1 });                          // tine 2
}
function beams(t) {                         // strike = riso sound rings from the fork tip; they slice the stem off where they land
  BEAMS.forEach(c => { const k = (t - c) / .25; if (k < 0 || k > 1) return;
    const m = forkTip(heroShapes({ x: heroX(c), y: GY, s: .6, t: c, run: heroRun(c), shot: 0, gun: false })), [tx, ty] = cutPt(c), big = c === KILL ? 1.8 : 1;
    const d = Math.hypot(tx - m[0], ty - m[1]), a = Math.atan2(ty - m[1], tx - m[0]), span = c === KILL ? .9 : .45;
    for (let j = 0; j < 4; j++) { const q = clamp(k * 1.6 - j * .18); if (q <= 0 || q >= 1) continue;
      const arc = new Path2D(); arc.arc(m[0], m[1], 20 + (d + 30) * q, a - span, a + span);
      const w = (14 - j * 2) * (1 - q * .6) * (c === KILL ? 1.4 : 1);
      R.stroke(arc, w + 8, R.all(-1)); R.stroke(arc, w, { [['m', 'c', 'y', 'm'][j]]: 1 }); }
    R.stroke(R.circle(tx, ty, 14 + 60 * k * big), 8 * (1 - k), { y: 1, m: .5 });
    if (c === KILL) R.stroke(R.path([[tx - 10, ty - 280 * ease(k * 3)], [tx + 10, ty + 280 * ease(k * 3)], [tx + 10.5, ty + 280 * ease(k * 3)], [tx - 9.5, ty - 280 * ease(k * 3)]]), 12 * (1 - k), { y: 1, m: 1 }); });
}
function door(t) {                          // riso arch from overprinted plates
  const x = DOORX, top = GY - DH, ow = DW + 90;
  const arch = new Path2D(); arch.moveTo(x - ow / 2, GY); arch.lineTo(x - ow / 2, top); arch.arc(x, top, ow / 2, Math.PI, 0); arch.lineTo(x + ow / 2, GY); arch.closePath();
  solid(arch, { m: 1 }); R.fill(arch, { y: .7 });
  for (let i = 0; i < 6; i++) R.fill(R.path([[x - ow / 2, top + 30 + i * 46], [x - ow / 2 + 45, top + 30 + i * 46], [x - ow / 2 + 45, top + 52 + i * 46], [x - ow / 2, top + 52 + i * 46]]), { c: 1 });
  for (let i = 0; i < 6; i++) R.fill(R.path([[x + ow / 2 - 45, top + 30 + i * 46], [x + ow / 2, top + 30 + i * 46], [x + ow / 2, top + 52 + i * 46], [x + ow / 2 - 45, top + 52 + i * 46]]), { c: 1 });
  R.stroke(arch, 5, { k: 1 });
  const hole = R.path([[x - DW / 2, top], [x + DW / 2, top], [x + DW / 2, GY], [x - DW / 2, GY]]);
  R.fill(hole, R.all(-1)); R.fill(hole, { y: R.radial(x, GY - DH / 2, 0, DH * .7, .55 + .25 * env(t, BEATS, 0, .2), 0) }); R.stroke(hole, 4, { k: 1 });
}

export default {
  async init(S) { cv = document.createElement('canvas');
    R = new Riso(cv, { w: S.W, h: S.H, cell: 7, paper: '#140f22', inks: {
      y: ['#ffe81f', 0], m: ['#ff2e93', 75], c: ['#16d4ff', 15], o: ['#ff7418', 30], r: ['#e8241f', 60], k: ['#0a0616', 45, true] } }); },
  draw(ctx, t, S) {
    const W = S.W, ox = (W - 1080) / 2, c = cam(t);
    R.clear(); setT(1, 0, 0, 1, 0, 0);
    background(t, W); ground(t, W, ox);
    setT(1, 0, 0, 1, ox - c, 0);                                           // world space
    // intro: cassette flies in, tape unspools into the wave; wave feeds the blob, then is sucked in
    const ca = ease(t / .6), cx = t < .83 ? lerp(240, 330, ca) : lerp(330, 140, ease((t - .83) / .3)),          // on screen from t = 0 (seen through L1's door)
      cy = t < .83 ? lerp(430, 520, ca) : lerp(520, GY - 30, ease((t - .83) / .3) ** 2), csc = t < .83 ? 1.3 : lerp(1.3, .9, clamp((t - .83) / .3));
    const reel = cassette(cx, cy, t < .83 ? lerp(-.5, .15, ca) + Math.sin(t * 9) * .04 : lerp(.15, 0, clamp((t - .83) / .3)), csc);
    if (t < 1.45) { const head = lerp(reel[0], BOSS[0] - 40, ease(t / .83)), tail = t < .83 ? reel[0] : lerp(reel[0], BOSS[0] - 60, ease((t - .83) / .6));
      R.stroke(R.path([reel, [reel[0] + 20, 600], [reel[0] + 20, 601], [reel[0], reel[1] + 1]]), 6, { k: .8 });
      wave(tail, head, t, 60 * (1 - clamp((t - 1.0) / .45))); }
    if (t < KILL) peeling(t);
    // tracks: wavy films hang behind the blob from each cut, straighten on kill, then fold into the loot
    const n = CUTS.filter(cc => t >= cc + .35).length;
    if ((t >= KILL || n) && t < GRAB) {   // after the grab the loot is drawn in the paws, over the hero
      const amp = t < KILL ? 26 : 26 * (1 - ease((t - KILL) / .25)), deco = clamp((t - KILL - .1) / .45), fold = ease((t - 3.85) / (DROP - 3.85));
      const fall = clamp((t - DROP) / .26), lootY = t < DROP ? lerp(420, 330, fold) : t < GRAB ? lerp(330, GY - 62, fall * fall) - (fall >= 1 ? Math.abs(Math.sin((t - DROP - .26) * 14)) * 30 * Math.exp(-(t - DROP - .26) * 9) : 0) : 0;
      const lx = lerp(550, 520, fold), ly = lootY, sc = lerp(1, LS, fold);
      if (t < KILL) { // only the already-cut lanes, still wavy, full length
        setT(1, 0, 0, 1, ox - c + 550, 420);
        LANES.slice(0, n).forEach(([ink], i) => film(-450, 210, -120 + i * 80, amp * (1 + .5 * Math.sin(t * 3)), t * 5 + i * 1.7, ink));
      } else {
        if (fold > 0) setT(sc, 0, 0, sc, ox - c + lx, ly); else setT(1, 0, 0, 1, ox - c + 550, 420);
        if (fold > .6) { const p = R.path([[-470, -160], [470, -160], [470, 160], [-470, 160]]); solid(p, { y: .25 }, 30); R.stroke(p, 10, { k: 1 }); }
        timeline(t, amp, deco, 1);
      }
      setT(1, 0, 0, 1, ox - c, 0);
    }
    if (t < KILL) boss(t);
    burst(t);
    door(t);
    beams(t);
    const loot = t >= GRAB;
    drawHero(t);
    if (loot) { // timeline loot drawn again above the hero, on top of the body
      const Hh = heroShapes({ x: heroX(t), y: GY, s: .6, t, run: heroRun(t), armUp: 1 }), [hx, hy] = Hh.u2s(10, -215), k = ease((t - GRAB) / .15);
      setT(LS, 0, 0, LS, ox - c + lerp(520, hx, k), lerp(GY - 62, hy, k));
      const p = R.path([[-470, -160], [470, -160], [470, 160], [-470, 160]]); solid(p, { y: .25 }, 30); R.stroke(p, 10, { k: 1 }); timeline(t, 0, 1, 1);
      setT(1, 0, 0, 1, ox - c, 0);
    }
    const kk = env(t, [KILL], 0, .25);
    R.render({ off: (() => { const j = jolt(t, BEAMS, ['m', 'c', 'y'], 7); return { ...j, o: [2, -1], r: [-3, 2] }; })(), swell: .35 * kk, zoom: 1 + .015 * kk });
    ctx.drawImage(cv, 0, 0);
  },
  door(t, S) { const ox = (S.W - 1080) / 2; return { x: DOORX - DW / 2 - cam(t) + ox, y: GY - DH, w: DW, h: DH }; },
    events: [{ t: 0, k: 'whoosh' }, ...CUTS.map(t => ({ t, k: 'shot' })),
    { t: KILL, k: 'kill' }, { t: GRAB, k: 'loot' }, { t: DOORIN, k: 'door' }].map(e => ({ t: +e.t.toFixed(4), k: e.k })),
};
