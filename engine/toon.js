// Creativia Science toon engine (engine 4) — full animated 2D scenes (rigged characters, sets, camera, parallax).
// Renders posts/<id>/toon.json into posts/<id>/reel.mp4 (1080x1920, 30 fps, audio) and reel-cover.jpg.
// The scene library (characters, poses, sets, props) lives in engine/toon-lib.js.
//
// toon.json: {"engine": 4, "voice": true, "voiceId": "...", "lines": [{"say": vowelled, "show": plain, "gap": 0.35}],
//   "duration": "L3:end+1.5", "shots": [{"start", "end", "set", "camera": [...], "actors": [...], ...}], "flash": [...],
//   "music": {...}, "sfx": [{"file", "at", "vol"}]}
// Any time ("t", "t0", "t1", "start", "end", "at", "duration") can be a number or an anchor: "L1" (start of line 1),
// "L1:end", "L1:word" (when that word of the show text is spoken), with an optional offset ("L1:خمس-0.2").
// Usage: node engine/toon.js <post-id>   (FRAMES=1,2.5 for preview stills into engine/_tmp; without a voice file the
// line timings are estimated)
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const puppeteer = require('puppeteer');
const { kreti, mark } = require('./kreti');

const ROOT = path.join(__dirname, '..');
const FPS = 30;
const strip = s => s.replace(/[ً-ْٰـ]/g, '').replace(/[،,.!؟?…:«»"]/g, '');

(async () => {
  const id = process.argv[2];
  const dir = path.join(ROOT, 'posts', id);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'toon.json'), 'utf8'));

  // ---- line timings from the voice (or an estimate for previews)
  const vfile = path.join(dir, 'voice', 'voice.json');
  const vj = fs.existsSync(vfile) ? JSON.parse(fs.readFileSync(vfile, 'utf8')) : null;
  const lines = spec.lines || [];
  let cursor = 0;
  lines.forEach((l, k) => {
    const clip = vj && vj.clips.find(c => c.scene === k && c.text === l.say);
    const show = l.show.split(/\s+/).filter(Boolean);
    let words, dur;
    if (clip) {
      dur = clip.dur;
      const ns = clip.words.length; words = show.map((w, i) => ({ w, t: ns ? clip.words[Math.min(ns - 1, Math.round(i * (ns - 1) / Math.max(1, show.length - 1)))].t : 0 }));
    } else {
      const per = 0.36;
      dur = show.length * per + 0.3;
      words = show.map((w, i) => ({ w, t: i * per }));
    }
    l.start = l.at !== undefined && typeof l.at === 'number' ? l.at : cursor + (l.gap !== undefined ? l.gap : (k ? 0.35 : 0.3));
    l.dur = dur; l.end = l.start + dur; l.words = words; l.clip = clip;
    cursor = l.end;
  });
  const anchor = v => {
    if (typeof v !== 'string') return v;
    const m = v.match(/^L(\d+)(?::(.+?))?([+-]\d+(?:\.\d+)?)?$/);
    if (!m) return v;
    const l = lines[+m[1]]; if (!l) throw new Error('No line ' + m[1] + ' in anchor ' + v);
    let t = l.start;
    if (m[2] === 'end') t = l.end;
    else if (m[2]) { const w = l.words.find(x => strip(x.w).indexOf(strip(m[2])) >= 0); if (w) t = l.start + w.t; else console.warn('anchor word not found:', v); }
    return t + (m[3] ? parseFloat(m[3]) : 0);
  };
  const TK = new Set(['t', 't0', 't1', 'start', 'end', 'at', 'duration']);
  const resolve = o => {
    if (Array.isArray(o)) return o.forEach(resolve);
    if (o && typeof o === 'object') for (const k of Object.keys(o)) { if (TK.has(k)) o[k] = anchor(o[k]); else resolve(o[k]); }
  };
  resolve(spec.shots); resolve(spec.flash || []); resolve(spec.sfx || []);
  spec.duration = anchor(spec.duration);
  const total = spec.duration;
  spec.captions = lines.map((l, k) => ({ t0: l.start - 0.05, t1: k + 1 < lines.length ? Math.min(lines[k + 1].start - 0.05, l.end + 1.2) : l.end + 1.2, words: l.words.map(w => ({ w: w.w, t: l.start + w.t })) }));
  console.log('lines', lines.map((l, k) => `L${k} ${l.start.toFixed(2)}-${l.end.toFixed(2)}${l.clip ? '' : ' (estimated)'}`).join(' | '), 'total', total.toFixed(2));

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
  await page.evaluate(x => window.drawFrame(x), anchor(spec.coverAt) || 1);
  await el.screenshot({ path: path.join(dir, 'reel-cover.jpg'), type: 'jpeg', quality: 92 });
  await browser.close();

  // ---- audio: voice lines + music bed (kept far under the voice) + timed sound effects
  const args = ['-y', '-loglevel', 'error', '-i', silent];
  const parts = []; let n = 1;
  const hasVoice = lines.some(l => l.clip);
  for (const l of lines) if (l.clip) {
    args.push('-i', path.join(dir, 'voice', l.clip.file));
    const d = Math.round(l.start * 1000);
    parts.push(`[${n}:a]volume=1.0,adelay=${d}|${d}[a${n}]`); n++;
  }
  if (spec.music) {
    args.push('-i', path.join(ROOT, 'assets/music', spec.music.file));
    const vol = hasVoice ? Math.min(spec.music.volume || 0.12, 0.14) : (spec.music.volume || 0.2);
    parts.push(`[${n}:a]atrim=${spec.music.start || 0}:${(spec.music.start || 0) + total},asetpts=PTS-STARTPTS,volume=${vol},afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, total - 1.2)}:d=1.2[a${n}]`); n++;
  }
  for (const s of spec.sfx || []) {
    if (s.loop) args.push('-stream_loop', '-1');
    args.push('-i', path.join(ROOT, 'assets/sfx', s.file));
    const d = Math.max(0, Math.round((s.at || 0) * 1000));
    parts.push(`[${n}:a]${s.loop ? `atrim=0:${total},` : ''}volume=${(s.vol || 1) * 1.25},adelay=${d}|${d}[a${n}]`); n++;
  }
  if (n === 1) fs.copyFileSync(silent, path.join(dir, 'reel.mp4'));
  else {
    const fc = parts.join(';') + ';' + Array.from({ length: n - 1 }, (_, i) => `[a${i + 1}]`).join('') + `amix=inputs=${n - 1}:normalize=0:duration=longest,atrim=0:${total}[out]`;
    args.push('-filter_complex', fc, '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', path.join(dir, 'reel.mp4'));
    execFileSync('ffmpeg', args, { stdio: 'inherit' });
  }
  fs.writeFileSync(path.join(dir, 'reel-rendered.json'), JSON.stringify({ engine: 4, duration: total, voice: hasVoice, at: new Date().toISOString() }, null, 2));
  console.log('toon done', id);
})().catch(e => { console.error(e); process.exit(1); });
