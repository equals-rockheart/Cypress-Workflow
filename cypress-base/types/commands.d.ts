declare namespace Cypress {
    interface Chainable {
        
    /**
     * Update a single test case result in QATouch test run
     * @param options - Test case update options
     */
    updateQATouchTestCase(options: QATouchUpdateOptions): Cypress.Chainable<void>;
    
    /**
     * Update multiple test case results in QATouch test run
     * @param options - Bulk test case update options
     */
    updateQATouchTestRun(options: QATouchBulkUpdateOptions): Cypress.Chainable<void>;

    /**
     * Bulk update all collected test results
     */
    bulkUpdateQATouch(options: { comments: string; projectKey?: string; testRunKey?: string }): Cypress.Chainable<void>;

    /**
     * Override the QATouch status for the current test.
     * Example: cy.setQATouchStatus(QATouchStatus.BLOCKED)
     */
    setQATouchStatus(status: QATouchStatus): Cypress.Chainable<void>;

    /**
     * Attach a custom comment for the current test.
     */
    setQATouchComment(comment: string): Cypress.Chainable<void>;

    /**
     * Update Google Sheets Cell
     */
    updateSheetStatus(test: Mocha.Test, status: string): Cypress.Chainable<void>;
    
    }
}