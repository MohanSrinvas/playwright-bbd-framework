import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import { createUniqueEmail } from '../utils/common-utils.js';

Given('the user is on the login page', async function () {
  await this.homePage.open();
  await this.homePage.openSignupLogin();
});

When('the user logs in with the API-created account', async function () {
  await this.homePage.open();
  await this.homePage.openSignupLogin();
  await expect(this.loginPage.loginEmailInput).toBeVisible();
  await this.loginPage.login(this.apiAccountEmail, this.apiAccountPassword);
});

Then('the API-created account is shown as logged in', async function () {
  await expect(this.homePage.loggedInAsText).toContainText(this.apiAccountName);
});

When('the user submits invalid credentials', async function () {
  await this.loginPage.login(
    this.testData.ui.login.invalidEmail,
    this.testData.ui.login.invalidPassword,
  );
});

Then('the login error is displayed', async function () {
  await expect(this.loginPage.loginError).toBeVisible();
});

When('the user submits the login form without credentials', async function () {
  await this.loginPage.submitEmptyLogin();
});

Then('the email and password fields are required', async function () {
  await expect(this.loginPage.loginEmailInput).toHaveAttribute('required', '');
  await expect(this.loginPage.loginPasswordInput).toHaveAttribute('required', '');
  await expect(this.loginPage.loginEmailInput).toBeFocused();
});

Given('the user registers with the account data', async function () {
  this.testAccountEmail = createUniqueEmail('playwright.qa');
  await this.homePage.open();
  await this.homePage.openSignupLogin();
  await this.loginPage.startSignup(this.testData.ui.account.name, this.testAccountEmail);
  await this.registrationPage.completeRegistration(this.testData.ui.account);
  await expect(this.homePage.accountCreatedHeading).toBeVisible();
  await this.homePage.continueFromAccountConfirmation();
  await expect(this.homePage.loggedInAsText).toContainText(this.testData.ui.account.name);
});

When('the user signs out and logs in with the new account', async function () {
  await this.homePage.logout();
  await expect(this.loginPage.loginEmailInput).toBeVisible();
  await this.loginPage.login(this.testAccountEmail, this.testData.ui.account.password);
});

Then('the account is shown as logged in', async function () {
  await expect(this.homePage.loggedInAsText).toContainText(this.testData.ui.account.name);
});

When('the user deletes the account', async function () {
  await this.homePage.deleteAccount();
});

Then('the account deletion confirmation is displayed', async function () {
  await expect(this.homePage.accountDeletedHeading).toBeVisible();
});
