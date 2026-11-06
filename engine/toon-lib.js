// Creativia Science toon engine (engine 4) — browser side. Loaded into the render page as-is.
// Full animated 2D scenes: rigged rubber-hose characters, layered sets with parallax, a moving camera.
// World units: a set is ~760 wide and 640 tall, floor line at y = 520. The screen shows 360 x 640 world units at zoom 1.
/* global TOON, KRETI */
(function () {
  const OUT = '#2A2230';
  const R = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const EASE = {
    inout: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t * t,
    linear: t => t,
    back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  };
  const f = n => Math.round(n * 100) / 100;

  // value of a numeric property along keyframes [{t, prop, ease}]
  function track(keys, t, prop) {
    const ks = keys.filter(k => k[prop] !== undefined);
    if (!ks.length) return undefined;
    if (t <= ks[0].t) return ks[0][prop];
    for (let i = 0; i < ks.length - 1; i++) {
      const a = ks[i], b = ks[i + 1];
      if (t <= b.t) { const u = (t - a.t) / Math.max(1e-6, b.t - a.t); return lerp(a[prop], b[prop], (EASE[b.ease] || EASE.inout)(u)); }
    }
    return ks[ks.length - 1][prop];
  }
  // last discrete value at or before t
  function step(keys, t, prop, def) {
    let v = def;
    for (const k of keys) if (k.t <= t && k[prop] !== undefined) v = k[prop];
    return v;
  }
  function lastKey(keys, t, prop) {
    let v = null;
    for (const k of keys) if (k.t <= t && k[prop] !== undefined) v = k;
    return v;
  }
  // deterministic noise
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // ---------------------------------------------------------------- character rig
  // Angles are degrees from straight down; positive = towards the facing side. Legs: hip angle + knee bend (backwards).
  // Arms: shoulder angle + elbow bend (forwards). lean/tilt rotate the upper body / head.
  const POSES = {
    stand:    { fh: 3, fk: 2, bh: -3, bk: 2, fs: 10, fe: 14, bs: -8, be: 12, lean: 0, tilt: 0 },
    point:    { fh: 4, fk: 2, bh: -4, bk: 2, fs: 84, fe: 4, bs: -10, be: 16, lean: 4, tilt: -3 },
    surprise: { fh: 16, fk: 26, bh: -16, bk: 26, fs: 96, fe: 42, bs: -96, be: -42, lean: -6, tilt: 6 },
    think:    { fh: 3, fk: 2, bh: -3, bk: 2, fs: 70, fe: 130, bs: -6, be: 30, lean: 2, tilt: 7 },
    shrug:    { fh: 3, fk: 2, bh: -3, bk: 2, fs: 62, fe: -70, bs: -62, be: 70, lean: 0, tilt: -6 },
    carry:    { fh: 3, fk: 2, bh: -3, bk: 2, fs: 52, fe: 52, bs: 40, be: 60, lean: -3, tilt: 0 },
    cheer:    { fh: 4, fk: 4, bh: -4, bk: 4, fs: 165, fe: 10, bs: 170, be: -10, lean: -2, tilt: -4 },
    lookup:   { fh: 3, fk: 2, bh: -3, bk: 2, fs: 14, fe: 18, bs: -10, be: 14, lean: -5, tilt: -14 }
  };
  function walkPose(p, base) {
    const s = Math.sin(p * 2 * Math.PI), c = Math.cos(p * 2 * Math.PI);
    const w = Object.assign({}, POSES.stand, base || {});
    w.fh = 26 * s; w.bh = -26 * s;
    w.fk = 6 + Math.max(0, -c) * 34; w.bk = 6 + Math.max(0, c) * 34;
    if (!base || !base.keepArms) { w.fs = -24 * s; w.bs = 24 * s; w.fe = 18 + 10 * Math.max(0, s); w.be = 18 + 10 * Math.max(0, -s); }
    w.lean = 4; w.bob = Math.abs(Math.sin(p * 2 * Math.PI)) * 4;
    return w;
  }
  function mixPose(a, b, u) {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] || 0, b[k] || 0, u);
    return o;
  }
  const pt = (o, len, ang) => [o[0] + len * Math.sin(ang * R), o[1] + len * Math.cos(ang * R)];
  // rubber-hose limb through the joint: quadratic curve whose control point makes it pass the joint
  function hose(a, j, e, color, w) {
    const c = [2 * j[0] - (a[0] + e[0]) / 2, 2 * j[1] - (a[1] + e[1]) / 2];
    const d = `M${f(a[0])} ${f(a[1])} Q${f(c[0])} ${f(c[1])} ${f(e[0])} ${f(e[1])}`;
    return `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + 4.6}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  function leg(hip, ha, kb, look, shade) {
    const k = pt(hip, 31, ha), ft = pt(k, 31, ha - kb);
    const shoeAng = clamp(ha - kb, -30, 30) * 0.5;
    return hose(hip, k, ft, shade ? look.pantsDark : look.pants, 8)
      + `<g transform="translate(${f(ft[0])} ${f(ft[1])}) rotate(${f(-shoeAng)})"><path d="M-6 -4 Q-7 4 0 4 L13 4 Q17 4 16 -1 Q14 -7 5 -6 Z" fill="${shade ? look.shoeDark : look.shoe}" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/><path d="M1 -3 Q8 -5 12 -2" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.6" stroke-linecap="round"/></g>`;
  }
  function arm(sh, sa, eb, look, shade, hand) {
    const el = pt(sh, 27, sa), h = pt(el, 25, sa + eb);
    return hose(sh, el, h, shade ? look.sleeveDark : look.sleeve, 7.5)
      + `<circle cx="${f(h[0])}" cy="${f(h[1])}" r="6.6" fill="${shade ? look.skinDark : look.skin}" stroke="${OUT}" stroke-width="2.4"/>`
      + (hand ? hand(h) : '');
  }
  function face(look, ex, t, id) {
    const eyes = ex.eyes || 'open', brows = ex.brows || 'neutral', mouth = ex.mouth || 'smile';
    const lx = clamp((ex.lookX || 0), -1, 1) * 3, ly = clamp((ex.lookY || 0), -1, 1) * 2.6;
    const blink = (eyes === 'open' || eyes === 'wide') && ((t + (ex.seed || 0)) % 3.4) < 0.13;
    const E = [[-1, -174], [23, -174]];
    let s = '';
    // eyes
    for (const [x, y] of E) {
      if (blink || eyes === 'closed') s += `<path d="M${x - 5} ${y} Q${x} ${y + 3} ${x + 5} ${y}" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>`;
      else if (eyes === 'happy') s += `<path d="M${x - 5} ${y + 2} Q${x} ${y - 4} ${x + 5} ${y + 2}" fill="none" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/>`;
      else {
        const big = eyes === 'wide';
        if (big) s += `<circle cx="${x}" cy="${y}" r="7.6" fill="#fff" stroke="${OUT}" stroke-width="1.6"/>`;
        const r = big ? 3.6 : 4.3;
        s += `<circle cx="${f(x + lx)}" cy="${f(y + ly)}" r="${r}" fill="${OUT}"/><circle cx="${f(x + lx + 1.4)}" cy="${f(y + ly - 1.5)}" r="1.35" fill="#fff"/>`;
      }
    }
    // glasses (round lenses + bridge, like Kreti's)
    if (look.glasses) {
      s += `<g fill="#fff" fill-opacity=".22" stroke="${OUT}" stroke-width="2.2"><circle cx="-1" cy="-174" r="10.5"/><circle cx="23" cy="-174" r="10.5"/></g>`
        + `<path d="M9.5 -175 Q11 -178 12.5 -175 M-11.5 -176 L-30 -171" fill="none" stroke="${OUT}" stroke-width="2.2" stroke-linecap="round"/>`
        + `<path d="M-6 -180 Q-3 -183 1 -182 M18 -180 Q21 -183 25 -182" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    }
    // brows
    const by = brows === 'up' ? -194 : -189;
    const bd = {
      neutral: [[-8, by, -1, by - 2, 6, by], [16, by, 23, by - 2, 30, by]],
      up: [[-8, by, -1, by - 4, 6, by - 1], [16, by - 1, 23, by - 4, 30, by]],
      worried: [[-8, by, -1, by - 2, 6, by - 4], [16, by - 4, 23, by - 2, 30, by]],
      angry: [[-8, by - 4, -1, by - 1, 6, by + 1], [16, by + 1, 23, by - 1, 30, by - 4]]
    }[brows] || [];
    for (const b of bd) s += `<path d="M${b[0]} ${b[1]} Q${b[2]} ${b[3]} ${b[4]} ${b[5]}" fill="none" stroke="${look.hair}" stroke-width="3.4" stroke-linecap="round"/>`;
    // nose
    s += `<path d="M13 -166 Q18 -161 12 -158" fill="none" stroke="${OUT}" stroke-width="2.2" stroke-linecap="round"/>`;
    // mustache
    if (look.mustache) s += `<path d="M2 -153 Q8 -159 13 -154 Q18 -159 24 -153 Q18 -150 13 -152 Q8 -150 2 -153 Z" fill="${look.hair}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>`;
    // mouth
    const my = look.mustache ? -146 : -149;
    if (mouth === 'smile') s += `<path d="M5 ${my} Q13 ${my + 6} 21 ${my - 1}" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>`;
    else if (mouth === 'flat') s += `<path d="M6 ${my + 1} L20 ${my}" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>`;
    else if (mouth === 'frown') s += `<path d="M6 ${my + 3} Q13 ${my - 3} 20 ${my + 3}" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>`;
    else if (mouth === 'o') s += `<ellipse cx="13" cy="${my + 2}" rx="5" ry="6.5" fill="#4A1E2C" stroke="${OUT}" stroke-width="2.2"/><ellipse cx="13" cy="${my + 5.5}" rx="3" ry="2" fill="#E5677A"/>`;
    else if (mouth === 'grin') s += `<path d="M3 ${my - 2} Q13 ${my - 1} 23 ${my - 3} Q20 ${my + 9} 12 ${my + 9} Q5 ${my + 8} 3 ${my - 2} Z" fill="#4A1E2C" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/><path d="M5 ${my - 1.5} Q13 ${my - 0.5} 21 ${my - 2.5} L20 ${my + 1} Q13 ${my + 2} 6 ${my + 1.5} Z" fill="#fff"/>`;
    // blush
    if (ex.blush !== false) s += `<ellipse cx="-6" cy="-160" rx="5" ry="2.6" fill="#FF8FA3" opacity=".35"/><ellipse cx="29" cy="-161" rx="4" ry="2.4" fill="#FF8FA3" opacity=".35"/>`;
    // sweat drop, sliding down
    if (ex.sweat) {
      const sy = -200 + ((t * 18) % 16);
      s += `<path d="M38 ${f(sy)} Q44 ${f(sy + 9)} 38 ${f(sy + 12)} Q32 ${f(sy + 9)} 38 ${f(sy)} Z" fill="#8FD3FF" stroke="${OUT}" stroke-width="1.8"/><path d="M37 ${f(sy + 5)} Q36 ${f(sy + 8)} 37.5 ${f(sy + 9.5)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    }
    return s;
  }
  function character(look, P, ex, t, id) {
    const hip = [0, -64 - (P.bob || 0)];
    let s = '';
    // shadow is drawn by the caller (stays on the floor while jumping)
    s += arm([-5, -124 - (P.bob || 0)], P.bs, P.be, look, true);
    s += leg([-6, hip[1]], P.bh, P.bk, look, true);
    s += leg([6, hip[1]], P.fh, P.fk, look, false);
    // upper body
    s += `<g transform="rotate(${f(P.lean)} 0 ${f(hip[1])})"><g transform="translate(0 ${f(-(P.bob || 0))})">`;
    // coat
    s += `<path d="M-19 -131 Q-26 -92 -28 -40 Q0 -34 28 -40 Q26 -92 19 -131 Q0 -137 -19 -131 Z" fill="url(#coat${id})" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>`
      + `<path d="M-9 -132 L1 -110 L10 -132 Z" fill="${look.shirt}" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>`
      + (look.tie ? `<path d="M0 -127 L4 -127 L5 -112 L2 -106 L-1 -112 Z" fill="${look.tie}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>` : '')
      + `<path d="M-9 -132 L-3 -104 L1 -110 M10 -132 L5 -104 L1 -110" fill="none" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M1 -106 L1 -42" stroke="${OUT}" stroke-width="1.6" opacity=".55"/><circle cx="4" cy="-92" r="1.8" fill="${OUT}"/><circle cx="4" cy="-74" r="1.8" fill="${OUT}"/>`
      + `<path d="M8 -103 L19 -103 L19 -93 Q13.5 -90 8 -93 Z" fill="none" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/><path d="M11 -110 L11 -101" stroke="${look.pen}" stroke-width="2.6" stroke-linecap="round"/>`
      + (look.badge ? `<g transform="translate(-17 -104) rotate(-4)"><rect x="0" y="0" width="13" height="9" rx="2" fill="#fff" stroke="${OUT}" stroke-width="1.5"/>${KRETI.mark ? `<g transform="translate(2.3 1) scale(0.033)">${KRETI.mark}</g>` : ''}</g>` : '');
    // neck + head
    s += `<g transform="rotate(${f(P.tilt)} 2 -134)">`
      + `<path d="M-6 -140 L-5 -130 L8 -130 L9 -140 Z" fill="${look.skinDark}" stroke="${OUT}" stroke-width="2.2"/>`
      + `<ellipse cx="-32" cy="-168" rx="6.5" ry="8.5" fill="${look.skinDark}" stroke="${OUT}" stroke-width="2.4"/>`
      + `<circle cx="2" cy="-172" r="37" fill="url(#skin${id})" stroke="${OUT}" stroke-width="2.6"/>`
      + `<path d="M-30 -158 Q-20 -138 6 -136 Q-28 -140 -33 -170 Z" fill="#000" opacity=".05"/>`
      + (look.hairStyle === 'bun'
        ? `<circle cx="-14" cy="-210" r="11" fill="${look.hair}" stroke="${OUT}" stroke-width="2.4"/><path d="M-34 -168 Q-40 -206 -6 -209 Q22 -210 36 -186 Q14 -198 -6 -196 Q-24 -194 -26 -172 Z" fill="${look.hair}" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>`
        : `<path d="M-35 -162 Q-41 -190 -24 -200 Q-26 -190 -22 -184 Q-26 -174 -30 -160 Z" fill="${look.hair}" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-3 -208 Q0 -218 7 -214 Q5 -210 9 -208" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>`)
      + face(look, ex, t, id) + `</g>`;
    s += `</g></g>`;
    s += arm([5, -124 - (P.bob || 0)], P.fs, P.fe, look, false, look.hand);
    return s;
  }
  function charDefs(look, id) {
    return `<radialGradient id="skin${id}" cx="0.62" cy="0.36" r="0.75"><stop offset="0" stop-color="${look.skinLight}"/><stop offset=".7" stop-color="${look.skin}"/><stop offset="1" stop-color="${look.skinDark}"/></radialGradient>`
      + `<linearGradient id="coat${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${look.coatDark}"/><stop offset=".45" stop-color="${look.coat}"/><stop offset="1" stop-color="${look.coat}"/></linearGradient>`;
  }
  const LOOKS = {
    scientist: { skin: '#F7EDE0', skinLight: '#FFFBF5', skinDark: '#E4D3BF', hair: '#3B2A22', coat: '#FFFFFF', coatDark: '#DCE3EA',
      shirt: '#8A4FE0', tie: '#B91097', pants: '#3D3A5C', pantsDark: '#2E2B47', shoe: '#2A2230', shoeDark: '#1E1826',
      sleeve: '#FFFFFF', sleeveDark: '#D5DCE4', pen: '#912EE8', glasses: true, mustache: false, badge: true },
    assistant: { skin: '#F2DFCC', skinLight: '#FFF6EC', skinDark: '#DCC3AB', hair: '#5A3624', coat: '#E9F6FF', coatDark: '#C8DCEA',
      shirt: '#2EC4B6', tie: null, pants: '#5A4A6E', pantsDark: '#463A57', shoe: '#7A3B2E', shoeDark: '#5E2C22',
      sleeve: '#E9F6FF', sleeveDark: '#C3D6E4', pen: '#FF7A59', glasses: false, mustache: false, badge: true, hairStyle: 'bun' },
    professor: { skin: '#F5E6D6', skinLight: '#FFF8EF', skinDark: '#DFCBB5', hair: '#8E8A96', coat: '#FFFFFF', coatDark: '#DCE3EA',
      shirt: '#3E7BFA', tie: '#E0B43A', pants: '#4A4458', pantsDark: '#38334A', shoe: '#2A2230', shoeDark: '#1E1826',
      sleeve: '#FFFFFF', sleeveDark: '#D5DCE4', pen: '#E0B43A', glasses: true, mustache: true, badge: false }
  };

  // ---------------------------------------------------------------- props
  function jar(x, y, t, glow, id) {
    // y = base of the jar (bench top)
    const w = 78, h = 104, lt = y - h;
    let bub = '';
    for (let i = 0; i < 9; i++) {
      const sp = 14 + hash(i) * 16, ph = (t * sp / 60 + hash(i + 9)) % 1;
      const bx = x - 26 + hash(i + 3) * 52 + Math.sin(t * 3 + i) * 2.5, by = y - 8 - ph * (h * 0.7);
      bub += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(1.6 + hash(i + 5) * 2.4)}" fill="#fff" fill-opacity="${f(0.55 * (1 - ph))}" stroke="#fff" stroke-opacity="${f(0.7 * (1 - ph))}" stroke-width=".8"/>`;
    }
    const orbR = 15 + Math.sin(t * 4) * 1.2 + glow * 4;
    let rays = '';
    if (glow > 0.05) for (let i = 0; i < 10; i++) {
      const a = i * 36 + t * 30, r1 = orbR + 6, r2 = orbR + 14 + glow * 22 + Math.sin(t * 7 + i) * 4;
      rays += `<path d="M${f(x + r1 * Math.cos(a * R))} ${f(y - 58 + r1 * Math.sin(a * R))} L${f(x + r2 * Math.cos(a * R))} ${f(y - 58 + r2 * Math.sin(a * R))}" stroke="#FFF7B0" stroke-width="2.2" stroke-linecap="round" opacity="${f(glow * 0.8)}"/>`;
    }
    return `<g>`
      + `<ellipse cx="${x}" cy="${y + 2}" rx="46" ry="7" fill="#000" opacity=".16"/>`
      + `<circle cx="${x}" cy="${y - 46}" r="${f(80 + glow * 70)}" fill="url(#glow${id})" opacity="${f(0.35 + glow * 0.65)}"/>`
      + `<path d="M${x - w / 2 + 4} ${lt + 12} Q${x - w / 2} ${lt + 18} ${x - w / 2} ${lt + 30} L${x - w / 2} ${y - 10} Q${x - w / 2} ${y} ${x - w / 2 + 12} ${y} L${x + w / 2 - 12} ${y} Q${x + w / 2} ${y} ${x + w / 2} ${y - 10} L${x + w / 2} ${lt + 30} Q${x + w / 2} ${lt + 18} ${x + w / 2 - 4} ${lt + 12} Z" fill="#E8FBFF" fill-opacity=".28" stroke="${OUT}" stroke-width="2.6"/>`
      + `<path d="M${x - w / 2 + 3} ${y - 82} Q${x} ${y - 76 + Math.sin(t * 2) * 2} ${x + w / 2 - 3} ${y - 82} L${x + w / 2 - 3} ${y - 10} Q${x + w / 2 - 3} ${y - 3} ${x + w / 2 - 13} ${y - 3} L${x - w / 2 + 13} ${y - 3} Q${x - w / 2 + 3} ${y - 3} ${x - w / 2 + 3} ${y - 10} Z" fill="url(#liq${id})" opacity=".92"/>`
      + `<circle cx="${x}" cy="${y - 58}" r="${f(orbR + 8)}" fill="#FFF6B8" opacity="${f(0.25 + glow * 0.4)}"/>`
      + `<circle cx="${x}" cy="${y - 58}" r="${f(orbR)}" fill="url(#orb${id})" stroke="${OUT}" stroke-width="2"/>`
      + `<path d="M${x - 6} ${y - 66} Q${x - 2} ${y - 70} ${x + 3} ${y - 68}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>`
      + rays + bub
      + `<path d="M${x - w / 2 + 9} ${lt + 34} L${x - w / 2 + 9} ${y - 18}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>`
      + `<path d="M${x - w / 2 + 18} ${lt + 30} L${x - w / 2 + 18} ${lt + 44}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`
      // label sticker with Kreti
      + `<g transform="translate(${x + 6} ${y - 17}) rotate(-6)"><rect x="-16" y="-11" width="32" height="22" rx="5" fill="#FFFDF7" stroke="${OUT}" stroke-width="1.8"/><g transform="translate(-9.5 -9.5) scale(0.079)">${KRETI.jar}</g></g>`
      // lid
      + `<rect x="${x - w / 2 + 2}" y="${lt}" width="${w - 4}" height="15" rx="5" fill="url(#lid${id})" stroke="${OUT}" stroke-width="2.4"/>`
      + `<path d="M${x - w / 2 + 10} ${lt + 4} L${x + w / 2 - 10} ${lt + 4}" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`
      + `</g>`;
  }
  function flask(x, y, s, color, t, kind, seed) {
    // round-bottom (kind 0) or conical (kind 1) flask standing at y
    const g = `<g transform="translate(${x} ${y}) scale(${s})">`;
    let body, liq;
    if (kind === 1) {
      body = 'M-6 -46 L-6 -30 L-20 -4 Q-22 0 -17 0 L17 0 Q22 0 20 -4 L6 -30 L6 -46 Z';
      liq = 'M-13 -14 L13 -14 L19 -3 Q20 0 16 0 L-16 0 Q-20 0 -19 -3 Z';
    } else {
      body = 'M-5 -46 L-5 -28 A17 17 0 1 0 5 -28 L5 -46 Z';
      liq = 'M-16 -14 A16 16 0 0 0 16 -14 Q0 -10 -16 -14 Z';
    }
    let b = '';
    for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + hash(seed * 7 + i)) % 1; b += `<circle cx="${f(-6 + i * 6)}" cy="${f(-6 - ph * 28)}" r="${f(1.4 + hash(i + seed) * 1.2)}" fill="#fff" opacity="${f(0.8 * (1 - ph))}"/>`; }
    return g + `<path d="${body}" fill="#F2FBFF" fill-opacity=".55" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/><path d="${liq}" fill="${color}"/>${b}<path d="M-8 -48 L8 -48" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/><path d="M-11 -12 Q-12 -5 -8 -2" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/></g>`;
  }
  function microscope(x, y) {
    return `<g transform="translate(${x} ${y})">`
      + `<ellipse cx="2" cy="1" rx="30" ry="5" fill="#000" opacity=".14"/>`
      + `<rect x="-26" y="-10" width="52" height="10" rx="4" fill="#5B5670" stroke="${OUT}" stroke-width="2.2"/>`
      + `<path d="M8 -10 Q20 -36 4 -64 L-6 -58 Q8 -36 -2 -10 Z" fill="#7A6FA0" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>`
      + `<rect x="-22" y="-32" width="30" height="5" rx="2" fill="#B9B4CC" stroke="${OUT}" stroke-width="1.8"/>`
      + `<g transform="rotate(-24 -6 -62)"><rect x="-14" y="-92" width="14" height="40" rx="4" fill="#ECEAF4" stroke="${OUT}" stroke-width="2.2"/><rect x="-16" y="-98" width="18" height="8" rx="3" fill="#5B5670" stroke="${OUT}" stroke-width="2"/><rect x="-12" y="-54" width="10" height="10" rx="2" fill="#5B5670" stroke="${OUT}" stroke-width="1.8"/></g>`
      + `<circle cx="10" cy="-40" r="5" fill="#5B5670" stroke="${OUT}" stroke-width="1.8"/>`
      + `<g transform="translate(-1 -50) rotate(14)"><circle r="7.5" fill="#FFFDF7" stroke="${OUT}" stroke-width="1.5"/><g transform="translate(-5.6 -5.6) scale(0.047)">${KRETI.mark}</g></g>`
      + `</g>`;
  }
  function clock(x, y, t) {
    const sec = Math.floor(t) * 6 + 140, min = 300 + t * 0.1;
    const hand = (a, l, w, c) => `<path d="M${x} ${y} L${f(x + l * Math.sin(a * R))} ${f(y - l * Math.cos(a * R))}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    let ticks = '';
    for (let i = 0; i < 12; i++) { const a = i * 30; ticks += `<path d="M${f(x + 20 * Math.sin(a * R))} ${f(y - 20 * Math.cos(a * R))} L${f(x + 24 * Math.sin(a * R))} ${f(y - 24 * Math.cos(a * R))}" stroke="${OUT}" stroke-width="${i % 3 ? 1.4 : 2.4}" stroke-linecap="round"/>`; }
    return `<circle cx="${x + 2}" cy="${y + 3}" r="31" fill="#000" opacity=".08"/><circle cx="${x}" cy="${y}" r="30" fill="#FFFDF7" stroke="${OUT}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="26" fill="none" stroke="#912EE8" stroke-width="1.6" opacity=".5"/>${ticks}${hand(min * 0.0833 + 290, 13, 3.2, OUT)}${hand(min, 19, 2.4, OUT)}${hand(sec, 21, 1.4, '#E0336E')}<circle cx="${x}" cy="${y}" r="2.6" fill="${OUT}"/>`;
  }
  function plant(x, y, s, t) {
    let leaves = '';
    const L = [[-30, -70, -18], [-12, -92, -4], [8, -88, 10], [26, -66, 22], [-40, -44, -30], [38, -42, 32], [0, -64, 0]];
    L.forEach(([lx, ly, a], i) => {
      const sw = Math.sin(t * 1.3 + i) * 2.2;
      leaves += `<g transform="rotate(${f(a + sw)} 0 -30)"><path d="M0 -30 Q${lx * 0.5 - 8} ${ly * 0.6} ${lx} ${ly} Q${lx * 0.5 + 10} ${ly * 0.55} 0 -30 Z" fill="${i % 2 ? '#3FA36B' : '#58BE7E'}" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 -30 Q${lx * 0.4} ${ly * 0.62} ${lx * 0.9} ${ly * 0.92}" fill="none" stroke="#2D7A50" stroke-width="1.4" opacity=".7"/></g>`;
    });
    return `<g transform="translate(${x} ${y}) scale(${s})">${leaves}<path d="M-26 -34 L26 -34 L20 0 L-20 0 Z" fill="#D9774B" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/><rect x="-30" y="-40" width="60" height="10" rx="3" fill="#E58B5E" stroke="${OUT}" stroke-width="2.6"/><path d="M-18 -26 L-15 -6" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/></g>`;
  }

  // ---------------------------------------------------------------- sets
  const SETS = {};
  SETS.lab = {
    width: 780,
    defs: id => `<linearGradient id="wall${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4F3EF"/><stop offset="1" stop-color="#C6E3DC"/></linearGradient>`
      + `<linearGradient id="wain${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9D2C8"/><stop offset="1" stop-color="#93C3B8"/></linearGradient>`
      + `<linearGradient id="floor${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4C59B"/><stop offset="1" stop-color="#C99D6E"/></linearGradient>`
      + `<linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7EC8FF"/><stop offset="1" stop-color="#DDF3FF"/></linearGradient>`
      + `<linearGradient id="beam${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#FFF4C4" stop-opacity=".55"/><stop offset="1" stop-color="#FFF4C4" stop-opacity="0"/></linearGradient>`
      + `<linearGradient id="bench${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7B5FB8"/><stop offset="1" stop-color="#5E4596"/></linearGradient>`
      + `<linearGradient id="top${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F4FB"/><stop offset="1" stop-color="#D9D2E8"/></linearGradient>`
      + `<radialGradient id="glow${id}"><stop offset="0" stop-color="#FFF3A6" stop-opacity=".9"/><stop offset=".45" stop-color="#9BFFD9" stop-opacity=".35"/><stop offset="1" stop-color="#9BFFD9" stop-opacity="0"/></radialGradient>`
      + `<linearGradient id="liq${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DF5D0"/><stop offset="1" stop-color="#1FB6A0"/></linearGradient>`
      + `<radialGradient id="orb${id}" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="#FFF29A"/><stop offset="1" stop-color="#FFB547"/></radialGradient>`
      + `<linearGradient id="lid${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9C3D8"/><stop offset="1" stop-color="#8E86A6"/></linearGradient>`
      + `<linearGradient id="poster${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A855F7"/><stop offset=".6" stop-color="#912EE8"/><stop offset="1" stop-color="#B91097"/></linearGradient>`
      + `<filter id="fgblur${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>`,
    // depth 0.78: back wall, window, poster, chart, clock, shelves
    far: (t, id) => {
      let s = `<rect x="-200" y="-100" width="1200" height="640" fill="url(#wall${id})"/>`
        + `<rect x="-200" y="372" width="1200" height="150" fill="url(#wain${id})"/><path d="M-200 372 L1000 372" stroke="${OUT}" stroke-width="2.4"/><path d="M-200 380 L1000 380" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
      for (let x = -200; x < 1000; x += 40) s += `<path d="M${x} 382 L${x} 520" stroke="#7FB3A7" stroke-width="1.4" opacity=".6"/>`;
      // window with sky, drifting clouds and the city
      s += `<rect x="36" y="96" width="210" height="236" rx="10" fill="url(#sky${id})"/>`;
      const cl = (cx, cy, k) => `<g transform="translate(${f(cx)} ${cy}) scale(${k})"><path d="M-30 8 Q-34 -6 -18 -8 Q-14 -24 4 -20 Q14 -32 28 -18 Q42 -16 38 0 Q40 10 28 10 L-22 10 Q-32 12 -30 8 Z" fill="#fff" opacity=".95"/></g>`;
      s += `<clipPath id="win${id}"><rect x="36" y="96" width="210" height="236" rx="10"/></clipPath><g clip-path="url(#win${id})">`
        + cl(60 + ((t * 5) % 260), 140, 0.9) + cl(-80 + ((t * 5 + 160) % 260), 190, 0.6)
        + `<path d="M36 332 L36 268 L60 268 L60 248 L84 248 L84 284 L104 284 L104 230 L132 230 L132 262 L150 262 L150 214 L176 214 L176 270 L196 270 L196 246 L222 246 L222 276 L246 276 L246 332 Z" fill="#A8C9E0"/>`
        + `<path d="M36 332 L36 294 L70 294 L70 280 L98 280 L98 300 L130 300 L130 286 L166 286 L166 304 L200 304 L200 290 L246 290 L246 332 Z" fill="#8FB6D3"/>`;
      for (let i = 0; i < 14; i++) s += `<rect x="${f(64 + hash(i) * 170)}" y="${f(236 + hash(i + 4) * 60)}" width="4" height="5" fill="#FFF3B0" opacity=".7"/>`;
      s += `</g><rect x="36" y="96" width="210" height="236" rx="10" fill="none" stroke="#fff" stroke-width="10"/><rect x="31" y="91" width="220" height="246" rx="13" fill="none" stroke="${OUT}" stroke-width="2.6"/>`
        + `<path d="M141 96 L141 332 M36 214 L246 214" stroke="#fff" stroke-width="7"/><path d="M141 96 L141 332 M36 214 L246 214" stroke="${OUT}" stroke-width="1.2" opacity=".35"/>`
        + `<rect x="20" y="334" width="242" height="12" rx="4" fill="#fff" stroke="${OUT}" stroke-width="2.4"/>`
        + plant(80, 334, 0.5, t) + flask(212, 334, 0.55, '#FF8FB1', t, 1, 4);
      // Kreti poster
      s += `<g transform="rotate(2 345 185)"><rect x="288" y="104" width="114" height="156" rx="6" fill="#8A5A3C" stroke="${OUT}" stroke-width="2.6"/><rect x="296" y="112" width="98" height="140" rx="3" fill="url(#poster${id})"/>`
        + `<circle cx="345" cy="168" r="40" fill="#fff" opacity=".12"/><g transform="translate(305 128)">${KRETI.poster}</g>`
        + `<text x="345" y="240" text-anchor="middle" font-family="Rubik" font-weight="800" font-size="13" fill="#fff" direction="rtl">ابقَ فضولياً!</text>`
        + `<circle cx="345" cy="108" r="4" fill="#E0336E" stroke="${OUT}" stroke-width="1.6"/></g>`;
      // periodic-table chart
      s += `<g transform="rotate(-1.5 495 168)"><rect x="428" y="118" width="134" height="98" rx="4" fill="#FFFDF7" stroke="${OUT}" stroke-width="2.4"/>`;
      const PC = ['#FF8FA3', '#FFD166', '#7DE2D1', '#9FB7FF', '#C49BFF'];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
        if (r < 2 && c > 0 && c < 7) continue;
        s += `<rect x="${436 + c * 15}" y="${128 + r * 15}" width="12" height="12" rx="2" fill="${PC[(r + c * 3) % 5]}" stroke="${OUT}" stroke-width=".9"/>`;
      }
      s += `<path d="M436 204 L520 204" stroke="${OUT}" stroke-width="2" opacity=".35" stroke-linecap="round"/></g>`;
      s += clock(630, 150, t);
      // shelves
      for (const sy of [262, 340]) s += `<rect x="584" y="${sy}" width="170" height="10" rx="3" fill="#B98A5E" stroke="${OUT}" stroke-width="2.4"/><path d="M600 ${sy + 10} L606 ${sy + 24} M738 ${sy + 10} L732 ${sy + 24}" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>`;
      s += flask(606, 262, 0.62, '#7DE2D1', t, 0, 1) + flask(640, 262, 0.5, '#FFD166', t, 1, 2) + flask(700, 262, 0.7, '#C49BFF', t, 0, 3);
      const books = [[664, 22, '#E0336E'], [676, 26, '#3E7BFA'], [690, 20, '#FFD166'], [702, 24, '#2EC4B6']];
      for (const [bx, bh, bc] of books) s += `<rect x="${bx + 60}" y="${340 - bh * 1.6}" width="11" height="${bh * 1.6}" rx="2" fill="${bc}" stroke="${OUT}" stroke-width="1.8"/>`;
      s += flask(612, 340, 0.6, '#9FB7FF', t, 1, 5) + flask(650, 340, 0.55, '#FF8FA3', t, 0, 6);
      // light beam from the window
      s += `<path d="M36 330 L246 330 L420 640 L110 640 Z" fill="url(#beam${id})"/><path d="M36 96 L246 96 L420 640 L-60 640 Z" fill="#FFF8D6" opacity=".07"/>`;
      return s;
    },
    // depth 1: floor, bench and the action props
    mid: (t, id, st) => {
      let s = `<rect x="-200" y="520" width="1200" height="200" fill="url(#floor${id})"/><path d="M-200 520 L1000 520" stroke="${OUT}" stroke-width="3"/>`;
      for (let i = 0; i < 5; i++) { const y = 540 + i * 26 + i * i * 2; s += `<path d="M-200 ${y} L1000 ${y}" stroke="#A87B4E" stroke-width="1.4" opacity=".5"/>`; for (let x = -200 + (i % 2) * 70; x < 1000; x += 140) s += `<path d="M${x} ${y} L${x - 4} ${y + 26 + i * 2}" stroke="#A87B4E" stroke-width="1.2" opacity=".4"/>`; }
      // sunlight patch on the floor
      s += `<path d="M120 540 L360 540 L430 640 L150 640 Z" fill="#FFF2C2" opacity=".28"/>`;
      // bench
      s += `<ellipse cx="560" cy="522" rx="210" ry="10" fill="#000" opacity=".12"/>`
        + `<rect x="372" y="412" width="372" height="108" rx="6" fill="url(#bench${id})" stroke="${OUT}" stroke-width="2.6"/>`;
      for (const dx of [372, 496, 620]) s += `<rect x="${dx + 10}" y="424" width="104" height="38" rx="5" fill="#8E72C9" stroke="${OUT}" stroke-width="2"/><rect x="${dx + 48}" y="438" width="28" height="7" rx="3.5" fill="#E9E4F4" stroke="${OUT}" stroke-width="1.6"/><rect x="${dx + 10}" y="470" width="104" height="40" rx="5" fill="#8E72C9" stroke="${OUT}" stroke-width="2"/><rect x="${dx + 48}" y="484" width="28" height="7" rx="3.5" fill="#E9E4F4" stroke="${OUT}" stroke-width="1.6"/>`;
      s += `<rect x="362" y="398" width="392" height="16" rx="5" fill="url(#top${id})" stroke="${OUT}" stroke-width="2.6"/>`;
      s += microscope(424, 398) + flask(492, 398, 0.85, '#FF8FB1', t, 1, 7) + flask(690, 398, 0.95, '#9FB7FF', t, 0, 8) + flask(728, 398, 0.7, '#FFD166', t, 1, 9);
      s += jar(600, 398, t, st.glow || 0, id);
      // notebook + pencil
      s += `<g transform="translate(646 396) rotate(-6)"><rect x="-16" y="-4" width="34" height="6" rx="1.5" fill="#FFFDF7" stroke="${OUT}" stroke-width="1.8"/><rect x="-14" y="-8" width="30" height="5" rx="1.5" fill="#FFD166" stroke="${OUT}" stroke-width="1.6"/></g>`;
      return s;
    },
    // depth 1.3: blurred foreground framing
    fg: (t, id) => `<g filter="url(#fgblur${id})">${plant(18, 668, 1.5, t)}${flask(800, 690, 2.6, '#C49BFF', t, 0, 11)}</g>`,
    // floating dust in the sunbeam (depth 0.9)
    air: (t) => {
      let s = '';
      for (let i = 0; i < 22; i++) {
        const x = 60 + hash(i) * 320 + Math.sin(t * 0.4 + i) * 12, y = 340 + ((hash(i + 2) * 300 - t * (4 + hash(i) * 6)) % 300 + 300) % 300;
        s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.8 + hash(i + 7) * 1.4)}" fill="#fff" opacity="${f(0.3 + 0.4 * Math.abs(Math.sin(t + i)))}"/>`;
      }
      return s;
    }
  };

  // ---------------------------------------------------------------- frame
  const S = TOON;
  function cameraAt(t) {
    const k = S.camera;
    const c = { x: track(k, t, 'x'), y: track(k, t, 'y'), z: track(k, t, 'z') };
    // camera shake: [{t0, t1, amp}]
    for (const sh of S.shake || []) if (t >= sh.t0 && t <= sh.t1) {
      const u = (t - sh.t0) / (sh.t1 - sh.t0), a = sh.amp * (1 - u);
      c.x += Math.sin(t * 61) * a; c.y += Math.cos(t * 47) * a;
    }
    return c;
  }
  function layer(c, d, inner) {
    const ox = 360 + (c.x - 360) * d, oy = 320 + (c.y - 320) * d;
    return `<g transform="translate(180 320) scale(${f(c.z * (1 + (d - 1) * 0.25))}) translate(${f(-ox)} ${f(-oy)})">${inner}</g>`;
  }
  function actorAt(a, t) {
    const k = a.keys;
    const x = track(k, t, 'x'), y = track(k, t, 'y') || 520;
    const face = step(k, t, 'face', 1);
    const sc = track(k, t, 's') || 1;
    // pose with blending: each key may set pose; blend 0.28s from previous pose
    const pk = k.filter(q => q.pose);
    let cur = pk[0], prev = null;
    for (const q of pk) if (q.t <= t) { prev = cur === q ? prev : cur; cur = q; }
    const poseOf = q => q.pose === 'walk' ? walkPose((x / (a.stride || 70)) % 1) : POSES[q.pose];
    let P = poseOf(cur);
    const bl = cur.blend !== undefined ? cur.blend : 0.28;
    if (prev && prev !== cur && t - cur.t < bl) P = mixPose(poseOf(prev), P, EASE.inout((t - cur.t) / bl));
    // jumps: [{t0, t1, h}]
    let lift = 0, squash = 1;
    for (const j of a.jumps || []) {
      if (t >= j.t0 && t <= j.t1) { const u = (t - j.t0) / (j.t1 - j.t0); lift = 4 * j.h * u * (1 - u); squash = 1 + 0.06 * Math.sin(u * Math.PI); }
      else if (t > j.t1 && t < j.t1 + 0.16) { const u = (t - j.t1) / 0.16; squash = 1 - 0.07 * Math.sin(u * Math.PI); }
    }
    // tremble
    let tx = 0;
    for (const tr of a.tremble || []) if (t >= tr.t0 && t <= tr.t1) tx = Math.sin(t * 70) * (tr.amp || 1.2);
    // expression = merge of all expr keys up to t
    const ex = { seed: a.seed || 0 };
    for (const q of k) if (q.t <= t && q.expr) Object.assign(ex, q.expr);
    return { x: x + tx, y, face, sc, P, lift, squash, ex };
  }
  function drawActor(a, st, t) {
    const look = Object.assign({}, LOOKS[a.look] || LOOKS.scientist, a.lookOverride || {});
    const sh = `<ellipse cx="${f(st.x)}" cy="${f(st.y + 1)}" rx="${f(30 * st.sc * (1 - st.lift / 140))}" ry="${f(6 * st.sc)}" fill="#000" opacity="${f(0.2 * (1 - st.lift / 120))}"/>`;
    return sh + `<g transform="translate(${f(st.x)} ${f(st.y - st.lift)}) scale(${f(st.face * st.sc / st.squash)} ${f(st.sc * st.squash)})">${character(look, st.P, st.ex, t, a.id)}</g>`;
  }
  // text pops (sound words / labels) in world space: [{t0, t1, x, y, text, color}]
  function pops(t) {
    let s = '';
    for (const p of S.pops || []) if (t >= p.t0 && t <= p.t1) {
      const u = (t - p.t0) / (p.t1 - p.t0), sc = u < 0.2 ? EASE.back(u / 0.2) : 1, op = u > 0.8 ? (1 - u) / 0.2 : 1;
      s += `<g transform="translate(${p.x} ${p.y}) rotate(${p.rot || -8}) scale(${f(sc)})" opacity="${f(op)}"><text text-anchor="middle" font-family="Rubik" font-weight="900" font-size="${p.size || 26}" fill="${p.color || '#FFD166'}" stroke="${OUT}" stroke-width="5" paint-order="stroke" direction="rtl">${p.text}</text></g>`;
    }
    return s;
  }
  // sparkle bursts in world space: [{t0, x, y}]
  function bursts(t) {
    let s = '';
    for (const b of S.bursts || []) {
      const u = (t - b.t0) / 0.9;
      if (u < 0 || u > 1) continue;
      for (let i = 0; i < 12; i++) {
        const a = i * 30 + hash(i) * 20, r = 20 + EASE.out(u) * (50 + hash(i + 3) * 40), k = (1 - u) * (0.6 + hash(i) * 0.6);
        const x = b.x + r * Math.cos(a * R), y = b.y + r * Math.sin(a * R);
        s += `<path transform="translate(${f(x)} ${f(y)}) scale(${f(k)})" d="M0 -8 C1 -2 2 -1 8 0 C2 1 1 2 0 8 C-1 2 -2 1 -8 0 C-2 -1 -1 -2 0 -8 Z" fill="${i % 3 ? '#FFF3A6' : '#FFFFFF'}"/>`;
      }
    }
    return s;
  }
  // screen-space captions: word-by-word, [{t0, t1, text}] (words appear evenly)
  function captions(t) {
    for (const c of S.captions || []) if (t >= c.t0 && t <= c.t1) {
      const w = c.text.split(' '), n = Math.min(w.length, Math.floor((t - c.t0) / ((c.t1 - c.t0) * 0.75) * w.length) + 1);
      return `<div style="position:absolute;left:20px;right:20px;top:64px;display:flex;justify-content:center"><div style="max-width:300px;padding:10px 18px;border-radius:22px;background:rgba(255,255,255,.55);border:1.5px solid rgba(255,255,255,.8);backdrop-filter:blur(10px);box-shadow:0 10px 30px rgba(30,16,40,.18);text-align:center;direction:rtl;font-family:Rubik;font-weight:900;font-size:22px;line-height:1.35;color:${OUT}">${w.slice(0, n).join(' ')}</div></div>`;
    }
    return '';
  }
  window.drawFrame = function (t) {
    const set = SETS[S.set];
    const c = cameraAt(t);
    const st = { glow: track(S.glow || [{ t: 0, v: 0 }], t, 'v') || 0 };
    const id = 'S';
    const actors = (S.actors || []).map(a => ({ a, s: actorAt(a, t) }));
    let defs = set.defs(id);
    for (const a of S.actors || []) defs += charDefs(Object.assign({}, LOOKS[a.look] || LOOKS.scientist, a.lookOverride || {}), a.id);
    let world = layer(c, 0.78, set.far(t, id)) + layer(c, 0.9, set.air(t));
    let mid = set.mid(t, id, st);
    for (const { a, s } of actors) mid += drawActor(a, s, t);
    mid += bursts(t) + pops(t);
    world += layer(c, 1, mid) + layer(c, 1.3, set.fg(t, id));
    const fl = S.flash ? track(S.flash, t, 'v') || 0 : 0;
    document.getElementById('stage').innerHTML =
      `<svg width="360" height="640" viewBox="0 0 360 640" style="position:absolute;inset:0"><defs>${defs}<radialGradient id="vig" cx=".5" cy=".46" r=".75"><stop offset=".55" stop-color="#1A1024" stop-opacity="0"/><stop offset="1" stop-color="#1A1024" stop-opacity=".42"/></radialGradient></defs>`
      + world
      + `<rect width="360" height="640" fill="#FFB86B" opacity=".06" style="mix-blend-mode:soft-light"/><rect width="360" height="640" fill="url(#vig)"/>`
      + (fl > 0 ? `<rect width="360" height="640" fill="#FFFBE0" opacity="${f(fl)}"/>` : '')
      + `</svg>` + captions(t);
  };
})();
