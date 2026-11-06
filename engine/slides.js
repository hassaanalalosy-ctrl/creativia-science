// Slide templates for @creativia.sci — the approved "dreamy" style (Creativia Science purple).
// Every slide is designed on a 352 x 440 canvas and rendered at 1080 x 1350.
const { kreti, mark } = require('./kreti');

const THEMES = {
  light: { text: '#100B14', muted: '#504659', bg1: '#EDE2F6', bg2: '#FAF8FC',
    grid: 'rgba(16,11,20,0.045)', orb1: 'rgba(145,46,232,0.38)', orb1Mid: 'rgba(145,46,232,0.14)', orb2: 'rgba(185,16,151,0.22)', orb3: 'rgba(255,226,130,0.5)',
    glass: 'rgba(255,255,255,0.6)', glassBorder: 'rgba(255,255,255,0.95)', chipShadow: '0 8px 20px rgba(52,20,80,0.10)', tileShadow: '0 22px 50px rgba(99,40,150,0.16)',
    pillBg: '#100B14', pillText: '#FFFFFF', ink: '#481F6B', star: '#FFFFFF', starGlow: 'rgba(145,46,232,0.8)', ph: 'rgba(145,46,232,0.12)', dotOff: '#D3C9DC',
    cut: '#EADDF5', cutEnd: '#E5D6F3', fade: 'linear-gradient(to top, rgba(250,248,252,0.9) 0%, rgba(250,248,252,0.5) 24%, rgba(250,248,252,0) 52%)' },
  dark: { text: '#F3EFF7', muted: '#AEA3B8', bg1: '#1D1028', bg2: '#0B060F',
    grid: 'rgba(255,255,255,0.035)', orb1: 'rgba(145,46,232,0.32)', orb1Mid: 'rgba(145,46,232,0.10)', orb2: 'rgba(185,16,151,0.24)', orb3: 'rgba(208,155,255,0.14)',
    glass: 'rgba(255,255,255,0.08)', glassBorder: 'rgba(255,255,255,0.16)', chipShadow: '0 8px 20px rgba(0,0,0,0.25)', tileShadow: '0 22px 50px rgba(0,0,0,0.35)',
    pillBg: '#912EE8', pillText: '#100B14', ink: '#D09BFF', star: '#E6C9FF', starGlow: 'rgba(145,46,232,0.9)', ph: 'rgba(145,46,232,0.08)', dotOff: '#493C54',
    cut: '#261237', cutEnd: '#2B1440', fade: 'linear-gradient(to top, rgba(11,6,15,0.9) 0%, rgba(11,6,15,0.5) 24%, rgba(11,6,15,0) 52%)' }
};

const ICONS = {
  flask: 'M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3M7 15h10',
  atom: 'M12 13.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4ZM12 2.5c-2.2 0-4 4.3-4 9.5s1.8 9.5 4 9.5 4-4.3 4-9.5-1.8-9.5-4-9.5ZM3.8 7.2c-1.1 1.9 1.7 5.6 6.2 8.2s9.1 3.2 10.2 1.3-1.7-5.6-6.2-8.2S4.9 5.3 3.8 7.2ZM3.8 16.8c1.1 1.9 5.7 1.3 10.2-1.3s7.3-6.3 6.2-8.2-5.7-1.3-10.2 1.3S2.7 14.9 3.8 16.8Z',
  microscope: 'M6 21h12M9 17h6M12 17v4M9 3l4 2-3 6-4-2ZM11 7l4 2M10 11a6 6 0 0 0 8 6',
  planet: 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM5.5 15.5C2.8 17.6 1.6 19.5 2.3 20.4c1.2 1.5 7.4-1.4 13.8-6.5S23 4.6 21.7 3.6c-.7-.6-2.6.1-5 1.8',
  dna: 'M7 3c0 6 10 6 10 12s-10 3-10 6M17 3c0 3-10 3-10 9s10 6 10 9M8 7h8M8 17h8M10 12h4',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7Z',
  rocket: 'M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10ZM12 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM9 16l-2 4 3-1M15 16l2 4-3-1',
  magnet: 'M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3ZM6 7h4M14 7h4',
  brain: 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1ZM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11ZM9 14a3 3 0 0 0 3 3',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
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
  for (let k = 1; k <= Math.min(n, 6); k++) s += k === Math.min(i, 6) ? `<span style="width:20px;height:6px;border-radius:3px;background:#912EE8"></span>` : `<span style="width:6px;height:6px;border-radius:3px;background:${c.dotOff}"></span>`;
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
const bubble = (s, pos) => `<div style="position:absolute;width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #FFFFFF 0%, #C99BF2 45%, rgba(145,46,232,0.55) 100%);box-shadow:0 0 18px rgba(145,46,232,0.35);opacity:0.85;${pos}"></div>`;

// ---------- slide types ----------
const T = {
  cover(c, s, i, n, mode) {
    return frame(c, `${grid(c)}${orb(c.orb1, c.orb1Mid, 380, 'top:20px;left:-10px')}${orb(c.orb3, null, 260, 'top:-100px;right:-90px')}${orb(c.orb2, null, 240, 'bottom:-40px;right:-100px')}${bubble(34, 'top:296px;left:22px')}
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">
<span style="display:flex;align-items:center;gap:6px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:500"><span style="width:7px;height:7px;border-radius:50%;background:#912EE8"></span>${esc(s.badge || 'جديد اليوم')}</span>${logo()}</div>
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
<span style="font-size:11.5px;color:${c.muted}">${esc(s.credit)}</span></div>`, '#100B14');
  },

  // cover built on a full-bleed image (gallery and profile formats); fit "contain" frames a landscape image instead
  coverImage(c, s, i, n, mode) {
    const pic = s.fit === 'contain'
      ? `${grid(c)}${orb(c.orb1, c.orb1Mid, 380, 'top:0;left:-20px')}<div style="position:absolute;top:56px;right:16px;left:16px;height:220px;border-radius:22px;background:${c.glass};border:1px solid ${c.glassBorder};box-shadow:${c.tileShadow};padding:8px;box-sizing:border-box"><div style="height:100%;border-radius:16px;overflow:hidden">${img(s.image, 'cover')}</div></div>`
      : `<div style="position:absolute;inset:0">${img(s.image, 'cover')}</div><div style="position:absolute;inset:0;background:${c.fade}"></div>`;
    return frame(c, `${pic}
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">
<span style="display:flex;align-items:center;gap:6px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:500"><span style="width:7px;height:7px;border-radius:50%;background:#912EE8"></span>${esc(s.badge || 'جديد اليوم')}</span>
<span style="width:36px;height:36px;border-radius:50%;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center">${mark({ size: 20 })}</span></div>
${glassChip(c, (s.chips || [])[0], `top:${s.fit === 'contain' ? 262 : 70}px;right:18px`, -6)}${glassChip(c, (s.chips || [])[1], `top:${s.fit === 'contain' ? 270 : 112}px;left:18px`, 5)}
${s.kreti ? `<div style="position:absolute;bottom:182px;left:10px">${kreti({ pose: s.pose || 'jump', size: 70, mode, cut: c.cut, look: 'dream' })}</div>` : ''}
${star(c, 16, 'top:150px;left:60px')}
<div style="position:absolute;bottom:14px;right:14px;left:14px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(14px);box-shadow:${c.chipShadow};border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:10px">
<p style="margin:0;font-size:${s.titleSize || 22}px;font-weight:800;line-height:1.3">${esc(s.title)}</p>
${s.credit ? `<span style="font-size:11.5px;color:${c.muted}">${esc(s.credit)}</span>` : ''}
<div style="display:flex;justify-content:space-between;align-items:center"><span dir="ltr" style="unicode-bidi:isolate;font-size:12px;color:${c.muted}">${counter(i, n)}</span><span style="background:${c.pillBg};color:${c.pillText};font-size:13px;font-weight:700;padding:8px 16px;border-radius:999px">اسحب ←</span></div></div>`, s.fit === 'contain' ? null : '#100B14');
  },

  text(c, s, i, n) {
    const pts = (s.points || []).map((p, k) => `<div style="display:flex;align-items:center;gap:10px;background:${c.glass};border:1px solid ${c.glassBorder};backdrop-filter:blur(12px);border-radius:14px;padding:9px 12px"><span style="flex:none;width:24px;height:24px;border-radius:8px;background:#912EE8;color:#100B14;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center">${k + 1}</span><span style="font-size:13px;line-height:1.5">${esc(p)}</span></div>`).join('');
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
<div style="position:absolute;top:16px;right:16px;left:16px;display:flex;justify-content:space-between;align-items:center">${logo()}${n > 1 ? pill(c, counter(i, n)) : `<span style="display:flex;align-items:center;gap:6px;background:${c.glass};border:1px solid ${c.glassBorder};border-radius:999px;padding:6px 12px;font-size:12px;font-weight:500"><span style="width:7px;height:7px;border-radius:50%;background:#912EE8"></span>${esc(s.badge || 'اختيار اليوم')}</span>`}</div>
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
<div style="position:absolute;top:58px;right:22px">${hand(c, s.note || 'أهلاً بك!', 15, 8)}</div>
${glassChip(c, { icon: 'clock', label: '9 مساءً' }, 'top:210px;right:18px', 6)}
${star(c, 16, 'top:40px;left:112px')}
<div style="position:absolute;bottom:22px;right:18px;left:18px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">
<p style="margin:0;font-size:26px;font-weight:800">تابع كريتيفيا ساينس</p>
<p dir="ltr" style="margin:-4px 0 0;font-size:13px;font-weight:700;color:${c.muted}">@creativia.sci</p>
<p style="margin:0;font-family:'Playpen Sans Arabic',sans-serif;font-size:14px;color:${c.ink}">${esc(s.line || 'كل يوم علم يدهشك، الساعة 9 مساءً')}</p>
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
