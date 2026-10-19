import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from 'playwright/test';

/**
 * Open the application through the Page Object stored on the scenario World.
 */
Given('the user opens the AutomationExercise home page', async function () {
  await this.homePage.open();
});

/**
 * Verify an observable result without reaching into hook implementation details.
 */
Then('the AutomationExercise home page is displayed', async function () {
  await expect(this.homePage.homeHeading).toBeVisible();
});

/** Open the catalog using the home page navigation. */
When('the user opens the product catalog', async function () {
  await this.homePage.openProducts();
});

/** Verify the catalog page has loaded. */
Then('the product catalog is displayed', async function () {
  await expect(this.productsPage.productsHeading).toBeVisible();
});

When('the user opens the shopping cart', async function () {
  await this.homePage.openCart();
});

Then('the cart is empty', async function () {
  await expect(this.cartPage.emptyCartMessage).toBeVisible();
});
