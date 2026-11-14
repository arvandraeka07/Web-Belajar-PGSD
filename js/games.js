/* ============================================================
   FUN LEARNING ADVENTURE — Game Edukasi
   Lima permainan yang benar-benar dapat dimainkan:
   1. Tebak Gambar
   2. Cocokkan Gambar (drag & drop)
   3. Puzzle Edukasi
   4. Kuis Cepat
   5. Benar atau Salah
   ============================================================ */

window.FLA = window.FLA || {};
FLA.pages = FLA.pages || {};

FLA.pages.game = (function () {
  'use strict';

  const ui = FLA.ui;
  const data = FLA.data;

  let root = null;
  let activeGame = null;
  let runner = null;

  function itemById(id) {
    return data.items.find((item) => item.id === id);
  }

  /* ============================================================
     DAFTAR GAME
     ============================================================ */
  const gameList = [
    {
      id: 'guess',
      title: 'Tebak Gambar',
      skill: 'Observasi',
      color: 'blue',
      icon: 'assets/images/om-1F4F7.svg',
      desc: 'Lihat gambarnya, lalu pilih nama yang tepat.',
      intro: [
        'Setiap soal menampilkan satu gambar.',
        'Pilih satu dari empat nama yang tersedia.',
        'Jawaban benar bernilai 10 poin.',
        'Ada 8 soal dalam satu permainan.'
      ],
      create: createGuessGame
    },
    {
      id: 'match',
      title: 'Cocokkan Gambar',
      skill: 'Ketelitian',
      color: 'green',
      icon: 'assets/images/om-1F3AF.svg',
      desc: 'Seret gambar ke kotak nama yang cocok.',
      intro: [
        'Seret gambar ke kotak nama yang sesuai.',
        'Di layar sentuh: ketuk gambar, lalu ketuk kotaknya.',
        'Setiap pasangan benar bernilai 10 poin.',
        'Selesaikan kelima pasangan untuk menang.'
      ],
      create: createMatchGame
    },
    {
      id: 'puzzle',
      title: 'Puzzle Edukasi',
      skill: 'Logika',
      color: 'orange',
      icon: 'assets/images/om-1F9E9.svg',
      desc: 'Susun kembali potongan gambar menjadi utuh.',
      intro: [
        'Gambar dipecah menjadi 9 potongan.',
        'Ketuk dua potongan untuk menukar posisinya.',
        'Gunakan tombol Pratinjau jika butuh bantuan.',
        'Semakin sedikit langkah, semakin tinggi bintangmu.'
      ],
      create: createPuzzleGame
    },
    {
      id: 'quick',
      title: 'Kuis Cepat',
      skill: 'Kecepatan',
      color: 'yellow',
      icon: 'assets/images/om-1F525.svg',
      desc: 'Jawab 10 soal sebelum waktu habis.',
      intro: [
        'Setiap soal punya waktu 15 detik.',
        'Jawaban benar mendapat 10 poin.',
        'Jawab cepat untuk mendapat bonus waktu.',
        'Waktu habis berarti soalnya dianggap salah.'
      ],
      create: createQuickQuizGame
    },
    {
      id: 'truefalse',
      title: 'Benar atau Salah',
      skill: 'Pengetahuan',
      color: 'purple',
      icon: 'assets/images/om-2705.svg',
      desc: 'Tentukan apakah pernyataan itu benar atau salah.',
      intro: [
        'Baca pernyataan dengan teliti.',
        'Pilih Benar atau Salah.',
        'Jawaban benar bernilai 10 poin.',
        'Ada 8 pernyataan dalam satu permainan.'
      ],
      create: createTrueFalseGame
    }
  ];

  function getGame(id) {
    return gameList.find((game) => game.id === id);
  }

  /* ============================================================
     LOBI GAME
     ============================================================ */
  function renderLobby() {
    destroyActive();
    activeGame = null;
    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="page-heading">' +
          '<a href="#/beranda" class="back-link">' + ui.icon('arrow-left') + ' Beranda</a>' +
          '<div class="page-heading__row">' +
            '<div>' +
              '<span class="eyebrow">Menu Game</span>' +
              '<h1>Main Sambil Belajar</h1>' +
              '<p class="page-lead">Pilih permainan favoritmu. Kumpulkan skor tinggi dan dapatkan bintang!</p>' +
            '</div>' +
            '<img class="page-heading__mascot" src="assets/images/mascot-huhu.svg" alt="Huhu si burung hantu">' +
          '</div>' +
        '</div>' +
        '<div class="game-grid">' +
          gameList.map((game) => {
            const record = FLA.progress.getGameRecord(game.id);
            const played = record.plays > 0;
            return '<article class="game-card game-card--' + game.color + '">' +
              '<div class="game-card__art">' +
                '<span class="game-card__blob"></span>' +
                '<img src="' + game.icon + '" alt="" width="92" height="92" loading="lazy">' +
                (played ? '<span class="game-card__best">Rekor ' + record.bestScore + '</span>' : '') +
              '</div>' +
              '<div class="game-card__body">' +
                '<span class="eyebrow">' + ui.escapeHtml(game.skill) + '</span>' +
                '<h2>' + ui.escapeHtml(game.title) + '</h2>' +
                '<p>' + ui.escapeHtml(game.desc) + '</p>' +
                '<div class="game-card__meta">' +
                  (played
                    ? ui.icon('gamepad') + ' Dimainkan ' + record.plays + ' kali'
                    : ui.icon('sparkles') + ' Belum dimainkan') +
                '</div>' +
                '<button type="button" class="btn btn--' + (game.color === 'purple' ? 'purple' : game.color) + ' btn--block" data-play="' + game.id + '">' +
                  ui.icon('play') + ' Mainkan' +
                '</button>' +
              '</div>' +
            '</article>';
          }).join('') +
        '</div>' +
        '<div class="game-footnote">' +
          '<img src="assets/images/om-1F3AE.svg" alt="" width="44" height="44">' +
          '<p><strong>Semua permainan bisa dimainkan berulang kali.</strong> Skor terbaikmu akan tersimpan di perangkat ini.</p>' +
        '</div>' +
      '</div>';

    root.querySelectorAll('[data-play]').forEach((button) => {
      button.addEventListener('click', () => {
        FLA.audio.sfx('click');
        launchGame(button.dataset.play);
      });
    });
  }

  /* ============================================================
     PEMBUNGKUS GAME
     ============================================================ */
  function launchGame(id) {
    const game = getGame(id);
    if (!game) return;
    destroyActive();
    activeGame = game;
    const record = FLA.progress.getGameRecord(game.id);

    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="game-stage">' +
          '<div class="game-stage__top">' +
            '<button type="button" class="back-link" id="exitGame">' + ui.icon('arrow-left') + ' Semua Game</button>' +
            '<div class="game-stage__title">' +
              '<img src="' + game.icon + '" alt="" width="38" height="38">' +
              '<div><span>' + ui.escapeHtml(game.skill) + '</span><strong>' + ui.escapeHtml(game.title) + '</strong></div>' +
            '</div>' +
            '<div class="game-hud">' +
              '<span class="hud-chip hud-chip--score" title="Skor">' + ui.icon('star') + '<strong id="hudScore">0</strong></span>' +
              '<span class="hud-chip" title="Progres">' + ui.icon('target') + '<strong id="hudProgress">0/0</strong></span>' +
              '<span class="hud-chip hud-chip--timer" id="hudTimerChip" hidden>' + ui.icon('clock') +
                '<strong id="hudTimer">15</strong>' +
                '<span class="hud-timer-track"><span id="hudTimerBar"></span></span>' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<div class="game-body" id="gameBody"></div>' +
        '</div>' +
      '</div>';

    ui.$('#exitGame', root).addEventListener('click', async () => {
      if (runner && runner.instance && !runner.finished) {
        const leave = await ui.confirmDialog({
          title: 'Keluar dari permainan?',
          message: 'Skor permainan ini belum disimpan. Yakin ingin keluar?',
          confirmLabel: 'Ya, keluar',
          cancelLabel: 'Lanjut bermain',
          danger: true
        });
        if (!leave) return;
      }
      FLA.audio.sfx('click');
      renderLobby();
    });

    renderIntro(game);
  }

  function renderIntro(game) {
    const record = FLA.progress.getGameRecord(game.id);
    const body = ui.$('#gameBody', root);
    body.innerHTML =
      '<div class="game-intro">' +
        '<div class="game-intro__art game-intro__art--' + game.color + '">' +
          '<span class="game-intro__ring"></span>' +
          '<img src="' + game.icon + '" alt="" width="150" height="150">' +
        '</div>' +
        '<div class="game-intro__content">' +
          '<span class="eyebrow">' + ui.escapeHtml(game.skill) + '</span>' +
          '<h2>' + ui.escapeHtml(game.title) + '</h2>' +
          '<p>' + ui.escapeHtml(game.desc) + '</p>' +
          '<ul class="instruction-list">' +
            game.intro.map((line) => '<li>' + ui.icon('check') + '<span>' + ui.escapeHtml(line) + '</span></li>').join('') +
          '</ul>' +
          '<div class="game-intro__actions">' +
            '<button type="button" class="btn btn--yellow btn--lg" id="startGame">' + ui.icon('play') + ' Mulai Main</button>' +
            '<span class="game-intro__best">' +
              (record.plays ? 'Rekor terbaik: <strong>' + record.bestScore + '</strong>' : 'Belum ada rekor. Jadilah yang pertama!') +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    ui.$('#startGame', root).addEventListener('click', () => {
      FLA.audio.sfx('click');
      startGameInstance();
    });
  }

  function startGameInstance() {
    if (!activeGame) return;
    destroyActive();
    const body = ui.$('#gameBody', root);
    if (!body) return;
    body.innerHTML = '';

    updateHud(0, 0, 0);
    setTimerVisible(false);

    const timers = new Set();
    const intervals = new Set();
    const ctx = {
      body,
      game: activeGame,
      finished: false,
      destroyed: false,
      setScore(score) {
        const el = ui.$('#hudScore', root);
        if (el) el.textContent = score;
      },
      setProgress(done, total) {
        const el = ui.$('#hudProgress', root);
        if (el) el.textContent = done + '/' + total;
      },
      setTimer(text, percent) {
        const value = ui.$('#hudTimer', root);
        const bar = ui.$('#hudTimerBar', root);
        const chip = ui.$('#hudTimerChip', root);
        if (value) value.textContent = text;
        if (bar) bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
        if (chip) chip.classList.toggle('is-low', percent <= 33);
      },
      showTimer(show) {
        setTimerVisible(show);
      },
      timeout(fn, delay) {
        const id = setTimeout(() => {
          timers.delete(id);
          if (!ctx.destroyed) fn();
        }, delay);
        timers.add(id);
        return id;
      },
      interval(fn, delay) {
        const id = setInterval(() => {
          if (!ctx.destroyed) fn();
        }, delay);
        intervals.add(id);
        return id;
      },
      clearInterval(id) {
        clearInterval(id);
        intervals.delete(id);
      },
      sound(name) {
        FLA.audio.sfx(name);
      },
      finish(result) {
        finishGame(ctx, result);
      },
      cleanup() {
        ctx.destroyed = true;
        timers.forEach((id) => clearTimeout(id));
        intervals.forEach((id) => clearInterval(id));
        timers.clear();
        intervals.clear();
      }
    };

    runner = {
      game: activeGame,
      ctx,
      instance: activeGame.create(ctx),
      finished: false
    };
    ctx.finish = (result) => finishGame(ctx, result);
    runner.instance.start();
  }

  function destroyActive() {
    if (runner) {
      try {
        if (runner.instance && typeof runner.instance.destroy === 'function') runner.instance.destroy();
      } catch (error) {
        /* permainan mungkin sudah selesai */
      }
      if (runner.ctx) runner.ctx.cleanup();
      runner = null;
    }
    setTimerVisible(false);
  }

  function updateHud(score, done, total) {
    const scoreEl = ui.$('#hudScore', root);
    const progressEl = ui.$('#hudProgress', root);
    if (scoreEl) scoreEl.textContent = score;
    if (progressEl) progressEl.textContent = done + '/' + total;
  }

  function setTimerVisible(visible) {
    const chip = ui.$('#hudTimerChip', root);
    if (chip) chip.hidden = !visible;
  }

  function finishGame(ctx, result) {
    if (!ctx || ctx.finished) return;
    ctx.finished = true;
    if (runner) runner.finished = true;

    const stars = Math.max(0, Math.min(3, result.stars || 0));
    const percent = result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0;
    const reward = FLA.progress.recordGame(ctx.game.id, ctx.game.title, result.score, result.maxScore, stars);

    if (runner && runner.instance && typeof runner.instance.destroy === 'function') {
      try { runner.instance.destroy(); } catch (error) { /* bersihkan sisa */ }
    }
    ctx.cleanup();
    setTimerVisible(false);

    if (percent >= 80) {
      FLA.audio.sfx('win');
      ui.confetti(90);
    } else if (percent >= 40) {
      FLA.audio.sfx('star');
      ui.confetti(50);
    } else {
      FLA.audio.sfx('pop');
    }

    const title = percent >= 80 ? 'Luar biasa!' : percent >= 50 ? 'Kerja bagus!' : 'Terus berlatih!';
    const subtitle = percent >= 80
      ? 'Kamu bermain sangat baik. Pertahankan, ya!'
      : percent >= 50
        ? 'Kamu sudah bagus. Coba lagi untuk skor lebih tinggi!'
        : 'Tidak apa-apa, setiap latihan membuatmu lebih hebat.';

    ctx.body.innerHTML =
      '<div class="game-result">' +
        '<div class="game-result__burst"></div>' +
        '<img class="game-result__mascot" src="assets/images/mascot-huhu.svg" alt="" width="120" height="120">' +
        '<span class="eyebrow">Permainan selesai</span>' +
        '<h2>' + title + '</h2>' +
        '<p>' + subtitle + '</p>' +
        '<div class="game-result__score">' +
          '<strong>' + result.score + '</strong>' +
          '<span>dari ' + result.maxScore + ' poin</span>' +
        '</div>' +
        '<div class="game-result__stars">' + ui.starRow(stars, 3) + '</div>' +
        (result.detail ? '<p class="game-result__detail">' + ui.escapeHtml(result.detail) + '</p>' : '') +
        '<div class="reward-pill">' +
          ui.icon('bolt') + ' +' + reward.points + ' poin' +
          '<span class="reward-pill__sep"></span>' +
          ui.icon('star') + ' +' + reward.stars + ' bintang' +
        '</div>' +
        (reward.stars === 0 ? '<p class="game-result__note">Tingkatkan skormu untuk mengumpulkan bintang berikutnya, ya.</p>' : '') +
        '<div class="game-result__actions">' +
          '<button type="button" class="btn btn--yellow btn--lg" id="replayGame">' + ui.icon('rotate') + ' Main Lagi</button>' +
          '<button type="button" class="btn btn--ghost" id="backToLobby">' + ui.icon('gamepad') + ' Game Lain</button>' +
        '</div>' +
      '</div>';

    ui.$('#replayGame', root).addEventListener('click', () => {
      FLA.audio.sfx('click');
      startGameInstance();
    });
    ui.$('#backToLobby', root).addEventListener('click', () => {
      FLA.audio.sfx('click');
      renderLobby();
    });
    ctx.body.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ============================================================
     1. TEBAK GAMBAR
     ============================================================ */
  function createGuessGame(ctx) {
    const rounds = ui.sample(data.items, 8);
    let index = 0;
    let score = 0;
    let correct = 0;
    let locked = false;

    function renderRound() {
      const item = rounds[index];
      const distractors = ui.sample(data.items.filter((entry) => entry.id !== item.id), 3).map((entry) => entry.name);
      const options = ui.shuffle([item.name].concat(distractors));

      ctx.setScore(score);
      ctx.setProgress(index, rounds.length);
      ctx.body.innerHTML =
        '<div class="guess-game">' +
          '<div class="guess-game__head">' +
            '<span class="eyebrow">Soal ' + (index + 1) + ' dari ' + rounds.length + '</span>' +
            '<h2>Gambar apa ini?</h2>' +
            '<p>Pilih nama yang paling tepat.</p>' +
          '</div>' +
          '<div class="guess-picture">' +
            '<span class="guess-picture__ring"></span>' +
            '<img src="' + item.file + '" alt="Gambar yang harus ditebak" draggable="false">' +
          '</div>' +
          '<div class="guess-options">' +
            options.map((name) =>
              '<button type="button" class="guess-option" data-name="' + ui.escapeHtml(name) + '">' + ui.escapeHtml(name) + '</button>'
            ).join('') +
          '</div>' +
          '<p class="game-feedback" id="guessFeedback" hidden></p>' +
        '</div>';

      locked = false;
      const buttons = ui.$$('.guess-option', ctx.body);
      buttons.forEach((button) => {
        button.addEventListener('click', () => answer(button, item, buttons));
      });
    }

    function answer(button, item, buttons) {
      if (locked) return;
      locked = true;
      const chosen = button.dataset.name;
      const isCorrect = chosen === item.name;
      const feedback = ui.$('#guessFeedback', ctx.body);

      buttons.forEach((btn) => {
        btn.disabled = true;
        if (btn.dataset.name === item.name) btn.classList.add('is-correct');
      });

      if (isCorrect) {
        score += 10;
        correct += 1;
        ctx.sound('correct');
        ui.burstFrom(button);
        feedback.hidden = false;
        feedback.className = 'game-feedback is-correct';
        feedback.innerHTML = ui.icon('check') + ' <strong>Benar!</strong> Itu gambar ' + ui.escapeHtml(item.name.toLowerCase()) + '.';
      } else {
        button.classList.add('is-wrong');
        ctx.sound('wrong');
        feedback.hidden = false;
        feedback.className = 'game-feedback is-wrong';
        feedback.innerHTML = ui.icon('close') + ' <strong>Belum tepat.</strong> Jawabannya ' + ui.escapeHtml(item.name.toLowerCase()) + '.';
      }

      ctx.setScore(score);
      ctx.timeout(() => {
        index += 1;
        if (index >= rounds.length) {
          const stars = correct >= 7 ? 3 : correct >= 5 ? 2 : 1;
          ctx.finish({
            score,
            maxScore: rounds.length * 10,
            stars,
            detail: 'Jawaban benar: ' + correct + ' dari ' + rounds.length + ' soal.'
          });
        } else {
          renderRound();
        }
      }, 1250);
    }

    return {
      start: renderRound,
      destroy() {}
    };
  }

  /* ============================================================
     2. COCOKKAN GAMBAR (DRAG & DROP + KETUK)
     ============================================================ */
  function createMatchGame(ctx) {
    const setId = data.matchSets[Math.floor(Math.random() * data.matchSets.length)];
    const pairs = setId.map(itemById).filter(Boolean);
    const poolOrder = ui.shuffle(pairs);
    const slotOrder = ui.shuffle(pairs);
    let matched = 0;
    let mistakes = 0;
    let score = 0;
    let selectedId = null;
    let boardEl = null;
    let dragListeners = [];

    function render() {
      ctx.setScore(score);
      ctx.setProgress(matched, pairs.length);
      ctx.body.innerHTML =
        '<div class="match-game">' +
          '<div class="game-help">' + ui.icon('hand') +
            ' <span>Seret gambar ke kotak nama yang tepat. Di layar sentuh, ketuk gambar lalu ketuk kotaknya.</span>' +
          '</div>' +
          '<div class="match-board">' +
            '<div class="match-pane">' +
              '<h3 class="pane-title">Gambar</h3>' +
              '<div class="match-pool" id="matchPool">' +
                poolOrder.map((item) =>
                  '<button type="button" class="match-chip" data-id="' + item.id + '" aria-label="Gambar untuk dicocokkan">' +
                    '<img src="' + item.file + '" alt="" draggable="false">' +
                  '</button>'
                ).join('') +
              '</div>' +
            '</div>' +
            '<div class="match-pane">' +
              '<h3 class="pane-title">Nama</h3>' +
              '<div class="match-slots" id="matchSlots">' +
                slotOrder.map((item) =>
                  '<button type="button" class="match-slot" data-id="' + item.id + '">' +
                    '<span class="match-slot__name">' + ui.escapeHtml(item.name) + '</span>' +
                    '<span class="match-slot__drop">?</span>' +
                  '</button>'
                ).join('') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="game-feedback" id="matchFeedback">Pilih atau seret salah satu gambar.</p>' +
        '</div>';

      boardEl = ui.$('.match-game', ctx.body);
      const chips = ui.$$('.match-chip', ctx.body);
      const slots = ui.$$('.match-slot', ctx.body);

      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          if (chip.dataset.suppressClick === '1') {
            chip.dataset.suppressClick = '0';
            return;
          }
          if (chip.classList.contains('is-matched')) return;
          FLA.audio.sfx('select');
          ui.$$('.match-chip', ctx.body).forEach((other) => other.classList.toggle('is-selected', other === chip && selectedId !== chip.dataset.id));
          selectedId = selectedId === chip.dataset.id ? null : chip.dataset.id;
          chip.classList.toggle('is-selected', selectedId === chip.dataset.id);
          showFeedback(selectedId ? 'Gambar dipilih. Sekarang ketuk kotak namanya.' : 'Pilih salah satu gambar.', false);
        });
        enableDrag(chip);
      });

      slots.forEach((slot) => {
        slot.addEventListener('click', () => {
          if (slot.classList.contains('is-filled')) return;
          if (!selectedId) {
            showFeedback('Pilih gambar dulu, lalu ketuk kotak namanya.', false);
            FLA.audio.sfx('click');
            return;
          }
          tryMatch(selectedId, slot);
        });
      });
    }

    function showFeedback(message, good) {
      const feedback = ui.$('#matchFeedback', ctx.body);
      if (!feedback) return;
      feedback.hidden = false;
      feedback.className = 'game-feedback ' + (good ? 'is-correct' : '');
      feedback.innerHTML = good ? ui.icon('check') + ' ' + message : ui.icon('info') + ' ' + message;
    }

    function expectMatch(chipId, slot) {
      if (slot.classList.contains('is-filled')) return;
      tryMatch(chipId, slot);
    }

    function tryMatch(chipId, slot) {
      const chip = ui.$('.match-chip[data-id="' + chipId + '"]', ctx.body);
      if (!chip) return;
      const item = itemById(chipId);
      if (!item) return;

      if (slot.dataset.id === chipId) {
        matched += 1;
        score += 10;
        selectedId = null;
        chip.classList.add('is-matched');
        chip.classList.remove('is-selected');
        chip.disabled = true;
        slot.classList.add('is-filled');
        slot.classList.remove('is-hover');
        slot.innerHTML =
          '<span class="match-slot__name">' + ui.escapeHtml(item.name) + '</span>' +
          '<span class="match-slot__drop match-slot__drop--done">' + ui.icon('check') + '</span>';
        ctx.sound('correct');
        ui.burstFrom(slot);
        ctx.setScore(score);
        ctx.setProgress(matched, pairs.length);
        showFeedback('Cocok! ' + ui.escapeHtml(item.name) + ' berhasil dipasangkan.', true);

        if (matched === pairs.length) {
          const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
          ctx.timeout(() => {
            ctx.finish({
              score,
              maxScore: pairs.length * 10,
              stars,
              detail: 'Selesai dengan ' + mistakes + ' kesalahan percobaan.'
            });
          }, 750);
        }
      } else {
        mistakes += 1;
        ctx.sound('wrong');
        slot.classList.add('is-wrong');
        ctx.timeout(() => slot.classList.remove('is-wrong'), 520);
        chip.classList.remove('is-selected');
        selectedId = null;
        showFeedback('Belum cocok. Coba ingat nama gambar lainnya, ya!', false);
      }
    }

    /* Drag dengan Pointer Events: mendukung mouse dan layar sentuh. */
    function enableDrag(chip) {
      let startX = 0;
      let startY = 0;
      let ghost = null;
      let dragging = false;

      const onMove = (event) => {
        if (!dragging && Math.hypot(event.clientX - startX, event.clientY - startY) > 8) {
          dragging = true;
          ghost = chip.cloneNode(true);
          ghost.className = 'match-ghost';
          ghost.removeAttribute('data-id');
          document.body.appendChild(ghost);
          chip.classList.add('is-dragging');
          FLA.audio.sfx('pop');
        }
        if (!dragging) return;
        event.preventDefault();
        ghost.style.left = event.clientX + 'px';
        ghost.style.top = event.clientY + 'px';
        const under = document.elementFromPoint(event.clientX, event.clientY);
        const hoverSlot = under && under.closest ? under.closest('.match-slot') : null;
        ui.$$('.match-slot', ctx.body).forEach((slot) => {
          slot.classList.toggle('is-hover', slot === hoverSlot && !slot.classList.contains('is-filled'));
        });
      };

      const onUp = (event) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        if (dragging) {
          const under = document.elementFromPoint(event.clientX, event.clientY);
          const slot = under && under.closest ? under.closest('.match-slot') : null;
          chip.dataset.suppressClick = '1';
          setTimeout(() => { chip.dataset.suppressClick = '0'; }, 50);
          cleanupDrag();
          if (slot && !slot.classList.contains('is-filled')) {
            expectMatch(chip.dataset.id, slot);
          }
        } else {
          cleanupDrag();
        }
      };

      const onDown = (event) => {
        if (chip.classList.contains('is-matched') || chip.disabled) return;
        if (event.button !== undefined && event.button !== 0) return;
        startX = event.clientX;
        startY = event.clientY;
        document.addEventListener('pointermove', onMove, { passive: false });
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
        dragListeners.push({ type: 'pointermove', fn: onMove });
        dragListeners.push({ type: 'pointerup', fn: onUp });
        dragListeners.push({ type: 'pointercancel', fn: onUp });
      };

      function cleanupDrag() {
        dragging = false;
        if (ghost) ghost.remove();
        ghost = null;
        chip.classList.remove('is-dragging');
        ui.$$('.match-slot', ctx.body).forEach((slot) => slot.classList.remove('is-hover'));
      }

      chip.addEventListener('pointerdown', onDown);
      chip._cleanupDrag = cleanupDrag;
    }

    return {
      start: render,
      destroy() {
        dragListeners.forEach(({ type, fn }) => document.removeEventListener(type, fn));
        dragListeners = [];
        ui.$$('.match-chip', ctx.body).forEach((chip) => {
          if (chip._cleanupDrag) chip._cleanupDrag();
        });
        document.querySelectorAll('.match-ghost').forEach((ghost) => ghost.remove());
      }
    };
  }

  /* ============================================================
     3. PUZZLE EDUKASI
     ============================================================ */
  function createPuzzleGame(ctx) {
    const SIZE = 3;
    const SCENE = 'assets/images/puzzle-space.svg';
    let board = [];
    let selected = null;
    let moves = 0;
    let finished = false;
    let previewTimer = null;

    function isSolved() {
      return board.every((piece, position) => piece === position);
    }

    function createBoard() {
      let candidate;
      do {
        candidate = ui.shuffle(ui.range(SIZE * SIZE));
      } while (candidate.every((piece, index) => piece === index));
      board = candidate;
      selected = null;
      moves = 0;
    }

    function render() {
      const correctTiles = board.filter((piece, position) => piece === position).length;
      ctx.setProgress(correctTiles, SIZE * SIZE);
      ctx.setScore(Math.max(25, 100 - moves * 4));
      ctx.body.innerHTML =
        '<div class="puzzle-game">' +
          '<div class="puzzle-game__head">' +
            '<div>' +
              '<h2>Susun gambar roket!</h2>' +
              '<p>Ketuk dua potongan untuk menukar posisinya.</p>' +
            '</div>' +
            '<div class="puzzle-actions">' +
              '<button type="button" class="btn btn--ghost btn--sm" id="previewPuzzle">' + ui.icon('eye') + ' Pratinjau</button>' +
              '<button type="button" class="btn btn--ghost btn--sm" id="shufflePuzzle">' + ui.icon('rotate') + ' Acak Ulang</button>' +
            '</div>' +
          '</div>' +
          '<div class="puzzle-wrap">' +
            '<div class="puzzle-board" id="puzzleBoard" style="--puzzle-cols:' + SIZE + '">' +
              board.map((piece, position) => {
                const col = piece % SIZE;
                const row = Math.floor(piece / SIZE);
                return '<button type="button" class="puzzle-tile ' + (selected === position ? 'is-selected' : '') +
                  '" data-position="' + position + '" aria-label="Potongan puzzle ' + (piece + 1) + '">' +
                  '<span class="puzzle-tile__img" style="background-image:url(' + SCENE + ');background-size:' + (SIZE * 100) + '% ' + (SIZE * 100) + '%;background-position:' +
                    (col * (100 / (SIZE - 1))) + '% ' + (row * (100 / (SIZE - 1))) + '%"></span>' +
                  '<span class="puzzle-tile__number">' + (piece + 1) + '</span>' +
                '</button>';
              }).join('') +
            '</div>' +
            '<div class="puzzle-side">' +
              '<div class="puzzle-stat"><span>Langkah</span><strong id="moveCount">' + moves + '</strong></div>' +
              '<div class="puzzle-stat"><span>Benar</span><strong id="correctCount">' + correctTiles + '/9</strong></div>' +
              '<p class="puzzle-hint">' + ui.icon('sparkles') + ' Semakin sedikit langkah, semakin banyak bintang.</p>' +
            '</div>' +
          '</div>' +
          '<div class="puzzle-preview" id="puzzlePreview" hidden>' +
            '<img src="' + SCENE + '" alt="Pratinjau gambar utuh">' +
            '<span>Pratinjau gambar</span>' +
          '</div>' +
        '</div>';

      ui.$$('.puzzle-tile', ctx.body).forEach((tile) => {
        tile.addEventListener('click', () => handleTile(Number(tile.dataset.position)));
      });

      ui.$('#previewPuzzle', ctx.body).addEventListener('click', showPreview);
      ui.$('#shufflePuzzle', ctx.body).addEventListener('click', () => {
        FLA.audio.sfx('click');
        createBoard();
        selected = null;
        render();
      });
    }

    function handleTile(position) {
      if (finished) return;
      if (selected === null) {
        selected = position;
        FLA.audio.sfx('select');
        render();
        return;
      }
      if (selected === position) {
        selected = null;
        FLA.audio.sfx('click');
        render();
        return;
      }
      const first = selected;
      selected = null;
      [board[first], board[position]] = [board[position], board[first]];
      moves += 1;
      FLA.audio.sfx('pop');
      render();

      if (isSolved()) {
        finished = true;
        const stars = moves <= 12 ? 3 : moves <= 22 ? 2 : 1;
        const score = Math.max(25, 100 - moves * 4);
        FLA.audio.sfx('correct');
        ctx.timeout(() => {
          ctx.finish({
            score,
            maxScore: 100,
            stars,
            detail: 'Puzzle selesai dalam ' + moves + ' langkah.'
          });
        }, 650);
      }
    }

    function showPreview() {
      const overlay = ui.$('#puzzlePreview', ctx.body);
      if (!overlay) return;
      FLA.audio.sfx('click');
      overlay.hidden = false;
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(() => { overlay.hidden = true; }, 2600);
    }

    createBoard();

    return {
      start: render,
      destroy() {
        if (previewTimer) clearTimeout(previewTimer);
      }
    };
  }

  /* ============================================================
     4. KUIS CEPAT
     ============================================================ */
  function createQuickQuizGame(ctx) {
    const questions = ui.sample(data.quickQuestions, 10);
    let index = 0;
    let score = 0;
    let correct = 0;
    let timerId = null;
    let timeLeft = 15;
    let locked = false;

    function renderQuestion() {
      const question = questions[index];
      locked = false;
      timeLeft = 15;
      ctx.setScore(score);
      ctx.setProgress(index, questions.length);
      ctx.showTimer(true);
      updateTimer();

      ctx.body.innerHTML =
        '<div class="quick-game">' +
          '<div class="quick-game__head">' +
            '<span class="eyebrow">Soal ' + (index + 1) + ' dari ' + questions.length + '</span>' +
            '<h2>' + ui.escapeHtml(question.q) + '</h2>' +
          '</div>' +
          '<div class="quick-timer"><span id="quickTimerBar"></span></div>' +
          '<div class="quick-options-grid">' +
            question.options.map((option, optionIndex) =>
              '<button type="button" class="quick-answer" data-option="' + optionIndex + '">' +
                '<span class="quick-answer__letter">' + String.fromCharCode(65 + optionIndex) + '</span>' +
                '<span>' + ui.escapeHtml(option) + '</span>' +
              '</button>'
            ).join('') +
          '</div>' +
          '<p class="game-feedback" id="quickFeedback" hidden></p>' +
        '</div>';

      ui.$$('.quick-answer', ctx.body).forEach((button) => {
        button.addEventListener('click', () => answer(Number(button.dataset.option)));
      });

      startTimer();
    }

    function updateTimer() {
      ctx.setTimer(Math.ceil(timeLeft) + 's', (timeLeft / 15) * 100);
      const bar = ui.$('#quickTimerBar', ctx.body);
      if (bar) bar.style.width = ((timeLeft / 15) * 100) + '%';
    }

    function startTimer() {
      if (timerId) ctx.clearInterval(timerId);
      const started = Date.now();
      timerId = ctx.interval(() => {
        const elapsed = (Date.now() - started) / 1000;
        timeLeft = Math.max(0, 15 - elapsed);
        updateTimer();
        if (timeLeft <= 0) {
          ctx.clearInterval(timerId);
          timerId = null;
          if (!locked) timeOut();
        }
      }, 100);
    }

    function stopTimer() {
      if (timerId) {
        ctx.clearInterval(timerId);
        timerId = null;
      }
    }

    function timeOut() {
      locked = true;
      stopTimer();
      const question = questions[index];
      const feedback = ui.$('#quickFeedback', ctx.body);
      ui.$$('.quick-answer', ctx.body).forEach((button, optionIndex) => {
        button.disabled = true;
        if (optionIndex === question.answer) button.classList.add('is-correct');
      });
      if (feedback) {
        feedback.hidden = false;
        feedback.className = 'game-feedback is-wrong';
        feedback.innerHTML = ui.icon('clock') + ' <strong>Waktu habis!</strong> Jawaban yang benar: ' + ui.escapeHtml(question.options[question.answer]);
      }
      ctx.sound('wrong');
      advance();
    }

    function answer(optionIndex) {
      if (locked) return;
      locked = true;
      stopTimer();
      const question = questions[index];
      const isCorrect = optionIndex === question.answer;
      const feedback = ui.$('#quickFeedback', ctx.body);
      const buttons = ui.$$('.quick-answer', ctx.body);
      buttons.forEach((button, buttonIndex) => {
        button.disabled = true;
        if (buttonIndex === question.answer) button.classList.add('is-correct');
      });

      if (isCorrect) {
        const timeBonus = Math.ceil(timeLeft / 3);
        score += 10 + timeBonus;
        correct += 1;
        ctx.sound('correct');
        ui.burstFrom(buttons[optionIndex]);
        if (feedback) {
          feedback.hidden = false;
          feedback.className = 'game-feedback is-correct';
          feedback.innerHTML = ui.icon('check') + ' <strong>Benar!</strong> +' + (10 + timeBonus) + ' poin (bonus waktu +' + timeBonus + ').';
        }
      } else {
        buttons[optionIndex].classList.add('is-wrong');
        ctx.sound('wrong');
        if (feedback) {
          feedback.hidden = false;
          feedback.className = 'game-feedback is-wrong';
          feedback.innerHTML = ui.icon('close') + ' <strong>Belum tepat.</strong> Jawaban yang benar: ' + ui.escapeHtml(question.options[question.answer]);
        }
      }
      ctx.setScore(score);
      advance();
    }

    function advance() {
      ctx.timeout(() => {
        index += 1;
        if (index >= questions.length) {
          const stars = correct >= 8 ? 3 : correct >= 6 ? 2 : 1;
          ctx.showTimer(false);
          ctx.finish({
            score,
            maxScore: 150,
            stars,
            detail: 'Jawaban benar: ' + correct + ' dari ' + questions.length + ' soal.'
          });
        } else {
          renderQuestion();
        }
      }, 1350);
    }

    return {
      start: renderQuestion,
      destroy() {
        stopTimer();
      }
    };
  }

  /* ============================================================
     5. BENAR ATAU SALAH
     ============================================================ */
  function createTrueFalseGame(ctx) {
    const statements = ui.sample(data.trueFalse, 8);
    let index = 0;
    let score = 0;
    let correct = 0;
    let locked = false;

    function renderStatement() {
      const item = statements[index];
      locked = false;
      ctx.setScore(score);
      ctx.setProgress(index, statements.length);
      ctx.body.innerHTML =
        '<div class="tf-game">' +
          '<span class="eyebrow">Pernyataan ' + (index + 1) + ' dari ' + statements.length + '</span>' +
          '<h2>Benar atau salah?</h2>' +
          '<div class="tf-statement">' +
            '<span class="tf-statement__mark">?</span>' +
            '<p>' + ui.escapeHtml(item.statement) + '</p>' +
          '</div>' +
          '<div class="tf-actions">' +
            '<button type="button" class="tf-btn tf-btn--true" data-answer="true">' + ui.icon('check') + ' Benar</button>' +
            '<button type="button" class="tf-btn tf-btn--false" data-answer="false">' + ui.icon('close') + ' Salah</button>' +
          '</div>' +
          '<p class="game-feedback" id="tfFeedback" hidden></p>' +
        '</div>';

      ui.$$('.tf-btn', ctx.body).forEach((button) => {
        button.addEventListener('click', () => answer(button, item));
      });
    }

    function answer(button, item) {
      if (locked) return;
      locked = true;
      const choice = button.dataset.answer === 'true';
      const isCorrect = choice === item.answer;
      const feedback = ui.$('#tfFeedback', ctx.body);
      const buttons = ui.$$('.tf-btn', ctx.body);
      buttons.forEach((btn) => {
        btn.disabled = true;
        const value = btn.dataset.answer === 'true';
        if (value === item.answer) btn.classList.add('is-correct');
      });
      if (!isCorrect) button.classList.add('is-wrong');

      if (isCorrect) {
        score += 10;
        correct += 1;
        ctx.sound('correct');
        ui.burstFrom(button);
        feedback.hidden = false;
        feedback.className = 'game-feedback is-correct';
        feedback.innerHTML = ui.icon('check') + ' <strong>Tepat!</strong> ' + ui.escapeHtml(item.explanation);
      } else {
        ctx.sound('wrong');
        feedback.hidden = false;
        feedback.className = 'game-feedback is-wrong';
        feedback.innerHTML = ui.icon('close') + ' <strong>Belum tepat.</strong> ' + ui.escapeHtml(item.explanation);
      }
      ctx.setScore(score);

      ctx.timeout(() => {
        index += 1;
        if (index >= statements.length) {
          const stars = correct >= 7 ? 3 : correct >= 5 ? 2 : 1;
          ctx.finish({
            score,
            maxScore: statements.length * 10,
            stars,
            detail: 'Jawaban benar: ' + correct + ' dari ' + statements.length + ' pernyataan.'
          });
        } else {
          renderStatement();
        }
      }, 1650);
    }

    return {
      start: renderStatement,
      destroy() {}
    };
  }

  /* ============================================================
     6. SIKLUS HALAMAN
     ============================================================ */
  function enter(container) {
    root = container;
    activeGame = null;
    renderLobby();
  }

  function leave() {
    destroyActive();
    root = null;
    activeGame = null;
  }

  return { enter, leave };
})();
