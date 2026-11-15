/* ============================================================
   FUN LEARNING ADVENTURE — Progres & Gamifikasi
   Menyimpan poin, bintang, badge, dan riwayat aktivitas di
   localStorage agar tidak hilang saat halaman dimuat ulang.
   ============================================================ */

window.FLA = window.FLA || {};

FLA.progress = (function () {
  'use strict';

  const STORAGE_KEY = 'fla_huruf_progress_v1';
  const VERSION = 1;

  const ui = window.FLA.ui;

  function createDefaultState() {
    return {
      version: VERSION,
      points: 0,
      stars: 0,
      badges: [],
      videos: {},
      materials: {},
      games: {},
      evaluations: {},
      items: {},
      recent: []
    };
  }

  class ProgressStore {
    constructor() {
      this.state = this.load();
      this.badgeQueue = [];
      this.showingBadge = false;
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createDefaultState();
        const parsed = JSON.parse(raw);
        const base = createDefaultState();
        return {
          ...base,
          ...parsed,
          badges: Array.isArray(parsed.badges) ? parsed.badges : [],
          items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {},
          recent: Array.isArray(parsed.recent) ? parsed.recent : []
        };
      } catch (error) {
        return createDefaultState();
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (error) {
        ui.toast('Progres belum bisa disimpan. Penyimpanan browser mungkin penuh.', { tone: 'warning', icon: 'info' });
      }
    }

    refresh() {
      if (typeof FLA.refreshHUD === 'function') FLA.refreshHUD();
    }

    addRecent(entry) {
      this.state.recent.unshift({
        type: entry.type,
        title: entry.title,
        points: entry.points || 0,
        stars: entry.stars || 0,
        date: new Date().toISOString()
      });
      this.state.recent = this.state.recent.slice(0, 15);
    }

    /* ---------- Materi ---------- */

    getMaterialRecord(topicId) {
      return this.state.materials[topicId] || { answers: {}, completed: false };
    }

    isSubbabAnswered(topicId, index) {
      const record = this.getMaterialRecord(topicId);
      return Boolean(record.answers && record.answers[index]);
    }

    answerSubbab(topicId, index) {
      if (!this.state.materials[topicId]) {
        this.state.materials[topicId] = { answers: {}, completed: false };
      }
      const record = this.state.materials[topicId];
      if (!record.answers) record.answers = {};
      if (record.answers[index]) return { firstTime: false, points: 0 };

      record.answers[index] = true;
      this.state.points += 2;
      this.save();
      this.refresh();
      this.checkBadges();
      return { firstTime: true, points: 2 };
    }

    completeMaterial(topicId, title) {
      if (!this.state.materials[topicId]) {
        this.state.materials[topicId] = { answers: {}, completed: false };
      }
      const record = this.state.materials[topicId];
      if (record.completed) {
        return { already: true, points: 0, stars: 0 };
      }
      record.completed = true;
      record.completedAt = new Date().toISOString();
      this.state.points += 15;
      this.state.stars += 3;
      this.addRecent({ type: 'materi', title, points: 15, stars: 3 });
      this.save();
      this.refresh();
      this.checkBadges();
      return { already: false, points: 15, stars: 3 };
    }

    answeredSubbabCount() {
      return Object.keys(this.state.materials).reduce((total, topicId) => {
        const answers = this.state.materials[topicId].answers || {};
        return total + Object.keys(answers).filter((key) => answers[key]).length;
      }, 0);
    }

    completedMaterialCount() {
      return Object.keys(this.state.materials).filter((id) => this.state.materials[id].completed).length;
    }

    /* ---------- Video ---------- */

    getVideoRecord(id) {
      return this.state.videos[id] || null;
    }

    completeVideo(id, title, correct, total) {
      const previous = this.state.videos[id];
      this.state.videos[id] = {
        completed: true,
        correct,
        total,
        completedAt: new Date().toISOString()
      };
      if (previous && previous.completed) {
        this.save();
        this.refresh();
        return { already: true, points: 0, stars: 0 };
      }
      this.state.points += 10;
      this.state.stars += 1;
      this.addRecent({ type: 'video', title, points: 10, stars: 1 });
      this.save();
      this.refresh();
      this.checkBadges();
      return { already: false, points: 10, stars: 1 };
    }

    completedVideoCount() {
      return Object.keys(this.state.videos).filter((id) => this.state.videos[id].completed).length;
    }

    /* ---------- Game ---------- */

    getGameRecord(id) {
      return this.state.games[id] || { plays: 0, bestScore: 0, maxScore: 0, stars: 0 };
    }

    recordGame(id, title, score, maxScore, stars) {
      const record = this.getGameRecord(id);
      const isNewBest = score > record.bestScore;
      const points = Math.max(2, Math.round(score / 5));
      const oldStars = record.stars || 0;
      const newStars = Math.max(0, Math.min(3, stars || 0) - oldStars);
      this.state.games[id] = {
        plays: (record.plays || 0) + 1,
        bestScore: Math.max(record.bestScore || 0, score),
        maxScore: maxScore,
        stars: Math.max(oldStars, Math.min(3, stars || 0)),
        lastScore: score,
        lastPlayed: new Date().toISOString()
      };
      this.state.points += points;
      this.state.stars += newStars;
      this.addRecent({
        type: 'game',
        title: title + (isNewBest ? ' — rekor baru!' : ''),
        points,
        stars: newStars
      });
      this.save();
      this.refresh();
      this.checkBadges();
      return { points, stars: newStars, isNewBest, bestScore: this.state.games[id].bestScore };
    }

    /* Pos dianggap selesai bila mendapat minimal 1 bintang. */
    isGameDone(id) {
      const record = this.state.games[id];
      return Boolean(record && (record.stars || 0) >= 1);
    }

    playedGameCount() {
      return Object.keys(this.state.games).filter((id) => this.isGameDone(id)).length;
    }

    /* Pos 1 selalu terbuka; pos berikutnya terbuka setelah pos sebelumnya selesai. */
    isPosUnlocked(id) {
      const list = window.FLA.data.adventure;
      const index = list.findIndex((pos) => pos.id === id);
      if (index <= 0) return index === 0;
      return this.isGameDone(list[index - 1].id);
    }

    /* ---------- Evaluasi ---------- */

    getEvaluationRecord(id) {
      return this.state.evaluations[id] || { attempts: 0, bestScore: 0, stars: 0, history: [] };
    }

    recordEvaluation(id, title, score, correct, total) {
      const record = this.getEvaluationRecord(id);
      const stars = score >= 90 ? 3 : score >= 75 ? 2 : score >= 60 ? 1 : 0;
      const oldStars = record.stars || 0;
      const newStars = Math.max(0, stars - oldStars);
      const points = Math.max(5, Math.round(score / 2));
      const isNewBest = score > (record.bestScore || 0);

      this.state.evaluations[id] = {
        attempts: (record.attempts || 0) + 1,
        bestScore: Math.max(record.bestScore || 0, score),
        stars: Math.max(oldStars, stars),
        lastScore: score,
        lastDate: new Date().toISOString(),
        history: [{
          score,
          correct,
          total,
          date: new Date().toISOString()
        }].concat(record.history || []).slice(0, 10)
      };
      this.state.points += points;
      this.state.stars += newStars;
      this.addRecent({
        type: 'evaluasi',
        title: title + ' — nilai ' + score,
        points,
        stars: newStars
      });
      this.save();
      this.refresh();
      this.checkBadges();
      return { points, stars: newStars, isNewBest, bestScore: this.state.evaluations[id].bestScore };
    }

    evaluatedPackageCount() {
      return Object.keys(this.state.evaluations).filter((id) => this.state.evaluations[id].attempts > 0).length;
    }

    getEvaluationHistory(limit) {
      const all = [];
      Object.keys(this.state.evaluations).forEach((id) => {
        const record = this.state.evaluations[id];
        (record.history || []).forEach((item) => {
          all.push({ ...item, packageId: id });
        });
      });
      return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit || 5);
    }

    /* ---------- Catatan per huruf / pasangan / vokal ----------
       Setiap jawaban disimpan per kategori ('huruf', 'cocok', 'suku')
       dan per kunci (A, A-a, I, dst.) agar guru bisa melihat grafiknya. */

    recordItem(category, key, correct) {
      if (!category || !key) return;
      const id = category + ':' + key;
      const record = this.state.items[id] || { c: 0, w: 0 };
      if (correct) record.c += 1;
      else record.w += 1;
      record.last = new Date().toISOString();
      this.state.items[id] = record;
      this.save();
    }

    getItem(category, key) {
      return this.state.items[category + ':' + key] || { c: 0, w: 0 };
    }

    /* Dikuasai: minimal 3 jawaban benar dan ketepatan >= 70%. */
    getItemStatus(category, key) {
      const item = this.getItem(category, key);
      const total = item.c + item.w;
      if (!total) return 'new';
      return item.c >= 3 && item.c / total >= 0.7 ? 'mastered' : 'practice';
    }

    getCategoryStats(categoryId) {
      const category = window.FLA.data.categories.find((entry) => entry.id === categoryId);
      if (!category) return null;
      const items = category.keys.map((key) => {
        const item = this.getItem(category.id, key);
        return { key, label: category.keyLabel(key), correct: item.c, wrong: item.w, status: this.getItemStatus(category.id, key) };
      });
      const attempted = items.filter((item) => item.status !== 'new');
      const material = this.state.materials[category.material];
      const gameRecord = this.state.games[category.pos];
      const materialStars = material && material.completed ? 3 : 0;
      const gameStars = gameRecord ? Math.min(3, gameRecord.stars || 0) : 0;
      const totalCorrect = items.reduce((sum, item) => sum + item.correct, 0);
      const totalWrong = items.reduce((sum, item) => sum + item.wrong, 0);
      return {
        category,
        items,
        attempted,
        mastered: items.filter((item) => item.status === 'mastered'),
        practice: items.filter((item) => item.status === 'practice'),
        untouched: items.filter((item) => item.status === 'new'),
        stars: materialStars + gameStars,
        maxStars: 6,
        totalCorrect,
        totalWrong
      };
    }

    /* ---------- Statistik ---------- */

    getStats() {
      const subbabDone = this.answeredSubbabCount();
      const videoDone = this.completedVideoCount();
      const gameDone = this.playedGameCount();
      const evaluationDone = this.evaluatedPackageCount();
      const totalSteps = 1 + 10 + 3 + 1;
      const doneSteps = videoDone + subbabDone + gameDone + evaluationDone;
      return {
        points: this.state.points,
        stars: this.state.stars,
        badges: this.state.badges.length,
        badgeTotal: window.FLA.data.badges.length,
        subbabDone,
        subbabTotal: 10,
        videoDone,
        videoTotal: 1,
        gameDone,
        gameTotal: 3,
        evaluationDone,
        evaluationTotal: 1,
        materialDone: this.completedMaterialCount(),
        doneSteps,
        totalSteps,
        percent: Math.round((doneSteps / totalSteps) * 100)
      };
    }

    getMenuProgress(menu) {
      const stats = this.getStats();
      if (menu === 'video') return { done: stats.videoDone, total: stats.videoTotal };
      if (menu === 'materi') return { done: stats.subbabDone, total: stats.subbabTotal };
      if (menu === 'game') return { done: stats.gameDone, total: stats.gameTotal };
      if (menu === 'evaluasi') return { done: stats.evaluationDone, total: stats.evaluationTotal };
      return { done: stats.doneSteps, total: stats.totalSteps };
    }

    getRecent(limit) {
      return this.state.recent.slice(0, limit || 6);
    }

    hasBadge(id) {
      return this.state.badges.indexOf(id) !== -1;
    }

    /* ---------- Badge ---------- */

    checkBadges() {
      const stats = this.getStats();
      const candidates = [];
      const add = (id) => {
        if (!this.hasBadge(id) && this.state.badges.indexOf(id) === -1 && candidates.indexOf(id) === -1) {
          candidates.push(id);
        }
      };

      if (this.state.recent.length >= 1) add('first-step');
      if (this.state.stars >= 1) add('first-star');
      if (this.state.stars >= 10) add('star-10');
      if (stats.videoDone >= 1) add('video-1');
      if (stats.materialDone >= 1) add('materi-1');
      if (stats.gameDone >= 3) add('pos-3');
      if (Object.keys(this.state.evaluations).some((id) => this.state.evaluations[id].bestScore === 100)) add('perfect');
      if (this.state.points >= 300) add('point-300');

      if (!candidates.length) return [];

      this.state.badges = this.state.badges.concat(candidates);
      this.save();
      this.refresh();
      candidates.forEach((id) => this.badgeQueue.push(id));
      this.showNextBadge();
      return candidates;
    }

    showNextBadge() {
      if (this.showingBadge || !this.badgeQueue.length) return;
      const badgeId = this.badgeQueue.shift();
      const badge = window.FLA.data.badges.find((item) => item.id === badgeId);
      if (!badge) {
        this.showNextBadge();
        return;
      }
      this.showingBadge = true;
      window.FLA.audio.sfx('win');
      ui.confetti(70);
      ui.openModal({
        className: 'modal-card--badge',
        body:
          '<div class="badge-celebrate">' +
            '<div class="badge-celebrate__glow"></div>' +
            '<img class="badge-celebrate__icon" src="' + badge.icon + '" alt="" width="120" height="120">' +
            '<p class="badge-celebrate__kicker">Penghargaan Baru!</p>' +
            '<h2 class="badge-celebrate__title">' + ui.escapeHtml(badge.name) + '</h2>' +
            '<p class="badge-celebrate__desc">' + ui.escapeHtml(badge.desc) + '</p>' +
          '</div>',
        actions: [{ label: 'Lanjut', variant: 'btn--yellow', icon: 'sparkles' }],
        onClose: () => {
          this.showingBadge = false;
          setTimeout(() => this.showNextBadge(), 260);
        }
      });
    }

    reset() {
      this.state = createDefaultState();
      this.badgeQueue = [];
      this.save();
      this.refresh();
    }
  }

  return new ProgressStore();
})();
