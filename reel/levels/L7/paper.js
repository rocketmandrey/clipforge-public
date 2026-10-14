// L7/paper.js — from the clipforge chibi_paper kit (own code, MIT with this repo). Only import paths changed.
// paper.js: procedural chibi_paper backgrounds (no photos): ruled notebook sheet on top of pen.js paper.
import { paper } from './pen.js';
export function ruled(w, h, { gap = 54, top = 120, margin = 150, seed = 3 } = {}) {
  const cv = paper(w, h, { base: '#f1ede4', seed, vig: 0, mottle: 0, fibres: 900, grain: 14 }), c = cv.getContext('2d');
  c.lineWidth = 1.6; c.strokeStyle = 'rgba(110,130,200,.45)';
  for (let y = top; y < h; y += gap) { c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 60) c.lineTo(x, y + Math.sin(x * .004 + y) * .8); c.stroke(); }
  c.strokeStyle = 'rgba(210,90,90,.5)'; c.beginPath(); c.moveTo(margin, 0); c.lineTo(margin + 2, h); c.stroke();
  return cv;
}

// squared (grid) sheet, 5 mm style cells
export function grid(w, h, { cell = 36, seed = 4, col = 'rgba(120,150,190,.32)' } = {}) {
  const cv = paper(w, h, { base: '#f3f1ea', seed, vig: 0, mottle: 0, fibres: 900, grain: 14 }), c = cv.getContext('2d');
  c.lineWidth = 1.2; c.strokeStyle = col; c.beginPath();
  for (let x = cell / 2; x < w; x += cell) { c.moveTo(x, 0); c.lineTo(x, h); } for (let y = cell / 2; y < h; y += cell) { c.moveTo(0, y); c.lineTo(w, y); } c.stroke();
  return cv;
}
