# Pedoman Visual — Fun Learning Adventure

Website ini memakai **suasana dan warna yang terinspirasi dari Universitas Negeri Yogyakarta (UNY)**.
Ini bukan website resmi UNY dan tidak mengklaim berafiliasi dengan UNY.
Maskot **Huhu** (`assets/images/mascot-huhu.svg`) adalah karakter utama dan standar gaya; desainnya tidak boleh diubah.

## 1. Palet warna
| Peran | Warna | Variabel CSS |
|---|---|---|
| Identitas utama (ungu tua) | `#433a9b` / dalam `#31287f` / gelap `#221c5e` | `--blue`, `--blue-deep`, `--blue-dark` (nama lama, kini ungu) |
| Aksen utama (kuning) | `#ffd91a` | `--yellow` |
| Penyeimbang | putih `#ffffff`, lembayung muda `#f3f2fb` | `--card`, `--bg` |
| Aksen pendukung (hijau) | `#17b26a` | `--green` |
| Aksen terbatas (merah) | `#e8453c` | `--red` |
| Warna karakter (ilustrasi) | biru Huhu `#3b86f7` / outline `#17469c`, perut krem, paruh oranye | hanya di dalam gambar |

Aturan: latar halaman terang/putih; hero, header-strip, dan footer memakai ungu tua; tombol utama kuning atau ungu;
hijau dan merah hanya untuk status (benar/salah, kunci) dan strip kecil. Ilustrasi tetap berwarna asli Huhu.

## 2. Gaya ilustrasi (mengikuti Huhu)
- Kartun 2D, bentuk membulat, proporsi lucu, tanpa tekstur realistis dan tanpa 3D.
- **Outline tegas** berwarna gelap sewarna objek (bukan hitam), tebal ±3 unit pada kanvas 72 (ikon) / ±3,4 (karakter), sudut dan ujung membulat.
- **Gradient diagonal lembut** terang → tengah → gelap pada tiap objek; satu garis kilap putih (opasitas ±0,5).
- Wajah sederhana: mata bulat besar dengan titik pantul putih, pipi merah muda lembut, senyum kecil.
- Detail minim; hiasan bintang kuning `#ffd23f` dengan outline `#d99f00`.
- Aset dibuat dengan `tools/make_huhu_style_assets.py` agar konsisten. Jalankan ulang skrip itu, jangan menggambar ikon baru dengan gaya lain.

## 3. Komponen
- Radius: `--radius-xl 36px`, `--radius-lg 28px`, `--radius 22px`, `--radius-sm 15px`.
- Border kartu 1,5–2 px dengan warna lembayung muda/ aksen; bayangan lembut ungu (`--shadow`, `--shadow-sm`, `--shadow-lg`).
- Tipografi: judul **Baloo 2** (600–800), isi **Nunito** (400–800).
- Ornamen dekoratif: pola belah ketupat tipis dan ikon buku/pensil/bintang pada latar (`body::before`),
  pola berlian pada hero (`.hero::before`), strip warna UNY di bawah header (`.app-header::after`), garis kuning di footer.
  Ornamen selalu berkontras rendah dan tidak boleh mengganggu teks.
