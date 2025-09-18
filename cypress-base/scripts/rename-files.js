#!/usr/bin/env node

// rename-js-to-ts.js
const fs = require("fs");
const path = require("path");

// Resolve repo root (two levels up from cypress-base/scripts)
const ROOT_DIR = path.resolve(__dirname, "../../../");

// Default target: root/cypress/e2e (or custom path if passed as arg)
const targetDir = path.resolve(ROOT_DIR, process.argv[2] || "cypress/");

// Recursive walk & rename
function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith(".js")) {
      const newPath = fullPath.replace(/\.js$/, ".ts");
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${path.relative(ROOT_DIR, fullPath)} → ${path.relative(ROOT_DIR, newPath)}`);
    }
  }
}

console.log(`🔄 Renaming .js → .ts under: ${path.relative(ROOT_DIR, targetDir)}`);
walk(targetDir);
console.log("✅ Rename complete!");