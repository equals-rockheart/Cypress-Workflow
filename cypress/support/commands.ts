 /// <reference types="cypress" />

import { loginPage } from "../e2e/pages/LoginPage";

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit(Cypress.env('baseURL'));
    loginPage.login(email, password);
    // These commands will only run once per session
    cy.url().should('not.include', '/login');
  });
});

//#region QA Touch

// Utility function to validate and prepare QATouch request
function validateQATouchConfig(projectKey: string, testRunKey: string) {
  if (!projectKey) {
    cy.log('Missing projectKey, skipping QATouch update');
    return false;
  }

  if (!projectKey || !testRunKey) {
    cy.log('Missing testRunKey, skipping QATouch update');
    return false;
  }

  const apiToken = Cypress.env('apiToken');
  const domain = Cypress.env('domain');

  if (!apiToken || !domain) {
    cy.log('Missing apiToken or domain, skipping QATouch update');
    return false;
  }

  return { apiToken, domain };
}

// Utility function to make QATouch API request
function makeQATouchRequest(
  projectKey: string,
  testRunKey: string,
  resultObject: Record<string, TestResult>,
  comments: string
) {
  const config = validateQATouchConfig(projectKey, testRunKey);
  if (!config) return;

  const { apiToken, domain } = config;
  const url = `https://api.qatouch.com/api/v1/testRunResults/status/multiple?`;

  cy.request({
    method: 'POST',
    url: url,
    qs: {
      project: projectKey,
      test_run: testRunKey,
      result: JSON.stringify(resultObject),
      comments: comments
    },
    headers: {
      'api-token': apiToken,
      'domain': domain,
      'Content-Type': 'application/json'
    },
    body: '',
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 && response.body.success) {
      const testCount = Object.keys(resultObject).length;
      cy.log(`✅ QATouch updated successfully: ${testCount} test case(s)`);
    } else {
      const errorMsg = response.body?.error_msg || response.body || 'Unknown error';
      cy.log(`❌ QATouch update failed: ${response.status} - ${errorMsg}`);
    }
  });
}

// Update single test case
Cypress.Commands.add('updateQATouchTestCase', (options: QATouchUpdateOptions) => {
  const {
    caseCode,
    status,
    comments,
    projectKey = Cypress.env('projectKey-' + Cypress.env('testSuite')) || '',
    testRunKey = Cypress.env('testRunKey') || ''
  } = options;

  const result = {
    "0": {
      case: caseCode,
      status: status
    }
  };

  if (!comments) {
    cy.log('No comments provided, skipping QATouch update.')
    return;
  }

  makeQATouchRequest(projectKey, testRunKey, result, comments);
});

// Update multiple test cases (bulk update)
Cypress.Commands.add('updateQATouchTestRun', (options: QATouchBulkUpdateOptions) => {
  const {
    results,
    comments,
    projectKey = Cypress.env('projectKey-' + Cypress.env('testSuite')) || '',
    testRunKey = Cypress.env('testRunKey') || ''
  } = options;

  if (!results || results.length === 0) {
    cy.log('No results provided, skipping QATouch update');
    return;
  }

  if (!comments) {
    cy.log('No comments provided, skipping QATouch update.')
    return;
  }

  // Build result object with indexed entries
  const resultObject: Record<string, TestResult> = {};
  results.forEach((result, index) => {
    resultObject[index.toString()] = result;
  });

  makeQATouchRequest(projectKey, testRunKey, resultObject, comments);
});

//#endregion