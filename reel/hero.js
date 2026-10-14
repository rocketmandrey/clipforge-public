// hero.js: Clawd-commando skeleton shared by every level (LEVELS.md «Герой»).
// Proportions = the Wonder Clawd canon (REST pose: body 351x214, 4 legs at
// u = ±68/±130, arm stubs at the sides behind the body, tall eye slits) + a red bandana with two tails and a short blaster held at
// the lower body. A level never redraws the proportions: it takes heroShapes() and renders those polygons in its own technique.
export const ORG = '#D87754', INK = '#2F1C1C', RED = '#C8372D', GUN = '#3A3A44';
const BW = 351, BH = 214, LEG = 60, LEGW = 23, LEGS = [-130, -68, 68, 130];

// pose(o): o = { x, y: ground y (feet), s: body width px / 351 (default .6), t: seconds, run: 0..1 (stride amount), face: 1 | -1,
//   jump: px above ground, lean: degrees, shot: seconds since the last shot (<0 = none), eye: 'open' | 'happy' | 'wide' | 'squint',
//   gun: true | false, armUp: 0..1 (free arm raised, e.g. grabbing loot), legs: 4 bools (false = leg missing, the critics' defect) }
// -> { shapes: [{ role, pts }...] back to front, muzzle: [x, y], flash: 0..1, bbox: [x0, y0, x1, y1], u2s(u, v) }
// roles: 'arm' 'leg' 'body' 'eye' 'band' 'tail' 'gun' 'flash'. Fill colours by role: arm/leg/body ORG, eye INK, band/tail RED, gun GUN.
export function heroShapes(o = {}) {
  const s = o.s ?? .6, t = o.t ?? 0, run = o.run ?? 0, f = o.face ?? 1, ph = t * 2 * Math.PI * 2.4;   // one stride per beat at 144 BPM
  const bob = run * Math.abs(Math.sin(ph)) * 10, lean = ((o.lean ?? run * 4) * Math.PI) / 180 * f;
  const recoil = o.shot >= 0 && o.shot < .12 ? (1 - o.shot / .12) * 14 : 0;
  const cy = (o.y ?? 800) - (LEG + BH / 2) * s - (o.jump ?? 0) - bob * s, cx = o.x ?? 540;
  const c = Math.cos(lean), sn = Math.sin(lean);
  const u2s = (u, v) => { const U = u * f; return [cx + (U * c - v * sn) * s, cy + (U * sn + v * c) * s]; };
  const box = (u0, v0, u1, v1) => [u2s(u0, v0), u2s(u1, v0), u2s(u1, v1), u2s(u0, v1)];
  const shapes = [], add = (role, pts) => shapes.push({ role, pts });

  // bandana tails flutter behind the head (drawn first: behind everything)
  for (const [k, len] of [[0, 150], [1, 110]]) {
    const pts = []; for (let i = 0; i <= 8; i++) { const a = i / 8, w = Math.sin(ph * .5 + a * 4 + k) * 18 * a * (.4 + run);
      pts.push([-175 - a * len, -96 + k * 14 + a * (20 + k * 16) + w]); }
    const up = pts.map(([u, v]) => u2s(u, v - 13 + 4 * k)), dn = pts.slice().reverse().map(([u, v]) => u2s(u, v + 13 - 4 * k));
    add('tail', [...up, ...dn]);
  }
  // arms: one-segment stubs at the body sides, behind the body
  const armUp = o.armUp ?? 0;
  add('arm', box(-175 - 50, 15 - 23 - armUp * 60, -175 + 10, 15 + 24 - armUp * 60));
  add('arm', box(175 - 10, 30 - 23, 175 + 46 - recoil, 30 + 24));
  // legs: 4 stubs from the body bottom, pairs swing in opposition
  (o.legs ?? [1, 1, 1, 1]).forEach((on, i) => { if (!on) return;
    const a = (i % 2 ? 1 : -1) * Math.sin(ph) * .5 * run, u = LEGS[i], top = BH / 2 - 4, du = Math.sin(a) * LEG, dv = Math.cos(a) * LEG;
    add('leg', [u2s(u - LEGW / 2, top), u2s(u + LEGW / 2, top), u2s(u + LEGW / 2 + du, top + dv), u2s(u - LEGW / 2 + du, top + dv)]); });
  // body
  add('body', box(-BW / 2, -BH / 2, BW / 2, BH / 2));
  // bandana band across the top of the body
  add('band', box(-BW / 2 - 4, -BH / 2 - 2, BW / 2 + 4, -BH / 2 + 30));
  // eyes: tall slits, glance forward while running
  const e = o.eye ?? 'open', g = run * 10, eh = e === 'squint' ? 18 : e === 'wide' ? 64 : 54, ev = e === 'happy' ? -10 : 0;
  for (const u0 of [-108, 80]) {
    if (e === 'happy') add('eye', [u2s(u0 + g, -16), u2s(u0 + 14 + g, -36), u2s(u0 + 28 + g, -16), u2s(u0 + 22 + g, -12), u2s(u0 + 14 + g, -26), u2s(u0 + 6 + g, -12)]);
    else add('eye', box(u0 + g, -16 - eh / 2 + ev, u0 + 28 + g, -16 + eh / 2 + ev));
  }
  // blaster at the lower body front: grip touches the stub tip, barrel outside the silhouette
  let muzzle = null, flash = 0;
  if (o.gun !== false) {
    const k = -recoil; add('gun', [u2s(110 + k, 40), u2s(270 + k, 40), u2s(270 + k, 58), u2s(330 + k, 58), u2s(330 + k, 78), u2s(270 + k, 78),
      u2s(250 + k, 92), u2s(196 + k, 92), u2s(186 + k, 112), u2s(160 + k, 112), u2s(168 + k, 92), u2s(110 + k, 92)]);
    muzzle = u2s(334 + k, 68);
    if (o.shot >= 0 && o.shot < .08) { flash = 1 - o.shot / .08; const r = 34 + 30 * flash;
      add('flash', Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 2 * Math.PI, R = i % 2 ? r * .45 : r; return u2s(334 + k + 40 + Math.cos(a) * R, 68 + Math.sin(a) * R * .7); })); }
  }
  const all = shapes.flatMap(x => x.pts), xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  return { shapes, muzzle, flash, bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], u2s, s };
}

// Flat reference renderer (fill + ink outline). Levels render the same shapes in their own technique; this one is the model sheet.
export const FILL = { arm: ORG, leg: ORG, body: ORG, eye: INK, band: RED, tail: RED, gun: GUN, flash: '#FFE680' };
export function drawHeroFlat(ctx, H, { fill = FILL, ink = INK, lw = 4 } = {}) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = ink;
  for (const { role, pts } of H.shapes) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = fill[role]; ctx.fill(); if (role !== 'eye' && role !== 'flash') ctx.stroke(); }
  ctx.restore();
}
// bullet travel helper: a shot fired at local time ts from muzzle m flies at v px/s; returns [x, y] or null once off screen
export const bullet = (m, ts, t, f = 1, v = 1800, W = 1080) => { const d = t - ts; if (d < 0) return null; const x = m[0] + f * v * d; return x < -50 || x > W + 50 ? null : [x, m[1]]; };
