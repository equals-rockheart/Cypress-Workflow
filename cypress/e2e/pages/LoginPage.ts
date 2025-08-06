class LoginPage {

    get emailField() { return cy.get('#emailAddress'); }
    get passwordField() { return cy.get('#password'); }
    get signinBtn() { return cy.get('.rs-btn'); }
    get forgotPasswordBtn() { return cy.get('[href="https://staging.paystage.net/forgot-password"]'); }
    get createAccBtn() { return cy.get('[href="https://staging.paystage.net/register"]'); }
    get errorBox() { return cy.get('.mb-6'); }
    get errorHeader() { return cy.get('.mb-6 > .font-medium'); }
    get errorMsg() { return cy.get('.mt-3 > :nth-child(1)'); }
    get errorMsg2() { return cy.get('.mt-3 > :nth-child(2)'); }
    
    public visit():void {
        cy.visit(Cypress.env('baseURL') + "/login");
    }

    public login(email: string, password: string):void {
        if (email != "")
            this.emailField.type(email);
        if (password != "")
            this.passwordField.type(password);
        this.signinBtn.click();
    }

    public validateLoginError(errorMessage:string, errorMessage2:string = "") {
        this.errorBox.should('be.visible');
        this.errorHeader.should('have.text', 'Whoops! Something went wrong.')
        this.errorMsg.should('have.text', errorMessage)
        if (errorMessage2 != ""){
            this.errorMsg2.should('have.text', errorMessage2)
        }
    }

}

export const loginPage: LoginPage = new LoginPage()