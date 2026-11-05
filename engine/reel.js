// Renders posts/<id>/reel.json into posts/<id>/reel.mp4 (1080 x 1920, 30 fps, silent).
// Music is added on Instagram's side (Metricool audioConfiguration), so the video has no audio track.
// Usage: node engine/reel.js <post-id>
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const { kreti, mark } = require('./kreti');
const { THEMES, ICONS } = require('./slides');

const ROOT = path.join(__dirname, '..');
const FPS = 30;
const FONT_CSS = ['rubik/400', 'rubik/500', 'rubik/700', 'rubik/800', 'playpen-sans-arabic/400', 'playpen-sans-arabic/600']
  .map(f => `<link rel="stylesheet" href="file://${path.join(ROOT, 'node_modules/@fontsource', f)}.css">`).join('');

async function toDataUri(src) {
  if (!src) return src;
  const local = path.join(ROOT, src);
  if (!/^https?:/.test(src) && fs.existsSync(local)) {
    const ext = path.extname(local).slice(1).toLowerCase();
    return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fs.readFileSync(local).toString('base64')}`;
  }
  const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126', 'Referer': new URL(src).origin + '/' } });
  if (!res.ok) throw new Error(`Image download failed (${res.status}): ${src}`);
  return `data:${(res.headers.get('content-type') || 'image/jpeg').split(';')[0]};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
}

// Runs inside the page. Draws the frame for time t (seconds). Pure function of t, so every frame is exact.
const PAGE_SCRIPT = `
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const back = x => { x = clamp(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const cred = s => esc(s).replace(/@[A-Za-z0-9._]+/g, m => '\u2066' + m + '\u2069');
const D = window.REEL, C = D.theme;

function words(text, t, start, step) {
  return esc(text).split(' ').map((w, i) => {
    const p = ease(seg(t, start + i * step, start + i * step + 0.35));
    return '<span style="display:inline-block;opacity:' + p + ';transform:translateY(' + (1 - p) * 18 + 'px)">' + w + '</span>';
  }).join(' ');
}
function chip(c, t, at, rot, pos) {
  if (!c) return '';
  const p = back(seg(t, at, at + 0.45));
  const fl = Math.sin(t * 2 + at) * 3;
  return '<span style="position:absolute;' + pos + ';opacity:' + clamp(p) + ';transform:translateY(' + fl + 'px) rotate(' + rot + 'deg) scale(' + (0.6 + 0.4 * p) + ');display:flex;align-items:center;gap:7px;background:' + C.glass + ';border:1px solid ' + C.glassBorder + ';box-shadow:' + C.chipShadow + ';border-radius:16px;padding:8px 13px;font-size:15px;font-weight:700;white-space:nowrap"><svg width="18" height="18" viewBox="0 0 24 24"><path d="' + (D.icons[c.icon] || D.icons.star) + '" fill="none" stroke="' + C.ink + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(c.label) + '</span>';
}
function kreti(pose, size, t, at, pos, extra) {
  const p = back(seg(t, at, at + 0.5));
  const bob = Math.sin(t * 3.2) * 6;
  const squash = 1 + Math.sin(t * 6.4) * 0.015;
  return '<div style="position:absolute;' + pos + ';width:' + size + 'px;height:' + size + 'px;opacity:' + clamp(p * 1.4) + ';transform:translateY(' + (bob + (1 - p) * 60) + 'px) scale(' + (p * squash) + ',' + (p / squash) + ');transform-origin:50% 90%;' + (extra || '') + '">' + D.kreti[pose].replace(/width="\\d+" height="\\d+"/, 'width="' + size + '" height="' + size + '"') + '</div>';
}
function star(t, x, y, s, at) {
  const p = clamp(seg(t, at, at + 0.4));
  const tw = 0.75 + 0.25 * Math.sin(t * 5 + x);
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" style="position:absolute;left:' + x + 'px;top:' + y + 'px;opacity:' + p * tw + ';transform:scale(' + (p * tw) + ') rotate(' + t * 40 + 'deg);filter:drop-shadow(0 0 5px ' + C.starGlow + ')"><path fill="' + C.star + '" d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z"/></svg>';
}
function hand(text, t, at, pos, rot, size) {
  const p = ease(seg(t, at, at + 0.6));
  return '<div style="position:absolute;' + pos + ';opacity:' + p + ';transform:rotate(' + rot + 'deg);font-family:Playpen Sans Arabic,sans-serif;font-size:' + (size || 20) + 'px;color:' + C.ink + ';clip-path:inset(0 0 0 ' + (1 - p) * 100 + '%)">' + esc(text) + '</div>';
}
function bg(t) {
  const dx = Math.sin(t * 0.5) * 20, dy = Math.cos(t * 0.4) * 20;
  return '<div style="position:absolute;inset:0;background:linear-gradient(165deg,' + C.bg1 + ',' + C.bg2 + ')"></div>'
    + '<div style="position:absolute;inset:0;background-image:linear-gradient(' + C.grid + ' 1px,transparent 1px),linear-gradient(90deg,' + C.grid + ' 1px,transparent 1px);background-size:30px 30px;transform:translateY(' + (t * 6 % 30) + 'px)"></div>'
    + '<div style="position:absolute;width:520px;height:520px;left:' + (-80 + dx) + 'px;top:' + (120 + dy) + 'px;background:radial-gradient(circle,' + C.orb1 + ' 0%,' + C.orb1Mid + ' 35%,rgba(0,0,0,0) 68%)"></div>'
    + '<div style="position:absolute;width:420px;height:420px;right:' + (-170 - dx) + 'px;top:' + (-140 + dy) + 'px;background:radial-gradient(circle,' + C.orb3 + ' 0%,rgba(0,0,0,0) 68%)"></div>'
    + '<div style="position:absolute;width:420px;height:420px;right:' + (-150 + dy) + 'px;bottom:' + (-120 + dx) + 'px;background:radial-gradient(circle,' + C.orb2 + ' 0%,rgba(0,0,0,0) 68%)"></div>';
}
function header(t) {
  return '<div style="position:absolute;top:22px;left:22px;right:22px;display:flex;justify-content:space-between;align-items:center">'
    + '<span style="display:flex;align-items:center;gap:7px;background:' + C.glass + ';border:1px solid ' + C.glassBorder + ';border-radius:999px;padding:7px 13px;font-size:14px;font-weight:600"><span style="width:8px;height:8px;border-radius:50%;background:#2EE86B;opacity:' + (0.5 + 0.5 * Math.sin(t * 5)) + '"></span>' + esc(D.badge || 'كريتيفيا') + '</span>' + D.mark + '</div>';
}
function card(inner, p, pos) {
  return '<div style="position:absolute;' + pos + ';opacity:' + clamp(p * 1.3) + ';transform:translateY(' + (1 - p) * 40 + 'px);background:' + C.glass + ';border:1px solid ' + C.glassBorder + ';box-shadow:' + C.chipShadow + ';border-radius:24px;padding:20px">' + inner + '</div>';
}

// ---- scene types ----
const S = {
  hook(s, t, T) {
    return kreti(s.pose || 'point', 210, t, 0.1, 'left:70px;top:72px')
      + chip(s.chips && s.chips[0], t, 0.5, -6, 'right:18px;top:96px') + chip(s.chips && s.chips[1], t, 0.75, 5, 'right:28px;top:236px')
      + (s.note ? hand(s.note, t, 0.9, 'left:22px;top:66px', -8, 20) : '')
      + star(t, 250, 78, 20, 0.6) + star(t, 50, 280, 14, 0.9)
      + '<div style="position:absolute;left:22px;right:22px;top:318px;font-size:' + (s.size || 33) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.6, 0.12) + '</div>'
      + (s.sub ? '<div style="position:absolute;left:22px;right:22px;top:' + (s.subTop || 416) + 'px;font-size:17px;color:' + C.muted + ';opacity:' + ease(seg(t, 1.6, 2.1)) + '">' + esc(s.sub) + '</div>' : '');
  },
  room(s, t, T) {
    // a small room built from the palette; s.focus = 0,1,2 lights up wall / sofa / accents; 3 = all
    const pal = D.palette, f = s.focus;
    const on = i => f === 3 || f >= i;
    const pop = i => f === i ? back(seg(t, 0.35, 0.85)) : 1;
    const wall = on(0) ? pal[0].color : C.ph;
    const sofa = on(1) ? pal[1].color : 'rgba(0,0,0,0.06)';
    const acc = on(2) ? pal[2].color : 'rgba(0,0,0,0.05)';
    const glow = i => f === i ? 'box-shadow:0 0 0 4px ' + C.glassBorder + ',0 0 30px ' + pal[i].color + ';' : '';
    const room = '<div style="position:absolute;left:24px;right:24px;top:78px;height:200px;border-radius:24px;overflow:hidden;background:' + wall + ';' + glow(0) + 'transition:none">'
      + '<div style="position:absolute;left:0;right:0;bottom:0;height:32px;background:rgba(0,0,0,0.08)"></div>'
      + '<div style="position:absolute;left:118px;top:26px;width:86px;height:58px;border-radius:7px;background:rgba(255,255,255,0.55);border:6px solid ' + acc + ';transform:scale(' + pop(2) + ')"></div>'
      + '<div style="position:absolute;left:34px;right:34px;bottom:32px;height:66px;transform:scale(' + pop(1) + ');transform-origin:50% 100%;' + glow(1) + 'border-radius:24px 24px 6px 6px;background:' + sofa + '"></div>'
      + '<div style="position:absolute;left:50px;bottom:84px;width:48px;height:38px;border-radius:14px;background:' + acc + ';transform:rotate(-8deg) scale(' + pop(2) + ')"></div>'
      + '<div style="position:absolute;right:52px;bottom:84px;width:44px;height:36px;border-radius:14px;background:' + acc + ';transform:rotate(7deg) scale(' + pop(2) + ')"></div>'
      + '<div style="position:absolute;right:16px;bottom:32px;width:6px;height:104px;background:' + acc + ';transform:scaleY(' + pop(2) + ');transform-origin:50% 100%"></div>'
      + '<div style="position:absolute;right:2px;bottom:132px;width:34px;height:22px;border-radius:24px 24px 4px 4px;background:' + acc + ';transform:scale(' + pop(2) + ')"></div>'
      + '</div>';
    // proportion bar
    let x = 0, bar = '';
    pal.forEach((c, i) => {
      const w = c.pct * ease(seg(t, 0.2 + i * 0.15, 0.7 + i * 0.15));
      bar += '<div style="position:absolute;top:0;bottom:0;right:' + x + '%;width:' + w + '%;background:' + c.color + ';opacity:' + (on(i) ? 1 : 0.25) + '"></div>';
      x += c.pct;
    });
    const big = f < 3 ? pal[f] : null;
    const num = big ? Math.round(big.pct * ease(seg(t, 0.2, 1.0))) : 0;
    return room
      + '<div style="position:absolute;left:24px;right:24px;top:292px;height:12px;border-radius:7px;overflow:hidden;background:rgba(0,0,0,0.06)">' + bar + '</div>'
      + (big ? '<div style="position:absolute;right:22px;top:314px;display:flex;align-items:baseline;gap:10px">'
          + '<span dir="ltr" style="font-size:68px;font-weight:800;line-height:1;color:' + C.text + '">' + num + '<span style="font-size:34px">%</span></span></div>'
          + '<div style="position:absolute;right:22px;left:22px;top:392px;font-size:25px;font-weight:800">' + words(s.title, t, 0.4, 0.1) + '</div>'
          + '<div style="position:absolute;right:22px;left:22px;top:432px;font-size:16px;line-height:1.6;color:' + C.muted + ';opacity:' + ease(seg(t, 0.9, 1.4)) + '">' + esc(s.body) + '</div>'
        : '<div style="position:absolute;right:22px;left:22px;top:310px;font-size:25px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.3, 0.1) + '</div>'
          + '<div style="position:absolute;right:22px;left:22px;top:384px;display:flex;flex-direction:column;gap:7px">'
          + pal.map((c, i) => { const p = ease(seg(t, 0.7 + i * 0.25, 1.1 + i * 0.25)); return '<div style="opacity:' + p + ';transform:translateX(' + (1 - p) * -30 + 'px);display:flex;align-items:center;gap:12px;background:' + C.glass + ';border:1px solid ' + C.glassBorder + ';border-radius:14px;padding:7px 12px"><span style="width:26px;height:26px;border-radius:9px;background:' + c.color + ';border:1px solid rgba(0,0,0,0.08)"></span><span dir="ltr" style="font-size:18px;font-weight:800;width:52px">' + c.pct + '%</span><span style="font-size:16px">' + esc(c.label) + '</span></div>'; }).join('')
          + '</div>')
      + (s.kreti ? kreti(s.kreti, 84, t, 0.6, 'left:12px;top:' + (s.focus === 3 ? 470 : 300) + 'px') : '')
      + (s.note ? hand(s.note, t, 1.0, 'left:98px;top:' + (s.focus === 3 ? 500 : 326) + 'px', -6, 18) : '');
  },
  // one tip: big number (or framed image) + title + body
  point(s, t, T) {
    let top;
    if (s.image) {
      const z = 1 + 0.08 * clamp(t / s.dur);
      const p = ease(seg(t, 0, 0.5));
      top = '<div style="position:absolute;left:24px;right:24px;top:78px;height:230px;border-radius:24px;overflow:hidden;opacity:' + p + ';box-shadow:' + C.chipShadow + ';border:5px solid ' + C.glassBorder + '"><img src="' + s.image + '" style="width:100%;height:100%;object-fit:cover;transform:scale(' + z + ')"></div>'
        + (s.credit ? '<div style="position:absolute;left:30px;top:318px;font-size:12px;color:' + C.muted + ';opacity:' + p + '">' + cred(s.credit) + '</div>' : '');
    } else {
      const p = back(seg(t, 0.05, 0.55));
      top = '<div style="position:absolute;right:24px;top:96px;width:150px;height:150px;border-radius:44px;background:linear-gradient(145deg,#9BFFC2,#2EE86B 50%,#10B9A6);box-shadow:0 18px 40px rgba(46,232,107,0.35);transform:scale(' + p + ') rotate(' + (1 - p) * -12 + 'deg);display:flex;align-items:center;justify-content:center"><span dir="ltr" style="font-size:84px;font-weight:800;color:#0B1410">' + esc(s.num) + '</span></div>'
        + (s.kreti ? kreti(s.kreti, 130, t, 0.4, 'left:30px;top:120px') : '')
        + (s.note ? hand(s.note, t, 0.9, 'left:40px;top:96px', -6, 18) : '');
    }
    const y = s.image ? 342 : 290;
    return top
      + (s.image && s.num ? '<span dir="ltr" style="position:absolute;right:24px;top:' + (y - 2) + 'px;width:40px;height:40px;border-radius:13px;background:#2EE86B;color:#0B1410;font-weight:800;font-size:22px;display:flex;align-items:center;justify-content:center;transform:scale(' + back(seg(t, 0.3, 0.7)) + ')">' + esc(s.num) + '</span>' : '')
      + '<div style="position:absolute;right:' + (s.image && s.num ? 74 : 24) + 'px;left:24px;top:' + y + 'px;font-size:' + (s.size || 26) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.3, 0.09) + '</div>'
      + '<div style="position:absolute;right:24px;left:24px;top:' + (y + (s.image ? 52 : 80)) + 'px;font-size:16.5px;line-height:1.65;color:' + C.muted + ';opacity:' + ease(seg(t, 0.9, 1.4)) + ';transform:translateY(' + (1 - ease(seg(t, 0.9, 1.4))) * 10 + 'px)">' + esc(s.body) + '</div>';
  },
  // title + up to 4 points
  list(s, t, T) {
    const pts = (s.points || []).map((x, i) => {
      const p = ease(seg(t, 0.7 + i * 0.35, 1.1 + i * 0.35));
      return '<div style="opacity:' + p + ';transform:translateX(' + (1 - p) * -30 + 'px);display:flex;align-items:center;gap:12px;background:' + C.glass + ';border:1px solid ' + C.glassBorder + ';box-shadow:' + C.chipShadow + ';border-radius:16px;padding:11px 14px"><span dir="ltr" style="flex:none;width:30px;height:30px;border-radius:10px;background:#2EE86B;color:#0B1410;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center">' + (i + 1) + '</span><span style="font-size:16px;line-height:1.45">' + esc(x) + '</span></div>';
    }).join('');
    return (s.tag ? chip({ icon: s.tagIcon || 'spark', label: s.tag }, t, 0.05, -4, 'right:24px;top:84px') : '')
      + '<div style="position:absolute;right:24px;left:24px;top:132px;font-size:' + (s.size || 28) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.2, 0.09) + '</div>'
      + '<div style="position:absolute;right:24px;left:24px;top:' + (s.top || 230) + 'px;display:flex;flex-direction:column;gap:10px">' + pts + '</div>'
      + (s.kreti ? kreti(s.kreti, 78, t, 0.3, 'left:16px;top:62px') : '')
      + (s.note ? hand(s.note, t, 0.8, 'left:98px;top:88px', -6, 17) : '');
  },
  // wrong vs right
  compare(s, t, T) {
    const box = (o, good, at, top) => {
      const p = back(seg(t, at, at + 0.5));
      const col = good ? '#2EE86B' : '#FF6B6B';
      return '<div style="position:absolute;right:24px;left:24px;top:' + top + 'px;opacity:' + clamp(p) + ';transform:scale(' + (0.85 + 0.15 * p) + ');background:' + C.glass + ';border:2px solid ' + col + ';box-shadow:' + C.chipShadow + ';border-radius:20px;padding:16px">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="width:30px;height:30px;border-radius:50%;background:' + col + ';color:#fff;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center">' + (good ? '✓' : '✕') + '</span><span style="font-size:19px;font-weight:800">' + esc(o.label) + '</span></div>'
        + '<div style="font-size:16px;line-height:1.6;color:' + C.muted + '">' + esc(o.text) + '</div></div>';
    };
    return '<div style="position:absolute;right:24px;left:24px;top:86px;font-size:' + (s.size || 26) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.1, 0.09) + '</div>'
      + box(s.bad, false, 0.6, 180) + box(s.good, true, 1.5, 330)
      + (s.kreti ? kreti(s.kreti, 80, t, 2.0, 'left:10px;top:446px') : '');
  },
  // a credited image with slow zoom
  image(s, t, T) {
    const z = 1.02 + 0.08 * clamp(t / s.dur);
    const p = ease(seg(t, 0, 0.5));
    return '<div style="position:absolute;left:24px;right:24px;top:74px;height:320px;border-radius:26px;overflow:hidden;opacity:' + p + ';box-shadow:' + C.chipShadow + ';border:5px solid ' + C.glassBorder + '"><img src="' + s.image + '" style="width:100%;height:100%;object-fit:cover;transform:scale(' + z + ')"></div>'
      + chip(s.chip, t, 0.4, -5, 'right:12px;top:58px')
      + '<div style="position:absolute;right:24px;left:24px;top:412px;font-size:' + (s.size || 24) + 'px;font-weight:800;line-height:1.3">' + words(s.title, t, 0.4, 0.09) + '</div>'
      + '<div style="position:absolute;right:24px;left:24px;top:' + (s.creditTop || 470) + 'px;font-size:13px;color:' + C.muted + ';opacity:' + ease(seg(t, 1.0, 1.4)) + '">' + cred(s.credit) + '</div>';
  },
  end(s, t, T) {
    const p = ease(seg(t, 0.5, 1.0));
    return kreti('wave', 200, t, 0.05, 'left:80px;top:70px')
      + hand(s.note || 'احفظ الريل!', t, 0.6, 'right:24px;top:84px', 8, 19)
      + star(t, 70, 70, 20, 0.3) + star(t, 300, 260, 14, 0.5)
      + '<div style="position:absolute;left:20px;right:20px;top:300px;text-align:center;opacity:' + p + ';transform:translateY(' + (1 - p) * 20 + 'px)">'
      + '<div style="font-size:34px;font-weight:800">تابع كريتيفيا</div>'
      + '<div dir="ltr" style="font-size:17px;font-weight:700;color:' + C.muted + ';margin-top:6px">@creativia.mag</div>'
      + '<div style="font-family:Playpen Sans Arabic,sans-serif;font-size:18px;color:' + C.ink + ';margin-top:10px">' + esc(s.line || 'كل يوم شي مبدع، الساعة 9 بالليل') + '</div>'
      + '<div style="display:flex;justify-content:center;gap:12px;margin-top:22px"><span style="background:' + C.pillBg + ';color:' + C.pillText + ';font-size:16px;font-weight:700;padding:11px 22px;border-radius:999px">احفظ الريل</span><span style="background:' + C.glass + ';border:1px solid ' + C.glassBorder + ';font-size:16px;font-weight:700;padding:10px 20px;border-radius:999px">شاركه</span></div></div>';
  }
};

let starts = [], total = 0;
D.scenes.forEach(s => { starts.push(total); total += s.dur; });
window.TOTAL = total;
window.drawFrame = function (t) {
  let k = 0;
  while (k < D.scenes.length - 1 && t >= starts[k + 1]) k++;
  const s = D.scenes[k], lt = t - starts[k];
  const inP = k === 0 ? 1 : ease(seg(lt, 0, 0.35));
  const outP = k === D.scenes.length - 1 ? 0 : ease(seg(lt, s.dur - 0.3, s.dur));
  const body = S[s.type](s, lt, t);
  document.getElementById('stage').innerHTML = bg(t) + header(t)
    + '<div style="position:absolute;inset:0;opacity:' + (inP * (1 - outP)) + ';transform:translateX(' + ((1 - inP) * -40 + outP * 40) + 'px)">' + body + '</div>';
};
`;

(async () => {
  const id = process.argv[2];
  if (!id) throw new Error('usage: node engine/reel.js <post-id>');
  const dir = path.join(ROOT, 'posts', id);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'reel.json'), 'utf8'));
  const mode = spec.mode || 'light';
  const theme = THEMES[mode];
  for (const s of spec.scenes) if (s.image) s.image = await toDataUri(s.image);
  const poses = {};
  for (const p of ['wave', 'point', 'jump', 'think']) poses[p] = kreti({ pose: p, size: 240, mode, cut: theme.cut, look: 'dream' });
  const data = { ...spec, theme, icons: ICONS, kreti: poses, mark: mark({ size: 26 }) };

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${FONT_CSS}
<style>body{margin:0;background:#000}#stage{position:relative;width:360px;height:640px;overflow:hidden;font-family:'Rubik',sans-serif;color:${theme.text};direction:rtl}</style></head>
<body><div id="stage"></div><script>window.REEL=${JSON.stringify(data)};</script><script>${PAGE_SCRIPT}</script></body></html>`;
  const tmp = path.join(__dirname, '_tmp');
  fs.mkdirSync(tmp, { recursive: true });
  const f = path.join(tmp, 'reel.html');
  fs.writeFileSync(f, html);

  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
  await page.goto('file://' + f, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  const total = await page.evaluate('window.TOTAL');
  const frames = Math.round(total * FPS);
  const out = path.join(dir, 'reel.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const el = await page.$('#stage');
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.drawFrame(t), i / FPS);
    const buf = await el.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log('frame', i, '/', frames);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  // cover frame for Metricool / Instagram
  await page.evaluate(t => window.drawFrame(t), spec.coverAt || 2.5);
  await el.screenshot({ path: path.join(dir, 'reel-cover.jpg'), type: 'jpeg', quality: 92 });
  await browser.close();
  fs.writeFileSync(path.join(dir, 'reel-rendered.json'), JSON.stringify({ file: `posts/${id}/reel.mp4`, seconds: total, renderedAt: new Date().toISOString() }, null, 2));
  console.log('reel done', id, total + 's');
})().catch(e => { console.error(e); process.exit(1); });
