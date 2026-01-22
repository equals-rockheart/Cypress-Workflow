# 🔗 Integrations Guide

This document explains how to integrate **Google Sheets** and **QATouch** with Cypress tests for tracking results, test runs, and case mapping.

---

## 📊 Google Sheets Integration

### Purpose
- Syncs test results directly to a Google Sheet  
- Supports both **default suite-based mapping** and **custom sheet overrides**  
- Works with both **regression** and **sprint-loaded tests**

---

### Default Mapping
Sheet names are derived from **test suite directories**:

| Test Directory      | Sheet Name | Example     |
| ------------------- | ---------- | ----------- |
| `/e2e/admin/**`     | `Admin`    | `Admin!5`   |
| `/e2e/client/**`    | `Client`   | `Client!3`  |
| `/e2e/merchant/**`  | `Merchant` | `Merchant!1`|

### Column Mapping
Results and error messages are written to configured columns from config:

| Column | Purpose | Values |
| ------ | ------- | ------ |
| `results-column` | Test status | ✅ / ❌ |
| `remarks-column` | Error messages | Error details (on failure) |

---

### Override Options
- **Reference** → `{SheetName!Row}` → explicit sheet + row
- **Row Only** → `{Row}` → uses default mapping
- **Custom Sheet URL** → `[sheet:URL]` → override sheet entirely

#### Example
```typescript
// Explicit sheet + row
it("GCash Payment {Merchant!8}", () => {
  expect(true).to.be.true; // Updates at Merchant sheet at row 8 (status & error message)
});

// Default (inherits Admin from /e2e/admin)
it("Currency Display {9}", () => {
  expect(true).to.be.false; // Updates Admin sheet at row 9 (status & error message)
});

// Override with custom sheet URL
it("Widget Loads {Deposit!10} [sheet:https://docs.google.com/spreadsheets/d/CUSTOM_ID/]", () => {
  expect(true).to.be.true; // Posts to Deposit sheet in override sheetURL
});

// Custom sheet override for all tests in this block
// (except it-blocks with custom sheet URL)
describe("Dashboard [sheet:https://docs.google.com/spreadsheets/d/CUSTOM_ID/]", () => {});

// Block result: passes only if all tests inside pass, otherwise marked failed
describe("Dashboard {Home!9}", () => {});
```

---

### Configuration
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

---

## 📋 QATouch Integration

### Purpose
- Syncs Cypress test results with **QATouch cases**  
- Supports **bulk updates** after test runs  
- Allows **custom status** + **custom comments** per test  

---

### Setup
1. Configure credentials in `qatouch.json`  
2. Create a test run in QATouch and copy its `testRunKey`  
3. Ensure project mapping exists (`projectKey-{Suite}`)  
4. **(Optional)** Add (`regression-{Suite}-testRunKey`) for regression auto-hooks

```json
// cypress/config/qatouch.json
{
  "apiToken": "your-api-token",
  "domain": "rhgc",
  "projectKey-admin": "2aMB",
  "projectKey-client": "9xKQ"
  "regression-admin-testRunKey": "REGRESSION_KEY"
  "regression-client-testRunKey": "REGRESSION_KEY"
}
```

---

### Case Number Mapping
Every test must begin with its **QATouch case number**:

| QATouch ID | Cypress Format |
| ---------- | -------------- |
| `TR00064`  | `64`           |
| `TR00068`  | `68`           |
| `TR00072`  | `72`           |

```typescript
it("64 - [AdminModule.Dashboard] Dashboard loads correctly", () => {
  expect(true).to.be.true;
});
```

---

### Required Hook
Each suite must define its **test run key** and bulk-update hook:

```typescript
describe("Admin", () => {
  const ADMIN_testRunKey = "TR_ABC123"; // From QATouch run URL

  after(() => {
    cy.bulkUpdateQATouch({
      comments: `Cypress Automation - env: ${Cypress.env("env")}`,
      projectKey: Cypress.env("projectKey-admin"),
      testRunKey: ADMIN_testRunKey
    });
  });
});
```

---

### Custom Status & Comments
```typescript
it("72 - [ClientModule.Profile] Update user profile", () => {
  cy.setQATouchStatus(QATouchStatus.BLOCKED);
  cy.setQATouchComment("Waiting for backend API fix");
});
```

**Available Status Options**:  
`PASSED`, `FAILED`, `BLOCKED`, `RETEST`, `UNTESTED`, `NOT_APPLICABLE`, `IN_PROGRESS`, `HOLD`

---

## 🚫 Disabling Integrations
```bash
# Supported values: qatouch, gsheets, all
npx cypress open --env configFile=develop,regression=true,disable=qatouch
npx cypress open --env configFile=develop,sprint=all,disable=gsheets

# Disable all integrations (useful for local/dev runs)
npx cypress open --env configFile=develop,disable=all
```

## 🐞 Troubleshooting

| Issue | Fix |
|-------|-----|
| Webpack Compilation<br>Module not found: Error : Can't resolve '../../../cypress/e2e/sprint' | Create sprint folder in /cypress/e2e/ directory |
| Requested entity not found | Verify URL value and format |
| The caller does not have permission | Verify service account have permission |
| Unable to parse range | Verify sheet name and range is correct |
| Cell not updating | Ensure valid reference `{Sheet!Cell}` or `{Cell}` |
| Invalid test run key | Verify QATouch run exists |
| Case number not found | Check test prefix matches QATouch case ID |
| Project key mismatch | Verify `projectKey-{suite}` in `qatouch.json` |

---

*Use this guide with both [Sprint Development](./sprint.md) and [Regression Guide](./regression.md).*

*Last updated: January 2026*