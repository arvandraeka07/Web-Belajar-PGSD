/* ============================================================
   FUN LEARNING ADVENTURE — Utilitas UI
   Helper kecil untuk elemen, notifikasi, modal, dan konfeti.
   ============================================================ */

window.FLA = window.FLA || {};

FLA.ui = (function () {
  'use strict';

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function sample(list, count) {
    return shuffle(list).slice(0, count);
  }

  function range(n, start) {
    return Array.from({ length: n }, (_, i) => (start || 0) + i);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function icon(name, className) {
    return '<svg class="icon ' + (className || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function starRow(count, max, className) {
    const total = max || 3;
    let html = '<span class="star-row ' + (className || '') + '" aria-label="' + count + ' dari ' + total + ' bintang">';
    for (let i = 0; i < total; i += 1) {
      html += '<span class="star ' + (i < count ? 'is-filled' : 'is-empty') + '">' + icon('star') + '</span>';
    }
    return html + '</span>';
  }

  /* ---------- Toast ---------- */
  function toast(message, options) {
    const opts = typeof options === 'string' ? { title: options } : (options || {});
    const root = $('#toast-root');
    if (!root) return;
    while (root.children.length >= 3) root.removeChild(root.firstChild);

    const node = document.createElement('div');
    node.className = 'toast toast--' + (opts.tone || 'success');
    node.setAttribute('role', 'status');
    node.innerHTML =
      '<span class="toast__icon">' + (opts.icon ? icon(opts.icon) : icon('sparkles')) + '</span>' +
      '<span class="toast__text">' +
        (opts.title ? '<strong>' + escapeHtml(opts.title) + '</strong>' : '') +
        (opts.message ? '<span>' + escapeHtml(opts.message) + '</span>' : '') +
      '</span>';
    root.appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-visible'));
    setTimeout(() => {
      node.classList.remove('is-visible');
      setTimeout(() => node.remove(), 320);
    }, opts.duration || 3200);
  }

  /* ---------- Modal ---------- */
  let activeOverlay = null;
  let lastFocused = null;
  let closeHandler = null;
  let activeOnClose = null;

  function openModal(options) {
    const opts = options || {};
    closeModal();
    const root = $('#modal-root');
    if (!root) return null;
    lastFocused = document.activeElement;
    activeOnClose = typeof opts.onClose === 'function' ? opts.onClose : null;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-card ' + (opts.className || '') + '" role="dialog" aria-modal="true" aria-label="' + escapeHtml(opts.title || 'Dialog') + '">' +
        (opts.dismissible === false ? '' : '<button class="modal-close" type="button" data-modal-close aria-label="Tutup">' + icon('close') + '</button>') +
        (opts.title ? '<h2 class="modal-title">' + escapeHtml(opts.title) + '</h2>' : '') +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.actions && opts.actions.length
          ? '<div class="modal-actions">' + opts.actions.map((action, index) =>
              '<button type="button" class="btn ' + (action.variant || 'btn--blue') + ' modal-action" data-action-index="' + index + '">' +
                (action.icon ? icon(action.icon) : '') + '<span>' + escapeHtml(action.label) + '</span></button>'
            ).join('') + '</div>'
          : '') +
      '</div>';

    root.appendChild(overlay);
    activeOverlay = overlay;
    requestAnimationFrame(() => overlay.classList.add('is-visible'));

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay && opts.dismissible !== false) closeModal();
    });

    overlay.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal());
    });

    overlay.querySelectorAll('.modal-action').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = opts.actions[Number(btn.dataset.actionIndex)];
        if (!action) return;
        if (action.onClick) {
          const keepOpen = action.onClick(overlay);
          if (keepOpen === false) return;
        }
        if (action.keepOpen !== true) closeModal();
      });
    });

    closeHandler = (event) => {
      if (event.key === 'Escape' && opts.dismissible !== false) {
        event.preventDefault();
        closeModal();
      }
      if (event.key === 'Tab') {
        const focusables = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', closeHandler);

    setTimeout(() => {
      const target = overlay.querySelector('.modal-action, .modal-close') || overlay.querySelector('.modal-card');
      if (target) target.focus({ preventScroll: true });
    }, 60);

    return overlay;
  }

  function closeModal() {
    if (!activeOverlay) return;
    const overlay = activeOverlay;
    const onClose = activeOnClose;
    activeOverlay = null;
    activeOnClose = null;
    if (closeHandler) document.removeEventListener('keydown', closeHandler);
    closeHandler = null;
    overlay.classList.remove('is-visible');
    setTimeout(() => overlay.remove(), 220);
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus({ preventScroll: true });
      lastFocused = null;
    }
    if (onClose) setTimeout(onClose, 40);
  }

  function confirmDialog(options) {
    const opts = options || {};
    return new Promise((resolve) => {
      let answered = false;
      openModal({
        title: opts.title || 'Yakin?',
        className: 'modal-card--compact',
        body: '<p class="modal-text">' + escapeHtml(opts.message || '') + '</p>',
        actions: [
          {
            label: opts.cancelLabel || 'Batal',
            variant: 'btn--ghost',
            onClick: () => { answered = true; resolve(false); }
          },
          {
            label: opts.confirmLabel || 'Ya, lanjutkan',
            variant: opts.danger ? 'btn--danger' : 'btn--blue',
            onClick: () => { answered = true; resolve(true); }
          }
        ],
        dismissible: true
      });
      const checkClosed = setInterval(() => {
        if (!activeOverlay) {
          clearInterval(checkClosed);
          if (!answered) resolve(false);
        }
      }, 200);
    });
  }

  /* ---------- Konfeti ---------- */
  function confetti(count, origin) {
    const root = $('#confetti-root');
    if (!root) return;
    const colors = ['#ffd93d', '#ff9f43', '#3b82f6', '#3ddc84', '#ff7eb3', '#8b5cf6'];
    const total = count || 70;
    const ox = origin ? origin.x : window.innerWidth / 2;
    const oy = origin ? origin.y : window.innerHeight * 0.35;

    const letters = 'AEIOUBCDFGHJKLMNPQRSTVWXYZ';
    for (let i = 0; i < total; i += 1) {
      const piece = document.createElement('span');
      const isLetter = i % 4 === 0;
      piece.className = 'confetti-piece' + (isLetter ? ' confetti-piece--letter' : '');
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 320;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 60;
      piece.style.left = ox + 'px';
      piece.style.top = oy + 'px';
      piece.style.setProperty('--dx', x + 'px');
      piece.style.setProperty('--dy', y + 'px');
      piece.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      piece.style.animationDelay = (Math.random() * 0.18) + 's';
      if (isLetter) {
        piece.textContent = letters[Math.floor(Math.random() * letters.length)];
        piece.style.color = colors[i % colors.length];
      } else {
        piece.style.background = colors[i % colors.length];
        piece.style.width = (7 + Math.random() * 8) + 'px';
        piece.style.height = (9 + Math.random() * 10) + 'px';
        if (i % 3 === 0) piece.style.borderRadius = '50%';
      }
      root.appendChild(piece);
      setTimeout(() => piece.remove(), 2200);
    }
  }

  function burstFrom(element) {
    if (!element) return confetti();
    const rect = element.getBoundingClientRect();
    confetti(50, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }

  /* ---------- Lain-lain ---------- */
  function formatDate(iso) {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(iso));
    } catch (error) {
      return '-';
    }
  }

  function formatDateShort(iso) {
    try {
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
    } catch (error) {
      return '-';
    }
  }

  function countUp(element, target, duration) {
    if (!element) return;
    const startValue = 0;
    const start = performance.now();
    const total = duration || 650;
    function step(now) {
      const progress = Math.min(1, (now - start) / total);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(startValue + (target - startValue) * eased);
      if (progress < 1) requestAnimationFrame(step);
      else element.textContent = target;
    }
    requestAnimationFrame(step);
  }

  function setPressed(button, pressed) {
    if (!button) return;
    button.classList.toggle('is-active', Boolean(pressed));
    button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return {
    $, $$, shuffle, sample, range, escapeHtml, icon, sleep, clamp,
    starRow, toast, openModal, closeModal, confirmDialog, confetti, burstFrom,
    formatDate, formatDateShort, countUp, setPressed, escapeRegExp
  };
})();
