/* ============================================================
   components.js — Loads global UI elements
   Handles both Desktop and Mobile Navigation injection
   ============================================================ */

// 1. AUTO-CLEAN URLs: Instantly strip 'index.html' from the URL bar on load
if (window.location.pathname.endsWith('index.html')) {
  const cleanUrl = window.location.href.replace(/\/index\.html/i, '/');
  window.history.replaceState(null, '', cleanUrl);
}

function initGlobalNavigation() {
  const navPlaceholder = document.getElementById('global-nav');
  let root = '';
  
  if (navPlaceholder) {
    root = navPlaceholder.getAttribute('data-root') || '';
  }

  // Inject Favicon globally
  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = root + 'assets/favicon.svg';
    document.head.appendChild(favicon);
  }
  
  const currentPath = window.location.pathname.toLowerCase();
  const isArticles = currentPath.includes('/articles/');
  const isExperiments = currentPath.includes('/experiments/');

  // Smart routing for clean URLs
  const homePath = root === '' ? './' : root;
  const anchorPrefix = root === '' ? '' : root; 

  const NAV_LINKS = [
    { href: homePath, label: 'Home' },
    { href: anchorPrefix + '#chapters', label: 'Chapters' },
    { href: root + 'articles/', label: 'Articles' },
    { href: root + 'experiments/', label: 'Experiments' },
    { href: anchorPrefix + '#contribute', label: 'Contribute' },
    { href: 'https://github.com/Yogesh1p/connecting-the-dots', label: 'GitHub', target: '_blank' },
  ];

  const drawerLinksHTML = NAV_LINKS.map(l => {
    const isActive = (l.label === 'Articles' && isArticles) || (l.label === 'Experiments' && isExperiments);
    return `<li><a href="${l.href}" ${isActive ? 'style="color: var(--accent);"' : ''} ${l.target ? ` target="${l.target}" rel="noopener"` : ''}>${l.label}</a></li>`;
  }).join('');

  // The Pure Button Toggle
  const themeToggleHTML = `
    <button class="theme-toggle" aria-label="Toggle theme" type="button">
      <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    </button>
  `;

  if (navPlaceholder) {
    const fullNavHTML = `
      <nav>
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
          <ul class="top-drawer-links" id="topDrawerLinks" style="text-align:center">${drawerLinksHTML}</ul>
        </div>

        <a href="${homePath}" class="nav-desktop-only" style="display:flex;align-items:center;line-height:1;">
          <img src="${root}assets/favicon.svg" alt="Home" style="width:28px;height:28px;display:block;">
        </a>
        
        <div class="nav-center nav-desktop-only">
          <a href="${anchorPrefix}#chapters">Chapters</a>
          <a href="${anchorPrefix}#taxonomy">Taxonomy</a>
          <a href="${root}articles/" ${isArticles ? 'style="color: var(--accent);"' : ''}>Articles</a> 
          <a href="${root}experiments/" ${isExperiments ? 'style="color: var(--accent);"' : ''}>Experiments</a>
        </div>
        
        <div class="nav-right nav-desktop-only">
          <div class="nav-search" style="margin-right: 1.5rem; display: flex; align-items: center;">
            <input type="text" id="globalSearch" placeholder="Search articles..." 
                   style="padding: 0.35rem 0.8rem; border-radius: 20px; border: 1px solid var(--text-dim); background: transparent; color: inherit; font-family: inherit; font-size: 0.85rem; outline: none; transition: border-color 0.2s ease;"
                   onfocus="this.style.borderColor='var(--text-main)';"
                   onblur="this.style.borderColor='var(--text-dim)';"
                   onkeypress="if(event.key === 'Enter' && this.value.trim() !== '') window.location.href='${root}articles/?q=' + encodeURIComponent(this.value.trim());">
          </div>

          ${themeToggleHTML}

          <a href="${anchorPrefix}#contribute" class="nav-desktop-only">Contribute</a>
          <a href="https://github.com/Yogesh1p/connecting-the-dots" target="_blank" class="github-link">
            <img src="${root}assets/github.svg" class="github-icon" alt="GitHub">
          </a>
        </div>
      </nav>
    `;
    navPlaceholder.outerHTML = fullNavHTML;
    
  } else {
    const linksList = document.getElementById('topDrawerLinks');
    if (linksList && !linksList.children.length) {
      linksList.innerHTML = drawerLinksHTML;
    }
  }
}

initGlobalNavigation();

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. INCOMING HASH CLEANUP
  // If we arrive from another page with a hash (e.g., /articles/ -> /#chapters)
  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      // Scroll to the element after a tiny delay so the DOM finishes painting
      setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 50);
    }
    // Instantly wipe the hash from the URL bar without reloading
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
    document.querySelectorAll('iframe').forEach(iframe => {
      try {
        if (iframe.contentDocument) {
          iframe.contentDocument.documentElement.setAttribute('data-theme', theme);
        }
      } catch (err) {}
    });
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
  const topHam    = document.getElementById('topHamBtn');
  const topDrawer = document.getElementById('topDrawer');

  if (topHam && topDrawer) {
    function openDrawer()  { topHam.classList.add('is-open');    topDrawer.classList.add('is-open');    }
    function closeDrawer() { topHam.classList.remove('is-open'); topDrawer.classList.remove('is-open'); }
    function toggleDrawer() { topHam.classList.contains('is-open') ? closeDrawer() : openDrawer(); }

    topHam.addEventListener('click', toggleDrawer);
    topHam.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDrawer(); }
    });

    topDrawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

    document.addEventListener('click', e => {
      if (topDrawer.classList.contains('is-open') &&
          !topHam.contains(e.target) && !topDrawer.contains(e.target)) closeDrawer();
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  }

  // 4. SMOOTH SCROLL INTERCEPTOR (No URL updates)
  document.querySelectorAll('a').forEach(anchor => {
    const href = anchor.getAttribute('href') || '';
    if (href.includes('#')) {
      anchor.addEventListener('click', function (e) {
        const parts = href.split('#');
        const targetId = parts[1];
        const targetEl = document.getElementById(targetId);
        
        // If the element exists on the CURRENT page, smoothly scroll there
        // and do NOT update the browser URL at all.
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
        // If the element is on a different page, the browser handles it normally
        // and our "Incoming Hash Cleanup" block above will handle it on arrival.
      });
    }
  });
});