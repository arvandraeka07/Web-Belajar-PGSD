/* ============================================================
   FUN LEARNING ADVENTURE — Data Konten
   Semua materi, soal, game, dan badge dikumpulkan di sini agar
   mudah diperbarui tanpa mengubah logika aplikasi.
   ============================================================ */

window.FLA = window.FLA || {};

FLA.data = (function () {
  'use strict';

  const IMG = 'assets/images/';

  /* ---------- Bank gambar (OpenMoji, CC BY-SA 4.0) ---------- */
  const items = [
    { id: 'apel',        name: 'Apel',          file: IMG + 'om-1F34E.svg' },
    { id: 'kucing',      name: 'Kucing',        file: IMG + 'om-1F408.svg' },
    { id: 'ikan',        name: 'Ikan',          file: IMG + 'om-1F41F.svg' },
    { id: 'sepeda',      name: 'Sepeda',        file: IMG + 'om-1F6B2.svg' },
    { id: 'bulan',       name: 'Bulan',         file: IMG + 'om-1F319.svg' },
    { id: 'pohon',       name: 'Pohon',         file: IMG + 'om-1F333.svg' },
    { id: 'matahari',    name: 'Matahari',      file: IMG + 'om-2600.svg' },
    { id: 'buku',        name: 'Buku',          file: IMG + 'om-1F4D5.svg' },
    { id: 'pensil',      name: 'Pensil',        file: IMG + 'om-270F.svg' },
    { id: 'stroberi',    name: 'Stroberi',      file: IMG + 'om-1F353.svg' },
    { id: 'kupukupu',    name: 'Kupu-kupu',     file: IMG + 'om-1F98B.svg' },
    { id: 'gajah',       name: 'Gajah',         file: IMG + 'om-1F418.svg' },
    { id: 'roket',       name: 'Roket',         file: IMG + 'om-1F680.svg' },
    { id: 'bungamatahari', name: 'Bunga Matahari', file: IMG + 'om-1F33B.svg' },
    { id: 'pisang',      name: 'Pisang',        file: IMG + 'om-1F34C.svg' },
    { id: 'mobil',       name: 'Mobil',         file: IMG + 'om-1F697.svg' },
    { id: 'jam',         name: 'Jam',           file: IMG + 'om-1F550.svg' },
    { id: 'bola',        name: 'Bola',          file: IMG + 'om-26BD.svg' },
    { id: 'pelangi',     name: 'Pelangi',       file: IMG + 'om-1F308.svg' },
    { id: 'bintang',     name: 'Bintang',       file: IMG + 'om-1F31F.svg' }
  ];

  /* ============================================================
     A. VIDEO PEMBELAJARAN
     ============================================================ */
  const videos = [
    {
      id: 'membaca',
      title: 'Membaca Itu Seru',
      subject: 'Bahasa Indonesia',
      grade: 'Kelas 1–2',
      duration: '0:58',
      src: 'assets/videos/membaca.mp4',
      poster: 'assets/images/poster-membaca.jpg',
      subtitle: 'assets/videos/membaca.vtt',
      color: 'blue',
      description: 'Kenali huruf vokal, suku kata, dan membaca kalimat sederhana bersama Huhu si burung hantu.',
      quiz: [
        { q: 'Huruf vokal ada berapa?', options: ['3', '4', '5', '6'], answer: 2, explanation: 'Huruf vokal ada lima: a, i, u, e, o.' },
        { q: 'Kata "buku" terdiri dari ... suku kata.', options: ['1', '2', '3', '4'], answer: 1, explanation: 'Bu-ku terdiri dari dua suku kata.' },
        { q: 'Kalimat sebaiknya dimulai dengan huruf ...', options: ['kecil', 'kapital', 'angka', 'simbol'], answer: 1, explanation: 'Kalimat dimulai dengan huruf kapital dan diakhiri tanda baca.' }
      ]
    },
    {
      id: 'berhitung',
      title: 'Berhitung Ceria',
      subject: 'Matematika',
      grade: 'Kelas 3–4',
      duration: '1:00',
      src: 'assets/videos/berhitung.mp4',
      poster: 'assets/images/poster-berhitung.jpg',
      subtitle: 'assets/videos/berhitung.vtt',
      color: 'yellow',
      description: 'Belajar penjumlahan, pengurangan, dan perkalian dengan contoh yang mudah dipahami.',
      quiz: [
        { q: '125 + 40 = ...', options: ['155', '160', '165', '175'], answer: 2, explanation: '125 + 40 = 165.' },
        { q: '3 × 4 = ...', options: ['7', '9', '12', '15'], answer: 2, explanation: '3 × 4 sama dengan 4 + 4 + 4 = 12.' },
        { q: '90 − 25 = ...', options: ['55', '60', '65', '75'], answer: 2, explanation: '90 − 25 = 65.' }
      ]
    },
    {
      id: 'tumbuhan',
      title: 'Dunia Tumbuhan',
      subject: 'IPA',
      grade: 'Kelas 4–6',
      duration: '0:58',
      src: 'assets/videos/tumbuhan.mp4',
      poster: 'assets/images/poster-tumbuhan.jpg',
      subtitle: 'assets/videos/tumbuhan.vtt',
      color: 'green',
      description: 'Mengenal bagian tumbuhan, fotosintesis, dan cara menjaga tumbuhan di sekitar kita.',
      quiz: [
        { q: 'Bagian tumbuhan yang menyerap air dari tanah adalah ...', options: ['akar', 'batang', 'daun', 'bunga'], answer: 0, explanation: 'Akar menyerap air dan zat hara dari dalam tanah.' },
        { q: 'Gas yang dihasilkan tumbuhan saat fotosintesis adalah ...', options: ['karbondioksida', 'nitrogen', 'oksigen', 'hidrogen'], answer: 2, explanation: 'Fotosintesis menghasilkan oksigen yang kita hirup.' },
        { q: 'Tumbuhan membutuhkan ... untuk membuat makanan.', options: ['cahaya matahari', 'televisi', 'batu', 'plastik'], answer: 0, explanation: 'Cahaya matahari membantu daun memasak makanan.' }
      ]
    }
  ];

  /* ============================================================
     B. MATERI PEMBELAJARAN
     Ringkasan otomatis ditampilkan pada langkah terakhir.
     ============================================================ */
  const materials = [
    {
      id: 'membaca',
      title: 'Membaca Itu Seru',
      subject: 'Bahasa Indonesia',
      grade: 'Kelas 1–2',
      color: 'blue',
      illustration: 'assets/images/illustration-membaca.svg',
      icon: IMG + 'om-1F4DA.svg',
      blurb: 'Mengenal huruf vokal, suku kata, menyusun kata, dan membaca kalimat.',
      subbabs: [
        {
          title: 'Mengenal Huruf Vokal',
          icon: IMG + 'om-1F4D5.svg',
          visual: 'a · i · u · e · o',
          paragraphs: [
            'Huruf vokal adalah huruf yang bunyinya keluar dengan bebas. Ada lima huruf vokal, yaitu a, i, u, e, dan o.',
            'Coba ucapkan perlahan: a… i… u… e… o. Bagus! Setiap huruf vokal memiliki bunyi yang berbeda. Huruf vokal membuat kata menjadi mudah diucapkan.'
          ],
          funFact: 'Huruf vokal disebut juga huruf hidup karena bisa dibunyikan sendiri.',
          question: {
            q: 'Mana yang termasuk huruf vokal?',
            options: ['b', 'a', 'k', 'm'],
            answer: 1,
            explanation: 'Huruf a adalah huruf vokal. Huruf b, k, dan m adalah huruf konsonan.'
          }
        },
        {
          title: 'Membaca Suku Kata',
          icon: IMG + 'om-1F9E9.svg',
          visual: 'bu · ku',
          paragraphs: [
            'Suku kata adalah potongan bunyi dalam sebuah kata. Kata "buku" terdiri dari dua suku kata, yaitu bu dan ku.',
            'Kita bisa menggabungkan huruf konsonan dan vokal. Contohnya b + a = ba, lalu bi, bu, be, bo. Ayo berlatih membaca suku kata dengan suara nyaring!'
          ],
          funFact: 'Tepuk tanganmu setiap suku kata. Kata "bola" mendapat dua tepukan: bo-la.',
          question: {
            q: 'Kata "bola" terdiri dari berapa suku kata?',
            options: ['1', '2', '3', '4'],
            answer: 1,
            explanation: 'Bo-la terdiri dari dua suku kata.'
          }
        },
        {
          title: 'Menyusun Kata',
          icon: IMG + 'om-270F.svg',
          visual: 'b + u + k + u = buku',
          paragraphs: [
            'Kata dibentuk dari huruf-huruf yang disusun dengan urutan yang benar. Jika huruf disusun dengan tepat, kita bisa membacanya.',
            'Contoh: b-u-k-u menjadi buku. k-u-c-i-n-g menjadi kucing. Yuk, susun huruf-huruf di sekitarmu menjadi kata yang bermakna!'
          ],
          funFact: 'Semakin sering berlatih menyusun kata, semakin cepat kamu membaca.',
          question: {
            q: 'Susunan huruf "a-p-e-l" menjadi kata ...',
            options: ['pale', 'apel', 'leap', 'elap'],
            answer: 1,
            explanation: 'Huruf a-p-e-l disusun menjadi kata "apel".'
          }
        },
        {
          title: 'Membaca Kalimat',
          icon: IMG + 'om-1F4DA.svg',
          visual: 'Budi membaca buku.',
          paragraphs: [
            'Kalimat adalah kumpulan kata yang memiliki arti. Kalimat dimulai dengan huruf kapital dan diakhiri dengan tanda titik, tanda tanya, atau tanda seru.',
            '"Budi membaca buku." adalah contoh kalimat sederhana. Kata pertama diawali huruf B kapital, lalu diakhiri tanda titik.'
          ],
          funFact: 'Membaca kalimat dengan intonasi yang tepat membuat cerita lebih hidup.',
          question: {
            q: 'Huruf pertama dalam sebuah kalimat sebaiknya ...',
            options: ['huruf kecil', 'huruf kapital', 'angka', 'simbol'],
            answer: 1,
            explanation: 'Kalimat dimulai dengan huruf kapital, misalnya "Aku suka membaca."'
          }
        }
      ],
      summary: [
        'Huruf vokal ada lima: a, i, u, e, o.',
        'Suku kata adalah potongan bunyi dalam kata, seperti bu-ku.',
        'Kata dibentuk dari huruf yang disusun dengan benar.',
        'Kalimat dimulai dengan huruf kapital dan diakhiri tanda baca.'
      ]
    },
    {
      id: 'berhitung',
      title: 'Berhitung Ceria',
      subject: 'Matematika',
      grade: 'Kelas 3–4',
      color: 'yellow',
      illustration: 'assets/images/illustration-berhitung.svg',
      icon: IMG + 'om-1F9EA.svg',
      blurb: 'Nilai tempat, penjumlahan, pengurangan, perkalian, dan pecahan sederhana.',
      subbabs: [
        {
          title: 'Nilai Tempat Angka',
          icon: IMG + 'om-1F9EA.svg',
          visual: '245 = 200 + 40 + 5',
          paragraphs: [
            'Setiap angka memiliki nilai tempat. Pada bilangan 245, angka 2 menempati ratusan, angka 4 menempati puluhan, dan angka 5 menempati satuan.',
            'Jadi, 245 sama dengan 200 + 40 + 5. Memahami nilai tempat membantu kita menjumlahkan dan mengurangkan bilangan dengan benar.'
          ],
          funFact: 'Nilai tempat selalu bergerak sepuluh kali lipat: 1 puluhan = 10 satuan.',
          question: {
            q: 'Pada bilangan 372, angka 7 menempati tempat ...',
            options: ['satuan', 'puluhan', 'ratusan', 'ribuan'],
            answer: 1,
            explanation: 'Pada 372, angka 7 berada di tempat puluhan, sehingga nilainya 70.'
          }
        },
        {
          title: 'Penjumlahan & Pengurangan',
          icon: IMG + 'om-1F3B2.svg',
          visual: '125 + 40 = 165',
          paragraphs: [
            'Penjumlahan berarti menggabungkan dua bilangan atau lebih. Contoh: 125 + 40 = 165. Susun angka sesuai nilai tempat agar mudah dihitung.',
            'Pengurangan berarti mengambil sebagian dari suatu bilangan. Contoh: 90 − 25 = 65. Periksa hasilmu dengan menambahkan kembali: 65 + 25 = 90.'
          ],
          funFact: 'Penjumlahan bersifat bolak-balik: 4 + 5 sama dengan 5 + 4.',
          question: {
            q: '48 + 25 = ...',
            options: ['63', '72', '73', '83'],
            answer: 2,
            explanation: '48 + 25 = 73. Tambahkan satuan 8 + 5 = 13, simpan 1, lalu puluhan 4 + 2 + 1 = 7.'
          }
        },
        {
          title: 'Perkalian Seru',
          icon: IMG + 'om-1F31F.svg',
          visual: '3 × 4 = 4 + 4 + 4 = 12',
          paragraphs: [
            'Perkalian adalah penjumlahan berulang. Contoh: 3 × 4 berarti angka 4 dijumlahkan sebanyak 3 kali, yaitu 4 + 4 + 4 = 12.',
            'Perkalian juga bisa dibayangkan sebagai baris dan kolom. Jika ada 3 baris dengan 4 bola di setiap baris, jumlah bolanya 12.'
          ],
          funFact: 'Perkalian bersifat bolak-balik: 3 × 4 = 4 × 3.',
          question: {
            q: '4 × 5 = ...',
            options: ['9', '16', '20', '25'],
            answer: 2,
            explanation: '4 × 5 = 5 + 5 + 5 + 5 = 20.'
          }
        },
        {
          title: 'Pecahan Sederhana',
          icon: IMG + 'om-1F34E.svg',
          visual: '1/2 apel · 1/4 apel',
          paragraphs: [
            'Pecahan menunjukkan bagian dari sesuatu yang utuh. Jika sebuah apel dibagi dua sama besar, setiap bagian bernilai 1/2.',
            'Angka di atas disebut pembilang, angka di bawah disebut penyebut. Jika apel dibagi empat sama besar, setiap bagian bernilai 1/4.'
          ],
          funFact: 'Dua potong 1/4 jika digabung menjadi 2/4, yang sama nilainya dengan 1/2.',
          question: {
            q: 'Satu kue dibagi 4 bagian sama besar. Setiap bagian bernilai ...',
            options: ['1/2', '1/3', '1/4', '1/5'],
            answer: 2,
            explanation: 'Satu bagian dari empat bagian sama besar ditulis 1/4.'
          }
        }
      ],
      summary: [
        'Nilai tempat: satuan, puluhan, ratusan.',
        'Penjumlahan menggabungkan, pengurangan mengambil sebagian.',
        'Perkalian adalah penjumlahan berulang.',
        'Pecahan menunjukkan bagian dari sesuatu yang utuh, seperti 1/2 dan 1/4.'
      ]
    },
    {
      id: 'tumbuhan',
      title: 'Dunia Tumbuhan',
      subject: 'IPA',
      grade: 'Kelas 4–6',
      color: 'green',
      illustration: 'assets/images/illustration-tumbuhan.svg',
      icon: IMG + 'om-1F331.svg',
      blurb: 'Bagian tumbuhan, fotosintesis, jenis tumbuhan, dan cara menjaganya.',
      subbabs: [
        {
          title: 'Bagian-Bagian Tumbuhan',
          icon: IMG + 'om-1F331.svg',
          visual: 'akar · batang · daun · bunga',
          paragraphs: [
            'Tumbuhan memiliki akar, batang, daun, bunga, buah, dan biji. Akar menyerap air dan zat hara dari tanah. Batang menyalurkan air ke seluruh bagian tumbuhan.',
            'Daun tempat tumbuhan membuat makanan. Bunga membantu tumbuhan berkembang biak, sedangkan buah dan biji menjadi calon tumbuhan baru.'
          ],
          funFact: 'Akar juga membantu tumbuhan tetap berdiri kokoh di dalam tanah.',
          question: {
            q: 'Bagian tumbuhan yang menyerap air dari tanah adalah ...',
            options: ['akar', 'batang', 'daun', 'bunga'],
            answer: 0,
            explanation: 'Akar berfungsi menyerap air dan zat hara dari dalam tanah.'
          }
        },
        {
          title: 'Fotosintesis Itu Apa?',
          icon: IMG + 'om-1F343.svg',
          visual: 'air + cahaya + CO₂ → makanan + O₂',
          paragraphs: [
            'Fotosintesis adalah proses tumbuhan membuat makanan sendiri. Proses ini terjadi di daun dengan bantuan cahaya matahari.',
            'Tumbuhan mengambil air dari tanah dan karbondioksida dari udara. Dengan cahaya matahari, tumbuhan menghasilkan makanan dan oksigen. Oksigen inilah yang kita hirup.',
          ],
          funFact: 'Klorofil adalah zat hijau daun yang membantu menangkap cahaya matahari.',
          question: {
            q: 'Gas yang dihasilkan tumbuhan saat fotosintesis adalah ...',
            options: ['karbondioksida', 'oksigen', 'nitrogen', 'hidrogen'],
            answer: 1,
            explanation: 'Fotosintesis menghasilkan oksigen yang dibutuhkan makhluk hidup.'
          }
        },
        {
          title: 'Jenis-Jenis Tumbuhan',
          icon: IMG + 'om-1F33B.svg',
          visual: 'pohon · semak · merambat',
          paragraphs: [
            'Tumbuhan di sekitar kita bermacam-macam. Ada pohon berbatang keras dan tinggi, ada semak yang pendek dan berbatang lunak.',
            'Ada juga tumbuhan merambat seperti kacang panjang, serta tumbuhan air seperti eceng gondok. Setiap jenis tumbuhan punya tempat hidup yang sesuai.'
          ],
          funFact: 'Eceng gondok memiliki gelembung kecil di tangkainya agar dapat mengapung di air.',
          question: {
            q: 'Tumbuhan yang hidup di air adalah ...',
            options: ['eceng gondok', 'mangga', 'mawar', 'jagung'],
            answer: 0,
            explanation: 'Eceng gondok hidup mengapung di air, misalnya di kolam atau danau.'
          }
        },
        {
          title: 'Menjaga Tumbuhan',
          icon: IMG + 'om-1F4A7.svg',
          visual: 'siram · rawat · lestarikan',
          paragraphs: [
            'Tumbuhan memberi kita oksigen, makanan, dan tempat tinggal bagi hewan. Kita harus menjaga tumbuhan agar lingkungan tetap sehat.',
            'Cara menjaganya: menyiram tanaman, memberi cahaya matahari yang cukup, tidak memetik sembarangan, dan menanam pohon baru.'
          ],
          funFact: 'Menanam satu pohon membantu bumi menyerap lebih banyak air hujan.',
          question: {
            q: 'Cara menjaga tumbuhan adalah ...',
            options: ['mencabut semua daunnya', 'menyiram secara teratur', 'menutup dengan plastik', 'memetik bunganya setiap hari'],
            answer: 1,
            explanation: 'Menyiram tanaman secara teratur membantu tumbuhan tumbuh sehat.'
          }
        }
      ],
      summary: [
        'Tumbuhan memiliki akar, batang, daun, bunga, buah, dan biji.',
        'Fotosintesis membuat makanan dengan bantuan cahaya matahari.',
        'Tumbuhan memiliki jenis dan tempat hidup yang berbeda-beda.',
        'Kita perlu menyiram, merawat, dan menanam pohon untuk menjaga tumbuhan.'
      ]
    }
  ];

  /* ============================================================
     C. DATA GAME
     ============================================================ */
  const matchSets = [
    ['apel', 'kucing', 'sepeda', 'bulan', 'kupukupu'],
    ['buku', 'gajah', 'roket', 'pisang', 'jam'],
    ['ikan', 'matahari', 'pensil', 'mobil', 'bola']
  ];

  const quickQuestions = [
    { q: 'Berapa hasil 7 + 8?', options: ['13', '14', '15', '16'], answer: 2, explanation: '7 + 8 = 15.' },
    { q: 'Hewan yang menghasilkan madu adalah ...', options: ['lebah', 'kucing', 'ikan', 'gajah'], answer: 0, explanation: 'Lebah menghasilkan madu dari nektar bunga.' },
    { q: 'Planet tempat kita tinggal adalah ...', options: ['Mars', 'Bumi', 'Venus', 'Jupiter'], answer: 1, explanation: 'Kita tinggal di planet Bumi.' },
    { q: '12 − 5 = ...', options: ['6', '7', '8', '9'], answer: 1, explanation: '12 − 5 = 7.' },
    { q: 'Huruf vokal ada ...', options: ['3', '4', '5', '6'], answer: 2, explanation: 'Huruf vokal ada lima: a, i, u, e, o.' },
    { q: 'Bagian tumbuhan yang menyerap air adalah ...', options: ['daun', 'akar', 'bunga', 'buah'], answer: 1, explanation: 'Akar menyerap air dari dalam tanah.' },
    { q: '3 × 6 = ...', options: ['12', '15', '18', '21'], answer: 2, explanation: '3 × 6 = 18.' },
    { q: 'Air jika membeku berubah menjadi ...', options: ['es', 'uap', 'angin', 'awan'], answer: 0, explanation: 'Air yang membeku berubah menjadi es.' },
    { q: 'Warna daun pada umumnya adalah ...', options: ['biru', 'merah', 'hijau', 'hitam'], answer: 2, explanation: 'Daun berwarna hijau karena memiliki klorofil.' },
    { q: 'Lagu Indonesia Raya diciptakan oleh ...', options: ['W.R. Supratman', 'Ismail Marzuki', 'Ibu Sud', 'C. Simanjuntak'], answer: 0, explanation: 'Indonesia Raya diciptakan oleh W.R. Supratman.' },
    { q: '1 jam sama dengan ... menit', options: ['30', '45', '60', '100'], answer: 2, explanation: 'Satu jam sama dengan 60 menit.' },
    { q: 'Alat untuk mengukur suhu adalah ...', options: ['termometer', 'penggaris', 'timbangan', 'jam'], answer: 0, explanation: 'Suhu diukur dengan termometer.' },
    { q: 'Huruf setelah K adalah ...', options: ['J', 'L', 'M', 'N'], answer: 1, explanation: 'Urutan huruf: J, K, L, M. Jadi setelah K adalah L.' },
    { q: '100 − 40 = ...', options: ['50', '60', '70', '80'], answer: 1, explanation: '100 − 40 = 60.' },
    { q: 'Benda langit yang bersinar di siang hari adalah ...', options: ['bulan', 'bintang', 'matahari', 'awan'], answer: 2, explanation: 'Matahari bersinar terang pada siang hari.' },
    { q: '2/4 senilai dengan ...', options: ['1/2', '1/3', '1/4', '2/3'], answer: 0, explanation: '2/4 dapat disederhanakan menjadi 1/2.' },
    { q: 'Proses tumbuhan membuat makanan disebut ...', options: ['fotosintesis', 'pernapasan', 'penguapan', 'pencernaan'], answer: 0, explanation: 'Tumbuhan membuat makanan melalui fotosintesis.' },
    { q: 'Jumlah kaki serangga adalah ...', options: ['4', '6', '8', '10'], answer: 1, explanation: 'Serangga memiliki enam kaki.' },
    { q: 'Bulan ke-8 dalam satu tahun adalah ...', options: ['Juli', 'Agustus', 'September', 'Oktober'], answer: 1, explanation: 'Bulan ke-8 adalah Agustus.' },
    { q: 'Hewan yang bernapas dengan insang adalah ...', options: ['ayam', 'ikan', 'sapi', 'kucing'], answer: 1, explanation: 'Ikan bernapas dengan insang.' }
  ];

  const trueFalse = [
    { statement: 'Matahari terbit pada pagi hari.', answer: true, explanation: 'Matahari terbit di pagi hari di bagian timur langit.' },
    { statement: 'Air membeku saat dipanaskan.', answer: false, explanation: 'Air membeku saat didinginkan, bukan dipanaskan.' },
    { statement: 'Tumbuhan membutuhkan cahaya matahari untuk membuat makanan.', answer: true, explanation: 'Cahaya matahari membantu proses fotosintesis.' },
    { statement: '5 + 5 = 12.', answer: false, explanation: '5 + 5 = 10, bukan 12.' },
    { statement: 'Kucing adalah hewan mamalia.', answer: true, explanation: 'Kucing menyusui anaknya, jadi termasuk mamalia.' },
    { statement: 'Huruf vokal ada tiga.', answer: false, explanation: 'Huruf vokal ada lima: a, i, u, e, o.' },
    { statement: 'Kita harus membuang sampah di tempat sampah.', answer: true, explanation: 'Membuang sampah pada tempatnya menjaga lingkungan bersih.' },
    { statement: 'Bumi berputar mengelilingi bulan.', answer: false, explanation: 'Bulan yang berputar mengelilingi Bumi.' },
    { statement: 'Daun membantu tumbuhan membuat makanan.', answer: true, explanation: 'Fotosintesis terjadi di daun.' },
    { statement: 'Satu minggu ada sepuluh hari.', answer: false, explanation: 'Satu minggu ada tujuh hari.' },
    { statement: 'Membaca dapat menambah pengetahuan.', answer: true, explanation: 'Dengan membaca kita mendapatkan banyak informasi baru.' },
    { statement: 'Ikan bernapas dengan paru-paru.', answer: false, explanation: 'Ikan bernapas dengan insang.' }
  ];

  /* ============================================================
     D. EVALUASI — 3 paket, masing-masing 10 soal
     ============================================================ */
  const evaluations = [
    {
      id: 'kelas12',
      title: 'Petualangan Awal',
      grade: 'Kelas 1–2',
      color: 'blue',
      description: 'Membaca, berhitung dasar, dan mengenal alam sekitar.',
      questions: [
        {
          q: 'Mana yang termasuk huruf vokal?',
          options: ['b', 'k', 'a', 'm'],
          answer: 2,
          explanation: 'a adalah huruf vokal. Huruf vokal lainnya adalah i, u, e, dan o.'
        },
        {
          q: '4 + 3 = ...',
          options: ['5', '6', '7', '8'],
          answer: 2,
          explanation: '4 + 3 = 7.'
        },
        {
          q: '10 − 4 = ...',
          options: ['4', '5', '6', '7'],
          answer: 2,
          explanation: '10 − 4 = 6.'
        },
        {
          q: 'Hewan yang dapat terbang adalah ...',
          options: ['burung', 'kucing', 'sapi', 'ikan'], answer: 0,
          explanation: 'Burung memiliki sayap sehingga dapat terbang.'
        },
        {
          q: 'Bagian tumbuhan yang berwarna hijau dan lebar adalah ...',
          options: ['akar', 'daun', 'batang', 'biji'], answer: 1,
          explanation: 'Daun umumnya berwarna hijau dan menjadi tempat fotosintesis.'
        },
        {
          q: 'Kata "ibu" terdiri dari berapa suku kata?',
          options: ['1', '2', '3', '4'], answer: 1,
          explanation: 'I-bu terdiri dari dua suku kata.'
        },
        {
          q: 'Angka setelah 19 adalah ...',
          options: ['18', '20', '21', '29'], answer: 1,
          explanation: 'Setelah 19 adalah 20.'
        },
        {
          q: 'Benda yang digunakan untuk menulis adalah ...',
          options: ['pensil', 'bola', 'sepatu', 'gelas'], answer: 0,
          explanation: 'Pensil digunakan untuk menulis.'
        },
        {
          q: '5 + 5 + 5 = ...',
          options: ['10', '12', '15', '20'], answer: 2,
          explanation: '5 + 5 + 5 = 15.'
        },
        {
          q: 'Sebelum makan, sebaiknya kita ...',
          options: ['mencuci tangan', 'berlari', 'menonton', 'tidur'], answer: 0,
          explanation: 'Mencuci tangan menjaga kita dari kuman.'
        }
      ]
    },
    {
      id: 'kelas34',
      title: 'Penjelajah Ilmu',
      grade: 'Kelas 3–4',
      color: 'yellow',
      description: 'Operasi hitung, pecahan, tumbuhan, dan pengetahuan umum.',
      questions: [
        {
          q: '125 + 40 = ...',
          options: ['155', '160', '165', '170'], answer: 2,
          explanation: '125 + 40 = 165.'
        },
        {
          q: '9 × 4 = ...',
          options: ['32', '34', '36', '38'], answer: 2,
          explanation: '9 × 4 = 36.'
        },
        {
          q: '1/2 + 1/2 = ...',
          options: ['1/2', '1', '2', '1/4'], answer: 1,
          explanation: 'Dua bagian setengah jika digabung menjadi satu bagian utuh.'
        },
        {
          q: 'Proses tumbuhan membuat makanan disebut ...',
          options: ['fotosintesis', 'penguapan', 'pernapasan', 'pembusukan'], answer: 0,
          explanation: 'Fotosintesis terjadi di daun dengan bantuan cahaya matahari.'
        },
        {
          q: 'Alat indra untuk melihat adalah ...',
          options: ['telinga', 'hidung', 'mata', 'kulit'], answer: 2,
          explanation: 'Mata adalah alat indra penglihatan.'
        },
        {
          q: '72 − 18 = ...',
          options: ['44', '54', '56', '64'], answer: 1,
          explanation: '72 − 18 = 54.'
        },
        {
          q: 'Ibu kota Provinsi Jawa Timur adalah ...',
          options: ['Bandung', 'Surabaya', 'Semarang', 'Malang'], answer: 1,
          explanation: 'Ibu kota Jawa Timur adalah Surabaya.'
        },
        {
          q: 'Penulisan kalimat yang benar adalah ...',
          options: ['budi pergi ke sekolah.', 'Budi pergi ke sekolah.', 'Budi Pergi ke Sekolah.', 'budi Pergi ke sekolah.'],
          answer: 1,
          explanation: 'Kalimat diawali huruf kapital dan diakhiri tanda titik.'
        },
        {
          q: '2 jam = ... menit',
          options: ['60', '90', '100', '120'], answer: 3,
          explanation: '1 jam = 60 menit, jadi 2 jam = 120 menit.'
        },
        {
          q: 'Bagian tumbuhan yang menyalurkan air dari akar ke daun adalah ...',
          options: ['batang', 'bunga', 'buah', 'biji'], answer: 0,
          explanation: 'Batang menyalurkan air dan zat hara ke seluruh bagian tumbuhan.'
        }
      ]
    },
    {
      id: 'kelas56',
      title: 'Bintang Kelas',
      grade: 'Kelas 5–6',
      color: 'green',
      description: 'Perkalian, pecahan, IPA, IPS, dan pengetahuan umum.',
      questions: [
        {
          q: '15 × 12 = ...',
          options: ['150', '160', '170', '180'], answer: 3,
          explanation: '15 × 12 = 180.'
        },
        {
          q: '2/5 + 1/5 = ...',
          options: ['3/5', '3/10', '2/10', '1/5'], answer: 0,
          explanation: 'Penyebut sama, jadi jumlahkan pembilangnya: 2 + 1 = 3, hasilnya 3/5.'
        },
        {
          q: 'Organ pernapasan manusia adalah ...',
          options: ['jantung', 'paru-paru', 'lambung', 'ginjal'], answer: 1,
          explanation: 'Manusia bernapas menggunakan paru-paru.'
        },
        {
          q: 'Gas yang dihasilkan tumbuhan saat fotosintesis adalah ...',
          options: ['oksigen', 'karbondioksida', 'nitrogen', 'helium'], answer: 0,
          explanation: 'Fotosintesis menghasilkan oksigen.'
        },
        {
          q: '3,5 + 1,25 = ...',
          options: ['4,25', '4,5', '4,75', '5,25'], answer: 2,
          explanation: '3,50 + 1,25 = 4,75.'
        },
        {
          q: 'Planet yang paling dekat dengan Matahari adalah ...',
          options: ['Venus', 'Bumi', 'Merkurius', 'Mars'], answer: 2,
          explanation: 'Merkurius adalah planet terdekat dengan Matahari.'
        },
        {
          q: '25% dari 200 adalah ...',
          options: ['25', '40', '50', '75'], answer: 2,
          explanation: '25% sama dengan 1/4, sehingga 1/4 × 200 = 50.'
        },
        {
          q: 'Proklamasi Kemerdekaan Indonesia dibacakan pada ...',
          options: ['17 Agustus 1945', '17 Agustus 1949', '1 Juni 1945', '28 Oktober 1928'], answer: 0,
          explanation: 'Proklamasi dibacakan pada 17 Agustus 1945.'
        },
        {
          q: 'Sumber energi terbarukan adalah ...',
          options: ['batu bara', 'minyak bumi', 'matahari', 'gas alam'], answer: 2,
          explanation: 'Energi matahari selalu tersedia dan termasuk energi terbarukan.'
        },
        {
          q: 'Penulisan kalimat dengan ejaan yang benar adalah ...',
          options: ['ayah membeli buku di toko.', 'Ayah membeli buku di toko.', 'Ayah Membeli Buku Di Toko.', 'ayah Membeli buku di Toko.'],
          answer: 1,
          explanation: 'Huruf kapital dipakai di awal kalimat dan nama orang.'
        }
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
    { id: 'video-2', name: 'Penonton Rajin', desc: 'Selesaikan 2 video pembelajaran.', icon: IMG + 'om-1F3AC.svg' },
    { id: 'materi-1', name: 'Pembaca Hebat', desc: 'Selesaikan satu topik materi.', icon: IMG + 'om-1F4DA.svg' },
    { id: 'game-3', name: 'Jagoan Game', desc: 'Mainkan 3 permainan berbeda.', icon: IMG + 'om-1F3AE.svg' },
    { id: 'perfect', name: 'Nilai Sempurna', desc: 'Dapatkan nilai 100 pada evaluasi.', icon: IMG + 'om-1F3C5.svg' },
    { id: 'point-300', name: 'Bintang Kelas', desc: 'Kumpulkan 300 poin belajar.', icon: IMG + 'om-1F393.svg' }
  ];

  /* Label predikat berdasarkan nilai evaluasi */
  const predicates = [
    { min: 90, label: 'Bintang Emas', tone: 'gold', message: 'Luar biasa! Kamu menguasai materi dengan sangat baik.' },
    { min: 75, label: 'Bintang Perak', tone: 'silver', message: 'Hebat! Sedikit lagi menuju nilai sempurna.' },
    { min: 60, label: 'Bintang Perunggu', tone: 'bronze', message: 'Bagus! Terus berlatih agar semakin mahir.' },
    { min: 0, label: 'Ayo Coba Lagi', tone: 'sky', message: 'Jangan menyerah! Baca materi lalu coba lagi, ya.' }
  ];

  return {
    site: {
      name: 'Fun Learning Adventure',
      shortName: 'FLA',
      mascot: 'Huhu',
      mascotImage: IMG + 'mascot-huhu.svg',
      logo: IMG + 'logo.svg',
      welcome: [
        'Halo, teman! Siap belajar hari ini?',
        'Aku Huhu, teman belajarmu. Klik aku lagi, ya!',
        'Belajar sedikit setiap hari membuat kita hebat.',
        'Jangan lupa istirahat dan minum air setelah belajar.'
      ]
    },
    items,
    videos,
    materials,
    matchSets,
    quickQuestions,
    trueFalse,
    evaluations,
    badges,
    predicates
  };
})();
