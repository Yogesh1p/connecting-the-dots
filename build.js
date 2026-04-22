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

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ─── OG markup builder ────────────────────────────────────────────────────────
// Satori rules strictly followed:
//   1. Every <div> with 2+ children must have display:flex
//   2. z-index is NOT supported. Layering is done by rendering the absolute
//      background glyph before the content.
//   3. Parse one complete markup string. Interpolating markup strings into the
//      tagged html`` helper escapes them and renders the raw <div> text.

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
        ? `<div style="display:flex;position:absolute;right:28px;top:126px;font-size:420px;font-weight:700;font-style:italic;color:#F0EAE1;line-height:0.82;font-family:'Lora';">${escapeHtml(chapterNumber)}</div>`
        : `<div style="display:none;"></div>`;

    const bookHtml = book
        ? `<div style="display:flex;align-items:center;gap:12px;">
               <div style="display:flex;width:6px;height:6px;border-radius:50%;background:${ACCENT};margin-top:2px;flex-shrink:0;"></div>
               <div style="display:flex;font-size:22px;font-weight:400;font-style:italic;color:${ACCENT};font-family:'Lora';">${escapeHtml(book)}</div>
           </div>`
        : `<div style="display:none;"></div>`;

    const markup = `
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:${BG};font-family:'Lora',serif;position:relative;overflow:hidden;">

        <!-- Top accent bar -->
        <div style="display:flex;width:100%;height:6px;flex-shrink:0;background:linear-gradient(90deg,${ACCENT} 0%,#b85e38 50%,${BORDER} 100%);"></div>

        <!-- Body: position:relative wrapper so absolute children work -->
        <div style="display:flex;flex:1;flex-direction:column;justify-content:space-between;padding:56px 80px 52px;position:relative;">

            <!-- Background glyph (absolute, rendered first = behind content) -->
            ${bgGlyphHtml}

            <!-- Eyebrow row: chapter + optional book -->
            <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;flex-shrink:0;width:100%;">
                <div style="display:flex;font-size:22px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:${MUTED};font-family:'Lora';max-width:760px;">${escapeHtml(chapterEyebrow)}</div>
                <div style="display:flex;flex-shrink:0;">
                    ${bookHtml}
                </div>
            </div>

            <!-- Middle title zone. This keeps short titles optically centered. -->
            <div style="display:flex;flex:1;flex-direction:column;justify-content:center;padding-bottom:24px;">
                <div style="display:flex;font-size:88px;font-weight:700;color:${DARK};line-height:1.04;letter-spacing:-2.5px;max-width:860px;font-family:'Lora';">${escapeHtml(title)}</div>
            </div>

            <!-- BOTTOM: rule + author row -->
            <div style="display:flex;flex-direction:column;gap:20px;">

                <!-- Rule with accent dot -->
                <div style="display:flex;position:relative;width:100%;height:1px;background:${BORDER};">
                    <div style="display:flex;position:absolute;left:0;top:-4px;width:8px;height:8px;border-radius:50%;background:${ACCENT};"></div>
                </div>

                <!-- Author row -->
                <div style="display:flex;align-items:center;justify-content:space-between;">

                    <!-- Left: avatar + name -->
                    <div style="display:flex;align-items:center;gap:18px;">
                        <div style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:linear-gradient(140deg,${ACCENT},#b85e38);font-size:22px;font-weight:700;color:${BG};font-family:'Lora';">Y</div>
                        <div style="display:flex;flex-direction:column;gap:3px;">
                            <div style="display:flex;font-size:14px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:${MUTED};font-family:'Lora';">WRITTEN BY</div>
                            <div style="display:flex;font-size:26px;font-weight:700;color:${TEXT};font-family:'Lora';">Yogesh</div>
                        </div>
                    </div>

                    <!-- Right: read pill + site name -->
                    <div style="display:flex;align-items:center;gap:20px;">
                        <div style="display:flex;align-items:center;gap:10px;background:${SURFACE};border:1.5px solid ${BORDER};border-radius:100px;padding:10px 24px;">
                            <div style="display:flex;width:7px;height:7px;border-radius:50%;background:${ACCENT};flex-shrink:0;"></div>
                            <div style="display:flex;font-size:20px;font-weight:500;color:${MUTED};font-family:'Lora';">${escapeHtml(readingTime)} min read</div>
                        </div>
                        <div style="display:flex;font-size:20px;font-weight:600;color:${DARK};opacity:0.28;font-family:'Lora';">Connecting the Dots</div>
                    </div>

                </div>
            </div>

        </div>
    </div>`;

    return html(markup);
}

// ─── Main build ───────────────────────────────────────────────────────────────

async function build() {
    console.log("🔍 Scanning library for changes…");
    const files = getAllHtmlFiles(libraryDir).sort();

    // 1. Snapshot
    const currentSnapshot = files.map(f => ({
        path: path.relative(libraryDir, f),
        hash: getHash(fs.readFileSync(f, "utf8")),
    }));

    // 2. Cache check
    let previousSnapshot = [];
    if (fs.existsSync(metaCachePath)) {
        try { previousSnapshot = JSON.parse(fs.readFileSync(metaCachePath, "utf8")); } catch (_) {}
    }

    const force = process.argv.includes("--force");
    if (!force && JSON.stringify(currentSnapshot) === JSON.stringify(previousSnapshot)) {
        console.log("⏩  Library is up to date. Build skipped.");
        return;
    }

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

    const libPages = [];

    // 4. Process each file
    for (const filePath of files) {
        try {
            let content = fs.readFileSync(filePath, "utf8");
            let fileChanged = false;
            const relativePath = path.relative(libraryDir, filePath);

            // A. Reading time
            const readingTime = estimateReadingTime(content);
            const withTime = syncReadingTime(content, readingTime);
            if (withTime !== content) { content = withTime; fileChanged = true; }

            if ((getMeta(content, "status") || "").toLowerCase() === "hide") continue;

            const title        = getTitle(content);
            const chapter      = getMeta(content, "chapter")       || "Connecting the Dots";
            const book         = getMeta(content, "book")          || "";
            const description = getMeta(content, "description") || "";
            const chapterOrder = getPathOrder(relativePath, 1);

            if (title.toLowerCase().includes("template") || relativePath.includes("_template")) continue;

            // B. OG image
            const outputFilename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
            const outputPath = path.join(ogOutputDir, outputFilename);

            if (force || !fs.existsSync(outputPath)) {
                const markup = buildOgMarkup(html, { title, chapter, book, chapterOrder, readingTime });
                const svg = await satori(markup, { width: 1200, height: 630, fonts });
                const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
                fs.writeFileSync(outputPath, resvg.render().asPng());
                console.log(`  ✅ OG: ${outputFilename}`);
            }

            // C. Meta tag injection / update
            const absoluteImageUrl = `${SITE_URL}/assets/og/${outputFilename}`;
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
                    .replace(/content=["'][^"']*?\/og\/[^"']*?["']/gi, `content="${absoluteImageUrl}"`)
                    .replace(/property=["']og:url["']\s+content=["'][^"']*["']/gi,
                             `property="og:url" content="${absolutePageUrl}"`);
                if (updated !== content) { content = updated; fileChanged = true; }
            }

            if (fileChanged) fs.writeFileSync(filePath, content, "utf8");

            libPages.push(createPageObject(relativePath, content, readingTime));

        } catch (err) {
            console.error(`❌ Error processing ${filePath}:`, err.message);
        }
    }

    // 5. Write lib-data.js
    fs.writeFileSync(
        path.join(builderDir, "lib-data.js"),
        `// AUTO-GENERATED — do not edit\nwindow.rawPages = ${JSON.stringify(libPages, null, 2)};\n`,
        "utf8"
    );

    // 6. Update cache AFTER all file writes
    const finalSnapshot = files.map(f => ({
        path: path.relative(libraryDir, f),
        hash: getHash(fs.readFileSync(f, "utf8")),
    }));
    fs.writeFileSync(metaCachePath, JSON.stringify(finalSnapshot, null, 2), "utf8");

    console.log(`\n✨ Build complete. ${libPages.length} pages processed.`);
}

build().catch(console.error);
