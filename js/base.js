/* ============================================================
   base.js — Connecting the Dots
   Page Utilities Only
   Global navigation, theme, and Giscus are handled by components.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* ── READING PROGRESS BAR ── */
  const progressBar = document.querySelector('.reading-progress');

  function updateReadingProgress() {
    if (!progressBar) return;

    const scrollableHeight = document.body.scrollHeight - window.innerHeight;
    const pct = scrollableHeight > 0
      ? (window.scrollY / scrollableHeight) * 100
      : 0;

    progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  window.addEventListener('scroll', updateReadingProgress, { passive: true });
  updateReadingProgress();

  /* ── IFRAME INTERACTION SHIELD ── */
  (function initIframeShield() {
    const iframe = document.querySelector('.book-widget-frame');
    const shield = document.querySelector('.iframe-shield');
    if (!iframe || !shield) return;

    let timeout;

    function resetIframeInteraction() {
      iframe.contentWindow?.postMessage('FORCE_LEAVE', '*');
      iframe.contentWindow?.postMessage('RESET_BOOK', '*');

      shield.style.pointerEvents = 'auto';
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        shield.style.pointerEvents = 'none';
      }, 100);
    }

    window.addEventListener('scroll', resetIframeInteraction, { passive: true });
    iframe.addEventListener('wheel', resetIframeInteraction, { passive: true });
    iframe.addEventListener('touchstart', resetIframeInteraction, { passive: true });
    iframe.addEventListener('mouseleave', resetIframeInteraction);
  })();

  /* ── PAGE LOAD HOOKS ── */
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    document.querySelectorAll('.progress-bar-fill').forEach(bar => {
      bar.style.width = `${bar.dataset.w || 0}%`;
    });
  });

  /* ── CHAPTER TOGGLE HELPERS ── */
  window.toggleCh1 = function toggleCh1() {
    document.getElementById('ch1-toggle')?.classList.toggle('open');
    document.getElementById('ch1-topics')?.classList.toggle('open');
  };
});

