#!/usr/bin/env python3
"""Membuat semua audio situs SECARA OFFLINE (tanpa API/akun) dengan espeak-ng
(suara Indonesia, varian perempuan, nada dinaikkan) -> assets/audio/tts/*.mp3.

CATATAN: ini alat suara lama yang terdengar agak robot. Untuk suara gadis
periang yang lebih natural, pakai tools/generate_gtts_gadis.py.

Butuh: espeak-ng dan ffmpeg terpasang.   python tools/render_offline.py

Ini suara sintetis sederhana (agak robot) tetapi PASTI berlogat Indonesia dan
bisa dipakai langsung. Untuk suara yang lebih natural, lihat bagian ElevenLabs
di README (generate_elevenlabs.py / buat-suara.html).
"""
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "audio" / "tts"
TEXTS = ROOT / "tools" / "tts_texts.json"

VOICE = "id+f3"   # Indonesia, varian perempuan
PITCH = "72"      # 0-99, makin tinggi makin "anak-anak"
SPEED = "148"     # kata per menit

# Nama huruf Indonesia dalam fonem espeak (agar "be" tidak dibaca "bi" dan "es" tidak terpotong).
LETTER_PH = {
    "a": "'a", "b": "b'E", "c": "tS'E", "d": "d'E", "e": "'E", "f": "'Ef", "g": "g'E", "h": "h'a",
    "i": "'i", "j": "dZ'E", "k": "k'a", "l": "'El", "m": "'Em", "n": "'En", "o": "'o", "p": "p'E",
    "q": "k'i", "r": "'Er", "s": "'Es", "t": "t'E", "u": "'u", "v": "v'E", "w": "w'E", "x": "'Eks",
    "y": "j'E", "z": "z'Et",
}
# Nama huruf yang ditulis di data ("be", "ef", ...) -> huruf aslinya
NAME_TO_LETTER = {
    "a": "a", "be": "b", "ce": "c", "de": "d", "e": "e", "ef": "f", "ge": "g", "ha": "h", "i": "i",
    "je": "j", "ka": "k", "el": "l", "em": "m", "en": "n", "o": "o", "pe": "p", "ki": "q", "er": "r",
    "es": "s", "te": "t", "u": "u", "ve": "v", "we": "w", "eks": "x", "ye": "y", "zet": "z",
}


def normalize(text):
    return " ".join(str(text).lower().split())


def file_name(text):
    return hashlib.sha1(normalize(text).encode("utf-8")).hexdigest()[:14] + ".mp3"


def espeak_text(text):
    plain = str(text).strip()
    low = plain.lower()
    if low in NAME_TO_LETTER:                      # satu nama huruf utuh
        return "[[%s]]" % LETTER_PH[NAME_TO_LETTER[low]]
    # huruf tunggal di dalam kalimat ("Huruf kapital B, huruf kecil b")
    return re.sub(r"(?<![A-Za-z])([A-Za-z])(?![A-Za-z])",
                  lambda m: "[[%s]]" % LETTER_PH[m.group(1).lower()], plain)


def render(text, dest):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "a.wav"
        subprocess.run(["espeak-ng", "-v", VOICE, "-p", PITCH, "-s", SPEED, "-g", "3", "-w", str(wav),
                        espeak_text(text)], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
                        "-af", "highpass=f=90,adelay=70|70,apad=pad_dur=0.12,loudnorm=I=-16:TP=-1.5:LRA=11",
                        "-ar", "24000", "-ac", "1", "-b:a", "64k", str(dest)], check=True)


def main():
    texts = json.loads(TEXTS.read_text(encoding="utf-8"))
    extra = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if extra:
        texts += [l.strip() for l in extra.read_text(encoding="utf-8").splitlines() if l.strip()]
    OUT.mkdir(parents=True, exist_ok=True)
    manifest, seen = {}, set()
    for i, text in enumerate(texts, 1):
        n = normalize(text)
        if n in seen:
            continue
        seen.add(n)
        name = file_name(text)
        render(text, OUT / name)
        manifest[n] = name
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    manifest_js = ("window.FLA = window.FLA || {};\nFLA.ttsManifest = " +
                   json.dumps(manifest, ensure_ascii=False).replace("</", "<\\/") + ";\n")
    (OUT / "manifest.js").write_text(manifest_js, encoding="utf-8")
    used = set(manifest.values())
    for old in OUT.glob("*.mp3"):
        if old.name not in used:
            old.unlink()
    print("Selesai: %d audio di %s" % (len(manifest), OUT))


if __name__ == "__main__":
    main()
