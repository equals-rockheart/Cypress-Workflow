 /// <reference types="cypress" />

import { loginPage } from "../e2e/pages/LoginPage";

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit(Cypress.env('baseURL'));
    loginPage.login(email, password);
    // These commands will only run once per session
    cy.url().should('not.include', '/login');
  });
});
