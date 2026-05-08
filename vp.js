const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

// Only injecting the logic and the meta-tag handler
const THEME_INJECTION = `
    <script id="theme-logic">
        (function() {
            // 1. Instantly apply theme to prevent white flash
            const savedTheme = localStorage.getItem('site-theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
            
            if (isDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }

            // 2. Set the mobile status bar color to match your CSS --bg
            let metaTheme = document.querySelector('meta[name="theme-color"]');
            if (!metaTheme) {
                metaTheme = document.createElement('meta');
                metaTheme.name = 'theme-color';
                document.head.appendChild(metaTheme);
            }
            metaTheme.content = isDark ? '#16100C' : '#FDFBF7';
        })();

        // 3. Global toggle function for your sun/moon button
        window.toggleSiteTheme = function() {
            const root = document.documentElement;
            const isDark = root.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            
            if (newTheme === 'dark') {
                root.setAttribute('data-theme', 'dark');
            } else {
                root.removeAttribute('data-theme');
            }
            
            localStorage.setItem('site-theme', newTheme);
            
            // Update the mobile status bar instantly on click
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.content = newTheme === 'dark' ? '#16100C' : '#FDFBF7';
            }
        };
    </script>
`;

function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already injected
    if (content.includes('id="theme-logic"')) {
        console.log(`✅ Skipped (Logic already injected): ${filePath}`);
        return;
    }

    if (content.includes('</head>')) {
        content = content.replace('</head>', `${THEME_INJECTION}\n</head>`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`⚙️ Injected theme logic into: ${filePath}`);
    } else {
        console.log(`⚠️ Skipped (No </head> tag found): ${filePath}`);
    }
}

function walkDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            walkDirectory(fullPath);
        } else if (stat.isFile() && file.endsWith('.html')) {
            processHtmlFile(fullPath);
        }
    });
}

console.log("Starting theme logic injection...");
walkDirectory(ROOT_DIR);
console.log("Injection complete!");