#!/usr/bin/env python3
"""Pembuat aset ilustrasi tema "Mengenal Huruf" (SVG orisinal).

Menghasilkan berkas di assets/images/:
  kids-huruf.svg, ill-ular.svg, ill-ember.svg,
  illustration-huruf.svg, illustration-cocok.svg, illustration-suku.svg

Huruf diubah menjadi path memakai font Baloo 2 yang sudah ada di assets/fonts,
sehingga tampil sama di semua perangkat. Membutuhkan paket fontTools.
Jalankan dari folder proyek:  python tools/make_huruf_assets.py
"""

import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "images")
FONT = TTFont(os.path.join(ROOT, "assets", "fonts", "Baloo2-800.ttf"))
GS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UPM = FONT["head"].unitsPerEm


def glyph(ch, x, y, size, fill="#fff", anchor="middle"):
    """Kembalikan elemen <path> untuk satu karakter; y = garis dasar."""
    name = CMAP[ord(ch)]
    g = GS[name]
    s = size / UPM
    width = g.width * s
    if anchor == "middle":
        x -= width / 2
    pen = SVGPathPen(GS)
    g.draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
    return '<path d="%s" fill="%s"/>' % (pen.getCommands(), fill)


def text(s, x, y, size, fill="#fff"):
    total = sum(GS[CMAP[ord(c)]].width for c in s) * size / UPM
    cx = x - total / 2
    out = []
    for c in s:
        if c != " ":
            out.append(glyph(c, cx, y, size, fill, anchor="left"))
        cx += GS[CMAP[ord(c)]].width * size / UPM
    return "".join(out)


def tile(ch, x, y, w, color, rot=0, size=None, shade=None):
    size = size or w * 0.82
    shade = shade or "rgba(0,0,0,.16)"
    return (
        '<g transform="rotate(%s %s %s)">'
        '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"/>'
        '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"/>'
        '%s</g>'
    ) % (
        rot, x + w / 2, y + w / 2,
        x, y + 6, w, w, w * 0.2, shade,
        x, y, w, w, w * 0.2, color,
        glyph(ch, x + w / 2, y + w * 0.5 + size * 0.36, size),
    )


def svg(w, h, body, defs=""):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">'
        "<defs>%s</defs>%s</svg>" % (w, h, w, h, defs, body)
    )


def save(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(content)
    print("tulis", name)


# ---------------------------------------------------------------- anak-anak
def kid(cx, base, skin, hair, shirt, pants, glasses=False, girl=False, flip=1):
    """Karakter anak sederhana, kedua tangan menunjuk ke atas."""
    f = flip
    parts = []
    # kaki
    parts.append('<rect x="%s" y="%s" width="20" height="46" rx="10" fill="%s"/>' % (cx - 26, base - 46, pants))
    parts.append('<rect x="%s" y="%s" width="20" height="46" rx="10" fill="%s"/>' % (cx + 6, base - 46, pants))
    parts.append('<ellipse cx="%s" cy="%s" rx="17" ry="9" fill="#35507c"/>' % (cx - 16, base))
    parts.append('<ellipse cx="%s" cy="%s" rx="17" ry="9" fill="#35507c"/>' % (cx + 16, base))
    # badan
    parts.append('<rect x="%s" y="%s" width="76" height="86" rx="30" fill="%s"/>' % (cx - 38, base - 130, shirt))
    if girl:
        parts.append('<path d="M%s %s h76 l10 44 h-96z" fill="%s"/>' % (cx - 38, base - 70, pants))
    # lengan menunjuk ke atas
    parts.append('<path d="M%s %s Q%s %s %s %s" stroke="%s" stroke-width="18" stroke-linecap="round" fill="none"/>'
                 % (cx + 30 * f, base - 112, cx + 62 * f, base - 128, cx + 66 * f, base - 170, shirt))
    parts.append('<circle cx="%s" cy="%s" r="10" fill="%s"/>' % (cx + 66 * f, base - 176, skin))
    parts.append('<path d="M%s %s Q%s %s %s %s" stroke="%s" stroke-width="18" stroke-linecap="round" fill="none"/>'
                 % (cx - 30 * f, base - 108, cx - 56 * f, base - 100, cx - 58 * f, base - 74, shirt))
    parts.append('<circle cx="%s" cy="%s" r="10" fill="%s"/>' % (cx - 58 * f, base - 68, skin))
    # kepala
    parts.append('<circle cx="%s" cy="%s" r="46" fill="%s"/>' % (cx, base - 178, skin))
    parts.append('<path d="M%s %s a46 46 0 0 1 92 0 q-24 -22 -46 -10 q-22 -12 -46 10z" fill="%s"/>' % (cx - 46, base - 184, hair))
    if girl:
        parts.append('<circle cx="%s" cy="%s" r="16" fill="%s"/>' % (cx - 50, base - 168, hair))
        parts.append('<circle cx="%s" cy="%s" r="16" fill="%s"/>' % (cx + 50, base - 168, hair))
        parts.append('<rect x="%s" y="%s" width="24" height="9" rx="4" fill="#ffd23f"/>' % (cx - 40, base - 206))
    # wajah
    parts.append('<circle cx="%s" cy="%s" r="5" fill="#16305a"/>' % (cx - 15, base - 174))
    parts.append('<circle cx="%s" cy="%s" r="5" fill="#16305a"/>' % (cx + 15, base - 174))
    parts.append('<path d="M%s %s q14 14 28 0" stroke="#16305a" stroke-width="4" stroke-linecap="round" fill="none"/>' % (cx - 14, base - 158))
    parts.append('<circle cx="%s" cy="%s" r="7" fill="#ff9aa8" opacity=".55"/>' % (cx - 28, base - 160))
    parts.append('<circle cx="%s" cy="%s" r="7" fill="#ff9aa8" opacity=".55"/>' % (cx + 28, base - 160))
    if glasses:
        parts.append('<circle cx="%s" cy="%s" r="13" fill="none" stroke="#16305a" stroke-width="3.5"/>' % (cx - 15, base - 174))
        parts.append('<circle cx="%s" cy="%s" r="13" fill="none" stroke="#16305a" stroke-width="3.5"/>' % (cx + 15, base - 174))
        parts.append('<path d="M%s %s h4" stroke="#16305a" stroke-width="3.5"/>' % (cx - 2, base - 174))
    return "".join(parts)


def kids():
    body = [
        '<ellipse cx="260" cy="344" rx="250" ry="22" fill="#7ddc9a" opacity=".55"/>',
        '<path d="M0 330 Q130 290 260 322 T520 310 V360 H0z" fill="#59c987"/>',
        kid(160, 336, "#ffd3a6", "#2a2f6b", "#2f7bf6", "#ffd23f", glasses=True),
        kid(360, 336, "#f6c39a", "#6b3a22", "#ff7eb3", "#8b5cf6", girl=True, flip=-1),
        # buku dan pensil di tanah
        '<rect x="226" y="316" width="70" height="22" rx="5" fill="#ff9a3c" transform="rotate(-6 261 327)"/>',
        '<rect x="232" y="312" width="58" height="8" rx="3" fill="#fff" transform="rotate(-6 261 316)"/>',
    ]
    save("kids-huruf.svg", svg(520, 360, "".join(body)))


# ---------------------------------------------------------------- ilustrasi benda
def ular():
    body = (
        '<path d="M26 88 C 26 52, 70 62, 64 84 C 58 108, 100 110, 98 74 C 97 48, 78 30, 60 34" '
        'fill="none" stroke="#2ecf7e" stroke-width="16" stroke-linecap="round"/>'
        '<path d="M26 88 C 26 52, 70 62, 64 84 C 58 108, 100 110, 98 74" fill="none" stroke="#bff3d6" '
        'stroke-width="5" stroke-linecap="round" stroke-dasharray="1 13"/>'
        '<ellipse cx="54" cy="34" rx="17" ry="13" fill="#2ecf7e"/>'
        '<circle cx="50" cy="30" r="4" fill="#fff"/><circle cx="51" cy="30" r="2" fill="#16305a"/>'
        '<path d="M38 36 l-14 -2 m14 2 l-12 7" stroke="#ef5b5b" stroke-width="3" stroke-linecap="round"/>'
    )
    save("ill-ular.svg", svg(120, 120, body))


def ember():
    body = (
        '<path d="M34 46 Q60 4 86 46" fill="none" stroke="#7488a5" stroke-width="6" stroke-linecap="round"/>'
        '<path d="M26 44 H94 L84 104 Q60 112 36 104z" fill="#3b82f6"/>'
        '<path d="M26 44 H94 L92 54 H28z" fill="#1a56c4"/>'
        '<path d="M40 64 L44 96" stroke="#9fc8ff" stroke-width="6" stroke-linecap="round" opacity=".7"/>'
        '<ellipse cx="60" cy="44" rx="34" ry="6" fill="#8fc1ff"/>'
    )
    save("ill-ember.svg", svg(120, 120, body))


# ---------------------------------------------------------------- ilustrasi materi
BLUE, ORANGE, GREEN, YELLOW, PINK, PURPLE = "#2f7bf6", "#ff9a3c", "#2ecf7e", "#ffb800", "#ff7eb3", "#8b5cf6"


def illustration_huruf():
    body = [
        '<ellipse cx="260" cy="300" rx="210" ry="22" fill="#cfe3ff" opacity=".7"/>',
        tile("A", 70, 190, 110, BLUE, -6),
        tile("B", 195, 196, 110, ORANGE, 4),
        tile("C", 320, 190, 110, GREEN, -3),
        tile("D", 132, 70, 104, PINK, 5),
        tile("E", 258, 74, 104, PURPLE, -5),
        '<rect x="392" y="236" width="14" height="86" rx="4" fill="#ffd23f" transform="rotate(24 399 280)"/>',
        '<path d="M388 318 l8 -22 l10 8z" fill="#ffd3a6" transform="rotate(24 399 280)"/>',
        '<path d="M70 40 l6 12 l13 2 l-10 9 l3 13 l-12 -7 l-12 7 l3 -13 l-10 -9 l13 -2z" fill="#ffd23f"/>',
        '<path d="M440 70 l5 10 l11 1.5 l-8 7.5 l2.5 11 l-10.5 -6 l-10.5 6 l2.5 -11 l-8 -7.5 l11 -1.5z" fill="#ffd23f"/>',
    ]
    save("illustration-huruf.svg", svg(520, 340, "".join(body)))


def illustration_cocok():
    body = [
        '<ellipse cx="260" cy="300" rx="210" ry="22" fill="#d9f9e9" opacity=".8"/>',
        tile("A", 56, 86, 130, BLUE, -5, size=108),
        tile("a", 334, 86, 130, ORANGE, 5, size=108),
        '<path d="M206 150 q54 -56 108 0" fill="none" stroke="#16305a" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 14"/>',
        '<path d="M300 140 l16 12 l-20 6z" fill="#16305a"/>',
        tile("B", 96, 214, 84, GREEN, 4, size=70),
        tile("b", 340, 214, 84, PINK, -4, size=70),
        '<path d="M198 258 q62 -38 124 0" fill="none" stroke="#16305a" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12"/>',
        '<circle cx="260" cy="150" r="22" fill="#ffd23f"/><path d="M250 150 l8 8 l14 -16" stroke="#16305a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    ]
    save("illustration-cocok.svg", svg(520, 340, "".join(body)))


def illustration_suku():
    body = [
        '<ellipse cx="260" cy="300" rx="210" ry="22" fill="#ffe9a3" opacity=".7"/>',
    ]
    xs = [(36, "A", BLUE), (136, "I", ORANGE), (236, "U", GREEN), (336, "E", PINK), (436, "O", PURPLE)]
    for i, (x, ch, col) in enumerate(xs):
        y = 90 + (i % 2) * 46
        body.append('<circle cx="%d" cy="%d" r="46" fill="%s"/>' % (x + 24, y + 46, col))
        body.append('<circle cx="%d" cy="%d" r="46" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="5" stroke-dasharray="4 10"/>' % (x + 24, y + 46))
        body.append(glyph(ch, x + 24, y + 46 + 24, 70))
    body.append('<rect x="150" y="236" width="220" height="52" rx="26" fill="#fff" stroke="#e1edfb" stroke-width="3"/>')
    body.append(text("ba bi bu be bo", 260, 274, 34, "#16305a"))
    save("illustration-suku.svg", svg(520, 340, "".join(body)))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    kids()
    ular()
    ember()
    illustration_huruf()
    illustration_cocok()
    illustration_suku()
