import { ClientModules } from "@support/modules/clientModules";

// Make sure test suite name is consistent across all sprint files
describe("Admin Side", () => {
    const ADMIN_testRunKey = "";

    after(() => {
        cy.bulkUpdateQATouch({
            comments: `Cypress Automation - ENV: ${Cypress.env("env")}`,
            projectKey: Cypress.env("projectKey-admin"),
            testRunKey: ADMIN_testRunKey
        });
    });

    // Follow naming convention: it(`CaseNumber - [Module] Test Case Title`, () => { ... })
    // TR00064 -> 64
    it(`64 - [${ClientModules.AccountDetails_Transactions}]`, () => {
        cy.log("sample");
    })

});

describe("Client Side", () => {
    const CLIENT_testRunKey = "";

    after(() => {
        cy.bulkUpdateQATouch({
            comments: `Cypress Automation - ENV: ${Cypress.env("env")}`,
            projectKey: Cypress.env("projectKey-client"),
            testRunKey: CLIENT_testRunKey
        });
    });
});

describe("API Side", () => {
    const API_testRunKey = "";

    after(() => {
        cy.bulkUpdateQATouch({
            comments: `Cypress Automation - ENV: ${Cypress.env("env")}`,
            projectKey: Cypress.env("projectKey-api"),
            testRunKey: API_testRunKey
        });
    });
});