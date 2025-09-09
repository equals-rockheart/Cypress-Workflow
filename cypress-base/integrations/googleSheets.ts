let describeBlockResults = new Map();

Cypress.Commands.add("updateSheetStatus", (test: Mocha.Test, status: string, sheet?: string) => {
    const sheetUrl: string | undefined = 
        sheet || (Cypress.env("regression") ? Cypress.env("regression-sheet") : undefined);

    if (!sheetUrl) {
        cy.log("⚠️ No sheet URL provided");
        return;
    }

    // Extract spreadsheetId from URL
    const match: RegExpMatchArray | null = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        cy.log("⚠️ Invalid Google Sheet link");
        return;
    }
    const spreadsheetId: string = match[1];

    // Extract cell reference {C3} or {Sheet!C3} from test title
    const title: string = test.title || "";
    const cellMatch: RegExpMatchArray | null = title.match(/\{([^}]+)\}/);

    if (!cellMatch) {
        cy.log("⚠️ No cell reference in test title");
        return;
    }

    let cellRef: string = "";
    let sheetName: string;

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
    const value : string = 
        status === "passed" 
            ? Cypress.env("regression-test-pass") 
            : Cypress.env("regression-test-fail");
return
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

// Helper function to extract sheet URL from title
function extractSheetFromTitle(title: string): string | undefined {
    const match = title.match(/\[sheet:([^\]]+)\]/);
    return match ? match[1] : undefined;
}

// Helper function to get sheet URL for a test (with inheritance)
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
    
    // Fall back to regression sheet
    return sheet || (Cypress.env("regression") ? Cypress.env("regression-sheet") : undefined);
}

// Helper function to get describe block key
function getDescribeBlockKey(test: Mocha.Test): string {
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
    const test: Mocha.Test | undefined = this.currentTest;
    if (!test) return;

    // Get sheet URL from title (with inheritance from describe blocks)
    const sheet = getSheetForTest(test);
    console.log("afterEach sheet:", sheet);
    
    if (!Cypress.env("regression") && !sheet) return;

    const testStatus = test.state || "failed";

    // Check if current test (it block) has cell reference
    if (hasCellReference(test.title)) {
        // Update sheet for individual it block
        cy.updateSheetStatus(test, testStatus, sheet);
    }

    // Track results for describe blocks
    let current: Mocha.Suite | undefined = test.parent;
    while (current && current.title) {
        if (hasCellReference(current.title)) {
            const describeKey = getDescribeBlockKey(test);

            if (!describeBlockResults.has(describeKey)) {
                describeBlockResults.set(describeKey, {
                    describe: current,
                    tests: [],
                    allPassed: true,
                    sheet // Store the resolved sheet URL
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
    // Check if we have any describe blocks to process and if any have custom sheets
    const hasCustomSheets = Array.from(describeBlockResults.values()).some(result => result.sheet);
    
    if (!Cypress.env("regression") && !hasCustomSheets) return;

    console.log("after - processing", describeBlockResults.size, "describe blocks");

    // Process all tracked describe blocks
    describeBlockResults.forEach((result, key) => {
        const finalStatus = result.allPassed ? "passed" : "failed";
        console.log(`Processing describe block: ${key}, status: ${finalStatus}, sheet: ${result.sheet}`);
        cy.updateSheetStatus(result.describe, finalStatus, result.sheet);
    });

    // Clear the results for next spec file
    describeBlockResults.clear();
});