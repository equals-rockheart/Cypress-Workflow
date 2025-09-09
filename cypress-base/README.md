# 🧪 Cypress Test Setup Guide

A comprehensive guide for setting up and running Cypress tests with QATouch integration for TypeScript projects.

> ⚠️ **TypeScript Required**
> This guide assumes **TypeScript** usage. While JavaScript migration is possible, TypeScript is strongly recommended for:
> - **Type safety** → catch errors at compile time
> - **Better tooling** → enhanced IDE support with autocomplete
> - **Maintainability** → organized large test suites
> - **Modern standards** → aligns with current Cypress best practices

---

## 📋 Table of Contents
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🏗️ Test Suite Architecture](#️-test-suite-architecture)
- [🚀 Running Tests](#-running-tests)
- [🏃‍♂️ Sprint Development](#️-sprint-development)
- [🔗 QATouch Integration](#-qatouch-integration)
- [🧹 Sprint Cleaner Tool](#-sprint-cleaner-tool)
- [🔄 Regression Testing](#-regression-testing)
- [💡 Best Practices](#-best-practices)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (latest LTS recommended)
- **QATouch account** for test run management
- **Google Service Account** (for Google Sheets integration)

### Installation
```bash
# Navigate to your project directory
cd your-project-directory

# Install dependencies
npm install
```

---

## ⚙️ Configuration

### 1. Environment Configuration
Configure environment files in `/cypress/config/env/` based on your project's available environments.

**Required Configuration Values:**
```json
{
  "env": "develop",
  "baseURL": "https://develop.paystage.net"
}
```

> 💡 **Note**: Environment names (`develop`, `staging`, `live`) are examples. Configure files based on your project's actual environments. The `env` and `baseURL` fields are required in each configuration file.

### 2. QATouch Integration Setup
Edit `/cypress/qatouch.json` with your API credentials:

```json
{
  "apiToken": "your-qatouch-api-token",
  "domain": "your-domain",
  "projectKey-admin": "ADMIN_PROJECT_KEY",
  "projectKey-client": "CLIENT_PROJECT_KEY",
  "projectKey-api": "API_PROJECT_KEY"
}
```

> 💡 **Note**: Only configure project keys that match your test suites

### 3. Google Sheets Integration (Optional)
For regression tracking with Google Sheets:

**Configuration** (`/cypress/regression-sheet.json`):
```json
{
  "regression-sheet": "https://docs.google.com/spreadsheets/d/your-sheet-id",
  "regression-test-pass": "✅",
  "regression-test-fail": "❌"
}
```

**Setup Steps**:
1. Create Google Cloud Project
2. Enable Google Sheets API  
3. Create Service Account and download JSON key
4. Save key as `/secrets/service-account.json`
5. Share spreadsheet with service account email (Editor access)

> ⚠️ **Security**: Add `/secrets/` to `.gitignore`

---

## 🏗️ Test Suite Architecture

### Core Concept: Suite-Based Organization
Our architecture maintains consistency across specs, page objects, and QATouch integration:

- **Test Suites** (e.g. admin, client, api) map to **QATouch Projects**
- Each suite connects via `projectKey-{suite}` configuration
- - Automatically aligns sprint runs and regression with their correct QATouch projects

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
│   ├── {suite}/           # Suite-specific tests  
│   └── sprint/            # Sprint files
├── pages/
│   └── {suite}/           # Suite page objects
├── config/                # Configurations
├── support/               # Helper, utils and integrations
└── secrets/               # Service account keys (gitignored)
```

### Adding New Test Suites
1. Add `projectKey-{suite}` to `qatouch.json`
2. Create directories: `e2e/{suite}/` and `pages/{suite}/`
3. Use `describe("{Suite}", ...)` pattern in test files

---

## 🚀 Running Tests

### Interactive Development (Cypress GUI)
```bash
# Development environment
npx cypress open --env configFile=develop

# Other environments
npx cypress open --env configFile=staging
npx cypress open --env configFile=live
```

### Headless Execution

#### Sprint Testing
```bash
# Run all sprint tests
npx cypress run --env configFile=develop,sprint=all

# Run specific sprint
npx cypress run --env configFile=develop,sprint=v25
```

#### Regression Testing
```bash
# Google Sheets integration
npx cypress run --env configFile=develop,regression=true

# QATouch integration
npx cypress run --env configFile=live,testRunKey=ABC123,testSuite=admin
```

---

## 🏃‍♂️ Sprint Development

### File Organization
- **Naming Convention**: Sprint 25 → `v25.cy.ts`, Sprint 26 → `v26.cy.ts`
- **Template**: Use `/cypress/e2e/sprint/base.ts` as starting point
- **Suite Mapping**: Each `describe("{Suite}", ...)` must match QATouch project keys
### Test Structure Template
```typescript
describe("Admin", () => {
  // Admin-related tests (maps to projectKey-admin)
  it(`382 - [${AdminModules.Dashboard}] Verify dashboard loading`, () => {
    // Test implementation
  });
});

describe("Client", () => {
  // Client-facing tests (maps to projectKey-client)
  it(`383 - [${ClientModules.Profile}] Update user profile`, () => {
    // Test implementation
  });
});

describe("API", () => {
  // API endpoint tests (maps to projectKey-api)
  it(`384 - [${APIModules.Auth}] Validate login endpoint`, () => {
    // Test implementation
  });
});
```

### Test Case Format
**Pattern**: `CaseNumber - [Module Name] Test Case Title`

**Rules**:
- **Case Number**: Numeric only (convert `TR0034` → `34`)
- **Module**: Use predefined enums (e.g., `${ClientModules.Dashboard}`)
- **Title**: Match test case title in QATouch

### Development Workflow
1. **Structure First**: Create empty `it` blocks for all test cases
2. **Clean**: Run Sprint Cleaner to detect duplicates
3. **Implement**: Add test logic after cleaner validation passes

> ⚠️ **Important**: Sprint Cleaner detects duplicates by case numbers in `it` blocks

---

## 🔗 QATouch Integration (Sprint-Oriented)

### Automatic Project Mapping
Each `describe("{Suite}", ...)` block automatically maps to its QATouch project:
- `projectKey-{suite}` resolves from `qatouch.json`
- `testRunKey` must be defined within each describe block

### Test Run Configuration
```typescript
describe("Admin", () => {
  const ADMIN_testRunKey = "JG3KB"; // From QATouch Test Run

  after(() => {
      cy.bulkUpdateQATouch({
          comments: `Cypress Automation - env: ${Cypress.env("env")}`,
          projectKey: Cypress.env("projectKey-admin"),
          testRunKey: ADMIN_testRunKey
      });
  });

  // Test cases...
});
```

### Finding Test Run Keys
- **URL Method**: `https://domain.qatouch.com/v2#/testrun/p/1p8b/tid/JG3KB` → Key: `JG3KB`
- **UI Method**: Open Test Run → Click **Config** button

### Custom Status & Comments
```typescript
// Add detailed comment
cy.setQATouchComment('Database connection timeout - investigating');

// Override test result
cy.setQATouchStatus(QATouchStatus.BLOCKED);
```

**Available Status Options**:
`PASSED`, `FAILED`, `BLOCKED`, `RETEST`, `UNTESTED`, `NOT_APPLICABLE`, `IN_PROGRESS`, `HOLD`

---

## 🧹 Sprint Cleaner Tool

### Purpose
Detects and handles duplicate test case numbers across sprint files.

### Setup & Usage
```bash
# One-time setup
cd /sprint_cleaner/
npm install

# Run cleaner
npm run clean

# Custom directory
npx ts-node index.ts --dir "custom-sprint-directory"
```

### Configuration
Update paths in `sprint_cleaner/package.json`:
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
- **delete** → Remove duplicate test cases
- **skip** → Add `.skip` to duplicates
- **leave** → Report only, no changes

---

## 🔄 Regression Testing

### Google Sheets Integration
Automatically updates test results in Google Sheets for regression tracking.

```bash
npx cypress run --env configFile=develop,regression=true
```

#### Naming Requirements
```typescript
// Describe block with sheet reference
describe("Admin Dashboard Tests {TestResults!A1}", () => {

  // Test case with cell reference  
  it("382 - [Dashboard] Load main dashboard {TestResults!B2}", () => {
    // Test implementation
  });
});
```

**Important Notes**:
- Describe block passes only when **all** child test cases pass
- Avoid nested describe blocks for cleaner reporting
- Service account needs **Editor** access to spreadsheet

### QATouch Integration
Updates test results directly in QATouch test runs.

```bash
npx cypress run --env configFile=develop,testSuite={suite},testRunKey=XYZ
```

**Requirements**:
- Test run exists in corresponding QATouch project
- Correct `testRunKey` and `projectKey`
- Test cases contain numeric case numbers
- Spec files located in `/e2e/{suite}/` directory

---

## 💡 Best Practices

### Development Workflow
- ✅ **Structure First**: Create empty test shells → Run Sprint Cleaner → Implement logic
- ✅ **Use Development Config**: Test with development environment during implementation
- ✅ **Manual Testing**: Verify functionality manually before automation
- ❌ **Don't Automate Early**: Wait for sprint deployment completion

### Test Organization
- **Suite Grouping**: Organize tests by test suites (e.g. admin, client, api)
- **Descriptive Titles**: Use clear, specific test titles
- **Atomic Tests**: Keep test cases independent and focused
- **Consistent Naming**: Follow established patterns across all suites
- **Flat Structure**: Avoid deep nesting in describe blocks

### Cypress + Typescript
- ✅ **Use Enums**: Replace raw strings with enums
- ✅ **Page Objects**: Leverage reusable page objects and helpers
- ✅ **Reliable Selectors**: Target `data-cy`, `data-testid` attributes over CSS selectors
- ✅ **Smart Waits**: Use assertions instead of `cy.wait(timeout)`
- ✅ **Type Safety**: Define types for custom Cypress commands
- ❌ **Avoid Hard-coded Delays**: Replace `cy.wait(5000)` with proper assertions

---

## 🔧 Troubleshooting

### Common Issues

#### Installation Problems
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify Cypress installation
npx cypress verify

# Check configuration files
ls cypress/config/
```

#### QATouch Integration Failures
- **Verify API Token**: Check `qatouch.json` configuration
- **Validate Keys**: Ensure `projectKey` and `testRunKey` are correct
- **Test Run Access**: Confirm test run exists and is accessible
- **Network Connectivity**: Test QATouch API access

#### Google Sheets Integration Issues
- **Service Account Permissions**: Verify editor access to spreadsheet
- **Credentials File**: Check `/secrets/service-account.json` exists and has correct format
- **Sheet Configuration**: Check `regression-sheet.json` configuration
- **Cell Notation**: Ensure proper `{SheetName!Cell}` format in test names

#### Sprint Cleaner Problems
```bash
# Navigate to sprint_cleaner directory
cd sprint_cleaner

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Typescript Configuration](https://docs.cypress.io/guides/tooling/typescript-support)
- [QATouch API Documentation](https://doc.qatouch.com/#section/QA-Touch-API)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Google Sheets API Guide](https://developers.google.com/sheets/api/guides/concepts)

---

*Last updated: September 2025*