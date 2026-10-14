// L8/candy_kit.js — the candy_pop kit from the clipforge harness (own code), as an ES module.
//   Fredoka.ttf: SIL OFL 1.1 (fonts/).
// candy.js: candy_pop kit — kawaii candy-pop motion graphics drawn by code (canvas 2D). Plain script, globals.
// Palette measured from the reference with refs.mjs (idea of measure->STYLE numbers: cth9191/animate, MIT).
// Every function draws at the current transform; sizes are in px of the 1080 frame.
const INK = '#2c0534';            // line colour: deep plum, never black
const C = {
  hot: '#fc3293', pink: '#fc87c5', blush: '#fccce5', lav: '#c4b2fd', lavL: '#e4d8fd', butter: '#fdec8a',
  butterL: '#fdf3c3', mint: '#95edcb', peach: '#febda0', cream: '#fcf6fa', cherry: '#fd4163', sky: '#a9d8fd',
  night: '#100316', skin: '#ffe3cf', white: '#ffffff',
};
const LW = 7;                     // main outline at 1080 (ref: ~2.5px at 360p)
const TAU = Math.PI * 2;

// deterministic rng (mulberry32)
function RNG(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// fill + plum outline of the current path
function inked(g, fill, lw = LW) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = g.lineCap = 'round'; g.stroke(); } }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); }
function ell(g, x, y, rx, ry, a = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), a, 0, TAU); }

// ---------- backgrounds (fill the rect x,y,w,h; caller clips if needed) ----------
function bgSunburst(g, x, y, w, h, { cx = x + w / 2, cy = y + h / 2, rays = 24, c1 = C.hot, c2 = C.pink, rot = 0 } = {}) {
  g.fillStyle = c2; g.fillRect(x, y, w, h);
  const R = Math.hypot(w, h) * 1.2; g.fillStyle = c1;
  for (let i = 0; i < rays; i++) {
    const a = rot + i * TAU / rays; g.beginPath(); g.moveTo(cx, cy);
    g.arc(cx, cy, R, a, a + TAU / rays / 2); g.closePath(); g.fill();
  }
  const rg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .55);   // soft white core like the ref
  rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x, y, w, h);
}
function bgCheck(g, x, y, w, h, { s = 60, c1 = C.cream, c2 = C.butter, ox = 0, oy = 0 } = {}) {   // gingham
  g.fillStyle = c1; g.fillRect(x, y, w, h); g.fillStyle = c2; g.globalAlpha = .6;
  for (let i = -1; i * s < w + s; i++) if (i % 2 === 0) g.fillRect(x + i * s + (ox % (2 * s)), y, s, h);
  for (let j = -1; j * s < h + s; j++) if (j % 2 === 0) g.fillRect(x, y + j * s + (oy % (2 * s)), w, s);
  g.globalAlpha = 1;
}
function bgDots(g, x, y, w, h, { s = 44, r = 9, c1 = C.lavL, c2 = C.lav, ox = 0, oy = 0 } = {}) {
  g.fillStyle = c1; g.fillRect(x, y, w, h); g.fillStyle = c2;
  for (let j = -1; j * s < h + s; j++) for (let i = -1; i * s < w + s; i++) {
    circ(g, x + i * s + (j % 2 ? s / 2 : 0) + (ox % s), y + j * s + (oy % s), r); g.fill();
  }
}
function bgStripes(g, x, y, w, h, { s = 40, c1 = C.mint, c2 = '#bdf5df', ang = -Math.PI / 4, off = 0 } = {}) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = c1; g.fillRect(x, y, w, h);
  g.translate(x + w / 2, y + h / 2); g.rotate(ang); g.fillStyle = c2; const R = Math.hypot(w, h);
  for (let i = -R; i < R; i += 2 * s) g.fillRect(i + (off % (2 * s)), -R, s, 2 * R);
  g.restore();
}
function bgSky(g, x, y, w, h, { top = C.lavL, bot = C.blush } = {}) {
  const lg = g.createLinearGradient(0, y, 0, y + h); lg.addColorStop(0, top); lg.addColorStop(1, bot);
  g.fillStyle = lg; g.fillRect(x, y, w, h);
}

// ---------- cute things ----------
function face(g, x, y, s = 1, { mood = 'smile', blush = true } = {}) {   // dot eyes + mouth, centred at x,y
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = 3.5;
  if (mood === 'happy') { for (const ex of [-14, 14]) { g.beginPath(); g.arc(ex, 2, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
  else for (const ex of [-14, 14]) { ell(g, ex, 0, 3.6, 4.6); g.fill(); }
  g.beginPath(); if (mood === 'o') { ell(g, 0, 10, 3.5, 4.5); g.fill(); } else { g.arc(0, 7, 5, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
  if (blush) { g.fillStyle = 'rgba(252,50,147,.35)'; ell(g, -24, 9, 6, 3.5); g.fill(); ell(g, 24, 9, 6, 3.5); g.fill(); }
  g.restore();
}
function cloud(g, x, y, s = 1, { fill = C.white, faced = true, mood } = {}) {
  const B = [[-46, 8, 26], [-16, -10, 34], [22, -6, 30], [48, 10, 22], [0, 14, 30]];
  g.save(); g.translate(x, y); g.scale(s, s);
  g.lineWidth = LW * 2 / s; g.strokeStyle = INK; for (const [a, b, r] of B) { circ(g, a, b, r); g.stroke(); }   // union outline:
  g.fillStyle = fill; for (const [a, b, r] of B) { circ(g, a, b, r); g.fill(); }                                   // fat stroke, then fills
  if (faced) face(g, 0, 8, .8, { mood });
  g.restore();
}
function heartPath(g, x, y, r) {
  g.beginPath(); g.moveTo(x, y + r * .9);
  g.bezierCurveTo(x - r * 1.5, y - r * .1, x - r * .7, y - r * 1.2, x, y - r * .45);
  g.bezierCurveTo(x + r * .7, y - r * 1.2, x + r * 1.5, y - r * .1, x, y + r * .9); g.closePath();
}
function heart(g, x, y, r, fill = C.hot, lw = LW * .8) {
  heartPath(g, x, y, r); inked(g, fill, lw);
  g.fillStyle = 'rgba(255,255,255,.75)'; ell(g, x - r * .45, y - r * .45, r * .18, r * .1, -.6); g.fill();
}
function sparkle(g, x, y, r, fill = C.butter, lw = 4) {   // 4-point twinkle
  g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 - Math.PI / 2, rr = i % 2 ? r * .3 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); inked(g, fill, lw);
}

// ---------- candies ----------
function lollipop(g, x, y, r, { c1 = C.hot, c2 = C.cream, rot = 0 } = {}) {
  g.save(); g.translate(x, y);
  rrect(g, -r * .09, r * .7, r * .18, r * 1.6, r * .09); inked(g, C.cream, LW * .8);
  circ(g, 0, 0, r); inked(g, c2, 0);
  g.save(); circ(g, 0, 0, r); g.clip(); g.rotate(rot); g.strokeStyle = c1; g.lineWidth = r * .22; g.lineCap = 'round';
  g.beginPath(); for (let a = 0; a < 5.2 * Math.PI; a += .1) { const rr = r * a / (5 * Math.PI); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); g.restore();
  circ(g, 0, 0, r); inked(g, null);
  g.fillStyle = 'rgba(255,255,255,.8)'; ell(g, -r * .45, -r * .5, r * .2, r * .11, -.7); g.fill();
  g.restore();
}
function wrapped(g, x, y, r, { body = C.butter, stripe = C.hot, rot = 0 } = {}) {   // wrapped bonbon with twist ends
  g.save(); g.translate(x, y); g.rotate(rot);
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * r * .85, 0); g.lineTo(sx * r * 1.7, -r * .6); g.quadraticCurveTo(sx * r * 1.5, 0, sx * r * 1.7, r * .6); g.closePath(); inked(g, body, LW * .8); }
  ell(g, 0, 0, r, r * .72); inked(g, body, 0);
  g.save(); ell(g, 0, 0, r, r * .72); g.clip(); g.fillStyle = stripe;
  for (let i = -3; i <= 3; i++) { g.save(); g.translate(i * r * .5, 0); g.rotate(.5); g.fillRect(-r * .1, -r, r * .2, 2 * r); g.restore(); } g.restore();
  ell(g, 0, 0, r, r * .72); inked(g, null);
  g.fillStyle = 'rgba(255,255,255,.8)'; ell(g, -r * .4, -r * .38, r * .22, r * .1, -.3); g.fill();
  g.restore();
}
function gummy(g, x, y, s, fill = C.mint) {   // gummy bear, translucent jelly
  g.save(); g.translate(x, y); g.scale(s, s);
  const parts = [[-16, -40, 10], [16, -40, 10], [0, -26, 22], [0, 12, 28], [-26, -2, 9], [26, -2, 9], [-16, 36, 11], [16, 36, 11]];
  g.lineWidth = LW * 2 / s; g.strokeStyle = INK; for (const [a, b, r] of parts) { circ(g, a, b, r); g.stroke(); }
  g.fillStyle = fill; for (const [a, b, r] of parts) { circ(g, a, b, r); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, 0, 14, 16, 18); g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)'; ell(g, -10, -34, 5, 3, -.5); g.fill(); ell(g, -12, 0, 6, 3.5, -.6); g.fill();
  face(g, 0, -26, .55, { blush: false });
  g.restore();
}
function bean(g, x, y, r, fill, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); rrect(g, -r, -r * .62, 2 * r, r * 1.24, r * .62); inked(g, fill, LW * .7);
  g.fillStyle = 'rgba(255,255,255,.8)'; ell(g, -r * .35, -r * .25, r * .32, r * .13); g.fill(); g.restore();
}
function konpeito(g, x, y, r, fill = C.lav, rot = 0) {   // bumpy sugar star
  g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
  const n = 10; for (let i = 0; i <= n * 8; i++) { const a = i * TAU / (n * 8), k = (i % 8) / 8, rr = r * (.78 + .22 * Math.cos(k * TAU)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); inked(g, fill, LW * .7);
  g.fillStyle = 'rgba(255,255,255,.75)'; circ(g, -r * .3, -r * .3, r * .18); g.fill(); g.restore();
}

// ---------- Japanese stickers ----------
function sticker(g, x, y, r, text, { fill = C.butter, color = INK, rot = 0, font = 'Mochiy Pop One' } = {}) {   // round die-cut sticker
  if (r < 12) return;
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(44,5,52,.25)'; circ(g, 5, 7, r + 9); g.fill();
  circ(g, 0, 0, r + 9); g.fillStyle = C.white; g.fill();
  circ(g, 0, 0, r); inked(g, fill, LW * .7);
  g.setLineDash([6, 8]); g.lineWidth = 3; g.strokeStyle = 'rgba(44,5,52,.5)'; circ(g, 0, 0, r - 10); g.stroke(); g.setLineDash([]);
  g.fillStyle = color; g.font = `${Math.round(r * .55)}px "${font}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 2);
  g.restore();
}
function hanko(g, x, y, s, text, rot = -.12) {   // red seal stamp, rough edge
  g.save(); g.translate(x, y); g.rotate(rot); const R = RNG(text.charCodeAt(0));
  g.strokeStyle = C.cherry; g.lineWidth = 6; g.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40, side = Math.floor(t * 4) % 4, u = (t * 4) % 1, h = s / 2, j = (R() - .5) * 3;
    const p = [[-h + u * s, -h], [h, -h + u * s], [h - u * s, h], [-h, h - u * s]][side]; g.lineTo(p[0] + j, p[1] + j); }
  g.closePath(); g.stroke();
  g.fillStyle = C.cherry; g.font = `${Math.round(s * .62)}px "Dela Gothic One"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3);
  g.restore();
}
function tag(g, x, y, text, { fill = C.butter, size = 34, rot = -.08, font = 'Fredoka' } = {}) {   // pill label "oh-oh-oh!"
  g.save(); g.translate(x, y); g.rotate(rot); g.font = `600 ${size}px "${font}"`; const w = g.measureText(text).width + size * 1.1;
  g.fillStyle = INK; rrect(g, -w / 2 + 4, -size * .75 + 6, w, size * 1.5, size * .75); g.fill();
  rrect(g, -w / 2, -size * .75, w, size * 1.5, size * .75); inked(g, fill, LW * .7);
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 2); g.restore();
}

// ---------- bubble type: each glyph = shadow + fat plum stroke + pastel fill + gloss ----------
const BUBBLE_COLS = [C.pink, C.butter, C.mint, C.lav, C.peach, C.sky];
// opts.pop(i) -> {dy, s, rot} per glyph for bounce animations
function bubbleText(g, text, x, y, size, { font = '700 {s}px Fredoka', cols = BUBBLE_COLS, align = 'center', track = .02, pop, ci = 0 } = {}) {
  const f = font.replace('{s}', Math.round(size)); g.font = f;
  const chars = [...text], ws = chars.map(ch => g.measureText(ch).width + size * track), W = ws.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - W / 2 : align === 'right' ? x - W : x;
  g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.lineJoin = 'round';
  chars.forEach((ch, i) => {
    const p = pop ? pop(i) : { dy: 0, s: 1, rot: 0 }; const w = ws[i];
    if (ch !== ' ' && p.s > 0.001) {
      g.save(); g.translate(cx + w / 2, y + p.dy); g.rotate(p.rot || 0); g.scale(p.s, p.s); g.font = f;
      const ox = -w / 2 + size * track / 2;
      g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = size * .2;
      g.strokeText(ch, ox + size * .05, size * .07); g.fillText(ch, ox + size * .05, size * .07);   // drop shadow / extrude
      g.strokeText(ch, ox, 0);
      g.lineWidth = size * .09; g.strokeStyle = C.white; g.strokeText(ch, ox, 0);                     // white rim inside the plum
      const col = cols[(i + ci) % cols.length]; g.fillStyle = col; g.fillText(ch, ox, 0);
      g.fillStyle = 'rgba(255,255,255,.85)'; ell(g, ox + w * .3, -size * .55, size * .07, size * .035, -.5); g.fill();
      g.restore();
    }
    cx += w;
  });
  return W;
}

// ---------- hero A: «Mii» — big round head, bean body, separated simple limbs ----------
// pose: {t (s, for idle), jump 0..1, wave 0..1, look -1..1, mood}
function heroMii(g, x, y, s = 1, pose = {}) {   // x,y = feet centre on the ground
  const { t = 0, jump = 0, wave = 0, mood = 'smile' } = pose, bob = Math.sin(t * TAU * .9) * 2.5, j = -Math.sin(jump * Math.PI) * 60;
  g.save(); g.translate(x, y + j); g.scale(s, s);
  g.fillStyle = 'rgba(44,5,52,.18)'; ell(g, 0, -j / s * 0 + 4, 46 * (1 - jump * .4), 9); g.fill();
  // legs + shoes
  for (const sx of [-1, 1]) { rrect(g, sx * 16 - 8, -46, 16, 34, 8); inked(g, C.lav, LW * .8); ell(g, sx * 18, -12, 15, 10); inked(g, C.cherry, LW * .8); }
  // arms (behind/side)
  const wa = wave * (1.6 + Math.sin(t * TAU * 3) * .35);
  for (const sx of [-1, 1]) { g.save(); g.translate(sx * 34, -108 + bob); g.rotate(-sx * (.5 + (sx > 0 ? wa : 0)));
    rrect(g, -8, 0, 16, 40, 8); inked(g, C.hot, LW * .8); circ(g, 0, 44, 10); inked(g, C.skin, LW * .8); g.restore(); }
  // hoodie body
  rrect(g, -38, -118 + bob, 76, 78, 30); inked(g, C.hot);
  rrect(g, -18, -80 + bob, 36, 18, 8); inked(g, '#e0247f', LW * .6);                                  // pocket
  // head
  const hy = -178 + bob;
  circ(g, 0, hy, 62); inked(g, C.skin);
  g.save(); circ(g, 0, hy, 62); g.clip();                                                              // hair cap (lavender, like the ref girl)
  g.beginPath(); g.moveTo(-70, hy + 10); g.quadraticCurveTo(-60, hy - 80, 0, hy - 74); g.quadraticCurveTo(60, hy - 80, 70, hy + 10);
  g.quadraticCurveTo(40, hy - 34, 8, hy - 30); g.quadraticCurveTo(-20, hy - 40, -70, hy + 10); g.fillStyle = '#9b7ff0'; g.fill(); g.restore();
  circ(g, 0, hy, 62); inked(g, null);
  g.fillStyle = 'rgba(255,255,255,.6)'; ell(g, -30, hy - 48, 10, 5, -.5); g.fill();
  face(g, 0, hy + 14, 1.15, { mood });
  g.restore();
}

// ---------- hero B: «Puni» — THE hero (locked model sheet). One ball body (Kirby roundness) in a lavender cat-ear hood ----------
// pose: t (s, idle breath + blink), jump 0..1 (arc), squash -1..1, arms 0 down..1 up (cheer), wave 0..1, look -1..1 (eyes),
// mood smile|happy|o|sleep|love|sad, lean (rad). Proportions never change: hood r76, face r52, ears, feet — no jitter.
function puniEyes(g, mood, look, t) {
  const blink = mood === 'smile' && (t % 3.7) > 3.58, lx = look * 5;
  g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 4; g.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const ex = sx * 16 + lx;
    if (mood === 'happy') { g.beginPath(); g.arc(ex, -66, 8, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else if (mood === 'sleep' || blink) { g.beginPath(); g.arc(ex, -74, 8, Math.PI * .15, Math.PI * .85); g.stroke(); }
    else if (mood === 'love') { heart(g, ex, -70, 11, C.hot, 3); }
    else { ell(g, ex, -70, 7.5, 13); g.fillStyle = INK; g.fill(); ell(g, ex - 1, -76, 3.2, 5); g.fillStyle = C.white; g.fill(); g.fillStyle = INK;
      if (mood === 'sad') { g.beginPath(); g.moveTo(ex - sx * 10, -90); g.lineTo(ex + sx * 4, -86); g.stroke(); } }
  }
  g.fillStyle = 'rgba(252,50,147,.4)'; ell(g, -32, -56, 9, 5); g.fill(); ell(g, 32, -56, 9, 5); g.fill();
  g.fillStyle = INK; g.beginPath();
  if (mood === 'o') { ell(g, lx * .5, -50, 6, 8); g.fill(); }
  else if (mood === 'sleep') { ell(g, 0, -52, 4, 3); g.fill(); }
  else if (mood === 'sad') { g.arc(0, -48, 6, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
  else { g.arc(lx * .5, -56, mood === 'happy' || mood === 'love' ? 9 : 6, .1 * Math.PI, .9 * Math.PI); mood === 'happy' || mood === 'love' ? (g.closePath(), g.fillStyle = C.cherry, g.fill(), g.stroke()) : g.stroke(); }
}
function heroPuni(g, x, y, s = 1, pose = {}) {
  const { t = 0, jump = 0, mood = 'smile', squash = 0, arms = 0, wave = 0, look = 0, lean = 0 } = pose;
  const br = Math.sin(t * TAU * .9) * .025, j = -Math.sin(Math.min(1, Math.max(0, jump)) * Math.PI) * 90;
  const sq = 1 + squash * .22 + br, sy = 1 / sq;
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(44,5,52,.18)'; ell(g, 0, 4, 60 * s * (1 + j / 300), 10 * s); g.fill();
  g.translate(0, j); g.rotate(lean); g.scale(s * sq, s * sy);
  for (const sx of [-1, 1]) { ell(g, sx * 30, -10, 26, 14, sx * -.15); inked(g, C.cherry); }               // feet
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 28, -150); g.lineTo(sx * 58, -186); g.lineTo(sx * 66, -132); g.closePath(); inked(g, C.lav); // ears
    g.beginPath(); g.moveTo(sx * 38, -148); g.lineTo(sx * 56, -170); g.lineTo(sx * 58, -140); g.closePath(); g.fillStyle = C.blush; g.fill(); }
  // stub arms: angle 0 = side, arms 1 = up; right arm also waves
  for (const sx of [-1, 1]) { const a = arms * 1.9 + (sx > 0 ? wave * (1.6 + Math.sin(t * TAU * 3) * .4) : 0);
    g.save(); g.translate(sx * 64, -78); g.rotate(-sx * a); ell(g, sx * 12, 6, 17, 13, sx * .5); inked(g, C.lav); g.restore(); }
  circ(g, 0, -82, 76); inked(g, C.lav);                                                                       // hood ball
  circ(g, 0, -76, 52); inked(g, C.skin, LW * .8);                                                              // face opening
  g.fillStyle = '#9b7ff0'; g.beginPath(); g.arc(0, -76, 50, Math.PI * 1.1, Math.PI * 1.9); g.quadraticCurveTo(0, -100, -42, -100); g.fill(); // bangs
  puniEyes(g, mood, look, t);
  g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, -44, -130, 12, 6, -.6); g.fill();
  g.restore();
}

// ---------- hero C: «Pico» — 8-bit sprite, crisp pixels, plum outline built into the map ----------
const PICO_PAL = { k: INK, s: C.skin, h: '#9b7ff0', p: C.hot, P: '#e0247f', w: C.white, b: C.lav, r: C.cherry, c: 'rgba(252,50,147,.55)' };
const PICO = [
  '....kkkkkk....',
  '...khhhhhhk...',
  '..khhhhhhhhk..',
  '.khhhhhhhhhhk.',
  '.khhssshhsshk.',
  '.khsssssssshk.',
  '.kssksssskssk.',
  '.kssksssskssk.',
  '.kcssssssssck.',
  '..kssskkssk...',
  '...kkssssk....',
  '..kppppppppk..',
  '.kspPppppPpsk.',
  '.ksppppppppsk.',
  '..kppppppppk..',
  '...kbbkkbbk...',
  '...kbbk.kbbk..',
  '..krrrk.krrrk.',
  '..kkkkk.kkkkk.',
];
function heroPico(g, x, y, px = 10, pose = {}) {   // x,y = feet centre
  const { jump = 0, t = 0 } = pose, j = -Math.sin(jump * Math.PI) * 70, bob = Math.floor(t * 4) % 2 ? -px : 0;   // stepped bob: 8-bit honesty
  const rows = PICO, W = rows[0].length * px, H = rows.length * px;
  g.save(); g.translate(Math.round(x - W / 2), Math.round(y - H + j + (jump ? 0 : bob)));
  g.fillStyle = 'rgba(44,5,52,.18)'; g.fillRect(px * 2, H - j - bob, W - px * 4, px * .8);
  rows.forEach((r, yy) => [...r].forEach((ch, xx) => { if (PICO_PAL[ch]) { g.fillStyle = PICO_PAL[ch]; g.fillRect(xx * px, yy * px, px, px); } }));
  g.restore();
}

// ---------- co-star: the cat «Neko» (the track is sung by a cat). Locked: white, peach patch on the left ear, plum line ----------
// opts: t, mood (smile|happy|o|sleep|love|angry), mode sit|walk|stretch|curl|back, crown, k (stretch 0..1), punch 0..1
function neko(g, x, y, s = 1, { t = 0, mood = 'smile', fill = C.white, mode = 'sit', crown = false, k = 0, punch = 0, look = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const tw = Math.sin(t * TAU * .7) * .3, walk = mode === 'walk' ? Math.abs(Math.sin(t * TAU * 1.8)) * -8 : 0;
  g.translate(0, walk);
  g.fillStyle = 'rgba(44,5,52,.16)'; ell(g, 0, 2 - walk, 46 + k * 60, 8); g.fill();
  if (mode === 'curl') {   // sleeping ball, tail wrapped
    ell(g, 0, -30, 54, 32); inked(g, fill);
    g.beginPath(); g.moveTo(40, -10); g.quadraticCurveTo(10, 10, -40, -6); g.lineWidth = 14; g.strokeStyle = INK; g.stroke(); g.lineWidth = 6; g.strokeStyle = fill; g.stroke();
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(-30 + sx * 12, -54); g.lineTo(-30 + sx * 20, -78); g.lineTo(-30 + sx * 26 + 6, -50); g.closePath(); inked(g, fill); }
    g.fillStyle = C.peach; ell(g, -44, -62, 8, 6, .4); g.fill();
    face(g, -26, -34, .7, { mood: 'happy' }); g.restore(); return;
  }
  const bodyW = 40 + k * 60, headX = mode === 'stretch' ? -k * 50 : 0, headY = mode === 'stretch' ? k * 30 : 0;
  g.save(); g.translate(34 + k * 50, -24); g.rotate(-.6 + tw - k * .5); rrect(g, -6, -50, 12, 54, 6); inked(g, fill, LW * .8); g.restore();   // tail
  if (mode === 'walk' || mode === 'stretch') for (const lx of [-24 - k * 50, -8 - k * 30, 14 + k * 30, 28 + k * 50]) { const ph = mode === 'walk' ? Math.sin(t * TAU * 1.8 + lx) * 6 : 0;
    rrect(g, lx - 6 + ph, -24, 12, 26, 6); inked(g, fill, LW * .7); }
  ell(g, k * 10, -28 + k * 6, bodyW, 30 - k * 8); inked(g, fill);                                                     // body
  if (punch > 0) { const L2 = 30 + punch * 185; g.save(); g.translate(20, -50); g.rotate(-1.78); rrect(g, -8, 0, 16, L2, 8); inked(g, fill, LW * .8);
    circ(g, 0, L2 + 4, 15); inked(g, fill, LW * .8); g.fillStyle = C.pink; circ(g, 0, L2 + 8, 5); g.fill(); g.restore(); }
  g.save(); g.translate(headX, headY);
  if (mode === 'back') {   // turned away: no face, ears + back of head (ツーン)
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 16, -88); g.lineTo(sx * 34, -112); g.lineTo(sx * 40, -76); g.closePath(); inked(g, fill); }
    ell(g, 0, -70, 44, 34); inked(g, fill); g.fillStyle = C.peach; ell(g, 30, -88, 10, 8, -.4); g.fill();
  } else {
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 16, -88); g.lineTo(sx * 34, -112); g.lineTo(sx * 40, -76); g.closePath(); inked(g, fill); }
    ell(g, 0, -70, 44, 34); inked(g, fill);
    g.fillStyle = C.peach; ell(g, -30, -88, 10, 8, .4); g.fill();
    if (mood === 'angry') { g.strokeStyle = INK; g.lineWidth = 3.5; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 22, -82); g.lineTo(sx * 8, -76); g.stroke(); } face(g, look * 4, -66, .9, { mood: 'o' }); }
    else if (mood === 'love') { heart(g, -12, -68, 7, C.hot, 2.5); heart(g, 12, -68, 7, C.hot, 2.5); }
    else face(g, look * 4, -66, .9, { mood: mood === 'sleep' ? 'happy' : mood });
    g.strokeStyle = INK; g.lineWidth = 2.5; for (const sx of [-1, 1]) for (const dy of [-4, 4]) { g.beginPath(); g.moveTo(sx * 30, -60 + dy); g.lineTo(sx * 52, -62 + dy * 2); g.stroke(); }
  }
  if (crown) { g.save(); g.translate(0, -106); g.beginPath(); g.moveTo(-26, 0); g.lineTo(-30, -30); g.lineTo(-13, -14); g.lineTo(0, -36); g.lineTo(13, -14); g.lineTo(30, -30); g.lineTo(26, 0); g.closePath(); inked(g, C.butter, 5);
    g.fillStyle = C.hot; circ(g, 0, -10, 5); g.fill(); g.restore(); }
  g.restore(); g.restore();
}

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const easeIO = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const easeO = k => 1 - Math.pow(1 - clamp(k), 3);
function popS(k) { k = clamp(k); if (k <= 0) return 0; const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }   // back-out pop
function spring(k, w = 14, z = .35) { if (k <= 0) return 0; return 1 - Math.exp(-z * w * k) * Math.cos(w * Math.sqrt(1 - z * z) * k); }   // k in s
function gloss(g, x, y, rx, ry, a = -.5) { g.fillStyle = 'rgba(255,255,255,.75)'; ell(g, x, y, rx, ry, a); g.fill(); }
export { C, INK, LW, TAU, RNG, inked, rrect, circ, ell, bgSunburst, bgCheck, bgDots, bgStripes, sparkle, heart, lollipop, wrapped, bean, konpeito, gummy, bubbleText, clamp, lerp, easeIO, easeO, popS, spring, gloss };
