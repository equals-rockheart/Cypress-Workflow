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
| **Test Run Key**    | 🟡 Optional → links to QATouch test run                     |


### Example Regression Tests
```ts
// Describe with cell reference (updates Admin!D5)
describe("Dashboard Elements {D5}", () => {
    
    // Explicit sheet override (updates Merchant!D8)
    it("GCash Solution Card Visibility {Merchant!D8}", () => {
        cy.log("✅ This test will PASS and update Merchant!D8");
        expect(true).to.be.true;
    });

    // Default mapping (updates Admin!D9 since spec is in /e2e/admin/)
    it("Currency Display Validation {D9}", () => {
        cy.log("❌ This test will FAIL and update Admin!D9");
        expect(true).to.be.false;
    });
});
```
---

## 📝 Sheet Mapping Configuration

### Default Mapping
By default, **sheet names are mapped based on test suite location**:

| Test Directory      | Sheet Name | Example |
|--------------------|------------|---------|
| `/e2e/admin/**`    | `Admin`    | `Admin!D5` |
| `/e2e/client/**`   | `Client`   | `Client!B3` |
| `/e2e/merchant/**` | `Merchant` | `Merchant!A1` |

### Override Options
- **Cell Reference** → `{SheetName!Cell}` → explicit sheet + cell  
- **Cell Only** → `{Cell}` → uses default suite mapping  
- **Custom Sheet URL** → `[sheet:URL]` → override sheet entirely  

---

## 🚀 Sprint Test Loading

**Purpose**: Loads sprint tests from `/e2e/sprint/**.cy.ts` and matches tests based on suite + module.

```typescript
import { loadSprintTests } from "@integrations/sprintLoader";
import { AdminModules } from "@modules/adminModules";

describe("Sprint Tests", () => {
    loadSprintTests({
        testSuite: "Admin",                // Match describe blocks containing "admin"
        module: AdminModules.Dashboard     // Match it blocks with Dashboard module
    });
});
```

### Inheritance Behavior

**Default**: Sprint files inherit sheet mapping from loading suite location
- `e2e/admin/**` → `Admin!` sheet
- `e2e/client/**` → `Client!` sheet

### Override Options

**Describe-Level Custom Sheet**: 
```typescript
describe("Sprint Tests [sheet:https://docs.google.com/spreadsheets/d/CUSTOM_ID/]", () => {
    loadSprintTests({
        testSuite: "Client",
        module: "Transactions"
    });
    // All loaded sprint tests post to custom sheet
});
```

**Test-Level Sheet/Cell Reference**:
```typescript
// In sprint file - overrides both suite location and custom sheet URL
it("53 - [Merchant.Checkout] Widget Loads {Merchant!D8}", () => {
    expect(true).to.be.true; // Posts to Merchant!D8
});

it("17 - [Merchant.Checkout] GCash Payment {Deposit!D10} [sheet:https://docs.google.com/spreadsheets/d/OVERRIDE_ID/]", () => {
    expect(true).to.be.true; // Posts to override sheet at Deposit!D10
});
```

---



## 🔗 QATouch Integration (Optional)

Enable QATouch updates alongside Google Sheets for dual tracking.

### Setup Requirements

1. **API Credentials**: Configure `qatouch.json`  
2. **Test Run**: Create test run in QATouch and copy `testRunKey`  
3. **Project Mapping**: Ensure `projectKey-{suiteName}` exists  

### Test Case Format

**Case Number Prefix**: Every test must start with QATouch Case Number

```ts
it("17 - User can log in", () => { ... });
it("23 - Should display history", () => { ... });
```
> ⚠️ Without the **Case Number prefix**, results **will not sync to QATouch**.

### Required Hook

Include this hook inside the `describe` block 

```ts
const ADMIN_testRunKey = "TR_ABC123"; // From QATouch run URL

after(() => {
    cy.bulkUpdateQATouch({
        comments: `Cypress Automation - env: ${Cypress.env("env")}`,
        projectKey: Cypress.env("projectKey-admin"),
        testRunKey: ADMIN_testRunKey
    });
});
```

---

## 📂 Custom Sheet URL Examples

### Test-Level Override
```typescript
describe("Payment Flow Tests {D15}", () => {
    
    // Custom sheet for specific test
    it("Gcash Payment Processing {D13} [sheet:https://docs.google.com/spreadsheets/d/CUSTOM_SHEET_ID/]", () => {
        cy.log("Updates custom sheet at D13");
        expect(true).to.be.true;
    });
    
    // Default sheet mapping
    it("Withdrawal Process {D14}", () => {
        cy.log("Updates default sheet based on suite location");
        expect(true).to.be.true;
    });
});
```

### Describe-Level Override
```typescript
describe("Dashboard Other Tests {D15} [sheet:https://docs.google.com/spreadsheets/d/1XYZ456_ANOTHER_SAMPLE_ID/]", () => {

    //Inherits custom sheet URL from describe block
    it("31 - Dashboard Other Test 1 {D16}", () => {
        expect(true).to.be.true;
    });

    // Overrides custom sheet URL from describe block
    it("32 - Dashboard Other Test 2 {D17} [sheet:https://docs.google.com/spreadsheets/d/1OVERRIDE_SHEET_ID/]", () => {
        expect(true).to.be.true;
    });
});
```
---

## ⚙️ Configuration Files Reference

### Google Sheets Integration
`cypress/config/regression-sheet.json`
```json
{
  "regression-sheet": "https://docs.google.com/spreadsheets/d/YOUR_DEFAULT_SHEET_ID/",
  "regression-test-pass": "✅",
  "regression-test-fail": "❌"
}
```

### QATouch Integration
`cypress/config/qatouch.json`
```json
{
  "apiToken": "your-api-token",
  "domain": "rhgc",
  "projectKey-suiteName": "2aMB"
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
`cypress/support/modules/adminModules.ts`
```typescript
export enum AdminModules {
  Dashboard = "Dashboard",
  AccountDetails_General = "Account Details - General",
  AccountDetails_Balances = "Account Details - Balances",
  AccountDetails_Transactions = "Account Details - Transactions"
}
```

---

## 🐞 Troubleshooting

| Issue                              | Fix |
|-----------------------------------|-----|
| "Invalid Google Sheet link"       | Verify URL format + permissions |
| "No sheet URL provided"           | Check `regression-sheet.json` |
| Cell not updating                 | Ensure valid reference (A1, B2, …) |
| Wrong sheet selected              | Check directory-to-sheet mapping |
| QATouch sync failing | Check case number prefix and `testRunKey` validity |
| Sprint tests not loading | Verify module enum usage and suite name matching |

---

## 🧪 Testing the Integration

1. **Run regression tests**:  
    ```bash
    npx cypress open --env configFile=develop,regression=true
    ```
2. **Verify Google Sheets updates** with pass/fail markers  
3. **Check QATouch test run** (if configured) for synced results  
4. **Validate sprint loading** by checking loaded test cases in output

---

*For sprint-focused testing, see the [Sprint Development guide](./sprint.md).*

*Last updated: September 2025*