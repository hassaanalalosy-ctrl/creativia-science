// Renders daily stories for a post: posts/<id>/stories.json -> story-alert.png and story-fact.png (1080x1920).
// alert: "new post" story with the post's cover (slides/01.png or reel-cover.jpg). fact: a quick creative fact card.
// Usage: node engine/story.js <post-id>
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { kreti, mark } = require('./kreti');

const ROOT = path.join(__dirname, '..');
const FONT_CSS = ['rubik/400', 'rubik/500', 'rubik/700', 'rubik/800', 'playpen-sans-arabic/400', 'playpen-sans-arabic/600']
  .map(f => `<link rel="stylesheet" href="file://${path.join(ROOT, 'node_modules/@fontsource', f)}.css">`).join('');
const T = {
  dark: { text: '#EFF7F1', muted: '#A3B8AB', bg1: '#0B2219', bg2: '#040A07', b1: 'rgba(46,232,107,0.42)', b2: 'rgba(16,185,166,0.30)', b3: 'rgba(155,255,194,0.16)', glass: 'rgba(255,255,255,0.07)', rim: 'rgba(255,255,255,0.22)', glow: 'rgba(46,232,107,0.30)', accent: '#2EE86B', ink: '#9BFFC2', cut: '#0C2219', pill: '#2EE86B', pillText: '#0B1410' },
  light: { text: '#0B1410', muted: '#46594D', bg1: '#E2F6E9', bg2: '#F8FCF9', b1: 'rgba(46,232,107,0.40)', b2: 'rgba(16,185,166,0.22)', b3: 'rgba(255,226,130,0.45)', glass: 'rgba(255,255,255,0.5)', rim: 'rgba(255,255,255,0.95)', glow: 'rgba(46,232,107,0.22)', accent: '#1FBF57', ink: '#1F6B49', cut: '#E6F7EC', pill: '#0B1410', pillText: '#FFFFFF' }
};
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/@[A-Za-z0-9._]+/g, m => '⁦' + m + '⁩');
async function uri(src) {
  const local = path.isAbsolute(src) ? src : path.join(ROOT, src);
  if (!/^https?:/.test(src) && fs.existsSync(local)) { const e = path.extname(local).slice(1).toLowerCase(); return `data:image/${e === 'jpg' ? 'jpeg' : e};base64,${fs.readFileSync(local).toString('base64')}`; }
  const r = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126', 'Referer': new URL(src).origin + '/' } });
  if (!r.ok) throw new Error(`Image download failed (${r.status}): ${src}`);
  return `data:${(r.headers.get('content-type') || 'image/jpeg').split(';')[0]};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
}
const blob = (c, s, x, y) => `<div style="position:absolute;width:${s}px;height:${s}px;left:${x - s / 2}px;top:${y - s / 2}px;background:radial-gradient(circle,${c} 0%,rgba(0,0,0,0) 66%)"></div>`;
const star = (C, x, y, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="position:absolute;left:${x}px;top:${y}px;filter:drop-shadow(0 0 6px ${C.accent})"><path fill="${C.ink}" d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z"/></svg>`;
const glass = (C, x, y, w, h, r, inner, extra = '') => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px;background:linear-gradient(160deg,rgba(255,255,255,0.18),${C.glass} 45%,rgba(255,255,255,0.04));backdrop-filter:blur(16px) saturate(150%);border:1.5px solid ${C.rim};box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),inset 0 -24px 40px ${C.glow},0 0 50px ${C.glow},0 24px 50px rgba(0,0,0,0.3);overflow:hidden;${extra}">${inner}</div>`;
function frame(C, body, k) {
  return `<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 70% 10%,${C.bg1},${C.bg2})"></div>`
    + blob(C.b1, 580, 270, 140) + blob(C.b2, 540, 60, 500) + blob(C.b3, 400, 300, 600)
    + `<div style="position:absolute;left:-140px;top:-330px;width:640px;height:640px;border-radius:50%;border:26px solid ${C.b3};filter:blur(26px)"></div>`
    + `<div style="position:absolute;top:70px;left:24px">${k.mark}</div>`
    + body
    + `<div dir="ltr" style="position:absolute;left:0;right:0;top:560px;text-align:center;font-size:14px;font-weight:700;color:${C.muted}">@creativia.mag</div>`;
}
(async () => {
  const id = process.argv[2];
  const dir = path.join(ROOT, 'posts', id);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'stories.json'), 'utf8'));
  const mode = spec.mode || 'dark', C = T[mode];
  const k = { mark: mark({ size: 26 }) };
  for (const p of ['point', 'think', 'jump', 'wave']) k[p] = kreti({ pose: p, size: 240, mode, cut: C.cut, look: 'dream' });
  const K = (p, s, x, y) => `<div style="position:absolute;left:${x}px;top:${y}px;filter:drop-shadow(0 16px 26px rgba(0,0,0,0.35))">${k[p].replace(/width="\d+" height="\d+"/, `width="${s}" height="${s}"`)}</div>`;
  const pages = {};
  if (spec.alert) {
    const cover = spec.alert.image || (fs.existsSync(path.join(dir, 'slides/01.png')) ? `posts/${id}/slides/01.png` : `posts/${id}/reel-cover.jpg`);
    const img = await uri(cover);
    const ratio = /reel-cover/.test(cover) ? 16 / 9 : 5 / 4;
    const w = ratio > 1.5 ? 150 : 184, h = Math.round(w * ratio);
    pages.alert = frame(C,
      `<div style="position:absolute;right:24px;top:70px;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:${C.pill};color:${C.pillText};font-size:15px;font-weight:800;box-shadow:0 0 24px ${C.glow}">✦ ${spec.alert.label || 'منشور جديد'}</div>`
      + glass(C, (360 - w - 20) / 2, 128, w + 20, h + 20, 26, `<img src="${img}" style="position:absolute;left:10px;top:10px;width:${w}px;height:${h}px;border-radius:18px;object-fit:cover">`, 'transform:rotate(-3deg)')
      + star(C, 300, 140, 22) + star(C, 34, 330, 15)
      + `<div style="position:absolute;right:28px;left:28px;top:${128 + h + 44}px;display:flex;flex-direction:column;align-items:center;gap:14px"><div style="text-align:center;font-size:${spec.alert.size || 20}px;font-weight:800;line-height:1.35;color:${C.text};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(spec.alert.title)}</div><span style="padding:10px 20px;border-radius:999px;background:${C.glass};border:1.5px solid ${C.rim};font-size:15px;font-weight:700;color:${C.text}">${esc(spec.alert.cta || 'شوفه هسه بالصفحة ←')}</span></div>`
      + K('point', 58, 10, 132), k);
  }
  if (spec.fact) {
    const f = spec.fact, img = f.image ? await uri(f.image) : null;
    const ih = img ? 170 : 0;
    pages.fact = frame(C,
      `<div style="position:absolute;right:24px;top:70px;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:${C.glass};border:1.5px solid ${C.rim};color:${C.ink};font-size:15px;font-weight:800">✦ ${esc(f.tag || 'معلومة سريعة')}</div>`
      + glass(C, 24, 130, 312, 352, 30,
        (img ? `<img src="${img}" style="position:absolute;left:12px;right:12px;top:12px;width:288px;height:${ih}px;border-radius:20px;object-fit:cover">` : `<div style="position:absolute;right:22px;top:26px;width:64px;height:64px;border-radius:20px;background:linear-gradient(145deg,#9BFFC2,#2EE86B 50%,#10B9A6);box-shadow:0 0 30px rgba(46,232,107,0.5);display:flex;align-items:center;justify-content:center;font-size:34px;color:#0B1410;font-weight:800">${esc(f.icon || '!')}</div>`)
        + `<div style="position:absolute;right:22px;left:22px;top:${img ? ih + 30 : 110}px;font-size:${f.size || 25}px;font-weight:800;line-height:1.35;color:${C.text}">${esc(f.title)}</div>`
        + `<div style="position:absolute;right:22px;left:22px;top:${img ? ih + 30 : 110}px;margin-top:${(f.size || 25) * 1.35 * (f.lines || 2) + 12}px;font-size:16px;line-height:1.65;color:${C.muted}">${esc(f.body)}</div>`
        + (f.credit ? `<div style="position:absolute;right:22px;left:22px;bottom:16px;font-size:11px;color:${C.muted}">${esc(f.credit)}</div>` : ''))
      + star(C, 304, 118, 20) + star(C, 30, 500, 14)
      + K('think', 60, 18, 494), k);
  }
  const html = b => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${FONT_CSS}<style>body{margin:0}#s{position:relative;width:360px;height:640px;overflow:hidden;font-family:'Rubik',sans-serif;direction:rtl}</style></head><body><div id="s">${b}</div></body></html>`;
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
  const tmp = path.join(__dirname, '_tmp'); fs.mkdirSync(tmp, { recursive: true });
  const done = {};
  for (const [name, body] of Object.entries(pages)) {
    const f = path.join(tmp, `story-${name}.html`); fs.writeFileSync(f, html(body));
    await page.goto('file://' + f, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    await (await page.$('#s')).screenshot({ path: path.join(dir, `story-${name}.png`) });
    done[name] = `posts/${id}/story-${name}.png`;
  }
  await browser.close();
  fs.writeFileSync(path.join(dir, 'stories-rendered.json'), JSON.stringify({ ...done, renderedAt: new Date().toISOString() }, null, 2));
  console.log('stories done', id, Object.keys(done).join(', '));
})().catch(e => { console.error(e); process.exit(1); });
