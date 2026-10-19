/**
 * @typedef {object} RegistrationDetails
 * @property {'Mr.'|'Mrs.'} title Account title.
 * @property {string} password Account password supplied by the scenario.
 * @property {string} birthDay Day of birth as an option value.
 * @property {string} birthMonth Month of birth as an option value.
 * @property {string} birthYear Year of birth as an option value.
 * @property {string} firstName First name for the account address.
 * @property {string} lastName Last name for the account address.
 * @property {string} company Company name.
 * @property {string} address Street address.
 * @property {string} [address2] Optional second address line.
 * @property {string} country Country option value.
 * @property {string} state State or region.
 * @property {string} city City.
 * @property {string} postalCode Postal code.
 * @property {string} mobileNumber Mobile phone number.
 */

/**
 * Page Object for completing the AutomationExercise account registration form.
 */
export default class RegistrationPage {
  /**
   * Keep the scenario Page and registration controls available for form actions.
   *
   * @param {import('playwright').Page} page Scenario page owned by the World.
   * @param {import('winston').Logger} logger Scenario-scoped logger.
   */
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    this.accountInformationHeading = page.getByRole('heading', {
      name: 'Enter Account Information',
      exact: true,
    });
    this.mrRadio = page.getByRole('radio', { name: 'Mr.' });
    this.mrsRadio = page.getByRole('radio', { name: 'Mrs.' });
    this.passwordInput = page.locator('#password');
    this.birthDaySelect = page.locator('#days');
    this.birthMonthSelect = page.locator('#months');
    this.birthYearSelect = page.locator('#years');
    this.firstNameInput = page.locator('#first_name');
    this.lastNameInput = page.locator('#last_name');
    this.companyInput = page.locator('#company');
    this.addressInput = page.locator('#address1');
    this.address2Input = page.locator('#address2');
    this.countrySelect = page.locator('#country');
    this.stateInput = page.locator('#state');
    this.cityInput = page.locator('#city');
    this.postalCodeInput = page.locator('#zipcode');
    this.mobileNumberInput = page.locator('#mobile_number');
    this.createAccountButton = page.getByRole('button', {
      name: 'Create Account',
      exact: true,
    });
  }

  /**
   * Fill and submit the account details form with scenario-provided data.
   *
   * @param {RegistrationDetails} details Account details supplied by the scenario.
   * @returns {Promise<void>} Resolves after the account form is submitted.
   */
  async completeRegistration(details) {
    this.logger.info('Submitting account registration form');
    await (details.title === 'Mr.' ? this.mrRadio : this.mrsRadio).check();
    await this.passwordInput.fill(details.password);
    await this.birthDaySelect.selectOption(details.birthDay);
    await this.birthMonthSelect.selectOption(details.birthMonth);
    await this.birthYearSelect.selectOption(details.birthYear);
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.companyInput.fill(details.company);
    await this.addressInput.fill(details.address);
    if (details.address2) {
      await this.address2Input.fill(details.address2);
    }
    await this.countrySelect.selectOption(details.country);
    await this.stateInput.fill(details.state);
    await this.cityInput.fill(details.city);
    await this.postalCodeInput.fill(details.postalCode);
    await this.mobileNumberInput.fill(details.mobileNumber);
    await this.createAccountButton.click();
  }
}
