/* ============================================================
   FUN LEARNING ADVENTURE — Ilustrasi peta (gaya maskot Huhu)
   Tiga objek utama digambar sebagai SVG terpisah:
     FLA.mapArt.gate()    gerbang batu 150 x 150
     FLA.mapArt.bridge()  jembatan tali 220 x 100
     FLA.mapArt.chest()   peti harta karun 140 x 128
   Masing-masing mengembalikan <g> berisi elemen bernama kelas (map-art__*)
   sehingga mudah diedit atau dianimasikan lewat CSS. Posisi diatur oleh games.js.
   ============================================================ */
window.FLA = window.FLA || {};

FLA.mapArt = (function () {
  'use strict';

  const INK = '#1d1850';
  const WOOD_D = '#4a2a16';
  const GOLD_D = '#c98a00';
  const LEAF_D = '#0b7a45';
  const f = (n) => Math.round(n * 10) / 10;

  const grad = (id, a, b, c, v) =>
    '<linearGradient id="' + id + '" x1="' + (v ? 0 : 0.2) + '" y1="0" x2="' + (v ? 0 : 0.85) + '" y2="1">' +
    '<stop offset="0" stop-color="' + a + '"/><stop offset="0.55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></linearGradient>';

  // kilau empat sudut
  const sparkle = (x, y, r, delay) =>
    '<path class="fx-twinkle" style="animation-delay:' + (delay || 0) + 's" d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y +
    'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) +
    'z" fill="#fff" stroke="#ffd23f" stroke-width="1.4" stroke-linejoin="round"/>';

  const star = (cx, cy, ro, ri) => {
    const pts = [];
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? ro : ri;
      const a = (-90 + i * 36) * Math.PI / 180;
      pts.push(f(cx + r * Math.cos(a)) + ' ' + f(cy + r * Math.sin(a)));
    }
    return '<path d="M' + pts.join('L') + 'z" fill="#ffd23f" stroke="#d99f00" stroke-width="2" stroke-linejoin="round"/>';
  };

  const gem = (x, y, r, fill, stroke) =>
    '<g class="map-art__gem"><path d="M' + x + ' ' + (y - r) + 'L' + (x + r * 0.8) + ' ' + y + 'L' + x + ' ' + (y + r) + 'L' + (x - r * 0.8) + ' ' + y +
    'z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M' + (x - r * 0.2) + ' ' + (y - r * 0.5) + 'L' + (x - r * 0.45) + ' ' + y + '" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></g>';

  const coin = (x, y, r) =>
    '<g class="map-art__coin"><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#mc-gold)" stroke="' + GOLD_D + '" stroke-width="2.2"/>' +
    '<circle cx="' + x + '" cy="' + y + '" r="' + f(r * 0.58) + '" fill="none" stroke="#fff" stroke-width="1.6" opacity=".65"/></g>';

  const leaf = (x, y, rx, rot, grd) =>
    '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + f(rx * 0.55) + '" fill="url(#' + (grd || 'mg-leaf') + ')" stroke="' + LEAF_D +
    '" stroke-width="2.2" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>';

  const flower = (x, y, r, petal, stroke) => {
    let s = '<g class="map-art__flower" stroke="' + stroke + '" stroke-width="1.6">';
    for (let i = 0; i < 5; i += 1) {
      const a = (i * 72 - 90) * Math.PI / 180;
      s += '<circle cx="' + f(x + r * 0.95 * Math.cos(a)) + '" cy="' + f(y + r * 0.95 * Math.sin(a)) + '" r="' + f(r * 0.62) + '" fill="' + petal + '"/>';
    }
    return s + '<circle cx="' + x + '" cy="' + y + '" r="' + f(r * 0.5) + '" fill="#ffd23f" stroke="#d99f00"/></g>';
  };

  // garis tebal beroutline (tanaman rambat, tali)
  const thick = (d, color, dark, w) =>
    '<path d="' + d + '" fill="none" stroke="' + dark + '" stroke-width="' + (w + 3.5) + '" stroke-linecap="round"/>' +
    '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"/>';

  /* ------------------------------------------------------------ GERBANG */
  function gate() {
    const cx = 75, cy = 80;
    const defs = '<defs>' + grad('mg-leaf', '#8af0b4', '#2fcf7e', '#17a361') +
      grad('mg-stone', '#e3e8f5', '#b8c2d3', '#8d98b3') + grad('mg-plaque', '#fbfcff', '#dde3f1', '#b9c3d8', true) +
      grad('mg-blue', '#8ec5ff', '#3b86f7', '#1f5fcf') + grad('mg-orange', '#ffc27a', '#ff9a3c', '#e07412') + grad('mg-green', '#7be8ab', '#2fcf7e', '#17a361') +
      '<radialGradient id="mg-glow" cx="0.5" cy="0.7" r="0.7"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.5" stop-color="#ffe27a"/><stop offset="1" stop-color="#ffab3d"/></radialGradient>' +
      '<clipPath id="mg-clip"><path d="M32 146V80A43 43 0 0 1 118 80V146z"/></clipPath></defs>';

    // sinar cahaya di dalam gerbang
    let rays = '';
    [-60, -30, 0, 30, 60].forEach((deg) => {
      const a1 = (deg - 9 - 90) * Math.PI / 180, a2 = (deg + 9 - 90) * Math.PI / 180;
      rays += '<path d="M75 142L' + f(75 + 110 * Math.cos(a1)) + ' ' + f(142 + 110 * Math.sin(a1)) + 'L' + f(75 + 110 * Math.cos(a2)) + ' ' + f(142 + 110 * Math.sin(a2)) + 'z"/>';
    });

    // pelat huruf pada lengkungan
    const plaque = (x, y, rot, ch) =>
      '<g class="map-art__plaque" transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
      '<rect x="-12" y="-12" width="24" height="24" rx="6" fill="url(#mg-plaque)" stroke="#6b7391" stroke-width="2.6"/>' +
      '<g font-family="Baloo 2, sans-serif" font-weight="800" font-size="18" text-anchor="middle">' +
      '<text x="0.8" y="7.6" fill="#fff">' + ch + '</text><text x="0" y="6.6" fill="#7d88a8">' + ch + '</text></g></g>';

    // ukiran spiral
    const swirl = (x, y, rot) =>
      '<path class="map-art__carving" transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')" d="M-6 4c-3-8 8-11 11-4c2 6-5 9-8 5c-2-3 1-5 3-4" fill="none" stroke="#6b7391" stroke-width="2.4" stroke-linecap="round"/>';

    // balok huruf
    const block = (x, y, rot, grd, dark, ch) =>
      '<g class="map-art__block" transform="rotate(' + rot + ' ' + (x + 14) + ' ' + (y + 14) + ')">' +
      '<rect x="' + x + '" y="' + y + '" width="28" height="28" rx="8" fill="url(#' + grd + ')" stroke="' + dark + '" stroke-width="3.2"/>' +
      '<path d="M' + (x + 5) + ' ' + (y + 11) + 'Q' + (x + 6) + ' ' + (y + 6) + ' ' + (x + 12) + ' ' + (y + 5) + '" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".6"/>' +
      '<text x="' + (x + 14) + '" y="' + (y + 22) + '" font-family="Baloo 2, sans-serif" font-weight="800" font-size="21" text-anchor="middle" fill="#fff" stroke="' + dark + '" stroke-width="3.6" paint-order="stroke" stroke-linejoin="round">' + ch + '</text></g>';

    // garis pembagi batu lengkung
    let seams = '';
    [36, 72, 108, 144].forEach((deg) => {
      const a = deg * Math.PI / 180;
      seams += '<path d="M' + f(cx + 43 * Math.cos(a)) + ' ' + f(cy - 43 * Math.sin(a)) + 'L' + f(cx + 73 * Math.cos(a)) + ' ' + f(cy - 73 * Math.sin(a)) + '"/>';
    });

    return '<g class="map-art map-art--gate">' + defs +
      '<ellipse class="map-art__shadow" cx="75" cy="152" rx="86" ry="10" fill="#17469c" opacity=".18"/>' +
      // bagian dalam bercahaya
      '<g class="map-art__portal"><path d="M32 146V80A43 43 0 0 1 118 80V146z" fill="url(#mg-glow)"/>' +
      '<g clip-path="url(#mg-clip)"><g class="fx-rays" fill="#fff" opacity=".35">' + rays + '</g>' +
      '<ellipse cx="75" cy="146" rx="52" ry="14" fill="#fffbe0" opacity=".7"/>' +
      sparkle(52, 96, 5, 0) + sparkle(100, 88, 4, 0.9) + sparkle(78, 62, 6, 1.6) + sparkle(46, 66, 3.4, 0.5) + sparkle(106, 118, 3.6, 1.2) +
      '</g><path d="M32 146V80A43 43 0 0 1 118 80V146" fill="none" stroke="#6b5a9a" stroke-width="3" opacity=".55"/></g>' +
      // balok huruf
      block(60, 82, -4, 'mg-green', '#0b7a45', 'C') + block(42, 112, -8, 'mg-blue', '#17469c', 'A') + block(76, 112, 7, 'mg-orange', '#c9640b', 'B') +
      // tiang
      '<g class="map-art__pillars">' +
      '<rect x="2" y="76" width="30" height="72" rx="6" fill="url(#mg-stone)" stroke="#3a4260" stroke-width="3.8"/>' +
      '<rect x="118" y="76" width="30" height="72" rx="6" fill="url(#mg-stone)" stroke="#3a4260" stroke-width="3.8"/>' +
      '<path d="M17 88c-8 6 8 10 0 16s8 10 0 16M133 88c-8 6 8 10 0 16s8 10 0 16" fill="none" stroke="#6b7391" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M7 82V140M127 82V140" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".5"/>' +
      '<rect x="-5" y="138" width="42" height="12" rx="5" fill="url(#mg-stone)" stroke="#3a4260" stroke-width="3.4"/>' +
      '<rect x="113" y="138" width="42" height="12" rx="5" fill="url(#mg-stone)" stroke="#3a4260" stroke-width="3.4"/></g>' +
      // lengkungan
      '<g class="map-art__arch"><path d="M2 80A73 73 0 0 1 148 80H118A43 43 0 0 0 32 80z" fill="url(#mg-stone)" stroke="#3a4260" stroke-width="3.8" stroke-linejoin="round"/>' +
      '<g stroke="#6b7391" stroke-width="2.8" stroke-linecap="round">' + seams + '</g>' +
      '<path d="M12 74A64 64 0 0 1 44 28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>' +
      plaque(41, 33, -36, 'A') + plaque(75, 22, 0, 'B') + plaque(109, 33, 36, 'C') +
      swirl(18, 60, -70) + swirl(132, 60, 70) + '</g>' +
      // tanaman dan bunga
      '<g class="map-art__vines">' + thick('M6 78C-6 58 8 40 28 36', '#2fcf7e', LEAF_D, 4.2) + thick('M144 78C156 58 142 40 122 36', '#2fcf7e', LEAF_D, 4.2) +
      leaf(4, 66, 7, -40) + leaf(10, 48, 7, -70) + leaf(36, 34, 7, 20) + leaf(146, 66, 7, 40) + leaf(140, 48, 7, 70) + leaf(114, 34, 7, -20) +
      flower(26, 31, 5.4, '#b9a6ff', '#5547b8') + flower(126, 33, 5.4, '#ff8a7a', '#a82a22') + flower(146, 54, 4.2, '#ffe98a', '#d99f00') + '</g></g>';
  }

  /* ------------------------------------------------------------ JEMBATAN */
  function bridge() {
    const defs = '<defs>' + grad('mb-leaf', '#8af0b4', '#2fcf7e', '#17a361') +
      grad('mb-wood', '#e0a468', '#b9793f', '#8a5a33') + grad('mb-wood-l', '#f6cf9c', '#dba062', '#b9793f') +
      grad('mb-rope', '#fff0c8', '#e8c887', '#c79a52', true) + '</defs>';

    const topY = (t) => 58 - 56 * t * (1 - t);
    const botY = (t) => 80 - 52 * t * (1 - t);
    let planks = '', nails = '';
    for (let i = 1; i < 12; i += 1) {
      const t = i / 12;
      planks += '<path d="M' + f(10 + 200 * t) + ' ' + f(topY(t)) + 'L' + f(14 + 192 * t) + ' ' + f(botY(t)) + '"/>';
      if (i % 2 === 0) {
        nails += '<circle cx="' + f(10 + 200 * t + 1) + '" cy="' + f(topY(t) + 6) + '" r="1.5"/>';
      }
    }
    // tali penyangga vertikal
    let balusters = '';
    [0.13, 0.31, 0.5, 0.69, 0.87].forEach((t) => {
      const x = 16 + 188 * t;
      const ropeY = 26 + 36 * t * (1 - t);
      balusters += '<path d="M' + f(x) + ' ' + f(ropeY) + 'V' + f(topY(t) + 2) + '"/>';
    });

    const post = (x, y, w, h, bands) => {
      let s = '<g class="map-art__post"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + f(w * 0.38) + '" fill="url(#mb-wood)" stroke="' + WOOD_D + '" stroke-width="3.4"/>' +
        '<path d="M' + f(x + w * 0.28) + ' ' + (y + 8) + 'V' + (y + h - 6) + '" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>' +
        '<path d="M' + f(x + w * 0.62) + ' ' + (y + 14) + 'v8M' + f(x + w * 0.5) + ' ' + (y + 34) + 'v10" stroke="' + WOOD_D + '" stroke-width="2" stroke-linecap="round" opacity=".5"/>';
      bands.forEach((by) => {
        s += '<path d="M' + x + ' ' + by + 'q' + (w / 2) + ' 8 ' + w + ' 0v7q-' + (w / 2) + ' 8 -' + w + ' 0z" fill="url(#mb-rope)" stroke="#8a5a33" stroke-width="2.4" stroke-linejoin="round"/>';
      });
      return s + '<ellipse cx="' + (x + w / 2) + '" cy="' + y + '" rx="' + (w / 2) + '" ry="' + f(w * 0.24) + '" fill="url(#mb-wood-l)" stroke="' + WOOD_D + '" stroke-width="3"/>' +
        '<ellipse cx="' + (x + w / 2) + '" cy="' + y + '" rx="' + f(w * 0.26) + '" ry="' + f(w * 0.1) + '" fill="none" stroke="#b9793f" stroke-width="1.8"/></g>';
    };

    return '<g class="map-art map-art--bridge">' + defs +
      '<ellipse class="map-art__shadow" cx="110" cy="92" rx="104" ry="7" fill="#17469c" opacity=".2"/>' +
      // tiang belakang dan tali belakang
      post(56, 22, 16, 44, [32]) + post(148, 22, 16, 44, [32]) +
      '<path d="M64 28Q110 44 156 28" fill="none" stroke="' + WOOD_D + '" stroke-width="5.6" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M64 28Q110 44 156 28" fill="none" stroke="url(#mb-rope)" stroke-width="3" stroke-linecap="round"/>' +
      // dek papan
      '<g class="map-art__deck"><path d="M14 80Q110 54 206 80v7Q110 61 14 87z" fill="#6b4423" stroke="' + WOOD_D + '" stroke-width="3.4" stroke-linejoin="round"/>' +
      '<path d="M10 58Q110 30 210 58L206 80Q110 54 14 80z" fill="url(#mb-wood)" stroke="' + WOOD_D + '" stroke-width="3.6" stroke-linejoin="round"/>' +
      '<g stroke="' + WOOD_D + '" stroke-width="2.4" stroke-linecap="round" opacity=".75">' + planks + '</g>' +
      '<path d="M22 70Q110 44 198 70" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".28"/>' +
      '<g fill="#4a2a16" opacity=".8">' + nails + '</g></g>' +
      // tali pegangan dan tali penyangga
      '<g class="map-art__ropes"><g stroke="' + WOOD_D + '" stroke-width="3.4" stroke-linecap="round">' + balusters + '</g><g stroke="#e8c887" stroke-width="1.6" stroke-linecap="round">' + balusters + '</g>' +
      '<path d="M16 28Q110 44 204 28" fill="none" stroke="' + WOOD_D + '" stroke-width="7.4" stroke-linecap="round"/>' +
      '<path d="M16 28Q110 44 204 28" fill="none" stroke="url(#mb-rope)" stroke-width="4.4" stroke-linecap="round"/>' +
      '<path d="M16 28Q110 44 204 28" fill="none" stroke="#a97a3c" stroke-width="1.4" stroke-dasharray="3 5" stroke-linecap="round"/></g>' +
      // tiang depan
      post(2, 18, 24, 76, [34, 50]) + post(194, 18, 24, 76, [34, 50]) +
      // tanaman kecil
      '<g class="map-art__plants">' + thick('M8 92C-2 76 22 68 10 50', '#2fcf7e', LEAF_D, 3.2) + thick('M212 92C222 76 198 68 210 50', '#2fcf7e', LEAF_D, 3.2) +
      leaf(2, 78, 6, -30, 'mb-leaf') + leaf(22, 66, 6, 40, 'mb-leaf') + leaf(218, 78, 6, 30, 'mb-leaf') + leaf(198, 66, 6, -40, 'mb-leaf') +
      '<path d="M-4 96l4-10 3 9 4-11 3 12M214 96l4-10 3 9 4-11 3 12" fill="none" stroke="' + LEAF_D + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      flower(36, 92, 4.2, '#ffe98a', '#d99f00') + flower(186, 94, 4.2, '#ff9fc4', '#b8346f') + '</g>' +
      leaf(96, 98, 7, 25, 'mb-leaf') + leaf(144, 104, 6, -30, 'mb-leaf') + '</g>';
  }

  /* ------------------------------------------------------------ PETI HARTA */
  function chest() {
    const defs = '<defs>' + grad('mc-gold', '#fff0a0', '#ffd23f', '#f0a800') +
      grad('mc-wood', '#b9793f', '#8a5230', '#5a351c') + grad('mc-lid', '#5a351c', '#4a2a16', '#2b1608', true) +
      grad('mc-frame', '#fff0a0', '#ffd23f', '#e8a000') + '</defs>';

    let rays = '';
    for (let i = -3; i <= 3; i += 1) {
      const a1 = (i * 24 - 7 - 90) * Math.PI / 180, a2 = (i * 24 + 7 - 90) * Math.PI / 180;
      rays += '<path d="M70 58L' + f(70 + 88 * Math.cos(a1)) + ' ' + f(58 + 88 * Math.sin(a1)) + 'L' + f(70 + 88 * Math.cos(a2)) + ' ' + f(58 + 88 * Math.sin(a2)) + 'z"/>';
    }
    const frame = (x, y, w, h, r) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="url(#mc-frame)" stroke="' + GOLD_D + '" stroke-width="3"/>';

    return '<g class="map-art map-art--chest">' + defs +
      '<circle class="map-art__glow" cx="70" cy="60" r="86" fill="url(#mapGlow)"/>' +
      '<g class="fx-rays" fill="#fff6b8" opacity=".55">' + rays + '</g>' +
      '<ellipse class="map-art__shadow" cx="70" cy="128" rx="78" ry="9" fill="#17469c" opacity=".2"/>' +
      // tutup terbuka
      '<g class="map-art__lid"><path d="M12 64C8 20 40 2 70 2C100 2 132 20 128 64z" fill="url(#mc-lid)" stroke="' + WOOD_D + '" stroke-width="3.6" stroke-linejoin="round"/>' +
      '<path d="M24 62C22 30 44 15 70 15C96 15 118 30 116 62z" fill="#6b4423" opacity=".55"/>' +
      '<path d="M46 14V62M70 12V62M94 14V62" stroke="#2b1608" stroke-width="2.4" opacity=".5"/>' +
      '<path d="M12 64C8 20 40 2 70 2C100 2 132 20 128 64" fill="none" stroke="' + GOLD_D + '" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M12 64C8 20 40 2 70 2C100 2 132 20 128 64" fill="none" stroke="url(#mc-frame)" stroke-width="5" stroke-linecap="round"/>' +
      gem(13, 46, 4.4, '#ef5b5b', '#a82a22') + gem(26, 20, 4.4, '#6bb0ff', '#17469c') + gem(48, 6, 4.4, '#2fcf7e', '#0b7a45') + gem(70, 2, 4.6, '#ff7eb3', '#b8346f') +
      gem(92, 6, 4.4, '#2fcf7e', '#0b7a45') + gem(114, 20, 4.4, '#6bb0ff', '#17469c') + gem(127, 46, 4.4, '#ef5b5b', '#a82a22') + '</g>' +
      // tumpukan emas
      '<g class="map-art__treasure"><path d="M10 72C20 52 42 40 70 38C98 40 120 52 130 72z" fill="url(#mc-gold)" stroke="' + GOLD_D + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<ellipse cx="70" cy="50" rx="46" ry="13" fill="#fffbe0" opacity=".75"/>' +
      coin(26, 60, 7) + coin(44, 50, 7.4) + coin(66, 44, 8) + coin(90, 49, 7.4) + coin(110, 58, 7) + coin(56, 60, 7) + coin(82, 60, 7) +
      gem(52, 42, 6, '#ff7eb3', '#b8346f') + gem(98, 44, 5.6, '#7ff0ee', '#127d86') + gem(76, 54, 5, '#6bb0ff', '#17469c') + '</g>' +
      // badan peti
      '<g class="map-art__box"><rect x="4" y="62" width="132" height="62" rx="12" fill="url(#mc-wood)" stroke="' + WOOD_D + '" stroke-width="3.8"/>' +
      '<path d="M12 82H128M12 100H128" stroke="#3a2010" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M26 70V118M114 70V118" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".18"/>' +
      frame(4, 62, 132, 13, 6) + frame(4, 111, 132, 13, 6) + frame(4, 62, 18, 62, 8) + frame(118, 62, 18, 62, 8) +
      gem(13, 86, 4.6, '#ef5b5b', '#a82a22') + gem(13, 104, 4.6, '#2fcf7e', '#0b7a45') + gem(127, 86, 4.6, '#6bb0ff', '#17469c') + gem(127, 104, 4.6, '#ff7eb3', '#b8346f') +
      '<rect x="55" y="64" width="30" height="38" rx="10" fill="url(#mc-frame)" stroke="' + GOLD_D + '" stroke-width="3.4"/>' +
      '<circle cx="70" cy="80" r="5" fill="' + WOOD_D + '"/><path d="M70 82v11" stroke="' + WOOD_D + '" stroke-width="4.4" stroke-linecap="round"/>' +
      '<path d="M60 74Q61 69 66 68" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/></g>' +
      // koin tumpah
      coin(136, 112, 6.4) + coin(127, 122, 6.4) + coin(4, 120, 5.6) +
      // kilauan
      '<g class="map-art__sparkles">' + sparkle(28, -4, 6, 0) + sparkle(118, -2, 7, 0.7) + sparkle(6, 38, 5, 1.3) + sparkle(136, 34, 5.4, 0.3) + sparkle(70, 28, 8, 1) + sparkle(100, 30, 4, 1.8) + '</g></g>';
  }

  return { gate: gate, bridge: bridge, chest: chest };
}());
