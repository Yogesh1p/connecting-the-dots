/* ============================================================
   base.js — Clean Version (No Lenis + Stable Iframe + Theme Sync)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Reading progress bar (native scroll) ── */
  const progressBar = document.querySelector('.reading-progress');

  window.addEventListener('scroll', () => {
    if (!progressBar) return;
    const scroll = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    progressBar.style.width = (scroll / docHeight) * 100 + '%';
  });

  /* ── THEME COLOR ── */
  function setThemeColor(theme) {
    const meta = document.getElementById("theme-color-meta");
    if (meta) {
      meta.setAttribute("content", theme === 'dark' ? '#1C1208' : '#FDFBF7');
    }
  }

  /* ── IFRAME THEME SYNC ── */
  function syncWidgetTheme(theme) {
    const iframe = document.querySelector('.book-widget-frame');
    if (!iframe) return;
    const send = () => { iframe.contentWindow?.postMessage({ theme }, '*'); };
    send();
    if (!iframe.dataset.bound) {
      iframe.dataset.bound = "true";
      iframe.addEventListener('load', send);
    }
  }

  /* ── IFRAME SHIELD + INTERRUPTION HANDLER ── */
  (function handleIframeShield() {
    const iframe = document.querySelector('.book-widget-frame');
    const shield = document.querySelector('.iframe-shield');
    if (!iframe || !shield) return;

    let timeout;
    function interruptInteraction() {
      iframe.contentWindow?.postMessage('FORCE_LEAVE', '*');
      iframe.contentWindow?.postMessage('RESET_BOOK', '*');
      shield.style.pointerEvents = 'auto';
      clearTimeout(timeout);
      timeout = setTimeout(() => { shield.style.pointerEvents = 'none'; }, 100);
    }

    window.addEventListener('scroll', interruptInteraction);
    iframe.addEventListener('wheel', interruptInteraction, { passive: true });
    iframe.addEventListener('touchstart', interruptInteraction, { passive: true });
    iframe.addEventListener('mouseleave', interruptInteraction);
  })();

  /* ── THEME SYSTEM ── */
  function applyTheme(theme) {
    const book = document.getElementById("bookImg");

    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    if (book) book.src = 'assets/book-' + theme + '.svg';

    localStorage.setItem('theme', theme);
    setThemeColor(theme);
    syncWidgetTheme(theme);

    // Giscus sync
    const giscus = document.querySelector('iframe.giscus-frame');
    if (giscus) {
      const root = 'https://yogesh1p.github.io/connecting-the-dots/giscus-theme-';
      giscus.contentWindow.postMessage(
        { giscus: { setConfig: { theme: root + theme + '.css' } } },
        'https://giscus.app'
      );
    }
  }

  /* ── INIT THEME ── */
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);

  /* ── TOGGLE — shared handler for nav + mobile ── */
  function handleThemeToggle() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
  }

  const toggle = document.getElementById('themeToggle');
  const toggleMobile = document.getElementById('themeToggleMobile');
  if (toggle) toggle.addEventListener('click', handleThemeToggle);
  if (toggleMobile) toggleMobile.addEventListener('click', handleThemeToggle);

  /* ── PAGE LOAD ── */
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    document.querySelectorAll('.progress-bar-fill').forEach(bar => {
      bar.style.width = (bar.dataset.w || 0) + '%';
    });
  });

  /* ── CLEAN ANCHOR NAV ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === "#") return;
      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) { target.scrollIntoView({ behavior: 'smooth' }); }
      history.pushState(null, null, targetId);
    });
  });

  /* ── CHAPTER TOGGLE ── */
  window.toggleCh1 = function () {
    const toggleBtn = document.getElementById('ch1-toggle');
    const topicsBlock = document.getElementById('ch1-topics');
    if (toggleBtn && topicsBlock) {
      toggleBtn.classList.toggle('open');
      topicsBlock.classList.toggle('open');
    }
  };

}); // end DOMContentLoaded
