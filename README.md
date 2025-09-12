# 🧪 Cypress Test Setup Guide

A comprehensive guide for setting up and running Cypress tests with **QATouch integration** for sprint development and **Google Sheets integration** for regression tracking.

> ⚠️ **TypeScript Required**
> This guide assumes **TypeScript** usage for type safety, better tooling, maintainability, and modern standards.

---

## 📋 Table of Contents
- [🚀 Quick Start](#-quick-start)
- [🏗️ Test Suite Architecture](#️-test-suite-architecture)
- [🏃‍♂️ Sprint Development](#️-sprint-development)
- [🔄 Regression Testing](#-regression-testing)
- [🔗 Integration Setup](#-integration-setup)
- [🧹 Sprint Cleaner Tool](#-sprint-cleaner-tool)
- [💡 Best Practices](#-best-practices)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (latest LTS recommended)
- **QATouch account** (for sprint testing)
- **Google Service Account** (for regression tracking)

### Installation & Setup

#### 1. Add Submodules

```bash
cd your-project-directory

# Add cypress-base submodule
git submodule add https://github.com/equals-rockheart/cypress-workflow.git cypress-base --branch main

# Add sprint-cleaner submodule
git submodule add https://github.com/equals-rockheart/cypress-workflow.git sprint-cleaner --branch main
```

#### 2. Install Dependencies

**Update `cypress/support/e2e.ts`:**
``` json
{
  "devDependencies": {
    "cypress": "^15.1.0",
    "cypress-base": "file:./cypress-base" // add this line
  }
}
```

**Install packages:**

``` bash
npm install
```

#### Step 3: Configure Cypress

**Setup config file:**

```bash
# Rename existing config
mv cypress.config.js cypress.config.ts

# or Copy template from cypress-base
mv cypress.config.js cypress.config.js.bak && cp cypress-base/template-cypress.config.ts cypress.config.ts
```

**Update `cypress.config.ts`:**

```ts
import { defineConfig } from "cypress";
import baseConfig from "./cypress-base/base/base.config";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      baseConfig.e2e!.setupNodeEvents!(on, config);
      // Your Setup
      config.env = {
        ...config.env,
        // Add your custom variables here
      };

      return config;
    },
  },
});
```


#### Step 4: Setup TypeScript
**Copy TypeScript config:**
```bash
cp cypress-base/template-tsconfig.json tsconfig.json
```

**Convert test files:**
```bash
# Rename all .js spec files to .ts
find cypress/e2e -name "*.js" -exec sh -c 'mv "$1" "${1%.js}.ts"' _ {} \;
```

#### Step 5: Enable Integrations
**Update `cypress/support/e2e.ts`:**
```ts
import '@integrations/qatouch'
import '@integrations/googleSheets'
```

#### Step 6: Create Config Files
**Default Files:**
```bash
# Create environment directory
mkdir -p cypress/config/env

# Create secrets directory
mkdir -p /secrets

# Create qatouch.json
touch cypress/config/qatouch.json

# Create regression config
touch cypress/config/regression-sheet.json

```

### Run Tests
```bash
# Interactive (configFile maps to /cypress/config/env/)
npx cypress open --env configFile=develop

# Sprint (QATouch integration)
npx cypress run --env configFile=develop,sprint=v25

# Regression (Google Sheets integration)
npx cypress run --env configFile=develop,regression=true
```

### Updating Submodules

```bash
git submodule update --remote --merge
```

---

## 🏗️ Test Suite Architecture

### Core Concept: Suite-Based Organization
Tests are organized by **suites** (admin, client, api) that map to **QATouch Projects** and **Google Sheet tabs**.

### Required Structure
| Component | Pattern | Example |
|-----------|---------|---------|
| QATouch Config | `projectKey-{suite}` | `projectKey-admin` |
| Test Directory | `e2e/{suite}/` | `e2e/admin/` |
| Page Objects | `pages/{suite}/` | `pages/admin/` |
| Describe Blocks | `describe("{Suite}", ...)` | `describe("Admin", ...)` |

### Directory Structure
```
cypress/
├── e2e/
│   ├── {suite}/           # Regression tests by suite
│   └── sprint/            # Sprint files (cross-suite)
├── pages/
│   └── {suite}/           # Suite page objects
├── config/                # Environment & integration configs
├── support/               # Helpers, utils, integrations
secrets/                   # Service account keys (gitignored)
```

### Adding New Test Suites
1. Add `projectKey-{suite}` to `qatouch.json`
2. Create directories: `e2e/{suite}/` and `pages/{suite}/`
3. Use `describe("{Suite}", ...)` pattern in test files

---

## 🏃‍♂️ Sprint Development

**Purpose**: Cross-suite testing for sprint releases with **QATouch integration**

### File Organization
- **Naming**: Sprint 25 → `v25.cy.ts`, Sprint 26 → `v26.cy.ts`
- **Location**: `/cypress/e2e/sprint/`
- **Template**: Use `/cypress/e2e/sprint/base.ts`

### Test Structure Requirements

| Requirement     | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| **Case Number** | ✅ Required → syncs with QATouch                                    |
| **Module Enum** | ✅ Required → enables regression mapping                            |
| **Enum Usage**  | ✅ Required → use predefined enums (e.g., `AdminModules.Dashboard`) |


```typescript
describe("Admin", () => {
  const ADMIN_testRunKey = "JG3KB"; // From QATouch Test Run

  // Required format: CaseNumber - [ModuleEnum] Test Title
  it(`382 - [${AdminModules.Dashboard}] Verify dashboard loading`, () => {
    // Test implementation
  });

  it(`385 - [${AdminModules.AccountDetails_General}] Update profile`, () => {
    // Test implementation
  });

  after(() => {
    cy.bulkUpdateQATouch({
      comments: `Cypress Automation - env: ${Cypress.env("env")}`,
      projectKey: Cypress.env("projectKey-admin"),
      testRunKey: ADMIN_testRunKey
    });
  });
});
```

### Development Workflow
1. **Structure First**: Create empty `it` blocks for all test cases
2. **Clean**: Run Sprint Cleaner to detect duplicates
3. **Implement**: Add test logic after validation passes

### Running Sprint Tests
```bash
# All sprint tests
npx cypress run --env configFile=develop,sprint=all

# Specific sprint
npx cypress run --env configFile=develop,sprint=v25
```

> 📖 For more details, see the full [Sprint Development Guide↗](docs/sprint.md).

---

## 🔄 Regression Testing

**Purpose**: Suite-specific testing with **Google Sheets integration** for result tracking

### Test Structure Requirements

| Requirement         | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| **Case Number**     | 🟡 Optional → syncs with QATouch                  |
| **Sheet Reference** | ✅ Required → syncs with Google Sheets |
| **Module Enum**     | ❌ Prohibited → module is already implied by spec file name  |
| **Test Run Key**    | 🟡 Optional → links to QATouch test run                  |

```ts
describe("Dashboard Elements {D5}", () => {
    it("GCash Solution Card Visibility {Merchant!D8}", () => {
        cy.log("✅ Updates Merchant sheet at D8");
        expect(true).to.be.true;
    });

    it("Currency Display Validation {D9}", () => {
        cy.log("❌ Updates Admin sheet at D9");
        expect(true).to.be.false;
    });
});
```

### Sheet Mapping Rules

**Default Mapping** (based on test location):
- `/e2e/admin/**` → `Admin` sheet
- `/e2e/client/**` → `Client` sheet  
- `/e2e/merchant/**` → `Merchant` sheet

**Override Options**:
- **Explicit**: `{SheetName!Cell}` → specific sheet + cell
- **Default**: `{Cell}` → uses suite location mapping
- **Custom URL**: `[sheet:URL]` → override entire sheet

### Running Regression Tests
```bash
# Google Sheets integration
npx cypress run --env configFile=develop,regression=true

# QATouch integration (optional)
npx cypress run --env configFile=live,testRunKey=ABC123,testSuite=admin
```

> 📖 *For more details, see the full  [Regression Development Guide↗](docs/regression.md)*

---

## 🔗 Integration Setup

### QATouch Integration (Sprint Testing)
Edit `/cypress/config/qatouch.json`:
```json
{
  "apiToken": "your-qatouch-api-token",
  "domain": "your-domain",
  "projectKey-admin": "ADMIN_PROJECT_KEY",
  "projectKey-client": "CLIENT_PROJECT_KEY",
  "projectKey-api": "API_PROJECT_KEY"
}
```

### Google Sheets Integration (Regression Testing)

Configure `/cypress/config/regression-sheet.json`:
```json
{
  "regression-sheet": "https://docs.google.com/spreadsheets/d/your-sheet-id",
  "regression-test-pass": "✅",
  "regression-test-fail": "❌"
}
```

**Setup Steps**:
1. Create Google Cloud Project & enable Sheets API
2. Create Service Account → download JSON key
3. Save key as `/secrets/service-account.json`
4. Share spreadsheet with service account (Editor access)

### Environment Configuration
Configure files in `/cypress/config/env/` for each environment:
```json
{
  "env": "develop",
  "baseURL": "https://develop.yourapp.com",
  // Your other config
}
```
> 📖 *For more details, see the full [Integrations Guide↗](docs/integrations.md).*

---

## 🧹 Sprint Cleaner Tool

**Purpose**: Detects duplicate test case numbers across sprint files

### Usage
```bash
cd /sprint-cleaner/
npm install
npm run clean
```

### Duplicate Handling Options
- **delete** → Remove duplicates
- **skip** → Add `.skip` to duplicates  
- **leave** → Report only, no changes

---

## 💡 Best Practices

### Test Development
- ✅ **Structure First**: Create empty shells → Clean → Implement
- ✅ **Atomic Tests**: Keep test cases independent
- ✅ **Descriptive Titles**: Use clear, specific naming
- ✅ **TypeScript**: Use enums, page objects, type safety
- ❌ **Avoid Hard-coded Delays**: Use assertions over `cy.wait(timeout)`

### Sprint vs Regression Guidelines

**Sprint Development** (QATouch):
- Use case numbers (required for sync)
- Include module enums (required for loading)
- Cross-suite testing in single files

**Regression Testing** (Google Sheets):
- Skip case numbers (unless using QATouch too)
- Skip module names (spec files are module-specific)
- Suite-specific testing in separate directories

---

## 🔧 Troubleshooting

### Common Issues

**QATouch Integration**:
- Verify API token in `qatouch.json`
- Check `projectKey` and `testRunKey` values
- Ensure test run exists and is accessible

**Google Sheets Integration**:
- Verify service account has Editor access
- Check `/secrets/service-account.json` format
- Validate sheet URL in `regression-sheet.json`

**Sprint Cleaner**:
```bash
cd sprint-cleaner
rm -rf node_modules
npm install
npm run clean
```

---

## 📚 Resources

### External Resources
- [Cypress Documentation↗](https://docs.cypress.io/)
- [QATouch API Documentation↗](https://doc.qatouch.com/#section/QA-Touch-API)
- [Google Sheets API Guide↗](https://developers.google.com/sheets/api/guides/concepts)
- [TypeScript Best Practices↗](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Cypress Typescript Configuration↗](https://docs.cypress.io/guides/tooling/typescript-support)

### Internal Resources
- [Integrations↗](docs/integrations.md)
- [Regression Development↗](docs/regression.md)
- [Sprint Development↗](docs/sprint.md)
- [QA Team Training Materials↗](https://oriental-wallet.atlassian.net/wiki/spaces/QA/pages/256147505/Training+Materials)

---

*Last updated: September 2025*