import { Then, When } from '@cucumber/cucumber';
import { expect } from 'playwright/test';

When('the user adds the matching product to the cart', async function () {
  await this.productsPage.addProductToCart(this.testData.ui.products.searchTerm);
});

Then('the add-to-cart confirmation is displayed', async function () {
  await expect(this.productsPage.addedToCartMessage).toBeVisible();
});

When('the user opens the cart from the confirmation', async function () {
  await this.productsPage.openCartFromConfirmation();
});

Then('the cart contains the product in test data', async function () {
  const matchingCartRow = this.cartPage.cartRows.filter({
    hasText: this.testData.ui.products.searchTerm,
  });
  await expect(matchingCartRow).toHaveCount(1);
});

When('the user removes the product in test data from the cart', async function () {
  await this.cartPage.removeProduct(this.testData.ui.products.searchTerm);
});
