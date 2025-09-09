import { loadSprintTests } from "@integrations/sprintLoader";

// By default, regression tests are mapped based on spec location, made for paystage, /e2e/admin/** -> Admin!, /e2e/client/** -> Merchant!
// You can override this by adding {SheetName!Cell} in the describe or it title
// Example: describe("Dashboard Tests {Admin!D5}", () => { ... })
// Example: it("GCash Card is Present {Admin!D6}", () => { ... })
describe(`Dashboard Regression {D18}`, () => {

    // It can also be integrated to your QATouch test run and mapped by test case title
    // You can do this by adding CaseNumber in the title, TR00023 -> 23 - [Module] Test Case Title {Sheet!Cell}
    // Example: it("22 - [${AdminModules.Dashboard}] GCash Solution Card is Present {Admin!D8}", () => { ... })
    it(`17 - [${AdminModules.Dashboard}] GCash Solution Card is Visible {Admin!D8}`, () => {
        cy.log("This is a regression test");
        expect(true).to.be.true;
    });

    it(`23 - [${AdminModules.Dashboard}] GCash Solution Card Currency is Correct {Admin!D9}`, () => {
        cy.log("This is a regression test");
        expect(true).to.be.false;
    });

    // To actually update the QATouch test run, you need to call bulkUpdateQATouch in after()
    // Define your test run key here
    // const ADMIN_testRunKey = "";
    // after(() => {
    //     cy.bulkUpdateQATouch({
    //         comments: `Cypress Automation - ENV: ${Cypress.env("env")}`,
    //         projectKey: Cypress.env("projectKey-admin"),
    //         testRunKey: ADMIN_testRunKey
    //     });
    // });
});

describe("Sprint", () => {
    // By default it scans all tests under /e2e/sprint/**.cy.ts and finds all the specified testSuite and module
    // Make sure the testSuite and module matches, case insensitive
    loadSprintTests({ testSuite: "Client", module: AdminModules.Dashboard });
});


// Modules allow easier categorization of test cases and preventing typos in test titles
// You can create your own modules file and import it in your test files
// Example: import { AdminModules } from "@support/modules/adminModules";

// cypress/support/modules/adminModules.ts
export enum AdminModules {
    Dashboard = "Dashboard",
    AccountDetails_General = "Account Details - General",
    AccountDetails_Balances = "Account Details - Balances",
    AccountDetails_Transactions = "Account Details - Transactions"
}