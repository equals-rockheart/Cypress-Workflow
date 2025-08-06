declare namespace Cypress {
    interface Chainable {
        
    /**
     * Custom command to log in a user.
     * @example cy.login('user@example.com', 'password123');
     */
    login(email: string, password: string): Chainable<any>; // Adjust return type if needed
    }
}