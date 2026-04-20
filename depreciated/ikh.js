const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = './dots';
const DEST_DIR = './library'; // The new organized folder

// Helper: Converts "Generative Models" to "generative-models"
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// 1. Get all HTML files in the original folder
const files = fs.readdirSync(SOURCE_DIR).filter(file => file.endsWith('.html'));

let successCount = 0;

files.forEach(file => {
    const originalPath = path.join(SOURCE_DIR, file);
    let content = fs.readFileSync(originalPath, 'utf8');

    // 2. Extract Metadata
    // Adjust these regexes depending on how you store your metadata.
    // Currently set up to look for: <meta name="book" content="generative">
    const bookMatch = content.match(/<meta\s+name=["']book["']\s+content=["'](.*?)["']/i);
    const chapterMatch = content.match(/<meta\s+name=["']chapter["']\s+content=["'](.*?)["']/i);

    // Fallbacks if a file is missing metadata
    const book = bookMatch ? bookMatch[1] : 'uncategorized';
    const chapter = chapterMatch ? chapterMatch[1] : 'general';

    // 3. Create the new folder paths
    const bookSlug = slugify(book);
    const chapterSlug = slugify(chapter);
    
    // Example: ./library/generative/autoregressive-models/
    const newDir = path.join(DEST_DIR, bookSlug, chapterSlug);
    const newFilePath = path.join(newDir, file);

    // Create the folders if they don't exist
    if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
    }

    // 4. Fix Relative Paths
    // The file is moving from depth 1 (dots/file.html) to depth 3 (library/book/chapter/file.html)
    // So we need to change "../" to "../../../" to keep CSS/JS links working.
    content = content.replace(/(href|src|data-root)=["']\.\.\//g, '$1="../../../');

    // 5. Write the file to the new location (Copies it, leaving the original safe in /dots)
    fs.writeFileSync(newFilePath, content);
    console.log(`✅ Copied: ${file} -> ${bookSlug}/${chapterSlug}/${file}`);
    successCount++;
});

console.log(`\n🎉 Successfully organized ${successCount} files into ${DEST_DIR}/`);