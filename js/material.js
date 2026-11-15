/* ============================================================
   FUN LEARNING ADVENTURE — Halaman Materi "Mengenal Huruf"
   Tiga submateri:
     1. Mengenal dan Membedakan Huruf
     2. Mencocokkan Huruf dengan Bentuknya
     3. Mengenal Suku Kata
   Setiap subbab memiliki ilustrasi, teks singkat, audio pengucapan,
   latihan, tombol sebelumnya/selanjutnya, dan indikator progres.
   ============================================================ */

window.FLA = window.FLA || {};
FLA.pages = FLA.pages || {};

FLA.pages.material = (function () {
  'use strict';

  const ui = FLA.ui;
  const data = FLA.data;

  let root = null;
  let topicId = null;
  let step = 0;
  let narrationOn = false;
  let questionCache = {};
  let activeView = null;
  let syllableConsonant = 'B';

  function getTopic(id) {
    return data.materials.find((item) => item.id === id);
  }

  function letterInfo(upper) {
    return data.letters.find((item) => item.upper === upper);
  }

  function answeredCount(topic) {
    const record = FLA.progress.getMaterialRecord(topic.id);
    return topic.subbabs.filter((_, index) => record.answers && record.answers[index]).length;
  }

  function destroyView() {
    if (activeView && activeView.destroy) activeView.destroy();
    activeView = null;
  }

  function topicButtonColor(color) {
    return color === 'blue' ? 'blue' : color === 'yellow' ? 'yellow' : color === 'green' ? 'green' : 'orange';
  }

  /* ---------- Daftar materi ---------- */

  function renderList() {
    topicId = null;
    step = 0;
    stopNarration();
    destroyView();
    questionCache = {};
    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="page-heading">' +
          '<a href="#/beranda" class="back-link">' + ui.icon('arrow-left') + ' Beranda</a>' +
          '<div class="page-heading__row">' +
            '<div>' +
              '<span class="eyebrow">Menu Materi</span>' +
              '<h1>Pilih MateriMu</h1>' +
              '<p class="page-lead">Pelajari bentuk dan nama huruf. Ada ilustrasi, suara, dan latihan seru di setiap subbab.</p>' +
            '</div>' +
            '<img class="page-heading__mascot" src="assets/images/mascot-huhu.svg" alt="Huhu si burung hantu">' +
          '</div>' +
        '</div>' +
        '<div class="material-grid">' +
          data.materials.map((topic, topicIndex) => {
            const record = FLA.progress.getMaterialRecord(topic.id);
            const done = answeredCount(topic);
            const total = topic.subbabs.length;
            const percent = Math.round((done / total) * 100);
            return '<article class="material-card material-card--' + topic.color + '">' +
              '<div class="material-card__art">' +
                '<img class="material-card__scene" src="' + topic.illustration + '" alt="" loading="lazy">' +
                '<span class="material-card__icon"><img src="' + topic.icon + '" alt="" width="48" height="48"></span>' +
                (record.completed ? '<span class="material-card__stamp">' + ui.icon('check') + ' Selesai</span>' : '') +
              '</div>' +
              '<div class="material-card__body">' +
                '<div class="tag-row">' +
                  '<span class="tag tag--' + topic.color + '">' + ui.escapeHtml(topic.subject) + '</span>' +
                  '<span class="tag">' + total + ' subbab</span>' +
                '</div>' +
                '<h2>' + ui.escapeHtml(topic.title) + '</h2>' +
                '<p>' + ui.escapeHtml(topic.blurb) + '</p>' +
                '<div class="material-card__progress">' +
                  '<div class="progress-track progress-track--sm"><span style="width:' + percent + '%"></span></div>' +
                  '<span>' + done + '/' + total + ' latihan</span>' +
                '</div>' +
                '<button type="button" class="btn btn--' + topicButtonColor(topic.color) + ' btn--block" data-open-topic="' + topic.id + '">' +
                  ui.icon('book') + ' ' + (record.completed ? 'Baca Lagi' : (done ? 'Lanjutkan' : 'Buka Materi')) +
                '</button>' +
              '</div>' +
            '</article>';
          }).join('') +
        '</div>' +
        '<div class="material-footnote">' +
          '<img src="assets/images/om-1F4A1.svg" alt="" width="42" height="42">' +
          '<p><strong>Belajar pelan-pelan tidak apa-apa.</strong> Kerjakan latihan di setiap subbab untuk mengumpulkan poin, lalu selesaikan ringkasan untuk mendapat 2 bintang. Guru dapat mengarahkan materi secara berurutan.</p>' +
        '</div>' +
      '</div>';

    root.querySelectorAll('[data-open-topic]').forEach((button) => {
      button.addEventListener('click', () => {
        FLA.audio.sfx('click');
        openTopic(button.dataset.openTopic);
      });
    });
  }

  /* ---------- Pembaca materi ---------- */

  function openTopic(id) {
    const topic = getTopic(id);
    if (!topic) return;
    topicId = id;
    step = 0;
    questionCache = {};
    renderReader();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderReader() {
    const topic = getTopic(topicId);
    if (!topic) return;
    stopNarration();
    destroyView();
    const totalSteps = topic.subbabs.length + 1;
    const isSummary = step === topic.subbabs.length;
    const subbab = isSummary ? null : topic.subbabs[step];
    const answered = answeredCount(topic);
    const record = FLA.progress.getMaterialRecord(topic.id);
    const progressPercent = Math.round((Math.min(step + 1, totalSteps) / totalSteps) * 100);
    const currentIcon = isSummary ? topic.icon : subbab.icon;
    const currentVisual = isSummary ? 'Ringkasan' : subbab.visual;

    const dots = ui.range(totalSteps).map((index) => {
      const isDone = index < topic.subbabs.length && record.answers && record.answers[index];
      return '<span class="step-dot ' + (index === step ? 'is-current' : '') + (isDone ? ' is-done' : '') + '" title="' +
        (index === topic.subbabs.length ? 'Ringkasan' : 'Subbab ' + (index + 1)) + '">' +
        (isDone && index !== step ? ui.icon('check') : index + 1) + '</span>';
    }).join('');

    const content = isSummary ? renderSummary(topic, answered, record) : renderSubbab(topic, subbab, step);

    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="reader-top">' +
          '<button type="button" class="back-link" id="backToMaterials">' + ui.icon('arrow-left') + ' Semua Materi</button>' +
          '<div class="tag-row">' +
            '<span class="tag tag--' + topic.color + '">' + ui.escapeHtml(topic.subject) + '</span>' +
                      '</div>' +
        '</div>' +
        '<div class="reader-card">' +
          '<aside class="reader-art reader-art--' + topic.color + '">' +
            '<div class="reader-art__glow"></div>' +
            '<img class="reader-art__scene" src="' + topic.illustration + '" alt="Ilustrasi ' + ui.escapeHtml(topic.title) + '">' +
            '<div class="reader-art__bubble"><img src="' + currentIcon + '" alt="" width="72" height="72"></div>' +
            '<div class="reader-art__visual">' + ui.escapeHtml(currentVisual) + '</div>' +
            '<span class="reader-art__label">' + (isSummary ? 'Ringkasan' : 'Subbab ' + (step + 1)) + ' · ' + ui.escapeHtml(topic.title) + '</span>' +
          '</aside>' +
          '<div class="reader-content">' +
            '<div class="reader-progress">' +
              '<div class="reader-progress__top">' +
                '<span class="eyebrow">' + (isSummary ? 'Langkah terakhir' : 'Subbab ' + (step + 1) + ' dari ' + topic.subbabs.length) + '</span>' +
                '<span class="reader-progress__count">' + Math.min(step + 1, totalSteps) + '/' + totalSteps + '</span>' +
              '</div>' +
              '<div class="progress-track"><span style="width:' + progressPercent + '%"></span></div>' +
              '<div class="step-dots" aria-hidden="true">' + dots + '</div>' +
            '</div>' +
            content +
            '<div class="reader-nav">' +
              '<button type="button" class="btn btn--ghost" id="prevStep" ' + (step === 0 ? 'disabled' : '') + '>' +
                ui.icon('arrow-left') + ' Sebelumnya</button>' +
              (isSummary
                ? '<button type="button" class="btn btn--blue" id="finishTopic">' + ui.icon('check') + ' Selesai</button>'
                : '<button type="button" class="btn btn--blue" id="nextStep">Selanjutnya ' + ui.icon('arrow-right') + '</button>') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    bindReader(topic);
    if (!isSummary) {
      mountKind(topic, subbab);
      mountCheck(topic, subbab, step);
    }
  }

  /* ---------- Isi subbab ---------- */

  function renderSubbab(topic, subbab, index) {
    const record = FLA.progress.getMaterialRecord(topic.id);
    const answered = record.answers && record.answers[index];

    return '<div class="reader-body">' +
      '<h1>' + ui.escapeHtml(subbab.title) + '</h1>' +
      '<div class="reader-tools">' +
        '<button type="button" class="btn btn--audio" id="narrateBtn">' +
          ui.icon('volume') + ' <span>' + (narrationOn ? 'Berhenti Membaca' : 'Bacakan Materi') + '</span>' +
        '</button>' +
        '<span class="reader-tools__hint">' + ui.icon('sparkles') + ' Dengarkan dengan saksama</span>' +
      '</div>' +
      subbab.paragraphs.map((paragraph) => '<p class="reader-paragraph">' + ui.escapeHtml(paragraph) + '</p>').join('') +
      '<div class="kind-area" id="kindArea"></div>' +
      (subbab.funFact
        ? '<div class="fun-fact">' +
            '<span class="fun-fact__icon">' + ui.icon('sparkles') + '</span>' +
            '<p><strong>Tahukah kamu?</strong> ' + ui.escapeHtml(subbab.funFact) + '</p>' +
          '</div>'
        : '') +
      '<div class="quick-check ' + (answered ? 'is-answered' : '') + '" id="quickCheck">' +
        '<div class="quick-check__head">' +
          '<span class="quick-check__icon">' + ui.icon('question') + '</span>' +
          '<div><strong>' + (subbab.check === 'board' ? 'Latihan: Pasangkan Huruf' : 'Latihan Sederhana') + '</strong>' +
            '<p>' + (answered ? 'Latihan ini sudah selesai. Kamu boleh berlatih lagi.' : 'Selesaikan latihan ini untuk lanjut dengan nyaman.') + '</p></div>' +
          (answered ? '<span class="tag tag--done">' + ui.icon('check') + ' Selesai</span>' : '') +
        '</div>' +
        '<div id="qaMount"></div>' +
      '</div>' +
    '</div>';
  }

  function mountKind(topic, subbab) {
    const area = ui.$('#kindArea', root);
    if (!area) return;
    const kinds = { text: kindText, cards: kindCards, similar: kindSimilar, pairs: kindPairs,
      vowels: kindVowels, syllables: kindSyllables, words: kindWords };
    const handler = kinds[subbab.kind];
    if (handler) handler(area, subbab);
  }

  /* Pengenalan huruf: beberapa huruf contoh */
  function kindText(area, subbab) {
    area.innerHTML = '<div class="sample-row">' +
      subbab.sample.map((ch) => {
        const info = letterInfo(ch);
        return '<button type="button" class="sample-tile" data-letter="' + ch + '" aria-label="Huruf ' + ch + ', dibaca ' + info.name + '">' +
          '<strong>' + ch + '</strong><span>' + info.lower + '</span></button>';
      }).join('') +
      '<span class="sample-dots">...</span><button type="button" class="sample-tile sample-tile--end" data-letter="Z" aria-label="Huruf Z, dibaca zet">' +
        '<strong>Z</strong><span>z</span></button></div>';
    ui.$$('.sample-tile', area).forEach((tile) => {
      tile.addEventListener('click', () => {
        const info = letterInfo(tile.dataset.letter);
        FLA.audio.sfx('select');
        FLA.audio.say(info.lower, info.name);
      });
    });
  }

  /* Kartu huruf besar dengan sorotan */
  function kindCards(area, subbab) {
    const first = letterInfo(subbab.letters[0]);
    area.innerHTML =
      '<div class="spot" id="spot" aria-live="polite">' +
        '<div class="spot__pair"><span class="spot__upper" id="spotUpper">' + first.upper + '</span><span class="spot__lower" id="spotLower">' + first.lower + '</span></div>' +
        '<div class="spot__info">' +
          '<p class="spot__name">Dibaca <strong id="spotName">' + first.name + '</strong></p>' +
          '<p class="spot__hint">Huruf kapital: <strong id="spotUpperText">' + first.upper + '</strong> · Huruf kecil: <strong id="spotLowerText">' + first.lower + '</strong></p>' +
          '<button type="button" class="btn btn--audio" id="spotSay">' + ui.icon('volume') + ' <span>Dengarkan</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="letter-cards">' +
        subbab.letters.map((ch, index) => {
          const info = letterInfo(ch);
          return '<button type="button" class="letter-card' + (index === 0 ? ' is-active' : '') + '" data-letter="' + ch + '" aria-label="Huruf ' + ch + ', dibaca ' + info.name + '">' +
            '<strong>' + info.upper + '</strong><span>' + info.lower + '</span></button>';
        }).join('') +
      '</div>';

    let current = first;
    const show = (info, speak) => {
      current = info;
      ui.$('#spotUpper', area).textContent = info.upper;
      ui.$('#spotLower', area).textContent = info.lower;
      ui.$('#spotName', area).textContent = info.name;
      ui.$('#spotUpperText', area).textContent = info.upper;
      ui.$('#spotLowerText', area).textContent = info.lower;
      const pair = ui.$('.spot__pair', area);
      pair.classList.remove('is-pop');
      void pair.offsetWidth;
      pair.classList.add('is-pop');
      ui.$$('.letter-card', area).forEach((card) => card.classList.toggle('is-active', card.dataset.letter === info.upper));
      if (speak) FLA.audio.say(info.lower, info.name);
    };
    ui.$$('.letter-card', area).forEach((card) => {
      card.addEventListener('click', () => {
        FLA.audio.sfx('select');
        show(letterInfo(card.dataset.letter), true);
      });
    });
    ui.$('#spotSay', area).addEventListener('click', () => {
      FLA.audio.say(current.lower, current.name);
    });
  }

  /* Huruf yang mirip */
  function kindSimilar(area, subbab) {
    area.innerHTML = '<div class="similar-list">' +
      subbab.similar.map((item) =>
        '<div class="similar-card">' +
          '<div class="similar-card__pair">' +
            item.pair.map((ch) =>
              '<button type="button" class="similar-glyph" data-lower="' + ch + '" aria-label="Huruf kecil ' + ch + '">' + ch + '</button>'
            ).join('<span class="similar-card__vs">dan</span>') +
          '</div>' +
          '<p>' + ui.escapeHtml(item.tip) + '</p>' +
        '</div>'
      ).join('') + '</div>';
    ui.$$('.similar-glyph', area).forEach((button) => {
      button.addEventListener('click', () => {
        const upper = button.dataset.lower.toUpperCase();
        FLA.audio.sfx('select');
        FLA.audio.say(button.dataset.lower, letterInfo(upper).name);
      });
    });
  }

  /* Pasangan huruf kapital dan huruf kecil */
  function kindPairs(area, subbab) {
    area.innerHTML = '<div class="pair-cards">' +
      subbab.letters.map((ch) => {
        const info = letterInfo(ch);
        return '<button type="button" class="pair-card" data-letter="' + ch + '" aria-label="Pasangan ' + info.upper + ' dan ' + info.lower + '">' +
          '<span class="pair-card__upper">' + info.upper + '</span>' +
          '<span class="pair-card__link">=</span>' +
          '<span class="pair-card__lower">' + info.lower + '</span></button>';
      }).join('') + '</div>';
    ui.$$('.pair-card', area).forEach((card) => {
      card.addEventListener('click', () => {
        const info = letterInfo(card.dataset.letter);
        FLA.audio.sfx('select');
        FLA.audio.say(info.lower, 'Huruf kapital ' + info.upper + ', huruf kecil ' + info.lower);
        card.classList.remove('is-pop');
        void card.offsetWidth;
        card.classList.add('is-pop');
      });
    });
  }

  /* Huruf vokal dengan gambar */
  function kindVowels(area) {
    area.innerHTML = '<div class="vowel-cards">' +
      data.vowelWords.map((item) =>
        '<button type="button" class="vowel-card vowel-card--' + item.vowel.toLowerCase() + '" data-vowel="' + item.vowel + '" aria-label="Huruf vokal ' + item.vowel + ', ' + item.word + '">' +
          '<span class="vowel-card__letter">' + item.vowel + '<small>' + item.vowel.toLowerCase() + '</small></span>' +
          '<img src="' + item.file + '" alt="" width="64" height="64">' +
          '<span class="vowel-card__word">' + item.word + '</span></button>'
      ).join('') + '</div>';
    ui.$$('.vowel-card', area).forEach((card) => {
      card.addEventListener('click', () => {
        const item = data.vowelWords.find((entry) => entry.vowel === card.dataset.vowel);
        FLA.audio.sfx('select');
        FLA.audio.say(item.vowel.toLowerCase(), 'Huruf ' + item.vowel.toLowerCase() + '. ' + item.word);
      });
    });
  }

  /* Suku kata: konsonan + vokal */
  function kindSyllables(area) {
    const render = () => {
      const c = syllableConsonant.toLowerCase();
      area.innerHTML =
        '<div class="syl-pick" role="group" aria-label="Pilih huruf konsonan">' +
          '<span class="syl-pick__label">Pilih huruf konsonan:</span>' +
          data.SYLLABLE_CONSONANTS.map((ch) =>
            '<button type="button" class="syl-chip' + (ch === syllableConsonant ? ' is-active' : '') + '" data-consonant="' + ch + '" aria-pressed="' + (ch === syllableConsonant) + '">' + ch.toLowerCase() + '</button>'
          ).join('') +
        '</div>' +
        '<div class="syl-row">' +
          data.VOWELS.map((v) =>
            '<button type="button" class="syl-card" data-vowel="' + v + '" aria-label="Suku kata ' + c + v.toLowerCase() + '">' +
              '<span class="syl-card__formula">' + c + ' + ' + v.toLowerCase() + '</span>' +
              '<strong>' + c + v.toLowerCase() + '</strong></button>'
          ).join('') +
        '</div>';
      ui.$$('.syl-chip', area).forEach((chip) => {
        chip.addEventListener('click', () => {
          syllableConsonant = chip.dataset.consonant;
          FLA.audio.sfx('select');
          render();
        });
      });
      ui.$$('.syl-card', area).forEach((card) => {
        card.addEventListener('click', () => {
          const syllable = c + card.dataset.vowel.toLowerCase();
          FLA.audio.sfx('select');
          FLA.audio.say(syllable, syllable);
        });
      });
    };
    render();
  }

  /* Kata dan suku katanya */
  function kindWords(area) {
    area.innerHTML = '<div class="word-cards">' +
      data.vowelWords.map((item) =>
        '<button type="button" class="word-card" data-vowel="' + item.vowel + '" aria-label="Kata ' + item.word + ', dibaca ' + item.syllables.join(' ') + '">' +
          '<img src="' + item.file + '" alt="" width="68" height="68">' +
          '<span class="word-card__word">' + item.word + '</span>' +
          '<span class="word-card__syllables">' + item.syllables.map((s) => '<b>' + s + '</b>').join('<i>·</i>') + '</span></button>'
      ).join('') + '</div>';
    ui.$$('.word-card', area).forEach((card) => {
      card.addEventListener('click', () => {
        const item = data.vowelWords.find((entry) => entry.vowel === card.dataset.vowel);
        FLA.audio.sfx('select');
        FLA.audio.say(item.word.toLowerCase(), item.syllables.join(', ') + '. ' + item.word);
      });
    });
  }

  /* ---------- Latihan di setiap subbab ---------- */

  function markAnswered(topic, index, extra) {
    const result = FLA.progress.answerSubbab(topic.id, index);
    const check = ui.$('#quickCheck', root);
    if (check) {
      check.classList.add('is-answered');
      const note = ui.$('.quick-check__head p', check);
      if (note) note.textContent = 'Latihan ini sudah selesai. Kamu boleh berlatih lagi.';
      if (!ui.$('.quick-check__head .tag--done', check)) {
        ui.$('.quick-check__head', check).insertAdjacentHTML('beforeend', '<span class="tag tag--done">' + ui.icon('check') + ' Selesai</span>');
      }
    }
    const dot = ui.$$('.step-dot', root)[index];
    if (dot) dot.classList.add('is-done');
    if (result.firstTime && extra) extra(result);
  }

  function mountCheck(topic, subbab, index) {
    const mount = ui.$('#qaMount', root);
    if (!mount) return;

    if (subbab.check === 'board') {
      mountBoard(topic, subbab, index, mount);
      return;
    }

    const cacheKey = topic.id + ':' + index;
    if (!questionCache[cacheKey]) {
      questionCache[cacheKey] = FLA.quiz.make(subbab.check, { pool: subbab.pool, question: subbab.question });
    }
    const question = questionCache[cacheKey];
    activeView = FLA.quiz.render(mount, question, {
      retry: true,
      autoSpeak: true,
      onAnswer: (result) => {
        if (question.cat) {
          if (!result.correct && result.attempts === 1) FLA.progress.recordItem(question.cat, question.key, false);
          if (result.correct && result.firstTry) FLA.progress.recordItem(question.cat, question.key, true);
        }
        if (result.correct) {
          markAnswered(topic, index, () => {
            const feedback = ui.$('.qa__feedback', mount);
            if (feedback) feedback.insertAdjacentHTML('beforeend', ' <span class="points-chip">+2 poin</span>');
          });
          const next = ui.$('#nextStep', root);
          if (next) next.classList.add('is-pulse');
        }
      }
    });
  }

  function mountBoard(topic, subbab, index, mount) {
    const start = () => {
      const pairs = ui.sample(data.ALPHABET, subbab.boardSize || 4).sort();
      mount.innerHTML = '<div id="boardHost"></div>';
      activeView = FLA.quiz.matchBoard(ui.$('#boardHost', mount), pairs, {
        onPair: (result) => {
          const key = result.letter + '-' + result.letter.toLowerCase();
          if (!result.correct) FLA.progress.recordItem('cocok', key, false);
          else if (result.firstTry) FLA.progress.recordItem('cocok', key, true);
        },
        onComplete: (summary) => {
          markAnswered(topic, index, () => {
            ui.toast('Semua pasangan benar! +2 poin.', { tone: 'success', icon: 'star', title: 'Hebat!' });
          });
          FLA.audio.sfx('win');
          ui.confetti(50);
          FLA.audio.speak('Hebat! Semua pasangan sudah benar!');
          const host = ui.$('#boardHost', mount);
          if (host) {
            host.insertAdjacentHTML('beforeend',
              '<div class="board-done">' +
                '<span>' + ui.icon('check') + ' ' + summary.firstTry + ' dari ' + summary.total + ' pasangan benar pada percobaan pertama.</span>' +
                '<button type="button" class="btn btn--ghost btn--sm" id="boardAgain">' + ui.icon('rotate') + ' Main Lagi</button>' +
              '</div>');
            const again = ui.$('#boardAgain', host);
            if (again) again.addEventListener('click', () => { FLA.audio.sfx('click'); destroyView(); start(); });
          }
        }
      });
    };
    start();
  }

  function renderSummary(topic, answered, record) {
    const total = topic.subbabs.length;
    const allAnswered = answered >= total;
    const done = record.completed;

    return '<div class="reader-body">' +
      '<h1>Ringkasan: ' + ui.escapeHtml(topic.title) + '</h1>' +
      '<p class="reader-paragraph">Kamu sudah sampai di langkah terakhir. Berikut hal penting yang perlu diingat.</p>' +
      '<ul class="summary-list">' +
        topic.summary.map((item) => '<li>' + ui.icon('check') + '<span>' + ui.escapeHtml(item) + '</span></li>').join('') +
      '</ul>' +
      '<div class="summary-progress">' +
        '<div class="summary-progress__row"><span>Latihan subbab</span><strong>' + answered + '/' + total + '</strong></div>' +
        '<div class="progress-track"><span style="width:' + Math.round((answered / total) * 100) + '%"></span></div>' +
      '</div>' +
      (done
        ? '<div class="finish-panel finish-panel--done">' +
            '<img src="assets/images/mascot-huhu.svg" alt="" width="96" height="96">' +
            '<div><span class="completion-card__kicker">Materi selesai</span>' +
            '<h3>Kamu hebat!</h3>' +
            '<p>Materi ini sudah selesai. Kamu bisa mempelajarinya lagi kapan saja.</p></div>' +
            '<div class="completion-card__stars">' + ui.starRow(2, 3) + '</div>' +
          '</div>'
        : allAnswered
          ? '<div class="finish-panel">' +
              '<img src="assets/images/mascot-huhu.svg" alt="" width="96" height="96">' +
              '<div><h3>Siap mendapat bintang?</h3><p>Semua latihan sudah selesai. Ambil hadiahmu sekarang!</p></div>' +
              '<button type="button" class="btn btn--yellow btn--lg" id="claimMaterial">' + ui.icon('star') + ' Ambil Bintang</button>' +
            '</div>'
          : '<div class="notice notice--info">' +
              ui.icon('info') + ' Kerjakan latihan di setiap subbab dulu, ya. Masih ada ' + (total - answered) + ' latihan yang belum selesai.' +
            '</div>') +
    '</div>';
  }

  function bindReader(topic) {
    const back = ui.$('#backToMaterials', root);
    if (back) {
      back.addEventListener('click', () => {
        FLA.audio.sfx('click');
        stopNarration();
        renderList();
      });
    }

    const prev = ui.$('#prevStep', root);
    if (prev) {
      prev.addEventListener('click', () => {
        if (step > 0) {
          FLA.audio.sfx('click');
          step -= 1;
          renderReader();
          scrollToReader();
        }
      });
    }

    const next = ui.$('#nextStep', root);
    if (next) {
      next.addEventListener('click', () => {
        FLA.audio.sfx('click');
        stopNarration();
        step += 1;
        renderReader();
        scrollToReader();
      });
    }

    const finish = ui.$('#finishTopic', root);
    if (finish) {
      finish.addEventListener('click', () => {
        FLA.audio.sfx('click');
        stopNarration();
        renderList();
      });
    }

    const narrate = ui.$('#narrateBtn', root);
    if (narrate) {
      narrate.addEventListener('click', () => toggleNarration(topic));
    }

    const claim = ui.$('#claimMaterial', root);
    if (claim) {
      claim.addEventListener('click', () => {
        const result = FLA.progress.completeMaterial(topic.id, topic.title);
        if (!result.already) {
          FLA.audio.sfx('win');
          ui.confetti(90);
          FLA.audio.speak('Selamat! Kamu mendapat dua bintang!');
          ui.toast('Materi selesai! +15 poin dan +2 bintang.', {
            tone: 'success', icon: 'star', title: 'Luar biasa!'
          });
        }
        renderReader();
      });
    }
  }

  function scrollToReader() {
    const card = ui.$('.reader-card', root);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Narasi ---------- */

  function toggleNarration(topic) {
    if (narrationOn) {
      stopNarration();
      return;
    }
    if (!FLA.audio.hasSpeech) {
      ui.toast('Browser ini belum mendukung narasi suara.', { tone: 'warning', icon: 'info' });
      return;
    }
    if (!FLA.audio.soundOn) {
      ui.toast('Suara sedang dimatikan. Nyalakan lewat tombol suara di kanan atas.', { tone: 'info', icon: 'volume-off' });
      return;
    }
    const subbab = step < topic.subbabs.length ? topic.subbabs[step] : null;
    const text = subbab
      ? subbab.title + '. ' + subbab.paragraphs.join(' ') + (subbab.funFact ? ' Tahukah kamu? ' + subbab.funFact : '')
      : 'Ringkasan materi ' + topic.title + '. ' + topic.summary.join(' ');
    narrationOn = true;
    updateNarrateButton();
    FLA.audio.speak(text, {
      onEnd: () => {
        narrationOn = false;
        updateNarrateButton();
      }
    });
  }

  function updateNarrateButton() {
    const button = ui.$('#narrateBtn', root);
    if (!button) return;
    button.classList.toggle('is-speaking', narrationOn);
    button.innerHTML = ui.icon(narrationOn ? 'volume-off' : 'volume') +
      ' <span>' + (narrationOn ? 'Berhenti Membaca' : 'Bacakan Materi') + '</span>';
  }

  function stopNarration() {
    if (narrationOn) {
      FLA.audio.stopSpeech();
      narrationOn = false;
      updateNarrateButton();
    }
  }

  function enter(container) {
    root = container;
    topicId = null;
    step = 0;
    narrationOn = false;
    questionCache = {};
    renderList();
  }

  function leave() {
    destroyView();
    FLA.audio.stopSpeech();
    narrationOn = false;
    root = null;
    topicId = null;
  }

  return { enter, leave };
})();
