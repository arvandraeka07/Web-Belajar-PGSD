/* ============================================================
   FUN LEARNING ADVENTURE — Halaman Evaluasi
   Paket soal pilihan ganda, soal & opsi diacak, pembahasan,
   predikat, dan riwayat nilai di localStorage.
   ============================================================ */

window.FLA = window.FLA || {};
FLA.pages = FLA.pages || {};

FLA.pages.evaluation = (function () {
  'use strict';

  const ui = FLA.ui;
  const data = FLA.data;

  const packageIcons = {
    huruf: 'assets/images/om-1F4DD.svg'
  };

  let root = null;
  let pkg = null;
  let questions = [];
  let currentIndex = 0;
  let answers = [];
  let finished = false;
  let activeView = null;

  function getPackage(id) {
    return data.evaluations.find((item) => item.id === id);
  }

  function getPredicate(score) {
    return data.predicates.find((predicate) => score >= predicate.min) || data.predicates[data.predicates.length - 1];
  }

  /* ---------- Lobi ---------- */

  function renderLobby() {
    pkg = null;
    questions = [];
    currentIndex = 0;
    answers = [];
    finished = false;

    const history = FLA.progress.getEvaluationHistory(5);

    root.innerHTML =
      '<div class="page-shell">' +
        '<div class="page-heading">' +
          '<a href="#/beranda" class="back-link">' + ui.icon('arrow-left') + ' Beranda</a>' +
          '<div class="page-heading__row">' +
            '<div>' +
              '<span class="eyebrow">Menu Evaluasi</span>' +
              '<h1>Uji Kemampuanmu</h1>' +
              '<p class="page-lead">Jawab 10 soal interaktif tentang huruf. Setelah menjawab, kamu langsung tahu benar atau salah.</p>' +
            '</div>' +
            '<img class="page-heading__mascot" src="assets/images/mascot-huhu.svg" alt="Huhu si burung hantu">' +
          '</div>' +
        '</div>' +
        '<div class="evaluation-grid">' +
          data.evaluations.map((item) => {
            const record = FLA.progress.getEvaluationRecord(item.id);
            const attempted = record.attempts > 0;
            const stars = record.stars || 0;
            return '<article class="eval-card eval-card--' + item.color + '">' +
              '<div class="eval-card__head">' +
                '<span class="eval-card__icon"><img src="' + packageIcons[item.id] + '" alt="" width="58" height="58"></span>' +
                              '</div>' +
              '<h2>' + ui.escapeHtml(item.title) + '</h2>' +
              '<p>' + ui.escapeHtml(item.description) + '</p>' +
              '<ul class="eval-meta">' +
                item.variations.map((v) => '<li>' + ui.icon(v.icon) + ' ' + ui.escapeHtml(v.label) + '</li>').join('') +
              '</ul>' +
              '<div class="eval-card__score">' +
                (attempted
                  ? '<div><span>Nilai terbaik</span><strong>' + record.bestScore + '</strong></div>' +
                    '<div class="eval-card__stars">' + ui.starRow(stars, 3) + '</div>' +
                    '<span class="eval-card__attempts">' + record.attempts + 'x dicoba</span>'
                  : '<span class="eval-card__attempts">Belum pernah dicoba</span>') +
              '</div>' +
              '<button type="button" class="btn btn--' + (item.color === 'green' ? 'green' : item.color === 'yellow' ? 'yellow' : 'blue') + ' btn--block" data-start-eval="' + item.id + '">' +
                ui.icon('play') + ' ' + (attempted ? 'Coba Lagi' : 'Mulai Evaluasi') +
              '</button>' +
            '</article>';
          }).join('') +
        '</div>' +
        '<div class="eval-bottom">' +
          '<div class="card eval-history">' +
            '<div class="section-head section-head--compact">' +
              '<h2>Hasil Terakhir</h2>' +
              '<span class="muted">Tersimpan di perangkat ini</span>' +
            '</div>' +
            (history.length
              ? '<ul class="history-list">' + history.map((item) => {
                  const itemPkg = getPackage(item.packageId);
                  const predicate = getPredicate(item.score);
                  return '<li>' +
                    '<span class="history-score history-score--' + predicate.tone + '">' + item.score + '</span>' +
                    '<span class="history-main"><strong>' + ui.escapeHtml(itemPkg ? itemPkg.title : 'Evaluasi') + '</strong>' +
                      '<span>' + ui.formatDate(item.date) + ' · benar ' + item.correct + '/' + item.total + '</span></span>' +
                    '<span class="tag tag--soft">' + ui.escapeHtml(predicate.label) + '</span>' +
                  '</li>';
                }).join('') + '</ul>'
              : '<div class="empty-state">' + ui.icon('clipboard') + '<p>Belum ada hasil. Mulai evaluasi pertamamu, ya!</p></div>') +
          '</div>' +
          '<div class="tip-card tip-card--large">' +
            '<img src="assets/images/om-1F4A1.svg" alt="" width="52" height="52">' +
            '<p><strong>Tips sebelum evaluasi:</strong> tonton video dan baca materi dulu. Tidak ada batas waktu, jadi dengarkan dan jawab dengan teliti.</p>' +
            '<a class="btn btn--ghost btn--sm" href="#/progres">' + ui.icon('chart') + ' Lihat Perkembangan Belajar</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    root.querySelectorAll('[data-start-eval]').forEach((button) => {
      button.addEventListener('click', () => {
        FLA.audio.sfx('click');
        startEvaluation(button.dataset.startEval);
      });
    });
  }

  /* ---------- Mulai ---------- */

  function startEvaluation(id) {
    const selectedPackage = getPackage(id);
    if (!selectedPackage) return;
    pkg = selectedPackage;

    questions = FLA.quiz.makeSet(ui.shuffle(selectedPackage.plan)).map((question) => ({
      q: question.prompt,
      explanation: question.explanation,
      options: question.options.map((text) => ({ text })),
      correctIndex: question.answer,
      source: question
    }));
    currentIndex = 0;
    answers = [];
    finished = false;
    renderQuestion();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderQuestion() {
    const question = questions[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
    const isLast = currentIndex === questions.length - 1;
    if (activeView) activeView.destroy();

    root.innerHTML =
      '<div class="page-shell eval-exam">' +
        '<div class="exam-top">' +
          '<button type="button" class="back-link" id="exitExam">' + ui.icon('arrow-left') + ' Keluar</button>' +
          '<div class="exam-top__title">' +
                        '<strong>' + ui.escapeHtml(pkg.title) + '</strong>' +
          '</div>' +
          '<span class="exam-counter">Soal <strong>' + (currentIndex + 1) + '</strong> dari ' + questions.length + '</span>' +
        '</div>' +
        '<div class="progress-track progress-track--exam"><span style="width:' + progressPercent + '%"></span></div>' +
        '<div class="exam-card question-enter" id="examCard">' +
          '<span class="exam-number">Soal ' + (currentIndex + 1) + '</span>' +
          '<div id="examQa"></div>' +
          '<div class="exam-actions">' +
            '<span class="exam-hint" id="examHint">Pilih satu jawaban.</span>' +
            '<button type="button" class="btn btn--yellow btn--lg" id="nextQuestion" disabled>' +
              (isLast ? 'Selesai &amp; Lihat Nilai' : 'Lanjut') + ' ' + ui.icon('arrow-right') +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="exam-dots" aria-hidden="true">' +
          questions.map((_, index) =>
            '<span class="exam-dot ' + (index < currentIndex ? 'is-done' : '') + (index === currentIndex ? ' is-current' : '') + '"></span>'
          ).join('') +
        '</div>' +
      '</div>';

    ui.$('#exitExam', root).addEventListener('click', async () => {
      const leave = await ui.confirmDialog({
        title: 'Keluar dari evaluasi?',
        message: 'Jawabanmu belum akan dinilai jika keluar sekarang.',
        confirmLabel: 'Ya, keluar',
        cancelLabel: 'Lanjut menjawab',
        danger: true
      });
      if (leave) {
        FLA.audio.stopSpeech();
        renderLobby();
      }
    });

    activeView = FLA.quiz.render(ui.$('#examQa', root), question.source, {
      retry: false,
      onAnswer: (result) => {
        answers[currentIndex] = result.index;
        const src = question.source;
        if (src.cat) FLA.progress.recordItem(src.cat, src.key, result.correct);
        ui.$('#nextQuestion', root).disabled = false;
        ui.$('#examHint', root).textContent = result.correct ? 'Jawabanmu benar!' : 'Perhatikan jawaban yang benar, lalu lanjut.';
      }
    });

    ui.$('#nextQuestion', root).addEventListener('click', () => {
      if (answers[currentIndex] === undefined) return;
      FLA.audio.sfx('click');
      FLA.audio.stopSpeech();
      if (isLast) {
        finishEvaluation();
      } else {
        currentIndex += 1;
        renderQuestion();
        ui.$('#examCard', root).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /* ---------- Hasil ---------- */

  function finishEvaluation() {
    if (finished) return;
    finished = true;
    const total = questions.length;
    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctIndex) correct += 1;
    });
    const score = Math.round((correct / total) * 100);
    const predicate = getPredicate(score);
    const stars = score >= 90 ? 3 : score >= 75 ? 2 : score >= 60 ? 1 : 0;
    const reward = FLA.progress.recordEvaluation(pkg.id, pkg.title, score, correct, total);
    const record = FLA.progress.getEvaluationRecord(pkg.id);

    if (score >= 75) {
      FLA.audio.sfx('win');
      ui.confetti(100);
    } else if (score >= 60) {
      FLA.audio.sfx('star');
      ui.confetti(50);
    } else {
      FLA.audio.sfx('pop');
    }

    FLA.audio.speak('Nilaimu ' + score + '. ' + (stars ? 'Kamu mendapat ' + stars + ' bintang!' : 'Ayo belajar lagi, ya!'));
    const rewardBits = [];
    if (reward.points > 0) {
      rewardBits.push(ui.icon('bolt') + ' +' + reward.points + ' poin');
    }
    if (reward.stars > 0) {
      rewardBits.push(ui.icon('star') + ' +' + reward.stars + ' bintang');
    }
    const rewardMarkup = rewardBits.length
      ? rewardBits.join('<span class="reward-pill__sep"></span>')
      : ui.icon('check') + ' Latihan selesai';
    root.innerHTML =
      '<div class="page-shell eval-result">' +
        '<div class="result-card result-card--' + predicate.tone + '">' +
          '<div class="result-hero">' +
            '<img src="assets/images/mascot-huhu.svg" alt="" width="120" height="120" class="result-hero__mascot">' +
            '<span class="eyebrow">Hasil Evaluasi</span>' +
            '<h1>' + ui.escapeHtml(predicate.label) + '</h1>' +
            '<p>' + ui.escapeHtml(predicate.message) + '</p>' +
            '<div class="score-ring" style="--score:' + score + '">' +
              '<div class="score-ring__inner"><strong>' + score + '</strong><span>dari 100</span></div>' +
            '</div>' +
            '<div class="result-stars">' + ui.starRow(stars, 3) + '</div>' +
            '<p class="result-meta">Jawaban benar <strong>' + correct + '</strong> dari ' + total + ' soal</p>' +
            '<div class="reward-pill">' + rewardMarkup + '</div>' +
            (record.bestScore > score ? '<p class="result-note">Nilai terbaikmu tetap ' + record.bestScore + '. Terus semangat!</p>' : '') +
            '<div class="result-actions">' +
              '<button type="button" class="btn btn--yellow btn--lg" id="retryEval">' + ui.icon('rotate') + ' Ulangi Evaluasi</button>' +
              '<a class="btn btn--ghost" href="#/progres">' + ui.icon('chart') + ' Perkembangan</a>' +
              '<a class="btn btn--ghost" href="#/beranda">' + ui.icon('home') + ' Beranda</a>' +
            '</div>' +
          '</div>' +
          '<div class="review-section">' +
            '<div class="review-head">' +
              '<div><span class="eyebrow">Pembahasan</span><h2>Periksa jawabanmu</h2></div>' +
              '<span class="muted">Hasil tersimpan otomatis</span>' +
            '</div>' +
            '<div class="review-list">' +
              questions.map((question, index) => {
                const userIndex = answers[index];
                const isCorrect = userIndex === question.correctIndex;
                const userText = userIndex === undefined ? 'Tidak dijawab' : question.options[userIndex].text;
                return '<article class="review-item ' + (isCorrect ? 'is-correct' : 'is-wrong') + '">' +
                  '<div class="review-item__top">' +
                    '<span class="review-number">' + (index + 1) + '</span>' +
                    '<p>' + ui.escapeHtml(question.q) + '</p>' +
                    '<span class="review-badge">' + (isCorrect ? ui.icon('check') + ' Benar' : ui.icon('close') + ' Salah') + '</span>' +
                  '</div>' +
                  '<p class="review-line"><span>Jawabanmu</span><strong>' + ui.escapeHtml(userText) + '</strong></p>' +
                  '<p class="review-line review-line--correct"><span>Jawaban benar</span><strong>' + ui.escapeHtml(question.options[question.correctIndex].text) + '</strong></p>' +
                  '<p class="review-explain">' + ui.icon('info') + ' ' + ui.escapeHtml(question.explanation) + '</p>' +
                '</article>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    ui.$('#retryEval', root).addEventListener('click', () => {
      FLA.audio.sfx('click');
      startEvaluation(pkg.id);
    });
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function enter(container) {
    root = container;
    renderLobby();
  }

  function leave() {
    if (activeView) activeView.destroy();
    activeView = null;
    FLA.audio.stopSpeech();
    root = null;
    pkg = null;
    finished = false;
  }

  return { enter, leave };
})();
