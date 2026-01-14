let describeBlockResults = new Map<
    string,
    {
        describe: Mocha.Suite;
        allPassed: boolean;
        sheet?: string;
    }
>();

let testResults: {
    test: Mocha.Test;
    status: "passed" | "failed";
    sheet: string;
    errorMessage?: string | null;
}[] = [];

//#region Helper

function updateSheetStatus(testOrSuite: Mocha.Test | Mocha.Suite, status: string, sheet: string, errorMessage?: string): void {
    const disableIntegration: string = Cypress.env('disable');

    if (disableIntegration === 'gsheets' || disableIntegration === 'all') return;

    const match = sheet.match(/\/d\/([a-zA-Z0-9-_]+)/);

    if (!match) {
        cy.task("integrationLog", { source: "gsheets", message: `\x1b[31mInvalid Google Sheet link: ${sheet} —\x1b[33m update skipped` });
        return;
    }

    const spreadsheetId = match[1];
    const title = testOrSuite.title || "";
    const cellMatch = title.match(/\{([^}]+)\}/);

    if (!cellMatch) return;

    let rowNumber = "";
    let sheetName = "";

    // Support {3} or {Sheet!3}
    if (cellMatch[1].includes("!")) {
        [sheetName, rowNumber] = cellMatch[1].split("!");
    } else {
        rowNumber = cellMatch[1];

        // Extract sheet name from spec path
        const specPath = Cypress.spec.relative || "";
        const pathMatch = specPath.match(/e2e[\\/](\w+)/i);

        sheetName = pathMatch && pathMatch[1]
            ? pathMatch[1].charAt(0).toUpperCase() + pathMatch[1].slice(1)
            : "Sheet1";
    }

    const rowNumInt = parseInt(rowNumber, 10);

    if (isNaN(rowNumInt) || rowNumInt <= 0) {
        cy.task("integrationLog", { source: "gsheets", message: `\x1b[31minvalid row number: ${testOrSuite.title} —\x1b[33m update skipped` } );
        return;
    }

    const resultsColumn = Cypress.env("results-column") || null;
    const remarksColumn = Cypress.env("remarks-column") || null;

    const cellValue = status === "passed"
        ? Cypress.env("regression-test-pass")
        : Cypress.env("regression-test-fail");

    if (!resultsColumn) {
        cy.task("integrationLog", { source: "gsheets", message: `\x1b[31mresults-column not found in /cypress/config/regression-sheet.json —\x1b[33m update skipped`});
        return;
    }

    cy.task("updateGoogleSheet", {
        spreadsheetId,
        sheetName,
        cellRef: `${resultsColumn}${rowNumber}`,
        cellValue,
    });

    if (errorMessage && remarksColumn) {
        cy.task("updateGoogleSheet", {
            spreadsheetId,
            sheetName,
            cellRef: `${remarksColumn}${rowNumber}`,
            cellValue: errorMessage
        });
    }
}

function extractSheetFromTitle(title: string): string | undefined {
    const match = title.match(/\[sheet:([^\]]+)\]/);

    return match ? match[1] : undefined;
}

function hasCellReference(title: string): boolean {
    return /\{([^}]+)\}/.test(title);
}

function getSheetForNode(node: Mocha.Test | Mocha.Suite): string {
    let sheet = extractSheetFromTitle(node.title);
    let current = node.parent;

    while (!sheet && current && current.title) {
        sheet = extractSheetFromTitle(current.title);
        current = current.parent;
    }

    return sheet || getDefaultSheetUrl();
}

function getDescribeBlockKey(suite: Mocha.Suite): string {
    const titles: string[] = [];

    let current: Mocha.Suite | undefined = suite;

    while (current && current.title) {
        titles.unshift(current.title);
        current = current.parent;
    }

    return titles.join(" > ");
}

function getDefaultSheetUrl(): string | undefined {
    return Cypress.env("regression-sheet");
}

//#endregion

//#region Hooks

afterEach(function () {
    const test = this.currentTest;
    if (!test) return;

    const retries = Cypress.currentRetry ?? 0;
    const maxRetries = Cypress.getTestRetries() ?? 0;

    const errorMessage = test.err?.message || null;

    if (this.currentTest?.state === 'failed' && retries < maxRetries)
        return; // skip this attempt

    const sheet = getSheetForNode(test);
    const testStatus = (test.state || "failed") as "passed" | "failed";

    // Check if current test (it block) has cell reference then push to queue
    if (hasCellReference(test.title)) {
        testResults.push({
            test,
            status: testStatus,
            sheet,
            errorMessage
        });
    }

    // Track results for describe blocks
    let current = test.parent;
    while (current && current.title) {
        if (hasCellReference(current.title)) {
            const describeKey = getDescribeBlockKey(current);

            if (!describeBlockResults.has(describeKey)) {
                describeBlockResults.set(describeKey, {
                    describe: current,
                    allPassed: true,
                    sheet: getSheetForNode(current),
                });
            }

            if (test.state !== "passed") {
                const describeResult = describeBlockResults.get(describeKey)!;
                describeResult.allPassed = false;
            }
        }
        current = current.parent;
    }
});

after(function () {
    const missingSheetTests: string[] = [];

    testResults.forEach((result) => {
        if (!result.sheet) {
            missingSheetTests.push(result.test.fullTitle());
        }
        updateSheetStatus(result.test, result.status, result.sheet, result.errorMessage);
    });

    describeBlockResults.forEach((result) => {
        const finalStatus = result.allPassed ? "passed" : "failed";
        updateSheetStatus(result.describe, finalStatus, result.sheet);
    });

    if (missingSheetTests.length > 0) {
        cy.task("integrationLog", { source: "gsheets", message: `\x1b[33mGoogle Sheet URL not found for the following tests:\n- ${missingSheetTests.join("\n- ")}` });
    }

    describeBlockResults.clear();
    testResults = [];
});

//#endregion

//#region Commands

Cypress.Commands.add("updateGoogleSheet",
    (params: {
        spreadsheetId: string;
        sheetName: string;
        cellRef: string;
        cellValue: string;
    }) => {
        return cy.task<number>("updateGoogleSheet", params);
    }
);

Cypress.Commands.add("readGoogleSheetCell",
    ({ spreadsheetId, sheetName, cellRef }: {
        spreadsheetId: string;
        sheetName: string;
        cellRef: string;
    }) => {
        return cy.task<(string | null)[][]>("readGoogleSheet", { spreadsheetId, sheetName, range: cellRef })
            .then(values => values?.[0]?.[0] ?? null);
    }
);

Cypress.Commands.add("readGoogleSheetRange",
    ({ spreadsheetId, sheetName, cellRange }: {
        spreadsheetId: string;
        sheetName: string;
        cellRange: string;
    }) => {
        return cy.task<(string | null)[][]>("readGoogleSheet", { spreadsheetId, sheetName, range: cellRange });
    }
);

//#endregion