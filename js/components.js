/* ============================================================
   components.js — Loads global UI elements
   Supports sticky/static navbar via HTML data attribute
   Adds reusable route intelligence helpers
   ============================================================ */

// 1. AUTO-CLEAN URLs (Safely)
if (window.location.pathname.endsWith('index.html')) {
  const cleanUrl = window.location.href.replace(/\/index\.html/i, '/');
  window.history.replaceState(null, '', cleanUrl);
}

// 2. IMMEDIATE THEME INIT (Prevents FOUC - Flash of Unstyled Content)
const htmlEl = document.documentElement;
const savedTheme = (() => {
  try { return localStorage.getItem('theme') || 'light'; } 
  catch (e) { return 'light'; }
})();
htmlEl.setAttribute('data-theme', savedTheme);

/* ============================================================
   ROUTE HELPERS
   ============================================================ */
const getCurrentPath = () => window.location.pathname.toLowerCase();

function getCurrentSection() {
  const path = getCurrentPath();
  if (path.includes('/dots/')) return 'dots';
  if (path.includes('/library/')) return 'library';
  return 'home';
}

/* ============================================================
   GLOBAL NAVIGATION
   ============================================================ */
function initGlobalNavigation(options = {}) {
  const navPlaceholder = document.getElementById('global-nav');
  if (!navPlaceholder) return;

  const root = navPlaceholder.getAttribute('data-root') || '';
  const stickyFromOptions = options.sticky ?? true;
  const currentSection = getCurrentSection();
  const homePath = root === '' ? './' : root;

  // Inject favicon globally
  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = root + 'assets/favicon.svg';
    document.head.appendChild(favicon);
  }

  const NAV_LINKS = [
    { href: homePath, label: 'Home', section: 'home' },
    { href: root + 'Library/', label: 'Library', section: 'library' },
    { href: root + 'dots/', label: 'Dots', section: 'dots' },
    { href: 'https://github.com/Yogesh1p/connecting-the-dots', label: 'GitHub', target: '_blank' },
  ];

  const drawerLinksHTML = NAV_LINKS.map(l => `
    <li>
      <a href="${l.href}"
         ${l.section === currentSection ? 'style="color: var(--accent);"' : ''}
         ${l.target ? `target="${l.target}" rel="noopener"` : ''}>
        ${l.label}
      </a>
    </li>
  `).join('');

  const themeToggleHTML = `
    <button class="theme-toggle" aria-label="Toggle theme" type="button">
      <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
      <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  `;

  navPlaceholder.outerHTML = `
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
        <a href="${root}Library/" ${currentSection === 'library' ? 'style="color: var(--accent);"' : ''}>Library</a>
        <a href="${root}dots/" ${currentSection === 'dots' ? 'style="color: var(--accent);"' : ''}>Dots</a>
      </div>

      <div class="nav-right nav-desktop-only">
        ${themeToggleHTML}
        <a href="https://github.com/Yogesh1p/connecting-the-dots" target="_blank" class="github-link">
          <img src="${root}assets/github.svg" class="github-icon" alt="GitHub">
        </a>
      </div>
    </nav>
  `;
}



/* ============================================================
   DOM CONTENT LOADED LOGIC
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const navRoot = document.getElementById('global-nav');
  initGlobalNavigation({ sticky: navRoot?.dataset?.sticky !== 'false' });
  
  // 1. SAFE HASH CLEANUP
  // Only scroll to hash if we are NOT on an article page (which handles its own scrolling)
  if (window.location.hash && !document.querySelector('.article-body')) {
    const targetEl = document.getElementById(window.location.hash.substring(1));
    if (targetEl) {
      setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 50);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  // 2. THEME TOGGLING SYNC
  const applyTheme = (theme) => {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}

    const metaThemeColor = document.getElementById('theme-color-meta');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#16100C' : '#FDFBF7');
    }

    // Sync Giscus if it exists
    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
      const giscusThemeUrl = `https://yogesh1p.github.io/connecting-the-dots/css/giscus-theme-${theme}.css`;
      iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusThemeUrl } } }, 'https://giscus.app');
    }
  };

  // Set initial meta colors
const metaThemeColor = document.getElementById('theme-color-meta');
if (metaThemeColor) {
  metaThemeColor.setAttribute('content', savedTheme === 'dark' ? '#16100C' : '#FDFBF7');
}

  document.addEventListener('click', (e) => {
    if (e.target.closest('.theme-toggle')) {
      const currentTheme = htmlEl.getAttribute('data-theme') || 'light';
      applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    }
  });

  // 3. MOBILE DRAWER LOGIC
  const topHam = document.getElementById('topHamBtn');
  const topDrawer = document.getElementById('topDrawer');

  if (topHam && topDrawer) {
    const toggleDrawer = (forceState) => {
      const isOpen = typeof forceState === 'boolean' ? forceState : !topHam.classList.contains('is-open');
      topHam.classList.toggle('is-open', isOpen);
      topDrawer.classList.toggle('is-open', isOpen);
    };

    topHam.addEventListener('click', () => toggleDrawer());
    topHam.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDrawer(); }
    });

    // Close on link click, outside click, or escape key
    document.addEventListener('click', e => {
      if (topDrawer.classList.contains('is-open') && !topHam.contains(e.target) && !topDrawer.contains(e.target)) {
        toggleDrawer(false);
      }
      if (e.target.closest('#topDrawer a')) {
        toggleDrawer(false);
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') toggleDrawer(false);
    });
  }

  // 4. OPTIMIZED SMOOTH SCROLL (Event Delegation)
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href').substring(1);
    const targetEl = document.getElementById(targetId);

    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ============================================================
   INJECTABLE COMPONENTS (Giscus)
   ============================================================ */
window.injectGiscusComments = function(containerId) {
  const el = document.getElementById(containerId);
  if (!el || el.dataset.giscusLoaded === 'true') return;
  el.dataset.giscusLoaded = 'true';

  if (!document.getElementById('giscus-inject-styles')) {
    const style = document.createElement('style');
    style.id = 'giscus-inject-styles';
    style.textContent = `
      .article-discussion-wrap { max-width: 720px; margin: 4rem auto 2rem; padding-top: 2rem; border-top: 1px solid var(--border); }
      .article-discussion-wrap > p { text-align: center; color: var(--muted); font-family: var(--font-sans, system-ui, sans-serif); margin-bottom: 2rem; }
      .giscus-box { width: 100%; min-height: 300px; }
    `;
    document.head.appendChild(style);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const giscusThemeUrl = `https://yogesh1p.github.io/connecting-the-dots/css/giscus-theme-${isDark ? 'dark' : 'light'}.css`;

  el.className = 'article-discussion-wrap';
  el.innerHTML = `<p>Discussion & Questions</p><div class="giscus-box"></div>`;

  const script = document.createElement('script');
  Object.entries({
    src: 'https://giscus.app/client.js',
    crossOrigin: 'anonymous',
    async: true,
    'data-repo': 'Yogesh1p/connecting-the-dots',
    'data-repo-id': 'R_kgDORe41-g',
    'data-category': 'Dots',
    'data-category-id': 'DIC_kwDORe41-s4C4NaS',
    'data-mapping': 'pathname',
    'data-strict': '1',
    'data-reactions-enabled': '1',
    'data-emit-metadata': '0',
    'data-input-position': 'bottom',
    'data-theme': giscusThemeUrl,
    'data-lang': 'en'
  }).forEach(([key, value]) => script.setAttribute(key, value));

  el.querySelector('.giscus-box').appendChild(script);
};