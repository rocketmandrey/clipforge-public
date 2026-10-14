// L1_track.js: уровень 1 «ТРЕК» (ingest), 4 такта = 6.667 с. Хук ролика: тёмный терминал печатает `$ clipforge suno.com/song/…`,
// Enter на b3 → пиксельная «рассыпка» терминала в 8 бит → NES-мир сырого трека: джунгли из проводов и кабелей (своё, не копия).
// Герой падает сверху (b4), вскрывает ящик SUNO одним выстрелом (b7 → kill b8), хватает кассету TRACK и несёт её в бункерную дверь.
// Техника: весь мир рисуется в low-res буфер (1 px = P экранных) целыми fillRect-ами и масштабируется nearest-neighbor;
// герой — NES-спрайт целыми прямоугольниками в той же сетке (пропорции hero.js), контур 1 px, без сглаживания.
import { pxText, pxWidth } from '../pixfont.js';
import { pxHero as hero } from '../pixhero.js';
import { BEAT as BT } from '../timeline.js';

const P = 5, HL = 216, GY = 158;                     // пиксель = 5 px; буфер 216 строк; земля (низ ног) y = 158 → 790 px
const T_ENTER = 3 * BT, T_FALL = 4 * BT, T_LAND = 2.0, T_SHOT = 7 * BT, T_KILL = 8 * BT, T_DROP = 10 * BT, T_GRAB = 11 * BT, T_DOOR = 6.0;
const CRATE = 200, DOOR = [315, 365, 88];            // мир в low-res единицах: центр ящика; проём двери x0, x1, верх
// NES-подобная палитра (+ цвета героя из hero.js)
const C = { k: '#000000', d1: '#004058', d2: '#005800', g1: '#006800', g2: '#00A800', g3: '#58D854', te: '#008888', gr: '#7C7C7C', lg: '#BCBCBC',
  wh: '#FCFCFC', br: '#503000', ob: '#AC7C00', rd: '#A81000', or: '#F83800', or2: '#E45C10', ye: '#F8B800', bl: '#0058F8', sk: '#3CBCFC', cr: '#FCE0A8' };
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- герой: ключи x(t) (линейно между ними), скорость → бег
const KX = [[0, 60], [T_LAND, 60], [2.5, 86], [T_SHOT - .1, 96], [3.5, 96], [T_GRAB, 196], [5.0, 198], [6.667, 410]];
const heroX = t => { if (t <= KX[0][0]) return KX[0][1]; for (let i = 1; i < KX.length; i++) if (t <= KX[i][0]) {
  const [t0, x0] = KX[i - 1], [t1, x1] = KX[i]; return x0 + (x1 - x0) * (t - t0) / (t1 - t0); } return KX.at(-1)[1]; };
const camC = t => { t = Math.min(t, T_DOOR); let s = 0; for (let i = 0; i < 12; i++) s += heroX(t - i * .045); return s / 12 + 45; };   // плавное следование, герой левее центра: виден и ящик, и дверь

// ---- примитивы low-res
const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (g, c, cx, cy, r) => { r = Math.round(r); for (let y = -r; y < r; y++) { const hw = Math.round(Math.sqrt(r * r - (y + .5) ** 2)); if (hw > 0) R(g, c, cx - hw, cy + y, hw * 2, 1); } };
const cable = (g, c, x0, y0, x1, y1, sag, th = 2) => {   // провисший провод (парабола), столбцы по 1 px
  const n = Math.max(1, Math.abs(Math.round(x1 - x0))); let py = null;
  for (let i = 0; i <= n; i++) { const u = i / n, x = Math.round(x0 + (x1 - x0) * u), y = Math.round(y0 + (y1 - y0) * u + sag * 4 * u * (1 - u));
    const top = py == null ? y : Math.min(y, py), bot = py == null ? y : Math.max(y, py); R(g, c, x, top, 1, bot - top + th); py = y; } };
const vine = (g, c, x, y0, len, sw, plug) => {   // свисающий кабель с вилкой на конце
  let ex = x; for (let y = 0; y < len; y++) { ex = x + Math.round(sw * (y / len) ** 2); R(g, c, ex, y0 + y, 2, 1); }
  if (plug) { const y = y0 + len; R(g, C.k, ex - 2, y - 1, 6, 6); R(g, plug, ex - 1, y, 4, 4); R(g, C.lg, ex - 1, y + 4, 1, 3); R(g, C.lg, ex + 2, y + 4, 1, 3); } };

// ---- мир (параллакс: звёзды 0.05, дальний 0.25, средний 0.6, земля 1, передний 1.3)
function world(g, t, cam, Wl) {
  R(g, C.k, 0, 0, Wl, HL); R(g, C.d1, 0, 70, Wl, HL);
  for (let y = 58; y < 70; y += 2) for (let x = (y / 2) % 2; x < Wl; x += 2) R(g, C.d1, x, y + ((x / 2) % 2 ? 1 : 0), 1, 1);   // дизеринг
  const sx = cam * .05; for (let i = 0; i < 40; i++) { const x = ((hash(i) * 600 - sx) % 600 + 600) % 600; if (x < Wl) R(g, hash(i + 9) > .7 ? C.wh : C.gr, x, 4 + hash(i + 3) * 48, 1, 1); }
  // дальний слой: силуэт крон + опоры с проводами
  const fx = cam * .25; for (let x = 0; x < Wl; x += 2) { const wx = x + fx, h = 92 + Math.round((Math.sin(wx * .045) * 9 + Math.sin(wx * .13 + 1) * 4) / 2) * 2; R(g, C.d2, x, h, 2, GY - h); }
  for (let i = Math.floor(fx / 90) - 1; i < (fx + Wl) / 90 + 1; i++) { const x = i * 90 - fx + 30, top = 58 + hash(i) * 14; R(g, C.k, x, top, 3, GY - top);
    cable(g, C.k, x + 1, top + 3, x + 91, 58 + hash(i + 1) * 14 + 3, 10, 1); cable(g, C.d1, x + 1, top + 9, x + 91, 58 + hash(i + 1) * 14 + 9, 14, 1); }
  // средний слой: деревья-кабели (стволы из перекрученных жил, кроны из петель, лианы-шнуры с вилками)
  const mx = cam * .6, cols = [C.rd, C.ye, C.bl, C.te];
  for (let i = Math.floor(mx / 64) - 1; i < (mx + Wl) / 64 + 1; i++) {
    const x = Math.round(i * 64 + hash(i * 7) * 20 - mx), w = 8 + Math.round(hash(i * 3) * 4);
    for (let y = 26; y < GY; y++) { const ph = Math.floor((y + i * 3) / 3) % 3; R(g, C.k, x - 1, y, w + 2, 1); R(g, ph === 0 ? C.g2 : ph === 1 ? C.g1 : C.d2, x, y, w, 1);
      R(g, C.g3, x + ((y + i) % w), y, 1, 1); }
    for (let r = 0; r < 3; r++) R(g, C.g2, x - 6 - r * 3, GY - 3 + r, w + 12 + r * 6, 1);   // корни
    const nx = Math.round((i + 1) * 64 + hash((i + 1) * 7) * 20 - mx);
    cable(g, C.g2, x + w / 2, 30, nx + 4, 32, 18 + hash(i) * 10, 2); cable(g, C.g1, x + w / 2, 22, nx + 4, 26, 30 + hash(i + 5) * 10, 2);
    cable(g, cols[i & 3 & 3], x + w, 40, nx, 44, 26 + hash(i + 2) * 12, 1);
    for (let k = 0; k < 3; k++) { const vx = x + w + 8 + k * 16 + Math.round(hash(i * 5 + k) * 6), len = 24 + Math.round(hash(i * 11 + k) * 46);
      vine(g, k === 1 ? cols[(i + k) & 3] : C.g2, vx, 30 + (k * 9) % 14, len, Math.round(Math.sin(t * 2.4 + i + k) * 3), k !== 2 ? C.gr : null); }
  }
  for (let x = 0; x < Wl; x++) { const wx = x + mx; R(g, C.g1, x, 0, 1, 10 + Math.round(Math.abs(Math.sin(wx * .09) * 8 + Math.sin(wx * .23) * 4))); }   // полог сверху
  // земля: трава из жил + грунт с дорожками платы
  R(g, C.k, 0, GY, Wl, 1); R(g, C.br, 0, GY + 1, Wl, HL - GY);
  for (let x = 0; x < Wl; x++) { const wx = Math.round(x + cam - Wl / 2); R(g, (wx >> 1) % 3 ? C.g2 : C.g3, x, GY - (hash(wx) > .8 ? 3 : 1), 1, hash(wx) > .8 ? 4 : 2); R(g, C.g1, x, GY + 1, 1, 2); }
  for (let j = 0; j < 4; j++) { const y = GY + 10 + j * 11;
    for (let i = Math.floor((cam - Wl) / 40) - 1; i < (cam + Wl) / 40 + 1; i++) { const x = Math.round(i * 40 + hash(i * 13 + j) * 20 - cam + Wl / 2);
      R(g, C.ob, x, y, 22, 1); R(g, C.ob, x + 21, y, 1, 5); R(g, C.ye, x - 1, y - 1, 3, 3); R(g, C.ob, x + 20, y + 5, 3, 3); } }
}

function front(g, t, cam, Wl) {   // передний слой 1.3: толстые кабели внизу кадра (зона подписей — только декор)
  const fx = cam * 1.3;
  for (let i = Math.floor(fx / 120) - 1; i < (fx + Wl) / 120 + 1; i++) { const x = i * 120 - fx + Wl / 2;
    cable(g, C.k, x - 70, HL - 4, x + 70, HL - 2, -16, 7); cable(g, i & 1 ? C.rd : C.g1, x - 70, HL - 3, x + 70, HL - 1, -16, 4); }
}

// ---- ящик SUNO с замком
function crate(g, x, t) {
  const x0 = x - 21, y0 = GY - 36; R(g, C.k, x0 - 1, y0 - 1, 44, 37); R(g, C.ob, x0, y0, 42, 35);
  for (let y = y0 + 6; y < GY; y += 7) R(g, C.br, x0, y, 42, 1);
  for (let i = 0; i < 35; i++) R(g, C.br, x0 + Math.round(i * 40 / 35), y0 + i, 2, 1);   // диагональная распорка
  for (const [cx, cy] of [[x0, y0], [x0 + 36, y0], [x0, GY - 7], [x0 + 36, GY - 7]]) { R(g, C.lg, cx, cy, 6, 6); R(g, C.gr, cx + 2, cy + 2, 2, 2); }
  R(g, C.k, x - 19, y0 + 5, 38, 11); R(g, C.wh, x - 18, y0 + 6, 36, 9);
  pxText(g, 'SUNO', x, y0 + 7, { size: 1, color: C.k, shadow: null, align: 'center' });
  // замок: дужка + корпус с личинкой
  R(g, C.k, x - 6, y0 + 15, 12, 7); R(g, C.lg, x - 5, y0 + 16, 10, 6); R(g, C.k, x - 3, y0 + 18, 6, 4);
  R(g, C.k, x - 8, y0 + 21, 16, 12); R(g, C.ye, x - 7, y0 + 22, 14, 10); R(g, C.ob, x - 7, y0 + 29, 14, 3); R(g, C.k, x - 1, y0 + 24, 2, 5);
}

// ---- кассета TRACK (s — крупность: 1 на земле, 1.4 в лапках)
function cassette(g, x, y, s = 1) {
  const u = v => Math.round(v * s), x0 = Math.round(x - u(12)), y0 = Math.round(y - u(8));
  R(g, C.k, x0 - 1, y0 - 1, u(24) + 2, u(16) + 2); R(g, C.gr, x0, y0, u(24), u(16)); R(g, C.cr, x0 + u(2), y0 + u(2), u(20), u(7));
  R(g, C.rd, x0 + u(2), y0 + u(2), u(20), u(2)); R(g, C.k, x0 + u(6), y0 + u(5), u(12), u(3)); R(g, C.wh, x0 + u(6), y0 + u(5), u(3), u(3)); R(g, C.wh, x0 + u(15), y0 + u(5), u(3), u(3));
  R(g, C.k, x0 + u(5), y0 + u(11), u(14), u(5)); R(g, '#4C4C4C', x0 + u(6), y0 + u(12), u(12), u(3));
}

// ---- взрыв: пиксельные круги и щепки
function boom(g, x, y, d) {
  if (d < 0 || d > .9) return;
  for (let i = 0; i < 7; i++) { const a = hash(i + 40) * 6.28, D = (i ? 10 + hash(i + 50) * 18 : 0) + d * 40, r = (i ? 13 : 22) * Math.min(1, .55 + d * 6) * clamp(1 - (d - .4 - hash(i) * .2) / .35, 0, 1);   // сразу крупно, потом тает
    if (r < 1) continue; const cx = x + Math.cos(a) * D, cy = y + Math.sin(a) * D * .7 - d * 20;
    const [o, n] = d < .08 ? [C.wh, C.wh] : d < .2 ? [C.ye, C.wh] : d < .38 ? [C.or, C.ye] : d < .6 ? [C.rd, C.or2] : [C.gr, C.lg];
    disc(g, C.k, cx, cy, r + 1); disc(g, o, cx, cy, r); disc(g, n, cx - r * .2, cy - r * .2, r * .55); }
  for (let i = 0; i < 8; i++) { const vx = (hash(i + 70) - .5) * 160, vy = -60 - hash(i + 80) * 90, px = x + vx * d, py = y + vy * d + 260 * d * d;
    if (py < GY) { R(g, C.k, px - 1, py - 1, 6, 4); R(g, C.ob, px, py, 4, 2); } }
}

// ---- терминал (полное разрешение)
const CMD = 'CLIPFORGE ', URL = 'SUNO.COM/SONG/…', TS = 7;
const typed = t => { const n = clamp(Math.floor((t - .1) / .05) + 1, 0, CMD.length); return CMD.slice(0, n) + (t >= .75 ? URL : ''); };
function terminal(c, t, W, H) {
  c.fillStyle = '#08080C'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 6) { c.fillStyle = '#0E0E16'; c.fillRect(0, y, W, 2); }   // строки развёртки
  const lw = pxWidth('$ ' + CMD + URL.slice(0, 6), TS), x0 = Math.round(W / 2 - Math.min(lw, W - 120) / 2), y1 = 430, y2 = y1 + 9 * TS + 20;
  pxText(c, 'CLIPFORGE · TRACK → CLIP', x0, y1 - 80, { size: 3, color: '#3C5C3C', shadow: null });
  const s = typed(t), l1 = s.slice(0, CMD.length), l2 = s.slice(CMD.length);
  pxText(c, '$', x0, y1, { size: TS, color: '#D87754', shadow: null });
  const xa = x0 + pxWidth('$ ', TS) + TS; pxText(c, l1, xa, y1, { size: TS, color: '#E0F8D0', shadow: null });
  if (l2) pxText(c, l2, xa, y2, { size: TS, color: '#E0F8D0', shadow: null });
  const cx = l2 ? xa + pxWidth(l2, TS) + TS : xa + (l1 ? pxWidth(l1, TS) + TS : 0), cy = l2 ? y2 : y1;
  if (t < .75 || Math.floor(t / .25) % 2 === 0) { c.fillStyle = '#E0F8D0'; c.fillRect(cx, cy - TS, TS * 6, TS * 9); }
}

// глитч-переход: терминал мозаикой ступенчато крупнеет и осыпается блоками, под ним уже 8-битный мир
let term = null, mos = null;
function glitch(c, t, W, H) {
  if (!term || term.width !== W) { term = new OffscreenCanvas(W, H); terminal(term.getContext('2d'), T_ENTER, W, H); mos = new OffscreenCanvas(W, H); }
  const d = t - T_ENTER, m = [1, 3, 6, 10, 15, 20, 30][Math.min(6, Math.floor(d / (1 / 24)))], BS = 60;
  const mc = mos.getContext('2d'); mc.imageSmoothingEnabled = false; mc.clearRect(0, 0, W, H); mc.drawImage(term, 0, 0, W / m, H / m);
  const NC = ['#00A800', '#004058', '#0058F8', '#F8B800', '#D87754', '#58D854'];
  c.imageSmoothingEnabled = false;
  for (let by = 0; by < H / BS; by++) for (let bx = 0; bx < Math.ceil(W / BS); bx++) {
    const id = by * 40 + bx, r = hash(id + 1), td = .04 + .3 * (.65 * r + .35 * (by / (H / BS))), a = d - td;
    if (a > .17) continue;
    const tear = d < .12 && hash(by + 300) > .7 ? Math.round((hash(by + 400) - .5) * 4) * 30 : 0, dy = a > 0 ? Math.round(2400 * a * a / 15) * 15 : 0;
    const X = bx * BS + tear, Y = by * BS + dy;
    if (a > 0 && hash(id + 7) > .55) { c.fillStyle = NC[Math.floor(hash(id + 9) * NC.length)]; c.fillRect(X, Y, BS, BS); }
    else c.drawImage(mos, bx * BS / m, by * BS / m, BS / m, BS / m, X, Y, BS, BS);
  }
}

let low = null;
export default {
  draw(ctx, t, S) {
    const { W, H } = S, Wl = Math.round(W / P);
    if (t < T_ENTER) { terminal(ctx, t, W, H); return; }
    if (!low || low.width !== Wl) low = new OffscreenCanvas(Wl, HL);
    const g = low.getContext('2d'); g.imageSmoothingEnabled = false;
    const cam = camC(t), ox = Math.round(cam - Wl / 2);        // экранный x = мировой x − ox
    world(g, t, cam, Wl);
    g.save(); g.translate(-ox, 0);
    // бункерная стена с дверью (мир, слой 1)
    const [dx0, dx1, dy] = DOOR; R(g, C.k, dx0 - 21, 55, 800, GY - 55);
    for (let y = 56, r = 0; y < GY; y += 12, r++) for (let x = dx0 - 20 + (r % 2) * 10; x < dx0 + 800; x += 20) { R(g, C.gr, x, y, 19, 11); R(g, C.lg, x, y, 19, 2); R(g, '#4C4C4C', x, y + 9, 19, 2); }
    cable(g, C.g2, dx0 - 30, 40, dx0 + 60, 52, 24, 2); cable(g, C.rd, dx0 + 10, 52, dx0 + 120, 50, 18, 1); vine(g, C.g2, dx0 + 70, 56, 30, 2, null);
    R(g, C.k, dx0 - 6, dy - 12, dx1 - dx0 + 12, GY - dy + 12);
    for (let y = dy - 11; y < GY; y++) for (let x = dx0 - 5; x < dx1 + 5; x++) if (x < dx0 || x >= dx1 || y < dy) R(g, ((x + y) >> 2) % 2 ? C.ye : C.k, x, y, 1, 1);
    R(g, '#0C0C14', dx0, dy, dx1 - dx0, GY - dy); R(g, C.d1, dx0, dy, dx1 - dx0, 2);
    R(g, Math.floor(t * 4) % 2 ? C.or : C.rd, (dx0 + dx1) / 2 - 3, dy - 20, 6, 6);   // лампа над дверью
    // ящик / взрыв / кассета
    if (t < T_KILL) crate(g, CRATE, t);
    else { R(g, C.k, CRATE - 22, GY - 3, 44, 3); boom(g, CRATE, GY - 18, t - T_KILL); }
    const jumpH = t < T_LAND ? 190 * (1 - ((t - T_FALL) / (T_LAND - T_FALL)) ** 2) : 0;
    const hx = heroX(t), sp = (heroX(t + .02) - heroX(t - .02)) / .04, run = clamp(sp / 90, 0, 1);
    const hold = t >= T_GRAB;
    const H0 = hero(g, { x: hx, y: GY, s: .126, t, run, face: 1, jump: Math.max(0, jumpH), shot: t >= T_SHOT ? t - T_SHOT : -1,
      eye: hold && t < 5.3 ? 'happy' : t >= T_SHOT - .2 && t < T_KILL ? 'squint' : t >= T_KILL && t < 3.8 ? 'wide' : 'open', armUp: hold ? 1 : 0 });
    if (t >= T_LAND && t < T_LAND + .3) { const d = t - T_LAND; for (const s of [-1, 1]) disc(g, C.lg, hx + s * (16 + d * 60), GY - 2 - d * 10, 4 * (1 - d / .3)); }
    if (t >= T_SHOT && t < T_KILL) { const m = [Math.round(heroX(T_SHOT)) + 40, GY - 7 - 27 + 18], u = (t - T_SHOT) / (T_KILL - T_SHOT), bx = m[0] + (CRATE - 20 - m[0]) * u;
      disc(g, C.k, bx, m[1], 4); disc(g, C.rd, bx, m[1], 3); disc(g, C.wh, bx, m[1], 1.5); }
    if (t >= T_KILL + .1) {   // кассета вылетает из взрыва, падает к lootDrop, подпрыгивает; с lootGrab — крупно в лапках
      if (!hold) { const u = clamp((t - T_KILL - .1) / (T_DROP - T_KILL - .1), 0, 1), b = t > T_DROP ? Math.abs(Math.sin((t - T_DROP) * 9)) * 6 * Math.max(0, 1 - (t - T_DROP) * 2.5) : 0;
        cassette(g, CRATE + 12 * u, GY - 9 - (70 * 4 * u * (1 - u)) - b, 1); }
      else { const [ax, ay] = H0.hold, p = clamp((t - T_GRAB) / .12, 0, 1); cassette(g, ax + 6 * (1 - p), ay - 4 - 6 * p, 1.4); }
    }
    g.restore();
    front(g, t, cam, Wl);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(low, 0, 0, Wl, HL, 0, 0, Wl * P, HL * P);
    if (t < T_FALL) glitch(ctx, t, W, H);
  },
  door(t, S) { const Wl = Math.round(S.W / P), ox = Math.round(camC(t) - Wl / 2); return { x: (DOOR[0] - ox) * P, y: DOOR[2] * P, w: (DOOR[1] - DOOR[0]) * P, h: (GY - DOOR[2]) * P }; },
  bossHp(t) { return t >= T_FALL && t < T_KILL + .4 ? (t < T_KILL ? 1 : 0) : null; },   // только пока ящик жив
  events: [
    ...[...CMD].map((_, i) => ({ t: .1 + i * .05, k: 'type' })), { t: .75, k: 'type' }, { t: T_ENTER, k: 'enter' },
    { t: T_LAND, k: 'jump' }, { t: T_SHOT, k: 'shot' }, { t: T_KILL, k: 'hit' }, { t: T_KILL, k: 'kill' }, { t: T_GRAB, k: 'loot' }, { t: T_DOOR, k: 'door' },
  ],
};
