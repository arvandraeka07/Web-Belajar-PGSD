# -*- coding: utf-8 -*-
"""Mesin animasi video "Membaca Itu Seru" (1920x1080, 30 fps).

Dipanggil oleh tools/generate_videos.py. Memakai kembali maskot Huhu, font,
logo, dan narasi TTS (cache) yang sudah ada di proyek. Seluruh animasi dibuat
lewat kode (Pillow + numpy), lalu dikirim ke ffmpeg.

Bagian file ini:
  A. utilitas dasar, aset, rig maskot, efek visual, sintesis suara
  B. adegan 1-6 (lihat fungsi scene_*)
  C. susunan waktu (timeline), audio, dan render
"""

import hashlib
import math
import random
import re
import subprocess
import time
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "tools" / "build"
IMG = BUILD / "img"
HUHU = IMG / "huhu"
ILL = IMG / "ill"
TTS = BUILD / "tts"
AUDIO = BUILD / "audio"
VIDEOS = ROOT / "assets" / "videos"
POSTERS = ROOT / "assets" / "images"
FONTS = ROOT / "assets" / "fonts"

W, H = 1920, 1080
FPS = 30
SR = 44100
TRANS = 0.75          # durasi transisi antaradegan (detik)
PITCH = 0.96          # suara perempuan dewasa: nada diturunkan sedikit (hangat), bukan dinaikkan

# Warna: biru dominan, putih dasar, emas aksen (nuansa UNY, tanpa logo resmi)
BLUE = (67, 58, 155)
BLUE2 = (59, 134, 247)
DEEP = (49, 40, 127)
NAVY = (34, 28, 94)
SOFT = (243, 242, 251)
SOFT2 = (221, 218, 243)
GOLD = (255, 217, 26)
GOLD_L = (255, 236, 130)
INK = (34, 28, 94)
ORANGE = (255, 154, 60)
GREEN = (23, 178, 106)
RED = (232, 69, 60)
PURPLE = (0, 168, 190)
WHITE = (255, 255, 255)
MUTED = (90, 86, 130)

HEAD, HEAD7 = "Baloo2-800.ttf", "Baloo2-700.ttf"
BODY, BODY7, BODY8 = "Nunito-600.ttf", "Nunito-700.ttf", "Nunito-800.ttf"


# ---------------------------------------------------------------- dasar
@lru_cache(maxsize=None)
def font(name, size):
    return ImageFont.truetype(str(FONTS / name), int(size))


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def prog(t, t0, d):
    return clamp((t - t0) / d) if d > 0 else (1.0 if t >= t0 else 0.0)


def ease_out(p):
    return 1 - (1 - p) ** 3


def ease_in_out(p):
    return p * p * (3 - 2 * p)


def back(p, s=1.7):
    p -= 1
    return 1 + p * p * ((s + 1) * p + s)


def lerp(a, b, p):
    return a + (b - a) * p


def pop(t, t0, d=0.45):
    """Skala 0 -> 1 dengan sedikit pantulan (pop-up)."""
    return back(prog(t, t0, d)) if t >= t0 else 0.0


def bounce_y(p, h):
    """Lompatan parabola 0..1 -> tinggi."""
    return -4 * h * p * (1 - p)


@lru_cache(maxsize=None)
def load(path):
    return Image.open(path).convert("RGBA")


def resized(img, w=None, h=None, s=None):
    if s is not None:
        w, h = max(1, int(img.width * s)), max(1, int(img.height * s))
    elif w is not None and h is None:
        h = max(1, int(img.height * w / img.width))
    elif h is not None and w is None:
        w = max(1, int(img.width * h / img.height))
    return img.resize((max(1, int(w)), max(1, int(h))), Image.LANCZOS)


@lru_cache(maxsize=512)
def sprite(name, h=None, w=None):
    img = load(str(ILL / (name + ".png")))
    return resized(img, w=w, h=h) if (h or w) else img


def fade(img, op):
    if op >= 0.999:
        return img
    r = img.copy()
    r.putalpha(img.getchannel("A").point(lambda v: int(v * op)))
    return r


def paste(fr, spr, x, y, a="c", op=1.0, s=1.0, rot=0.0):
    if op <= 0.003 or s <= 0.01:
        return
    if abs(s - 1.0) > 1e-3:
        spr = spr.resize((max(1, int(spr.width * s)), max(1, int(spr.height * s))), Image.BILINEAR)
    if rot:
        spr = spr.rotate(rot, resample=Image.BICUBIC, expand=True)
    if op < 0.999:
        spr = fade(spr, op)
    w, h = spr.size
    px, py = {"c": (x - w / 2, y - h / 2), "b": (x - w / 2, y - h), "tl": (x, y), "l": (x, y - h / 2),
              "r": (x - w, y - h / 2), "t": (x - w / 2, y)}[a]
    fr.paste(spr, (int(round(px)), int(round(py))), spr)


def aa(w, h, fn, ss=3):
    im = Image.new("RGBA", (int(w * ss), int(h * ss)), (0, 0, 0, 0))
    fn(ImageDraw.Draw(im), ss)
    return im.resize((int(w), int(h)), Image.LANCZOS)


@lru_cache(maxsize=2048)
def rrect(w, h, r, fill, outline=None, ow=0, shadow=0, shadow_col=(14, 52, 130, 40)):
    pad = 30 if shadow else 0
    def f(d, ss):
        d.rounded_rectangle([pad * ss, pad * ss, (pad + w) * ss, (pad + h) * ss], r * ss, fill=fill,
                            outline=outline, width=int(ow * ss))
    im = aa(w + 2 * pad, h + 2 * pad, f)
    if shadow:
        from PIL import ImageFilter
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([pad, pad + shadow, pad + w, pad + h + shadow], r, fill=shadow_col)
        sh = sh.filter(ImageFilter.GaussianBlur(shadow * 0.9))
        sh.alpha_composite(im)
        im = sh
    return im


@lru_cache(maxsize=4096)
def txt(s, fname, size, fill, stroke=0, stroke_fill=(255, 255, 255)):
    f = font(fname, size)
    pad = 8 + stroke
    w = int(f.getlength(s)) + pad * 2
    h = int(size * 1.7) + pad
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad, int(size * 1.15)), s, font=f, fill=fill, anchor="ls",
                            stroke_width=stroke, stroke_fill=stroke_fill)
    return im, pad, int(size * 1.15)


def text(fr, s, x, y, fname, size, fill, anchor="l", op=1.0, s_=1.0, stroke=0, stroke_fill=(255, 255, 255), rot=0.0):
    """x,y = titik jangkar; y adalah garis dasar (baseline). s_/rot: skala/rotasi terhadap tengah teks."""
    im, pad, base = txt(s, fname, size, tuple(fill), stroke, tuple(stroke_fill))
    w = im.width - pad * 2
    ox = {"l": 0, "m": -w / 2, "r": -w}[anchor]
    if s_ != 1.0 or rot:
        cx = x + ox + w / 2
        cy = y - base + im.height / 2
        paste(fr, im, cx, cy, "c", op, s_, rot)
        return
    paste(fr, im, x + ox - pad, y - base, "tl", op)


def text_w(s, fname, size):
    return font(fname, size).getlength(s)


def wrap_text(s, fname, size, maxw):
    words, lines, cur = s.split(), [], ""
    f = font(fname, size)
    for w_ in words:
        cand = (cur + " " + w_).strip()
        if f.getlength(cand) <= maxw or not cur:
            cur = cand
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- latar
def _grad(c1, c2, diag=True):
    x = np.linspace(0, 1, W, dtype=np.float32)[None, :]
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    t = (x * 0.42 + y * 0.58) if diag else np.repeat(y, W, axis=1)
    arr = np.zeros((H, W, 3), np.float32)
    for i in range(3):
        arr[:, :, i] = c1[i] + (c2[i] - c1[i]) * t
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGB")


def lattice(w, h, color, alpha, cell=72, lw=3, gold=True, fade_to="right"):
    """Ornamen geometris sederhana: kisi belah ketupat dengan titik emas."""
    ss = 2
    im = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    n = (w + h) // cell + 3
    for k in range(-n, n):
        d.line([(k * cell * ss, 0), ((k + h / cell) * cell * ss, h * ss)], fill=color + (255,), width=lw * ss)
        d.line([(k * cell * ss, h * ss), ((k + h / cell) * cell * ss, 0)], fill=color + (255,), width=lw * ss)
    if gold:
        for i in range(0, w // cell + 2, 2):
            for j in range(0, h // cell + 2, 2):
                cx, cy = (i * cell + (cell // 2 if j % 4 == 2 else 0)) * ss, (j * cell) * ss
                if (i + j) % 6 == 0:
                    r = 9 * ss
                    d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=GOLD + (255,))
    im = im.resize((w, h), Image.LANCZOS)
    xs = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    m = {"right": xs + 0 * ys, "left": 1 - xs + 0 * ys, "top": 1 - ys + 0 * xs, "bottom": ys + 0 * xs}[fade_to]
    m = np.clip(m, 0, 1) ** 1.4 * alpha
    a = np.asarray(im.getchannel("A"), np.float32) / 255.0 * m
    im.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    return im


def footer_band(fr, idx, total, light=False):
    d = ImageDraw.Draw(fr)
    d.rectangle([0, 960, W, H], fill=NAVY if light else DEEP)
    d.rectangle([0, 960, W, 966], fill=GOLD)
    text(fr, "Media pembelajaran interaktif untuk siswa Sekolah Dasar", 96, 1019, BODY, 24, (205, 222, 250))
    text(fr, f"{idx + 1} / {total}", 1824, 1019, BODY7, 24, (255, 226, 120), "r")


def brand(fr, light=False):
    logo = load(str(ROOT / "assets" / "images" / "logo-uny.png"))
    paste(fr, resized(logo, h=66), 96, 57, "tl")
    text(fr, "Fun Learning", 183, 90, HEAD, 36, WHITE if light else DEEP)
    text(fr, "A D V E N T U R E", 184, 120, BODY7, 18, (255, 226, 120) if light else (116, 136, 165))


def pill(fr, label, right, y, light=False, h=57):
    f = font(BODY7, 26)
    w = int(f.getlength(label)) + 56
    if light:
        spr = rrect(w, h, h // 2, (255, 255, 255, 40), (255, 255, 255, 120), 3)
    else:
        spr = rrect(w, h, h // 2, SOFT + (255,), SOFT2 + (255,), 3)
    paste(fr, spr, right - w, y, "tl")
    text(fr, label, right - w / 2, y + h / 2 + 9, BODY7, 26, WHITE if light else DEEP, "m")


def kicker(fr, label, x, y, light=False, op=1.0):
    f = font(BODY7, 23)
    w = int(f.getlength(label)) + 46
    spr = rrect(w, 48, 24, ((255, 255, 255, 36) if light else SOFT + (255,)),
                ((255, 255, 255, 110) if light else SOFT2 + (255,)), 3)
    paste(fr, spr, x, y, "tl", op)
    text(fr, label, x + 23, y + 33, BODY7, 23, WHITE if light else DEEP, "l", op)


@lru_cache(maxsize=8)
def content_bg(idx, total, subject):
    fr = _grad((250, 253, 255), SOFT)
    la = lattice(760, 330, SOFT2, 0.95, 72, 3, True, "left")
    fr.paste(la, (1160, 0), la)
    lb = lattice(620, 300, SOFT2, 0.9, 72, 3, True, "right")
    fr.paste(lb, (0, 700), lb)
    d = ImageDraw.Draw(fr, "RGBA")
    d.ellipse([-270, 540, 450, 1230], fill=SOFT2 + (70,))
    d.ellipse([1560, -240, 2130, 330], fill=SOFT2 + (60,))
    # pita emas tipis di tepi kiri
    d.rectangle([0, 0, 14, 960], fill=BLUE)
    d.rectangle([14, 0, 20, 960], fill=GOLD)
    # elemen pendidikan samar
    paste(fr, fade(sprite("toga", w=210), 0.10), 1640, 800, "c", rot=-10)
    paste(fr, fade(sprite("pensil", w=170), 0.12), 880, 920, "c", rot=15)
    brand(fr)
    pill(fr, subject, 1824, 66)
    # panel putih untuk visual
    panel = rrect(834, 672, 51, (255, 255, 255, 255), SOFT2 + (255,), 3, shadow=14, shadow_col=BLUE + (36,))
    paste(fr, panel, 990 - 30, 222 - 30, "tl")
    d = ImageDraw.Draw(fr)
    d.rounded_rectangle([1032, 222, 1172, 232], 5, fill=GOLD)
    footer_band(fr, idx, total)
    return fr


@lru_cache(maxsize=4)
def hero_bg(idx, total, subject):
    fr = _grad(BLUE, DEEP)
    lt = lattice(W, H, (255, 255, 255), 0.10, 96, 3, True, "right")
    fr.paste(lt, (0, 0), lt)
    d = ImageDraw.Draw(fr, "RGBA")
    d.ellipse([-240, 570, 630, 1380], fill=(255, 255, 255, 26))
    d.ellipse([1230, -330, 2130, 570], fill=(255, 255, 255, 22))
    rnd = random.Random(7)
    for _ in range(34):
        x, y, r = rnd.randint(60, 1860), rnd.randint(40, 930), rnd.randint(2, 6)
        d.ellipse([x, y, x + r * 2, y + r * 2], fill=(255, 255, 255, 110))
    d.rectangle([0, 0, 14, 960], fill=GOLD)
    brand(fr, True)
    pill(fr, subject, 1824, 66, True)
    footer_band(fr, idx, total, True)
    return fr


# ---------------------------------------------------------------- efek
@lru_cache(maxsize=256)
def sparkle_spr(size, color=(255, 226, 120)):
    s = int(size)

    def f(d, ss):
        c = s * ss / 2
        pts = []
        for i in range(8):
            ang = -math.pi / 2 + i * math.pi / 4
            r = c if i % 2 == 0 else c * 0.22
            pts.append((c + r * math.cos(ang), c + r * math.sin(ang)))
        d.polygon(pts, fill=color + (255,))
    return aa(s, s, f)


def sparkles(fr, t, cx, cy, rx, ry, n=7, size=34, seed=1, color=(255, 226, 120), op=1.0):
    rnd = random.Random(seed)
    for i in range(n):
        ph = rnd.random() * 6.28
        px = cx + math.cos(ph + i) * rx * (0.5 + 0.5 * rnd.random())
        py = cy + math.sin(ph * 1.3 + i) * ry * (0.5 + 0.5 * rnd.random())
        tw = 0.5 + 0.5 * math.sin(t * 3.4 + ph * 3)
        if tw < 0.05:
            continue
        paste(fr, sparkle_spr(size, color), px, py, "c", op * tw, 0.6 + 0.6 * tw, rot=t * 40 * (1 if i % 2 else -1))


def sparkle_burst(fr, t, t0, cx, cy, r=140, n=10, size=40, dur=0.9):
    p = (t - t0) / dur
    if p < 0 or p > 1:
        return
    for i in range(n):
        ang = i * 2 * math.pi / n + 0.4
        rr = r * ease_out(p)
        paste(fr, sparkle_spr(size), cx + rr * math.cos(ang), cy + rr * math.sin(ang), "c", 1 - p, 1 - 0.4 * p, rot=p * 90)


class Confetti:
    COLORS = [GOLD, BLUE2, GREEN, ORANGE, RED, PURPLE, (255, 255, 255)]

    def __init__(self, n=140, seed=3, x0=0, x1=W, y0=-40, spread=520, fall=1.0):
        rnd = random.Random(seed)
        self.p = []
        for _ in range(n):
            self.p.append((rnd.uniform(x0, x1), y0 - rnd.uniform(0, spread), rnd.uniform(-60, 60),
                           rnd.uniform(260, 520) * fall, rnd.uniform(0, 6.28), rnd.uniform(-8, 8),
                           rnd.choice(self.COLORS), rnd.uniform(10, 20), rnd.uniform(0.0, 0.5)))

    def draw(self, fr, t, dur=3.2):
        if t < 0 or t > dur:
            return
        d = ImageDraw.Draw(fr)
        for x, y, vx, vy, rot, vr, col, sz, delay in self.p:
            tt = t - delay
            if tt < 0:
                continue
            px = x + vx * tt + math.sin(tt * 4 + rot) * 22
            py = y + vy * tt + 90 * tt * tt * 0.5
            if py > H + 20:
                continue
            a = rot + vr * tt
            w_, h_ = sz, sz * 0.55 * (0.4 + 0.6 * abs(math.cos(a * 1.7)))
            ca, sa = math.cos(a), math.sin(a)
            pts = [(px + dx * ca - dy * sa, py + dx * sa + dy * ca) for dx, dy in
                   ((-w_ / 2, -h_ / 2), (w_ / 2, -h_ / 2), (w_ / 2, h_ / 2), (-w_ / 2, h_ / 2))]
            d.polygon(pts, fill=col)


def letter_tile(ch, color, size, text_col=WHITE):
    return _letter_tile(ch, tuple(color), int(size), tuple(text_col))


@lru_cache(maxsize=256)
def _letter_tile(ch, color, size, text_col):
    def f(d, ss):
        d.ellipse([4 * ss, 4 * ss, (size - 4) * ss, (size - 4) * ss], fill=color + (255,), outline=(255, 255, 255, 255), width=4 * ss)
    im = aa(size, size, f)
    ImageDraw.Draw(im).text((size / 2, size * 0.60), ch, font=font(HEAD, int(size * 0.62)), fill=text_col, anchor="mm")
    return im


def ring_wave(fr, t, t0, cx, cy, r0=40, r1=200, n=3, color=GOLD, period=0.9, w=7, dur=3.0):
    if t < t0 or t > t0 + dur:
        return
    for i in range(n):
        p = ((t - t0) / period - i / n) % 1.0
        r = lerp(r0, r1, p)
        size = int(r * 2 + 20)
        spr = aa(size, size, lambda d, ss, r=r, s=size, p=p: d.ellipse(
            [(s / 2 - r) * ss, (s / 2 - r) * ss, (s / 2 + r) * ss, (s / 2 + r) * ss],
            outline=color + (int(255 * (1 - p)),), width=w * ss), 2)
        paste(fr, spr, cx, cy)


def check_sprite(size, color=WHITE, bg=GREEN):
    return _check(int(size), tuple(color), tuple(bg))


@lru_cache(maxsize=64)
def _check(size, color, bg):
    def f(d, ss):
        d.ellipse([2 * ss, 2 * ss, (size - 2) * ss, (size - 2) * ss], fill=bg + (255,))
        s = size * ss
        d.line([(s * 0.27, s * 0.52), (s * 0.43, s * 0.68), (s * 0.74, s * 0.34)], fill=color + (255,), width=int(size * 0.11 * ss), joint="curve")
    return aa(size, size, f)


# ---------------------------------------------------------------- maskot Huhu
class Huhu:
    """Rig maskot: badan, dua sayap (bisa berayun), kaki, wajah (ekspresi), paruh (bicara)."""
    PIV_L = (56, 142)     # pangkal sayap kiri (satuan SVG)
    PIV_R = (200, 148)    # pangkal sayap kanan

    def __init__(self):
        self.parts = {}

    def _part(self, name, hc):
        key = (name, hc)
        if key not in self.parts:
            img = load(str(HUHU / (name + ".png")))
            self.parts[key] = img.resize((int(hc * 260 / 300), hc), Image.LANCZOS)
        return self.parts[key]

    def _wing(self, name, hc, mirror):
        key = (name, hc, mirror)
        if key not in self.parts:
            from PIL import ImageOps
            im = self._part(name, hc)
            self.parts[key] = ImageOps.mirror(im) if mirror else im
        return self.parts[key]

    def layer(self, hc, expr="neutral", mouth=0, wl=0.0, wr=0.0, wl_mode="down", wr_mode="down"):
        u = hc / 300.0
        cw = int(hc * 260 / 300)
        img = self._part("base", hc).copy()

        def put_wing(mode, side, ang):
            if side == "L":
                if mode == "down":
                    wing, piv, a = self._wing("wingL", hc, False), (self.PIV_L[0] * u, self.PIV_L[1] * u), -ang
                else:
                    wing, piv, a = self._wing("wingR", hc, True), ((260 - self.PIV_R[0]) * u, self.PIV_R[1] * u), ang
            else:
                if mode == "down":
                    wing, piv, a = self._wing("wingL", hc, True), ((260 - self.PIV_L[0]) * u, self.PIV_L[1] * u), ang
                else:
                    wing, piv, a = self._wing("wingR", hc, False), (self.PIV_R[0] * u, self.PIV_R[1] * u), -ang
            if abs(a) > 0.3:
                R = int(95 * u) + 4
                px_, py_ = int(piv[0]), int(piv[1])
                box = (px_ - R, py_ - R, px_ + R, py_ + R)
                crop = wing.crop(box)
                crop = crop.rotate(a, center=(R, R), resample=Image.BILINEAR)
                tmp = Image.new("RGBA", img.size, (0, 0, 0, 0))
                tmp.paste(crop, (px_ - R, py_ - R))
                img.alpha_composite(tmp)
            else:
                img.alpha_composite(wing)
        put_wing(wl_mode, "L", wl)
        put_wing(wr_mode, "R", wr)
        img.alpha_composite(self._part("feet", hc))
        img.alpha_composite(self._part("face_" + expr, hc))
        img.alpha_composite(self._part(f"beak_{int(mouth)}", hc))
        return img

    def draw(self, fr, cx, by, hc, st):
        """cx,by = tengah-bawah maskot (telapak kaki). st = dict pose."""
        hc = int(hc)
        lay = self.layer(hc, st.get("expr", "neutral"), st.get("mouth", 0), st.get("wl", 0), st.get("wr", 0),
                         st.get("wl_mode", "down"), st.get("wr_mode", "down"))
        u = hc / 300.0
        sx, sy = st.get("sx", 1.0), st.get("sy", 1.0)
        if abs(sx - 1) > 0.004 or abs(sy - 1) > 0.004:
            lay = lay.resize((max(1, int(lay.width * sx)), max(1, int(lay.height * sy))), Image.BILINEAR)
        ax, ay = 130 * u * sx, 284 * u * sy
        tilt = st.get("tilt", 0.0)
        if abs(tilt) > 0.9:
            pad = int(hc * 0.25)
            big = Image.new("RGBA", (lay.width + pad * 2, lay.height + pad), (0, 0, 0, 0))
            big.paste(lay, (pad, pad))
            ax, ay = ax + pad, ay + pad
            lay = big.rotate(tilt, center=(ax, ay), resample=Image.BICUBIC)
        # bayangan di lantai
        lift = max(0.0, -st.get("dy", 0.0))
        sh_w = int(hc * 0.52 * (1 - min(0.35, lift / 500)))
        sh = rrect(sh_w, 26, 13, (10, 42, 102, int(46 * (1 - min(0.5, lift / 400)))))
        paste(fr, sh, cx + st.get("dx", 0), by + 4, "c")
        if st.get("op", 1.0) < 0.999:
            lay = fade(lay, st["op"])
        px = cx + st.get("dx", 0) - ax
        py = by + st.get("dy", 0) - ay
        fr.paste(lay, (int(round(px)), int(round(py))), lay)


MASCOT = Huhu()


def blinking(t, seed=0.0):
    return ((t + seed * 1.37) % 3.7) < 0.15


def mouth_level(t, speaking):
    if not speaking:
        return 0
    v = abs(math.sin(t * 10.2)) * 0.62 + abs(math.sin(t * 6.1 + 1.3)) * 0.38
    return int(v * 3.99)


def pose(t, expr="neutral", speaking=False, gesture="none", seed=0.0, g_t0=0.0, point=62.0):
    """Hitung pose maskot (idle selalu hidup, ditambah gestur)."""
    st = dict(expr=expr, mouth=mouth_level(t, speaking))
    if expr in ("neutral", "happy") and blinking(t, seed):
        st["expr"] = "blink"
    ph = t * 2.4 + seed
    st["dy"] = math.sin(ph) * 5.0
    st["sy"] = 1 + math.sin(ph) * 0.012
    st["sx"] = 1 - math.sin(ph) * 0.006
    st["wl"], st["wr"] = 4 + 3 * math.sin(ph + 1), 3 + 3 * math.sin(ph + 2)
    st["wl_mode"], st["wr_mode"] = "down", "down"
    st["tilt"] = math.sin(t * 1.3 + seed) * 1.2
    g = t - g_t0
    if gesture == "wave":
        st["wr_mode"], st["wr"] = "up", 4 + 22 * math.sin(t * 8.0)
        st["tilt"] += 2.0 * math.sin(t * 4)
    elif gesture == "explain":
        st["wl"] = 10 + 12 * math.sin(t * 4.4)
        st["wr"] = 8 + 12 * math.sin(t * 4.4 + 2.2)
    elif gesture == "point":
        p = ease_out(prog(g, 0, 0.5))
        st["wr_mode"], st["wr"] = "up", lerp(150, point, p) + 3 * math.sin(t * 5) * p
        if p < 0.5:
            st["wr_mode"] = "up"
    elif gesture == "cheer":
        st["wl_mode"], st["wr_mode"] = "up", "up"
        st["wl"], st["wr"] = 8 + 18 * math.sin(t * 9), 8 + 18 * math.sin(t * 9 + 1.5)
        st["dy"] = -abs(math.sin(t * 6.0)) * 24
        st["tilt"] = math.sin(t * 6.0) * 4
    elif gesture == "think":
        st["tilt"] = 7 + math.sin(t * 1.5) * 2
        st["wl"] = 6
    elif gesture == "confused":
        st["tilt"] = -6 + math.sin(t * 6) * 3
        st["wl"], st["wr"] = 16 + 6 * math.sin(t * 6), 16 + 6 * math.sin(t * 6 + 1)
    return st


def enter_pose(st, t, t0=0.15, d=0.9, from_dx=-520, hop=90):
    """Maskot masuk adegan (melompat dari tepi layar)."""
    p = prog(t, t0, d)
    if p >= 1:
        # sedikit squash ketika mendarat
        k = prog(t, t0 + d, 0.35)
        if k < 1:
            sq = math.sin(k * math.pi) * (1 - k) * 0.10
            st["sy"] = st.get("sy", 1) * (1 - sq)
            st["sx"] = st.get("sx", 1) * (1 + sq * 0.8)
        return st
    e = ease_in_out(p)
    st["dx"] = from_dx * (1 - e)
    st["dy"] = st.get("dy", 0) + bounce_y((p * 3) % 1.0, hop) * (1 - p)
    st["tilt"] = st.get("tilt", 0) + 10 * (1 - p) * math.sin(p * 18)
    st["wr_mode"], st["wr"] = "up", 10 * math.sin(p * 24)
    return st


def exit_pose(st, t, t0, d=1.0, to_dx=700, hop=70):
    p = prog(t, t0, d)
    if p <= 0:
        return st
    e = ease_in_out(p)
    st["dx"] = to_dx * e
    st["dy"] = st.get("dy", 0) + bounce_y((p * 4) % 1.0, hop)
    st["tilt"] = st.get("tilt", 0) - 6 * math.sin(p * 20)
    st["wr_mode"], st["wr"] = "up", 20 * math.sin(p * 30)
    return st


# ---------------------------------------------------------------- gelembung dialog
@lru_cache(maxsize=1024)
def bubble_img(say, width, nshown, name="Huhu", fsize=36, tail="left"):
    lines = wrap_text(say, BODY7, fsize, width - 84)
    lh = int(fsize * 1.34)
    bh = len(lines) * lh + 66
    pad = 40
    im = Image.new("RGBA", (width + pad * 2, bh + pad * 2), (0, 0, 0, 0))
    box = rrect(width, bh, 38, WHITE + (255,), BLUE + (255,), 6, shadow=10, shadow_col=DEEP + (60,))
    im.alpha_composite(box, (pad - 30, pad - 30))
    d = ImageDraw.Draw(im)
    ty = pad + bh - 74
    if tail == "left":
        x0, xt, xw = pad + 3, pad - 36, pad + 3
    else:
        x0, xt, xw = pad + width - 3, pad + width + 36, pad + width - 3
    d.polygon([(x0, ty - 20), (xt, ty + 10), (x0, ty + 30)], fill=WHITE + (255,))
    d.line([(x0, ty - 20), (xt, ty + 10), (x0, ty + 30)], fill=BLUE + (255,), width=6, joint="curve")
    d.line([(xw, ty - 15), (xw, ty + 26)], fill=WHITE + (255,), width=9)
    tw = int(font(BODY8, 22).getlength(name)) + 38
    im.alpha_composite(rrect(tw, 38, 19, GOLD + (255,)), (pad + 26, pad - 24))
    d.text((pad + 26 + 19, pad + 4), name, font=font(BODY8, 22), fill=NAVY, anchor="ls")
    cnt, y = 0, pad + 44
    for ln in lines:
        x = pad + 36
        for w_ in ln.split():
            if cnt < nshown:
                d.text((x, y + int(fsize * 0.78)), w_, font=font(BODY7, fsize), fill=INK, anchor="ls")
            x += font(BODY7, fsize).getlength(w_ + " ")
            cnt += 1
        y += lh
    return im, pad, bh


def draw_bubble(fr, say, x_left, y_bottom, t, t0, speak_dur, width=500, name="Huhu", tail="left"):
    """Gelembung dialog; teks muncul kata demi kata. (x_left, y_bottom) = tepi kiri & dasar kotak."""
    if t < t0 or not say:
        return
    n_words = len(say.split())
    shown = int(clamp((t - t0 - 0.12) / max(0.6, speak_dur * 0.9)) * n_words + 0.999)
    im, pad, bh = bubble_img(say, width, max(0, min(n_words, shown)), name, 36, tail)
    p = prog(t, t0, 0.38)
    s = back(p)
    px, py = x_left - pad, y_bottom - bh - pad
    if p >= 1:
        paste(fr, im, px, py, "tl")
    else:
        # muncul dari dekat maskot (pojok kiri-bawah gelembung)
        cx, cy = x_left, y_bottom
        paste(fr, im, cx + (px + im.width / 2 - cx) * s, cy + (py + im.height / 2 - cy) * s, "c", clamp(p * 2), max(0.05, s))


# ---------------------------------------------------------------- suara: efek & musik
def _tone(f0, dur, vol=0.4, decay=7.0, f1=None, harm=(1.0,), att=0.004):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.linspace(f0, f1 if f1 else f0, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(a * np.sin(ph * (k + 1)) for k, a in enumerate(harm))
    env = np.exp(-t * decay) * np.minimum(1.0, t / att)
    return (y * env * vol).astype(np.float32)


def _noise(dur, vol=0.3, lo=300, hi=4000, seed=1):
    from scipy.signal import butter, lfilter
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    y = lfilter(b, a, x)
    y /= (np.max(np.abs(y)) or 1)
    return (y * vol).astype(np.float32)


def _mix_at(buf, clip, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    e = min(len(buf), i + len(clip))
    buf[i:e] += clip[:e - i]


def _seq(notes, gap, **kw):
    total = int((len(notes) * gap + 1.4) * SR)
    out = np.zeros(total, np.float32)
    for k, f in enumerate(notes):
        _mix_at(out, _tone(f, 0.9, **kw), k * gap)
    return out


def _sum(*arrs):
    n = max(len(a) for a in arrs)
    out = np.zeros(n, np.float32)
    for a in arrs:
        out[:len(a)] += a
    return out


def build_sfx():
    S = {}
    S["pop"] = _sum(_tone(460, 0.13, 0.42, 26, 900), _tone(1500, 0.04, 0.12, 60))
    S["pop2"] = _tone(640, 0.12, 0.40, 26, 1150)
    S["whoosh"] = _noise(0.6, 0.30, 500, 3500) * np.sin(np.linspace(0, np.pi, int(0.6 * SR))) ** 2
    S["ding"] = _sum(_tone(1318, 0.9, 0.34, 4.5, harm=(1, 0.35)), _tone(1976, 0.7, 0.16, 6))
    S["select"] = _sum(_tone(720, 0.09, 0.30, 22), _tone(1080, 0.08, 0.24, 24))
    S["tick"] = _tone(1800, 0.03, 0.22, 90)
    S["boing"] = _tone(240, 0.30, 0.34, 7, 560, harm=(1, 0.3))
    S["wrong"] = np.concatenate([_tone(330, 0.22, 0.30, 7, 262, harm=(1, 0.25)), np.zeros(int(0.06 * SR), np.float32),
                                 _tone(262, 0.30, 0.30, 6, 208, harm=(1, 0.25))])
    S["chime"] = _seq([659, 784, 988], 0.10, vol=0.30, decay=5, harm=(1, 0.3))
    S["success"] = _seq([523, 659, 784, 1047, 1319], 0.10, vol=0.30, decay=4, harm=(1, 0.3))
    pl = np.zeros(int(1.2 * SR), np.float32)
    for k, f in enumerate((2093, 2637, 3136, 2349)):
        _mix_at(pl, _tone(f, 0.35, 0.16, 9), 0.05 + k * 0.09)
    S["sparkle"] = pl
    sc = np.zeros(int(0.7 * SR), np.float32)
    for k in range(7):
        _mix_at(sc, _noise(0.06, 0.28, 1500, 5500, seed=k + 3) * np.hanning(int(0.06 * SR)), k * 0.09)
    S["scribble"] = sc
    cf = _noise(0.5, 0.35, 800, 6000, 9)
    cf *= np.exp(-np.arange(len(cf)) / SR * 7).astype(np.float32)
    S["confetti"] = _sum(cf, _tone(300, 0.2, 0.3, 14, 120))
    S["cheer"] = _seq([523, 659, 784, 1047, 784, 1047, 1319], 0.08, vol=0.28, decay=4, harm=(1, 0.3))
    return S


SFX = None


def sfx(name):
    global SFX
    if SFX is None:
        SFX = build_sfx()
    return SFX[name]


def make_music(duration):
    """Musik latar edukatif riang: akor C-G-Am-F, bas, arpeggio, dan shaker lembut."""
    total = int(duration * SR)
    out = np.zeros(total + SR, np.float32)
    bpm = 100.0
    beat = 60.0 / bpm
    chords = [(261.63, 329.63, 392.00), (196.00, 246.94, 293.66), (220.00, 261.63, 329.63), (174.61, 220.00, 261.63)]
    roots = [130.81, 98.00, 110.00, 87.31]
    melody = [[0, 2, 1, 2, 0, 1, 2, 1], [1, 2, 1, 0, 2, 1, 0, 1], [0, 1, 2, 1, 0, 2, 1, 2], [2, 1, 0, 1, 2, 1, 2, 0]]
    bar = 4 * beat
    nb = int(duration / bar) + 2
    for b in range(nb):
        t0 = b * bar
        ch = chords[b % 4]
        pad = np.zeros(int(bar * SR), np.float32)
        tt = np.arange(len(pad)) / SR
        env = np.minimum(1, tt / 0.25) * np.minimum(1, (bar - tt) / 0.35)
        for f in ch:
            pad += np.sin(2 * np.pi * f * tt) * 0.03
        _mix_at(out, pad * env, t0)
        for k in range(4):                       # bas pada tiap ketukan
            _mix_at(out, _tone(roots[b % 4], beat * 0.9, 0.11, 6.5, harm=(1, 0.5)), t0 + k * beat)
        for k in range(8):                       # arpeggio pluck (not 1/8)
            f = ch[melody[b % 4][k]] * 2
            _mix_at(out, _tone(f, 0.42, 0.075, 8.5, harm=(1, 0.25)), t0 + k * beat / 2)
        for k in range(8):                       # shaker pada ketukan lemah
            if k % 2:
                _mix_at(out, _noise(0.05, 0.05, 5000, 9000, seed=k + b) * np.hanning(int(0.05 * SR)), t0 + k * beat / 2)
    out = out[:total]
    peak = float(np.max(np.abs(out))) or 1.0
    out = out / peak * 0.20
    fade_n = int(1.5 * SR)
    out[:fade_n] *= np.linspace(0, 1, fade_n, dtype=np.float32)
    out[-fade_n:] *= np.linspace(1, 0, fade_n, dtype=np.float32)
    return out


# ---------------------------------------------------------------- suara: narasi (TTS)
_GTTS_DEAD = False
IMAGEIO_FF = None


def ffmpeg_exe():
    global IMAGEIO_FF
    if IMAGEIO_FF is None:
        try:
            import imageio_ffmpeg
            IMAGEIO_FF = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:                      # noqa: BLE001
            IMAGEIO_FF = "ffmpeg"
    return IMAGEIO_FF


def _digest(text):
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:10]


def _find_mp3(text):
    dg = _digest(text)
    for p in TTS.glob(f"*{dg}.mp3"):
        if p.stat().st_size > 1000:
            return p
    return None


def _try_gtts(text):
    """Buat narasi baru dengan gTTS bila tersedia dan ada internet."""
    global _GTTS_DEAD
    if _GTTS_DEAD:
        return None
    try:
        from gtts import gTTS
    except Exception:                          # noqa: BLE001
        _GTTS_DEAD = True
        return None
    path = TTS / f"membaca-baru-{_digest(text)}.mp3"
    for attempt in range(3):
        try:
            gTTS(text=text, lang="id", slow=False).save(str(path))
            if path.stat().st_size > 1000:
                return path
        except Exception:                      # noqa: BLE001
            time.sleep(1.2 + attempt)
    _GTTS_DEAD = True                          # offline: jangan coba lagi
    return None


_AUDIO_CACHE = {}


def narration(text):
    """Kembalikan (array float32 mono SR, sumber) atau (None, None) jika suara tidak tersedia."""
    if text in _AUDIO_CACHE:
        return _AUDIO_CACHE[text]
    mp3 = _find_mp3(text) or _try_gtts(text)
    res = (None, None)
    if mp3 is not None:
        AUDIO.mkdir(parents=True, exist_ok=True)
        wav = AUDIO / f"{mp3.stem}-hi.wav"
        if not wav.exists():
            af = f"asetrate={int(SR * PITCH)},aresample={SR},atempo={1 / PITCH:.5f}"
            subprocess.run([ffmpeg_exe(), "-y", "-i", str(mp3), "-ac", "1", "-ar", str(SR), "-af", af, str(wav)],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with wave.open(str(wav), "rb") as fh:
            data = fh.readframes(fh.getnframes())
        res = (np.frombuffer(data, np.int16).astype(np.float32) / 32768.0, "tts")
    _AUDIO_CACHE[text] = res
    return res


def estimate_speech(text):
    return max(1.6, len(text.split()) * 0.42)


# ================================================================ B. ADEGAN
class Beat:
    """Satu 'ketukan' adegan: satu dialog Huhu (opsional) + animasi pada rentang waktunya."""

    def __init__(self, key, say="", dur=3.0, clips=()):
        self.key, self.say, self.min, self.clips = key, say, dur, tuple(clips)
        self.start, self.d, self.speech, self.audio = 0.0, dur, 0.0, None

    def resolve(self):
        self.audio, _ = narration(self.say) if self.say else (None, None)
        self.speech = (len(self.audio) / SR) if self.audio is not None else (estimate_speech(self.say) if self.say else 0.0)
        self.d = max(self.min, self.speech + 0.85) if self.say else self.min


class Scene:
    def __init__(self, name, kind, kicker_s, title, body, beats, draw, sfx_fn):
        self.name, self.kind, self.kicker, self.title, self.body = name, kind, kicker_s, title, body
        self.beats, self.draw, self.sfx_fn = beats, draw, sfx_fn
        self.D, self.events = 0.0, []

    def resolve(self):
        t = 0.0
        for b in self.beats:
            b.resolve()
            b.start = t
            t += b.d
        self.D = t
        self.events = self.sfx_fn(self)


class Ctx:
    def __init__(self, scene, t, idx, total):
        self.scene, self.t, self.idx, self.total = scene, t, idx, total
        i = 0
        for k, b in enumerate(scene.beats):
            if b.start <= t:
                i = k
        self.i = i
        self.beat = scene.beats[i]

    def bs(self, k):
        return self.scene.beats[k].start

    def lt(self, k):
        return self.t - self.scene.beats[k].start

    @property
    def speaking(self):
        lt = self.t - self.beat.start
        return bool(self.beat.say) and 0.3 <= lt <= 0.3 + self.beat.speech


def left_text(fr, c, kicker_s, title, body, hero=False):
    t = c.t
    ky, ts, tb, bs, bb, bw, lh = (232, 117, 400, 41, 488, 990, 56) if hero else (207, 81, 350, 38, 410, 780, 52)
    kicker(fr, kicker_s, 132, ky, light=hero, op=clamp((t - 0.15) / 0.4))
    x = 132
    f = font(HEAD, ts)
    for i, w_ in enumerate(title.split()):
        t0 = 0.35 + 0.16 * i
        if t >= t0:
            s = pop(t, t0, 0.5)
            text(fr, w_, x, tb - 10 * (1 - clamp(s)), HEAD, ts, WHITE if hero else DEEP, "l", op=clamp(s * 1.5), s_=max(0.02, s) if s < 0.999 else 1.0)
        x += f.getlength(w_ + " ")
    for i, ln in enumerate(wrap_text(body, BODY, bs, bw)):
        op = clamp((t - 0.95 - 0.22 * i) / 0.4)
        if op > 0:
            text(fr, ln, 132, bb + i * lh + (1 - op) * 10, BODY, bs, (235, 244, 255) if hero else (70, 64, 120), "l", op)


def corner_huhu(fr, c, expr="happy", gesture="explain", g_t0=0.0, seed=0.0, enter=True, hc=420, cx=250, by=935):
    st = pose(c.t, expr, c.speaking, gesture, seed, g_t0)
    if enter:
        st = enter_pose(st, c.t)
    MASCOT.draw(fr, cx, by, hc, st)


def corner_bubble(fr, c, x_left=420, y_bottom=912, width=500, tail="left"):
    b = c.beat
    if b.say:
        draw_bubble(fr, b.say, x_left, y_bottom, c.t, b.start + 0.3, b.speech, width, "Huhu", tail)


@lru_cache(maxsize=32)
def disc_sprite(r, alpha=238):
    return aa(2 * r + 20, 2 * r + 20, lambda d, ss: d.ellipse([10 * ss, 10 * ss, (2 * r + 10) * ss, (2 * r + 10) * ss], fill=(255, 255, 255, alpha)), 2)


@lru_cache(maxsize=8)
def dashed_ring(r, n=36, width=7, alpha=140):
    sz = 2 * r + 40

    def f(d, ss):
        c = sz * ss / 2
        for i in range(n):
            a0 = i * 2 * math.pi / n
            a1 = a0 + math.pi / n * 0.8
            d.arc([c - r * ss, c - r * ss, c + r * ss, c + r * ss], math.degrees(a0), math.degrees(a1), fill=(255, 255, 255, alpha), width=width * ss)
    return aa(sz, sz, f, 2)


@lru_cache(maxsize=8)
def rays_sprite(r, n=14, alpha=80):
    sz = 2 * r

    def f(d, ss):
        c = sz * ss / 2
        for i in range(n):
            a = i * 2 * math.pi / n
            w_ = math.pi / n * 0.55
            d.polygon([(c, c), (c + r * ss * math.cos(a - w_), c + r * ss * math.sin(a - w_)),
                       (c + r * ss * math.cos(a + w_), c + r * ss * math.sin(a + w_))], fill=GOLD_L + (alpha,))
    return aa(sz, sz, f, 2)


@lru_cache(maxsize=128)
def tile_sprite(txt_, color, h=150, size=78, minw=150):
    f = font(HEAD, size)
    w = max(minw, int(f.getlength(txt_)) + 64)
    dark = tuple(int(v * 0.6) for v in color)
    im = Image.new("RGBA", (w + 20, h + 30), (0, 0, 0, 0))
    im.alpha_composite(rrect(w, h - 10, 30, dark + (255,)), (10, 20))
    im.alpha_composite(rrect(w, h - 10, 30, color + (255,), (255, 255, 255, 255), 4), (10, 10))
    ImageDraw.Draw(im).text((10 + w / 2, 10 + (h - 10) / 2 + 2), txt_, font=f, fill=WHITE, anchor="mm")
    return im


def sfx_at(events, t, name, gain=1.0):
    events.append((t, name, gain))


# ---------------------------------------------------------------- Adegan 1: pembukaan
INTRO_SAY = "Halo teman! Aku Huhu. Hari ini kita belajar membaca. Membaca itu seru, lo!"


def sfx_title(sc):
    ev = []
    sfx_at(ev, 0.15, "whoosh", 0.8)
    for k in range(5):
        sfx_at(ev, 0.6 + 0.18 * k, "pop2", 0.5)
    sfx_at(ev, 1.6, "boing", 0.7)
    sfx_at(ev, 1.65, "sparkle", 0.8)
    sfx_at(ev, sc.beats[1].start + 0.3, "sparkle", 0.6)
    sfx_at(ev, sc.beats[2].start + 0.3, "chime", 0.7)
    return ev


def draw_title(fr, c):
    t = c.t
    left_text(fr, c, c.scene.kicker, c.scene.title, c.scene.body, hero=True)
    cx, cy = 1533, 575
    paste(fr, disc_sprite(300), cx, cy, "c", 1, pop(t, 0.1, 0.7))
    if t > 0.3:
        paste(fr, dashed_ring(318), cx, cy, "c", clamp((t - 0.3) / 0.6), 1.0, rot=-t * 8)
    # huruf melayang di sekitar maskot
    spots = [("a", BLUE, -265, -215), ("i", ORANGE, 255, -230), ("u", GREEN, -310, 20), ("e", PURPLE, 305, 30),
             ("o", RED, -215, 235), ("B", GOLD, 235, 245), ("K", BLUE2, 0, -330)]
    for k, (ch, col, dx, dy) in enumerate(spots):
        t0 = 0.6 + 0.18 * k
        if t < t0:
            continue
        s = pop(t, t0, 0.5)
        bob = math.sin(t * 1.9 + k * 1.1) * 16
        sz = 104 if k < 5 else 92
        paste(fr, letter_tile(ch, col if col != GOLD else (232, 160, 0), sz), cx + dx, cy + dy + bob, "c", clamp(s * 1.4), max(0.02, s), rot=math.sin(t * 1.4 + k) * 8)
    # buku terbuka + sinar emas
    if t > 1.2:
        s = pop(t, 1.2, 0.9)
        paste(fr, rays_sprite(300, 14, 120), cx, cy, "c", clamp(s) * 0.9, 1.0, rot=t * 9)
    # maskot masuk lalu melambai
    st = pose(t, "happy", c.speaking, "wave" if t < 1.4 or c.i >= 1 else "explain", 0.5)
    if c.i >= 2:
        st = pose(t, "happy", c.speaking, "explain", 0.5)
    st = enter_pose(st, t, 0.12, 1.1, from_dx=760, hop=120)
    MASCOT.draw(fr, cx, 800, 560, st)
    if t > 1.5:
        s = pop(t, 1.5, 0.7)
        bk = sprite("bukubuka", w=380)
        paste(fr, bk, cx, 800, "c", clamp(s * 1.5), max(0.02, s))
    sparkle_burst(fr, t, 1.65, cx, 700, 250, 12, 46, 1.1)
    sparkles(fr, t, cx, cy, 300, 280, 8, 36, 4, op=clamp((t - 1.8) / 0.6))
    corner_bubble(fr, c, 132, 900, 760, "right")


# ---------------------------------------------------------------- Adegan 2: huruf vokal
VOW = [("a", "apel", BLUE2), ("i", "ikan", ORANGE), ("u", "ular", GREEN), ("e", "ember", PURPLE), ("o", "obat", RED)]
VOW_SAY = "Huruf vokal ada lima, yaitu a, i, u, e, dan o. Ayo ucapkan bersama: a, i, u, e, o."
VOW_FIRST = [3.42, 4.08, 4.82, 5.44, 6.55]      # saat tiap huruf disebut pada kalimat pertama
VOW_SECOND = [8.48, 9.20, 9.84, 10.52, 11.10]   # saat tiap huruf diucapkan bersama
VOW_LINES = [
    ("Huruf A, seperti pada apel. Ayo ucapkan bersamaku: A!", "Hebat!"),
    ("Huruf I, seperti pada ikan. Ayo ucapkan: I!", "Bagus sekali!"),
    ("Huruf U, seperti pada ular. Ayo ucapkan: U!", "Pintar!"),
    ("Huruf E, seperti pada ember. Ayo ucapkan: E!", "Mantap!"),
    ("Huruf O, seperti pada obat. Ayo ucapkan: O!", "Keren sekali!"),
]
VOW_CLIP_T = {"a": (8.40, 8.92), "i": (9.14, 9.64), "u": (9.78, 10.30), "e": (10.45, 10.98), "o": (11.04, 11.56)}


def vowel_beats():
    bs = [Beat("intro", VOW_SAY, 13.0)]
    for k, (ch, w_, col) in enumerate(VOW):
        bs.append(Beat(f"v{k}", VOW_LINES[k][0], 7.6, clips=[(1.45, "vokal_" + ch)]))
        bs.append(Beat(f"p{k}", VOW_LINES[k][1], 2.4))
    bs.append(Beat("recap", "Huruf vokal itu a, i, u, e, o. Ingat, ya!", 6.2))
    return bs


def sfx_vowels(sc):
    ev = []
    for k in range(5):
        sfx_at(ev, VOW_FIRST[k], "pop2", 0.55)
        sfx_at(ev, VOW_SECOND[k], "tick", 0.7)
    for k in range(5):
        b0 = sc.beats[1 + 2 * k].start
        sfx_at(ev, b0, "whoosh", 0.45)
        sfx_at(ev, b0 + 0.25, "pop", 0.8)
        sfx_at(ev, b0 + 0.6, "boing", 0.6)
        sfx_at(ev, b0 + 1.0, "sparkle", 0.5)
        sfx_at(ev, b0 + 5.0, "select", 0.7)
        pb = sc.beats[2 + 2 * k].start
        sfx_at(ev, pb + 0.05, "chime", 0.8)
        sfx_at(ev, pb + 0.1, "sparkle", 0.6)
    rb = sc.beats[11].start
    for k in range(5):
        sfx_at(ev, rb + 0.5 + 0.35 * k, "pop2", 0.6)
    sfx_at(ev, rb + 2.6, "success", 0.8)
    return ev


def draw_vowels(fr, c):
    t = c.t
    left_text(fr, c, c.scene.kicker, c.scene.title, c.scene.body)
    X0, Y0 = 1035, 262
    # baris huruf vokal
    active = -1
    if 1 <= c.i <= 10:
        active = (c.i - 1) // 2
    for k, (ch, w_, col) in enumerate(VOW):
        cx, cy = 1109 + 148.8 * k, 352
        t_in = (VOW_FIRST[k] - 0.2) if c.i == 0 else -1
        if c.i == 0 and t < t_in:
            continue
        s = pop(t, t_in, 0.45) if c.i == 0 else 1.0
        pulse = 1.0
        if c.i == 0 and VOW_SECOND[k] - 0.05 <= t <= VOW_SECOND[k] + 0.55:
            pulse = 1 + 0.22 * math.sin(prog(t, VOW_SECOND[k] - 0.05, 0.6) * math.pi)
        if k == active:
            pulse = 1.12 + 0.05 * math.sin(t * 7)
            paste(fr, aa(150, 150, lambda d, ss: d.ellipse([6 * ss, 6 * ss, 144 * ss, 144 * ss], outline=GOLD + (255,), width=7 * ss), 2), cx, cy)
        if c.i == 11:
            rb = c.lt(11)
            pulse = 1 + 0.2 * max(0, math.sin((rb - 0.5 - 0.35 * k) * 6.0)) * (1 if 0.5 + 0.35 * k <= rb <= 0.5 + 0.35 * k + 0.55 else 0)
        paste(fr, letter_tile(ch, col, 120), cx, cy, "c", 1, max(0.02, s) * pulse)
        if k <= active or c.i == 11:
            paste(fr, check_sprite(34), cx + 44, cy + 44, "c", 1)
    # kartu sorotan
    card = rrect(714, 372, 36, SOFT + (255,), GOLD + (255,), 5)
    paste(fr, card, 1050, 462, "tl")
    if c.i == 0:
        a = clamp((t - 8.3) / 0.6)
        text(fr, "Huruf hidup bisa dibunyikan sendiri.", 1407, 660, BODY8, 40, DEEP, "m", clamp((t - 1.0) / 0.6) * (1 - a))
        if a > 0:
            paste(fr, sparkle_spr(50), 1407, 560, "c", a)
            text(fr, "a   i   u   e   o", 1407, 690, HEAD, 92, DEEP, "m", a)
    elif 1 <= c.i <= 10:
        k = (c.i - 1) // 2
        ch, w_, col = VOW[k]
        lt = c.t - c.bs(1 + 2 * k)
        # huruf besar
        s = pop(lt, 0.25, 0.55)
        if lt >= 0.25:
            glow = 1 + 0.05 * math.sin(lt * 6)
            text(fr, f"{ch.upper()}{ch}", 1235, 712, HEAD, 214, col, "m", clamp(s * 1.4), max(0.02, s) * glow)
        # gambar benda jatuh memantul
        pt = prog(lt, 0.55, 0.65)
        if lt >= 0.55:
            by = 640 - 230 * (1 - (ease_out(pt))) + (math.sin(pt * math.pi * 3) * 26 * (1 - pt) if pt < 1 else 0)
            paste(fr, sprite(w_, h=250), 1580, by + math.sin(lt * 2.4) * 7, "c", clamp(pt * 2))
        if lt >= 1.1:
            s2 = pop(lt, 1.1, 0.45)
            x0 = 1580 - text_w(w_, HEAD, 58) / 2
            text(fr, w_[0], x0, 800, HEAD, 70, col, "l", clamp(s2 * 1.5), max(0.02, s2) if s2 < 0.999 else 1.0)
            text(fr, w_[1:], x0 + text_w(w_[0], HEAD, 70), 800, HEAD, 58, INK, "l", clamp(s2 * 1.5))
        sparkle_burst(fr, t, c.bs(1 + 2 * k) + 1.0, 1580, 620, 170, 10, 40, 1.0)
        # giliranmu
        if 5.0 <= lt:
            sp = pop(lt, 5.0, 0.4)
            ring_wave(fr, t, c.bs(1 + 2 * k) + 5.0, 1235, 650, 110, 230, 3, col, 0.9, 7, 2.6)
            paste(fr, rrect(236, 54, 27, GOLD + (255,)), 1176, 504, "c", clamp(sp), max(0.02, sp) * (1 + 0.05 * math.sin(lt * 8)))
            text(fr, "Giliranmu!", 1176, 523, HEAD7, 31, NAVY, "m", clamp(sp))
        if c.i == 2 * k + 2:
            sparkle_burst(fr, t, c.bs(2 + 2 * k) + 0.05, 1235, 650, 200, 12, 46, 1.0)
    else:
        # rekap: lima gambar berjajar
        rb = c.lt(11)
        for k, (ch, w_, col) in enumerate(VOW):
            t0 = 0.5 + 0.35 * k
            if rb < t0:
                continue
            s = pop(rb, t0, 0.5)
            x = 1050 + 714 * (k + 0.5) / 5
            paste(fr, sprite(w_, h=132), x, 625 + math.sin(rb * 2.5 + k) * 6, "c", clamp(s * 1.5), max(0.02, s))
            text(fr, ch.upper() + ch, x, 760, HEAD, 56, col, "m", clamp(s * 1.5), max(0.02, s))
            text(fr, w_, x, 800, BODY7, 28, INK, "m", clamp(s * 1.5))
        sparkles(fr, t, 1407, 640, 330, 140, 8, 34, 11, op=clamp((rb - 2.0) / 0.5))
    # maskot
    if c.i == 0:
        expr, ges, g0 = "happy", "explain", 0.0
    elif c.i == 11:
        expr, ges, g0 = "happy", "explain", 0.0
    else:
        k = (c.i - 1) // 2
        lt = c.t - c.bs(1 + 2 * k)
        if c.i % 2 == 0:
            expr, ges, g0 = "cheer", "cheer", 0.0
        elif 0.9 <= lt < 3.6:
            expr, ges, g0 = "happy", "point", c.bs(1 + 2 * k) + 0.9
        elif lt >= 5.0:
            expr, ges, g0 = "neutral", "none", 0.0
        else:
            expr, ges, g0 = "happy", "explain", 0.0
    corner_huhu(fr, c, expr, ges, g0, seed=1.0)
    corner_bubble(fr, c)


# ---------------------------------------------------------------- Adegan 3: suku kata
SYL_SAY = "Suku kata adalah potongan bunyi pada kata. Kata buku terdiri dari dua suku kata: bu dan ku."
WORDS = [("bu", "ku", "buku", "buku"), ("bo", "la", "bola", "bola"), ("me", "ja", "meja", "meja"), ("sa", "pi", "sapi", "sapi")]


def syl_beats():
    return [Beat("def", SYL_SAY, 9.0),
            Beat("buku", "Sekarang kita gabungkan! bu... ku... buku!", 8.6),
            Beat("bola", "bo ditambah la, jadi bola. Ayo baca pelan-pelan: bo... la... bola!", 10.8),
            Beat("meja", "me ditambah ja, jadi meja. Ayo baca: me... ja... meja!", 10.8),
            Beat("sapi", "sa ditambah pi, jadi sapi. Ayo baca: sa... pi... sapi!", 10.8),
            Beat("akhir", "Yeay! Kamu sudah bisa menggabungkan suku kata. Sekarang kita menulis kalimat, ya!", 7.0)]


def word_spec(sc, wi):
    """Waktu (detik adegan) untuk tiap langkah animasi pada kata ke-wi."""
    bs = sc.beats
    if wi == 0:
        b1 = bs[1].start
        return dict(l_in=3.9, r_in=4.5, plus=4.9, c1=7.0, c2=7.55, m0=b1 + 2.2, m1=b1 + 2.9, pic=b1 + 4.0, eq=b1 + 5.2, out=bs[2].start - 0.35)
    b = bs[wi + 1].start
    end = (bs[wi + 2].start if wi + 2 < len(bs) else sc.D)
    return dict(l_in=b + 0.5, r_in=b + 1.1, plus=b + 1.5, c1=b + 3.2, c2=b + 3.9, m0=b + 5.0, m1=b + 5.7, pic=b + 6.4, eq=b + 7.6, out=end - 0.35)


def sfx_syllables(sc):
    ev = []
    sfx_at(ev, 0.2, "whoosh", 0.7)
    for wi in range(4):
        sp = word_spec(sc, wi)
        sfx_at(ev, sp["l_in"], "pop2", 0.6)
        sfx_at(ev, sp["r_in"], "pop2", 0.6)
        sfx_at(ev, sp["c1"], "tick", 0.9)
        sfx_at(ev, sp["c2"], "tick", 0.9)
        sfx_at(ev, sp["m0"], "whoosh", 0.55)
        sfx_at(ev, sp["m1"], "ding", 0.9)
        sfx_at(ev, sp["m1"] + 0.05, "sparkle", 0.7)
        sfx_at(ev, sp["pic"], "boing", 0.7)
        sfx_at(ev, sp["pic"] + 0.1, "pop", 0.7)
        sfx_at(ev, sp["eq"], "scribble", 0.5)
    sfx_at(ev, sc.beats[5].start + 0.2, "success", 0.8)
    return ev


def draw_syllables(fr, c):
    t = c.t
    left_text(fr, c, c.scene.kicker, c.scene.title, c.scene.body)
    # papan tulis
    board = rrect(744, 350, 32, (16, 46, 108, 255), GOLD + (255,), 9)
    paste(fr, board, 1035, 262, "tl")
    text(fr, "SUKU KATA", 1075, 318, HEAD7, 30, (255, 226, 120), "l", clamp(t / 0.6))
    wi = 0
    for k in range(4):
        if t >= word_spec(c.scene, k)["l_in"] - 0.5:
            wi = k
    a_, b_, word, pic = WORDS[wi]
    sp = word_spec(c.scene, wi)
    alpha_out = 1 - prog(t, sp["out"], 0.35) if wi < 3 or t < c.bs(5) else 1 - prog(t, c.bs(5) - 0.1, 0.3)
    LX, RX, TY = 1250, 1560, 462
    merged = t >= sp["m1"]
    if t >= sp["l_in"] and not merged:
        slide = prog(t, sp["m0"], 0.7)
        lx = lerp(LX, 1325, ease_in_out(slide)) - 150 * (1 - ease_out(prog(t, sp["l_in"], 0.5)))
        rx = lerp(RX, 1490, ease_in_out(slide)) + 150 * (1 - ease_out(prog(t, sp["r_in"], 0.5)))
        hop1 = 1 + 0.18 * math.sin(prog(t, sp["c1"], 0.35) * math.pi)
        hop2 = 1 + 0.18 * math.sin(prog(t, sp["c2"], 0.35) * math.pi)
        paste(fr, tile_sprite(a_, BLUE2), lx, TY - 18 * (hop1 - 1) * 5, "c", clamp(prog(t, sp["l_in"], 0.4)) * alpha_out, hop1)
        if t >= sp["r_in"]:
            paste(fr, tile_sprite(b_, ORANGE), rx, TY - 18 * (hop2 - 1) * 5, "c", clamp(prog(t, sp["r_in"], 0.4)) * alpha_out, hop2)
        if t >= sp["plus"] and slide < 0.4:
            text(fr, "+", 1407, TY + 28, HEAD, 78, WHITE, "m", clamp(pop(t, sp["plus"], 0.4)) * (1 - slide * 2.5) * alpha_out, max(0.02, pop(t, sp["plus"], 0.4)))
    if merged:
        s = pop(t, sp["m1"], 0.6)
        paste(fr, tile_sprite(word.upper(), GREEN, 170, 104, 360), 1407, TY, "c", clamp(s * 1.5) * alpha_out, max(0.02, s))
        sparkle_burst(fr, t, sp["m1"], 1407, TY, 240, 14, 46, 1.0)
        if t >= sp["eq"]:
            e = clamp((t - sp["eq"]) / 0.9)
            s_eq = f"{a_} + {b_} = {word}"
            n = int(len(s_eq) * e + 0.999)
            full_w = text_w(s_eq, HEAD7, 46)
            text(fr, s_eq[:n], 1407 - full_w / 2, 592, HEAD7, 46, (255, 255, 255), "l", alpha_out)
    # tepuk
    for j, (cxx, lab) in enumerate(((LX, "tepuk 1"), (RX, "tepuk 2"))):
        if t < sp["l_in"] + 0.2:
            continue
        tc = sp["c1"] if j == 0 else sp["c2"]
        on = t >= tc and not merged
        pulse = 1 + 0.25 * math.sin(prog(t, tc, 0.4) * math.pi) if on else 1
        col_ = GOLD if on else SOFT
        paste(fr, aa(80, 80, lambda d, ss, col_=col_: d.ellipse([4 * ss, 4 * ss, 76 * ss, 76 * ss], fill=col_ + (255,), outline=BLUE + (255,), width=4 * ss), 2),
              cxx, 672, "c", alpha_out if not merged else alpha_out * 0.5, pulse)
        text(fr, str(j + 1), cxx, 685, HEAD, 38, NAVY, "m", alpha_out if not merged else alpha_out * 0.5)
        text(fr, lab, cxx, 735, BODY7, 22, MUTED, "m", alpha_out if not merged else alpha_out * 0.5)
    # gambar
    if t >= sp["pic"]:
        pt = prog(t, sp["pic"], 0.6)
        yy = 800 - 220 * (1 - ease_out(pt)) + (math.sin(pt * math.pi * 3) * 22 * (1 - pt) if pt < 1 else 0)
        paste(fr, sprite(pic, h=190), 1407 + (0 if wi else 0), yy + math.sin(t * 2.4) * 6, "c", clamp(pt * 2) * alpha_out)
        if wi == 0 and t < sp["pic"] + 1.2:
            sparkle_burst(fr, t, sp["pic"] + 0.1, 1407, 780, 150, 10, 36, 1.0)
    # maskot
    if c.i == 0:
        expr, ges, g0 = "happy", "explain", 0.0
    elif c.i == 5:
        expr, ges, g0 = "cheer", "cheer", 0.0
    else:
        if merged and t - sp["m1"] < 2.0:
            expr, ges, g0 = "cheer", "cheer", 0.0
        elif sp["pic"] <= t < sp["pic"] + 2.2:
            expr, ges, g0 = "happy", "point", sp["pic"]
        else:
            expr, ges, g0 = "happy", "explain", 0.0
    corner_huhu(fr, c, expr, ges, g0, seed=2.0)
    corner_bubble(fr, c)


# ---------------------------------------------------------------- Adegan 4: menulis kalimat
SENT_SAY = "Kalimat dimulai dengan huruf kapital dan diakhiri tanda titik. Contohnya: Budi membaca buku."
SENTENCE = "Budi membaca buku."


def sentence_beats():
    return [Beat("def", SENT_SAY, 9.0),
            Beat("tulis", "Yuk, kita tulis bersama! Budi membaca buku.", 12.0),
            Beat("jelas", "Lihat! Awal kalimat memakai huruf kapital. Akhir kalimat memakai tanda titik.", 9.8),
            Beat("budi", "Budi sedang membaca buku. Kamu juga bisa seperti Budi!", 8.0)]


def sfx_sentence(sc):
    ev = []
    b = [x.start for x in sc.beats]
    sfx_at(ev, 0.3, "whoosh", 0.7)
    sfx_at(ev, 1.8, "pop2", 0.7)
    sfx_at(ev, 3.4, "pop2", 0.7)
    for k in range(6):
        sfx_at(ev, b[1] + 1.0 + 1.2 * k, "scribble", 0.55)
    sfx_at(ev, b[1] + 1.9, "select", 0.8)
    sfx_at(ev, b[1] + 8.4, "pop", 0.9)
    sfx_at(ev, b[1] + 8.5, "ding", 0.7)
    sfx_at(ev, b[2] + 1.3, "chime", 0.8)
    sfx_at(ev, b[2] + 4.9, "chime", 0.8)
    sfx_at(ev, b[3] + 0.3, "boing", 0.7)
    for k in range(3):
        sfx_at(ev, b[3] + 1.6 + 1.1 * k, "tick", 0.9)
    sfx_at(ev, b[3] + 5.6, "success", 0.8)
    return ev


@lru_cache(maxsize=4)
def notebook_sprite(w, h):
    im = rrect(w, h, 30, (255, 253, 244, 255), (255, 226, 150, 255), 5).copy()
    d = ImageDraw.Draw(im)
    for y in (176, 290):
        d.line([(36, y), (w - 36, y)], fill=(198, 214, 245), width=3)
    d.line([(96, 30), (96, h - 24)], fill=(255, 170, 170), width=3)
    for x in range(70, w - 40, 72):
        d.rounded_rectangle([x - 11, -2, x + 11, 38], 11, fill=DEEP + (255,))
        d.rounded_rectangle([x - 5, 6, x + 5, 30], 5, fill=(255, 255, 255, 255))
    return im


def reveal_text(fr, s, x0, base_y, size, frac, fill, fname=HEAD):
    im, pad, base = txt(s, fname, size, tuple(fill))
    f = font(fname, size)
    n = len(s)
    if frac >= 1:
        xf = f.getlength(s)
    else:
        pos = frac * n
        i = min(n - 1, int(pos))
        a, b = f.getlength(s[:i]), f.getlength(s[:i + 1])
        xf = a + (pos - i) * (b - a)
    if xf <= 1:
        return x0
    crop = im.crop((0, 0, int(pad + xf) + 2, im.height))
    paste(fr, crop, x0 - pad, base_y - base, "tl")
    return x0 + xf


def draw_sentence(fr, c):
    t = c.t
    left_text(fr, c, c.scene.kicker, c.scene.title, c.scene.body)
    NX, NY, NW, NH = 1035, 262, 744, 372
    s_in = ease_out(prog(t, 0.2, 0.8))
    if t < 1.0:
        paste(fr, notebook_sprite(NW, NH), NX + NW / 2 + 160 * (1 - s_in), NY + NH / 2, "c", s_in)
    else:
        paste(fr, notebook_sprite(NW, NH), NX, NY, "tl")
    b1 = c.bs(1)
    size = 84
    while text_w(SENTENCE, HEAD, size) > 574:
        size -= 2
    f = font(HEAD, size)
    x0, base_y = NX + 122, NY + 282
    text(fr, "Contoh kalimat:", NX + 122, NY + 170, BODY7, 32, MUTED, "l", clamp((t - 1.0) / 0.5))
    w_p = prog(t, b1 + 1.0, 7.4)
    wB = f.getlength("B")
    xdot = x0 + f.getlength(SENTENCE[:-1])
    wdot = f.getlength(".")
    # sorotan (karaoke) di belakang tulisan
    b3 = c.bs(3)
    words = SENTENCE.split()
    if c.i == 3:
        for k, w_ in enumerate(words):
            tk = b3 + 1.6 + 1.1 * k
            if tk <= t < tk + 1.1:
                a_ = f.getlength(" ".join(words[:k]) + (" " if k else ""))
                ww = f.getlength(w_)
                paste(fr, rrect(int(ww + 24), int(size * 1.0), 16, GOLD + (170,)), x0 + a_ - 12, base_y - size * 0.8, "tl")
    if c.i == 2:
        e = 0.5 + 0.5 * math.sin(c.lt(2) * 6)
        lt2 = c.lt(2)
        if 1.0 <= lt2 < 4.4:
            paste(fr, rrect(int(wB + 30), int(size * 1.05), 18, ORANGE + (int(60 + 90 * e),)), x0 - 15, base_y - size * 0.82, "tl")
        elif 4.4 <= lt2 < 8.5:
            paste(fr, rrect(int(wdot + 34), int(size * 1.05), 18, GREEN + (int(60 + 90 * e),)), xdot - 17, base_y - size * 0.82, "tl")
    xf = reveal_text(fr, SENTENCE, x0, base_y, size, w_p, INK)
    # garis bawah huruf kapital (oranye)
    if t >= b1 + 1.5:
        e = ease_out(prog(t, b1 + 1.8, 0.7))
        paste(fr, rrect(max(2, int(wB * e)), 9, 4, ORANGE + (255,)), x0, base_y + 16, "tl")
    # titik + garis bawah hijau
    if t >= b1 + 8.4:
        pp = pop(t, b1 + 8.4, 0.5)
        e = ease_out(prog(t, b1 + 8.7, 0.5))
        paste(fr, rrect(max(2, int(wdot * e)), 9, 4, GREEN + (255,)), xdot, base_y + 16, "tl")
        sparkle_burst(fr, t, b1 + 8.45, xdot + wdot / 2, base_y - 8, 80, 8, 30, 0.8)
    # pensil menulis
    if c.i == 1 and 1.0 <= c.lt(1) < 8.5 and w_p < 1:
        k = 170 / 200.0
        pen = sprite("pensil", w=170).rotate(180, resample=Image.BICUBIC)
        wob = math.sin(t * 14) * 3
        paste(fr, pen, xf + 66 * k * 1.0 + 4, base_y - 55 * k + wob, "c")
    # tag
    tags = [("Huruf kapital", ORANGE, 1070, 1.8), ("Tanda titik", GREEN, 1330, 3.4)]
    for j, (lab, col, tx, tt) in enumerate(tags):
        if t < tt:
            continue
        s = pop(t, tt, 0.45)
        w_ = int(text_w(lab, BODY8, 28)) + 56
        pulse = 1.0
        if c.i == 2:
            lt2 = c.lt(2)
            on = (1.0 <= lt2 < 4.4) if j == 0 else (4.4 <= lt2 < 8.5)
            pulse = 1 + 0.07 * math.sin(lt2 * 8) if on else 1.0
        paste(fr, rrect(w_, 56, 28, col + (255,)), tx + w_ / 2, 690, "c", clamp(s * 1.5), max(0.02, s) * pulse)
        text(fr, lab, tx + w_ / 2, 709, BODY8, 28, WHITE, "m", clamp(s * 1.5))
    text(fr, "Awal kalimat dan akhir kalimat.", 1407, 842, BODY7, 28, MUTED, "m", clamp((t - 5.0) / 0.6))
    # Budi membaca
    if t >= b3 + 0.3:
        s = pop(t, b3 + 0.3, 0.6)
        aloud = (b3 + 1.5 <= t < b3 + 5.0)
        paste(fr, sprite("budi_aloud" if aloud else "budi_read", h=250), 1660, 770 + math.sin(t * 2.6) * 6, "c", clamp(s * 1.4), max(0.02, s))
    # maskot
    if c.i == 0:
        expr, ges, g0 = "happy", "explain", 0
    elif c.i == 1:
        expr, ges, g0 = "happy", "explain", 0
    elif c.i == 2:
        expr, ges, g0 = "happy", "point", c.bs(2) + 0.8
    else:
        expr, ges, g0 = ("cheer", "cheer", 0) if c.lt(3) > 5.4 else ("happy", "explain", 0)
    corner_huhu(fr, c, expr, ges, g0, seed=3.0)
    corner_bubble(fr, c)


# ---------------------------------------------------------------- Adegan 5: kebiasaan membaca
HABIT_SAY = "Biasakan membaca sepuluh menit setiap hari. Tunjuk kata yang kamu baca agar tidak terlewat."
HABITS = [("Luangkan 10 menit", "Membaca setiap hari membuatmu lancar."),
          ("Tunjuk kata", "Arahkan jari pada kata yang dibaca."),
          ("Baca nyaring", "Baca dengan suara jelas dan gembira.")]


def habit_beats():
    return [Beat("intro", HABIT_SAY, 8.6),
            Beat("h1", "Satu! Luangkan sepuluh menit setiap hari. Sedikit demi sedikit, kamu jadi lancar!", 9.0),
            Beat("h2", "Dua! Tunjuk kata yang kamu baca dengan jarimu, supaya tidak ada yang terlewat!", 10.0),
            Beat("h3", "Tiga! Baca nyaring dengan suara jelas dan gembira. Seru, kan?", 9.0),
            Beat("akhir", "Hebat! Tiga kebiasaan baik untuk pembaca cerdas!", 5.8)]


def sfx_habits(sc):
    ev = []
    b = [x.start for x in sc.beats]
    sfx_at(ev, 0.2, "whoosh", 0.7)
    for k, tt in enumerate((0.6, 1.5, 2.4)):
        sfx_at(ev, tt, "pop", 0.7)
    sfx_at(ev, b[1] + 0.3, "select", 0.8)
    sfx_at(ev, b[1] + 6.1, "ding", 0.8)
    sfx_at(ev, b[2] + 0.3, "select", 0.8)
    for k in range(3):
        sfx_at(ev, b[2] + 1.6 + 1.7 * k, "tick", 0.9)
    sfx_at(ev, b[2] + 7.2, "ding", 0.8)
    sfx_at(ev, b[3] + 0.3, "select", 0.8)
    for k in range(3):
        sfx_at(ev, b[3] + 1.5 + 1.5 * k, "pop2", 0.6)
    sfx_at(ev, b[3] + 7.0, "ding", 0.8)
    for k in range(3):
        sfx_at(ev, b[4] + 0.3 + 0.3 * k, "pop", 0.7)
    sfx_at(ev, b[4] + 1.3, "success", 0.8)
    return ev


def clock_img(deg, size=92):
    base = sprite("jam", w=size).copy()
    wedge = aa(size, size, lambda d, ss: d.pieslice([8 * ss, 8 * ss, (size - 8) * ss, (size - 8) * ss], -90, -90 + max(0.5, deg), fill=GOLD + (230,)), 2)
    base.alpha_composite(wedge)
    base.alpha_composite(sprite("jam_jarum", w=size).rotate(-deg, resample=Image.BICUBIC))
    return base


@lru_cache(maxsize=8)
def note_sprite(color):
    return aa(40, 60, lambda d, ss: (d.ellipse([4 * ss, 38 * ss, 24 * ss, 54 * ss], fill=color + (255,)),
                                      d.rectangle([20 * ss, 8 * ss, 25 * ss, 46 * ss], fill=color + (255,)),
                                      d.polygon([(24 * ss, 8 * ss), (38 * ss, 20 * ss), (24 * ss, 22 * ss)], fill=color + (255,))), 3)


def draw_habits(fr, c):
    t = c.t
    left_text(fr, c, c.scene.kicker, c.scene.title, c.scene.body)
    b = [x.start for x in c.scene.beats]
    active = c.i - 1 if 1 <= c.i <= 3 else -1
    for k, (title, desc) in enumerate(HABITS):
        t_in = (0.6, 1.5, 2.4)[k]
        if t < t_in:
            continue
        s = pop(t, t_in, 0.5)
        y0 = 262 + k * 216
        cy = y0 + 95
        on = (k == active)
        sc_ = max(0.02, s) * (1.02 if on else 1.0)
        card = rrect(744, 190, 32, (255, 255, 255, 255) if on else SOFT + (255,), GOLD + (255,) if on else SOFT2 + (255,), 7 if on else 3)
        paste(fr, card, 1407 + 60 * (1 - clamp(s)), cy, "c", clamp(s * 1.5), sc_)
        if s < 0.9:
            continue
        # lencana nomor
        paste(fr, rrect(52, 52, 26, GOLD + (255,)), 1062, y0 + 26, "c")
        text(fr, str(k + 1), 1062, y0 + 45, HEAD, 34, NAVY, "m")
        text(fr, title, 1270, cy - 8, HEAD7, 40, DEEP)
        for j, ln in enumerate(wrap_text(desc, BODY, 27, 470)):
            text(fr, ln, 1270, cy + 32 + j * 34, BODY, 27, MUTED)
        # mini-adegan di kiri
        mx, my = 1150, cy
        lt = c.t - b[1 + k]
        if k == 0:
            paste(fr, sprite("budi_read", h=150), mx - 22, my + 4 + math.sin(t * 2.6) * 3, "c")
            deg = 360 * 10 / 60 * ease_in_out(prog(lt, 1.2, 4.8)) if c.i >= 1 + k else 0
            if c.i > 1:
                deg = 60
            paste(fr, clock_img(deg), mx + 54, my - 46, "c")
        elif k == 1:
            paste(fr, rrect(176, 104, 18, (255, 255, 255, 255), SOFT2 + (255,), 3), mx, my + 22, "c")
            ws = ["Budi", "baca", "buku"]
            xs = [mx - 76, mx - 14, mx + 42]
            idx = int(clamp((lt - 1.6) / 1.7, 0, 2.99)) if c.i == 2 else (2 if c.i > 2 else 0)
            for j, w_ in enumerate(ws):
                if j == idx and c.i == 2:
                    paste(fr, rrect(int(text_w(w_, HEAD7, 22) + 14), 34, 10, GOLD + (190,)), xs[j] - 7, my + 10, "tl")
                text(fr, w_, xs[j], my + 36, HEAD7, 22, INK)
            fx = xs[idx] + text_w(ws[idx], HEAD7, 22) / 2
            tipx = lerp(fx, fx, 1)
            k2 = 90 / 200.0
            paste(fr, sprite("tangan", h=90), tipx - 77 * k2 + 0.0, my + 48 - 14 * k2 + 6 + math.sin(t * 6) * 2, "tl")
        else:
            paste(fr, sprite("budi_aloud", h=150), mx - 8, my + 4 + math.sin(t * 2.6) * 3, "c")
            if c.i == 3:
                for n in range(2):
                    p = ((lt - 1.2) / 2.0 + n * 0.5) % 1.0
                    if lt > 1.2:
                        paste(fr, note_sprite(GOLD if n else ORANGE), mx + 62 + 10 * math.sin(p * 8), my - 20 - 60 * p, "c", 1 - p, 0.7)
        if c.i == 4 or (c.i > 1 + k):
            q = 0.3 + 0.3 * k
            if c.i != 4 or c.lt(4) > q:
                paste(fr, check_sprite(48), 1730, y0 + 30, "c", 1, pop(t, b[4] + q, 0.4) if c.i == 4 else 1.0)
    if c.i == 4:
        sparkles(fr, t, 1407, 560, 380, 280, 10, 34, 5)
    # maskot
    if c.i == 0:
        expr, ges, g0 = "happy", "explain", 0
    elif c.i == 4:
        expr, ges, g0 = "cheer", "cheer", 0
    else:
        expr, ges, g0 = "happy", "point", c.bs(c.i) + 0.6
    corner_huhu(fr, c, expr, ges, g0, seed=4.0)
    corner_bubble(fr, c)


# ---------------------------------------------------------------- Adegan 6: kuis interaktif
QUIZ = [
    dict(q="Apa saja huruf vokal?", opts=["a, i, u, e, o", "b, c, d, f, g", "k, l, m, n, p"], ok=0, first=1, opt_in=2.4),
    dict(q="Jika “bu” digabung dengan “ku”, menjadi kata apa?", opts=["kubu", "buku", "bubu"], ok=1, first=4, opt_in=4.0),
    dict(q="Huruf apa yang digunakan di awal kalimat?", opts=["huruf kecil", "tanda titik", "huruf kapital"], ok=2, first=9, opt_in=3.8),
]
THINK = "Ayo berpikir... tiga, dua, satu!"


def quiz_beats():
    return [Beat("intro", "Wah, kita sudah belajar banyak! Sekarang saatnya kuis. Ada tiga pertanyaan. Siap?", 8.0),
            Beat("q1a", "Pertanyaan satu. Apa saja huruf vokal?", 5.6),
            Beat("q1b", THINK, 4.8),
            Beat("q1c", "Benar! Huruf vokal itu a, i, u, e, o. Hebat!", 6.0),
            Beat("q2a", "Pertanyaan dua. Jika bu digabung dengan ku, menjadi kata apa?", 7.2),
            Beat("q2b", THINK, 4.8),
            Beat("q2c", "Hmm, belum tepat. Coba lagi, ya!", 4.2),
            Beat("q2d", "Petunjuk: baca dari kiri dulu. bu... lalu ku. Gabungkan!", 8.4),
            Beat("q2e", "Yeay! Benar! bu dan ku jadi buku!", 6.0),
            Beat("q3a", "Pertanyaan terakhir. Huruf apa yang dipakai di awal kalimat?", 7.0),
            Beat("q3b", THINK, 4.8),
            Beat("q3c", "Tepat sekali! Awal kalimat memakai huruf kapital.", 6.0),
            Beat("skor", "Selamat! Kamu menjawab semua pertanyaan dengan benar. Skor kamu tiga dari tiga!", 10.5),
            Beat("pamit", "Terima kasih sudah belajar bersamaku. Sampai jumpa di petualangan berikutnya!", 7.8)]


def quiz_taps(sc):
    """[(waktu_tap, soal, opsi, hasil)] dalam waktu adegan."""
    b = [x.start for x in sc.beats]
    return [(b[3] + 0.5, 0, 0, "right"), (b[6] + 0.4, 1, 0, "wrong"), (b[8] + 0.5, 1, 1, "right"), (b[11] + 0.5, 2, 2, "right")]


def sfx_quiz(sc):
    ev = []
    b = [x.start for x in sc.beats]
    sfx_at(ev, 0.2, "whoosh", 0.7)
    sfx_at(ev, 0.6, "pop", 0.8)
    sfx_at(ev, 0.9, "sparkle", 0.7)
    for q in QUIZ:
        f = b[q["first"]]
        sfx_at(ev, f + 0.4, "pop", 0.7)
        for r in range(3):
            sfx_at(ev, f + q["opt_in"] + 0.22 * r, "pop2", 0.55)
    for tb in (b[2], b[5], b[10]):
        for k in range(3):
            sfx_at(ev, tb + 0.9 + 1.2 * k, "tick", 0.9)
    for tt, qi, oi, res in quiz_taps(sc):
        sfx_at(ev, tt, "select", 0.8)
        if res == "right":
            sfx_at(ev, tt + 0.1, "success", 0.9)
            sfx_at(ev, tt + 0.15, "confetti", 0.8)
        else:
            sfx_at(ev, tt + 0.1, "wrong", 0.9)
    sfx_at(ev, b[7] + 0.3, "whoosh", 0.6)
    sfx_at(ev, b[7] + 4.4, "whoosh", 0.5)
    sfx_at(ev, b[7] + 5.1, "ding", 0.9)
    sfx_at(ev, b[7] + 5.15, "sparkle", 0.7)
    sfx_at(ev, b[12] + 0.2, "cheer", 0.9)
    sfx_at(ev, b[12] + 0.3, "confetti", 0.9)
    sfx_at(ev, b[12] + 0.8, "boing", 0.8)
    for k in range(3):
        sfx_at(ev, b[12] + 1.6 + 0.6 * k, "ding", 0.8)
    sfx_at(ev, b[12] + 4.3, "confetti", 0.8)
    sfx_at(ev, b[13] + 0.3, "chime", 0.8)
    return ev


@lru_cache(maxsize=64)
def option_sprite(txt_, letter, state):
    fill, line, ow = {"normal": ((255, 255, 255), SOFT2, 3), "right": ((220, 247, 233), GREEN, 6),
                      "wrong": ((255, 232, 205), ORANGE, 6), "dim": ((244, 243, 250), SOFT2, 3)}[state]
    im = rrect(714, 84, 28, fill + (255,), line + (255,), ow).copy()
    bc = {"normal": BLUE, "right": GREEN, "wrong": ORANGE, "dim": (170, 166, 200)}[state]
    d = ImageDraw.Draw(im)
    d.ellipse([16, 16, 68, 68], fill=bc + (255,))
    d.text((42, 44), letter, font=font(HEAD, 38), fill=WHITE, anchor="mm")
    d.text((94, 55), txt_, font=font(BODY8, 38), fill=INK if state != "dim" else (150, 146, 180), anchor="ls")
    return im


def wrong_sprite(size=46):
    def f(d, ss):
        d.ellipse([2 * ss, 2 * ss, (size - 2) * ss, (size - 2) * ss], fill=ORANGE + (255,))
        d.text((size * ss / 2, size * ss / 2 + 2 * ss), "?", font=font(HEAD, int(size * 0.8 * ss)), fill=WHITE + (255,), anchor="mm")
    return aa(size, size, f, 2)


_CONF = {}


def conf(seed, **kw):
    if seed not in _CONF:
        _CONF[seed] = Confetti(seed=seed, **kw)
    return _CONF[seed]


def draw_hand(fr, c, tips):
    """tips = [(t_tap, target_x, target_y)]; tangan masuk, mengetuk, lalu pergi."""
    for tt, tx, ty in tips:
        if not (tt - 1.0 <= c.t <= tt + 1.3):
            continue
        sx, sy = tx + 40, 940
        if c.t < tt:
            e = ease_in_out(prog(c.t, tt - 1.0, 0.9))
            px, py = lerp(sx, tx, e), lerp(sy, ty, e)
        elif c.t < tt + 0.5:
            px, py = tx, ty - 10 * math.sin(prog(c.t, tt, 0.3) * math.pi)
        else:
            e = ease_in_out(prog(c.t, tt + 0.5, 0.8))
            px, py = lerp(tx, sx, e), lerp(ty, sy, e)
        k = 130 / 200.0
        paste(fr, sprite("tangan", h=130), px - 77 * k, py - 14 * k, "tl")
        fr.paste(c.bg.crop((0, 958, W, H)), (0, 958))


def draw_quiz(fr, c):
    t = c.t
    left_text(fr, c, c.scene.kicker, c.scene.title, c.scene.body)
    sc = c.scene
    b = [x.start for x in sc.beats]
    taps = quiz_taps(sc)
    IX = 1050
    q_now = 0 if c.i in (1, 2, 3) else 1 if c.i in (4, 5, 6, 7, 8) else 2 if c.i in (9, 10, 11) else -1
    stars = [tt for tt, qi, oi, res in taps if res == "right"]
    if c.i == 0:
        # pembuka kuis
        s = pop(t, 0.4, 0.7)
        paste(fr, sprite("toga", h=230), 1407, 470 + math.sin(t * 2.2) * 10, "c", clamp(s * 1.5), max(0.02, s), rot=math.sin(t * 1.6) * 4)
        text(fr, "Kuis Seru!", 1407, 700, HEAD, 104, DEEP, "m", clamp((t - 0.9) / 0.5), pop(t, 0.9, 0.5))
        for k, (ch, col, dx, dy) in enumerate((("?", BLUE2, -250, -170), ("?", ORANGE, 255, -140), ("?", GREEN, -230, 60), ("?", PURPLE, 250, 90))):
            if t > 1.0 + 0.2 * k:
                paste(fr, letter_tile(ch, col, 92), 1407 + dx, 470 + dy + math.sin(t * 2 + k) * 12, "c", clamp(pop(t, 1.0 + 0.2 * k, 0.5) * 1.4), max(0.02, pop(t, 1.0 + 0.2 * k, 0.5)))
        for k in range(3):
            if t > 2.0 + 0.3 * k:
                paste(fr, sprite("bintang", h=78), 1407 + (k - 1) * 100, 810, "c", 0.25, max(0.02, pop(t, 2.0 + 0.3 * k, 0.4)))
        sparkles(fr, t, 1407, 520, 330, 220, 9, 36, 8, op=clamp((t - 1.5) / 0.6))
    elif q_now >= 0:
        q = QUIZ[q_now]
        qs = c.bs(q["first"])
        # pita atas: nomor soal + bintang
        paste(fr, rrect(212, 50, 25, BLUE + (255,)), IX + 106, 285, "c")
        text(fr, f"Soal {q_now + 1} dari 3", IX + 106, 303, BODY8, 26, WHITE, "m")
        for k in range(3):
            earned = k < len(stars) and t >= stars[k] + 0.1
            s = pop(t, stars[k] + 0.1, 0.5) if earned else 1.0
            paste(fr, sprite("bintang", h=58), 1630 + k * 62, 285, "c", 1.0 if earned else 0.22, max(0.02, s) * (1.0 if not earned else 1.0))
        # kartu pertanyaan
        ps = pop(t, qs + 0.3, 0.45)
        paste(fr, rrect(714, 190, 32, SOFT + (255,), BLUE + (255,), 4), IX + 357, 435, "c", clamp(ps * 1.5), max(0.02, ps))
        if ps > 0.6:
            lines = wrap_text(q["q"], BODY8, 44, 560)
            y = 435 - (len(lines) - 1) * 28 + 14
            for j, ln in enumerate(lines):
                text(fr, ln, IX + 34, y + j * 56, BODY8, 44, INK, "l", clamp((t - qs - 0.5) / 0.4))
        # hitung mundur
        think = {0: 2, 1: 5, 2: 10}[q_now]
        tt0 = b[think]
        if tt0 + 0.5 <= t <= tt0 + 4.6 and q_now >= 0 and c.i in (think, think + 1) and not (q_now == 1 and c.i >= 6):
            lt = t - (tt0 + 0.9)
            n = 3 - int(clamp(lt / 1.2, 0, 2.99))
            p = clamp(lt / 3.6)
            ring = aa(110, 110, lambda d, ss: (d.ellipse([6 * ss, 6 * ss, 104 * ss, 104 * ss], fill=(255, 255, 255, 255), outline=SOFT2 + (255,), width=8 * ss),
                                               d.arc([6 * ss, 6 * ss, 104 * ss, 104 * ss], -90, -90 + 360 * p, fill=GOLD + (255,), width=8 * ss)), 2)
            paste(fr, ring, 1700, 435, "c", clamp((t - tt0 - 0.5) / 0.3))
            if lt >= 0:
                text(fr, str(n), 1700, 458, HEAD, 60, DEEP, "m", 1.0, 1.0 + 0.25 * max(0, 1 - ((lt % 1.2) / 0.3)))
        # pilihan jawaban
        hint = (q_now == 1 and c.i == 7)
        for r, opt in enumerate(q["opts"]):
            ti = qs + q["opt_in"] + 0.22 * r
            if t < ti:
                continue
            ry = 556 + r * 100
            state = "normal"
            sh = 0.0
            for tt, qi, oi, res in taps:
                if qi == q_now and t >= tt + 0.05:
                    if oi == r:
                        state = "right" if res == "right" else "wrong"
                        if res == "wrong":
                            sh = math.sin((t - tt) * 38) * 12 * (1 - prog(t, tt + 0.05, 0.6))
                    elif res == "right" and state == "normal" and qi == 1:
                        state = "dim" if opt == "kubu" else state
            ap = ease_out(prog(t, ti, 0.4))
            pulse = 1.0
            if state == "right":
                pulse = 1 + 0.04 * math.sin(clamp((t - tt) / 0.5) * math.pi)
            if hint and t >= b[7] + 0.2:
                continue
            paste(fr, option_sprite(opt, "ABC"[r], state), IX + 357 + sh + 70 * (1 - ap), ry + 42, "c", ap, pulse)
            if state == "right":
                paste(fr, check_sprite(50), IX + 670, ry + 42, "c", 1.0, 1.0)
            elif state == "wrong":
                paste(fr, wrong_sprite(50), IX + 670, ry + 42, "c")
        # petunjuk (soal 2): ubin bu + ku bergabung
        if hint and t >= b[7] + 0.2:
            lt = t - b[7]
            hs = ease_out(prog(lt, 0.2, 0.4))
            paste(fr, rrect(714, 290, 32, (255, 250, 220, 255), GOLD + (255,), 6), IX + 357, 700, "c", hs)
            text(fr, "Petunjuk", IX + 357, 590, HEAD7, 38, (150, 105, 0), "m", hs)
            slide = ease_in_out(prog(lt, 3.6, 0.8))
            joined = lt >= 4.8
            if not joined:
                lx, rx = lerp(1250, 1347, slide), lerp(1560, 1467, slide)
                paste(fr, tile_sprite("bu", BLUE2, 130, 70, 130), lx, 705, "c", hs * clamp((lt - 0.6) / 0.4), 1.0)
                if lt > 1.8:
                    paste(fr, tile_sprite("ku", ORANGE, 130, 70, 130), rx, 705, "c", hs * clamp((lt - 1.8) / 0.4), 1.0)
                if 1.8 < lt < 3.6:
                    text(fr, "baca dari kiri", 1407, 810, BODY8, 30, MUTED, "m")
            else:
                s = pop(lt, 4.8, 0.5)
                paste(fr, tile_sprite("BUKU", GREEN, 150, 88, 300), 1407, 705, "c", clamp(s * 1.5), max(0.02, s))
                sparkle_burst(fr, t, b[7] + 4.8, 1407, 705, 190, 12, 40, 0.9)
        # tangan menekan jawaban
        tips = []
        for tt, qi, oi, res in taps:
            if qi == q_now:
                tips.append((tt, IX + 560, 556 + oi * 100 + 52))
        draw_hand(fr, c, tips)
        # konfeti kecil bila benar
        for tt, qi, oi, res in taps:
            if qi == q_now and res == "right":
                conf(int(tt * 10), n=80, x0=1000, x1=1800, y0=180, spread=300, fall=0.9).draw(fr, t - tt - 0.1, 2.6)
    else:
        # papan skor akhir
        lt = c.lt(12)
        s = pop(lt, 0.3, 0.7)
        paste(fr, sprite("piala", h=290), 1407, 430 + math.sin(t * 2.4) * 8, "c", clamp(s * 1.5), max(0.02, s))
        text(fr, "Skor: 3 / 3", 1407, 690, HEAD, 104, DEEP, "m", clamp((lt - 0.8) / 0.4), pop(lt, 0.8, 0.5))
        text(fr, "Selamat, kamu hebat!", 1407, 760, BODY8, 46, BLUE, "m", clamp((lt - 1.2) / 0.5))
        for k in range(3):
            t0 = 1.6 + 0.6 * k
            if lt >= t0:
                s2 = pop(lt, t0, 0.5)
                paste(fr, sprite("bintang", h=92), 1407 + (k - 1) * 120, 840, "c", 1, max(0.02, s2), rot=math.sin(t * 3 + k) * 6)
        sparkles(fr, t, 1407, 500, 340, 260, 10, 38, 21, op=clamp((lt - 1.0) / 0.5))
        conf(901, n=170, spread=700).draw(fr, lt - 0.2, 3.6)
        conf(902, n=120, spread=500).draw(fr, lt - 4.2, 3.2)
    # maskot (bereaksi pada jawaban)
    i = c.i
    lt = c.lt(i)
    if i == 0:
        expr, ges, g0 = "happy", "explain", 0
    elif i in (1, 4, 9):
        expr, ges, g0 = "happy", "point", c.bs(i) + 0.4
    elif i in (2, 5, 10):
        expr, ges, g0 = "neutral", "think", 0
    elif i in (3, 8, 11, 12):
        expr, ges, g0 = "cheer", "cheer", 0
    elif i == 6:
        expr, ges, g0 = "confused", "confused", 0
    elif i == 7:
        expr, ges, g0 = ("thinking", "think", 0) if lt < 4.7 else ("surprised", "none", 0) if lt < 5.8 else ("happy", "explain", 0)
    else:
        expr, ges, g0 = "happy", "wave", 0
    st = pose(t, expr, c.speaking, ges, 5.0, g0)
    st = enter_pose(st, t)
    if i == 13:
        st = exit_pose(st, t, c.bs(13) + 5.0, 1.8, to_dx=-560)
    MASCOT.draw(fr, 250, 935, 420, st)
    if i in (2, 5, 10) and lt > 0.5:
        for k in range(3):
            paste(fr, aa(20, 20, lambda d, ss: d.ellipse([1 * ss, 1 * ss, 19 * ss, 19 * ss], fill=BLUE + (255,)), 3), 345 + k * 30, 600 - k * 14 - math.sin(t * 4 + k) * 3, "c", clamp(lt - 0.4 - k * 0.3), 0.7 + 0.3 * k)
    if i == 6 and lt > 0.2:
        text(fr, "?", 350, 640, HEAD, 90, ORANGE, "m", 1.0, 0.8 + 0.2 * math.sin(t * 8), rot=math.sin(t * 6) * 10, stroke=4, stroke_fill=WHITE)
    if i == 12 or i == 13:
        sparkles(fr, t, 250, 760, 160, 190, 6, 34, 31)
    if i in (3, 8, 11):
        sparkle_burst(fr, t, c.bs(i) + 0.55, 250, 760, 190, 10, 40, 1.0)
    corner_bubble(fr, c)


# ================================================================ C. SUSUNAN WAKTU, AUDIO, RENDER
VOWEL_CLIPS = {}


def build_scenes(video):
    sc = video["scenes"]
    subject = f"{video['subject']}  ·  {video['grade']}"
    arr, _ = narration(VOW_SAY)
    VOWEL_CLIPS.clear()
    if arr is not None:
        for ch, (a, b) in VOW_CLIP_T.items():
            clip = arr[int(a * SR):int(b * SR)].copy()
            n = min(len(clip) // 4, int(0.02 * SR))
            if n > 0:
                clip[:n] *= np.linspace(0, 1, n, dtype=np.float32)
                clip[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
            VOWEL_CLIPS["vokal_" + ch] = clip
    scenes = [
        Scene("pembukaan", "hero", sc[0]["kicker"], sc[0]["title"], sc[0]["body"],
              [Beat("awal", "", 3.2), Beat("hai", INTRO_SAY, 8.0), Beat("siap", "Siap belajar bersamaku? Ayo kita mulai!", 4.6)],
              draw_title, sfx_title),
        Scene("vokal", "content", sc[1]["kicker"], sc[1]["title"], sc[1]["body"], vowel_beats(), draw_vowels, sfx_vowels),
        Scene("sukukata", "content", sc[2]["kicker"], sc[2]["title"], sc[2]["body"], syl_beats(), draw_syllables, sfx_syllables),
        Scene("kalimat", "content", sc[3]["kicker"], sc[3]["title"], sc[3]["body"], sentence_beats(), draw_sentence, sfx_sentence),
        Scene("kebiasaan", "content", sc[4]["kicker"], sc[4]["title"], sc[4]["body"], habit_beats(), draw_habits, sfx_habits),
        Scene("kuis", "content", "KUIS", "Kuis Seru", "Jawab tiga pertanyaan bersama Huhu dan kumpulkan bintangmu.", quiz_beats(), draw_quiz, sfx_quiz),
    ]
    for s in scenes:
        s.resolve()
        s.subject = subject
    return scenes


def _bg_for(sc, idx, total):
    return hero_bg(idx, total, sc.subject) if sc.kind == "hero" else content_bg(idx, total, sc.subject)


def frame_at(scenes, si, t):
    sc = scenes[si]
    c = Ctx(sc, t, si, len(scenes))
    c.bg = _bg_for(sc, si, len(scenes))
    fr = c.bg.copy()
    sc.draw(fr, c)
    return fr


_GRID = None


def wipe(prev, cur, p):
    """Transisi: pita ungu-emas menyapu diagonal; adegan baru muncul di belakangnya."""
    global _GRID
    if _GRID is None:
        _GRID = (np.arange(W, dtype=np.float32)[None, :] + 0.45 * np.arange(H, dtype=np.float32)[:, None])
    front = ease_in_out(p) * (_GRID.max() + 360) - 30
    new = _GRID < front - 190
    gold = (_GRID >= front - 40) & (_GRID < front)
    band = (_GRID >= front - 190) & (_GRID < front - 40)
    a = np.where(new[..., None], cur, prev)
    a[band] = np.array(DEEP, np.uint8)
    a[gold] = np.array(GOLD, np.uint8)
    return a


def build_audio(scenes, starts, total):
    n = int((total + 1.5) * SR)
    sfxbuf = np.zeros(n, np.float32)
    voice = np.zeros(n, np.float32)
    have_voice = False
    for si, sc in enumerate(scenes):
        for b in sc.beats:
            if b.audio is not None:
                _mix_at(voice, b.audio * 0.95, starts[si] + b.start + 0.3)
                have_voice = True
            for off, key in b.clips:
                clip = VOWEL_CLIPS.get(key)
                if clip is not None:
                    _mix_at(voice, clip * 1.15, starts[si] + b.start + off)
        for tt, name, gain in sc.events:
            _mix_at(sfxbuf, sfx(name) * gain * 0.75, starts[si] + tt)
        if si > 0:
            _mix_at(sfxbuf, sfx("whoosh") * 0.8, starts[si] - 0.05)
    music = make_music(total + 1.5)[:n]
    music = np.pad(music, (0, n - len(music)))
    from scipy.ndimage import uniform_filter1d
    act = uniform_filter1d((np.abs(voice) > 0.02).astype(np.float32), int(0.5 * SR))
    duck = 1.0 - 0.55 * np.clip(act * 2.5, 0, 1)
    mix = sfxbuf + voice + music * duck
    peak = float(np.max(np.abs(mix))) or 1.0
    if peak > 0.95:
        mix = mix * (0.95 / peak)
    return mix, have_voice


def _vtt_time(sec):
    ms = int(round(sec * 1000))
    return f"{ms // 3600000:02d}:{(ms % 3600000) // 60000:02d}:{(ms % 60000) // 1000:02d}.{ms % 1000:03d}"


def build_vtt(scenes, starts):
    lines = ["WEBVTT", ""]
    for si, sc in enumerate(scenes):
        for b in sc.beats:
            if not b.say:
                continue
            sents = [x.strip() for x in re.split(r"(?<=[.!?])\s+", b.say) if x.strip()] or [b.say]
            tot = sum(len(x) for x in sents) or 1
            cur = starts[si] + b.start + 0.3
            for sline in sents:
                dur = b.speech * len(sline) / tot
                lines += [f"{_vtt_time(cur)} --> {_vtt_time(cur + dur - 0.05)}", sline, ""]
                cur += dur
    return "\n".join(lines)


def render_membaca(video, out_path=None, log=print, limit_s=None):
    """Render video animasi 'Membaca Itu Seru'. Mengembalikan durasi (detik)."""
    import wave as _wave
    from PIL import Image as _I
    VIDEOS.mkdir(parents=True, exist_ok=True)
    AUDIO.mkdir(parents=True, exist_ok=True)
    out_path = Path(out_path) if out_path else VIDEOS / "membaca.mp4"
    scenes = build_scenes(video)
    starts, acc = [], 0.0
    for sc in scenes:
        starts.append(acc)
        acc += sc.D
    total = acc
    log(f"  adegan: " + ", ".join(f"{s.name} {s.D:.1f}s" for s in scenes) + f" | total {total:.1f}s ({total / 60:.1f} menit)")
    mix, have_voice = build_audio(scenes, starts, total)
    wav = AUDIO / "membaca-anim-final.wav"
    with _wave.open(str(wav), "wb") as fh:
        fh.setnchannels(1)
        fh.setsampwidth(2)
        fh.setframerate(SR)
        fh.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
    log("  narasi TTS: " + ("ADA" if have_voice else "TIDAK ADA (offline/gTTS belum terpasang) - dialog tampil di gelembung teks"))
    (VIDEOS / "membaca.vtt").write_text(build_vtt(scenes, starts), encoding="utf-8")

    nframes = int(round((limit_s or total) * FPS))
    cmd = [ffmpeg_exe(), "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", str(wav), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", str(out_path)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    prev_last = np.zeros((H, W, 3), np.uint8)
    prev_last[:] = np.array(DEEP, np.uint8)
    si, poster_done, t_start = 0, False, time.time()
    try:
        for f in range(nframes):
            g = f / FPS
            while si + 1 < len(scenes) and g >= starts[si + 1]:
                prev_last = np.asarray(frame_at(scenes, si, scenes[si].D - 1.0 / FPS), np.uint8)
                si += 1
            t = g - starts[si]
            img = frame_at(scenes, si, t)
            arr = np.asarray(img, np.uint8)
            if t < TRANS:
                arr = wipe(prev_last, arr, t / TRANS)
            if not poster_done and si == 0 and t >= 2.4:
                _I.fromarray(np.asarray(img, np.uint8)).resize((1280, 720), _I.LANCZOS).save(POSTERS / "poster-membaca.jpg", quality=90)
                poster_done = True
            proc.stdin.write(np.ascontiguousarray(arr).tobytes())
            if f % 300 == 0 and f:
                el = time.time() - t_start
                log(f"  frame {f}/{nframes}  ({f / nframes * 100:.0f}%)  sisa ~{el / f * (nframes - f) / 60:.1f} menit")
    finally:
        proc.stdin.close()
        proc.wait()
    log(f"  selesai: {out_path.name} ({total:.1f}s)")
    return total
