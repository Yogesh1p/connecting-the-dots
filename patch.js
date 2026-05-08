const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Remove the broken theme-color-sync script injected by patch2.js
  //    It uses setAttribute which iOS Safari ignores after scroll, and
  //    calling it on every scroll event breaks subsequent toggle updates.
  if (content.includes('id="theme-color-sync"')) {
    content = content.replace(/<script id="theme-color-sync">[\s\S]*?<\/script>\s*/m, '');
    changed = true;
    console.log(`🗑️  Removed theme-color-sync script from: ${filePath}`);
  }

  // 2. Ensure a hardcoded meta[name="theme-color"] exists in the HTML source.
  //    iOS Safari only respects dynamic meta updates if the tag was present
  //    in the original parsed HTML — JS-created tags are ignored after scroll.
  //    We insert it right after <meta charset> so it's parsed as early as possible.
  if (!content.includes('name="theme-color"')) {
    content = content.replace(
      /(<meta\s+charset=[^>]+>)/i,
      '$1\n    <meta name="theme-color" content="#FDFBF7" id="meta-theme-color">'
    );
    changed = true;
    console.log(`✅ Added hardcoded meta[theme-color] to: ${filePath}`);
  } else {
    // Make sure it has an id so JS can find it reliably
    if (!content.includes('id="meta-theme-color"')) {
      content = content.replace(
        /<meta\s+name="theme-color"[^>]*>/,
        (match) => match.includes('id=') ? match : match.replace('>', ' id="meta-theme-color">')
      );
      changed = true;
      console.log(`✅ Added id to existing meta[theme-color] in: ${filePath}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
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

console.log('🔍 Fixing theme-color meta for iOS Safari...');
walkDirectory(ROOT_DIR);
console.log('✅ Done!');