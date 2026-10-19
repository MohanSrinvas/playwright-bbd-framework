/**
 * Page Object for the AutomationExercise home page.
 */
export default class HomePage {
  /**
   * Keep the scenario Page available for home page actions.
   *
   * @param {import('playwright').Page} page Scenario page owned by the World.
   * @param {string} baseUrl The base URL of the application.
   * @param {import('winston').Logger} logger Scenario-scoped logger.
   */
  constructor(page, baseUrl, logger) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.logger = logger;
    this.homeHeading = page
      .getByRole('heading', { name: 'AutomationExercise', exact: true })
      .first();
    this.productsLink = page.getByRole('link', { name: /Products/ });
    this.cartLink = page.getByRole('link', { name: /Cart/ });
    this.signupLoginLink = page.getByRole('link', { name: /Signup \/ Login/ });
    this.loggedInAsText = page.getByText(/Logged in as/);
    this.logoutLink = page.locator('a[href="/logout"]');
    this.deleteAccountLink = page.locator('a[href="/delete_account"]');
    this.accountCreatedHeading = page.getByRole('heading', {
      name: 'Account Created!',
      exact: true,
    });
    this.accountDeletedHeading = page.getByRole('heading', {
      name: 'Account Deleted!',
      exact: true,
    });
    this.continueLink = page.getByRole('link', { name: 'Continue', exact: true });
  }

  /**
   * Open the configured application home page.
   *
   * @returns {Promise<void>} Resolves after the page has loaded.
   */
  async open() {
    this.logger.info('Navigating to the application home page');
    await this.page.goto(this.baseUrl);
  }

  /**
   * Read the browser title for a simple smoke assertion.
   *
   * @returns {Promise<string>} Current page title.
   */
  async title() {
    return this.page.title();
  }

  /**
   * Return the main heading displayed on the home page.
   *
   * @returns {Promise<string>} Visible home page heading.
   */
  async headingText() {
    return (await this.homeHeading.innerText()).trim();
  }

  /** Open the product catalog through the site navigation. */
  async openProducts() {
    this.logger.info('Opening the product catalog from navigation');
    await this.productsLink.click();
  }

  /** Open the shopping cart through the site navigation. */
  async openCart() {
    this.logger.info('Opening the shopping cart from navigation');
    await this.cartLink.click();
  }

  /** Open the signup and login page through the site navigation. */
  async openSignupLogin() {
    this.logger.info('Opening the signup and login page');
    await this.signupLoginLink.click();
  }

  /** Sign out the current account. */
  async logout() {
    this.logger.info('Signing out of the current account');
    await this.logoutLink.click();
  }

  /** Delete the current account from the account navigation. */
  async deleteAccount() {
    this.logger.info('Deleting the current account');
    await this.deleteAccountLink.click();
  }

  /** Continue from the account-created or account-deleted confirmation. */
  async continueFromAccountConfirmation() {
    await this.continueLink.click();
  }
}
