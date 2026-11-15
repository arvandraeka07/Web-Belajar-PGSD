#!/usr/bin/env python3
"""Pembuat aset ilustrasi bergaya maskot Huhu (kartun 2D, outline tegas, gradient lembut).

Menimpa berkas di assets/images/: ikon om-*.svg yang dipakai, ilustrasi huruf/cocok/suku,
kids-huruf.svg, ill-ular.svg, ill-ember.svg, dan logo.svg. Maskot mascot-huhu.svg TIDAK diubah.
Jalankan dari folder proyek:  python tools/make_huhu_style_assets.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_huruf_assets import glyph, text  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "images")

# (terang, tengah, outline) -- mengikuti gradient + outline gelap pada Huhu
PAL = {
    "blue":   ("#6bb0ff", "#3b86f7", "#17469c"),
    "purple": ("#8f84e6", "#5547b8", "#2b2470"),
    "orange": ("#ffc27a", "#ff9a3c", "#c9640b"),
    "green":  ("#7be8ab", "#2fcf7e", "#0b7a45"),
    "pink":   ("#ffb3d1", "#ff7eb3", "#b8346f"),
    "yellow": ("#ffe98a", "#ffd23f", "#d99f00"),
    "red":    ("#ff9a8a", "#ef5b5b", "#a82a22"),
    "grey":   ("#f1f4fb", "#c3cde0", "#5d6685"),
    "cream":  ("#fffdf4", "#ffedc2", "#d9a94a"),
    "skin1":  ("#ffe6cc", "#ffcf9f", "#b8693a"),
    "skin2":  ("#fbd3b0", "#eeb083", "#a35a2c"),
    "navy":   ("#3a3f8f", "#26286b", "#14163f"),
    "brown":  ("#a9744f", "#7b4a2d", "#4a2a16"),
}
INK = "#1d1850"


class Doc:
    """Pengumpul gradient agar setiap SVG mandiri."""

    def __init__(self, w, h):
        self.w, self.h, self.used, self.body = w, h, set(), []

    def fill(self, c):
        if c not in PAL:
            return c
        self.used.add(c)
        return "url(#g-%s)" % c

    def add(self, s):
        self.body.append(s)
        return self

    def path(self, d, c, sw=3, extra=""):
        self.add('<path d="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-linejoin="round" stroke-linecap="round" %s/>'
                 % (d, self.fill(c), PAL[c][2] if c in PAL else INK, sw, extra))
        return self

    def rect(self, x, y, w, h, rx, c, sw=3, extra=""):
        self.add('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-linejoin="round" %s/>'
                 % (x, y, w, h, rx, self.fill(c), PAL[c][2] if c in PAL else INK, sw, extra))
        return self

    def circ(self, cx, cy, r, c, sw=3, extra=""):
        self.add('<circle cx="%s" cy="%s" r="%s" fill="%s" stroke="%s" stroke-width="%s" %s/>'
                 % (cx, cy, r, self.fill(c), PAL[c][2] if c in PAL else INK, sw, extra))
        return self

    def ell(self, cx, cy, rx, ry, c, sw=3, extra=""):
        self.add('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="%s" stroke="%s" stroke-width="%s" %s/>'
                 % (cx, cy, rx, ry, self.fill(c), PAL[c][2] if c in PAL else INK, sw, extra))
        return self

    def thick(self, d, c, w, extra=""):
        """Garis tebal beroutline (lengan, ekor, rangka)."""
        o = PAL[c][2]
        self.add('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" %s/>' % (d, o, w + 5, extra))
        self.add('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" %s/>' % (d, self.fill(c) if False else PAL[c][1], w, extra))
        return self

    def shine(self, d, w=3, op=0.6):
        self.add('<path d="%s" fill="none" stroke="#fff" stroke-width="%s" stroke-linecap="round" opacity="%s"/>' % (d, w, op))
        return self

    def eyes(self, cx, cy, gap, r=3.2, hi=True):
        for dx in (-gap, gap):
            self.add('<circle cx="%s" cy="%s" r="%s" fill="#16305a"/>' % (cx + dx, cy, r))
            if hi:
                self.add('<circle cx="%s" cy="%s" r="%s" fill="#fff"/>' % (cx + dx + r * .35, cy - r * .4, r * .38))
        return self

    def cheeks(self, cx, cy, gap, r=4.5):
        for dx in (-gap, gap):
            self.add('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="#ff9fb5" opacity=".6"/>' % (cx + dx, cy, r, r * .7))
        return self

    def smile(self, cx, cy, w=6):
        self.add('<path d="M%s %s q%s %s %s 0" fill="none" stroke="#16305a" stroke-width="2.4" stroke-linecap="round"/>' % (cx - w, cy, w, w * .9, w * 2))
        return self

    def render(self):
        defs = ""
        for c in sorted(self.used):
            a, b, _ = PAL[c]
            defs += ('<linearGradient id="g-%s" x1="0.2" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="%s"/>'
                     '<stop offset="0.55" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient>'
                     % (c, a, b, _lerp(b, PAL[c][2], .35)))
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" width="%s" height="%s"><defs>%s</defs>%s</svg>'
                % (self.w, self.h, self.w, self.h, defs, "".join(self.body)))

    def save(self, name):
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            f.write(self.render())
        print("tulis", name)


def _lerp(a, b, t):
    pa = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    pb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02x%02x%02x" % tuple(round(x + (y - x) * t) for x, y in zip(pa, pb))


def star_d(cx, cy, ro, ri, n=5, rot=-90):
    pts = []
    for i in range(n * 2):
        r = ro if i % 2 == 0 else ri
        a = math.radians(rot + i * 180 / n)
        pts.append("%.1f %.1f" % (cx + r * math.cos(a), cy + r * math.sin(a)))
    return "M" + "L".join(pts) + "z"


# ------------------------------------------------------------------ IKON 72x72
def new_icon():
    return Doc(72, 72)


ICONS = {}


def icon(code):
    def deco(fn):
        ICONS[code] = fn
        return fn
    return deco


@icon("1F31F")
def _():
    d = new_icon().path(star_d(36, 38, 30, 14), "yellow", 3.2)
    d.eyes(36, 38, 6, 2.8).cheeks(36, 44, 12, 3.5).smile(36, 44, 4)
    d.shine("M24 22l4-4", 3)
    return d


@icon("1F343")
def _():
    d = new_icon().path("M12 54C10 26 32 10 62 12C64 40 46 62 18 60z", "green", 3.2)
    d.thick("M16 56C28 42 40 30 54 20", "green", 3).add('<path d="M16 56C28 42 40 30 54 20" fill="none" stroke="#c8f7dc" stroke-width="2.6" stroke-linecap="round"/>')
    d.shine("M24 24C30 18 38 15 46 14", 3)
    return d


@icon("1F34C")
def _():
    d = new_icon().path("M14 18C10 44 28 66 58 58C64 56 63 50 58 50C42 50 31 38 30 16z", "yellow", 3.2)
    d.path("M14 18L30 16L29 10C25 8 17 9 14 12z", "brown", 2.6)
    d.path("M58 58C62 59 65 55 62 50C60 50 58 50 58 50z", "brown", 2.4)
    d.shine("M20 32C22 44 30 54 42 57", 3)
    return d


@icon("1F34E")
def _():
    d = new_icon().path("M36 24C28 15 11 20 11 39C11 54 22 66 30 66C33 66 34 64 36 64C38 64 39 66 42 66C50 66 61 54 61 39C61 20 44 15 36 24z", "red", 3.2)
    d.path("M37 22C36 13 41 8 49 8C49 16 44 22 37 22z", "green", 2.8)
    d.add('<path d="M36 24C36 19 35 15 33 11" fill="none" stroke="#7b4a2d" stroke-width="3" stroke-linecap="round"/>')
    d.shine("M19 34C19 29 22 26 26 25", 3.5)
    return d


@icon("1F393")
def _():
    d = new_icon().path("M18 38V52C18 60 54 60 54 52V38L36 47z", "purple", 3)
    d.path("M36 14L68 30L36 46L4 30z", "purple", 3.2)
    d.add('<path d="M36 22L55 31L36 40L17 31z" fill="#fff" opacity=".18"/>')
    d.add('<path d="M62 33V50" stroke="#d99f00" stroke-width="3" stroke-linecap="round"/>')
    d.circ(62, 53, 4, "yellow", 2.4).circ(36, 30, 2.6, "yellow", 1.6)
    return d


@icon("1F3AC")
def _():
    d = new_icon().rect(10, 28, 52, 36, 7, "purple", 3.2)
    d.add('<path d="M30 38L44 46L30 54z" fill="#ffd23f" stroke="#d99f00" stroke-width="2.4" stroke-linejoin="round"/>')
    d.add('<g transform="rotate(-9 10 28)">')
    d.rect(10, 14, 52, 14, 4, "navy", 3)
    for x in (16, 29, 42):
        d.add('<path d="M%s 14l9 0l-6 14l-9 0z" fill="#ffd23f" stroke="#d99f00" stroke-width="1.6" stroke-linejoin="round"/>' % x)
    d.add('</g>')
    return d


@icon("1F3AE")
def _():
    d = new_icon().path("M17 22H55C65 22 70 36 68 48C66 58 58 60 54 53L50 46H22L18 53C14 60 6 58 4 48C2 36 7 22 17 22z", "purple", 3.2)
    d.add('<path d="M23 31v12M17 37h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/>')
    d.circ(49, 34, 4.4, "yellow", 2.2).circ(57, 40, 4.4, "pink", 2.2)
    d.shine("M14 28C18 25 24 24 30 24", 3)
    return d


@icon("1F3AF")
def _():
    d = new_icon()
    d.circ(34, 40, 28, "red", 3.2).circ(34, 40, 20, "cream", 2.6).circ(34, 40, 13, "red", 2.6).circ(34, 40, 6.5, "yellow", 2.4)
    d.add('<path d="M36 38L62 12" stroke="%s" stroke-width="5" stroke-linecap="round"/>' % PAL["purple"][2])
    d.add('<path d="M36 38L62 12" stroke="%s" stroke-width="2.4" stroke-linecap="round"/>' % PAL["purple"][1])
    d.path("M58 6L68 4L66 14L62 12z", "yellow", 2.2).path("M62 16L66 14L68 24L58 22z", "yellow", 2.2)
    return d


@icon("1F3C1")
def _():
    d = new_icon()
    d.add('<path d="M14 8V66" stroke="%s" stroke-width="8" stroke-linecap="round"/>' % PAL["brown"][2])
    d.add('<path d="M14 8V66" stroke="%s" stroke-width="3.6" stroke-linecap="round"/>' % PAL["orange"][0])
    d.path("M18 10C30 4 40 16 54 10C60 8 66 10 66 10V40C66 40 60 38 54 40C40 46 30 34 18 40z", "cream", 3)
    d.add('<clipPath id="fc"><path d="M18 10C30 4 40 16 54 10C60 8 66 10 66 10V40C66 40 60 38 54 40C40 46 30 34 18 40z"/></clipPath><g clip-path="url(#fc)">')
    for i in range(5):
        for j in range(4):
            if (i + j) % 2 == 0:
                d.add('<rect x="%s" y="%s" width="10" height="10" fill="%s"/>' % (14 + i * 10, 2 + j * 10, INK))
    d.add('</g>')
    d.path("M18 10C30 4 40 16 54 10C60 8 66 10 66 10V40C66 40 60 38 54 40C40 46 30 34 18 40z", "none", 3)
    return d


@icon("1F3C5")
def _():
    d = new_icon().path("M20 4H34L40 28H28z", "red", 2.8).path("M52 4H38L32 28H44z", "blue", 2.8)
    d.circ(36, 46, 22, "yellow", 3.2).circ(36, 46, 15, "yellow", 2)
    d.path(star_d(36, 46, 11, 5), "orange", 2.2)
    d.shine("M21 40C22 34 26 30 31 28", 3)
    return d


@icon("1F3C6")
def _():
    d = new_icon()
    d.add('<path d="M20 16C6 14 6 34 22 38" fill="none" stroke="%s" stroke-width="9" stroke-linecap="round"/>' % PAL["yellow"][2])
    d.add('<path d="M52 16C66 14 66 34 50 38" fill="none" stroke="%s" stroke-width="9" stroke-linecap="round"/>' % PAL["yellow"][2])
    d.add('<path d="M20 16C6 14 6 34 22 38" fill="none" stroke="%s" stroke-width="4" stroke-linecap="round"/>' % PAL["yellow"][1])
    d.add('<path d="M52 16C66 14 66 34 50 38" fill="none" stroke="%s" stroke-width="4" stroke-linecap="round"/>' % PAL["yellow"][1])
    d.path("M18 6H54V28C54 42 45 50 36 50C27 50 18 42 18 28z", "yellow", 3.2)
    d.rect(31, 48, 10, 10, 2, "yellow", 2.8).rect(20, 57, 32, 9, 4, "orange", 3)
    d.path(star_d(36, 27, 9, 4), "orange", 2)
    d.shine("M24 14V28", 3.5)
    return d


@icon("1F408")
def _():
    d = new_icon()
    d.path("M12 26L16 4L32 16z", "orange", 3).path("M60 26L56 4L40 16z", "orange", 3)
    d.add('<path d="M17 14L19 9L26 15z" fill="#ff9fb5"/><path d="M55 14L53 9L46 15z" fill="#ff9fb5"/>')
    d.ell(36, 40, 27, 24, "orange", 3.2)
    d.add('<path d="M30 20v6M36 18v7M42 20v6" stroke="#c9640b" stroke-width="2.6" stroke-linecap="round"/>')
    d.ell(36, 50, 13, 9, "cream", 2)
    d.circ(26, 37, 7, "cream", 2.2).circ(46, 37, 7, "cream", 2.2)
    d.eyes(26.5, 38, 0, 3.6).eyes(46.5, 38, 0, 3.6)
    d.add('<path d="M33 46h6l-3 4z" fill="#ff7eb3" stroke="#b8346f" stroke-width="1.6" stroke-linejoin="round"/>')
    d.smile(36, 52, 4).cheeks(36, 46, 20, 4)
    d.add('<path d="M10 44l-8-2M10 49l-8 2M62 44l8-2M62 49l8 2" stroke="%s" stroke-width="2" stroke-linecap="round"/>' % PAL["orange"][2])
    return d


@icon("1F418")
def _():
    d = new_icon()
    d.circ(13, 36, 13, "blue", 3).circ(59, 36, 13, "blue", 3)
    d.add('<circle cx="13" cy="36" r="7" fill="#ff9fb5" opacity=".55"/><circle cx="59" cy="36" r="7" fill="#ff9fb5" opacity=".55"/>')
    d.thick("M36 46C36 58 28 66 22 62", "blue", 11)
    d.ell(36, 36, 22, 24, "blue", 3.2)
    d.thick("M36 46C36 58 28 66 22 62", "blue", 10)
    d.path("M22 52L18 63L26 58z", "cream", 2).path("M50 52L54 63L46 58z", "cream", 2)
    d.eyes(27, 32, 0, 3.6).eyes(45, 32, 0, 3.6).cheeks(36, 40, 18, 4)
    d.shine("M24 20C28 16 34 14 40 14", 3)
    return d


@icon("1F41F")
def _():
    d = new_icon().path("M50 36L68 20C69 28 69 44 68 52z", "orange", 3)
    d.ell(32, 36, 26, 18, "blue", 3.2)
    d.path("M24 20C28 10 38 10 42 20z", "orange", 2.6)
    d.path("M30 52C32 60 40 60 42 52z", "orange", 2.4)
    d.add('<path d="M44 26C48 32 48 40 44 46" fill="none" stroke="#17469c" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>')
    d.circ(20, 32, 6.5, "cream", 2.4).add('<circle cx="19" cy="33" r="3.4" fill="#16305a"/><circle cx="20" cy="31.6" r="1.2" fill="#fff"/>')
    d.add('<path d="M10 42q4 4 8 0" fill="none" stroke="#16305a" stroke-width="2.4" stroke-linecap="round"/>')
    d.shine("M20 24C26 20 34 20 40 22", 3)
    return d


@icon("1F4A1")
def _():
    d = new_icon()
    for a in (-60, -30, 0, 30, 60):
        x1 = 36 + 28 * math.sin(math.radians(a)); y1 = 28 - 28 * math.cos(math.radians(a))
        x2 = 36 + 34 * math.sin(math.radians(a)); y2 = 28 - 34 * math.cos(math.radians(a))
        d.add('<path d="M%.1f %.1f L%.1f %.1f" stroke="%s" stroke-width="3.2" stroke-linecap="round"/>' % (x1, y1, x2, y2, PAL["yellow"][2]))
    d.path("M36 6C22 6 14 16 14 28C14 38 20 42 24 50H48C52 42 58 38 58 28C58 16 50 6 36 6z", "yellow", 3.2)
    d.rect(24, 50, 24, 7, 3, "grey", 2.6).rect(27, 57, 18, 7, 3.5, "grey", 2.6)
    d.add('<path d="M30 40L36 30L42 40" fill="none" stroke="#d99f00" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')
    d.shine("M21 24C22 17 27 12 33 11", 3.4)
    return d


@icon("1F4D3")
def _():
    d = new_icon().rect(14, 6, 44, 60, 7, "purple", 3.2)
    d.rect(26, 16, 26, 22, 4, "cream", 2.4)
    d.add('<path d="M30 24h18M30 31h12" stroke="#5547b8" stroke-width="2.6" stroke-linecap="round"/>')
    for y in (14, 28, 42, 56):
        d.add('<rect x="8" y="%s" width="12" height="6" rx="3" fill="#ffe98a" stroke="%s" stroke-width="2.2"/>' % (y - 3, PAL["yellow"][2]))
    d.path(star_d(40, 52, 6, 2.8), "yellow", 1.8)
    return d


@icon("1F4D5")
def _():
    d = new_icon().path("M16 8H60V64H16z", "cream", 3).rect(12, 6, 44, 58, 6, "red", 3.2)
    d.add('<path d="M22 8V62" stroke="%s" stroke-width="2.6" opacity=".6"/>' % PAL["red"][2])
    d.path(star_d(40, 30, 10, 4.6), "yellow", 2.4)
    d.add('<path d="M30 48h20M30 55h14" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>')
    return d


@icon("1F4DA")
def _():
    d = new_icon()
    d.rect(8, 44, 56, 18, 5, "green", 3).add('<rect x="12" y="50" width="48" height="6" rx="3" fill="#fffdf4" opacity=".9"/>')
    d.rect(12, 26, 50, 18, 5, "orange", 3).add('<rect x="16" y="32" width="42" height="6" rx="3" fill="#fffdf4" opacity=".9"/>')
    d.rect(16, 8, 46, 18, 5, "purple", 3).add('<rect x="20" y="14" width="38" height="6" rx="3" fill="#fffdf4" opacity=".9"/>')
    d.path(star_d(62, 17, 4, 1.8), "yellow", 1.4)
    return d


@icon("1F4DD")
def _():
    d = new_icon().rect(10, 6, 40, 56, 6, "cream", 3)
    d.add('<path d="M18 20h24M18 30h24M18 40h14" stroke="#5547b8" stroke-width="3" stroke-linecap="round"/>')
    d.add('<g transform="rotate(38 52 44)">')
    d.rect(46, 18, 12, 40, 3, "orange", 2.8).rect(46, 18, 12, 8, 3, "pink", 2.4)
    d.path("M46 58L52 70L58 58z", "cream", 2.4).path("M50 66L52 70L54 66z", "navy", 1.2)
    d.add('</g>')
    return d


@icon("1F550")
def _():
    d = new_icon().circ(36, 36, 30, "purple", 3.4).circ(36, 36, 23, "cream", 2.6)
    for a in range(0, 360, 90):
        x = 36 + 17 * math.sin(math.radians(a)); y = 36 - 17 * math.cos(math.radians(a))
        d.add('<circle cx="%.1f" cy="%.1f" r="2.2" fill="%s"/>' % (x, y, PAL["purple"][1]))
    d.add('<path d="M36 36V19" stroke="%s" stroke-width="3.6" stroke-linecap="round"/>' % INK)
    d.add('<path d="M36 36L45 44" stroke="%s" stroke-width="3.6" stroke-linecap="round"/>' % PAL["red"][2])
    d.circ(36, 36, 3.2, "yellow", 2)
    d.shine("M16 26C18 20 23 15 29 13", 3)
    return d


@icon("1F680")
def _():
    d = new_icon()
    d.add('<g transform="rotate(42 36 36)">')
    d.path("M30 50H42L36 70z", "orange", 2.8).path("M33 50H39L36 62z", "yellow", 1.8)
    d.path("M26 38L12 54L26 52z", "red", 2.8).path("M46 38L60 54L46 52z", "red", 2.8)
    d.path("M36 4C50 14 52 34 47 52H25C20 34 22 14 36 4z", "cream", 3.2)
    d.path("M36 4C42 8 46 14 48 21H24C26 14 30 8 36 4z", "red", 3)
    d.circ(36, 33, 7.5, "blue", 2.8).add('<circle cx="34" cy="31" r="2" fill="#fff" opacity=".8"/>')
    d.add('</g>')
    d.path(star_d(14, 14, 5, 2.2), "yellow", 1.6)
    return d


@icon("1F6B2")
def _():
    d = new_icon()
    for cx in (17, 55):
        d.add('<circle cx="%s" cy="48" r="13" fill="#fffdf4" fill-opacity=".6" stroke="%s" stroke-width="7"/>' % (cx, PAL["purple"][2]))
        d.add('<circle cx="%s" cy="48" r="13" fill="none" stroke="%s" stroke-width="3.6"/>' % (cx, PAL["purple"][1]))
        d.add('<circle cx="%s" cy="48" r="2.6" fill="%s"/>' % (cx, PAL["yellow"][1]))
    d.thick("M17 48L29 26H46L55 48M29 26L38 48H17", "orange", 4)
    d.thick("M46 26L44 16H53", "orange", 3.4).thick("M25 22H34", "navy", 3.6)
    return d


@icon("1F9E0")
def _():
    d = new_icon().path("M36 12C28 5 14 10 15 22C7 25 6 38 13 43C12 54 23 61 30 56C34 63 40 63 42 56C50 61 62 54 59 43C66 38 65 25 57 22C58 10 44 5 36 12z", "pink", 3.2)
    d.add('<path d="M36 14V56M24 28C28 28 30 32 28 36M48 28C44 28 42 32 44 36M22 46C27 44 31 47 31 51M50 46C45 44 41 47 41 51" fill="none" stroke="#b8346f" stroke-width="2.4" stroke-linecap="round" opacity=".65"/>')
    d.shine("M20 24C22 19 27 16 31 16", 3)
    return d


@icon("1F9E9")
def _():
    d = new_icon().path("M14 22H29C23 12 30 6 35 6C40 6 47 12 41 22H56V32C66 26 70 34 70 39C70 44 66 52 56 46V62H14V46C26 46 26 32 14 32z", "green", 3.2)
    d.shine("M20 28V16", 3.4)
    d.add('<circle cx="40" cy="48" r="3" fill="#fff" opacity=".5"/>')
    return d


@icon("2600")
def _():
    d = new_icon()
    for a in range(0, 360, 45):
        d.add('<rect x="32.5" y="1.5" width="7" height="14" rx="3.5" fill="%s" stroke="%s" stroke-width="2.4" transform="rotate(%s 36 36)"/>' % (PAL["orange"][1], PAL["orange"][2], a))
    d.circ(36, 36, 21, "yellow", 3.2)
    d.eyes(36, 32, 7, 3).cheeks(36, 40, 13, 4).smile(36, 41, 5)
    d.shine("M23 26C25 21 29 18 33 17", 3)
    return d


@icon("26BD")
def _():
    d = new_icon().circ(36, 36, 29, "grey", 3.2)
    d.add('<clipPath id="bc"><circle cx="36" cy="36" r="28"/></clipPath><g clip-path="url(#bc)">')
    pent = star_d(36, 36, 10, 10, 5)  # pentagon
    d.add('<path d="%s" fill="%s" stroke="%s" stroke-width="2" stroke-linejoin="round"/>' % (pent, PAL["navy"][1], INK))
    for i in range(5):
        a = math.radians(-90 + i * 72)
        x1, y1 = 36 + 10 * math.cos(a), 36 + 10 * math.sin(a)
        x2, y2 = 36 + 21 * math.cos(a), 36 + 21 * math.sin(a)
        d.add('<path d="M%.1f %.1f L%.1f %.1f" stroke="%s" stroke-width="2.2" stroke-linecap="round"/>' % (x1, y1, x2, y2, INK))
        d.add('<path d="%s" fill="%s" stroke="%s" stroke-width="2" stroke-linejoin="round"/>' % (star_d(36 + 31 * math.cos(a), 36 + 31 * math.sin(a), 10, 10, 5, rot=-90 + i * 72), PAL["navy"][1], INK))
    d.add('</g>')
    d.circ(36, 36, 29, "none", 3.2)
    d.shine("M16 26C19 19 24 14 31 11", 3.4)
    return d


@icon("2705")
def _():
    d = new_icon().rect(8, 8, 56, 56, 16, "green", 3.4)
    d.add('<path d="M22 37L32 48L52 24" fill="none" stroke="%s" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' % PAL["green"][2])
    d.add('<path d="M22 37L32 48L52 24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')
    d.shine("M16 20C17 16 20 14 24 14", 3)
    return d


# ------------------------------------------------------------------ ILUSTRASI HURUF
def tile(d, ch, x, y, w, col, rot=0, size=None):
    size = size or w * 0.8
    cx, cy = x + w / 2, y + w / 2
    d.add('<g transform="rotate(%s %s %s)">' % (rot, cx, cy))
    d.add('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" opacity=".35"/>' % (x + 2, y + 9, w, w, w * .24, PAL[col][2]))
    d.rect(x, y, w, w, w * .24, col, 3.6)
    d.add('<path d="M%s %sq0 -%s %s -%s" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".55"/>'
          % (x + w * .14, y + w * .36, w * .16, w * .16, 0) if False else
          '<path d="M%s %s Q%s %s %s %s" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".5"/>'
          % (x + w * .13, y + w * .34, x + w * .14, y + w * .16, x + w * .3, y + w * .13))
    g = glyph(ch, cx, cy + size * .34, size, "#fff")
    g = g.replace('fill="#fff"/>', 'fill="#fff" stroke="%s" stroke-width="%s" stroke-linejoin="round" paint-order="stroke"/>' % (PAL[col][2], max(5, w * .06)))
    d.add(g)
    d.add('</g>')


def sparkle(d, x, y, r):
    d.path(star_d(x, y, r, r * .46), "yellow", 2.2)


def ground(d, w, y, rx, ry, col):
    d.add('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="%s" opacity=".35"/>' % (w / 2, y, rx, ry, PAL[col][2]))


def ill_huruf():
    d = Doc(520, 340)
    ground(d, 520, 304, 214, 20, "purple")
    tile(d, "A", 70, 190, 110, "blue", -6); tile(d, "B", 195, 196, 110, "orange", 4); tile(d, "C", 320, 190, 110, "green", -3)
    tile(d, "D", 132, 70, 104, "pink", 5); tile(d, "E", 258, 74, 104, "purple", -5)
    d.add('<g transform="rotate(24 399 280)">')
    d.rect(392, 236, 16, 70, 4, "yellow", 3).rect(392, 236, 16, 14, 4, "pink", 3)
    d.path("M392 306L400 328L408 306z", "cream", 3).path("M396 320L400 328L404 320z", "navy", 1.5)
    d.add('</g>')
    sparkle(d, 72, 56, 22); sparkle(d, 442, 78, 17); sparkle(d, 470, 150, 9)
    d.save("illustration-huruf.svg")


def ill_cocok():
    d = Doc(520, 340)
    ground(d, 520, 304, 214, 20, "green")
    tile(d, "A", 56, 86, 130, "blue", -5, 108); tile(d, "a", 334, 86, 130, "orange", 5, 108)
    d.add('<path d="M206 150q54 -56 108 0" fill="none" stroke="%s" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 14"/>' % INK)
    d.add('<path d="M300 140l16 12l-20 6z" fill="%s" stroke="%s" stroke-width="3" stroke-linejoin="round"/>' % (INK, INK))
    tile(d, "B", 96, 214, 84, "green", 4, 68); tile(d, "b", 340, 214, 84, "pink", -4, 68)
    d.add('<path d="M198 258q62 -38 124 0" fill="none" stroke="%s" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12"/>' % INK)
    d.circ(260, 150, 24, "yellow", 3.4)
    d.add('<path d="M249 150l8 9l15 -17" stroke="%s" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % INK)
    sparkle(d, 450, 40, 16); sparkle(d, 70, 40, 12)
    d.save("illustration-cocok.svg")


def ill_suku():
    d = Doc(520, 340)
    ground(d, 520, 304, 214, 20, "yellow")
    xs = [(36, "A", "blue"), (136, "I", "orange"), (236, "U", "green"), (336, "E", "pink"), (436, "O", "purple")]
    for i, (x, ch, col) in enumerate(xs):
        y = 80 + (i % 2) * 46
        cx, cy = x + 24, y + 46
        d.add('<ellipse cx="%s" cy="%s" rx="46" ry="46" fill="%s" opacity=".3" transform="translate(2 8)"/>' % (cx, cy, PAL[col][2]))
        d.circ(cx, cy, 46, col, 3.8)
        d.add('<path d="M%s %sA46 46 0 0 1 %s %s" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".5" transform="translate(0 0)"/>' % (cx - 34, cy - 22, cx - 12, cy - 40))
        g = glyph(ch, cx, cy + 24, 70, "#fff").replace('fill="#fff"/>', 'fill="#fff" stroke="%s" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>' % PAL[col][2])
        d.add(g)
    d.add('<rect x="150" y="236" width="220" height="56" rx="28" fill="#fff" stroke="%s" stroke-width="3.6"/>' % PAL["purple"][2])
    d.add(text("ba bi bu be bo", 260, 277, 34, PAL["purple"][2]))
    sparkle(d, 60, 250, 14); sparkle(d, 462, 236, 18)
    d.save("illustration-suku.svg")


# ------------------------------------------------------------------ ANAK-ANAK (mirip Huhu)
def kid(d, cx, base, skin, hair, shirt, pants, glasses=False, girl=False, f=1):
    """Anak bergaya Huhu: kepala besar membulat, mata besar beroutline, badan gemuk pendek."""
    for dx in (-15, 15):
        d.rect(cx + dx - 12, base - 34, 24, 30, 12, pants, 3.2)
        d.ell(cx + dx + (3 * f), base - 4, 20, 11, "navy", 3.2)
    d.rect(cx - 40, base - 108, 80, 78, 36, shirt, 3.6)
    d.ell(cx, base - 62, 22, 26, "cream", 0, 'opacity=".28"')
    if girl:
        d.path("M%s %s h80 l12 40 h-104z" % (cx - 40, base - 62), pants, 3.2)
    d.thick("M%s %s Q%s %s %s %s" % (cx + 32 * f, base - 92, cx + 64 * f, base - 104, cx + 68 * f, base - 140), shirt, 20)
    d.circ(cx + 68 * f, base - 148, 12, skin, 3)
    d.thick("M%s %s Q%s %s %s %s" % (cx - 32 * f, base - 88, cx - 58 * f, base - 82, cx - 60 * f, base - 58), shirt, 20)
    d.circ(cx - 60 * f, base - 52, 12, skin, 3)
    if girl:
        d.circ(cx - 58, base - 150, 19, hair, 3.2); d.circ(cx + 58, base - 150, 19, hair, 3.2)
    d.circ(cx, base - 150, 58, skin, 3.6)
    d.path("M%s %s a58 58 0 0 1 116 0 q-30 -30 -58 -16 q-28 -14 -58 16z" % (cx - 58, base - 154), hair, 3.4)
    d.shine("M%s %s q4 -16 18 -22" % (cx - 40, base - 176), 4, .35)
    if girl:
        d.rect(cx - 46, base - 202, 30, 11, 5.5, "yellow", 2.6)
    for dx in (-21, 21):
        ex, ey = cx + dx, base - 146
        d.add('<circle cx="%s" cy="%s" r="17" fill="#fffdf4" stroke="%s" stroke-width="3.2"/>' % (ex, ey, PAL[skin][2]))
        d.add('<circle cx="%s" cy="%s" r="11" fill="#16305a"/>' % (ex, ey + 1))
        d.add('<circle cx="%s" cy="%s" r="4.6" fill="#fff"/><circle cx="%s" cy="%s" r="2.2" fill="#fff"/><circle cx="%s" cy="%s" r="2.4" fill="#7fb1ff" opacity=".9"/>'
              % (ex + 4, ey - 4, ex - 4, ey + 6, ex + 4, ey + 6))
        d.add('<path d="M%s %s q10 -9 20 0" fill="none" stroke="%s" stroke-width="3.4" stroke-linecap="round" opacity=".7"/>' % (ex - 10, base - 170, PAL[hair][2]))
    if glasses:
        for dx in (-21, 21):
            d.add('<circle cx="%s" cy="%s" r="21" fill="#fff" fill-opacity=".12" stroke="%s" stroke-width="3.4"/>' % (cx + dx, base - 146, INK))
        d.add('<path d="M%s %s h2" stroke="%s" stroke-width="3.4"/>' % (cx - 1, base - 146, INK))
    d.cheeks(cx, base - 122, 38, 10)
    d.add('<path d="M%s %s q16 22 32 0z" fill="#c9455f" stroke="%s" stroke-width="3" stroke-linejoin="round"/>' % (cx - 16, base - 124, INK))
    d.add('<path d="M%s %s q6 -7 12 0q-6 7 -12 0z" fill="#ff8fa8"/>' % (cx - 6, base - 110))


def kids():
    d = Doc(520, 360)
    d.add('<path d="M0 334Q130 292 260 324T520 312V360H0z" fill="#7be8ab" stroke="%s" stroke-width="3.6"/>' % PAL["green"][2])
    d.add('<path d="M0 346Q130 316 260 340T520 330V360H0z" fill="#2fcf7e" opacity=".55"/>')
    d.add('<g fill="#fffdf4" stroke="%s" stroke-width="2.6"><circle cx="40" cy="342" r="9"/><circle cx="480" cy="338" r="9"/></g>' % PAL["green"][2])
    kid(d, 128, 336, "skin1", "navy", "purple", "yellow", glasses=True)
    kid(d, 328, 336, "skin2", "brown", "pink", "purple", girl=True, f=-1)
    d.add('<g transform="translate(-34 0) rotate(-6 261 324)">')
    d.rect(226, 308, 70, 24, 8, "orange", 3.2).add('<rect x="233" y="304" width="56" height="10" rx="5" fill="#fffdf4" stroke="%s" stroke-width="2.6"/>' % PAL["cream"][2])
    d.add('</g>')
    sparkle(d, 262, 120, 18); sparkle(d, 56, 60, 12); sparkle(d, 470, 70, 14)
    d.save("kids-huruf.svg")


def ular():
    d = Doc(120, 120)
    path = "M26 88C26 52 70 62 64 84C58 108 100 110 98 74C97 48 78 30 60 34"
    d.thick(path, "green", 18)
    d.add('<path d="M26 88C26 52 70 62 64 84C58 108 100 110 98 74" fill="none" stroke="#c8f7dc" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 13"/>')
    d.ell(54, 34, 20, 16, "green", 3.2)
    d.add('<path d="M36 38l-15 -3m15 3l-13 8" stroke="%s" stroke-width="3.4" stroke-linecap="round"/>' % PAL["red"][1])
    d.circ(50, 30, 7, "cream", 2.4).add('<circle cx="51" cy="31" r="4" fill="#16305a"/><circle cx="52.2" cy="29.6" r="1.4" fill="#fff"/>')
    d.add('<ellipse cx="62" cy="40" rx="5" ry="3.2" fill="#ff9fb5" opacity=".6"/>')
    d.save("ill-ular.svg")


def ember():
    d = Doc(120, 120)
    d.add('<path d="M34 48Q60 2 86 48" fill="none" stroke="%s" stroke-width="10" stroke-linecap="round"/>' % PAL["grey"][2])
    d.add('<path d="M34 48Q60 2 86 48" fill="none" stroke="%s" stroke-width="5" stroke-linecap="round"/>' % PAL["grey"][1])
    d.path("M24 46H96L86 104Q60 114 34 104z", "blue", 3.4)
    d.path("M24 46H96L93 58H27z", "purple", 2.8)
    d.ell(60, 46, 36, 8, "blue", 3)
    d.add('<ellipse cx="60" cy="46" rx="29" ry="4.6" fill="#17469c" opacity=".35"/>')
    d.add('<circle cx="48" cy="80" r="5.4" fill="#16305a"/><circle cx="72" cy="80" r="5.4" fill="#16305a"/><circle cx="49.6" cy="78" r="1.8" fill="#fff"/><circle cx="73.6" cy="78" r="1.8" fill="#fff"/>')
    d.add('<path d="M53 90q7 7 14 0" fill="none" stroke="#16305a" stroke-width="2.6" stroke-linecap="round"/>')
    d.cheeks(60, 88, 24, 5)
    d.shine("M38 66L41 96", 5, .55)
    d.save("ill-ember.svg")


# ------------------------------------------------------------------ LOGO (kepala Huhu pada kotak ungu UNY)
def logo():
    s = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Logo Fun Learning Adventure">
  <defs>
    <linearGradient id="logoPurple" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a5fd0"/><stop offset="0.55" stop-color="#433a9b"/><stop offset="1" stop-color="#2b2470"/></linearGradient>
    <linearGradient id="logoHead" x1="0.2" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#6bb0ff"/><stop offset="0.55" stop-color="#3b86f7"/><stop offset="1" stop-color="#1f5fcf"/></linearGradient>
  </defs>
  <rect x="4" y="4" width="88" height="88" rx="26" fill="url(#logoPurple)" stroke="#1d1850" stroke-width="3"/>
  <path d="M10 24C26 14 54 12 86 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".25"/>
  <path d="M26 38C21 32 19 24 19 19c0-1 1-2 2-1 6 3 11 7 15 12z" fill="#2f7bf6" stroke="#17469c" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M70 38c5-6 7-14 7-19 0-1-1-2-2-1-6 3-11 7-15 12z" fill="#2f7bf6" stroke="#17469c" stroke-width="2.4" stroke-linejoin="round"/>
  <ellipse cx="48" cy="52" rx="30" ry="29" fill="url(#logoHead)" stroke="#17469c" stroke-width="3"/>
  <circle cx="37" cy="48" r="11.5" fill="#fffdf4" stroke="#17469c" stroke-width="2.6"/>
  <circle cx="59" cy="48" r="11.5" fill="#fffdf4" stroke="#17469c" stroke-width="2.6"/>
  <circle cx="38" cy="49" r="5.4" fill="#16305a"/><circle cx="58" cy="49" r="5.4" fill="#16305a"/>
  <circle cx="39.8" cy="47" r="1.9" fill="#fff"/><circle cx="59.8" cy="47" r="1.9" fill="#fff"/>
  <ellipse cx="26" cy="60" rx="5.4" ry="3.6" fill="#ff9fb5" opacity=".7"/><ellipse cx="70" cy="60" rx="5.4" ry="3.6" fill="#ff9fb5" opacity=".7"/>
  <path d="m48 55 5 5-5 6-5-6z" fill="#ffb45e" stroke="#c9640b" stroke-width="2" stroke-linejoin="round"/>
  <path d="m78 14 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#ffd91a" stroke="#d99f00" stroke-width="1.8" stroke-linejoin="round"/>
</svg>
'''
    with open(os.path.join(OUT, "logo.svg"), "w", encoding="utf-8") as f:
        f.write(s)
    print("tulis logo.svg")


if __name__ == "__main__":
    for code, fn in ICONS.items():
        fn().save("om-%s.svg" % code)
    ill_huruf(); ill_cocok(); ill_suku(); kids(); ular(); ember(); logo()
