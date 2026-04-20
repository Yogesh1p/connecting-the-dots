const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
// Look in the new nested directory
const libraryDir = path.join(projectRoot, "Library"); 
const builderDir = path.join(projectRoot, "builder");
const ogOutputDir = path.join(projectRoot, "assets", "og");
const metaCachePath = path.join(builderDir, ".meta-cache.json");

if (!fs.existsSync(ogOutputDir)) fs.mkdirSync(ogOutputDir, { recursive: true });
if (!fs.existsSync(builderDir)) fs.mkdirSync(builderDir, { recursive: true });

// --- Helper Functions ---

function getAllHtmlFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
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
    const tagRegex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*>`, "i");
    const tagMatch = content.match(tagRegex);
    if (!tagMatch) return null;
    const contentRegex = /content=["']([^"']+)["']/i;
    const contentMatch = tagMatch[0].match(contentRegex);
    return contentMatch ? contentMatch[1] : null;
}

function getTitle(content) {
    const metaTitle = getMeta(content, "title");
    if (metaTitle) return metaTitle;
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : "Untitled";
}

function syncReadingTime(content, minutes) {
    const metaTag = `  <meta name="reading_time" content="${minutes}">`;
    const existingRegex = /<meta\s+name=["']reading_time["']\s+content=["'][^"']*["']\s*\/?>/i;
    if (existingRegex.test(content)) return content.replace(existingRegex, metaTag.trim());
    const headCloseRegex = /<\/head>/i;
    if (headCloseRegex.test(content)) return content.replace(headCloseRegex, `${metaTag}\n</head>`);
    return `${metaTag}\n${content}`;
}

function estimateReadingTime(content) {
    const bodyText = content
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<head[\s\S]*?<\/head>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const wordCount = bodyText.split(" ").filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 220));
}

function createPageObject(relativePath, content, readingTime) {
    const urlPath = relativePath.replace(/\\/g, '/');
    return {
        url: `Library/${urlPath}`, // <--- Removed the ../ right here
        book: getMeta(content, "book") || "",
        title: getTitle(content),
        description: getMeta(content, "description") || "",
        date: getMeta(content, "date") || "",
        chapter: getMeta(content, "chapter") || "",
        lessonorder: parseInt(getMeta(content, "lessonorder")) || 999,
        part: getMeta(content, "part") || "Main",
        tier: getMeta(content, "tier") || "core", 
        keywords: getMeta(content, "keywords") || "",
        status: (getMeta(content, "status") || "draft").toLowerCase(),
        readingTime
    };
}


// --- Main Async Build Process ---

async function build() {
    console.log("🔍 Scanning library directories...");
    const files = getAllHtmlFiles(libraryDir);

    // 1. GATHER METADATA & FILE MODIFICATION TIME
    const currentSnapshot = files.map(filePath => {
        const content = fs.readFileSync(filePath, "utf8");
        const stats = fs.statSync(filePath);
        const relativePath = path.relative(libraryDir, filePath);
        
        // FIXED: Now actively tracking every piece of metadata in the cache
        return {
            relativePath,
            lastModified: stats.mtimeMs,
            book: getMeta(content, "book"),
            chapter: getMeta(content, "chapter"),
            title: getTitle(content),
            description: getMeta(content, "description"),
            lesson_order: getMeta(content, "lessonorder"),
            part: getMeta(content, "part"),
            tier: getMeta(content, "tier"), 
            keywords: getMeta(content, "keywords"),
            status: getMeta(content, "status"),
            date: getMeta(content, "date")
        };
    });

    // 2. CACHE CHECK
    let previousSnapshot = [];
    if (fs.existsSync(metaCachePath)) {
        try { previousSnapshot = JSON.parse(fs.readFileSync(metaCachePath, "utf8")); } catch (e) {}
    }

    const force = process.argv.includes("--force");
    if (!force && JSON.stringify(currentSnapshot) === JSON.stringify(previousSnapshot)) {
        console.log(`⏩ No changes detected. Build skipped. (Use node build --force to override)`);
        return;
    }

    if (force) console.log(`⚡ Force build triggered. Rewriting everything...`);

    // 3. PREPARE OG GENERATION TOOLS
    console.log('🖼️  Fetching fonts and initializing Satori...');
    const { default: satori } = await import('satori');
    const { html } = await import('satori-html');
    const { Resvg } = await import('@resvg/resvg-js');

    const fontResponse = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/lora/files/lora-latin-700-normal.woff');
    if (!fontResponse.ok) throw new Error(`Failed to fetch font: ${fontResponse.statusText}`);
    const fontData = await fontResponse.arrayBuffer();

    // 4. PROCEED WITH FULL BUILD
    const libPages = [];

    for (const filePath of files) {
        try {
            let content = fs.readFileSync(filePath, "utf8");
            let fileChanged = false;
            const relativePath = path.relative(libraryDir, filePath);

            // A. Sync Reading Time
            const readingTime = estimateReadingTime(content);
            const contentWithReadingTime = syncReadingTime(content, readingTime);
            if (contentWithReadingTime !== content) {
                content = contentWithReadingTime;
                fileChanged = true;
            }

            // Skip hidden files
            if ((getMeta(content, "status") || "").toLowerCase() === "hide") continue;

            // B. Extract properties for OG Image
            const title = getTitle(content);
            const chapter = getMeta(content, "chapter") || "Connecting the Dots";
            const author = getMeta(content, "author") || "Yogesh";
            const description = getMeta(content, "description") || "";
            
            // Skip template files
            if (title.includes('template') || relativePath.includes('_template')) continue;

            const outputFilename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
            const outputPath = path.join(ogOutputDir, outputFilename);

            // C. Generate OG Image (if missing or force)
            if (force || !fs.existsSync(outputPath)) {
                const markup = html`
                    <div style="display: flex; flex-direction: column; justify-content: space-between; width: 1200px; height: 630px; background-color: #FDFBF7; padding: 80px 100px; border: 1px solid #E8DFD1;">
                        <div style="display: flex; flex-direction: column;">
                            <div style="font-size: 32px; color: #D48C70; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 24px;">
                                ${chapter}
                            </div>
                            <div style="font-size: 88px; color: #2D241E; line-height: 1.1; letter-spacing: -2px; max-width: 1000px;">
                                ${title}
                            </div>
                        </div>
                        <div style="display: flex; border-top: 2px solid #E8DFD1; padding-top: 30px; justify-content: space-between; align-items: center; width: 100%;">
                            <div style="font-size: 32px; color: #4A3F35;">${author}</div>
                            <div style="font-size: 32px; color: #847769;">Connecting the Dots</div>
                        </div>
                    </div>
                `;

                const svg = await satori(markup, {
                    width: 1200, height: 630,
                    fonts: [{ name: 'Lora', data: fontData, weight: 700, style: 'normal' }],
                });

                const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
                fs.writeFileSync(outputPath, resvg.render().asPng());
                console.log(`✅ Generated OG: ${outputFilename}`);
            }

            // D. Inject OG Tags if missing
            if (!content.includes('og:image')) {
                const relativeOgDir = path.relative(path.dirname(filePath), outputPath).replace(/\\/g, '/');
                
                const metaTags = `\n    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${relativeOgDir}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">`;
                
                content = content.replace('</head>', `${metaTags}\n</head>`);
                fileChanged = true;
            }

            // E. Save file if modifications occurred
            if (fileChanged) {
                fs.writeFileSync(filePath, content, "utf8");
            }

            libPages.push(createPageObject(relativePath, content, readingTime));

        } catch (err) {
            console.error(`❌ Failed processing ${filePath}:`, err.message);
        }
    }

    // 5. FINALIZE BUILD
    fs.writeFileSync(
        path.join(builderDir, "lib-data.js"),
        `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.\nwindow.rawPages = ${JSON.stringify(libPages, null, 2)};\n`,
        "utf8"
    );

    fs.writeFileSync(metaCachePath, JSON.stringify(currentSnapshot, null, 2), "utf8");
    console.log(`\n🎉 Task complete. Built data for ${libPages.length} library lessons.`);
}

build().catch(console.error);