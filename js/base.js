/* ============================================================
   base.js — Stable Version (Shield + Smooth Scroll + Theme Sync)
   ============================================================ */

/* ── Lenis smooth scroll ── */
const lenis = new Lenis({
  lerp: 0.1,
  smoothWheel: true,
  smoothTouch: false,
  autoRaf: true,
});

/* ── Reading progress bar ── */
const progressBar = document.querySelector('.reading-progress');

if (progressBar) {
  lenis.on('scroll', ({ scroll }) => {
    const docHeight = document.body.scrollHeight - window.innerHeight;
    progressBar.style.width = (scroll / docHeight) * 100 + '%';
  });
}

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

  const send = () => {
    iframe.contentWindow?.postMessage({ theme }, '*');
  };

  // Immediate send
  send();

  // Ensure sync after load
  if (!iframe.dataset.bound) {
    iframe.dataset.bound = "true";
    iframe.addEventListener('load', send);
  }
}

/* ── IFRAME SHIELD CONTROL (FINAL FIX) ── */
(function handleIframeShield() {
  const iframe = document.querySelector('.book-widget-frame');

if (iframe) {
  // When mouse leaves iframe → force reset
  iframe.addEventListener('mouseleave', () => {
    iframe.contentWindow.postMessage('RESET_BOOK', '*');
  });
}
  const shield = document.querySelector('.iframe-shield');

  if (!iframe || !shield) return;

  let timeout;

  window.addEventListener('scroll', () => {
    // Activate shield → blocks iframe instantly
    shield.style.pointerEvents = 'auto';

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // Deactivate shield → restore interaction
      shield.style.pointerEvents = 'none';
    }, 120); // tweak 100–150ms if needed
  });
})();


/* ── THEME SYSTEM ── */
function applyTheme(theme) {
  const icon  = document.querySelector('#themeToggle .toggle-icon');
  const label = document.querySelector('#themeToggle .toggle-label');
  const book  = document.getElementById("bookImg");

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (icon) icon.textContent = '○';
    if (label) label.textContent = 'Light';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (icon) icon.textContent = '☽';
    if (label) label.textContent = 'Dark';
  }

  if (book) book.src = `assets/book-${theme}.svg`;

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
(function init() {
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
})();

/* ── TOGGLE ── */
const toggle = document.getElementById('themeToggle');

if (toggle) {
  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
  });
}

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
    if (target) lenis.scrollTo(target);

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
