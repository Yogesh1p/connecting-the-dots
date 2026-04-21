const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// --- CONFIGURATION ---
const SITE_URL = "https://yogesh1p.github.io/connecting-the-dots";

const projectRoot = __dirname;
const libraryDir = path.join(projectRoot, "Library"); 
const builderDir = path.join(projectRoot, "builder");
const ogOutputDir = path.join(projectRoot, "assets", "og");
const metaCachePath = path.join(builderDir, ".meta-cache.json");

if (!fs.existsSync(ogOutputDir)) fs.mkdirSync(ogOutputDir, { recursive: true });
if (!fs.existsSync(builderDir)) fs.mkdirSync(builderDir, { recursive: true });

// --- Helper Functions ---

function getHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

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
        url: `../Library/${urlPath}`, 
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

async function build() {
    console.log("🔍 Scanning library for changes...");
    const files = getAllHtmlFiles(libraryDir);

    // 1. GATHER SNAPSHOT (Using content hash to detect markup changes)
    const currentSnapshot = files.map(filePath => {
        const content = fs.readFileSync(filePath, "utf8");
        return {
            path: path.relative(libraryDir, filePath),
            hash: getHash(content) // This catches meta tag injections
        };
    });

    // 2. CACHE CHECK
    let previousSnapshot = [];
    if (fs.existsSync(metaCachePath)) {
        try { previousSnapshot = JSON.parse(fs.readFileSync(metaCachePath, "utf8")); } catch (e) {}
    }

    const force = process.argv.includes("--force");
    if (!force && JSON.stringify(currentSnapshot) === JSON.stringify(previousSnapshot)) {
        console.log(`⏩ Library is up to date. Build skipped.`);
        return;
    }

    // 3. PREPARE OG GENERATION
    console.log('🖼️  Initializing Satori and Fonts...');
    const { default: satori } = await import('satori');
    const { html } = await import('satori-html');
    const { Resvg } = await import('@resvg/resvg-js');

    const fontResponse = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/lora/files/lora-latin-700-normal.woff');
    const fontData = await fontResponse.arrayBuffer();

    const libPages = [];

    for (const filePath of files) {
        try {
            let content = fs.readFileSync(filePath, "utf8");
            let fileChanged = false;
            const relativePath = path.relative(libraryDir, filePath);

            // A. Reading Time
            const readingTime = estimateReadingTime(content);
            const contentWithReadingTime = syncReadingTime(content, readingTime);
            if (contentWithReadingTime !== content) {
                content = contentWithReadingTime;
                fileChanged = true;
            }

            if ((getMeta(content, "status") || "").toLowerCase() === "hide") continue;

            const title = getTitle(content);
            const chapter = getMeta(content, "chapter") || "Connecting the Dots";
            const description = getMeta(content, "description") || "";
            
            if (title.includes('template') || relativePath.includes('_template')) continue;

            // B. OG Image Generation
            const outputFilename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
            const outputPath = path.join(ogOutputDir, outputFilename);

            if (force || !fs.existsSync(outputPath)) {
                const markup = html`
                    <div style="display: flex; flex-direction: column; justify-content: space-between; width: 1200px; height: 630px; background-color: #FDFBF7; padding: 80px 100px; border: 20px solid #F4EFE6;">
                        <div style="display: flex; flex-direction: column;">
                            <div style="font-size: 32px; color: #D48C70; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 24px; font-weight: bold;">
                                ${chapter}
                            </div>
                            <div style="font-size: 82px; color: #2D241E; line-height: 1.1; letter-spacing: -2px; max-width: 1000px;">
                                ${title}
                            </div>
                        </div>
                        <div style="display: flex; border-top: 2px solid #E8DFD1; padding-top: 40px; justify-content: space-between; align-items: center; width: 100%;">
                            <div style="font-size: 32px; color: #4A3F35;">Yogesh</div>
                            <div style="font-size: 28px; color: #847769; background: #F4EFE6; padding: 8px 20px; border-radius: 4px;">Connecting the Dots</div>
                        </div>
                    </div>
                `;

                const svg = await satori(markup, {
                    width: 1200, height: 630,
                    fonts: [{ name: 'Lora', data: fontData, weight: 700, style: 'normal' }],
                });

                const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
                fs.writeFileSync(outputPath, resvg.render().asPng());
                console.log(`✅ OG Generated: ${outputFilename}`);
            }

            // C. Meta Tag Injection Logic
            const absoluteImageUrl = `${SITE_URL}/assets/og/${outputFilename}`;
            const absolutePageUrl = `${SITE_URL}/Library/${relativePath.replace(/\\/g, '/')}`;

            const hasOg = /property=["']og:image["']/i.test(content);
            
            if (!hasOg) {
                const metaTags = `\n    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${absolutePageUrl}">
    <meta property="og:image" content="${absoluteImageUrl}">
    <meta name="twitter:card" content="summary_large_image">`;
                
                content = content.replace('</head>', `${metaTags}\n</head>`);
                fileChanged = true;
            } else {
                // Update existing tags if they aren't absolute or are incorrect
                const updatedContent = content
                    .replace(/content=["'][^"']*?og\/[^"']*?["']/gi, `content="${absoluteImageUrl}"`)
                    .replace(/property=["']og:url["']\s+content=["'][^"']*["']/gi, `property="og:url" content="${absolutePageUrl}"`);
                
                if (updatedContent !== content) {
                    content = updatedContent;
                    fileChanged = true;
                }
            }

            if (fileChanged) {
                fs.writeFileSync(filePath, content, "utf8");
            }

            libPages.push(createPageObject(relativePath, content, readingTime));

        } catch (err) {
            console.error(`❌ Error in ${filePath}:`, err.message);
        }
    }

    // 4. SAVE FINAL DATA & UPDATE CACHE
    // We save the JSON data
    fs.writeFileSync(
        path.join(builderDir, "lib-data.js"),
        `// AUTO-GENERATED\nwindow.rawPages = ${JSON.stringify(libPages, null, 2)};\n`,
        "utf8"
    );

    // CRITICAL: Generate NEW snapshot AFTER file writes are done
    const finalSnapshot = files.map(filePath => ({
        path: path.relative(libraryDir, filePath),
        hash: getHash(fs.readFileSync(filePath, "utf8"))
    }));

    fs.writeFileSync(metaCachePath, JSON.stringify(finalSnapshot, null, 2), "utf8");
    console.log(`\n✨ Build Complete. Processed ${libPages.length} pages.`);
}

build().catch(console.error);