describe("Admin Side", () => {
    const ADMIN_testRunKey = "";

    after(() => {
        cy.bulkUpdateQATouch({
            comments: `Cypress Automation - ENV: ${Cypress.env("env")}`,
            projectKey: Cypress.env("projectKey-admin"),
            testRunKey: ADMIN_testRunKey
        });
    });
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