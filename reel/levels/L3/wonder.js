// L3/wonder.js — pieces of the Wonder Clawd kit, copied for showreel level 3.
//   rng, sstep, PAPER/INK/ORG, paperTex, hatch/drawHatch, radial, ground colour. Own code of the clipforge harness. Changes: paper texture takes a width (side-scroll world), radial takes its own seed,
//   everything is an ES module instead of the K.* IIFE.
export const PAPER = '#E8E8E0', INK = '#2F1C1C', ORG = '#D87754', GROUND = '#9D9D94';
export const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
export const sstep = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };

// paper: cool cream, soft mottling, hair flecks; NV variants, swapped every 4 frames (6 fps boil)
export const NV = 6;
const PV = [];
export const paperTex = (v, PW = 2700, PH = 1080) => PV[v] || (PV[v] = (() => {
  const cv = canvas(PW, PH), c = cv.getContext('2d'), r = rng(900 + v * 37), k = PW / 1920;
  c.fillStyle = PAPER; c.fillRect(0, 0, PW, PH);
  { const g = c.createRadialGradient(PW / 2, 540, 400, PW / 2, 540, 1150 * k); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,60,40,.045)'); c.fillStyle = g; c.fillRect(0, 0, PW, PH); }
  for (let i = 0; i < 150 * k; i++) { const x = r() * PW, y = r() * PH, R = 60 + r() * 200, g = c.createRadialGradient(x, y, 0, x, y, R), dk = r() < .5;
    g.addColorStop(0, dk ? 'rgba(200,200,190,.12)' : 'rgba(255,255,250,.10)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x - R, y - R, 2 * R, 2 * R); }
  c.lineCap = 'round';
  for (let i = 0; i < 1700 * k; i++) { const x = r() * PW, y = r() * PH, l = 4 + r() * 11, a = r() * 6.28, b = (r() - .5) * 1.6;
    c.strokeStyle = `rgba(${70 + r() * 40 | 0},${75 + r() * 40 | 0},${75 + r() * 40 | 0},${.1 + r() * .25})`; c.lineWidth = .9 + r() * .4; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + b) * l * .6, y + Math.sin(a + b) * l * .6, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  for (let i = 0; i < 14 * k; i++) { c.fillStyle = 'rgba(40,40,40,.8)'; c.beginPath(); c.arc(r() * PW, r() * PH, .8 + r() * 1.5, 0, 6.3); c.fill(); }
  return cv; })());

// body hatching (unit coords −.5….5), 3 variants that boil every 4 frames
const HV = [];
const hatch = v => HV[v] || (HV[v] = (() => {
  const r = rng(333 + v * 91), light = [], dark = [];
  for (let i = 0; i < 90; i++) { const x = r() - .5, y = r() - .5; if ((x * .55 + y * .83) > -.1 + r() * .55 && r() < .75) continue; light.push([x, y, 16 + r() * 28, (r() - .6) * .06]); }
  for (let i = 0; i < 420; i++) { const x = r() - .5, y = r() - .5, sd = x * .6 + y * .8; if (sd < -.2 + r() * .5) continue; dark.push([x, y, 14 + r() * 40, -1.08 + (r() - .5) * .12, .9 + r() * .5]); }
  for (let i = 0; i < 130; i++) { const x = .05 + r() * .45, y = -.05 + r() * .55, a = (r() < .5 ? .5 : -.35) + (r() - .5) * .2; dark.push([x, y, 10 + r() * 22, a, .8 + r() * .4]); }
  return { light, dark }; })());
export const drawHatch = (c, w, h, v, lw = 1) => {
  const H = hatch(v); c.lineCap = 'round';
  c.strokeStyle = 'rgba(240,160,124,.6)'; c.lineWidth = 1.5 * lw; c.beginPath();
  for (const [x, y, l, a] of H.light) { const px = x * w, py = y * h; c.moveTo(px, py); c.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); } c.stroke();
  c.strokeStyle = 'rgba(160,66,38,.4)'; c.lineWidth = lw; c.beginPath();
  for (const [x, y, l, a] of H.dark) { const px = x * w, py = y * h; c.moveTo(px, py); c.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); } c.stroke();
};

// pencil radial speed lines (the Wonder zoom accent), used as the soft «hatch flash» on kill
const RL = (() => { const r = rng(4242), a = []; for (let i = 0; i < 90; i++) a.push([r() * 6.2832, .1 + r() * .4, .25 + r() * .8, r()]); return a; })();
export const radial = (c, al, grow, ox, oy, D = 1000) => {
  if (al <= .01) return; c.save(); c.lineCap = 'round'; c.strokeStyle = `rgba(80,56,46,${.38 * al})`; c.lineWidth = 1.4; c.beginPath();
  for (const [a, r0, len, k] of RL) { if (k > grow) continue; const s0 = D * r0 * (.6 + .4 * grow), s1 = s0 + D * len * (.4 + .6 * grow); c.moveTo(ox + Math.cos(a) * s0, oy + Math.sin(a) * s0 * .85); c.lineTo(ox + Math.cos(a) * s1, oy + Math.sin(a) * s1 * .85); }
  c.stroke(); c.restore();
};
