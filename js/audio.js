/* ============================================================
   FUN LEARNING ADVENTURE — Pengelola Audio
   - Musik latar dibuat dengan Web Audio API (tanpa file eksternal).
   - Efek suara disintesis langsung di browser.
   - Narasi materi memakai Web Speech API (Bahasa Indonesia).
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
      this.musicOn = false;
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
      this._pickVoice();
      if (this.speech) {
        this.speech.addEventListener('voiceschanged', () => this._pickVoice());
      }
    }

    _pickVoice() {
      if (!this.speech) return;
      const voices = this.speech.getVoices ? this.speech.getVoices() : [];
      this.indonesianVoice =
        voices.find((voice) => /^id(-|_)/i.test(voice.lang)) ||
        voices.find((voice) => /indones/i.test(voice.name)) ||
        null;
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
      const prefs = loadPrefs();
      prefs.volume = this.volume;
      savePrefs(prefs);
      if (this.onStateChange) this.onStateChange();
    }

    toggleMusic(force) {
      const shouldPlay = typeof force === 'boolean' ? force : !this.musicOn;
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

      this._tone(melody[step], 0.34, 0.32, 'triangle', this.musicGain, 0.9);
      if (step % 2 === 0) {
        this._tone(bass[Math.floor(step / 2) % bass.length], 0.7, 0.25, 'sine', this.musicGain, 0.7);
      }
      if (step % 8 === 4) {
        this._tone(melody[step] * 2, 0.2, 0.12, 'sine', this.musicGain, 0.35);
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

    speak(text, options) {
      const opts = options || {};
      if (!this.speech) {
        if (opts.onEnd) opts.onEnd();
        return false;
      }
      this.stopSpeech();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
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

    get hasSpeech() {
      return Boolean(this.speech);
    }
  }

  FLA.audio = new AudioManager();
  return AudioManager;
})();
