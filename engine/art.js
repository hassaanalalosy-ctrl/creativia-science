// Explanatory vector illustrations in the Creativia Science "dreamy" style:
// soft gradient body, inner light and shade, glossy rim, gentle glow and a soft ground shadow.
// Natural colours are allowed (a white cloud, a blue elephant), the style is what stays the same.
//
// Spec field `art` (on slides and reel scenes) can be:
//   "cloud"                                      one library item, centred
//   {"items":[{"name":"cloud","x":0,"y":-20,"s":0.8,"rot":0}, ...],
//    "arrows":[[x1,y1,x2,y2,bend]], "plus":[[x,y]], "equals":[[x,y]]}
//   items may also be custom shapes drawn with the same treatment:
//    {"parts":["<path d='...'/>"], "palette":"blue", "box":[x0,y0,x1,y1], "details":["<circle .../>"]}
// Canvas: 400 x 300, ground line around y = 262. x/y in items are offsets from the item's own place.
let uid = 0;

const PAL = {
  white:  { hi: '#FFFFFF', base: '#F7F9FF', lo: '#D3DBF4', shade: '#A7B3DE', glow: '#E4EAFF', soft: true },
  blue:   { hi: '#C4E4FF', base: '#5FA4F5', lo: '#2C5BC9', shade: '#1B3C94', glow: '#7DB6FF' },
  sky:    { hi: '#D8F3FF', base: '#5CC7F7', lo: '#1C8ED6', shade: '#0E5FA0', glow: '#8FDCFF' },
  yellow: { hi: '#FFF6C2', base: '#FFD23F', lo: '#F59E0B', shade: '#C2620A', glow: '#FFE07A' },
  orange: { hi: '#FFE2B8', base: '#FF9F43', lo: '#F0601E', shade: '#B23A0E', glow: '#FFB870' },
  red:    { hi: '#FFC7C7', base: '#FF5A5F', lo: '#D61F3C', shade: '#8E1028', glow: '#FF8A8E' },
  pink:   { hi: '#FFE0EC', base: '#FF8FB8', lo: '#E0457E', shade: '#A01E55', glow: '#FFB3CF' },
  green:  { hi: '#D7FBD9', base: '#4FD67A', lo: '#16A34A', shade: '#0B6B30', glow: '#86EFA6' },
  purple: { hi: '#EBD4FF', base: '#A35BF0', lo: '#6D28D9', shade: '#41128A', glow: '#C79BFF' },
  grey:   { hi: '#FFFFFF', base: '#D9DCE6', lo: '#9AA0B4', shade: '#5E6478', glow: '#E6E9F2', soft: true },
  brown:  { hi: '#F3D9B8', base: '#C98A55', lo: '#8A5530', shade: '#5A3418', glow: '#E0B48A' },
  sand:   { hi: '#FFF1D6', base: '#F2CF8E', lo: '#C8964C', shade: '#8C6228', glow: '#FBE3B4' }
};

// Library: each item has parts (one body, drawn with one gradient), optional tinted parts and details on top.
const LIB = {
  cloud: { palette: 'white', box: [70, 90, 330, 220],
    parts: ['<path d="M104 218 C70 218 62 176 94 166 C88 128 132 110 154 132 C166 90 236 86 250 130 C280 110 318 136 306 170 C334 178 330 218 300 218 Z"/>'],
    gloss: 'M104 168 C100 146 120 128 144 136' },
  drop: { palette: 'sky', box: [140, 50, 260, 245],
    parts: ['<path d="M200 54 C200 54 142 134 142 182 A58 58 0 0 0 258 182 C258 134 200 54 200 54 Z"/>'],
    gloss: 'M164 176 C164 150 180 124 194 104' },
  elephant: { palette: 'blue', box: [58, 78, 346, 264],
    parts: [
      '<rect x="176" y="190" width="34" height="72" rx="16"/>', '<rect x="262" y="190" width="34" height="72" rx="16"/>',
      '<ellipse cx="230" cy="160" rx="96" ry="64"/>',
      '<rect x="150" y="196" width="36" height="66" rx="17"/>', '<rect x="236" y="196" width="36" height="66" rx="17"/>',
      '<circle cx="128" cy="132" r="52"/>',
      '<path d="M86 146 C68 186 66 226 90 240 C100 246 112 238 106 228 C94 212 98 190 112 166 Z"/>'],
    tints: ['<ellipse cx="150" cy="136" rx="34" ry="44" transform="rotate(-8 150 136)"/>'],
    details: [
      '<circle cx="110" cy="120" r="6.5" fill="#14204A"/>', '<circle cx="112" cy="118" r="2" fill="#fff"/>',
      '<path d="M98 160 C104 172 116 174 124 168" fill="none" stroke="#F8FAFF" stroke-width="7" stroke-linecap="round"/>',
      '<path d="M325 150 C340 160 340 178 332 190" fill="none" stroke="#2C5BC9" stroke-width="6" stroke-linecap="round"/>'],
    gloss: 'M176 112 C200 98 240 96 270 104' },
  bolt: { palette: 'yellow', box: [140, 40, 270, 262],
    parts: ['<path d="M226 44 L148 162 L198 162 L176 258 L262 128 L210 128 L240 44 Z" stroke-linejoin="round"/>'],
    gloss: 'M222 60 L180 124' },
  sun: { palette: 'orange', box: [110, 40, 290, 230],
    parts: ['<circle cx="200" cy="135" r="64"/>'],
    rays: { cx: 200, cy: 135, r1: 78, r2: 98, n: 12, color: '#FFC24A' },
    gloss: 'M152 112 C160 92 180 80 200 78' },
  earth: { palette: 'sky', box: [120, 50, 280, 220],
    parts: ['<circle cx="200" cy="135" r="80"/>'],
    details: ['<path d="M150 90 C170 80 196 90 192 108 C188 124 160 118 156 136 C152 152 132 150 126 136 C124 116 134 98 150 90 Z M214 150 C232 140 262 146 268 166 C262 190 240 206 222 200 C206 194 204 168 214 150 Z M222 70 C236 66 254 74 258 86 C246 92 228 88 222 70 Z" fill="#46C46E" opacity="0.92"/>'],
    gloss: 'M140 110 C148 86 170 68 196 62' },
  moon: { palette: 'grey', box: [120, 50, 280, 220],
    parts: ['<circle cx="200" cy="135" r="78"/>'],
    details: ['<circle cx="176" cy="110" r="16" fill="#AEB3C6" opacity="0.6"/><circle cx="226" cy="160" r="22" fill="#AEB3C6" opacity="0.55"/><circle cx="232" cy="104" r="9" fill="#AEB3C6" opacity="0.6"/><circle cx="170" cy="168" r="8" fill="#AEB3C6" opacity="0.55"/>'],
    gloss: 'M142 112 C150 88 172 70 198 64' },
  planet: { palette: 'sand', box: [80, 70, 320, 210],
    back: ['<path d="M88 150 C88 122 312 92 312 120" fill="none" stroke="#B9874A" stroke-width="10" stroke-linecap="round" opacity="0.8"/>'],
    parts: ['<circle cx="200" cy="135" r="62"/>'],
    details: ['<path d="M140 128 C200 116 250 112 262 118" fill="none" stroke="#C8964C" stroke-width="5" opacity="0.5"/><path d="M146 156 C190 148 240 142 258 146" fill="none" stroke="#C8964C" stroke-width="4" opacity="0.4"/>',
      '<path d="M88 150 C88 178 312 148 312 120" fill="none" stroke="#E2B676" stroke-width="10" stroke-linecap="round"/>'],
    gloss: 'M152 116 C160 96 178 84 198 80' },
  rocket: { palette: 'white', box: [140, 30, 260, 262],
    back: ['<path d="M168 178 L138 222 L172 214 Z M232 178 L262 222 L228 214 Z" fill="#FF5A5F"/>', '<path d="M186 214 C180 238 200 262 200 262 C200 262 220 238 214 214 Z" fill="#FFB020"/>'],
    parts: ['<path d="M200 34 C236 64 246 118 236 214 L164 214 C154 118 164 64 200 34 Z"/>'],
    details: ['<circle cx="200" cy="112" r="20" fill="#5CC7F7" stroke="#2C5BC9" stroke-width="6"/>', '<path d="M200 34 C214 46 224 60 230 76 L170 76 C176 60 186 46 200 34 Z" fill="#FF5A5F"/>'],
    gloss: 'M176 90 C176 70 184 58 194 48' },
  atom: { palette: 'purple', box: [100, 50, 300, 230],
    back: ['<ellipse cx="200" cy="140" rx="96" ry="34" fill="none" stroke="#C79BFF" stroke-width="7"/><ellipse cx="200" cy="140" rx="96" ry="34" transform="rotate(60 200 140)" fill="none" stroke="#C79BFF" stroke-width="7"/><ellipse cx="200" cy="140" rx="96" ry="34" transform="rotate(-60 200 140)" fill="none" stroke="#C79BFF" stroke-width="7"/>'],
    parts: ['<circle cx="200" cy="140" r="26"/>'],
    details: ['<circle cx="296" cy="140" r="9" fill="#5CC7F7"/><circle cx="152" cy="57" r="9" fill="#5CC7F7"/><circle cx="152" cy="223" r="9" fill="#5CC7F7"/>'],
    gloss: 'M186 130 C188 122 194 118 200 117' },
  heart: { palette: 'red', box: [110, 60, 290, 240],
    parts: ['<path d="M200 236 C150 200 112 166 112 124 C112 92 136 70 164 70 C182 70 194 80 200 92 C206 80 218 70 236 70 C264 70 288 92 288 124 C288 166 250 200 200 236 Z"/>'],
    gloss: 'M134 118 C134 98 148 86 164 86' },
  brain: { palette: 'pink', box: [100, 60, 300, 230],
    parts: ['<path d="M196 72 C176 60 150 66 144 86 C120 84 104 104 112 126 C96 140 100 168 122 176 C124 198 148 212 170 204 C182 222 210 222 220 206 C242 214 266 200 268 180 C292 172 300 144 284 128 C294 104 276 82 254 86 C246 64 216 60 204 76 Z"/>'],
    details: ['<path d="M200 80 C196 120 206 160 198 206" fill="none" stroke="#C2366E" stroke-width="5" stroke-linecap="round" opacity="0.55"/><path d="M146 112 C162 110 170 124 166 138 M134 156 C150 150 166 160 168 176 M246 108 C232 112 228 126 236 138 M262 152 C246 150 236 162 238 178" fill="none" stroke="#C2366E" stroke-width="5" stroke-linecap="round" opacity="0.5"/>'],
    gloss: 'M126 118 C128 100 140 90 154 90' },
  lungs: { palette: 'pink', box: [100, 50, 300, 240],
    parts: ['<path d="M186 104 C186 84 172 80 160 88 C130 108 112 160 116 206 C118 226 136 234 154 226 C172 218 186 200 186 180 Z"/>', '<path d="M214 104 C214 84 228 80 240 88 C270 108 288 160 284 206 C282 226 264 234 246 226 C228 218 214 200 214 180 Z"/>'],
    details: ['<path d="M200 50 L200 110 M200 110 C192 122 184 126 174 128 M200 110 C208 122 216 126 226 128" fill="none" stroke="#E9EDF7" stroke-width="12" stroke-linecap="round"/>'],
    gloss: 'M130 170 C132 138 144 112 160 100' },
  dna: { palette: 'purple', box: [140, 40, 260, 262],
    back: ['<path d="M226 50 C226 100 174 110 174 150 C174 190 226 200 226 250" fill="none" stroke="#5CC7F7" stroke-width="16" stroke-linecap="round"/>'],
    parts: ['<path d="M166 50 C166 100 218 110 218 150 C218 190 166 200 166 250 L182 250 C182 206 234 196 234 150 C234 104 182 96 182 50 Z"/>'],
    details: ['<path d="M178 78 L222 78 M186 104 L214 104 M186 196 L214 196 M178 222 L222 222" stroke="#FFD23F" stroke-width="7" stroke-linecap="round"/>'],
    gloss: 'M172 62 C172 80 178 92 186 100' },
  flask: { palette: 'white', box: [120, 40, 280, 262],
    parts: ['<path d="M178 46 L222 46 L222 112 L272 222 C280 240 268 258 248 258 L152 258 C132 258 120 240 128 222 L178 112 Z" stroke-linejoin="round"/>'],
    details: ['<path d="M148 186 L252 186 L268 222 C274 236 266 248 250 248 L150 248 C134 248 126 236 132 222 Z" fill="#4FD67A" opacity="0.9"/>', '<circle cx="180" cy="214" r="9" fill="#D7FBD9"/><circle cx="214" cy="226" r="6" fill="#D7FBD9"/><circle cx="230" cy="204" r="5" fill="#D7FBD9"/>', '<rect x="170" y="38" width="60" height="14" rx="7" fill="#BCC8F0"/>'],
    gloss: 'M186 120 L150 202' },
  magnet: { palette: 'red', box: [110, 50, 290, 240],
    parts: ['<path d="M120 60 L170 60 L170 150 C170 170 182 182 200 182 C218 182 230 170 230 150 L230 60 L280 60 L280 150 C280 196 244 232 200 232 C156 232 120 196 120 150 Z" stroke-linejoin="round"/>'],
    details: ['<rect x="120" y="60" width="50" height="38" rx="4" fill="#D9DCE6"/><rect x="230" y="60" width="50" height="38" rx="4" fill="#D9DCE6"/>'],
    gloss: 'M134 110 L134 160' },
  can: { palette: 'red', box: [140, 40, 260, 262],
    parts: ['<path d="M150 66 C150 54 250 54 250 66 L250 240 C250 254 150 254 150 240 Z"/>'],
    details: ['<ellipse cx="200" cy="64" rx="50" ry="10" fill="#D9DCE6"/><ellipse cx="200" cy="64" rx="40" ry="6" fill="#B4BACB"/>', '<path d="M150 120 C180 136 220 104 250 120 L250 176 C220 160 180 192 150 176 Z" fill="#fff" opacity="0.85"/>'],
    gloss: 'M164 90 L164 226' },
  thermometer: { palette: 'white', box: [160, 40, 240, 262],
    parts: ['<path d="M184 60 C184 48 216 48 216 60 L216 182 A36 36 0 1 1 184 182 Z"/>'],
    details: ['<path d="M194 120 L206 120 L206 192 A20 20 0 1 1 194 192 Z" fill="#FF5A5F"/>', '<path d="M224 80 L234 80 M224 104 L234 104 M224 128 L234 128 M224 152 L234 152" stroke="#9AA0B4" stroke-width="4" stroke-linecap="round"/>'],
    gloss: 'M192 64 L192 168' },
  bubble: { palette: 'sky', box: [150, 80, 250, 200],
    parts: ['<circle cx="200" cy="140" r="52"/>'], glassy: true,
    gloss: 'M168 124 C172 106 186 96 200 94' },
  mountain: { palette: 'grey', box: [60, 70, 340, 262],
    parts: ['<path d="M62 260 L170 84 C176 74 190 74 196 84 L246 160 L270 128 C276 120 288 120 294 128 L340 260 Z" stroke-linejoin="round"/>'],
    details: ['<path d="M150 116 L170 84 C176 74 190 74 196 84 L214 112 L200 104 L186 118 L172 104 Z" fill="#fff"/>'],
    gloss: 'M92 230 L160 112' },
  tree: { palette: 'green', box: [110, 40, 290, 262],
    back: ['<rect x="186" y="170" width="28" height="92" rx="12" fill="#8A5530"/>'],
    parts: ['<path d="M200 44 C240 44 262 74 256 100 C286 108 292 148 266 166 C266 190 240 202 218 194 C206 206 184 206 172 194 C146 202 126 186 132 164 C108 148 114 112 142 104 C136 72 162 44 200 44 Z"/>'],
    gloss: 'M146 106 C150 80 170 62 194 58' },
  fish: { palette: 'orange', box: [80, 90, 320, 200],
    back: ['<path d="M256 145 L312 104 C318 100 324 104 322 112 L312 145 L322 178 C324 186 318 190 312 186 Z" fill="#F0601E"/>'],
    parts: ['<path d="M90 145 C120 92 220 88 266 145 C220 202 120 198 90 145 Z"/>'],
    details: ['<circle cx="132" cy="136" r="8" fill="#2A1A0E"/><circle cx="134" cy="134" r="2.5" fill="#fff"/>', '<path d="M176 108 C186 130 186 160 176 182" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.85"/>'],
    gloss: 'M120 128 C136 108 168 100 196 102' },
  cigarette: { palette: 'white', box: [60, 120, 340, 180],
    parts: ['<rect x="70" y="132" width="260" height="34" rx="12"/>'],
    details: ['<rect x="250" y="132" width="80" height="34" rx="12" fill="#F2A65A"/><rect x="250" y="132" width="16" height="34" fill="#F2A65A"/>', '<rect x="70" y="132" width="20" height="34" rx="10" fill="#9AA0B4"/><circle cx="76" cy="149" r="6" fill="#FF7A45"/>'],
    gloss: 'M96 140 L240 140' },
  vape: { palette: 'grey', box: [150, 40, 250, 262],
    parts: ['<rect x="168" y="70" width="64" height="186" rx="22"/>'],
    details: ['<rect x="184" y="44" width="32" height="34" rx="10" fill="#5E6478"/>', '<rect x="180" y="110" width="40" height="58" rx="12" fill="#A35BF0" opacity="0.85"/>', '<circle cx="200" cy="214" r="8" fill="#5CC7F7"/>'],
    gloss: 'M180 90 L180 236' },
  hair: { palette: 'brown', box: [120, 112, 280, 188], noShadow: true, // drawn wider than its box: inside a lens it runs past the rim
    parts: ['<path d="M-40 132 C100 110 300 110 440 124 L440 176 C300 164 100 166 -40 190 Z"/>'],
    details: ['<path d="M40 128 C48 146 48 168 40 184 M80 124 C88 140 88 162 80 180 M120 120 C128 138 128 160 120 176 M160 117 C168 136 168 158 160 172 M200 116 C208 134 208 156 200 170 M240 116 C248 134 248 156 240 168 M280 118 C288 136 288 156 280 168 M320 121 C328 138 328 158 320 170" fill="none" stroke="#5A3418" stroke-width="3" stroke-linecap="round" opacity="0.45"/>'],
    gloss: 'M0 136 C140 118 260 118 400 128' },
  earthcut: { palette: 'orange', box: [70, 20, 330, 280], noShadow: true, // Earth cut in half: crust, mantle, outer core, inner core, with a straight tunnel
    parts: ['<circle cx="200" cy="150" r="128"/>'],
    details: [
      '<circle cx="200" cy="150" r="124" fill="none" stroke="#3E9BE0" stroke-width="9"/><path d="M118 56 C140 44 168 40 180 52 M262 62 C280 70 300 92 306 112 M98 210 C108 232 124 250 140 258" fill="none" stroke="#46C46E" stroke-width="9" stroke-linecap="round"/>',
      '<circle cx="200" cy="150" r="70" fill="#FFB020"/><circle cx="200" cy="150" r="70" fill="none" stroke="#F07A1E" stroke-width="4" opacity="0.6"/>',
      '<circle cx="200" cy="150" r="36" fill="#FFF3B0"/><circle cx="200" cy="150" r="46" fill="#FFE27A" opacity="0.35"/>',
      '<rect x="191" y="22" width="18" height="256" rx="9" fill="#1A0D29" opacity="0.92"/><rect x="191" y="22" width="18" height="256" rx="9" fill="none" stroke="#D09BFF" stroke-width="2" opacity="0.9"/>'],
    gloss: 'M104 110 C116 78 140 56 168 44' },
  eye: { palette: 'white', box: [80, 80, 320, 200],
    parts: ['<path d="M84 140 C130 84 270 84 316 140 C270 196 130 196 84 140 Z"/>'],
    details: ['<circle cx="200" cy="140" r="44" fill="#5FA4F5"/><circle cx="200" cy="140" r="44" fill="none" stroke="#2C5BC9" stroke-width="5"/><circle cx="200" cy="140" r="20" fill="#14204A"/><circle cx="212" cy="128" r="8" fill="#fff"/>'],
    gloss: 'M120 126 C146 104 176 96 204 96' }
};

const G = 262; // ground line

function item(def, n, mode, opt = {}) {
  const pal = PAL[def.palette] || PAL[opt.palette] || (typeof def.palette === 'object' ? def.palette : PAL.blue);
  const [x0, y0, x1, y1] = def.box || [100, 60, 300, 262];
  const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2;
  const id = 'a' + (++uid) + '_' + n;
  const fill = (s, f) => s.replace(/\/>$/, ` fill="${f}"/>`);
  const parts = def.parts || [];
  const tints = def.tints || [];
  const clip = `<clipPath id="c${id}">${parts.concat(tints).join('')}</clipPath>`;
  const big = `filterUnits="userSpaceOnUse" x="-400" y="-400" width="1200" height="1100"`;
  const defs = `<defs>
<linearGradient id="g${id}" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"><stop offset="0" stop-color="${pal.hi}"/><stop offset="0.45" stop-color="${pal.base}"/><stop offset="1" stop-color="${pal.lo}"/></linearGradient>
<linearGradient id="t${id}" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"><stop offset="0" stop-color="${pal.base}"/><stop offset="1" stop-color="${pal.shade}"/></linearGradient>
<radialGradient id="s${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="${mode === 'dark' ? 0.32 : 0.14}"/><stop offset="0.6" stop-color="#000" stop-opacity="${mode === 'dark' ? 0.12 : 0.05}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="b${id}" ${big}><feGaussianBlur stdDeviation="${Math.max(6, w / 22)}"/></filter>
<filter id="l${id}" ${big}><feGaussianBlur stdDeviation="${Math.max(10, w / 12)}"/></filter>
${clip}</defs>`;
  const shadow = def.noShadow ? '' : `<ellipse cx="${cx}" cy="${y1 + 8}" rx="${w * 0.46}" ry="${Math.max(8, w * 0.05)}" fill="url(#s${id})"/>`;
  const glow = `<g filter="url(#l${id})" opacity="${mode === 'dark' ? 0.55 : 0.4}">${parts.map(p => fill(p, pal.glow)).join('')}</g>`;
  const rays = def.rays ? Array.from({ length: def.rays.n }, (_, k) => {
    const a = k / def.rays.n * Math.PI * 2, r = def.rays;
    return `<path d="M${(r.cx + r.r1 * Math.cos(a)).toFixed(1)} ${(r.cy + r.r1 * Math.sin(a)).toFixed(1)} L${(r.cx + r.r2 * Math.cos(a)).toFixed(1)} ${(r.cy + r.r2 * Math.sin(a)).toFixed(1)}" stroke="${r.color}" stroke-width="10" stroke-linecap="round"/>`;
  }).join('') : '';
  const body = parts.map(p => fill(p, def.glassy ? pal.base : `url(#g${id})`)).join('') + tints.map(p => fill(p, `url(#t${id})`)).join('');
  const light = `<g clip-path="url(#c${id})">
<ellipse cx="${x0 + w * 0.28}" cy="${y0 + h * 0.22}" rx="${w * 0.42}" ry="${h * 0.3}" fill="#fff" opacity="${def.glassy ? 0.55 : 0.6}" filter="url(#b${id})"/>
<ellipse cx="${x0 + w * 0.74}" cy="${y0 + h * 0.86}" rx="${w * 0.5}" ry="${h * 0.32}" fill="${pal.shade}" opacity="${def.glassy ? 0.35 : pal.soft ? 0.28 : 0.42}" filter="url(#l${id})"/></g>`;
  const glassyOp = def.glassy ? `<g opacity="0.55">${body}</g>` : body;
  const gloss = def.gloss ? `<path d="${def.gloss}" fill="none" stroke="#fff" stroke-width="${Math.max(5, w / 34)}" stroke-linecap="round" opacity="0.7"/>` : '';
  return `${defs}${shadow}${glow}${rays}${(def.back || []).join('')}${def.glassy ? glassyOp : body}${light}${(def.details || []).join('')}${gloss}`;
}

const ink = mode => mode === 'dark' ? '#E7D2FF' : '#481F6B';
function arrow([x1, y1, x2, y2, bend = 0.25], mode) {
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const a = Math.atan2(y2 - my, x2 - mx), L = 14;
  const h = (s) => `${(x2 - L * Math.cos(a + s)).toFixed(1)} ${(y2 - L * Math.sin(a + s)).toFixed(1)}`;
  return `<path d="M${x1} ${y1} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2} ${y2} M${h(0.5)} L${x2} ${y2} L${h(-0.5)}" fill="none" stroke="${ink(mode)}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// symbols, drawn centred on (x, y). Arrows point right-to-left (reading direction).
function sym(t, [x, y], mode) {
  const st = `stroke="${ink(mode)}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const d = {
    '+': `M${x - 14} ${y} H${x + 14} M${x} ${y - 14} V${y + 14}`,
    '=': `M${x - 14} ${y - 7} H${x + 14} M${x - 14} ${y + 7} H${x + 14}`,
    '>': `M${x + 10} ${y - 14} L${x - 10} ${y} L${x + 10} ${y + 14}`, // RTL: right item is bigger, open side faces right
    '<': `M${x - 10} ${y - 14} L${x + 10} ${y} L${x - 10} ${y + 14}`,
    '→': `M${x + 18} ${y} H${x - 16} M${x - 6} ${y - 10} L${x - 16} ${y} L${x - 6} ${y + 10}`
  }[t] || '';
  return `<path d="${d}" ${st}/>`;
}
const sparkle = (x, y, s, mode) => `<path transform="translate(${x} ${y}) scale(${s / 24})" d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill="${mode === 'dark' ? '#F1E2FF' : '#FFFFFF'}" opacity="0.9"/>`;

const SYMS = ['=', '+', '>', '<', '→'];
const defOf = it => { const d = it.name ? LIB[it.name] : it; if (!d) throw new Error('Unknown art item: ' + it.name); return d; };
const boxOf = d => { const [x0, y0, x1, y1] = d.box || [100, 60, 300, 262]; return { x0, y0, w: x1 - x0, h: y1 - y0 }; };

// Every animated piece is wrapped in a group with placeholder tokens; reels fill them per frame, stills clear them.
function ctx(anim) {
  const meta = [];
  return {
    meta,
    wrap(inner, m) {
      const i = meta.length; meta.push(m);
      return `<g transform="__A${i}__" opacity="__O${i}__">${inner}</g>`;
    }
  };
}

// Visual balance (owner rule): sizes keep their real order (small stays smaller) but are softened so the
// small thing is still clearly readable: no item is drawn shorter than MIN_RATIO of the tallest one.
const MIN_RATIO = 0.45;
function balance(heights, ratio = MIN_RATIO) {
  const max = Math.max(...heights.filter(h => h > 0));
  return heights.map(h => h > 0 ? Math.max(h, max * ratio) : h);
}

// natural size of a row entry (canvas units, before scaling)
function measure(e) {
  if (typeof e === 'string') return { w: 34, h: 34, sym: true };
  if (e.lens) { const D = e.d || 170; return { w: D + (e.handle === false ? 0 : 30), h: D + (e.handle === false ? 0 : 30) }; }
  const b = boxOf(defOf(e));
  if (e.count > 1) {
    const cols = e.cols || Math.ceil(Math.sqrt(e.count)), rows = Math.ceil(e.count / cols);
    const cw = b.w * 1.18, ch = b.h * 1.14;
    return { w: cw * cols + (rows > 1 ? cw / 2 : 0), h: ch * rows, cols, rows, cw, ch, b };
  }
  return { w: b.w, h: b.h, b };
}

function drawItemAt(e, n, mode, x, y, sc, c, delay) {
  // draws an item so that its box's top-left lands at (x, y) at scale sc
  const d = defOf(e), b = boxOf(d);
  const g = `<g transform="translate(${(x - b.x0 * sc).toFixed(1)} ${(y - b.y0 * sc).toFixed(1)}) scale(${sc.toFixed(4)})">${item(d, n, mode, e)}</g>`;
  return c.wrap(g, { cx: x + b.w * sc / 2, cy: y + b.h * sc / 2, delay, kind: e.motion || d.motion || 'float', amp: e.amp });
}

function rowSvg(spec, mode, c, t0 = 0.4) {
  const entries = spec.row;
  const gap = spec.gap || 20, cy = spec.cy || 150, maxW = spec.width || 384, defH = spec.h || 140;
  const m = entries.map(measure);
  let sc = entries.map((e, i) => m[i].sym ? 1 : (typeof e === 'object' && e.h ? e.h : e.lens ? m[i].h : (m[i].rows > 1 ? Math.min(200, defH * 1.35) : defH * 1.1)) / m[i].h);
  { // soften extreme size gaps between single items (herds, lenses and signs keep their size)
    const single = entries.map((e, i) => !m[i].sym && !e.lens && !(e.count > 1));
    const tallest = Math.max(...sc.map((v, i) => m[i].sym ? 0 : v * m[i].h));
    // next to a herd, the single item must hold its own (a cloud = many elephants reads only if the cloud is big)
    const ratio = spec.minRatio || (entries.some(e => e.count > 1) ? 1 : MIN_RATIO);
    sc = sc.map((v, i) => single[i] ? Math.max(v * m[i].h, tallest * ratio) / m[i].h : v);
  }
  let widths = m.map((mm, i) => mm.w * sc[i]);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (entries.length - 1);
  const k = total > maxW ? maxW / total : 1;
  sc = sc.map((v, i) => m[i].sym ? 1 : v * k); widths = widths.map((w, i) => m[i].sym ? w : w * k);
  const W = widths.reduce((a, b) => a + b, 0) + gap * k * (entries.length - 1);
  // right-to-left: the first entry sits on the right
  let xr = 200 + W / 2, out = '', delay = t0;
  entries.forEach((e, i) => {
    const w = widths[i], x = xr - w;
    if (m[i].sym) {
      out += c.wrap(sym(e, [x + w / 2, cy], mode), { cx: x + w / 2, cy, delay, kind: 'none' });
      delay += 0.3;
    } else if (e.lens) {
      out += lensSvg(e, mode, x, cy - m[i].h * sc[i] / 2, sc[i], c, delay);
      delay += 0.45;
    } else if (e.count > 1) {
      const mm = m[i], s2 = sc[i], top = cy - mm.h * s2 / 2;
      for (let n = 0; n < e.count; n++) {
        const r = Math.floor(n / mm.cols), col = n % mm.cols;
        // fill right-to-left; odd rows shift half a cell so the herd reads as a crowd
        const cx = x + w - (col + 1) * mm.cw * s2 - (r % 2 ? mm.cw * s2 / 2 : 0) + (mm.cw - mm.b.w) * s2 / 2;
        const cyy = top + r * mm.ch * s2 + (mm.ch - mm.b.h) * s2 / 2;
        out += drawItemAt(Object.assign({}, e, { motion: e.motion || 'bob' }), n, mode, cx, cyy, s2, c, delay + n * 0.06);
      }
      delay += 0.3 + e.count * 0.06;
    } else {
      const hh = m[i].h * sc[i];
      out += drawItemAt(e, i, mode, x, cy - hh / 2, sc[i], c, delay);
      delay += 0.4;
    }
    xr = x - gap * k;
  });
  return out;
}

function lensSvg(e, mode, x, y, sc, c, delay) {
  const D = (e.d || 170) * sc, r = D / 2, cx = x + r, cyy = y + r;
  const id = 'z' + (++uid);
  const inner = e.lens.row ? rowSvg(Object.assign({ width: 330, h: e.lens.h || 110 }, e.lens), mode, { wrap: (g) => g, meta: [] })
    : e.lens.stack ? stackSvg(e.lens, mode, { wrap: (g) => g, meta: [] })
    : contentSvg(e.lens, mode, { wrap: (g) => g, meta: [] });
  const bg = mode === 'dark' ? ['#3A1A5C', '#1A0D29'] : ['#FFFFFF', '#EEE2FB'];
  const handle = e.handle === false ? '' : `<path d="M${(cx + r * 0.72).toFixed(1)} ${(cyy + r * 0.72).toFixed(1)} L${(cx + r * 0.72 + 30 * sc).toFixed(1)} ${(cyy + r * 0.72 + 30 * sc).toFixed(1)}" stroke="#912EE8" stroke-width="${(16 * sc).toFixed(1)}" stroke-linecap="round"/>`;
  const g = `<defs><clipPath id="c${id}"><circle cx="${cx}" cy="${cyy}" r="${r - 4 * sc}"/></clipPath>
<radialGradient id="b${id}" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient>
<linearGradient id="r${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EBD4FF"/><stop offset="0.5" stop-color="#A35BF0"/><stop offset="1" stop-color="#6D28D9"/></linearGradient></defs>
${handle}<circle cx="${cx}" cy="${cyy}" r="${r}" fill="url(#b${id})"/>
<g clip-path="url(#c${id})"><g transform="translate(${cx} ${cyy}) scale(${(D / 300).toFixed(4)}) translate(-200 -150)">${inner}</g></g>
<circle cx="${cx}" cy="${cyy}" r="${r - 3 * sc}" fill="none" stroke="url(#r${id})" stroke-width="${(9 * sc).toFixed(1)}"/>
<path d="M${(cx - r * 0.62).toFixed(1)} ${(cyy - r * 0.3).toFixed(1)} A${(r * 0.7).toFixed(1)} ${(r * 0.7).toFixed(1)} 0 0 1 ${(cx - r * 0.2).toFixed(1)} ${(cyy - r * 0.66).toFixed(1)}" fill="none" stroke="#fff" stroke-width="${(5 * sc).toFixed(1)}" stroke-linecap="round" opacity="0.8"/>`;
  return c.wrap(g, { cx, cy: cyy, delay, kind: 'pop' });
}

function stackSvg(spec, mode, c) {
  const gap = spec.gap || 24, defH = spec.h || 90;
  const hs = balance(spec.stack.map(e => e.h || defH), spec.minRatio || MIN_RATIO);
  const ent = spec.stack.map((e, i) => { const d = defOf(e), b = boxOf(d), sc = hs[i] / b.h; return { e, b, sc, h: b.h * sc, w: b.w * sc }; });
  const H = ent.reduce((a, x) => a + x.h, 0) + gap * (ent.length - 1);
  let y = (spec.cy || 150) - H / 2, out = '', delay = 0.4;
  ent.forEach((x, i) => { out += drawItemAt(x.e, i, mode, 200 - x.w / 2, y, x.sc, c, delay); y += x.h + gap; delay += 0.4; });
  return out;
}

function contentSvg(s, mode, c) {
  let out = '';
  if (s.row) out += rowSvg(s, mode, c);
  if (s.stack) out += stackSvg(s, mode, c);
  (s.items || []).forEach((it, k) => {
    const def = defOf(it);
    const sc = it.s || 1, x = it.x || 0, y = it.y || 0, rot = it.rot || 0;
    const [x0, , x1] = def.box || [100, 60, 300, 262];
    const gx = (x0 + x1) / 2;
    const g = `<g transform="translate(${x} ${y}) translate(${gx} ${G}) scale(${sc}) rotate(${rot}) translate(${-gx} ${-G})">${item(def, k, mode, it)}</g>`;
    out += c.wrap(g, { cx: gx + x, cy: 150 + y, delay: 0.4 + k * 0.35, kind: it.motion || def.motion || 'float' });
  });
  (s.arrows || []).forEach(a => { out += arrow(a, mode); });
  (s.plus || []).forEach(p => { out += sym('+', p, mode); });
  (s.equals || []).forEach(p => { out += sym('=', p, mode); });
  return out;
}

// Returns the SVG markup (400 x 300) for an `art` spec. With {anim:true} returns {svg, meta} for reels.
function artSvg(spec, mode = 'light', size = { w: 400, h: 300 }, opt = {}) {
  if (!spec) return '';
  const s = typeof spec === 'string' ? { items: [{ name: spec }] } : spec;
  const halo = mode === 'dark' ? 'rgba(160,90,255,0.30)' : 'rgba(255,255,255,0.95)';
  let out = `<defs><radialGradient id="halo${++uid}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${halo}"/><stop offset="1" stop-color="${halo.replace(/[\d.]+\)$/, '0)')}"/></radialGradient></defs>`;
  out += `<ellipse cx="200" cy="150" rx="190" ry="140" fill="url(#halo${uid})"/>`;
  const c = ctx();
  out += contentSvg(s, mode, c);
  if (s.sparkles === true) out += sparkle(30, 28, 14, mode) + sparkle(360, 34, 11, mode);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 400 300" style="overflow:visible">${out}</svg>`;
  if (opt.anim) return { svg, meta: c.meta };
  return svg.replace(/__A\d+__/g, '').replace(/__O\d+__/g, '1');
}

// Per-frame transform for one animated piece (used by the reel page; same maths in the browser).
const ANIM_JS = `function artFrame(svg, meta, t) {
  return svg.replace(/__([AO])(\\d+)__/g, function (m, k, i) {
    var a = meta[+i], p = Math.max(0, Math.min(1, (t - a.delay) / 0.7));
    var sp = 1 - Math.exp(-6 * p) * Math.cos(9 * p);
    if (k === 'O') return String(Math.min(1, p * 2.2));
    var dx = (1 - Math.min(1, p * 1.4)) * 40;           // enters from the right
    var amp = a.amp == null ? 1 : a.amp;
    var idle = a.kind === 'float' ? Math.sin(t * 1.6 + a.cx * 0.05) * 5 * amp
             : a.kind === 'bob' ? -Math.abs(Math.sin(t * 3.2 + a.cx * 0.11)) * 4 * amp : 0;
    var s = a.kind === 'none' ? Math.min(1, p * 1.6) : Math.max(0.0001, sp);
    return 'translate(' + dx + ' ' + idle + ') translate(' + a.cx + ' ' + a.cy + ') scale(' + s + ') translate(' + (-a.cx) + ' ' + (-a.cy) + ')';
  });
}`;

const artUri = (spec, mode) => 'data:image/svg+xml;base64,' + Buffer.from(artSvg(spec, mode, { w: 1200, h: 900 })).toString('base64');

// Slides and stories: turn `art` into a ready image. Reels: keep it as live markup that moves.
function applyArt(obj, mode, opt = {}) {
  if (!obj || !obj.art || obj.image) return obj;
  if (opt.anim) { const r = artSvg(obj.art, obj.mode || mode, { w: '100%', h: '100%' }, { anim: true }); obj.artSvg = r.svg; obj.artMeta = r.meta; }
  else { obj.image = artUri(obj.art, obj.mode || mode); if (!obj.fit) obj.fit = 'contain'; }
  return obj;
}

module.exports = { artSvg, artUri, applyArt, ANIM_JS, LIB, PAL };
