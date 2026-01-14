#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Resolve repo root (two levels up from cypress-base/scripts)
const ROOT_DIR = path.resolve(__dirname, "../../");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`📁 Ensured directory: ${path.relative(ROOT_DIR, dir)}`);
}

function writeJson(file, obj) {
  if (fs.existsSync(file)) {
    console.log(`⚠️  Skipped existing file: ${path.relative(ROOT_DIR, file)}`);
    return;
  }
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
  console.log(`✅ Created file: ${path.relative(ROOT_DIR, file)}`);
}

// Directories
ensureDir(path.join(ROOT_DIR, "cypress/config/env"));
ensureDir(path.join(ROOT_DIR, "cypress/e2e/sprint"));
ensureDir(path.join(ROOT_DIR, "secrets"));

// Config files
writeJson(path.join(ROOT_DIR, "cypress/config/qatouch.json"), {
  apiToken: "",
  domain: "",
  "projectKey-Suite": "",
  "regression-Suite-testRunKey": ""
});

writeJson(path.join(ROOT_DIR, "cypress/config/regression-sheet.json"), {
  "regression-sheet": "",
  "regression-test-pass": "✅",
  "regression-test-fail": "❌"
});

writeJson(path.join(ROOT_DIR, "cypress/config/env/staging.json"), {
  env: "staging",
  baseURL: "https://staging.yourapp.com"
});