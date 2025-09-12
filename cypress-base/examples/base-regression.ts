import { loadSprintTests } from "@integrations/sprintLoader";
import { AdminModules } from "@support/modules/adminModules";

describe("Module Name", () => {
    it(`CaseNumber - Title {SheetName!Cell}`, () => {
    });

    it(`CaseNumber - Title {Cell} [sheet:URL]`, () => {
    });

    const ADMIN_testRunKey = "TR_ABC123"; // Get this from QATouch test run URL
    after(() => {
        cy.bulkUpdateQATouch({
            comments: `Cypress Automation - ENV: ${Cypress.env("env")} - ${new Date().toISOString()}`,
            projectKey: Cypress.env("projectKey-admin"),
            testRunKey: ADMIN_testRunKey
        });
    });

});

describe("Module Name {SheetName!Cell} [sheet:URL]", () => {});
describe("Module Name {Cell} [sheet:URL]", () => {});

describe("Sprint", () => {
    if(Cypress.env("regression")) {
        loadSprintTests({ testSuite: "", module: "" });
  }
});