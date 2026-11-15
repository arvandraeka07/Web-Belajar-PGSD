# Fun Learning Adventure

Media pembelajaran interaktif untuk siswa Sekolah Dasar (SD) yang dibuat sebagai proyek akhir semester PGSD. Seluruh aplikasi berjalan di browser tanpa server backend berbayar.

## Fitur (revisi tema "Mengenal Huruf", tanpa pembatasan kelas)

- **Video interaktif** (*Membaca Itu Seru*, `assets/videos/membaca.mp4`, 5 menit): 6 bab yang bisa dilompati, 4 *checkpoint* (video berhenti dan menanyakan pertanyaan, lengkap dengan petunjuk dan tombol *Ulangi bagian ini*), bintang pertanyaan, subtitle (tombol CC), transkrip yang bisa diketuk (tab *Catatan*), kecepatan 0,75×/1×/1,25×, mundur 5 detik, layar penuh, pintasan keyboard, dan *Kartu Kata Huhu* (vokal & suku kata bersuara). Setelah selesai ada Kuis Kilat untuk mendapat bintang.
- **Materi** (10 subbab, masing-masing dengan ilustrasi, teks singkat, audio, latihan, tombol sebelumnya/selanjutnya, dan indikator progres):
  1. Mengenal dan Membedakan Huruf (kartu huruf besar A–Z, kapital dan kecil, huruf yang mirip)
  2. Mencocokkan Huruf dengan Bentuknya (A-a, B-b, ... dan papan pasangan ketuk/seret)
  3. Mengenal Suku Kata (vokal A, I, U, E, O; ba-bi-bu-be-bo; kata dan suku katanya)
- **Game**: peta petualangan tiga pos yang terbuka bertahap (Gerbang Rahasia Huruf, Jembatan Huruf, Harta Karun Kata). Tiap pos punya petunjuk, tombol mulai, tantangan, skor, efek suara, animasi keberhasilan, dan bintang. Pos selesai bila mendapat minimal 1 bintang (benar ≥ 50%).
- **Evaluasi**: 10 soal interaktif (suara, kapital, huruf kecil, urutan alfabet, vokal) dengan umpan balik langsung.
- **Perkembangan Belajar** (`#/progres`): tiga kategori (Mengenal Huruf, Mencocokkan Huruf, Mengenal Suku Kata) berisi grafik jawaban benar, jumlah bintang, materi dikuasai / perlu dilatih, dan riwayat skor evaluasi.
- **Audio**: suara gadis periang Bahasa Indonesia yang sudah disertakan di `assets/audio/tts/` (langsung jalan, tanpa API); bisa diganti ke suara ElevenLabs; kalimat yang belum punya berkas memakai Web Speech API (id-ID). Tombol Suara untuk mengaktifkan/menonaktifkan semua audio.
- Progres disimpan di `localStorage` (`fla_huruf_progress_v1`, `fla_audio_v1`). Tampilan responsif.

## Cara Menjalankan

Cara termudah di Windows:

1. Klik dua kali `start.bat`.
2. Browser akan terbuka otomatis di `http://localhost:8000`.

Atau jalankan manual dari folder proyek:

```bash
python tools/serve.py
```

Lalu buka `http://localhost:8000` di browser modern (Chrome, Edge, atau Firefox).

> Jalankan lewat `start.bat` (atau `python tools/serve.py`), bukan `python -m http.server` dan bukan dibuka langsung lewat `file://`. Server `tools/serve.py` mendukung HTTP Range sehingga video bisa digeser; server bawaan Python tidak, dan `file://` memblokir subtitle/transkrip.

## Struktur Proyek

```text
index.html                 Kerangka SPA, ikon SVG, header, navigasi, dan panel audio
css/style.css              Seluruh gaya tampilan dan responsivitas
js/data.js                 Data video, materi, game, soal evaluasi, dan badge
js/ui.js                   Utilitas UI: ikon, modal, toast, konfeti
js/audio.js                Manajer audio, musik latar, efek suara, narasi
js/progress.js             Penyimpanan progres, poin, bintang, dan badge
js/video.js                Pemutar video interaktif (checkpoint, bab, transkrip), kuis kilat
css/video.css              Gaya pemutar, checkpoint, panel bab/catatan, kartu kata
js/quiz.js                 Pembuat dan penampil soal huruf, papan pasangan
js/material.js             Daftar dan pembaca materi
js/games.js                Peta petualangan dan tiga pos permainan
js/evaluation.js           Evaluasi interaktif, penilaian, dan pembahasan
js/main.js                 Router, beranda, progres, panel audio
assets/fonts/              Font Baloo 2 dan Nunito (lokal)
assets/images/             Maskot Huhu, ilustrasi dan ikon bergaya Huhu (dibuat oleh tools/make_huhu_style_assets.py)
DESIGN-GUIDE.md            Pedoman visual (palet, gaya ilustrasi, radius, bayangan, tipografi)
assets/videos/             membaca.mp4 (video pelajaran) + membaca.vtt (subtitle & transkrip)
assets/images/anim/        Ilustrasi kartu kata (apel, ikan, ular, ember, obat, buku, bola, meja, sapi)
assets/audio/huruf/        (opsional) a.mp3, b.mp3, ba.mp3, ...
assets/audio/              Berkas audio pendukung
tools/generate_videos.py   Pembuat video. "membaca" kini animasi (lihat bawah); berhitung & tumbuhan masih slide statis
tools/animasi_membaca.py   Mesin animasi video "Membaca Itu Seru" (1920x1080, 30 fps): maskot berlapis, adegan 1-6, efek, audio
tools/ilustrasi_huhu.py    Sprite maskot Huhu (badan, sayap, ekspresi, paruh) dan ilustrasi bergaya sama (apel, ikan, ular, ember, obat, buku, bola, meja, sapi, Budi, dll.)
tools/make_huruf_assets.py Pembuat ilustrasi SVG tema huruf
tools/render_assets.js     Perasterisasi aset SVG ke PNG
tools/serve.py             Server lokal sederhana
```

## Mengubah Konten

- Semua materi, bank gambar, pos game, dan paket evaluasi ada di `js/data.js`. Soal dibuat otomatis oleh `js/quiz.js` dari data huruf, sehingga urutan alfabet, pasangan kapital-kecil, dan huruf vokal selalu benar.
- **Video**: ganti `assets/videos/membaca.mp4` dan `membaca.vtt` (subtitle). Bab, checkpoint, dan kartu kata diatur di `js/data.js` bagian `videos` (`chapters`, `checkpoints` dengan detik `at`, `keywords`).
- **Audio sendiri**: letakkan berkas `.mp3` bernama huruf kecil di `assets/audio/huruf/` (mis. `a.mp3`, `be`→`b.mp3`, `ba.mp3`, `apel.mp3`), lalu ubah `audioFiles: true` di `js/data.js`. Berkas yang tidak ada otomatis diganti suara browser.
- Suara pengucapan butuh browser dengan suara Bahasa Indonesia (Chrome/Edge disarankan). Jika tidak ada, pengucapan memakai suara bawaan.
- Ilustrasi huruf dibuat ulang dengan `python tools/make_huruf_assets.py`.

## Lisensi dan Kredit

Lihat `ATTRIBUTION.md` untuk rincian sumber ikon, font, dan teknologi yang digunakan.


## Video animasi "Membaca Itu Seru"

```bash
pip install pillow numpy imageio-ffmpeg scipy playwright gTTS   # gTTS opsional (butuh internet)
python -m playwright install chromium                            # untuk merasterisasi SVG maskot
python tools/generate_videos.py --hanya=membaca                  # hasil: assets/videos/membaca.mp4
python tools/generate_videos.py --statis                         # versi slide statis lama
```

- 6 adegan: pembukaan, huruf vokal, suku kata, menulis kalimat, kebiasaan membaca, kuis interaktif (benar/salah + petunjuk + skor akhir).
- Maskot Huhu memakai `assets/images/mascot-huhu.svg` apa adanya; hanya dipecah menjadi lapisan agar sayap, mata, dan paruh bisa bergerak.
- Narasi memakai cache `tools/build/tts/` bila ada; kalimat baru dibuat dengan gTTS jika terpasang dan online. Tanpa suara, dialog tetap tampil di gelembung teks, dan musik serta efek suara tetap ada.
- Durasi mengikuti panjang narasi; dengan semua narasi terisi durasi bertambah mendekati 6-7 menit.


## Suara gadis periang (bawaan, offline setelah dibuat)

Semua pengucapan sudah dibuat dan tersimpan di `assets/audio/tts/` (268 MP3 + `manifest.json` + `manifest.js`), jadi situs langsung bersuara Indonesia tanpa akun atau internet saat dipakai. Suaranya memakai Google TTS Bahasa Indonesia yang natural, lalu nadanya dinaikkan sedikit (pitch 1,12) dan tempo dipercepat sedikit (1,03) agar terdengar seperti gadis periang. `manifest.js` dimuat langsung oleh `index.html`, sehingga klik pertama pada huruf A/B/C di beranda tidak menunggu `fetch`.

Untuk membuat ulang setelah teks diubah (`pip install gTTS imageio-ffmpeg`):

```bash
node tools/list_tts_texts.js                 # perbarui daftar kalimat
python tools/generate_gtts_gadis.py          # buat semua audio gadis periang
python tools/generate_gtts_gadis.py --tanpa-geser   # suara Google TTS apa adanya
```

Uji cepat logika audio (manifest, huruf A/B/C, sambutan, cadangan Web Speech):

```bash
node tools/test_audio.js
```

## Suara ElevenLabs (Maya) — opsional, lebih natural

Seluruh pengucapan (huruf, suku kata, kata, pujian, instruksi, tombol *Bacakan Materi*) dibuat sekali lewat API ElevenLabs lalu disimpan sebagai MP3, jadi situs tidak butuh internet atau API key saat dipakai siswa.

**Lewat terminal:**

1. Buat API key di elevenlabs.io (Settings > API Keys).
2. Pasang dan jalankan dari folder proyek:

```bash
pip install requests
set ELEVENLABS_API_KEY=isi_api_key_kamu        # Windows (Mac/Linux: export ...)
python tools/generate_elevenlabs.py            # suara Maya (ID U3dExJoUNcmTY5H6GMuG)
```

3. Hasilnya ada di `assets/audio/tts/` (MP3 + `manifest.json` + `manifest.js`). Jalankan situs lewat `start.bat` seperti biasa.

- Suara Maya diambil dari ElevenLabs Voice Library: buka halaman suaranya di elevenlabs.io lalu klik *Add to my voices* (skrip juga mencoba menambahkannya otomatis). Memakai suara Library lewat API butuh paket ElevenLabs berbayar. Ganti suara dengan `--voice-id ID_SUARA`; semua audio otomatis dibuat ulang karena nama berkas bergantung pada suara dan pengaturannya.
- Pengaturan suara (stabilitas 0,5, gaya 0,3, kecepatan 1,0) ada di `VOICE_SETTINGS` pada `tools/generate_elevenlabs.py`.
- Mengubah teks di `js/data.js`: jalankan `python tools/generate_elevenlabs.py --refresh`; hanya kalimat baru yang memakai kredit.
- Kalimat yang masih jatuh ke suara browser bisa dicek lewat konsol: `FLA.audio.exportMissing()`. Simpan hasilnya ke `baru.txt` lalu `python tools/generate_elevenlabs.py --tambah baru.txt`.
- Narasi video: jika `ELEVENLABS_API_KEY` terisi, `python tools/generate_videos.py --hanya=membaca` otomatis memakai suara yang sama (gTTS hanya jadi cadangan). Video `membaca.mp4` tidak ada di paket ini, jadi perlu dibuat ulang agar suaranya ikut berganti.
- Logat Indonesia: nama huruf dan suku kata ditulis dengan tanda é/è saat dikirim ke ElevenLabs (be → "bé", me → "mé", we → "wé", ef → "èf") agar tidak terdengar seperti bahasa Inggris. Tabelnya ada di `LETTER_SOUND`/`NAME_SOUND` pada `tools/generate_elevenlabs.py` dan `_pronounce()` pada `js/audio.js`; ubah di sana bila ada huruf yang masih terdengar aneh.
- Kira-kira 11.000 karakter kredit untuk seluruh situs.
