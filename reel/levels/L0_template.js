// L0_template.js — the starter level: copy it to levels/L<N>_<id>.js, add a line to SEGS in timeline.js, change BASE below.
// Or reuse it as is with per-segment colours: lv(..., { cfg: { boxText: 'ЗВУК', box: '#8E44AD' } }) in timeline.js (the demo does that).
// Flat paper-cut look on purpose: it shows the level contract (LEVELS.md) with nothing in the way. Frame = pure function of t.
// Story beats (4 bars = 6.667 s at 144 BPM): hero runs in → stops at the box → box bursts open on seg.kill → loot pops up →
// hero grabs it on seg.lootGrab → runs into the door → the compositor flies the camera through the door into the next level.
import { heroShapes, drawHeroFlat } from '../hero.js';

const BASE = {
  sky: ['#FFE9C7', '#FFC9A3'],   // background gradient, top → bottom
  ground: '#6B4F3A', grass: '#8FBF5A',
  box: '#3B6EA8', boxText: 'ВАШ СКИЛЛ',   // what the hero cracks open: your repo / skill
  loot: '★', lootColor: '#F3A712',       // what pops out: an emoji or 1–2 letters
  door: '#2B2B36',
};

const GROUND = 820, BOX = { x: 600, w: 260, h: 200 }, DOOR = { x: 900, y: 520, w: 150, h: 300 };
const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2, cl = x => Math.max(0, Math.min(1, x));
const heroX = (t, S) => {                                    // run in, stand, run to the door: position is a function of t only
  const g = S.seg, a = ease(cl(t / g.kill * 1.25)), b = ease(cl((t - g.lootGrab) / (g.doorIn - g.lootGrab)));
  return -150 + a * 600 + b * (DOOR.x + DOOR.w / 2 - 450);
};

export default {
  draw(ctx, t, S) {
    const CONFIG = { ...BASE, ...(S.seg.cfg || {}) };
    const { W, H, seg } = S, ox = (W - 1080) / 2;           // 16:9: the same 1080 world centred, sides keep the sky and ground going
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, CONFIG.sky[0]); sky.addColorStop(1, CONFIG.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = CONFIG.ground; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = CONFIG.grass; ctx.fillRect(0, GROUND - 14, W, 18);
    ctx.save(); ctx.translate(ox, 0);

    ctx.fillStyle = CONFIG.door; ctx.fillRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h);             // the exit door
    const open = t >= seg.kill, k = cl((t - seg.kill) / .25);                              // the box: shakes before, bursts on kill
    if (!open || k < 1) {
      const shake = open ? 0 : Math.sin(t * 40) * 4 * cl((t - seg.kill + 1) / 1), s = 1 + k * .4;
      ctx.save(); ctx.translate(BOX.x + BOX.w / 2 + shake, GROUND - BOX.h / 2); ctx.scale(s, s); ctx.globalAlpha = 1 - k;
      ctx.fillStyle = CONFIG.box; ctx.fillRect(-BOX.w / 2, -BOX.h / 2, BOX.w, BOX.h);
      ctx.fillStyle = '#fff'; ctx.font = '800 34px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(CONFIG.boxText, 0, 0); ctx.restore();
    }
    if (open) for (let i = 0; i < 14; i++) {                                               // confetti, seeded by index → deterministic
      const d = t - seg.kill, a = i * 2.4, v = 380 + (i * 53) % 220;
      const x = BOX.x + BOX.w / 2 + Math.cos(a) * v * d, y = GROUND - BOX.h / 2 - Math.sin(a) * v * d + 900 * d * d;
      if (y < GROUND) { ctx.fillStyle = ['#E4572E', '#F3A712', '#29335C', '#669BBC'][i % 4]; ctx.fillRect(x, y, 14, 14); }
    }
    const grabbed = t >= seg.lootGrab, hx = heroX(t, S);
    if (open && !grabbed) {                                                                // loot bounces up out of the box
      const d = t - seg.kill, y = GROUND - 120 - Math.abs(Math.sin(d * 7)) * 120 * Math.exp(-d * 2);
      ctx.fillStyle = CONFIG.lootColor; ctx.font = '120px serif'; ctx.textAlign = 'center'; ctx.fillText(CONFIG.loot, BOX.x + BOX.w / 2, y);
    }
    const run = t < seg.kill * .8 || t > seg.lootGrab ? 1 : 0;
    const Hs = heroShapes({ x: hx, y: GROUND, s: .55, t, run, gun: false, eye: open ? 'happy' : 'open', armUp: grabbed ? 1 : 0 });
    drawHeroFlat(ctx, Hs);
    if (grabbed) { ctx.fillStyle = CONFIG.lootColor; ctx.font = '90px serif'; ctx.textAlign = 'center'; ctx.fillText(CONFIG.loot, hx - 60, Hs.bbox[1] - 10); }
    ctx.restore();
  },
  door: (t, S) => ({ x: DOOR.x + (S.W - 1080) / 2, y: DOOR.y, w: DOOR.w, h: DOOR.h }),
  events: [{ t: 0.4, k: 'jump' }, { t: 3.333, k: 'kill' }, { t: 4.583, k: 'loot' }, { t: 6.0, k: 'door' }],   // sound: tools/audio.py SFX
};
