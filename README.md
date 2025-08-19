# 🧪 Cypress Test Setup Guide

A comprehensive guide for setting up and running Cypress tests with QATouch integration for TypeScript projects.

---

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [Configuration](#%EF%B8%8F-configuration) 
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
- QATouch account (for regression testing)

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
Update configuration files in `/cypress/config/env/`:
- `develop.json` - Development environment
- `staging.json` - Staging environment  
- `live.json` - Production environment

### 2. QATouch Integration
Edit `/cypress/qatouch.json` with your API credentials:
```json
{
  "apiToken": "your-qatouch-api-token",
  "projectId": "your-project-id"
}
```

### 3. Environment Variables
Ensure all paths and variables match your specific setup requirements.

---

## 🚀 Running Tests

### Interactive Mode (GUI)
Use `open` for the Cypress Test Runner interface:

#### Local Development
```bash
# Development environment
npx cypress open --env configFile=develop

# Staging environment  
npx cypress open --env configFile=staging

# Production environment
npx cypress open --env configFile=live
```

### Headless Mode
Use `run` for CI/CD or automated execution:

#### Regression Testing
```bash
npx cypress run --env configFile=live,testRunKey=<qatouch-key>,testSuite=admin
```

#### Sprint Testing
```bash
# All sprint tests
npx cypress run --env configFile=develop,sprint=all

# Specific sprint
npx cypress run --env configFile=develop,sprint=v25
```

---

## 🏃‍♂️ Sprint Development

### Sprint File Structure
Base your sprint tests on `/cypress/e2e/Sprint/base.cy.ts`.

#### Required Structure
Each sprint file **must** contain exactly these three describe blocks:

```typescript
describe("Admin Side", () => {
  // Admin-related test cases
});

describe("Client Side", () => {
  // Client-facing test cases  
});

describe("API Side", () => {
  // API endpoint tests
});
```

> ⚠️ **Critical**: Do not rename these describe blocks - system components depend on these exact names.

### Test Case Format

#### Naming Convention
```
CaseNumber - [Module Name] Test Case Title
```

#### Rules
- **Case Number**: Numeric only (e.g., `TR0034` → `34`)
- **Module Name**: Use predefined enums (e.g., `${ClientModules.Dashboard}`)
- **Title**: Descriptive and specific

#### Example Implementation
```typescript
it(`382 - [${ClientModules.Dashboard}] Select GCash Solution Deposit Card`, () => {
  // Test implementation here
  cy.visit('/dashboard');
  cy.get('[data-testid="gcash-deposit"]').click();
  cy.url().should('include', '/deposit/gcash');
});
```

### Development Workflow

#### 1. Create Test Structure First
```typescript
// Create all it blocks with empty bodies initially
it(`123 - [${AdminModules.UserManagement}] Create New User`, () => {
  // TODO: Implement test logic
});

it(`124 - [${AdminModules.UserManagement}] Edit User Details`, () => {
  // TODO: Implement test logic  
});
```

#### 2. Run Sprint Cleaner
Before implementing test logic, run the Sprint Cleaner to detect duplicate case numbers.

#### 3. Implement Test Logic
Fill in the test implementations after ensuring no duplicates exist.

### QATouch Test Run Setup

#### Finding Your Test Run Key
1. **From URL**: Copy the key from the QATouch URL
   ```
   https://rhgc.qatouch.com/v2#/testrun/p/1p8b/tid/JG3KB
                                                    ^^^^^
   Test Run Key: JG3KB
   ```

2. **From Config**: Click **Config** in QATouch interface
   ```json
   {
     "testRunId": "JG3KB"
   }
   ```

---

## 🔗 QATouch Integration

### Custom Test Status
Override default pass/fail status:
```typescript
import { QATouchStatus } from '../support/constants/qatouchStatus';

it('Test case that needs custom status', () => {
  // Test logic here
  cy.setQATouchStatus(QATouchStatus.BLOCKED);
});
```

### Custom Comments
Add context to test results:
```typescript
it('Test case with additional context', () => {
  // Test logic here
  cy.setQATouchComment('Database connection timeout - needs investigation');
});
```

### Available Status Options
- `PASSED`
- `FAILED` 
- `BLOCKED`
- `NOT_EXECUTED`
- `RETEST`

---

## 🧹 Sprint Cleaner Tool

### Purpose
Detects and handles duplicate test case numbers across sprint files.

### Setup
```bash
# Navigate to sprint cleaner directory
cd /sprint_cleaner/

# Install dependencies
npm install
```

### Configuration
Update `package.json` if paths have changed:
```json
{
  "config": {
    "enumPaths": {
      "admin": "../cypress/support/constants/adminModules.ts",
      "client": "../cypress/support/constants/clientModules.ts", 
      "api": "../cypress/support/constants/apiModules.ts"
    },
    "sprintDir": "../cypress/e2e/tests/Sprint"
  }
}
```

### Usage
```bash
# Using npm script (recommended)
npm run clean

# With custom directory
npx ts-node index.ts --dir "custom-sprint-directory"
```

### Duplicate Handling Options
- **delete**: Removes duplicate test cases entirely
- **skip**: Adds `.skip` to duplicate test blocks 
- **leave**: No changes made (report only)

---

## 💡 Best Practices

### Development
- ✅ Create empty `it` blocks first, then run Sprint Cleaner
- ✅ Use development config during test creation (no `sprint` env var)
- ✅ Test manually before automation
- ❌ Don't create automation before sprint deployment

### Test Organization
- Group related tests within appropriate side (Admin/Client/API)
- Use descriptive test titles
- Keep test cases atomic and independent
- Follow consistent naming patterns

### QATouch Integration  
- Set up test runs manually before automation
- Use custom status and comments for better reporting
- Keep API tokens secure and environment-specific

---

## 🔧 Troubleshooting

### Common Issues

#### Tests Not Running
```bash
# Check if dependencies are installed
npm install

# Verify config file exists
ls cypress/config/env/
```

#### QATouch Integration Failures
- Verify API token in `qatouch.json`
- Ensure test run exists and is accessible
- Check network connectivity to QATouch API

#### Duplicate Case Number Errors
```bash
# Run Sprint Cleaner to identify and fix duplicates
cd sprint_cleaner && npm run clean
```

### Environment-Specific Issues

#### Development Environment
```bash
npx cypress open --env configFile=develop
```

#### Missing Module Enums
- Check enum file paths in Sprint Cleaner config
- Verify enum exports are correct
- Update import statements if needed

---

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [QATouch API Documentation](https://doc.qatouch.com/#section/QA-Touch-API)
- [TypeScript Best Practices](https://typescript-eslint.io/docs/)

---

> 📝 **Note**: Always ensure sprint deployment is complete before creating test automation, and execute test runs manually at least once before implementing automation.