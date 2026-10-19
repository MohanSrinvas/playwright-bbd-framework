/**
 * Page Object for an individual product details screen.
 */
export default class ProductDetailsPage {
  /**
   * Keep the scenario Page available for product detail actions.
   *
   * @param {import('playwright').Page} page Scenario page owned by the World.
   * @param {import('winston').Logger} logger Scenario-scoped logger.
   */
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    this.productHeading = page.locator('.product-information h2');
    this.quantityInput = page.getByRole('spinbutton');
    this.addToCartButton = page.getByRole('button', { name: /Add to cart/ });
    this.viewCartLink = page.getByRole('link', { name: /View Cart/ });
  }

  /**
   * Set the requested quantity before adding the product to the cart.
   *
   * @param {number} quantity Positive quantity requested by the scenario.
   * @returns {Promise<void>} Resolves after the quantity is entered.
   */
  async setQuantity(quantity) {
    this.logger.debug('Setting product quantity');
    await this.quantityInput.fill(String(quantity));
  }

  /** Add the displayed product to the cart. */
  async addToCart() {
    this.logger.info('Adding the displayed product to the cart');
    await this.addToCartButton.click();
  }

  /** Open the cart from the add-to-cart confirmation dialog. */
  async openCartFromConfirmation() {
    this.logger.info('Opening the cart from the add-to-cart confirmation');
    await this.viewCartLink.click();
  }

  /**
   * Return the current product name for a scenario assertion.
   *
   * @returns {Promise<string>} Visible product name.
   */
  async productName() {
    return (await this.productHeading.innerText()).trim();
  }
}
