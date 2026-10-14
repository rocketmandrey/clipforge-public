// L8_render.js — showreel level 8 «РЕНДЕР + ревью» in the candy_pop technique (kit copy: levels/L8/candy_kit.js).
// b0–b1 page Б drops into the gumball factory, it wakes and prints a film strip of wrapped-candy frames; b2–b7 boss PROGRESS BAR 99%
// rolls back, hero pushes it forward with dragee shots on eighths; kill 3.333 = 100% and it bursts into candies; green review beam
// ticks every frame; reel CLIP.MP4 drops 4.167, grab 4.583; run to the candy arch, doorIn 6.0. Frame = pure function of t.
import { heroShapes } from '../hero.js';
import { C, INK, TAU, RNG, inked, rrect, circ, ell, bgSunburst, bgCheck, sparkle, heart, lollipop, wrapped, bean, konpeito,
  bubbleText, clamp, lerp, easeIO, easeO, popS, spring, gloss } from './L8/candy_kit.js';

const GY = 830;                                   // ground (world y = screen y)
const E8 = 60 / 144 / 2;                          // eighth note
const SHOTS = Array.from({ length: 12 }, (_, i) => 60 / 144 * 2 + i * E8), FLY = .16, HITS = SHOTS.map(s => s + FLY);
const KILL = 60 / 144 * 8, SCAN0 = 3.42, SCAN1 = 3.96, DROP = 60 / 144 * 10, GRAB = 60 / 144 * 11, DIN = 6.0;
const BAR = { x: 520, y: 560, w: 520, h: 200 };   // boss capsule (world)
const RAIL = 300, SPOUT = 236, FW = 112, FGAP = 168;  // film strip rail y, spout x, frame width, pitch
const DOOR = { x: 1420, w: 250, top: 470 };       // candy arch opening centre x / width / top (world)
const GREEN = '#2fcf6f', GOLD = '#ffcf33', ORANGE = '#f5874a';
const sstep = k => (k = clamp(k), k * k * (3 - 2 * k));
const pw = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
  const [a, va] = keys[i - 1], [b, vb] = keys[i]; return lerp(va, vb, sstep((t - a) / (b - a))); } return keys.at(-1)[1]; };

// ---------- clocks ----------
const camX = t => lerp(540, 1260, easeIO((t - 4.55) / (DIN - 4.55)));
// progress %: envelope (the bar wins early, the hero wins late) + a forward kick on every hit that slides back
const ENV = [[.833, 99], [1.45, 94.5], [2.05, 86], [2.5, 88], [2.9, 94], [3.29, 100]];
function prog(t) {
  if (t >= 3.29) return 100;
  let p = pw(t, ENV); for (const h of HITS) if (t >= h) p += 2.6 * (1 - Math.exp(-(t - h) / .03)) * Math.exp(-(t - h) / .22);
  return Math.min(99.4, p);
}
const lastOf = (arr, t) => { let r = -1; for (const x of arr) if (x <= t) r = x; return r; };
function heroPose(t) {
  let x = 300, run = 0, face = 1, eye = 'open', armUp = 0, s = .62, y = GY;
  if (t < .72) face = -1;
  if (t >= .5 && t < .83) eye = 'wide';
  if (t >= .83 && t < KILL) { eye = 'squint'; x = lerp(300, 330, (t - .83) / 2.5); }
  if (t >= KILL) { eye = 'happy'; x = 330; }
  if (t >= 4.0 && t < 4.6) { x = lerp(330, 450, sstep((t - 4.0) / .55)); run = .6; }
  if (t >= GRAB) armUp = clamp((t - GRAB) / .1);
  if (t >= 4.6) { const p = clamp((t - 4.6) / (5.85 - 4.6)), q = p < .15 ? p * p / .3 : p - .075; x = 450 + 970 * q / .925; run = 1; }
  if (t >= 5.85) { const p = clamp((t - 5.85) / (DIN - 5.85)); s = .62 * (1 - .5 * p); y = GY - 50 * p; }   // steps into the arch's depth; gone at DIN
  const ls = lastOf(SHOTS, t), shot = t >= SHOTS[0] && t < KILL ? t - ls : -1;
  return { x, y, s, t, run, face, eye, armUp, shot, lean: t >= .83 && t < KILL ? -3 : undefined };
}

// ---------- hero in candy: glossy fill, plum ink, white sheen ----------
const HFILL = { arm: ORANGE, leg: ORANGE, body: ORANGE, eye: INK, band: '#e8323c', tail: '#d42a35', gun: '#5b3a72', flash: C.butter };
function path(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }
// candy brush-lollipop in the front paw (no weapons): striped cane, butter ferrule, paint-dipped bristle tuft. Swings forward on every
// eighth where a shot used to be; the dragee / paint blob leaves from the tuft tip.
const PAINT = [C.hot, C.mint, C.butter, C.lav, C.sky, C.peach];
function brush(H, o) {
  const k = o.shot >= 0 ? Math.max(0, 1 - o.shot / .2) : 0, sw = Math.sin(Math.min(1, k * 1.6) * Math.PI / 2);   // 1 at the stroke, back by .2 s
  const a = -1.15 + 1.0 * sw, f = o.face ?? 1, L = 150 * H.s / .6, p = H.u2s(215, 30);
  const dx = Math.cos(a) * f, dy = Math.sin(a);
  return { p, a, f, L, tip: [p[0] + dx * (L + 40 * H.s / .6), p[1] + dy * (L + 40 * H.s / .6)] };
}
function drawBrush(g, H, o) {
  const b = brush(H, o), sc = H.s / .6, ci = o.shot >= 0 ? SHOTS.indexOf(lastOf(SHOTS, o.t)) : 0;
  g.save(); g.translate(b.p[0], b.p[1]); g.scale(b.f, 1); g.rotate(b.a); g.scale(sc, sc);
  rrect(g, -10, -9, 160, 18, 9); inked(g, C.cream, 5); g.save(); rrect(g, -10, -9, 160, 18, 9); g.clip(); g.fillStyle = C.hot;
  for (let x = -10; x < 170; x += 26) { g.save(); g.translate(x, 0); g.rotate(.7); g.fillRect(-5, -20, 10, 40); g.restore(); } g.restore();
  rrect(g, -10, -9, 160, 18, 9); inked(g, null, 5);
  rrect(g, 140, -14, 26, 28, 6); inked(g, C.butter, 5);
  g.beginPath(); g.moveTo(164, -16); g.quadraticCurveTo(200, -18, 214, 0); g.quadraticCurveTo(200, 18, 164, 16); g.closePath(); inked(g, PAINT[(ci + 6) % 6], 5);
  g.fillStyle = 'rgba(255,255,255,.75)'; ell(g, 40, -3, 30, 3.5); g.fill(); ell(g, 180, -7, 10, 3); g.fill();
  g.restore();
}
function drawHero(g, o) {
  o = { ...o, gun: false }; const H = heroShapes(o), lw = 6 * o.s / .62;
  for (const { role, pts } of H.shapes) {
    path(g, pts);
    if (role === 'body') {
      const ys = pts.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), gr = g.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, '#ffb07a'); gr.addColorStop(.55, ORANGE); gr.addColorStop(1, '#d9632f'); inked(g, gr, lw);
      const [a, b] = [H.u2s(-110, -60), H.u2s(-40, -62)]; g.save(); path(g, pts); g.clip();
      g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, (a[0] + b[0]) / 2, a[1], 60 * H.s / .6, 13 * H.s / .6, -.05); g.fill(); g.restore();
    } else if (role === 'eye') { g.fillStyle = INK; g.fill(); const c = pts.reduce((m, p) => [m[0] + p[0] / pts.length, m[1] + p[1] / pts.length], [0, 0]);
      if (o.eye !== 'happy') { g.fillStyle = '#fff'; circ(g, c[0] - 2 * H.s, c[1] - 9 * H.s, 4.5 * H.s / .6); g.fill(); } }
    else if (role === 'flash') { inked(g, C.butter, 4); }
    else { inked(g, HFILL[role], lw);
      if (role === 'band') { g.save(); path(g, pts); g.clip(); g.fillStyle = 'rgba(255,255,255,.55)'; const p = H.u2s(-60, -100); ell(g, p[0], p[1], 70 * H.s / .6, 5 * H.s / .6); g.fill(); g.restore(); }
      if (role === 'gun') { const p = H.u2s(200, 50); g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, p[0], p[1], 24 * H.s / .6, 4 * H.s / .6); g.fill(); } }
  }
  drawBrush(g, H, o);
  return H;
}

// ---------- props ----------
function pageB(g, x, y, s, rot) {   // notebook page «Б» (loot of L7), candy-ified
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  rrect(g, -60, -78, 120, 156, 10); inked(g, C.cream, 6);
  g.strokeStyle = 'rgba(120,160,230,.6)'; g.lineWidth = 2; for (let k = -50; k < 78; k += 16) { g.beginPath(); g.moveTo(-52, k); g.lineTo(52, k); g.stroke(); }
  g.strokeStyle = 'rgba(252,50,147,.5)'; g.beginPath(); g.moveTo(-40, -74); g.lineTo(-40, 74); g.stroke();
  // Б drawn as strokes (Fredoka has no Cyrillic)
  g.lineCap = g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 20;
  const b = () => { g.beginPath(); g.moveTo(26, -42); g.lineTo(-18, -42); g.lineTo(-18, 44); g.lineTo(10, 44); g.arc(10, 21, 23, Math.PI / 2, -Math.PI / 2, true); g.lineTo(-18, -2); };
  b(); g.stroke(); g.strokeStyle = C.hot; g.lineWidth = 11; b(); g.stroke();
  g.restore();
}
function filmFrame(g, x, y, i, k) {   // wrapped candy whose body is a film frame; k = checked pop 0..1+
  const wc = [C.lav, C.mint, C.butter, C.sky, C.pink, C.peach][i % 6];
  g.save(); g.translate(x, y);
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 50, 0); g.lineTo(sx * 92, -34); g.quadraticCurveTo(sx * 80, 0, sx * 92, 34); g.closePath(); inked(g, wc, 5);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx * 60, -6); g.lineTo(sx * 82, -22); g.stroke(); }
  rrect(g, -FW / 2, -44, FW, 88, 14); inked(g, '#3b1446', 5);
  g.fillStyle = C.cream; for (let j = 0; j < 5; j++) for (const yy of [-38, 30]) { rrect(g, -46 + j * 20, yy, 11, 8, 3); g.fill(); }
  g.save(); rrect(g, -46, -24, 92, 48, 6); g.clip(); miniPic(g, i); g.restore();
  rrect(g, -46, -24, 92, 48, 6); inked(g, null, 3);
  g.fillStyle = 'rgba(255,255,255,.6)'; ell(g, -30, -33, 18, 4, -.1); g.fill();
  if (k > 0) {
    g.strokeStyle = GREEN; g.lineWidth = 6; g.globalAlpha = clamp(k); rrect(g, -FW / 2 - 6, -50, FW + 12, 100, 18); g.stroke(); g.globalAlpha = 1;
    const s = popS(k); g.save(); g.translate(40, -44); g.scale(s, s); circ(g, 0, 0, 22); inked(g, GREEN, 5);
    g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-10, 1); g.lineTo(-3, 9); g.lineTo(11, -8); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, -8, -11, 7, 3, -.4); g.fill(); g.restore();
  }
  g.restore();
}
function miniPic(g, i) {   // tiny «render» inside each frame: the earlier levels in candy colours
  const bg = [C.sky, C.mint, C.lavL, C.butterL, C.blush, C.peach][i % 6]; g.fillStyle = bg; g.fillRect(-46, -24, 92, 48);
  switch (i % 6) {
    case 0: heart(g, 0, 2, 14, C.hot, 3); break;
    case 1: rrect(g, -20, -8, 40, 24, 3); inked(g, ORANGE, 3); g.fillStyle = '#e8323c'; g.fillRect(-20, -8, 40, 5); g.fillStyle = INK; g.fillRect(-11, -2, 3, 7); g.fillRect(7, -2, 3, 7); break;
    case 2: sparkle(g, 0, 0, 18, C.butter, 3); break;
    case 3: lollipop(g, 0, -6, 11, {}); break;
    case 4: konpeito(g, -14, 2, 11, C.lav); bean(g, 16, 4, 10, C.mint); break;
    default: wrapped(g, 0, 0, 12, { body: C.mint, stripe: C.hot });
  }
}
function reel(g, x, y, r, rot, label = 1) {   // loot: golden film reel wrapped like a bonbon
  g.save(); g.translate(x, y); g.rotate(rot);
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * r * .8, 0); g.lineTo(sx * r * 1.75, -r * .7); g.quadraticCurveTo(sx * r * 1.5, 0, sx * r * 1.75, r * .7); g.closePath(); inked(g, C.hot, 5);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(sx * r * 1.0, -r * .1); g.lineTo(sx * r * 1.5, -r * .45); g.stroke(); }
  circ(g, 0, 0, r); inked(g, GOLD, 6); circ(g, 0, 0, r * .72); inked(g, '#ffe27a', 3);
  for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; circ(g, Math.cos(a) * r * .45, Math.sin(a) * r * .45, r * .15); inked(g, '#3b1446', 3); }
  circ(g, 0, 0, r * .16); inked(g, C.cream, 3);
  g.fillStyle = 'rgba(255,255,255,.8)'; ell(g, -r * .45, -r * .55, r * .25, r * .1, -.6); g.fill();
  g.restore();
  if (label > 0) { g.save(); g.translate(x, y + r + 26); g.scale(label, label); g.font = '700 26px Fredoka'; const w = g.measureText('CLIP.MP4').width + 30;
    g.fillStyle = INK; rrect(g, -w / 2 + 3, -17 + 4, w, 34, 17); g.fill(); rrect(g, -w / 2, -17, w, 34, 17); inked(g, C.butter, 4);
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CLIP.MP4', 0, 2); g.restore(); }
}

// ---------- scenery ----------
function backdrop(g, t, W, cx) {
  const par = cx - 540;
  bgSunburst(g, 0, 0, W, 1080, { cx: W / 2 - par * .15, cy: 520, rays: 28, c1: C.pink, c2: C.blush, rot: t * .12 });
  // far factory: striped candy towers with glass domes (parallax .45)
  g.save(); g.translate(W / 2 - par * .45 - 540, 0);
  for (let i = -3; i < 9; i++) { const x = i * 300 + 60, h = 260 + (i * 97 % 5 + 5) % 5 * 50, col = [C.lavL, C.sky, C.mint, C.butterL][(i + 8) % 4];
    rrect(g, x - 55, GY - h, 110, h + 20, 20); inked(g, col, 5);
    g.save(); rrect(g, x - 55, GY - h, 110, h + 20, 20); g.clip(); g.fillStyle = 'rgba(255,255,255,.45)';
    for (let k = 0; k < 8; k++) { g.save(); g.translate(x, GY - h + 40 + k * 60); g.rotate(-.5); g.fillRect(-90, -9, 180, 18); g.restore(); } g.restore();
    circ(g, x, GY - h - 30, 46); inked(g, 'rgba(255,255,255,.75)', 5); for (let k = 0; k < 4; k++) { circ(g, x - 22 + k * 15, GY - h - 18 - (k % 2) * 20, 11); inked(g, [C.hot, C.butter, C.mint, C.lav][k], 3); }
    gloss(g, x - 20, GY - h - 50, 12, 5, -.5); }
  g.restore();
}
function machine(g, t) {   // gumball factory, world x 10..250; wakes at .55
  const wk = t - .55, sq = wk > 0 ? 1 + .09 * Math.exp(-wk * 4) * Math.sin(wk * 26) : 1, on = wk > 0;
  g.save(); g.translate(130, GY); g.scale(2 - sq, sq); g.translate(-130, -GY);
  // pipe into the factory from off-screen left (wide frame)
  rrect(g, -700, 640, 730, 60, 30); inked(g, C.lav, 6); g.save(); rrect(g, -700, 640, 730, 60, 30); g.clip(); g.fillStyle = C.cream;
  for (let x = -700; x < 40; x += 70) { g.save(); g.translate(x - (on ? t * 120 % 70 : 0), 670); g.rotate(.6); g.fillRect(-12, -60, 24, 120); g.restore(); } g.restore();
  // body
  rrect(g, 10, 400, 240, GY - 400 + 6, 36); inked(g, C.hot, 7);
  g.fillStyle = 'rgba(255,255,255,.5)'; rrect(g, 30, 420, 26, 330, 13); g.fill();
  rrect(g, 60, 470, 140, 110, 22); inked(g, C.butter, 5);                       // gauge panel
  const nd = on ? -2.2 + Math.min(1, wk * 2) * 1.6 + Math.sin(t * 20) * .08 : -2.4;
  circ(g, 100, 528, 34); inked(g, C.cream, 4); g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(100, 528); g.lineTo(100 + Math.cos(nd) * 26, 528 + Math.sin(nd) * 26); g.stroke();
  for (let k = 0; k < 3; k++) { const lit = on && Math.floor(t * 6 + k) % 3 !== 0; circ(g, 160, 494 + k * 30, 10); inked(g, lit ? [C.mint, C.butterL, C.sky][k] : '#a07aa8', 4); }
  rrect(g, 80, 640, 100, 120, 20); inked(g, C.lav, 5); circ(g, 130, 700, 22); inked(g, C.cream, 4);   // chute
  // dome with gumballs (rattle when awake)
  circ(g, 130, 320, 100); inked(g, 'rgba(228,216,253,.75)', 7);
  g.save(); circ(g, 130, 320, 94); g.clip(); const R = RNG(8);
  for (let k = 0; k < 26; k++) { const gx = 50 + R() * 160, gy = 340 + R() * 90 - (k % 4) * 22, j = on ? Math.sin(t * 30 + k) * 5 * Math.exp(-Math.max(0, wk - .3) * .5) : 0;
    circ(g, gx + j, gy - Math.abs(j), 19); inked(g, [C.hot, C.butter, C.mint, C.lav, C.sky, C.peach][k % 6], 3); } g.restore();
  gloss(g, 85, 265, 30, 12, -.6);
  rrect(g, 70, 380, 120, 30, 10); inked(g, C.hot, 6);
  // hopper on top (page goes in here)
  g.beginPath(); g.moveTo(60, 170); g.lineTo(200, 170); g.lineTo(160, 228); g.lineTo(100, 228); g.closePath(); inked(g, C.butter, 6);
  rrect(g, 50, 160, 160, 22, 11); inked(g, C.butter, 6); rrect(g, 75, 164, 110, 10, 5); g.fillStyle = INK; g.fill();
  // spout to the rail
  rrect(g, 200, RAIL - 50, 52, 100, 18); inked(g, C.lav, 6); rrect(g, 236, RAIL - 46, 14, 92, 6); g.fillStyle = INK; g.fill();
  g.restore();
  if (on) for (let k = 0; k < 4; k++) { const a = ((wk * .9 + k / 4) % 1); if (wk * .9 + k / 4 < 1 && k) continue;   // heart puffs out of the dome
    g.globalAlpha = Math.sin(a * Math.PI); heart(g, 40 - a * 60 + Math.sin(a * 9 + k) * 12, 230 - a * 120, 14 + a * 10, [C.hot, C.white, C.butter, C.mint][k], 3); g.globalAlpha = 1; }
}
function rail(g) {
  rrect(g, 230, RAIL + 52, 1060, 18, 9); inked(g, C.cream, 5); g.save(); rrect(g, 230, RAIL + 52, 1060, 18, 9); g.clip(); g.fillStyle = C.hot;
  for (let x = 230; x < 1300; x += 34) { g.save(); g.translate(x, RAIL + 61); g.rotate(.7); g.fillRect(-6, -20, 12, 40); g.restore(); } g.restore();
  for (const x of [520, 900, 1260]) { rrect(g, x - 8, RAIL + 66, 16, 140, 8); inked(g, C.lav, 4); }
}
const stripPos = t => t < .6 ? 0 : t < 3.1 ? (t - .6) * 300 : 750 + 60 * easeO((t - 3.1) / .3) * .3 / .3 * (t < 3.4 ? (t - 3.1) / .3 : 1);
const scanX = t => lerp(SPOUT, 1150, clamp((t - SCAN0) / (SCAN1 - SCAN0)));
function strip(g, t) {
  const s = stripPos(t);
  for (let i = 0; i < 7; i++) { const x = SPOUT - FW / 2 + s - i * FGAP; if (x < SPOUT - FW) continue;
    const pass = SCAN0 + (x - SPOUT) / (1150 - SPOUT) * (SCAN1 - SCAN0), k = t >= pass && t > SCAN0 ? (t - pass) / .18 : 0;
    const bob = Math.sin(t * 9 + i * 1.3) * 3 * (t < 3.4 ? 1 : 0);
    filmFrame(g, x, RAIL + bob, i, k); }
  if (t > SCAN0 - .05 && t < SCAN1 + .25) {   // green review beam
    const bx = scanX(t), a = clamp((SCAN1 + .25 - t) / .2) * clamp((t - SCAN0 + .05) / .05);
    g.globalAlpha = a * .3; g.fillStyle = '#7dffb0'; rrect(g, bx - 50, RAIL - 105, 100, 220, 40); g.fill();
    g.globalAlpha = a; const gr = g.createLinearGradient(bx - 14, 0, bx + 14, 0); gr.addColorStop(0, GREEN); gr.addColorStop(.5, '#c8ffe0'); gr.addColorStop(1, GREEN);
    rrect(g, bx - 12, RAIL - 90, 24, 190, 12); inked(g, gr, 4);
    rrect(g, bx - 40, RAIL - 120, 80, 34, 17); inked(g, C.mint, 5); circ(g, bx, RAIL - 103, 9); inked(g, GREEN, 3); gloss(g, bx - 20, RAIL - 112, 12, 4, 0);
    g.globalAlpha = 1;
  }
}
function arch(g, t) {   // giant candy-cane arch, opening = door()
  const x0 = DOOR.x - DOOR.w / 2, x1 = DOOR.x + DOOR.w / 2, top = DOOR.top;
  const gr = g.createLinearGradient(0, top, 0, GY); gr.addColorStop(0, '#fff8d6'); gr.addColorStop(1, C.butter);
  g.fillStyle = gr; g.fillRect(x0, top, DOOR.w, GY - top);
  for (let k = 0; k < 7; k++) { const a = (t * .5 + k / 7) % 1; sparkle(g, x0 + 30 + (k * 71) % (DOOR.w - 60), GY - a * (GY - top), 8 + 8 * Math.sin(a * Math.PI), C.white, 2); }
  g.lineWidth = 6; g.strokeStyle = INK; g.strokeRect(x0, top, DOOR.w, GY - top);
  const cane = (x, y0, y1) => { rrect(g, x - 30, y0, 60, y1 - y0, 30); inked(g, C.cream, 7); g.save(); rrect(g, x - 30, y0, 60, y1 - y0, 30); g.clip(); g.fillStyle = C.hot;
    for (let y = y0 - 60; y < y1 + 60; y += 56) { g.save(); g.translate(x, y); g.rotate(-.6); g.fillRect(-60, -12, 120, 24); g.restore(); } g.restore();
    rrect(g, x - 30, y0, 60, y1 - y0, 30); inked(g, null, 7); gloss(g, x - 14, y0 + 60, 6, 40, 0); };
  cane(x0 - 32, top - 30, GY + 6); cane(x1 + 32, top - 30, GY + 6);
  g.save(); g.translate(DOOR.x, top); g.beginPath(); g.arc(0, 0, DOOR.w / 2 + 62, Math.PI, 0); g.arc(0, 0, DOOR.w / 2 + 2, 0, Math.PI, true); g.closePath(); inked(g, C.mint, 7);
  g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 9; k++) { g.save(); g.rotate(Math.PI + k * Math.PI / 9 + .1); g.fillRect(DOOR.w / 2, -8, 70, 16); g.restore(); } g.restore();
  g.beginPath(); g.arc(0, 0, DOOR.w / 2 + 62, Math.PI, 0); g.arc(0, 0, DOOR.w / 2 + 2, 0, Math.PI, true); g.closePath(); inked(g, null, 7); g.restore();
  wrapped(g, DOOR.x, top - DOOR.w / 2 - 70, 46, { body: C.butter, stripe: C.hot });
  lollipop(g, x0 - 32, top - 80, 40, { c1: C.hot }); lollipop(g, x1 + 32, top - 80, 40, { c1: C.lav, rot: 1 });
}

// ---------- boss ----------
function boss(g, t) {
  const born = popS((t - .55) / .3); if (born <= 0) return;
  const p = prog(t), env = pw(t, ENV), slide = -(99 - Math.min(99, env)) * 3.2;
  const swell = t > 3.25 ? 1 + .12 * sstep((t - 3.25) / (KILL - 3.25)) : 1;
  const { y, w, h } = BAR, x = BAR.x + slide, cx = x + w / 2, cy = y + h / 2;
  g.save(); g.translate(cx, GY); g.scale(born * swell, born * swell); g.translate(-cx, -GY);
  // gummy legs shuffling backwards (rolling back = walking left)
  for (let k = 0; k < 7; k++) { const lx = x + 50 + k * 70, ph = t * 14 + k * 1.1, dx = Math.sin(ph) * 10, up = Math.max(0, Math.cos(ph)) * 10;
    rrect(g, lx - 12 + dx * .5, y + h - 20, 24, GY - (y + h) + 14 - up, 12); inked(g, C.lav, 5); ell(g, lx + dx, GY - 4 - up, 22, 11); inked(g, C.hot, 5); }
  // glass capsule
  rrect(g, x, y, w, h, h / 2); inked(g, 'rgba(255,255,255,.55)', 8);
  const fx = x + 14, fw = (w - 28) * p / 100, r = (h - 28) / 2, fy = y + 14;
  g.save(); rrect(g, x + 10, y + 10, w - 20, h - 20, h / 2 - 10); g.clip();
  // caterpillar body: humps up to the head
  const n = Math.max(1, Math.round(fw / 62));
  for (let k = 0; k < n; k++) { const hx = fx + r + k * (fw - 2 * r) / Math.max(1, n - 1) * (n > 1 ? 1 : 0), wob = Math.sin(t * 16 - k * .8) * 5;
    circ(g, hx, fy + r + wob, r + 4); inked(g, k % 2 ? C.pink : C.hot, 5); g.fillStyle = 'rgba(255,255,255,.45)'; ell(g, hx - r * .3, fy + r * .45 + wob, r * .35, r * .14, -.3); g.fill(); }
  g.restore();
  // head at the progress edge (inside the tube, eyes on the hero)
  const hx = fx + fw - r, hy = fy + r, hk = HITS.reduce((m, hh) => (t >= hh ? t - hh : m), 9), sq = 1 - .12 * Math.exp(-hk / .06);
  g.save(); g.translate(hx, hy); g.scale(sq, 2 - sq); circ(g, 0, 0, r + 8); inked(g, C.cherry, 6);
  for (const ex of [-34, 14]) { ell(g, ex, -16, 22, 26); inked(g, '#fff', 4); circ(g, ex - 8, -10, 11); g.fillStyle = INK; g.fill(); circ(g, ex - 11, -14, 4); g.fillStyle = '#fff'; g.fill(); }
  g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-58, -48); g.lineTo(-18, -36); g.moveTo(38, -48); g.lineTo(0, -36); g.stroke();
  g.beginPath(); g.moveTo(-34, 38); for (let k = 1; k <= 4; k++) g.lineTo(-34 + k * 14, 38 + (k % 2 ? -7 : 0)); g.stroke();
  g.fillStyle = 'rgba(252,135,197,.6)'; ell(g, -58, 18, 12, 7); g.fill(); ell(g, 34, 18, 12, 7); g.fill();
  if (t > 2.6) { const a = (t * 2.5) % 1; g.globalAlpha = 1 - a; g.beginPath(); g.ellipse(52, -60 + a * 30, 8, 12, 0, 0, TAU); inked(g, C.sky, 3); g.globalAlpha = 1; }   // sweat
  g.restore();
  // capsule gloss + rim on top
  rrect(g, x, y, w, h, h / 2); inked(g, null, 8);
  g.fillStyle = 'rgba(255,255,255,.75)'; rrect(g, x + 50, y + 18, w - 140, 16, 8); g.fill(); circ(g, x + w - 70, y + 26, 8); g.fill();
  // rollback motion lines behind the head
  const dp = prog(t) - prog(t - .05);
  if (dp < -.01) { g.strokeStyle = 'rgba(44,5,52,.45)'; g.lineWidth = 5; g.lineCap = 'round'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(hx + r + 24, hy - 40 + k * 40); g.lineTo(hx + r + 70, hy - 40 + k * 40); g.stroke(); } }
  // big «NN%» riding above the bar
  const pop = 1 + .22 * Math.exp(-hk / .1);
  g.save(); g.translate(cx, y - 30); g.scale(pop, pop); bubbleText(g, `${Math.floor(p)}%`, 0, 0, 150, { cols: t >= 3.29 ? [GREEN, C.mint] : [C.hot, C.butter, C.lav] }); g.restore();
  g.restore();
}
function burst(g, t) {   // candy confetti at KILL, pieces fall and stay on the floor
  const k = t - KILL; if (k < 0) return;
  const { x, y, w, h } = BAR, cx = x + w / 2, cy = y + h / 2;
  if (k < .45) { for (const [d, col] of [[0, C.butter], [.08, C.hot]]) { const q = clamp((k - d) / .35); if (q <= 0 || q >= 1) continue;   // shock rings
    g.globalAlpha = 1 - q; g.lineWidth = 30 * (1 - q) + 4; g.strokeStyle = col; ell(g, cx, cy, 80 + q * 620, 50 + q * 380); g.stroke(); g.globalAlpha = 1; }
    g.globalAlpha = .45 * Math.exp(-k / .12); const rg = g.createRadialGradient(cx, cy, 0, cx, cy, 600); rg.addColorStop(0, C.butterL); rg.addColorStop(1, 'rgba(253,243,195,0)');
    g.fillStyle = rg; g.fillRect(cx - 600, cy - 600, 1200, 1200); g.globalAlpha = 1; }
  const R = RNG(88), G = 2200;
  for (let i = 0; i < 150; i++) {
    const conf = i >= 70, x0 = x + R() * w, y0 = y + R() * h, a = -Math.PI / 2 + (R() - .5) * 2.6, v = 500 + R() * 1100;
    const vx = Math.cos(a) * v + (x0 - cx) * 1.2, vy = Math.sin(a) * v, rr = conf ? 0 : 18 + R() * 16, kind = Math.floor(R() * 5), spin = (R() - .5) * 14;
    const floor = GY - (conf ? 3 : rr * .6), tl = (-vy + Math.sqrt(vy * vy + 2 * G * (floor - y0))) / G, tt = Math.min(k, tl);
    const px = x0 + vx * tt * (conf ? .6 : 1), py = Math.min(floor, y0 + vy * tt + G * tt * tt / 2 * (conf ? .5 : 1)), rot = spin * tt;
    if (conf) { const fl = Math.cos(k * 12 + i); g.save(); g.translate(px + Math.sin(k * 6 + i) * 20, py); g.rotate(rot * 2); g.scale(1, fl);
      g.fillStyle = [C.butter, C.mint, C.lav, C.hot, C.sky, C.white][i % 6]; rrect(g, -11, -5, 22, 10, 4); g.fill(); g.restore(); continue; }
    if (kind === 0) wrapped(g, px, py, rr, { rot, body: [C.mint, C.butter, C.lav][i % 3] });
    else if (kind === 1) bean(g, px, py, rr * .8, [C.hot, C.butter, C.mint, C.sky][i % 4], rot);
    else if (kind === 2) konpeito(g, px, py, rr * .8, [C.lav, C.butter, C.pink][i % 3], rot);
    else if (kind === 3) heart(g, px, py, rr * .8, [C.hot, C.pink][i % 2], 4);
    else lollipop(g, px, py, rr * .8, { c1: [C.hot, C.lav, C.mint][i % 3], rot });
  }
  if (k < .7) { const s = popS(k / .2) * (1 + k * .5) * (k < .45 ? 1 : 1 - easeIO((k - .45) / .25));   // «100%» flies up and pops away (no alpha: bubble strokes go grey)
    g.save(); g.translate(cx, y - 30 - k * 260); g.scale(s, s); bubbleText(g, '100%', 0, 0, 150, { cols: [GREEN, C.mint, C.butter] }); g.restore(); }
}

// ---------- dragees ----------
function dragees(g, t) {
  const DC = [C.hot, C.mint, C.butter, C.lav, C.sky, C.peach];
  SHOTS.forEach((s, i) => {
    const d = t - s; if (d < 0) return; const hp = heroPose(s), m = brush(heroShapes({ ...hp, gun: false }), { ...hp, shot: 0 }).tip, h = HITS[i];
    const p = prog(h), tx = BAR.x - (99 - Math.min(99, pw(h, ENV))) * 3.2 + 14 + (BAR.w - 28) * p / 100 - 60, ty = BAR.y + 90 + (i % 3 - 1) * 26;
    if (d < FLY) { const k = d / FLY; for (let j = 2; j >= 0; j--) { const kk = Math.max(0, k - j * .12);
        g.globalAlpha = j ? .35 / j : 1; bean(g, lerp(m[0], tx, kk), lerp(m[1], ty, kk) - Math.sin(kk * Math.PI) * 20, 17 - j * 3, DC[i % 6], t * 20 + i); } g.globalAlpha = 1; return; }
    const e = d - FLY; if (e > .45) return;                                       // impact: sparkle + crumbs bouncing off
    if (e < .14) sparkle(g, tx + 20, ty, 50 * popS(e / .06) * (1 - e / .14) + 1, C.butter, 5);
    for (let c = 0; c < 3; c++) { const vx = -180 - c * 90, vy = -320 + c * 160; bean(g, tx + vx * e, ty + vy * e + 1400 * e * e / 2, 8, DC[(i + c) % 6], e * 12); }
  });
}

// ---------- level ----------
export default {
  async init() {
    const f = new FontFace('Fredoka', `url(${new URL('./L8/fonts/Fredoka.ttf', import.meta.url)})`, { weight: '300 700' });
    document.fonts.add(await f.load()); await document.fonts.load('700 40px Fredoka');
  },
  draw(g, t, S) {
    const { W } = S, cx = camX(t);
    g.lineJoin = g.lineCap = 'round';
    backdrop(g, t, W, cx);
    g.save(); g.translate(W / 2 - cx, 0);
    // floor
    bgCheck(g, cx - W / 2 - 60, GY, W + 120, 1080 - GY, { s: 60, c1: C.peach, c2: '#f59b7a', ox: -(cx - W / 2 - 60) });
    g.beginPath(); g.moveTo(cx - W, GY); g.lineTo(cx + W, GY); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    for (const lx of [1120, 1700]) lollipop(g, lx, GY - 150, 46, { c1: lx > 1500 ? C.lav : C.hot, rot: t });   // planted pops along the run
    arch(g, t);
    rail(g); strip(g, t); machine(g, t);
    // page «Б» flies in from the previous room and drops into the hopper
    if (t < .62) { const k = clamp(t / .45), x = lerp(-180, 130, easeO(k)), y = k < 1 ? lerp(60, 150, k) - Math.sin(k * Math.PI) * 60 : 150 + (t - .45) / .17 * 120;
      g.save(); g.beginPath(); g.rect(-2000, -500, 4000, 172 + 500); g.clip(); pageB(g, x, y, k < 1 ? .9 : .9 - (t - .45) * 1.5, (1 - k) * -1.2); g.restore(); }
    if (t < KILL) boss(g, t);
    burst(g, t);
    dragees(g, t);
    // loot reel
    const hp = heroPose(t);
    if (t >= DROP && t < GRAB) { const k = t - DROP, fall = clamp(k / .22), yg = GY - 62;
      const y = fall < 1 ? lerp(-140, yg, fall * fall) : yg - Math.abs(Math.sin((k - .22) * 14)) * 50 * Math.exp(-(k - .22) * 9);
      reel(g, 560, y, 54, fall < 1 ? k * 10 : 0, fall < 1 ? 0 : popS((k - .22) / .15));
      for (let s = 0; s < 4; s++) { const a = s * TAU / 4 + t * 3; if (fall >= 1) sparkle(g, 560 + Math.cos(a) * 110, y + Math.sin(a) * 70, 12 + 6 * Math.sin(t * 12 + s), C.butter, 3); } }
    const H = t < DIN ? drawHero(g, hp) : null;   // at DIN the hero is inside the opening (the next room covers it)
    if (H && t >= GRAB) { const k = easeO((t - GRAB) / .14), top = H.u2s(-20, -300), y0 = GY - 62, sc = hp.s / .62;   // big, held up over the head
      reel(g, lerp(560, top[0], k), lerp(y0, top[1], k), lerp(54, 84, k) * sc, Math.sin(t * 9) * .08 * k, sc); }
    g.restore();
  },
  door(t, S) { const cx = camX(t); return { x: DOOR.x - DOOR.w / 2 - cx + S.W / 2, y: DOOR.top, w: DOOR.w, h: GY - DOOR.top }; },
  bossHp(t) {
    if (t < SHOTS[0] || t > KILL + .4) return null; if (t >= KILL) return 0;
    let n = 0; for (const h of HITS) if (t >= h) n++; return clamp(1 - n / HITS.length * .92 - (t >= 3.29 ? .08 : 0));
  },
  events: [
    { t: .05, k: 'whoosh' }, { t: .55, k: 'click' },
    ...SHOTS.map(t => ({ t: +t.toFixed(4), k: 'shot' })), ...HITS.map(t => ({ t: +t.toFixed(4), k: 'hit' })),
    { t: KILL, k: 'kill' }, { t: SCAN0, k: 'scan' }, { t: SCAN1, k: 'ok' }, { t: DROP, k: 'whoosh' }, { t: GRAB, k: 'loot' }, { t: DIN, k: 'door' },
  ],
};
