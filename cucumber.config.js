/**
 * Cucumber.js loads this file automatically because it is named
 * cucumber.config.js. Keeping the defaults here makes every npm script
 * use the same feature and support-file locations.
 *
 * @type {import('@cucumber/cucumber').IConfiguration}
 */
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import config from './config/config.js';

const parallel = Number(process.env.CUCUMBER_WORKERS ?? 1);
const htmlReportPath = process.env.CUCUMBER_HTML_REPORT ?? 'reports/cucumber/report.html';

if (!Number.isInteger(parallel) || parallel < 1) {
  throw new Error(
    `CUCUMBER_WORKERS must be a positive integer. Received: ${process.env.CUCUMBER_WORKERS}`,
  );
}

mkdirSync(path.dirname(htmlReportPath), { recursive: true });
rmSync('allure-results', { recursive: true, force: true });
mkdirSync('allure-results', { recursive: true });

export default {
  paths: ['features/**/*.feature'],
  import: ['features/**/*.js', 'examples/**/*.js', 'src/support/hooks.js'],
  format: ['progress', `html:${htmlReportPath}`, 'allure-cucumberjs/reporter'],
  parallel,
  retry: config.retry.cucumber,
  publishQuiet: true,
};
