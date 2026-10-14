// render.mjs: draw reel/index.html frame by frame in headless Chrome and pipe the frames to ffmpeg. The page contract is tiny:
// <canvas id="c">, async window.frame(t) (t in seconds, a frame is a pure function of t), window.ready, window.TOTAL, window.EVENTS.
//   node tools/render.mjs                         -> out/video.mp4 (whole reel, no sound)
//   node tools/render.mjs --sheet                 -> out/sheet.png: 6 frames side by side; look at it before you show anyone
//   node tools/render.mjs --events                -> out/events.json: the levels' sound events for tools/audio.py
//   --query="only=2&w=1920"  page params (one level alone, wide 16:9)   --dur=<s>  --fps=24  --out=<path>
// Chrome: $CHROME, else the first installed Chrome/Chromium/Edge found below (tools/doctor.sh checks it).
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, extname, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const A = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
export const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const CHROME = process.env.CHROME || CHROMES.find(existsSync);
if (!CHROME) { console.error('No Chrome found. Install Google Chrome, or: npx @puppeteer/browsers install chrome@stable, then CHROME=<path> ...'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  const f = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (relative(ROOT, f).startsWith('..')) { res.writeHead(403).end(); return; }
  let body; try { body = readFileSync(f); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }).end(body);
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 0,
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--window-size=1920,1080'] });
const page = await browser.newPage();
page.on('console', m => ['error', 'warn'].includes(m.type()) && console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[page error]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/reel/index.html${A.query ? '?' + A.query : ''}`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.ready === true', { timeout: 120000 });
const fps = +(A.fps || 24), dur = +(A.dur || await page.evaluate(() => window.TOTAL)), out = p => { const f = resolve(ROOT, A.out || p); mkdirSync(dirname(f), { recursive: true }); return f; };
const grab = t => page.evaluate(async t => { await window.frame(t); return document.getElementById('c').toDataURL('image/jpeg', .92); }, t);

if (A.events) {
  const f = out('out/events.json'); writeFileSync(f, JSON.stringify(await page.evaluate(() => window.EVENTS))); console.log(`wrote ${relative(ROOT, f)}`);
} else if (A.sheet) {
  const cells = [];
  for (let i = 0; i < 6; i++) cells.push(await grab(+(.3 + i * (dur - .6) / 5).toFixed(2)));
  const url = await page.evaluate(async cells => { const ims = await Promise.all(cells.map(async u => { const im = new Image(); im.src = u; await im.decode(); return im; }));
    const w = 360, h = Math.round(w * ims[0].height / ims[0].width), s = document.createElement('canvas'); s.width = w * ims.length; s.height = h;
    ims.forEach((im, i) => s.getContext('2d').drawImage(im, i * w, 0, w, h)); return s.toDataURL('image/png'); }, cells);
  const f = out('out/sheet.png'); writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log(`wrote ${relative(ROOT, f)}`);
} else {
  const f = out('out/video.mp4'), n = Math.round(dur * fps), t0 = Date.now();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', f], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    const buf = Buffer.from((await grab(i / fps)).split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 48 === 0) console.log(`frame ${i + 1}/${n}  ${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log(`wrote ${relative(ROOT, f)}`);
}
await browser.close(); server.close(); process.exit(0);
