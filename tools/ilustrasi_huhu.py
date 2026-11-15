# -*- coding: utf-8 -*-
"""Membuat sprite maskot Huhu (per bagian) dan ilustrasi pendukung bergaya sama.

Maskot diambil dari assets/images/mascot-huhu.svg (desain asli tidak diubah).
SVG dipecah menjadi lapisan: badan, sayap kiri, sayap kanan, kaki, wajah
(beberapa ekspresi), dan paruh (beberapa bukaan). Semua dirasterisasi ke PNG
memakai Chromium (Playwright) agar tampilan sama dengan SVG aslinya.

Jalankan: python tools/ilustrasi_huhu.py
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "tools" / "build"
HUHU_DIR = BUILD / "img" / "huhu"
ILL_DIR = BUILD / "img" / "ill"
SVG_OUT = ROOT / "assets" / "images" / "anim"   # salinan SVG ilustrasi untuk dipakai ulang

S = "#17469c"          # warna garis (sama dengan garis maskot)
SW = 4                  # tebal garis pada kanvas 200 unit


# ------------------------------------------------------------------ maskot
def _parse_mascot():
    svg = (ROOT / "assets" / "images" / "mascot-huhu.svg").read_text(encoding="utf-8")
    defs = svg[svg.index("<defs>"):svg.index("</defs>") + 7]
    g0 = svg.index("<g>") + 3
    g1 = svg.index("</g>")
    parts = re.split(r"\s*<!--\s*(.*?)\s*-->\s*", svg[g0:g1])
    seg = {parts[i]: parts[i + 1].strip() for i in range(1, len(parts), 2)}
    return defs, seg


def _wrap(defs, body):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 300" width="780" height="900">'
            + defs + body + "</svg>")


def mascot_svgs():
    defs, seg = _parse_mascot()
    out = {}
    out["base"] = _wrap(defs, seg["Telinga / jambul"] + seg["Badan"] + seg["Perut"])
    out["wingL"] = _wrap(defs, seg["Sayap kiri"])
    out["wingR"] = _wrap(defs, seg["Sayap kanan melambai"])
    out["feet"] = _wrap(defs, seg["Kaki"])

    cheek = seg["Pipi"]
    beak = seg["Paruh"]
    brow_orig = seg["Alis ramah"]
    face_discs = ('<circle cx="101" cy="116" r="33" fill="#fffdf4" stroke="#17469c" stroke-width="3"/>'
                  '<circle cx="159" cy="116" r="33" fill="#fffdf4" stroke="#17469c" stroke-width="3"/>')

    def eyes(ldx=0, ldy=0, rdx=0, rdy=0, pr=14, white=33, hl=5):
        w = (f'<circle cx="101" cy="116" r="{white}" fill="#fffdf4" stroke="#17469c" stroke-width="3"/>'
             f'<circle cx="159" cy="116" r="{white}" fill="#fffdf4" stroke="#17469c" stroke-width="3"/>')
        p = ""
        for cx, dx, dy in ((104, ldx, ldy), (156, rdx, rdy)):
            p += f'<circle cx="{cx + dx}" cy="{118 + dy}" r="{pr}" fill="#16305a"/>'
            p += f'<circle cx="{cx + dx + 4.5}" cy="{113 + dy}" r="{hl}" fill="#fff"/>'
            p += f'<circle cx="{cx + dx - 5}" cy="{124 + dy}" r="2.4" fill="#7fb1ff" opacity="0.9"/>'
        return w + p

    def brows(l, r, op=0.75, sw=3.6):
        return (f'<path d="{l}" fill="none" stroke="#17469c" stroke-width="{sw}" stroke-linecap="round" opacity="{op}"/>'
                f'<path d="{r}" fill="none" stroke="#17469c" stroke-width="{sw}" stroke-linecap="round" opacity="{op}"/>')

    faces = {}
    faces["neutral"] = eyes() + cheek + brow_orig
    faces["happy"] = (eyes(pr=15.5, hl=6.2) + cheek + cheek
                      + '<circle cx="98" cy="123" r="2.6" fill="#fff"/><circle cx="150" cy="123" r="2.6" fill="#fff"/>'
                      + brows("M80 86c7-8 17-9 24-4", "M156 82c7-5 17-4 24 4"))
    faces["cheer"] = (face_discs + cheek + cheek
                      + '<path d="M76 124Q101 92 126 124M134 124Q159 92 184 124" fill="none" stroke="#16305a" stroke-width="7" stroke-linecap="round"/>'
                      + brows("M80 84c7-8 17-9 24-4", "M156 80c7-5 17-4 24 4"))
    faces["blink"] = (face_discs + cheek
                      + '<path d="M80 122Q101 136 122 122M138 122Q159 136 180 122" fill="none" stroke="#16305a" stroke-width="5.5" stroke-linecap="round"/>'
                      + brow_orig)
    faces["surprised"] = (eyes(pr=7.5, white=36, hl=3.2) + cheek
                          + brows("M76 76c8-8 19-9 27-4", "M157 72c8-5 19-4 27 4", 0.8))
    faces["confused"] = (eyes(ldx=-5, ldy=3, rdx=-5, rdy=3, pr=11, hl=4) + cheek
                         + brows("M82 92L107 99", "M154 80c8-6 17-5 25 2", 0.8)
                         + '<path d="M196 70c3-6 11-4 10 3-1 5-8 5-8 11" fill="none" stroke="none"/>')
    faces["thinking"] = (eyes(ldx=7, ldy=-8, rdx=7, rdy=-8, pr=12.5, hl=4.2) + cheek
                         + brows("M84 95c7-3 14-3 21 0", "M155 78c8-6 17-5 25 1", 0.8))
    for k, v in faces.items():
        out["face_" + k] = _wrap(defs, v)

    # Paruh: tertutup (asli) dan 3 tingkat terbuka
    out["beak_0"] = _wrap(defs, beak)
    for lvl, o in ((1, 3.0), (2, 6.0), (3, 9.5)):
        up = f'<g transform="translate(0,{-(0.8 + o * 0.22):.2f})">{beak}</g>'
        mouth = (f'<ellipse cx="130" cy="151" rx="{8 + lvl * 0.9:.1f}" ry="{2.4 + o * 0.55:.2f}" fill="#7a1f12" stroke="#c9640b" stroke-width="2"/>'
                 f'<ellipse cx="130" cy="{153 + o * 0.5:.1f}" rx="{4.8 + lvl * 0.4:.1f}" ry="{1.4 + o * 0.25:.1f}" fill="#ff8fa3"/>')
        low = (f'<path d="M118 147Q130 {152 + o:.1f} 142 147L130 {160 + o:.1f}Z" fill="url(#huhuBeak)" stroke="#c9640b" stroke-width="2.4" stroke-linejoin="round"/>')
        out[f"beak_{lvl}"] = _wrap(defs, mouth + low + up)
    return out


# ---------------------------------------------------------------- ilustrasi
def _face(cx, cy, gap=15, r=4.6, smile=10, dy=11):
    return (f'<circle cx="{cx - gap}" cy="{cy}" r="{r}" fill="#16305a"/><circle cx="{cx + gap}" cy="{cy}" r="{r}" fill="#16305a"/>'
            f'<circle cx="{cx - gap + 1.6}" cy="{cy - 1.8}" r="1.7" fill="#fff"/><circle cx="{cx + gap + 1.6}" cy="{cy - 1.8}" r="1.7" fill="#fff"/>'
            f'<path d="M{cx - smile} {cy + dy}Q{cx} {cy + dy + 11} {cx + smile} {cy + dy}" fill="none" stroke="#16305a" stroke-width="3.4" stroke-linecap="round"/>'
            f'<ellipse cx="{cx - gap - 9}" cy="{cy + 8}" rx="6" ry="4" fill="#ff9fb5" opacity=".75"/>'
            f'<ellipse cx="{cx + gap + 9}" cy="{cy + 8}" rx="6" ry="4" fill="#ff9fb5" opacity=".75"/>')


def _st(fill, extra=""):
    return f'fill="{fill}" stroke="{S}" stroke-width="{SW}" stroke-linejoin="round" stroke-linecap="round" {extra}'


def illustrations():
    I = {}
    I["apel"] = ('<path d="M100 66C80 44 34 54 34 106c0 46 32 80 66 68 34 12 66-22 66-68 0-52-46-62-66-40z" ' + _st("#ef5b5b") + '/>'
                 '<path d="M54 92c0-14 8-22 20-25" fill="none" stroke="#ffb3b3" stroke-width="8" stroke-linecap="round"/>'
                 '<path d="M100 66c0-14 4-26 12-34" fill="none" stroke="' + S + '" stroke-width="12" stroke-linecap="round"/>'
                 '<path d="M100 66c0-14 4-26 12-34" fill="none" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/>'
                 '<path d="M114 46c10-22 36-24 46-12-10 20-30 24-46 12z" ' + _st("#2ecf7e") + '/>' + _face(100, 112))
    I["ikan"] = ('<path d="M146 100l38-34c6 22 6 46 0 68z" ' + _st("#ef7714") + '/>'
                 '<path d="M90 56c10-14 28-14 36-4-8 4-20 8-36 4z" ' + _st("#ef7714") + '/>'
                 '<path d="M24 100C54 50 122 48 152 100c-30 52-98 50-128 0z" ' + _st("#ffb45e") + '/>'
                 '<path d="M104 62c14 22 14 54 0 76M122 66c10 20 10 48 0 68" fill="none" stroke="#fff3d6" stroke-width="5" stroke-linecap="round" opacity=".85"/>'
                 '<circle cx="56" cy="92" r="11" fill="#fff" stroke="' + S + '" stroke-width="3.4"/><circle cx="58" cy="93" r="5.4" fill="#16305a"/><circle cx="60" cy="90.5" r="1.9" fill="#fff"/>'
                 '<path d="M40 114q10 10 22 6" fill="none" stroke="#16305a" stroke-width="3.4" stroke-linecap="round"/>'
                 '<ellipse cx="72" cy="112" rx="7" ry="4.4" fill="#ff9fb5" opacity=".75"/>'
                 '<path d="M80 128c10 10 20 12 28 8" fill="none" stroke="' + S + '" stroke-width="3.4" stroke-linecap="round"/>')
    snake = "M34 166C34 128 126 148 126 108C126 78 62 84 64 56C66 40 92 34 116 44"
    I["ular"] = ('<ellipse cx="100" cy="182" rx="70" ry="8" fill="#0a2a66" opacity=".12"/>'
                 f'<path d="{snake}" fill="none" stroke="{S}" stroke-width="36" stroke-linecap="round"/>'
                 f'<path d="{snake}" fill="none" stroke="#2ecf7e" stroke-width="28" stroke-linecap="round"/>'
                 f'<path d="{snake}" fill="none" stroke="#bff3d6" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 17"/>'
                 '<path d="M132 44l24-6m-24 6l20 12" stroke="#ef5b5b" stroke-width="4.6" stroke-linecap="round" fill="none"/>'
                 '<ellipse cx="116" cy="42" rx="25" ry="21" ' + _st("#2ecf7e") + '/>'
                 '<circle cx="108" cy="34" r="7" fill="#fff" stroke="' + S + '" stroke-width="3"/><circle cx="110" cy="35" r="3.4" fill="#16305a"/>'
                 '<path d="M110 54q10 6 20 0" fill="none" stroke="#16305a" stroke-width="3.2" stroke-linecap="round"/>')
    I["ember"] = ('<path d="M44 62Q100-12 156 62" fill="none" stroke="' + S + '" stroke-width="12" stroke-linecap="round"/>'
                  '<path d="M44 62Q100-12 156 62" fill="none" stroke="#9fb4d6" stroke-width="6" stroke-linecap="round"/>'
                  '<path d="M34 64H166L152 168Q100 184 48 168z" ' + _st("#3b82f6") + '/>'
                  '<path d="M34 64H166L162 86H38z" ' + _st("#1a56c4") + '/>'
                  '<ellipse cx="100" cy="64" rx="66" ry="11" ' + _st("#8fc1ff") + '/>'
                  '<path d="M58 100l6 52" stroke="#bfe0ff" stroke-width="9" stroke-linecap="round" opacity=".8"/>' + _face(104, 120, 17))
    I["obat"] = ('<ellipse cx="100" cy="184" rx="64" ry="8" fill="#0a2a66" opacity=".12"/>'
                 '<rect x="56" y="26" width="72" height="30" rx="10" ' + _st("#ef5b5b") + '/>'
                 '<path d="M64 36v12M76 36v12M88 36v12M100 36v12M112 36v12" stroke="#ffb3b3" stroke-width="3.4" stroke-linecap="round"/>'
                 '<path d="M62 54h60v14c14 6 20 14 20 28v62c0 12-8 18-20 18H62c-12 0-20-6-20-18V96c0-14 6-22 20-28z" ' + _st("#f6b04a") + '/>'
                 '<rect x="52" y="92" width="80" height="62" rx="12" ' + _st("#fffdf4") + '/>'
                 '<path d="M92 104v38M73 123h38" stroke="#ef5b5b" stroke-width="12" stroke-linecap="round"/>'
                 '<g transform="rotate(-28 152 150)"><rect x="132" y="138" width="40" height="22" rx="11" ' + _st("#fffdf4") + '/>'
                 '<path d="M152 138h-9a11 11 0 0 0 0 22h9z" ' + _st("#ef5b5b") + '/></g>')
    I["buku"] = ('<ellipse cx="100" cy="184" rx="70" ry="8" fill="#0a2a66" opacity=".12"/>'
                 '<path d="M52 36h96c8 0 12 4 12 12v120c0 8-4 12-12 12H52z" ' + _st("#fffdf4") + '/>'
                 '<path d="M40 30h98c6 0 10 4 10 10v116c0 6-4 10-10 10H40c-6 0-10-4-10-10V40c0-6 4-10 10-10z" ' + _st("#2f7bf6") + '/>'
                 '<path d="M30 40c0-6 4-10 10-10h14v136H40c-6 0-10-4-10-10z" ' + _st("#1a56c4") + '/>'
                 '<path d="M112 30v50l10-9 10 9V30z" ' + _st("#ffd23f") + '/>'
                 '<path d="M70 56c-2-10 12-12 14-2 2-10 16-8 14 2" fill="none" stroke="#fff" stroke-width="0"/>' + _face(94, 112, 15))
    I["bola"] = ('<ellipse cx="100" cy="184" rx="62" ry="8" fill="#0a2a66" opacity=".12"/>'
                 '<defs><clipPath id="cb"><circle cx="100" cy="100" r="74"/></clipPath></defs>'
                 '<circle cx="100" cy="100" r="74" ' + _st("#ffffff") + '/>'
                 '<g clip-path="url(#cb)" stroke="' + S + '" stroke-width="3.6" stroke-linejoin="round">'
                 '<path d="M100 66l32 23-12 38H80L68 89z" fill="#2f7bf6"/>'
                 '<path d="M100 66V24M132 89l42-12M120 127l26 34M80 127l-26 34M68 89L26 77" fill="none"/>'
                 '<path d="M100 8l34 18-6 26-28-6-28 6-6-26z" fill="#1a56c4"/>'
                 '<path d="M186 62l8 38-26 20-20-22 6-26z" fill="#1a56c4"/>'
                 '<path d="M14 62l-8 38 26 20 20-22-6-26z" fill="#1a56c4"/>'
                 '<path d="M146 172l-20-4-6-26 26-6 18 18z" fill="#1a56c4"/>'
                 '<path d="M54 172l20-4 6-26-26-6-18 18z" fill="#1a56c4"/></g>'
                 '<circle cx="100" cy="100" r="74" fill="none" stroke="' + S + '" stroke-width="4"/>' + _face(100, 98, 14, smile=9))
    I["meja"] = ('<ellipse cx="100" cy="182" rx="80" ry="8" fill="#0a2a66" opacity=".12"/>'
                 '<rect x="34" y="94" width="18" height="78" rx="6" ' + _st("#b9773a") + '/>'
                 '<rect x="148" y="94" width="18" height="78" rx="6" ' + _st("#b9773a") + '/>'
                 '<rect x="44" y="104" width="112" height="14" rx="5" ' + _st("#a2642c") + '/>'
                 '<path d="M30 64h140l16 28H14z" ' + _st("#e0a45f") + '/>'
                 '<rect x="14" y="88" width="172" height="20" rx="6" ' + _st("#c98a4b") + '/>'
                 '<path d="M44 76h50" stroke="#fff3d6" stroke-width="6" stroke-linecap="round" opacity=".8"/>'
                 '<rect x="112" y="44" width="30" height="22" rx="4" ' + _st("#2f7bf6") + '/>'
                 '<path d="M118 52h18M118 58h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>')
    I["sapi"] = ('<ellipse cx="100" cy="186" rx="60" ry="8" fill="#0a2a66" opacity=".12"/>'
                 '<path d="M52 52C42 36 44 22 52 16c10 6 16 20 18 34zM148 52c10-16 8-30 0-36-10 6-16 20-18 34z" ' + _st("#fff3d6") + '/>'
                 '<ellipse cx="34" cy="74" rx="24" ry="14" transform="rotate(-18 34 74)" ' + _st("#ffb0c2") + '/>'
                 '<ellipse cx="166" cy="74" rx="24" ry="14" transform="rotate(18 166 74)" ' + _st("#ffb0c2") + '/>'
                 '<path d="M100 40c42 0 60 26 58 62-2 40-22 72-58 72s-56-32-58-72c-2-36 16-62 58-62z" ' + _st("#ffffff") + '/>'
                 '<path d="M142 50c14 14 18 34 12 52-8-4-18-16-22-34-2-8 2-14 10-18z" fill="#3a2a22" stroke="' + S + '" stroke-width="3"/>'
                 '<ellipse cx="100" cy="140" rx="42" ry="30" ' + _st("#ffb0c2") + '/>'
                 '<ellipse cx="84" cy="140" rx="6" ry="9" fill="#a8465e"/><ellipse cx="116" cy="140" rx="6" ry="9" fill="#a8465e"/>'
                 '<circle cx="76" cy="96" r="6.4" fill="#16305a"/><circle cx="124" cy="96" r="6.4" fill="#16305a"/>'
                 '<circle cx="78" cy="93.6" r="2.2" fill="#fff"/><circle cx="126" cy="93.6" r="2.2" fill="#fff"/>')
    I["pensil"] = ('<g transform="rotate(-40 100 100)">'
                   '<rect x="30" y="80" width="30" height="40" rx="8" ' + _st("#ff9fb5") + '/>'
                   '<rect x="56" y="80" width="14" height="40" ' + _st("#cfd8e8") + '/>'
                   '<rect x="68" y="80" width="84" height="40" ' + _st("#ffd23f") + '/>'
                   '<path d="M80 80v40M96 80v40M112 80v40" stroke="#f0b800" stroke-width="3.4"/>'
                   '<path d="M152 80l34 20-34 20z" ' + _st("#f2c991") + '/>'
                   '<path d="M174 94l12 6-12 6z" fill="#16305a"/></g>')
    I["bukubuka"] = ('<ellipse cx="150" cy="186" rx="120" ry="9" fill="#0a2a66" opacity=".13"/>'
                     '<path d="M18 62c-6 0-10 4-10 10v96c0 6 4 10 10 10h264c6 0 10-4 10-10V72c0-6-4-10-10-10z" ' + _st("#1a56c4") + '/>'
                     '<path d="M24 52c44-8 90-4 126 20v104c-36-22-82-26-126-20z" ' + _st("#fffdf4") + '/>'
                     '<path d="M276 52c-44-8-90-4-126 20v104c36-22 82-26 126-20z" ' + _st("#fffdf4") + '/>'
                     '<path d="M42 80c30-6 62-2 92 14M42 104c30-6 62-2 92 14M42 128c30-6 62-2 92 14M166 94c30-16 62-20 92-14M166 118c30-16 62-20 92-14M166 142c30-16 62-20 92-14" fill="none" stroke="#a9c6f2" stroke-width="5" stroke-linecap="round"/>'
                     '<path d="M150 72v104" stroke="' + S + '" stroke-width="4"/>')
    # Tangan menunjuk (telunjuk ke atas, jari lain menekuk, ibu jari di samping)
    I["tangan"] = ('<path d="M56 112c-14-6-30-4-34 8-3 9 4 14 14 18l22 10z" ' + _st("#f0b88a") + '/>'
                   '<path d="M58 104h86c8 0 14 6 14 14v34c0 18-14 28-30 28H78c-16 0-26-10-26-26v-34c0-10 2-16 6-16z" ' + _st("#f0b88a") + '/>'
                   '<rect x="94" y="78" width="21" height="44" rx="10.5" ' + _st("#f0b88a") + '/>'
                   '<rect x="113" y="82" width="21" height="42" rx="10.5" ' + _st("#f0b88a") + '/>'
                   '<rect x="132" y="90" width="20" height="36" rx="10" ' + _st("#f0b88a") + '/>'
                   '<rect x="64" y="14" width="26" height="110" rx="13" ' + _st("#f0b88a") + '/>'
                   '<path d="M72 28v36" stroke="#ffe0c4" stroke-width="5" stroke-linecap="round"/>'
                   '<path d="M92 140c10 8 24 8 34 0" fill="none" stroke="' + S + '" stroke-width="3" stroke-linecap="round" opacity=".5"/>')
    I["jam"] = ('<circle cx="100" cy="100" r="84" ' + _st("#fffdf4") + '/>'
                '<circle cx="100" cy="100" r="70" fill="none" stroke="#cfe0fb" stroke-width="3"/>'
                + "".join(f'<line x1="100" y1="{34 if i % 3 == 0 else 38}" x2="100" y2="{22 if i % 3 == 0 else 28}" stroke="{S}" stroke-width="{5 if i % 3 == 0 else 3}" stroke-linecap="round" transform="rotate({i * 30} 100 100)"/>' for i in range(12)))
    I["jam_jarum"] = ('<path d="M100 104V36" stroke="' + S + '" stroke-width="12" stroke-linecap="round"/>'
                      '<path d="M100 104V36" stroke="#ffd23f" stroke-width="6" stroke-linecap="round"/>'
                      '<circle cx="100" cy="100" r="10" ' + _st("#ef5b5b") + '/>')
    I["piala"] = ('<ellipse cx="100" cy="188" rx="56" ry="8" fill="#0a2a66" opacity=".13"/>'
                  '<path d="M52 44H26c0 28 14 46 36 50M148 44h26c0 28-14 46-36 50" fill="none" stroke="' + S + '" stroke-width="16" stroke-linecap="round"/>'
                  '<path d="M52 44H26c0 28 14 46 36 50M148 44h26c0 28-14 46-36 50" fill="none" stroke="#ffd23f" stroke-width="8" stroke-linecap="round"/>'
                  '<path d="M48 22h104v38c0 38-22 64-52 64S48 98 48 60z" ' + _st("#ffd23f") + '/>'
                  '<path d="M66 36v30c0 18 8 34 20 42" fill="none" stroke="#fff3b0" stroke-width="8" stroke-linecap="round"/>'
                  '<rect x="86" y="122" width="28" height="26" ' + _st("#f0b800") + '/>'
                  '<rect x="60" y="148" width="80" height="26" rx="8" ' + _st("#2f7bf6") + '/>'
                  '<path d="M100 54l7 14 15 2-11 11 3 15-14-8-14 8 3-15-11-11 15-2z" ' + _st("#ffffff") + '/>')
    I["toga"] = ('<path d="M100 36L10 76l90 40 90-40z" ' + _st("#16305a") + '/>'
                 '<path d="M52 98v38c0 14 22 26 48 26s48-12 48-26V98l-48 22z" ' + _st("#2f7bf6") + '/>'
                 '<path d="M176 84v52" stroke="' + S + '" stroke-width="10" stroke-linecap="round"/>'
                 '<path d="M176 84v52" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/>'
                 '<circle cx="176" cy="142" r="9" ' + _st("#ffd23f") + '/>')
    I["bintang"] = ('<path d="M100 14l26 56 62 8-46 42 12 60-54-30-54 30 12-60L12 78l62-8z" ' + _st("#ffd23f") + '/>'
                    '<path d="M100 42l12 26" fill="none" stroke="#fff3b0" stroke-width="8" stroke-linecap="round"/>')
    return I


def kid_svg(mode="read"):
    """Budi, anak kartun yang membaca. mode: read | aloud"""
    skin, hair = "#f0b88a", "#16305a"
    mouth = ('<path d="M116 124Q130 138 144 124" fill="none" stroke="#16305a" stroke-width="3.6" stroke-linecap="round"/>'
             if mode == "read" else
             '<ellipse cx="130" cy="129" rx="11" ry="9" fill="#7a1f12" stroke="#16305a" stroke-width="3"/>'
             '<ellipse cx="130" cy="134" rx="6" ry="3.4" fill="#ff8fa3"/>')
    waves = ("" if mode == "read" else
             '<path d="M196 100q10 12 0 26M210 90q16 22 0 46M224 80q22 32 0 66" fill="none" stroke="#ffd23f" stroke-width="6" stroke-linecap="round"/>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 300" width="780" height="900">'
            '<ellipse cx="130" cy="288" rx="84" ry="9" fill="#0a2a66" opacity=".13"/>'
            '<path d="M66 176c0-22 28-34 64-34s64 12 64 34v86H66z" ' + _st("#2f7bf6") + '/>'
            '<path d="M104 144l26 26 26-26" ' + _st("#fffdf4") + '/>'
            '<circle cx="76" cy="102" r="11" ' + _st(skin) + '/><circle cx="184" cy="102" r="11" ' + _st(skin) + '/>'
            '<circle cx="130" cy="100" r="54" ' + _st(skin) + '/>'
            f'<path d="M76 98C70 52 104 38 132 40c30 2 58 18 52 58-10-22-28-32-54-32-26 0-44 10-54 32z" fill="{hair}" stroke="{S}" stroke-width="3.4" stroke-linejoin="round"/>'
            '<circle cx="110" cy="104" r="5.6" fill="#16305a"/><circle cx="150" cy="104" r="5.6" fill="#16305a"/>'
            '<circle cx="112" cy="102" r="2" fill="#fff"/><circle cx="152" cy="102" r="2" fill="#fff"/>'
            '<path d="M98 90q10-7 20-2M142 88q10-5 20 2" fill="none" stroke="#16305a" stroke-width="3.4" stroke-linecap="round"/>'
            '<ellipse cx="94" cy="118" rx="9" ry="6" fill="#ff9fb5" opacity=".7"/><ellipse cx="166" cy="118" rx="9" ry="6" fill="#ff9fb5" opacity=".7"/>'
            + mouth +
            '<path d="M70 262l-6-44c0-14 10-22 24-18l30 8v62zM190 262l6-44c0-14-10-22-24-18l-30 8v62z" fill="none"/>'
            '<path d="M60 218l70-14 70 14v50l-70-12-70 12z" ' + _st("#1a56c4") + '/>'
            '<path d="M66 214l64-12v54l-64 10z" ' + _st("#fffdf4") + '/>'
            '<path d="M194 214l-64-12v54l64 10z" ' + _st("#fffdf4") + '/>'
            '<path d="M78 222l40-8M78 234l40-8M78 246l40-8M142 214l40 8M142 226l40 8M142 238l40 8" fill="none" stroke="#a9c6f2" stroke-width="3.4" stroke-linecap="round"/>'
            '<circle cx="76" cy="212" r="12" ' + _st(skin) + '/><circle cx="184" cy="212" r="12" ' + _st(skin) + '/>'
            + waves + '</svg>')


# ---------------------------------------------------------------- render
def _wrap_item(inner, vb="0 0 200 200", w=600, h=600):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}">{inner}</svg>'


def build_all(force=False):
    from playwright.sync_api import sync_playwright
    HUHU_DIR.mkdir(parents=True, exist_ok=True)
    ILL_DIR.mkdir(parents=True, exist_ok=True)
    SVG_OUT.mkdir(parents=True, exist_ok=True)

    jobs = {}
    for name, svg in mascot_svgs().items():
        jobs[HUHU_DIR / f"{name}.png"] = (svg, 780, 900)
    for name, inner in illustrations().items():
        if name == "bukubuka":
            svg = _wrap_item(inner, "0 0 300 200", 900, 600)
            size = (900, 600)
        else:
            svg = _wrap_item(inner)
            size = (600, 600)
        (SVG_OUT / f"ill-{name}.svg").write_text(svg.replace(' width="%d" height="%d"' % size, ""), encoding="utf-8")
        jobs[ILL_DIR / f"{name}.png"] = (svg, size[0], size[1])
    for mode in ("read", "aloud"):
        svg = kid_svg(mode)
        (SVG_OUT / f"ill-budi-{mode}.svg").write_text(svg.replace(' width="780" height="900"', ""), encoding="utf-8")
        jobs[ILL_DIR / f"budi_{mode}.png"] = (svg, 780, 900)

    todo = {p: v for p, v in jobs.items() if force or not p.exists()}
    if not todo:
        return
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(device_scale_factor=1)
        for path, (svg, w, h) in todo.items():
            page.set_viewport_size({"width": w, "height": h})
            page.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
            page.screenshot(path=str(path), omit_background=True, clip={"x": 0, "y": 0, "width": w, "height": h})
        browser.close()
    print(f"  aset maskot/ilustrasi dibuat: {len(todo)} berkas")


if __name__ == "__main__":
    build_all(force=True)
