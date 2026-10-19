/**
 * Page Object for the shopping cart screen.
 */
export default class CartPage {
  /**
   * Keep the scenario Page available for cart actions.
   *
   * @param {import('playwright').Page} page Scenario page owned by the World.
   * @param {import('winston').Logger} logger Scenario-scoped logger.
   */
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    this.emptyCartMessage = page.getByText('Cart is empty!', { exact: false });
    this.cartRows = page.locator('#cart_info_table tbody tr');
  }

  /** Open the cart directly. */
  async open() {
    this.logger.info('Navigating to the shopping cart');
    await this.page.goto('/view_cart');
  }

  /**
   * Check whether the cart contains a product with the requested name.
   *
   * @param {string} productName Product name to find in the cart.
   * @returns {Promise<boolean>} Whether a matching cart row exists.
   */
  async containsProduct(productName) {
    return (await this.cartRows.filter({ hasText: productName }).count()) > 0;
  }

  /**
   * Remove a product from the cart by its visible name.
   *
   * @param {string} productName Product name to remove.
   * @returns {Promise<void>} Resolves after the matching row is removed.
   */
  async removeProduct(productName) {
    this.logger.info('Removing a product from the cart');
    const cartRow = this.cartRows.filter({ hasText: productName });
    await cartRow.locator('.cart_quantity_delete').click();
  }

  /**
   * Report whether the empty-cart message is visible.
   *
   * @returns {Promise<boolean>} Whether the cart is empty.
   */
  async isEmpty() {
    return this.emptyCartMessage.isVisible();
  }
}
