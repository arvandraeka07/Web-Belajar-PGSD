/* ============================================================
   FUN LEARNING ADVENTURE — Aplikasi Utama
   Router hash, beranda, halaman progres, panel audio, dan HUD.
   ============================================================ */

window.FLA = window.FLA || {};

(function () {
  'use strict';

  const ui = FLA.ui;
  const data = FLA.data;
  const progress = FLA.progress;

  const menus = [
    {
      route: 'video',
      label: 'Video',
      title: 'Nonton & Belajar',
      desc: 'Tiga video animasi dengan subtitle dan kuis kilat.',
      color: 'blue',
      icon: 'assets/images/om-1F3AC.svg',
      unit: 'video'
    },
    {
      route: 'materi',
      label: 'Materi',
      title: 'Baca & Temukan',
      desc: 'Bacaan bergambar, narasi suara, dan pertanyaan pemahaman.',
      color: 'yellow',
      icon: 'assets/images/om-1F4DA.svg',
      unit: 'subbab'
    },
    {
      route: 'game',
      label: 'Game',
      title: 'Main Sambil Belajar',
      desc: 'Lima permainan interaktif dengan skor dan bintang.',
      color: 'green',
      icon: 'assets/images/om-1F3AE.svg',
      unit: 'permainan'
    },
    {
      route: 'evaluasi',
      label: 'Evaluasi',
      title: 'Uji Kemampuanmu',
      desc: 'Tiga paket soal, pembahasan, dan predikat nilai.',
      color: 'orange',
      icon: 'assets/images/om-1F4DD.svg',
      unit: 'paket'
    }
  ];

  const pageTitles = {
    beranda: 'Fun Learning Adventure — Belajar Seru untuk Anak SD',
    video: 'Video Pembelajaran — Fun Learning Adventure',
    materi: 'Materi Pembelajaran — Fun Learning Adventure',
    game: 'Game Edukasi — Fun Learning Adventure',
    evaluasi: 'Evaluasi — Fun Learning Adventure',
    progres: 'Progres Belajar — Fun Learning Adventure'
  };

  let currentPage = null;
  let currentRoute = null;
  let audio = null;

  /* ============================================================
     HUD & AUDIO
     ============================================================ */
  function refreshHUD() {
    const stats = progress.getStats();
    const starEl = ui.$('#hudStars');
    const pointEl = ui.$('#hudPoints');
    if (starEl) starEl.textContent = stats.stars;
    if (pointEl) pointEl.textContent = stats.points;
    const starChip = ui.$('#starChip');
    const pointChip = ui.$('#pointChip');
    if (starChip) starChip.setAttribute('aria-label', stats.stars + ' bintang');
    if (pointChip) pointChip.setAttribute('aria-label', stats.points + ' poin');
    updateAudioUI();
  }

  function updateAudioUI() {
    if (!audio) return;
    const musicToggle = ui.$('#musicToggle');
    const musicButton = ui.$('#audioBtn');
    const volume = ui.$('#volumeRange');
    const volumeLabel = ui.$('#volumeLabel');
    if (musicToggle) musicToggle.checked = audio.musicOn;
    if (musicButton) {
      musicButton.classList.toggle('is-active', audio.musicOn);
      musicButton.setAttribute('aria-label', audio.musicOn ? 'Matikan musik latar' : 'Nyalakan musik latar');
      const use = musicButton.querySelector('use');
      if (use) use.setAttribute('href', audio.musicOn ? '#i-music' : '#i-volume-off');
    }
    if (volume) volume.value = Math.round(audio.volume * 100);
    if (volumeLabel) volumeLabel.textContent = Math.round(audio.volume * 100) + '%';
  }

  function setupAudio() {
    audio = FLA.audio;
    if (!audio) return;
    audio.onStateChange = updateAudioUI;
    updateAudioUI();

    const musicToggle = ui.$('#musicToggle');
    const volume = ui.$('#volumeRange');
    const audioButton = ui.$('#audioBtn');
    const panel = ui.$('#audioPanel');
    const wrap = ui.$('#audioWrap');

    if (musicToggle) {
      musicToggle.addEventListener('change', () => {
        const on = audio.toggleMusic(musicToggle.checked);
        if (on) {
          audio.sfx('pop');
          ui.toast('Musik latar dinyalakan. Selamat belajar!', { tone: 'info', icon: 'music', duration: 2200 });
        }
        updateAudioUI();
      });
    }

    if (volume) {
      volume.addEventListener('input', () => {
        audio.setVolume(Number(volume.value) / 100);
      });
    }

    if (audioButton && panel && wrap) {
      audioButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = wrap.classList.toggle('is-open');
        audioButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) audio.ensure();
      });
    }

    document.addEventListener('click', (event) => {
      if (!wrap || !wrap.classList.contains('is-open')) return;
      if (wrap.contains(event.target)) return;
      wrap.classList.remove('is-open');
      if (audioButton) audioButton.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && wrap && wrap.classList.contains('is-open')) {
        wrap.classList.remove('is-open');
        if (audioButton) audioButton.setAttribute('aria-expanded', 'false');
      }
    });

    /* AudioContext dibuka pada interaksi pertama, tanpa memutar apa pun. */
    document.addEventListener('pointerdown', () => audio.ensure(), { once: true, capture: true });
  }

  /* ============================================================
     BERANDA
     ============================================================ */
  function renderHome(container) {
    const stats = progress.getStats();
    const earnedBadges = data.badges.filter((badge) => progress.hasBadge(badge.id));
    const badgePreview = earnedBadges.concat(data.badges.filter((badge) => !progress.hasBadge(badge.id))).slice(0, 4);
    const welcome = data.site.welcome[Math.floor(Math.random() * data.site.welcome.length)];

    const menuCards = menus.map((menu) => {
      const menuProgress = progress.getMenuProgress(menu.route);
      const percent = Math.round((menuProgress.done / menuProgress.total) * 100);
      return '<a class="menu-card menu-card--' + menu.color + '" href="#/' + menu.route + '" data-menu-link>' +
        '<span class="menu-card__top">' +
          '<span class="menu-card__icon"><img src="' + menu.icon + '" alt="" width="54" height="54"></span>' +
          '<span class="menu-card__go">' + ui.icon('arrow-right') + '</span>' +
        '</span>' +
        '<span class="menu-card__label">' + menu.label + '</span>' +
        '<strong class="menu-card__title">' + menu.title + '</strong>' +
        '<span class="menu-card__desc">' + menu.desc + '</span>' +
        '<span class="menu-card__footer">' +
          '<span class="menu-card__mini-track"><span style="width:' + percent + '%"></span></span>' +
          '<span class="menu-card__count">' + menuProgress.done + '/' + menuProgress.total + ' ' + menu.unit + '</span>' +
        '</span>' +
      '</a>';
    }).join('');

    container.innerHTML =
      '<div class="page-shell home-shell">' +
        '<section class="hero">' +
          '<span class="hero__cloud hero__cloud--one"></span>' +
          '<span class="hero__cloud hero__cloud--two"></span>' +
          '<span class="hero__star hero__star--one">' + ui.icon('star') + '</span>' +
          '<span class="hero__star hero__star--two">' + ui.icon('sparkles') + '</span>' +
          '<div class="hero__content">' +
            '<span class="hero__eyebrow">' + ui.icon('sparkles') + ' Media belajar interaktif untuk SD</span>' +
            '<h1>Belajar jadi <span class="text-pop">petualangan</span> yang seru!</h1>' +
            '<p>Hai, teman! Aku <strong>Huhu</strong>, burung hantu teman belajarmu. Yuk tonton video, baca materi, dan main game edukasi bersama!</p>' +
            '<div class="hero__actions">' +
              '<a class="btn btn--yellow btn--lg" href="#/materi" data-menu-link>' + ui.icon('play') + ' Mulai Belajar</a>' +
              '<a class="btn btn--glass" href="#/progres">' + ui.icon('chart') + ' Lihat Progres</a>' +
            '</div>' +
            '<div class="hero__chips">' +
              '<span>' + ui.icon('video') + ' 3 video</span>' +
              '<span>' + ui.icon('book') + ' 12 subbab</span>' +
              '<span>' + ui.icon('gamepad') + ' 5 game</span>' +
            '</div>' +
          '</div>' +
          '<div class="hero__art">' +
            '<div class="mascot-wrap">' +
              '<div class="mascot-speech" id="mascotSpeech">' + ui.escapeHtml(welcome) + '</div>' +
              '<button type="button" class="mascot-button" id="mascotBtn" aria-label="Sapa Huhu si burung hantu">' +
                '<span class="mascot-halo"></span>' +
                '<img src="' + data.site.mascotImage + '" alt="Huhu si burung hantu" width="260" height="286">' +
              '</button>' +
              '<span class="float-badge float-badge--star">' + ui.icon('star') + '</span>' +
              '<span class="float-badge float-badge--book"><img src="assets/images/om-1F4DA.svg" alt="" width="34" height="34"></span>' +
              '<span class="float-badge float-badge--puzzle"><img src="assets/images/om-1F9E9.svg" alt="" width="34" height="34"></span>' +
            '</div>' +
          '</div>' +
        '</section>' +
        '<section class="menu-section">' +
          '<div class="section-head">' +
            '<div><span class="eyebrow">Menu Utama</span><h2>Pilih Petualanganmu</h2></div>' +
            '<p>Empat cara seru untuk belajar hari ini.</p>' +
          '</div>' +
          '<div class="menu-grid">' + menuCards + '</div>' +
        '</section>' +
        '<section class="dashboard-grid">' +
          '<div class="card progress-card">' +
            '<div class="progress-card__head">' +
              '<div><span class="eyebrow">Progres Belajar</span><h2>Petualanganmu</h2></div>' +
              '<span class="progress-percent">' + stats.percent + '%</span>' +
            '</div>' +
            '<div class="progress-card__main">' +
              '<div class="progress-ring" style="--value:' + stats.percent + '">' +
                '<div class="progress-ring__inner"><strong>' + stats.percent + '%</strong><span>selesai</span></div>' +
              '</div>' +
              '<div class="progress-card__copy">' +
                '<p><strong>' + stats.doneSteps + ' dari ' + stats.totalSteps + ' langkah</strong> sudah kamu selesaikan. Hebat, teruskan!</p>' +
                '<div class="progress-track"><span style="width:' + stats.percent + '%"></span></div>' +
                '<div class="progress-legend">' +
                  '<span>' + ui.icon('video') + ' ' + stats.videoDone + '/3 video</span>' +
                  '<span>' + ui.icon('book') + ' ' + stats.subbabDone + '/12 subbab</span>' +
                  '<span>' + ui.icon('gamepad') + ' ' + stats.gameDone + '/5 game</span>' +
                  '<span>' + ui.icon('clipboard') + ' ' + stats.evaluationDone + '/3 evaluasi</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="stat-grid">' +
              '<div class="stat-tile stat-tile--star">' + ui.icon('star') + '<strong>' + stats.stars + '</strong><span>Bintang</span></div>' +
              '<div class="stat-tile stat-tile--bolt">' + ui.icon('bolt') + '<strong>' + stats.points + '</strong><span>Poin</span></div>' +
              '<div class="stat-tile stat-tile--badge">' + ui.icon('trophy') + '<strong>' + stats.badges + '/' + stats.badgeTotal + '</strong><span>Badge</span></div>' +
            '</div>' +
            '<a class="btn btn--ghost btn--block" href="#/progres">' + ui.icon('chart') + ' Lihat Detail Progres</a>' +
          '</div>' +
          '<div class="card badge-card">' +
            '<div class="progress-card__head">' +
              '<div><span class="eyebrow">Koleksi</span><h2>Badge Penghargaan</h2></div>' +
              '<span class="badge-count">' + stats.badges + '/' + stats.badgeTotal + '</span>' +
            '</div>' +
            (earnedBadges.length
              ? '<p class="badge-card__lead">Kamu sudah mengumpulkan ' + earnedBadges.length + ' badge. Keren!</p>'
              : '<p class="badge-card__lead">Selesaikan aktivitas untuk membuka badge pertamamu.</p>') +
            '<div class="badge-preview">' +
              badgePreview.map((badge) => {
                const owned = progress.hasBadge(badge.id);
                return '<div class="badge-mini ' + (owned ? 'is-owned' : 'is-locked') + '">' +
                  '<span class="badge-mini__icon">' +
                    '<img src="' + badge.icon + '" alt="" width="44" height="44">' +
                    (owned ? '' : '<span class="badge-mini__lock">' + ui.icon('lock') + '</span>') +
                  '</span>' +
                  '<span class="badge-mini__name">' + ui.escapeHtml(badge.name) + '</span>' +
                '</div>';
              }).join('') +
            '</div>' +
            '<a class="btn btn--ghost btn--block" href="#/progres">' + ui.icon('trophy') + ' Lihat Semua Badge</a>' +
          '</div>' +
        '</section>' +
        '<section class="home-tip">' +
          '<img src="assets/images/mascot-huhu.svg" alt="" width="86" height="94">' +
          '<div><strong>Pesan dari Huhu</strong><p>Belajar sedikit setiap hari lebih baik daripada belajar banyak sekaligus. Jangan lupa istirahat, ya!</p></div>' +
          '<a class="btn btn--ghost btn--sm" href="#/video">Mulai dari video ' + ui.icon('arrow-right') + '</a>' +
        '</section>' +
      '</div>';

    bindMascot();
    container.querySelectorAll('[data-menu-link]').forEach((link) => {
      link.addEventListener('click', () => FLA.audio.sfx('click'));
    });
  }

  function bindMascot() {
    const button = ui.$('#mascotBtn');
    const speech = ui.$('#mascotSpeech');
    if (!button || !speech) return;
    let last = -1;
    button.addEventListener('click', () => {
      let index = Math.floor(Math.random() * data.site.welcome.length);
      if (index === last && data.site.welcome.length > 1) index = (index + 1) % data.site.welcome.length;
      last = index;
      speech.classList.remove('is-pop');
      void speech.offsetWidth;
      speech.textContent = data.site.welcome[index];
      speech.classList.add('is-pop');
      button.classList.remove('is-wiggle');
      void button.offsetWidth;
      button.classList.add('is-wiggle');
      FLA.audio.sfx('pop');
    });
  }

  /* ============================================================
     HALAMAN PROGRES
     ============================================================ */
  function renderProgressPage(container) {
    const stats = progress.getStats();
    const recent = progress.getRecent(8);
    const typeMeta = {
      video: { icon: 'video', label: 'Video' },
      materi: { icon: 'book', label: 'Materi' },
      game: { icon: 'gamepad', label: 'Game' },
      evaluasi: { icon: 'clipboard', label: 'Evaluasi' }
    };

    container.innerHTML =
      '<div class="page-shell">' +
        '<div class="page-heading">' +
          '<a href="#/beranda" class="back-link">' + ui.icon('arrow-left') + ' Beranda</a>' +
          '<div class="page-heading__row">' +
            '<div>' +
              '<span class="eyebrow">Progres Belajar</span>' +
              '<h1>Petualangan Belajarmu</h1>' +
              '<p class="page-lead">Semua bintang, poin, dan badge tersimpan otomatis di perangkat ini.</p>' +
            '</div>' +
            '<img class="page-heading__mascot" src="assets/images/mascot-huhu.svg" alt="Huhu si burung hantu">' +
          '</div>' +
        '</div>' +
        '<div class="progress-hero">' +
          '<div class="card progress-summary">' +
            '<div class="progress-ring progress-ring--lg" style="--value:' + stats.percent + '">' +
              '<div class="progress-ring__inner"><strong>' + stats.percent + '%</strong><span>selesai</span></div>' +
            '</div>' +
            '<div class="progress-summary__copy">' +
              '<h2>' + (stats.percent >= 100 ? 'Semua petualangan selesai!' : stats.percent >= 50 ? 'Kamu sudah setengah jalan!' : 'Ayo mulai petualanganmu!') + '</h2>' +
              '<p>' + stats.doneSteps + ' dari ' + stats.totalSteps + ' langkah belajar sudah selesai.</p>' +
              '<div class="progress-track progress-track--lg"><span style="width:' + stats.percent + '%"></span></div>' +
            '</div>' +
          '</div>' +
          '<div class="summary-stats">' +
            '<div class="summary-stat summary-stat--star">' + ui.icon('star') + '<strong>' + stats.stars + '</strong><span>Bintang</span></div>' +
            '<div class="summary-stat summary-stat--bolt">' + ui.icon('bolt') + '<strong>' + stats.points + '</strong><span>Poin</span></div>' +
            '<div class="summary-stat summary-stat--badge">' + ui.icon('trophy') + '<strong>' + stats.badges + '</strong><span>Badge</span></div>' +
            '<div class="summary-stat summary-stat--done">' + ui.icon('check') + '<strong>' + stats.doneSteps + '</strong><span>Aktivitas</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="progress-detail-grid">' +
          '<div class="card detail-card">' +
            '<h2>Rincian Menu</h2>' +
            [['video', 'Video Pembelajaran', stats.videoDone, stats.videoTotal],
             ['materi', 'Subbab Materi', stats.subbabDone, stats.subbabTotal],
             ['game', 'Permainan Dimainkan', stats.gameDone, stats.gameTotal],
             ['evaluasi', 'Paket Evaluasi', stats.evaluationDone, stats.evaluationTotal]]
              .map(([route, label, done, total]) => {
                const percent = Math.round((done / total) * 100);
                const iconName = route === 'video' ? 'video' : route === 'materi' ? 'book' : route === 'game' ? 'gamepad' : 'clipboard';
                return '<div class="detail-row">' +
                  '<div class="detail-row__top">' +
                    '<span>' + ui.icon(iconName) + ' ' + label + '</span>' +
                    '<strong>' + done + '/' + total + '</strong>' +
                  '</div>' +
                  '<div class="progress-track"><span style="width:' + percent + '%"></span></div>' +
                '</div>';
              }).join('') +
          '</div>' +
          '<div class="card recent-card">' +
            '<div class="section-head section-head--compact">' +
              '<h2>Aktivitas Terakhir</h2>' +
              '<span class="muted">8 terakhir</span>' +
            '</div>' +
            (recent.length
              ? '<ul class="recent-list">' + recent.map((item) => {
                  const meta = typeMeta[item.type] || { icon: 'sparkles', label: 'Aktivitas' };
                  return '<li>' +
                    '<span class="recent-icon">' + ui.icon(meta.icon) + '</span>' +
                    '<span class="recent-main"><strong>' + ui.escapeHtml(item.title) + '</strong>' +
                      '<span>' + meta.label + ' · ' + ui.formatDateShort(item.date) + '</span></span>' +
                    '<span class="recent-reward">' +
                      (item.points ? '<span>' + ui.icon('bolt') + ' ' + item.points + '</span>' : '') +
                      (item.stars ? '<span>' + ui.icon('star') + ' ' + item.stars + '</span>' : '') +
                    '</span>' +
                  '</li>';
                }).join('') + '</ul>'
              : '<div class="empty-state">' + ui.icon('sparkles') + '<p>Belum ada aktivitas. Mulai belajar dari beranda, ya!</p></div>') +
          '</div>' +
        '</div>' +
        '<div class="card badges-section">' +
          '<div class="section-head">' +
            '<div><span class="eyebrow">Penghargaan</span><h2>Koleksi Badge</h2></div>' +
            '<span class="badge-count">' + stats.badges + '/' + stats.badgeTotal + ' terbuka</span>' +
          '</div>' +
          '<div class="badge-grid">' +
            data.badges.map((badge) => {
              const owned = progress.hasBadge(badge.id);
              return '<div class="badge-tile ' + (owned ? 'is-owned' : 'is-locked') + '">' +
                '<span class="badge-tile__icon">' +
                  '<img src="' + badge.icon + '" alt="" width="62" height="62">' +
                  (owned ? '<span class="badge-tile__check">' + ui.icon('check') + '</span>' : '<span class="badge-tile__lock">' + ui.icon('lock') + '</span>') +
                '</span>' +
                '<strong>' + ui.escapeHtml(badge.name) + '</strong>' +
                '<span>' + ui.escapeHtml(badge.desc) + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="progress-footer">' +
          '<p>Progres disimpan di browser ini menggunakan LocalStorage. Menghapus data browser akan menghapus progres.</p>' +
          '<button type="button" class="btn btn--danger btn--sm" id="resetProgress">' + ui.icon('rotate') + ' Reset Progres</button>' +
        '</div>' +
      '</div>';

    const reset = ui.$('#resetProgress', container);
    if (reset) {
      reset.addEventListener('click', async () => {
        const confirmed = await ui.confirmDialog({
          title: 'Reset semua progres?',
          message: 'Semua poin, bintang, badge, dan riwayat nilai akan dihapus. Tindakan ini tidak bisa dibatalkan.',
          confirmLabel: 'Ya, reset',
          cancelLabel: 'Batal',
          danger: true
        });
        if (!confirmed) return;
        FLA.audio.sfx('pop');
        progress.reset();
        ui.toast('Progres sudah direset. Ayo mulai petualangan baru!', { tone: 'info', icon: 'rotate' });
        renderProgressPage(container);
      });
    }
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  const routes = {
    beranda: renderHome,
    progres: renderProgressPage,
    video: null,
    materi: null,
    game: null,
    evaluasi: null
  };

  function getRoute() {
    const raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return routes.hasOwnProperty(raw) ? raw : 'beranda';
  }

  function updateNav(route) {
    ui.$$('[data-route]').forEach((link) => {
      const active = link.dataset.route === route;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function clearCurrentPage() {
    if (currentPage && typeof currentPage.leave === 'function') {
      try { currentPage.leave(); } catch (error) { /* lanjutkan navigasi */ }
    }
    currentPage = null;
  }

  function route() {
    const name = getRoute();
    if (name === currentRoute) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    clearCurrentPage();
    ui.closeModal();
    FLA.audio.stopSpeech();
    closeAudioPanel();
    currentRoute = name;
    updateNav(name);
    document.title = pageTitles[name] || pageTitles.beranda;

    const container = ui.$('#pageRoot');
    if (!container) return;
    container.innerHTML = '';
    container.className = 'app-main page-' + name;
    container.removeAttribute('aria-busy');

    if (name === 'beranda') {
      renderHome(container);
    } else if (name === 'progres') {
      renderProgressPage(container);
    } else {
      const pageKey = { materi: 'material', evaluasi: 'evaluation' }[name] || name;
      const page = FLA.pages[pageKey];
      if (page) {
        currentPage = page;
        page.enter(container);
      } else {
        renderHome(container);
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function closeAudioPanel() {
    const wrap = ui.$('#audioWrap');
    const button = ui.$('#audioBtn');
    if (wrap) wrap.classList.remove('is-open');
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  /* ============================================================
     MODAL TENTANG & SUMBER ASET
     ============================================================ */
  function openAbout() {
    FLA.audio.sfx('click');
    ui.openModal({
      title: 'Tentang Fun Learning Adventure',
      className: 'modal-card--about',
      body:
        '<p class="modal-text">Media pembelajaran interaktif untuk siswa Sekolah Dasar, dibuat sebagai proyek akhir semester PGSD. Website berjalan sepenuhnya di browser dan menyimpan progres di perangkatmu.</p>' +
        '<div class="about-block"><h3>Menu belajar</h3><p>Video, materi bergambar dengan narasi, lima game edukasi, dan tiga paket evaluasi dengan pembahasan.</p></div>' +
        '<div class="about-block"><h3>Aset &amp; lisensi</h3>' +
          '<ul class="about-list">' +
            '<li><strong>Ikon OpenMoji</strong> — lisensi CC BY-SA 4.0, sumber openmoji.org.</li>' +
            '<li><strong>Font Baloo 2 &amp; Nunito</strong> — Google Fonts, lisensi SIL Open Font License.</li>' +
            '<li><strong>Maskot, ilustrasi, puzzle, video, dan efek suara</strong> — dibuat khusus untuk proyek ini.</li>' +
          '</ul>' +
        '</div>' +
        '<div class="about-block"><h3>Privasi</h3><p>Tidak ada akun dan tidak ada data yang dikirim ke server. Semua progres disimpan di LocalStorage browser ini.</p></div>',
      actions: [{ label: 'Mengerti', variant: 'btn--blue' }]
    });
  }

  /* ============================================================
     INISIALISASI
     ============================================================ */
  function bindGlobal() {
    ui.$$('[data-route]').forEach((link) => {
      link.addEventListener('click', () => {
        FLA.audio.sfx('click');
      });
    });

    ui.$$('[data-about]').forEach((button) => {
      button.addEventListener('click', openAbout);
    });

    const year = ui.$('#currentYear');
    if (year) year.textContent = new Date().getFullYear();

    window.addEventListener('hashchange', route);
    if (!location.hash) {
      history.replaceState(null, '', '#/beranda');
    }
    route();
    refreshHUD();
  }

  function init() {
    setupAudio();
    bindGlobal();
    updateAudioUI();
    refreshHUD();
  }

  FLA.refreshHUD = refreshHUD;
  FLA.navigate = (path) => { location.hash = '#/' + path; };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
