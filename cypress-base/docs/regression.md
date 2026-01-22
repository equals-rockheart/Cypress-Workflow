# 📘 Regression Guide

This document demonstrates how to write regression tests with automated **Google Sheets** and **QATouch** integration for test result tracking.

---

## ✨ Features
- ✅ Automatic **Google Sheets updates** based on test results  
- ✅ **QATouch** test case mapping and bulk updates (Optional) 
- ✅ Flexible **sheet mapping** (default or custom URLs)  
- ✅ Dynamic **sprint test loading** from external files  

---

## 📑 Test Structure Requirements

| Requirement         | Purpose                                                      |
| ------------------- | ----------------------------------------------------         |
| **Case Number**     | 🟡 Optional → syncs with QATouch                            |
| **Sheet Reference** | ✅ Required → syncs with Google Sheets updates              |
| **Module Enum**     | ❌ Prohibited → module is already implied by spec file name |

### Example Regression Tests
```ts
// Describe with cell reference (updates Admin sheet at row 5)
// Block result: passes only if all tests inside pass, otherwise marked failed
describe("Dashboard Elements {5}", () => {
    
    // Explicit sheet override (updates Client sheet at row 8)
    it("45 - GCash Solution Card Visibility {Client!8}", () => {
        cy.log("✅ This test will PASS and update and QATouch Case 45");
        expect(true).to.be.true;
    });

    // Default mapping (updates Admin sheet at row 9 since spec is in /e2e/admin/)
    it("Currency Display Validation {9}", () => {
        cy.log("❌ This test will FAIL and update Admin sheet at row 9 (status & error message)");
        expect(true).to.be.false;
    });
});
```

---

## 📝 Mapping

### Sheet Name Mapping
By default, **sheet names are mapped based on test suite location**:

| Test Directory   | Sheet Name | Example    |
|------------------|------------|------------|
| `/e2e/admin/**`  | `Admin`    | `Admin!5`  |
| `/e2e/client/**` | `Client`   | `Client!3` |
| `/e2e/user/**`   | `User`     | `User!1`   |

### Column Mapping
Results and error messages are written to configured columns from config:

| Column | Purpose | Values |
| ------ | ------- | ------ |
| `results-column` | Test status | ✅ / ❌ |
| `remarks-column` | Error messages | Error details (on failure) |

### Override Options
- **Reference** → `{SheetName!Row}` → explicit sheet + row
- **Row Only** → `{Row}` → uses default mapping
- **Custom Sheet URL** → `[sheet:URL]` → override sheet entirely

---

## 📂 Custom Sheet URL Examples

### Test-Level Override
```typescript
// Uses default sheetURL (from config)
// Passes only if all tests inside pass, otherwise marked failed
describe("Payment Flow Tests {15}", () => {

    // Custom sheet for specific test
    it("Gcash Payment Processing {13} [sheet:https://docs.google.com/spreadsheets/d/CUSTOM_SHEET_ID/]", () => {
        cy.log("Updates to custom sheetURL");
        expect(true).to.be.true;
    });

    // Default sheetURL mapping
    it("Withdrawal Process {14}", () => {
        cy.log("Updates to default sheetURL (from config) and update sheet based on suite location");
        expect(true).to.be.true;
    });
});
```

### Describe-Level Override
```typescript
describe("Dashboard Other Tests {15} [sheet:https://docs.google.com/spreadsheets/d/1XYZ456_ANOTHER_SAMPLE_ID/]", () => {

    //Inherits custom sheetURL from describe block
    it("31 - Dashboard Other Test 1 {16}", () => {
        expect(true).to.be.true;
    });

    // Overrides custom sheetURL from describe block
    it("32 - Dashboard Other Test 2 {17} [sheet:https://docs.google.com/spreadsheets/d/1OVERRIDE_SHEET_ID/]", () => {
        expect(true).to.be.true;
    });
});
```

---

## 🧩 Sprint Test Loading

**Purpose**: Loads sprint tests from `/e2e/sprint/**.cy.ts` and matches tests based on suite + module.

```typescript
import { loadSprintTests } from "@integrations/sprintLoader";
import { AdminModule } from "@modules/adminModule";

describe("Sprint Tests", () => {
    loadSprintTests({
        testSuite: "Admin",                // Match describe blocks containing "admin"
        module: AdminModule.Dashboard     // Match it blocks with Dashboard module
    });
});
```
> ℹ️ Add `-skip` in describe title to skip **QATouch** update for *loaded sprint tests*

### Inheritance Behavior

**Default**: Sprint files inherit sheet mapping from loading suite location
- `e2e/admin/**` → `Admin!` sheet
- `e2e/client/**` → `Client!` sheet

### Override Options

**Describe-Level Custom Sheet**: 
```typescript
describe("Sprint Tests [sheet:https://docs.google.com/spreadsheets/d/CUSTOM_ID/]", () => {
    loadSprintTests({
        testSuite: "Admin",
        module: AdminModule.Transactions
    });
    // All loaded sprint tests post to custom sheet
});
```

**Test-Level Sheet/Cell Reference**:
```typescript
// In sprint file - overrides both suite location and custom sheet URL
it(`53 - [${User.Checkout}] Widget Loads {User!8}`, () => {
    expect(true).to.be.true; // Posts to User sheet at row 8 even if spec is located
});

it(`17 - [${User.Checkout}] GCash Payment {Deposit!10} [sheet:https://docs.google.com/spreadsheets/d/OVERRIDE_ID/]`, () => {
    expect(true).to.be.true; // Posts to override sheetURL at Deposit sheet at row 10
});
```

---

## 🔗 QATouch Integration (Optional)

Enable QATouch updates alongside Google Sheets for dual tracking.

### Setup Requirements

1. **API Credentials**: Configure `qatouch.json`  
2. **Test Run**: Create test run in QATouch and copy `testRunKey`  
3. **Project Mapping**: Ensure `projectKey-{suiteName}` exists
4. **Regression Mapping**: Add `regression-{suiteName}-testRunKey`

### Test Case Format

**Case Number Prefix**: Every test must start with QATouch Case Number

```ts
it("17 - User can log in", () => { ... });
it("23 - Should display history", () => { ... });
```
> ⚠️ Without the **Case Number prefix**, results **will not sync to QATouch**.

### Requirement

Update `qatouch.json` with **suite-specific** `testRunKey` (**auto-resolved based on suite location**).

```json
{
    ...,
    "regression-admin-testRunKey": "REGRESSION_ADMIN_TESTRUN_KEY",
    "regression-client-testRunKey": "REGRESSION_CLIENT_TESTRUN_KEY",
}
```

---

## ⚙️ Configuration Files Reference

### Google Sheets Integration
`cypress/config/regression.json`
```json
{
  "ignore": [
    "cypress/e2e/ignore-folder",
    "cypress/e2e/during-regression"
  ],
  "regression-sheet": "https://docs.google.com/spreadsheets/d/YOUR_DEFAULT_SHEET_ID/",
  "regression-test-pass": "✅",
  "regression-test-fail": "❌",
  "results-column": "D",
  "remarks-column": "G"
}
```
> **ignore**: List of folders excluded when running with `regression=true`; `cypress/e2e/sprint` is ignored by default.

### QATouch Integration
`cypress/config/qatouch.json`
```json
{
  "apiToken": "your-api-token",
  "domain": "rhgc",
  "projectKey-suite": "2aMB",
  "regression-suite-testRunKey": "regression-suite-key"
}
```

### Environment Config
  `cypress/qatouch.json`
```json
{
  "env": "develop",
  "baseURL": "https://dev.yourapp.com"
}
```

### Support Modules
`cypress/support/modules/adminModule.ts`
```typescript
export enum AdminModule {
  Dashboard = "Dashboard",
  AccountDetails_General = "Account Details - General",
  AccountDetails_Balances = "Account Details - Balances",
  AccountDetails_Transactions = "Account Details - Transactions"
}
```

---

## 🚀 Running Regression Tests

### Development Mode
```bash
npx cypress open --env configFile=develop
```

### Headless Runs
```bash
# Run all regression tests
npx cypress run --env configFile=develop,regression=true

# Run against live
npx cypress run --env configFile=live,regression=true
```

### 🚫 Disabling Integrations
Supported: `qatouch` | `gsheets` | `all`
```bash
# Disable all integrations (local/dev runs)
npx cypress open --env configFile=develop,disable=all

# Disable QATouch only
npx cypress run --env configFile=develop,regression=true,disable=qatouch

# Disable Google Sheets only
npx cypress run --env configFile=develop,regression=true,disable=gsheets
```

---

## 🐞 Troubleshooting

| Issue | Fix |
|-------|-----|
| Webpack Compilation<br>Module not found: Error : Can't resolve '../../../cypress/e2e/sprint' | Create sprint folder in /cypress/e2e/ directory |
| Requested entity not found | Verify URL value and format |
| The caller does not have permission | Verify service account have permission |
| Unable to parse range | Verify sheet name and range is correct |
| results-column not found in /cypress/config/regression.json | Add `results-column` to config file |
| Google Sheet URL not found for the following tests | Add `[sheet:URL]` tag to test or describe block or check config file |
| invalid row number | Ensure cell reference uses valid number format `{3}` or `{Sheet!3}` |
| Cell not updating | Ensure correct sheet and integration is not disabled |
| Wrong sheet selected | Check directory-to-sheet mapping or use explicit `{SheetName!3}` |
| Error messages not appearing | Verify `remarks-column` is configured in regression.json |
| QATouch sync failing | Check case number prefix and `testRunKey` |
| Sprint tests not loading | Verify module enum usage and suite name matching |

---

*For sprint-focused testing, see the [Sprint Development guide](./sprint.md).*

*Last updated: January 2026*