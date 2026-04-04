const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
const dotsDir = path.join(projectRoot, "dots");
const builderDir = path.join(projectRoot, "builder");

function getMeta(content, name) {
  const regex = new RegExp(
    `<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`,
    "i"
  );
  return content.match(regex)?.[1] || null;
}

function syncReadingTime(content, minutes) {
  const metaTag = `  <meta name="reading_time" content="${minutes}">`;

  const existingRegex =
    /<meta\s+name=["']reading_time["']\s+content=["'][^"']*["']\s*\/?>/i;

  if (existingRegex.test(content)) {
    return content.replace(existingRegex, metaTag.trim());
  }

  const headCloseRegex = /<\/head>/i;

  if (headCloseRegex.test(content)) {
    return content.replace(headCloseRegex, `${metaTag}\n</head>`);
  }

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
  const files = fs.readdirSync(dotsDir);
  const dotsPages = [];
  const libPages = [];

  files.forEach(file => {
    if (!file.endsWith(".html") || file === "index.html") return;

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

  fs.writeFileSync(
    path.join(builderDir, "dots-data.js"),
    `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.\nwindow.rawPages = ${JSON.stringify(dotsPages, null, 2)};\n`
  );

  fs.writeFileSync(
    path.join(builderDir, "lib-data.js"),
    `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.\nwindow.rawPages = ${JSON.stringify(libPages, null, 2)};\n`
  );

  console.log(`✅ Built dots-data.js (${dotsPages.length})`);
  console.log(`✅ Built lib-data.js (${libPages.length})`);
  console.log(`✅ Synced reading_time metadata`);
}

build();