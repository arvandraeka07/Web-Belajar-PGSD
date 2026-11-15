/* Membuat daftar semua kalimat yang diucapkan situs -> tools/tts_texts.json
   Jalankan: node tools/list_tts_texts.js
   Format teks HARUS sama persis dengan yang dikirim ke FLA.audio.speak()/say()
   di js/*.js, karena audio dicari berdasarkan teks. */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8'), ctx);
const d = ctx.FLA.data;

const texts = new Set();
const add = (t) => { if (t && String(t).trim()) texts.add(String(t)); };

/* Huruf */
d.letters.forEach((l) => {
  add(l.name);                                                   // nama huruf
  add('Huruf kapital ' + l.upper + ', huruf kecil ' + l.lower);  // pasangan huruf
});
add('Suara menyala');

/* Kata bergambar */
d.pictures.forEach((p) => add(p.word));

/* Vokal dan kata berawalan vokal */
d.vowelWords.forEach((v) => {
  add('Huruf ' + v.vowel.toLowerCase() + '. ' + v.word);
  add(v.syllables.join(', ') + '. ' + v.word);
  add(v.word);
});

/* Suku kata (konsonan + vokal) */
const syllables = [];
d.SYLLABLE_CONSONANTS.forEach((c) => d.VOWELS.forEach((v) => syllables.push((c + v).toLowerCase())));
syllables.forEach(add);

/* Kartu kata di video */
d.videos.forEach((video) => {
  const kw = video.keywords || {};
  (kw.vowels || []).forEach((v) => add(v.letter + ', seperti pada ' + v.word));
  (kw.syllables || []).forEach((s) => { add(s.parts[0] + '... ' + s.parts[1] + '... ' + s.word); });
});

/* Pujian dan umpan balik (js/quiz.js) */
['Benar! Hebat!', 'Tepat sekali!', 'Pintar sekali!', 'Keren, jawabanmu benar!', 'Bagus sekali!',
  'Belum tepat. Ayo coba lagi!', 'Hampir benar. Coba sekali lagi, ya!'].forEach(add);

/* "Jawaban yang benar adalah X." untuk semua kemungkinan pilihan jawaban */
const answers = new Set();
d.letters.forEach((l) => { answers.add(l.upper); answers.add(l.lower); });
syllables.forEach((s) => answers.add(s));
d.pictures.forEach((p) => answers.add(p.word));
d.vowelWords.forEach((v) => answers.add(v.word));
answers.forEach((a) => add('Belum tepat. Jawaban yang benar adalah ' + a + '.'));

/* Kalimat lain */
add('Hebat! Semua pasangan sudah benar!');
add('Selamat! Kamu mendapat dua bintang!');
add('Hebat! Kamu mendapat satu bintang!');
add('Ayo coba lagi! Kamu pasti bisa.');
[1, 2, 3].forEach((n) => add('Selamat! Kamu mendapat ' + n + ' bintang!'));
add(d.site.welcomeSpeech);
d.site.welcome.forEach(add);                  /* sapaan Huhu di beranda */
d.adventure.forEach((pos) => add(pos.speech));

/* Nilai evaluasi (js/evaluation.js): 10 soal -> kelipatan 10 */
for (let score = 0; score <= 100; score += 10) {
  const stars = score >= 90 ? 3 : score >= 75 ? 2 : score >= 60 ? 1 : 0;
  add('Nilaimu ' + score + '. ' + (stars ? 'Kamu mendapat ' + stars + ' bintang!' : 'Ayo belajar lagi, ya!'));
}

/* Tombol "Bacakan Materi" (js/material.js) */
d.materials.forEach((topic) => {
  topic.subbabs.forEach((s) => {
    add(s.title + '. ' + s.paragraphs.join(' ') + (s.funFact ? ' Tahukah kamu? ' + s.funFact : ''));
  });
  add('Ringkasan materi ' + topic.title + '. ' + topic.summary.join(' '));
});

const out = Array.from(texts);
fs.writeFileSync(path.join(__dirname, 'tts_texts.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('Menulis tools/tts_texts.json: ' + out.length + ' kalimat');
