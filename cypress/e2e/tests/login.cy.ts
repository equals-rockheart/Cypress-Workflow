import { loginPage } from "@pages/LoginPage";

describe('Login Functionality', () => {
    beforeEach(() => {
        loginPage.visit();
    })  
    it('Login with wrong credentials', function() {
        loginPage.login('testes@gmail.com', '123');
        loginPage.validateLoginError('These credentials do not match our records.');
    })
    it('Login with invalid email', function() {
        loginPage.login('testes', '123');
        loginPage.validateLoginError('The email must be a valid email address.');
    })
    it('Login with empty email', function() {
        loginPage.login("", "test");
        loginPage.validateLoginError('The email field is required.');
    })
    it('Login with empty password', function() {
        loginPage.login("dsadadas@gmail.com", "");
        loginPage.validateLoginError('The password field is required.');
    })

    it('Login with empty fields', function() {
        loginPage.login("", "");
        loginPage.validateLoginError('The email field is required.', 'The password field is required.');
    })
    
    it('Login with valid credentials', function() {
        loginPage.login(Cypress.env('merchant-user'), Cypress.env('merchant-pass'));
        cy.url().should('equal', Cypress.env('baseURL') + "/")
    })  
})