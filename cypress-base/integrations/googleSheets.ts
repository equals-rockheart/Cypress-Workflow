let describeBlockResults = new Map<
    string,
    {
        describe: Mocha.Suite;
        tests: { title: string; status: string }[];
        allPassed: boolean;
        sheet?: string;
    }
>();

//#region Helper
function updateSheetStatus(testOrSuite: Mocha.Test | Mocha.Suite, status: string, sheet?: string): void {
    const sheetUrl = sheet || getDefaultSheetUrl();

    if (!sheetUrl) {
        cy.log("⚠️ No sheet URL provided");
        return;
    }

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        cy.log("⚠️ Invalid Google Sheet link");
        return;
    }
    
    const spreadsheetId = match[1];
    const title = testOrSuite.title || "";
    const cellMatch = title.match(/\{([^}]+)\}/);

    if (!cellMatch) return;

    let cellRef = "";
    let sheetName = "";

    // Support {C3} or {Sheet!C3}
    if (cellMatch[1].includes("!")) {
        [sheetName, cellRef] = cellMatch[1].split("!");
    } else {
        cellRef = cellMatch[1];
        
        // Extract sheet name from spec path
        const specPath = Cypress.spec.relative || "";
        const pathMatch = specPath.match(/e2e[\\/](\w+)/i);
        sheetName = pathMatch && pathMatch[1] 
            ? pathMatch[1].charAt(0).toUpperCase() + pathMatch[1].slice(1)
            : "Sheet1";
    }

    const cellValue = status === "passed"
        ? Cypress.env("regression-test-pass")
        : Cypress.env("regression-test-fail");

    cy.task("updateGoogleSheet", {
        spreadsheetId,
        sheetName,
        cellRef,
        cellValue,
    });
}

function extractSheetFromTitle(title: string): string | undefined {
    const match = title.match(/\[sheet:([^\]]+)\]/);
    return match ? match[1] : undefined;
}

function hasCellReference(title: string): boolean {
    return /\{([^}]+)\}/.test(title);
}

function getSheetForTest(test: Mocha.Test): string | undefined {
    // First try to get sheet from the test (it block) title
    let sheet = extractSheetFromTitle(test.title);

    // If not found, walk up the parent chain to find sheet in describe blocks
    if (!sheet) {
        let current = test.parent;
        while (current && current.title && !sheet) {
            sheet = extractSheetFromTitle(current.title);
            current = current.parent;
        }
    }

    return sheet || getDefaultSheetUrl();
}

function getDescribeBlockKey(test: Mocha.Test): string {
    const parentTitles = [];
    let current = test.parent;
    while (current && current.title) {
        parentTitles.unshift(current.title);
        current = current.parent;
    }
    return parentTitles.join(' > ');
}

function getDefaultSheetUrl(): string | undefined {
    return Cypress.env("regression") ? Cypress.env("regression-sheet") : undefined;
}

//#endregion

//#region Hooks
// Track test results for describe blocks
afterEach(function () {
    const test = this.currentTest;
    if (!test) return;

    const sheet = getSheetForTest(test);
    if (!getDefaultSheetUrl() && !sheet) return;

    const testStatus = test.state || "failed";

    // Check if current test (it block) has cell reference then update
    if (hasCellReference(test.title)) {
        updateSheetStatus(test, testStatus, sheet);
    }

    // Track results for describe blocks
    let current = test.parent;
    while (current && current.title) {
        if (hasCellReference(current.title)) {
            const describeKey = getDescribeBlockKey(test);

            if (!describeBlockResults.has(describeKey)) {
                describeBlockResults.set(describeKey, {
                    describe: current,
                    tests: [],
                    allPassed: true,
                    sheet: extractSheetFromTitle(current.title) || getDefaultSheetUrl(),
                });
            }

            const describeResult = describeBlockResults.get(describeKey)!;
            describeResult.tests.push({
                title: test.title,
                status: testStatus
            });

            if (testStatus !== "passed") {
                describeResult.allPassed = false;
            }
        }
        current = current.parent;
    }
});

// Update describe block status after all tests complete
after(function () {
    const hasCustomSheets = Array.from(describeBlockResults.values()).some(
        (result) => result.sheet
    );

    if (!getDefaultSheetUrl() && !hasCustomSheets) return;

    describeBlockResults.forEach((result) => {
        const finalStatus = result.allPassed ? "passed" : "failed";
        updateSheetStatus(result.describe, finalStatus, result.sheet);
    });

    describeBlockResults.clear();
});
//#endregion