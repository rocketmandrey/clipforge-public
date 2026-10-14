// timeline.js: the one shared clock of the reel (LEVELS.md). 144 BPM, 24 fps: beat = 10 frames, bar = 40 frames.
export const FPS = 24, BPM = 144, BEAT = 60 / BPM, BAR = 4 * BEAT;
export const LEVEL_DUR = 4 * BAR;      // 6.667 s = 160 frames
export const B = i => i * BEAT;

// segments in play order; file = levels/<file>.js (default export, see LEVELS.md); bars = 4 beats each.
// kill / loot / grab / doorIn = local seconds of the beat map (LEVELS.md «Ритм»). A missing level file renders as a placeholder card.
// tools/audio.py parses the lv(...) lines below with a regex: keep one lv() per line.
const lv = (n, file, title, bars, loot, extra = {}) => { const dur = bars * BAR;
  const m = bars === 3 ? { kill: B(6), lootDrop: B(7), lootGrab: B(8) } : { kill: B(8), lootDrop: B(10), lootGrab: B(11) };
  return { n, file, title, bars, dur, loot, ...m, doorIn: dur - 0.667, ...extra }; };
export const SEGS = [   // the showreel: 9 funnel stages, 9 styles (SHOWREEL.md)
  lv(1, 'L1_track', 'ТРЕК', 4, 'TRACK'),
  lv(2, 'L2_sound', 'ЗВУК', 4, 'ТАЙМЛАЙН'),
  lv(3, 'L3_director', 'РЕЖИССЁР', 4, 'ЛУКИ ×3'),
  lv(4, 'L4_board', 'РАСКАДРОВКА', 4, 'СВИТОК'),
  lv(5, 'L5_animatic', 'АНИМАТИК', 3, 'ФЛИПБУК'),
  lv(6, 'L6_critics', 'КРИТИКИ', 4, 'OK'),
  lv(7, 'L7_pilots', 'ПИЛОТЫ', 4, 'ВАРИАНТ Б'),
  lv(8, 'L8_render', 'РЕНДЕР', 4, 'CLIP.MP4'),
  lv(9, 'L9_release', 'РЕЛИЗ', 5, null, { final: true }),
  // your level: copy levels/L0_template.js and add e.g.  lv(10, 'L10_mine', 'МОЙ ЭТАП', 4, '★', { sub: 'одна строка смысла', cfg: { boxText: 'ВАШ СКИЛЛ' } }),
];
let s = 0; for (const g of SEGS) { g.start = s; s += g.dur; }
export const TOTAL = s;
export const segAt = t => { for (let i = SEGS.length - 1; i >= 0; i--) if (t >= SEGS[i].start) return SEGS[i]; return SEGS[0]; };
