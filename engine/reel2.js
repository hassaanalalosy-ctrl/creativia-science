// Creativia reel engine v2 — liquid glass, morphing shape, drifting background, camera motion, music + SFX.
// Renders posts/<id>/reel.json (with "engine": 2) into posts/<id>/reel.mp4 (1080x1920, 30 fps, with audio) and reel-cover.jpg.
// Rules: Arabic text appears word by word (never letter by letter); every reveal moves right -> left; safe area y 70..500.
// Usage: node engine/reel2.js <post-id>
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const puppeteer = require('puppeteer');
const { kreti, mark } = require('./kreti');
const { applyArt } = require('./art');

const ROOT = path.join(__dirname, '..');
const FPS = 30;
const FONT_CSS = ['rubik/400', 'rubik/500', 'rubik/700', 'rubik/800', 'playpen-sans-arabic/400', 'playpen-sans-arabic/600']
  .map(f => `<link rel="stylesheet" href="file://${path.join(ROOT, 'node_modules/@fontsource', f)}.css">`).join('');

async function toDataUri(src) {
  const local = path.join(ROOT, src);
  if (!/^https?:/.test(src) && fs.existsSync(local)) {
    const ext = path.extname(local).slice(1).toLowerCase();
    return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fs.readFileSync(local).toString('base64')}`;
  }
  const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126', 'Referer': new URL(src).origin + '/' } });
  if (!res.ok) throw new Error(`Image download failed (${res.status}): ${src}`);
  return `data:${(res.headers.get('content-type') || 'image/jpeg').split(';')[0]};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
}

const THEME = {
  dark: { text: '#F3EFF7', muted: '#AEA3B8', bg1: '#170B22', bg2: '#07040A', b1: 'rgba(145,46,232,0.42)', b2: 'rgba(185,16,151,0.30)', b3: 'rgba(208,155,255,0.16)',
    glass: 'rgba(255,255,255,0.07)', rim: 'rgba(255,255,255,0.16)', glow: 'rgba(145,46,232,0.28)', accent: '#912EE8', soft: '#D09BFF', cut: '#180C22', ink: '#D09BFF' },
  light: { text: '#100B14', muted: '#504659', bg1: '#EDE2F6', bg2: '#FAF8FC', b1: 'rgba(145,46,232,0.40)', b2: 'rgba(185,16,151,0.22)', b3: 'rgba(255,226,130,0.45)',
    glass: 'rgba(255,255,255,0.45)', rim: 'rgba(255,255,255,0.95)', glow: 'rgba(145,46,232,0.22)', accent: '#741FBF', soft: '#481F6B', cut: '#EFE6F7', ink: '#481F6B' }
};

// Sound cue plan per scene type (seconds from scene start). Roles map to assets/sfx/library.json.
const CUES = {
  hook: [[0.05, 'whoosh', 0.55], [1.45, 'pop', 0.6], [2.0, 'sparkle', 0.35]],
  room: [[0.0, 'whoosh', 0.4], [0.45, 'ding', 0.35]],
  stack: [[0.0, 'whoosh', 0.45], [0.5, 'pop', 0.45], [0.8, 'pop', 0.4], [1.1, 'pop', 0.35], [2.0, 'soft-impact', 0.6]],
  end: [[0.0, 'whoosh', 0.45], [0.55, 'notification', 0.45], [1.0, 'sparkle', 0.3]],
  point: [[0.0, 'whoosh', 0.4], [0.35, 'pop', 0.45]],
  list: [[0.0, 'whoosh', 0.4], [0.7, 'click', 0.35], [1.1, 'click', 0.3], [1.5, 'click', 0.3], [1.9, 'click', 0.3]],
  compare: [[0.0, 'whoosh', 0.4], [0.7, 'ui', 0.35], [1.5, 'ding', 0.4]],
  image: [[0.0, 'whoosh', 0.4], [0.3, 'camera', 0.35]],
  statement: [[0.0, 'riser', 0.3], [1.0, 'soft-impact', 0.5]]
};

const PAGE = String.raw`
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const inout = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const spring = x => { x = clamp(x); return 1 - Math.exp(-6 * x) * Math.cos(9 * x); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cred = x => esc(x).replace(/@[A-Za-z0-9._]+/g, m => '\u2066' + m + '\u2069');
const D = window.REEL, C = D.theme;

// word by word, blur -> sharp, sliding right -> left
function words(text, t, start, step, style) {
  return esc(text).split(' ').map((w, i) => {
    const p = ease(seg(t, start + i * step, start + i * step + 0.45));
    return '<span style="display:inline-block;opacity:' + p + ';filter:blur(' + (1 - p) * 7 + 'px);transform:translateX(' + (1 - p) * 22 + 'px)">' + w + '</span>';
  }).join(' ');
}
function fadeIn(t, a, d) { const p = ease(seg(t, a, a + (d || 0.5))); return 'opacity:' + p + ';filter:blur(' + (1 - p) * 6 + 'px);transform:translateX(' + (1 - p) * 24 + 'px);'; }

function bg(t) {
  const s = Math.sin, c = Math.cos;
  const blob = (col, size, x, y) => '<div style="position:absolute;width:' + size + 'px;height:' + size + 'px;left:' + (x - size / 2) + 'px;top:' + (y - size / 2) + 'px;background:radial-gradient(circle,' + col + ' 0%,rgba(0,0,0,0) 66%)"></div>';
  return '<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 70% 10%,' + C.bg1 + ',' + C.bg2 + ')"></div>'
    + blob(C.b1, 560, 260 + s(t * 0.21) * 40, 120 + c(t * 0.17) * 30)
    + blob(C.b2, 520, 60 + c(t * 0.15) * 40, 470 + s(t * 0.19) * 35)
    + blob(C.b3, 380, 300 + s(t * 0.13 + 2) * 30, 560 + c(t * 0.11) * 25)
    + '<div style="position:absolute;left:-140px;top:-330px;width:640px;height:640px;border-radius:50%;border:26px solid ' + C.b3 + ';filter:blur(26px);transform:rotate(' + t * 4 + 'deg) translateX(' + s(t * 0.2) * 12 + 'px)"></div>'
    + '<div style="position:absolute;inset:0;opacity:0.07;background-image:url(' + D.grain + ');background-size:180px"></div>';
}
function star(t, x, y, sz, at) {
  const p = clamp(seg(t, at, at + 0.4)), tw = 0.6 + 0.4 * Math.sin(t * 4 + x);
  return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" style="position:absolute;left:' + x + 'px;top:' + y + 'px;opacity:' + p * tw + ';transform:scale(' + p * tw + ') rotate(' + t * 30 + 'deg);filter:drop-shadow(0 0 6px ' + C.accent + ')"><path fill="' + C.soft + '" d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z"/></svg>';
}
function dot(t, x, y, r, at) { const p = clamp(seg(t, at, at + 0.5)); return '<div style="position:absolute;left:' + x + 'px;top:' + (y + Math.sin(t * 1.3 + x) * 6) + 'px;width:' + r + 'px;height:' + r + 'px;border-radius:50%;background:' + C.accent + ';opacity:' + p * 0.7 + ';box-shadow:0 0 12px ' + C.accent + '"></div>'; }
function kretiAt(pose, size, t, at, x, y) {
  const p = spring(seg(t, at, at + 0.9)), bob = Math.sin(t * 2.6) * 5;
  return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px;opacity:' + clamp(p * 1.5) + ';transform:translateY(' + (bob + (1 - p) * 40) + 'px) scale(' + clamp(p, 0, 1.2) + ');transform-origin:50% 90%;filter:drop-shadow(0 18px 30px rgba(0,0,0,0.35))">' + D.kreti[pose].replace(/width="\d+" height="\d+"/, 'width="' + size + '" height="' + size + '"') + '</div>';
}
// liquid glass box: blurred backdrop, inner highlight, moving rim shine, outer glow
function glass(x, y, w, h, r, t, inner, extra) {
  const ang = (t * 60) % 360;
  return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:linear-gradient(160deg,rgba(255,255,255,0.16),' + C.glass + ' 45%,rgba(255,255,255,0.04));backdrop-filter:blur(16px) saturate(150%);-webkit-backdrop-filter:blur(16px) saturate(150%);box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),inset 0 -24px 40px ' + C.glow + ',0 0 44px ' + C.glow + ',0 24px 50px rgba(0,0,0,0.35);overflow:hidden;' + (extra || '') + '">'
    + '<div style="position:absolute;inset:0;border-radius:' + r + 'px;padding:1.5px;background:conic-gradient(from ' + ang + 'deg,' + C.rim + ',rgba(255,255,255,0.05) 25%,' + C.soft + ' 50%,rgba(255,255,255,0.05) 75%,' + C.rim + ');-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude"></div>'
    + '<div style="position:absolute;top:0;bottom:0;width:60%;left:' + (-80 + ((t * 0.35) % 1) * 240) + '%;background:linear-gradient(100deg,rgba(255,255,255,0) 30%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0) 70%)"></div>'
    + inner + '</div>';
}

// ---- scenes: each returns {shape:{x,y,w,h,r}, inner (inside shape), over (on stage)} ----
const S = {
  hook(s, t) {
    const sh = { x: 50, y: 318, w: 260, h: 60, r: 30 };
    const grow = spring(seg(t, 1.35, 2.0));
    return {
      shape: { x: sh.x + (sh.w - sh.w * grow) / 2, y: sh.y, w: Math.max(sh.h * grow, sh.w * grow), h: sh.h * clamp(grow * 1.2), r: 30 }, shapeOp: s.pill ? clamp(grow * 2) : 0,
      inner: '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:10px;' + fadeIn(t, 1.8, 0.5) + '"><span style="width:10px;height:10px;border-radius:50%;background:' + C.accent + ';box-shadow:0 0 10px ' + C.accent + '"></span><span dir="auto" style="unicode-bidi:isolate;font-size:24px;font-weight:800;letter-spacing:1px">' + esc(s.pill) + '</span></div>',
      over: kretiAt(s.pose || 'point', 104, t, 0.5, 26, 74)
        + star(t, 290, 96, 18, 0.9) + star(t, 40, 420, 13, 2.1) + dot(t, 300, 440, 7, 2.2) + dot(t, 60, 250, 5, 1.2)
        + '<div style="position:absolute;right:26px;left:26px;top:204px;font-size:' + (s.size || 38) + 'px;font-weight:800;line-height:1.25">' + words(s.title, t, 0.15, 0.22) + '</div>'
        + (s.sub ? '<div style="position:absolute;right:26px;left:26px;top:398px;text-align:center;font-size:16px;color:' + C.muted + ';' + fadeIn(t, 2.3, 0.5) + '">' + esc(s.sub) + '</div>' : '')
    };
  },
  room(s, t) {
    const pal = D.palette, f = s.focus;
    const on = i => f >= i;
    const fill = i => f === i ? ease(seg(t, 0.4, 1.0)) : (on(i) ? 1 : 0);
    const mix = (i, off) => { const p = fill(i); return p >= 1 ? pal[i].color : (p <= 0 ? off : 'color-mix(in srgb,' + pal[i].color + ' ' + Math.round(p * 100) + '%,' + off + ')'); };
    const pop = i => f === i ? 1 + 0.08 * Math.sin(seg(t, 0.4, 1.0) * Math.PI) : 1;
    const wall = mix(0, 'rgba(255,255,255,0.06)'), sofa = mix(1, 'rgba(255,255,255,0.08)'), acc = mix(2, 'rgba(255,255,255,0.10)');
    const room = '<div style="position:absolute;left:14px;right:14px;top:14px;height:176px;border-radius:20px;overflow:hidden;background:' + wall + '">'
      + '<div style="position:absolute;left:0;right:0;bottom:0;height:28px;background:rgba(0,0,0,0.14)"></div>'
      + '<div style="position:absolute;left:104px;top:22px;width:80px;height:54px;border-radius:7px;background:rgba(255,255,255,0.5);border:5px solid ' + acc + ';transform:scale(' + pop(2) + ')"></div>'
      + '<div style="position:absolute;left:30px;right:30px;bottom:28px;height:60px;border-radius:22px 22px 6px 6px;background:' + sofa + ';transform:scale(' + pop(1) + ');transform-origin:50% 100%"></div>'
      + '<div style="position:absolute;left:44px;bottom:76px;width:44px;height:34px;border-radius:12px;background:' + acc + ';transform:rotate(-8deg) scale(' + pop(2) + ')"></div>'
      + '<div style="position:absolute;right:46px;bottom:76px;width:40px;height:32px;border-radius:12px;background:' + acc + ';transform:rotate(7deg) scale(' + pop(2) + ')"></div>'
      + '<div style="position:absolute;right:14px;bottom:28px;width:6px;height:96px;background:' + acc + '"></div>'
      + '<div style="position:absolute;right:1px;bottom:120px;width:32px;height:20px;border-radius:20px 20px 4px 4px;background:' + acc + '"></div></div>';
    const num = Math.round(pal[f].pct * ease(seg(t, 0.3, 1.1)));
    const bar = pal.map((c, i) => '<div style="height:100%;width:' + c.pct * fill(i) + '%;background:' + c.color + ';box-shadow:0 0 10px ' + c.color + '"></div>').join('');
    return {
      shape: { x: 24, y: 84, w: 312, h: 262, r: 30 }, shapeOp: 1,
      inner: room
        + '<div style="position:absolute;left:14px;right:14px;top:202px;height:8px;border-radius:5px;overflow:hidden;background:rgba(255,255,255,0.08);display:flex;flex-direction:row">' + bar + '</div>'
        + '<div style="position:absolute;right:18px;top:218px;display:flex;align-items:center;gap:10px"><span style="width:22px;height:22px;border-radius:8px;background:' + pal[f].color + ';border:1px solid rgba(255,255,255,0.3)"></span><span style="font-size:15px;color:' + C.muted + '">' + esc(pal[f].label) + '</span></div>'
        + '<span dir="ltr" style="position:absolute;left:18px;top:212px;font-size:34px;font-weight:800;color:' + C.text + ';text-shadow:0 0 18px ' + C.glow + '">' + num + '%</span>',
      over: '<div style="position:absolute;right:26px;left:26px;top:366px;font-size:27px;font-weight:800">' + words(s.title, t, 0.35, 0.14) + '</div>'
        + '<div style="position:absolute;right:26px;left:26px;top:410px;font-size:16.5px;line-height:1.65;color:' + C.muted + '">' + words(s.body, t, 0.8, 0.07) + '</div>'
        + (s.kreti ? kretiAt(s.kreti, 62, t, 0.9, 24, 440) : '') + (f === 2 ? star(t, 300, 70, 18, 0.9) + star(t, 40, 330, 12, 1.1) : '')
    };
  },
  stack(s, t) {
    const pal = D.palette;
    const bar = (c, i) => {
      const p = spring(seg(t, 0.45 + i * 0.3, 1.25 + i * 0.3));
      const y = 196 + i * 72, x = 24 + (1 - p) * 120;
      return glass(x, y, 312, 60, 20, t + i, '<div style="position:absolute;inset:0;display:flex;align-items:center;gap:12px;padding:0 16px"><span style="width:30px;height:30px;border-radius:10px;background:' + c.color + ';box-shadow:0 0 14px ' + c.color + ';border:1px solid rgba(255,255,255,0.35)"></span><span dir="ltr" style="font-size:22px;font-weight:800;width:58px">' + c.pct + '%</span><span style="font-size:16px">' + esc(c.label) + '</span></div>', 'opacity:' + clamp(p * 1.4) + ';filter:blur(' + (1 - clamp(p)) * 6 + 'px);');
    };
    const big = spring(seg(t, 1.9, 2.6));
    return {
      shape: { x: 24, y: 196, w: 312, h: 60, r: 20 }, shapeOp: clamp(1 - seg(t, 0.2, 0.5)),
      inner: '',
      over: '<div style="position:absolute;right:26px;left:26px;top:96px;font-size:26px;font-weight:800">' + words(s.title, t, 0.1, 0.14) + '</div>'
        + pal.map(bar).join('')
        + '<div style="position:absolute;left:0;right:0;top:420px;text-align:center;font-size:' + (40 * (0.6 + 0.4 * big)) + 'px;font-weight:800;color:' + C.accent + ';opacity:' + clamp(big * 1.5) + ';filter:blur(' + (1 - clamp(big)) * 10 + 'px);text-shadow:0 0 24px ' + C.glow + '">' + esc(s.result) + '</div>'
        + star(t, 300, 410, 18, 2.2) + star(t, 46, 452, 14, 2.4)
    };
  },
  // one tip: glowing number tile (or a credited image) inside the glass card, title + body below
  point(s, t) {
    const p = spring(seg(t, 0.3, 1.0));
    const inner = s.image
      ? '<img src="' + s.image + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:' + (s.fit || 'cover') + ';transform:scale(' + (1.04 + 0.06 * seg(t, 0, s.dur)) + ') translateX(' + (-6 * seg(t, 0, s.dur)) + 'px)">'
        + (s.num ? '<span dir="ltr" style="position:absolute;right:12px;top:12px;width:42px;height:42px;border-radius:14px;background:' + C.accent + ';color:#100B14;font-weight:800;font-size:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px ' + C.accent + ';transform:scale(' + p + ')">' + esc(s.num) + '</span>' : '')
      : '<div style="position:absolute;right:28px;top:34px;width:130px;height:130px;border-radius:38px;background:linear-gradient(145deg,#D09BFF,#912EE8 50%,#B91097);box-shadow:0 0 40px rgba(145,46,232,0.55);transform:scale(' + p + ') rotate(' + (1 - p) * -14 + 'deg);display:flex;align-items:center;justify-content:center"><span dir="ltr" style="font-size:72px;font-weight:800;color:#100B14">' + esc(s.num) + '</span></div>'
        + (s.icon ? '' : star(t, 60, 50, 20, 0.8) + star(t, 120, 140, 13, 1.0));
    return {
      shape: s.image ? { x: 24, y: 84, w: 312, h: 250, r: 28 } : { x: 24, y: 92, w: 312, h: 200, r: 30 }, shapeOp: 1,
      inner: inner + (s.kreti && !s.image ? kretiAt(s.kreti, 96, t, 0.6, 36, 70) : ''),
      over: (s.credit ? '<div style="position:absolute;right:30px;left:30px;top:' + (s.image ? 342 : 300) + 'px;font-size:11.5px;color:' + C.muted + ';' + fadeIn(t, 0.8) + '">' + cred(s.credit) + '</div>' : '')
        + '<div style="position:absolute;right:26px;left:26px;top:' + (s.image ? 366 : 318) + 'px;font-size:' + (s.size || 26) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.35, 0.13) + '</div>'
        + '<div style="position:absolute;right:26px;left:26px;top:' + (s.image ? 412 : 364) + 'px;font-size:16.5px;line-height:1.65;color:' + C.muted + '">' + words(s.body, t, 0.85, 0.06) + '</div>'
    };
  },
  // title + up to 4 glass rows; the morph shape becomes the first row
  list(s, t) {
    const pts = s.points || [];
    const row = (x, i) => {
      const p = spring(seg(t, 0.6 + i * 0.4, 1.4 + i * 0.4));
      return glass(24 + (1 - p) * 110, 170 + i * 70, 312, 58, 19, t + i, '<div style="position:absolute;inset:0;display:flex;align-items:center;gap:12px;padding:0 14px"><span dir="ltr" style="flex:none;width:32px;height:32px;border-radius:11px;background:' + C.accent + ';color:#100B14;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px ' + C.accent + '">' + (i + 1) + '</span><span style="font-size:15.5px;line-height:1.4">' + esc(x) + '</span></div>', 'opacity:' + clamp(p * 1.4) + ';filter:blur(' + (1 - clamp(p)) * 6 + 'px);');
    };
    return {
      shape: { x: 24, y: 170, w: 312, h: 58, r: 19 }, shapeOp: clamp(1 - seg(t, 0.35, 0.65)), inner: '',
      over: (s.tag ? '<div style="position:absolute;right:26px;top:80px;display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;background:' + C.glass + ';border:1px solid ' + C.rim + ';font-size:13px;font-weight:700;color:' + C.ink + ';' + fadeIn(t, 0.1) + '">✦ ' + esc(s.tag) + '</div>' : '')
        + '<div style="position:absolute;right:26px;left:26px;top:116px;font-size:' + (s.size || 26) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.2, 0.12) + '</div>'
        + pts.slice(0, 4).map(row).join('')
        + (s.kreti ? kretiAt(s.kreti, 70, t, 1.2, 22, 446) : '')
    };
  },
  // wrong vs right, two glass cards
  compare(s, t) {
    const box = (o, good, at, y) => {
      const p = spring(seg(t, at, at + 0.8));
      const col = good ? '#912EE8' : '#FF6B6B';
      return glass(24 + (1 - p) * 110, y, 312, 130, 24, t + at, '<div style="position:absolute;inset:0;padding:16px">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="width:30px;height:30px;border-radius:50%;background:' + col + ';color:#100B14;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px ' + col + '">' + (good ? '✓' : '✕') + '</span><span style="font-size:19px;font-weight:800">' + esc(o.label) + '</span></div>'
        + '<div style="font-size:15.5px;line-height:1.6;color:' + C.muted + '">' + esc(o.text) + '</div></div>', 'opacity:' + clamp(p * 1.4) + ';filter:blur(' + (1 - clamp(p)) * 6 + 'px);border:1px solid ' + col + '55;');
    };
    return {
      shape: { x: 24, y: 168, w: 312, h: 130, r: 24 }, shapeOp: clamp(1 - seg(t, 0.4, 0.7)), inner: '',
      over: '<div style="position:absolute;right:26px;left:26px;top:86px;font-size:' + (s.size || 25) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.1, 0.12) + '</div>'
        + box(s.bad, false, 0.55, 168) + box(s.good, true, 1.35, 316)
        + (s.kreti ? kretiAt(s.kreti, 62, t, 2.0, 22, 452) : '')
    };
  },
  // a credited work inside the glass frame with a slow camera drift (Ken Burns)
  image(s, t) {
    const z = 1.05 + 0.1 * seg(t, 0, s.dur);
    return {
      shape: { x: 24, y: 80, w: 312, h: s.tall ? 360 : 300, r: 28 }, shapeOp: 1,
      inner: '<img src="' + s.image + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:' + (s.fit || 'cover') + ';transform:scale(' + z + ') translateX(' + (-10 * seg(t, 0, s.dur)) + 'px)">',
      over: (s.chip ? '<div style="position:absolute;right:34px;top:94px;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,0.35);backdrop-filter:blur(10px);color:#fff;font-size:13px;font-weight:700;' + fadeIn(t, 0.6) + '">' + esc(s.chip) + '</div>' : '')
        + '<div style="position:absolute;right:26px;left:26px;top:' + (s.tall ? 456 : 398) + 'px;font-size:' + (s.size || 24) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.45, 0.12) + '</div>'
        + (s.credit ? '<div style="position:absolute;right:26px;left:26px;top:' + (s.tall ? 492 : 450) + 'px;font-size:12px;color:' + C.muted + ';' + fadeIn(t, 1.0) + '">' + cred(s.credit) + '</div>' : '')
    };
  },
  // one big statement, words land one by one with a scale-down from blur
  statement(s, t) {
    const ws = esc(s.text).split(' ');
    const big = ws.map((w, i) => {
      const p = spring(seg(t, 0.2 + i * 0.25, 0.9 + i * 0.25));
      return '<span style="display:inline-block;opacity:' + clamp(p * 1.4) + ';filter:blur(' + (1 - clamp(p)) * 10 + 'px);transform:translateX(' + (1 - clamp(p)) * 30 + 'px) scale(' + (1.6 - 0.6 * clamp(p)) + ')">' + w + '</span>';
    }).join(' ');
    return {
      shape: { x: 60, y: 420, w: 240, h: 6, r: 3 }, shapeOp: 1, inner: '',
      over: '<div style="position:absolute;right:26px;left:26px;top:' + (s.top || 180) + 'px;text-align:center;font-size:' + (s.size || 40) + 'px;font-weight:800;line-height:1.3;text-shadow:0 0 30px ' + C.glow + '">' + big + '</div>'
        + (s.sub ? '<div style="position:absolute;right:26px;left:26px;top:440px;text-align:center;font-size:16px;color:' + C.muted + ';' + fadeIn(t, 1.4) + '">' + esc(s.sub) + '</div>' : '')
        + star(t, 290, 150, 18, 1.0) + star(t, 52, 360, 13, 1.3) + dot(t, 300, 380, 6, 1.1)
    };
  },
  end(s, t) {
    return {
      shape: { x: 40, y: 336, w: 280, h: 62, r: 31 }, shapeOp: 1,
      inner: '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:800;' + fadeIn(t, 0.45, 0.5) + '">تابع كريتيفيا ساينس</div>',
      over: kretiAt('wave', 170, t, 0.05, 95, 96)
        + '<div dir="ltr" style="position:absolute;left:0;right:0;top:410px;text-align:center;font-size:17px;font-weight:700;color:' + C.muted + ';' + fadeIn(t, 0.8, 0.5) + '">@creativia.sci</div>'
        + '<div style="position:absolute;left:0;right:0;top:446px;text-align:center;font-family:Playpen Sans Arabic,sans-serif;font-size:17px;color:' + C.ink + ';' + fadeIn(t, 1.1, 0.6) + '">' + esc(s.note || 'كل يوم علم يدهشك، الساعة 9 مساءً') + '</div>'
        + star(t, 70, 100, 18, 0.4) + star(t, 280, 270, 14, 0.6) + dot(t, 300, 120, 6, 0.5)
    };
  }
};

let starts = [], total = 0;
D.scenes.forEach(s => { starts.push(total); total += s.dur; });
window.TOTAL = total;
const MORPH = 0.6;
window.drawFrame = function (t) {
  let k = 0;
  while (k < D.scenes.length - 1 && t >= starts[k + 1]) k++;
  const sc = D.scenes[k], lt = t - starts[k];
  const cur = S[sc.type](sc, lt);
  let shape = cur.shape, op = cur.shapeOp;
  if (k > 0 && lt < MORPH) {
    const prevS = D.scenes[k - 1], prev = S[prevS.type](prevS, prevS.dur);
    const p = inout(lt / MORPH);
    shape = { x: lerp(prev.shape.x, shape.x, p), y: lerp(prev.shape.y, shape.y, p), w: lerp(prev.shape.w, shape.w, p), h: lerp(prev.shape.h, shape.h, p), r: lerp(prev.shape.r, shape.r, p) };
    op = lerp(prev.shapeOp, op, p);
  }
  // content enters from the right, leaves to the left
  const inP = k === 0 ? 1 : ease(seg(lt, 0.15, 0.6));
  const outP = k === D.scenes.length - 1 ? 0 : ease(seg(lt, sc.dur - 0.35, sc.dur));
  const cOp = inP * (1 - outP), cX = (1 - inP) * 36 - outP * 36, cB = (1 - inP + outP) * 6;
  const innerOp = k > 0 && lt < MORPH ? seg(lt, MORPH * 0.6, MORPH) : 1 - outP;
  // camera: slow push + slight 3D tilt
  const push = 1 + 0.035 * seg(lt, 0, sc.dur), tiltY = Math.sin(t * 0.45) * 3.5, tiltX = Math.cos(t * 0.37) * 2;
  document.getElementById('stage').innerHTML = bg(t)
    + '<div style="position:absolute;top:22px;right:22px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:' + C.muted + '"><span style="width:7px;height:7px;border-radius:50%;background:' + C.accent + ';opacity:' + (0.5 + 0.5 * Math.sin(t * 5)) + '"></span>' + esc(D.badge || 'كريتيفيا ساينس') + '</div>'
    + '<div style="position:absolute;top:20px;left:22px">' + D.mark + '</div>'
    + '<div style="position:absolute;inset:0;perspective:900px"><div style="position:absolute;inset:0;transform:scale(' + push + ') rotateY(' + tiltY + 'deg) rotateX(' + tiltX + 'deg);transform-style:preserve-3d">'
    + (op > 0.01 ? glass(shape.x, shape.y, shape.w, shape.h, shape.r, t, '<div style="position:absolute;inset:0;opacity:' + innerOp + '">' + cur.inner + '</div>', 'opacity:' + op + ';') : '')
    + '<div style="position:absolute;inset:0;opacity:' + cOp + ';transform:translateX(' + cX + 'px);filter:blur(' + cB + 'px)">' + cur.over + '</div>'
    + '</div></div>';
};
`;

function sfxPlan(spec) {
  const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/sfx/library.json'), 'utf8')).tracks;
  const pick = role => lib.filter(x => x.role === role);
  const out = []; let t0 = 0, n = 0;
  for (const s of spec.scenes) {
    for (const [at, role, vol] of (s.sfx || CUES[s.type] || [])) {
      const c = pick(role); if (!c.length) continue;
      const f = c[(n++) % c.length];
      out.push({ t: Math.max(0, t0 + at - f.onset), file: path.join(ROOT, 'assets/sfx', f.file), vol, max: Math.min(f.duration, 2.5) });
    }
    t0 += s.dur;
  }
  // never two effects within 0.15 s
  return out.sort((a, b) => a.t - b.t).filter((c, i, a) => i === 0 || c.t - a[i - 1].t > 0.15);
}

(async () => {
  const id = process.argv[2];
  if (!id) throw new Error('usage: node engine/reel2.js <post-id>');
  const dir = path.join(ROOT, 'posts', id);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'reel.json'), 'utf8'));
  const mode = spec.mode || 'dark';
  const theme = THEME[mode];
  for (const sc of spec.scenes) { applyArt(sc, mode); if (sc.image) sc.image = await toDataUri(sc.image); }
  // voiceover: each scene lasts at least as long as its clip (+ lead-in and breath)
  const VLEAD = 0.35;
  const vjson = path.join(dir, 'voice', 'voice.json');
  const voice = spec.voice && fs.existsSync(vjson) ? JSON.parse(fs.readFileSync(vjson, 'utf8')).clips : [];
  for (const c of voice) { const sc = spec.scenes[c.scene]; sc.dur = Math.max(sc.dur || 0, Math.round((c.dur + VLEAD + 0.55) * 100) / 100); }
  const poses = {};
  for (const p of ['wave', 'point', 'jump', 'think']) poses[p] = kreti({ pose: p, size: 240, mode, cut: theme.cut, look: 'dream' });
  const grain = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"/></filter><rect width="180" height="180" filter="url(#n)"/></svg>').toString('base64');
  const data = { ...spec, theme, kreti: poses, mark: mark({ size: 24 }), grain };
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${FONT_CSS}
<style>body{margin:0;background:#000}#stage{position:relative;width:360px;height:640px;overflow:hidden;font-family:'Rubik',sans-serif;color:${theme.text};direction:rtl}</style></head>
<body><div id="stage"></div><script>window.REEL=${JSON.stringify(data)};</script><script>${PAGE}</script></body></html>`;
  const tmp = path.join(__dirname, '_tmp'); fs.mkdirSync(tmp, { recursive: true });
  const f = path.join(tmp, 'reel2.html'); fs.writeFileSync(f, html);

  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
  await page.goto('file://' + f, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  const total = await page.evaluate('window.TOTAL');
  const only = process.env.FRAMES ? process.env.FRAMES.split(',').map(Number) : null;
  const el = await page.$('#stage');
  if (only) { // preview stills
    for (const s of only) { await page.evaluate(x => window.drawFrame(x), s); await el.screenshot({ path: path.join(tmp, `still-${s}.jpg`), type: 'jpeg', quality: 85 }); }
    await browser.close(); return;
  }
  const silent = path.join(tmp, 'silent.mp4');
  const frames = Math.round(total * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < frames; i++) {
    await page.evaluate(x => window.drawFrame(x), i / FPS);
    const buf = await el.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 90 === 0) console.log('frame', i, '/', frames);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  await page.evaluate(x => window.drawFrame(x), spec.coverAt || 2.6);
  await el.screenshot({ path: path.join(dir, 'reel-cover.jpg'), type: 'jpeg', quality: 92 });
  await browser.close();

  // audio: music bed (ducked under the voice) + voice + sound effects
  const cues = sfxPlan(spec);
  const music = spec.music ? path.join(ROOT, spec.music) : null;
  const starts = []; { let a = 0; for (const sc of spec.scenes) { starts.push(a); a += sc.dur; } }
  const args = ['-y', '-loglevel', 'error', '-i', silent];
  const parts = [], fx = [], vo = [];
  let idx = 1;
  let mus = null;
  if (music) {
    args.push('-ss', String(spec.musicStart || 0), '-i', music);
    parts.push(`[${idx}:a]atrim=0:${total},asetpts=PTS-STARTPTS,volume=${spec.musicVolume || (voice.length ? 0.4 : 0.55)},afade=t=in:d=0.5,afade=t=out:st=${(total - 1.6).toFixed(2)}:d=1.6[m]`);
    mus = '[m]'; idx++;
  }
  for (const c of voice) {
    args.push('-i', path.join(dir, 'voice', c.file));
    const ms = Math.round((starts[c.scene] + VLEAD) * 1000);
    parts.push(`[${idx}:a]volume=1.0,adelay=${ms}|${ms}[v${idx}]`);
    vo.push(`[v${idx}]`); idx++;
  }
  for (const c of cues) {
    args.push('-i', c.file);
    const ms = Math.round(c.t * 1000);
    parts.push(`[${idx}:a]atrim=0:${c.max},afade=t=out:st=${Math.max(0, c.max - 0.3)}:d=0.3,volume=${voice.length ? c.vol * 0.7 : c.vol},adelay=${ms}|${ms}[s${idx}]`);
    fx.push(`[s${idx}]`); idx++;
  }
  const out = path.join(dir, 'reel.mp4');
  const layers = [];
  if (vo.length) {
    parts.push(`${vo.join('')}amix=inputs=${vo.length}:normalize=0,apad,atrim=0:${total}${mus ? ',asplit=2[vo][sc]' : '[vo]'}`);
    if (mus) { parts.push(`${mus}[sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md]`); layers.push('[md]'); }
    layers.push('[vo]');
  } else if (mus) layers.push(mus);
  layers.push(...fx);
  if (layers.length) {
    parts.push(`${layers.join('')}amix=inputs=${layers.length}:normalize=0,apad,atrim=0:${total},loudnorm=I=-14:TP=-1.5:LRA=11[a]`);
    args.push('-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', out);
  } else args.push('-c', 'copy', out);
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  fs.writeFileSync(path.join(dir, 'reel-rendered.json'), JSON.stringify({ file: `posts/${id}/reel.mp4`, engine: 2, seconds: total, audio: music ? 'embedded' : 'none', voice: voice.length, sfx: cues.length, renderedAt: new Date().toISOString() }, null, 2));
  console.log('reel v2 done', id, total + 's', cues.length, 'sfx');
})().catch(e => { console.error(e); process.exit(1); });
