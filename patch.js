const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

// The inline theme script sets data-theme from localStorage but never updates
// meta[name="theme-color"]. Since components.js is defer, Safari reads the
// meta tag before JS can update it — and then ignores further updates after scroll.
// Fix: update the meta in the same inline script, synchronously during parse.

const OLD_INLINE_SCRIPT = `<script>
        (() => {
            const theme = localStorage.getItem("theme") || "light";
            if (theme === "dark") {
                document.documentElement.setAttribute("data-theme", "dark");
            }
        })();
    </script>`;

const FIXED_INLINE_SCRIPT = `<script>
        (() => {
            const theme = localStorage.getItem("theme") || "light";
            if (theme === "dark") {
                document.documentElement.setAttribute("data-theme", "dark");
            }
            // Update meta[theme-color] immediately during parse — before any
            // defer scripts run. Safari reads this value on first paint and
            // respects setAttribute only while the tag is being freshly parsed.
            const meta = document.getElementById("meta-theme-color");
            if (meta) {
                meta.setAttribute("content", theme === "dark" ? "#16100C" : "#FDFBF7");
            }
        })();
    </script>`;

function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes('id="meta-theme-color"')) {
        console.log(`⏭️  No meta-theme-color found, skipping: ${filePath}`);
        return;
    }

    if (content.includes('meta-theme-color') && content.includes('getElementById("meta-theme-color")')) {
        console.log(`⏭️  Already patched: ${filePath}`);
        return;
    }

    if (!content.includes(OLD_INLINE_SCRIPT)) {
        console.log(`⚠️  Could not find inline theme script in: ${filePath}`);
        return;
    }

    const updated = content.replace(OLD_INLINE_SCRIPT, FIXED_INLINE_SCRIPT);
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Patched inline theme script in: ${filePath}`);
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

console.log('🔍 Patching inline theme scripts...');
walkDirectory(ROOT_DIR);
console.log('✅ Done!');