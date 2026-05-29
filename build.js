const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// -----------------------------------------------------------------------
// ⚠️ BUILDER WRITTEN PARSER — DO NOT EDIT MANUALLY DOWN BELOW THIS LINE ⚠️
function extractSectionMetadata(folderName) {
    if (!folderName) return { order: 999, name: 'General' };
    
    const match = folderName.match(/^(\d+)\.(.+)$/);
    let order = 999;
    let rawName = folderName;

    if (match) {
        order = parseInt(match[1], 10);
        rawName = match[2];
    }

    let name = rawName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();

    if (name.toLowerCase().includes('probability') && name.toLowerCase().includes('statistics')) {
        name = "Probability & Statistics";
    }

    return { order, name };
}

function parseFileMetadata(filePath) {
    const absolutePath = path.resolve(filePath);
    const pathParts = absolutePath.split(path.sep);
    
    const libraryIndex = pathParts.findIndex(part => part.toLowerCase() === 'library');
    
    if (libraryIndex === -1 || libraryIndex >= pathParts.length - 2) {
        return { section: "General", sectionOrder: 999, chapter: "Overview", chapterOrder: 999, lessonOrder: 999 };
    }

    const pathSegments = pathParts.slice(libraryIndex + 1);
    
    let rawSection = "";
    let rawChapter = "";
    let rawLesson = "";

    if (pathSegments.length === 5) {
        rawSection = pathSegments[1];
        rawChapter = pathSegments[2];
        rawLesson = pathSegments[3];
    } else if (pathSegments.length === 4) {
        rawSection = pathSegments[1];
        rawChapter = pathSegments[1]; 
        rawLesson = pathSegments[2];
    } else {
        rawSection = pathSegments[1] || "General";
        rawChapter = pathSegments[2] || "General";
        rawLesson = pathSegments[pathSegments.length - 2] || "General";
    }

    const sectionData = extractSectionMetadata(rawSection);
    const chapterData = extractSectionMetadata(rawChapter);
    const lessonData = extractSectionMetadata(rawLesson);

    return {
        section: sectionData.name,
        sectionOrder: sectionData.order,
        chapter: chapterData.name,
        chapterOrder: chapterData.order,
        lessonOrder: lessonData.order
    };
}
// -----------------------------------------------------------------------
// --- CONFIGURATION ---
const SITE_URL = "https://yogesh1p.github.io/connecting-the-dots";

const projectRoot   = __dirname;
const libraryDir    = path.join(projectRoot, "Library");
const builderDir    = path.join(projectRoot, "builder");
const ogOutputDir   = path.join(projectRoot, "assets", "og");
const metaCachePath = path.join(builderDir, ".meta-cache.json");

if (!fs.existsSync(ogOutputDir)) fs.mkdirSync(ogOutputDir, { recursive: true });
if (!fs.existsSync(builderDir))  fs.mkdirSync(builderDir,  { recursive: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHash(content) {
    return crypto.createHash("md5").update(content).digest("hex");
}

function getAllHtmlFiles(dirPath, arrayOfFiles = []) {
    fs.readdirSync(dirPath).forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllHtmlFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith(".html") && !(file === "index.html" && dirPath === libraryDir)) {
            const content = fs.readFileSync(fullPath, "utf8");
            if (content.includes('name="generated_clean_copy"')) return;
            arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
}

function getMeta(content, name) {
    const tag = content.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*>`, "i"));
    if (!tag) return null;
    const val = tag[0].match(/content=["']([^"']+)["']/i);
    return val ? decodeHtmlEntities(val[1]) : null;
}

function decodeHtmlEntities(value) {
    return String(value)
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}

function getTitle(content) {
    const metaTitle = getMeta(content, "title");
    if (metaTitle) return metaTitle;
    const m = content.match(/<title>([^<]+)<\/title>/i);
    return m ? m[1].trim() : "Untitled";
}

function syncReadingTime(content, minutes) {
    const tag = `  <meta name="reading_time" content="${minutes}">`;
    const rx  = /<meta\s+name=["']reading_time["']\s+content=["'][^"']*["']\s*\/?>/i;
    if (rx.test(content)) return content.replace(rx, tag.trim());
    if (/<\/head>/i.test(content)) return content.replace(/<\/head>/i, `${tag}\n</head>`);
    return `${tag}\n${content}`;
}

function estimateReadingTime(content) {
    const text = content
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<head[\s\S]*?<\/head>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ").trim();
    return Math.max(1, Math.ceil(text.split(" ").filter(Boolean).length / 220));
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function getRootPrefix(relativePath) {
    const depth = relativePath.replace(/\\/g, "/").split("/").length;
    return "../".repeat(depth);
}

function ensureHeadTag(content, tag, testRegex) {
    if (testRegex.test(content)) return { content, changed: false };
    if (/<\/head>/i.test(content)) {
        return { content: content.replace(/<\/head>/i, `${tag}\n</head>`), changed: true };
    }
    return { content: `${tag}\n${content}`, changed: true };
}

function ensureCoreArticleHead(content, relativePath) {
    let changed = false;
    const root = getRootPrefix(relativePath);
    const tags = [
        {
            tag: `    <meta name="viewport" content="width=device-width, initial-scale=1.0">`,
            test: /<meta\s+name=["']viewport["']/i
        },
        {
            tag: `    <link rel="preconnect" href="https://fonts.googleapis.com">`,
            test: /<link[^>]+href=["']https:\/\/fonts\.googleapis\.com["']/i
        },
        {
            tag: `    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
            test: /<link[^>]+href=["']https:\/\/fonts\.gstatic\.com["']/i
        },
        {
            tag: `    <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">`,
            test: /fonts\.googleapis\.com\/css2\?family=Lora/i
        },
        {
            tag: `    <link rel="stylesheet" href="${root}css/base.css">`,
            test: /<link[^>]+href=["'][^"']*css\/base\.css["']/i
        },
        {
            tag: `    <link rel="stylesheet" href="${root}css/articles.css">`,
            test: /<link[^>]+href=["'][^"']*css\/articles\.css["']/i
        },
        {
            tag: `    <script src="${root}js/base.js" defer></script>`,
            test: /<script[^+]+src=["'][^"']*js\/base\.js["']/i
        },
        {
            tag: `    <script src="${root}js/components.js" defer></script>`,
            test: /<script[^>]+src=["'][^"']*js\/components\.js["']/i
        },
        {
            tag: `    <script src="${root}js/article_components.js" defer></script>`,
            test: /<script[^>]+src=["'][^"']*js\/article_components\.js["']/i
        }
    ];

    for (const item of tags) {
        const result = ensureHeadTag(content, item.tag, item.test);
        content = result.content;
        changed = changed || result.changed;
    }

    return { content, changed };
}

function ensureGlobalNavRoot(content, relativePath) {
    const root = getRootPrefix(relativePath);
    const rx = /(<div\b[^>]*\bid=["']global-nav["'][^>]*data-root=["'])([^"']*)(["'][^>]*>)/i;

    if (rx.test(content)) {
        const updated = content.replace(rx, `$1${root}$3`);
        return { content: updated, changed: updated !== content };
    }

    const navRx = /(<div\b[^>]*\bid=["']global-nav["'][^>]*)(>)/i;
    if (navRx.test(content)) {
        return { content: content.replace(navRx, `$1 data-root="${root}"$2`), changed: true };
    }

    return { content, changed: false };
}

function ensureArticleAssetRoots(content, relativePath) {
    return ensureGlobalNavRoot(content, relativePath);
}

// NEW HELPER: Handles clean addition/updating of Open Graph meta tags inside the HTML head environment
function ensureOgMetaTags(content, pageObj, ogImageFileName) {
    let changed = false;
    const ogImageUrl = `${SITE_URL}/assets/og/${ogImageFileName}`;
    
    const ogTags = [
        { tag: `    <meta property="og:title" content="${pageObj.title}">`, test: /<meta\s+property=["']og:title["']/i },
        { tag: `    <meta property="og:description" content="${pageObj.description}">`, test: /<meta\s+property=["']og:description["']/i },
        { tag: `    <meta property="og:image" content="${ogImageUrl}">`, test: /<meta\s+property=["']og:image["']/i },
        { tag: `    <meta property="og:type" content="article">`, test: /<meta\s+property=["']og:type["']/i },
        { tag: `    <meta name="twitter:card" content="summary_large_image">`, test: /<meta\s+name=["']twitter:card["']/i }
    ];

    for (const item of ogTags) {
        // If it exists, update it dynamically to point to the correct data state
        if (item.test.test(content)) {
            const oldContent = content;
            if (item.test.source.includes('og:image')) {
                content = content.replace(/<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i, item.tag.trim());
            } else if (item.test.source.includes('og:title')) {
                content = content.replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i, item.tag.trim());
            } else if (item.test.source.includes('og:description')) {
                content = content.replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i, item.tag.trim());
            }
            if (oldContent !== content) changed = true;
        } else {
            const result = ensureHeadTag(content, item.tag, item.test);
            content = result.content;
            changed = changed || result.changed;
        }
    }

    return { content, changed };
}

function getPathOrder(relativePath, index = 0) {
    const segment = relativePath.replace(/\\/g, "/").split("/")[index] || "";
    return getSegmentOrder(segment);
}

function getSegmentOrder(segment) {
    const match = segment.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 999;
}

function stripOrderPrefix(segment) {
    return String(segment || "").replace(/^\d+\s*[._ -]\s*/, "");
}

function getArticleSegments(relativePath) {
    const segments = relativePath.replace(/\\/g, "/").split("/");
    const isIndexPage = segments[segments.length - 1] === "index.html";
    const lessonSegment = isIndexPage ? segments[segments.length - 2] : segments[segments.length - 1].replace(/\.html$/i, "");
    const chapterSegment = isIndexPage ? segments[segments.length - 3] : segments[segments.length - 2];

    return { segments, isIndexPage, lessonSegment, chapterSegment };
}

function toDirectoryUrlPath(relativePath) {
    const sourcePath = relativePath.replace(/\\/g, "/");
    return sourcePath.replace(/\/index\.html$/i, "/");
}

function toCleanUrlPath(relativePath) {
    const publicPath = toDirectoryUrlPath(relativePath);
    return publicPath
        .split("/")
        .map(segment => segment ? stripOrderPrefix(segment) : segment)
        .join("/");
}

function createPageObject(relativePath, content, readingTime) {
    const sourcePath = relativePath.replace(/\\/g, "/");
    const publicPath = toDirectoryUrlPath(sourcePath);
    const cleanPath = toCleanUrlPath(sourcePath);
    const { lessonSegment, chapterSegment } = getArticleSegments(sourcePath);
    
    const diskFallback = parseFileMetadata(path.join(libraryDir, relativePath));

    const bookTitle = getMeta(content, "book") || "Library";
    const bookSlug = getMeta(content, "book_slug") || slugify(bookTitle);
    const pathChapterOrder = getSegmentOrder(chapterSegment);
    const pathLessonOrder = getSegmentOrder(lessonSegment);
    const chapterOrder = pathChapterOrder !== 999 ? pathChapterOrder : (parseInt(getMeta(content, "chapter_order")) || diskFallback.chapterOrder);
    const lessonorder = pathLessonOrder !== 999 ? pathLessonOrder : (parseInt(getMeta(content, "lessonorder")) || diskFallback.lessonOrder);

    return {
        article_id:  getMeta(content, "article_id")  || "",
        url:         `../Library/${publicPath}`,
        cleanUrl:    `../Library/${cleanPath}`,
        sourcePath:  `Library/${sourcePath}`,
        publicPath:  `Library/${publicPath}`,
        cleanPath:   `Library/${cleanPath}`,
        book:        bookTitle,
        bookTitle,
        bookSlug,
        bookOrder:   getPathOrder(relativePath, 0),
        title:       getTitle(content),
        description: getMeta(content, "description") || "",
        date:        getMeta(content, "date")        || "",
        
        section:     diskFallback.section || getMeta(content, "section"),
        chapter:     diskFallback.chapter || getMeta(content, "chapter"),
        
        chapterOrder,
        chapterNumber: chapterOrder === 999 ? "" : String(chapterOrder),
        lessonorder,
        lessonNumber: lessonorder === 999 ? "" : String(lessonorder),
        part:        getMeta(content, "part")        || "Main",
        tier:        getMeta(content, "tier")        || "core",
        keywords:    getMeta(content, "keywords")    || "",
        status:      (getMeta(content, "status") || "draft").toLowerCase(),
        readingTime,
    };
}

function ensureArticleId(content) {
    let id = getMeta(content, "article_id");
    let modified = false;

    if (!id) {
        id = crypto.randomBytes(4).toString("hex");
        const metaTag = `  <meta name="article_id" content="${id}">`;

        if (/<head>/i.test(content)) {
            content = content.replace(/<head>/i, `<head>\n${metaTag}`);
        } else {
            content = `${metaTag}\n${content}`;
        }
        modified = true;
    }

    return { id, content, modified };
}

function buildOgMarkup(html, { title, chapter, book, chapterOrder, readingTime }) {
    const BG      = "#FDFBF7";
    const SURFACE = "#F4EFE6";
    const BORDER  = "#E8DFD1";
    const ACCENT  = "#D48C70";
    const DARK    = "#2D241E";
    const TEXT    = "#4A3F35";
    const MUTED   = "#847769";
    const chapterNumber = chapterOrder && chapterOrder !== 999 ? String(chapterOrder) : "";
    const chapterEyebrow = chapterNumber ? `CHAPTER ${chapterNumber}: ${chapter}` : chapter;

    const bgGlyphHtml = chapterNumber
        ? `<div style="display:flex;position:absolute;right:28px;top:126px;font-size:420px;font-weight:700;font-style:italic;color:#F0EAE1;line-height:0.82;font-family:'Lora';">${chapterNumber}</div>`
        : `<div style="display:none;"></div>`;

    const bookHtml = book
        ? `<div style="display:flex;align-items:center;gap:12px;">
               <div style="display:flex;width:6px;height:6px;border-radius:50%;background:${ACCENT};margin-top:2px;flex-shrink:0;"></div>
               <div style="display:flex;font-size:22px;font-weight:400;font-style:italic;color:${ACCENT};font-family:'Lora';">${book}</div>
           </div>`
        : `<div style="display:none;"></div>`;

    const markup = `
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:${BG};font-family:'Lora',serif;position:relative;overflow:hidden;">
        <div style="display:flex;width:100%;height:6px;flex-shrink:0;background:linear-gradient(90deg,${ACCENT} 0%,#b85e38 50%,${BORDER} 100%);"></div>
        <div style="display:flex;flex:1;flex-direction:column;justify-content:space-between;padding:56px 80px 52px;position:relative;">
            ${bgGlyphHtml}
            <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;flex-shrink:0;width:100%;">
                <div style="display:flex;font-size:22px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:${MUTED};font-family:'Lora';max-width:760px;">${chapterEyebrow}</div>
                <div style="display:flex;flex-shrink:0;">${bookHtml}</div>
            </div>
            <div style="display:flex;flex:1;flex-direction:column;justify-content:center;padding-bottom:24px;">
                <div style="display:flex;font-size:88px;font-weight:700;color:${DARK};line-height:1.04;letter-spacing:-2.5px;max-width:860px;font-family:'Lora';">${title}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:20px;">
                <div style="display:flex;position:relative;width:100%;height:1px;background:${BORDER};">
                    <div style="display:flex;position:absolute;left:0;top:-4px;width:8px;height:8px;border-radius:50%;background:${ACCENT};"></div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:18px;">
                        <div style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:linear-gradient(140deg,${ACCENT},#b85e38);font-size:22px;font-weight:700;color:${BG};font-family:'Lora';">Y</div>
                        <div style="display:flex;flex-direction:column;gap:3px;">
                            <div style="display:flex;font-size:14px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:${MUTED};font-family:'Lora';">WRITTEN BY</div>
                            <div style="display:flex;font-size:26px;font-weight:700;color:${TEXT};font-family:'Lora';">Yogesh</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;background:${SURFACE};border:1.5px solid ${BORDER};border-radius:100px;padding:10px 24px;">
                        <div style="display:flex;width:7px;height:7px;border-radius:50%;background:${ACCENT};flex-shrink:0;"></div>
                        <div style="display:flex;font-size:20px;font-weight:500;color:${MUTED};font-family:'Lora';">${readingTime} min read</div>
                    </div>
                    <div style="display:flex;font-size:20px;font-weight:600;color:${DARK};opacity:0.28;font-family:'Lora';">Connecting the Dots</div>
                </div>
            </div>
        </div>
    </div>`;

    return html(markup);
}

function buildStaticIndex(libPages) {
    const byBook = {};
    for (const page of libPages) {
        const book = page.bookTitle || page.book || "Unknown";
        if (!byBook[book]) byBook[book] = {};
        const chapter = page.chapter || "General";
        if (!byBook[book][chapter]) byBook[book][chapter] = [];
        byBook[book][chapter].push(page);
    }

    let html = `\n`;
    html += `<div id="static-index" aria-hidden="true" style="display:none">\n`;

    for (const [book, chapters] of Object.entries(byBook)) {
        html += `  <section data-book="${book}">\n    <h2>${book}</h2>\n`;
        for (const [chapter, pages] of Object.entries(chapters)) {
            const sorted = pages.slice().sort((a, b) => (a.lessonorder ?? 999) - (b.lessonorder ?? 999));
            html += `    <section data-chapter="${chapter}">\n      <h3>${chapter}</h3>\n      <ul>\n`;
            for (const page of sorted) {
                html += `        <li><a href="${page.url}">${page.title}</a></li>\n`;
            }
            html += `      </ul>\n    </section>\n`;
        }
        html += `  </section>\n`;
    }

    html += `</div>\n`;
    return html;
}

function buildLibData(libPages, crossLinks = []) {
    return `// AUTO-GENERATED — do not edit\nwindow.rawPages = ${JSON.stringify(libPages, null, 2)};\nwindow.rawLinks = ${JSON.stringify(crossLinks, null, 2)};\n`;
}

function isPublicPage(page) {
    return (page.status || "draft").toLowerCase() !== "hide";
}

function removeStaticIndexBlock(html) {
    const start = html.search(new RegExp('<div\\s[^>]*id=["\']static-index["\']', 'i'));
    if (start === -1) return html;

    let depth = 0;
    let i = start;
    while (i < html.length) {
        if (html.startsWith('<div', i) && (html[i + 4] === ' ' || html[i + 4] === '>')) {
            depth++;
            i += 4;
        } else if (html.startsWith('</div>', i)) {
            depth--;
            i += 6;
            if (depth === 0) {
                while (i < html.length && (html[i] === ' ' || html[i] === '\n' || html[i] === '\r')) i++;
                return html.slice(0, start) + html.slice(i);
            }
        } else {
            i++;
        }
    }
    return html;
}

// ─── Main build ───────────────────────────────────────────────────────────────
async function build() {
    console.log("🔍 Scanning library for changes…");
    const files = getAllHtmlFiles(libraryDir).sort();

    const force = process.argv.includes("--force") || process.argv.includes("-force");

    let cachedHashMap = {};
    if (fs.existsSync(metaCachePath) && !force) {
        try { cachedHashMap = JSON.parse(fs.readFileSync(metaCachePath, "utf8")); } catch (_) {}
    }

    // Pass 0: Compute properties first to check if structural attributes changed
    const changedFiles = new Set();
    const computedPages = [];

    for (const f of files) {
        let content;
        try { content = fs.readFileSync(f, "utf8"); } catch (_) { changedFiles.add(f); continue; }

        const title = getTitle(content);
        if (title.toLowerCase().includes("template") || f.includes("_template")) continue;

        const relativePath = path.relative(libraryDir, f);
        const readingTime = estimateReadingTime(content);
        const pageObj = createPageObject(relativePath, content, readingTime);
        
        computedPages.push({ f, content, pageObj, readingTime, relativePath });

        const ogImageName = `${slugify(pageObj.book || "lib")}-${slugify(pageObj.title)}.png`;
        const expectedOgPath = path.join(ogOutputDir, ogImageName);

        // FIX: Verify hash, image existence, AND check if the title metadata change implies an update is needed
        const currentHash = getHash(content);
        if (force || cachedHashMap[f] !== currentHash || !fs.existsSync(expectedOgPath)) {
            changedFiles.add(f);
        }
    }

    const changedCount = changedFiles.size;
    if (force) {
        console.log(`🔄 Force flag detected — Re-processing all ${files.length} library entries structural metadata…`);
    } else {
        console.log(`📝 ${changedCount} file(s) changed or missing OG images — processing…`);
    }

    if (changedCount === 0 && !force) {
        console.log("✅ Nothing changed. Skipping build.");
        return;
    }

    console.log("🖼️ Initialising Satori and Lora font…");
    const { default: satori } = await import("satori");
    const { html }            = await import("satori-html");
    const { Resvg }           = await import("@resvg/resvg-js");

    const [res400, res700] = await Promise.all([
        fetch("https://cdn.jsdelivr.net/npm/@fontsource/lora/files/lora-latin-400-normal.woff"),
        fetch("https://cdn.jsdelivr.net/npm/@fontsource/lora/files/lora-latin-700-normal.woff"),
    ]);
    const [font400, font700] = await Promise.all([
        res400.arrayBuffer(),
        res700.arrayBuffer(),
    ]);
    const fonts = [
        { name: "Lora", data: font400, weight: 400, style: "normal" },
        { name: "Lora", data: font700, weight: 700, style: "normal" },
    ];

    const tempPageCache = [];
    const newHashMap = force ? {} : { ...cachedHashMap };

    // Pass 1: Build structural components, output IDs, and generate OG cards
    for (const item of computedPages) {
        const { f: filePath, relativePath, readingTime } = item;
        let content = item.content;
        let pageObj = item.pageObj;
        let fileChanged = false;

        try {
            const idResult = ensureArticleId(content);
            const articleId = idResult.id;
            if (idResult.modified) { content = idResult.content; fileChanged = true; }

            pageObj.article_id = articleId;
            const ogImageName = `${slugify(pageObj.book || "lib")}-${slugify(pageObj.title)}.png`;
            const targetOgPath = path.join(ogOutputDir, ogImageName);

            if (changedFiles.has(filePath)) {
                const coreHead = ensureCoreArticleHead(content, relativePath);
                if (coreHead.changed) { content = coreHead.content; fileChanged = true; }

                const assetRoots = ensureArticleAssetRoots(content, relativePath);
                if (assetRoots.changed) { content = assetRoots.content; fileChanged = true; }

                const withTime = syncReadingTime(content, readingTime);
                if (withTime !== content) { content = withTime; fileChanged = true; }

                const ogMeta = ensureOgMetaTags(content, pageObj, ogImageName);
                if (ogMeta.changed) { content = ogMeta.content; fileChanged = true; }

                if (!fs.existsSync(targetOgPath) || force) {
                    console.log(`🎨 Generating OG Card Image -> ${ogImageName}`);
                    const markupNode = buildOgMarkup(html, pageObj);
                    const svg = await satori(markupNode, { width: 1200, height: 630, fonts });
                    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
                    fs.writeFileSync(targetOgPath, resvg.render().asPng());
                }
            }

            if (fileChanged) {
                fs.writeFileSync(filePath, content, "utf8");
            }

            // Always cache the absolute latest version text hash
            newHashMap[filePath] = getHash(content);
            tempPageCache.push({ filePath, content, pageObj });
        } catch (err) {
            console.warn(`⚠️  Skipped ${filePath}: ${err.message}`);
        }
    }

    fs.writeFileSync(metaCachePath, JSON.stringify(newHashMap, null, 2), "utf8");
    // Pass 2: Extract explicit cross reference mapping lists
    const crossLinks = [];
    const activePagesList = tempPageCache.map(p => p.pageObj).filter(isPublicPage);

    for (const source of tempPageCache) {
        if (!isPublicPage(source.pageObj)) continue;

        const sourceObj = source.pageObj;
        const sourceNodeId = `title_${sourceObj.book}_${sourceObj.section}_${sourceObj.chapter}_${sourceObj.title}`;

        for (const targetObj of activePagesList) {
            if (targetObj.article_id === sourceObj.article_id || !targetObj.article_id) continue;

            const targetIdToken = `/article/${targetObj.article_id}`;

            if (source.content.includes(targetIdToken) || source.content.includes(targetObj.article_id)) {
                const targetNodeId = `title_${targetObj.book}_${targetObj.section}_${targetObj.chapter}_${targetObj.title}`;

                crossLinks.push({
                    source: sourceNodeId,
                    target: targetNodeId,
                    type: "cross_reference"
                });
            }
        }
    }

    fs.writeFileSync(path.join(builderDir, "lib-data.js"), buildLibData(activePagesList, crossLinks), "utf8");
    console.log(`  ✅ Data engine synced successfully. Mapped ${crossLinks.length} precise cross-references.`);

    const indexPath = path.join(libraryDir, "index.html");
    if (fs.existsSync(indexPath)) {
        let indexHtml = fs.readFileSync(indexPath, "utf8");
        const staticIndex = buildStaticIndex(activePagesList);

        const hasExistingBlock = /<div\s[^>]*id=["']static-index["']/i.test(indexHtml);
        if (hasExistingBlock) {
            indexHtml = removeStaticIndexBlock(indexHtml);
        }
        indexHtml = indexHtml.replace("</body>", `${staticIndex}\n</body>`);

        fs.writeFileSync(indexPath, indexHtml, "utf8");
    }

    console.log(`\n✨ Build complete.`);
}

build().catch(console.error);
