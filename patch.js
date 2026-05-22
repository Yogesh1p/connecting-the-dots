#!/usr/bin/env node
/**
 * node patch [dir]
 *
 * Fixes redundant boilerplate in article HTML files:
 *   1. Duplicate <meta charset="UTF-8"> — keeps only the first
 *   2. Duplicate mobile-view styles — removes the copy inside the second <style> block
 *
 * Defaults to current directory if no path is given.
 */

const fs   = require('fs');
const path = require('path');

// ── transforms ───────────────────────────────────────────────────────────────

function removeDuplicateCharset(html) {
  let first = true;
  return html.replace(/<meta\s+charset=["']UTF-8["']\s*\/?>/gi, match => {
    if (first) { first = false; return match; }
    return '';
  });
}

function removeDuplicateMobileStyles(html) {
  // Matches the img/iframe/video rule + @media block (multiline)
  const pattern = /\s*img,\s*iframe,\s*video\s*\{[^}]*max-width[^}]*\}\s*@media\s+screen\s+and\s+\(max-width:\s*768px\)\s*\{[^}]*body,[^}]*\}[^}]*\}/gs;
  const matches = [...html.matchAll(pattern)];
  if (matches.length < 2) return html;

  // Remove all but the first match (walk backwards to preserve offsets)
  let result = html;
  for (const m of matches.slice(1).reverse()) {
    result = result.slice(0, m.index) + result.slice(m.index + m[0].length);
  }
  return result;
}

// ── file handling ─────────────────────────────────────────────────────────────

function patchFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let patched = original;
  patched = removeDuplicateCharset(patched);
  patched = removeDuplicateMobileStyles(patched);

  if (patched === original) {
    console.log(`  skip   ${filePath}`);
    return false;
  }

  fs.writeFileSync(filePath, patched, 'utf8');
  console.log(`  fixed  ${filePath}`);
  return true;
}

function collectHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

// ── main ──────────────────────────────────────────────────────────────────────

const target = process.argv[2] || '.';
const stat    = fs.statSync(target);
const files   = stat.isFile() ? [target] : collectHtmlFiles(target);

if (!files.length) {
  console.log('No HTML files found.');
  process.exit(0);
}

let changed = 0;
for (const f of files) changed += patchFile(f) ? 1 : 0;
console.log(`\nDone — ${changed}/${files.length} file(s) patched.`);