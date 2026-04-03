/* ============================================================
   components.js — Loads global UI elements
   Supports sticky/static navbar via HTML data attribute
   Adds reusable route intelligence helpers
   ============================================================ */

// 1. AUTO-CLEAN URLs
if (window.location.pathname.endsWith('index.html')) {
  const cleanUrl = window.location.href.replace(/\/index\.html/i, '/');
  window.history.replaceState(null, '', cleanUrl);
}

/* ============================================================
   ROUTE HELPERS
   Reusable semantic route detection layer
   ============================================================ */
function getCurrentPath() {
  return window.location.pathname.toLowerCase();
}

function isInSection(sectionName) {
  return getCurrentPath().includes(`/${sectionName.toLowerCase()}/`);
}

function getCurrentSection() {
  const path = getCurrentPath();

  if (path.includes('/dots/')) return 'dots';
  if (path.includes('/library/')) return 'library';
  return 'home';
}

function initGlobalNavigation(options = {}) {
  const navPlaceholder = document.getElementById('global-nav');
  let root = '';

  const stickyFromOptions = options.sticky ?? true;

  if (navPlaceholder) {
    root = navPlaceholder.getAttribute('data-root') || '';
  }

  // Route intelligence
  const currentSection = getCurrentSection();
  const isDots = currentSection === 'dots';
  const isLibrary = currentSection === 'library';

  // Inject favicon globally
  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = root + 'assets/favicon.svg';
    document.head.appendChild(favicon);
  }

  const homePath = root === '' ? './' : root;
  const anchorPrefix = root === '' ? '' : root;

  const NAV_LINKS = [
    { href: homePath, label: 'Home', section: 'home' },
    { href: root + 'Library/', label: 'Library', section: 'library' },
    { href: root + 'dots/', label: 'Dots', section: 'dots' },
    { href: anchorPrefix + '#contribute', label: 'Contribute' },
    {
      href: 'https://github.com/Yogesh1p/connecting-the-dots',
      label: 'GitHub',
      target: '_blank'
    },
  ];

  const drawerLinksHTML = NAV_LINKS.map(l => {
    const isActive = l.section === currentSection;

    return `
      <li>
        <a href="${l.href}"
           ${isActive ? 'style="color: var(--accent);"' : ''}
           ${l.target ? `target="${l.target}" rel="noopener"` : ''}>
          ${l.label}
        </a>
      </li>
    `;
  }).join('');

  const themeToggleHTML = `
    <button class="theme-toggle" aria-label="Toggle theme" type="button">
      <svg
        class="sun-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>

      <svg
        class="moon-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  `;

  if (navPlaceholder) {
    const fullNavHTML = `
      <nav class="${stickyFromOptions ? 'nav-sticky' : 'nav-static'}">
        <div class="mobile-top-controls" id="mobileTopControls">
          <div class="top-ham" id="topHamBtn" role="button" tabindex="0" aria-label="Open navigation">
            <span></span><span></span><span></span>
          </div>

          <a href="${homePath}" class="top-logo" style="display:flex;align-items:center;line-height:1;">
            <img src="${root}assets/favicon.svg" alt="Home" style="width:28px;height:28px;display:block;">
          </a>

          ${themeToggleHTML}
        </div>

        <div class="top-drawer" id="topDrawer">
          <ul class="top-drawer-links" id="topDrawerLinks" style="text-align:center">
            ${drawerLinksHTML}
          </ul>
        </div>

        <a href="${homePath}" class="nav-desktop-only" style="display:flex;align-items:center;line-height:1;">
          <img src="${root}assets/favicon.svg" alt="Home" style="width:28px;height:28px;display:block;">
        </a>

        <div class="nav-center nav-desktop-only">
          <a href="${root}Library/" ${isLibrary ? 'style="color: var(--accent);"' : ''}>Library</a>
          <a href="${root}dots/" ${isDots ? 'style="color: var(--accent);"' : ''}>Dots</a>
        </div>

        <div class="nav-right nav-desktop-only">
          ${themeToggleHTML}
          <a href="${anchorPrefix}#contribute">Contribute</a>
          <a href="https://github.com/Yogesh1p/connecting-the-dots" target="_blank" class="github-link">
            <img src="${root}assets/github.svg" class="github-icon" alt="GitHub">
          </a>
        </div>
      </nav>
    `;

    navPlaceholder.outerHTML = fullNavHTML;
  }
}

/* =========================================
   AUTO INIT USING HTML ATTRIBUTE
   ========================================= */
const navRoot = document.getElementById('global-nav');
const stickyAttr = navRoot?.dataset?.sticky;
const shouldStick = stickyAttr !== 'false';

initGlobalNavigation({
  sticky: shouldStick
});

document.addEventListener('DOMContentLoaded', () => {
  // 1. INCOMING HASH CLEANUP
  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 50);
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  // 2. THEME LOGIC
  const htmlEl = document.documentElement;

  const applyTheme = (theme) => {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}

    const metaThemeColor = document.getElementById('theme-color-meta');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#16100C' : '#FDFBF7');
    }

    const giscusThemeUrl = theme === 'dark'
      ? 'https://yogesh1p.github.io/connecting-the-dots/css/giscus-theme-dark.css'
      : 'https://yogesh1p.github.io/connecting-the-dots/css/giscus-theme-light.css';

    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: giscusThemeUrl } } },
        'https://giscus.app'
      );
    }
  };

  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('theme') || 'light'; } catch (e) {}
  applyTheme(savedTheme);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-toggle');
    if (!btn) return;

    const currentTheme = htmlEl.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  });

  // 3. MOBILE DRAWER LOGIC
  const topHam = document.getElementById('topHamBtn');
  const topDrawer = document.getElementById('topDrawer');

  if (topHam && topDrawer) {
    function openDrawer() {
      topHam.classList.add('is-open');
      topDrawer.classList.add('is-open');
    }

    function closeDrawer() {
      topHam.classList.remove('is-open');
      topDrawer.classList.remove('is-open');
    }

    function toggleDrawer() {
      topHam.classList.contains('is-open') ? closeDrawer() : openDrawer();
    }

    topHam.addEventListener('click', toggleDrawer);
    topHam.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDrawer();
      }
    });

    topDrawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

    document.addEventListener('click', e => {
      if (
        topDrawer.classList.contains('is-open') &&
        !topHam.contains(e.target) &&
        !topDrawer.contains(e.target)
      ) {
        closeDrawer();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  // 4. SMOOTH SCROLL INTERCEPTOR
  document.querySelectorAll('a').forEach(anchor => {
    const href = anchor.getAttribute('href') || '';
    if (href.includes('#')) {
      anchor.addEventListener('click', function (e) {
        const parts = href.split('#');
        const targetId = parts[1];
        const targetEl = document.getElementById(targetId);

        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });
});

/* ============================================================
   INJECTABLE COMPONENTS
   Reusable Giscus injector for dots + experiments
   ============================================================ */
window.injectGiscusComments = function(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (el.dataset.giscusLoaded === 'true') return;
  el.dataset.giscusLoaded = 'true';

  if (!document.getElementById('giscus-inject-styles')) {
    const style = document.createElement('style');
    style.id = 'giscus-inject-styles';
    style.textContent = `
      .article-discussion-wrap {
        max-width: 720px;
        margin: 4rem auto 2rem auto;
        padding-top: 2rem;
        border-top: 1px solid var(--border);
      }

      .article-discussion-wrap > p {
        text-align: center;
        color: var(--muted);
        font-family: var(--font-sans, system-ui, sans-serif);
        margin-bottom: 2rem;
      }

      .giscus-box {
        width: 100%;
        min-height: 300px;
      }
    `;
    document.head.appendChild(style);
  }

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

  const giscusThemeUrl = isDark
    ? 'https://yogesh1p.github.io/connecting-the-dots/css/giscus-theme-dark.css'
    : 'https://yogesh1p.github.io/connecting-the-dots/css/giscus-theme-light.css';

  el.className = 'article-discussion-wrap';
  el.innerHTML = `
    <p>Discussion & Questions</p>
    <div class="giscus-box"></div>
  `;

  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';

  script.setAttribute('data-repo', 'Yogesh1p/connecting-the-dots');
  script.setAttribute('data-repo-id', 'R_kgDORe41-g');
  script.setAttribute('data-category', 'Dots');
  script.setAttribute('data-category-id', 'DIC_kwDORe41-s4C4NaS');
  script.setAttribute('data-mapping', 'pathname');
  script.setAttribute('data-strict', '1');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'bottom');
  script.setAttribute('data-theme', giscusThemeUrl);
  script.setAttribute('data-lang', 'en');

  el.querySelector('.giscus-box').appendChild(script);
};