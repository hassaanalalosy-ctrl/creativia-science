// Slide templates for @creativia.mag — the approved "dreamy" style.
// Every slide is designed on a 352 x 440 canvas and rendered at 1080 x 1350.
const { kreti, mark } = require('./kreti');

const THEMES = {
  light: { text: '#0B1410', muted: '#46594D', bg1: '#E2F6E9', bg2: '#F8FCF9',
    grid: 'rgba(11,20,16,0.045)', orb1: 'rgba(46,232,107,0.38)', orb1Mid: 'rgba(46,232,107,0.14)', orb2: 'rgba(16,185,166,0.22)', orb3: 'rgba(255,226,130,0.5)',
    glass: 'rgba(255,255,255,0.6)', glassBorder: 'rgba(255,255,255,0.95)', chipShadow: '0 8px 20px rgba(20,80,50,0.10)', tileShadow: '0 22px 50px rgba(40,150,90,0.16)',
    pillBg: '#0B1410', pillText: '#FFFFFF', ink: '#1F6B49', star: '#FFFFFF', starGlow: 'rgba(46,232,107,0.8)', ph: 'rgba(46,232,107,0.12)', dotOff: '#C9DCD0',
    cut: '#DDF5E5', cutEnd: '#D6F3E0', fade: 'linear-gradient(to top, rgba(248,252,249,0.9) 0%, rgba(248,252,249,0.5) 24%, rgba(248,252,249,0) 52%)' },
  dark: { text: '#EFF7F1', muted: '#A3B8AB', bg1: '#10281D', bg2: '#060F0B',
    grid: 'rgba(255,255,255,0.035)', orb1: 'rgba(46,232,107,0.32)', orb1Mid: 'rgba(46,232,107,0.10)', orb2: 'rgba(16,185,166,0.24)', orb3: 'rgba(155,255,194,0.14)',
    glass: 'rgba(255,255,255,0.08)', glassBorder: 'rgba(255,255,255,0.16)', chipShadow: '0 8px 20px rgba(0,0,0,0.25)', tileShadow: '0 22px 50px rgba(0,0,0,0.35)',
    pillBg: '#2EE86B', pillText: '#0B1410', ink: '#9BFFC2', star: '#C9FFDD', starGlow: 'rgba(46,232,107,0.9)', ph: 'rgba(46,232,107,0.08)', dotOff: '#3C5446',
    cut: '#123726', cutEnd: '#14402B', fade: 'linear-gradient(to top, rgba(6,15,11,0.9) 0%, rgba(6,15,11,0.5) 24%, rgba(6,15,11,0) 52%)' }
};

const ICONS = {
  building: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  brush: 'M12 19l7-7 3 3-7 7-3-3ZM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5ZM2 2l7.6 7.6M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  box: 'M21 8l-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1ZM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12',
  type: 'M4 7V4h16v3M9 20h6M12 4v16',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  spark: 'M12 2v6M12 16v6M2 12h6M16 12h6'
};

const escRaw = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const esc = s => escRaw(s).replace(/@[A-Za-z0-9._]+/g, m => '\u2066' + m + '\u2069');
const ico = (c, name, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name] || ICONS.star}" fill="none" stroke="${c.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const star = (c, s, pos) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="position:absolute;${pos};filter:drop-shadow(0 0 4px ${c.starGlow})" aria-hidden="true"><path fill="${c.star}" d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z"/></svg>`;
const glassChip = (c, chip, pos, rot) => chip ? `<span style="position:absolute;${pos};transform:rotate(${rot}deg);display:flex;align-items:center;gap:6px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);box-shadow:${c.chipShadow};border-radius:14px;padding:7px 11px;font-size:12px;font-weight:700;white-space:nowrap">${ico(c, chip.icon)}${esc(chip.label)}</span>` : '';
const pill = (c, txt) => `<span dir="ltr" style="unicode-bidi:isolate;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:500">${esc(txt)}</span>`;
const logo = () => mark({ size: 22 });
const counter = (i, n) => `${i} / ${n}`;
const dots = (c, i, n) => {
  let s = '';
  for (let k = 1; k <= Math.min(n, 6); k++) s += k === Math.min(i, 6) ? `<span style="width:20px;height:6px;border-radius:3px;background:#2EE86B"></span>` : `<span style="width:6px;height:6px;border-radius:3px;background:${c.dotOff}"></span>`;
  return `<div style="display:flex;gap:5px">${s}</div>`;
};
const hand = (c, txt, size = 15, rot = -6) => `<span style="font-family:'Playpen Sans Arabic',sans-serif;font-size:${size}px;color:${c.ink};transform:rotate(${rot}deg);display:inline-block">${esc(txt)}</span>`;
const arrow = (c) => `<svg width="40" height="34" viewBox="0 0 40 34" aria-hidden="true"><path d="M6 4 Q8 22 30 28 M22 30 L31 28 L26 20" fill="none" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const img = (src, fit = 'cover') => src ? `<img src="${src}" style="width:100%;height:100%;object-fit:${fit};display:block" alt="">` : '';

function frame(c, inner, bg) {
  return `<div class="slide" dir="rtl" style="position:relative;width:352px;height:440px;overflow:hidden;background:${bg || `linear-gradient(165deg, ${c.bg1}, ${c.bg2})`};font-family:'Rubik',sans-serif;color:${c.text}">${inner}</div>`;
}
const grid = c => `<div style="position:absolute;inset:0;background-image:linear-gradient(${c.grid} 1px,transparent 1px),linear-gradient(90deg,${c.grid} 1px,transparent 1px);background-size:28px 28px"></div>`;
const orb = (col, mid, size, pos) => `<div style="position:absolute;width:${size}px;height:${size}px;${pos};background:radial-gradient(circle, ${col} 0%, ${mid ? `${mid} 35%, ` : ''}rgba(0,0,0,0) 68%)"></div>`;
const bubble = (s, pos) => `<div style="position:absolute;width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #FFFFFF 0%, #9BF2BC 45%, rgba(46,232,107,0.55) 100%);box-shadow:0 0 18px rgba(46,232,107,0.35);opacity:0.85;${pos}"></div>`;

// ---------- slide types ----------
const T = {
  cover(c, s, i, n, mode) {
    return frame(c, `${grid(c)}${orb(c.orb1, c.orb1Mid, 380, 'top:20px;left:-10px')}${orb(c.orb3, null, 260, 'top:-100px;right:-90px')}${orb(c.orb2, null, 240, 'bottom:-40px;right:-100px')}${bubble(34, 'top:296px;left:22px')}
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">
<span style="display:flex;align-items:center;gap:6px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:500"><span style="width:7px;height:7px;border-radius:50%;background:#2EE86B"></span>${esc(s.badge || 'جديد اليوم')}</span>${logo()}</div>
<div style="position:absolute;top:74px;left:80px">${kreti({ pose: s.pose || 'point', size: 190, mode, cut: c.cut, look: 'dream' })}</div>
${glassChip(c, (s.chips || [])[0], 'top:118px;right:14px', -6)}${glassChip(c, (s.chips || [])[1], 'top:232px;right:24px', 5)}
${s.note ? `<div style="position:absolute;top:96px;left:16px;display:flex;flex-direction:column;align-items:flex-start">${hand(c, s.note, 15, -8)}${arrow(c)}</div>` : ''}
${star(c, 18, 'top:70px;right:124px')}${star(c, 12, 'top:272px;left:74px')}
<div style="position:absolute;bottom:14px;right:14px;left:14px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(14px);box-shadow:${c.chipShadow};border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px">
<p style="margin:0;font-size:${s.titleSize || 22}px;font-weight:800;line-height:1.3">${esc(s.title)}</p>
<div style="display:flex;justify-content:space-between;align-items:center"><span dir="ltr" style="unicode-bidi:isolate;font-size:12px;color:${c.muted}">${counter(i, n)}</span><span style="background:${c.pillBg};color:${c.pillText};font-size:13px;font-weight:700;padding:8px 16px;border-radius:999px">اسحب ←</span></div></div>`);
  },

  // image framed on top, explanation below (works for landscape images)
  inner(c, s, i, n, mode) {
    return frame(c, `${grid(c)}${orb(c.orb2, null, 320, 'top:-40px;right:-40px')}${orb(c.orb3, null, 260, 'bottom:-80px;left:-90px')}
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">${pill(c, counter(i, n))}${logo()}</div>
<div style="position:absolute;top:56px;right:16px;left:16px;height:196px;border-radius:22px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);box-shadow:${c.chipShadow};padding:8px;box-sizing:border-box">
<div style="height:100%;border-radius:16px;overflow:hidden;background:${c.ph}">${img(s.image, s.fit || 'cover')}</div></div>
${glassChip(c, s.chip, 'top:40px;left:26px', -7)}
${s.kreti !== false ? `<div style="position:absolute;top:214px;left:4px">${kreti({ pose: s.pose || 'think', size: 76, mode, cut: c.cut, look: 'dream' })}</div>` : ''}
${s.note ? `<div style="position:absolute;top:264px;left:${s.kreti !== false ? 82 : 20}px">${hand(c, s.note, 14, -4)}</div>` : ''}
<div style="position:absolute;bottom:18px;right:18px;left:18px;display:flex;flex-direction:column;gap:8px">
<p style="margin:0;font-size:19px;font-weight:700;line-height:1.35">${esc(s.title)}</p>
<p style="margin:0;font-size:13.5px;line-height:1.7;color:${c.muted}">${esc(s.body)}</p>
<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:11.5px;color:${c.muted}">${esc(s.credit)}</span>${dots(c, i, n)}</div></div>`);
  },

  // portrait image fills the whole slide
  image(c, s, i, n) {
    return frame(c, `<div style="position:absolute;inset:0">${img(s.image, 'cover')}</div>
<div style="position:absolute;inset:0;background:${c.fade}"></div>
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">
<span style="width:36px;height:36px;border-radius:50%;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center">${mark({ size: 20 })}</span>${pill(c, counter(i, n))}</div>
${glassChip(c, s.chip, 'top:64px;right:18px', -5)}
<div style="position:absolute;bottom:14px;right:14px;left:14px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(14px);box-shadow:${c.chipShadow};border-radius:20px;padding:14px 16px;display:flex;flex-direction:column;gap:8px">
<p style="margin:0;font-size:19px;font-weight:800;line-height:1.3">${esc(s.title)}</p>
<span style="font-size:11.5px;color:${c.muted}">${esc(s.credit)}</span></div>`, '#0B1410');
  },

  // cover built on a full-bleed image (gallery and profile formats); fit "contain" frames a landscape image instead
  coverImage(c, s, i, n, mode) {
    const pic = s.fit === 'contain'
      ? `${grid(c)}${orb(c.orb1, c.orb1Mid, 380, 'top:0;left:-20px')}<div style="position:absolute;top:56px;right:16px;left:16px;height:220px;border-radius:22px;background:${c.glass};border:1px solid ${c.glassBorder};box-shadow:${c.tileShadow};padding:8px;box-sizing:border-box"><div style="height:100%;border-radius:16px;overflow:hidden">${img(s.image, 'cover')}</div></div>`
      : `<div style="position:absolute;inset:0">${img(s.image, 'cover')}</div><div style="position:absolute;inset:0;background:${c.fade}"></div>`;
    return frame(c, `${pic}
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">
<span style="display:flex;align-items:center;gap:6px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:500"><span style="width:7px;height:7px;border-radius:50%;background:#2EE86B"></span>${esc(s.badge || 'جديد اليوم')}</span>
<span style="width:36px;height:36px;border-radius:50%;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center">${mark({ size: 20 })}</span></div>
${glassChip(c, (s.chips || [])[0], `top:${s.fit === 'contain' ? 262 : 70}px;right:18px`, -6)}${glassChip(c, (s.chips || [])[1], `top:${s.fit === 'contain' ? 270 : 112}px;left:18px`, 5)}
${s.kreti ? `<div style="position:absolute;bottom:182px;left:10px">${kreti({ pose: s.pose || 'jump', size: 70, mode, cut: c.cut, look: 'dream' })}</div>` : ''}
${star(c, 16, 'top:150px;left:60px')}
<div style="position:absolute;bottom:14px;right:14px;left:14px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(14px);box-shadow:${c.chipShadow};border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:10px">
<p style="margin:0;font-size:${s.titleSize || 22}px;font-weight:800;line-height:1.3">${esc(s.title)}</p>
${s.credit ? `<span style="font-size:11.5px;color:${c.muted}">${esc(s.credit)}</span>` : ''}
<div style="display:flex;justify-content:space-between;align-items:center"><span dir="ltr" style="unicode-bidi:isolate;font-size:12px;color:${c.muted}">${counter(i, n)}</span><span style="background:${c.pillBg};color:${c.pillText};font-size:13px;font-weight:700;padding:8px 16px;border-radius:999px">اسحب ←</span></div></div>`, s.fit === 'contain' ? null : '#0B1410');
  },

  text(c, s, i, n) {
    const pts = (s.points || []).map((p, k) => `<div style="display:flex;align-items:center;gap:10px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);border-radius:14px;padding:9px 12px"><span style="flex:none;width:24px;height:24px;border-radius:8px;background:#2EE86B;color:#0B1410;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center">${k + 1}</span><span style="font-size:13px;line-height:1.5">${esc(p)}</span></div>`).join('');
    return frame(c, `${grid(c)}${orb(c.orb1, c.orb1Mid, 360, 'top:-120px;left:-120px')}${orb(c.orb3, null, 280, 'bottom:-110px;right:-100px')}
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">${logo()}${pill(c, counter(i, n))}</div>
<div style="position:absolute;top:60px;right:22px;left:22px;display:flex;flex-direction:column;gap:14px">
${s.tag ? `<span style="align-self:flex-start;transform:rotate(-4deg);display:flex;align-items:center;gap:6px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);box-shadow:${c.chipShadow};border-radius:14px;padding:6px 10px;font-size:11.5px;font-weight:700">${ico(c, s.tagIcon || 'spark', 14)}${esc(s.tag)}</span>` : ''}
<p style="margin:0;font-size:${s.titleSize || 25}px;font-weight:800;line-height:1.32">${esc(s.title)}</p>
<div style="display:flex;flex-direction:column;gap:8px">${pts}</div></div>
${s.note ? `<div style="position:absolute;bottom:18px;left:20px;display:flex;align-items:flex-end;gap:2px">${hand(c, s.note, 15, -6)}</div>` : ''}
${star(c, 14, 'bottom:30px;right:40px')}`);
  },

  // one framed portrait image, for single posts or landscape-safe showcases
  single(c, s, i, n, mode) {
    return frame(c, `${grid(c)}${orb(c.orb1, c.orb1Mid, 400, 'top:-40px;left:-24px')}${orb(c.orb3, null, 240, 'top:-100px;right:-90px')}
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">${logo()}${n > 1 ? pill(c, counter(i, n)) : `<span style="display:flex;align-items:center;gap:6px;background:${c.glass};border:1px solid ${c.glassBorder};border-radius:999px;padding:6px 12px;font-size:12px;font-weight:500"><span style="width:7px;height:7px;border-radius:50%;background:#2EE86B"></span>${esc(s.badge || 'اختيار اليوم')}</span>`}</div>
<div style="position:absolute;top:52px;left:58px;width:236px;height:291px;border-radius:22px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);box-shadow:${c.tileShadow};padding:8px;box-sizing:border-box">
<div style="height:100%;border-radius:16px;overflow:hidden;background:${c.ph}">${img(s.image, s.fit || 'cover')}</div></div>
${glassChip(c, s.chip, 'top:70px;right:24px', 6)}
${s.kreti ? `<div style="position:absolute;top:276px;left:18px">${kreti({ pose: s.pose || 'jump', size: 72, mode, cut: c.cut, look: 'dream' })}</div>` : ''}
${s.note ? `<div style="position:absolute;top:300px;right:22px">${hand(c, s.note, 15, -6)}</div>` : ''}
<div style="position:absolute;bottom:18px;right:20px;left:20px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px">
<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><p style="margin:0;font-size:18px;font-weight:800;line-height:1.3">${esc(s.title)}</p><span style="font-size:11.5px;color:${c.muted}">${esc(s.credit)}</span></div>
<span style="flex:none;display:flex;align-items:center;gap:6px;background:${c.pillBg};color:${c.pillText};font-size:12px;font-weight:700;padding:8px 14px;border-radius:999px;white-space:nowrap"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4V3Z" fill="none" stroke="${c.pillText}" stroke-width="2" stroke-linejoin="round"/></svg>احفظه</span></div>`);
  },

  end(c, s, i, n, mode) {
    return frame(c, `${grid(c)}${orb(c.orb1, c.orb1Mid, 400, 'top:-60px;left:-24px')}${orb(c.orb3, null, 240, 'top:-90px;right:-80px')}${bubble(26, 'top:62px;left:40px')}
<div style="position:absolute;top:56px;left:0;right:0;display:flex;justify-content:center">${kreti({ pose: 'wave', size: 180, mode, cut: c.cutEnd, look: 'dream' })}</div>
<div style="position:absolute;top:58px;right:22px">${hand(c, s.note || 'أهلاً بيك!', 15, 8)}</div>
${glassChip(c, { icon: 'clock', label: '9 بالليل' }, 'top:210px;right:18px', 6)}
${star(c, 16, 'top:40px;left:112px')}
<div style="position:absolute;bottom:22px;right:18px;left:18px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">
<p style="margin:0;font-size:26px;font-weight:800">تابع كريتيفيا</p>
<p dir="ltr" style="margin:-4px 0 0;font-size:13px;font-weight:700;color:${c.muted}">@creativia.mag</p>
<p style="margin:0;font-family:'Playpen Sans Arabic',sans-serif;font-size:14px;color:${c.ink}">${esc(s.line || 'كل يوم شي مبدع، الساعة 9 بالليل')}</p>
<div style="display:flex;gap:10px;margin-top:4px"><span style="background:${c.pillBg};color:${c.pillText};font-size:13px;font-weight:700;padding:9px 18px;border-radius:999px">احفظ المنشور</span><span style="background:${c.glass};border:1px solid ${c.glassBorder};font-size:13px;font-weight:700;padding:8px 16px;border-radius:999px;color:${c.text}">شاركه</span></div></div>`);
  }
};

function slideHtml(slide, index, total, mode = 'light') {
  const c = THEMES[mode] || THEMES.light;
  const fn = T[slide.type];
  if (!fn) throw new Error('Unknown slide type: ' + slide.type);
  return fn(c, slide, index, total, mode);
}

module.exports = { slideHtml, THEMES, ICONS };
