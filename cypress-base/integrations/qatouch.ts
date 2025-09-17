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
  const disableIntegration: string = Cypress.env('disable');
  if (disableIntegration === 'qatouch' || disableIntegration === 'all') return;

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
      if (Cypress.env("regression")) {
        cy.log(`❌ QATouch update failed in ${Cypress.spec?.name}: ${response.status} - ${errorMsg}`);
      } else {
        cy.log(`❌ QATouch update failed in ${Cypress.spec?.name} using ${testRunKey}: ${response.status} - ${errorMsg}`);
      }
      cy.log('Please check your test case number (if existing in test run) or your connection.');
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
let currentCommentedResults: { result: TestResult; comment: string }[] = [];
let currentDescribeTitle: string = '';

let regressionTestResults: TestResult[] = [];
let regressionCommentedResults: { result: TestResult; comment: string }[] = [];

// Bulk update all collected test results for current describe block
Cypress.Commands.add('bulkUpdateQATouch', (options: { comments: string; projectKey?: string; testRunKey?: string }) => {
  // Prevent separate update when loading Sprint Tests
  if(Cypress.env('regression') === true) return;
  
  const { comments, projectKey, testRunKey } = options;

  if (currentCommentedResults.length > 0){
    currentCommentedResults.forEach(({ result, comment }) => {
      cy.updateQATouchTestCase({
        caseCode: result.case,
        status: result.status,
        comments: comments + " | logs: " + comment,
        projectKey,
        testRunKey
      });
    });
    currentCommentedResults = [];
  }

  if (currentTestResults.length > 0) {
    cy.updateQATouchTestRun({
      results: currentTestResults,
      comments,
      projectKey,
      testRunKey
    });
    currentTestResults = [];
  } else {
    cy.log('No bulk results collected for this describe block.');
  }
});

afterEach(function () {
  const titlePath = this.currentTest.titlePath();
  const describeTitle = titlePath[0];

  // Reset results if we're in a new describe block
  if (describeTitle !== currentDescribeTitle) {
    currentTestResults = [];
    currentDescribeTitle = describeTitle;
    console.log(`Describe Block: ${currentDescribeTitle}`);
  }

  const testTitle = titlePath[titlePath.length - 1];
  const caseNumber = extractCaseNumber(testTitle); // e.g. "[C123] Some test"
  if (!caseNumber) return;

  // Use custom override if set
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

  const comment: string | undefined = (Cypress as any).currentQATouchComment;
  const result: TestResult = { case: caseNumber, status: status};

  const hasSkip = describeTitle.toLowerCase().includes("-skip");
  const hasSprint = describeTitle.toLowerCase().includes("sprint");

  if (comment) {
    // push into comment bucket for individual updates
    currentCommentedResults.push({ result, comment });
    if (!(hasSkip && hasSprint)) 
      regressionCommentedResults.push({result, comment });
  } else {
    // push into bulk bucket
    currentTestResults.push(result);
    if (!(hasSkip && hasSprint))
      regressionTestResults.push(result);
  }

  (Cypress as any).currentQATouchStatus = undefined;
  (Cypress as any).currentQATouchComment = undefined;

  console.log(`Collected test result: ${caseNumber} = ${QATouchStatus[status]} (${this.currentTest.state})`);
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

// Custom command to override comments inside tests
Cypress.Commands.add('setQATouchComment', (comment: string) => {
  (Cypress as any).currentQATouchComment = comment;
  cy.log(`Comment: ${comment}`);
});

//#endregion

//#region Regression Helper

after(() => {
  if (!Cypress.env('regression')) return;

  const specPath = Cypress.spec.relative || "";
  const match = specPath.match(/e2e[\\/](\w+)/i);

  const specSuite = match ? match[1].toLowerCase() : "";

  const projectKey = Cypress.env(`projectKey-${specSuite}`);
  const testRunKey = Cypress.env(`regression-${specSuite}-testRunKey`);

  if (specSuite && projectKey && testRunKey) {
    if (regressionCommentedResults.length > 0){
      regressionCommentedResults.forEach(({ result, comment }) => {
        cy.updateQATouchTestCase({
          caseCode: result.case,
          status: result.status,
          comments: `Cypress Automation - env: ${Cypress.env("env")}` + " | logs: " + comment,
          projectKey,
          testRunKey
        });
      });
      regressionCommentedResults = [];
    }
    if (regressionTestResults.length > 0) {
      cy.updateQATouchTestRun({
        results: regressionTestResults,
        comments: `Cypress Automation - env: ${Cypress.env("env")}`,
        projectKey,
        testRunKey
      });
      regressionTestResults = [];
    } else {
      cy.log('No bulk results collected for this describe block.');
    }
  } else {
    let missingVars = [];

    if (!projectKey) missingVars.push(`projectKey-${specSuite}`);
    if (!testRunKey) missingVars.push(`regression-${specSuite}-testRunKey`);

    cy.log(
      `⚠️ Skipping QATouch bulk update for suite "${specSuite}" — missing env var(s): ${missingVars.join(", ")}`
    );
  }
});

//#endregion