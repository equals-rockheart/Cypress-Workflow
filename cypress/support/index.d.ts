declare namespace Cypress {
    interface Chainable {
        
    /**
     * Custom command to log in a user.
     * @example cy.login('user@example.com', 'password123');
     */
    login(email: string, password: string): Chainable<any>; // Adjust return type if needed

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
     */
    bulkUpdateQATouch(options: { comments: string; projectKey?: string; testRunKey?: string }): Chainable<void>;

    }
}