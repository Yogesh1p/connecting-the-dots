/* ============================================================
   base.js — Connecting the Dots
   Theme System & Morphing Mobile Nav
   ============================================================ */

/* ── INSTANT THEME before first paint ── */
(function () {
  const t = localStorage.getItem('theme') || 'light';
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
})();

document.addEventListener('DOMContentLoaded', function () {



/* ── NAV LINKS — Bulletproof Dynamic Root Path ── */
  // The browser always resolves .src to an absolute URL (e.g., http://localhost/js/base.js)
  // We use this to reliably find the project root no matter how deep the current HTML file is.
  const scriptTag = document.querySelector('script[src*="base.js"]');
  const rootUrl = scriptTag.src.replace('/js/base.js', '/');

  const NAV_LINKS = [
    { href: rootUrl + 'index.html', icon: 'home', label: 'Home' },
    { href: rootUrl + 'index.html#chapters', icon: 'chapters', label: 'Chapters' },
    { href: rootUrl + 'experiments/hub.html', icon: 'exp', label: 'Experiments' },
    { href: rootUrl + 'index.html#contribute', icon: 'contrib', label: 'Contribute' },
    { href: 'https://github.com/Yogesh1p/connecting-the-dots', icon: 'github', label: 'GitHub', target: '_blank' },
  ];
  const ICONS = {
    home:     `<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M8 1L1 7v8h4v-5h6v5h4V7L8 1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    chapters: `<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 6h6M5 9.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    exp:      `<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15M3.4 3.4l1.77 1.77M10.83 10.83l1.77 1.77M12.6 3.4l-1.77 1.77M5.17 10.83l-1.77 1.77" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    contrib:  `<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M1 14c0-2.485 2.015-4.5 4.5-4.5S10 11.515 10 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="11.5" cy="5" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M13.5 9.6c1.14.49 1.96 1.63 1.96 2.9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    github:   `<svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`,
  };

  /* ── AUTO-INJECT MOBILE NAV (skipped if #glassBtn already in HTML) ── */
  (function injectMobileNav() {
    if (document.getElementById('glassBtn')) return;

    const linksHTML = NAV_LINKS.map(l =>
      `<li><a href="${l.href}"${l.target ? ` target="${l.target}" rel="noopener"` : ''}>${ICONS[l.icon]} ${l.label}</a></li>`
    ).join('');

    const pillSVGs = {
      light: `<svg class="mob-pill__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36"><path fill="currentColor" fill-rule="evenodd" d="M18 12a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" clip-rule="evenodd"/><path fill="currentColor" d="M17 6.038a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0v-3ZM24.244 7.742a1 1 0 1 1 1.618 1.176L24.1 11.345a1 1 0 1 1-1.618-1.176l1.763-2.427ZM29.104 13.379a1 1 0 0 1 .618 1.902l-2.854.927a1 1 0 1 1-.618-1.902l2.854-.927ZM29.722 20.795a1 1 0 0 1-.619 1.902l-2.853-.927a1 1 0 1 1 .618-1.902l2.854.927ZM25.862 27.159a1 1 0 0 1-1.618 1.175l-1.763-2.427a1 1 0 1 1 1.618-1.175l1.763 2.427ZM19 30.038a1 1 0 0 1-2 0v-3a1 1 0 1 1 2 0v3ZM11.755 28.334a1 1 0 0 0-1.618-1.175l1.764-2.427a1 1 0 1 1 1.618 1.175l-1.764 2.427ZM6.896 22.697a1 1 0 1 1-.618-1.902l2.853-.927a1 1 0 1 1 .618 1.902l-2.853.927ZM6.278 15.28a1 1 0 1 1 .618-1.901l2.853.927a1 1 0 1 1-.618 1.902l-2.853-.927ZM10.137 8.918a1 1 0 0 1 1.618-1.176l1.764 2.427a1 1 0 0 1-1.618 1.176l-1.764-2.427Z"/></svg>`,
      dark:  `<svg class="mob-pill__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36"><path fill="currentColor" d="M12.5 8.473a10.968 10.968 0 0 1 8.785-.97 7.435 7.435 0 0 0-3.737 4.672l-.09.373A7.454 7.454 0 0 0 28.732 20.4a10.97 10.97 0 0 1-5.232 7.125l-.497.27c-5.014 2.566-11.175.916-14.234-3.813l-.295-.483C5.53 18.403 7.13 11.93 12.017 8.77l.483-.297Zm4.234.616a8.946 8.946 0 0 0-2.805.883l-.429.234A9 9 0 0 0 10.206 22.5l.241.395A9 9 0 0 0 22.5 25.794l.416-.255a8.94 8.94 0 0 0 2.167-1.99 9.433 9.433 0 0 1-2.782-.313c-5.043-1.352-8.036-6.535-6.686-11.578l.147-.491c.242-.745.573-1.44.972-2.078Z"/></svg>`,
    };

    document.body.insertAdjacentHTML('beforeend', `
      <div class="floating-controls">
        <div class="glass-hamburger" id="glassBtn" role="button" tabindex="0" aria-label="Open navigation">
          <div class="hamburger-icon"><span></span><span></span><span></span></div>
          <div class="hamburger-close-hit" id="glassClose"></div>
          <div class="glass-nav-content">
            <ul class="glass-nav-links">${linksHTML}</ul>
          </div>
        </div>
      </div>
      <div class="floating-theme-pill">
        <div class="mob-pill">
          <label class="mob-pill__opt" title="Light">
            <input class="mob-pill__radio" type="radio" name="theme" value="light" />
            ${pillSVGs.light}
          </label>
          <label class="mob-pill__opt" title="Dark">
            <input class="mob-pill__radio" type="radio" name="theme" value="dark" />
            ${pillSVGs.dark}
          </label>
        </div>
      </div>
    `);
  })();

  /* ── Reading progress bar ── */
  const progressBar = document.querySelector('.reading-progress');
  window.addEventListener('scroll', () => {
    if (!progressBar) return;
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    progressBar.style.width = pct + '%';
  });

  /* ── THEME COLOR META ── */
  function setThemeColor(theme) {
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1C1208' : '#FDFBF7');
  }

  /* ── IFRAME THEME SYNC ── */
  function syncWidgetTheme(theme) {
    const iframe = document.querySelector('.book-widget-frame');
    if (!iframe) return;
    const send = () => iframe.contentWindow?.postMessage({ theme }, '*');
    send();
    if (!iframe.dataset.bound) {
      iframe.dataset.bound = 'true';
      iframe.addEventListener('load', send);
    }
  }

  /* ── IFRAME SHIELD ── */
  (function () {
    const iframe = document.querySelector('.book-widget-frame');
    const shield = document.querySelector('.iframe-shield');
    if (!iframe || !shield) return;
    let t;
    function reset() {
      iframe.contentWindow?.postMessage('FORCE_LEAVE', '*');
      iframe.contentWindow?.postMessage('RESET_BOOK', '*');
      shield.style.pointerEvents = 'auto';
      clearTimeout(t);
      t = setTimeout(() => { shield.style.pointerEvents = 'none'; }, 100);
    }
    window.addEventListener('scroll', reset);
    iframe.addEventListener('wheel', reset, { passive: true });
    iframe.addEventListener('touchstart', reset, { passive: true });
    iframe.addEventListener('mouseleave', reset);
  })();

  /* ── THEME — instant snap ── */
window.applyTheme = function(theme) {
    // Trigger smooth transition on all elements
    document.documentElement.classList.add('theme-transitioning');
    clearTimeout(window._themeTransTimer);
    window._themeTransTimer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 400);

    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');

    document.querySelectorAll('input[name="theme"]').forEach(i => {
      i.checked = (i.value === theme);
    });

    localStorage.setItem('theme', theme);
    setThemeColor(theme);
    syncWidgetTheme(theme);

    /* ── GISCUS THEME SYNC ── */
    // Map your theme names to Giscus built-in themes
    const giscusTheme = theme === 'dark' ? 'dark' : 'light';
    const giscusMsg = { giscus: { setConfig: { theme: giscusTheme } } };

    const giscus = document.querySelector('iframe.giscus-frame');
    if (giscus) {
      // If already loaded, send immediately
      if (giscus.contentWindow) {
        giscus.contentWindow.postMessage(giscusMsg, 'https://giscus.app');
      }
      // Re-send once iframe finishes loading (catches page-load race)
      if (!giscus.dataset.themeListenerBound) {
        giscus.dataset.themeListenerBound = 'true';
        giscus.addEventListener('load', () => {
          const savedTheme = localStorage.getItem('theme') || 'light';
          const t = savedTheme === 'dark' ? 'dark' : 'light';
          giscus.contentWindow?.postMessage(
            { giscus: { setConfig: { theme: t } } },
            'https://giscus.app'
          );
        });
      }
    }
  }

  applyTheme(localStorage.getItem('theme') || 'light');
  document.addEventListener('change', e => {
    if (e.target.name === 'theme') applyTheme(e.target.value);
  });

  /* ── MORPHING HAMBURGER ── */
  (function initMorphMenu() {
    // IDs are now in DOM (either from HTML or just injected above)
    const btn    = document.getElementById('glassBtn');
    const closer = document.getElementById('glassClose');
    if (!btn) return;

    function openMenu() {
      btn.classList.add('is-active');
    }
    function closeMenu() {
      btn.classList.remove('is-active');
    }

    /* Div click:
       - When CLOSED: clicking the div opens it
       - When OPEN:   the close-hit div handles closing via stopPropagation */
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('is-active')) openMenu();
    });

    /* Keyboard: Enter/Space to open (accessibility) */
    btn.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !btn.classList.contains('is-active')) {
        e.preventDefault();
        openMenu();
      }
    });

    /* Close-hit: sits over the X icon, stops click reaching the div */
    if (closer) {
      closer.addEventListener('click', e => {
        e.stopPropagation();
        closeMenu();
      });
    }

    /* Nav links: navigate AND close */
    btn.querySelectorAll('.glass-nav-links a').forEach(a => {
      a.addEventListener('click', () => {
        closeMenu();
      });
    });

    /* Outside click closes */
    document.addEventListener('click', e => {
      if (btn.classList.contains('is-active') && !btn.contains(e.target)) {
        closeMenu();
      }
    });

    /* Escape closes */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  })();

  /* ── PAGE LOAD ── */
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    document.querySelectorAll('.progress-bar-fill').forEach(bar => {
      bar.style.width = (bar.dataset.w || 0) + '%';
    });
  });
/* ── MASTER SMOOTH SCROLL & URL FREEZER ── */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;

    const hash = link.hash;
    if (!hash) return;

    // 1. Use the exact URL parser that worked perfectly for your mobile links
    const linkObj = new URL(link.href, window.location.origin);
    const currentObj = new URL(window.location.href);

    const cleanPath = (p) => p.replace(/\/index\.html$/, '').replace(/\/$/, '');
    
    const isSamePage = linkObj.origin === currentObj.origin && 
                       cleanPath(linkObj.pathname) === cleanPath(currentObj.pathname);

    // 2. Intercept and freeze!
    if (isSamePage) {
      e.preventDefault(); // <-- Locks the URL bar securely

      // 3. Glide to section
      if (hash === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const target = document.querySelector(hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // 4. Force close all mobile menus
      const glassBtn = document.getElementById('glassBtn');
      if (glassBtn) glassBtn.classList.remove('is-active');
      const overlayMenu = document.getElementById('navMobileMenu');
      if (overlayMenu) overlayMenu.classList.remove('open');
    }
  });

/* ── HIDE ON SCROLL-DOWN, SHOW ON SCROLL-UP ── */
  // Industry standard (Medium, Notion, Linear):
  //   scrolling down  → user is reading → hide chrome
  //   scrolling up    → user wants nav  → show chrome
  //   at top of page  → always show
  let lastScrollY = window.scrollY;
  const SCROLL_THRESHOLD = 8; // px — ignore tiny jitter / elastic bounce

  function showFloatingButtons() {
    const controls = document.querySelector('.floating-controls');
    const pill = document.querySelector('.floating-theme-pill');
    if (controls) controls.classList.remove('floating-hidden');
    if (pill) pill.classList.remove('floating-hidden');
  }

  function hideFloatingButtons() {
    const glassBtn = document.getElementById('glassBtn');
    // Safety: NEVER hide while the nav menu is open
    if (glassBtn && glassBtn.classList.contains('is-active')) return;

    const controls = document.querySelector('.floating-controls');
    const pill = document.querySelector('.floating-theme-pill');
    if (controls) controls.classList.add('floating-hidden');
    if (pill) pill.classList.add('floating-hidden');
  }

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    // Always show when near the top
    if (currentY < 60) {
      showFloatingButtons();
      lastScrollY = currentY;
      return;
    }

    if (Math.abs(delta) < SCROLL_THRESHOLD) return; // ignore micro-scroll jitter

    if (delta > 0) {
      hideFloatingButtons(); // scrolling down → hide
    } else {
      showFloatingButtons(); // scrolling up → show
    }

    lastScrollY = currentY;
  }, { passive: true });

  /* ── CHAPTER TOGGLE ── */
  window.toggleCh1 = function () {
    document.getElementById('ch1-toggle')?.classList.toggle('open');
    document.getElementById('ch1-topics')?.classList.toggle('open');
  };

});