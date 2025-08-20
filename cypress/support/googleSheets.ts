Cypress.Commands.add("updateSheetStatus", (test, status) => {
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

afterEach(function () {
    if (!Cypress.env("regression")) return;

    const test = this.currentTest;
    if (!test) return;

    cy.updateSheetStatus(test, test.state || "failed");
});
