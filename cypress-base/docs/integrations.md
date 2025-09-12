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
| `/e2e/admin/**`     | `Admin`    | `Admin!D5`  |
| `/e2e/client/**`    | `Client`   | `Client!B3` |
| `/e2e/merchant/**`  | `Merchant` | `Merchant!A1` |

---

### Override Options
- **Cell Reference** → `{SheetName!Cell}` → explicit sheet + cell  
- **Cell Only** → `{Cell}` → uses default mapping  
- **Custom Sheet URL** → `[sheet:URL]` → override sheet entirely  

#### Example
```typescript
// Explicit sheet + cell
it("GCash Payment {Merchant!D8}", () => {
  expect(true).to.be.true; // Updates Merchant!D8
});

// Default (inherits Admin from /e2e/admin)
it("Currency Display {D9}", () => {
  expect(true).to.be.false; // Updates Admin!D9
});

// Override with custom sheet URL
it("Widget Loads {Deposit!D10} [sheet:https://docs.google.com/spreadsheets/d/CUSTOM_ID/]", () => {
  expect(true).to.be.true; // Posts to Deposit!D10 in override sheet
});
```

---

### Configuration
`cypress/config/regression-sheet.json`
```json
{
  "regression-sheet": "https://docs.google.com/spreadsheets/d/YOUR_DEFAULT_SHEET_ID/",
  "regression-test-pass": "✅",
  "regression-test-fail": "❌"
}
```

---

## 📋 QATouch Integration

### Purpose
- Syncs Cypress test results with **QATouch cases**  
- Supports **bulk updates** after test runs  
- Allows **custom status** + comments per test  

---

### Setup
1. Configure credentials in `qatouch.json`  
2. Create a test run in QATouch and copy its `testRunKey`  
3. Ensure project mapping exists (`projectKey-suiteName`)  

```json
// cypress/config/qatouch.json
{
  "apiToken": "your-api-token",
  "domain": "rhgc",
  "projectKey-admin": "2aMB",
  "projectKey-client": "9xKQ"
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
it("64 - [AdminModules.Dashboard] Dashboard loads correctly", () => {
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
it("72 - [ClientModules.Profile] Update user profile", () => {
  cy.setQATouchStatus("RETEST");
  cy.setQATouchComment("Waiting for backend API fix");
});
```

**Available Status Options**:  
`PASSED`, `FAILED`, `BLOCKED`, `RETEST`, `UNTESTED`, `NOT_APPLICABLE`, `IN_PROGRESS`, `HOLD`

---

## 🐞 Troubleshooting

| Issue                     | Fix |
| -------------------------- | --- |
| "Invalid test run key"     | Verify QATouch run exists |
| "Case number not found"    | Check test prefix matches QATouch case ID |
| "Project key mismatch"     | Verify `projectKey-{suite}` in `qatouch.json` |
| "Invalid Google Sheet link"| Verify URL format + permissions |
| Cell not updating          | Ensure valid reference `{Sheet!Cell}` or `{Cell}` |

---

*Use this guide with both [Sprint Development](./sprint.md) and [Regression Guide](./regression.md).*  
*Last updated: September 2025*