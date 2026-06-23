/* ============================================================
   S-16 UI utilities — count-up, drag-reorder, page transitions
   Drop-in: <script src="../Sprint 1/js/s16-ui.js"></script>
   ============================================================ */

/* ── Count-up ──────────────────────────────────────────────
   Usage: <span data-countup data-target="1234" data-prefix="$" data-suffix="%" data-decimals="1">0</span>
   Or JS: S16.countUp(el, target, options)
   ─────────────────────────────────────────────────────── */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function countUp(el, target, { duration = 1200, prefix = '', suffix = '', decimals = 0, delay = 0 } = {}) {
  const start = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
  const diff = target - start;
  if (diff === 0) return;

  let startTime = null;

  function step(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = start + diff * easeOutExpo(progress);
    el.textContent = prefix + value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.classList.remove('counting');
  }

  el.classList.add('counting');
  if (delay > 0) {
    setTimeout(() => requestAnimationFrame(step), delay);
  } else {
    requestAnimationFrame(step);
  }
}


/* ── Drag-reorder widget grid ───────────────────────────────
   Usage: S16.initWidgetGrid('.widget-grid')
   Persists order to localStorage under key `widget-order-<pageId>`
   ─────────────────────────────────────────────────────── */
function initWidgetGrid(selector, pageId) {
  const grids = document.querySelectorAll(selector);
  if (!grids.length) return;

  grids.forEach(grid => {
    const storageKey = `widget-order-${pageId || document.title.replace(/\s+/g, '-')}`;

    // Restore saved order
    restoreOrder(grid, storageKey);

    let dragSrc = null;

    grid.querySelectorAll('.widget-card').forEach(card => {
      card.setAttribute('draggable', 'true');

      card.addEventListener('dragstart', e => {
        dragSrc = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.widgetId || '');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        grid.querySelectorAll('.widget-card').forEach(c => c.classList.remove('drag-over'));
        saveOrder(grid, storageKey);
      });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (card !== dragSrc) card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (dragSrc && dragSrc !== card) {
          const cards = [...grid.querySelectorAll('.widget-card')];
          const srcIdx  = cards.indexOf(dragSrc);
          const destIdx = cards.indexOf(card);
          if (srcIdx < destIdx) {
            grid.insertBefore(dragSrc, card.nextSibling);
          } else {
            grid.insertBefore(dragSrc, card);
          }
        }
      });
    });
  });
}

function saveOrder(grid, key) {
  const ids = [...grid.querySelectorAll('.widget-card')]
    .map(c => c.dataset.widgetId)
    .filter(Boolean);
  if (ids.length) localStorage.setItem(key, JSON.stringify(ids));
}

function restoreOrder(grid, key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (!Array.isArray(saved) || !saved.length) return;
    saved.forEach(id => {
      const card = grid.querySelector(`[data-widget-id="${id}"]`);
      if (card) grid.appendChild(card);
    });
  } catch { /* ignore */ }
}

/* ── Page transitions ───────────────────────────────────────
   Usage: S16.navigate(pageId) — replaces the raw navigate() call.
   Adds pageSlideOut to current, then shows new after 150ms.
   ─────────────────────────────────────────────────────── */
let _currentPage = null;

function navigateWithTransition(newPageId, afterSwitch) {
  const all = document.querySelectorAll('.page-view');
  const current = document.querySelector('.page-view.active');

  if (current && current.id !== newPageId) {
    current.classList.add('exiting');
    current.addEventListener('animationend', () => {
      current.classList.remove('active', 'exiting');
    }, { once: true });
  } else if (current) {
    return; // same page
  }

  setTimeout(() => {
    all.forEach(p => { if (p.id !== newPageId) p.classList.remove('active'); });
    const next = document.getElementById(newPageId);
    if (next) {
      next.classList.add('active');
      _currentPage = newPageId;
      if (typeof afterSwitch === 'function') afterSwitch(newPageId);
      // Re-run count-ups for the new page
      next.querySelectorAll('[data-countup]').forEach(el => {
        delete el.dataset.counted; // allow re-count on page revisit
      });
      initCountUps();
    }
  }, 150);
}

/* ── Sparkline draw-in trigger ──────────────────────────────
   Call after inserting sparkline SVG paths into DOM.
   ─────────────────────────────────────────────────────── */
function triggerSparklines(container) {
  const root = container || document;
  root.querySelectorAll('.sparkline-animate').forEach((el, i) => {
    el.style.setProperty('--spark-delay', `${0.1 + i * 0.06}s`);
  });
}

/* ── Chart path draw-in ─────────────────────────────────────
   Call after Chart.js or custom SVG line is drawn.
   Adds draw-path animation to SVG paths with class chart-line-draw.
   ─────────────────────────────────────────────────────── */
function triggerChartLines(container) {
  const root = container || document;
  root.querySelectorAll('.chart-line-draw').forEach((path, i) => {
    try {
      const len = path.getTotalLength ? path.getTotalLength() : 2000;
      path.style.setProperty('--path-len', len);
      path.style.setProperty('--draw-delay', `${i * 0.12}s`);
    } catch { /* SVG not mounted yet */ }
  });
}

/* ── Auto-observe new [data-countup] elements via MutationObserver ── */
let _intersectionObserver = null;

function getOrCreateIntersectionObserver() {
  if (_intersectionObserver) return _intersectionObserver;
  _intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.counted) return;
      el.dataset.counted = '1';

      const target   = parseFloat(el.dataset.target ?? el.textContent) || 0;
      const prefix   = el.dataset.prefix   || '';
      const suffix   = el.dataset.suffix   || '';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const delay    = parseInt(el.dataset.delay    || '0', 10);
      const duration = parseInt(el.dataset.duration || '1200', 10);

      countUp(el, target, { duration, prefix, suffix, decimals, delay });
      _intersectionObserver.unobserve(el);
    });
  }, { threshold: 0.2 });
  return _intersectionObserver;
}

function initCountUps(root) {
  const obs = getOrCreateIntersectionObserver();
  const container = root || document;
  container.querySelectorAll('[data-countup]').forEach(el => {
    // Reset counted flag when explicitly re-initializing (page switch)
    if (root) delete el.dataset.counted;
    obs.observe(el);
  });
}

let _mutationObserver = null;

function startMutationWatch() {
  if (_mutationObserver) return;
  const pageContent = document.getElementById('pageContent');
  if (!pageContent) return;

  _mutationObserver = new MutationObserver((mutations) => {
    const obs = getOrCreateIntersectionObserver();
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('[data-countup]')) obs.observe(node);
        node.querySelectorAll?.('[data-countup]').forEach(el => obs.observe(el));
      });
    }
  });
  _mutationObserver.observe(pageContent, { childList: true, subtree: true });
}

/* ── Init on DOMContentLoaded ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCountUps();
  triggerSparklines();
  triggerChartLines();
  startMutationWatch();
});

/* ── Public API ─────────────────────────────────────────── */
window.S16 = {
  countUp,
  initCountUps,
  initWidgetGrid,
  navigate: navigateWithTransition,
  triggerSparklines,
  triggerChartLines,
};
