const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
const dotsDir = path.join(projectRoot, "dots");
const builderDir = path.join(projectRoot, "builder");
const metaCachePath = path.join(builderDir, ".meta-cache.json");

function getMeta(content, name) {
  const regex = new RegExp(
    `<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`,
    "i"
  );
  return content.match(regex)?.[1] || null;
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
    part: getMeta(content, "part") || "Main",
    keywords: getMeta(content, "keywords") || "",
    order: parseInt(getMeta(content, "order")) || 999,
    readingTime
  };
}

function build() {
  if (!fs.existsSync(builderDir)) fs.mkdirSync(builderDir);

  const files = fs.readdirSync(dotsDir).filter(f => f.endsWith(".html") && f !== "index.html");

  // 1. GATHER CORE METADATA SNAPSHOT (Ignore body text)
  const currentMetaSnapshot = files.map(file => {
    const content = fs.readFileSync(path.join(dotsDir, file), "utf8");
    return {
      file,
      book: getMeta(content, "book"),
      title: getMeta(content, "title"),
      description: getMeta(content, "description"),
      date: getMeta(content, "date"),
      chapter: getMeta(content, "chapter"),
      part: getMeta(content, "part"),
      keywords: getMeta(content, "keywords"),
      order: getMeta(content, "order"),
      status: getMeta(content, "status"),
      belongs_to: getMeta(content, "belongs_to")
    };
  });

  // 2. COMPARE WITH PREVIOUS SNAPSHOT
  let previousMetaSnapshot = [];
  if (fs.existsSync(metaCachePath)) {
    try {
      previousMetaSnapshot = JSON.parse(fs.readFileSync(metaCachePath, "utf8"));
    } catch (e) {}
  }

  // If the core metadata hasn't changed, ABORT immediately. 
  // Do not recalculate reading time or overwrite HTML files.
  if (JSON.stringify(currentMetaSnapshot) === JSON.stringify(previousMetaSnapshot)) {
    console.log(`⏩ No explicit <meta> changes detected. Ignored prose update.`);
    return;
  }

  // 3. IF METADATA CHANGED, PROCEED WITH FULL BUILD
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

    if (getMeta(content, "status") !== "live") return;

    const page = createPageObject(file, content, readingTime);
    dotsPages.push(page);

    if (getMeta(content, "belongs_to") === "lib") {
      libPages.push(createPageObject(file, content, readingTime, true));
    }
  });

  // Write the JavaScript data files
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

  // Save the new snapshot so we can check against it next time
  fs.writeFileSync(metaCachePath, JSON.stringify(currentMetaSnapshot, null, 2), "utf8");

  console.log(`✅ Metadata changed! Built files and synced reading_time.`);
}

build();