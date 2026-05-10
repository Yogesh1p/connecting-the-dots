const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
        } else if (file.endsWith(".html") && file !== "index.html") {
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
            test: /<script[^>]+src=["'][^"']*js\/base\.js["']/i
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

function getPathOrder(relativePath, index = 0) {
    const segment = relativePath.replace(/\\/g, "/").split("/")[index] || "";
    const match = segment.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 999;
}

function createPageObject(relativePath, content, readingTime) {
    const sourcePath = relativePath.replace(/\\/g, "/");
    const bookTitle = getMeta(content, "book") || "";
    const bookSlug = getMeta(content, "book_slug") || slugify(bookTitle);
    const pathChapterOrder = getPathOrder(relativePath, 1);
    const pathLessonOrder = getPathOrder(relativePath, 2);
    const chapterOrder = pathChapterOrder !== 999 ? pathChapterOrder : (parseInt(getMeta(content, "chapter_order")) || 999);
    const lessonorder = pathLessonOrder !== 999 ? pathLessonOrder : (parseInt(getMeta(content, "lessonorder")) || 999);

    return {
        url:         `../Library/${sourcePath}`,
        sourcePath:  `Library/${sourcePath}`,
        book:        bookTitle,
        bookTitle,
        bookSlug,
        bookOrder:   getPathOrder(relativePath, 0),
        title:       getTitle(content),
        description: getMeta(content, "description") || "",
        date:        getMeta(content, "date")        || "",
        chapter:     getMeta(content, "chapter")     || "",
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

// ─── OG markup builder ────────────────────────────────────────────────────────

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
                <div style="display:flex;flex-shrink:0;">
                    ${bookHtml}
                </div>
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

                    <div style="display:flex;align-items:center;gap:20px;">
                        <div style="display:flex;align-items:center;gap:10px;background:${SURFACE};border:1.5px solid ${BORDER};border-radius:100px;padding:10px 24px;">
                            <div style="display:flex;width:7px;height:7px;border-radius:50%;background:${ACCENT};flex-shrink:0;"></div>
                            <div style="display:flex;font-size:20px;font-weight:500;color:${MUTED};font-family:'Lora';">${readingTime} min read</div>
                        </div>
                        <div style="display:flex;font-size:20px;font-weight:600;color:${DARK};opacity:0.28;font-family:'Lora';">Connecting the Dots</div>
                    </div>

                </div>
            </div>

        </div>
    </div>`;

    return html(markup);
}

// ─── Static index builder (for crawlers / LLMs) ───────────────────────────────

function buildStaticIndex(libPages) {
    const byBook = {};
    for (const page of libPages) {
        const book = page.bookTitle || page.book || "Unknown";
        if (!byBook[book]) byBook[book] = {};
        const chapter = page.chapter || "General";
        if (!byBook[book][chapter]) byBook[book][chapter] = [];
        byBook[book][chapter].push(page);
    }

    let html = `<!-- AUTO-GENERATED static index for crawlers/LLMs — do not edit -->\n`;
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

    html += `</div>\n<!-- END static-index -->`;
    return html;
}

// ─── Main build ───────────────────────────────────────────────────────────────

async function build() {
    console.log("🔍 Scanning library for changes…");
    const files = getAllHtmlFiles(libraryDir).sort();

    const force = process.argv.includes("--force");

    // 1. Load previous cache
    let cachedHashMap = {};
    if (fs.existsSync(metaCachePath)) {
        try { cachedHashMap = JSON.parse(fs.readFileSync(metaCachePath, "utf8")); } catch (_) {}
    }

    // 2. Find only files the USER changed
    const changedFiles = files.filter(f => {
        if (force) return true;
        const rel = path.relative(libraryDir, f);
        const currentHash = getHash(fs.readFileSync(f, "utf8"));
        return currentHash !== cachedHashMap[rel];
    });

    if (changedFiles.length === 0) {
        console.log("⏩  Library is up to date. Build skipped.");
        return;
    }

    console.log(`📝  ${changedFiles.length} file(s) changed — processing…`);

    // 3. Init Satori + Lora fonts
    console.log("🖼️  Initialising Satori and Lora font…");
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

    // 4. Process only changed files
    for (const filePath of changedFiles) {
        try {
            let content = fs.readFileSync(filePath, "utf8");
            let fileChanged = false;
            const relativePath = path.relative(libraryDir, filePath);

            const coreHead = ensureCoreArticleHead(content, relativePath);
            if (coreHead.changed) {
                content = coreHead.content;
                fileChanged = true;
            }

            // A. Reading time
            const readingTime = estimateReadingTime(content);
            const withTime = syncReadingTime(content, readingTime);
            if (withTime !== content) { content = withTime; fileChanged = true; }

            if ((getMeta(content, "status") || "").toLowerCase() === "hide") {
                cachedHashMap[relativePath] = getHash(content);
                fs.writeFileSync(metaCachePath, JSON.stringify(cachedHashMap, null, 2), "utf8");
                continue;
            }

            // --- SYNC TITLE FROM META TAG ---
            const title = getTitle(content);

            if (title.toLowerCase().includes("template") || relativePath.includes("_template")) {
                cachedHashMap[relativePath] = getHash(content);
                fs.writeFileSync(metaCachePath, JSON.stringify(cachedHashMap, null, 2), "utf8");
                continue;
            }

            const expectedTitleTag = `<title>${title}</title>`;
            const titleTagRegex = /<title>[\s\S]*?<\/title>/i;

            if (titleTagRegex.test(content)) {
                const currentTitleTag = content.match(titleTagRegex)[0];
                if (currentTitleTag !== expectedTitleTag) {
                    content = content.replace(titleTagRegex, expectedTitleTag);
                    fileChanged = true;
                    console.log(`  📝 Synced <title> to match meta tag: "${title}"`);
                }
            } else if (/<head>/i.test(content)) {
                content = content.replace(/<head>/i, `<head>\n  ${expectedTitleTag}`);
                fileChanged = true;
                console.log(`  📝 Injected <title> based on meta tag: "${title}"`);
            }
            // --------------------------------

            const chapter      = getMeta(content, "chapter")      || "Connecting the Dots";
            const book         = getMeta(content, "book")         || "";
            const description  = getMeta(content, "description")  || "";
            const chapterOrder = getPathOrder(relativePath, 1);

            // B. Inject or Retrieve Article ID
            const idResult = ensureArticleId(content);
            const articleId = idResult.id;
            if (idResult.modified) {
                content = idResult.content;
                fileChanged = true;
            }

            // C. OG image generation
            const outputFilename = `og-${articleId}.png`;
            const outputPath = path.join(ogOutputDir, outputFilename);

            // Cleanup old OG images if the filename changed
            const existingOgMatch = content.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
            if (existingOgMatch) {
                const oldImageUrl = existingOgMatch[1];
                const oldFilename = path.basename(oldImageUrl);
                if (oldFilename && oldFilename !== outputFilename) {
                    const oldFilePath = path.join(ogOutputDir, oldFilename);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                        console.log(`  🗑️ Cleaned up old OG: ${oldFilename}`);
                    }
                }
            }

            // Always redraw the image if the file is in changedFiles
            const markup = buildOgMarkup(html, { title, chapter, book, chapterOrder, readingTime });
            const svg = await satori(markup, { width: 1200, height: 630, fonts });
            const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
            fs.writeFileSync(outputPath, resvg.render().asPng());
            console.log(`  ✅ OG generated/updated: ${outputFilename}`);

            // D. Meta tag injection / update
            const fileHash = getHash(content).substring(0, 6);
            const absoluteImageUrl = `${SITE_URL}/assets/og/${outputFilename}?v=${fileHash}`;
            const absolutePageUrl  = `${SITE_URL}/Library/${relativePath.replace(/\\/g, "/")}`;
            const hasOg = /property=["']og:image["']/i.test(content);

            if (!hasOg) {
                const tags = `
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${absolutePageUrl}">
    <meta property="og:image" content="${absoluteImageUrl}">
    <meta name="twitter:card" content="summary_large_image">`;
                content = content.replace("</head>", `${tags}\n</head>`);
                fileChanged = true;
            } else {
                const updated = content
                    .replace(/property=["']og:title["']\s+content=["'][^"']*["']/gi, `property="og:title" content="${title}"`)
                    .replace(/content=["'][^"']*?\/og\/[^"']*?["']/gi, `content="${absoluteImageUrl}"`)
                    .replace(/property=["']og:url["']\s+content=["'][^"']*["']/gi, `property="og:url" content="${absolutePageUrl}"`);

                if (updated !== content) {
                    content = updated;
                    fileChanged = true;
                }
            }

            if (fileChanged) fs.writeFileSync(filePath, content, "utf8");

            cachedHashMap[relativePath] = getHash(content);
            fs.writeFileSync(metaCachePath, JSON.stringify(cachedHashMap, null, 2), "utf8");

            console.log(`  ✔ ${relativePath}`);

        } catch (err) {
            console.error(`❌ Error processing ${filePath}:`, err.message);
        }
    }

    // 5. Rebuild static index in Library/index.html
    const libPages = [];
    for (const filePath of files) {
        try {
            const content      = fs.readFileSync(filePath, "utf8");
            const relativePath = path.relative(libraryDir, filePath);
            const status       = (getMeta(content, "status") || "").toLowerCase();
            const title        = getTitle(content);
            if (status === "hide") continue;
            if (title.toLowerCase().includes("template") || relativePath.includes("_template")) continue;
            const readingTime = estimateReadingTime(content);
            libPages.push(createPageObject(relativePath, content, readingTime));
        } catch (_) {}
    }

    const indexPath = path.join(libraryDir, "index.html");
    if (!fs.existsSync(indexPath)) {
        console.error("❌ Library/index.html not found — cannot inject static index.");
    } else {
        let indexHtml = fs.readFileSync(indexPath, "utf8");

        const staticIndex = buildStaticIndex(libPages);
        const existingBlock = /<!-- AUTO-GENERATED static index[\s\S]*?<!-- END static-index -->/;

        if (existingBlock.test(indexHtml)) {
            indexHtml = indexHtml.replace(existingBlock, staticIndex);
        } else {
            indexHtml = indexHtml.replace("</body>", `${staticIndex}\n</body>`);
        }

        fs.writeFileSync(indexPath, indexHtml, "utf8");
        console.log(`  ✅ Static index updated (${libPages.length} pages) in Library/index.html`);
    }

    console.log(`\n✨ Build complete. ${libPages.length} pages indexed.`);
}

build().catch(console.error);