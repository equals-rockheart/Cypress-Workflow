let describeBlockResults = new Map();

Cypress.Commands.add("updateSheetStatus", (test: Mocha.Test, status: string) => {
    const sheetUrl: string | undefined = Cypress.env("regression-sheet");
    if (!sheetUrl) {
        //cy.log("⚠️ No sheet URL provided");
        return;
    }

    // Extract spreadsheetId from URL
    const match: RegExpMatchArray = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        cy.log("⚠️ Invalid Google Sheet link");
        return;
    }
    const spreadsheetId: string = match[1];

    // Extract cell reference {C3} or {Sheet!C3} from test title
    const title: string = test.title || "";
    const cellMatch: RegExpMatchArray = title.match(/\{([^}]+)\}/);

    if (!cellMatch) {
        cy.log("⚠️ No cell reference in test title");
        return;
    }

    let cellRef: string = "";
    let sheetName: string | undefined;

    // Support {C3} or {Sheet!C3}
    if (cellMatch[1].includes("!")) {
        // Explicit: {SheetName!C3}
        const [explicitSheet, explicitCell] = cellMatch[1].split("!");
        sheetName = explicitSheet;
        cellRef = explicitCell;
    } else {
        // Default: {C3}
        cellRef = cellMatch[1];

        // Determine sheet tab name from spec path
        const specPath: string = Cypress.spec.relative || "";
        sheetName = "Sheet1"; // fallback
        if (specPath.includes("admin")) {
            sheetName = "Admin";
        } else if (specPath.includes("client")) {
            sheetName = "Merchant";
        }
    }

    // mapping
    const value = status === "passed" ? Cypress.env("regression-test-pass") : Cypress.env("regression-test-fail");

    cy.task("updateGoogleSheet", {
        spreadsheetId,
        sheetName,
        cellRef,
        value,
    });
});

// Helper function to check if a title has cell reference
function hasCellReference(title: string): boolean {
    return /\{([^}]+)\}/.test(title);
}

// Helper function to get describe block key
function getDescribeBlockKey(test: any): string {
    // Create a unique key for the describe block based on parent titles
    const parentTitles = [];
    let current = test.parent;
    while (current && current.title) {
        parentTitles.unshift(current.title);
        current = current.parent;
    }
    return parentTitles.join(' > ');
}

// Track test results for describe blocks
afterEach(function () {
    if (!Cypress.env("regression")) return;

    const test = this.currentTest;
    if (!test) return;

    const testStatus = test.state || "failed";

    // Check if current test (it block) has cell reference
    if (hasCellReference(test.title)) {
        // Update sheet for individual it block
        cy.updateSheetStatus(test, testStatus);
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
                    allPassed: true
                });
            }

            const describeResult = describeBlockResults.get(describeKey);
            describeResult.tests.push({
                title: test.title,
                status: testStatus
            });

            // If any test fails, mark the entire describe as failed
            if (testStatus !== "passed") {
                describeResult.allPassed = false;
            }
        }
        current = current.parent;
    }
});

// Update describe block status after all tests complete
after(function () {
    if (!Cypress.env("regression")) return;

    // Process all tracked describe blocks
    describeBlockResults.forEach((result, key) => {
        const finalStatus = result.allPassed ? "passed" : "failed";
        cy.updateSheetStatus(result.describe, finalStatus);
    });

    // Clear the results for next spec file
    describeBlockResults.clear();
});