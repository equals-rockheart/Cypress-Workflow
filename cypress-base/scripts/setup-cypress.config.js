#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../"); // repo root
const jsConfig = path.join(root, "cypress.config.js");
const tsConfig = path.join(root, "cypress.config.ts");
const backup = path.join(root, "cypress.config.js.bak");
const template = path.join(root, "cypress-base/examples/template-cypress.config.ts");

if (fs.existsSync(jsConfig)) {
  // If cypress.config.js exists, back it up before renaming
  if (!fs.existsSync(backup)) {
    fs.renameSync(jsConfig, backup);
    console.log(`🔄 Renamed: cypress.config.js → cypress.config.js.bak`);
  } else {
    console.log(`ℹ️ Backup already exists: cypress.config.js.bak`);
  }
}

// Always copy the template to cypress.config.ts
fs.copyFileSync(template, tsConfig);
console.log(`✅ Created: cypress.config.ts from template`);