#!/usr/bin/env python3
"""Membuat ulang semua audio situs dengan suara GADIS PERIANG Bahasa Indonesia.

Mesin utama: Microsoft Edge Neural TTS, voice id-ID-GadisNeural. Suara ini
natural, ramah, dan konsisten untuk seluruh kalimat. Bila edge-tts belum
terpasang, skrip otomatis memakai Google TTS (gTTS) dengan sedikit penggeseran
nada. Hasilnya tetap MP3 di assets/audio/tts/, jadi situs tidak butuh internet
saat dipakai.

Persiapan (disarankan):
    pip install edge-tts
Alternatif:
    pip install gTTS
    pip install imageio-ffmpeg      (ffmpeg + rubberband, tanpa install manual)

Jalankan dari folder proyek:
    node tools/list_tts_texts.js              # perbarui daftar kalimat
    python tools/generate_gtts_gadis.py       # Edge TTS, semua kalimat
    python tools/generate_gtts_gadis.py --engine gtts --pitch 1.12 --tempo 1.03
    python tools/generate_gtts_gadis.py --paksa   # abaikan cache sementara

Hasil:
    assets/audio/tts/<hash>.mp3     satu berkas per kalimat
    assets/audio/tts/manifest.json  peta kalimat -> berkas (dibaca js/audio.js)

Nama berkas memakai sha1(normalize(teks)), sama seperti js/audio.js, jadi
manifest lama tetap berlaku dan hanya isi suaranya yang berganti.
"""
import argparse
import asyncio
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
    gTTS = None

try:
    import edge_tts
except ImportError:
    edge_tts = None

EDGE_VOICE = "id-ID-GadisNeural"

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
    if gTTS is None:
        raise RuntimeError("gTTS belum terpasang. Jalankan: pip install gTTS")
    for attempt in range(attempts):
        try:
            gTTS(text, lang="id", tld="co.id", slow=False).save(dest)
            if dest.exists() and dest.stat().st_size > 800:
                return
        except Exception as error:  # noqa: BLE001
            print("  (coba %d) %s" % (attempt + 1, error))
        time.sleep(1.2 * (attempt + 1))
    raise RuntimeError("gagal membuat suara untuk: %s" % text)


def edge_to_file(text, dest, attempts=5):
    if edge_tts is None:
        raise RuntimeError("edge-tts belum terpasang. Jalankan: pip install edge-tts")

    async def save():
        communicate = edge_tts.Communicate(text, EDGE_VOICE, rate="+6%", pitch="+2Hz")
        await communicate.save(str(dest))

    for attempt in range(attempts):
        try:
            asyncio.run(save())
            if dest.exists() and dest.stat().st_size > 800:
                return
        except Exception as error:  # noqa: BLE001
            print("  (coba %d) %s" % (attempt + 1, error))
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError("gagal membuat suara Edge untuk: %s" % text)


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
    ap.add_argument("--engine", choices=["auto", "edge", "gtts"], default="auto",
                    help="mesin suara (default auto: Edge TTS bila tersedia)")
    ap.add_argument("--pitch", type=float, default=1.12, help="faktor nada gTTS (default 1.12)")
    ap.add_argument("--tempo", type=float, default=1.03, help="faktor tempo gTTS (default 1.03)")
    ap.add_argument("--tanpa-geser", action="store_true", help="pakai suara Google TTS apa adanya")
    ap.add_argument("--paksa", action="store_true", help="buat ulang walau cache sementara sudah ada")
    args = ap.parse_args()

    engine = args.engine
    if engine == "auto":
        engine = "edge" if edge_tts is not None else "gtts"
    if engine == "edge" and edge_tts is None:
        sys.exit("Edge TTS belum terpasang. Jalankan: pip install edge-tts")
    if engine == "gtts" and gTTS is None:
        sys.exit("gTTS belum terpasang. Jalankan: pip install gTTS")

    if not TEXTS.exists():
        sys.exit("Jalankan dulu: node tools/list_tts_texts.js")
    texts = json.loads(TEXTS.read_text(encoding="utf-8"))

    ffmpeg = None
    if engine == "gtts" and not args.tanpa_geser:
        ffmpeg = find_ffmpeg()
        if not ffmpeg:
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

    if engine == "edge":
        print("Suara: Microsoft Edge Neural TTS (%s) | rate +6%% pitch +2Hz" % EDGE_VOICE)
    else:
        print("Suara: Google TTS Indonesia (%s) | pitch %.2f tempo %.2f" % (
            "tanpa geser" if args.tanpa_geser else "gadis periang", args.pitch, args.tempo))
    print("%d kalimat unik." % len(items))

    for i, (n, text) in enumerate(items, 1):
        name = file_name(text)
        staged = STAGE / name
        if args.paksa or not (staged.exists() and staged.stat().st_size > 800):
            if engine == "edge":
                edge_to_file(pronounce(text), staged)
            else:
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
    print("Selesai. %d audio (%s) di %s" % (len(manifest), engine, OUT.relative_to(ROOT)))


if __name__ == "__main__":
    main()
