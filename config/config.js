import 'dotenv/config';

const DEFAULT_UI_BASE_URL = 'https://automationexercise.com';
const DEFAULT_API_BASE_URL = 'https://automationexercise.com/api';
const SUPPORTED_BROWSERS = ['chromium', 'firefox', 'webkit'];

/**
 * Read a string environment variable, or use a default when it is absent.
 *
 * @param {string} name Environment variable name.
 * @param {string} defaultValue Value used when the variable is not set.
 * @returns {string} The configured string value.
 */
function readString(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}

/**
 * Read a boolean environment variable using explicit values only.
 *
 * @param {string} name Environment variable name.
 * @param {boolean} defaultValue Value used when the variable is not set.
 * @returns {boolean} The configured boolean value.
 */
function readBoolean(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} must be either true or false. Received: ${value}`);
}

/**
 * Read a non-negative integer environment variable.
 *
 * @param {string} name Environment variable name.
 * @param {number} defaultValue Value used when the variable is not set.
 * @returns {number} The configured integer value.
 */
function readNonNegativeInteger(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${name} must be a non-negative integer. Received: ${value}`);
  }

  return parsedValue;
}

/**
 * Validate a URL configuration value.
 *
 * @param {string} name Configuration property name.
 * @param {string} value URL value to validate.
 * @returns {void}
 */
function validateUrl(name, value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL. Received: ${value}`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must use http or https. Received: ${value}`);
  }
}

/**
 * Validate the complete configuration before tests start.
 *
 * @param {Configuration} configuration QA configuration to validate.
 * @returns {Configuration} The validated configuration.
 */
export function validateConfig(configuration) {
  validateUrl('ui.baseUrl', configuration.ui.baseUrl);
  validateUrl('api.baseUrl', configuration.api.baseUrl);

  if (!SUPPORTED_BROWSERS.includes(configuration.browser.name)) {
    throw new Error(
      `BROWSER must be one of ${SUPPORTED_BROWSERS.join(', ')}. Received: ${configuration.browser.name}`,
    );
  }

  if (!['on', 'off', 'only-on-failure'].includes(configuration.artifacts.screenshot)) {
    throw new Error(
      `artifacts.screenshot must be on, off, or only-on-failure. Received: ${configuration.artifacts.screenshot}`,
    );
  }

  if (!['on', 'off', 'retain-on-failure'].includes(configuration.artifacts.trace)) {
    throw new Error(
      `artifacts.trace must be on, off, or retain-on-failure. Received: ${configuration.artifacts.trace}`,
    );
  }

  if (!['on', 'off', 'retain-on-failure'].includes(configuration.artifacts.video)) {
    throw new Error(
      `artifacts.video must be on, off, or retain-on-failure. Received: ${configuration.artifacts.video}`,
    );
  }

  return configuration;
}

/**
 * Central QA configuration for local runs and GitHub Actions.
 * Environment variables override defaults without introducing another environment.
 *
 * @typedef {object} Configuration
 * @property {object} ui UI application settings.
 * @property {string} ui.baseUrl UI base URL.
 * @property {object} api API application settings.
 * @property {string} api.baseUrl API base URL.
 * @property {object} browser Browser launch settings.
 * @property {string} browser.name Browser engine name.
 * @property {boolean} browser.headless Whether the browser is headless.
 * @property {number} browser.slowMo Delay in milliseconds between browser actions.
 * @property {object} timeouts Default Playwright timeout values in milliseconds.
 * @property {number} timeouts.action Default action timeout.
 * @property {number} timeouts.navigation Default navigation timeout.
 * @property {number} timeouts.expect Default assertion timeout.
 * @property {object} retry Test retry settings.
 * @property {number} retry.cucumber Number of Cucumber retries.
 * @property {object} logging Logging settings.
 * @property {string} logging.level Minimum Winston log level.
 * @property {object} artifacts Failure evidence settings.
 * @property {string} artifacts.screenshot Screenshot policy.
 * @property {string} artifacts.trace Trace policy.
 * @property {string} artifacts.video Video policy.
 * @property {boolean} isCi Whether the run is executing in GitHub Actions.
 */
const config = validateConfig({
  ui: {
    baseUrl: readString('UI_BASE_URL', DEFAULT_UI_BASE_URL),
  },
  api: {
    baseUrl: readString('API_BASE_URL', DEFAULT_API_BASE_URL),
  },
  browser: {
    name: readString('BROWSER', 'chromium'),
    headless: readBoolean('HEADLESS', true),
    slowMo: readNonNegativeInteger('SLOW_MO', 0),
  },
  timeouts: {
    action: readNonNegativeInteger('ACTION_TIMEOUT', 10_000),
    navigation: readNonNegativeInteger('NAVIGATION_TIMEOUT', 30_000),
    expect: readNonNegativeInteger('EXPECT_TIMEOUT', 10_000),
  },
  retry: {
    cucumber: readNonNegativeInteger('CUCUMBER_RETRIES', 0),
  },
  logging: {
    level: readString('LOG_LEVEL', 'INFO').toUpperCase(),
  },
  artifacts: {
    screenshot: readString('SCREENSHOT_MODE', 'only-on-failure'),
    trace: readString('TRACE_MODE', 'retain-on-failure'),
    video: readString('VIDEO_MODE', 'off'),
  },
  isCi: process.env.GITHUB_ACTIONS === 'true',
});

export default config;
