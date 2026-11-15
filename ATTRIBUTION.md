# Atribusi dan Lisensi Aset

Proyek **Fun Learning Adventure** menggunakan aset pihak ketiga berikut.

## Ikon

Seluruh ikon dan ilustrasi (berkas `assets/images/om-*.svg`, `ill-*.svg`, dan `anim/`) dibuat khusus bergaya Huhu oleh `tools/make_huhu_style_assets.py`. Awalan `om-` hanyalah nama lama berkas dari masa OpenMoji; isinya bukan lagi aset OpenMoji.

## Font

- **Baloo 2** — Google Fonts, penulis Ek Type. Lisensi: SIL Open Font License 1.1.
- **Nunito** — Google Fonts, penulis Vernon Adams, Cyreal, dan Jacques Le Bailly. Lisensi: SIL Open Font License 1.1.

## Aset Buatan Khusus

Aset berikut dibuat khusus untuk proyek ini dan tidak berasal dari pihak ketiga:

- Maskot burung hantu **Huhu** (`assets/images/mascot-huhu.svg`)
- Logo (`assets/images/logo.svg`)
- Ilustrasi Membaca, Berhitung, dan Tumbuhan
- Latar puzzle antariksa (`assets/images/puzzle-space.svg`)
- Poster video dan seluruh video pembelajaran
- Musik latar dan efek suara (disintesis dengan Web Audio API)

## Perangkat Lunak Pembantu

Alat berikut digunakan untuk menghasilkan aset, bukan bagian dari aplikasi yang dikirim ke pengguna:

- **Python 3**, **Pillow** (HPND), **numpy** (BSD-3-Clause)
- **gTTS** (MPL-2.0) untuk suara gadis periang Bahasa Indonesia di `assets/audio/tts/` dan narasi video
- **imageio-ffmpeg** dan **FFmpeg** (termasuk filter *rubberband*) untuk pengodean video dan penalaan nada suara
- **sharp** (Apache-2.0) untuk perasterisasi ikon SVG

## Kutipan

Jika proyek ini digunakan dalam laporan akademik, cantumkan:

> Fun Learning Adventure: Media Pembelajaran Interaktif untuk Siswa Sekolah Dasar. Proyek akhir semester PGSD, 2026.

## Catatan Identitas Visual

Palet dan suasana desain terinspirasi dari logo Universitas Negeri Yogyakarta (UNY) hanya sebagai referensi warna. Website ini bukan website resmi UNY.

## Video

- `assets/videos/membaca.mp4` dan `membaca.vtt` ("Membaca Itu Seru") adalah karya proyek ini; checkpoint, bab, dan kartu kata dibuat di `js/video.js` dan `js/data.js`.
