/* ============================================================
   FUN LEARNING ADVENTURE — Halaman Video
   Daftar video, pemutar kustom, subtitle, dan kuis setelah video.
   ============================================================ */

window.FLA = window.FLA || {};
FLA.pages = FLA.pages || {};

FLA.pages.video = (function () {
  'use strict';

  const ui = FLA.ui;
  const data = FLA.data;

  let root = null;
  let videoEl = null;
  let currentId = null;
  let subtitlesOn = true;
  let quizState = null;
  let handlers = [];

  function fmtTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + String(secs).padStart(2, '0');
  }

  function getVideo(id) {
    return data.videos.find((item) => item.id === id) || data.videos[0];
  }

  function on(element, event, handler) {
    if (!element) return;
    element.addEventListener(event, handler);
    handlers.push({ element, event, handler });
  }

  function render() {
    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="page-heading">' +
          '<a href="#/beranda" class="back-link">' + ui.icon('arrow-left') + ' Beranda</a>' +
          '<div class="page-heading__row">' +
            '<div>' +
              '<span class="eyebrow">Menu Video</span>' +
              '<h1>Nonton &amp; Belajar</h1>' +
              '<p class="page-lead">Tonton video seru, lalu jawab kuis kecil untuk mengumpulkan bintang.</p>' +
            '</div>' +
            '<img class="page-heading__mascot" src="assets/images/mascot-huhu.svg" alt="Huhu si burung hantu">' +
          '</div>' +
        '</div>' +
        '<div class="video-layout">' +
          '<div class="video-main">' +
            '<article class="player-card">' +
              '<div class="player-frame" id="playerFrame">' +
                '<video id="lessonVideo" class="lesson-video" playsinline preload="metadata"></video>' +
                '<button class="player-overlay" id="playerOverlay" type="button" aria-label="Putar video">' +
                  '<span class="player-overlay__circle">' + ui.icon('play') + '</span>' +
                  '<span class="player-overlay__label">Tonton Video</span>' +
                '</button>' +
                '<span class="player-subject" id="playerSubject"></span>' +
              '</div>' +
              '<div class="player-controls">' +
                '<input type="range" id="seekBar" class="seek-bar" min="0" max="100" value="0" step="0.1" aria-label="Posisi video">' +
                '<div class="player-controls__row">' +
                  '<button class="player-btn player-btn--main" id="playBtn" type="button" aria-label="Putar atau jeda">' + ui.icon('play') + '</button>' +
                  '<button class="player-btn" id="restartBtn" type="button" aria-label="Ulangi video">' + ui.icon('rotate') + '</button>' +
                  '<button class="player-btn" id="subtitleBtn" type="button" aria-pressed="true" aria-label="Tampilkan subtitle">' + ui.icon('captions') + '</button>' +
                  '<span class="player-time"><span id="currentTime">0:00</span> / <span id="durationTime">0:00</span></span>' +
                  '<button class="player-btn player-btn--end" id="fullscreenBtn" type="button" aria-label="Layar penuh">' + ui.icon('fullscreen') + '</button>' +
                '</div>' +
              '</div>' +
              '<div class="player-meta">' +
                '<div class="tag-row" id="playerTags"></div>' +
                '<h2 id="videoTitle">Memuat video...</h2>' +
                '<p id="videoDesc"></p>' +
              '</div>' +
            '</article>' +
            '<div id="videoQuiz" class="video-quiz" hidden></div>' +
          '</div>' +
          '<aside class="video-side">' +
            '<div class="side-card">' +
              '<h2 class="side-title">Daftar Video</h2>' +
              '<div id="videoList" class="video-list"></div>' +
            '</div>' +
            '<div class="tip-card">' +
              '<img src="assets/images/om-1F4A1.svg" alt="" width="48" height="48">' +
              '<p><strong>Tips Huhu:</strong> tonton video sampai habis, lalu jawab kuisnya untuk mendapat bintang!</p>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>';

    videoEl = ui.$('#lessonVideo', root);
    bindPlayer();
    renderList();
    loadVideo(getVideo(currentId || data.videos[0].id).id);
  }

  function renderList() {
    const list = ui.$('#videoList', root);
    if (!list) return;
    list.innerHTML = data.videos.map((item) => {
      const done = FLA.progress.getVideoRecord(item.id);
      return '<button type="button" class="video-item ' + (item.id === currentId ? 'is-active' : '') + '" data-video-id="' + item.id + '">' +
        '<span class="video-item__thumb">' +
          '<img src="' + item.poster + '" alt="" loading="lazy">' +
          '<span class="video-item__play">' + ui.icon('play') + '</span>' +
          (done && done.completed ? '<span class="video-item__done">' + ui.icon('check') + '</span>' : '') +
        '</span>' +
        '<span class="video-item__body">' +
          '<strong>' + ui.escapeHtml(item.title) + '</strong>' +
          '<span class="video-item__meta">' + ui.escapeHtml(item.subject) + ' · ' + ui.escapeHtml(item.duration) + '</span>' +
        '</span>' +
      '</button>';
    }).join('');

    list.querySelectorAll('[data-video-id]').forEach((button) => {
      button.addEventListener('click', () => {
        FLA.audio.sfx('click');
        loadVideo(button.dataset.videoId);
      });
    });
  }

  function loadVideo(id) {
    const item = getVideo(id);
    currentId = item.id;
    subtitlesOn = true;
    closeQuiz();

    if (videoEl) {
      videoEl.pause();
      videoEl.innerHTML =
        '<source src="' + item.src + '" type="video/mp4">' +
        '<track kind="subtitles" src="' + item.subtitle + '" srclang="id" label="Bahasa Indonesia" default>';
      videoEl.poster = item.poster;
      videoEl.load();
    }

    ui.$('#videoTitle', root).textContent = item.title;
    ui.$('#videoDesc', root).textContent = item.description;
    ui.$('#playerSubject', root).textContent = item.subject;
    ui.$('#playerTags', root).innerHTML =
      '<span class="tag tag--' + item.color + '">' + ui.escapeHtml(item.subject) + '</span>' +
      '<span class="tag">' + ui.escapeHtml(item.grade) + '</span>' +
      '<span class="tag">' + ui.icon('clock') + ' ' + ui.escapeHtml(item.duration) + '</span>';

    const overlay = ui.$('#playerOverlay', root);
    overlay.classList.remove('is-hidden');
    overlay.querySelector('.player-overlay__label').textContent = 'Tonton Video';
    overlay.querySelector('.player-overlay__circle').innerHTML = ui.icon('play');
    ui.$('#playBtn', root).innerHTML = ui.icon('play');
    ui.$('#seekBar', root).value = 0;
    ui.$('#currentTime', root).textContent = '0:00';
    ui.$('#durationTime', root).textContent = '0:00';
    updateSubtitleButton();
    renderList();
  }

  function bindPlayer() {
    const overlay = ui.$('#playerOverlay', root);
    const playBtn = ui.$('#playBtn', root);
    const restartBtn = ui.$('#restartBtn', root);
    const subtitleBtn = ui.$('#subtitleBtn', root);
    const fullscreenBtn = ui.$('#fullscreenBtn', root);
    const seekBar = ui.$('#seekBar', root);
    const playerFrame = ui.$('#playerFrame', root);

    const startPlayback = () => {
      FLA.audio.sfx('click');
      FLA.audio.ensure();
      const promise = videoEl.play();
      if (promise && promise.catch) {
        promise.catch(() => {
          ui.toast('Video belum bisa diputar. Coba klik sekali lagi.', { tone: 'warning' });
        });
      }
    };

    on(overlay, 'click', startPlayback);
    on(playBtn, 'click', () => {
      if (videoEl.paused) startPlayback();
      else {
        videoEl.pause();
        FLA.audio.sfx('click');
      }
    });

    on(restartBtn, 'click', () => {
      videoEl.currentTime = 0;
      FLA.audio.sfx('click');
      startPlayback();
    });

    on(subtitleBtn, 'click', () => {
      subtitlesOn = !subtitlesOn;
      applySubtitleMode();
      updateSubtitleButton();
      FLA.audio.sfx('click');
      ui.toast(subtitlesOn ? 'Subtitle ditampilkan.' : 'Subtitle disembunyikan.', {
        tone: 'info', icon: 'captions', duration: 1800
      });
    });

    on(fullscreenBtn, 'click', () => {
      FLA.audio.sfx('click');
      if (!document.fullscreenElement) {
        if (playerFrame.requestFullscreen) {
          playerFrame.requestFullscreen().catch(() => {
            ui.toast('Layar penuh tidak didukung browser ini.', { tone: 'warning' });
          });
        }
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    });

    on(seekBar, 'input', () => {
      if (Number.isFinite(videoEl.duration)) {
        videoEl.currentTime = (Number(seekBar.value) / 100) * videoEl.duration;
      }
    });

    on(videoEl, 'play', () => {
      overlay.classList.add('is-hidden');
      playBtn.innerHTML = ui.icon('pause');
      playBtn.setAttribute('aria-label', 'Jeda video');
    });

    on(videoEl, 'pause', () => {
      playBtn.innerHTML = ui.icon('play');
      playBtn.setAttribute('aria-label', 'Putar video');
      if (!videoEl.ended) {
        overlay.classList.remove('is-hidden');
        overlay.querySelector('.player-overlay__label').textContent = 'Lanjutkan Menonton';
        overlay.querySelector('.player-overlay__circle').innerHTML = ui.icon('play');
      }
    });

    on(videoEl, 'loadedmetadata', () => {
      ui.$('#durationTime', root).textContent = fmtTime(videoEl.duration);
      applySubtitleMode();
    });

    on(videoEl, 'timeupdate', () => {
      if (Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
        ui.$('#seekBar', root).value = (videoEl.currentTime / videoEl.duration) * 100;
      }
      ui.$('#currentTime', root).textContent = fmtTime(videoEl.currentTime);
    });

    on(videoEl, 'ended', () => {
      ui.$('#playBtn', root).innerHTML = ui.icon('rotate');
      overlay.classList.remove('is-hidden');
      overlay.querySelector('.player-overlay__label').textContent = 'Tonton Lagi';
      overlay.querySelector('.player-overlay__circle').innerHTML = ui.icon('rotate');
      openQuiz();
    });

    on(videoEl, 'error', () => {
      ui.toast('Video tidak ditemukan. Pastikan folder assets/videos sudah lengkap.', {
        tone: 'warning', icon: 'info', duration: 5000
      });
    });
  }

  function applySubtitleMode() {
    if (!videoEl || !videoEl.textTracks || !videoEl.textTracks.length) return;
    for (let i = 0; i < videoEl.textTracks.length; i += 1) {
      videoEl.textTracks[i].mode = subtitlesOn ? 'showing' : 'hidden';
    }
  }

  function updateSubtitleButton() {
    const button = ui.$('#subtitleBtn', root);
    if (!button) return;
    button.classList.toggle('is-active', subtitlesOn);
    button.setAttribute('aria-pressed', subtitlesOn ? 'true' : 'false');
  }

  /* ---------- Kuis video ---------- */

  function closeQuiz() {
    const panel = ui.$('#videoQuiz', root);
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }
    quizState = null;
  }

  function openQuiz() {
    const item = getVideo(currentId);
    const panel = ui.$('#videoQuiz', root);
    if (!panel) return;
    const record = FLA.progress.getVideoRecord(item.id);
    quizState = { answered: {}, correct: 0, total: item.quiz.length, video: item, record };

    panel.hidden = false;
    panel.innerHTML =
      '<div class="quiz-card">' +
        '<div class="quiz-card__head">' +
          '<span class="quiz-card__icon">' + ui.icon('question') + '</span>' +
          '<div><h2>Kuis Kilat</h2><p>Jawab pertanyaan berikut setelah menonton video.</p></div>' +
        '</div>' +
        (record && record.completed
          ? '<div class="notice notice--success">' + ui.icon('check') + ' Kamu sudah menyelesaikan video ini. Kuis bisa diulang kapan saja.</div>'
          : '') +
        '<div class="video-quiz__list">' +
          item.quiz.map((question, qIndex) =>
            '<div class="quiz-block" data-question="' + qIndex + '">' +
              '<p class="quiz-block__question"><span>' + (qIndex + 1) + '</span>' + ui.escapeHtml(question.q) + '</p>' +
              '<div class="quiz-options">' +
                question.options.map((option, oIndex) =>
                  '<button type="button" class="quiz-option" data-option="' + oIndex + '">' +
                    '<span class="quiz-option__letter">' + String.fromCharCode(65 + oIndex) + '</span>' +
                    '<span>' + ui.escapeHtml(option) + '</span>' +
                  '</button>'
                ).join('') +
              '</div>' +
              '<p class="quiz-explain" hidden></p>' +
            '</div>'
          ).join('') +
        '</div>' +
        '<div id="quizFooter" class="quiz-footer"></div>' +
      '</div>';

    panel.querySelectorAll('.quiz-block').forEach((block) => {
      block.addEventListener('click', (event) => {
        const option = event.target.closest('.quiz-option');
        if (!option) return;
        const qIndex = Number(block.dataset.question);
        handleQuizAnswer(block, qIndex, option);
      });
    });

    setTimeout(() => {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function handleQuizAnswer(block, qIndex, option) {
    const state = quizState;
    if (!state || state.answered[qIndex]) return;
    const question = state.video.quiz[qIndex];
    const answer = Number(option.dataset.option);
    const isCorrect = answer === question.answer;
    state.answered[qIndex] = true;
    if (isCorrect) state.correct += 1;

    block.querySelectorAll('.quiz-option').forEach((btn, index) => {
      btn.disabled = true;
      if (index === question.answer) btn.classList.add('is-correct');
    });
    if (!isCorrect) option.classList.add('is-wrong');

    const explain = block.querySelector('.quiz-explain');
    explain.hidden = false;
    explain.className = 'quiz-explain ' + (isCorrect ? 'is-correct' : 'is-wrong');
    explain.innerHTML = (isCorrect ? ui.icon('check') + ' <strong>Benar!</strong> ' : ui.icon('close') + ' <strong>Belum tepat.</strong> ') +
      ui.escapeHtml(question.explanation);

    FLA.audio.sfx(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) ui.burstFrom(option);

    if (Object.keys(state.answered).length === state.total) {
      showQuizFooter();
    }
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
              '<a class="btn btn--blue" href="#/beranda">' + ui.icon('home') + ' Beranda</a>'
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
          ui.toast('Hebat! +10 poin dan +1 bintang.', { tone: 'success', icon: 'star', title: 'Video selesai!' });
        }
        renderList();
        showVideoComplete(state.video, state.correct, state.total);
      });
    }
  }

  function showVideoComplete(video, correct, total) {
    const panel = ui.$('#videoQuiz', root);
    if (!panel) return;
    const index = data.videos.findIndex((item) => item.id === video.id);
    const next = data.videos[index + 1];
    panel.hidden = false;
    panel.innerHTML =
      '<div class="completion-card">' +
        '<img src="assets/images/mascot-huhu.svg" alt="" width="110" height="110" class="completion-card__mascot">' +
        '<span class="completion-card__kicker">Video selesai</span>' +
        '<h2>Kerja bagus!</h2>' +
        '<p>Kamu menonton <strong>' + ui.escapeHtml(video.title) + '</strong> dan menjawab benar ' + correct + ' dari ' + total + ' pertanyaan.</p>' +
        '<div class="completion-card__stars">' + ui.starRow(1, 3) + '</div>' +
        '<div class="completion-card__actions">' +
          (next
            ? '<button type="button" class="btn btn--yellow" id="nextVideoBtn">' + ui.icon('arrow-right') + ' Video Berikutnya</button>'
            : '<a class="btn btn--yellow" href="#/materi">' + ui.icon('book') + ' Lanjut ke Materi</a>') +
          '<a class="btn btn--ghost" href="#/beranda">' + ui.icon('home') + ' Beranda</a>' +
        '</div>' +
      '</div>';
    const nextBtn = ui.$('#nextVideoBtn', root);
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        FLA.audio.sfx('click');
        loadVideo(next.id);
        const player = ui.$('.player-card', root);
        if (player) player.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function enter(container) {
    root = container;
    currentId = null;
    handlers = [];
    if (data.videos.length) currentId = data.videos[0].id;
    render();
  }

  function leave() {
    if (videoEl) videoEl.pause();
    FLA.audio.stopSpeech();
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    handlers.forEach(({ element, event, handler }) => element.removeEventListener(event, handler));
    handlers = [];
    root = null;
    videoEl = null;
    quizState = null;
  }

  return { enter, leave };
})();
