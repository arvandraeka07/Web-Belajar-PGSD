/* ============================================================
   FUN LEARNING ADVENTURE — Halaman Materi
   Daftar topik, pembaca materi bergambar, narasi audio,
   pertanyaan pemahaman, dan ringkasan.
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

  function getTopic(id) {
    return data.materials.find((item) => item.id === id);
  }

  function answeredCount(topic) {
    const record = FLA.progress.getMaterialRecord(topic.id);
    return topic.subbabs.filter((_, index) => record.answers && record.answers[index]).length;
  }

  /* ---------- Daftar materi ---------- */

  function renderList() {
    topicId = null;
    step = 0;
    stopNarration();
    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="page-heading">' +
          '<a href="#/beranda" class="back-link">' + ui.icon('arrow-left') + ' Beranda</a>' +
          '<div class="page-heading__row">' +
            '<div>' +
              '<span class="eyebrow">Menu Materi</span>' +
              '<h1>Baca &amp; Temukan</h1>' +
              '<p class="page-lead">Pilih topik favoritmu. Ada bacaan bergambar, audio, dan pertanyaan seru di setiap subbab.</p>' +
            '</div>' +
            '<img class="page-heading__mascot" src="assets/images/mascot-huhu.svg" alt="Huhu si burung hantu">' +
          '</div>' +
        '</div>' +
        '<div class="material-grid">' +
          data.materials.map((topic) => {
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
                  '<span class="tag">' + ui.escapeHtml(topic.grade) + '</span>' +
                '</div>' +
                '<h2>' + ui.escapeHtml(topic.title) + '</h2>' +
                '<p>' + ui.escapeHtml(topic.blurb) + '</p>' +
                '<div class="material-card__progress">' +
                  '<div class="progress-track progress-track--sm"><span style="width:' + percent + '%"></span></div>' +
                  '<span>' + done + '/' + total + ' subbab</span>' +
                '</div>' +
                '<button type="button" class="btn btn--' + (topic.color === 'blue' ? 'blue' : topic.color === 'yellow' ? 'yellow' : 'green') + ' btn--block" data-open-topic="' + topic.id + '">' +
                  ui.icon('book') + ' ' + (record.completed ? 'Baca Lagi' : 'Buka Materi') +
                '</button>' +
              '</div>' +
            '</article>';
          }).join('') +
        '</div>' +
        '<div class="material-footnote">' +
          '<img src="assets/images/om-1F4A1.svg" alt="" width="42" height="42">' +
          '<p><strong>Belajar pelan-pelan tidak apa-apa.</strong> Jawab pertanyaan di setiap subbab untuk mengumpulkan poin, lalu selesaikan ringkasan untuk mendapat 2 bintang.</p>' +
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
    renderReader();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderReader() {
    const topic = getTopic(topicId);
    if (!topic) return;
    stopNarration();
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

    let content = '';
    if (isSummary) {
      content = renderSummary(topic, answered, record);
    } else {
      content = renderSubbab(topic, subbab, step);
    }

    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="reader-top">' +
          '<button type="button" class="back-link" id="backToMaterials">' + ui.icon('arrow-left') + ' Semua Materi</button>' +
          '<div class="tag-row">' +
            '<span class="tag tag--' + topic.color + '">' + ui.escapeHtml(topic.subject) + '</span>' +
            '<span class="tag">' + ui.escapeHtml(topic.grade) + '</span>' +
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
  }

  function renderSubbab(topic, subbab, index) {
    const record = FLA.progress.getMaterialRecord(topic.id);
    const answered = record.answers && record.answers[index];
    const correctOption = subbab.question.answer;

    return '<div class="reader-body">' +
      '<h1>' + ui.escapeHtml(subbab.title) + '</h1>' +
      '<div class="reader-tools">' +
        '<button type="button" class="btn btn--audio" id="narrateBtn">' +
          ui.icon('volume') + ' <span>' + (narrationOn ? 'Berhenti Membaca' : 'Bacakan Materi') + '</span>' +
        '</button>' +
        '<span class="reader-tools__hint">' + ui.icon('sparkles') + ' Dengarkan dengan saksama</span>' +
      '</div>' +
      subbab.paragraphs.map((paragraph) => '<p class="reader-paragraph">' + ui.escapeHtml(paragraph) + '</p>').join('') +
      '<div class="fun-fact">' +
        '<span class="fun-fact__icon">' + ui.icon('sparkles') + '</span>' +
        '<p><strong>Tahukah kamu?</strong> ' + ui.escapeHtml(subbab.funFact) + '</p>' +
      '</div>' +
      '<div class="quick-check ' + (answered ? 'is-answered' : '') + '" id="quickCheck">' +
        '<div class="quick-check__head">' +
          '<span class="quick-check__icon">' + ui.icon('question') + '</span>' +
          '<div><strong>Cek Pemahaman</strong><p>' + ui.escapeHtml(subbab.question.q) + '</p></div>' +
        '</div>' +
        '<div class="quick-options">' +
          subbab.question.options.map((option, optionIndex) =>
            '<button type="button" class="quick-option ' +
              (answered && optionIndex === correctOption ? 'is-correct' : '') + '" data-option="' + optionIndex + '" ' +
              (answered ? 'disabled' : '') + '>' +
              '<span class="quick-option__letter">' + String.fromCharCode(65 + optionIndex) + '</span>' +
              '<span>' + ui.escapeHtml(option) + '</span>' +
            '</button>'
          ).join('') +
        '</div>' +
        '<p class="quick-feedback" id="quickFeedback" ' + (answered ? '' : 'hidden') + '>' +
          (answered ? ui.icon('check') + ' <strong>Sudah dijawab benar!</strong> ' + ui.escapeHtml(subbab.question.explanation) : '') +
        '</p>' +
      '</div>' +
    '</div>';
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
        '<div class="summary-progress__row"><span>Pertanyaan subbab</span><strong>' + answered + '/' + total + '</strong></div>' +
        '<div class="progress-track"><span style="width:' + Math.round((answered / total) * 100) + '%"></span></div>' +
      '</div>' +
      (done
        ? '<div class="finish-panel finish-panel--done">' +
            '<img src="assets/images/mascot-huhu.svg" alt="" width="96" height="96">' +
            '<div><span class="completion-card__kicker">Materi selesai</span>' +
            '<h3>Kamu hebat!</h3>' +
            '<p>Topik ini sudah selesai. Kamu bisa membacanya lagi kapan saja.</p></div>' +
            '<div class="completion-card__stars">' + ui.starRow(2, 3) + '</div>' +
          '</div>'
        : allAnswered
          ? '<div class="finish-panel">' +
              '<img src="assets/images/mascot-huhu.svg" alt="" width="96" height="96">' +
              '<div><h3>Siap mendapat bintang?</h3><p>Semua pertanyaan sudah dijawab. Ambil hadiahmu sekarang!</p></div>' +
              '<button type="button" class="btn btn--yellow btn--lg" id="claimMaterial">' + ui.icon('star') + ' Ambil Bintang</button>' +
            '</div>'
          : '<div class="notice notice--info">' +
              ui.icon('info') + ' Jawab pertanyaan di setiap subbab dulu, ya. Masih ada ' + (total - answered) + ' pertanyaan yang belum benar.' +
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

    const quickCheck = ui.$('#quickCheck', root);
    if (quickCheck && !quickCheck.classList.contains('is-answered')) {
      quickCheck.addEventListener('click', (event) => {
        const button = event.target.closest('.quick-option');
        if (!button) return;
        handleQuickAnswer(topic, step, button);
      });
    }

    const claim = ui.$('#claimMaterial', root);
    if (claim) {
      claim.addEventListener('click', () => {
        const result = FLA.progress.completeMaterial(topic.id, topic.title);
        if (!result.already) {
          FLA.audio.sfx('win');
          ui.confetti(90);
          ui.toast('Materi selesai! +15 poin dan +2 bintang.', {
            tone: 'success', icon: 'star', title: 'Luar biasa!'
          });
        }
        renderReader();
      });
    }
  }

  function handleQuickAnswer(topic, index, button) {
    const subbab = topic.subbabs[index];
    const answer = Number(button.dataset.option);
    const feedback = ui.$('#quickFeedback', root);
    if (answer === subbab.question.answer) {
      const result = FLA.progress.answerSubbab(topic.id, index);
      button.classList.add('is-correct');
      ui.$$('.quick-option', root).forEach((option) => { option.disabled = true; });
      if (feedback) {
        feedback.hidden = false;
        feedback.className = 'quick-feedback is-correct';
        feedback.innerHTML = ui.icon('check') + ' <strong>Benar!</strong> ' +
          ui.escapeHtml(subbab.question.explanation) +
          (result.firstTime ? ' <span class="points-chip">+2 poin</span>' : '');
      }
      FLA.audio.sfx('correct');
      ui.burstFrom(button);
    } else {
      button.classList.add('is-wrong');
      button.disabled = true;
      if (feedback) {
        feedback.hidden = false;
        feedback.className = 'quick-feedback is-wrong';
        feedback.innerHTML = ui.icon('close') + ' <strong>Belum tepat.</strong> Coba pilihan lain, ya!';
      }
      FLA.audio.sfx('wrong');
      setTimeout(() => button.classList.remove('is-wrong'), 600);
    }
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
    const subbab = step < topic.subbabs.length ? topic.subbabs[step] : null;
    const text = subbab
      ? subbab.title + '. ' + subbab.paragraphs.join(' ') + ' Tahukah kamu? ' + subbab.funFact
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
    renderList();
  }

  function leave() {
    FLA.audio.stopSpeech();
    narrationOn = false;
    root = null;
    topicId = null;
  }

  return { enter, leave };
})();
