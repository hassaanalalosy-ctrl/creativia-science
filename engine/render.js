// Renders posts/<id>/spec.json into posts/<id>/slides/NN.png (1080 x 1350).
// Usage: node engine/render.js            -> every post that has no rendered.json yet
//        node engine/render.js <post-id>  -> that post only (re-render)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { slideHtml } = require('./slides');

const ROOT = path.join(__dirname, '..');
const POSTS = path.join(ROOT, 'posts');
const FONT_CSS = ['rubik/400', 'rubik/500', 'rubik/700', 'rubik/800', 'playpen-sans-arabic/400', 'playpen-sans-arabic/600']
  .map(f => `<link rel="stylesheet" href="file://${path.join(ROOT, 'node_modules/@fontsource', f)}.css">`).join('');

async function toDataUri(url) {
  if (!url || url.startsWith('data:')) return url;
  const local = path.join(ROOT, url);
  if (!/^https?:/.test(url) && fs.existsSync(local)) {
    const ext = path.extname(local).slice(1).toLowerCase();
    return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fs.readFileSync(local).toString('base64')}`;
  }
  const origin = new URL(url).origin;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36', 'Referer': origin + '/', 'Accept': 'image/avif,image/webp,image/*,*/*' } });
  if (!res.ok) throw new Error(`Image download failed (${res.status}): ${url}`);
  const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
  if (!type.startsWith('image/')) throw new Error(`Not an image (${type}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString('base64')}`;
}

async function renderPost(browser, id) {
  const dir = path.join(POSTS, id);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
  const mode = spec.mode || 'light';
  const outDir = path.join(dir, 'slides');
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  const page = await browser.newPage();
  await page.setViewport({ width: 352, height: 440, deviceScaleFactor: 1080 / 352 });
  const total = spec.slides.length;
  for (let k = 0; k < total; k++) {
    const s = Object.assign({}, spec.slides[k]);
    if (s.image) s.image = await toDataUri(s.image);
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${FONT_CSS}<style>body{margin:0}</style></head><body>${slideHtml(s, k + 1, total, mode)}</body></html>`;
    const tmp = path.join(__dirname, '_tmp');
    fs.mkdirSync(tmp, { recursive: true });
    const f = path.join(tmp, 'slide.html');
    fs.writeFileSync(f, html);
    await page.goto('file://' + f, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    const name = String(k + 1).padStart(2, '0') + '.png';
    const el = await page.$('.slide');
    await el.screenshot({ path: path.join(outDir, name) });
    files.push(`posts/${id}/slides/${name}`);
  }
  await page.close();
  fs.writeFileSync(path.join(dir, 'rendered.json'), JSON.stringify({ files, renderedAt: new Date().toISOString() }, null, 2));
  const err = path.join(dir, 'render-error.json');
  if (fs.existsSync(err)) fs.unlinkSync(err);
  console.log('rendered', id, files.length);
}

(async () => {
  const only = process.argv[2];
  const ids = only ? [only] : fs.readdirSync(POSTS).filter(d =>
    fs.existsSync(path.join(POSTS, d, 'spec.json')) && !fs.existsSync(path.join(POSTS, d, 'rendered.json')));
  if (!ids.length) { console.log('nothing to render'); return; }
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  let failed = 0;
  for (const id of ids) {
    try { await renderPost(browser, id); }
    catch (e) {
      failed++;
      console.error('FAILED', id, e.message);
      fs.writeFileSync(path.join(POSTS, id, 'render-error.json'), JSON.stringify({ error: e.message, at: new Date().toISOString() }, null, 2));
    }
  }
  await browser.close();
  if (failed) process.exitCode = 0; // errors are recorded per post so the commit step still runs
})();
