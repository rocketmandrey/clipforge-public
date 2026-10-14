// L9/pix.js: NES palette, palette quantizer and the finale's own pixel sprites (drawn here, no trademarks).
import { ORG, INK, RED, GUN } from '../../hero.js';

export const PAL = {
  black: '#000000', night: '#0C0C2C', navy: '#1C1C5C', sky: '#6888FC', white: '#F8F8F8', grey: '#BCBCBC', dgrey: '#585858',
  green: '#00A800', dgreen: '#005800', lime: '#B8F818', brown: '#503000', dbrown: '#2C1800', wood: '#AC7C00', gold: '#F8B800',
  yellow: '#F8D878', red: '#F83800', dred: '#A81000', blue: '#0058F8', org: ORG, ink: INK, band: RED, gun: GUN,
  hOr: '#E45C10', hOh: '#F87858', hBd: '#D82800', hBs: '#881400',   // the pixhero.js sprite colours (same hero as L1)
};
const RGB = Object.values(PAL).map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const memo = new Map();
// snap every pixel of the lowres buffer to the nearest palette colour (kills canvas anti-aliasing → crisp NES pixels)
export function quantize(c, w, h) {
  const im = c.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; let m = memo.get(key);
    if (m === undefined) { let best = 1e9; for (let j = 0; j < RGB.length; j++) { const [r, g, b] = RGB[j], e = (r - d[i]) ** 2 + (g - d[i + 1]) ** 2 + (b - d[i + 2]) ** 2; if (e < best) { best = e; m = j; } } memo.set(key, m); }
    const [r, g, b] = RGB[m]; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  }
  c.putImageData(im, 0, 0);
}

// sprites: rows of chars, '.' = transparent; KEY maps chars to palette colours
const KEY = { W: PAL.white, B: PAL.sky, b: PAL.blue, R: PAL.red, r: PAL.dred, D: PAL.dbrown, N: PAL.wood, Y: PAL.gold, K: PAL.black, G: PAL.grey, g: PAL.dgrey };
export function sprite(c, rows, x, y, s = 1, flip = 0) {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[flip ? row.length - 1 - i : i]; if (ch === '.') continue;
    c.fillStyle = KEY[ch]; c.fillRect(x + i * s, y + j * s, s, s); } });
}
export const PLANE = [   // paper plane
  '..............WW',
  '...........WWWWW',
  '........WWWWWWW.',
  '.....WWWWWWWBWW.',
  '..WWWWWWWWBBWW..',
  'WWWWWWWWBBBWW...',
  '...bbbbBBBWWW...',
  '.....bbBBBWW....',
  '......bBBWWW....',
  '.......bBWW.....',
  '........bW......',
];
export const PLAY = [    // red rounded box + white triangle
  '.rRRRRRRRRRRRRr.',
  'RRRRRRRRRRRRRRRR',
  'RRRRRRWRRRRRRRRR',
  'RRRRRRWWWRRRRRRR',
  'RRRRRRWWWWWRRRRR',
  'RRRRRRWWWWWWRRRR',
  'RRRRRRWWWWWRRRRR',
  'RRRRRRWWWRRRRRRR',
  'RRRRRRWRRRRRRRRR',
  'rRRRRRRRRRRRRRRr',
  '.rrrrrrrrrrrrrr.',
];
export const CHEST = [   // archive chest
  '..DDDDDDDDDDDD..',
  '.DNNNNNNNNNNNND.',
  'DNNNNNNNNNNNNNND',
  'DYYYYYYYYYYYYYYD',
  'DNNNNNNYYNNNNNND',
  'DDDDDDDYKDDDDDDD',
  'DNNNNNNYYNNNNNND',
  'DNNNNNNNNNNNNNND',
  'DYYYYYYYYYYYYYYD',
  'DNNNNNNNNNNNNNND',
  'DDDDDDDDDDDDDDDD',
];
export const REEL = [    // film reel CLIP.MP4: 3 holes round a hub, film tail
  '...ggggg....',
  '..gGGGGGg...',
  '.gGGKKKGGg..',
  'gGGGKKKGGGg.',
  'gGGGGGGGGGg.',
  'gGKKGgGKKGgK',
  'gGKKGGGKKGgK',
  'gGGGGGGGGGgK',
  '.gGGGGGGGg.K',
  '..gGGGGGg..K',
  '...ggggg...K',
];
