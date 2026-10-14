// hud.js: the only overlay of the reel — a stage caption at each level start (SHOWREEL.md, v3):
// number + stage name + one line of meaning, bottom-left, ~1.9 s. No arcade HUD (no score, lives, boss bar).
const SUB = { 1: 'кидаешь ссылку на песню', 2: 'стемы, удары, слова', 3: 'три лука на выбор', 4: 'кадры по порядку + судья',
  5: 'черновик клипа без скуки', 6: 'каждый кадр под лупой', 7: 'три варианта, выбирает человек', 8: 'полный клип + ревью', 9: 'Телеграм · YouTube · архив' };
const T_IN = .15, T_OUT = 2.05, D = .28;
const ease = p => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
export default {
  draw(ctx, { lt, seg, W, H }) {
    if (lt > T_OUT + D) return;
    const p = ease((lt - T_IN) / D) * (1 - ease((lt - T_OUT) / D));
    if (p <= 0) return;
    const num = String(seg.n).padStart(2, '0'), name = seg.title, sub = seg.sub ?? SUB[seg.n] ?? '';
    const x = W === 1080 ? 48 : 96, y = H - 60 + (1 - p) * 40;
    ctx.save(); ctx.globalAlpha = p; ctx.textBaseline = 'alphabetic';
    ctx.font = '800 64px "Helvetica Neue", Arial, sans-serif'; const nw = ctx.measureText(num).width;
    ctx.font = '800 64px "Helvetica Neue", Arial, sans-serif'; const tw = ctx.measureText(name).width;
    ctx.font = '500 34px "Helvetica Neue", Arial, sans-serif'; const sw = ctx.measureText(sub).width;
    const bw = Math.max(nw + 24 + tw, sw) + 56, bh = 136;
    ctx.fillStyle = 'rgba(14,12,12,.78)'; ctx.beginPath(); ctx.roundRect(x, y - bh, bw, bh, 18); ctx.fill();
    ctx.fillStyle = '#D87754'; ctx.font = '800 64px "Helvetica Neue", Arial, sans-serif'; ctx.fillText(num, x + 28, y - 62);
    ctx.fillStyle = '#FFF6EA'; ctx.fillText(name, x + 28 + nw + 24, y - 62);
    ctx.fillStyle = 'rgba(255,246,234,.82)'; ctx.font = '500 34px "Helvetica Neue", Arial, sans-serif'; ctx.fillText(sub, x + 28, y - 20);
    ctx.restore();
  },
};
