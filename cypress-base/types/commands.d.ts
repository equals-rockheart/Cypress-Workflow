declare namespace Cypress {
    interface Chainable {

    /**
     * Update a single test case result in QATouch test run
     * @param options - Test case update options
     */
    updateQATouchTestCase(options: QATouchUpdateOptions): Chainable<void>;

    /**
     * Update multiple test case results in QATouch test run
     * @param options - Bulk test case update options
     */
    updateQATouchTestRun(options: QATouchBulkUpdateOptions): Chainable<void>;

    /**
     * Bulk update all collected test results
     * Does not work when --env regression=true
     */
    bulkUpdateQATouch(options: { comments: string; projectKey?: string; testRunKey?: string }): Chainable<void>;

    /**
     * Override the QATouch status for the current test.
     * Example: cy.setQATouchStatus(QATouchStatus.BLOCKED)
     */
    setQATouchStatus(status: QATouchStatus): Chainable<void>;

    /**
     * Attach a custom comment for the current test.
     */
    setQATouchComment(comment: string): Chainable<void>;

    /**
     * Update a Google Sheet cell
     * @returns HTTP status code (200 = success)
     */
    updateGoogleSheet(params: {
        spreadsheetId: string;
        sheetName: string;
        cellRef: string;
        cellValue: string;
    }): Chainable<number>;

    /**
     * Read a single Google Sheet cell.
     * @returns Cell value or null if empty
     */
    readGoogleSheetCell(params: {
        spreadsheetId: string;
        sheetName: string;
        cellRef: string;
    }): Chainable<string | null>;

    /**
     * Read a range from Google Sheets.
     * @param cellRange - Range of cells to read, e.g. A1:F10
     * @returns 2D array of strings (rows x columns), null for empty cells.
     */
    readGoogleSheetRange(params: {
        spreadsheetId: string;
        sheetName: string;
        cellRange: string;
    }): Chainable<(string | null)[][]>;

    }
}