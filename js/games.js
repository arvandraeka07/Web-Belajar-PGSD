/* ============================================================
   FUN LEARNING ADVENTURE — Game Peta Petualangan Huruf
   Tiga pos yang terkunci bertahap:
     Pos 1  Gerbang Rahasia Huruf  (mengenal huruf)
     Pos 2  Jembatan Huruf         (mencocokkan huruf kapital & kecil)
     Pos 3  Harta Karun Kata       (huruf vokal & suku kata)
   Setiap pos: halaman petunjuk, tombol mulai, tantangan, skor,
   efek suara, animasi keberhasilan, dan penghargaan bintang.
   Pos dianggap selesai jika mendapat minimal 1 bintang.
   ============================================================ */

window.FLA = window.FLA || {};
FLA.pages = FLA.pages || {};

FLA.pages.game = (function () {
  'use strict';

  const ui = FLA.ui;
  const data = FLA.data;
  const POINTS = 10;

  let root = null;
  let session = null;
  let activeView = null;
  let timers = [];

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function destroyView() {
    if (activeView && activeView.destroy) activeView.destroy();
    activeView = null;
  }

  function getPos(id) {
    return data.adventure.find((item) => item.id === id);
  }

  function starsFor(score, max) {
    const ratio = max ? score / max : 0;
    return ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.5 ? 1 : 0;
  }

  /* ============================================================
     PETA PETUALANGAN
     ============================================================ */

  /* Titik pos di dalam viewBox 1000 x 560 */
  const SPOTS = {
    start: { x: 90, y: 480 },
    pos1: { x: 235, y: 285 },
    pos2: { x: 520, y: 372 },
    pos3: { x: 828, y: 205 }
  };

  function pct(value, total) {
    return (value / total * 100).toFixed(2) + '%';
  }

  function mapSvg(done) {
    const seg = (cls, d) => '<path class="trail ' + cls + '" d="' + d + '"/>';
    return '<svg class="adv-map__svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Peta petualangan dengan tiga pos: Gerbang Rahasia Huruf, Jembatan Huruf, dan Harta Karun Kata">' +
      '<defs>' +
        '<linearGradient id="mapSign" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset="1" stop-color="#ffb800"/></linearGradient><linearGradient id="mapDoor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset="1" stop-color="#ffb347"/></linearGradient><linearGradient id="mapLeaf" x1="0.2" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#8af0b4"/><stop offset="0.55" stop-color="#2fcf7e"/><stop offset="1" stop-color="#17a361"/></linearGradient><linearGradient id="mapWood" x1="0.2" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#e0a468"/><stop offset="0.55" stop-color="#b9793f"/><stop offset="1" stop-color="#8a5a33"/></linearGradient><linearGradient id="mapStone" x1="0.2" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#e3e8f5"/><stop offset="0.55" stop-color="#b8c2d3"/><stop offset="1" stop-color="#8d98b3"/></linearGradient><linearGradient id="mapHill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6f5c9"/><stop offset="1" stop-color="#7bd99a"/></linearGradient>' +
        '<linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcbff"/><stop offset="1" stop-color="#e6f5ff"/></linearGradient>' +
        '<linearGradient id="mapGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe3a3"/><stop offset="1" stop-color="#4fc27d"/></linearGradient>' +
        '<radialGradient id="mapGlow"><stop offset="0" stop-color="#fff3a8" stop-opacity=".95"/><stop offset="1" stop-color="#fff3a8" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1000" height="560" fill="url(#mapSky)"/>' +
      '<g class="cloud" fill="#fff" stroke="#c9d3f5" stroke-width="3" opacity=".95"><ellipse cx="170" cy="70" rx="64" ry="22"/><ellipse cx="215" cy="56" rx="40" ry="22"/><ellipse cx="700" cy="60" rx="70" ry="22"/><ellipse cx="750" cy="44" rx="42" ry="22"/></g>' +
      '<path d="M0 230 Q160 130 330 215 T660 190 T1000 150 V560 H0z" fill="url(#mapHill2)" stroke="#0b7a45" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M0 330 Q220 250 420 320 T800 290 T1000 270 V560 H0z" fill="url(#mapGrass)" stroke="#0b7a45" stroke-width="4" stroke-linejoin="round"/>' +
      /* sungai */
      '<path d="M455 250 C505 300 430 340 500 392 S600 470 560 572" fill="none" stroke="#17469c" stroke-width="94" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M455 250 C505 300 430 340 500 392 S600 470 560 572" fill="none" stroke="#7cc8ff" stroke-width="86" stroke-linecap="round"/>' +
      '<path d="M455 250 C505 300 430 340 500 392 S600 470 560 572" fill="none" stroke="#a9deff" stroke-width="40" stroke-linecap="round" stroke-dasharray="2 34" opacity=".9"/>' +
      /* jalan */
      seg('trail--base', 'M90 480 C140 430 135 340 235 300') +
      seg('trail--base', 'M235 300 C340 270 410 400 520 380') +
      seg('trail--base', 'M520 380 C650 350 690 250 828 220') +
      seg('trail--done', 'M90 480 C140 430 135 340 235 300') +
      (done.pos1 ? seg('trail--done', 'M235 300 C340 270 410 400 520 380') : '') +
      (done.pos2 ? seg('trail--done', 'M520 380 C650 350 690 250 828 220') : '') +
      /* pohon dan batu */
      '<g><rect x="36" y="215" width="14" height="52" rx="6" fill="url(#mapWood)" stroke="#4a2a16" stroke-width="3"/><circle cx="43" cy="205" r="38" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/><path d="M18 200Q22 176 44 170" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/><circle cx="20" cy="230" r="26" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/></g>' +
      '<g><rect x="930" y="330" width="14" height="52" rx="6" fill="url(#mapWood)" stroke="#4a2a16" stroke-width="3"/><circle cx="937" cy="318" r="40" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/><path d="M910 312Q914 288 938 280" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/><circle cx="960" cy="345" r="26" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/></g>' +
      '<g><rect x="705" y="95" width="12" height="46" rx="6" fill="url(#mapWood)" stroke="#4a2a16" stroke-width="3"/><circle cx="711" cy="85" r="32" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/><path d="M690 82Q694 62 710 57" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/></g>' +
      '<ellipse cx="340" cy="505" rx="52" ry="26" fill="url(#mapStone)" stroke="#5d6685" stroke-width="3"/><ellipse cx="365" cy="498" rx="30" ry="18" fill="url(#mapStone)" stroke="#5d6685" stroke-width="3"/>' +
      '<ellipse cx="760" cy="500" rx="44" ry="22" fill="url(#mapStone)" stroke="#5d6685" stroke-width="3"/>' +
      '<g fill="#ffd23f"><circle cx="400" cy="470" r="6"/><circle cx="420" cy="486" r="6"/><circle cx="640" cy="515" r="6"/><circle cx="170" cy="395" r="6"/></g>' +
      '<g fill="#ff7eb3"><circle cx="388" cy="486" r="6"/><circle cx="655" cy="500" r="6"/><circle cx="190" cy="410" r="6"/></g>' +
      '<g><circle cx="880" cy="470" r="22" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/><circle cx="904" cy="474" r="17" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/><path d="M866 461Q869 450 880 452" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></g><g><circle cx="600" cy="225" r="16" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/><circle cx="657" cy="304" r="12" fill="url(#mapLeaf)" stroke="#0b7a45" stroke-width="3.5"/><path d="M590.0 218.0Q592.0 210.0 600.0 212.0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></g><g stroke="#b8346f" stroke-width="2"><circle cx="905" cy="420" r="7" fill="#ff7eb3"/><circle cx="905" cy="420" r="3.4" fill="#ffd23f" stroke="#d99f00"/></g><g stroke="#b8346f" stroke-width="2"><circle cx="150" cy="520" r="7" fill="#ff7eb3"/><circle cx="150" cy="520" r="3.4" fill="#ffd23f" stroke="#d99f00"/></g><g stroke="#b8346f" stroke-width="2"><circle cx="700" cy="455" r="7" fill="#ff7eb3"/><circle cx="700" cy="455" r="3.4" fill="#ffd23f" stroke="#d99f00"/></g>' +
      /* papan mulai */
      '<g transform="translate(60 440)"><rect x="18" y="12" width="8" height="60" rx="3" fill="url(#mapWood)" stroke="#4a2a16" stroke-width="3"/><path d="M4 8 h58 q8 0 12 12 q-4 12 -12 12 h-58 q-4 0 -4 -4 v-16 q0 -4 4 -4z" fill="url(#mapSign)" stroke="#c98a00" stroke-width="3.4" stroke-linejoin="round"/><path d="M8 14h46" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></g>' +
      /* pos 1: gerbang batu (js/map-art.js) */
      '<g class="map-obj map-obj--gate" transform="translate(' + (SPOTS.pos1.x - 75) + ' ' + (SPOTS.pos1.y - 120) + ')">' + FLA.mapArt.gate() + '</g>' +
      /* pos 2: jembatan (js/map-art.js) */
      '<g class="map-obj map-obj--bridge" transform="translate(' + (SPOTS.pos2.x - 110) + ' ' + (SPOTS.pos2.y - 60) + ')">' + FLA.mapArt.bridge() + '</g>' +
      /* pos 3: peti harta (js/map-art.js) */
      '<g class="map-obj map-obj--chest" transform="translate(' + (SPOTS.pos3.x - 70) + ' ' + (SPOTS.pos3.y - 70) + ')">' + FLA.mapArt.chest() + '</g>' +
    '</svg>';
  }

  function renderMap() {
    clearTimers();
    destroyView();
    session = null;
    FLA.audio.stopSpeech();

    const adventure = data.adventure;
    const done = { pos1: FLA.progress.isGameDone('pos1'), pos2: FLA.progress.isGameDone('pos2'), pos3: FLA.progress.isGameDone('pos3') };
    const nextPos = adventure.find((pos) => !done[pos.id] && FLA.progress.isPosUnlocked(pos.id));
    const totalStars = adventure.reduce((sum, pos) => sum + (FLA.progress.getGameRecord(pos.id).stars || 0), 0);
    const mascotSpot = nextPos ? SPOTS[nextPos.id] : SPOTS.pos3;

    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="page-heading">' +
          '<a href="#/beranda" class="back-link">' + ui.icon('arrow-left') + ' Beranda</a>' +
          '<div class="page-heading__row">' +
            '<div>' +
              '<span class="eyebrow">Menu Game</span>' +
              '<h1>Peta Petualangan Huruf</h1>' +
              '<p class="page-lead">Selesaikan satu pos untuk membuka pos berikutnya. Kumpulkan bintang di setiap pos!</p>' +
            '</div>' +
            '<div class="adv-total"><span>' + ui.icon('star') + '</span><strong>' + totalStars + '/9</strong><small>bintang game</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="adv-map" id="advMap">' +
          mapSvg(done) +
          '<img class="adv-map__mascot" src="assets/images/mascot-huhu.svg" alt="" style="left:' + pct(mascotSpot.x - 70, 1000) + ';top:' + pct(mascotSpot.y - 20, 560) + '">' +
          '<span class="adv-map__start" style="left:' + pct(SPOTS.start.x + 10, 1000) + ';top:' + pct(SPOTS.start.y + 40, 560) + '">Mulai</span>' +
          adventure.map((pos) => {
            const spot = SPOTS[pos.id];
            const unlocked = FLA.progress.isPosUnlocked(pos.id);
            const record = FLA.progress.getGameRecord(pos.id);
            const state = done[pos.id] ? 'is-done' : unlocked ? 'is-open' : 'is-locked';
            const offsetY = pos.id === 'pos2' ? -140 : pos.id === 'pos1' ? -186 : -150;
            return '<button type="button" class="map-pos map-pos--' + pos.color + ' ' + state + (nextPos && nextPos.id === pos.id ? ' is-next' : '') + '" data-pos="' + pos.id + '" ' +
              'style="left:' + pct(spot.x, 1000) + ';top:' + pct(spot.y + offsetY, 560) + '" ' +
              'aria-label="Pos ' + pos.number + ': ' + ui.escapeHtml(pos.title) + (unlocked ? '' : ', terkunci') + '">' +
              '<span class="map-pos__badge">' + (unlocked ? pos.number : ui.icon('lock')) + '</span>' +
              '<span class="map-pos__title">' + ui.escapeHtml(pos.title) + '</span>' +
              '<span class="map-pos__stars">' + ui.starRow(record.stars || 0, 3) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<div class="pos-grid">' +
          adventure.map((pos) => {
            const record = FLA.progress.getGameRecord(pos.id);
            const unlocked = FLA.progress.isPosUnlocked(pos.id);
            return '<article class="pos-card pos-card--' + pos.color + (unlocked ? '' : ' is-locked') + '">' +
              '<div class="pos-card__head"><span class="pos-card__num">' + pos.number + '</span>' +
                '<h2>' + ui.escapeHtml(pos.title) + '</h2></div>' +
              '<p><strong>Tujuan:</strong> ' + ui.escapeHtml(pos.goal) + '</p>' +
              '<div class="pos-card__foot">' +
                (record.plays
                  ? '<span>Skor terbaik <strong>' + record.bestScore + '</strong></span>' + ui.starRow(record.stars || 0, 3)
                  : '<span>' + (unlocked ? 'Belum dimainkan' : 'Terkunci: selesaikan pos sebelumnya') + '</span>') +
              '</div>' +
              '<button type="button" class="btn btn--sm ' + (unlocked ? 'btn--' + (pos.color === 'blue' ? 'blue' : pos.color === 'green' ? 'green' : 'yellow') : 'btn--ghost') + '" data-pos="' + pos.id + '">' +
                ui.icon(unlocked ? 'play' : 'lock') + ' ' + (unlocked ? (record.plays ? 'Main Lagi' : 'Buka Pos') : 'Terkunci') + '</button>' +
            '</article>';
          }).join('') +
        '</div>' +
      '</div>';

    ui.$$('[data-pos]', root).forEach((button) => {
      button.addEventListener('click', () => {
        const pos = getPos(button.dataset.pos);
        if (!FLA.progress.isPosUnlocked(pos.id)) {
          FLA.audio.sfx('wrong');
          const previous = data.adventure[pos.number - 2];
          ui.toast('Selesaikan Pos ' + previous.number + ' (' + previous.title + ') dengan minimal 1 bintang untuk membuka pos ini.', { tone: 'warning', icon: 'lock', title: 'Pos terkunci' });
          return;
        }
        FLA.audio.sfx('click');
        renderIntro(pos);
      });
    });
  }

  /* ============================================================
     HALAMAN PETUNJUK
     ============================================================ */

  function renderIntro(pos) {
    clearTimers();
    destroyView();
    const record = FLA.progress.getGameRecord(pos.id);
    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="intro-card intro-card--' + pos.color + '">' +
          '<button type="button" class="back-link" id="introBack">' + ui.icon('arrow-left') + ' Peta Petualangan</button>' +
          '<div class="intro-card__head">' +
            '<span class="intro-card__num">Pos ' + pos.number + '</span>' +
            '<img src="' + pos.icon + '" alt="" width="84" height="84">' +
            '<h1>' + ui.escapeHtml(pos.title) + '</h1>' +
            '<p class="intro-card__goal">Tujuan: ' + ui.escapeHtml(pos.goal) + '</p>' +
          '</div>' +
          '<div class="intro-card__body">' +
            '<h2>Petunjuk Permainan</h2>' +
            '<ol class="intro-steps">' + pos.instructions.map((text, index) =>
              '<li><span>' + (index + 1) + '</span>' + ui.escapeHtml(text) + '</li>').join('') + '</ol>' +
            '<div class="intro-reward">' + ui.icon('star') +
              '<span>Dapatkan <strong>1 bintang</strong> jika benar &ge; 50%, <strong>2 bintang</strong> &ge; 70%, dan <strong>3 bintang</strong> &ge; 90%.</span></div>' +
            (record.plays ? '<p class="intro-best">Skor terbaikmu: <strong>' + record.bestScore + '</strong> ' + ui.starRow(record.stars || 0, 3) + '</p>' : '') +
          '</div>' +
          '<div class="intro-card__actions">' +
            '<button type="button" class="btn btn--audio" id="introSpeak">' + ui.icon('volume') + ' Dengarkan Petunjuk</button>' +
            '<button type="button" class="btn btn--yellow btn--lg" id="introStart">' + ui.icon('play') + ' Mulai</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    ui.$('#introBack', root).addEventListener('click', () => { FLA.audio.sfx('click'); renderMap(); });
    ui.$('#introSpeak', root).addEventListener('click', () => FLA.audio.speak(pos.speech, { notify: true }));
    ui.$('#introStart', root).addEventListener('click', () => {
      FLA.audio.sfx('click');
      FLA.audio.stopSpeech();
      startPos(pos);
    });
    later(() => FLA.audio.speak(pos.speech), 350);
  }

  /* ============================================================
     SESI PERMAINAN
     ============================================================ */

  function startPos(pos) {
    clearTimers();
    destroyView();
    if (pos.id === 'pos2') {
      const picked = [];
      const boards = pos.boards.map((board) => {
        let letters;
        if (board.fixed) {
          letters = board.fixed.slice();
        } else {
          const pool = data.ALPHABET.filter((ch) => picked.indexOf(ch) === -1);
          letters = ui.sample(pool, board.random).sort();
        }
        letters.forEach((ch) => picked.push(ch));
        return letters;
      });
      session = { pos, kind: 'board', boards, index: 0, score: 0, max: boards.reduce((sum, b) => sum + b.length, 0) * POINTS, total: boards.length, correctCount: 0, answered: false };
    } else {
      const usedWords = [];
      const items = pos.rounds.map((type) => {
        if (type === 'build') {
          const pool = data.vowelWords.filter((w) => usedWords.indexOf(w.vowel) === -1);
          const word = ui.sample(pool.length ? pool : data.vowelWords, 1)[0];
          usedWords.push(word.vowel);
          return { type: 'build', word };
        }
        return { type, question: null };
      });
      /* Buat semua soal sekaligus agar tidak ada kunci yang sama pada jenis yang sama */
      const questionTypes = items.filter((item) => item.type !== 'build').map((item) => item.type);
      const questions = FLA.quiz.makeSet(questionTypes);
      let qi = 0;
      items.forEach((item) => {
        if (item.type !== 'build') { item.question = questions[qi]; qi += 1; }
      });
      session = { pos, kind: 'rounds', items, index: 0, score: 0, max: items.length * POINTS, total: items.length, correctCount: 0, answered: false };
    }
    renderRound();
  }

  function hud() {
    const pos = session.pos;
    const percent = Math.round((session.index / session.total) * 100);
    return '<div class="game-top">' +
      '<button type="button" class="back-link" id="exitGame">' + ui.icon('arrow-left') + ' Keluar</button>' +
      '<div class="game-top__title"><span class="tag tag--' + pos.color + '">Pos ' + pos.number + '</span><strong>' + ui.escapeHtml(pos.title) + '</strong></div>' +
      '<div class="game-score" aria-live="polite">' + ui.icon('bolt') + ' Skor <strong id="gameScore">' + session.score + '</strong></div>' +
    '</div>' +
    '<div class="progress-track progress-track--exam"><span id="gameBar" style="width:' + percent + '%"></span></div>';
  }

  function bindExit() {
    ui.$('#exitGame', root).addEventListener('click', async () => {
      const leave = await ui.confirmDialog({
        title: 'Keluar dari permainan?',
        message: 'Skor pos ini tidak disimpan jika kamu keluar sekarang.',
        confirmLabel: 'Ya, keluar',
        cancelLabel: 'Lanjut bermain',
        danger: true
      });
      if (leave) renderMap();
    });
  }

  function setScore(value) {
    session.score = value;
    const label = ui.$('#gameScore', root);
    if (label) {
      label.textContent = value;
      label.classList.remove('is-bump');
      void label.offsetWidth;
      label.classList.add('is-bump');
    }
  }

  function nextControls(isLast) {
    return '<div class="game-next"><button type="button" class="btn btn--yellow btn--lg" id="gameNext" disabled>' +
      (isLast ? 'Lihat Hasil' : 'Lanjut') + ' ' + ui.icon('arrow-right') + '</button></div>';
  }

  function enableNext() {
    const button = ui.$('#gameNext', root);
    if (!button) return;
    button.disabled = false;
    button.classList.add('is-pulse');
    session.answered = true;
  }

  function advance() {
    FLA.audio.sfx('click');
    FLA.audio.stopSpeech();
    session.index += 1;
    session.answered = false;
    if (session.index >= session.total) finishPos();
    else renderRound();
  }

  function renderRound() {
    clearTimers();
    destroyView();
    if (session.kind === 'board') renderBoard();
    else if (session.items[session.index].type === 'build') renderBuild();
    else renderQuestion();
    bindExit();
    const next = ui.$('#gameNext', root);
    if (next) next.addEventListener('click', advance);
  }

  /* Soal pilihan (pos 1 dan pos 3) */
  function renderQuestion() {
    const item = session.items[session.index];
    const isLast = session.index === session.total - 1;
    root.innerHTML =
      '<div class="page-shell game-play">' + hud() +
        '<div class="game-card question-enter">' +
          '<div class="game-card__label">Tantangan ' + (session.index + 1) + ' dari ' + session.total + '</div>' +
          '<div id="gameQa"></div>' +
          nextControls(isLast) +
        '</div>' +
      '</div>';
    const q = item.question;
    activeView = FLA.quiz.render(ui.$('#gameQa', root), q, {
      retry: false,
      onAnswer: (result) => {
        if (q.cat) FLA.progress.recordItem(q.cat, q.key, result.correct);
        if (result.correct) {
          session.correctCount += 1;
          setScore(session.score + POINTS);
        }
        enableNext();
      }
    });
  }

  /* Menyusun huruf menjadi kata (pos 3) */
  function renderBuild() {
    const item = session.items[session.index];
    const word = item.word;
    const letters = word.word.toUpperCase().split('');
    const isLast = session.index === session.total - 1;
    const tiles = ui.shuffle(letters.map((ch, i) => ({ ch, id: i })));

    root.innerHTML =
      '<div class="page-shell game-play">' + hud() +
        '<div class="game-card question-enter">' +
          '<div class="game-card__label">Tantangan ' + (session.index + 1) + ' dari ' + session.total + '</div>' +
          '<div class="qa">' +
            '<p class="qa__prompt">Susun huruf-huruf menjadi nama gambar ini!</p>' +
            '<div class="qa__stem"><div class="qa-pic"><img src="' + word.file + '" alt="Gambar ' + word.word + '" width="120" height="120">' +
              '<button type="button" class="qa-pic__word" id="buildHear" aria-label="Dengarkan nama gambar">' + ui.icon('volume') + '<span>Dengarkan</span></button></div></div>' +
            '<div class="build-slots" id="buildSlots" aria-label="Tempat huruf">' + letters.map(() => '<span class="build-slot"></span>').join('') + '</div>' +
            '<div class="build-tiles" id="buildTiles" role="group" aria-label="Pilihan huruf">' +
              tiles.map((tile) => '<button type="button" class="build-tile" data-id="' + tile.id + '" data-letter="' + tile.ch + '">' + tile.ch + '</button>').join('') +
            '</div>' +
            '<p class="qa__feedback" id="buildFeedback" role="status" hidden></p>' +
          '</div>' +
          nextControls(isLast) +
        '</div>' +
      '</div>';

    let filled = 0;
    let mistakes = 0;
    const slots = ui.$$('.build-slot', root);
    const feedback = ui.$('#buildFeedback', root);

    ui.$('#buildHear', root).addEventListener('click', () => FLA.audio.say(word.word.toLowerCase(), word.word));
    later(() => FLA.audio.say(word.word.toLowerCase(), word.word), 300);

    ui.$$('.build-tile', root).forEach((tile) => {
      tile.addEventListener('click', () => {
        if (filled >= letters.length || tile.disabled) return;
        if (tile.dataset.letter === letters[filled]) {
          slots[filled].textContent = tile.dataset.letter;
          slots[filled].classList.add('is-filled');
          tile.disabled = true;
          tile.classList.add('is-used');
          filled += 1;
          FLA.audio.sfx('select');
          if (filled === letters.length) {
            const points = mistakes === 0 ? POINTS : mistakes <= 2 ? 7 : 4;
            if (mistakes === 0) session.correctCount += 1;
            setScore(session.score + points);
            FLA.progress.recordItem('suku', word.vowel, mistakes === 0);
            feedback.hidden = false;
            feedback.className = 'qa__feedback is-correct';
            feedback.innerHTML = ui.icon('check') + ' <strong>' + ui.escapeHtml(FLA.quiz.praise()) + '</strong> Kata: ' + word.word + ' (' + word.syllables.join('-') + ').';
            FLA.audio.sfx('correct');
            ui.burstFrom(slots[filled - 1]);
            FLA.audio.say(word.word.toLowerCase(), word.word);
            enableNext();
          }
        } else {
          mistakes += 1;
          tile.classList.add('is-wrong');
          later(() => tile.classList.remove('is-wrong'), 500);
          FLA.audio.sfx('wrong');
          feedback.hidden = false;
          feedback.className = 'qa__feedback is-wrong';
          feedback.innerHTML = ui.icon('close') + ' <strong>Belum tepat.</strong> Huruf berikutnya bukan ' + tile.dataset.letter + '. Coba huruf lain!';
        }
      });
    });
  }

  /* Papan pasangan huruf (pos 2) */
  function renderBoard() {
    const letters = session.boards[session.index];
    const isLast = session.index === session.total - 1;
    root.innerHTML =
      '<div class="page-shell game-play">' + hud() +
        '<div class="game-card question-enter">' +
          '<div class="game-card__label">Papan ' + (session.index + 1) + ' dari ' + session.total + '</div>' +
          '<p class="qa__prompt">' + (session.index === 0
            ? 'Pasangkan A dengan a, B dengan b, dan seterusnya!'
            : 'Pasangkan huruf kapital dengan huruf kecil yang sama. Hurufnya diacak!') + '</p>' +
          '<div id="gameBoard"></div>' +
          nextControls(isLast) +
        '</div>' +
      '</div>';
    activeView = FLA.quiz.matchBoard(ui.$('#gameBoard', root), letters, {
      onPair: (result) => {
        const key = result.letter + '-' + result.letter.toLowerCase();
        if (!result.correct) {
          FLA.progress.recordItem('cocok', key, false);
        } else if (result.firstTry) {
          FLA.progress.recordItem('cocok', key, true);
          session.correctCount += 1;
          setScore(session.score + POINTS);
        }
      },
      onComplete: () => {
        FLA.audio.sfx('star');
        enableNext();
      }
    });
  }

  /* ============================================================
     HASIL
     ============================================================ */

  function finishPos() {
    clearTimers();
    destroyView();
    const pos = session.pos;
    const stars = starsFor(session.score, session.max);
    const wasDone = FLA.progress.isGameDone(pos.id);
    const reward = FLA.progress.recordGame(pos.id, pos.title, session.score, session.max, stars);
    const nowDone = FLA.progress.isGameDone(pos.id);
    const nextPos = data.adventure[pos.number];
    const unlockedNew = !wasDone && nowDone && nextPos;
    const rewardBits = [];
    if (reward.points > 0) {
      rewardBits.push(ui.icon('bolt') + ' +' + reward.points + ' poin');
    }
    if (reward.stars > 0) {
      rewardBits.push(ui.icon('star') + ' +' + reward.stars + ' bintang');
    }
    const rewardMarkup = rewardBits.length
      ? rewardBits.join('<span class="reward-pill__sep"></span>')
      : ui.icon('check') + ' Latihan selesai — tidak ada rekor baru';

    if (stars >= 2) { FLA.audio.sfx('win'); ui.confetti(110); }
    else if (stars === 1) { FLA.audio.sfx('star'); ui.confetti(55); }
    else { FLA.audio.sfx('pop'); }
    FLA.audio.speak(stars
      ? 'Selamat! Kamu mendapat ' + stars + ' bintang!'
      : 'Ayo coba lagi! Kamu pasti bisa.');

    const percent = session.max ? Math.round((session.score / session.max) * 100) : 0;
    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="result-card game-result result-card--' + (stars >= 3 ? 'gold' : stars === 2 ? 'silver' : stars === 1 ? 'bronze' : 'sky') + '">' +
          '<div class="result-hero">' +
            '<img src="assets/images/mascot-huhu.svg" alt="" width="110" height="110" class="result-hero__mascot">' +
            '<span class="eyebrow">Pos ' + pos.number + ' · ' + ui.escapeHtml(pos.title) + '</span>' +
            '<h1>' + (stars ? 'Pos Selesai!' : 'Ayo Coba Lagi!') + '</h1>' +
            '<div class="result-stars result-stars--anim">' + ui.starRow(stars, 3) + '</div>' +
            '<p class="result-meta">Skor <strong>' + session.score + '</strong> dari ' + session.max + ' (' + percent + '%)</p>' +
            '<div class="reward-pill">' + rewardMarkup + '</div>' +
            (reward.isNewBest && session.score > 0 ? '<p class="result-note">Rekor baru untuk pos ini!</p>' : '') +
            (unlockedNew
              ? '<div class="notice notice--success">' + ui.icon('lock') + ' <strong>Pos ' + nextPos.number + ' terbuka:</strong> ' + ui.escapeHtml(nextPos.title) + '</div>'
              : (!stars ? '<div class="notice notice--info">' + ui.icon('info') + ' Dapatkan minimal 1 bintang (benar &ge; 50%) untuk menyelesaikan pos ini' + (nextPos ? ' dan membuka pos berikutnya.' : '.') + '</div>' : '')) +
            '<div class="result-actions">' +
              (unlockedNew ? '<button type="button" class="btn btn--yellow btn--lg" id="goNext">' + ui.icon('play') + ' Pos Berikutnya</button>' : '') +
              '<button type="button" class="btn ' + (unlockedNew ? 'btn--ghost' : 'btn--yellow btn--lg') + '" id="playAgain">' + ui.icon('rotate') + ' Main Lagi</button>' +
              '<button type="button" class="btn btn--ghost" id="backMap">' + ui.icon('gamepad') + ' Peta</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    const goNext = ui.$('#goNext', root);
    if (goNext) goNext.addEventListener('click', () => { FLA.audio.sfx('click'); renderIntro(nextPos); });
    ui.$('#playAgain', root).addEventListener('click', () => { FLA.audio.sfx('click'); startPos(pos); });
    ui.$('#backMap', root).addEventListener('click', () => { FLA.audio.sfx('click'); renderMap(); });
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function enter(container) {
    root = container;
    renderMap();
  }

  function leave() {
    clearTimers();
    destroyView();
    FLA.audio.stopSpeech();
    session = null;
    root = null;
  }

  return { enter, leave };
})();
