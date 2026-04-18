const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
const dotsDir = path.join(projectRoot, "dots");
const builderDir = path.join(projectRoot, "builder");
const metaCachePath = path.join(builderDir, ".meta-cache.json");

function getMeta(content, name) {
  // 1. Find the specific tag regardless of attribute order
  const tagRegex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*>`, "i");
  const tagMatch = content.match(tagRegex);
  if (!tagMatch) return null;

  // 2. Extract the content value from that isolated tag
  const contentRegex = /content=["']([^"']+)["']/i;
  const contentMatch = tagMatch[0].match(contentRegex);
  return contentMatch ? contentMatch[1] : null;
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

function createPageObject(file, content, readingTime, isLibrary = false) {
  return {
    url: isLibrary ? `../dots/${file}` : `./${file}`,
    book: getMeta(content, "book") || "",
    title: getMeta(content, "title") || file.replace(".html", ""),
    description: getMeta(content, "description") || "",
    date: getMeta(content, "date") || "",
    chapter: getMeta(content, "chapter") || "",
    lessonorder: parseInt(getMeta(content, "lessonorder")) || 999,
    part: getMeta(content, "part") || "Main",
    keywords: getMeta(content, "keywords") || "",
    status: (getMeta(content, "status") || "draft").toLowerCase(),
    readingTime
  };
}

function build() {
  if (!fs.existsSync(builderDir)) fs.mkdirSync(builderDir);

  const files = fs.readdirSync(dotsDir).filter(f => f.endsWith(".html") && f !== "index.html");

  // 1. GATHER METADATA & FILE MODIFICATION TIME
  const currentSnapshot = files.map(file => {
    const filePath = path.join(dotsDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    const stats = fs.statSync(filePath); // Get file stats to check for prose updates
    
    return {
      file,
      lastModified: stats.mtimeMs, // Track when the file was last saved
      book: getMeta(content, "book"),
      title: getMeta(content, "title"),
      lesson_order: getMeta(content, "lessonorder"),
      part: getMeta(content, "part"),
      status: getMeta(content, "status"),
      belongs_to: getMeta(content, "belongs_to")
    };
  });

  // 2. COMPARE WITH PREVIOUS SNAPSHOT
  let previousSnapshot = [];
  if (fs.existsSync(metaCachePath)) {
    try {
      previousSnapshot = JSON.parse(fs.readFileSync(metaCachePath, "utf8"));
    } catch (e) {}
  }

  // If absolutely nothing changed (neither metadata nor file save times), abort.
  // Use --force to override: node build --force
  const force = process.argv.includes("--force");
  if (!force && JSON.stringify(currentSnapshot) === JSON.stringify(previousSnapshot)) {
    console.log(`⏩ No changes detected. Build skipped. (Use --force to override)`);
    return;
  }
  if (force) console.log(`⚡ Force build triggered. Rewriting everything...`);

  // 3. PROCEED WITH FULL BUILD
  const dotsPages = [];
  const libPages = [];

  files.forEach(file => {
    const filePath = path.join(dotsDir, file);
    let content = fs.readFileSync(filePath, "utf8");

    const readingTime = estimateReadingTime(content);
    const updatedContent = syncReadingTime(content, readingTime);

    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent, "utf8");
      content = updatedContent;
    }

    const page = createPageObject(file, content, readingTime);

    if (page.status === "hide") return; 

    dotsPages.push(page);

    if (getMeta(content, "belongs_to") === "lib") {
      libPages.push(createPageObject(file, content, readingTime, true));
    }
  });

  fs.writeFileSync(
    path.join(builderDir, "dots-data.js"),
    `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.\nwindow.rawPages = ${JSON.stringify(dotsPages, null, 2)};\n`,
    "utf8"
  );
  fs.writeFileSync(
    path.join(builderDir, "lib-data.js"),
    `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.\nwindow.rawPages = ${JSON.stringify(libPages, null, 2)};\n`,
    "utf8"
  );

  fs.writeFileSync(metaCachePath, JSON.stringify(currentSnapshot, null, 2), "utf8");

  console.log(`✅ Library built and reading times synced successfully.`);
}

build();