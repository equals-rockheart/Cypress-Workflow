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

**Common configurations:**
- `staging.json` - Staging environment
- `live.json` - Production environment

**Additional configurations (if available):**
- `develop.json` - Development environment
- `uat.json` - User Acceptance Testing environment

**Required Config Values:**
```json
{
   "env" : "develop",
   "baseURL" : "https://develop.paystage.net"
}
```

> 💡 **Note**: Not all projects will have all environments. Configure only what your project provides.

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
> 💡 **Project-Dependent**: Configure only the keys that match your project's test suites. Not all projects require all three keys.

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

### How It Works
The framework uses synchronized components that automatically resolve based on the `testSuite` parameter:

```bash
# When you run:
npx cypress run --env testSuite=admin

# Framework automatically resolves:
projectKey-admin     → QATouch integration
e2e/admin/           → Test file location  
pages/admin/         → Page objects
```

### Required Structure
> ⚠️ **Critical**: Keep these components synchronized for each test suite:

| Test Suite | QATouch Config | Test Directory | Page Objects |
|------------|----------------|----------------|--------------|
| `admin` | `projectKey-admin` | `e2e/admin/` | `pages/admin/` |
| `client` | `projectKey-client` | `e2e/client/` | `pages/client/` |
| `api` | `projectKey-api` | `e2e/api/` | `pages/api/` |

### Directory Structure
```
cypress/
├── e2e/
│   ├── admin/          # Admin test files
│   ├── client/         # Client test files  
│   ├── api/            # API test files
│   └── sprint/         # Sprint test files
├── pages/
│   ├── admin/          # Admin page objects
│   ├── client/         # Client page objects
│   └── api/            # API utilities
└── config/
    └── env/            # Environment configurations
```

### Adding New Test Suites
1. Add `projectKey-{name}` to `qatouch.json`
2. Create `e2e/{name}/` and `pages/{name}/` directories
3. Use `testSuite={name}` in run commands

> 📝 **Note**: The `projectKey-{testSuite}` naming convention is hardcoded in the framework.

---

## 🚀 Running Tests

### Interactive Mode (GUI)
```bash
# Development environment
npx cypress open --env configFile=develop

# Staging environment  
npx cypress open --env configFile=staging

# Production environment
npx cypress open --env configFile=live
```

### Headless Mode

#### Regression Testing
```bash
# Google Sheets regression
npx cypress run --env configFile=develop,regression=true

# QATouch regression
npx cypress run --env configFile=live,testRunKey=<qatouch-testRunkey>,testSuite=<testSuite>
```

#### Sprint Testing
```bash
# All sprint tests
npx cypress run --env configFile=develop,sprint=all

# Specific sprint version
npx cypress run --env configFile=develop,sprint=v25
```

---

## 🏃‍♂️ Sprint Development

### File Naming & Structure
- **Naming**: Sprint 25 → `v25.cy.ts`, Sprint 26 → `v26.cy.ts`
- **Base Template**: Use `/cypress/e2e/sprint/base.cy.ts` as starting point
- **Organization**: Mirror your QATouch project structure in `describe` blocks

**Example Structure** (PayStage project):
```typescript
describe("Admin", () => {
  // Admin-related test cases
});

describe("Client", () => {
   // Client-facing test cases  
});

describe("API", () => {
   // API endpoint tests
});
```

### Test Case Format
**Naming Convention**: `CaseNumber - [Module Name] Test Case Title`

**Rules**:
- **Case Number**: Numeric only (`TR0034` → `34`)
- **Module Name**: Use predefined enums (`${ClientModules.Dashboard}`)
- **Title**: Descriptive and specific

**Example**:
```typescript
it(`382 - [${ClientModules.Dashboard}] Select GCash Solution Deposit Card`, () => {
  // Test implementation
});
```

### Development Workflow
1. **Create Structure**: Start with empty `it` blocks for all test cases
2. **Run Sprint Cleaner**: Detect and resolve duplicate case numbers
3. **Implement Logic**: Fill in test implementations after cleaner passes

---

## 🔗 QATouch Integration

### Test Run Setup
Link each `describe` block to a QATouch test run:

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
- **From Config**: Click **Config** in QATouch interface

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
# Navigate and install
cd /sprint_cleaner/
npm install

# Run cleaner
npm run clean

# With custom directory
npx ts-node index.ts --dir "custom-sprint-directory"
```

### Configuration
Update paths in `package.json` if needed:
```json
{
  "config": {
    "enumPaths": {
      "admin": "../cypress/support/constants/adminModules.ts",
      "client": "../cypress/support/constants/clientModules.ts", 
      "api": "../cypress/support/constants/apiModules.ts"
    },
    "sprintDir": "../cypress/e2e/sprint"
  }
}
```

### Handling Options
- **delete**: Remove duplicate test cases
- **skip**: Add `.skip` to duplicate blocks
- **leave**: Report only, no changes

---

## 💡 Best Practices

### Development Workflow
- ✅ Create empty `it` blocks first, then run Sprint Cleaner
- ✅ Use development config during test creation
- ✅ Test manually before automation
- ✅ Ensure sprint deployment is complete before automation

### Test Organization
- Group tests by appropriate side (Admin/Client/API)
- Use descriptive test titles and keep cases atomic
- Follow consistent naming patterns
- Maintain synchronization between QATouch keys and directory structure

### Security & Integration
- Keep API tokens environment-specific and secure
- Set up test runs manually before automation
- Use custom status and comments for better QATouch reporting

---

## 🔧 Troubleshooting

### Common Issues

**Tests Not Running**:
```bash
npm install                    # Reinstall dependencies
ls cypress/config/env/        # Verify config files exist
```

**QATouch Integration Failures**:
- Verify API token in `qatouch.json`
- Ensure test run exists and is accessible
- Check network connectivity to QATouch API

**Duplicate Case Numbers**:
```bash
cd sprint_cleaner && npm run clean
```

**Missing Module Enums**:
- Check enum file paths in Sprint Cleaner config
- Verify enum exports and import statements

---

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [QATouch API Documentation](https://doc.qatouch.com/#section/QA-Touch-API)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

> 📝 **Note**: Always ensure sprint deployment is complete before creating test automation, and execute test runs manually at least once before implementing automation.