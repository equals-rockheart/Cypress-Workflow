declare global {
  interface TestResult {
    case: string;
    status: QATouchStatus;
  }

  interface QATouchUpdateOptions {
    caseCode: string;
    status: QATouchStatus;
    comments?: string;
    projectKey?: string;
    testRunKey?: string;
  }

  interface QATouchBulkUpdateOptions {
    results: TestResult[];
    comments?: string;
    projectKey?: string;
    testRunKey?: string;
  }

  enum QATouchStatus {
    PASSED = 1 ,
    UNTESTED,
    BLOCKED,
    RETEST,
    FAILED,
    NOT_APPLICABLE,
    IN_PROGRESS,
    HOLD
  }
}

export {};