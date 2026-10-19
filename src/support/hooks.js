import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  Status,
  setDefaultTimeout,
  setWorldConstructor,
} from '@cucumber/cucumber';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import config from '../../config/config.js';
import ApiClient from '../api/api.client.js';
import apiEndpoints from '../api/api-endpoints.json' with { type: 'json' };
import CartPage from '../pages/cart.page.js';
import HomePage from '../pages/home.page.js';
import LoginPage from '../pages/login.page.js';
import ProductDetailsPage from '../pages/product-details.page.js';
import ProductsPage from '../pages/products.page.js';
import RegistrationPage from '../pages/registration.page.js';
import logger, { getScenarioLogExcerpt } from '../../utils/logger.js';
import CustomWorld from './world.js';

setWorldConstructor(CustomWorld);
setDefaultTimeout(config.timeouts.navigation);

const browsers = { chromium, firefox, webkit };

BeforeAll(function () {
  logger.info('Cucumber worker execution started');
});

AfterAll(function () {
  logger.info('Cucumber worker execution completed');
});

/**
 * Create a fresh browser context for every scenario using the central config.
 *
 * @returns {Promise<void>} Resolves when the scenario page is ready.
 */
Before(async function ({ pickle }) {
  const tags = pickle.tags.map(({ name }) => name);
  this.logger = logger.child({
    scenario: pickle.name,
    tags,
    browser: this.config.browser.name,
  });
  this.logger.info('Scenario started');
  this.logger.info('Selected browser');
  this.logger.debug('Scenario tags', { tags });

  const browserType = browsers[this.config.browser.name];

  this.browser = await browserType.launch({
    headless: this.config.browser.headless,
    slowMo: this.config.browser.slowMo,
  });
  await this.attach(`Browser: ${this.config.browser.name}`, 'text/plain');

  this.videoRecording = this.config.artifacts.video !== 'off';
  if (this.videoRecording) {
    await mkdir('reports/videos', { recursive: true });
    this.logger.info('Scenario video recording enabled', {
      mode: this.config.artifacts.video,
    });
  }

  this.context = await this.browser.newContext({
    baseURL: this.config.ui.baseUrl,
    ...(this.videoRecording
      ? { recordVideo: { dir: 'reports/videos', size: { width: 1280, height: 720 } } }
      : {}),
  });
  await this.context.route(
    /https?:\/\/(?:pagead\d*\.googlesyndication\.com|googleads\.g\.doubleclick\.net)\//,
    (route) => route.abort(),
  );
  this.context.setDefaultTimeout(this.config.timeouts.action);
  this.context.setDefaultNavigationTimeout(this.config.timeouts.navigation);
  this.page = await this.context.newPage();
  this.logger.info('Scenario browser context and page created');

  // Page Objects wrap the same scenario Page and do not create browser state.
  this.loginPage = new LoginPage(this.page, this.logger);
  this.homePage = new HomePage(this.page, this.config.ui.baseUrl, this.logger);
  this.productsPage = new ProductsPage(this.page, this.logger);
  this.productDetailsPage = new ProductDetailsPage(this.page, this.logger);
  this.cartPage = new CartPage(this.page, this.logger);
  this.registrationPage = new RegistrationPage(this.page, this.logger);

  const needsApiClient = tags.some((name) => ['@api', '@integration'].includes(name));
  if (needsApiClient) {
    this.apiClient = new ApiClient(this.context.request, this.config.api.baseUrl, this.logger);
  }

  if (this.config.artifacts.trace !== 'off') {
    await this.context.tracing.start({ screenshots: true, snapshots: true });
    this.traceStarted = true;
    this.logger.info('Scenario trace collection enabled', {
      mode: this.config.artifacts.trace,
    });
  }
});

/**
 * Capture configured failure evidence, then close scenario resources.
 *
 * @returns {Promise<void>} Resolves after cleanup completes.
 */
After(async function ({ pickle, result, willBeRetried }) {
  const failed = result?.status === Status.FAILED;
  const scenarioLogger = this.logger ?? logger;
  const video = this.videoRecording ? this.page?.video() : undefined;
  const shouldCaptureScreenshot =
    this.config.artifacts.screenshot === 'on' ||
    (failed && this.config.artifacts.screenshot === 'only-on-failure');
  const cleanupErrors = [];

  if (failed && willBeRetried) {
    scenarioLogger.warn('Scenario attempt failed and will be retried', {
      status: result?.status,
    });
  } else if (failed) {
    scenarioLogger.error('Scenario failed', { status: result?.status });
  }

  if (failed && willBeRetried) {
    try {
      await this.attach('This failed scenario attempt will be retried by Cucumber.', 'text/plain');
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  if (shouldCaptureScreenshot && this.page) {
    try {
      await mkdir('reports/screenshots', { recursive: true });
      const screenshotPath = `reports/screenshots/screenshot-${randomUUID()}.png`;
      const screenshot = await this.page.screenshot({ path: screenshotPath, fullPage: true });
      await this.attach(screenshot, 'image/png');
      scenarioLogger.info('Scenario screenshot captured', { path: screenshotPath });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  if (this.context && this.traceStarted) {
    try {
      const shouldSaveTrace =
        this.config.artifacts.trace === 'on' ||
        (failed && this.config.artifacts.trace === 'retain-on-failure');
      if (shouldSaveTrace) {
        await mkdir('reports/traces', { recursive: true });
        const tracePath = `reports/traces/trace-${randomUUID()}.zip`;
        await this.context.tracing.stop({ path: tracePath });
        scenarioLogger.info('Scenario trace saved', { path: tracePath });
      } else {
        await this.context.tracing.stop();
        scenarioLogger.debug('Scenario trace discarded after successful completion');
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  // Remove a disposable account if a scenario failed before its delete step.
  // Keep cleanup visible as a hook failure instead of silently leaving data behind.
  if (this.apiAccountCreated) {
    try {
      const cleanupResponse = await this.apiClient.delete(apiEndpoints.deleteAccount, {
        form: {
          email: this.apiAccountEmail,
          password: this.apiAccountPassword,
        },
      });
      this.apiClient.assertStatus(cleanupResponse, 200);
      const cleanupBody = await this.apiClient.getJson(cleanupResponse);
      this.apiClient.assertResponseCode(cleanupBody, 200);
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  if (failed) {
    try {
      await this.attach(getScenarioLogExcerpt(pickle.name), 'text/plain');
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  try {
    await this.context?.close();
  } catch (error) {
    cleanupErrors.push(error);
  }

  if (video) {
    try {
      const videoPath = await video.path();
      const shouldKeepVideo = this.config.artifacts.video === 'on' || failed;

      if (shouldKeepVideo) {
        await this.attach(await readFile(videoPath), 'video/webm');
        scenarioLogger.info('Scenario video saved', { path: videoPath });
      } else {
        await unlink(videoPath);
        scenarioLogger.debug('Scenario video discarded after successful completion');
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  try {
    await this.browser?.close();
  } catch (error) {
    cleanupErrors.push(error);
  } finally {
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

  if (cleanupErrors.length > 0) {
    scenarioLogger.error('Scenario cleanup failed', {
      errors: cleanupErrors.map((error) => error?.name ?? 'Error'),
    });
    throw new AggregateError(cleanupErrors, 'Scenario cleanup failed.');
  }

  if (!failed) {
    scenarioLogger.info('Scenario completed successfully');
  }
});
