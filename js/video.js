/* ============================================================
   FUN LEARNING ADVENTURE — Halaman Video "Pengenalan Huruf"
   Memutar assets/videos/membaca.mp4 ("Membaca Itu Seru") dengan:
   - Subtitle & transkrip dari membaca.vtt (ketuk kalimat untuk melompat)
   - Bab video + penanda pada bilah geser
   - Checkpoint: video berhenti, anak menjawab dulu, lalu lanjut
   - Kartu kosakata (vokal & suku kata) yang bersuara
   - Kecepatan putar, mundur 5 detik, layar penuh, pintasan keyboard
   - Setelah selesai: Kuis Kilat untuk mendapat bintang
   ============================================================ */

window.FLA = window.FLA || {};
FLA.pages = FLA.pages || {};

FLA.pages.video = (function () {
  'use strict';

  const ui = FLA.ui;
  const data = FLA.data;
  const SPEEDS = [0.75, 1, 1.25];

  let root = null;
  let videoEl = null;
  let handlers = [];
  let cues = [];
  let cueIndex = -1;
  let chapterIndex = -1;
  let captionsOn = false;
  let speedIndex = 1;
  let maxWatched = 0;
  let activeCp = null;          // checkpoint yang sedang tampil
  let cpState = [];             // { shown, solved, firstTry }
  let cpView = null;
  let quizState = null;
  let quizViews = [];
  let seeking = false;

  function video() {
    return data.videos[0];
  }

  function fmtTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + String(secs).padStart(2, '0');
  }

  function on(element, event, handler, options) {
    if (!element) return;
    element.addEventListener(event, handler, options);
    handlers.push({ element, event, handler, options });
  }

  function duration() {
    return videoEl && Number.isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : 0;
  }

  /* ---------- Kerangka halaman ---------- */
  function render() {
    const item = video();
    const kw = item.keywords;
    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="page-heading">' +
          '<a href="#/beranda" class="back-link">' + ui.icon('arrow-left') + ' Beranda</a>' +
          '<div class="page-heading__row">' +
            '<div>' +
              '<span class="eyebrow">Menu Video</span>' +
              '<h1>' + ui.escapeHtml(item.title) + '</h1>' +
              '<p class="page-lead">Tonton <strong>' + ui.escapeHtml(item.subtitle) + '</strong> bersama Huhu. Video akan berhenti sebentar untuk bertanya, jadi siapkan jawabanmu!</p>' +
            '</div>' +
            '<img class="page-heading__mascot" src="assets/images/mascot-huhu.svg" alt="Huhu si burung hantu">' +
          '</div>' +
        '</div>' +
        '<div class="video-layout">' +
          '<div class="video-main">' +
            '<article class="player-card">' +
              '<div class="player-frame" id="playerFrame">' +
                '<video id="lessonVideo" class="lesson-video" playsinline preload="metadata" poster="' + item.poster + '">' +
                  '<source src="' + item.src + '" type="video/mp4">' +
                '</video>' +
                '<div class="video-caption" id="videoCaption" aria-hidden="true" hidden></div>' +
                '<button class="player-overlay" id="playerOverlay" type="button" aria-label="Putar video">' +
                  '<span class="player-overlay__circle">' + ui.icon('play') + '</span>' +
                  '<span class="player-overlay__label">Tonton Video</span>' +
                '</button>' +
                '<div class="cp-layer" id="cpLayer" hidden></div>' +
                '<div class="video-error" id="videoError" hidden>' +
                  ui.icon('info') +
                  '<p><strong>Video belum bisa dimuat.</strong> Buka halaman ini lewat <code>start.bat</code> (alamat <code>http://localhost:8000</code>) dan pastikan berkas <code>assets/videos/membaca.mp4</code> ada.</p>' +
                '</div>' +
              '</div>' +
              '<div class="player-controls">' +
                '<div class="seek-wrap">' +
                  '<input type="range" id="seekBar" class="seek-bar" min="0" max="1000" value="0" step="1" aria-label="Posisi video">' +
                  '<div class="seek-marks" id="seekMarks" aria-hidden="true"></div>' +
                '</div>' +
                '<div class="player-controls__row">' +
                  '<button class="player-btn player-btn--main" id="playBtn" type="button" aria-label="Putar video">' + ui.icon('play') + '</button>' +
                  '<button class="player-btn" id="backBtn" type="button" aria-label="Mundur 5 detik" title="Mundur 5 detik">' + ui.icon('arrow-left') + '<span class="player-btn__sub">5</span></button>' +
                  '<button class="player-btn" id="restartBtn" type="button" aria-label="Putar ulang dari awal" title="Ulang dari awal">' + ui.icon('rotate') + '</button>' +
                  '<button class="player-btn" id="muteBtn" type="button" aria-pressed="false" aria-label="Matikan suara">' + ui.icon('volume') + '</button>' +
                  '<input type="range" id="videoVolume" class="volume-bar" min="0" max="100" step="1" value="70" aria-label="Volume suara">' +
                  '<span class="player-time" id="playerTime">0:00 / 0:00</span>' +
                  '<button class="player-btn player-btn--text player-btn--end" id="speedBtn" type="button" aria-label="Kecepatan putar" title="Kecepatan putar">1×</button>' +
                  '<button class="player-btn" id="ccBtn" type="button" aria-pressed="false" aria-label="Subtitle" title="Subtitle">' + ui.icon('captions') + '</button>' +
                  '<button class="player-btn" id="fullscreenBtn" type="button" aria-label="Layar penuh" title="Layar penuh">' + ui.icon('fullscreen') + '</button>' +
                '</div>' +
              '</div>' +
              '<div class="player-meta">' +
                '<div class="tag-row">' +
                  '<span class="tag tag--blue">' + ui.escapeHtml(item.subject) + '</span>' +
                                    '<span class="tag">' + ui.icon('clock') + ' ' + ui.escapeHtml(item.duration) + '</span>' +
                '</div>' +
                '<h2>' + ui.escapeHtml(item.subtitle) + '</h2>' +
                '<p>' + ui.escapeHtml(item.description) + '</p>' +
                '<div class="cp-score" id="cpScore" aria-live="polite"></div>' +
                '<p class="player-keys">Pintasan: <kbd>Spasi</kbd> putar/jeda · <kbd>←</kbd> <kbd>→</kbd> geser 5 detik · <kbd>C</kbd> subtitle · <kbd>F</kbd> layar penuh</p>' +
              '</div>' +
            '</article>' +
            '<div id="videoQuiz" class="video-quiz" hidden></div>' +
          '</div>' +
          '<aside class="video-side">' +
            '<div class="side-card side-card--tabs">' +
              '<div class="side-tabs" role="tablist" aria-label="Panel video">' +
                '<button type="button" role="tab" class="side-tab is-active" id="tabChapters" aria-selected="true" aria-controls="panelChapters" data-tab="chapters">Bab</button>' +
                '<button type="button" role="tab" class="side-tab" id="tabNotes" aria-selected="false" aria-controls="panelNotes" data-tab="notes">Catatan</button>' +
              '</div>' +
              '<div class="side-panel" id="panelChapters" role="tabpanel" aria-labelledby="tabChapters">' +
                '<ol class="chapter-list" id="chapterList">' +
                  item.chapters.map((chapter, index) =>
                    '<li><button type="button" class="chapter-item" data-chapter="' + index + '">' +
                      '<span class="chapter-item__num">' + (index + 1) + '</span>' +
                      '<span class="chapter-item__body"><strong>' + ui.escapeHtml(chapter.title) + '</strong>' +
                        '<small>' + ui.escapeHtml(chapter.note) + '</small></span>' +
                      '<span class="chapter-item__time">' + fmtTime(chapter.at) + '</span>' +
                    '</button></li>'
                  ).join('') +
                '</ol>' +
              '</div>' +
              '<div class="side-panel" id="panelNotes" role="tabpanel" aria-labelledby="tabNotes" hidden>' +
                '<p class="side-hint">Ketuk kalimat untuk melompat ke bagian itu.</p>' +
                '<ol class="transcript" id="transcript"><li class="transcript__empty">Memuat catatan…</li></ol>' +
              '</div>' +
            '</div>' +
            '<div class="side-card">' +
              '<h2 class="side-title">Kartu Kata Huhu</h2>' +
              '<p class="side-hint">Ketuk kartu untuk mendengar bunyinya.</p>' +
              '<div class="kw-grid" id="vowelCards">' +
                kw.vowels.map((v, i) =>
                  '<button type="button" class="kw-card" data-vowel="' + i + '" aria-label="Huruf ' + v.letter + ', seperti pada ' + v.word + '">' +
                    '<img src="' + v.img + '" alt="" width="56" height="56" loading="lazy">' +
                    '<span class="kw-card__letter">' + v.letter.toUpperCase() + v.letter + '</span>' +
                    '<span class="kw-card__word">' + v.word + '</span>' +
                  '</button>'
                ).join('') +
              '</div>' +
              '<h3 class="side-subtitle">Gabung suku kata</h3>' +
              '<div class="kw-grid kw-grid--syll" id="syllableCards">' +
                kw.syllables.map((s, i) =>
                  '<button type="button" class="kw-card kw-card--syll" data-syll="' + i + '" aria-label="' + s.parts.join(' ') + ' menjadi ' + s.word + '">' +
                    '<img src="' + s.img + '" alt="" width="56" height="56" loading="lazy">' +
                    '<span class="kw-card__sum"><b>' + s.parts[0] + '</b>+<b>' + s.parts[1] + '</b></span>' +
                    '<span class="kw-card__word">' + s.word + '</span>' +
                  '</button>'
                ).join('') +
              '</div>' +
            '</div>' +
            '<div class="tip-card">' +
              '<img src="assets/images/om-1F4A1.svg" alt="" width="48" height="48">' +
              '<p><strong>Tips Huhu:</strong> jawab pertanyaan yang muncul di tengah video. Kalau belum paham, tekan <em>Ulangi bagian ini</em>. Tonton sampai habis untuk kuis kilat dan bintang!</p>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>';

    videoEl = ui.$('#lessonVideo', root);
    cpState = item.checkpoints.map(() => ({ shown: false, solved: false, firstTry: false }));
    renderSeekMarks();
    renderCpScore();
    bindPlayer();
    bindSide();
    ui.$('#videoVolume', root).value = Math.round(videoEl.volume * 100);
    loadTranscript();
    updateMuteButton();
  }

  /* ---------- Penanda bab & checkpoint di bilah geser ---------- */
  function renderSeekMarks() {
    const wrap = ui.$('#seekMarks', root);
    if (!wrap) return;
    const total = duration() || video().totalSeconds || 314.5;
    const item = video();
    wrap.innerHTML =
      item.chapters.slice(1).map((c) => '<i class="seek-mark seek-mark--chapter" style="left:' + (c.at / total * 100).toFixed(2) + '%"></i>').join('') +
      item.checkpoints.map((c, i) => '<i class="seek-mark seek-mark--cp' + (cpState[i] && cpState[i].solved ? ' is-done' : '') + '" style="left:' + (c.at / total * 100).toFixed(2) + '%" title="' + ui.escapeHtml(c.title) + '"></i>').join('');
  }

  function renderCpScore() {
    const box = ui.$('#cpScore', root);
    if (!box) return;
    const total = cpState.length;
    const solved = cpState.filter((s) => s.solved).length;
    box.innerHTML =
      '<span class="cp-score__label">Bintang pertanyaan video</span>' +
      '<span class="cp-score__stars">' +
        cpState.map((s, i) => '<span class="cp-star' + (s.solved ? (s.firstTry ? ' is-gold' : ' is-on') : '') + '" title="' + ui.escapeHtml(video().checkpoints[i].title) + '">' + ui.icon('star') + '</span>').join('') +
      '</span>' +
      '<span class="cp-score__num">' + solved + '/' + total + '</span>';
  }

  /* ---------- Subtitle & transkrip (WebVTT) ---------- */
  function parseTime(text) {
    const m = text.trim().match(/^(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})$/);
    if (!m) return NaN;
    return (Number(m[1] || 0) * 3600) + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
  }

  function parseVtt(text) {
    const out = [];
    text.replace(/\r/g, '').split(/\n{2,}/).forEach((block) => {
      const lines = block.split('\n').filter(Boolean);
      const idx = lines.findIndex((line) => line.indexOf('-->') !== -1);
      if (idx === -1) return;
      const parts = lines[idx].split('-->');
      const start = parseTime(parts[0]);
      const end = parseTime(parts[1].split(/\s/).filter(Boolean)[0] || '');
      const body = lines.slice(idx + 1).join(' ').replace(/<[^>]+>/g, '').trim();
      if (Number.isFinite(start) && Number.isFinite(end) && body) out.push({ start, end, text: body });
    });
    return out;
  }

  function loadTranscript() {
    const list = ui.$('#transcript', root);
    fetch(video().vtt)
      .then((res) => { if (!res.ok) throw new Error('vtt'); return res.text(); })
      .then((text) => {
        if (!root) return;
        cues = parseVtt(text);
        const box = ui.$('#transcript', root);
        if (!box) return;
        box.innerHTML = cues.map((cue, i) =>
          '<li><button type="button" class="transcript__line" data-cue="' + i + '">' +
            '<time>' + fmtTime(cue.start) + '</time><span>' + ui.escapeHtml(cue.text) + '</span></button></li>'
        ).join('');
        ui.$$('.transcript__line', box).forEach((btn) => {
          on(btn, 'click', () => {
            seekTo(cues[Number(btn.dataset.cue)].start);
            playVideo();
          });
        });
      })
      .catch(() => {
        if (list) list.innerHTML = '<li class="transcript__empty">Catatan hanya tampil jika halaman dibuka lewat <code>start.bat</code>.</li>';
        const cc = ui.$('#ccBtn', root);
        if (cc) cc.disabled = true;
      });
  }

  function updateCaption(time) {
    const box = ui.$('#videoCaption', root);
    if (!box || !cues.length) return;
    let idx = -1;
    for (let i = 0; i < cues.length; i += 1) {
      if (time >= cues[i].start && time < cues[i].end + 0.15) { idx = i; break; }
    }
    if (idx === cueIndex) return;
    cueIndex = idx;
    if (idx === -1) {
      box.hidden = true;
      box.textContent = '';
    } else {
      box.textContent = cues[idx].text;
      box.hidden = !captionsOn;
    }
    ui.$$('.transcript__line', root).forEach((line) => {
      const active = Number(line.dataset.cue) === idx;
      if (active !== line.classList.contains('is-active')) line.classList.toggle('is-active', active);
      if (active) {
        const panel = ui.$('#transcript', root);
        if (panel && !panel.closest('[hidden]')) {
          const top = line.offsetTop - panel.offsetTop;
          if (top < panel.scrollTop || top > panel.scrollTop + panel.clientHeight - 48) {
            panel.scrollTo({ top: Math.max(0, top - 40), behavior: 'smooth' });
          }
        }
      }
    });
  }

  /* ---------- Bab ---------- */
  function currentChapter(time) {
    const chapters = video().chapters;
    let idx = 0;
    chapters.forEach((c, i) => { if (time >= c.at - 0.05) idx = i; });
    return idx;
  }

  function updateChapter(time) {
    const idx = currentChapter(time);
    const chapters = video().chapters;
    ui.$$('.chapter-item', root).forEach((btn, i) => {
      btn.classList.toggle('is-active', i === idx);
      const end = i + 1 < chapters.length ? chapters[i + 1].at : duration() || Infinity;
      btn.classList.toggle('is-done', maxWatched >= end - 1);
    });
    if (idx !== chapterIndex) {
      chapterIndex = idx;
    }
  }

  /* ---------- Kontrol pemutar ---------- */
  function playVideo() {
    FLA.audio.ensure();
    FLA.audio.stopSpeech();
    const promise = videoEl.play();
    if (promise && promise.catch) {
      promise.catch(() => {
        if (videoEl.error) return;
        ui.toast('Video belum bisa diputar. Coba klik sekali lagi.', { tone: 'warning' });
      });
    }
  }

  function seekTo(time) {
    if (!videoEl) return;
    const total = duration();
    const target = ui.clamp(time, 0, total || time);
    videoEl.currentTime = target;
    /* Checkpoint yang ada di depan posisi baru boleh muncul lagi */
    video().checkpoints.forEach((cp, i) => { if (cp.at > target + 0.5) cpState[i].shown = false; });
  }

  function setPlayingUI(playing) {
    const playBtn = ui.$('#playBtn', root);
    const overlay = ui.$('#playerOverlay', root);
    if (playBtn) {
      playBtn.classList.toggle('is-active', playing);
      playBtn.innerHTML = ui.icon(playing ? 'pause' : 'play');
      playBtn.setAttribute('aria-label', playing ? 'Jeda video' : 'Putar video');
    }
    if (overlay) overlay.classList.toggle('is-hidden', playing || Boolean(activeCp));
  }

  function setOverlay(label, iconName) {
    const overlay = ui.$('#playerOverlay', root);
    if (!overlay) return;
    overlay.querySelector('.player-overlay__label').textContent = label;
    overlay.querySelector('.player-overlay__circle').innerHTML = ui.icon(iconName);
  }

  function updateTime() {
    const label = ui.$('#playerTime', root);
    if (label) label.textContent = fmtTime(videoEl.currentTime) + ' / ' + fmtTime(duration() || 0);
  }

  function updateMuteButton() {
    const button = ui.$('#muteBtn', root);
    if (!button) return;
    const muted = Boolean(videoEl && (videoEl.muted || videoEl.volume === 0));
    button.innerHTML = ui.icon(muted ? 'volume-off' : 'volume');
    button.setAttribute('aria-pressed', muted ? 'true' : 'false');
    button.setAttribute('aria-label', muted ? 'Nyalakan suara' : 'Matikan suara');
    button.classList.toggle('is-active', muted);
  }

  function setCaptions(value) {
    captionsOn = value;
    const cc = ui.$('#ccBtn', root);
    if (cc) {
      cc.classList.toggle('is-active', captionsOn);
      cc.setAttribute('aria-pressed', captionsOn ? 'true' : 'false');
    }
    const box = ui.$('#videoCaption', root);
    if (box) box.hidden = !captionsOn || !box.textContent;
  }

  function toggleFullscreen() {
    const frame = ui.$('#playerFrame', root);
    if (!document.fullscreenElement) {
      if (frame && frame.requestFullscreen) {
        frame.requestFullscreen().catch(() => ui.toast('Layar penuh tidak didukung browser ini.', { tone: 'warning' }));
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  function bindPlayer() {
    const overlay = ui.$('#playerOverlay', root);
    const seekBar = ui.$('#seekBar', root);
    const volume = ui.$('#videoVolume', root);

    const toggle = () => {
      if (activeCp) return;
      FLA.audio.sfx('click');
      if (videoEl.paused || videoEl.ended) {
        if (videoEl.ended) seekTo(0);
        playVideo();
      } else {
        videoEl.pause();
      }
    };

    on(overlay, 'click', toggle);
    on(videoEl, 'click', toggle);
    on(ui.$('#playBtn', root), 'click', toggle);
    on(ui.$('#backBtn', root), 'click', () => { FLA.audio.sfx('click'); seekTo(videoEl.currentTime - 5); });
    on(ui.$('#restartBtn', root), 'click', () => {
      FLA.audio.sfx('click');
      cpState.forEach((s) => { s.shown = false; });
      seekTo(0);
      playVideo();
    });
    on(ui.$('#muteBtn', root), 'click', () => {
      FLA.audio.sfx('click');
      videoEl.muted = !videoEl.muted;
      if (!videoEl.muted && videoEl.volume === 0) videoEl.volume = 0.7;
      updateMuteButton();
    });
    on(volume, 'input', () => {
      const value = Number(volume.value) / 100;
      videoEl.volume = value;
      videoEl.muted = value === 0;
      updateMuteButton();
    });
    on(ui.$('#speedBtn', root), 'click', () => {
      FLA.audio.sfx('click');
      speedIndex = (speedIndex + 1) % SPEEDS.length;
      videoEl.playbackRate = SPEEDS[speedIndex];
      ui.$('#speedBtn', root).textContent = String(SPEEDS[speedIndex]).replace('.', ',') + '×';
    });
    on(ui.$('#ccBtn', root), 'click', () => { FLA.audio.sfx('click'); setCaptions(!captionsOn); });
    on(ui.$('#fullscreenBtn', root), 'click', () => { FLA.audio.sfx('click'); toggleFullscreen(); });

    on(seekBar, 'input', () => {
      seeking = true;
      const total = duration();
      if (total) {
        videoEl.currentTime = (Number(seekBar.value) / 1000) * total;
        updateTime();
      }
    });
    on(seekBar, 'change', () => {
      seeking = false;
      seekTo(videoEl.currentTime);
    });

    /* Peristiwa elemen video */
    on(videoEl, 'play', () => { setPlayingUI(true); closeQuiz(); });
    on(videoEl, 'pause', () => {
      setPlayingUI(false);
      if (!videoEl.ended && !activeCp) setOverlay('Lanjutkan Menonton', 'play');
    });
    on(videoEl, 'loadedmetadata', () => { updateTime(); renderSeekMarks(); videoEl.playbackRate = SPEEDS[speedIndex]; });
    on(videoEl, 'timeupdate', onTimeUpdate);
    on(videoEl, 'volumechange', updateMuteButton);
    on(videoEl, 'ended', () => {
      setPlayingUI(false);
      setOverlay('Tonton Lagi', 'rotate');
      maxWatched = duration();
      updateChapter(maxWatched);
      onFinished();
    });
    on(videoEl, 'error', () => {
      const box = ui.$('#videoError', root);
      if (box) box.hidden = false;
      const ov = ui.$('#playerOverlay', root);
      if (ov) ov.hidden = true;
    });

    /* Pintasan keyboard */
    on(document, 'keydown', (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const tag = (event.target && event.target.tagName) || '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && event.target.type !== 'range') return;
      if (activeCp) return;
      const key = event.key;
      if (key === ' ' || key === 'k') {
        if (tag === 'BUTTON') return;
        event.preventDefault();
        toggle();
      } else if (key === 'ArrowLeft' && tag !== 'INPUT') {
        event.preventDefault(); seekTo(videoEl.currentTime - 5);
      } else if (key === 'ArrowRight' && tag !== 'INPUT') {
        event.preventDefault(); seekTo(videoEl.currentTime + 5);
      } else if (key === 'c' || key === 'C') {
        setCaptions(!captionsOn);
      } else if (key === 'f' || key === 'F') {
        toggleFullscreen();
      } else if (key === 'm' || key === 'M') {
        videoEl.muted = !videoEl.muted;
      }
    });
  }

  function onTimeUpdate() {
    const time = videoEl.currentTime;
    const total = duration();
    if (!seeking && total) ui.$('#seekBar', root).value = Math.round((time / total) * 1000);
    if (!videoEl.seeking && time > maxWatched && time - maxWatched < 2.5) maxWatched = time;
    updateTime();
    updateCaption(time);
    updateChapter(time);
    if (!videoEl.paused && !activeCp) checkCheckpoint(time);
  }

  /* ---------- Panel samping ---------- */
  function bindSide() {
    ui.$$('.chapter-item', root).forEach((btn) => {
      on(btn, 'click', () => {
        FLA.audio.sfx('click');
        seekTo(video().chapters[Number(btn.dataset.chapter)].at);
        playVideo();
      });
    });
    ui.$$('.side-tab', root).forEach((tab) => {
      on(tab, 'click', () => {
        FLA.audio.sfx('click');
        ui.$$('.side-tab', root).forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        ui.$('#panelChapters', root).hidden = tab.dataset.tab !== 'chapters';
        ui.$('#panelNotes', root).hidden = tab.dataset.tab !== 'notes';
        cueIndex = -2; /* paksa pembaruan agar baris aktif terlihat */
        updateCaption(videoEl.currentTime);
      });
    });
    const kw = video().keywords;
    ui.$$('[data-vowel]', root).forEach((btn) => {
      on(btn, 'click', () => {
        const v = kw.vowels[Number(btn.dataset.vowel)];
        FLA.audio.say(v.letter, v.letter + ', seperti pada ' + v.word);
        btn.classList.remove('is-pop'); void btn.offsetWidth; btn.classList.add('is-pop');
      });
    });
    ui.$$('[data-syll]', root).forEach((btn) => {
      on(btn, 'click', () => {
        const s = kw.syllables[Number(btn.dataset.syll)];
        FLA.audio.say(s.word, s.parts[0] + '... ' + s.parts[1] + '... ' + s.word);
        btn.classList.remove('is-pop'); void btn.offsetWidth; btn.classList.add('is-pop');
      });
    });
  }

  /* ---------- Checkpoint di tengah video ---------- */
  function checkCheckpoint(time) {
    const cps = video().checkpoints;
    for (let i = 0; i < cps.length; i += 1) {
      const cp = cps[i];
      if (!cpState[i].shown && time >= cp.at && time - cp.at < 1.5) {
        cpState[i].shown = true;
        openCheckpoint(i);
        return;
      }
    }
  }

  function closeCheckpointView() {
    if (cpView && cpView.destroy) cpView.destroy();
    cpView = null;
  }

  function openCheckpoint(index) {
    const cp = video().checkpoints[index];
    const layer = ui.$('#cpLayer', root);
    if (!layer) return;
    videoEl.pause();
    activeCp = index;
    FLA.audio.sfx('star');
    const state = cpState[index];
    layer.hidden = false;
    layer.parentElement.classList.add('has-cp');
    layer.innerHTML =
      '<div class="cp-card" role="dialog" aria-modal="true" aria-label="Pertanyaan dari Huhu">' +
        '<div class="cp-card__head">' +
          '<img src="assets/images/mascot-huhu.svg" alt="" width="54" height="59">' +
          '<div><span class="cp-card__kicker">Pertanyaan ' + (index + 1) + ' dari ' + video().checkpoints.length + '</span>' +
          '<strong>' + ui.escapeHtml(cp.title) + '</strong></div>' +
        '</div>' +
        '<div class="cp-card__body" id="cpSlot"></div>' +
        '<p class="cp-card__hint" id="cpHint" hidden>' + ui.icon('info') + ' ' + ui.escapeHtml(cp.hint) + '</p>' +
        '<div class="cp-card__actions">' +
          '<button type="button" class="btn btn--ghost btn--sm" id="cpReplay">' + ui.icon('rotate') + ' Ulangi bagian ini</button>' +
          '<button type="button" class="btn btn--yellow btn--sm" id="cpContinue" disabled>' + ui.icon('play') + ' Lanjutkan Video</button>' +
        '</div>' +
      '</div>';

    const question = FLA.quiz.make('fixed', { question: { q: cp.q, options: cp.options, answer: cp.answer, explanation: cp.explanation } });
    let wrong = 0;
    const cont = ui.$('#cpContinue', layer);
    cpView = FLA.quiz.render(ui.$('#cpSlot', layer), question, {
      retry: true,
      autoSpeak: false,
      speakFeedback: false,
      onAnswer: (result) => {
        if (result.correct) {
          if (!state.solved) {
            state.solved = true;
            state.firstTry = wrong === 0;
            renderCpScore();
            renderSeekMarks();
          }
          cont.disabled = false;
          cont.focus();
        } else {
          wrong += 1;
          if (wrong >= 1) ui.$('#cpHint', layer).hidden = false;
        }
      }
    });

    on(ui.$('#cpReplay', layer), 'click', () => {
      closeCheckpoint();
      seekTo(cp.from);
      playVideo();
    });
    on(cont, 'click', () => {
      closeCheckpoint();
      playVideo();
    });
  }

  function closeCheckpoint() {
    const layer = ui.$('#cpLayer', root);
    closeCheckpointView();
    activeCp = null;
    if (layer) {
      layer.parentElement.classList.remove('has-cp');
      layer.hidden = true;
      layer.innerHTML = '';
    }
  }

  /* ---------- Kuis setelah video ---------- */
  function closeQuiz() {
    const panel = ui.$('#videoQuiz', root);
    quizViews.forEach((view) => view && view.destroy && view.destroy());
    quizViews = [];
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }
    quizState = null;
  }

  function onFinished() {
    openQuiz();
  }

  function openQuiz() {
    const item = video();
    const panel = ui.$('#videoQuiz', root);
    if (!panel) return;
    const record = FLA.progress.getVideoRecord(item.id);
    const questions = FLA.quiz.makeSet(item.quizTypes);
    const cpSolved = cpState.filter((s) => s.solved).length;
    quizState = { answered: 0, correct: 0, total: questions.length, video: item };

    panel.hidden = false;
    panel.innerHTML =
      '<div class="quiz-card">' +
        '<div class="quiz-card__head">' +
          '<span class="quiz-card__icon">' + ui.icon('question') + '</span>' +
          '<div><h2>Kuis Kilat</h2><p>Jawab pertanyaan berikut setelah menonton video.' +
            (cpSolved ? ' Di tengah video kamu sudah menjawab benar ' + cpSolved + ' dari ' + cpState.length + ' pertanyaan.' : '') + '</p></div>' +
        '</div>' +
        (record && record.completed
          ? '<div class="notice notice--success">' + ui.icon('check') + ' Kamu sudah menyelesaikan video ini. Kuis bisa diulang kapan saja.</div>'
          : '') +
        '<div class="video-quiz__list">' +
          questions.map((_, index) =>
            '<div class="quiz-block"><span class="quiz-block__number">Soal ' + (index + 1) + '</span><div data-quiz-slot="' + index + '"></div></div>'
          ).join('') +
        '</div>' +
        '<div id="quizFooter" class="quiz-footer"></div>' +
      '</div>';

    questions.forEach((question, index) => {
      const slot = ui.$('[data-quiz-slot="' + index + '"]', panel);
      quizViews.push(FLA.quiz.render(slot, question, {
        autoSpeak: false,
        onAnswer: (result) => {
          if (!quizState) return;
          FLA.progress.recordItem(question.cat, question.key, result.correct);
          quizState.answered += 1;
          if (result.correct) quizState.correct += 1;
          if (quizState.answered === quizState.total) showQuizFooter();
        }
      }));
    });

    setTimeout(() => {
      if (panel && !panel.hidden) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 160);
  }

  function showQuizFooter() {
    const state = quizState;
    if (!state) return;
    const footer = ui.$('#quizFooter', root);
    if (!footer) return;
    const record = FLA.progress.getVideoRecord(state.video.id);
    const allCorrect = state.correct === state.total;
    footer.innerHTML =
      '<div class="quiz-finish">' +
        '<img src="assets/images/mascot-huhu.svg" alt="" width="72" height="72">' +
        '<div>' +
          '<strong>Kuis selesai! Kamu menjawab benar ' + state.correct + ' dari ' + state.total + '.</strong>' +
          '<p>' + (allCorrect ? 'Sempurna, semua jawaban benar!' : 'Bagus! Tonton lagi jika ingin lebih paham.') + '</p>' +
        '</div>' +
        '<div class="quiz-finish__actions">' +
          (record && record.completed
            ? '<span class="tag tag--done">' + ui.icon('check') + ' Sudah selesai</span>' +
              '<a class="btn btn--blue" href="#/materi">' + ui.icon('book') + ' Ke Materi</a>'
            : '<button type="button" class="btn btn--yellow" id="claimVideoReward">' + ui.icon('star') + ' Ambil Bintang</button>') +
        '</div>' +
      '</div>';

    const claim = ui.$('#claimVideoReward', root);
    if (claim) {
      claim.addEventListener('click', () => {
        const result = FLA.progress.completeVideo(state.video.id, state.video.title, state.correct, state.total);
        if (!result.already) {
          FLA.audio.sfx('win');
          ui.confetti(80);
          FLA.audio.speak('Hebat! Kamu mendapat satu bintang!');
          ui.toast('Hebat! +10 poin dan +1 bintang.', { tone: 'success', icon: 'star', title: 'Video selesai!' });
        }
        showVideoComplete(state.video, state.correct, state.total);
      });
    }
  }

  function showVideoComplete(item, correct, total) {
    const panel = ui.$('#videoQuiz', root);
    if (!panel) return;
    panel.hidden = false;
    panel.innerHTML =
      '<div class="completion-card">' +
        '<img src="assets/images/mascot-huhu.svg" alt="" width="110" height="110" class="completion-card__mascot">' +
        '<span class="completion-card__kicker">Video selesai</span>' +
        '<h2>Kerja bagus!</h2>' +
        '<p>Kamu menonton <strong>' + ui.escapeHtml(item.subtitle) + '</strong> dan menjawab benar ' + correct + ' dari ' + total + ' pertanyaan kuis.</p>' +
        '<div class="completion-card__stars">' + ui.starRow(1, 3) + '</div>' +
        '<div class="completion-card__actions">' +
          '<a class="btn btn--yellow" href="#/materi">' + ui.icon('book') + ' Lanjut ke Materi</a>' +
          '<a class="btn btn--ghost" href="#/beranda">' + ui.icon('home') + ' Beranda</a>' +
        '</div>' +
      '</div>';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function enter(container) {
    root = container;
    handlers = [];
    cues = [];
    cueIndex = -1;
    chapterIndex = -1;
    captionsOn = false;
    speedIndex = 1;
    maxWatched = 0;
    activeCp = null;
    cpView = null;
    quizState = null;
    quizViews = [];
    seeking = false;
    render();
  }

  function leave() {
    if (videoEl) videoEl.pause();
    closeCheckpointView();
    FLA.audio.stopSpeech();
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    handlers.forEach(({ element, event, handler, options }) => element.removeEventListener(event, handler, options));
    handlers = [];
    quizViews.forEach((view) => view && view.destroy && view.destroy());
    quizViews = [];
    root = null;
    videoEl = null;
    quizState = null;
    activeCp = null;
  }

  return { enter, leave };
})();
