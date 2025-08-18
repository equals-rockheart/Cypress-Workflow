export enum QATouchStatus {
  PASSED = 1,
  UNTESTED,
  BLOCKED,
  RETEST,
  FAILED,
  NOT_APPLICABLE,
  IN_PROGRESS,
  HOLD
}

(globalThis as any).QATouchStatus = QATouchStatus;

//#region QA Touch API Hook

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

//#region QA Touch Case Helper

let currentTestResults: TestResult[] = [];
let currentDescribeTitle: string = '';

// Bulk update all collected test results for current describe block
Cypress.Commands.add('bulkUpdateQATouch', (options: { comments: string; projectKey?: string; testRunKey?: string }) => {
  if (currentTestResults.length === 0) {
    cy.log('No test results collected for current describe block, skipping bulk QATouch update');
    return;
  }

  cy.updateQATouchTestRun({
    results: currentTestResults,
    comments: options.comments,
    projectKey: options?.projectKey,
    testRunKey: options?.testRunKey
  });

  // Clear results after update
  currentTestResults = [];
});

beforeEach(() => {
  (Cypress as any).currentQATouchStatus = undefined;
});

afterEach(function () {
  const sprint = Cypress.env('sprint');
  if (!sprint) return; // Skip collection for local testing

  const titlePath = this.currentTest.titlePath();
  const describeTitle = titlePath[0];

  // Reset results if we're in a new describe block
  if (describeTitle !== currentDescribeTitle) {
    currentTestResults = [];
    currentDescribeTitle = describeTitle;
    console.log(`Describe Block: ${currentDescribeTitle}`);
  }

  const caseNumber = extractCaseNumber(titlePath[1]); // e.g. "[C123] Some test"
  if (!caseNumber) return;

  // Determine status:
  // 1. Use custom override if set
  // 2. Otherwise fall back to pass/fail
  let status: QATouchStatus;
  if ((Cypress as any).currentQATouchStatus) {
    status = (Cypress as any).currentQATouchStatus;
  } else if (this.currentTest.state === 'passed') {
    status = QATouchStatus.PASSED;
  } else if (this.currentTest.state === 'failed') {
    status = QATouchStatus.FAILED;
  } else {
    status = QATouchStatus.UNTESTED;
  }

  const result: TestResult = { case: caseNumber, status: status};
  currentTestResults.push(result);

  console.log(`Collected test result: ${caseNumber} = ${status} (${this.currentTest.state})`);
});

// Utility function to extract case number from test title
function extractCaseNumber(title: string): string | null {
  // Match patterns like "64 - Filter Currency" -> "64"
  const match = title.match(/^(\d+)\s*-/);
  if (match) {
    return match[1]; // Return just the number
  }
  return null;
}

// Custom command to override status inside tests
Cypress.Commands.add('setQATouchStatus', (status: QATouchStatus) => {
  (Cypress as any).currentQATouchStatus = status;
  cy.log(`Result: ${QATouchStatus[status]}`);
});

//#endregion