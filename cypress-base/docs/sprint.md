# 🏃‍♂️ Sprint Development Guide

This document demonstrates how to write sprint tests with automated **QATouch integration** for cross-suite testing and result tracking.

---

## ✨ Features
- ✅ Automatic **QATouch updates** based on test results  
- ✅ **Cross-suite testing** inside a single sprint file  
- ✅ **Duplicate detection** with Sprint Cleaner tool  
- ✅ **Module-based organization** for regression test loading  

---

## 📑 Test Structure Requirements

| Requirement      | Purpose |
|------------------|---------|
| **Case Number**  | ✅ Required → syncs with QATouch |
| **Module Enum**  | ✅ Required → enables regression mapping |
| **Test Run Key** | ✅ Required → links to QATouch test run |



### Example Sprint Tests
```typescript
import { AdminModules } from "@support/modules/adminModules";
import { ClientModules } from "@support/modules/clientModules";

describe("Admin", () => {
    const ADMIN_testRunKey = "JG3KB"; // From QATouch Test Run URL

    after(() => {
        cy.bulkUpdateQATouch({
            comments: `Sprint 25 Automation - env: ${Cypress.env("env")}`,
            projectKey: Cypress.env("projectKey-admin"),
            testRunKey: ADMIN_testRunKey
        });
    });

    it(`64 - [${AdminModules.AccountDetails_Transactions}] Transactions Export Button is Visible`, () => {
        expect(true).to.be.true;
    });

    it(`65 - [${AdminModules.Dashboard}] Dashboard shows the correct currency`, () => {
        expect(true).to.be.true;
    });
});

describe("Client", () => {
    const CLIENT_testRunKey = "ABC123";

    after(() => {
        cy.bulkUpdateQATouch({
            comments: `Sprint 25 Automation - env: ${Cypress.env("env")}`,
            projectKey: Cypress.env("projectKey-client"),
            testRunKey: CLIENT_testRunKey
        });
    });

    it(`68 - [${ClientModules.AccountDetails_General}] Verify General Elements`, () => {
        cy.setQATouchStatus("BLOCKED");
        cy.setQATouchComment("Database timeout – investigating");
    });
});

// other test suites
```

---

## 📂 File Organization

### Naming Convention
| Sprint Number | File Name   |
|---------------|-------------|
| Sprint 25     | `v25.cy.ts` |
| Sprint 26     | `v26.cy.ts` |
| Sprint 27     | `v27.cy.ts` |

### Location & Template
- **Directory**: `/cypress/e2e/sprint/`  
- **Template**: `/cypress-base/examples/base-sprint.ts`  

### Suite Mapping
- `describe("Admin", ...)` → `projectKey-admin`  
- `describe("Client", ...)` → `projectKey-client`  
- `describe("API", ...)` → `projectKey-api`  

---

## 🔗 QATouch Integration

### Test Run Setup
Each suite requires its own **test run key** from QATouch.

```typescript
describe("Admin", () => {
    const ADMIN_testRunKey = "JG3KB"; // From QATouch run URL

    after(() => {
        cy.bulkUpdateQATouch({
            comments: `Sprint 25 Automation - env: ${Cypress.env("env")}`,
            projectKey: Cypress.env("projectKey-admin"),
            testRunKey: ADMIN_testRunKey
        });
    });
});
```

### Case Number Mapping
| QATouch ID | Cypress Format |
|------------|----------------|
| `TR00064`  | `64`           |
| `TR00068`  | `68`           |
| `TR00072`  | `72`           |

### Custom Status & Comments
```typescript
it(`72 - [${ClientModules.Profile}] Update user profile`, () => {
    cy.setQATouchStatus("RETEST");
    cy.setQATouchComment("Waiting for backend API fix");
});
```

**Available Status Options**:  
`PASSED`, `FAILED`, `BLOCKED`, `RETEST`, `UNTESTED`, `NOT_APPLICABLE`, `IN_PROGRESS`, `HOLD`

---

## 📋 Module Enum Reference

### Purpose
Module enums provide consistency and allow regression test loading.

### Example Enums
```typescript
// cypress/support/modules/adminModules.ts
export enum AdminModules {
  Dashboard = "Dashboard",
  AccountDetails_General = "Account Details - General",
  AccountDetails_Balances = "Account Details - Balances",
  AccountDetails_Transactions = "Account Details - Transactions"
}

// cypress/support/modules/clientModules.ts
export enum ClientModules {
  Dashboard = "Dashboard",
  Transactions = "Transactions",
  TopUp = "TopUp"
}
```

---

## 🔄 Development Workflow

1. **Structure Tests**  
   Create all test shells with proper case numbers + module enums.
   ```ts
   describe("Admin", () ={
        it(`17 - [${AdminModules.Dashboard}] Test Title`, () => {});
        it(`23 - [${AdminModules.Transactions}] Test Title`, () => {});
        it(`114 - [${AdminModules.Vaults}] Test Title`, () => {});
        // Other test cases
   })
   // Other Test Suite
   ```
2. **Run Sprint Cleaner**  
   Detect duplicates across sprint files.  
   ```bash
   cd sprint-cleaner
   npm install
   npm run clean
   ```
3. **Implement Tests**  
   Add test logic once validation passes.  

---

## 🧹 Sprint Cleaner Tool

### Purpose
Detects and resolves **duplicate case numbers** across sprint files.

### Usage
```bash
cd sprint-cleaner
npm run clean
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

### Options
- `delete` → Remove duplicate tests  
- `skip` → Mark duplicate as `.skip`  
- `leave` → Report only  

---

## 🚀 Running Sprint Tests

### Development Mode
```bash
npx cypress open --env configFile=develop
```

### Headless Runs
```bash
# Run all sprint tests
npx cypress run --env configFile=develop,sprint=all

# Run specific sprint
npx cypress run --env configFile=develop,sprint=v25
```

### 🚫 Disabling Integrations
Supported: `qatouch` | `gsheets` | `all`
```bash
# Disable all integrations (local/dev runs)
npx cypress open --env configFile=develop,disable=all

# Disable QATouch only
npx cypress run --env configFile=develop,sprint=v25,disable=qatouch

# Disable Google Sheets only
npx cypress run --env configFile=develop,sprint=all,disable=gsheets
```

---

## 🔄 Next Sprint Preparation

1. Copy template from `cypress-base/examples/base-sprint.ts`  
2. Update suite name + sprint number
3. Replace case numbers with new sprint cases  
4. Create new test run per Project/Test Suite
5. Add new **QATouch test run keys**  
6. Run Sprint Cleaner before implementing  

---

## 🐞 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Invalid test run key" | Verify QATouch test run exists |
| "Case number not found" | Check case number matches QATouch |
| "Project key mismatch" | Verify `projectKey-{suite}` in `qatouch.json` |
| Duplicate case numbers | Run Sprint Cleaner |
| Enum errors | Check module imports & paths |
| QATouch sync failing | Verify API token and permissions |

---

## 💡 Best Practices

### Test Writing
- ✅ Create empty shells before implementation  
- ✅ Use **case number + module enum** consistently  
- ✅ Keep tests atomic & independent  
- ❌ Don’t automate features still in development  

### Code Quality
- ✅ Import enums instead of raw strings  
- ✅ Add comments for TODO / custom statuses  
- ✅ Keep describe blocks flat (avoid nesting)  

---

*For regression testing with Google Sheets integration, see the [Regression Guide](./sprint.md).*

*Last updated: September 2025*