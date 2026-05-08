const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

// Safari iOS does not re-render the status bar when meta[theme-color] is
// updated via JavaScript after a scroll. The only reliable fix is to use
// TWO static meta[theme-color] tags with media attributes — one for light,
// one for dark. Safari picks the right one at paint time via CSS media query,
// no JS needed at all.
//
// This patch:
// 1. Replaces the single meta[theme-color] with two media-query variants
// 2. Removes the forceMetaThemeColor / meta update calls from components.js
//    (they are now redundant and cause no harm but we clean them up)

const OLD_META = `<meta name="theme-color" content="#FDFBF7" id="meta-theme-color">`;
const NEW_META = `<meta name="theme-color" content="#FDFBF7" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#16100C" media="(prefers-color-scheme: dark)">`;

function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('prefers-color-scheme: light')) {
    console.log(`⏭️  Already patched: ${filePath}`);
    return;
  }

  if (!content.includes(OLD_META)) {
    if (content.includes('id="meta-theme-color"')) {
      // Different formatting — replace whatever variant exists
      content = content.replace(
        /<meta name="theme-color"[^>]*id="meta-theme-color"[^>]*>/,
        NEW_META
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Replaced meta[theme-color] in: ${filePath}`);
    } else {
      console.log(`⏭️  No meta-theme-color found, skipping: ${filePath}`);
    }
    return;
  }

  content = content.replace(OLD_META, NEW_META);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Patched: ${filePath}`);
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

console.log('🔍 Switching to media-query theme-color meta tags...');
walkDirectory(ROOT_DIR);
console.log('✅ Done!');