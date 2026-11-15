/* ============================================================
   FUN LEARNING ADVENTURE — Data Konten "Mengenal Huruf"
   Semua materi, bank huruf, gambar, dan konfigurasi pembelajaran
   dikumpulkan di sini agar mudah diperbarui tanpa mengubah logika.

   Sumber isi: PDF "Halaman Awal Web Huruf" (halaman 1–9).
   - Video interaktif "Membaca Itu Seru" (vokal, suku kata, kalimat)
   - 3 materi: Mengenal & Membedakan Huruf, Mencocokkan Huruf dengan
     Bentuknya, Mengenal Suku Kata
   - Game petualangan 3 pos, evaluasi, dan perkembangan belajar
   ============================================================ */

window.FLA = window.FLA || {};

FLA.data = (function () {
  'use strict';

  const IMG = 'assets/images/';

  /* ---------- Alfabet A–Z ----------
     name = nama huruf dalam Bahasa Indonesia (PUEBI), dipakai untuk
     tampilan "dibaca ..." dan untuk pengucapan suara. */
  const LETTER_NAMES = {
    A: 'a', B: 'be', C: 'ce', D: 'de', E: 'e', F: 'ef', G: 'ge', H: 'ha', I: 'i',
    J: 'je', K: 'ka', L: 'el', M: 'em', N: 'en', O: 'o', P: 'pe', Q: 'ki', R: 'er',
    S: 'es', T: 'te', U: 'u', V: 've', W: 'we', X: 'eks', Y: 'ye', Z: 'zet'
  };
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letters = ALPHABET.map((upper) => ({
    upper,
    lower: upper.toLowerCase(),
    name: LETTER_NAMES[upper]
  }));

  const VOWELS = ['A', 'I', 'U', 'E', 'O'];
  const CONSONANTS = ALPHABET.filter((ch) => VOWELS.indexOf(ch) === -1);
  /* Konsonan yang dipakai untuk suku kata sederhana (konsonan + vokal) */
  const SYLLABLE_CONSONANTS = ['B', 'D', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];

  /* Huruf yang bentuknya mirip — dipakai sebagai pengecoh yang wajar */
  const LOOKALIKE = {
    a: ['o', 'e'], b: ['d', 'p'], c: ['e', 'o'], d: ['b', 'q'], e: ['c', 'a'], f: ['t', 'l'],
    g: ['q', 'y'], h: ['n', 'b'], i: ['l', 'j'], j: ['i', 'l'], k: ['h', 'x'], l: ['i', 't'],
    m: ['n', 'w'], n: ['m', 'u'], o: ['c', 'a'], p: ['q', 'b'], q: ['p', 'g'], r: ['n', 'v'],
    s: ['z', 'c'], t: ['f', 'l'], u: ['n', 'v'], v: ['u', 'w'], w: ['m', 'v'], x: ['k', 'z'],
    y: ['g', 'v'], z: ['s', 'x']
  };

  /* ---------- Bank gambar: huruf awal sebuah benda ---------- */
  const pictures = [
    { letter: 'A', word: 'Apel',     file: IMG + 'om-1F34E.svg' },
    { letter: 'B', word: 'Bola',     file: IMG + 'om-26BD.svg' },
    { letter: 'D', word: 'Daun',     file: IMG + 'om-1F343.svg' },
    { letter: 'E', word: 'Ember',    file: IMG + 'ill-ember.svg' },
    { letter: 'G', word: 'Gajah',    file: IMG + 'om-1F418.svg' },
    { letter: 'I', word: 'Ikan',     file: IMG + 'om-1F41F.svg' },
    { letter: 'J', word: 'Jam',      file: IMG + 'om-1F550.svg' },
    { letter: 'K', word: 'Kucing',   file: IMG + 'om-1F408.svg' },
    { letter: 'L', word: 'Lampu',    file: IMG + 'om-1F4A1.svg' },
    { letter: 'M', word: 'Matahari', file: IMG + 'om-2600.svg' },
    { letter: 'O', word: 'Otak',     file: IMG + 'om-1F9E0.svg' },
    { letter: 'P', word: 'Pisang',   file: IMG + 'om-1F34C.svg' },
    { letter: 'R', word: 'Roket',    file: IMG + 'om-1F680.svg' },
    { letter: 'S', word: 'Sepeda',   file: IMG + 'om-1F6B2.svg' },
    { letter: 'U', word: 'Ular',     file: IMG + 'ill-ular.svg' }
  ];

  /* ---------- Kata berawalan huruf vokal (untuk materi suku kata) ---------- */
  const vowelWords = [
    { vowel: 'A', word: 'Apel',  syllables: ['a', 'pel'],  file: IMG + 'om-1F34E.svg' },
    { vowel: 'I', word: 'Ikan',  syllables: ['i', 'kan'],  file: IMG + 'om-1F41F.svg' },
    { vowel: 'U', word: 'Ular',  syllables: ['u', 'lar'],  file: IMG + 'ill-ular.svg' },
    { vowel: 'E', word: 'Ember', syllables: ['em', 'ber'], file: IMG + 'ill-ember.svg' },
    { vowel: 'O', word: 'Otak',  syllables: ['o', 'tak'],  file: IMG + 'om-1F9E0.svg' }
  ];

  /* Tiga kategori perkembangan belajar (PDF halaman 7–9) */
  const categories = [
    {
      id: 'huruf', title: 'Mengenal Huruf', short: 'Mengenal Huruf',
      itemLabel: 'Huruf', color: 'blue', material: 'huruf', pos: 'pos1',
      keys: ALPHABET,
      keyLabel: (key) => 'Huruf ' + key
    },
    {
      id: 'cocok', title: 'Mencocokkan Huruf', short: 'Mencocokkan Huruf',
      itemLabel: 'Pasangan', color: 'green', material: 'cocok', pos: 'pos2',
      keys: ALPHABET.map((ch) => ch + '-' + ch.toLowerCase()),
      keyLabel: (key) => key
    },
    {
      id: 'suku', title: 'Mengenal Suku Kata', short: 'Mengenal Suku Kata',
      itemLabel: 'Huruf vokal', color: 'orange', material: 'suku', pos: 'pos3',
      keys: VOWELS,
      keyLabel: (key) => 'Huruf ' + key
    }
  ];

  /* ============================================================
     A. VIDEO PENGENALAN HURUF — "Membaca Itu Seru"
     src         : berkas video (assets/videos/membaca.mp4)
     vtt         : subtitle & transkrip (WebVTT)
     chapters    : bab video (detik mulai) — tampil di daftar bab dan bilah geser
     checkpoints : video berhenti di detik `at`, anak menjawab dulu lalu lanjut.
                   `from` = detik awal bagian yang boleh diulang jika belum paham.
     keywords    : kartu kosakata yang bisa diketuk untuk mendengar bunyinya
     quizTypes   : jenis soal Kuis Kilat setelah video selesai (lihat quiz.js)
     ============================================================ */
  const ANIM = IMG + 'anim/';
  const videos = [
    {
      id: 'pengenalan-huruf',
      title: 'Video Pengenalan Huruf',
      subtitle: 'Membaca Itu Seru',
      subject: 'Mengenal Huruf',
      duration: '5 menit',
      src: 'assets/videos/membaca.mp4',
      vtt: 'assets/videos/membaca.vtt',
      poster: IMG + 'poster-membaca.jpg',
      color: 'blue',
      description: 'Bersama Huhu, kenali huruf vokal, gabungkan suku kata, tulis kalimat, dan biasakan membaca setiap hari. Video berhenti sebentar untuk menanyakan pertanyaan seru!',
      chapters: [
        { at: 0,   title: 'Halo dari Huhu',      note: 'Perkenalan dan tujuan belajar' },
        { at: 16,  title: 'Huruf Vokal',         note: 'a, i, u, e, o dan gambarnya' },
        { at: 85,  title: 'Suku Kata',           note: 'Menggabungkan bunyi: bu + ku' },
        { at: 140, title: 'Menulis Kalimat',     note: 'Huruf kapital dan tanda titik' },
        { at: 180, title: 'Kebiasaan Membaca',   note: 'Tiga kebiasaan pembaca cerdas' },
        { at: 223, title: 'Kuis Seru',           note: 'Tiga pertanyaan bersama Huhu' }
      ],
      checkpoints: [
        {
          at: 84.2, from: 16, title: 'Cek huruf vokal',
          q: 'Manakah yang termasuk huruf vokal?',
          options: ['a, i, u, e, o', 'b, c, d, f, g', 'k, l, m, n, p'], answer: 0,
          explanation: 'Huruf vokal ada lima: a, i, u, e, o.',
          hint: 'Ingat apel, ikan, ular, ember, obat. Huruf awalnya adalah huruf vokal.'
        },
        {
          at: 135.2, from: 85, title: 'Cek suku kata',
          q: 'Kata meja terdiri dari suku kata apa saja?',
          options: ['me dan ja', 'mej dan a', 'm dan eja'], answer: 0,
          explanation: 'me + ja dibaca meja.',
          hint: 'Bagi kata meja menjadi dua potongan bunyi: me... ja...'
        },
        {
          at: 178.8, from: 140, title: 'Cek menulis kalimat',
          q: 'Kalimat diakhiri dengan apa?',
          options: ['huruf kapital', 'tanda titik', 'angka satu'], answer: 1,
          explanation: 'Akhir kalimat memakai tanda titik (.).',
          hint: 'Lihat kalimat "Budi membaca buku." Apa yang ada di ujungnya?'
        },
        {
          at: 221.5, from: 180, title: 'Cek kebiasaan membaca',
          q: 'Berapa menit sebaiknya kita membaca setiap hari?',
          options: ['10 menit', '1 menit', '3 jam'], answer: 0,
          explanation: 'Luangkan sepuluh menit setiap hari. Sedikit demi sedikit, kamu jadi lancar!',
          hint: 'Huhu bilang: "Luangkan ... menit setiap hari."'
        }
      ],
      keywords: {
        vowels: [
          { letter: 'a', word: 'apel',  img: ANIM + 'ill-apel.svg' },
          { letter: 'i', word: 'ikan',  img: ANIM + 'ill-ikan.svg' },
          { letter: 'u', word: 'ular',  img: ANIM + 'ill-ular.svg' },
          { letter: 'e', word: 'ember', img: ANIM + 'ill-ember.svg' },
          { letter: 'o', word: 'obat',  img: ANIM + 'ill-obat.svg' }
        ],
        syllables: [
          { parts: ['bu', 'ku'], word: 'buku', img: ANIM + 'ill-buku.svg' },
          { parts: ['bo', 'la'], word: 'bola', img: ANIM + 'ill-bola.svg' },
          { parts: ['me', 'ja'], word: 'meja', img: ANIM + 'ill-meja.svg' },
          { parts: ['sa', 'pi'], word: 'sapi', img: ANIM + 'ill-sapi.svg' }
        ]
      },
      quizTypes: ['vowel', 'syllable', 'syllableSound']
    }
  ];

  /* ============================================================
     B. MATERI — tiga submateri sesuai PDF
     kind  : jenis tampilan isi subbab (diproses di material.js)
     check : jenis soal "Cek Pemahaman" (dibuat di quiz.js) atau
             'fixed' + question untuk soal tetap.
     ============================================================ */
  const firstHalf = ALPHABET.slice(0, 13);
  const secondHalf = ALPHABET.slice(13);

  const materials = [
    {
      id: 'huruf',
      category: 'huruf',
      title: 'Mengenal dan Membedakan Huruf',
      subject: 'Materi 1',
      color: 'blue',
      illustration: IMG + 'illustration-huruf.svg',
      icon: IMG + 'om-1F4D5.svg',
      blurb: 'Kenali huruf alfabet A sampai Z, bentuk huruf kapital dan huruf kecil, serta cara menyebutnya.',
      subbabs: [
        {
          title: 'Mengenal Huruf Alfabet',
          icon: IMG + 'om-1F4DA.svg',
          visual: 'A B C D E ...',
          kind: 'text',
          paragraphs: [
            'Alfabet adalah kumpulan huruf yang kita pakai untuk menulis dan membaca. Alfabet Bahasa Indonesia terdiri dari 26 huruf, dari A sampai Z.',
            'Setiap huruf punya nama dan bunyi. Dengarkan guru atau tekan tombol suara, lalu tirukan ya!'
          ],
          funFact: 'Urutan alfabet selalu sama: A, B, C, D, E, F, G, dan seterusnya sampai Z.',
          sample: ['A', 'B', 'C', 'D', 'E'],
          check: 'fixed',
          question: {
            q: 'Ada berapa huruf dalam alfabet?',
            options: ['24', '26', '28'],
            answer: 1,
            explanation: 'Alfabet Bahasa Indonesia terdiri dari 26 huruf, yaitu A sampai Z.'
          }
        },
        {
          title: 'Kartu Huruf A sampai M',
          icon: IMG + 'om-1F4D3.svg',
          visual: 'A – M',
          kind: 'cards',
          letters: firstHalf,
          paragraphs: ['Tekan kartu huruf untuk melihat huruf kapital, huruf kecil, dan mendengar cara menyebutnya.'],
          funFact: 'Huruf A, I, U, E, O disebut huruf vokal. Huruf lainnya disebut huruf konsonan.',
          check: 'sound',
          pool: firstHalf
        },
        {
          title: 'Kartu Huruf N sampai Z',
          icon: IMG + 'om-1F4D3.svg',
          visual: 'N – Z',
          kind: 'cards',
          letters: secondHalf,
          paragraphs: ['Lanjutkan dengan huruf N sampai Z. Tekan kartunya, lihat bentuknya, lalu dengarkan namanya.'],
          funFact: 'Huruf terakhir dalam alfabet adalah Z, dibaca "zet".',
          check: 'sound',
          pool: secondHalf
        },
        {
          title: 'Membedakan Huruf yang Mirip',
          icon: IMG + 'om-1F9E9.svg',
          visual: 'b d p q',
          kind: 'similar',
          paragraphs: [
            'Ada huruf yang bentuknya hampir sama, jadi perlu diperhatikan dengan teliti. Lihat pasangan di bawah ini.',
            'Perhatikan arah lengkungannya. Huruf b dan d berbeda, begitu juga p dan q.'
          ],
          similar: [
            { pair: ['b', 'd'], tip: 'b: tongkat di kiri, perut di kanan. d: perut di kiri, tongkat di kanan.' },
            { pair: ['p', 'q'], tip: 'p: tongkat turun di kiri, perut di kanan. q: perut di kiri, tongkat turun di kanan.' },
            { pair: ['m', 'n'], tip: 'm punya tiga garis tegak, n hanya punya dua garis tegak.' }
          ],
          funFact: 'Berlatih menulis huruf dengan jari di udara membantu kita mengingat bentuknya.',
          check: 'capitalLook',
          pool: ['B', 'D', 'P', 'Q', 'M', 'N']
        }
      ],
      summary: [
        'Alfabet terdiri dari 26 huruf, yaitu A sampai Z.',
        'Setiap huruf punya bentuk kapital (besar) dan bentuk kecil.',
        'Setiap huruf punya nama, misalnya B dibaca "be" dan Z dibaca "zet".',
        'Huruf yang mirip, seperti b dan d, harus diperhatikan dengan teliti.'
      ]
    },
    {
      id: 'cocok',
      category: 'cocok',
      title: 'Mencocokkan Huruf dengan Bentuknya',
      subject: 'Materi 2',
      color: 'green',
      illustration: IMG + 'illustration-cocok.svg',
      icon: IMG + 'om-1F3AF.svg',
      blurb: 'Pasangkan huruf kapital dengan huruf kecil: A-a, B-b, C-c, D-d, dan seterusnya.',
      subbabs: [
        {
          title: 'Pasangan Huruf A–a sampai M–m',
          icon: IMG + 'om-1F4D5.svg',
          visual: 'A-a  B-b',
          kind: 'pairs',
          letters: firstHalf,
          paragraphs: [
            'Setiap huruf punya dua bentuk, yaitu huruf kapital dan huruf kecil. Keduanya adalah huruf yang sama, hanya bentuknya berbeda.',
            'Contoh: A dan a, B dan b, C dan c. Tekan pasangan huruf untuk mendengarnya.'
          ],
          funFact: 'Huruf kapital dipakai di awal kalimat dan di awal nama orang.',
          check: 'lower',
          pool: firstHalf
        },
        {
          title: 'Pasangan Huruf N–n sampai Z–z',
          icon: IMG + 'om-1F4D5.svg',
          visual: 'N-n  Z-z',
          kind: 'pairs',
          letters: secondHalf,
          paragraphs: [
            'Lanjutkan mengenal pasangan huruf N-n sampai Z-z.',
            'Beberapa pasangan bentuknya mirip, hanya ukurannya berbeda, misalnya O-o, S-s, V-v, W-w, dan Z-z.'
          ],
          funFact: 'Pasangan seperti A-a dan B-b bentuknya berbeda, jadi harus dihafalkan pelan-pelan.',
          check: 'upper',
          pool: secondHalf
        },
        {
          title: 'Ayo Pasangkan Huruf',
          icon: IMG + 'om-1F9E9.svg',
          visual: 'A ↔ a',
          kind: 'matchBoard',
          boardSize: 4,
          paragraphs: [
            'Sekarang giliranmu! Pasangkan huruf kapital dengan huruf kecil yang sama.',
            'Tekan satu huruf kapital, lalu tekan huruf kecil pasangannya. Di komputer kamu juga boleh menyeret hurufnya.'
          ],
          funFact: 'Semua pasangan benar berarti kamu sudah paham huruf kapital dan huruf kecil.',
          check: 'board'
        }
      ],
      summary: [
        'Setiap huruf punya pasangan: huruf kapital dan huruf kecil.',
        'Contoh pasangan huruf: A-a, B-b, C-c, D-d, dan seterusnya sampai Z-z.',
        'Huruf kapital dipakai di awal kalimat dan di awal nama orang.',
        'Memasangkan huruf membuat kita cepat mengenali bentuknya.'
      ]
    },
    {
      id: 'suku',
      category: 'suku',
      title: 'Mengenal Suku Kata',
      subject: 'Materi 3',
      color: 'orange',
      illustration: IMG + 'illustration-suku.svg',
      icon: IMG + 'om-1F4DD.svg',
      blurb: 'Kenali huruf vokal A, I, U, E, O dan bunyi suku kata sederhana seperti ba, bi, bu, be, bo.',
      subbabs: [
        {
          title: 'Mengenal Huruf Vokal',
          icon: IMG + 'om-1F4D5.svg',
          visual: 'A I U E O',
          kind: 'vowels',
          paragraphs: [
            'Huruf vokal ada lima, yaitu A, I, U, E, dan O. Bunyinya keluar dengan lancar dari mulut kita.',
            'Tekan huruf vokal, lihat gambarnya, lalu ucapkan bersama-sama.'
          ],
          funFact: 'Hampir semua suku kata mengandung huruf vokal.',
          check: 'vowel'
        },
        {
          title: 'Suku Kata Sederhana',
          icon: IMG + 'om-1F9E9.svg',
          visual: 'b + a = ba',
          kind: 'syllables',
          paragraphs: [
            'Suku kata dibuat dari huruf konsonan dan huruf vokal. Contohnya b + a dibaca ba.',
            'Pilih satu huruf konsonan, lalu tekan suku katanya untuk mendengar bunyinya.'
          ],
          funFact: 'Dengan satu konsonan, kita bisa membuat lima suku kata: ba, bi, bu, be, bo.',
          check: 'syllable'
        },
        {
          title: 'Kata dan Suku Kata',
          icon: IMG + 'om-1F4DA.svg',
          visual: 'a · pel',
          kind: 'words',
          paragraphs: [
            'Kata bisa dipecah menjadi suku kata. Kata apel dibaca a-pel, terdiri dari dua suku kata.',
            'Tekan gambar untuk mendengar kata dan suku katanya.'
          ],
          funFact: 'Tepuk tangan satu kali untuk setiap suku kata. Kata "apel" mendapat dua tepukan.',
          check: 'syllableSound'
        }
      ],
      summary: [
        'Huruf vokal ada lima: A, I, U, E, O.',
        'Suku kata dibuat dari konsonan dan vokal, contohnya ba, bi, bu, be, bo.',
        'Kata dapat dipecah menjadi suku kata, contohnya a-pel dan i-kan.',
        'Mengucapkan suku kata pelan-pelan membantu kita membaca kata.'
      ]
    }
  ];

  /* ============================================================
     C. GAME — peta petualangan dengan tiga pos (PDF halaman 5)
     ============================================================ */
  const adventure = [
    {
      id: 'pos1',
      number: 1,
      category: 'huruf',
      title: 'Gerbang Rahasia Huruf',
      short: 'Gerbang Rahasia Huruf',
      goal: 'Mengenalkan huruf alfabet.',
      color: 'blue',
      icon: IMG + 'om-1F3C1.svg',
      speech: 'Selamat datang di Pos Satu, Gerbang Rahasia Huruf! Dengarkan, lihat, lalu pilih huruf yang benar untuk membuka gerbang. Ini petunjuknya. Satu, tebak huruf berdasarkan suara. Dua, tebak huruf berdasarkan gambar. Tiga, lengkapi urutan alfabet. Empat, pilih huruf yang benar. Setiap jawaban benar bernilai sepuluh poin. Ayo, kita mulai!',
      instructions: [
        'Tebak huruf berdasarkan suara.',
        'Tebak huruf berdasarkan gambar.',
        'Lengkapi urutan alfabet.',
        'Pilih huruf yang benar. Tiap jawaban benar bernilai 10 poin.'
      ],
      rounds: ['sound', 'picture', 'sequence', 'capital', 'sound', 'picture', 'sequence', 'capital']
    },
    {
      id: 'pos2',
      number: 2,
      category: 'cocok',
      title: 'Jembatan Huruf',
      short: 'Jembatan Huruf',
      goal: 'Mencocokkan huruf kapital dan huruf kecil.',
      color: 'green',
      icon: IMG + 'om-1F3AF.svg',
      speech: 'Selamat datang di Pos Dua, Jembatan Huruf! Pasangkan huruf kapital dengan huruf kecil yang sama untuk menyeberangi jembatan. Ini petunjuknya. Cocokkan A dengan a, B dengan b, dan seterusnya. Ada papan berisi pasangan huruf yang diacak. Tekan huruf kapital, lalu huruf kecilnya. Kamu juga boleh menyeret hurufnya. Setiap pasangan benar bernilai sepuluh poin. Ayo, kita mulai!',
      instructions: [
        'Cocokkan A dengan a, B dengan b, dan seterusnya.',
        'Ada papan berisi pasangan huruf yang diacak.',
        'Tekan huruf kapital, lalu huruf kecilnya, atau seret hurufnya.',
        'Tiap pasangan benar bernilai 10 poin.'
      ],
      boards: [
        { fixed: ['A', 'B', 'C', 'D'] },
        { random: 4 },
        { random: 5 }
      ]
    },
    {
      id: 'pos3',
      number: 3,
      category: 'suku',
      title: 'Harta Karun Kata',
      short: 'Harta Karun Kata',
      goal: 'Memperkuat pengenalan huruf dan suku kata.',
      color: 'orange',
      icon: IMG + 'om-1F3C6.svg',
      speech: 'Selamat datang di Pos Tiga, Harta Karun Kata! Kenali huruf vokal, susun huruf, dan dengarkan suku kata untuk membuka peti harta. Ini petunjuknya. Satu, kenali huruf vokal. Dua, susun huruf-huruf menjadi kata sederhana. Tiga, kenali gabungan suku kata. Empat, pilih jawaban berdasarkan suara yang kamu dengar. Ayo, kita mulai!',
      instructions: [
        'Kenali huruf vokal.',
        'Susun huruf-huruf menjadi kata sederhana.',
        'Kenali gabungan suku kata.',
        'Pilih jawaban berdasarkan suara yang kamu dengar.'
      ],
      rounds: ['vowel', 'syllable', 'build', 'syllableSound', 'vowel', 'syllable', 'build', 'syllableSound']
    }
  ];

  /* ============================================================
     D. EVALUASI (PDF halaman 6)
     plan = jenis soal; setiap jenis muncul dua kali (10 soal).
     ============================================================ */
  const evaluations = [
    {
      id: 'huruf',
      title: 'Evaluasi Mengenal Huruf',
      color: 'blue',
      description: 'Sepuluh soal interaktif: menebak huruf dari suara, mengenali huruf kapital, mencocokkan huruf kecil, melengkapi urutan alfabet, dan mengenali huruf vokal.',
      plan: [
        'sequence', 'lower', 'sound', 'capital', 'vowel',
        'sequence', 'lower', 'sound', 'capital', 'vowel'
      ],
      variations: [
        { icon: 'volume', label: 'Menebak huruf dari suara' },
        { icon: 'target', label: 'Mengidentifikasi huruf kapital' },
        { icon: 'book', label: 'Mencocokkan huruf kecil' },
        { icon: 'clipboard', label: 'Melengkapi urutan alfabet' },
        { icon: 'sparkles', label: 'Mengenali huruf vokal' }
      ]
    }
  ];

  /* ============================================================
     E. BADGE / PENGHARGAAN
     ============================================================ */
  const badges = [
    { id: 'first-step', name: 'Langkah Pertama', desc: 'Selesaikan satu aktivitas belajar.', icon: IMG + 'om-2705.svg' },
    { id: 'first-star', name: 'Bintang Pertama', desc: 'Kumpulkan bintang pertamamu.', icon: IMG + 'om-1F31F.svg' },
    { id: 'star-10', name: 'Kolektor Bintang', desc: 'Kumpulkan 10 bintang.', icon: IMG + 'om-1F3C6.svg' },
    { id: 'video-1', name: 'Penonton Rajin', desc: 'Selesaikan video pengenalan huruf.', icon: IMG + 'om-1F3AC.svg' },
    { id: 'materi-1', name: 'Pembaca Hebat', desc: 'Selesaikan satu materi.', icon: IMG + 'om-1F4DA.svg' },
    { id: 'pos-3', name: 'Penjelajah Peta', desc: 'Buka dan selesaikan ketiga pos petualangan.', icon: IMG + 'om-1F3AE.svg' },
    { id: 'perfect', name: 'Nilai Sempurna', desc: 'Dapatkan nilai 100 pada evaluasi.', icon: IMG + 'om-1F3C5.svg' },
    { id: 'point-300', name: 'Bintang Kelas', desc: 'Kumpulkan 300 poin belajar.', icon: IMG + 'om-1F393.svg' }
  ];

  /* Label predikat berdasarkan nilai evaluasi */
  const predicates = [
    { min: 90, label: 'Bintang Emas', tone: 'gold', message: 'Luar biasa! Kamu mengenal huruf dengan sangat baik.' },
    { min: 75, label: 'Bintang Perak', tone: 'silver', message: 'Hebat! Sedikit lagi menuju nilai sempurna.' },
    { min: 60, label: 'Bintang Perunggu', tone: 'bronze', message: 'Bagus! Terus berlatih agar semakin mahir.' },
    { min: 0, label: 'Ayo Coba Lagi', tone: 'sky', message: 'Jangan menyerah! Baca materi lalu coba lagi, ya.' }
  ];

  return {
    site: {
      name: 'Huruforia',
      shortName: 'Huruforia',
      theme: 'Mengenal Huruf',
      mascot: 'Huhu',
      mascotImage: IMG + 'mascot-huhu.svg',
      logo: IMG + 'logo.svg',
      kidsImage: IMG + 'kids-huruf.svg',
      /* Ubah menjadi true jika berkas suara sudah diletakkan di
         assets/audio/huruf/ (lihat README). Jika berkas tidak ada,
         aplikasi otomatis memakai suara bawaan browser (Web Speech API). */
      audioFiles: false,
      audioFolder: 'assets/audio/huruf/',
      welcomeSpeech: 'Selamat datang di Huruforia! Ayo belajar mengenal huruf langkah demi langkah!',
      welcome: [
        'Halo, teman! Siap mengenal huruf hari ini?',
        'Aku Huhu. Ayo kita belajar huruf dari A sampai Z!',
        'Belajar sedikit setiap hari membuat kita hebat.',
        'Jangan lupa istirahat dan minum air setelah belajar.'
      ]
    },
    IMG,
    letters,
    ALPHABET,
    LETTER_NAMES,
    VOWELS,
    CONSONANTS,
    SYLLABLE_CONSONANTS,
    LOOKALIKE,
    pictures,
    vowelWords,
    categories,
    videos,
    materials,
    adventure,
    evaluations,
    badges,
    predicates
  };
})();
