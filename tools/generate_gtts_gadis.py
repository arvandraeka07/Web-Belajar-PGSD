#!/usr/bin/env python3
"""Membuat ulang semua audio situs dengan suara GADIS PERIANG (Google TTS Indonesia).

Suara Google Bahasa Indonesia adalah suara perempuan yang natural. Agar terdengar
seperti gadis periang (seperti video AI voice changer), nada dinaikkan sedikit dan
tempo dipercepat sedikit memakai filter "rubberband" dari ffmpeg. Hasilnya tetap
tersimpan sebagai MP3 di assets/audio/tts/, jadi situs tidak butuh internet saat dipakai.

Persiapan:
    pip install gTTS
    pip install imageio-ffmpeg      (ffmpeg + rubberband, tanpa install manual)
    (atau pastikan perintah "ffmpeg" tersedia di PATH)

Jalankan dari folder proyek:
    python tools/list_tts_texts.js           # perbarui daftar kalimat (butuh Node.js)
    python tools/generate_gtts_gadis.py      # buat semua audio
    python tools/generate_gtts_gadis.py --pitch 1.15 --tempo 1.05
    python tools/generate_gtts_gadis.py --paksa     # abaikan cache sementara
    python tools/generate_gtts_gadis.py --tanpa-geser  # suara asli Google TTS

Hasil:
    assets/audio/tts/<hash>.mp3     satu berkas per kalimat
    assets/audio/tts/manifest.json  peta kalimat -> berkas (dibaca js/audio.js)

Nama berkas memakai sha1(normalize(teks)), sama seperti tools/render_offline.py,
jadi manifest lama tetap berlaku dan hanya isi suaranya yang berganti.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

try:
    from gtts import gTTS
except ImportError:
    sys.exit("Pasang dulu: pip install gTTS")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "audio" / "tts"
TEXTS = ROOT / "tools" / "tts_texts.json"
STAGE = ROOT / "tools" / "build" / "tts_gadis"

# Cara baca huruf ala Indonesia (sama dengan generate_elevenlabs.py & audio.js).
# Tanpa ini Google TTS membaca "be" seperti "bi" atau "bə".
LETTER_SOUND = {
    "a": "a", "b": "bé", "c": "cé", "d": "dé", "e": "é", "f": "èf", "g": "gé", "h": "ha",
    "i": "i", "j": "jé", "k": "ka", "l": "èl", "m": "èm", "n": "èn", "o": "o", "p": "pé",
    "q": "ki", "r": "èr", "s": "ès", "t": "té", "u": "u", "v": "vé", "w": "wé", "x": "èks",
    "y": "yé", "z": "zèt",
}
NAME_SOUND = {
    "be": "bé", "ce": "cé", "de": "dé", "e": "é", "ef": "èf", "ge": "gé", "ha": "ha",
    "je": "jé", "ka": "ka", "el": "èl", "em": "èm", "en": "èn", "pe": "pé", "ki": "ki",
    "er": "èr", "es": "ès", "te": "té", "ve": "vé", "we": "wé", "eks": "èks", "ye": "yé",
    "zet": "zèt",
}


def pronounce(text):
    """Teks yang dikirim ke Google TTS (kunci manifest tetap teks aslinya)."""
    plain = str(text).strip()
    low = plain.lower()
    if low in NAME_SOUND:
        return "Huruf " + NAME_SOUND[low] + "."
    if low in LETTER_SOUND:
        return "Huruf " + LETTER_SOUND[low] + "."
    if len(low) == 2 and low[0] in "bcdfghjklmnpqrstvwxyz" and low[1] in "aiueo":
        return "Suku kata " + low[0] + ("é" if low[1] == "e" else low[1]) + "."
    import re
    return re.sub(r"(?<![A-Za-z\u00c0-\u024f])([A-Za-z])(?![A-Za-z\u00c0-\u024f])",
                  lambda m: LETTER_SOUND[m.group(1).lower()], plain)


def normalize(text):
    """Harus sama dengan normalisasi di js/audio.js."""
    return " ".join(unicodedata.normalize("NFC", str(text)).lower().split())


def file_name(text):
    return hashlib.sha1(normalize(text).encode("utf-8")).hexdigest()[:14] + ".mp3"


def find_ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        exe = shutil.which("ffmpeg")
        if exe:
            return exe
    return None


def tts_to_file(text, dest, attempts=6):
    for attempt in range(attempts):
        try:
            gTTS(text, lang="id", tld="co.id", slow=False).save(dest)
            if dest.exists() and dest.stat().st_size > 800:
                return
        except Exception as error:  # noqa: BLE001
            print("  (coba %d) %s" % (attempt + 1, error))
        time.sleep(1.2 * (attempt + 1))
    raise RuntimeError("gagal membuat suara untuk: %s" % text)


def pitch_shift(src, dest, ffmpeg, pitch, tempo):
    if not ffmpeg:
        shutil.copyfile(src, dest)
        return
    audio_filter = "rubberband=pitch=%.4f:tempo=%.4f:formant=shifted:pitchq=quality" % (pitch, tempo)
    subprocess.run(
        [ffmpeg, "-y", "-loglevel", "error", "-i", str(src), "-af", audio_filter,
         "-ar", "24000", "-ac", "1", "-b:a", "64k", str(dest)],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pitch", type=float, default=1.12, help="faktor nada (default 1.12 = gadis periang)")
    ap.add_argument("--tempo", type=float, default=1.03, help="faktor tempo (default 1.03 = agak ceria)")
    ap.add_argument("--tanpa-geser", action="store_true", help="pakai suara Google TTS apa adanya")
    ap.add_argument("--paksa", action="store_true", help="buat ulang walau cache sementara sudah ada")
    args = ap.parse_args()

    if not TEXTS.exists():
        sys.exit("Jalankan dulu: node tools/list_tts_texts.js")
    texts = json.loads(TEXTS.read_text(encoding="utf-8"))

    ffmpeg = None if args.tanpa_geser else find_ffmpeg()
    if not args.tanpa_geser and not ffmpeg:
        sys.exit("ffmpeg tidak ditemukan. Pasang: pip install imageio-ffmpeg")

    STAGE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    seen, items = set(), []
    for text in texts:
        n = normalize(text)
        if n in seen:
            continue
        seen.add(n)
        items.append((n, text))

    print("Suara: Google TTS Indonesia (%s) | pitch %.2f tempo %.2f" % (
        "tanpa geser" if args.tanpa_geser else "gadis periang", args.pitch, args.tempo))
    print("%d kalimat unik." % len(items))

    for i, (n, text) in enumerate(items, 1):
        name = file_name(text)
        staged = STAGE / name
        if args.paksa or not (staged.exists() and staged.stat().st_size > 800):
            raw = STAGE / (name + ".raw.mp3")
            tts_to_file(pronounce(text), raw)
            if args.tanpa_geser:
                shutil.copyfile(raw, staged)
            else:
                pitch_shift(raw, staged, ffmpeg, args.pitch, args.tempo)
            raw.unlink(missing_ok=True)
        if i % 10 == 0 or i == len(items):
            print("[%d/%d] %s" % (i, len(items), text[:60]))

    manifest = {}
    for n, text in items:
        manifest[n] = file_name(text)
        shutil.copyfile(STAGE / manifest[n], OUT / manifest[n])
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    # Versi JS dimuat langsung oleh index.html agar klik pertama tidak menunggu fetch.
    manifest_js = ("window.FLA = window.FLA || {};\nFLA.ttsManifest = " +
                   json.dumps(manifest, ensure_ascii=False).replace("</", "<\\/") + ";\n")
    (OUT / "manifest.js").write_text(manifest_js, encoding="utf-8")

    used = set(manifest.values())
    removed = 0
    for old in OUT.glob("*.mp3"):
        if old.name not in used:
            old.unlink()
            removed += 1
    if removed:
        print("Menghapus %d berkas suara lama." % removed)
    print("Selesai. %d audio gadis periang di %s" % (len(manifest), OUT.relative_to(ROOT)))


if __name__ == "__main__":
    main()
