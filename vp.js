const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

// The new, completely passive observer logic
const THEME_INJECTION = `
    <script id="theme-logic">
        (function() {
            // Function to update the mobile status bar
            function updateMetaThemeColor() {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                let metaTheme = document.querySelector('meta[name="theme-color"]');
                if (!metaTheme) {
                    metaTheme = document.createElement('meta');
                    metaTheme.name = 'theme-color';
                    document.head.appendChild(metaTheme);
                }
                // Matches your --bg hex codes
                metaTheme.content = isDark ? '#16100C' : '#FDFBF7';
            }

            // 1. Run immediately on load to prevent white flash
            updateMetaThemeColor();

            // 2. Watch the <html> tag for ANY changes to the 'data-theme' attribute
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'data-theme') {
                        updateMetaThemeColor();
                    }
                });
            });

            // Start observing immediately
            observer.observe(document.documentElement, { attributes: true });
        })();
    </script>
`;

function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // If the old script exists, replace it entirely using a regular expression
    if (content.includes('id="theme-logic"')) {
        const scriptRegex = /\s*<script id="theme-logic">[\s\S]*?<\/script>/;
        
        if (scriptRegex.test(content)) {
            content = content.replace(scriptRegex, THEME_INJECTION.trim());
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`🔄 Updated theme logic in: ${filePath}`);
        } else {
            // Fallback if the comment is missing but the script ID is there
            const fallbackRegex = /<script id="theme-logic">[\s\S]*?<\/script>/;
            content = content.replace(fallbackRegex, THEME_INJECTION.trim());
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`🔄 Updated (Fallback regex) in: ${filePath}`);
        }
        return;
    }

    // If it doesn't exist at all, inject it before </head>
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

console.log("Starting theme logic injection/update...");
walkDirectory(ROOT_DIR);
console.log("Update complete!");