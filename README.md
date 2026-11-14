# Fun Learning Adventure

Media pembelajaran interaktif untuk siswa Sekolah Dasar (SD) yang dibuat sebagai proyek akhir semester PGSD. Seluruh aplikasi berjalan di browser tanpa server backend berbayar.

## Fitur

- **3 video pembelajaran** bertema Membaca, Berhitung, dan Dunia Tumbuhan. Setiap video memiliki narasi Bahasa Indonesia, subtitle (VTT), dan kuis setelah video selesai.
- **12 subbab materi** bergambar dengan narasi suara, fakta menarik, cek pemahaman, dan ringkasan.
- **5 game edukasi**: Tebak Gambar, Cocokkan Gambar, Puzzle Edukasi, Kuis Cepat, dan Benar atau Salah.
- **3 paket evaluasi** (Kelas 1–2, 3–4, 5–6) berisi 10 soal acak, pembahasan lengkap, nilai, dan predikat.
- **Gamifikasi**: bintang, poin, badge, riwayat aktivitas, dan halaman progres.
- **Audio**: musik latar dan efek suara disintesis dengan Web Audio API; narasi materi memakai Web Speech API.
- Progres disimpan otomatis di `localStorage` perangkat (`fla_progress_v1`, `fla_audio_v1`).
- Tampilan responsif untuk desktop, tablet, dan ponsel.

## Cara Menjalankan

Cara termudah di Windows:

1. Klik dua kali `start.bat`.
2. Browser akan terbuka otomatis di `http://localhost:8000`.

Atau jalankan manual dari folder proyek:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000` di browser modern (Chrome, Edge, atau Firefox).

> Membuka `index.html` langsung lewat `file://` tidak disarankan karena beberapa browser membatasi pemuatan video/subtitle dan Web Audio.

## Struktur Proyek

```text
index.html                 Kerangka SPA, ikon SVG, header, navigasi, dan panel audio
css/style.css              Seluruh gaya tampilan dan responsivitas
js/data.js                 Data video, materi, game, soal evaluasi, dan badge
js/ui.js                   Utilitas UI: ikon, modal, toast, konfeti
js/audio.js                Manajer audio, musik latar, efek suara, narasi
js/progress.js             Penyimpanan progres, poin, bintang, dan badge
js/video.js                Pemutar video, daftar putar, kuis
js/material.js             Daftar dan pembaca materi
js/games.js                Lima permainan edukasi
js/evaluation.js           Evaluasi, penilaian, dan pembahasan
js/main.js                 Router, beranda, progres, panel audio
assets/fonts/              Font Baloo 2 dan Nunito (lokal)
assets/images/             Maskot, ilustrasi, ikon OpenMoji, poster
assets/videos/             Video MP4 dan subtitle VTT
assets/audio/              Berkas audio pendukung
tools/generate_videos.py   Pembuat video, poster, dan subtitle
tools/render_assets.js     Perasterisasi aset SVG ke PNG
tools/serve.py             Server lokal sederhana
```

## Mengubah Konten

- Video, materi, kuis, game, evaluasi, dan badge diatur di `js/data.js`.
- Ingin mengganti video? Letakkan berkas baru di `assets/videos/`, lalu sesuaikan `src`, `poster`, `subtitle`, dan `duration` pada `js/data.js`.
- Video contoh dapat dibuat ulang dengan `python tools/generate_videos.py` (membutuhkan Pillow, numpy, gTTS, dan imageio-ffmpeg).
- Untuk mereset progres saat pengujian, buka halaman **Progres** lalu gunakan tombol **Reset Progres**, atau hapus data situs dari pengaturan browser.

## Lisensi dan Kredit

Lihat `ATTRIBUTION.md` untuk rincian sumber ikon, font, dan teknologi yang digunakan.
