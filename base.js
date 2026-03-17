/* ============================================================
   base.js — Shared JS for Connecting the Dots
   Used by: index.html, chapter_assests/AR/experiments.html

   Provides:
   - Lenis smooth scroll (lerp: 0.1)
   - Reading progress bar (driven by Lenis)
   - Dark mode toggle (persisted to localStorage)
   - Page fade-in on load
   - Progress bar fills (data-w attribute)
   ============================================================ */

/* ── Lenis smooth scroll ── */
const lenis = new Lenis({
  lerp: 0.1,
  smoothWheel: true,
  smoothTouch: false,
  autoRaf: true,
})

/* ── Reading progress bar ── */
const progressBar = document.querySelector('.reading-progress')
if (progressBar) {
  lenis.on('scroll', ({ scroll }) => {
    const docHeight = document.body.scrollHeight - window.innerHeight
    progressBar.style.width = (scroll / docHeight) * 100 + '%'
  })
}

/* ── Dark mode toggle ── */
const toggle = document.getElementById('themeToggle')
if (toggle) {
  const icon  = toggle.querySelector('.toggle-icon')
  const label = toggle.querySelector('.toggle-label')

  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark')
    icon.textContent  = '○'
    label.textContent = 'Light'
  }

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    if (isDark) {
      document.documentElement.removeAttribute('data-theme')
      icon.textContent  = '☽'
      label.textContent = 'Dark'
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
      icon.textContent  = '○'
      label.textContent = 'Light'
      localStorage.setItem('theme', 'dark')
    }
    // Notify any giscus iframes of the theme change
    const iframe = document.querySelector('iframe.giscus-frame')
    if (iframe) {
      const root   = 'https://yogesh1p.github.io/connecting-the-dots/giscus-theme-'
      const theme  = isDark ? root + 'light.css' : root + 'dark.css'
      iframe.contentWindow.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app')
    }
  })
}

/* ── Page fade-in ── */
window.addEventListener('load', () => {
  document.body.classList.add('loaded')
})

/* ── Progress bar fills (index.html chapter progress bars) ── */
window.addEventListener('load', () => {
  document.querySelectorAll('.progress-bar-fill').forEach(bar => {
    bar.style.width = (bar.dataset.w || 0) + '%'
  })
})
