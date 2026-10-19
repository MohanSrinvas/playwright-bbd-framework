/**
 * Page Object for the products screen.
 */
export default class ProductsPage {
  /**
   * Keep the scenario Page available for product actions.
   *
   * @param {import('playwright').Page} page Scenario page owned by the World.
   * @param {import('winston').Logger} logger Scenario-scoped logger.
   */
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    this.productsHeading = page.getByRole('heading', { name: /All Products/i });
    this.searchInput = page.getByPlaceholder('Search Product');
    this.searchButton = page.locator('#submit_search');
    this.productCards = page.locator('.features_items .col-sm-4');
    this.noSearchResultsMessage = page.getByText(/no products found in your search/i);
    this.addedToCartMessage = page.getByText('Your product has been added to cart', {
      exact: false,
    });
    this.viewCartLink = page.getByRole('link', { name: /View Cart/i });
  }

  /** Open the product catalog directly. */
  async open() {
    this.logger.info('Navigating to the product catalog');
    await this.page.goto('/products');
  }

  /**
   * Search the catalog by product name.
   *
   * @param {string} productName Search term entered in the catalog.
   * @returns {Promise<void>} Resolves after matching results are displayed.
   */
  async searchFor(productName) {
    this.logger.info('Searching the product catalog');
    await this.searchInput.fill(productName);
    await this.searchButton.click();
  }

  /**
   * Open a product's details page from its catalog card.
   *
   * @param {string} productName Visible product name to open.
   * @returns {Promise<void>} Resolves after the product link is clicked.
   */
  async openProductDetails(productName) {
    this.logger.info('Opening a product details page');
    const productCard = this.productCards.filter({ hasText: productName });
    await productCard.getByRole('link', { name: /View Product/ }).click();
  }

  /** Add the named product from its catalog card. */
  async addProductToCart(productName) {
    this.logger.info('Adding a product to the cart');
    const productCard = this.productCards.filter({ hasText: productName }).first();
    await productCard.locator('a.add-to-cart').first().click();
  }

  /** Open the cart from the add-to-cart confirmation dialog. */
  async openCartFromConfirmation() {
    this.logger.info('Opening the cart from the add-to-cart confirmation');
    await this.viewCartLink.click();
  }

  /**
   * Return the catalog heading for a scenario assertion.
   *
   * @returns {Promise<string>} Visible catalog heading.
   */
  async headingText() {
    return (await this.productsHeading.innerText()).trim();
  }
}
