import { World } from '@cucumber/cucumber';
import config from '../../config/config.js';
import { createScenarioTestData } from '../../features/data/test-data.js';

/**
 * Stores scenario-scoped Playwright objects and the shared QA configuration.
 * Hooks create the browser objects; step definitions consume them through `this`.
 *
 * @property {import('../../config/config.js').default} config Validated framework configuration.
 * @property {import('playwright').Browser | undefined} browser Scenario browser process.
 * @property {import('playwright').BrowserContext | undefined} context Scenario browser context.
 * @property {import('playwright').Page | undefined} page Scenario browser page.
 * @property {import('../pages/home.page.js').default | undefined} homePage Home page object.
 * @property {import('../pages/login.page.js').default | undefined} loginPage Login page object.
 * @property {import('../pages/products.page.js').default | undefined} productsPage Products page object.
 * @property {import('../pages/product-details.page.js').default | undefined} productDetailsPage Product details page object.
 * @property {import('../pages/cart.page.js').default | undefined} cartPage Cart page object.
 * @property {import('../pages/registration.page.js').default | undefined} registrationPage Registration page object.
 * @property {import('../api/api.client.js').default | undefined} apiClient Optional scenario API client.
 * @property {import('playwright').APIResponse | undefined} apiResponse Most recent response used by an API scenario.
 * @property {import('winston').Logger | undefined} logger Scenario-scoped logger with scenario metadata.
 * @property {ReturnType<typeof createScenarioTestData>} testData Mutable test data owned by this scenario.
 * @property {string | undefined} apiAccountEmail Unique email used by the API account lifecycle scenario.
 * @property {string | undefined} apiAccountPassword Password used by the API account lifecycle scenario.
 * @property {string | undefined} apiAccountName Name used by the API account lifecycle scenario.
 * @property {boolean} apiAccountCreated Whether the API account lifecycle scenario created an account requiring cleanup.
 * @property {boolean} traceStarted Whether scenario tracing is active.
 * @property {boolean} videoRecording Whether this scenario records video.
 * @property {string | undefined} testAccountEmail Unique email used by account-creation scenarios.
 */
export default class CustomWorld extends World {
  /**
   * Create a scenario World with access to the validated QA configuration.
   *
   * @param {import('@cucumber/cucumber').IWorldOptions} options Cucumber World options.
   */
  constructor(options) {
    super(options);
    this.config = config;
    this.testData = createScenarioTestData();
    this.browser = undefined;
    this.context = undefined;
    this.page = undefined;
    this.loginPage = undefined;
    this.homePage = undefined;
    this.productsPage = undefined;
    this.productDetailsPage = undefined;
    this.cartPage = undefined;
    this.registrationPage = undefined;
    this.apiClient = undefined;
    this.apiResponse = undefined;
    this.logger = undefined;
    this.apiAccountEmail = undefined;
    this.apiAccountPassword = undefined;
    this.apiAccountName = undefined;
    this.apiAccountCreated = false;
    this.traceStarted = false;
    this.videoRecording = false;
    this.testAccountEmail = undefined;
  }
}
