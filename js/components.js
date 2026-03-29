/* ============================================================
   components.js — Loads global UI elements
   Handles both Desktop and Mobile Navigation injection
   ============================================================ */

function initGlobalNavigation() {
  const navPlaceholder = document.getElementById('global-nav');
  let root = '';
  
  // If navPlaceholder exists, we use its data-root attribute
  if (navPlaceholder) {
    root = navPlaceholder.getAttribute('data-root') || '';
  }

  // 1. Define the Navigation Data
  const NAV_LINKS = [
    { href: root + 'index.html', label: 'Home' },
    { href: root + 'index.html#chapters', label: 'Chapters' },
    { href: root + 'experiments/hub.html', label: 'Experiments' },
    { href: root + 'index.html#contribute', label: 'Contribute' },
    { href: 'https://github.com/Yogesh1p/connecting-the-dots', label: 'GitHub', target: '_blank' },
  ];

  const drawerLinksHTML = NAV_LINKS.map(l =>
    `<li><a href="${l.href}"${l.target ? ` target="${l.target}" rel="noopener"` : ''}>${l.label}</a></li>`
  ).join('');

  const pillSVGs = {
    light: `<svg class="top-pill__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36"><path fill="currentColor" fill-rule="evenodd" d="M18 12a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" clip-rule="evenodd"/><path fill="currentColor" d="M17 6.038a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0v-3ZM24.244 7.742a1 1 0 1 1 1.618 1.176L24.1 11.345a1 1 0 1 1-1.618-1.176l1.763-2.427ZM29.104 13.379a1 1 0 0 1 .618 1.902l-2.854.927a1 1 0 1 1-.618-1.902l2.854-.927ZM29.722 20.795a1 1 0 0 1-.619 1.902l-2.853-.927a1 1 0 1 1 .618-1.902l2.854.927ZM25.862 27.159a1 1 0 0 1-1.618 1.175l-1.763-2.427a1 1 0 1 1 1.618-1.175l1.763 2.427ZM19 30.038a1 1 0 0 1-2 0v-3a1 1 0 1 1 2 0v3ZM11.755 28.334a1 1 0 0 0-1.618-1.175l1.764-2.427a1 1 0 1 1 1.618 1.175l-1.764 2.427ZM6.896 22.697a1 1 0 1 1-.618-1.902l2.853-.927a1 1 0 1 1 .618 1.902l-2.853.927ZM6.278 15.28a1 1 0 1 1 .618-1.901l2.853.927a1 1 0 1 1-.618 1.902l-2.853-.927ZM10.137 8.918a1 1 0 0 1 1.618-1.176l1.764 2.427a1 1 0 0 1-1.618 1.176l-1.764-2.427Z"/></svg>`,
    dark:  `<svg class="top-pill__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36"><path fill="currentColor" d="M12.5 8.473a10.968 10.968 0 0 1 8.785-.97 7.435 7.435 0 0 0-3.737 4.672l-.09.373A7.454 7.454 0 0 0 28.732 20.4a10.97 10.97 0 0 1-5.232 7.125l-.497.27c-5.014 2.566-11.175.916-14.234-3.813l-.295-.483C5.53 18.403 7.13 11.93 12.017 8.77l.483-.297Zm4.234.616a8.946 8.946 0 0 0-2.805.883l-.429.234A9 9 0 0 0 10.206 22.5l.241.395A9 9 0 0 0 22.5 25.794l.416-.255a8.94 8.94 0 0 0 2.167-1.99 9.433 9.433 0 0 1-2.782-.313c-5.043-1.352-8.036-6.535-6.686-11.578l.147-.491c.242-.745.573-1.44.972-2.078Z"/></svg>`,
  };

  // 2. ONLY inject if there's a placeholder (Child Pages)
  if (navPlaceholder) {
    const fullNavHTML = `
      <nav>
        <div class="mobile-top-controls" id="mobileTopControls">
          <div class="top-ham" id="topHamBtn" role="button" tabindex="0" aria-label="Open navigation">
            <span></span><span></span><span></span>
          </div>
          <a href="${root}index.html" class="top-logo" style="display:flex;align-items:center;line-height:1;">
            <img src="${root}assets/favicon.svg" alt="Home" style="width:28px;height:28px;display:block;">
          </a>
          <div class="top-pill">
            <label class="top-pill__opt" title="Light">
              <input class="top-pill__radio" type="radio" name="top-theme" value="light" />
              ${pillSVGs.light}
            </label>
            <label class="top-pill__opt" title="Dark">
              <input class="top-pill__radio" type="radio" name="top-theme" value="dark" />
              ${pillSVGs.dark}
            </label>
          </div>
        </div>
        
        <div class="top-drawer" id="topDrawer">
          <ul class="top-drawer-links" id="topDrawerLinks" style="text-align:left">${drawerLinksHTML}</ul>
        </div>

        <a href="${root}index.html" class="nav-desktop-only" style="display:flex;align-items:center;line-height:1;">
          <img src="${root}assets/favicon.svg" alt="Home" style="width:28px;height:28px;display:block;">
        </a>
        <a href="${root}index.html#chapters" class="nav-desktop-only">Chapters</a>
        <a href="${root}index.html#taxonomy" class="nav-desktop-only">Taxonomy</a>
        <a href="${root}experiments/hub.html" class="exp-nav nav-desktop-only" style="color: var(--accent);">
          <img src="${root}assets/exp.svg" alt="Experiments" class="exp-icon">
          <span>Experiments</span>
        </a>
        <div class="nav-right nav-desktop-only">
          <fieldset class="switcher" aria-label="Theme switcher">
            <legend class="switcher__legend">Choose theme</legend>
            <label class="switcher__option">
              <input class="switcher__input" type="radio" name="theme" value="light" />
              <svg class="switcher__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36"><path fill="var(--c)" fill-rule="evenodd" d="M18 12a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" clip-rule="evenodd"/><path fill="var(--c)" d="M17 6.038a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0v-3ZM24.244 7.742a1 1 0 1 1 1.618 1.176L24.1 11.345a1 1 0 1 1-1.618-1.176l1.763-2.427ZM29.104 13.379a1 1 0 0 1 .618 1.902l-2.854.927a1 1 0 1 1-.618-1.902l2.854-.927ZM29.722 20.795a1 1 0 0 1-.619 1.902l-2.853-.927a1 1 0 1 1 .618-1.902l2.854.927ZM25.862 27.159a1 1 0 0 1-1.618 1.175l-1.763-2.427a1 1 0 1 1 1.618-1.175l1.763 2.427ZM19 30.038a1 1 0 0 1-2 0v-3a1 1 0 1 1 2 0v3ZM11.755 28.334a1 1 0 0 1-1.618-1.175l1.764-2.427a1 1 0 1 1 1.618 1.175l-1.764 2.427ZM6.896 22.697a1 1 0 1 1-.618-1.902l2.853-.927a1 1 0 1 1 .618 1.902l-2.853.927ZM6.278 15.28a1 1 0 1 1 .618-1.901l2.853.927a1 1 0 1 1-.618 1.902l-2.853-.927ZM10.137 8.918a1 1 0 0 1 1.618-1.176l1.764 2.427a1 1 0 0 1-1.618 1.176l-1.764-2.427Z"/></svg>
            </label>
            <label class="switcher__option">
              <input class="switcher__input" type="radio" name="theme" value="dark" />
              <svg class="switcher__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36"><path fill="var(--c)" d="M12.5 8.473a10.968 10.968 0 0 1 8.785-.97 7.435 7.435 0 0 0-3.737 4.672l-.09.373A7.454 7.454 0 0 0 28.732 20.4a10.97 10.97 0 0 1-5.232 7.125l-.497.27c-5.014 2.566-11.175.916-14.234-3.813l-.295-.483C5.53 18.403 7.13 11.93 12.017 8.77l.483-.297Zm4.234.616a8.946 8.946 0 0 0-2.805.883l-.429.234A9 9 0 0 0 10.206 22.5l.241.395A9 9 0 0 0 22.5 25.794l.416-.255a8.94 8.94 0 0 0 2.167-1.99 9.433 9.433 0 0 1-2.782-.313c-5.043-1.352-8.036-6.535-6.686-11.578l.147-.491c.242-.745.573-1.44.972-2.078Z"/></svg>
            </label>
          </fieldset>
          <a href="${root}index.html#contribute" class="nav-desktop-only">Contribute</a>
          <a href="https://github.com/Yogesh1p/connecting-the-dots" target="_blank" class="github-link">
            <img src="${root}assets/github.svg" class="github-icon" alt="GitHub">
          </a>
        </div>
      </nav>
    `;
    // Single write to the DOM (Zero Race Conditions)
    navPlaceholder.outerHTML = fullNavHTML;
    
  } else {
    // 3. Fallback for Index.html: Ensure drawer links exist if the HTML is hardcoded but empty
    const linksList = document.getElementById('topDrawerLinks');
    if (linksList && !linksList.children.length) {
      linksList.innerHTML = drawerLinksHTML;
    }
  }
}

// Build the HTML synchronously so the page doesn't flash
initGlobalNavigation();

// ============================================================
// WIRE UP EVENT LISTENERS (Waits for the DOM to settle)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Sync theme checkmarks for newly injected toggles
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.querySelectorAll('input[name="theme"], input[name="top-theme"]').forEach(radio => {
    radio.checked = (radio.value === savedTheme);
  });

  // 2. Mobile Drawer Logic (Hooks onto elements regardless of if they were injected or hardcoded)
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
});