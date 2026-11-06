// Creativia Science story reel engine v3 — continuous shots, morphing between shots, camera zoom inside the window.
// Renders posts/<id>/reel.json (with "engine": 3) into posts/<id>/reel.mp4 (1080x1920, 30 fps, audio) and reel-cover.jpg.
//
// Model: the reel is a list of SHOTS. A shot keeps ONE picture on screen for several spoken BEATS (no cuts inside a shot;
// only captions, counters, labels and the camera change). Changing the picture = a new shot, reached by a morph of the
// glass shape (never a fade to empty and back).
// Every beat has "say" (fully vowelled Arabic sent to the voice, for correct pronunciation) and "show" (the same
// words without vowel marks, shown as captions). Both must have the same number of words.
// Times are anchors: a number (seconds in the shot), "b1" (start of beat 1), "b1:end", "b1:word" (when that word is
// spoken) and an optional +/- offset ("b1:ثمان+0.2").
// Usage: node engine/reel3.js <post-id>   (FRAMES=1,2.5 for preview stills)
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const puppeteer = require('puppeteer');
const { kreti, mark } = require('./kreti');
const { artSvg, ANIM_JS } = require('./art');

const ROOT = path.join(__dirname, '..');
const FPS = 30, VLEAD = 0.3, GAP = 0.45, TR = 0.8;
const FONT_CSS = ['rubik/400', 'rubik/500', 'rubik/700', 'rubik/800', 'playpen-sans-arabic/400']
  .map(f => `<link rel="stylesheet" href="file://${path.join(ROOT, 'node_modules/@fontsource', f)}.css">`).join('');

const THEME = {
  dark: { text: '#F3EFF7', muted: '#AEA3B8', bg1: '#170B22', bg2: '#07040A', b1: 'rgba(145,46,232,0.42)', b2: 'rgba(185,16,151,0.30)', b3: 'rgba(208,155,255,0.16)',
    grid: 'rgba(255,255,255,0.045)', glass: 'rgba(255,255,255,0.07)', rim: 'rgba(255,255,255,0.18)', glow: 'rgba(145,46,232,0.30)', accent: '#912EE8', soft: '#D09BFF', chip: 'rgba(23,11,34,0.55)', cut: '#180C22' },
  light: { text: '#100B14', muted: '#504659', bg1: '#EDE2F6', bg2: '#FAF8FC', b1: 'rgba(145,46,232,0.40)', b2: 'rgba(185,16,151,0.22)', b3: 'rgba(255,226,130,0.45)',
    grid: 'rgba(16,11,20,0.05)', glass: 'rgba(255,255,255,0.45)', rim: 'rgba(255,255,255,0.95)', glow: 'rgba(145,46,232,0.22)', accent: '#741FBF', soft: '#481F6B', chip: 'rgba(255,255,255,0.7)', cut: '#EFE6F7', speck: '#FFFFFF' }
};

const strip = s => String(s || '').replace(/[ً-ْٰ]/g, '');

// ---------- the page (runs in the browser) ----------
const PAGE = String.raw`
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const easeIn = x => { x = clamp(x); return x * x; };
const inout = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const spring = x => { x = clamp(x); return 1 - Math.exp(-6 * x) * Math.cos(9 * x); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cred = x => esc(x).replace(/@[A-Za-z0-9._]+/g, m => '⁦' + m + '⁩');
const EASE = { in: easeIn, out: ease, inout: inout, linear: x => clamp(x) };
const D = window.REEL, C = D.theme, TR = D.TR;

// background: drifting colour blobs, a light grid, floating specks and grain (the approved style)
function bg(t) {
  const s = Math.sin, c = Math.cos;
  const blob = (col, size, x, y) => '<div style="position:absolute;width:' + size + 'px;height:' + size + 'px;left:' + (x - size / 2) + 'px;top:' + (y - size / 2) + 'px;background:radial-gradient(circle,' + col + ' 0%,rgba(0,0,0,0) 66%)"></div>';
  let specks = '';
  for (let i = 0; i < 14; i++) {
    const x = (i * 83 + 17) % 360, y = 640 - ((t * (8 + (i % 4) * 3) + i * 57) % 700), r = 1.5 + (i % 3);
    specks += '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + r + 'px;height:' + r + 'px;border-radius:50%;background:' + (C.speck || C.soft) + ';opacity:' + (0.25 + 0.25 * s(t * 2 + i)) + '"></div>';
  }
  return '<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 70% 10%,' + C.bg1 + ',' + C.bg2 + ')"></div>'
    + blob(C.b1, 560, 260 + s(t * 0.21) * 40, 120 + c(t * 0.17) * 30)
    + blob(C.b2, 520, 60 + c(t * 0.15) * 40, 470 + s(t * 0.19) * 35)
    + blob(C.b3, 380, 300 + s(t * 0.13 + 2) * 30, 560 + c(t * 0.11) * 25)
    + '<div style="position:absolute;inset:-28px;background-image:linear-gradient(' + C.grid + ' 1px,transparent 1px),linear-gradient(90deg,' + C.grid + ' 1px,transparent 1px);background-size:28px 28px;transform:translate(' + ((t * 3) % 28) + 'px,' + ((t * 2) % 28) + 'px)"></div>'
    + specks
    + '<div style="position:absolute;inset:0;opacity:0.07;background-image:url(' + D.grain + ');background-size:180px"></div>';
}
function star(t, x, y, sz, at) {
  const p = clamp(seg(t, at, at + 0.4)), tw = 0.6 + 0.4 * Math.sin(t * 4 + x);
  return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" style="position:absolute;left:' + x + 'px;top:' + y + 'px;opacity:' + p * tw + ';transform:scale(' + p * tw + ') rotate(' + t * 30 + 'deg);filter:drop-shadow(0 0 6px ' + C.accent + ')"><path fill="' + C.soft + '" d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z"/></svg>';
}
// liquid glass: blurred backdrop, inner highlight, rotating rim shine, outer glow
function glass(x, y, w, h, r, t, inner, op) {
  const ang = (t * 60) % 360;
  return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;opacity:' + op + ';background:linear-gradient(160deg,rgba(255,255,255,0.16),' + C.glass + ' 45%,rgba(255,255,255,0.04));backdrop-filter:blur(16px) saturate(150%);box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),inset 0 -24px 40px ' + C.glow + ',0 18px 50px rgba(0,0,0,0.30),0 0 40px ' + C.glow + ';overflow:hidden">'
    + '<div style="position:absolute;inset:0;border-radius:' + r + 'px;padding:1.5px;background:conic-gradient(from ' + ang + 'deg,' + C.rim + ',rgba(255,255,255,0.05) 25%,' + C.soft + ' 50%,rgba(255,255,255,0.05) 75%,' + C.rim + ');-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0.9"></div>'
    + inner + '</div>';
}
// spoken caption: words appear as they are said
function caption(words, lt, css) {
  if (!words) return '';
  return '<div style="position:absolute;' + css + ';font-weight:800;line-height:1.5;text-align:right">' + words.map(o => {
    const p = ease(seg(lt, o.t - 0.05, o.t + 0.3));
    return '<span style="display:inline-block;opacity:' + p + ';filter:blur(' + (1 - p) * 6 + 'px);transform:translateX(' + (1 - p) * 14 + 'px)">' + esc(o.w) + '</span>';
  }).join(' ') + '</div>';
}
const EMOJI = {
  '👍': '<svg width="34" height="34" viewBox="0 0 64 64"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE98A"/><stop offset="0.5" stop-color="#FFC93C"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><path d="M22 28 L32 8 C35 4 42 6 41 12 L38 24 L52 24 C57 24 60 29 58 34 L53 52 C52 56 48 58 44 58 L22 58 Z" fill="url(#eg)" stroke="#C2620A" stroke-width="2.5" stroke-linejoin="round"/><rect x="6" y="26" width="14" height="34" rx="4" fill="url(#eg)" stroke="#C2620A" stroke-width="2.5"/><path d="M28 14 L33 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/></svg>',
  '😱': '<svg width="34" height="34" viewBox="0 0 64 64"><defs><radialGradient id="ef" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFF1A8"/><stop offset="1" stop-color="#F7B500"/></radialGradient></defs><circle cx="32" cy="32" r="28" fill="url(#ef)" stroke="#C2620A" stroke-width="2.5"/><ellipse cx="22" cy="26" rx="5" ry="7" fill="#fff" stroke="#3A2A10" stroke-width="2"/><ellipse cx="42" cy="26" rx="5" ry="7" fill="#fff" stroke="#3A2A10" stroke-width="2"/><circle cx="22" cy="27" r="2.5" fill="#3A2A10"/><circle cx="42" cy="27" r="2.5" fill="#3A2A10"/><ellipse cx="32" cy="45" rx="7" ry="9" fill="#5A2A10"/></svg>',
  '💡': '<svg width="34" height="34" viewBox="0 0 64 64"><defs><radialGradient id="el" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFFBE0"/><stop offset="1" stop-color="#FFC93C"/></radialGradient></defs><path d="M32 6 C46 6 54 16 54 27 C54 36 47 41 44 47 L20 47 C17 41 10 36 10 27 C10 16 18 6 32 6 Z" fill="url(#el)" stroke="#C2620A" stroke-width="2.5"/><rect x="22" y="49" width="20" height="9" rx="3" fill="#9AA0B4"/></svg>'
};
const emoji = e => EMOJI[e] || '<span style="font-size:30px;line-height:1">' + esc(e) + '</span>';
function beatAt(sh, lt) { let b = 0; while (b < sh.beats.length - 1 && lt >= sh.beats[b + 1].start) b++; return b; }
// keyframed value: keys [{t, ...v}] with per-key easing toward it
function keyed(keys, lt, f, def) {
  if (!keys || !keys.length) return def;
  if (lt <= keys[0].t) return keys[0][f] != null ? keys[0][f] : def;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    const end = b.t + (b.d || 0);
    if (lt < end) {
      const p = (EASE[b.ease] || inout)(b.d ? seg(lt, b.t, end) : seg(lt, a.t, b.t));
      if (b.d && lt < b.t) return a[f] != null ? a[f] : def;
      return lerp(a[f] != null ? a[f] : def, b[f] != null ? b[f] : (a[f] != null ? a[f] : def), p);
    }
  }
  const last = keys[keys.length - 1];
  return last[f] != null ? last[f] : def;
}

// ---- window geometry ----
const WIN = { x: 24, y: 72, w: 312, h: 300, r: 30 }, PAD = 8;
const IW = WIN.w - PAD * 2, IH = WIN.h - PAD * 2, S0 = Math.min(IW / 400, IH / 300);
function cam(sh, lt) {
  const c = { z: keyed(sh.camera, lt, 'z', 1), x: keyed(sh.camera, lt, 'x', 200), y: keyed(sh.camera, lt, 'y', 150) };
  const f = sh.follow;
  if (f && sh.dot) { // the camera zooms in and travels with the glowing dot
    const w = inout(seg(lt, f.from, f.from + 0.8)) * (1 - inout(seg(lt, f.to, f.to + 0.9)));
    if (w > 0) { const d = dotPos(sh, lt); c.x = lerp(c.x, d[0], w); c.y = lerp(c.y, d[1], w); c.z = lerp(c.z, f.z || 2.2, w); }
  }
  return c;
}
function toScreen(c, ax, ay) { return [IW / 2 + (ax - c.x) * S0 * c.z, IH / 2 + (ay - c.y) * S0 * c.z]; }

function dotPos(sh, lt) {
  const d = sh.dot; if (!d) return null;
  if (d.pendulum && lt >= d.pendulum.t) {
    const q = d.pendulum, ph = (lt - q.t) * Math.PI * 2 / q.period;
    return [200, lerp(q.y1, q.y2, 0.5 - 0.5 * Math.cos(ph))];
  }
  return [keyed(d.keys, lt, 'x', 200), keyed(d.keys, lt, 'y', 30)];
}
function dotSvg(sh, lt, c) {
  if (!sh.dot) return '';
  const op = clamp(seg(lt, sh.dot.keys[0].t - 0.3, sh.dot.keys[0].t));
  let out = '';
  for (let i = 6; i >= 0; i--) {
    const p = dotPos(sh, lt - i * 0.05); if (!p) continue;
    const [sx, sy] = toScreen(c, p[0], p[1]);
    const r = i ? 5 - i * 0.55 : 6.5;
    out += '<circle cx="' + sx + '" cy="' + sy + '" r="' + r + '" fill="' + (i ? C.soft : '#FFFFFF') + '" opacity="' + (i ? 0.5 - i * 0.06 : 1) + '"/>';
  }
  const p = dotPos(sh, lt), [sx, sy] = toScreen(c, p[0], p[1]);
  return '<svg width="' + IW + '" height="' + IH + '" style="position:absolute;left:0;top:0;overflow:visible;opacity:' + op + '"><circle cx="' + sx + '" cy="' + sy + '" r="16" fill="' + C.soft + '" opacity="0.35" filter="url(#dg)"/><defs><filter id="dg" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="5"/></filter></defs>' + out + '</svg>';
}
// glass label chips pinned to points of the picture (follow the camera)
function labels(sh, lt, c) {
  return (sh.labels || []).map(l => {
    const pin = clamp(seg(lt, l.in, l.in + 0.45)) * (l.out != null ? 1 - clamp(seg(lt, l.out, l.out + 0.35)) : 1);
    if (pin <= 0.01) return '';
    const [px, py] = toScreen(c, l.ax, l.ay);
    const right = l.side !== 'l', len = l.len || 22;
    const cx = right ? px + len : px - len;
    const sp = spring(seg(lt, l.in, l.in + 0.7));
    return '<svg width="' + IW + '" height="' + IH + '" style="position:absolute;left:0;top:0;overflow:visible;opacity:' + pin + '"><path d="M' + px + ' ' + py + ' L' + cx + ' ' + py + '" stroke="' + C.soft + '" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="' + px + '" cy="' + py + '" r="3.5" fill="#fff"/></svg>'
      + '<div style="position:absolute;top:' + (py - 14) + 'px;' + (right ? 'left:' + cx : 'right:' + (IW - cx)) + 'px;opacity:' + pin + ';transform:scale(' + clamp(sp, 0, 1.15) + ');transform-origin:' + (right ? '0' : '100%') + ' 50%;white-space:nowrap;padding:5px 10px;border-radius:12px;background:' + C.chip + ';backdrop-filter:blur(10px);border:1px solid ' + C.rim + ';color:' + C.text + ';font-size:11px;font-weight:700">' + esc(l.text) + '</div>';
  }).join('');
}
function counters(sh, lt) {
  return (sh.counters || []).map(cn => {
    const a = cn.keys[0].t, op = clamp(seg(lt, a - 0.3, a)) * (cn.out != null ? 1 - clamp(seg(lt, cn.out, cn.out + 0.3)) : 1);
    if (op <= 0.01) return '';
    const v = keyed(cn.keys, lt, 'v', 0);
    const txt = cn.fmt === 'time' ? (Math.floor(v) + ':' + String(Math.floor((v % 1) * 60 + 1e-6)).padStart(2, '0')) : (cn.digits ? v.toFixed(cn.digits) : String(Math.round(v)));
    if (cn.big) return '<div dir="ltr" style="position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:46px;font-weight:800;color:' + C.text + ';text-shadow:0 0 26px ' + C.accent + ';opacity:' + op + ';transform:scale(' + (0.7 + 0.3 * spring(seg(lt, a, a + 0.8))) + ')">' + txt + (cn.unit ? '<span style="font-size:17px;margin-left:6px;color:' + C.muted + '">' + esc(cn.unit) + '</span>' : '') + '</div>';
    const pos = cn.pos === 'tl' ? 'left:12px;top:12px' : 'right:12px;top:12px';
    return '<div style="position:absolute;' + pos + ';display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:14px;background:' + C.chip + ';backdrop-filter:blur(10px);border:1px solid ' + C.rim + ';color:' + C.text + ';opacity:' + op + '">'
      + (cn.label ? '<span style="font-size:11.5px;font-weight:600;opacity:0.85">' + esc(cn.label) + '</span>' : '')
      + '<span dir="ltr" style="font-size:17px;font-weight:800;unicode-bidi:isolate">' + txt + (cn.unit ? ' <span style="font-size:11px;font-weight:600">' + esc(cn.unit) + '</span>' : '') + '</span></div>';
  }).join('');
}
// overlay drawn in picture coordinates (e.g. the tunnel line on the opening Earth), revealed with its anchor
function overlay(sh, lt) {
  return (sh.lines || []).map(l => {
    const p = inout(seg(lt, l.in, l.in + (l.d || 0.8)));
    const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
    return '<line x1="' + l.x1 + '" y1="' + l.y1 + '" x2="' + l.x2 + '" y2="' + l.y2 + '" stroke="' + (l.color || C.soft) + '" stroke-width="' + (l.w || 5) + '" stroke-linecap="round" stroke-dasharray="' + (l.dash ? '8 7' : len) + '" stroke-dashoffset="' + (l.dash ? 0 : len * (1 - p)) + '" opacity="' + (l.dash ? p : 1) + '"/>';
  }).join('');
}

// ---- shots ----
const SHOT = {
  // full-screen picture, no glass; the camera drifts in
  open(sh, lt) {
    const z = 1 + 0.08 * seg(lt, 0, sh.dur);
    const b = beatAt(sh, lt);
    return {
      shape: sh.morphFrom, glassOp: 0,
      stage: '<div style="position:absolute;left:-20px;top:60px;width:400px;height:360px;transform:scale(' + z + ');transform-origin:' + (sh.focus ? (sh.focus[0] - 20) + 'px ' + (sh.focus[1] - 60) + 'px' : '50% 50%') + '">'
        + '<div style="position:absolute;inset:0">' + artFrame(sh.artSvg, sh.artMeta, lt) + '</div>'
        + '<svg viewBox="0 0 400 300" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible">' + overlay(sh, lt) + '</svg></div>'
        + star(lt, 52, 120, 15, 0.4) + star(lt, 300, 400, 11, 0.8),
      inner: '',
      over: caption(sh.beats[b].words, lt - sh.beats[b].start, 'right:26px;left:26px;top:430px;font-size:21px;text-shadow:0 2px 18px ' + C.bg2)
    };
  },
  // the glass window: one picture, a camera that zooms and follows, labels, counters, a glowing dot
  window(sh, lt) {
    const c = cam(sh, lt), b = beatAt(sh, lt);
    const layer = '<div style="position:absolute;left:0;top:0;width:' + (400 * S0) + 'px;height:' + (300 * S0) + 'px;transform-origin:0 0;transform:translate(' + (IW / 2 - c.x * S0 * c.z) + 'px,' + (IH / 2 - c.y * S0 * c.z) + 'px) scale(' + c.z + ')">'
      + artFrame(sh.artSvg, sh.artMeta, lt) + '</div>';
    return {
      shape: WIN, glassOp: 1, stage: '',
      inner: '<div style="position:absolute;left:' + PAD + 'px;top:' + PAD + 'px;width:' + IW + 'px;height:' + IH + 'px;overflow:hidden;border-radius:' + (WIN.r - PAD) + 'px">' + layer + dotSvg(sh, lt, c) + labels(sh, lt, c) + '</div>' + counters(sh, lt),
      over: (sh.note ? '<div style="position:absolute;right:28px;left:28px;top:' + (WIN.y + WIN.h + 6) + 'px;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:' + C.muted + '">' + cred(sh.note) + '</div>' : '')
        + caption(sh.beats[b].words, lt - sh.beats[b].start, 'right:26px;left:26px;top:' + (WIN.y + WIN.h + 26) + 'px;font-size:20px')
    };
  },
  // closing card: Kreti, a reaction bubble with an emoji, and "follow us"
  end(sh, lt) {
    const kp = spring(seg(lt, 0.1, 0.9)), bob = Math.sin(lt * 2.6) * 4;
    const bub = sh.bubble ? clamp(seg(lt, sh.bubble.in, sh.bubble.in + 0.25)) * (1 - clamp(seg(lt, sh.bubble.out, sh.bubble.out + 0.3))) : 0;
    const bs = sh.bubble ? spring(seg(lt, sh.bubble.in, sh.bubble.in + 0.7)) : 0;
    const fp = ease(seg(lt, sh.followAt, sh.followAt + 0.6));
    return {
      shape: { x: 34, y: 330, w: 292, h: 64, r: 32 }, glassOp: 1, stage: '',
      inner: '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;opacity:' + fp + ';filter:blur(' + (1 - fp) * 6 + 'px);transform:translateX(' + (1 - fp) * 20 + 'px)">تابعنا على كريتيفيا ساينس</div>',
      over: '<div style="position:absolute;left:105px;top:' + (130 + bob + (1 - kp) * 40) + 'px;width:150px;height:150px;opacity:' + clamp(kp * 1.5) + ';transform:scale(' + clamp(kp, 0, 1.2) + ');transform-origin:50% 90%">' + D.kreti[sh.pose || 'jump'].replace(/width="\d+" height="\d+"/, 'width="150" height="150"') + '</div>'
        + (bub > 0.01 ? '<div style="position:absolute;left:236px;top:' + (64 + bob) + 'px;opacity:' + bub + ';transform:scale(' + clamp(bs, 0, 1.15) + ');transform-origin:0 100%"><div style="padding:8px 14px;border-radius:20px 20px 20px 6px;background:' + C.chip + ';backdrop-filter:blur(12px);border:1px solid ' + C.rim + ';box-shadow:0 0 24px ' + C.glow + ';display:flex">' + emoji(sh.bubble.emoji) + '</div></div>' : '')
        + '<div dir="ltr" style="position:absolute;left:0;right:0;top:404px;text-align:center;font-size:17px;font-weight:700;color:' + C.muted + ';opacity:' + fp + '">@creativia.sci</div>'
        + star(lt, 70, 110, 18, 0.4) + star(lt, 280, 280, 14, 0.6)
    };
  }
};

let starts = [], total = 0;
D.shots.forEach(s => { starts.push(total); total += s.dur; });
window.TOTAL = total;
window.drawFrame = function (t) {
  let k = 0;
  while (k < D.shots.length - 1 && t >= starts[k + 1]) k++;
  const sh = D.shots[k], lt = t - starts[k];
  const cur = SHOT[sh.type](sh, lt);
  let shape = cur.shape, gop = cur.glassOp, stage = cur.stage, inner = cur.inner, over = cur.over;
  if (k > 0 && lt < TR) {
    // morph: the glass shape travels from the previous shot's shape to this one; pictures cross over inside it
    const ps = D.shots[k - 1], prev = SHOT[ps.type](ps, ps.dur + lt), p = inout(lt / TR);
    const a = prev.shape || shape;
    shape = { x: lerp(a.x, shape.x, p), y: lerp(a.y, shape.y, p), w: lerp(a.w, shape.w, p), h: lerp(a.h, shape.h, p), r: lerp(a.r, shape.r, p) };
    gop = lerp(prev.glassOp, gop, p);
    const pin = 1 - seg(lt, TR * 0.35, TR * 0.85), cin = seg(lt, TR * 0.3, TR);
    if (ps.type === 'open' && sh.type === 'window') {
      // the opening picture shrinks to exactly where the window picture sits, then hands over
      const f = ps.handoff || { from: [180, 225], to: [180, 218], s: 1 };
      const sc = lerp(1, f.s, p), dx = lerp(0, f.to[0] - f.from[0], p), dy = lerp(0, f.to[1] - f.from[1], p);
      stage = '<div style="position:absolute;inset:0;opacity:' + pin + ';transform-origin:' + f.from[0] + 'px ' + f.from[1] + 'px;transform:translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ')">' + prev.stage + '</div>';
    } else stage = '<div style="position:absolute;inset:0;opacity:' + pin + '">' + prev.stage + '</div>' + '<div style="position:absolute;inset:0;opacity:' + cin + '">' + cur.stage + '</div>';
    inner = '<div style="position:absolute;inset:0;opacity:' + pin + ';transform:scale(' + lerp(1, 0.92, p) + ')">' + prev.inner + '</div><div style="position:absolute;inset:0;opacity:' + cin + ';transform:scale(' + lerp(1.08, 1, p) + ')">' + cur.inner + '</div>';
    over = '<div style="position:absolute;inset:0;opacity:' + (1 - seg(lt, 0, TR * 0.4)) + '">' + prev.over + '</div><div style="position:absolute;inset:0;opacity:' + seg(lt, TR * 0.5, TR) + '">' + cur.over + '</div>';
  }
  const tiltY = Math.sin(t * 0.45) * 2.2, tiltX = Math.cos(t * 0.37) * 1.3, push = 1 + 0.02 * Math.sin(t * 0.3);
  document.getElementById('stage').innerHTML = bg(t)
    + '<div style="position:absolute;top:22px;right:22px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:' + C.muted + ';z-index:3"><span style="width:7px;height:7px;border-radius:50%;background:' + C.accent + ';opacity:' + (0.5 + 0.5 * Math.sin(t * 5)) + '"></span>' + esc(D.badge || 'كريتيفيا ساينس') + '</div>'
    + '<div style="position:absolute;top:20px;left:22px;z-index:3">' + D.mark + '</div>'
    + '<div style="position:absolute;inset:0;perspective:900px"><div style="position:absolute;inset:0;transform:scale(' + push + ') rotateY(' + tiltY + 'deg) rotateX(' + tiltX + 'deg);transform-style:preserve-3d">'
    + stage
    + (gop > 0.01 && shape ? glass(shape.x, shape.y, shape.w, shape.h, shape.r, t, inner, gop) : '')
    + over + '</div></div>';
};
`;

// ---------- Node: timing, anchors, audio ----------
function anchor(sh, a) {
  if (a == null) return 0;
  if (typeof a === 'number') return a;
  const m = String(a).match(/^b(\d+)(?::([^+\-]+?))?([+-][\d.]+)?$/);
  if (!m) throw new Error('Bad anchor: ' + a);
  const b = sh.beats[+m[1]]; if (!b) throw new Error('No beat ' + m[1] + ' in anchor ' + a);
  let t = b.start;
  if (m[2] === 'end') t = b.start + b.dur;
  else if (m[2]) { const w = (b.wordsSay || []).find(x => strip(x.w).indexOf(strip(m[2])) >= 0) || (b.words || []).find(x => x.w.indexOf(strip(m[2])) >= 0); if (w) t = b.start + w.t; else console.warn('anchor word not found:', a); }
  return t + (m[3] ? parseFloat(m[3]) : 0);
}

(async () => {
  const id = process.argv[2];
  if (!id) throw new Error('usage: node engine/reel3.js <post-id>');
  const dir = path.join(ROOT, 'posts', id);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'reel.json'), 'utf8'));
  const mode = spec.mode || 'dark', theme = THEME[mode];
  const vjson = path.join(dir, 'voice', 'voice.json');
  const clips = spec.voice && fs.existsSync(vjson) ? JSON.parse(fs.readFileSync(vjson, 'utf8')).clips : [];

  // beats: duration from the voice clip (or an estimate), words timed for captions
  let g = 0;
  const audio = [];
  for (const sh of spec.shots) {
    let t = sh.type === 'open' ? 0.15 : 0.25; // a breath at the start of a shot (the morph plays here)
    for (const b of sh.beats) {
      const show = (b.show || strip(b.say)).split(/\s+/).filter(Boolean);
      const clip = clips.find(c => c.scene === g);
      const say = (b.say || '').split(/\s+/).filter(Boolean);
      if (say.length && show.length !== say.length) console.warn(`beat ${g}: "show" has ${show.length} words, "say" has ${say.length}`);
      let times;
      if (clip && clip.words && clip.words.length) {
        const ws = clip.words;
        times = show.map((w, i) => ({ w, t: VLEAD + (ws[Math.min(ws.length - 1, Math.round(i * (ws.length - 1) / Math.max(1, show.length - 1)))].t) }));
        b.wordsSay = ws.map(x => ({ w: x.w, t: x.t + VLEAD }));
        b.dur = clip.dur + VLEAD + GAP;
      } else {
        let x = VLEAD; times = show.map(w => { const o = { w, t: x }; x += (w.length + 1) / 12; return o; });
        b.dur = (b.say ? x : (b.dur || 1.2)) + GAP;
      }
      b.words = b.say ? times : null;
      b.start = t; t += b.dur;
      if (clip) audio.push({ file: clip.file, at: null, shot: sh, beat: b });
      g++;
    }
    sh.dur = Math.max(sh.minDur || 0, t + (sh.tail || 0.2));
  }
  // resolve every anchor to seconds inside its shot
  for (const sh of spec.shots) {
    const A = a => anchor(sh, a);
    if (sh.camera) sh.camera = sh.camera.map(k => Object.assign({}, k, { t: A(k.at), d: k.d || 0 }));
    if (sh.dot) {
      sh.dot.keys = sh.dot.keys.map(k => Object.assign({}, k, { t: A(k.at), d: k.d || 0 }));
      if (sh.dot.pendulum) sh.dot.pendulum.t = A(sh.dot.pendulum.at);
    }
    (sh.labels || []).forEach(l => { l.in = A(l.in); if (l.out != null) l.out = A(l.out); });
    (sh.counters || []).forEach(c => { c.keys = c.keys.map(k => Object.assign({}, k, { t: A(k.at), d: k.d || 0 })); if (c.out != null) c.out = A(c.out); });
    (sh.lines || []).forEach(l => { l.in = A(l.in); });
    if (sh.bubble) { sh.bubble.in = A(sh.bubble.in); sh.bubble.out = sh.bubble.out != null ? A(sh.bubble.out) : sh.bubble.in + 1.5; }
    if (sh.type === 'end') sh.followAt = A(sh.followAt || 0.3);
    if (sh.follow) { sh.follow.from = A(sh.follow.from); sh.follow.to = A(sh.follow.to); }
    if (sh.art) { const r = artSvg(sh.art, mode, { w: '100%', h: '100%' }, { anim: true }); sh.artSvg = r.svg; sh.artMeta = r.meta; }
    if (sh.type === 'open' && !sh.morphFrom) sh.morphFrom = { x: 100, y: 145, w: 160, h: 160, r: 80 };
  }
  let tot = 0; const shotStart = spec.shots.map(s => { const a = tot; tot += s.dur; return a; });
  const total = Math.round(tot * 100) / 100;

  const poses = {};
  for (const p of ['wave', 'point', 'jump', 'think']) poses[p] = kreti({ pose: p, size: 240, mode, cut: theme.cut, look: 'dream' });
  const grain = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>').toString('base64');
  const data = { TR, badge: spec.badge, theme, kreti: poses, mark: mark({ size: 24 }), grain,
    shots: spec.shots.map(s => { const o = Object.assign({}, s); delete o.art; o.beats = s.beats.map(b => ({ start: b.start, dur: b.dur, words: b.words })); return o; }) };
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${FONT_CSS}
<style>body{margin:0;background:#000}#stage{position:relative;width:360px;height:640px;overflow:hidden;font-family:'Rubik',sans-serif;color:${theme.text};direction:rtl}</style></head>
<body><div id="stage"></div><script>window.REEL=${JSON.stringify(data)};</script><script>${ANIM_JS}</script><script>${PAGE}</script></body></html>`;
  const tmp = path.join(__dirname, '_tmp'); fs.mkdirSync(tmp, { recursive: true });
  const f = path.join(tmp, 'reel3.html'); fs.writeFileSync(f, html);

  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
  await page.goto('file://' + f, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  const el = await page.$('#stage');
  if (process.env.FRAMES) {
    for (const s of process.env.FRAMES.split(',').map(Number)) { await page.evaluate(x => window.drawFrame(x), s); await el.screenshot({ path: path.join(tmp, `still-${s}.jpg`), type: 'jpeg', quality: 85 }); }
    console.log('total', total, 'shots', spec.shots.map((s, i) => `${s.type}@${shotStart[i].toFixed(2)}`).join(' '));
    await browser.close(); return;
  }
  const silent = path.join(tmp, 'silent.mp4');
  const frames = Math.round(total * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < frames; i++) {
    await page.evaluate(x => window.drawFrame(x), i / FPS);
    const buf = await el.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log('frame', i, '/', frames);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  await page.evaluate(x => window.drawFrame(x), spec.coverAt || 1.5);
  await el.screenshot({ path: path.join(dir, 'reel-cover.jpg'), type: 'jpeg', quality: 92 });
  await browser.close();

  // sound effects: a whoosh on every shot change, a pop for each label, an impact for big numbers, a pop for Kreti's bubble
  const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/sfx/library.json'), 'utf8')).tracks;
  let n = 0; const pick = role => { const c = lib.filter(x => x.role === role); return c.length ? c[(n++) % c.length] : null; };
  const cues = [];
  const cue = (t, role, vol) => { const x = pick(role); if (x) cues.push({ t: Math.max(0, t - x.onset), file: path.join(ROOT, 'assets/sfx', x.file), vol, max: Math.min(x.duration, 2.2) }); };
  spec.shots.forEach((sh, i) => {
    const s0 = shotStart[i];
    if (i > 0) cue(s0, 'whoosh', 0.35);
    (sh.labels || []).forEach(l => cue(s0 + l.in, 'pop', 0.3));
    (sh.counters || []).filter(c => c.big).forEach(c => cue(s0 + c.keys[c.keys.length - 1].t, 'soft-impact', 0.45));
    if (sh.bubble) cue(s0 + sh.bubble.in, 'pop', 0.45);
    if (sh.type === 'end') cue(s0 + sh.followAt, 'notification', 0.35);
  });
  cues.sort((a, b) => a.t - b.t);
  const fx = cues.filter((c, i, a) => i === 0 || c.t - a[i - 1].t > 0.15);

  const args = ['-y', '-loglevel', 'error', '-i', silent];
  const parts = [], vo = [], sfx = []; let idx = 1, mus = null;
  if (spec.music) {
    args.push('-ss', String(spec.musicStart || 0), '-i', path.join(ROOT, spec.music));
    parts.push(`[${idx}:a]atrim=0:${total},asetpts=PTS-STARTPTS,volume=${spec.musicVolume || (audio.length ? 0.4 : 0.55)},afade=t=in:d=0.6,afade=t=out:st=${(total - 1.6).toFixed(2)}:d=1.6[m]`);
    mus = '[m]'; idx++;
  }
  spec.shots.forEach((sh, i) => sh.beats.forEach(b => {
    const a = audio.find(x => x.beat === b); if (!a) return;
    args.push('-i', path.join(dir, 'voice', a.file));
    const ms = Math.round((shotStart[i] + b.start + VLEAD) * 1000);
    parts.push(`[${idx}:a]adelay=${ms}|${ms}[v${idx}]`); vo.push(`[v${idx}]`); idx++;
  }));
  for (const c of fx) {
    args.push('-i', c.file); const ms = Math.round(c.t * 1000);
    parts.push(`[${idx}:a]atrim=0:${c.max},afade=t=out:st=${Math.max(0, c.max - 0.3)}:d=0.3,volume=${vo.length ? c.vol * 0.7 : c.vol},adelay=${ms}|${ms}[s${idx}]`); sfx.push(`[s${idx}]`); idx++;
  }
  const out = path.join(dir, 'reel.mp4'), layers = [];
  if (vo.length) {
    parts.push(`${vo.join('')}amix=inputs=${vo.length}:normalize=0,apad,atrim=0:${total}${mus ? ',asplit=2[vo][sc]' : '[vo]'}`);
    if (mus) { parts.push(`${mus}[sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md]`); layers.push('[md]'); }
    layers.push('[vo]');
  } else if (mus) layers.push(mus);
  layers.push(...sfx);
  if (layers.length) {
    parts.push(`${layers.join('')}amix=inputs=${layers.length}:normalize=0,apad,atrim=0:${total},loudnorm=I=-14:TP=-1.5:LRA=11[a]`);
    args.push('-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', out);
  } else args.push('-c', 'copy', out);
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  fs.writeFileSync(path.join(dir, 'reel-rendered.json'), JSON.stringify({ file: `posts/${id}/reel.mp4`, engine: 3, seconds: total, voice: vo.length, sfx: fx.length, renderedAt: new Date().toISOString() }, null, 2));
  console.log('reel v3 done', id, total + 's');
})().catch(e => { console.error(e); process.exit(1); });
