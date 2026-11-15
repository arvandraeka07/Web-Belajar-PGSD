/* ============================================================
   FUN LEARNING ADVENTURE — Pengelola Audio
   - Musik latar dibuat dengan Web Audio API (tanpa file eksternal).
   - Efek suara disintesis langsung di browser.
   - Pengucapan huruf, suku kata, instruksi, dan umpan balik memakai
     suara gadis periang dari assets/audio/tts/ (dibuat oleh
     tools/generate_gtts_gadis.py). Kalimat yang belum punya berkas
     otomatis memakai Web Speech API Bahasa Indonesia.
   - Tombol "Suara" mengaktifkan/menonaktifkan seluruh audio.
   - Audio hanya aktif setelah pengguna berinteraksi.
   ============================================================ */

window.FLA = window.FLA || {};

FLA.AudioManager = (function () {
  'use strict';

  const STORAGE_KEY = 'fla_audio_v1';

  const NOTES = {
    C3: 130.81, F3: 174.61, G3: 196.0, A3: 220.0,
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
    C6: 1046.5, E6: 1318.5, G6: 1568.0
  };

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      /* localStorage bisa diblokir; abaikan dengan tenang */
    }
  }

  class AudioManager {
    constructor() {
      const prefs = loadPrefs();
      this.volume = typeof prefs.volume === 'number' ? prefs.volume : 0.7;
      this.soundOn = prefs.sound !== false;
      this.musicOn = false;
      this.clip = null;
      this.missingClips = {};
      this.ctx = null;
      this.master = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.musicTimer = null;
      this.musicStep = 0;
      this.speech = typeof window.speechSynthesis !== 'undefined' ? window.speechSynthesis : null;
      this.indonesianVoice = null;
      this.speaking = false;
      this.onStateChange = null;
      this.ttsFolder = 'assets/audio/tts/';
      /* manifest.js dimuat lebih dulu oleh index.html supaya klik pertama
         (mis. huruf A/B/C di beranda) langsung memakai suara gadis, tanpa
         menunggu fetch manifest.json selesai. */
      this.manifest = (window.FLA && window.FLA.ttsManifest) ? Object.assign({}, window.FLA.ttsManifest) : {};
      this.missingTexts = new Set();
      this._loadManifest();
      this._pickVoice();
      if (this.speech) {
        this.speech.addEventListener('voiceschanged', () => this._pickVoice());
      }
    }

    /* Peta kalimat -> berkas MP3 gadis periang. Bila tidak ada, suara browser dipakai. */
    _loadManifest() {
      if (typeof fetch !== 'function') return;
      fetch(this.ttsFolder + 'manifest.json', { cache: 'no-cache' })
        .then((response) => (response.ok ? response.json() : {}))
        .then((map) => { this.manifest = map || {}; })
        .catch(() => { /* tanpa manifest: pakai suara browser */ });
    }

    /* HARUS sama dengan normalize() di tools/generate_elevenlabs.py */
    _norm(text) {
      return String(text).toLowerCase().split(/\s+/).filter(Boolean).join(' ');
    }

    /* Daftar kalimat yang belum punya audio ElevenLabs.
       Di konsol browser: FLA.audio.exportMissing() lalu simpan sebagai .txt
       dan jalankan: python tools/generate_elevenlabs.py --tambah berkas.txt */
    exportMissing() {
      const list = Array.from(this.missingTexts);
      console.log(list.join('\n'));
      return list;
    }

    /* Cara baca Indonesia untuk suara cadangan browser ("be" jadi "bé").
       Sejajar dengan pronounce() di tools/generate_elevenlabs.py. */
    _pronounce(text) {
      const letter = { a: 'a', b: 'bé', c: 'cé', d: 'dé', e: 'é', f: 'èf', g: 'gé', h: 'ha', i: 'i', j: 'jé',
        k: 'ka', l: 'èl', m: 'èm', n: 'èn', o: 'o', p: 'pé', q: 'ki', r: 'èr', s: 'ès', t: 'té', u: 'u',
        v: 'vé', w: 'wé', x: 'èks', y: 'yé', z: 'zèt' };
      const name = { be: 'bé', ce: 'cé', de: 'dé', e: 'é', ef: 'èf', ge: 'gé', je: 'jé', el: 'èl', em: 'èm',
        en: 'èn', pe: 'pé', er: 'èr', es: 'ès', te: 'té', ve: 'vé', we: 'wé', eks: 'èks', ye: 'yé', zet: 'zèt' };
      const plain = String(text).trim();
      const low = plain.toLowerCase();
      /* Satu huruf / suku kata dibacakan dengan kata pengantar agar mesin suara
         tahu ini Bahasa Indonesia (tanpa itu "be" sering dibaca "bi"). */
      if (name[low]) return 'Huruf ' + name[low] + '.';
      if (letter[low]) return 'Huruf ' + letter[low] + '.';
      if (/^[bcdfghjklmnpqrstvwxyz][aiueo]$/.test(low)) return 'Suku kata ' + low[0] + (low[1] === 'e' ? 'é' : low[1]) + '.';
      return plain.replace(/(^|[^A-Za-z\u00c0-\u024f])([A-Za-z])(?![A-Za-z\u00c0-\u024f])/g,
        (all, before, ch) => before + letter[ch.toLowerCase()]);
    }

    _playTts(text, opts) {
      const file = this.manifest[this._norm(text)];
      if (!file) {
        if (Object.keys(this.manifest).length) this.missingTexts.add(String(text));
        return false;
      }
      this.stopSpeech();
      this.stopClip();
      const clip = new Audio(this.ttsFolder + file);
      clip.volume = Math.max(0, this.volume);
      this.clip = clip;
      const finish = () => {
        if (this.clip === clip) this.clip = null;
        this.speaking = false;
        if (opts.onEnd) opts.onEnd();
      };
      clip.addEventListener('playing', () => {
        this.speaking = true;
        if (opts.onStart) opts.onStart();
      }, { once: true });
      clip.addEventListener('ended', finish, { once: true });
      clip.addEventListener('error', () => {
        /* berkas hilang: hapus dari peta dan pakai suara browser */
        delete this.manifest[this._norm(text)];
        if (this.clip === clip) this.clip = null;
        this._speakBrowser(text, opts);
      }, { once: true });
      this.speaking = true;
      const promise = clip.play();
      if (promise && promise.catch) promise.catch(() => { /* error event menangani cadangan */ });
      return true;
    }

    /* Pilih suara Indonesia PEREMPUAN: "Damayanti" (iPhone/iPad/Mac), "Microsoft Gadis"
       (Windows/Edge), "Google Bahasa Indonesia" (Chrome/Android). Suara laki-laki
       (mis. "Andika") dihindari. Bila tak ada suara Indonesia sama sekali,
       indonesianVoice = null (browser akan memakai suara bahasa lain -> logat salah). */
    _pickVoice() {
      if (!this.speech) return;
      const voices = this.speech.getVoices ? this.speech.getVoices() : [];
      const female = /damayanti|gadis|female|perempuan|wanita|google.*indonesia|\bina\b|\bsari\b|\bsiti\b/i;
      const male = /andika|rizki|\bmale\b|\bpria\b|laki|\bgus\b|\bbudi\b/i;
      const score = (voice) => {
        let points = 0;
        if (/damayanti/i.test(voice.name)) points += 10;
        if (female.test(voice.name)) points += 4;
        if (male.test(voice.name)) points -= 6;
        if (/online|natural|enhanced|premium/i.test(voice.name)) points += 1;
        return points;
      };
      const indo = voices.filter((voice) => /^id(-|_)/i.test(voice.lang) || /indones/i.test(voice.name));
      indo.sort((x, y) => score(y) - score(x));
      this.indonesianVoice = indo[0] || null;
    }

    /* Membuat AudioContext hanya setelah ada interaksi pengguna. */
    ensure() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.14;
        this.sfxGain.gain.value = 0.55;
        this.musicGain.connect(this.master);
        this.sfxGain.connect(this.master);
        this.master.connect(this.ctx.destination);
        this.master.gain.value = this.volume;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }

    setVolume(value) {
      this.volume = Math.max(0, Math.min(1, Number(value)));
      if (this.master) {
        this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
      }
      if (this.clip) this.clip.volume = Math.max(0, this.volume);
      const prefs = loadPrefs();
      prefs.volume = this.volume;
      savePrefs(prefs);
      if (this.onStateChange) this.onStateChange();
    }

    /* Menyalakan/mematikan seluruh suara (pengucapan, efek, musik). */
    toggleSound(force) {
      this.soundOn = typeof force === 'boolean' ? force : !this.soundOn;
      if (!this.soundOn) {
        this.stopSpeech();
        this.stopClip();
        this.stopMusic();
      }
      const prefs = loadPrefs();
      prefs.sound = this.soundOn;
      savePrefs(prefs);
      if (this.onStateChange) this.onStateChange();
      return this.soundOn;
    }

    toggleMusic(force) {
      const shouldPlay = typeof force === 'boolean' ? force : !this.musicOn;
      if (shouldPlay && !this.soundOn) this.toggleSound(true);
      this.ensure();
      if (!this.ctx) return false;
      if (shouldPlay) this.startMusic();
      else this.stopMusic();
      if (this.onStateChange) this.onStateChange();
      return this.musicOn;
    }

    startMusic() {
      if (!this.ctx || this.musicOn) return;
      this.musicOn = true;
      this.musicStep = 0;
      this._musicTick();
      this.musicTimer = setInterval(() => this._musicTick(), 440);
    }

    stopMusic() {
      this.musicOn = false;
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }

    _musicTick() {
      if (!this.ctx || !this.musicOn) return;
      const melody = [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.A5, NOTES.G5, NOTES.E5, NOTES.D5, NOTES.C5,
        NOTES.G5, NOTES.A5, NOTES.C6, NOTES.A5, NOTES.G5, NOTES.E5, NOTES.D5, NOTES.C5];
      const bass = [NOTES.C3, NOTES.C3, NOTES.A3, NOTES.A3, NOTES.F3, NOTES.F3, NOTES.G3, NOTES.G3];
      const step = this.musicStep % melody.length;

      this._tone(melody[step], 0.34, 0.32, 'triangle', this.musicGain);
      if (step % 2 === 0) {
        this._tone(bass[Math.floor(step / 2) % bass.length], 0.7, 0.25, 'sine', this.musicGain);
      }
      if (step % 8 === 4) {
        this._tone(melody[step] * 2, 0.2, 0.12, 'sine', this.musicGain);
      }
      this.musicStep += 1;
    }

    _tone(freq, duration, volume, type, destination, startDelay, slideTo) {
      if (!this.ctx || !destination) return;
      const now = this.ctx.currentTime + (startDelay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    }

    sfx(name) {
      if (!this.soundOn) return;
      this.ensure();
      if (!this.ctx) return;
      const play = (freq, delay, duration, volume, type, slideTo) =>
        this._tone(freq, duration || 0.12, volume || 0.25, type || 'sine', this.sfxGain, delay || 0, slideTo);

      switch (name) {
        case 'click':
          play(NOTES.A5, 0, 0.06, 0.16, 'triangle');
          break;
        case 'select':
          play(NOTES.E5, 0, 0.09, 0.2, 'triangle');
          play(NOTES.A5, 0.06, 0.1, 0.18, 'sine');
          break;
        case 'correct':
          play(NOTES.C5, 0, 0.14, 0.24, 'triangle');
          play(NOTES.E5, 0.09, 0.14, 0.22, 'triangle');
          play(NOTES.G5, 0.18, 0.2, 0.2, 'triangle');
          break;
        case 'wrong':
          play(233.0, 0, 0.18, 0.22, 'sawtooth', 150.0);
          play(180.0, 0.16, 0.24, 0.18, 'square', 120.0);
          break;
        case 'star':
          play(NOTES.C6, 0, 0.12, 0.2, 'sine');
          play(NOTES.E6, 0.08, 0.12, 0.18, 'sine');
          play(NOTES.G6, 0.16, 0.25, 0.16, 'sine');
          break;
        case 'win':
          play(NOTES.C5, 0, 0.16, 0.24, 'triangle');
          play(NOTES.E5, 0.13, 0.16, 0.22, 'triangle');
          play(NOTES.G5, 0.26, 0.16, 0.22, 'triangle');
          play(NOTES.C6, 0.39, 0.4, 0.2, 'triangle');
          break;
        case 'pop':
          play(420.0, 0, 0.1, 0.2, 'sine', 820.0);
          break;
        case 'tick':
          play(1100.0, 0, 0.03, 0.1, 'square');
          break;
        default:
          play(NOTES.C5, 0, 0.08, 0.16, 'sine');
      }
    }

    /* Pemberitahuan singkat (tidak berulang) saat suara tidak bisa diputar. */
    _notice(message) {
      const now = Date.now();
      if (this._lastNotice && now - this._lastNotice < 6000) return;
      this._lastNotice = now;
      if (FLA.ui) FLA.ui.toast(message, { tone: 'info', icon: 'volume-off', duration: 3200 });
    }

    speak(text, options) {
      const opts = options || {};
      if (!this.soundOn) {
        if (opts.notify) this._notice('Suara sedang dimatikan. Nyalakan lewat tombol suara di kanan atas.');
        if (opts.onEnd) opts.onEnd();
        return false;
      }
      if (this._playTts(text, opts)) return true;
      return this._speakBrowser(text, opts);
    }

    /* Cadangan: suara bawaan browser (Web Speech API) */
    _speakBrowser(text, options) {
      const opts = options || {};
      if (!this.speech) {
        if (opts.notify) this._notice('Browser ini belum mendukung suara pengucapan. Coba Chrome atau Edge.');
        if (opts.onEnd) opts.onEnd();
        return false;
      }
      if (!this.indonesianVoice) this._pickVoice(); /* daftar suara sering baru siap setelah halaman dimuat */
      if (!this.indonesianVoice && this.speech.getVoices && this.speech.getVoices().length) {
        this._notice('Perangkat ini belum punya suara Bahasa Indonesia, jadi pelafalan bisa salah. ' +
          'Pasang suara Indonesia (Damayanti di iPhone/Mac, Gadis di Windows) di pengaturan perangkat.');
      }
      this.stopSpeech();
      this.stopClip();
      const utterance = new SpeechSynthesisUtterance(this._pronounce(text));
      utterance.lang = 'id-ID';
      utterance.rate = typeof opts.rate === 'number' ? opts.rate : 1.08;
      utterance.pitch = 1.55; /* nada tinggi, ceria seperti gadis periang */
      utterance.volume = Math.max(0, this.volume);
      if (this.indonesianVoice) utterance.voice = this.indonesianVoice;
      utterance.onstart = () => {
        this.speaking = true;
        if (opts.onStart) opts.onStart();
      };
      utterance.onend = () => {
        this.speaking = false;
        if (opts.onEnd) opts.onEnd();
      };
      utterance.onerror = () => {
        this.speaking = false;
        if (opts.onEnd) opts.onEnd();
      };
      this.speaking = true;
      this.speech.speak(utterance);
      return true;
    }

    stopSpeech() {
      if (this.speech) this.speech.cancel();
      this.speaking = false;
    }

    stopClip() {
      if (this.clip) {
        try { this.clip.pause(); } catch (error) { /* abaikan */ }
        this.clip = null;
      }
    }

    /* Mengucapkan huruf, suku kata, atau kalimat pendek.
       key  : nama berkas (tanpa ekstensi) di assets/audio/huruf/, mis. "b" atau "ba"
       text : teks yang dibacakan Web Speech API jika berkas tidak ada. */
    say(key, text, options) {
      const opts = options || {};
      const spoken = text || key;
      if (!this.soundOn) {
        this._notice('Suara sedang dimatikan. Nyalakan lewat tombol suara di kanan atas.');
        if (opts.onEnd) opts.onEnd();
        return false;
      }
      if (this.manifest[this._norm(spoken)]) return this.speak(spoken, opts);
      const site = FLA.data && FLA.data.site;
      const fileKey = String(key || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (site && site.audioFiles && fileKey && !this.missingClips[fileKey]) {
        this.stopSpeech();
        this.stopClip();
        const clip = new Audio(site.audioFolder + fileKey + '.mp3');
        clip.volume = this.volume;
        this.clip = clip;
        clip.addEventListener('error', () => {
          this.missingClips[fileKey] = true;
          if (this.clip === clip) this.clip = null;
          this.speak(spoken, opts);
        }, { once: true });
        clip.addEventListener('ended', () => { if (opts.onEnd) opts.onEnd(); }, { once: true });
        const promise = clip.play();
        if (promise && promise.catch) promise.catch(() => { /* error event menangani cadangan */ });
        return true;
      }
      return this.speak(spoken, Object.assign({ rate: 1.0, notify: true }, opts));
    }

    get hasSpeech() {
      return Boolean(this.speech);
    }
  }

  FLA.audio = new AudioManager();
  return AudioManager;
})();
