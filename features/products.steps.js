import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from 'playwright/test';

Given('the user opens the product catalog directly', async function () {
  await this.productsPage.open();
  await expect(this.productsPage.productsHeading).toBeVisible();
});

When('the user searches for the product in test data', async function () {
  await this.productsPage.searchFor(this.testData.ui.products.searchTerm);
});

Then('the matching product is displayed', async function () {
  const matchingProduct = this.productsPage.productCards.filter({
    hasText: this.testData.ui.products.searchTerm,
  });
  await expect(matchingProduct).toHaveCount(1);
});

When('the user searches for a term with no matches', async function () {
  await this.productsPage.searchFor(this.testData.ui.products.missingSearchTerm);
});

Then('no matching products are displayed', async function () {
  await expect(this.productsPage.productCards).toHaveCount(0);
});

When('the user opens the matching product details', async function () {
  await this.productsPage.openProductDetails(this.testData.ui.products.searchTerm);
});

Then('the product details are displayed', async function () {
  await expect(this.productDetailsPage.productHeading).toHaveText(
    this.testData.ui.products.searchTerm,
  );
});
