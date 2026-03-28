// components.js — Loads global UI elements

function loadGlobalNav() {
  const navPlaceholder = document.getElementById('global-nav');
  if (!navPlaceholder) return;

  // Get the relative path to the root directory
  const root = navPlaceholder.getAttribute('data-root') || '';

  // 1. The Main Desktop Navigation
  const desktopNav = `
    <nav>
      <a href="${root}index.html" style="display:flex;align-items:center;line-height:1;">
        <img src="${root}assets/favicon.svg" alt="Home" style="width:28px;height:28px;display:block;">
      </a>
      <a href="${root}experiments/hub.html">← Hub</a>
      <a href="${root}index.html#chapters">Chapters</a>

      <div class="nav-right">
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </button>
        <a href="https://github.com/Yogesh1p/connecting-the-dots" target="_blank" class="github-link">
          <img src="${root}assets/github.svg" class="github-icon" alt="GitHub">
        </a>
        <button class="nav-hamburger" id="navHamburger" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;

  // 2. The Mobile Overlay Menu
  const mobileNav = `
    <div class="nav-mobile-menu" id="navMobileMenu">
      <button class="nav-mobile-close" id="navMobileClose" aria-label="Close menu">✕</button>
      <a href="${root}index.html" onclick="closeMobileMenu()">← Home</a>
      <a href="${root}experiments/hub.html" onclick="closeMobileMenu()">← Hub</a>
      <a href="${root}index.html#chapters" onclick="closeMobileMenu()">Chapters</a>
      <div class="mobile-toggle-row">
        <a href="${root}index.html#contribute" onclick="closeMobileMenu()">Contribute</a>
      </div>
      <a href="https://github.com/Yogesh1p/connecting-the-dots" target="_blank">GitHub</a>
    </div>
  `;

  // Swap out the placeholder div entirely for the <nav> element
  navPlaceholder.outerHTML = desktopNav;

  // Inject the mobile menu directly into the <body>, outside of <main>
  document.body.insertAdjacentHTML('afterbegin', mobileNav);
}

// Run immediately
loadGlobalNav();