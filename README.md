# 🧪 Cypress Test Setup Guide

## 📦 Installation

1. **Install Cypress**  
   ```bash
   npm install --save-dev cypress
   ```

2. **(Optional) Install `ts-node`**  
   Required if you're using TypeScript.  
   ```bash
   npm install --save-dev ts-node
   ```

---

## ⚙️ Setup

1. **Update environment credentials**  
   Modify the necessary files inside:  
   ```
   /cypress/env/*
   ```

2. **Set your QATouch API token**  
   Edit the following file:  
   ```
   /cypress/qatouch.json
   ```

---

## 🚀 Running Tests

> Use `open` for the interactive GUI and `run` for headless execution.

### 1. 🔧 Local Testing

Supports three config values: `develop`, `live`, and `staging`.

```bash
npx cypress open --env configFile=develop
```

### 2. 🧪 Regression Testing (QATouch Integration)

> ✅ Only applicable if regression cases have been integrated into QATouch.  
> ⚠️ Currently, this is a placeholder and does not trigger any QATouch-specific actions.

```bash
npx cypress open --env configFile=live,testRunKey=<key>,testSuite=admin
```

### 3. 📈 Sprint Testing

You can run all sprints or a specific one:

```bash
# Run all sprint tests
npx cypress open --env configFile=develop,sprint=all

# Run a specific sprint (e.g., v25)
npx cypress open --env configFile=develop,sprint=v25
```