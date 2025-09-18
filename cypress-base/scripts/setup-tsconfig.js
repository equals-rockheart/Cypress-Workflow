#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../"); // repo root
const template = path.join(root, "cypress-workflow/cypress-base/examples/template-tsconfig.json");
const target = path.join(root, "tsconfig.json");

if (fs.existsSync(target)) {
  console.log("ℹ️ tsconfig.json already exists, skipping copy.");
} else {
  fs.copyFileSync(template, target);
  console.log("✅ Created tsconfig.json from template");
}