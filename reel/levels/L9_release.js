// L9 «РЕЛИЗ» (финал): NES-пиксель. Сцена рисуется в маленький offscreen (шаг PX = 5), квантуется в палитру NES и
// растягивается nearest-neighbor; экран ТВ (нарезка уровней 2..8) и титр — поверх, в полном разрешении. Всё кодом, своё.
// b0–b3 герой с катушкой CLIP.MP4 → щель ТВ; b3–b10 клип в ТВ; b10–b14 три пиктограммы улетают; b14–b20 титр, искры.
// Без аркадных атрибутов (SHOWREEL.md, v3): ни 1UP, ни счёта; герой без бластера — финал мирный.
import { pxText } from '../pixfont.js';
import { pxHero } from '../pixhero.js';
import { PAL, quantize, sprite, PLANE, PLAY, CHEST, REEL } from './L9/pix.js';

const PX = 5, BEAT = 60 / 144, LH = 1080 / PX;
const T_INS = .8, T_ON = 1.25, T_CLIP1 = 4.167, LAUNCH = [4.167, 4.583, 5.0], FLY = .75, T_DARK = 5.667, T_TITLE = 5.833, T_HOLD = 7.833, T_SPARK = 7.083;
const TV = { x: 66, y: 40, w: 108, h: 104 }, SCR = { x: 74, y: 48, w: 92, h: 76 }, SLOT = [120, 133];   // lowres, square-frame coords
const HERO_X = 30, GROUND = 172;
const hash = (i, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
const lerp = (a, b, p) => a + (b - a) * p, cl = p => Math.max(0, Math.min(1, p));

let lo = null, loCtx = null;
const shots = new Map(), off = (() => { const c = document.createElement('canvas'); c.width = c.height = 1080; return c; })();
// one cached screen-size still per (level k, local t): the other level is drawn once at 1080² and downscaled
function still(segs, k, t) {
  const key = k + ':' + t.toFixed(3); let c = shots.get(key); if (c) return c;
  const g = segs.find(s => s.n === k), o = off.getContext('2d');
  o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, 1080, 1080);
  try { g.L.draw(o, t, { W: 1080, H: 1080, seg: g, segs }); } catch (e) { o.fillStyle = '#222'; o.fillRect(0, 0, 1080, 1080); }
  o.restore();
  c = document.createElement('canvas'); c.width = SCR.w * PX; c.height = SCR.w * PX;   // square crop source, cover-fit later
  const cc = c.getContext('2d'); cc.imageSmoothingQuality = 'high'; cc.drawImage(off, 0, 0, c.width, c.height);
  shots.set(key, c); return c;
}
// clip schedule: beat i (0..6) from T_ON → level 2+i, two sub-cuts per beat (action before kill, victory after); then loops
function cut(t, segs) {
  const bi = Math.floor((t - T_ON) / BEAT), half = (t - T_ON) / BEAT - bi >= .5 ? 1 : 0, k = 2 + ((bi % 7) + 7) % 7, g = segs.find(s => s.n === k);
  const lt = Math.max(0, Math.min(g.dur - .05, g.kill + (half ? .45 : -.35))), p = ((t - T_ON) / BEAT - bi - half * .5) * 2;
  return { k, lt, p };
}

const drawHeroLo = (c, o) => pxHero(c, o);   // the same NES sprite as L1 (reel/pixhero.js)

function bg(c, LW, t, live) {
  c.fillStyle = PAL.night; c.fillRect(0, 0, LW, LH);
  for (let i = 0; i < 70; i++) { const x = Math.floor(hash(i) * LW), y = Math.floor(hash(i, 1) * 160);
    const tw = live ? Math.floor(t / BEAT + hash(i, 2) * 4) % 4 : 1; if (tw === 0) continue;
    c.fillStyle = hash(i, 3) > .7 ? PAL.sky : PAL.white; c.fillRect(x, y, 1, 1); }
  // wire-vines hanging from the top (the L1 jungle of cables, far away)
  c.lineWidth = 1;
  for (let i = 0; i < 6; i++) { const x0 = Math.floor(hash(i, 5) * LW), x1 = x0 + 30 + Math.floor(hash(i, 6) * 50), sag = 20 + hash(i, 7) * 30;
    c.strokeStyle = i === 2 ? PAL.green : PAL.dgreen; c.beginPath(); c.moveTo(x0, -1); c.quadraticCurveTo((x0 + x1) / 2, sag * 2, x1, -1); c.stroke(); }
  // ground: grass lip + brick dirt
  c.fillStyle = PAL.lime; c.fillRect(0, GROUND, LW, 1); c.fillStyle = PAL.green; c.fillRect(0, GROUND + 1, LW, 3);
  c.fillStyle = PAL.brown; c.fillRect(0, GROUND + 4, LW, LH - GROUND - 4);
  c.fillStyle = PAL.dbrown;
  for (let y = GROUND + 8, r = 0; y < LH; y += 6, r++) { c.fillRect(0, y, LW, 1); for (let x = (r % 2) * 6; x < LW; x += 12) c.fillRect(x, y - 5, 1, 5); }
}

function drawTV(c, ox, t) {
  const x = ox + TV.x, y = TV.y;
  // antennas + stand
  c.strokeStyle = PAL.grey; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 54, y); c.lineTo(x + 34, y - 14); c.moveTo(x + 54, y); c.lineTo(x + 76, y - 12); c.stroke();
  c.fillStyle = PAL.dgrey; c.fillRect(x + 20, y + TV.h, 6, GROUND - y - TV.h); c.fillRect(x + TV.w - 26, y + TV.h, 6, GROUND - y - TV.h);
  // cabinet
  c.fillStyle = PAL.dbrown; c.fillRect(x - 1, y - 1, TV.w + 2, TV.h + 2);
  c.fillStyle = PAL.wood; c.fillRect(x, y, TV.w, TV.h);
  c.fillStyle = PAL.gold; c.fillRect(x + 2, y + 2, TV.w - 4, 1);
  c.fillStyle = PAL.dgrey; c.fillRect(ox + SCR.x - 3, SCR.y - 3, SCR.w + 6, SCR.h + 6);
  c.fillStyle = PAL.black; c.fillRect(ox + SCR.x, SCR.y, SCR.w, SCR.h);
  // slot + knobs
  const sx = ox + SLOT[0], sy = SLOT[1], glow = t >= T_INS && t < T_INS + .45 && Math.floor((t - T_INS) / .1) % 2 === 0;
  c.fillStyle = PAL.black; c.fillRect(sx - 12, sy - 2, 24, 4); if (glow) { c.fillStyle = PAL.yellow; c.fillRect(sx - 12, sy - 1, 24, 2); }
  for (const kx of [x + 12, x + TV.w - 14]) { c.fillStyle = PAL.dgrey; c.fillRect(kx - 3, sy - 3, 6, 6); c.fillStyle = PAL.grey; c.fillRect(kx - 1, sy - 3, 2, 3); }
  const led = t >= T_ON; c.fillStyle = led ? PAL.red : PAL.dred; c.fillRect(x + TV.w - 6, y + TV.h - 5, 2, 2);
}

function flight(i, t, LW, ox) {   // icon i position along its arc (lowres), or null
  const d = t - LAUNCH[i]; if (d < 0 || d > FLY) return null;
  const p = d / FLY, a = [ox + SCR.x + SCR.w / 2, SCR.y + SCR.h / 2];
  const ends = [[[ox + 10, -30], [-40, 50]], [[ox + 120, -70], [ox + 125, -40]], [[ox + 230, -20], [LW + 40, 60]]][i];
  const q = p * p * (3 - 2 * p) * .4 + p * .6, u = 1 - q;
  return { x: u * u * a[0] + 2 * u * q * ends[0][0] + q * q * ends[1][0], y: u * u * a[1] + 2 * u * q * ends[0][1] + q * q * ends[1][1], s: Math.min(1, d / .12) };
}

// reel lob + flying icons: drawn over the full-res TV screen, in lowres units on a PX-scaled context
function props(k, t, LW, ox, HX) {
      if (t < T_INS) {   // reel: overhead while running, then a lob into the slot
        const p = cl((t - .6) / (T_INS - .6)), r0 = [HX, GROUND - 52], r1 = [ox + SLOT[0], SLOT[1] - 2];
        const rx = lerp(r0[0], r1[0], p), ry = lerp(r0[1], r1[1], p) - Math.sin(Math.PI * p) * 30;
        sprite(k, REEL, Math.round(rx - 11), Math.round(ry - 11), 2);
      }
      // icons + sparkle trails
      LAUNCH.forEach((_, i) => { const f = flight(i, t, LW, ox); if (!f) return;
        for (let j = 1; j <= 4; j++) { const g = flight(i, t - j * .06, LW, ox); if (!g || (Math.floor(t * 16) + j) % 2) continue;
          k.fillStyle = j % 2 ? PAL.yellow : PAL.white; const gx = Math.round(g.x), gy = Math.round(g.y);
          k.fillRect(gx - 1, gy, 3, 1); k.fillRect(gx, gy - 1, 1, 3); }
        const spr = [PLANE, PLAY, CHEST][i], sc = f.s < 1 ? 1 : 2;
        sprite(k, spr, Math.round(f.x - spr[0].length * sc / 2), Math.round(f.y - spr.length * sc / 2), sc); });
}

export default {
  bossHp: () => null,
  events: [{ t: T_INS, k: 'loot' }, { t: T_ON, k: 'tv_on' }, ...LAUNCH.map(t => ({ t, k: 'whoosh' })), { t: T_TITLE, k: 'fanfare' }, { t: T_SPARK, k: 'sparkle' }],

  draw(ctx, t, S) {
    const { W, H, segs } = S, LW = W / PX, ox = Math.round((LW - 216) / 2);
    if (!lo || lo.width !== LW) { lo = document.createElement('canvas'); lo.width = LW; lo.height = LH; loCtx = lo.getContext('2d', { willReadFrequently: true }); }
    const c = loCtx; c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
    const end = t >= T_TITLE, beatPh = (t / BEAT) % 1;
    const hop = (t >= T_ON && t < T_HOLD) ? Math.round(Math.sin(Math.PI * Math.min(1, beatPh / .6)) * 6 * (beatPh < .6)) : 0;

    if (!end) {
      bg(c, LW, t, true); drawTV(c, ox, t);
      // hero: run in with the reel overhead, toss it into the slot, then hop on the beats
      const run = t < .6 ? 1 : 0, hx = Math.round(ox + (t < .6 ? lerp(-30, HERO_X, t / .6) : HERO_X));
      drawHeroLo(c, { x: hx, y: GROUND, t, run, face: 1, jump: hop, eye: t < T_INS ? 'open' : t < T_ON ? 'wide' : 'happy', armUp: t < .65 ? 1 : 0, gun: false });
    } else {
      bg(c, LW, t, t < T_HOLD);
      const hx = Math.round(LW / 2 + 4);
      drawHeroLo(c, { x: hx, y: GROUND, t: t < T_HOLD ? t : T_HOLD, run: 0, face: 1, jump: hop, eye: 'happy', gun: false });
      // the three icons parked on the ground, flanking the hero
      sprite(c, PLANE, hx - 78, GROUND - 24, 2); sprite(c, PLAY, hx + 34, GROUND - 23, 2); sprite(c, CHEST, hx + 70, GROUND - 23, 2);
    }
    quantize(c, LW, LH);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(lo, 0, 0, W, H);

    if (!end) {   // TV screen at full res: off → power-on line → clip cuts, CRT mask on top
      const X = (ox + SCR.x) * PX, Y = SCR.y * PX, w = SCR.w * PX, h = SCR.h * PX;
      ctx.save(); ctx.beginPath(); ctx.roundRect(X, Y, w, h, 28); ctx.clip();
      if (t >= T_ON) {
        const { k, lt, p } = cut(t, segs), im = still(segs, k, lt), z = 1 + .05 * p, sw = im.width / z, sh = sw * h / w;
        ctx.imageSmoothingEnabled = true; ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, X, Y, w, h);
        const on = (t - T_ON) / .12; if (on < 1) { ctx.fillStyle = '#000'; ctx.fillRect(X, Y, w, h); ctx.fillStyle = '#F8F8F8'; const lh = Math.max(4, h * on); ctx.fillRect(X, Y + (h - lh) / 2, w, lh); }
        const fl = LAUNCH.find(s => t >= s && t < s + .08); if (fl != null) { ctx.fillStyle = 'rgba(248,248,248,.55)'; ctx.fillRect(X, Y, w, h); }
        ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let yy = Y; yy < Y + h; yy += 5) ctx.fillRect(X, yy + 3, w, 2);
      } else { ctx.fillStyle = '#10141c'; ctx.fillRect(X, Y, w, h); }
      const vg = ctx.createRadialGradient(X + w / 2, Y + h / 2, h * .35, X + w / 2, Y + h / 2, w * .72);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(X, Y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(X + 20, Y + 15, w * .35, 10);
      ctx.restore();
      ctx.save(); ctx.scale(PX, PX); props(ctx, t, LW, ox, Math.round(ox + (t < .6 ? lerp(-30, HERO_X, t / .6) : HERO_X))); ctx.restore();
    } else {   // title card, pixfont at full res
      const cx = W / 2, live = t < T_HOLD, b = Math.floor((t - T_TITLE) / BEAT);
      pxText(ctx, 'CLIPFORGE', cx, 215, { size: 12, color: '#F8B800', shadow: '#A81000', align: 'center' });
      if (t >= T_TITLE + BEAT) pxText(ctx, 'ОТ ТРЕКА ДО РЕЛИЗА', cx, 345, { size: 5, color: '#F8F8F8', shadow: '#1C1C5C', align: 'center' });
      if (t >= T_TITLE + 2 * BEAT) pxText(ctx, 'всё нарисовано кодом', cx, 410, { size: 4, color: '#6888FC', shadow: '#000', align: 'center' });
      if (t >= T_SPARK) [[cx - 470, 200, 0], [cx + 490, 290, 1], [cx - 330, 450, 2], [cx + 350, 470, 3]].forEach(([x, y, i]) => {   // title sparkles: blink on the beats, then hold
        const big = live ? (b + i) % 2 === 0 : i % 2 === 0, n = big ? 3 : 2, z = 6; ctx.fillStyle = i % 2 ? '#F8D878' : '#F8F8F8';
        ctx.fillRect(x - z / 2, y - n * z - z / 2, z, (2 * n + 1) * z); ctx.fillRect(x - n * z - z / 2, y - z / 2, (2 * n + 1) * z, z); });
    }
    // NES palette fade: scene steps to black, the title steps in
    const dk = t >= T_DARK && t < T_TITLE ? (t < T_DARK + .083 ? .5 : .85) : t >= T_TITLE && t < T_TITLE + .125 ? (t < T_TITLE + .063 ? .6 : .3) : 0;
    if (dk) { ctx.fillStyle = `rgba(0,0,0,${dk})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  },
};
