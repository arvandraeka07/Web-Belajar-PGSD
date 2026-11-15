#!/usr/bin/env python3
"""Membuat seluruh audio situs dengan suara ElevenLabs (default: Maya, suara perempuan Indonesia).

Persiapan (sekali saja):
    pip install requests
    set ELEVENLABS_API_KEY=xxxxxxxx        (Windows)
    export ELEVENLABS_API_KEY=xxxxxxxx     (Mac/Linux)

Jalankan dari folder proyek:
    python tools/generate_elevenlabs.py
    python tools/generate_elevenlabs.py --voice "Nama"        # cari suara berdasarkan nama
    python tools/generate_elevenlabs.py --voice-id XXXXXXXX    # atau langsung pakai Voice ID
    python tools/generate_elevenlabs.py --tambah teks_baru.txt # tambah kalimat (satu per baris)
    python tools/generate_elevenlabs.py --ulang                # buat ulang semua (ganti suara)
    python tools/generate_elevenlabs.py --refresh              # baca ulang js/data.js (butuh Node.js)

Hasil:
    assets/audio/tts/<hash>.mp3     satu berkas per kalimat
    assets/audio/tts/manifest.json  peta kalimat -> berkas (dibaca js/audio.js)

Kalimat yang sudah pernah dibuat dilewati, jadi aman dijalankan berulang
dan tidak memakai kredit lagi.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Pasang dulu: pip install requests")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "audio" / "tts"
TEXTS = ROOT / "tools" / "tts_texts.json"
API = "https://api.elevenlabs.io/v1"

# Maya: suara perempuan Indonesia yang ramah dan hangat (ElevenLabs Voice Library).
# https://json2video.com/ai-voices/elevenlabs/voices/U3dExJoUNcmTY5H6GMuG/
DEFAULT_VOICE_ID = "U3dExJoUNcmTY5H6GMuG"
DEFAULT_VOICE_NAME = "Maya"

# Pengaturan: cukup hidup dan ramah, tetapi tetap jelas untuk anak SD.
MODEL = "eleven_multilingual_v2"
VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.8,
    "style": 0.3,
    "use_speaker_boost": True,
    "speed": 1.0,
}


# Cara baca huruf ala Indonesia. Tanpa ini mesin suara membaca "be" jadi "bee"
# (Inggris) atau "bə" (pepet). Tanda é/è memaksa bunyi e taling.
LETTER_SOUND = {
    "a": "a", "b": "bé", "c": "cé", "d": "dé", "e": "é", "f": "èf", "g": "gé", "h": "ha",
    "i": "i", "j": "jé", "k": "ka", "l": "èl", "m": "èm", "n": "èn", "o": "o", "p": "pé",
    "q": "ki", "r": "èr", "s": "ès", "t": "té", "u": "u", "v": "vé", "w": "wé", "x": "èks",
    "y": "yé", "z": "zèt",
}
NAME_SOUND = {  # nama huruf yang ditulis di data ("be", "ef", ...) -> bunyi
    "be": "bé", "ce": "cé", "de": "dé", "e": "é", "ef": "èf", "ge": "gé", "ha": "ha",
    "je": "jé", "ka": "ka", "el": "èl", "em": "èm", "en": "èn", "pe": "pé", "ki": "ki",
    "er": "èr", "es": "ès", "te": "té", "ve": "vé", "we": "wé", "eks": "èks", "ye": "yé",
    "zet": "zèt",
}


def pronounce(text):
    """Teks yang dikirim ke ElevenLabs (kunci manifest tetap teks aslinya).
    HARUS sejajar dengan _pronounce() di js/audio.js."""
    plain = str(text).strip()
    low = plain.lower()
    # satu nama huruf / suku kata konsonan+e utuh: be, me, we, ...
    # Dengan kata pengantar agar mesin suara tahu ini Bahasa Indonesia
    # (tanpa itu "be" sering dibaca "bi" dan "me" dibaca "mi").
    if low in NAME_SOUND:
        return "Huruf " + NAME_SOUND[low] + "."
    if low in LETTER_SOUND:
        return "Huruf " + LETTER_SOUND[low] + "."
    if len(low) == 2 and low[0] in "bcdfghjklmnpqrstvwxyz" and low[1] in "aiueo":
        return "Suku kata " + low[0] + ("é" if low[1] == "e" else low[1]) + "."
    # huruf tunggal di dalam kalimat: "Huruf kapital B, huruf kecil b"
    import re
    return re.sub(r"(?<![A-Za-z\u00c0-\u024f])([A-Za-z])(?![A-Za-z\u00c0-\u024f])",
                  lambda m: LETTER_SOUND[m.group(1).lower()], plain)


def normalize(text):
    """HARUS sama dengan normalisasi di js/audio.js."""
    return " ".join(str(text).lower().split())


def file_name(text, voice_id=""):
    """Nama berkas ikut bergantung pada suara + pengaturan, jadi mengganti suara
    otomatis membuat ulang semua audio (berkas lama tidak terpakai lagi)."""
    seed = "|".join([voice_id, MODEL, json.dumps(VOICE_SETTINGS, sort_keys=True), normalize(pronounce(text))])
    return hashlib.sha1(seed.encode("utf-8")).hexdigest()[:14] + ".mp3"


def headers(key):
    return {"xi-api-key": key}


def write_manifests(manifest_path, manifest):
    """Tulis manifest.json dan manifest.js (dibaca langsung oleh index.html)."""
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    manifest_js = ("window.FLA = window.FLA || {};\nFLA.ttsManifest = " +
                   json.dumps(manifest, ensure_ascii=False).replace("</", "<\\/") + ";\n")
    manifest_path.with_name("manifest.js").write_text(manifest_js, encoding="utf-8")


def find_voice(key, name):
    """Cari Voice ID: suara milik akun dulu, lalu Voice Library."""
    r = requests.get(f"{API}/voices", headers=headers(key), params={"search": name}, timeout=30)
    r.raise_for_status()
    for v in r.json().get("voices", []):
        if v.get("name", "").lower().startswith(name.lower()):
            return v["voice_id"], v["name"], False
    r = requests.get(f"{API}/shared-voices", headers=headers(key),
                     params={"search": name, "language": "id", "page_size": 20}, timeout=30)
    r.raise_for_status()
    for v in r.json().get("voices", []):
        if v.get("name", "").lower().startswith(name.lower()):
            return v["voice_id"], v["name"], True
    return None, None, False


def add_to_account(key, voice_id, name=DEFAULT_VOICE_NAME):
    """Tambahkan suara dari Voice Library ke 'My Voices' (perlu untuk memakainya lewat API).
    Gagal dengan tenang bila sudah ada; bila gagal, tambahkan manual lewat tombol
    'Add to my voices' di halaman suara pada elevenlabs.io."""
    try:
        r = requests.get(f"{API}/shared-voices", headers=headers(key),
                         params={"search": name, "language": "id", "page_size": 50}, timeout=30)
        r.raise_for_status()
        owner = next((v.get("public_owner_id") for v in r.json().get("voices", [])
                      if v.get("voice_id") == voice_id), None)
        if owner:
            requests.post(f"{API}/voices/add/{owner}/{voice_id}", headers=headers(key),
                          json={"new_name": name}, timeout=30)
    except Exception as error:  # noqa: BLE001
        print("  (info) tidak bisa menambah suara otomatis:", error)


def synth(key, voice_id, text):
    body = {
        "text": pronounce(text),
        "model_id": MODEL,
        "language_code": "id",
        "voice_settings": VOICE_SETTINGS,
    }
    for attempt in range(5):
        r = requests.post(f"{API}/text-to-speech/{voice_id}",
                          headers={**headers(key), "Accept": "audio/mpeg"},
                          params={"output_format": "mp3_44100_128"}, json=body, timeout=120)
        if r.status_code == 200 and len(r.content) > 500:
            return r.content
        if r.status_code in (429, 500, 502, 503):
            time.sleep(2 + attempt * 2)
            continue
        if r.status_code in (400, 401, 402, 403, 404):
            hint = ""
            if r.status_code in (402, 403, 404) or "voice" in r.text.lower():
                hint = ("\nPetunjuk: buka halaman suara Maya di elevenlabs.io (Voices > Voice Library), klik 'Add to my voices', "
                        "dan pastikan paketmu berbayar (suara Library tidak bisa lewat API di paket gratis).")
            sys.exit(f"ElevenLabs menolak ({r.status_code}): {r.text[:300]}{hint}")
        sys.exit(f"ElevenLabs error ({r.status_code}): {r.text[:300]}")
    sys.exit("Gagal berulang kali, coba lagi nanti.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--voice", help="nama suara (default: Maya, ID %s)" % DEFAULT_VOICE_ID)
    ap.add_argument("--voice-id", help="Voice ID langsung (melewati pencarian nama)")
    ap.add_argument("--tambah", help="berkas .txt berisi kalimat tambahan, satu per baris")
    ap.add_argument("--refresh", action="store_true", help="jalankan ulang node tools/list_tts_texts.js")
    ap.add_argument("--ulang", action="store_true", help="buat ulang semua, termasuk yang sudah ada")
    args = ap.parse_args()

    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("Isi dulu variabel ELEVENLABS_API_KEY (lihat petunjuk di atas berkas ini).")

    if args.refresh or not TEXTS.exists():
        subprocess.run(["node", str(ROOT / "tools" / "list_tts_texts.js")], check=True)
    texts = json.loads(TEXTS.read_text(encoding="utf-8"))
    if args.tambah:
        extra = [l.strip() for l in Path(args.tambah).read_text(encoding="utf-8").splitlines() if l.strip()]
        texts += extra

    voice_id = args.voice_id or DEFAULT_VOICE_ID
    if args.voice:  # cari berdasarkan nama bila diminta
        found_id, found, shared = find_voice(key, args.voice)
        if not found_id:
            sys.exit(f'Suara "{args.voice}" tidak ketemu. Pakai --voice-id dengan Voice ID dari ElevenLabs.')
        voice_id = found_id
        print(f"Suara: {found} ({voice_id})")
    else:
        print(f"Suara: {DEFAULT_VOICE_NAME if voice_id == DEFAULT_VOICE_ID else 'khusus'} ({voice_id})")
    add_to_account(key, voice_id)

    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "manifest.json"
    manifest = {}
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    seen, todo = set(), []
    for t in texts:
        n = normalize(t)
        if n in seen:
            continue
        seen.add(n)
        f = file_name(t, voice_id)
        if args.ulang or not (OUT / f).exists():
            todo.append((t, n, f))
        manifest[n] = f

    chars = sum(len(t) for t, _, _ in todo)
    print(f"{len(seen)} kalimat, {len(todo)} perlu dibuat (~{chars} karakter kredit).")
    for i, (text, n, f) in enumerate(todo, 1):
        print(f"[{i}/{len(todo)}] {text[:70]}")
        (OUT / f).write_bytes(synth(key, voice_id, text))
        manifest[n] = f
        write_manifests(manifest_path, manifest)
        time.sleep(0.15)

    write_manifests(manifest_path, manifest)
    used = set(manifest.values())
    removed = 0
    for old in OUT.glob("*.mp3"):  # buang audio suara lama yang tidak terpakai
        if old.name not in used:
            old.unlink()
            removed += 1
    if removed:
        print(f"Menghapus {removed} berkas suara lama.")
    print(f"Selesai. {len(manifest)} entri di {manifest_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
