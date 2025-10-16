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
- **Git** (latest recommended) 
- **Node.js** (latest LTS recommended)
- **QATouch account** (for sprint testing)
- **Google Service Account** (for regression tracking)

### Installation & Setup

#### 1. Add Submodules

```bash
cd your-project-directory

# Initialize git repository (skip if already inside a git repo)
git init

# Add cypress-workflow as submodule
git submodule add -b main https://github.com/equals-rockheart/cypress-workflow.git cypress-workflow
```

#### 2. Install Dependencies

**Update `cypress/support/e2e.ts`:**
``` json
{
  "devDependencies": {
    "cypress": "^15.2.0",
    "cypress-base": "file:./cypress-workflow" // add this line
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
# Rename existing config -> .bak
# or Copy template from cypress-base
npm --prefix ./cypress-workflow run setup:cypress.config
```

**Update `cypress.config.ts`:**

```ts
import { defineConfig } from "cypress";
import baseConfig from "./cypress-workflow/cypress-base/base/base.config";

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
npm --prefix ./cypress-workflow run setup:tsconfig
```

**Convert `.js` files:**
```bash
# Rename all .js files to .ts
npm --prefix ./cypress-workflow run rename:files
```

#### Step 5: Enable Integrations
**Update `cypress/support/e2e.ts`:**
```ts
import '@integrations/qatouch'
import '@integrations/googleSheets'
import '@integrations/sprintLoader'
```

#### Step 6: Create Config Files
**Default Files:**
```bash
# Initialize project config & secrets
# - Creates /cypress/config/env directory
# - Creates /secrets directory
# - Generates cypress/config/qatouch.json (default structure)
# - Generates cypress/config/regression-sheet.json (default structure)
# - Generates cypress/config/env/env.json (default environment file)
npm --prefix ./cypress-workflow run setup:config
```

### Run Tests
```bash
# Interactive (configFile maps to /cypress/config/env/)
npx cypress open --env configFile=develop

# Interactive - Disable Integration (all | gsheets | qatouch)
npx cypress open --env configFile=develop,disable=all

# Sprint 
npx cypress run --env configFile=develop,sprint=v25
npx cypress run --env configFile=develop,sprint=all

# Regression
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
- **Template**: Use `/cypress-base/examples/base-sprint.ts`

### Test Structure Requirements

| Requirement     | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| **Case Number** | ✅ Required → syncs with QATouch                                    |
| **Module Enum** | ✅ Required → enables regression mapping                            |
| **Enum Usage**  | ✅ Required → use predefined enums (e.g., `AdminModule.Dashboard`) |


```typescript
describe("Admin", () => {
  const ADMIN_testRunKey = "JG3KB"; // From QATouch Test Run

  // Required format: CaseNumber - [ModuleEnum] Test Title
  it(`382 - [${AdminModule.Dashboard}] Verify dashboard loading`, () => {
    // Test implementation
  });

  it(`385 - [${AdminModule.AccountDetails_General}] Update profile`, () => {
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

# Disable Integrations
npx cypress run --env configFile=develop,sprint=v26,disable=gsheets
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

```ts
// e2e/admin/dashboard.cy.ts
describe("Dashboard Elements {D5}", () => {
    it("GCash Solution Card Visibility {Merchant!D8}", () => {
        cy.log("✅ Updates Merchant sheet at D8");
        expect(true).to.be.true;
    });

    it("45 - Currency Display Validation {D9}", () => {
        cy.log("❌ Updates Admin sheet at D9 and QATouch Case 45");
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
# All spec files except /e2e/sprint
npx cypress run --env configFile=develop,regression=true

# Disable Integrations
npx cypress run --env configFile=develop,regression=true,disable=qatouch
```

> 📖 *For more details, see the full  [Regression Development Guide↗](docs/regression.md)*

---

## 🔗 Integration Setup

### QATouch Integration
Edit `/cypress/config/qatouch.json`:
```json
{
  "apiToken": "your-qatouch-api-token",
  "domain": "your-domain",
  "projectKey-admin": "ADMIN_PROJECT_KEY",
  "projectKey-client": "CLIENT_PROJECT_KEY",
  "regression-admin-testRunKey": "REGRESSION_ADMIN_TESTRUN_KEY",
  "regression-client-testRunKey": "REGRESSION_CLIENT_TESTRUN_KEY",
}
```

### Google Sheets Integration

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