/* Uji logika audio tanpa browser sungguhan.
   Jalankan: node tools/test_audio.js
   Memeriksa: manifest.js, pemetaan huruf A/B/C, suara sambutan beranda,
   cadangan Web Speech (pitch gadis), dan ketersediaan semua berkas MP3. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
let failures = 0;
const check = (name, ok, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : ''));
  if (!ok) failures += 1;
};

const store = {};
const ctx = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  },
  SpeechSynthesisUtterance: class {
    constructor(text) { this.text = text; }
  }
};
ctx.window = ctx;
vm.createContext(ctx);

const run = (file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
run('js/data.js');
run('assets/audio/tts/manifest.js');

const manifest = ctx.FLA.ttsManifest || {};
const manifestJson = JSON.parse(fs.readFileSync(path.join(root, 'assets/audio/tts/manifest.json'), 'utf8'));
check('manifest.js berisi peta yang sama dengan manifest.json',
  JSON.stringify(manifest) === JSON.stringify(manifestJson), Object.keys(manifest).length + ' entri');
check('manifest.js tidak kosong', Object.keys(manifest).length > 200);

const files = new Set(fs.readdirSync(path.join(root, 'assets/audio/tts')).filter((f) => f.endsWith('.mp3')));
const missing = Object.entries(manifest).filter(([, file]) => !files.has(file));
check('semua berkas MP3 di manifest tersedia', missing.length === 0, missing.length + ' hilang');

/* Mock elemen Audio dan Web Speech API */
const played = [];
class FakeAudio {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this.paused = false;
    this.listeners = {};
    played.push(this);
  }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  play() { this.paused = false; setTimeout(() => (this.listeners.playing || []).forEach((fn) => fn()), 0); return Promise.resolve(); }
  pause() { this.paused = true; }
}
ctx.Audio = FakeAudio;
const spoken = [];
const voices = [
  { name: 'Microsoft Andika', lang: 'id-ID' },
  { name: 'Microsoft Gadis Online (Natural)', lang: 'id-ID' },
  { name: 'Google Bahasa Indonesia', lang: 'id-ID' }
];
ctx.speechSynthesis = {
  getVoices: () => voices,
  addEventListener: () => {},
  cancel: () => {},
  speak: (u) => {
    spoken.push(u);
    setTimeout(() => { if (u.onstart) u.onstart(); if (u.onend) u.onend(); }, 0);
  }
};
ctx.fetch = () => Promise.reject(new Error('offline tes'));

run('js/audio.js');
const audio = ctx.FLA.audio;

const ttsTexts = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'tts_texts.json'), 'utf8'));
const withoutAudio = ttsTexts.filter((text) => !manifest[audio._norm(text)]);
check('semua kalimat di tts_texts.json punya berkas audio',
  withoutAudio.length === 0, withoutAudio.length + ' tanpa audio');

check('memilih suara perempuan Indonesia (Gadis), bukan Andika',
  audio.indonesianVoice && /gadis/i.test(audio.indonesianVoice.name),
  audio.indonesianVoice && audio.indonesianVoice.name);
check('normalisasi teks', audio._norm('  Halo   TEMAN ') === 'halo teman');
check('pelafalan huruf be', audio._pronounce('be') === 'Huruf bé.', audio._pronounce('be'));
check('pelafalan suku kata ba', audio._pronounce('ba') === 'Suku kata ba.', audio._pronounce('ba'));

const fileFor = (n) => manifest[n];
['a', 'be', 'ce', 'de', 'e'].forEach((key) => {
  played.length = 0;
  const ok = audio.say(key, key);
  const expected = fileFor(key);
  check('tombol huruf "' + key + '" memakai MP3 gadis',
    ok === true && played.length === 1 && played[0].src === 'assets/audio/tts/' + expected,
    played.length ? played[0].src : 'tidak ada audio');
});

played.length = 0;
audio.speak(ctx.FLA.data.site.welcomeSpeech);
check('sambutan beranda memakai MP3 gadis',
  played.length === 1 && /assets\/audio\/tts\/.+\.mp3$/.test(played[0].src),
  played.length ? played[0].src : 'tidak ada audio');

played.length = 0;
audio.speak('a');
const firstClip = audio.clip;
audio.stopSpeech();
check('stopSpeech menghentikan MP3 yang sedang berbunyi',
  Boolean(firstClip && firstClip.paused && audio.clip === null));

let canceledEnd = 0;
audio.speak('a', { onEnd: () => { canceledEnd += 1; } });
audio.speak('be');
check('onEnd dipanggil saat audio dihentikan agar status tombol tidak nyangkut',
  canceledEnd === 1, canceledEnd + ' panggilan');
audio.stopSpeech();

check('speakSequence tersedia untuk instruksi berurutan',
  typeof audio.speakSequence === 'function');

['Halo, teman! Siap mengenal huruf hari ini?',
  'Aku Huhu. Ayo kita belajar huruf dari A sampai Z!',
  'Belajar sedikit setiap hari membuat kita hebat.',
  'Jangan lupa istirahat dan minum air setelah belajar.'].forEach((line) => {
  check('sapaan Huhu punya audio: ' + line.slice(0, 28) + '...',
    Boolean(manifest[audio._norm(line)]));
});

played.length = 0;
spoken.length = 0;
audio.speak('Kalimat yang sengaja belum punya berkas.');
check('cadangan Web Speech dipakai bila MP3 tidak ada',
  spoken.length === 1 && played.length === 0);
if (spoken[0]) {
  check('cadangan memakai bahasa Indonesia', spoken[0].lang === 'id-ID', spoken[0].lang);
  check('cadangan bernada gadis periang (pitch >= 1.5)', spoken[0].pitch >= 1.5, String(spoken[0].pitch));
  check('cadangan tidak terlalu cepat', spoken[0].rate >= 1 && spoken[0].rate <= 1.2, String(spoken[0].rate));
}

const ended = [];
audio.toggleSound(false);
const result = audio.say('a', 'a', { onEnd: () => ended.push('a') });
check('saat suara mati, say() mengembalikan false dan memanggil onEnd',
  result === false && ended.length === 1);
audio.toggleSound(true);

played.length = 0;
audio.speak('Kalimat belum ada di manifest ini.');
check('teks tanpa berkas dicatat di missingTexts',
  audio.missingTexts.has('Kalimat belum ada di manifest ini.'));

let sfxOk = true;
try { audio.sfx('select'); } catch (error) { sfxOk = false; }
check('efek suara aman saat AudioContext belum tersedia', sfxOk);

console.log('\n' + (failures ? failures + ' TES GAGAL' : 'SEMUA TES LULUS'));
process.exitCode = failures ? 1 : 0;
