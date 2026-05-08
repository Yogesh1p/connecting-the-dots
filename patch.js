const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

const MOBILE_CSS = `
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
                overflow-x: hidden !important;
            }
        }
    </style>
`;

function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Ensure Viewport Meta exists
    if (!content.includes('name="viewport"')) {
        content = content.replace('</head>', `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>`);
    }

    // 2. Ensure the Mobile CSS exists
    if (!content.includes('max-width: 100vw !important;')) {
        // Inject it right before </head>
        content = content.replace('</head>', `${MOBILE_CSS}</head>`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Patched missing mobile CSS in: ${filePath}`);
    } else {
        console.log(`⏭️  Skipped (Already has mobile CSS): ${filePath}`);
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

console.log("Scanning for missing mobile CSS...");
walkDirectory(ROOT_DIR);
console.log("Patch complete!");