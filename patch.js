const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

// iOS Safari ignores setAttribute() on an existing meta[name="theme-color"]
// after a scroll repaint. The only reliable fix is to REMOVE the meta node
// and INSERT a brand new one — this forces Safari to fully re-read it.
//
// We replace the applyTheme function in components.js with a version that
// always removes and recreates the meta tag instead of updating it in place.

const OLD_APPLY_THEME = `  const applyTheme = (theme) => {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}

    // --- UPDATED LOGIC ---
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#16100C' : '#FDFBF7');
    // ---------------------

    // Sync Giscus if it exists
    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
      const giscusThemeUrl = \`https://yogesh1p.github.io/connecting-the-dots/css/giscus-theme-\${theme}.css\`;
      iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusThemeUrl } } }, 'https://giscus.app');
    }
  };`;

const FIXED_APPLY_THEME = `  // iOS Safari ignores setAttribute on an existing meta[name="theme-color"]
  // after scroll repaints. Removing and recreating the node forces a full re-read.
  const forceMetaThemeColor = (theme) => {
    const color = theme === 'dark' ? '#16100C' : '#FDFBF7';
    const existing = document.querySelector('meta[name="theme-color"]');
    if (existing) existing.remove();
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = color;
    document.head.appendChild(meta);
  };

  const applyTheme = (theme) => {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}

    forceMetaThemeColor(theme);

    // Sync Giscus if it exists
    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
      const giscusThemeUrl = \`https://yogesh1p.github.io/connecting-the-dots/css/giscus-theme-\${theme}.css\`;
      iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusThemeUrl } } }, 'https://giscus.app');
    }
  };`;

// Fix the scroll listener to use forceMetaThemeColor (applied by patch4.js)
const OLD_SCROLL_META = `      // Force-rewrite theme-color meta after nav transform changes.
      // Mobile browsers repaint the status bar when the nav hides/shows,
      // overriding the meta value with the page background color.
      const currentTheme = htmlEl.getAttribute('data-theme') || 'light';
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', currentTheme === 'dark' ? '#16100C' : '#FDFBF7');
      }`;

const FIXED_SCROLL_META = `      // iOS Safari requires removing + recreating the meta node to re-read it.
      const currentTheme = htmlEl.getAttribute('data-theme') || 'light';
      forceMetaThemeColor(currentTheme);`;

// Fix the initial meta set on page load
const OLD_INITIAL_META = `  let initialMetaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!initialMetaThemeColor) {
      initialMetaThemeColor = document.createElement('meta');
      initialMetaThemeColor.name = 'theme-color';
      document.head.appendChild(initialMetaThemeColor);
  }
  initialMetaThemeColor.setAttribute('content', savedTheme === 'dark' ? '#16100C' : '#FDFBF7');`;

const FIXED_INITIAL_META = `  // Use forceMetaThemeColor for initial set — consistent behaviour on iOS Safari.
  forceMetaThemeColor(savedTheme);`;

function patchComponentsJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('forceMetaThemeColor')) {
    console.log(`⏭️  Already patched: ${filePath}`);
    return;
  }

  let updated = content;
  let patched = false;

  if (updated.includes(OLD_APPLY_THEME)) {
    updated = updated.replace(OLD_APPLY_THEME, FIXED_APPLY_THEME);
    patched = true;
    console.log(`✅ Patched applyTheme() in: ${filePath}`);
  } else {
    console.log(`⚠️  Could not find applyTheme() block in: ${filePath}`);
  }

  if (updated.includes(OLD_SCROLL_META)) {
    updated = updated.replace(OLD_SCROLL_META, FIXED_SCROLL_META);
    console.log(`✅ Patched scroll listener meta update in: ${filePath}`);
  }

  if (updated.includes(OLD_INITIAL_META)) {
    updated = updated.replace(OLD_INITIAL_META, FIXED_INITIAL_META);
    console.log(`✅ Patched initial meta set in: ${filePath}`);
  }

  if (patched) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

function walkDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(fullPath);
    } else if (file === 'components.js') {
      patchComponentsJs(fullPath);
    }
  });
}

console.log('🔍 Searching for components.js...');
walkDirectory(ROOT_DIR);
console.log('✅ Done!');