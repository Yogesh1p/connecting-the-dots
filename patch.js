const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

// The old patch applied height:auto to ALL iframes, which collapses
// the Giscus iframe since it sets its own height dynamically via postMessage.
// We replace it to exclude .giscus-frame from the height:auto rule.
const OLD_RULE = `img, iframe, video {
            max-width: 100% !important;
            height: auto !important;
        }`;

const FIXED_RULE = `img, video {
            max-width: 100% !important;
            height: auto !important;
        }
        iframe:not(.giscus-frame) {
            max-width: 100% !important;
            height: auto !important;
        }`;

function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('id="mobile-view-styles"')) {
    console.log(`⏭️  No mobile-view-styles found, skipping: ${filePath}`);
    return;
  }

  if (content.includes('iframe:not(.giscus-frame)')) {
    console.log(`⏭️  Already patched: ${filePath}`);
    return;
  }

  const updated = content.replace(OLD_RULE, FIXED_RULE);
  if (updated === content) {
    console.log(`⚠️  Could not find target rule in: ${filePath}`);
    return;
  }

  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`✅ Fixed Giscus iframe clipping in: ${filePath}`);
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

console.log('🔍 Fixing Giscus iframe height clipping...');
walkDirectory(ROOT_DIR);
console.log('✅ Done!');