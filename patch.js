const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

// ─────────────────────────────────────────────
// FIX 1: Replace bad overflow-x patch CSS
// The old patch applied overflow-x:hidden to <body>, which clips
// the Giscus iframe and hides the comments section.
// We now scope overflow-x:hidden only to non-body containers.
// ─────────────────────────────────────────────
const BAD_MOBILE_CSS_MARKER  = 'max-width: 100vw !important;';
const OLD_MOBILE_CSS_BLOCK   = /<style id="mobile-view-styles">[\s\S]*?<\/style>/;

const FIXED_MOBILE_CSS = `
    <style id="mobile-view-styles">
        img, iframe, video {
            max-width: 100% !important;
            height: auto !important;
        }
        @media screen and (max-width: 768px) {
            body, article, .content, main {
                width: 100% !important;
                max-width: 100vw !important;
                padding: 10px 15px !important;
                box-sizing: border-box !important;
            }
            /* FIXED: Do NOT put overflow-x:hidden on body — it clips Giscus iframe.
               Instead, clip only the layout wrappers. */
            article, .content, main, .page-wrap, .reading-container, .reading-content {
                overflow-x: hidden !important;
            }
        }
    </style>
`;

// ─────────────────────────────────────────────
// FIX 2: Robust theme-color meta updater snippet
// Injected once into <head>. Uses a MutationObserver on
// data-theme so the meta always stays in sync — even after
// scroll repaints or nav hide/show transitions trigger
// browser chrome refreshes.
// ─────────────────────────────────────────────
const THEME_COLOR_FIX_MARKER = 'id="theme-color-sync"';
const THEME_COLOR_FIX_SCRIPT = `
    <script id="theme-color-sync">
      (function () {
        var COLORS = { dark: '#16100C', light: '#FDFBF7' };

        function syncMetaThemeColor() {
          var theme = document.documentElement.getAttribute('data-theme') || 'light';
          var color = COLORS[theme] || COLORS.light;
          var meta = document.querySelector('meta[name="theme-color"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
          }
          if (meta.getAttribute('content') !== color) {
            meta.setAttribute('content', color);
          }
        }

        // Run immediately on parse (prevents FOUC on status bar)
        syncMetaThemeColor();

        // Re-sync whenever data-theme attribute changes on <html>
        var observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (m) {
            if (m.attributeName === 'data-theme') syncMetaThemeColor();
          });
        });
        observer.observe(document.documentElement, { attributes: true });

        // Re-sync after scroll ends (mobile browser chrome re-reads meta after repaint)
        var scrollTimer;
        window.addEventListener('scroll', function () {
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(syncMetaThemeColor, 150);
        }, { passive: true });

        // Also re-sync on visibility change (returning from background)
        document.addEventListener('visibilitychange', syncMetaThemeColor);

        window.__syncMetaThemeColor = syncMetaThemeColor;
      })();
    </script>
`;

// ─────────────────────────────────────────────
// File processor
// ─────────────────────────────────────────────
function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // --- Fix 1: Replace old broken mobile CSS block ---
  if (content.includes(BAD_MOBILE_CSS_MARKER)) {
    const updated = content.replace(OLD_MOBILE_CSS_BLOCK, FIXED_MOBILE_CSS.trim());
    if (updated !== content) {
      content = updated;
      changed = true;
      console.log(`🔧 Fixed overflow-x clip in: ${filePath}`);
    }
  }

  // --- Fix 2: Inject theme-color sync script (once per file) ---
  if (!content.includes(THEME_COLOR_FIX_MARKER)) {
    // Inject as the very first thing inside <head> so it runs before any render
    if (content.includes('<head>')) {
      content = content.replace('<head>', '<head>\n' + THEME_COLOR_FIX_SCRIPT.trim());
    } else if (content.includes('</head>')) {
      content = content.replace('</head>', THEME_COLOR_FIX_SCRIPT.trim() + '\n</head>');
    }
    changed = true;
    console.log(`✅ Injected theme-color sync in: ${filePath}`);
  } else {
    console.log(`⏭️  theme-color sync already present: ${filePath}`);
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function walkDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(fullPath);
    } else if (file.endsWith('.html')) {
      processHtmlFile(fullPath);
    }
  });
}

console.log('🔍 Scanning for issues introduced by patch.js...');
walkDirectory(ROOT_DIR);
console.log('✅ patch2.js complete!');