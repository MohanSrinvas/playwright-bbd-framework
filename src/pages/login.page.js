/**
 * Page Object for the login screen.
 */
export default class LoginPage {
  /**
   * Keep the scenario Page available for login actions.
   *
   * @param {import('playwright').Page} page Scenario page owned by the World.
   * @param {import('winston').Logger} logger Scenario-scoped logger.
   */
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    const loginForm = page.locator('form').filter({
      has: page.getByRole('button', { name: 'Login', exact: true }),
    });
    const signupForm = page.locator('form').filter({
      has: page.getByRole('button', { name: 'Signup', exact: true }),
    });

    this.loginEmailInput = loginForm.getByPlaceholder('Email Address');
    this.loginPasswordInput = loginForm.getByPlaceholder('Password');
    this.loginButton = loginForm.getByRole('button', { name: 'Login', exact: true });
    this.loginError = page.getByText('Your email or password is incorrect!', { exact: true });
    this.signupNameInput = signupForm.getByPlaceholder('Name');
    this.signupEmailInput = signupForm.getByPlaceholder('Email Address');
    this.signupButton = signupForm.getByRole('button', { name: 'Signup', exact: true });
  }

  /** Open the signup and login screen directly. */
  async open() {
    this.logger.info('Navigating to the signup and login page');
    await this.page.goto('/login');
  }

  /**
   * Submit the existing-user login form.
   *
   * @param {string} email Account email supplied by the scenario.
   * @param {string} password Account password supplied by the scenario.
   * @returns {Promise<void>} Resolves after the login form is submitted.
   */
  async login(email, password) {
    this.logger.info('Submitting login form');
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginButton.click();
  }

  /** Submit the login form without entering credentials. */
  async submitEmptyLogin() {
    this.logger.info('Submitting the login form without credentials');
    await this.loginButton.click();
  }

  /**
   * Submit the initial signup form to begin registration.
   *
   * @param {string} name Name supplied by the scenario.
   * @param {string} email Email supplied by the scenario.
   * @returns {Promise<void>} Resolves after the signup form is submitted.
   */
  async startSignup(name, email) {
    this.logger.info('Submitting the initial signup form');
    await this.signupNameInput.fill(name);
    await this.signupEmailInput.fill(email);
    await this.signupButton.click();
  }
}
