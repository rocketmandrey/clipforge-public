// pixhero.js: Clawd-commando as a real NES sprite for the pixel scenes (L1 ТРЕК, L9 РЕЛИЗ) — v2, правка режиссёра: «Клоди инородный, гладкий, с ореолом». Только целые fillRect в сетке уровня,
// цвета палитры уровня, контур 1 px расширением маски, без сглаживания и полупрозрачности. Пропорции = hero.js при s = .126
// (тело 44×27, 4 ножки 3×7, глаза-щёлочки 3×7, лапки-обрубки за телом, бандана с двумя хвостами, бластер у низа тела).
// Кадры спрайта: бег 4 фазы (9.6 к/с = 4 на шаг), стойка, прыжок, выстрел (отдача + вспышка), «держит лут» (лапка вверх).
const SP = { o: '#E45C10', oh: '#F87858', os: '#A81000', b: '#D82800', bs: '#881400', e: '#000000', g: '#7C7C7C', gh: '#BCBCBC', gs: '#404040', f: '#F8B800', fw: '#FCFCFC' };
let hb = null;   // one sprite buffer; the sprite is drawn into the caller's low-res buffer at integer coords
export function pxHero(g, o) {   // o: x, y (feet, low-res px), t, run 0..1, jump px, shot s, eye, armUp, gun (default true)
  const cx = Math.round(o.x), gy = Math.round(o.y - (o.jump || 0)), run = o.run || 0, t = o.t || 0, air = (o.jump || 0) > 0;
  const fr = run > .3 && !air ? Math.floor(t * 9.6) % 4 : -1, bob = fr === 1 || fr === 3 ? 1 : 0;
  const shot = o.shot >= 0 && o.shot < .12, flash = o.shot >= 0 && o.shot < .08, rec = shot ? -2 : 0;
  const L = 48, T = 40, W = 100, Hh = 64;               // спрайт рисуется в локальный буфер, ноги на строке Hh-2, центр тела по x = L
  if (!hb) hb = new OffscreenCanvas(W, Hh);
  const h = hb.getContext('2d', { willReadFrequently: true }); h.clearRect(0, 0, W, Hh);
  const r = (c, x, y, w, hh) => { h.fillStyle = SP[c]; h.fillRect(x, y, w, hh); };
  const foot = Hh - 2, bot = foot - 7 - bob - (air ? 1 : 0), top = bot - 27;
  // хвосты банданы: 2 ленты по 2 px, машут в 2 кадра
  const wv = Math.floor(t * 8) % 2;
  r('b', L - 31, top + 2 + wv, 10, 2); r('b', L - 36, top + 3 + wv * 2, 6, 2); r('bs', L - 29, top + 5 - wv, 8, 2); r('bs', L - 33, top + 6, 5, 2);
  // задняя лапка: обрубок слева за телом; с лутом — вверх
  if (o.armUp) r('os', L - 24, top - 6, 5, 9); else r('os', L - 26, top + 11, 5, 6);
  // ножки: 3×7, ступенькой; бег — пары в противофазе, прыжок — врозь
  [-17, -9, 8, 16].forEach((dx, i) => {
    const A = i % 2 === 0; let k = 0, lift = 0;
    if (air) k = i < 2 ? -2 : 2;
    else if (fr === 0) k = A ? 2 : -2; else if (fr === 2) k = A ? -2 : 2; else if (fr === 1) lift = A ? 0 : 2; else if (fr === 3) lift = A ? 2 : 0;
    const x = L + dx - 1; r('os', x, bot, 3, 3); r('o', x + Math.sign(k), bot + 3, 3, 2 - lift + 1); r('o', x + k, bot + 5 - lift, 3, 2);
  });
  // тело: заливка + блик сверху + тень снизу/справа
  r('o', L - 22, top, 44, 27); r('oh', L - 21, top + 5, 40, 1); r('os', L - 22, bot - 2, 44, 2); r('os', L + 20, top + 5, 2, 20);
  // бандана поперёк верха
  r('b', L - 22, top, 44, 4); r('bs', L - 22, top + 4, 44, 1); r('oh', L - 18, top, 6, 1);
  // глаза
  const ex = run > .3 ? 1 : 0, eye = o.eye || 'open';
  for (const x0 of [L - 13 + ex, L + 8 + ex]) {
    if (eye === 'happy') { r('e', x0, top + 12, 1, 2); r('e', x0 + 1, top + 10, 1, 2); r('e', x0 + 2, top + 12, 1, 2); }
    else if (eye === 'squint') r('e', x0, top + 12, 3, 2);
    else if (eye === 'wide') r('e', x0, top + 7, 3, 9);
    else r('e', x0, top + 8, 3, 7);
  }
  // передняя лапка (за бластером) и бластер у низа тела
  r('os', L + 21 + rec, top + 13, 4, 6);
  if (o.gun !== false) { const gx = L + 14 + rec;
    r('g', gx, top + 16, 17, 5); r('gh', gx + 1, top + 16, 15, 1); r('gs', gx, top + 20, 17, 1); r('g', gx + 17, top + 17, 7, 3); r('gh', gx + 17, top + 17, 7, 1);
    r('gs', gx + 4, top + 21, 4, 4);
    if (flash) { r('f', gx + 25, top + 15, 5, 7); r('f', gx + 24, top + 17, 9, 3); r('fw', gx + 26, top + 17, 3, 3); }
  }
  // контур 1 px: прозрачный пиксель рядом с непрозрачным → чёрный (4-соседство), полупрозрачных нет
  const im = h.getImageData(0, 0, W, Hh), d = im.data, on = new Uint8Array(W * Hh);
  for (let i = 0; i < W * Hh; i++) on[i] = d[i * 4 + 3] > 0;
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (on[i]) continue;
    if ((x > 0 && on[i - 1]) || (x < W - 1 && on[i + 1]) || (y > 0 && on[i - W]) || (y < Hh - 1 && on[i + W])) { const k = i * 4; d[k] = d[k + 1] = d[k + 2] = 0; d[k + 3] = 255; } }
  h.putImageData(im, 0, 0);
  const ox = cx - L, oy = gy - foot; g.drawImage(hb, ox, oy);
  return { hold: [cx - 8, oy + top - 2], muzzle: [cx + 14 + 24 + 2, oy + top + 18] };
}
