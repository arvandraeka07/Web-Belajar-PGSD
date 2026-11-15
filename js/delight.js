/* ============================================================
   HURUFORIA — Lapisan interaksi dan animasi halus
   Tidak mengubah alur halaman; hanya menambah umpan balik visual.
   ============================================================ */

window.FLA = window.FLA || {};

(function () {
  'use strict';

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  let revealObserver = null;
  let scanScheduled = false;

  /* ---------- Bilah kemajuan gulir ---------- */
  function initScrollProgress() {
    if ($('.fx-scroll-progress')) return;
    const bar = document.createElement('div');
    bar.className = 'fx-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span></span>';
    document.body.appendChild(bar);
    const fill = bar.firstElementChild;
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
      fill.style.width = clamp(percent, 0, 100).toFixed(2) + '%';
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  /* ---------- Huruf melayang di latar ---------- */
  function initAmbientLetters() {
    if (reduceMotion) return;
    const decor = $('.bg-decor');
    if (!decor || $('.fx-ambient', decor)) return;
    const layer = document.createElement('div');
    layer.className = 'fx-ambient';
    layer.setAttribute('aria-hidden', 'true');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const colors = ['#433a9b', '#ff9a3c', '#17b26a', '#ff7eb3', '#9c84e6', '#ffd91a'];
    for (let i = 0; i < 14; i += 1) {
      const span = document.createElement('span');
      span.textContent = letters[Math.floor(Math.random() * letters.length)];
      span.style.left = (3 + Math.random() * 92).toFixed(1) + '%';
      span.style.top = (4 + Math.random() * 86).toFixed(1) + '%';
      span.style.fontSize = (26 + Math.random() * 56).toFixed(0) + 'px';
      span.style.opacity = (0.05 + Math.random() * 0.055).toFixed(2);
      span.style.setProperty('--amb', colors[i % colors.length]);
      span.style.setProperty('--dur', (18 + Math.random() * 16).toFixed(1) + 's');
      span.style.setProperty('--delay', (-Math.random() * 22).toFixed(1) + 's');
      span.style.setProperty('--dx', (Math.random() * 44 - 22).toFixed(0) + 'px');
      span.style.setProperty('--dy', (Math.random() * -46 - 12).toFixed(0) + 'px');
      span.style.setProperty('--tilt', (Math.random() * 18 - 9).toFixed(1) + 'deg');
      layer.appendChild(span);
    }
    decor.appendChild(layer);
  }

  /* ---------- Parallax latar ---------- */
  function initParallax() {
    if (reduceMotion || !finePointer) return;
    const items = [
      ['.bg-blob--one', 20, 14],
      ['.bg-blob--two', -24, 16],
      ['.bg-blob--three', 16, -12],
      ['.bg-cloud--one', 14, 9],
      ['.bg-cloud--two', -16, 11],
      ['.bg-cloud--three', 10, -7]
    ].map(([selector, fx, fy]) => ({ el: $(selector), fx, fy })).filter((item) => item.el);
    if (!items.length) return;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let raf = 0;

    const apply = () => {
      raf = 0;
      const nx = pointerX / window.innerWidth - 0.5;
      const ny = pointerY / window.innerHeight - 0.5;
      const scroll = window.scrollY;
      items.forEach((item) => {
        const x = nx * item.fx;
        const y = ny * item.fy + scroll * 0.012 * (item.fy > 0 ? 1 : -1);
        item.el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(apply); };

    window.addEventListener('pointermove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      request();
    }, { passive: true });
    window.addEventListener('scroll', request, { passive: true });
    apply();
  }

  /* ---------- Sorotan kursor pada hero ---------- */
  function decorateHero() {
    const hero = $('.hero');
    if (!hero) return;
    let spot = $('.fx-spotlight', hero);
    if (!spot) {
      spot = document.createElement('span');
      spot.className = 'fx-spotlight';
      spot.setAttribute('aria-hidden', 'true');
      hero.appendChild(spot);
    }
    if (reduceMotion || !finePointer || hero.dataset.fxSpot === '1') return;
    hero.dataset.fxSpot = '1';
    let raf = 0;
    let x = 50;
    let y = 50;
    const apply = () => {
      raf = 0;
      hero.style.setProperty('--fx-x', x.toFixed(1) + '%');
      hero.style.setProperty('--fx-y', y.toFixed(1) + '%');
      hero.classList.add('is-spot');
    };
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      x = ((event.clientX - rect.left) / rect.width) * 100;
      y = ((event.clientY - rect.top) / rect.height) * 100;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => hero.classList.remove('is-spot'));

    const art = $('.hero__art', hero);
    if (art) {
      let artRaf = 0;
      let ax = 0;
      let ay = 0;
      const applyArt = () => {
        artRaf = 0;
        art.style.translate = ax.toFixed(1) + 'px ' + ay.toFixed(1) + 'px';
      };
      hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        ax = ((event.clientX - rect.left) / rect.width - 0.5) * -12;
        ay = ((event.clientY - rect.top) / rect.height - 0.5) * -9;
        if (!artRaf) artRaf = requestAnimationFrame(applyArt);
      }, { passive: true });
      hero.addEventListener('pointerleave', () => {
        ax = 0;
        ay = 0;
        if (!artRaf) artRaf = requestAnimationFrame(applyArt);
      });
    }
  }

  /* ---------- Efek miring pada kartu ---------- */
  const TILT_SELECTOR = '.menu-card, .material-card, .game-card, .eval-card, .badge-tile, .summary-stat, .stat-tile, .side-card, .pos-card, .lp-stat, .quiz-block, .video-item, .badge-mini';

  function bindTilt(element) {
    if (element.dataset.fxTilt === '1') return;
    element.dataset.fxTilt = '1';
    if (reduceMotion || !finePointer) return;
    element.classList.add('fx-tilt');
    let raf = 0;
    let rx = 0;
    let ry = 0;
    let lift = 0;
    const apply = () => {
      raf = 0;
      element.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(' + lift + 'px)';
    };
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      rx = -py * 4.5;
      ry = px * 5.5;
      lift = -4;
      element.classList.add('is-tilting');
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    element.addEventListener('pointerleave', () => {
      element.classList.remove('is-tilting');
      element.style.transform = '';
    });
  }

  /* ---------- Riak saat tombol ditekan ---------- */
  const RIPPLE_SELECTOR = '.btn, .nav-link, .mobile-nav a, .icon-btn, .player-btn, .hud-chip, .hero-tile, .alpha-tile, .sample-tile, .letter-card, .qa-option, .quick-option, .quiz-option, .guess-option, .exam-option, .tf-btn, .lp-tab, .menu-card__go';

  function initRipple() {
    if (reduceMotion) return;
    document.addEventListener('pointerdown', (event) => {
      const host = event.target.closest ? event.target.closest(RIPPLE_SELECTOR) : null;
      if (!host || host.disabled) return;
      host.classList.add('fx-ripple-host');
      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement('span');
      ripple.className = 'fx-ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = (event.clientX - rect.left) + 'px';
      ripple.style.top = (event.clientY - rect.top) + 'px';
      host.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }, { passive: true });
  }

  /* ---------- Percikan saat huruf ditekan ---------- */
  const SPARK_SELECTOR = '.hero-tile, .alpha-tile, .sample-tile, .letter-card, .syl-card, .word-card, .vowel-card, .pair-card, .syl-chip';

  function sparkleAt(x, y) {
    const root = $('#confetti-root') || document.body;
    const colors = ['#ffd91a', '#ff9a3c', '#17b26a', '#ff7eb3', '#9c84e6'];
    for (let i = 0; i < 9; i += 1) {
      const spark = document.createElement('span');
      const angle = (Math.PI * 2 * i) / 9 + Math.random() * 0.4;
      const distance = 22 + Math.random() * 34;
      spark.className = 'fx-spark';
      spark.style.left = x + 'px';
      spark.style.top = y + 'px';
      spark.style.background = colors[i % colors.length];
      spark.style.setProperty('--sx', (Math.cos(angle) * distance).toFixed(1) + 'px');
      spark.style.setProperty('--sy', (Math.sin(angle) * distance).toFixed(1) + 'px');
      root.appendChild(spark);
      setTimeout(() => spark.remove(), 700);
    }
  }

  function initSparkles() {
    if (reduceMotion) return;
    document.addEventListener('pointerdown', (event) => {
      const host = event.target.closest ? event.target.closest(SPARK_SELECTOR) : null;
      if (!host) return;
      sparkleAt(event.clientX, event.clientY);
    }, { passive: true });
  }

  /* ---------- Animasi angka progres ---------- */
  function animateRing(element, property, target, duration) {
    if (reduceMotion) {
      element.style.setProperty(property, target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.style.setProperty(property, (target * eased).toFixed(2));
      if (progress < 1) requestAnimationFrame(tick);
      else element.style.setProperty(property, target);
    };
    requestAnimationFrame(tick);
  }

  function animateProgress() {
    $$('.progress-track > span, .menu-card__mini-track > span').forEach((element) => {
      if (element.dataset.fxBar === '1') return;
      const target = element.style.width;
      if (!target) return;
      element.dataset.fxBar = '1';
      element.style.width = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => { element.style.width = target; }));
    });

    $$('.progress-ring, .score-ring').forEach((element) => {
      if (element.dataset.fxRing === '1') return;
      const property = element.classList.contains('score-ring') ? '--score' : '--value';
      const raw = element.style.getPropertyValue(property).trim();
      if (raw === '') return;
      const target = parseFloat(raw);
      if (!Number.isFinite(target)) return;
      element.dataset.fxRing = '1';
      element.style.setProperty(property, '0');
      animateRing(element, property, target, 900);
    });
  }

  /* ---------- Muncul saat digulir ---------- */
  function initReveal() {
    if (reduceMotion || typeof IntersectionObserver !== 'function') return;
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        if (revealObserver) revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  }

  function revealScan() {
    if (!revealObserver) return;
    const shell = $('#pageRoot .page-shell');
    if (!shell) return;
    let order = 0;
    Array.from(shell.children).forEach((element) => {
      if (element.dataset.fxReveal === '1') return;
      element.dataset.fxReveal = '1';
      element.style.transitionDelay = Math.min(order * 55, 260) + 'ms';
      element.classList.add('fx-reveal');
      revealObserver.observe(element);
      order += 1;
    });
  }

  /* ---------- Indikator suara aktif ---------- */
  function initVoiceIndicator() {
    let active = false;
    const tick = () => {
      const speaking = !!(window.FLA && FLA.audio && FLA.audio.speaking);
      if (speaking === active) return;
      active = speaking;
      document.body.classList.toggle('is-voice-active', speaking);
    };
    setInterval(tick, 240);
  }

  /* ---------- Huhu menyapa berkala di beranda ---------- */
  function initMascotIdle() {
    if (reduceMotion || !window.FLA || !FLA.data || !FLA.data.site) return;
    const messages = FLA.data.site.welcome || [];
    if (messages.length < 2) return;
    let lastClick = Date.now();
    let index = -1;
    document.addEventListener('click', (event) => {
      if (event.target.closest && event.target.closest('#mascotBtn')) lastClick = Date.now();
    }, true);
    setInterval(() => {
      if (document.hidden) return;
      if (Date.now() - lastClick < 20000) return;
      if (FLA.audio && FLA.audio.speaking) return;
      if ($('.modal-overlay')) return;
      const speech = $('#mascotSpeech');
      if (!speech) return;
      index = (index + 1) % messages.length;
      speech.classList.remove('is-pop');
      void speech.offsetWidth;
      speech.textContent = messages[index];
      speech.classList.add('is-pop');
    }, 13000);
  }

  /* ---------- Pemindaian ulang setiap halaman berubah ---------- */
  function scan() {
    decorateHero();
    $$(TILT_SELECTOR).forEach(bindTilt);
    animateProgress();
    revealScan();
  }

  function scheduleScan(delay) {
    if (scanScheduled) return;
    scanScheduled = true;
    window.setTimeout(() => {
      scanScheduled = false;
      scan();
    }, delay || 60);
  }

  function init() {
    initScrollProgress();
    initAmbientLetters();
    initParallax();
    initReveal();
    initRipple();
    initSparkles();
    initVoiceIndicator();
    initMascotIdle();
    scan();

    const root = $('#pageRoot');
    if (root && typeof MutationObserver === 'function') {
      let scheduled = false;
      const observer = new MutationObserver((mutations) => {
        const onlyEffects = mutations.every((mutation) => {
          const nodes = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes));
          if (!nodes.length) return false;
          return nodes.every((node) => node.nodeType !== 1 ||
            node.classList.contains('fx-ripple') ||
            node.classList.contains('fx-spark') ||
            node.classList.contains('fx-spotlight'));
        });
        if (onlyEffects) return;
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          scheduleScan(40);
        });
      });
      observer.observe(root, { childList: true, subtree: true });
    }

    window.addEventListener('hashchange', () => scheduleScan(80));
    window.addEventListener('resize', () => scheduleScan(120));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
