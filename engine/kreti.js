// Shared drawing helpers for the Creativia identity (ported from the canvas components).
let uid = 0;
const ARC = 'M163.5 78.1 A62 62 0 1 0 163.5 157.9';
const GLOSS = 'M38.7 97.3 A80 80 0 0 1 136.7 40.7';

function bodyGrad(id) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BFFC2"/><stop offset="0.45" stop-color="#2EE86B"/><stop offset="1" stop-color="#10B9A6"/></linearGradient>`;
}
function irisGrad(id) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#55F18B"/><stop offset="1" stop-color="#2BE070"/></linearGradient>`;
}

const none = { x1: 0, y1: 0, x2: 1, y2: 1, from: '#2EE86B', to: '#2EE86B' };
const base = { armL: '', armR: '', aL: none, aR: none, eyeRx: 7.5, eyeRy: 10.5, cutX: 127.5,
  mouth: 'M84 79 Q96 92 112 80', mouthFill: 'none', waveOp: 0, dotsOp: 0, burstOp: 0, starOp: 0 };
const poses = {
  wave: { armL: 'M40 150 Q16 142 20 112', waveOp: 1, aL: { x1: 40, y1: 150, x2: 20, y2: 112, from: '#4FEF85', to: '#2EE86B' } },
  point: { armR: 'M170 74 Q192 68 208 54', starOp: 1, aR: { x1: 170, y1: 74, x2: 208, y2: 54, from: '#26DB7B', to: '#5AF08E' } },
  jump: { armL: 'M34 118 Q16 100 22 74', armR: 'M174 70 Q194 56 196 32', eyeRx: 10, eyeRy: 11,
    aL: { x1: 34, y1: 118, x2: 22, y2: 74, from: '#75F7A3', to: '#2EE86B' },
    aR: { x1: 174, y1: 70, x2: 196, y2: 32, from: '#26DB7B', to: '#5AF08E' },
    mouth: 'M92 84 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', mouthFill: '#0B1410', burstOp: 1 },
  think: { eyeRy: 9, cutX: 116.5, mouth: 'M88 82 L108 78', dotsOp: 1 },
  smile: {}
};

// Full Kreti figure (no tile). look: 'flat' | 'dream'
function kreti({ pose = 'wave', size = 240, mode = 'light', cut, look = 'dream' } = {}) {
  const n = ++uid;
  const p = Object.assign({}, base, poses[pose] || poses.wave);
  const dream = look === 'dream';
  cut = cut || (mode === 'light' ? '#F3F8F4' : '#0B1410');
  const spark = mode === 'light' ? '#0E9C8C' : '#9BFFC2';
  const shOp = mode === 'light' ? 0.06 : 0.16, shMid = mode === 'light' ? 0.025 : 0.06;
  const arm = (d, g, id) => d ? `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}"><stop offset="0" stop-color="${g.from}"/><stop offset="0.35" stop-color="${g.from}"/><stop offset="1" stop-color="${g.to}"/></linearGradient>` : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 240 240" style="overflow:visible;display:block" role="img" aria-label="كريتي">
<defs>${bodyGrad('kb' + n)}${irisGrad('ki' + n)}${arm(p.armL, p.aL, 'al' + n)}${arm(p.armR, p.aR, 'ar' + n)}
<radialGradient id="ks${n}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="${shOp}"/><stop offset="0.55" stop-color="#000" stop-opacity="${shMid}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="bs${n}" filterUnits="userSpaceOnUse" x="-120" y="-120" width="480" height="480"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="bl${n}" filterUnits="userSpaceOnUse" x="-120" y="-120" width="480" height="480"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="bg${n}" filterUnits="userSpaceOnUse" x="-120" y="-120" width="480" height="480"><feGaussianBlur stdDeviation="12"/></filter>
<mask id="km${n}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="280" height="280"><path d="${ARC}" fill="none" stroke="#fff" stroke-width="64" stroke-linecap="round"/></mask>
</defs>
<ellipse cx="116" cy="224" rx="88" ry="13" fill="url(#ks${n})"/>
${dream ? `<path d="${ARC}" fill="none" stroke="#2EE86B" stroke-width="54" stroke-linecap="round" filter="url(#bg${n})" opacity="${mode === 'light' ? 0.45 : 0.55}"/>` : ''}
<path d="${ARC}" fill="none" stroke="url(#kb${n})" stroke-width="64" stroke-linecap="round"/>
${dream ? `<g mask="url(#km${n})"><ellipse cx="66" cy="62" rx="58" ry="38" fill="#fff" opacity="0.75" filter="url(#bs${n})"/><ellipse cx="38" cy="140" rx="16" ry="34" fill="#fff" opacity="0.35" filter="url(#bs${n})"/><ellipse cx="150" cy="196" rx="76" ry="36" fill="#0B8C76" opacity="0.4" filter="url(#bl${n})"/><ellipse cx="176" cy="150" rx="30" ry="22" fill="#0B8C76" opacity="0.3" filter="url(#bs${n})"/></g>` : ''}
<path d="${GLOSS}" fill="none" stroke="#fff" stroke-opacity="${dream ? 0.2 : 0.45}" stroke-width="7" stroke-linecap="round"/>
${p.armL ? `<path d="${p.armL}" fill="none" stroke="url(#al${n})" stroke-width="18" stroke-linecap="round"/>` : ''}
${p.armR ? `<path d="${p.armR}" fill="none" stroke="url(#ar${n})" stroke-width="18" stroke-linecap="round"/>` : ''}
<circle cx="122" cy="118" r="17" fill="url(#ki${n})"/>
<circle cx="${p.cutX}" cy="112.5" r="5" fill="${cut}"/>
${dream ? `<ellipse cx="116" cy="126" rx="9" ry="5" fill="#fff" opacity="0.5" filter="url(#bs${n})"/>` : ''}
<ellipse cx="80" cy="66" rx="${p.eyeRx}" ry="${p.eyeRy}" transform="rotate(-30 80 66)" fill="#0B1410"/>
<ellipse cx="106" cy="55" rx="${p.eyeRx}" ry="${p.eyeRy}" transform="rotate(-10 106 55)" fill="#0B1410"/>
<path d="${p.mouth}" fill="${p.mouthFill}" stroke="#0B1410" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
${p.waveOp ? `<path d="M6 98 Q2 90 8 82 M20 92 Q20 84 26 78" fill="none" stroke="${spark}" stroke-width="4" stroke-linecap="round"/>` : ''}
${p.dotsOp ? `<g fill="${spark}"><circle cx="168" cy="38" r="5"/><circle cx="186" cy="24" r="7"/><circle cx="208" cy="12" r="9"/></g>` : ''}
${p.burstOp ? `<path d="M60 20 L68 34 M90 8 L92 24 M36 40 L48 50" fill="none" stroke="${spark}" stroke-width="5" stroke-linecap="round"/>` : ''}
${p.starOp ? `<path fill="${spark}" d="M222 14 C224 24 228 28 238 30 C228 32 224 36 222 46 C220 36 216 32 206 30 C216 28 220 24 222 14 Z"/>` : ''}
</svg>`;
}

// App/profile icon: smiling Kreti on a tile. shape: 'rounded' | 'square' | 'circle'
function icon({ size = 240, mode = 'dark', shape = 'rounded', scale = 1 } = {}) {
  const n = ++uid;
  const t0 = mode === 'dark' ? '#1B3A2C' : '#FFFFFF';
  const t1 = mode === 'dark' ? '#08100C' : '#D3EEDC';
  const cut = mode === 'dark' ? '#10221A' : '#EAF6EE';
  const gloss = mode === 'dark' ? 0.45 : 0.55;
  const tile = shape === 'rounded' ? `<rect width="240" height="240" rx="64" fill="url(#tl${n})"/>`
    : shape === 'circle' ? `<circle cx="120" cy="120" r="120" fill="url(#tl${n})"/>`
    : `<rect width="240" height="240" fill="url(#tl${n})"/>`;
  const s = scale, off = 120 - 120 * s;
  return `<svg width="${size}" height="${size}" viewBox="0 0 240 240" style="display:block" role="img" aria-label="كريتيفيا">
<defs>${bodyGrad('ib' + n)}${irisGrad('ii' + n)}<radialGradient id="tl${n}" cx="0.3" cy="0.2" r="1"><stop offset="0" stop-color="${t0}"/><stop offset="1" stop-color="${t1}"/></radialGradient></defs>
${tile}
<g transform="translate(${off + 4 * s} ${off + 2 * s}) scale(${s})">
<path d="${ARC}" fill="none" stroke="url(#ib${n})" stroke-width="64" stroke-linecap="round"/>
<path d="${GLOSS}" fill="none" stroke="#fff" stroke-opacity="${gloss}" stroke-width="7" stroke-linecap="round"/>
<circle cx="122" cy="118" r="17" fill="url(#ii${n})"/>
<circle cx="127.5" cy="112.5" r="5" fill="${cut}"/>
<ellipse cx="80" cy="66" rx="7.5" ry="10.5" transform="rotate(-30 80 66)" fill="#0B1410"/>
<ellipse cx="106" cy="55" rx="7.5" ry="10.5" transform="rotate(-10 106 55)" fill="#0B1410"/>
<path d="M84 79 Q96 92 112 80" fill="none" stroke="#0B1410" stroke-width="6" stroke-linecap="round"/>
</g></svg>`;
}

// Mini mark (no face)
function mark({ size = 24, color = '#2EE86B', cut = null, gradient = false } = {}) {
  const n = ++uid;
  const stroke = gradient ? `url(#mb${n})` : color;
  return `<svg width="${size}" height="${size}" viewBox="0 0 240 240" style="display:block" aria-hidden="true">${gradient ? `<defs>${bodyGrad('mb' + n)}</defs>` : ''}<path d="${ARC}" fill="none" stroke="${stroke}" stroke-width="64" stroke-linecap="round"/><circle cx="122" cy="118" r="17" fill="${gradient ? '#2EE86B' : color}"/>${cut ? `<circle cx="127.5" cy="112.5" r="5" fill="${cut}"/>` : ''}</svg>`;
}

module.exports = { kreti, icon, mark };
