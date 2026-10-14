// pixfont.js: свой битмап-шрифт шоурила в духе NES (жирный, квадратный, штрих 2 px). Рисован с нуля, не копия чужих шрифтов.
// Клетка: заглавные 7 px высотой (строки 0..6), ширина 2..9 px; dy < 0 — строки над буквой (Ё, Й), строка 7 — хвост (Д Ц Щ ,).
// API: pxText(ctx, str, x, y, { size, color, shadow, align, spacing }) — y = верх заглавной; pxWidth(str, size, spacing).
const G = {}, def = (chars, rows, dy = 0) => { for (const ch of chars) G[ch] = { rows, w: rows[0].length, dy }; };
const r = s => s.trim().split(/\s+/);

def('AА', r(`..XXX.. .XX.XX. XX...XX XX...XX XXXXXXX XX...XX XX...XX`));
def('BВ', r(`XXXXXX. XX...XX XX...XX XXXXXX. XX...XX XX...XX XXXXXX.`));
def('CС', r(`..XXXX. .XX..XX XX..... XX..... XX..... .XX..XX ..XXXX.`));
def('D', r(`XXXXX.. XX..XX. XX...XX XX...XX XX...XX XX..XX. XXXXX..`));
const E = r(`XXXXXXX XX..... XX..... XXXXXX. XX..... XX..... XXXXXXX`);
def('EЕ', E);
def('F', r(`XXXXXXX XX..... XX..... XXXXXX. XX..... XX..... XX.....`));
def('G', r(`..XXXXX .XX.... XX..... XX..XXX XX...XX .XX..XX ..XXXXX`));
def('HН', r(`XX...XX XX...XX XX...XX XXXXXXX XX...XX XX...XX XX...XX`));
def('I', r(`XXXXXX ..XX.. ..XX.. ..XX.. ..XX.. ..XX.. XXXXXX`));
def('J', r(`....XXX .....XX .....XX .....XX XX...XX XX...XX .XXXXX.`));
def('KК', r(`XX...XX XX..XX. XX.XX.. XXXX... XXXXX.. XX..XX. XX...XX`));
def('L', r(`XX..... XX..... XX..... XX..... XX..... XX..... XXXXXXX`));
def('MМ', r(`XX...XX XXX.XXX XXXXXXX XX.X.XX XX...XX XX...XX XX...XX`));
def('N', r(`XX...XX XXX..XX XXXX.XX XX.XXXX XX..XXX XX...XX XX...XX`));
def('OО', r(`.XXXXX. XX...XX XX...XX XX...XX XX...XX XX...XX .XXXXX.`));
def('PР', r(`XXXXXX. XX...XX XX...XX XXXXXX. XX..... XX..... XX.....`));
def('Q', r(`.XXXXX. XX...XX XX...XX XX...XX XX.XXXX XX..XX. .XXXX.X`));
def('R', r(`XXXXXX. XX...XX XX...XX XXXXXX. XXXX... XX.XX.. XX..XXX`));
def('S', r(`.XXXXX. XX...XX XX..... .XXXXX. .....XX XX...XX .XXXXX.`));
def('TТ', r(`XXXXXX ..XX.. ..XX.. ..XX.. ..XX.. ..XX.. ..XX..`));
def('U', r(`XX...XX XX...XX XX...XX XX...XX XX...XX XX...XX .XXXXX.`));
def('V', r(`XX...XX XX...XX XX...XX XXX.XXX .XXXXX. ..XXX.. ...X...`));
def('W', r(`XX...XX XX...XX XX...XX XX.X.XX XXXXXXX XXX.XXX XX...XX`));
def('XХ', r(`XX...XX XXX.XXX .XXXXX. ..XXX.. .XXXXX. XXX.XXX XX...XX`));
def('Y', r(`XX..XX XX..XX XX..XX .XXXX. ..XX.. ..XX.. ..XX..`));
def('Z', r(`XXXXXXX ....XXX ...XXX. ..XXX.. .XXX... XXX.... XXXXXXX`));

def('Б', r(`XXXXXXX XX..... XX..... XXXXXX. XX...XX XX...XX XXXXXX.`));
def('Г', r(`XXXXXXX XX..... XX..... XX..... XX..... XX..... XX.....`));
def('Д', r(`..XXXX. .XX.XX. .XX.XX. .XX.XX. XX..XX. XX..XX. XXXXXXX XX...XX`));
def('Ё', ['.XX.XX.', '.......', ...E], -2);
const I_ = r(`XX...XX XX..XXX XX.XXXX XXXX.XX XXX..XX XX...XX XX...XX`);
def('И', I_);
def('Й', ['.X...X.', '..XXX..', ...I_], -2);
def('Ж', r(`XX.XX.XX .X.XX.X. ..XXXX.. ...XX... ..XXXX.. .X.XX.X. XX.XX.XX`));
def('З', r(`.XXXXX. XX...XX .....XX ..XXXX. .....XX XX...XX .XXXXX.`));
def('Л', r(`...XXXX ..XX.XX ..XX.XX .XX..XX .XX..XX XX...XX XX...XX`));
def('П', r(`XXXXXXX XX...XX XX...XX XX...XX XX...XX XX...XX XX...XX`));
def('У', r(`XX...XX XX...XX XX...XX .XXXXXX .....XX XX...XX .XXXXX.`));
def('Ф', r(`...X... .XXXXX. XX.X.XX XX.X.XX XX.X.XX .XXXXX. ...X...`));
def('Ц', r(`XX..XX. XX..XX. XX..XX. XX..XX. XX..XX. XX..XX. XXXXXXX .....XX`));
def('Ч', r(`XX...XX XX...XX XX...XX .XXXXXX .....XX .....XX .....XX`));
def('Ш', r(`XX.XX.XX XX.XX.XX XX.XX.XX XX.XX.XX XX.XX.XX XX.XX.XX XXXXXXXX`));
def('Щ', r(`XX.XX.XX. XX.XX.XX. XX.XX.XX. XX.XX.XX. XX.XX.XX. XX.XX.XX. XXXXXXXXX .......XX`));
def('Ъ', r(`XXX.... .XX.... .XXXXX. .XX..XX .XX..XX .XX..XX .XXXXX.`));
def('Ы', r(`XX.....XX XX.....XX XXXXX..XX XX..XX.XX XX..XX.XX XX..XX.XX XXXXX..XX`));
def('Ь', r(`XX..... XX..... XXXXXX. XX...XX XX...XX XX...XX XXXXXX.`));
def('Э', r(`.XXXXX. XX...XX .....XX ..XXXXX .....XX XX...XX .XXXXX.`));
def('Ю', r(`XX..XXXX. XX.XX..XX XX.XX..XX XXXXX..XX XX.XX..XX XX.XX..XX XX..XXXX.`));
def('Я', r(`.XXXXXX XX...XX XX...XX .XXXXXX ...XXXX ..XX.XX XXX..XX`));

def('0', r(`.XXXXX. XX..XXX XX.XXXX XXXX.XX XXX..XX XX...XX .XXXXX.`));
def('1', r(`..XX.. .XXX.. XXXX.. ..XX.. ..XX.. ..XX.. XXXXXX`));
def('2', r(`.XXXXX. XX...XX .....XX ..XXXX. .XX.... XX..... XXXXXXX`));
def('3', r(`XXXXXXX ....XX. ...XX.. ..XXXX. .....XX XX...XX .XXXXX.`));
def('4', r(`...XXX. ..XXXX. .XX.XX. XX..XX. XXXXXXX ....XX. ....XX.`));
def('5', r(`XXXXXXX XX..... XXXXXX. .....XX .....XX XX...XX .XXXXX.`));
def('6', r(`..XXXX. .XX.... XX..... XXXXXX. XX...XX XX...XX .XXXXX.`));
def('7', r(`XXXXXXX XX...XX ....XX. ...XX.. ..XX... ..XX... ..XX...`));
def('8', r(`.XXXXX. XX...XX XX...XX .XXXXX. XX...XX XX...XX .XXXXX.`));
def('9', r(`.XXXXX. XX...XX XX...XX .XXXXXX .....XX ....XX. .XXXX..`));

def('.', r(`.. .. .. .. .. XX XX`));
def(',', r(`.. .. .. .. .. XX XX X.`));
def('!', r(`XX XX XX XX .. XX XX`));
def('?', r(`.XXXXX. XX...XX ....XX. ...XX.. ...XX.. ....... ...XX..`));
def(':', r(`.. XX XX .. XX XX ..`));
def('-', r(`..... ..... ..... XXXXX ..... ..... .....`));
def('+', r(`...... ..XX.. XXXXXX XXXXXX ..XX.. ...... ......`));
def('×', r(`...... XX..XX .XXXX. ..XX.. .XXXX. XX..XX ......`));
def('/', r(`.....XX ....XX. ...XX.. ..XX... .XX.... XX..... .......`));
def("'", r(`XX XX X. .. .. .. ..`));
def('"', r(`XX.XX XX.XX X..X. ..... ..... ..... .....`));
def('(', r(`..XX .XX. XX.. XX.. XX.. .XX. ..XX`));
def(')', r(`XX.. .XX. ..XX ..XX ..XX .XX. XX..`));
def('#', r(`.XX.XX. .XX.XX. XXXXXXX .XX.XX. XXXXXXX .XX.XX. .XX.XX.`));
def('$', r(`...X... .XXXXXX XX.X... .XXXXX. ...X.XX XXXXXX. ...X...`));
def('%', r(`XX...XX XX..XX. ...XX.. ..XX... .XX.... XX..XX. X...XX.`));
def('·', r(`.. .. .. XX XX .. ..`));
def('—', r(`........ ........ ........ XXXXXXXX ........ ........ ........`));
def('…', r(`........ ........ ........ ........ ........ XX.XX.XX XX.XX.XX`));
def('→', r(`...XX.. ....XX. XXXXXXX XXXXXXX ....XX. ...XX.. .......`));
def('_', r(`....... ....... ....... ....... ....... ....... XXXXXXX`));
def(' ', r(`.... .... .... .... .... .... ....`));

// горизонтальные отрезки на глиф: [x, y, len] (меньше fillRect)
for (const g of Object.values(G)) { g.runs = [];
  g.rows.forEach((row, y) => { for (let x = 0; x < row.length;) { if (row[x] !== 'X') { x++; continue; }
    let e = x; while (row[e] === 'X') e++; g.runs.push([x, y + g.dy, e - x]); x = e; } }); }

const glyph = ch => G[ch] || G[ch.toUpperCase()] || G['?'];
export const pxWidth = (str, size = 6, spacing = 1) => { const s = [...String(str)];
  return s.length ? (s.reduce((a, ch) => a + glyph(ch).w, 0) + spacing * (s.length - 1)) * size : 0; };

export function pxText(ctx, str, x, y, { size = 6, color = '#fff', shadow = '#000', align = 'left', spacing = 1 } = {}) {
  size = Math.max(1, Math.round(size)); const w = pxWidth(str, size, spacing);
  let x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x); const y0 = Math.round(y);
  const pass = (c, ox, oy) => { ctx.fillStyle = c; let cx = x0 + ox;
    for (const ch of String(str)) { const g = glyph(ch);
      for (const [gx, gy, n] of g.runs) ctx.fillRect(cx + gx * size, y0 + oy + gy * size, n * size, size);
      cx += (g.w + spacing) * size; } };
  if (shadow) pass(shadow, size, size);
  pass(color, 0, 0);
  return w;
}
export const PX_CHARS = Object.keys(G).join('');
