#!/usr/bin/env node
// patch-remove-lib-data-script.js
// Run once: node patch-remove-lib-data-script.js
// Removes the <script id="lib-data"> block from Library/index.html

const fs   = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "Library", "index.html");

if (!fs.existsSync(indexPath)) {
    console.error("❌ Library/index.html not found.");
    process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");

const block = /<script\s+id=["']lib-data["'][\s\S]*?<\/script>\s*/i;

if (!block.test(html)) {
    console.log("ℹ️  No <script id=\"lib-data\"> found — nothing to do.");
    process.exit(0);
}

html = html.replace(block, "");
fs.writeFileSync(indexPath, html, "utf8");
console.log("✅ Removed <script id=\"lib-data\"> from Library/index.html");