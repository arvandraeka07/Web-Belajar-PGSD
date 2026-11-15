/* ============================================================
   FUN LEARNING ADVENTURE — Soal Interaktif Huruf
   - Pembuat soal (dinamis) untuk materi, video, game, dan evaluasi.
   - Penampil soal dengan umpan balik suara dan visual.
   Semua jawaban dihitung dari data huruf di data.js, sehingga
   urutan alfabet, pasangan kapital-kecil, dan huruf vokal selalu benar.
   ============================================================ */

window.FLA = window.FLA || {};

FLA.quiz = (function () {
  'use strict';

  const ui = FLA.ui;
  const d = FLA.data;

  const PRAISE = ['Benar! Hebat!', 'Tepat sekali!', 'Pintar sekali!', 'Keren, jawabanmu benar!', 'Bagus sekali!'];
  const TRY_AGAIN = ['Belum tepat. Ayo coba lagi!', 'Hampir benar. Coba sekali lagi, ya!'];

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const praise = () => pick(PRAISE);
  const tryAgain = () => pick(TRY_AGAIN);

  /* ---------- Pembantu ---------- */
  function lettersExcept(exclude, count, pool) {
    const source = (pool && pool.length > count + 1 ? pool : d.ALPHABET).filter((ch) => exclude.indexOf(ch) === -1);
    const base = source.length >= count ? source : d.ALPHABET.filter((ch) => exclude.indexOf(ch) === -1);
    return ui.sample(base, count);
  }

  /* Susun pilihan: jawaban benar + pengecoh, lalu diacak. */
  function build(base, correct, distractors) {
    const options = ui.shuffle([correct].concat(distractors));
    return Object.assign(base, { options, answer: options.indexOf(correct) });
  }

  /* Pilih dua pengecoh huruf kecil: satu mirip bentuk, satu acak. */
  function lowerDistractors(lower) {
    const result = [];
    const similar = (d.LOOKALIKE[lower] || []).filter((ch) => ch !== lower);
    if (similar.length) result.push(pick(similar));
    while (result.length < 2) {
      const candidate = pick(d.ALPHABET).toLowerCase();
      if (candidate !== lower && result.indexOf(candidate) === -1) result.push(candidate);
    }
    return result;
  }

  /* ---------- Jenis soal ---------- */
  const builders = {
    /* Tebak huruf berdasarkan suara */
    sound(opts) {
      const letter = opts.letter || pick(opts.pool || d.ALPHABET);
      const name = d.LETTER_NAMES[letter];
      return build({
        type: 'sound', cat: 'huruf', key: letter, optionStyle: 'letter',
        prompt: 'Dengarkan! Huruf apakah yang kamu dengar?',
        stem: { kind: 'speak', say: name, label: 'Dengarkan huruf', letter: letter },
        explanation: 'Huruf yang diucapkan adalah ' + letter + ', dibaca "' + name + '".'
      }, letter, lettersExcept([letter], 2));
    },

    /* Tebak huruf berdasarkan gambar */
    picture(opts) {
      const pool = opts.pool ? d.pictures.filter((p) => opts.pool.indexOf(p.letter) !== -1) : d.pictures;
      const item = pick(pool.length ? pool : d.pictures);
      return build({
        type: 'picture', cat: 'huruf', key: item.letter, optionStyle: 'letter',
        prompt: 'Nama gambar ini diawali huruf apa?',
        stem: { kind: 'pic', file: item.file, word: item.word, say: item.word },
        explanation: item.word + ' diawali huruf ' + item.letter + '.'
      }, item.letter, lettersExcept([item.letter], 2));
    },

    /* Lengkapi urutan alfabet: A-B-C-... */
    sequence(opts) {
      const start = Math.floor(Math.random() * (d.ALPHABET.length - 3));
      const seq = d.ALPHABET.slice(start, start + 4);
      const hidden = pick([2, 3]);
      const answer = seq[hidden];
      const near = d.ALPHABET.slice(Math.max(0, start - 3), Math.min(d.ALPHABET.length, start + 8))
        .filter((ch) => seq.indexOf(ch) === -1);
      const distractors = ui.sample(near.length >= 2 ? near : lettersExcept(seq, 2), 2);
      return build({
        type: 'sequence', cat: 'huruf', key: answer, optionStyle: 'letter',
        prompt: seq.map((ch, i) => (i === hidden ? '...' : ch)).join('-') + ' Huruf apakah yang hilang?',
        stem: { kind: 'seq', items: seq.map((ch, i) => (i === hidden ? '?' : ch)) },
        explanation: 'Urutan alfabetnya: ' + seq.join(', ') + '. Huruf yang hilang adalah ' + answer + '.'
      }, answer, distractors);
    },

    /* Mengidentifikasi huruf kapital */
    capital(opts) {
      const letter = opts.letter || pick(opts.pool || d.ALPHABET);
      const lower = letter.toLowerCase();
      const smalls = ui.sample(d.ALPHABET.map((ch) => ch.toLowerCase()).filter((ch) => ch !== lower), 2);
      return build({
        type: 'capital', cat: 'huruf', key: letter, optionStyle: 'letter',
        prompt: 'Manakah huruf kapital (huruf besar)?',
        stem: null,
        explanation: 'Huruf kapital adalah huruf besar. Yang kapital di sini adalah ' + letter + '.'
      }, letter, smalls);
    },

    /* Huruf kapital di antara huruf kecil yang mirip (membedakan huruf) */
    capitalLook(opts) {
      const letter = opts.letter || pick(opts.pool || d.ALPHABET);
      const lower = letter.toLowerCase();
      const similar = (d.LOOKALIKE[lower] || []).filter((ch) => ch !== lower);
      const smalls = similar.slice(0, 2);
      while (smalls.length < 2) {
        const candidate = pick(d.ALPHABET).toLowerCase();
        if (candidate !== lower && smalls.indexOf(candidate) === -1) smalls.push(candidate);
      }
      return build({
        type: 'capital', cat: 'huruf', key: letter, optionStyle: 'letter',
        prompt: 'Manakah huruf kapital (huruf besar)?',
        stem: null,
        explanation: 'Huruf kapital adalah huruf besar. Yang kapital di sini adalah ' + letter + '.'
      }, letter, smalls);
    },

    /* Mencocokkan huruf kecil dengan huruf kapital */
    lower(opts) {
      const letter = opts.letter || pick(opts.pool || d.ALPHABET);
      const lower = letter.toLowerCase();
      return build({
        type: 'lower', cat: 'cocok', key: letter + '-' + lower, optionStyle: 'letter',
        prompt: 'Manakah huruf kecil yang sama dengan huruf ' + letter + '?',
        stem: { kind: 'big', text: letter },
        explanation: 'Pasangan huruf kapital ' + letter + ' adalah huruf kecil ' + lower + '.'
      }, lower, lowerDistractors(lower));
    },

    /* Mencocokkan huruf kapital dengan huruf kecil */
    upper(opts) {
      const letter = opts.letter || pick(opts.pool || d.ALPHABET);
      const lower = letter.toLowerCase();
      const similar = (d.LOOKALIKE[lower] || []).filter((ch) => ch !== lower).map((ch) => ch.toUpperCase());
      const distractors = [];
      if (similar.length) distractors.push(pick(similar));
      while (distractors.length < 2) {
        const candidate = pick(d.ALPHABET);
        if (candidate !== letter && distractors.indexOf(candidate) === -1) distractors.push(candidate);
      }
      return build({
        type: 'upper', cat: 'cocok', key: letter + '-' + lower, optionStyle: 'letter',
        prompt: 'Manakah huruf kapital yang sama dengan huruf kecil ' + lower + '?',
        stem: { kind: 'big', text: lower },
        explanation: 'Pasangan huruf kecil ' + lower + ' adalah huruf kapital ' + letter + '.'
      }, letter, distractors);
    },

    /* Mengenali huruf vokal */
    vowel(opts) {
      const letter = opts.letter || pick(d.VOWELS);
      const consonants = ui.sample(d.CONSONANTS, 2);
      const lowerCase = Math.random() < 0.4;
      const fmt = (ch) => (lowerCase ? ch.toLowerCase() : ch);
      return build({
        type: 'vowel', cat: 'suku', key: letter, optionStyle: 'letter',
        prompt: 'Manakah yang termasuk huruf vokal?',
        stem: null,
        explanation: 'Huruf vokal ada lima: A, I, U, E, O. Huruf ' + consonants.join(' dan ') + ' adalah konsonan.'
      }, fmt(letter), consonants.map(fmt));
    },

    /* Gabungan konsonan + vokal = suku kata */
    syllable(opts) {
      const consonant = pick(d.SYLLABLE_CONSONANTS);
      const vowel = opts.letter || pick(d.VOWELS);
      const others = ui.sample(d.VOWELS.filter((v) => v !== vowel), 2);
      const text = (v) => (consonant + v).toLowerCase();
      return build({
        type: 'syllable', cat: 'suku', key: vowel, optionStyle: 'letter',
        prompt: 'Gabungkan huruf-huruf ini. Menjadi suku kata apa?',
        stem: { kind: 'sum', parts: [consonant.toLowerCase(), vowel.toLowerCase()] },
        explanation: consonant.toLowerCase() + ' + ' + vowel.toLowerCase() + ' dibaca ' + text(vowel) + '.'
      }, text(vowel), others.map(text));
    },

    /* Dengar suku kata, pilih tulisannya */
    syllableSound(opts) {
      const consonant = pick(d.SYLLABLE_CONSONANTS);
      const vowel = opts.letter || pick(d.VOWELS);
      const others = ui.sample(d.VOWELS.filter((v) => v !== vowel), 2);
      const text = (v) => (consonant + v).toLowerCase();
      return build({
        type: 'syllableSound', cat: 'suku', key: vowel, optionStyle: 'letter',
        prompt: 'Dengarkan bunyinya! Suku kata apa yang kamu dengar?',
        stem: { kind: 'speak', say: text(vowel), label: 'Dengarkan suku kata' },
        explanation: 'Suku kata yang diucapkan adalah ' + text(vowel) + '.'
      }, text(vowel), others.map(text));
    },

    /* Soal tetap dari data.js */
    fixed(opts) {
      const q = opts.question;
      return {
        type: 'fixed', cat: null, key: null, optionStyle: 'text',
        prompt: q.q, stem: null,
        options: q.options.slice(), answer: q.answer, explanation: q.explanation
      };
    }
  };

  function make(type, opts) {
    const builder = builders[type] || builders.sound;
    return builder(opts || {});
  }

  /* Buat beberapa soal tanpa mengulang kunci yang sama pada jenis yang sama. */
  function makeSet(types, opts) {
    const used = {};
    return types.map((type) => {
      let q = null;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        q = make(type, opts);
        const id = type + ':' + q.key;
        if (!used[id]) { used[id] = true; break; }
      }
      return q;
    });
  }

  /* ---------- Penampil soal ---------- */
  function stemHtml(q) {
    const s = q.stem;
    if (!s) return '';
    if (s.kind === 'speak') {
      return '<div class="qa__stem qa__stem--speak">' +
        '<button type="button" class="qa-speak" data-speak="' + ui.escapeHtml(s.say) + '" aria-label="' + ui.escapeHtml(s.label || 'Dengarkan') + '">' +
          ui.icon('volume') + '<span>' + ui.escapeHtml(s.label || 'Dengarkan') + '</span>' +
        '</button></div>';
    }
    if (s.kind === 'seq') {
      return '<div class="qa__stem"><div class="qa-seq" role="img" aria-label="' + ui.escapeHtml(q.prompt) + '">' +
        s.items.map((ch, i) =>
          (i ? '<span class="qa-seq__dash">-</span>' : '') +
          '<span class="qa-seq__tile' + (ch === '?' ? ' is-blank' : '') + '">' + ui.escapeHtml(ch) + '</span>'
        ).join('') + '</div></div>';
    }
    if (s.kind === 'pic') {
      return '<div class="qa__stem"><div class="qa-pic">' +
        '<img src="' + s.file + '" alt="Gambar ' + ui.escapeHtml(s.word) + '" width="120" height="120">' +
        '<button type="button" class="qa-pic__word" data-speak="' + ui.escapeHtml(s.say) + '" aria-label="Dengarkan: ' + ui.escapeHtml(s.word) + '">' +
          ui.icon('volume') + '<span>' + ui.escapeHtml(s.word) + '</span></button>' +
      '</div></div>';
    }
    if (s.kind === 'big') {
      return '<div class="qa__stem"><span class="qa-big" aria-hidden="true">' + ui.escapeHtml(s.text) + '</span></div>';
    }
    if (s.kind === 'sum') {
      return '<div class="qa__stem"><div class="qa-sum">' +
        '<span class="qa-sum__tile">' + ui.escapeHtml(s.parts[0]) + '</span><span class="qa-sum__op">+</span>' +
        '<span class="qa-sum__tile">' + ui.escapeHtml(s.parts[1]) + '</span><span class="qa-sum__op">=</span>' +
        '<span class="qa-sum__tile is-blank">?</span></div></div>';
    }
    return '';
  }

  /* Menampilkan soal di dalam container.
     opts.retry     : jawaban salah boleh diulang (materi)
     opts.onAnswer  : callback({ correct, final, firstTry, attempts, index, question })
     opts.autoSpeak : bunyikan soal suara otomatis (default true)
     opts.speakFeedback : ucapkan umpan balik (default true) */
  function render(container, q, opts) {
    const o = opts || {};
    let attempts = 0;
    let locked = false;
    let timer = null;

    container.innerHTML =
      '<div class="qa" data-type="' + q.type + '">' +
        '<p class="qa__prompt">' + ui.escapeHtml(q.prompt) + '</p>' +
        stemHtml(q) +
        '<div class="qa__options qa__options--' + q.optionStyle + ' qa__options--' + q.options.length + '" role="group" aria-label="Pilihan jawaban">' +
          q.options.map((text, index) =>
            '<button type="button" class="qa-option" data-option="' + index + '">' + ui.escapeHtml(text) + '</button>'
          ).join('') +
        '</div>' +
        '<p class="qa__feedback" role="status" hidden></p>' +
      '</div>';

    const feedback = ui.$('.qa__feedback', container);
    const buttons = ui.$$('.qa-option', container);

    function showFeedback(tone, html) {
      feedback.hidden = false;
      feedback.className = 'qa__feedback is-' + tone;
      feedback.innerHTML = html;
    }

    ui.$$('[data-speak]', container).forEach((button) => {
      button.addEventListener('click', () => {
        FLA.audio.say(button.dataset.speak, button.dataset.speak);
      });
    });

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (locked || button.disabled) return;
        const index = Number(button.dataset.option);
        const correct = index === q.answer;
        attempts += 1;

        if (correct) {
          locked = true;
          buttons.forEach((b) => { b.disabled = true; });
          button.classList.add('is-correct');
          const praiseText = praise();
          showFeedback('correct', ui.icon('check') + ' <strong>' + ui.escapeHtml(praiseText) + '</strong> ' + ui.escapeHtml(q.explanation));
          FLA.audio.sfx('correct');
          ui.burstFrom(button);
          if (o.speakFeedback !== false) FLA.audio.speak(praiseText);
        } else if (o.retry) {
          button.classList.add('is-wrong');
          button.disabled = true;
          showFeedback('wrong', ui.icon('close') + ' <strong>' + ui.escapeHtml(tryAgain()) + '</strong>');
          FLA.audio.sfx('wrong');
          if (o.speakFeedback !== false) FLA.audio.speak('Belum tepat. Ayo coba lagi!');
        } else {
          locked = true;
          buttons.forEach((b, i) => {
            b.disabled = true;
            if (i === q.answer) b.classList.add('is-correct');
          });
          button.classList.add('is-wrong');
          showFeedback('wrong', ui.icon('close') + ' <strong>Belum tepat.</strong> Jawaban yang benar: <strong>' +
            ui.escapeHtml(q.options[q.answer]) + '</strong>. ' + ui.escapeHtml(q.explanation));
          FLA.audio.sfx('wrong');
          if (o.speakFeedback !== false) FLA.audio.speak('Belum tepat. Jawaban yang benar adalah ' + q.options[q.answer] + '.');
        }

        if (typeof o.onAnswer === 'function') {
          o.onAnswer({
            correct,
            final: correct || !o.retry,
            firstTry: attempts === 1,
            attempts,
            index,
            question: q
          });
        }
      });
    });

    if (q.stem && (q.stem.kind === 'speak' || q.stem.kind === 'pic') && o.autoSpeak !== false) {
      timer = setTimeout(() => FLA.audio.say(q.stem.say, q.stem.say), 280);
    }

    return {
      destroy() {
        if (timer) clearTimeout(timer);
        locked = true;
      }
    };
  }

  /* ---------- Papan mencocokkan huruf kapital dan huruf kecil ----------
     letters : daftar huruf kapital, mis. ['A','B','C','D']
     opts.onPair({ letter, correct, firstTry })  setiap percobaan memasangkan
     opts.onComplete({ total, firstTry, mistakes })  setelah semua cocok
     Cara memasangkan: ketuk huruf kapital lalu huruf kecil (atau sebaliknya),
     atau seret satu huruf ke pasangannya (mouse). */
  function matchBoard(container, letters, opts) {
    const o = opts || {};
    const colors = ['blue', 'orange', 'green', 'pink', 'purple'];
    const uppers = ui.shuffle(letters);
    let lowers = ui.shuffle(letters);
    if (letters.length > 1) {
      let guard = 0;
      while (lowers.every((ch, i) => ch === uppers[i]) && guard < 10) { lowers = ui.shuffle(letters); guard += 1; }
    }
    const wrongs = {};
    const matched = {};
    let selected = null;
    let mistakes = 0;
    let done = false;
    let timer = null;

    const tileHtml = (side, ch) =>
      '<button type="button" class="mb-tile mb-tile--' + side + '" draggable="true" data-side="' + side + '" data-letter="' + ch + '" ' +
        'aria-label="Huruf ' + (side === 'upper' ? 'kapital ' : 'kecil ') + (side === 'upper' ? ch : ch.toLowerCase()) + '">' +
        (side === 'upper' ? ch : ch.toLowerCase()) + '</button>';

    container.innerHTML =
      '<div class="mb">' +
        '<div class="mb__col"><span class="mb__label">Huruf kapital</span>' + uppers.map((ch) => tileHtml('upper', ch)).join('') + '</div>' +
        '<div class="mb__mid" aria-hidden="true">' + ui.icon('arrow-right') + '</div>' +
        '<div class="mb__col"><span class="mb__label">Huruf kecil</span>' + lowers.map((ch) => tileHtml('lower', ch)).join('') + '</div>' +
      '</div>' +
      '<p class="qa__feedback mb__feedback" role="status" hidden></p>';

    const feedback = ui.$('.mb__feedback', container);
    const tiles = ui.$$('.mb-tile', container);
    const find = (side, ch) => tiles.find((t) => t.dataset.side === side && t.dataset.letter === ch);

    function say(message, tone) {
      feedback.hidden = false;
      feedback.className = 'qa__feedback mb__feedback is-' + tone;
      feedback.innerHTML = (tone === 'correct' ? ui.icon('check') : ui.icon('close')) + ' ' + message;
    }

    function clearSelection() {
      selected = null;
      tiles.forEach((t) => t.classList.remove('is-selected'));
    }

    function attempt(a, b) {
      /* a dan b: elemen tombol dari sisi yang berbeda */
      if (done || a === b || a.dataset.side === b.dataset.side) return;
      if (a.disabled || b.disabled) return;
      const upper = a.dataset.side === 'upper' ? a : b;
      const lower = a.dataset.side === 'lower' ? a : b;
      const letter = upper.dataset.letter;
      const correct = lower.dataset.letter === letter;
      clearSelection();

      if (correct) {
        const index = Object.keys(matched).length;
        matched[letter] = true;
        [upper, lower].forEach((t) => {
          t.disabled = true;
          t.classList.add('is-matched', 'is-' + colors[index % colors.length]);
        });
        say('<strong>' + ui.escapeHtml(praise()) + '</strong> ' + letter + ' pasangannya ' + letter.toLowerCase() + '.', 'correct');
        FLA.audio.sfx('correct');
        ui.burstFrom(lower);
        FLA.audio.say(letter.toLowerCase(), 'Huruf kapital ' + letter + ', huruf kecil ' + letter.toLowerCase());
        if (o.onPair) o.onPair({ letter, correct: true, firstTry: !wrongs[letter] });
        if (Object.keys(matched).length === letters.length) {
          done = true;
          timer = setTimeout(() => {
            if (o.onComplete) {
              const firstTry = letters.filter((ch) => !wrongs[ch]).length;
              o.onComplete({ total: letters.length, firstTry, mistakes });
            }
          }, 700);
        }
      } else {
        wrongs[letter] = (wrongs[letter] || 0) + 1;
        mistakes += 1;
        [upper, lower].forEach((t) => {
          t.classList.add('is-wrong');
          setTimeout(() => t.classList.remove('is-wrong'), 520);
        });
        say('<strong>Belum cocok.</strong> Coba pasangkan lagi, ya!', 'wrong');
        FLA.audio.sfx('wrong');
        if (o.onPair) o.onPair({ letter, correct: false, firstTry: false });
      }
    }

    tiles.forEach((tile) => {
      tile.addEventListener('click', () => {
        if (done || tile.disabled) return;
        FLA.audio.sfx('select');
        const ch = tile.dataset.letter;
        FLA.audio.say(ch.toLowerCase(), d.LETTER_NAMES[ch] || ch);
        if (!selected) {
          selected = tile;
          tile.classList.add('is-selected');
        } else if (selected === tile) {
          clearSelection();
        } else if (selected.dataset.side === tile.dataset.side) {
          clearSelection();
          selected = tile;
          tile.classList.add('is-selected');
        } else {
          attempt(selected, tile);
        }
      });

      tile.addEventListener('dragstart', (event) => {
        if (done || tile.disabled) { event.preventDefault(); return; }
        clearSelection();
        tile.classList.add('is-dragging');
        try { event.dataTransfer.setData('text/plain', tile.dataset.side + ':' + tile.dataset.letter); } catch (error) { /* abaikan */ }
        event.dataTransfer.effectAllowed = 'move';
      });
      tile.addEventListener('dragend', () => tile.classList.remove('is-dragging'));
      tile.addEventListener('dragover', (event) => {
        if (!tile.disabled) { event.preventDefault(); tile.classList.add('is-over'); }
      });
      tile.addEventListener('dragleave', () => tile.classList.remove('is-over'));
      tile.addEventListener('drop', (event) => {
        event.preventDefault();
        tile.classList.remove('is-over');
        let payload = '';
        try { payload = event.dataTransfer.getData('text/plain'); } catch (error) { payload = ''; }
        const parts = payload.split(':');
        if (parts.length !== 2) return;
        const source = find(parts[0], parts[1]);
        if (source) attempt(source, tile);
      });
    });

    return {
      destroy() {
        if (timer) clearTimeout(timer);
        done = true;
      }
    };
  }

  return { make, makeSet, render, matchBoard, praise, tryAgain };
})();
