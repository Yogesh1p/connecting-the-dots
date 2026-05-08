const fs = require('fs');
const path = require('path');
const ROOT_DIR = '/Users/yogesh/Documents/connecting-the-dots';

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to find and remove the script we injected
    const scriptRegex = /\s*<script id="theme-logic">[\s\S]*?<\/script>\n?/g;
    const fallbackRegex = /<script id="theme-logic">[\s\S]*?<\/script>\n?/g;

    if (scriptRegex.test(content) || fallbackRegex.test(content)) {
        content = content.replace(scriptRegex, '');
        content = content.replace(fallbackRegex, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`🧹 Cleaned up: ${filePath}`);
    }
}

function walkDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            walkDirectory(fullPath);
        } else if (file.endsWith('.html')) {
            cleanFile(fullPath);
        }
    });
}

console.log("Cleaning up injected scripts...");
walkDirectory(ROOT_DIR);
console.log("Done! Your code is clean again.");