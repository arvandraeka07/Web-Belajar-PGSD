# -*- coding: utf-8 -*-
"""Membuat tiga video pembelajaran MP4, poster, dan subtitle VTT.

Kebutuhan: Python 3, Pillow, numpy, gTTS, imageio-ffmpeg.
Jalankan: python tools/generate_videos.py
"""

import hashlib
import math
import os
import re
import subprocess
import sys
import time
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from gtts import gTTS
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "tools" / "build"
IMG = BUILD / "img"
ICONS = IMG / "icons"
TTS = BUILD / "tts"
SLIDES = BUILD / "slides"
SCENES = BUILD / "scenes"
AUDIO = BUILD / "audio"
VIDEOS = ROOT / "assets" / "videos"
POSTERS = ROOT / "assets" / "images"

for folder in (TTS, SLIDES, SCENES, AUDIO, VIDEOS, POSTERS):
    folder.mkdir(parents=True, exist_ok=True)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
W, H = 1280, 720
FPS = 30

F_HEAD = ROOT / "assets" / "fonts" / "Baloo2-800.ttf"
F_HEAD7 = ROOT / "assets" / "fonts" / "Baloo2-700.ttf"
F_BODY = ROOT / "assets" / "fonts" / "Nunito-600.ttf"
F_BODY7 = ROOT / "assets" / "fonts" / "Nunito-700.ttf"
F_BODY4 = ROOT / "assets" / "fonts" / "Nunito-400.ttf"

THEMES = {
    "membaca": {
        "main": (47, 123, 246), "deep": (18, 63, 149), "soft": (232, 242, 255),
        "soft2": (206, 229, 255), "accent": (255, 210, 63), "orange": (255, 154, 60),
        "green": (46, 207, 126), "ink": (22, 48, 90), "light": (255, 255, 255)
    },
    "berhitung": {
        "main": (245, 176, 0), "deep": (138, 100, 0), "soft": (255, 248, 219),
        "soft2": (255, 236, 176), "accent": (47, 123, 246), "orange": (255, 154, 60),
        "green": (46, 207, 126), "ink": (60, 42, 0), "light": (255, 255, 255)
    },
    "tumbuhan": {
        "main": (21, 154, 88), "deep": (9, 92, 54), "soft": (232, 251, 241),
        "soft2": (200, 245, 223), "accent": (255, 210, 63), "orange": (255, 154, 60),
        "green": (46, 207, 126), "ink": (14, 64, 44), "light": (255, 255, 255)
    }
}

VIDEO_DATA = [
    {
        "id": "membaca",
        "title": "Membaca Itu Seru",
        "subject": "Bahasa Indonesia",
        "grade": "Kelas 1-2",
        "number": 1,
        "scenes": [
            {"kind": "title", "kicker": "VIDEO PEMBELAJARAN 1", "title": "Membaca Itu Seru",
             "body": "Kenali huruf vokal, suku kata, dan kalimat sederhana bersama Huhu.",
             "narration": "Halo teman! Aku Huhu. Hari ini kita belajar membaca. Membaca itu seru, lo!"},
            {"kind": "vowels", "kicker": "LANGKAH 1", "title": "Huruf Vokal",
             "body": "Huruf vokal ada lima. Bunyinya keluar dengan bebas, jadi mudah diucapkan.",
             "narration": "Huruf vokal ada lima, yaitu a, i, u, e, dan o. Ayo ucapkan bersama: a, i, u, e, o."},
            {"kind": "syllables", "kicker": "LANGKAH 2", "title": "Membaca Suku Kata",
             "body": "Suku kata adalah potongan bunyi pada kata. Kata buku punya dua suku kata.",
             "narration": "Suku kata adalah potongan bunyi pada kata. Kata buku terdiri dari dua suku kata: bu dan ku."},
            {"kind": "sentence", "kicker": "LANGKAH 3", "title": "Menulis Kalimat",
             "body": "Kalimat dimulai dengan huruf kapital dan diakhiri dengan tanda titik.",
             "narration": "Kalimat dimulai dengan huruf kapital dan diakhiri tanda titik. Contohnya: Budi membaca buku."},
            {"kind": "tips", "kicker": "LANGKAH 4", "title": "Kebiasaan Membaca",
             "body": "Membaca sedikit setiap hari membuat kemampuanmu semakin kuat.",
             "narration": "Biasakan membaca sepuluh menit setiap hari. Tunjuk kata yang kamu baca agar tidak terlewat."},
            {"kind": "closing", "kicker": "SELESAI", "title": "Siap untuk Kuis?",
             "body": "Tonton sampai habis, lalu jawab tiga pertanyaan tentang membaca.",
             "narration": "Hebat! Sekarang kamu siap menjawab kuis membaca. Sampai jumpa di petualangan berikutnya!"}
        ]
    },
    {
        "id": "berhitung",
        "title": "Berhitung Ceria",
        "subject": "Matematika",
        "grade": "Kelas 3-4",
        "number": 2,
        "scenes": [
            {"kind": "title", "kicker": "VIDEO PEMBELAJARAN 2", "title": "Berhitung Ceria",
             "body": "Belajar penjumlahan, pengurangan, dan perkalian dengan contoh mudah.",
             "narration": "Halo teman! Aku Huhu. Hari ini kita berhitung bersama. Siapkan semangatmu, ya!"},
            {"kind": "addition", "kicker": "LANGKAH 1", "title": "Penjumlahan",
             "body": "Susun angka sesuai nilai tempat: satuan, puluhan, lalu ratusan.",
             "narration": "Mari kita jumlahkan 125 ditambah 40. Satuan lima ditambah nol sama dengan lima. Hasilnya 165."},
            {"kind": "subtraction", "kicker": "LANGKAH 2", "title": "Pengurangan",
             "body": "Jika angka satuan kurang, pinjam satu puluhan dari angka di sebelahnya.",
             "narration": "Sekarang pengurangan. 90 dikurangi 25. Pinjam satu puluhan, hasilnya 65."},
            {"kind": "multiplication", "kicker": "LANGKAH 3", "title": "Perkalian",
             "body": "Perkalian adalah penjumlahan berulang. Tiga kelompok berisi empat bintang.",
             "narration": "Perkalian adalah penjumlahan berulang. 3 kali 4 sama dengan 4 ditambah 4 ditambah 4, yaitu 12."},
            {"kind": "practice", "kicker": "LANGKAH 4", "title": "Ayo Berlatih",
             "body": "Hitung satuan lebih dulu, kemudian puluhan. Jangan lupa memeriksa hasilnya.",
             "narration": "Ayo coba lagi: 24 ditambah 12 sama dengan 36. Hitung satuan dulu, lalu puluhan."},
            {"kind": "closing", "kicker": "SELESAI", "title": "Siap untuk Kuis?",
             "body": "Uji kemampuan berhitungmu dengan tiga pertanyaan seru.",
             "narration": "Kamu hebat! Sekarang coba kuis berhitung. Terus berlatih, ya!"}
        ]
    },
    {
        "id": "tumbuhan",
        "title": "Dunia Tumbuhan",
        "subject": "Ilmu Pengetahuan Alam",
        "grade": "Kelas 4-6",
        "number": 3,
        "scenes": [
            {"kind": "title", "kicker": "VIDEO PEMBELAJARAN 3", "title": "Dunia Tumbuhan",
             "body": "Mengenal bagian tumbuhan, fotosintesis, dan cara merawatnya.",
             "narration": "Halo teman! Aku Huhu. Hari ini kita menjelajahi dunia tumbuhan. Yuk, mulai!"},
            {"kind": "plantparts", "kicker": "LANGKAH 1", "title": "Bagian Tumbuhan",
             "body": "Akar, batang, daun, dan bunga memiliki tugas penting untuk tumbuhan.",
             "narration": "Tumbuhan punya akar, batang, daun, dan bunga. Setiap bagian punya tugas penting."},
            {"kind": "plantfunctions", "kicker": "LANGKAH 2", "title": "Tugas Setiap Bagian",
             "body": "Akar menyerap air, batang mengangkut air, dan daun membuat makanan.",
             "narration": "Akar menyerap air dari tanah. Batang mengangkut air ke seluruh bagian tumbuhan."},
            {"kind": "photosynthesis", "kicker": "LANGKAH 3", "title": "Fotosintesis",
             "body": "Daun memasak makanan dengan bantuan cahaya matahari. Prosesnya disebut fotosintesis.",
             "narration": "Daun memasak makanan dengan bantuan cahaya matahari. Proses ini disebut fotosintesis."},
            {"kind": "plantcare", "kicker": "LANGKAH 4", "title": "Merawat Tumbuhan",
             "body": "Siram secara teratur, beri cahaya matahari, dan jangan mencabut tanaman.",
             "narration": "Fotosintesis menghasilkan oksigen dan makanan. Oksigen itulah yang kita hirup setiap hari. Karena itu, kita perlu menjaga tumbuhan."},
            {"kind": "closing", "kicker": "SELESAI", "title": "Siap untuk Kuis?",
             "body": "Jawab tiga pertanyaan tentang tumbuhan dan raih bintangmu.",
             "narration": "Siram tumbuhan secara teratur, beri cahaya matahari yang cukup, dan jangan mencabutnya. Sampai jumpa di petualangan berikutnya!"}
        ]
    }
]


def font(path, size):
    return ImageFont.truetype(str(path), size)


def text_len(draw, text, fnt):
    try:
        return draw.textlength(text, font=fnt)
    except AttributeError:
        return fnt.getsize(text)[0]


def wrap(draw, text, fnt, max_width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = (current + " " + word).strip()
        if text_len(draw, candidate, fnt) <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_lines(draw, xy, lines, fnt, fill, spacing=10, anchor="la"):
    x, y = xy
    line_h = fnt.size + spacing
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill, anchor=anchor)
        y += line_h
    return y


def gradient(size, c1, c2, diagonal=True):
    w, h = size
    x = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    t = (x * 0.42 + y * 0.58) if diagonal else np.repeat(y, w, axis=1)
    arr = np.zeros((h, w, 3), dtype=np.float32)
    for i in range(3):
        arr[:, :, i] = c1[i] + (c2[i] - c1[i]) * t
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGB").convert("RGBA")


def overlay(base, image, pos=(0, 0)):
    base.alpha_composite(image, pos)


def blob(base, box, color, alpha=55):
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.ellipse(box, fill=color + (alpha,))
    base.alpha_composite(lay)


def star(draw, cx, cy, r, fill, outline=None, width=2):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
    draw.polygon(pts, fill=fill, outline=outline)
    if outline:
        draw.line(pts + [pts[0]], fill=outline, width=width, joint="curve")


def check_mark(d, cx, cy, size, color, width=4):
    d.line([(cx - size * 0.42, cy + size * 0.02),
            (cx - size * 0.08, cy + size * 0.34),
            (cx + size * 0.46, cy - size * 0.34)],
           fill=color, width=width, joint="curve")


def rounded(base, box, radius, fill, outline=None, width=3, shadow=True, shadow_color=(18, 63, 149, 30)):
    if shadow:
        lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        d.rounded_rectangle([box[0] + 0, box[1] + 10, box[2] + 0, box[3] + 12], radius, fill=shadow_color)
        lay = lay.filter(ImageFilter.GaussianBlur(12))
        base.alpha_composite(lay)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)


def paste_icon(base, code, box, center):
    path = ICONS / (code + ".png")
    if not path.exists():
        return
    icon = Image.open(path).convert("RGBA")
    icon.thumbnail(box, Image.LANCZOS)
    base.alpha_composite(icon, (int(center[0] - icon.width / 2), int(center[1] - icon.height / 2)))


def paste_mascot(base, center, height):
    mascot = Image.open(IMG / "mascot.png").convert("RGBA")
    ratio = height / mascot.height
    mascot = mascot.resize((int(mascot.width * ratio), height), Image.LANCZOS)
    base.alpha_composite(mascot, (int(center[0] - mascot.width / 2), int(center[1] - mascot.height / 2)))


def brand(base, theme, light=False):
    d = ImageDraw.Draw(base)
    logo = Image.open(IMG / "logo.png").convert("RGBA")
    logo.thumbnail((46, 46), Image.LANCZOS)
    base.alpha_composite(logo, (64, 40))
    color = (255, 255, 255) if light else theme["deep"]
    sub = (255, 255, 255, 180) if light else (116, 136, 165)
    d.text((122, 40), "Fun Learning", font=font(F_HEAD, 24), fill=color)
    d.text((122, 66), "A D V E N T U R E", font=font(F_BODY7, 12), fill=sub)


def footer(base, theme, index, total, light=False):
    d = ImageDraw.Draw(base)
    color = (255, 255, 255, 190) if light else (116, 136, 165)
    d.line([(64, 652), (1216, 652)], fill=(255, 255, 255, 55) if light else theme["soft2"], width=2)
    d.text((64, 666), "Media pembelajaran interaktif untuk siswa Sekolah Dasar", font=font(F_BODY4, 16), fill=color)
    d.text((1216, 666), f"{index + 1} / {total}", font=font(F_BODY7, 16), fill=color, anchor="ra")


def alpha_round(base, box, radius, fill=None, outline=None, width=2):
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)
    base.alpha_composite(lay)


def subject_pill(base, theme, video, light=False):
    d = ImageDraw.Draw(base)
    label = video["subject"] + "  ·  " + video["grade"]
    fnt = font(F_BODY7, 17)
    tw = text_len(d, label, fnt)
    x2, y = 1216, 44
    x1 = x2 - tw - 36
    fill = (255, 255, 255, 34) if light else theme["soft"]
    outline = (255, 255, 255, 90) if light else theme["soft2"]
    alpha_round(base, [x1, y, x2, y + 38], 19, fill=fill, outline=outline, width=2)
    d = ImageDraw.Draw(base)
    d.text(((x1 + x2) / 2, y + 9), label, font=fnt, fill=(255, 255, 255) if light else theme["deep"], anchor="ma")


def kicker(base, theme, text, xy, light=False):
    d = ImageDraw.Draw(base)
    fnt = font(F_BODY7, 15)
    tw = text_len(d, text, fnt)
    x, y = xy
    fill = (255, 255, 255, 32) if light else theme["soft"]
    outline = (255, 255, 255, 80) if light else theme["soft2"]
    alpha_round(base, [x, y, x + tw + 30, y + 32], 16, fill=fill, outline=outline, width=2)
    d = ImageDraw.Draw(base)
    d.text((x + 15, y + 7), text, font=fnt, fill=(255, 255, 255) if light else theme["deep"])


def badge(base, theme, text, xy, color):
    d = ImageDraw.Draw(base)
    fnt = font(F_BODY7, 15)
    tw = text_len(d, text, fnt)
    x, y = xy
    alpha_round(base, [x, y, x + tw + 26, y + 32], 16, fill=color + (36,), outline=color + (110,), width=2)
    d = ImageDraw.Draw(base)
    d.text((x + 13, y + 7), text, font=fnt, fill=color)


def content_slide(video, scene, theme, index, total):
    base = gradient((W, H), (250, 253, 255), theme["soft"])
    blob(base, (-180, 360, 300, 820), theme["soft2"], 90)
    blob(base, (1040, -160, 1420, 220), theme["soft2"], 70)
    d = ImageDraw.Draw(base)
    brand(base, theme)
    subject_pill(base, theme, video)
    kicker(base, theme, scene["kicker"], (88, 138))

    title_f = font(F_HEAD, 54)
    title_lines = wrap(d, scene["title"], title_f, 520)
    y = draw_lines(d, (88, 184), title_lines, title_f, theme["deep"], spacing=2)

    body_f = font(F_BODY, 25)
    body_lines = wrap(d, scene["body"], body_f, 520)
    draw_lines(d, (88, y + 16), body_lines, body_f, (58, 78, 108), spacing=8)

    # Panel visual
    rounded(base, [660, 148, 1216, 596], 34, (255, 255, 255), (255, 255, 255), 3,
            shadow=True, shadow_color=theme["main"] + (28,))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([660, 148, 1216, 596], 34, outline=theme["soft2"], width=2)

    box = (690, 178, 1186, 566)
    kind = scene["kind"]
    if kind == "vowels":
        visual_vowels(base, box, theme)
    elif kind == "syllables":
        visual_syllables(base, box, theme)
    elif kind == "sentence":
        visual_sentence(base, box, theme)
    elif kind == "tips":
        visual_tips(base, box, theme)
    elif kind == "addition":
        visual_addition(base, box, theme)
    elif kind == "subtraction":
        visual_subtraction(base, box, theme)
    elif kind == "multiplication":
        visual_multiplication(base, box, theme)
    elif kind == "practice":
        visual_practice(base, box, theme)
    elif kind == "plantparts":
        visual_plant_parts(base, box, theme)
    elif kind == "plantfunctions":
        visual_plant_functions(base, box, theme)
    elif kind == "photosynthesis":
        visual_photosynthesis(base, box, theme)
    elif kind == "plantcare":
        visual_plant_care(base, box, theme)

    footer(base, theme, index, total)
    return base


def title_slide(video, scene, theme, index, total):
    dark = theme["deep"]
    base = gradient((W, H), theme["main"], dark)
    # Dekorasi
    blob(base, (-160, 380, 420, 920), (255, 255, 255), 26)
    blob(base, (820, -220, 1420, 380), (255, 255, 255), 22)
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for i in range(26):
        x = 60 + (i * 137) % 1180
        y = 40 + (i * 91) % 620
        r = 2 + (i % 3)
        d.ellipse([x, y, x + r * 2, y + r * 2], fill=(255, 255, 255, 100))
    base.alpha_composite(lay)

    d = ImageDraw.Draw(base)
    brand(base, theme, light=True)
    subject_pill(base, theme, video, light=True)
    kicker(base, theme, scene["kicker"], (88, 168), light=True)

    # Warna teks: kuning memakai tinta gelap agar kontras
    if video["id"] == "berhitung":
        head_color = (60, 42, 0)
        body_color = (92, 68, 12)
        bar_color = (255, 255, 255, 80)
    else:
        head_color = (255, 255, 255)
        body_color = (235, 244, 255)
        bar_color = (255, 255, 255, 90)

    title_f = font(F_HEAD, 78)
    lines = wrap(d, scene["title"], title_f, 660)
    y = draw_lines(d, (88, 216), lines, title_f, head_color, spacing=0)
    draw_lines(d, (88, y + 12), wrap(d, scene["body"], font(F_BODY, 27), 640), font(F_BODY, 27), body_color, spacing=7)

    # Tombol dekoratif
    pill_y = 556
    d.rounded_rectangle([88, pill_y, 360, pill_y + 54], 27, fill=theme["accent"] + (255,), outline=(0, 0, 0, 0))
    btn_text = (255, 255, 255) if video["id"] == "berhitung" else (58, 42, 0)
    d.text((224, pill_y + 14), "Tonton sampai habis", font=font(F_HEAD7, 21), fill=btn_text, anchor="ma")

    # Maskot
    d.ellipse([842, 168, 1202, 598], fill=(255, 255, 255, 235))
    d.ellipse([860, 186, 1184, 580], outline=(255, 255, 255, 150), width=4)
    # Lingkaran putus-putus
    for i in range(32):
        ang = i * math.pi / 16
        x1 = 1022 + 196 * math.cos(ang)
        y1 = 383 + 196 * math.sin(ang)
        x2 = 1022 + 206 * math.cos(ang)
        y2 = 383 + 206 * math.sin(ang)
        d.line([(x1, y1), (x2, y2)], fill=(255, 255, 255, 110), width=4)
    paste_mascot(base, (1022, 390), 430)

    icon = {"membaca": "1F4DA", "berhitung": "1F9E0", "tumbuhan": "1F331"}[video["id"]]
    paste_icon(base, icon, (78, 78), (1000, 220))
    star(d, 872, 520, 24, (255, 210, 63), (226, 168, 0, 255), 2)
    star(d, 1180, 300, 18, (255, 210, 63), (226, 168, 0, 255), 2)
    footer(base, theme, index, total, light=True)
    return base


def closing_slide(video, scene, theme, index, total):
    base = gradient((W, H), theme["main"], theme["deep"])
    blob(base, (-140, 400, 360, 900), (255, 255, 255), 24)
    blob(base, (760, -160, 1380, 360), (255, 255, 255), 20)
    brand(base, theme, light=True)
    subject_pill(base, theme, video, light=True)
    d = ImageDraw.Draw(base)

    if video["id"] == "berhitung":
        head_color, body_color = (60, 42, 0), (92, 68, 12)
    else:
        head_color, body_color = (255, 255, 255), (236, 245, 255)

    kicker(base, theme, scene["kicker"], (88, 162), light=True)
    draw_lines(d, (88, 210), wrap(d, scene["title"], font(F_HEAD, 68), 620), font(F_HEAD, 68), head_color, spacing=0)
    draw_lines(d, (88, 322), wrap(d, scene["body"], font(F_BODY, 27), 620), font(F_BODY, 27), body_color, spacing=8)

    items = ["Tonton sampai habis", "Jawab 3 pertanyaan", "Kumpulkan bintang"]
    check_color = (255, 255, 255) if video["id"] == "berhitung" else (58, 42, 0)
    for i, item in enumerate(items):
        y = 448 + i * 46
        d.ellipse([88, y, 120, y + 32], fill=theme["accent"])
        check_mark(d, 104, y + 17, 20, check_color, 3)
        d.text((134, y + 4), item, font=font(F_BODY7, 21), fill=head_color if head_color != (255, 255, 255) else (240, 247, 255))

    d.rounded_rectangle([88, 596, 380, 636], 20, fill=theme["accent"])
    pill_text = (255, 255, 255) if video["id"] == "berhitung" else (58, 42, 0)
    d.text((234, 604), "Kuis Kilat menantimu!", font=font(F_HEAD7, 18), fill=pill_text, anchor="ma")

    d.ellipse([842, 168, 1202, 598], fill=(255, 255, 255, 235))
    for i in range(32):
        ang = i * math.pi / 16
        d.line([(1022 + 196 * math.cos(ang), 383 + 196 * math.sin(ang)),
                (1022 + 206 * math.cos(ang), 383 + 206 * math.sin(ang))],
               fill=(255, 255, 255, 110), width=4)
    paste_mascot(base, (1022, 390), 430)
    star(d, 880, 210, 22, (255, 210, 63), (226, 168, 0, 255), 2)
    star(d, 1168, 520, 18, (255, 210, 63), (226, 168, 0, 255), 2)
    footer(base, theme, index, total, light=True)
    return base


# ---------------- Visual konten ----------------

def panel_header(base, box, theme, label):
    d = ImageDraw.Draw(base)
    d.text((box[0], box[1] - 34), label, font=font(F_BODY7, 15), fill=theme["deep"])
    d.line([(box[0], box[1] - 10), (box[0] + 52, box[1] - 10)], fill=theme["main"], width=4)


def visual_vowels(base, box, theme):
    d = ImageDraw.Draw(base)
    data = [("a", "api", (47, 123, 246)), ("i", "ibu", (255, 154, 60)),
            ("u", "ubi", (46, 207, 126)), ("e", "ember", (139, 92, 246)),
            ("o", "obat", (239, 91, 91))]
    x0, y0, x1, y1 = box
    step = (x1 - x0) / 5
    for i, (letter, word, color) in enumerate(data):
        cx = x0 + step * (i + 0.5)
        cy = y0 + 105
        d.ellipse([cx - 38, cy - 38, cx + 38, cy + 38], fill=color + (255,), outline=(255, 255, 255), width=4)
        d.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], outline=(255, 255, 255, 110), width=2)
        d.text((cx, cy - 2), letter, font=font(F_HEAD, 52), fill=(255, 255, 255), anchor="mm")
        d.text((cx, cy + 58), word, font=font(F_BODY7, 18), fill=theme["ink"], anchor="ma")
    d.rounded_rectangle([x0 + 26, y0 + 258, x1 - 26, y0 + 318], 20, fill=theme["soft"], outline=theme["soft2"], width=2)
    d.text(((x0 + x1) / 2, y0 + 276), "Huruf hidup bisa dibunyikan sendiri.", font=font(F_BODY, 20), fill=theme["deep"], anchor="ma")
    star(d, x1 - 40, y0 + 40, 15, (255, 210, 63))


def visual_syllables(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    cy = y0 + 96
    specs = [("bu", (47, 123, 246), 700, 100), ("ku", (255, 154, 60), 846, 100), ("buku", (46, 207, 126), 1000, 140)]
    for text, color, x, w in specs:
        alpha_round(base, [x, cy - 62, x + w, cy + 62], 20, fill=color + (32,), outline=color + (255,), width=4)
        d = ImageDraw.Draw(base)
        d.text((x + w / 2, cy - 4), text, font=font(F_HEAD, 44 if text != "buku" else 40), fill=color, anchor="mm")
    d.text((816, cy - 20), "+", font=font(F_HEAD, 38), fill=theme["ink"], anchor="ma")
    d.text((966, cy - 20), "=", font=font(F_HEAD, 38), fill=theme["ink"], anchor="ma")

    d.rounded_rectangle([x0 + 30, y0 + 205, x1 - 30, y0 + 262], 16, fill=(255, 255, 255), outline=theme["soft2"], width=2)
    d.text(((x0 + x1) / 2, y0 + 220), "bu  +  ku  =  buku", font=font(F_HEAD7, 26), fill=theme["deep"], anchor="ma")

    for i, (label, x) in enumerate([("tepuk 1", 805), ("tepuk 2", 980)]):
        d.ellipse([x - 24, y0 + 286, x + 24, y0 + 334], fill=theme["soft"], outline=theme["main"], width=3)
        d.text((x, y0 + 300), str(i + 1), font=font(F_HEAD, 22), fill=theme["deep"], anchor="mm")
        d.text((x, y0 + 344), label, font=font(F_BODY7, 16), fill=theme["deep"], anchor="ma")


def visual_sentence(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0, y0 + 20, x1, y0 + 222], 24, fill=(255, 253, 244), outline=(255, 226, 150), width=3)
    sentence = "Budi membaca buku."
    fnt = font(F_HEAD, 46)
    pieces = [("B", theme["orange"]), ("udi membaca buku", theme["ink"]), (".", theme["green"])]
    total = sum(text_len(d, p[0], fnt) for p in pieces)
    x = (x0 + x1) / 2 - total / 2
    y = y0 + 100
    positions = []
    for text, color in pieces:
        d.text((x, y), text, font=fnt, fill=color, anchor="lm")
        positions.append((x, text_len(d, text, fnt)))
        x += text_len(d, text, fnt)
    d.line([(positions[0][0], y + 32), (positions[0][0] + positions[0][1], y + 32)], fill=theme["orange"], width=4)
    last_x, last_w = positions[-1]
    d.line([(last_x + 2, y + 32), (last_x + last_w, y + 32)], fill=theme["green"], width=4)

    tags = [("Huruf kapital", theme["orange"], 700), ("Tanda titik", theme["green"], 900)]
    for label, color, x in tags:
        alpha_round(base, [x, y0 + 250, x + 168, y0 + 288], 19, fill=color + (32,), outline=color + (130,), width=2)
        d = ImageDraw.Draw(base)
        d.text((x + 84, y0 + 259), label, font=font(F_BODY7, 16), fill=color, anchor="ma")
    d.text(((x0 + x1) / 2, y0 + 318), "Awal kalimat dan akhir kalimat.", font=font(F_BODY, 20), fill=(78, 96, 122), anchor="ma")


def visual_tips(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    rows = [("Luangkan 10 menit", "Membaca setiap hari membuatmu lancar."),
            ("Tunjuk kata", "Arahkan jari pada kata yang dibaca."),
            ("Baca nyaring", "Baca dengan suara jelas dan gembira.")]
    for i, (title, desc) in enumerate(rows):
        y = y0 + 22 + i * 112
        d.rounded_rectangle([x0 + 14, y, x1 - 14, y + 94], 20, fill=theme["soft"] if i % 2 == 0 else (255, 255, 255), outline=theme["soft2"], width=2)
        d.ellipse([x0 + 32, y + 24, x0 + 78, y + 70], fill=theme["main"])
        d.text((x0 + 55, y + 46), str(i + 1), font=font(F_HEAD, 24), fill=(255, 255, 255), anchor="mm")
        d.text((x0 + 94, y + 18), title, font=font(F_HEAD7, 23), fill=theme["deep"])
        d.text((x0 + 94, y + 50), desc, font=font(F_BODY, 17), fill=(80, 98, 124))


def column_card(base, box, theme, title):
    d = ImageDraw.Draw(base)
    rounded(base, [box[0], box[1], box[2], box[3]], 24, (255, 253, 246), (255, 226, 150), 3, shadow=False)
    d.text((box[0] + 24, box[1] + 16), title, font=font(F_BODY7, 15), fill=(154, 111, 0))


def draw_digits(d, cx, y, digits, color, size=46):
    f = font(F_HEAD, size)
    for i, ch in enumerate(str(digits)):
        d.text((cx + i * 52, y), ch, font=f, fill=color, anchor="ma")


def visual_addition(base, box, theme):
    column_card(base, [box[0] + 10, box[1] + 10, box[2] - 10, box[3] - 10], theme, "SUSUN KE BAWAH")
    d = ImageDraw.Draw(base)
    cx = [box[0] + 170, box[0] + 282, box[0] + 394]
    labels = [("Ratusan", cx[0]), ("Puluhan", cx[1]), ("Satuan", cx[2])]
    for label, x in labels:
        d.rounded_rectangle([x - 44, box[1] + 52, x + 44, box[1] + 80], 14, fill=theme["soft"])
        d.text((x, box[1] + 57), label, font=font(F_BODY7, 13), fill=theme["deep"], anchor="ma")

    draw_digits(d, cx[0], box[1] + 100, "1", theme["ink"])
    d.text((cx[1], box[1] + 100), "2", font=font(F_HEAD, 46), fill=theme["ink"], anchor="ma")
    d.text((cx[2], box[1] + 100), "5", font=font(F_HEAD, 46), fill=theme["ink"], anchor="ma")
    d.text((box[0] + 88, box[1] + 168), "+", font=font(F_HEAD, 40), fill=theme["orange"], anchor="ma")
    d.text((cx[1], box[1] + 168), "4", font=font(F_HEAD, 46), fill=theme["orange"], anchor="ma")
    d.text((cx[2], box[1] + 168), "0", font=font(F_HEAD, 46), fill=theme["orange"], anchor="ma")
    d.line([(box[0] + 66, box[1] + 226), (box[0] + 452, box[1] + 226)], fill=(214, 178, 96), width=4)
    d.text((cx[0], box[1] + 242), "1", font=font(F_HEAD, 50), fill=theme["green"], anchor="ma")
    d.text((cx[1], box[1] + 242), "6", font=font(F_HEAD, 50), fill=theme["green"], anchor="ma")
    d.text((cx[2], box[1] + 242), "5", font=font(F_HEAD, 50), fill=theme["green"], anchor="ma")

    d.rounded_rectangle([box[0] + 84, box[3] - 58, box[2] - 84, box[3] - 14], 22, fill=theme["soft"], outline=theme["soft2"], width=2)
    d.text(((box[0] + box[2]) / 2, box[3] - 50), "125 + 40 = 165", font=font(F_HEAD7, 25), fill=theme["deep"], anchor="ma")


def visual_subtraction(base, box, theme):
    column_card(base, [box[0] + 10, box[1] + 10, box[2] - 10, box[3] - 10], theme, "PINJAM SATU PULUHAN")
    d = ImageDraw.Draw(base)
    cx = [box[0] + 276, box[0] + 392]
    for label, x in [("Puluhan", cx[0]), ("Satuan", cx[1])]:
        d.rounded_rectangle([x - 44, box[1] + 52, x + 44, box[1] + 80], 14, fill=theme["soft"])
        d.text((x, box[1] + 57), label, font=font(F_BODY7, 13), fill=theme["deep"], anchor="ma")

    d.text((cx[0], box[1] + 100), "9", font=font(F_HEAD, 46), fill=theme["ink"], anchor="ma")
    d.text((cx[1], box[1] + 100), "0", font=font(F_HEAD, 46), fill=theme["ink"], anchor="ma")
    d.text((cx[0] - 34, box[1] + 94), "8", font=font(F_HEAD, 20), fill=theme["orange"], anchor="ma")
    d.text((cx[1] - 4, box[1] + 94), "10", font=font(F_HEAD, 20), fill=theme["orange"], anchor="ma")
    d.text((box[0] + 88, box[1] + 168), "−", font=font(F_HEAD, 40), fill=theme["orange"], anchor="ma")
    d.text((cx[0], box[1] + 168), "2", font=font(F_HEAD, 46), fill=theme["orange"], anchor="ma")
    d.text((cx[1], box[1] + 168), "5", font=font(F_HEAD, 46), fill=theme["orange"], anchor="ma")
    d.line([(box[0] + 66, box[1] + 226), (box[0] + 452, box[1] + 226)], fill=(214, 178, 96), width=4)
    d.text((cx[0], box[1] + 242), "6", font=font(F_HEAD, 50), fill=theme["green"], anchor="ma")
    d.text((cx[1], box[1] + 242), "5", font=font(F_HEAD, 50), fill=theme["green"], anchor="ma")
    d.rounded_rectangle([box[0] + 84, box[3] - 58, box[2] - 84, box[3] - 14], 22, fill=theme["soft"], outline=theme["soft2"], width=2)
    d.text(((box[0] + box[2]) / 2, box[3] - 50), "90 − 25 = 65", font=font(F_HEAD7, 25), fill=theme["deep"], anchor="ma")


def visual_multiplication(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    colors = [(255, 154, 60), (47, 123, 246), (46, 207, 126)]
    for row in range(3):
        for col in range(4):
            star(d, x0 + 120 + col * 58, y0 + 55 + row * 72, 18, colors[row], (255, 255, 255, 255), 2)
    d.text((x0 + 26, y0 + 92), "3", font=font(F_HEAD, 56), fill=theme["deep"], anchor="ma")
    d.text((x0 + 26, y0 + 158), "×", font=font(F_HEAD, 30), fill=theme["ink"], anchor="ma")
    d.text((x0 + 26, y0 + 210), "4", font=font(F_HEAD, 56), fill=theme["deep"], anchor="ma")
    d.text((x0 + 390, y0 + 40), "12", font=font(F_HEAD, 64), fill=theme["green"], anchor="ma")
    d.text((x0 + 390, y0 + 128), "bintang", font=font(F_BODY7, 18), fill=(80, 98, 124), anchor="ma")
    d.rounded_rectangle([x0 + 40, y1 - 66, x1 - 40, y1 - 18], 24, fill=theme["soft"], outline=theme["soft2"], width=2)
    d.text(((x0 + x1) / 2, y1 - 56), "4 + 4 + 4 = 12", font=font(F_HEAD7, 25), fill=theme["deep"], anchor="ma")


def visual_practice(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0 + 30, y0 + 10, x1 - 30, y0 + 154], 24, fill=(255, 253, 246), outline=(255, 226, 150), width=3)
    d.text(((x0 + x1) / 2, y0 + 38), "24 + 12", font=font(F_HEAD, 62), fill=theme["ink"], anchor="ma")
    steps = [("4 + 2 = 6", "satuan"), ("2 + 1 = 3", "puluhan")]
    for i, (formula, label) in enumerate(steps):
        x = x0 + 54 + i * 220
        d.rounded_rectangle([x, y0 + 190, x + 190, y0 + 278], 20, fill=theme["soft"], outline=theme["soft2"], width=2)
        d.text((x + 95, y0 + 205), formula, font=font(F_HEAD7, 27), fill=theme["deep"], anchor="ma")
        d.text((x + 95, y0 + 244), label, font=font(F_BODY7, 16), fill=(96, 112, 136), anchor="ma")
    alpha_round(base, [x1 - 228, y0 + 300, x1 - 40, y0 + 360], 28, fill=theme["green"] + (32,), outline=theme["green"], width=3)
    d = ImageDraw.Draw(base)
    d.text((x1 - 134, y0 + 309), "= 36", font=font(F_HEAD, 34), fill=theme["green"], anchor="ma")


def leaf_shape(d, cx, cy, w, h, color, angle=0):
    # Daun lonjong dengan ujung runcing, lalu diputar.
    upper, lower = [], []
    steps = 24
    for i in range(steps + 1):
        u = i / steps
        x = -w / 2 + u * w
        y = -h / 2 * math.sin(math.pi * u)
        upper.append((x, y))
        lower.append((x, -y))
    pts = upper + lower[::-1]
    rad = math.radians(angle)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    rotated = []
    for x, y in pts:
        rx = cx + x * cos_a - y * sin_a
        ry = cy + x * sin_a + y * cos_a
        rotated.append((rx, ry))
    d.polygon(rotated, fill=color, outline=(15, 120, 68), width=2)
    mx1 = cx + (-w / 2 + 6) * cos_a
    my1 = cy + (-w / 2 + 6) * sin_a
    mx2 = cx + (w / 2 - 6) * cos_a
    my2 = cy + (w / 2 - 6) * sin_a
    d.line([(mx1, my1), (mx2, my2)], fill=(15, 120, 68), width=2)


def visual_plant_parts(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    soil_y = y0 + 266
    # Tanah
    d.rounded_rectangle([x0 + 20, soil_y, x1 - 20, y1 - 20], 20, fill=(138, 90, 52), outline=(106, 66, 36), width=3)
    for i in range(18):
        px = x0 + 40 + (i * 53) % 420
        py = soil_y + 18 + (i * 37) % 100
        d.ellipse([px, py, px + 8, py + 8], fill=(166, 116, 72))
    # Akar
    for dx, dy in [(-44, 70), (-18, 92), (8, 64), (34, 86), (58, 60)]:
        d.line([(x0 + 268, soil_y + 8), (x0 + 268 + dx, soil_y + dy)], fill=(92, 56, 30), width=5)
        d.line([(x0 + 268 + dx, soil_y + dy), (x0 + 268 + dx + 12, soil_y + dy + 18)], fill=(92, 56, 30), width=3)
    # Batang
    d.line([(x0 + 268, soil_y), (x0 + 268, y0 + 118)], fill=(29, 138, 82), width=12)
    # Daun
    for cx, cy, w, h, ang in [(x0 + 208, y0 + 176, 86, 52, -28), (x0 + 330, y0 + 162, 86, 52, 28), (x0 + 200, y0 + 238, 74, 46, -20)]:
        leaf_shape(d, cx, cy, w, h, (46, 207, 126), ang)
    # Bunga
    for ang in range(0, 360, 72):
        rad = math.radians(ang)
        px = x0 + 268 + 26 * math.cos(rad)
        py = y0 + 96 + 26 * math.sin(rad)
        d.ellipse([px - 20, py - 20, px + 20, py + 20], fill=(255, 126, 179), outline=(214, 79, 138), width=2)
    d.ellipse([x0 + 248, y0 + 76, x0 + 288, y0 + 116], fill=(255, 210, 63), outline=(226, 168, 0), width=2)

    labels = [("Bunga", (x0 + 44, y0 + 34), (x0 + 244, y0 + 88)),
              ("Daun", (x1 - 86, y0 + 148), (x0 + 342, y0 + 168)),
              ("Batang", (x0 + 44, y0 + 184), (x0 + 262, y0 + 206)),
              ("Akar", (x1 - 74, y1 - 62), (x0 + 306, soil_y + 44))]
    for text, pos, target in labels:
        d.line([(pos[0] + 28, pos[1] + 10), target], fill=theme["deep"], width=2)
        d.ellipse([target[0] - 4, target[1] - 4, target[0] + 4, target[1] + 4], fill=theme["deep"])
        d.rounded_rectangle([pos[0], pos[1], pos[0] + 74, pos[1] + 28], 14, fill=(255, 255, 255), outline=theme["soft2"], width=2)
        d.text((pos[0] + 37, pos[1] + 5), text, font=font(F_BODY7, 14), fill=theme["deep"], anchor="ma")


def visual_plant_functions(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    rows = [("1F4A7", "Akar", "Menyerap air dan zat hara dari tanah."),
            ("1F331", "Batang", "Mengangkut air ke seluruh tubuh tumbuhan."),
            ("1F31E", "Daun", "Membuat makanan dengan bantuan cahaya.")]
    for i, (icon, title, desc) in enumerate(rows):
        y = y0 + 12 + i * 120
        d.rounded_rectangle([x0 + 12, y, x1 - 12, y + 102], 20, fill=theme["soft"] if i % 2 == 0 else (255, 255, 255), outline=theme["soft2"], width=2)
        d.ellipse([x0 + 30, y + 18, x0 + 96, y + 84], fill=(255, 255, 255))
        paste_icon(base, icon, (52, 52), (x0 + 63, y + 51))
        d.text((x0 + 118, y + 18), title, font=font(F_HEAD7, 25), fill=theme["deep"])
        d.text((x0 + 118, y + 54), desc, font=font(F_BODY, 17), fill=(80, 98, 124))


def visual_photosynthesis(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    # Matahari
    paste_icon(base, "1F31E", (78, 78), (x0 + 64, y0 + 46))
    d.text((x0 + 64, y0 + 94), "Cahaya", font=font(F_BODY7, 16), fill=theme["deep"], anchor="ma")
    # Daun
    d.ellipse([x0 + 200, y0 + 46, x0 + 360, y0 + 206], fill=theme["soft"], outline=theme["soft2"], width=3)
    paste_icon(base, "1F331", (118, 118), (x0 + 280, y0 + 126))
    d.text((x0 + 280, y0 + 214), "Daun", font=font(F_HEAD7, 22), fill=theme["deep"], anchor="ma")
    # Input air
    paste_icon(base, "1F4A7", (54, 54), (x0 + 42, y0 + 164))
    d.text((x0 + 42, y0 + 200), "Air", font=font(F_BODY7, 16), fill=(47, 123, 246), anchor="ma")
    # CO2
    d.rounded_rectangle([x1 - 96, y0 + 142, x1 - 12, y0 + 184], 18, fill=theme["soft"], outline=theme["soft2"], width=2)
    d.text((x1 - 54, y0 + 150), "CO2", font=font(F_HEAD7, 19), fill=theme["deep"], anchor="ma")

    # Panah
    d.line([(x0 + 76, y0 + 150), (x0 + 178, y0 + 130)], fill=(47, 123, 246), width=4)
    d.polygon([(x0 + 178, y0 + 130), (x0 + 162, y0 + 126), (x0 + 166, y0 + 140)], fill=(47, 123, 246))
    d.line([(x0 + 94, y0 + 84), (x0 + 210, y0 + 100)], fill=(226, 168, 0), width=4)
    d.polygon([(x0 + 210, y0 + 100), (x0 + 196, y0 + 92), (x0 + 198, y0 + 106)], fill=(226, 168, 0))
    d.line([(x1 - 104, y0 + 160), (x0 + 366, y0 + 152)], fill=(138, 100, 0), width=4)
    d.polygon([(x0 + 366, y0 + 152), (x0 + 380, y0 + 146), (x0 + 378, y0 + 160)], fill=(138, 100, 0))

    # Hasil
    for i, (icon, label, color) in enumerate([("1F34E", "Makanan", theme["orange"]), ("1F4A8", "Oksigen", theme["main"])]):
        x = x0 + 150 + i * 190
        d.ellipse([x - 40, y1 - 112, x + 40, y1 - 32], fill=(255, 255, 255), outline=color, width=3)
        check_mark(d, x, y1 - 72, 30, color, 5)
        d.text((x, y1 - 24), label, font=font(F_BODY7, 17), fill=theme["deep"], anchor="ma")
    d.text((x1 - 84, y0 + 250), "O2", font=font(F_HEAD7, 24), fill=theme["main"], anchor="ma")


def visual_plant_care(base, box, theme):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    cols = [("1F4A7", "Siram", "Beri air secukupnya setiap hari."),
            ("1F31E", "Cahaya", "Letakkan di tempat yang terang."),
            ("1F331", "Jaga", "Jangan dicabut atau dipetik sembarangan.")]
    width = (x1 - x0) / 3
    for i, (icon, title, desc) in enumerate(cols):
        cx = x0 + width * (i + 0.5)
        d.rounded_rectangle([cx - 76, y0 + 14, cx + 76, y0 + 270], 22, fill=theme["soft"] if i % 2 == 0 else (255, 255, 255), outline=theme["soft2"], width=3)
        d.ellipse([cx - 48, y0 + 38, cx + 48, y0 + 134], fill=(255, 255, 255))
        paste_icon(base, icon, (68, 68), (cx, y0 + 86))
        d.text((cx, y0 + 148), title, font=font(F_HEAD7, 24), fill=theme["deep"], anchor="ma")
        for j, line in enumerate(wrap(d, desc, font(F_BODY, 15), 132)):
            d.text((cx, y0 + 186 + j * 22), line, font=font(F_BODY, 15), fill=(80, 98, 124), anchor="ma")
    alpha_round(base, [x0 + 40, y1 - 78, x1 - 40, y1 - 22], 26, fill=theme["green"] + (30,), outline=theme["green"], width=2)
    d = ImageDraw.Draw(base)
    d.text(((x0 + x1) / 2, y1 - 68), "Tumbuhan sehat, udara segar!", font=font(F_BODY7, 19), fill=theme["green"], anchor="ma")


# ---------------- Audio ----------------

def tts_file(text, video_id, index):
    digest = hashlib.md5(text.encode("utf-8")).hexdigest()[:10]
    return TTS / f"{video_id}-{index:02d}-{digest}.mp3"


def make_tts(text, video_id, index):
    path = tts_file(text, video_id, index)
    if path.exists() and path.stat().st_size > 1000:
        return path
    last_error = None
    for attempt in range(4):
        try:
            gTTS(text=text, lang="id", slow=False).save(str(path))
            if path.stat().st_size > 1000:
                return path
        except Exception as error:  # noqa: BLE001
            last_error = error
            time.sleep(1.5 + attempt)
    print("  ! TTS gagal:", text[:60], last_error)
    return None


def decode_audio(mp3_path, wav_path):
    subprocess.run([FFMPEG, "-y", "-i", str(mp3_path), "-ar", str(SR), "-ac", "1", "-f", "wav", str(wav_path)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with wave.open(str(wav_path), "rb") as fh:
        data = fh.readframes(fh.getnframes())
    return np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0


def narration_audio(text, video_id, index):
    mp3 = make_tts(text, video_id, index)
    if mp3 is None:
        seconds = max(2.6, len(text.split()) / 2.3)
        return np.zeros(int(seconds * SR), dtype=np.float32)
    wav = AUDIO / f"{video_id}-{index:02d}.wav"
    try:
        return decode_audio(mp3, wav)
    except Exception as error:  # noqa: BLE001
        print("  ! decode gagal", error)
        return np.zeros(int(3 * SR), dtype=np.float32)


def make_music(duration, video_id):
    total = int(duration * SR)
    out = np.zeros(total + SR, dtype=np.float32)
    progressions = {
        "membaca": [[261.63, 329.63, 392.00], [196.00, 246.94, 293.66], [220.00, 261.63, 329.63], [174.61, 220.00, 261.63]],
        "berhitung": [[349.23, 440.00, 523.25], [261.63, 329.63, 392.00], [392.00, 493.88, 587.33], [220.00, 261.63, 329.63]],
        "tumbuhan": [[392.00, 493.88, 587.33], [261.63, 329.63, 392.00], [293.66, 369.99, 440.00], [329.63, 415.30, 493.88]]
    }
    chords = progressions[video_id]
    chord_len = 2.0
    idx = 0
    t0 = 0.0
    while t0 < duration:
        chord = chords[idx % len(chords)]
        n = int(min(chord_len, duration - t0) * SR)
        if n <= 0:
            break
        seg_t = np.arange(n) / SR
        env = np.minimum(1.0, seg_t / 0.35) * np.minimum(1.0, (chord_len - seg_t) / 0.6)
        env = np.clip(env, 0, 1)
        pad = np.zeros(n, dtype=np.float32)
        for f in chord:
            pad += np.sin(2 * np.pi * f * seg_t) * 0.035
        pad *= env
        start = int(t0 * SR)
        out[start:start + n] += pad.astype(np.float32)
        # Nada pluck sederhana
        step = 0.5
        k = 0
        while k * step < chord_len:
            note = chord[(k + 1) % len(chord)] * 2
            nt = int(step * SR)
            if start + int(k * step * SR) >= total:
                break
            tt = np.arange(nt) / SR
            pluck = np.sin(2 * np.pi * note * tt) * np.exp(-tt * 5.0) * 0.05
            s2 = start + int(k * step * SR)
            e2 = min(total, s2 + nt)
            out[s2:e2] += pluck[:e2 - s2].astype(np.float32)
            k += 1
        t0 += chord_len
        idx += 1

    out = out[:total]
    peak = float(np.max(np.abs(out))) or 1.0
    out = out / peak * 0.16
    fade = int(1.2 * SR)
    if len(out) > fade * 2:
        out[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
        out[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    return out


def write_wav(path, samples):
    data = np.clip(samples, -1, 1)
    data = (data * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as fh:
        fh.setnchannels(1)
        fh.setsampwidth(2)
        fh.setframerate(SR)
        fh.writeframes(data.tobytes())


# ---------------- Subtitle ----------------

def vtt_time(seconds):
    ms = int(round(seconds * 1000))
    h = ms // 3600000
    m = (ms % 3600000) // 60000
    s = (ms % 60000) // 1000
    r = ms % 1000
    return f"{h:02d}:{m:02d}:{s:02d}.{r:03d}"


def split_sentences(text):
    chunks = [chunk.strip() for chunk in re.split(r"(?<=[.!?])\s+", text) if chunk.strip()]
    return chunks or [text]


def build_vtt(scene_audio, narrations):
    lines = ["WEBVTT", ""]
    cursor = 0.0
    for (duration, _), text in zip(scene_audio, narrations):
        sentences = split_sentences(text)
        total_chars = sum(len(s) for s in sentences) or 1
        start = cursor + 0.25
        usable = max(0.8, duration - 0.45)
        for sentence in sentences:
            share = len(sentence) / total_chars
            end = min(cursor + duration - 0.12, start + usable * share)
            lines.append(f"{vtt_time(start)} --> {vtt_time(end)}")
            lines.append(sentence)
            lines.append("")
            start = end + 0.05
        cursor += duration
    return "\n".join(lines)


# ---------------- Video ----------------

def run_ffmpeg(args, label):
    result = subprocess.run([FFMPEG, "-y"] + args, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if result.returncode != 0:
        print(result.stderr.decode("utf-8", "replace")[-2500:])
        raise RuntimeError("ffmpeg gagal: " + label)


def render_slide(video, scene, theme, index, total):
    if scene["kind"] == "title":
        return title_slide(video, scene, theme, index, total)
    if scene["kind"] == "closing":
        return closing_slide(video, scene, theme, index, total)
    return content_slide(video, scene, theme, index, total)


def build_video(video):
    vid = video["id"]
    theme = THEMES[vid]
    theme["id"] = vid
    total = len(video["scenes"])
    print(f"\n=== {video['title']} ===")
    scene_audio = []
    narrations = []
    segs = []
    for i, scene in enumerate(video["scenes"]):
        img = render_slide(video, scene, theme, i, total)
        slide_path = SLIDES / f"{vid}-{i:02d}.png"
        if i == 0:
            img.convert("RGB").save(POSTERS / f"poster-{vid}.jpg", quality=90, optimize=True)
        img.convert("RGB").save(slide_path)
        print(f"  slide {i + 1}/{total}")

        audio = narration_audio(scene["narration"], vid, i)
        narrations.append(scene["narration"])
        duration = round((len(audio) / SR + 0.95) * FPS) / FPS
        duration = max(4.0, duration)
        seg = np.zeros(int(round(duration * SR)), dtype=np.float32)
        start = int(0.28 * SR)
        end = min(len(seg), start + len(audio))
        seg[start:end] += audio[:end - start]
        segs.append(seg)
        scene_audio.append((duration, len(audio) / SR))
        print(f"    narasi {len(audio) / SR:.1f}s, scene {duration:.1f}s")

    full_audio = np.concatenate(segs)
    music = make_music(len(full_audio) / SR, vid)
    mix = full_audio * 0.95 + music[:len(full_audio)] * 0.75
    mix = np.clip(mix, -1, 1)
    audio_path = AUDIO / f"{vid}-final.wav"
    write_wav(audio_path, mix)

    scene_files = []
    for i, (duration, _) in enumerate(scene_audio):
        slide_path = SLIDES / f"{vid}-{i:02d}.png"
        scene_path = SCENES / f"{vid}-{i:02d}.mp4"
        fade_out = max(0.05, duration - 0.22)
        vf = f"format=yuv420p,fade=t=in:st=0:d=0.22,fade=t=out:st={fade_out:.2f}:d=0.22"
        run_ffmpeg(["-loop", "1", "-framerate", str(FPS), "-i", str(slide_path), "-t", f"{duration:.3f}",
                    "-vf", vf, "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "21",
                    "-pix_fmt", "yuv420p", str(scene_path)], f"scene {vid}-{i}")
        scene_files.append(scene_path)

    list_path = SCENES / f"{vid}-list.txt"
    list_path.write_text("\n".join("file '" + str(p).replace("\\", "/") + "'" for p in scene_files), encoding="utf-8")
    silent = AUDIO / f"{vid}-silent.mp4"
    run_ffmpeg(["-f", "concat", "-safe", "0", "-i", str(list_path), "-c", "copy", str(silent)], "concat")

    final = VIDEOS / f"{vid}.mp4"
    run_ffmpeg(["-i", str(silent), "-i", str(audio_path), "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
                "-shortest", "-movflags", "+faststart", str(final)], "mux")

    vtt = build_vtt(scene_audio, narrations)
    (VIDEOS / f"{vid}.vtt").write_text(vtt, encoding="utf-8")
    seconds = len(full_audio) / SR
    print(f"  selesai: {final.name} ({seconds:.1f}s)")
    return seconds


def main():
    durations = {}
    for video in VIDEO_DATA:
        durations[video["id"]] = build_video(video)
    print("\nDurasi akhir:")
    for key, value in durations.items():
        minutes = int(value // 60)
        seconds = int(round(value % 60))
        print(f"  {key}: {minutes}:{seconds:02d} ({value:.1f}s)")


if __name__ == "__main__":
    main()
