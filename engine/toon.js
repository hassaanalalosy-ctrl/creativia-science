// Creativia Science toon engine (engine 4) — full animated 2D scenes (rigged characters, sets, camera, parallax).
// Renders posts/<id>/toon.json into posts/<id>/reel.mp4 (1080x1920, 30 fps, audio) and reel-cover.jpg.
// The scene library (characters, poses, sets, props) lives in engine/toon-lib.js.
// Usage: node engine/toon.js <post-id>   (FRAMES=1,2.5 for preview stills into engine/_tmp)
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const puppeteer = require('puppeteer');
const { kreti, mark } = require('./kreti');

const ROOT = path.join(__dirname, '..');
const FPS = 30;

(async () => {
  const id = process.argv[2];
  const dir = path.join(ROOT, 'posts', id);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'toon.json'), 'utf8'));
  const total = spec.duration;
  const KRETI = {
    poster: kreti({ pose: spec.posterPose || 'jump', size: 80, mode: 'dark', cut: '#9A2FD8' }),
    jar: mark({ size: 240, gradient: true, cut: '#FFFDF7' }),
    mark: mark({ size: 240, gradient: true, cut: '#FFFDF7' })
  };
  const fontCss = ['rubik/700', 'rubik/800', 'rubik/900'].map(f => `<link rel="stylesheet" href="file://${path.join(ROOT, 'node_modules/@fontsource', f)}.css">`).join('');
  const lib = fs.readFileSync(path.join(__dirname, 'toon-lib.js'), 'utf8');
  const html = `<!doctype html><html lang="ar"><head><meta charset="utf-8">${fontCss}
<style>body{margin:0;background:#000}#stage{position:relative;width:360px;height:640px;overflow:hidden;font-family:'Rubik',sans-serif}</style></head>
<body><div id="stage"></div><script>window.TOON=${JSON.stringify(spec)};window.KRETI=${JSON.stringify(KRETI)};</script><script>${lib}</script></body></html>`;
  const tmp = path.join(__dirname, '_tmp'); fs.mkdirSync(tmp, { recursive: true });
  const file = path.join(tmp, 'toon.html'); fs.writeFileSync(file, html);

  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
  await page.goto('file://' + file, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  const el = await page.$('#stage');
  if (process.env.FRAMES) {
    for (const s of process.env.FRAMES.split(',').map(Number)) { await page.evaluate(x => window.drawFrame(x), s); await el.screenshot({ path: path.join(tmp, `toon-${s}.jpg`), type: 'jpeg', quality: 88 }); }
    await browser.close(); return;
  }
  const silent = path.join(tmp, 'toon-silent.mp4');
  const frames = Math.round(total * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < frames; i++) {
    await page.evaluate(x => window.drawFrame(x), i / FPS);
    const buf = await el.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 90 === 0) console.log('frame', i, '/', frames);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  await page.evaluate(x => window.drawFrame(x), spec.coverAt || 1);
  await el.screenshot({ path: path.join(dir, 'reel-cover.jpg'), type: 'jpeg', quality: 92 });
  await browser.close();

  // audio: music bed (low) + timed sound effects + optional looped ambience
  const args = ['-y', '-loglevel', 'error', '-i', silent];
  const parts = []; let n = 1;
  if (spec.music) {
    args.push('-i', path.join(ROOT, 'assets/music', spec.music.file));
    parts.push(`[${n}:a]atrim=${spec.music.start || 0}:${(spec.music.start || 0) + total},asetpts=PTS-STARTPTS,volume=${spec.music.volume || 0.14},afade=t=in:d=0.6,afade=t=out:st=${total - 1.2}:d=1.2[a${n}]`); n++;
  }
  for (const s of spec.sfx || []) {
    if (s.loop) args.push('-stream_loop', '-1');
    args.push('-i', path.join(ROOT, 'assets/sfx', s.file));
    const d = Math.round((s.at || 0) * 1000);
    parts.push(`[${n}:a]${s.loop ? `atrim=0:${total},` : ''}volume=${s.vol || 1},adelay=${d}|${d}[a${n}]`); n++;
  }
  if (n === 1) { fs.copyFileSync(silent, path.join(dir, 'reel.mp4')); }
  else {
    const fc = parts.join(';') + ';' + Array.from({ length: n - 1 }, (_, i) => `[a${i + 1}]`).join('') + `amix=inputs=${n - 1}:normalize=0:duration=longest,atrim=0:${total}[out]`;
    args.push('-filter_complex', fc, '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', path.join(dir, 'reel.mp4'));
    execFileSync('ffmpeg', args, { stdio: 'inherit' });
  }
  fs.writeFileSync(path.join(dir, 'reel-rendered.json'), JSON.stringify({ engine: 4, duration: total, at: new Date().toISOString() }, null, 2));
  console.log('toon done', id);
})();
