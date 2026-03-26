/* ============================================================
   base.js — Shared JS for Connecting the Dots

   Provides:
   - Lenis smooth scroll
   - Reading progress bar
   - Dark mode toggle (persisted)
   - Page fade-in
   - Chapter progress bars (data-w)
   - Clean anchor navigation (no sticky #hash)
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


/* ── Dark mode toggle ── */
const toggle = document.getElementById('themeToggle');

if (toggle) {
  const icon  = toggle.querySelector('.toggle-icon');
  const label = toggle.querySelector('.toggle-label');

  const saved = localStorage.getItem('theme');

  if (
    saved === 'dark' ||
    (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.setAttribute('data-theme', 'dark');
    icon.textContent  = '○';
    label.textContent = 'Light';
  }

  toggle.addEventListener('click', () => {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      icon.textContent  = '☽';
      label.textContent = 'Dark';
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      icon.textContent  = '○';
      label.textContent = 'Light';
      localStorage.setItem('theme', 'dark');
    }

    // Sync giscus theme if present
    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
      const root  = 'https://yogesh1p.github.io/connecting-the-dots/giscus-theme-';
      const theme = isDark ? root + 'light.css' : root + 'dark.css';

      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme } } },
        'https://giscus.app'
      );
    }
  });
}


/* ── Page load: fade-in + progress bars ── */
window.addEventListener('load', () => {
  document.body.classList.add('loaded');

  // Progress bars (uses data-w from HTML)
  document.querySelectorAll('.progress-bar-fill').forEach(bar => {
    bar.style.width = (bar.dataset.w || 0) + '%';
  });
});


/* ── Clean anchor navigation (no sticky #hash) ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === "#") return;

    e.preventDefault();

    const target = document.querySelector(targetId);
    if (target) {
      lenis.scrollTo(target);
    }

    // Remove hash so refresh doesn't jump
    history.replaceState(null, null, ' ');
  });
});


/* ── Chapter toggle ── */
function toggleCh1() {
  document.getElementById('ch1-toggle').classList.toggle('open');
  document.getElementById('ch1-topics').classList.toggle('open');
}
