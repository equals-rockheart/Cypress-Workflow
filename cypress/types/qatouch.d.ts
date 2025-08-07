declare global {
  interface TestResult {
    case: string;
    status: number;
  }

  interface QATouchUpdateOptions {
    caseCode: string;
    status: number;
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
}

export {}; // Makes it a module to avoid conflicts