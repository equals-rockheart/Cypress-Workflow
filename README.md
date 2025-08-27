# 🧪 Cypress Test Setup Guide

A comprehensive guide for setting up and running Cypress tests with QATouch integration for TypeScript projects.

> ⚠️ **Note**  
> This repository assumes you are using **TypeScript**.  
> While a migration guide for **JavaScript** is available, TypeScript is the default because:  
> - **Stronger typing** → reduces runtime errors by catching mistakes at compile time.  
> - **Better tooling** → editors like VS Code provide autocomplete and intellisense.  
> - **Maintainability** → large test suites stay more organized.  
> - **Consistency** → aligns with modern Cypress practices.  
>
> If your project uses **JavaScript**, refer to the migration guide.

---

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [Configuration](#%EF%B8%8F-configuration) 
- [Test Suite Architecture](#-test-suite-architecture)
- [Running Tests](#-running-tests)
- [Sprint Development](#-sprint-development)
- [QATouch Integration](#-qatouch-integration)
- [Sprint Cleaner Tool](#-sprint-cleaner-tool)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Access to the project repository
- QATouch account (for sprint/regression test runs)
- Google Service Account (for projects with Google Sheets integration)

### Installation
```bash
# Clone the repository and navigate to project directory
cd your-project-directory

# Install dependencies
npm install
```

---

## ⚙️ Configuration

### 1. Environment Setup
Update configuration files in `/cypress/config/env/` based on your project's available environments:

**Required Config Values:**
```json
{
   "env" : "develop",
   "baseURL" : "https://develop.paystage.net"
}
```

### 2. QATouch Integration
Edit `/cypress/qatouch.json` with your API credentials and project setup:
```json
{
  "apiToken": "your-qatouch-api-token",
  "domain": "rhgc",
  "projectKey-admin": "your-admin-project-key",
  "projectKey-client": "your-client-project-key",
  "projectKey-api": "your-api-project-key"
}
```
> 💡 **Project-Dependent**: Configure only the keys that match your project's test suites.

### 3. Google Sheets Integration (Optional)
For projects using Google Sheets regression tracking:

**Configuration** (`/cypress/regression-sheet.json`):
```json
{
   "regression-sheet" : "google-spreadsheet-link",
   "regression-test-pass" : "✅",
   "regression-test-fail" : "❌"
}
```

**API Setup**:
1. Create Google Cloud Project and enable Google Sheets API
2. Create Service Account and generate JSON key
3. Place key file at `/secrets/service-account.json` (exact filename required)
4. Grant service account editor access to your Google Sheets

> ⚠️ **Security**: Add `/secrets/` to `.gitignore` - never commit credentials.

---

## 🏗️ Test Suite Architecture

### ✍️ Core Concept
**Suite-based consistency** across specs, page objects, and QATouch integration:
- Our "test suites" (admin, client, api) = QATouch "projects"
- Each suite maps to a QATouch project via `projectKey-{suite}`
- Automatically aligns sprint runs and regression with their correct QATouch projects

### 📌 Required Structure
| Component | Pattern | Example |
|-----------|---------|---------|
| QATouch Config | `projectKey-{suite}` | `projectKey-admin` |
| Test Directory | `e2e/{suite}/` | `e2e/admin/` |
| Page Objects | `pages/{suite}/` | `pages/admin/` |
| Describe Blocks | `describe("{Suite}",...)` | `describe("Admin",...)` |'

### 📁 Directory Layout
```
cypress/
├── e2e/
│   ├── {suite}/           # Suite-specific tests  
│   └── sprint/            # Sprint files
├── pages/
│   └── {suite}/           # Suite page objects
└── config/env/            # Environment configs
```

### Adding New Test Suites
1. Add `projectKey-{suite}` to `qatouch.json`
2. Create `e2e/{suite}/` and `pages/{suite}/` directories
3. Use `describe("{Suite}", ...)` in sprint files

---

## 🚀 Running Tests

### Interactive Mode (GUI)
```bash
# Development
npx cypress open --env configFile=develop

# Other environments
npx cypress open --env configFile=staging
npx cypress open --env configFile=live
```

### Headless Mode

#### Regression Testing
#### Regression
```bash
# Google Sheets
npx cypress run --env configFile=develop,regression=true

# QATouch  
npx cypress run --env configFile=live,testRunKey=ABC123,testSuite=admin
```

#### Sprint Testing
```bash
# All sprint
npx cypress run --env configFile=develop,sprint=all

# Specific sprint
npx cypress run --env configFile=develop,sprint=v25
```

---

## 🏃‍♂️ Sprint Development

### 📂 File Structure
- **Naming**: Sprint 25 → `v25.cy.ts`, Sprint 26 → `v26.cy.ts`
- **Template**: Start with `/cypress/e2e/sprint/base.ts`
- **Consistency**: Each `describe("{Suite}", …)` must match a test suite (e.g. *admin*, *client*, *api*) → maps directly to a QATouch project via `projectKey-{suite}`

```typescript
describe("Admin", () => {
  // Admin-related test cases (maps to projectKey-admin)
});

describe("Client", () => {
 // Client-facing test cases (maps to projectKey-client)
});

describe("API", () => {
  // API endpoint test cases (maps to projectKey-api)
});
```

### 🧾 Test Case Format
**Pattern**: `CaseNumber - [Module Name] Test Case Title`

```typescript
it(`382 - [${ClientModules.Dashboard}] Select GCash Solution Deposit Card`, () => {
  // Implementation
});
```

**Rules**:
- **Case Number**: Numeric only (`TR0034` → `34`)
- **Module**: Use enums (e.g. `${ClientModules.Dashboard}`)
- **Title**: Descriptive and specific

### 🔄 Development Workflow
1. **Structure First**: Create empty `it` blocks for all cases
   - ⚠️ Sprint Cleaner detects duplicates based on case numbers inside it blocks
2. **Clean**: Run Sprint Cleaner to catch duplicates
3. **Implement**: Fill in test logic after cleaner passes

---

## 🔗 QATouch Integration (Sprint-Oriented)

### Test Run Setup
In sprint runs, each `describe("{Suite}" …)` block is mapped to its QATouch project via qatouch.json:

- `projectKey` → resolved automatically from `qatouch.json` (`projectKey-{suite}`)

- `testRunKey` → explicitly defined inside the `describe` block (from QATouch Test Run)

```typescript
describe("Admin", () => {
   const ADMIN_testRunKey = "JG3KB"; // Get from QATouch URL or Config

   after(() => {
      cy.bulkUpdateQATouch({
         comments: `Cypress Automation - env: ${Cypress.env("env")}`,
         projectKey: Cypress.env("projectKey-admin"),
         testRunKey: ADMIN_testRunKey
      });
   });
});
```

### Finding Test Run Keys
- **From URL**: `https://rhgc.qatouch.com/v2#/testrun/p/1p8b/tid/JG3KB` → Key: `JG3KB`
- **From Config**: In QATouch UI, open Test Run → click **Config**

### Custom Status & Comments
```typescript
// Add custom comment
cy.setQATouchComment('Database timeout - needs investigation');

// Override test status
cy.setQATouchStatus(QATouchStatus.BLOCKED);
```

**Available Status Options**: `PASSED`, `FAILED`, `BLOCKED`, `RETEST`, `UNTESTED`, `NOT_APPLICABLE`, `IN_PROGRESS`, `HOLD`

---

## 🧹 Sprint Cleaner Tool

### Purpose
Detects and handles duplicate test case numbers across sprint files.

### Setup & Usage
```bash
# Install once
cd /sprint_cleaner/ && npm install  

# Run cleaner
npm run clean  

# Custom directory
npx ts-node index.ts --dir "custom-sprint-directory"
```

### Configuration
Update paths in `package.json`:
```json
{
  "config": {
    "enumPaths": {
      "admin": "../cypress/support/constants/adminModules.ts",
      "client": "../cypress/support/constants/clientModules.ts"
    },
    "sprintDir": "../cypress/e2e/sprint"
  }
}
```

### Duplicate Options
- **delete** → remove duplicates
- **skip** → Add `.skip`
- **leave** → report only

---

## 🔄 Regression

### Google Sheets
Ensure your service account has access to your Google Sheets as an **editor**.

```bash
npx cypress run --env configFile=develop,regression=true
```

#### Naming Format
```ts
describe("Title {SheetName!Cell}", () => {})
it("CaseNumber - [Module Name] Title {SheetName!Cell}", () => {})
```

⚠️ **Important Notes:**
- For a `describe` block to pass, **all child `it` blocks must pass**
- Nested `describe` blocks work but **avoid them**

### QATouch

```bash
npx cypress run --env configFile=develop,testSuite={suite},testRunKey=XYZ
```

**Requirements**:
- Test run exists in corresponding QATouch project
- Valid `testRunKey` and `projectKey`
- Each `it` block has a case number
- Specs in `/e2e/{suite}/` directory

---

## Live API

> 🚧 **Under Construction:** Live API integration is currently being developed.

---

## 💡 Best Practices

### Development
- ✅ Start with empty `it` blocks → run **Sprint Cleaner** → then implement
- ✅ Use **development config** during test development
- ✅ Test manually before automation
- ❌ Don’t automate until sprint deployment is complete

### Test Organization
- Group tests by appropriate test suite e.g `admin`, `client`, `api`
- Use **descriptive**, **consistent test titles**
- Keep test cases **atomic** and **independent**
- Follow consistent **naming patterns** across all test suites
- Keep `describe` blocks **flat** (avoid deep nesting)

### Cypress + Typescript
- ✅ Use enums for modules instead of raw strings
- ✅ Leverage **Page Objects** / **helpers** to reduce duplication
- ✅ Target elements with `data-cy`, `data-testid`, or `data-test` attributes over brittle selectors
- ✅ Use `beforeEach` for setup, not for assertions
- ✅ Type your custom Cypress commands for IntelliSense + safety
- ❌ Avoid hard-coded waits (`cy.wait(5000)`) — use assertions instead

---

## 🔧 Troubleshooting

### Common Issues

#### Tests Not Running
```bash
npm install                   # Reinstall dependencies
ls cypress/config/env/        # Verify config files exist
```

#### QATouch Integration Issues
- Verify API token in `qatouch.json`
- Verify `projectKey` & `testRunKey` are correct
- Ensure test run exists and is accessible
- Check network connectivity to QATouch API

#### Google Sheets Integration Issues

- Verify service account has editor access to sheets
- Check `/secrets/service-account.json` file exists and has correct permissions
- Verify regression sheet link in `/config/regression-sheet.json` is correct
- Ensure proper cell notation in test names

#### Development Environment
```bash
npx cypress open --env configFile=develop
```

#### Sprint Cleaner Issues
- Check enum file paths `package.json` config
- Check sprint directory path in `package.json` config
- run `npm install` in directory

---

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [QATouch API Documentation](https://doc.qatouch.com/#section/QA-Touch-API)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---